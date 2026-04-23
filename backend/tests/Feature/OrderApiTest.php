<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Branch;
use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $cashier;
    protected Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();
        $this->branch = Branch::factory()->create();
        $this->cashier = User::factory()->create([
            'role' => 'cashier',
            'status' => 'ACTIVE',
            'branch_id' => $this->branch->id,
        ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_place_an_order(): void
    {
        $item = MenuItem::factory()->create([
            'price' => 100,
            'quantity' => 10
        ]);

        $payload = [
            'si_number' => 'SI-12345',
            'branch_id' => $this->branch->id,
            'items' => [
                [
                    'menu_item_id' => $item->id,
                    'name' => $item->name,
                    'quantity' => 2,
                    'unit_price' => 100,
                    'total_price' => 200,
                ]
            ],
            'subtotal' => 200,
            'total' => 200,
            'vatable_sales' => 178.57,
            'vat_amount' => 21.43,
            'payment_method' => 'CASH',
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
                         ->postJson('/api/sales', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('status', 'success');
        
        $this->assertDatabaseHas('sales', [
            'invoice_number' => 'SI-12345',
            'branch_id' => $this->branch->id,
            'total_amount' => 200,
        ]);

        // Verify inventory deduction
        $this->assertEquals(8, $item->fresh()->quantity);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_cancel_an_order(): void
    {
        $item = MenuItem::factory()->create(['quantity' => 10]);
        
        // Create a sale manually or via factory if available
        $sale = \App\Models\Sale::create([
            'invoice_number' => 'SI-999',
            'branch_id' => $this->branch->id,
            'user_id' => $this->cashier->id,
            'total_amount' => 100,
            'status' => 'completed',
            'vatable_sales' => 89.29,
            'vat_amount' => 10.71,
        ]);

        \App\Models\SaleItem::factory()->create([
            'sale_id' => $sale->id,
            'menu_item_id' => $item->id,
            'product_name' => $item->name,
            'quantity' => 1,
            'unit_price' => 100,
            'price' => 100,
            'final_price' => 100,
        ]);
        
        // Deduct quantity manually to simulate prior sale
        $item->decrement('quantity', 1);

        $response = $this->actingAs($this->cashier, 'sanctum')
                         ->patchJson("/api/sales/{$sale->id}/cancel", [
                             'reason' => 'Customer changed mind'
                         ]);

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $sale->fresh()->status);
        
        // Verify inventory restoration
        $this->assertEquals(10, $item->fresh()->quantity);
    }
}

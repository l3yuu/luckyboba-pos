<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BranchSalesSeeder extends Seeder
{
    public function run(): void
    {
        // ── Get all branches ────────────────────────────────────────────────
        $branches = DB::table('branches')->get();

        if ($branches->isEmpty()) {
            $this->command->warn('No branches found. Please seed branches first.');
            return;
        }

        // ── Get a valid user to attach to sales ─────────────────────────────
        $user = DB::table('users')->where('status', 'ACTIVE')->first();
        $userId = $user?->id ?? null;

        $paymentMethods = ['cash', 'gcash', 'maya', 'card'];
        $statuses       = ['completed', 'completed', 'completed', 'cancelled']; // weight towards completed
        $invoiceCounter = 1;

        foreach ($branches as $branch) {
            $this->command->info("Seeding sales for branch: {$branch->name}");

            $totalSales = 0;
            $todaySales = 0;
            $today      = Carbon::today();

            // ── Generate 60 days of sales data ──────────────────────────────
            for ($daysAgo = 59; $daysAgo >= 0; $daysAgo--) {
                $date           = Carbon::today()->subDays($daysAgo);
                $salesPerDay    = rand(5, 20);

                for ($s = 0; $s < $salesPerDay; $s++) {
                    $status      = $statuses[array_rand($statuses)];
                    $amount      = round(rand(50, 800) + (rand(0, 99) / 100), 2);
                    $invoiceNum  = 'LB-' . $date->format('Ymd') . '-' . str_pad($invoiceCounter++, 4, '0', STR_PAD_LEFT);
                    $createdAt   = $date->copy()->addHours(rand(8, 21))->addMinutes(rand(0, 59));

                    DB::table('sales')->insert([
                        'user_id'        => $userId,
                        'branch_id'      => $branch->id,
                        'invoice_number' => $invoiceNum,
                        'total_amount'   => $status === 'cancelled' ? 0 : $amount,
                        'status'         => $status,
                        'payment_method' => $paymentMethods[array_rand($paymentMethods)],
                        'charge_type'    => null,
                        'pax'            => rand(1, 6),
                        'is_synced'      => 1,
                        'created_at'     => $createdAt,
                        'updated_at'     => $createdAt,
                    ]);

                    if ($status === 'completed') {
                        $totalSales += $amount;
                        if ($date->isToday()) {
                            $todaySales += $amount;
                        }
                    }
                }
            }

            // ── Update branch totals ─────────────────────────────────────────
            DB::table('branches')->where('id', $branch->id)->update([
                'total_sales' => round($totalSales, 2),
                'today_sales' => round($todaySales, 2),
                'updated_at'  => Carbon::now(),
            ]);

            $this->command->info("  → Total: ₱" . number_format($totalSales, 2) . " | Today: ₱" . number_format($todaySales, 2));
        }

        $this->command->info('✓ Branch sales seeded successfully!');
    }
}
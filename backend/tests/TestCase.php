<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Branch;
use Illuminate\Foundation\Testing\WithoutMiddleware;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase; // Add this if not already present
    
    // If you want to disable CSRF globally for all tests:
    // use WithoutMiddleware; 
    
    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeaders([
            'Accept' => 'application/json',
            'X-Requested-With' => 'XMLHttpRequest',
        ]);

        // Create a default branch for all tests
        Branch::create([
            'name' => 'Lucky Boba - SM City',
            'location' => 'SM City Mall',
            'status' => 'active',
        ]);
    }
}
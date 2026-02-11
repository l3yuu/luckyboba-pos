<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
// ADD THIS LINE
use Illuminate\Foundation\Testing\WithoutMiddleware;

abstract class TestCase extends BaseTestCase
{
    // If you want to disable CSRF globally for all tests:
    // use WithoutMiddleware; 
    
    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeaders([
            'Accept' => 'application/json',
            'X-Requested-With' => 'XMLHttpRequest',
        ]);
    }
}

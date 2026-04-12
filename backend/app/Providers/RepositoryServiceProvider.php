<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\SaleRepositoryInterface;
use App\Repositories\SaleRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(SaleRepositoryInterface::class, SaleRepository::class);
        $this->app->bind(\App\Repositories\ReportRepositoryInterface::class, \App\Repositories\ReportRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}

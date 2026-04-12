<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\SaleRepositoryInterface;
use App\Repositories\SaleRepository;
use App\Repositories\ReportRepositoryInterface;
use App\Repositories\ReportRepository;
use App\Repositories\InventoryRepositoryInterface;
use App\Repositories\InventoryRepository;
use App\Repositories\UserRepositoryInterface;
use App\Repositories\UserRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(SaleRepositoryInterface::class, SaleRepository::class);
        $this->app->bind(ReportRepositoryInterface::class, ReportRepository::class);
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(InventoryRepositoryInterface::class, InventoryRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}

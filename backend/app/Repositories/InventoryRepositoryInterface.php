<?php

namespace App\Repositories;

use Illuminate\Support\Collection;

interface InventoryRepositoryInterface
{
    /**
     * Get an overview of inventory metrics (total items, low stock, out of stock, pending POs).
     */
    public function getOverview(array $filters = []): array;

    /**
     * Get low stock alerts.
     */
    public function getAlerts(array $filters = []): Collection;

    /**
     * Generate usage reports.
     */
    public function getUsageReport(string $period, array $filters = []): Collection;

    /**
     * Get detailed breakdown of stock deductions by menu item/recipe for a material.
     */
    public function getUsageBreakdown(int $rawMaterialId, string $period, array $filters = []): Collection;

    /**
     * Update stock quantity for a menu item.
     */
    public function updateStock(int $menuItemId, int $quantityChange): array;

    /**
     * Check stock by barcode.
     */
    public function checkByBarcode(string $barcode);

    /**
     * Get transaction history for inventory items.
     */
    public function getTransactionHistory(): Collection;

    public function getProductSalesSummary(string $period, array $filters = []): Collection;

    public function getMaterialSoldSummary(string $period, array $filters = []): Collection;
}

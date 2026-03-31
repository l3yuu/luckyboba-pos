<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PointsSystemSeeder extends Seeder
{
    public function run(): void
    {
        if (!$this->tableExists('user_points')) {
            DB::statement('
                CREATE TABLE user_points (
                    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    user_id    BIGINT UNSIGNED NOT NULL,
                    points     INT UNSIGNED DEFAULT 0,
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL,
                    UNIQUE KEY unique_user (user_id)
                )
            ');
            $this->command->info("✅ Created table: user_points");
        }

        if (!$this->tableExists('point_transactions')) {
            DB::statement('
                CREATE TABLE point_transactions (
                    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    user_id      BIGINT UNSIGNED NOT NULL,
                    type         ENUM("earn","redeem") NOT NULL,
                    points       INT UNSIGNED NOT NULL,
                    source       VARCHAR(100) NULL,
                    reference_id BIGINT UNSIGNED NULL,
                    note         VARCHAR(255) NULL,
                    created_at   TIMESTAMP NULL,
                    INDEX idx_user_id (user_id),
                    INDEX idx_type (type)
                )
            ');
            $this->command->info("✅ Created table: point_transactions");
        }

        $orders = DB::table('sales')
            ->whereNotNull('user_id')
            ->whereNotIn('status', ['cancelled'])
            ->select('id', 'user_id', 'total_amount', 'created_at')
            ->get();

        $pointsMap = [];

        foreach ($orders as $order) {
            $pts = (int) floor($order->total_amount);
            if (!isset($pointsMap[$order->user_id])) {
                $pointsMap[$order->user_id] = 0;
            }
            $pointsMap[$order->user_id] += $pts;

            DB::table('point_transactions')->insert([
                'user_id'      => $order->user_id,
                'type'         => 'earn',
                'points'       => $pts,
                'source'       => 'order',
                'reference_id' => $order->id,
                'note'         => 'Seeded from existing order #' . $order->id,
                'created_at'   => $order->created_at,
            ]);
        }

        foreach ($pointsMap as $userId => $total) {
            DB::table('user_points')->updateOrInsert(
                ['user_id' => $userId],
                ['points'  => $total, 'created_at' => now(), 'updated_at' => now()]
            );
        }

        $this->command->info('✅ Done. Seeded points for ' . count($pointsMap) . ' users.');
    }

    private function tableExists(string $table): bool
    {
        return DB::select("SHOW TABLES LIKE '$table'") !== [];
    }
}

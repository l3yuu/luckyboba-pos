<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'sqlite') {
            return;
        }

        // Drop existing views
        DB::statement('DROP VIEW IF EXISTS daily_sales_by_branch');
        DB::statement('DROP VIEW IF EXISTS branch_performance');
        DB::statement('DROP VIEW IF EXISTS today_sales_by_branch');

        // 1. today_sales_by_branch (Added whereNull('b.deleted_at'))
        DB::statement("
            CREATE VIEW today_sales_by_branch AS
            SELECT 
                b.id AS branch_id,
                b.name AS branch_name,
                b.location,
                b.status,
                COUNT(s.id) AS transactions_today,
                COALESCE(SUM(s.total_amount), 0) AS sales_today
            FROM branches b
            LEFT JOIN sales s ON b.id = s.branch_id 
                AND DATE(s.created_at) = CURDATE()
            WHERE b.deleted_at IS NULL
            GROUP BY b.id, b.name, b.location, b.status
            ORDER BY sales_today DESC
        ");

        // 2. branch_performance (Added whereNull('b.deleted_at'))
        DB::statement("
            CREATE VIEW branch_performance AS
            SELECT 
                b.id AS branch_id,
                b.name AS branch_name,
                b.location,
                b.status,
                b.total_sales,
                b.today_sales,
                COUNT(DISTINCT DATE(s.created_at)) AS days_active,
                COUNT(s.id) AS total_transactions,
                COALESCE(AVG(s.total_amount), 0) AS avg_transaction_value,
                COALESCE(b.total_sales / NULLIF(COUNT(DISTINCT DATE(s.created_at)), 0), 0) AS avg_daily_sales
            FROM branches b
            LEFT JOIN sales s ON b.id = s.branch_id
            WHERE b.deleted_at IS NULL
            GROUP BY b.id, b.name, b.location, b.status, b.total_sales, b.today_sales
            ORDER BY b.total_sales DESC
        ");

        // 3. daily_sales_by_branch (Added whereNull('b.deleted_at'))
        DB::statement("
            CREATE VIEW daily_sales_by_branch AS
            SELECT 
                b.id AS branch_id,
                b.name AS branch_name,
                b.location,
                DATE(s.created_at) AS sale_date,
                COUNT(s.id) AS total_transactions,
                SUM(s.total_amount) AS total_sales,
                AVG(s.total_amount) AS average_transaction
            FROM branches b
            INNER JOIN sales s ON b.id = s.branch_id
            WHERE b.deleted_at IS NULL
            GROUP BY b.id, b.name, b.location, DATE(s.created_at)
            ORDER BY sale_date DESC, total_sales DESC
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'sqlite') return;

        DB::statement('DROP VIEW IF EXISTS daily_sales_by_branch');
        DB::statement('DROP VIEW IF EXISTS branch_performance');
        DB::statement('DROP VIEW IF EXISTS today_sales_by_branch');

        // Restore original views without deleted_at check
        DB::statement("
            CREATE VIEW today_sales_by_branch AS
            SELECT 
                b.id AS branch_id,
                b.name AS branch_name,
                b.location,
                b.status,
                COUNT(s.id) AS transactions_today,
                COALESCE(SUM(s.total_amount), 0) AS sales_today
            FROM branches b
            LEFT JOIN sales s ON b.id = s.branch_id 
                AND DATE(s.created_at) = CURDATE()
            GROUP BY b.id, b.name, b.location, b.status
            ORDER BY sales_today DESC
        ");

        DB::statement("
            CREATE VIEW branch_performance AS
            SELECT 
                b.id AS branch_id,
                b.name AS branch_name,
                b.location,
                b.status,
                b.total_sales,
                b.today_sales,
                COUNT(DISTINCT DATE(s.created_at)) AS days_active,
                COUNT(s.id) AS total_transactions,
                COALESCE(AVG(s.total_amount), 0) AS avg_transaction_value,
                COALESCE(b.total_sales / NULLIF(COUNT(DISTINCT DATE(s.created_at)), 0), 0) AS avg_daily_sales
            FROM branches b
            LEFT JOIN sales s ON b.id = s.branch_id
            GROUP BY b.id, b.name, b.location, b.status, b.total_sales, b.today_sales
            ORDER BY b.total_sales DESC
        ");

        DB::statement("
            CREATE VIEW daily_sales_by_branch AS
            SELECT 
                b.id AS branch_id,
                b.name AS branch_name,
                b.location,
                DATE(s.created_at) AS sale_date,
                COUNT(s.id) AS total_transactions,
                SUM(s.total_amount) AS total_sales,
                AVG(s.total_amount) AS average_transaction
            FROM branches b
            INNER JOIN sales s ON b.id = s.branch_id
            GROUP BY b.id, b.name, b.location, DATE(s.created_at)
            ORDER BY sale_date DESC, total_sales DESC
        ");
    }
};

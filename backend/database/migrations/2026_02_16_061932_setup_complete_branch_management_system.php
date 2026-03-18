<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Complete Lucky Boba Branch Management System Setup
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        // Skip complex MySQL-specific features for SQLite (tests)
        if ($driver === 'sqlite') {
            $this->setupForSqlite();
            return;
        }

        // MySQL setup (production)
        $this->setupForMysql();
    }

    /**
     * Setup for SQLite (Testing)
     */
    private function setupForSqlite(): void
    {
        // =====================================================
        // STEP 1: CREATE BRANCHES TABLE
        // =====================================================
        if (!Schema::hasTable('branches')) {
            Schema::create('branches', function (Blueprint $table) {
                $table->id();
                $table->string('name', 255);
                $table->string('location', 255);
                $table->string('status')->default('active');
                $table->decimal('total_sales', 10, 2)->default(0.00);
                $table->decimal('today_sales', 10, 2)->default(0.00);
                $table->timestamps();
                
                $table->index('status');
                $table->index('name');
            });
        }

        // =====================================================
        // STEP 2: INSERT BRANCHES ONLY IF TABLE IS EMPTY
        // =====================================================
        if (DB::table('branches')->count() === 0) {
            DB::table('branches')->insert([
                [
                    'name' => 'Lucky Boba - SM City',
                    'location' => 'SM City Cebu',
                    'status' => 'active',
                    'total_sales' => 0.00,
                    'today_sales' => 0.00,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
            ]);
        }

        // =====================================================
        // STEP 3: ADD BRANCH_ID TO SALES TABLE (SAFELY)
        // =====================================================
        if (Schema::hasTable('sales') && !Schema::hasColumn('sales', 'branch_id')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('id');
                $table->foreign('branch_id')->references('id')->on('branches')->onDelete('set null');
                $table->index('branch_id');
            });
        }

        // =====================================================
        // STEP 4: ASSIGN EXISTING SALES TO BRANCHES
        // =====================================================
        if (Schema::hasTable('sales')) {
            $branchCount = DB::table('branches')->count();
            if ($branchCount > 0) {
                $firstBranchId = DB::table('branches')->first()->id;
                
                DB::table('sales')
                    ->whereNull('branch_id')
                    ->update(['branch_id' => $firstBranchId]);
            }
        }
    }

    /**
     * Setup for MySQL (Production)
     */
    private function setupForMysql(): void
    {
        // =====================================================
        // STEP 1: SAFETY - DROP TRIGGERS FIRST
        // =====================================================
        DB::unprepared('DROP TRIGGER IF EXISTS after_sale_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS after_sale_update');
        DB::unprepared('DROP TRIGGER IF EXISTS after_sale_delete');

        // =====================================================
        // STEP 2: SAFETY - REMOVE FOREIGN KEY IF EXISTS
        // =====================================================
        if ($this->foreignKeyExists('sales', 'fk_sales_branch_id')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropForeign('fk_sales_branch_id');
            });
        }

        // =====================================================
        // STEP 3: CREATE BRANCHES TABLE
        // =====================================================
        if (!Schema::hasTable('branches')) {
            Schema::create('branches', function (Blueprint $table) {
                $table->id();
                $table->string('name', 255);
                $table->string('location', 255);
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->decimal('total_sales', 10, 2)->default(0.00);
                $table->decimal('today_sales', 10, 2)->default(0.00);
                $table->timestamps();
                
                // Indexes
                $table->index('status', 'idx_status');
                $table->index('name', 'idx_name');
            });
        }

        // =====================================================
        // STEP 4: INSERT BRANCHES ONLY IF TABLE IS EMPTY
        // =====================================================
        if (DB::table('branches')->count() === 0) {
            DB::table('branches')->insert([
                [
                    'name' => 'Vipra Sangandaan',
                    'location' => 'Vipra',
                    'status' => 'active',
                    'total_sales' => 0.00,
                    'today_sales' => 0.00,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'name' => 'Ayala',
                    'location' => 'Ayala Center',
                    'status' => 'active',
                    'total_sales' => 0.00,
                    'today_sales' => 0.00,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
            ]);
        }

        // =====================================================
        // STEP 5: ADD BRANCH_ID TO SALES TABLE (SAFELY)
        // =====================================================
        if (!Schema::hasColumn('sales', 'branch_id')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('id');
                $table->index('branch_id', 'idx_branch_id');
            });
        }

        // =====================================================
        // STEP 6: ASSIGN EXISTING SALES TO BRANCHES
        // =====================================================
        $branchCount = DB::table('branches')->count();
        if ($branchCount > 0) {
            $branchIds = DB::table('branches')->pluck('id')->toArray();
            
            DB::table('sales')
                ->whereNull('branch_id')
                ->chunkById(100, function ($sales) use ($branchIds) {
                    foreach ($sales as $sale) {
                        DB::table('sales')
                            ->where('id', $sale->id)
                            ->update([
                                'branch_id' => $branchIds[array_rand($branchIds)]
                            ]);
                    }
                });
        }

        // =====================================================
        // STEP 7: ADD FOREIGN KEY (AFTER DATA IS LINKED)
        // =====================================================
        if (!$this->foreignKeyExists('sales', 'fk_sales_branch_id')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->foreign('branch_id', 'fk_sales_branch_id')
                      ->references('id')
                      ->on('branches')
                      ->onDelete('set null');
            });
        }

        // =====================================================
        // STEP 8: CREATE TRIGGERS
        // =====================================================
        DB::unprepared("
            CREATE TRIGGER after_sale_insert
            AFTER INSERT ON sales
            FOR EACH ROW
            BEGIN
                IF NEW.branch_id IS NOT NULL THEN
                    UPDATE branches 
                    SET 
                        total_sales = (
                            SELECT COALESCE(SUM(total_amount), 0) 
                            FROM sales 
                            WHERE branch_id = NEW.branch_id
                        ),
                        today_sales = (
                            SELECT COALESCE(SUM(total_amount), 0) 
                            FROM sales 
                            WHERE branch_id = NEW.branch_id 
                                AND DATE(created_at) = CURDATE()
                        ),
                        updated_at = NOW()
                    WHERE id = NEW.branch_id;
                END IF;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER after_sale_update
            AFTER UPDATE ON sales
            FOR EACH ROW
            BEGIN
                IF NEW.branch_id IS NOT NULL THEN
                    UPDATE branches 
                    SET 
                        total_sales = (
                            SELECT COALESCE(SUM(total_amount), 0) 
                            FROM sales 
                            WHERE branch_id = NEW.branch_id
                        ),
                        today_sales = (
                            SELECT COALESCE(SUM(total_amount), 0) 
                            FROM sales 
                            WHERE branch_id = NEW.branch_id 
                                AND DATE(created_at) = CURDATE()
                        ),
                        updated_at = NOW()
                    WHERE id = NEW.branch_id;
                END IF;
                
                IF OLD.branch_id IS NOT NULL AND (NEW.branch_id IS NULL OR OLD.branch_id != NEW.branch_id) THEN
                    UPDATE branches 
                    SET 
                        total_sales = (
                            SELECT COALESCE(SUM(total_amount), 0) 
                            FROM sales 
                            WHERE branch_id = OLD.branch_id
                        ),
                        today_sales = (
                            SELECT COALESCE(SUM(total_amount), 0) 
                            FROM sales 
                            WHERE branch_id = OLD.branch_id 
                                AND DATE(created_at) = CURDATE()
                        ),
                        updated_at = NOW()
                    WHERE id = OLD.branch_id;
                END IF;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER after_sale_delete
            AFTER DELETE ON sales
            FOR EACH ROW
            BEGIN
                IF OLD.branch_id IS NOT NULL THEN
                    UPDATE branches 
                    SET 
                        total_sales = (
                            SELECT COALESCE(SUM(total_amount), 0) 
                            FROM sales 
                            WHERE branch_id = OLD.branch_id
                        ),
                        today_sales = (
                            SELECT COALESCE(SUM(total_amount), 0) 
                            FROM sales 
                            WHERE branch_id = OLD.branch_id 
                                AND DATE(created_at) = CURDATE()
                        ),
                        updated_at = NOW()
                    WHERE id = OLD.branch_id;
                END IF;
            END
        ");

        // =====================================================
        // STEP 9: CREATE STORED PROCEDURE
        // =====================================================
        DB::unprepared('DROP PROCEDURE IF EXISTS update_branch_totals');
        
        DB::unprepared("
            CREATE PROCEDURE update_branch_totals(IN p_branch_id BIGINT)
            BEGIN
                UPDATE branches 
                SET 
                    total_sales = (
                        SELECT COALESCE(SUM(total_amount), 0) 
                        FROM sales 
                        WHERE branch_id = p_branch_id
                    ),
                    today_sales = (
                        SELECT COALESCE(SUM(total_amount), 0) 
                        FROM sales 
                        WHERE branch_id = p_branch_id 
                            AND DATE(created_at) = CURDATE()
                    ),
                    updated_at = NOW()
                WHERE id = p_branch_id;
            END
        ");

        // =====================================================
        // STEP 10: CREATE VIEWS
        // =====================================================
        DB::statement('DROP VIEW IF EXISTS daily_sales_by_branch');
        DB::statement('DROP VIEW IF EXISTS branch_performance');
        DB::statement('DROP VIEW IF EXISTS today_sales_by_branch');

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

        // =====================================================
        // STEP 11: CALCULATE INITIAL BRANCH TOTALS
        // =====================================================
        for ($i = 1; $i <= 5; $i++) {
            DB::statement('CALL update_branch_totals(?)', [$i]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'mysql') {
            // Drop triggers
            DB::unprepared('DROP TRIGGER IF EXISTS after_sale_insert');
            DB::unprepared('DROP TRIGGER IF EXISTS after_sale_update');
            DB::unprepared('DROP TRIGGER IF EXISTS after_sale_delete');

            // Drop stored procedure
            DB::unprepared('DROP PROCEDURE IF EXISTS update_branch_totals');

            // Drop views
            DB::statement('DROP VIEW IF EXISTS daily_sales_by_branch');
            DB::statement('DROP VIEW IF EXISTS branch_performance');
            DB::statement('DROP VIEW IF EXISTS today_sales_by_branch');
        }

        // Remove foreign key and column from sales
        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) use ($driver) {
                if ($driver === 'mysql' && $this->foreignKeyExists('sales', 'fk_sales_branch_id')) {
                    $table->dropForeign('fk_sales_branch_id');
                }
                if (Schema::hasColumn('sales', 'branch_id')) {
                    $table->dropColumn('branch_id');
                }
            });
        }

        // Drop branches table
        Schema::dropIfExists('branches');
    }

    /**
     * Check if a foreign key exists (MySQL only)
     */
    private function foreignKeyExists(string $table, string $name): bool
    {
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver !== 'mysql') {
            return false;
        }

        try {
            $result = DB::select(
                "SELECT COUNT(*) as count 
                 FROM information_schema.TABLE_CONSTRAINTS 
                 WHERE CONSTRAINT_SCHEMA = DATABASE()
                 AND TABLE_NAME = ? 
                 AND CONSTRAINT_NAME = ?",
                [$table, $name]
            );

            return $result[0]->count > 0;
        } catch (\Exception $e) {
            return false;
        }
    }
};
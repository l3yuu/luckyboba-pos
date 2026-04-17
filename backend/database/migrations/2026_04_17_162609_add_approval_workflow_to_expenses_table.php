<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->enum('workflow_status', ['Pending', 'Approved', 'Rejected'])->default('Approved')->after('payment_status');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null')->after('workflow_status');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->text('rejection_reason')->nullable()->after('approved_at');
        });

        // Set existing records to Approved
        DB::table('expenses')->update(['workflow_status' => 'Approved']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['workflow_status', 'approved_by', 'approved_at', 'rejection_reason']);
        });
    }
};

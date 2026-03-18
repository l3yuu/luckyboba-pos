<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Branch;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration maps existing branch_name values to branch_id
     */
    public function up(): void
    {
        // Only run this migration if branches table exists
        if (!Schema::hasTable('branches')) {
            return;
        }

        // Get all unique branch names from users
        $branchNames = DB::table('users')
            ->whereNotNull('branch_name')
            ->distinct()
            ->pluck('branch_name');

        // Create branches for each unique name if they don't exist
        foreach ($branchNames as $branchName) {
            $branch = Branch::firstOrCreate(
                ['name' => $branchName],
                [
                    'location' => $branchName, // Use name as location if not specified
                    'status' => 'active',
                ]
            );

            // Update users with this branch_name to use the branch_id
            DB::table('users')
                ->where('branch_name', $branchName)
                ->update(['branch_id' => $branch->id]);
        }

        // For any users with branch_name but no match, try partial matching
        $unmatchedUsers = DB::table('users')
            ->whereNotNull('branch_name')
            ->whereNull('branch_id')
            ->get();

        foreach ($unmatchedUsers as $user) {
            $branch = Branch::where('name', 'like', '%' . $user->branch_name . '%')
                ->orWhere('location', 'like', '%' . $user->branch_name . '%')
                ->first();

            if ($branch) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['branch_id' => $branch->id]);
            }
        }

        // Optional: You can drop the branch_name column after migration
        // Uncomment if you want to remove branch_name completely
        // Schema::table('users', function (Blueprint $table) {
        //     $table->dropColumn('branch_name');
        // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Only run if branches table exists
        if (!Schema::hasTable('branches')) {
            return;
        }

        // Restore branch_name from branch_id if needed
        $users = DB::table('users')
            ->whereNotNull('branch_id')
            ->get();

        foreach ($users as $user) {
            $branch = Branch::find($user->branch_id);
            
            if ($branch) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['branch_name' => $branch->name]);
            }
        }
    }
};
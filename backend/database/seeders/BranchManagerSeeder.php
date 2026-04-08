<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BranchManagerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = Branch::all();

        foreach ($branches as $branch) {
            // Check if branch already has a manager
            $hasManager = User::where('branch_id', $branch->id)
                ->where('role', 'branch_manager')
                ->exists();

            if (!$hasManager) {
                // Create a manager account
                // Email format: manager.[branch_name_slug]@luckyboba.com
                $slug = Str::slug($branch->name);
                $email = "manager.{$slug}@luckyboba.com";

                // Ensure email is unique if multiple branches have similar names
                $count = 1;
                while (User::where('email', $email)->exists()) {
                    $email = "manager.{$slug}.{$count}@luckyboba.com";
                    $count++;
                }

                User::create([
                    'name'              => "Manager - " . $branch->name,
                    'email'             => $email,
                    'password'          => Hash::make('manager123'),
                    'role'              => 'branch_manager',
                    'status'            => 'ACTIVE',
                    'branch_id'         => $branch->id,
                    'branch_name'       => $branch->name,
                    'email_verified_at' => now(),
                ]);

                $this->command->info("Created manager for branch: {$branch->name} ({$email})");
            } else {
                $this->command->info("Branch already has a manager: {$branch->name}");
            }
        }
    }
}

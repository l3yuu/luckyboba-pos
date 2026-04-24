<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface
{
    /**
     * Retrieve all users, applying branch scope if required.
     */
    public function getAll(array $filters = []): Collection;

    /**
     * Find a single user, applying branch scope if required.
     */
    public function findById(int $id): User;

    /**
     * Create a new user.
     */
    public function create(array $data): User;

    /**
     * Update an existing user.
     */
    public function update(User $user, array $data): User;

    /**
     * Delete a user.
     */
    public function delete(User $user): void;

    /**
     * Toggle the status of a user.
     */
    public function toggleStatus(User $user): User;

    /**
     * Get system-wide user statistics.
     */
    public function getStats(): array;
}

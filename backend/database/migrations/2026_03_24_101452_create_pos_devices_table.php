<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pos_devices', function (Blueprint $table) {
    $table->id();
    $table->string('device_name');
    $table->string('pos_number')->unique();
    $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
    $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->enum('status', ['ACTIVE', 'INACTIVE'])->default('ACTIVE');
    $table->timestamp('last_seen')->nullable();
    $table->timestamps();
});
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_devices');
    }
};
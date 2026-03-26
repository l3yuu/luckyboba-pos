public function up()
{
    Schema::table('receipts', function (Blueprint $table) {
        $table->string('brand')->nullable();
        $table->string('company_name')->nullable();
        $table->string('store_address')->nullable();
        $table->string('vat_reg_tin')->nullable();
        $table->string('min_number')->nullable();
        $table->string('serial_number')->nullable();
        $table->string('vat_type')->default('vat');
    });
}

public function down()
{
    Schema::table('receipts', function (Blueprint $table) {
        $table->dropColumn([
            'brand', 'company_name', 'store_address',
            'vat_reg_tin', 'min_number', 'serial_number', 'vat_type'
        ]);
    });
}
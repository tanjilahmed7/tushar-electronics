<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->decimal('commission', 15, 2)->nullable()->after('note');
            $table->foreignId('commission_sim_id')->nullable()->after('commission')->constrained('sims')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('commission_sim_id');
            $table->dropColumn('commission');
        });
    }
};

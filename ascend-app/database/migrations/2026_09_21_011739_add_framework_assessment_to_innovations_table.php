<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('innovations', function (Blueprint $table) {
            $table->json('framework_ratings')->nullable();
            $table->decimal('framework_score', 5, 2)->nullable()->index();
            $table->string('framework_level')->nullable();
            $table->text('framework_notes')->nullable();
            $table->timestamp('framework_assessed_at')->nullable();
            $table->foreignId('framework_assessed_by_id')->nullable()->constrained('users')->nullOnDelete();
        });

        // Prior six-criterion scores cannot establish the new five-criterion decision.
        DB::table('innovations')->where('is_scalable', true)->update(['is_scalable' => false]);
    }

    public function down(): void
    {
        Schema::table('innovations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('framework_assessed_by_id');
            $table->dropColumn(['framework_ratings', 'framework_score', 'framework_level', 'framework_notes', 'framework_assessed_at']);
        });
    }
};

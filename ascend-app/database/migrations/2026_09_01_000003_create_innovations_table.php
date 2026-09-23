<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('innovations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->string('author')->nullable();
            $table->string('school')->nullable();
            $table->string('district')->nullable();
            $table->string('learning_focus')->default('numeracy');
            $table->string('key_stage')->default('KS1');
            $table->string('grade_levels')->nullable();
            $table->string('manuscript_file_url')->nullable();
            $table->text('summary')->nullable();
            $table->string('status')->default('submitted');
            $table->decimal('relevance_score', 5, 2)->nullable();
            $table->decimal('innovativeness_score', 5, 2)->nullable();
            $table->decimal('effectiveness_score', 5, 2)->nullable();
            $table->decimal('scalability_score', 5, 2)->nullable();
            $table->decimal('sustainability_score', 5, 2)->nullable();
            $table->decimal('documentation_score', 5, 2)->nullable();
            $table->decimal('total_score', 5, 2)->nullable();
            $table->longText('ai_analysis')->nullable();
            $table->text('recommendation')->nullable();
            $table->boolean('is_scalable')->default(false);
            $table->json('strengths')->nullable();
            $table->json('areas_for_improvement')->nullable();
            $table->string('ascend_stage')->default('identification');
            $table->timestamp('evaluated_date')->nullable();
            $table->date('validated_date')->nullable();
            $table->timestamps();
            $table->index(['learning_focus', 'is_scalable']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('innovations');
    }
};

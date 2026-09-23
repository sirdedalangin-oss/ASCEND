<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluation_criteria', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('label');
            $table->text('description');
            $table->unsignedTinyInteger('weight');
            $table->unsignedTinyInteger('sort_order');
            $table->timestamps();
        });

        $now = now();
        DB::table('evaluation_criteria')->insert([
            ['key' => 'relevance_score', 'label' => 'Relevance and Responsiveness', 'description' => 'Addresses identified learning gaps, responds to KS1 learner needs, and aligns with DepEd curriculum and priorities.', 'weight' => 20, 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'innovativeness_score', 'label' => 'Innovativeness', 'description' => 'Degree of novelty, creativity, and originality compared to existing conventional practices.', 'weight' => 20, 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'effectiveness_score', 'label' => 'Effectiveness and Impact', 'description' => 'Evidence that the innovation improves learner outcomes in numeracy and/or literacy with measurable results.', 'weight' => 25, 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'scalability_score', 'label' => 'Scalability and Replicability', 'description' => 'Potential for implementation across multiple schools, districts, and contexts with consistency.', 'weight' => 20, 'sort_order' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'sustainability_score', 'label' => 'Sustainability', 'description' => 'Likelihood of long-term maintenance, institutional support, and continued impact.', 'weight' => 10, 'sort_order' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'documentation_score', 'label' => 'Quality of Documentation', 'description' => 'Clarity, completeness, rigor, and professionalism of the manuscript.', 'weight' => 5, 'sort_order' => 6, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_criteria');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('innovations', function (Blueprint $table) {
            $table->json('evaluation_weights')->nullable()->after('evaluation_model');
        });

        $defaultWeights = [
            'relevance_score' => 20,
            'innovativeness_score' => 20,
            'effectiveness_score' => 25,
            'scalability_score' => 20,
            'sustainability_score' => 10,
            'documentation_score' => 5,
        ];
        $storedWeights = DB::table('evaluation_criteria')
            ->pluck('weight', 'key')
            ->map(fn (mixed $weight): int => (int) $weight)
            ->all();
        $evaluationWeights = array_replace($defaultWeights, $storedWeights);

        DB::table('innovations')
            ->whereNotNull('total_score')
            ->whereNull('evaluation_weights')
            ->update(['evaluation_weights' => json_encode($evaluationWeights, JSON_THROW_ON_ERROR)]);

        $descriptions = [
            'relevance_score' => 'How well the innovation addresses identified learning gaps, responds to the needs of KS1 learners, and aligns with the DepEd curriculum and strategic priorities.',
            'innovativeness_score' => 'The degree of novelty, creativity, and originality of the approach compared to existing conventional practices.',
            'effectiveness_score' => 'Evidence that the innovation improves learner outcomes in numeracy and/or literacy, with measurable results, data, or documented evidence.',
            'scalability_score' => 'The potential for the innovation to be implemented across multiple schools, districts, and contexts with consistency and reasonable resource requirements.',
            'sustainability_score' => 'The likelihood of long-term maintenance, institutional support, and continued impact beyond initial implementation.',
            'documentation_score' => 'Clarity, completeness, rigor, and professionalism of the manuscript documentation.',
        ];

        foreach ($descriptions as $key => $description) {
            DB::table('evaluation_criteria')->where('key', $key)->update(['description' => $description]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $descriptions = [
            'relevance_score' => 'Addresses identified learning gaps, responds to KS1 learner needs, and aligns with DepEd curriculum and priorities.',
            'innovativeness_score' => 'Degree of novelty, creativity, and originality compared to existing conventional practices.',
            'effectiveness_score' => 'Evidence that the innovation improves learner outcomes in numeracy and/or literacy with measurable results.',
            'scalability_score' => 'Potential for implementation across multiple schools, districts, and contexts with consistency.',
            'sustainability_score' => 'Likelihood of long-term maintenance, institutional support, and continued impact.',
            'documentation_score' => 'Clarity, completeness, rigor, and professionalism of the manuscript.',
        ];

        foreach ($descriptions as $key => $description) {
            DB::table('evaluation_criteria')->where('key', $key)->update(['description' => $description]);
        }

        Schema::table('innovations', function (Blueprint $table) {
            $table->dropColumn('evaluation_weights');
        });
    }
};

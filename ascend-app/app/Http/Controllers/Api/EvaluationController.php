<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Innovation;
use App\Services\InnovationEvaluator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    public function __invoke(Request $request, InnovationEvaluator $evaluator): JsonResponse
    {
        $data = $request->validate([
            'manuscript_file_url' => ['required', 'string', 'max:2048'],
            'original_filename' => ['nullable', 'string', 'max:255'],
            'learning_focus' => ['nullable', 'in:numeracy,literacy'],
            'key_stage' => ['required', 'in:KS1,KS2,KS3,KS4,ALL'],
            'grade_levels' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'school' => ['nullable', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
        ]);

        $result = $evaluator->evaluate($data);
        $manuscriptTitle = $this->titleFromFilename(
            $data['original_filename'] ?? '',
            $result['detected_title']
        );
        $innovation = Innovation::create([
            'created_by_id' => $request->user()->id,
            'title' => $manuscriptTitle,
            'author' => $data['author'] ?? null,
            'school' => $data['school'] ?? null,
            'district' => $data['district'] ?? null,
            'learning_focus' => $result['detected_learning_focus'],
            'key_stage' => $data['key_stage'],
            'grade_levels' => $data['grade_levels'],
            'manuscript_file_url' => $data['manuscript_file_url'],
            'summary' => $result['summary'],
            'status' => 'evaluated',
            'relevance_score' => $result['relevance_score'],
            'innovativeness_score' => $result['innovativeness_score'],
            'effectiveness_score' => $result['effectiveness_score'],
            'scalability_score' => $result['scalability_score'],
            'sustainability_score' => $result['sustainability_score'],
            'documentation_score' => $result['documentation_score'],
            'total_score' => $result['total_score'],
            'ai_analysis' => $result['ai_analysis'],
            'evaluation_method' => $result['evaluation_method'],
            'evaluation_model' => $result['evaluation_model'],
            'recommendation' => $result['recommendation'],
            'is_scalable' => $result['is_scalable'],
            'strengths' => $result['strengths'],
            'areas_for_improvement' => $result['areas_for_improvement'],
            'ascend_stage' => 'validation',
            'evaluated_date' => now(),
        ]);

        return response()->json([
            ...$result,
            'detected_title' => $manuscriptTitle,
            'innovation_id' => $innovation->id,
        ], 201);
    }

    private function titleFromFilename(string $originalFilename, string $fallback): string
    {
        $decodedFilename = rawurldecode($originalFilename);
        $filename = basename(str_replace('\\', '/', $decodedFilename));
        $title = pathinfo($filename, PATHINFO_FILENAME);
        $title = preg_replace('/[\p{Pd}_.]+/u', ' ', $title) ?? '';
        $title = preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $title) ?? '';
        $title = preg_replace('/\s+/u', ' ', trim($title)) ?? '';

        return $title !== '' ? $title : $fallback;
    }
}

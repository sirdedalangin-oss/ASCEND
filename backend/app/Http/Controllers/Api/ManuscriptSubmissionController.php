<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Innovation;
use App\Models\Keyword;
use App\Services\ManuscriptAnalyzer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ManuscriptSubmissionController extends Controller
{
    public function __invoke(Request $request, ManuscriptAnalyzer $analyzer): JsonResponse
    {
        $data = $request->validate([
            'manuscript_file_url' => ['required', 'string', 'max:2048'],
            'original_filename' => ['nullable', 'string', 'max:255'],
            'learning_focus' => ['nullable', 'in:numeracy,literacy'],
            'key_stage' => ['required', Rule::in(array_keys(Innovation::GRADES_BY_STAGE))],
            'grade_levels' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'school' => ['nullable', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'keyword_ids' => ['sometimes', 'array', 'min:1', 'max:15'],
            'keyword_ids.*' => ['integer', 'distinct', Rule::exists(Keyword::class, 'id')],
        ]);

        if (! Innovation::gradeMatchesStage($data['key_stage'], $data['grade_levels'])) {
            throw ValidationException::withMessages([
                'grade_levels' => 'Select a grade level that belongs to the chosen key stage.',
            ]);
        }

        $result = $analyzer->analyze($data);
        $keywordIds = $data['keyword_ids'] ?? [];

        if ($keywordIds === []) {
            $focus = $result['detected_learning_focus'];
            $fallbackKeyword = Keyword::firstOrCreate(
                ['slug' => $focus],
                ['name' => $focus, 'category' => array_key_exists($focus, Keyword::CATEGORIES) ? $focus : 'other'],
            );
            $keywordIds = [$fallbackKeyword->id];
        }
        $manuscriptTitle = $this->titleFromFilename(
            $data['original_filename'] ?? '',
            $result['detected_title']
        );
        $innovation = DB::transaction(function () use ($request, $data, $result, $manuscriptTitle, $keywordIds): Innovation {
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
                'status' => 'submitted',
                'ascend_stage' => 'identification',
            ]);
            $innovation->keywords()->sync($keywordIds);

            return $innovation->load('keywords');
        });

        return response()->json([
            ...$result,
            'detected_title' => $manuscriptTitle,
            'innovation_id' => $innovation->id,
            'keywords' => $innovation->keywords,
            'status' => 'submitted',
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

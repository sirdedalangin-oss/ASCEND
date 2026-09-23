<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Innovation;
use App\Models\Keyword;
use App\Services\FrameworkManuscriptRater;
use App\Services\ManuscriptAnalyzer;
use App\Services\ScalabilityFramework;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class ManuscriptSubmissionController extends Controller
{
    public function __invoke(
        Request $request,
        ManuscriptAnalyzer $analyzer,
        FrameworkManuscriptRater $rater,
        ScalabilityFramework $framework,
    ): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required_without:manuscript_file_url', 'file', 'mimes:pdf,docx,txt,md', 'max:20480'],
            'manuscript_file_url' => ['nullable', 'string', 'max:2048'],
            'original_filename' => ['nullable', 'string', 'max:255'],
            'learning_focus' => ['nullable', 'in:numeracy,literacy'],
            'key_stage' => ['required', Rule::in(array_keys(Innovation::GRADES_BY_STAGE))],
            'grade_levels' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'school' => ['nullable', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'keyword_ids' => ['sometimes', 'array', 'min:1', 'max:15'],
            'keyword_ids.*' => ['integer', 'distinct', Rule::exists(Keyword::class, 'id')],
        ], [
            'file.required_without' => 'Upload a manuscript file and try again.',
        ]);

        if (! Innovation::gradeMatchesStage($data['key_stage'], $data['grade_levels'])) {
            throw ValidationException::withMessages([
                'grade_levels' => 'Select a grade level that belongs to the chosen key stage.',
            ]);
        }

        $uploadedPath = null;

        try {
            if ($request->hasFile('file')) {
                $uploadedPath = $request->file('file')->store('manuscripts', 'public');
                $data['manuscript_file_url'] = Storage::disk('public')->url($uploadedPath);
                $data['original_filename'] ??= $request->file('file')->getClientOriginalName();
            }

            $analysis = $analyzer->analyzeWithText($data);
            $result = $analysis['result'];
            $rating = $rater->rate($analysis['text']);
            $assessment = $framework->assess($rating['ratings']);
            $recommendation = $assessment['is_scalable']
                ? 'The initial manuscript review meets the framework threshold. Review the evidence indicators and correct any ratings if needed.'
                : 'The initial manuscript review is below the framework threshold. Review the missing evidence indicators and correct any ratings that do not reflect the manuscript.';
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
            $innovation = DB::transaction(function () use ($request, $data, $result, $rating, $assessment, $recommendation, $manuscriptTitle, $keywordIds): Innovation {
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
                    'framework_ratings' => $rating['ratings'],
                    'framework_score' => $assessment['score'],
                    'framework_level' => $assessment['level'],
                    'framework_notes' => $rating['notes'],
                    'framework_assessed_at' => now(),
                    'evaluation_method' => 'automatic_manuscript_review',
                    'recommendation' => $recommendation,
                    'is_scalable' => $assessment['is_scalable'],
                    'ascend_stage' => 'validation',
                    'evaluated_date' => now(),
                ]);
                $innovation->keywords()->sync($keywordIds);

                return $innovation->load('keywords');
            });

            return response()->json([
                ...$result,
                'detected_title' => $manuscriptTitle,
                'innovation_id' => $innovation->id,
                'keywords' => $innovation->keywords,
                'status' => $innovation->status,
                'framework_ratings' => $innovation->framework_ratings,
                'framework_score' => $innovation->framework_score,
                'framework_level' => $innovation->framework_level,
                'framework_notes' => $innovation->framework_notes,
                'is_scalable' => $innovation->is_scalable,
                'evaluation_method' => $innovation->evaluation_method,
            ], 201);
        } catch (Throwable $exception) {
            if ($uploadedPath) {
                Storage::disk('public')->delete($uploadedPath);
            }

            throw $exception;
        }
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

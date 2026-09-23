<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Innovation;
use App\Services\FrameworkManuscriptRater;
use App\Services\ManuscriptAnalyzer;
use App\Services\ScalabilityFramework;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ManuscriptRevisionController extends Controller
{
    public function __invoke(
        Request $request,
        Innovation $innovation,
        ManuscriptAnalyzer $analyzer,
        FrameworkManuscriptRater $rater,
        ScalabilityFramework $framework,
    ): JsonResponse {
        $this->authorizeRevision($request, $innovation);
        $request->validate(['file' => ['required', 'file', 'mimes:pdf,docx,txt,md', 'max:20480']]);

        $newPath = $request->file('file')->store('manuscripts', 'public');
        $newUrl = Storage::disk('public')->url($newPath);

        try {
            $analysis = $analyzer->analyzeWithText([
                'manuscript_file_url' => $newUrl,
                'original_filename' => $request->file('file')->getClientOriginalName(),
                'key_stage' => $innovation->key_stage ?: 'ALL',
                'grade_levels' => $innovation->grade_levels ?: 'School-wide',
            ]);
            $rating = $rater->rate($analysis['text']);
            $assessment = $framework->assess($rating['ratings']);
            $oldUrl = null;

            DB::transaction(function () use ($request, $innovation, $analysis, $rating, $assessment, $newUrl, &$oldUrl): void {
                $current = Innovation::query()->lockForUpdate()->findOrFail($innovation->id);
                $this->authorizeRevision($request, $current);
                $oldUrl = $current->manuscript_file_url;
                $current->update([
                    'manuscript_file_url' => $newUrl,
                    'summary' => $analysis['result']['summary'],
                    'status' => 'evaluated',
                    'framework_ratings' => $rating['ratings'],
                    'framework_score' => $assessment['score'],
                    'framework_level' => $assessment['level'],
                    'framework_notes' => $rating['notes'],
                    'framework_assessed_at' => now(),
                    'framework_assessed_by_id' => null,
                    'evaluation_method' => 'automatic_manuscript_review',
                    'recommendation' => $assessment['is_scalable']
                        ? 'The revised manuscript meets the framework threshold. Review the evidence indicators and correct any ratings if needed.'
                        : 'The revised manuscript is below the framework threshold. Review the evidence indicators and correct any ratings if needed.',
                    'is_scalable' => $assessment['is_scalable'],
                    'ascend_stage' => 'validation',
                    'evaluated_date' => now(),
                    'validated_date' => null,
                ]);
            });

        } catch (Throwable $exception) {
            Storage::disk('public')->delete($newPath);
            throw $exception;
        }

        $oldPath = ltrim((string) parse_url($oldUrl ?? '', PHP_URL_PATH), '/');
        if (str_starts_with($oldPath, 'storage/manuscripts/')) {
            Storage::disk('public')->delete(substr($oldPath, strlen('storage/')));
        }

        return response()->json($innovation->fresh()->load('keywords'));
    }

    private function authorizeRevision(Request $request, Innovation $innovation): void
    {
        abort_unless(
            $request->user()->role === 'admin'
                || ($innovation->created_by_id === $request->user()->id && $innovation->status !== 'validated'),
            403,
            'Only the uploader or an administrator may revise this manuscript.'
        );
    }
}

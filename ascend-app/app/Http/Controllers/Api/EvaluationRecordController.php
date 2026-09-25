<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Innovation;
use App\Services\ScalabilityFramework;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvaluationRecordController extends Controller
{
    public function __construct(private readonly ScalabilityFramework $framework) {}

    public function index(Request $request): JsonResponse
    {
        $query = Innovation::query()->whereNotNull('framework_score');

        if ($request->filled('learning_focus')) {
            $query->where('learning_focus', $request->string('learning_focus'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json(
            $query->latest('framework_assessed_at')
                ->latest('created_at')
                ->limit(min($request->integer('limit', 200), 500))
                ->get()
        );
    }

    public function candidates(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json(
            $this->candidateQuery()
                ->orderBy('learning_focus')
                ->orderBy('title')
                ->get()
                ->map(function (Innovation $innovation): array {
                    return [
                        ...$innovation->toArray(),
                        'assessment_action' => $innovation->framework_score === null ? 'create' : 'review',
                    ];
                })
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $data = $request->validate([
            'innovation_id' => ['required', 'integer', 'exists:innovations,id'],
            ...$this->rules(),
        ]);
        $innovation = Innovation::findOrFail($data['innovation_id']);
        if ($innovation->framework_score !== null) {
            return response()->json(['message' => 'This innovation already has a framework assessment. Edit it instead.'], 409);
        }
        if (! $this->candidateQuery()->whereKey($innovation->id)->exists()) {
            return response()->json(['message' => 'This innovation is not eligible for a new framework assessment.'], 409);
        }
        unset($data['innovation_id']);
        $data['title'] = $innovation->title;
        $innovation->update($this->prepareEvaluation($data, $request->user()->id));

        return response()->json($innovation->fresh(), 201);
    }

    public function show(Innovation $innovation): JsonResponse
    {
        return response()->json($innovation);
    }

    public function update(Request $request, Innovation $innovation): JsonResponse
    {
        if ($request->boolean('from_candidate')) {
            $this->ensureAdmin($request);
            if (! $this->candidateQuery()->whereKey($innovation->id)->exists() || $innovation->framework_score === null) {
                return response()->json(['message' => 'This innovation is no longer available for panel review. Refresh the assessment list.'], 409);
            }
        }
        $isAdmin = $request->user()->role === 'admin';
        $isOwner = $innovation->created_by_id === $request->user()->id
            && $innovation->framework_score !== null
            && $innovation->status !== 'validated';
        abort_unless($isAdmin || $isOwner, 403, 'Only the uploader or an administrator may edit this assessment.');

        abort_if(! $isAdmin && $request->input('status') === 'validated', 403, 'Only administrators may validate assessments.');
        $data = $isAdmin ? $request->validate($this->rules()) : [
            ...$innovation->only(['title', 'author', 'school', 'district', 'learning_focus', 'key_stage', 'grade_levels']),
            'status' => 'evaluated',
            ...$request->validate($this->ratingRules()),
        ];

        $method = $isAdmin ? 'manual_panel_evaluation' : 'manual_owner_correction';
        $updates = $this->prepareEvaluation($data, $request->user()->id, $method);
        $submittedRecommendation = array_key_exists('recommendation', $data)
            ? $data['recommendation']
            : $innovation->recommendation;
        if ($innovation->framework_ratings !== $updates['framework_ratings']
            && in_array($innovation->evaluation_method, ['automatic_manuscript_review', 'manual_owner_correction'], true)
            && $submittedRecommendation === $innovation->recommendation) {
            $updates['recommendation'] = $updates['is_scalable']
                ? 'The corrected framework ratings meet the scalability threshold. Review the rating notes for supporting evidence.'
                : 'The corrected framework ratings are below the scalability threshold. Review the rating notes and strengthen the documented evidence.';
        }
        $innovation->update($updates);

        return response()->json($innovation->fresh());
    }

    public function destroy(Request $request, Innovation $innovation): JsonResponse
    {
        $this->ensureAdmin($request);
        $innovation->update([
            'status' => 'submitted',
            'framework_ratings' => null,
            'framework_score' => null,
            'framework_level' => null,
            'framework_notes' => null,
            'framework_assessed_at' => null,
            'framework_assessed_by_id' => null,
            'evaluation_method' => null,
            'evaluation_model' => null,
            'recommendation' => null,
            'is_scalable' => false,
            'ascend_stage' => 'identification',
            'evaluated_date' => null,
            'validated_date' => null,
        ]);

        return response()->json([
            'message' => 'Framework assessment removed. The innovation and manuscript were preserved.',
            'innovation' => $innovation->fresh(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function prepareEvaluation(array $data, int $assessorId, string $method = 'manual_panel_evaluation'): array
    {
        $ratings = array_map(intval(...), $data['framework_ratings']);
        $assessment = $this->framework->assess($ratings);

        return [
            ...$data,
            'framework_ratings' => $ratings,
            'framework_score' => $assessment['score'],
            'framework_level' => $assessment['level'],
            'framework_assessed_at' => now(),
            'framework_assessed_by_id' => $assessorId,
            'is_scalable' => $assessment['is_scalable'],
            'ascend_stage' => $data['status'] === 'validated' ? 'readiness' : 'validation',
            'evaluation_method' => $method,
            'evaluated_date' => $data['evaluated_date'] ?? now(),
            'validated_date' => $data['status'] === 'validated' ? now()->toDateString() : null,
        ];
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Only administrators may record framework assessments.');
    }

    private function candidateQuery(): Builder
    {
        return Innovation::query()
            ->whereRaw('LOWER(TRIM(learning_focus)) IN (?, ?)', ['literacy', 'numeracy'])
            ->whereRaw('LOWER(TRIM(status)) IN (?, ?, ?)', ['submitted', 'evaluating', 'evaluated'])
            ->where(function (Builder $query): void {
                $query->whereNull('framework_score')
                    ->orWhere(function (Builder $review): void {
                        $review->whereNotNull('framework_score')
                            ->whereRaw('LOWER(TRIM(evaluation_method)) IN (?, ?)', ['automatic_manuscript_review', 'manual_owner_correction']);
                    });
            });
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'school' => ['nullable', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'learning_focus' => ['required', 'in:numeracy,literacy'],
            'key_stage' => ['required', 'in:KS1,KS2,KS3,KS4,ALL'],
            'grade_levels' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:evaluated,validated'],
            'evaluated_date' => ['nullable', 'date'],
            ...$this->ratingRules(),
        ];
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function ratingRules(): array
    {
        $rules = [
            'framework_ratings' => ['required', 'array', 'size:5'],
            'framework_notes' => ['nullable', 'string'],
            'recommendation' => ['nullable', 'string'],
        ];

        foreach (array_keys(ScalabilityFramework::CRITERIA) as $key) {
            $rules["framework_ratings.{$key}"] = ['required', 'integer', 'between:1,5'];
        }

        return $rules;
    }
}

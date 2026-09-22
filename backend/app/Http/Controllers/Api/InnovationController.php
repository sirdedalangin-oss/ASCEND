<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Innovation;
use App\Models\Keyword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class InnovationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Innovation::query()->with('keywords');

        if ($request->filled('is_scalable')) {
            $query->where('is_scalable', $request->boolean('is_scalable'));
            $query->whereNotNull('framework_score');
        }

        if ($request->filled('learning_focus')) {
            $query->where('learning_focus', $request->string('learning_focus'));
        }

        if ($request->filled('keyword_category')) {
            $query->whereHas('keywords', fn ($keywords) => $keywords->where('category', $request->string('keyword_category')));
        }

        if ($request->filled('keyword_id')) {
            $query->whereHas('keywords', fn ($keywords) => $keywords->whereKey($request->integer('keyword_id')));
        }

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            $allowedStatuses = ['submitted', 'evaluating', 'evaluated', 'validated', 'scaling', 'failed', 'archived'];

            if (in_array($status, $allowedStatuses, true)) {
                $query->where('status', $status);
            }
        }

        $allowedSorts = ['created_at', 'framework_score', 'title'];
        $sort = ltrim($request->string('sort', '-created_at')->toString(), '-');
        $direction = str_starts_with($request->string('sort', '-created_at')->toString(), '-') ? 'desc' : 'asc';
        $query->orderBy(in_array($sort, $allowedSorts, true) ? $sort : 'created_at', $direction);

        return response()->json($query->get());
    }

    public function show(Innovation $innovation): JsonResponse
    {
        return response()->json($innovation->load('keywords'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        if (isset($data['key_stage'], $data['grade_levels']) && ! Innovation::gradeMatchesStage($data['key_stage'], $data['grade_levels'])) {
            throw ValidationException::withMessages(['grade_levels' => 'Select a grade level that belongs to the chosen key stage.']);
        }
        $keywordIds = $data['keyword_ids'] ?? [];
        unset($data['keyword_ids']);
        $data['created_by_id'] = $request->user()->id;
        $data['status'] = 'submitted';
        $data['is_scalable'] = false;

        $innovation = Innovation::create($data);
        $innovation->keywords()->sync($keywordIds);

        return response()->json($innovation->load('keywords'), 201);
    }

    public function destroy(Request $request, Innovation $innovation): JsonResponse
    {
        abort_unless(
            $request->user()->role === 'admin'
                || ($innovation->framework_score === null && $innovation->created_by_id === $request->user()->id),
            403,
            'You may delete only your own unassessed innovations.',
        );

        $innovation->delete();

        return response()->json(['message' => 'Innovation deleted.']);
    }

    private function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'school' => ['nullable', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'learning_focus' => ['required', 'in:numeracy,literacy'],
            'key_stage' => ['nullable', Rule::in(array_keys(Innovation::GRADES_BY_STAGE))],
            'grade_levels' => ['nullable', 'string', 'max:255'],
            'manuscript_file_url' => ['nullable', 'string', 'max:2048'],
            'summary' => ['nullable', 'string'],
            'keyword_ids' => ['sometimes', 'array', 'max:15'],
            'keyword_ids.*' => ['integer', 'distinct', Rule::exists(Keyword::class, 'id')],
        ];
    }
}

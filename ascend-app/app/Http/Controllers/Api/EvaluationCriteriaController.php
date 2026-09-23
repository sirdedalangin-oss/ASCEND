<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EvaluationCriterion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EvaluationCriteriaController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(EvaluationCriterion::query()->orderBy('sort_order')->get());
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'criteria' => ['required', 'array', 'size:6'],
            'criteria.*.key' => [
                'required',
                'string',
                'distinct',
                Rule::in(array_keys(EvaluationCriterion::DEFAULT_WEIGHTS)),
            ],
            'criteria.*.weight' => ['required', 'integer', 'between:0,100'],
        ]);

        $total = collect($data['criteria'])->sum('weight');
        if ($total !== 100) {
            throw ValidationException::withMessages([
                'criteria' => "Criteria weights must total exactly 100%. Current total: {$total}%.",
            ]);
        }

        DB::transaction(function () use ($data): void {
            foreach ($data['criteria'] as $criterion) {
                EvaluationCriterion::query()
                    ->where('key', $criterion['key'])
                    ->update(['weight' => $criterion['weight']]);
            }
        });

        return $this->index();
    }
}

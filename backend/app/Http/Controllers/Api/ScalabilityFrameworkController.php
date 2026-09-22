<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ScalabilityFramework;
use Illuminate\Http\JsonResponse;

class ScalabilityFrameworkController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'criteria' => collect(ScalabilityFramework::CRITERIA)
                ->map(fn (array $criterion, string $key): array => ['key' => $key, ...$criterion])
                ->values()
                ->all(),
            'ratings' => ScalabilityFramework::RATING_DESCRIPTIONS,
            'levels' => ScalabilityFramework::LEVELS,
            'threshold' => ScalabilityFramework::THRESHOLD,
        ]);
    }
}

<?php

namespace App\Services;

use InvalidArgumentException;

class ScalabilityFramework
{
    public const THRESHOLD = 75;

    public const CRITERIA = [
        'division_impact' => ['label' => 'Potential Impact Across the Division', 'weight' => 30],
        'context_adaptability' => ['label' => 'Adaptability Across School Contexts', 'weight' => 20],
        'adoption_ease' => ['label' => 'Ease of Adoption and Implementation', 'weight' => 20],
        'sustainability' => ['label' => 'Sustainability', 'weight' => 15],
        'resource_efficiency' => ['label' => 'Resource Efficiency', 'weight' => 15],
    ];

    public const RATING_DESCRIPTIONS = [
        5 => 'The criterion is demonstrated to an exceptional degree and indicates outstanding readiness for division-wide implementation with little to no limitation.',
        4 => 'The criterion is demonstrated to a high degree and indicates very strong readiness for division-wide implementation with minimal enhancement needed.',
        3 => 'The criterion is adequately demonstrated and indicates readiness for division-wide implementation with reasonable adjustments or support.',
        2 => 'The criterion is partially demonstrated and indicates limited readiness for division-wide implementation, requiring significant improvement.',
        1 => 'The criterion is minimally demonstrated and indicates insufficient readiness for division-wide implementation.',
    ];

    public const LEVELS = [
        ['minimum' => 95, 'maximum' => 100, 'title' => 'Platinum Scalable Innovation', 'description' => 'Demonstrates exceptional potential for division-wide implementation. The innovation serves as a model practice with outstanding impact, adaptability, sustainability, and resource efficiency.'],
        ['minimum' => 90, 'maximum' => 94, 'title' => 'Gold Scalable Innovation', 'description' => 'Demonstrates very strong potential for division-wide implementation. The innovation is highly adaptable, sustainable, and capable of producing substantial educational benefits.'],
        ['minimum' => 85, 'maximum' => 89, 'title' => 'Silver Scalable Innovation', 'description' => 'Demonstrates high potential for implementation across the division. The innovation effectively addresses common educational needs and can be adopted with reasonable support.'],
        ['minimum' => 80, 'maximum' => 84, 'title' => 'Bronze Scalable Innovation', 'description' => 'Meets the standards for division-wide implementation. The innovation shows clear scalability potential but may require minor refinements or enhancements.'],
        ['minimum' => 75, 'maximum' => 79, 'title' => 'Qualified Scalable Innovation', 'description' => 'Meets the minimum requirements for scalability. The innovation may be scaled but would benefit from further validation, improvement, or support mechanisms.'],
        ['minimum' => 0, 'maximum' => 74, 'title' => 'Not Yet Recommended for Scaling', 'description' => 'The innovation requires additional development, evidence, or refinement before division-wide implementation may be considered.'],
    ];

    /**
     * @param  array<string, int>  $ratings
     * @return array{score: int, level: string, is_scalable: bool}
     */
    public function assess(array $ratings): array
    {
        if (count($ratings) !== count(self::CRITERIA) || array_diff(array_keys($ratings), array_keys(self::CRITERIA))) {
            throw new InvalidArgumentException('All five framework criteria must be rated.');
        }

        $weightedSum = 0;

        foreach (self::CRITERIA as $key => $criterion) {
            if (! is_int($ratings[$key]) || $ratings[$key] < 1 || $ratings[$key] > 5) {
                throw new InvalidArgumentException("{$key} must have an integer rating from 1 to 5.");
            }

            $weightedSum += $ratings[$key] * $criterion['weight'];
        }

        $score = (int) ($weightedSum / 5);

        foreach (self::LEVELS as $level) {
            if ($score >= $level['minimum']) {
                return [
                    'score' => $score,
                    'level' => $level['title'],
                    'is_scalable' => $score >= self::THRESHOLD,
                ];
            }
        }

        throw new InvalidArgumentException('The framework score is outside the expected range.');
    }
}

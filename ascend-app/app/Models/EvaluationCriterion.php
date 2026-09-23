<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluationCriterion extends Model
{
    public const DEFAULT_WEIGHTS = [
        'relevance_score' => 20,
        'innovativeness_score' => 20,
        'effectiveness_score' => 25,
        'scalability_score' => 20,
        'sustainability_score' => 10,
        'documentation_score' => 5,
    ];

    protected $fillable = ['key', 'label', 'description', 'weight', 'sort_order'];

    protected function casts(): array
    {
        return [
            'weight' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public static function weights(): array
    {
        $stored = self::query()->pluck('weight', 'key')->all();

        return array_replace(self::DEFAULT_WEIGHTS, $stored);
    }
}

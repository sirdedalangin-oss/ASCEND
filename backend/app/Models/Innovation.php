<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Innovation extends Model
{
    public const GRADES_BY_STAGE = [
        'KS1' => ['Grade 1', 'Grade 2', 'Grade 3', 'Grades 1-3'],
        'KS2' => ['Grade 4', 'Grade 5', 'Grade 6', 'Grades 4-6', 'Grades 5-6'],
        'KS3' => ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grades 7-10'],
        'KS4' => ['Grade 11', 'Grade 12', 'Grades 11-12'],
        'ALL' => ['All grade levels', 'School-wide', 'Personnel-focused'],
    ];

    protected $fillable = [
        'created_by_id',
        'title',
        'author',
        'school',
        'district',
        'learning_focus',
        'key_stage',
        'grade_levels',
        'manuscript_file_url',
        'summary',
        'status',
        'relevance_score',
        'innovativeness_score',
        'effectiveness_score',
        'scalability_score',
        'sustainability_score',
        'documentation_score',
        'total_score',
        'framework_ratings',
        'framework_score',
        'framework_level',
        'framework_notes',
        'framework_assessed_at',
        'framework_assessed_by_id',
        'ai_analysis',
        'evaluation_method',
        'evaluation_model',
        'evaluation_weights',
        'recommendation',
        'is_scalable',
        'strengths',
        'areas_for_improvement',
        'ascend_stage',
        'evaluated_date',
        'validated_date',
    ];

    protected function casts(): array
    {
        return [
            'is_scalable' => 'boolean',
            'strengths' => 'array',
            'areas_for_improvement' => 'array',
            'evaluation_weights' => 'array',
            'framework_ratings' => 'array',
            'framework_score' => 'float',
            'framework_assessed_at' => 'datetime',
            'evaluated_date' => 'datetime',
            'validated_date' => 'date',
            'relevance_score' => 'float',
            'innovativeness_score' => 'float',
            'effectiveness_score' => 'float',
            'scalability_score' => 'float',
            'sustainability_score' => 'float',
            'documentation_score' => 'float',
            'total_score' => 'float',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function keywords(): BelongsToMany
    {
        return $this->belongsToMany(Keyword::class)->orderBy('name');
    }

    public static function gradeMatchesStage(string $keyStage, string $gradeLevels): bool
    {
        return in_array($gradeLevels, self::GRADES_BY_STAGE[$keyStage] ?? [], true);
    }
}

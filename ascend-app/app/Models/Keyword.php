<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Keyword extends Model
{
    public const CATEGORIES = [
        'literacy' => 'Literacy & Reading',
        'numeracy' => 'Numeracy & Mathematics',
        'science' => 'Science',
        'ict' => 'ICT & Digital Innovation',
        'inclusive_education' => 'Inclusive Education',
        'teacher_development' => 'Teacher Development',
        'environment' => 'Environmental Education',
        'learner_wellness' => 'Learner Wellness & Nutrition',
        'data_analytics' => 'School Data Analytics',
        'blended_learning' => 'Blended & Home-School Learning',
        'other' => 'Other',
    ];

    protected $fillable = ['name', 'slug', 'category'];

    public function innovations(): BelongsToMany
    {
        return $this->belongsToMany(Innovation::class);
    }
}

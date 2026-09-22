<?php

namespace Tests\Unit;

use App\Services\ScalabilityFramework;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ScalabilityFrameworkTest extends TestCase
{
    #[DataProvider('frameworkCases')]
    public function test_weighted_score_and_level_follow_the_document(array $ratings, int $score, string $level): void
    {
        $keyedRatings = array_combine(array_keys(ScalabilityFramework::CRITERIA), $ratings);
        $result = (new ScalabilityFramework)->assess($keyedRatings);

        $this->assertSame($score, $result['score']);
        $this->assertSame($level, $result['level']);
        $this->assertSame($score >= 75, $result['is_scalable']);
    }

    public static function frameworkCases(): array
    {
        return [
            'below threshold' => [[3, 4, 4, 4, 4], 74, 'Not Yet Recommended for Scaling'],
            'qualified threshold' => [[4, 3, 3, 5, 4], 75, 'Qualified Scalable Innovation'],
            'bronze' => [[4, 4, 4, 4, 4], 80, 'Bronze Scalable Innovation'],
            'silver' => [[4, 5, 5, 3, 4], 85, 'Silver Scalable Innovation'],
            'gold' => [[5, 5, 4, 4, 4], 90, 'Gold Scalable Innovation'],
            'platinum' => [[5, 5, 5, 5, 5], 100, 'Platinum Scalable Innovation'],
        ];
    }

    public function test_ratings_must_cover_every_criterion(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new ScalabilityFramework)->assess(['division_impact' => 5]);
    }
}

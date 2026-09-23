<?php

namespace Tests\Unit;

use App\Services\FrameworkManuscriptRater;
use App\Services\ScalabilityFramework;
use PHPUnit\Framework\TestCase;

class FrameworkManuscriptRaterTest extends TestCase
{
    public function test_repetition_does_not_inflate_a_rating(): void
    {
        $rating = (new FrameworkManuscriptRater)->rate(str_repeat('Baseline learning gap. ', 40));

        $this->assertSame(4, $rating['ratings']['division_impact']);
        $this->assertSame(3, $rating['ratings']['resource_efficiency']);
        $this->assertSame(array_keys(ScalabilityFramework::CRITERIA), array_keys($rating['ratings']));
    }

    public function test_planned_post_test_is_not_treated_as_reported_outcome(): void
    {
        $rater = new FrameworkManuscriptRater;
        $planned = $rater->rate('Baseline learning gap data align with the DepEd curriculum. The project will reach multiple schools. A post-test evaluation will be conducted next year.');
        $reported = $rater->rate('Baseline learning gap data align with the DepEd curriculum. The project reached multiple schools. Post-test results showed improved reading scores.');

        $this->assertSame(4, $planned['ratings']['division_impact']);
        $this->assertSame(5, $reported['ratings']['division_impact']);
        $this->assertStringContainsString('reported outcome', $planned['notes']);
    }

    public function test_school_assessed_manuscript_with_documented_signals_can_meet_threshold(): void
    {
        $rated = (new FrameworkManuscriptRater)->rate(
            'Baseline learning gap. The curriculum uses contextualized activity sheets and a flexible delivery plan. '
            .'An implementation guide, teacher training, and weekly schedule support adoption. '
            .'Capacity building and monitoring and evaluation continue each term. '
            .'Existing materials are reusable and low-cost.'
        );

        $this->assertGreaterThanOrEqual(75, (new ScalabilityFramework)->assess($rated['ratings'])['score']);
        $this->assertStringContainsString('school-assessed submission', $rated['notes']);
    }
}

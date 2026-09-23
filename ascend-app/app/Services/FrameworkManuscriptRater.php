<?php

namespace App\Services;

class FrameworkManuscriptRater
{
    /**
     * Each indicator counts once, regardless of how often its words appear.
     * The labels are saved with the assessment so an administrator can review
     * why the initial rating was assigned.
     */
    private const INDICATORS = [
        'division_impact' => [
            'identified learner need' => '/\b(?:baseline|learning gap|needs assessment|struggling learners?|target learners?)\b/iu',
            'reported outcome' => '/\b(?:results showed|post[ -]?test results?|improved from\s+\d|increased from\s+\d|increase of\s+\d|improvement of\s+\d)\b/iu',
            'reach beyond one classroom' => '/\b(?:multiple schools|across schools|district[ -]?wide|division[ -]?wide|school[ -]?wide|replicat(?:ed|ion))\b/iu',
            'curriculum or DepEd alignment' => '/\b(?:deped|curriculum|learning competenc(?:y|ies)|matatag)\b/iu',
        ],
        'context_adaptability' => [
            'adaptation to local context' => '/\b(?:adapt(?:ed|able|ation)|localiz(?:ed|ation)|contextualiz(?:ed|ation))\b/iu',
            'use across school settings' => '/\b(?:different school contexts|multiple schools|urban and rural|across schools|receiving schools)\b/iu',
            'differentiated or inclusive delivery' => '/\b(?:differentiated|inclusive|diverse learners|different grade levels|learner profiles)\b/iu',
            'flexible delivery or materials' => '/\b(?:modular|offline|low[ -]?bandwidth|flexible delivery|alternative materials)\b/iu',
        ],
        'adoption_ease' => [
            'implementation steps' => '/\b(?:implementation plan|step[ -]?by[ -]?step|implementation guide|procedure|workflow)\b/iu',
            'orientation or training' => '/\b(?:teacher training|teacher orientation|staff training|capacity building|training session)\b/iu',
            'ready-to-use materials' => '/\b(?:manual|toolkit|workbook|lesson plan|activity sheets?|teaching guide)\b/iu',
            'schedule or timeline' => '/\b(?:timeline|schedule|implementation period|weekly plan|monthly plan)\b/iu',
        ],
        'sustainability' => [
            'institutional ownership' => '/\b(?:institutionaliz(?:ed|ation)|school improvement plan|policy adoption|memorandum|designated owner)\b/iu',
            'recurring resources' => '/\b(?:annual budget|recurring budget|budget allocation|sustained funding|funding plan)\b/iu',
            'continuing staff capacity' => '/\b(?:train[ -]?the[ -]?trainer|capacity building|continuing training|teacher mentoring)\b/iu',
            'ongoing monitoring' => '/\b(?:ongoing monitoring|monitoring and evaluation|follow[ -]?up review|review cycle|annual evaluation)\b/iu',
        ],
        'resource_efficiency' => [
            'cost or budget details' => '/\b(?:itemized budget|budget breakdown|unit cost|cost estimate|resource allocation)\b/iu',
            'reuse of available resources' => '/\b(?:existing materials|reus(?:e|ed|able)|recycled|low[ -]?cost|no additional cost)\b/iu',
            'staffing or materials plan' => '/\b(?:staff allocation|teacher time|volunteer support|materials list|resource plan)\b/iu',
            'savings or cost comparison' => '/\b(?:cost savings|lower cost|reduced expenses|cost comparison|cost[ -]?effective)\b/iu',
        ],
    ];

    /**
     * @return array{ratings: array<string, int>, notes: string}
     */
    public function rate(string $manuscriptText): array
    {
        $ratings = [];
        $notes = [
            'Automatic manuscript review of a school-assessed submission. The provisional baseline is 3/5 per criterion; one documented indicator raises it to 4/5 and three distinct indicators raise it to 5/5. Division impact cannot reach 5/5 without a reported outcome. Manuscript claims have not been independently verified.',
        ];

        foreach (self::INDICATORS as $criterion => $indicators) {
            $found = [];
            $missing = [];

            foreach ($indicators as $label => $pattern) {
                if (preg_match($pattern, $manuscriptText) === 1) {
                    $found[] = $label;
                } else {
                    $missing[] = $label;
                }
            }

            $rating = 3 + (count($found) >= 1 ? 1 : 0) + (count($found) >= 3 ? 1 : 0);

            // Reach or alignment alone cannot establish exceptional division impact.
            if ($criterion === 'division_impact' && ! in_array('reported outcome', $found, true)) {
                $rating = min($rating, 4);
            }

            $ratings[$criterion] = $rating;
            $label = ScalabilityFramework::CRITERIA[$criterion]['label'];
            $notes[] = "{$label}: {$rating}/5. Found: ".($found ? implode(', ', $found) : 'none')
                .'. Not found: '.($missing ? implode(', ', $missing) : 'none').'.';
        }

        return ['ratings' => $ratings, 'notes' => implode("\n", $notes)];
    }
}

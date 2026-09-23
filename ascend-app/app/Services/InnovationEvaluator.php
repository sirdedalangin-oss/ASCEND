<?php

namespace App\Services;

use App\Models\EvaluationCriterion;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Smalot\PdfParser\Parser;
use Throwable;
use ZipArchive;

class InnovationEvaluator
{
    /**
     * @param  array{manuscript_file_url: string, original_filename?: string|null, learning_focus?: string|null, key_stage: string, grade_levels: string}  $input
     * @return array<string, mixed>
     */
    public function evaluate(array $input): array
    {
        $storedPath = $this->resolveStoredPath($input['manuscript_file_url']);
        $document = $this->readDocument($storedPath);
        $content = $document['text'];
        $originalName = $input['original_filename'] ?: basename($storedPath);
        $title = $this->detectTitle($document['title'], $content, $originalName);
        $haystack = Str::lower($title.' '.$content);
        $wordCount = str_word_count($content);

        $literacyHits = $this->hits($haystack, ['literacy', 'reading', 'phonics', 'phonological', 'comprehension', 'vocabulary', 'writing', 'reader']);
        $numeracyHits = $this->hits($haystack, ['numeracy', 'mathematics', 'math', 'number', 'arithmetic', 'counting', 'calculation']);
        $learningFocus = $literacyHits > $numeracyHits ? 'literacy' : ($input['learning_focus'] ?? 'numeracy');

        $needKeywords = ['baseline', 'assessment', 'learning gap', 'struggling', 'low emerging', 'data', 'needs analysis', 'target learners'];
        $alignmentKeywords = ['deped', 'curriculum', 'learning competency', 'strategic', 'republic act', 'ra 10533', 'matatag'];
        $innovationKeywords = ['innovative', 'novel', 'localized', 'contextualized', 'multimodal', 'audio-visual', 'digital', 'play-based', 'gamified'];
        $assessmentKeywords = ['pre-test', 'pretest', 'post-test', 'posttest', 'weekly assessment', 'monitoring', 'evaluation', 'egra', 'mcrla'];
        $outcomeKeywords = ['results showed', 'improved from', 'increased from', 'decreased from', 'after implementation', 'post-test results', 'statistically significant'];
        $scaleKeywords = ['replicate', 'scalable', 'division-wide', 'district', 'multiple schools', 'teacher orientation', 'training', 'workbook', 'implementation guide'];
        $sustainabilityKeywords = ['sustainability', 'annual budget', 'budget allocation', 'institutionalized', 'policy', 'memorandum', 'capacity building', 'partnership', 'annual implementation'];
        $documentationKeywords = ['rationale', 'objectives', 'implementation plan', 'methodology', 'monitoring and evaluation', 'budget', 'references', 'timeline'];

        $needHits = $this->hits($haystack, $needKeywords);
        $alignmentHits = $this->hits($haystack, $alignmentKeywords);
        $innovationHits = $this->hits($haystack, $innovationKeywords);
        $assessmentHits = $this->hits($haystack, $assessmentKeywords);
        $outcomeHits = $this->hits($haystack, $outcomeKeywords);
        $scaleHits = $this->hits($haystack, $scaleKeywords);
        $sustainabilityHits = $this->hits($haystack, $sustainabilityKeywords);
        $documentationHits = $this->hits($haystack, $documentationKeywords);
        $hasBudget = $this->hits($haystack, ['budget', 'cost', 'funding', 'resource allocation']) > 0;
        $hasMonitoringPlan = $this->hits($haystack, ['monitoring matrix', 'monitoring and evaluation', 'data aggregation', 'reporting protocol']) > 0;
        $hasActualOutcomes = $outcomeHits > 0;

        $scores = [
            'relevance_score' => $this->score(55 + min(20, $needHits * 3) + min(12, $alignmentHits * 2) + min(8, ($literacyHits + $numeracyHits))),
            'innovativeness_score' => $this->score(48 + min(30, $innovationHits * 3)),
            'effectiveness_score' => $this->score(42 + min(14, $assessmentHits * 2) + min(30, $outcomeHits * 5) + min(8, $needHits)),
            'scalability_score' => $this->score(48 + min(32, $scaleHits * 3) + ($wordCount > 1200 ? 5 : 0)),
            'sustainability_score' => $this->score(45 + min(35, $sustainabilityHits * 4) + ($hasMonitoringPlan ? 6 : 0) + ($hasBudget ? 6 : 0)),
            'documentation_score' => $this->score(50 + min(20, $documentationHits * 2) + ($wordCount > 500 ? 7 : 0) + ($wordCount > 1500 ? 7 : 0) + ($wordCount > 3000 ? 6 : 0) - ($hasBudget ? 0 : 5) - ($hasMonitoringPlan ? 0 : 5)),
        ];

        if (! $hasActualOutcomes) {
            $scores['effectiveness_score'] = min(58, $scores['effectiveness_score']);
        }

        $weights = EvaluationCriterion::weights();
        $total = round(collect($scores)->map(
            fn (float|int $score, string $key): float => $score * $weights[$key] / 100
        )->sum(), 2);
        $isScalable = $total >= 75;

        $justifications = [
            'relevance' => $this->criterionJustification(
                $content,
                [...$needKeywords, ...$alignmentKeywords],
                'The manuscript connects the intervention to an identified learner need and DepEd priorities.',
                'The manuscript provides limited explicit baseline or curriculum-alignment evidence.',
            ),
            'innovativeness' => $this->criterionJustification(
                $content,
                $innovationKeywords,
                'The design includes contextualized or multimodal features that distinguish it from a basic classroom routine.',
                'The manuscript does not clearly distinguish the approach from established classroom practice.',
            ),
            'effectiveness' => $this->effectivenessJustification($content, $assessmentKeywords, $hasActualOutcomes),
            'scalability' => $this->criterionJustification(
                $content,
                $scaleKeywords,
                'The manuscript identifies delivery structures, materials, or training that can support replication.',
                'The replication package, training requirements, and cross-school controls need more detail.',
            ),
            'sustainability' => $this->criterionJustification(
                $content,
                $sustainabilityKeywords,
                'The manuscript identifies institutional support or capacity measures that can continue beyond the initial cycle.',
                'Long-term ownership, recurring resources, and policy integration are not fully established.',
            ),
            'documentation' => $this->documentationJustification($wordCount, $hasBudget, $hasMonitoringPlan),
        ];
        $analysis = [
            "RELEVANCE & RESPONSIVENESS (Score: {$scores['relevance_score']}/100, Weight: {$weights['relevance_score']}%)\n{$justifications['relevance']}",
            "INNOVATIVENESS (Score: {$scores['innovativeness_score']}/100, Weight: {$weights['innovativeness_score']}%)\n{$justifications['innovativeness']}",
            "EFFECTIVENESS & IMPACT (Score: {$scores['effectiveness_score']}/100, Weight: {$weights['effectiveness_score']}%)\n{$justifications['effectiveness']}",
            "SCALABILITY & REPLICABILITY (Score: {$scores['scalability_score']}/100, Weight: {$weights['scalability_score']}%)\n{$justifications['scalability']}",
            "SUSTAINABILITY (Score: {$scores['sustainability_score']}/100, Weight: {$weights['sustainability_score']}%)\n{$justifications['sustainability']}",
            "QUALITY OF DOCUMENTATION (Score: {$scores['documentation_score']}/100, Weight: {$weights['documentation_score']}%)\n{$justifications['documentation']}",
        ];

        return [
            'detected_title' => $title,
            'summary' => $this->buildSummary($content, $learningFocus, $input),
            'detected_learning_focus' => $learningFocus,
            ...$scores,
            'total_score' => $total,
            'is_scalable' => $isScalable,
            'ai_analysis' => implode("\n\n", $analysis),
            'recommendation' => $this->recommendation($isScalable, $hasActualOutcomes, $hasBudget, $hasMonitoringPlan),
            'strengths' => $this->strengths($learningFocus, $scores, $hasActualOutcomes),
            'areas_for_improvement' => $this->areasForImprovement($scores, $hasActualOutcomes, $hasBudget, $hasMonitoringPlan),
            'evaluation_method' => 'local_document_analysis',
            'evaluation_model' => null,
        ];
    }

    private function resolveStoredPath(string $fileUrl): string
    {
        $urlPath = urldecode(ltrim((string) parse_url($fileUrl, PHP_URL_PATH), '/'));
        $path = Str::after($urlPath, 'storage/');

        if (! Str::startsWith($path, 'manuscripts/') || ! Storage::disk('public')->exists($path)) {
            throw new RuntimeException('The uploaded manuscript could not be found. Please upload it again.');
        }

        return $path;
    }

    /**
     * @return array{text: string, title: string}
     */
    private function readDocument(string $storedPath): array
    {
        $extension = Str::lower(pathinfo($storedPath, PATHINFO_EXTENSION));

        try {
            $document = match ($extension) {
                'txt', 'md' => ['text' => Storage::disk('public')->get($storedPath), 'title' => ''],
                'pdf' => $this->readPdf($storedPath),
                'docx' => $this->readDocx($storedPath),
                'doc' => throw new RuntimeException('Legacy DOC files cannot be read locally. Convert the manuscript to PDF or DOCX and upload it again.'),
                default => throw new RuntimeException('This manuscript format is not supported.'),
            };
        } catch (RuntimeException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);

            throw new RuntimeException('The manuscript text could not be read. Export a searchable PDF or DOCX and upload it again.', previous: $exception);
        }

        $text = $this->normalizeText($document['text']);

        if (Str::length($text) < 80) {
            throw new RuntimeException('No readable manuscript text was found. Export a searchable PDF or DOCX and upload it again.');
        }

        return ['text' => Str::limit($text, 250000, ''), 'title' => trim($document['title'])];
    }

    /**
     * @return array{text: string, title: string}
     */
    private function readPdf(string $storedPath): array
    {
        $pdf = (new Parser)->parseFile(Storage::disk('public')->path($storedPath));
        $details = $pdf->getDetails();

        return [
            'text' => $pdf->getText(),
            'title' => is_string($details['Title'] ?? null) ? $details['Title'] : '',
        ];
    }

    /**
     * @return array{text: string, title: string}
     */
    private function readDocx(string $storedPath): array
    {
        $archive = new ZipArchive;

        if ($archive->open(Storage::disk('public')->path($storedPath)) !== true) {
            throw new RuntimeException('The DOCX manuscript could not be opened.');
        }

        $documentXml = $archive->getFromName('word/document.xml') ?: '';
        $coreXml = $archive->getFromName('docProps/core.xml') ?: '';
        $archive->close();
        $documentXml = str_replace(['</w:p>', '</w:tr>'], ["\n", "\n"], $documentXml);
        $title = '';

        if (preg_match('/<dc:title[^>]*>(.*?)<\/dc:title>/su', $coreXml, $match) === 1) {
            $title = html_entity_decode(strip_tags($match[1]), ENT_QUOTES | ENT_XML1, 'UTF-8');
        }

        return [
            'text' => html_entity_decode(strip_tags($documentXml), ENT_QUOTES | ENT_XML1, 'UTF-8'),
            'title' => $title,
        ];
    }

    private function normalizeText(string $text): string
    {
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $text = preg_replace('/[\t ]+/u', ' ', $text) ?? $text;
        $text = preg_replace('/\n{3,}/u', "\n\n", $text) ?? $text;

        return trim($text);
    }

    private function detectTitle(string $documentTitle, string $content, string $originalName): string
    {
        if (Str::length($documentTitle) >= 8 && Str::lower($documentTitle) !== 'untitled') {
            return Str::limit(Str::squish($documentTitle), 255, '');
        }

        $lines = collect(preg_split('/\R/u', $content) ?: [])
            ->map(fn (string $line): string => Str::squish($line))
            ->filter(fn (string $line): bool => Str::length($line) >= 8 && Str::length($line) <= 255)
            ->take(60);
        $candidate = $lines->sortByDesc(function (string $line): int {
            $lower = Str::lower($line);
            $projectSignal = Str::contains($lower, ['project ', 'program ', 'innovation ', 'initiative ']) ? 100 : 0;
            $headingPenalty = Str::contains($lower, ['department of education', 'schools division office', 'table of contents']) ? 80 : 0;

            return $projectSignal + min(80, Str::length($line)) - $headingPenalty;
        })->first();

        return Str::limit($candidate ?: Str::headline(pathinfo($originalName, PATHINFO_FILENAME)), 255, '');
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function buildSummary(string $content, string $learningFocus, array $input): string
    {
        $sentences = collect(preg_split('/(?<=[.!?])\s+|\R+/u', $content) ?: [])
            ->map(fn (string $sentence): string => Str::squish($sentence))
            ->filter(fn (string $sentence): bool => Str::length($sentence) >= 45 && Str::length($sentence) <= 420);
        $priority = $sentences->filter(fn (string $sentence): bool => Str::contains(Str::lower($sentence), [
            'aims to', 'designed to', 'targets', 'target learners', 'intervention', 'implementation', 'objective', 'weeks', 'months',
        ]))->take(3);
        $selected = $priority->count() >= 2 ? $priority : $sentences->take(3);

        if ($selected->isEmpty()) {
            return "A {$learningFocus}-focused educational innovation submitted for {$input['key_stage']} ({$input['grade_levels']}) and evaluated against the approved ASCEND weighted criteria.";
        }

        return Str::limit($selected->implode(' '), 900, '');
    }

    /**
     * @param  list<string>  $keywords
     */
    private function criterionJustification(string $content, array $keywords, string $positive, string $fallback): string
    {
        $evidence = $this->evidenceSentence($content, $keywords);

        return $evidence === null ? $fallback : $positive.' Evidence noted: “'.$evidence.'”';
    }

    /**
     * @param  list<string>  $assessmentKeywords
     */
    private function effectivenessJustification(string $content, array $assessmentKeywords, bool $hasActualOutcomes): string
    {
        $evidence = $this->evidenceSentence($content, $assessmentKeywords);
        $base = $evidence === null
            ? 'The manuscript provides limited measurable assessment evidence.'
            : 'The manuscript defines an assessment or monitoring approach. Evidence noted: “'.$evidence.'”';

        return $hasActualOutcomes
            ? $base.' It also reports post-implementation outcome language that supports an impact claim.'
            : $base.' However, no clear post-implementation result was detected, so intended targets were not treated as achieved outcomes.';
    }

    private function documentationJustification(int $wordCount, bool $hasBudget, bool $hasMonitoringPlan): string
    {
        $parts = ["The locally extracted manuscript contains approximately {$wordCount} words."];
        $parts[] = $hasBudget ? 'A budget or resource provision is referenced.' : 'A clear budget or resource allocation was not detected.';
        $parts[] = $hasMonitoringPlan ? 'A monitoring and reporting structure is described.' : 'A complete monitoring, aggregation, and reporting protocol was not detected.';

        return implode(' ', $parts);
    }

    private function recommendation(bool $isScalable, bool $hasActualOutcomes, bool $hasBudget, bool $hasMonitoringPlan): string
    {
        if ($isScalable && $hasActualOutcomes) {
            return 'The evidence and weighted rubric support validation for scaling, subject to panel confirmation of the reported outcomes and implementation fidelity. Preserve the documented controls and monitor results across receiving schools.';
        }

        $gaps = collect([
            ! $hasActualOutcomes ? 'post-implementation learner outcome data' : null,
            ! $hasBudget ? 'a budget and resource plan' : null,
            ! $hasMonitoringPlan ? 'a monitoring and reporting protocol' : null,
        ])->filter()->implode(', ');

        return 'The innovation merits continued validation but is not yet sufficiently evidenced for wider scaling. Strengthen '.($gaps ?: 'the replication and sustainability evidence').' before a final panel decision.';
    }

    /**
     * @param  array<string, int>  $scores
     * @return list<string>
     */
    private function strengths(string $learningFocus, array $scores, bool $hasActualOutcomes): array
    {
        $strengths = ["Clear connection to a priority {$learningFocus} learning need"];

        if ($scores['relevance_score'] >= 75) {
            $strengths[] = 'Strong grounding in learner needs, assessment data, or DepEd priorities';
        }
        if ($scores['scalability_score'] >= 70) {
            $strengths[] = 'Replicable delivery elements such as training, materials, or multi-school structures';
        }
        if ($scores['innovativeness_score'] >= 65) {
            $strengths[] = 'Contextualized, multimodal, or creative features beyond a basic classroom routine';
        }
        if ($hasActualOutcomes) {
            $strengths[] = 'Reported post-implementation evidence that can support impact validation';
        }
        $strengths[] = 'Structured manuscript suitable for criterion-by-criterion panel review';

        return collect($strengths)->unique()->take(5)->values()->all();
    }

    /**
     * @param  array<string, int>  $scores
     * @return list<string>
     */
    private function areasForImprovement(array $scores, bool $hasActualOutcomes, bool $hasBudget, bool $hasMonitoringPlan): array
    {
        $areas = [];

        if (! $hasActualOutcomes) {
            $areas[] = 'Add baseline and post-implementation learner outcome data, clearly separating targets from achieved results';
        }
        if (! $hasBudget) {
            $areas[] = 'Include a detailed budget and resource allocation plan for implementation and replication';
        }
        if (! $hasMonitoringPlan) {
            $areas[] = 'Define how data will be aggregated, reported, reviewed, and used for implementation decisions';
        }
        if ($scores['innovativeness_score'] < 75) {
            $areas[] = 'Explain how the approach differs from existing classroom practice and comparable interventions';
        }
        if ($scores['sustainability_score'] < 75) {
            $areas[] = 'Specify long-term ownership, policy integration, recurring resources, and accountable implementers';
        }
        if (count($areas) < 3) {
            $areas[] = 'Document fidelity controls and the minimum training and materials required at receiving schools';
        }

        return collect($areas)->unique()->take(5)->values()->all();
    }

    /**
     * @param  list<string>  $keywords
     */
    private function evidenceSentence(string $content, array $keywords): ?string
    {
        foreach (preg_split('/(?<=[.!?])\s+|\R+/u', $content) ?: [] as $sentence) {
            $sentence = Str::squish($sentence);

            if (Str::length($sentence) >= 30 && Str::contains(Str::lower($sentence), $keywords)) {
                return Str::limit($sentence, 280, '…');
            }
        }

        return null;
    }

    /**
     * @param  list<string>  $keywords
     */
    private function hits(string $text, array $keywords): int
    {
        return collect($keywords)->sum(fn (string $keyword): int => substr_count($text, $keyword));
    }

    private function score(float $value): int
    {
        return (int) max(0, min(95, round($value)));
    }
}

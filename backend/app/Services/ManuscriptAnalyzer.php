<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Smalot\PdfParser\Parser;
use Throwable;
use ZipArchive;

class ManuscriptAnalyzer
{
    /**
     * @param  array{manuscript_file_url: string, original_filename?: string|null, learning_focus?: string|null, key_stage: string, grade_levels: string}  $input
     * @return array{detected_title: string, detected_learning_focus: string, summary: string}
     */
    public function analyze(array $input): array
    {
        $storedPath = $this->resolveStoredPath($input['manuscript_file_url']);
        $document = $this->readDocument($storedPath);
        $content = $document['text'];
        $originalName = ($input['original_filename'] ?? null) ?: basename($storedPath);
        $title = $this->detectTitle($document['title'], $content, $originalName);
        $haystack = Str::lower($title.' '.$content);

        $literacyScore = $this->weightedHits($haystack, [
            'innovation area: literacy' => 100,
            'innovation area: reading' => 100,
            'literacy' => 30,
            'oral reading' => 25,
            'reading' => 18,
            'phonics' => 18,
            'phonological' => 18,
            'comprehension' => 15,
            'vocabulary' => 15,
            'writing' => 12,
            'reader' => 10,
            'innovation area: inclusive education' => 40,
            'innovation area: teacher development' => 40,
            'innovation area: environmental education' => 40,
            'innovation area: learner wellness' => 40,
            'innovation area: blended/home-school learning' => 40,
            'language' => 5,
            'differentiated' => 5,
            'learning packet' => 5,
        ]);
        $numeracyScore = $this->weightedHits($haystack, [
            'innovation area: numeracy' => 100,
            'numeracy' => 30,
            'mathematics' => 25,
            'number sense' => 25,
            'arithmetic' => 18,
            'counting' => 15,
            'calculation' => 15,
            'math station' => 15,
            'number talk' => 15,
            'innovation area: science' => 40,
            'innovation area: ict' => 40,
            'innovation area: school data analytics' => 40,
            'experiment' => 7,
            'data analytics' => 7,
            'spreadsheet' => 5,
            'dashboard' => 5,
            'measurement' => 5,
        ]);
        $detectedFocus = $numeracyScore > $literacyScore ? 'numeracy' : 'literacy';
        $learningFocus = $input['learning_focus'] ?? $detectedFocus;

        return [
            'detected_title' => $title,
            'detected_learning_focus' => $learningFocus,
            'summary' => $this->buildSummary($content, $learningFocus, $input),
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
            return "A {$learningFocus}-focused educational innovation submitted for {$input['key_stage']} ({$input['grade_levels']}) and awaiting panel assessment against the Innovation Scalability Framework.";
        }

        return Str::limit($selected->implode(' '), 900, '');
    }

    /**
     * @param  array<string, int>  $signals
     */
    private function weightedHits(string $text, array $signals): int
    {
        return collect($signals)->sum(
            fn (int $weight, string $signal): int => substr_count($text, $signal) * $weight
        );
    }
}

<?php

namespace App\Console\Commands;

use App\Models\Innovation;
use App\Models\Keyword;
use App\Services\ManuscriptAnalyzer;
use Illuminate\Console\Command;
use Throwable;

class ReclassifyInnovationFocus extends Command
{
    protected $signature = 'innovations:reclassify-focus {--all : Reanalyze every innovation, not only legacy other values}';

    protected $description = 'Reclassify stored manuscripts as literacy or numeracy';

    public function handle(ManuscriptAnalyzer $analyzer): int
    {
        $query = Innovation::query()
            ->whereNotNull('manuscript_file_url')
            ->when(! $this->option('all'), fn ($query) => $query->where('learning_focus', 'other'));
        $updated = 0;
        $failed = 0;

        $query->orderBy('id')->each(function (Innovation $innovation) use ($analyzer, &$updated, &$failed): void {
            try {
                $result = $analyzer->analyze([
                    'manuscript_file_url' => $innovation->manuscript_file_url,
                    'original_filename' => basename($innovation->manuscript_file_url),
                    'key_stage' => $innovation->key_stage ?: 'ALL',
                    'grade_levels' => $innovation->grade_levels ?: 'School-wide',
                ]);
                $focus = $result['detected_learning_focus'];
                $innovation->update(['learning_focus' => $focus]);
                $keyword = Keyword::firstOrCreate(
                    ['slug' => $focus],
                    ['name' => $focus, 'category' => $focus],
                );
                $innovation->keywords()->detach(Keyword::query()->where('slug', 'other')->pluck('id'));
                $innovation->keywords()->syncWithoutDetaching([$keyword->id]);
                $updated++;
                $this->line("#{$innovation->id} {$innovation->title}: {$focus}");
            } catch (Throwable $exception) {
                $failed++;
                $this->warn("#{$innovation->id} {$innovation->title}: {$exception->getMessage()}");
            }
        });

        $this->info("Reclassified {$updated} innovation(s); {$failed} failed.");

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}

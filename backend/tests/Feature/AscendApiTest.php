<?php

namespace Tests\Feature;

use App\Models\Innovation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AscendApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_log_in_and_read_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Local User',
            'email' => 'local@example.com',
        ]);
        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['access_token', 'user' => ['id', 'email', 'role']]);

        $this->withToken($login->json('access_token'))
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('email', 'local@example.com')
            ->assertJsonPath('role', 'user');
    }

    public function test_submitting_an_innovation_cannot_spoof_a_framework_decision(): void
    {
        $token = $this->registerToken();
        $created = $this->withToken($token)->postJson('/api/innovations', [
            'title' => 'Numeracy Lab',
            'learning_focus' => 'numeracy',
            'status' => 'validated',
            'total_score' => 100,
            'framework_score' => 100,
            'framework_level' => 'Platinum Scalable Innovation',
            'is_scalable' => true,
        ])->assertCreated()
            ->assertJsonPath('status', 'submitted')
            ->assertJsonPath('framework_score', null)
            ->assertJsonPath('is_scalable', false);

        $this->withToken($token)->getJson('/api/innovations?is_scalable=true')
            ->assertOk()
            ->assertJsonCount(0);

        $this->withToken($token)->deleteJson('/api/innovations/'.$created->json('id'))
            ->assertOk();
    }

    public function test_upload_creates_an_unassessed_innovation(): void
    {
        Storage::fake('public');
        $token = $this->registerToken();
        $keyword = $this->withToken($token)->postJson('/api/keywords', [
            'name' => 'Guided Reading',
            'category' => 'literacy',
        ])->assertCreated();
        $file = UploadedFile::fake()->createWithContent(
            'reading-lab.txt',
            'Reading literacy baseline data improved results across schools with teacher training and monitoring.'
        );

        $upload = $this->withToken($token)->post('/api/uploads', ['file' => $file])
            ->assertCreated()
            ->assertJsonStructure(['file_url', 'original_name']);

        $submission = $this->withToken($token)->postJson('/api/manuscripts/submit', [
            'manuscript_file_url' => $upload->json('file_url'),
            'original_filename' => 'Project_TUNOG!!!__Final--2026.txt',
            'key_stage' => 'KS1',
            'grade_levels' => 'Grades 1-3',
            'author' => 'Maria Santos',
            'school' => 'Bignay Elementary School',
            'district' => 'District I',
            'keyword_ids' => [$keyword->json('id')],
        ])->assertCreated()
            ->assertJsonPath('detected_title', 'Project TUNOG Final 2026')
            ->assertJsonPath('detected_learning_focus', 'literacy')
            ->assertJsonPath('keywords.0.name', 'guided reading')
            ->assertJsonPath('status', 'submitted');

        $this->assertDatabaseHas('innovations', [
            'id' => $submission->json('innovation_id'),
            'author' => 'Maria Santos',
            'status' => 'submitted',
            'framework_score' => null,
            'is_scalable' => false,
        ]);
        $this->assertDatabaseHas('innovation_keyword', [
            'innovation_id' => $submission->json('innovation_id'),
            'keyword_id' => $keyword->json('id'),
        ]);
    }

    public function test_keywords_are_categorized_and_grade_level_must_match_key_stage(): void
    {
        $token = $this->registerToken();

        $this->withToken($token)->getJson('/api/keywords')
            ->assertOk()
            ->assertJsonPath('categories.ict', 'ICT & Digital Innovation');

        $created = $this->withToken($token)->postJson('/api/keywords', [
            'name' => '  Robotics Lab  ',
            'category' => 'ict',
        ])->assertCreated()
            ->assertJsonPath('name', 'robotics lab')
            ->assertJsonPath('slug', 'robotics-lab');

        $this->assertDatabaseHas('keywords', [
            'id' => $created->json('id'),
            'category' => 'ict',
        ]);

        $this->withToken($token)->postJson('/api/innovations', [
            'title' => 'Mismatched Grade',
            'learning_focus' => 'literacy',
            'key_stage' => 'KS1',
            'grade_levels' => 'Grade 10',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('grade_levels');
    }

    public function test_manuscript_focus_is_always_classified_as_literacy_or_numeracy(): void
    {
        Storage::fake('public');
        $token = $this->registerToken();
        $samples = [
            'science-lab.txt' => [
                'text' => 'INNOVATION AREA: SCIENCE. Learners use experiment kits, measurement activities, observation tables, and evidence-based reflection to investigate classroom science questions.',
                'expected' => 'numeracy',
            ],
            'inclusive-learning.txt' => [
                'text' => 'INNOVATION AREA: INCLUSIVE EDUCATION. Learners receive differentiated activities, accessible visual instructions, peer support routines, and language scaffolds throughout each lesson.',
                'expected' => 'literacy',
            ],
            'general-intervention.txt' => [
                'text' => 'A structured school intervention provides scheduled learner activities, weekly progress checks, stakeholder participation, and documented recommendations for continuous improvement.',
                'expected' => 'literacy',
            ],
        ];

        foreach ($samples as $filename => $sample) {
            $upload = $this->withToken($token)->post('/api/uploads', [
                'file' => UploadedFile::fake()->createWithContent($filename, $sample['text']),
            ])->assertCreated();

            $this->withToken($token)->postJson('/api/manuscripts/submit', [
                'manuscript_file_url' => $upload->json('file_url'),
                'original_filename' => $filename,
                'key_stage' => 'ALL',
                'grade_levels' => 'School-wide',
            ])->assertCreated()
                ->assertJsonPath('detected_learning_focus', $sample['expected']);
        }

        $this->assertDatabaseMissing('innovations', ['learning_focus' => 'other']);
    }

    public function test_framework_endpoint_contains_the_document_weights_and_levels(): void
    {
        $token = $this->registerToken();

        $this->withToken($token)->getJson('/api/scalability-framework')
            ->assertOk()
            ->assertJsonCount(5, 'criteria')
            ->assertJsonPath('criteria.0.key', 'division_impact')
            ->assertJsonPath('criteria.0.weight', 30)
            ->assertJsonPath('criteria.1.weight', 20)
            ->assertJsonPath('criteria.2.weight', 20)
            ->assertJsonPath('criteria.3.weight', 15)
            ->assertJsonPath('criteria.4.weight', 15)
            ->assertJsonPath('threshold', 75)
            ->assertJsonPath('levels.0.title', 'Platinum Scalable Innovation')
            ->assertJsonPath('levels.4.title', 'Qualified Scalable Innovation')
            ->assertJsonPath('levels.5.title', 'Not Yet Recommended for Scaling');
    }

    public function test_admin_assessment_uses_five_ratings_to_decide_scalability(): void
    {
        $token = $this->adminToken();
        $innovation = $this->withToken($token)->postJson('/api/innovations', [
            'title' => 'Project COUNT',
            'learning_focus' => 'numeracy',
            'key_stage' => 'KS1',
            'grade_levels' => 'Grades 1-3',
        ])->assertCreated();
        $id = $innovation->json('id');

        $payload = $this->assessmentPayload($id, [
            'division_impact' => 4,
            'context_adaptability' => 3,
            'adoption_ease' => 3,
            'sustainability' => 5,
            'resource_efficiency' => 4,
        ]);

        $this->withToken($token)->postJson('/api/evaluations', $payload)
            ->assertCreated()
            ->assertJsonPath('framework_score', 75)
            ->assertJsonPath('framework_level', 'Qualified Scalable Innovation')
            ->assertJsonPath('is_scalable', true)
            ->assertJsonPath('evaluation_method', 'manual_panel_evaluation');

        $this->withToken($token)->postJson('/api/evaluations', $payload)->assertConflict();

        $this->withToken($token)->putJson("/api/evaluations/{$id}", [
            ...collect($payload)->except('innovation_id')->all(),
            'status' => 'validated',
        ])->assertOk()->assertJsonPath('framework_score', 75);

        $this->withToken($token)->getJson('/api/innovations?is_scalable=true&status=validated')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $id);

        $this->withToken($token)->putJson("/api/evaluations/{$id}", [
            ...collect($payload)->except('innovation_id')->all(),
            'status' => 'validated',
            'framework_ratings' => [
                'division_impact' => 3,
                'context_adaptability' => 4,
                'adoption_ease' => 4,
                'sustainability' => 4,
                'resource_efficiency' => 4,
            ],
        ])->assertOk()
            ->assertJsonPath('framework_score', 74)
            ->assertJsonPath('framework_level', 'Not Yet Recommended for Scaling')
            ->assertJsonPath('is_scalable', false)
            ->assertJsonPath('status', 'validated');

        $this->withToken($token)->getJson('/api/innovations?is_scalable=true&status=validated')
            ->assertOk()
            ->assertJsonCount(0);

        $this->withToken($token)->deleteJson("/api/evaluations/{$id}")
            ->assertOk()
            ->assertJsonPath('innovation.framework_score', null)
            ->assertJsonPath('innovation.status', 'submitted');
    }

    public function test_regular_user_cannot_record_change_or_remove_framework_assessments(): void
    {
        $adminToken = $this->adminToken();
        $innovation = $this->withToken($adminToken)->postJson('/api/innovations', [
            'title' => 'Panel Only',
            'learning_focus' => 'literacy',
        ])->assertCreated();
        $id = $innovation->json('id');
        $payload = $this->assessmentPayload($id);
        $userToken = $this->registerToken();

        $this->withToken($userToken)->postJson('/api/evaluations', $payload)->assertForbidden();
        $this->withToken($adminToken)->postJson('/api/evaluations', $payload)->assertCreated();
        $this->withToken($userToken)->putJson("/api/evaluations/{$id}", collect($payload)->except('innovation_id')->all())->assertForbidden();
        $this->withToken($userToken)->deleteJson("/api/evaluations/{$id}")->assertForbidden();
        $this->withToken($userToken)->deleteJson("/api/innovations/{$id}")->assertForbidden();
    }

    public function test_assessment_requires_all_five_integer_ratings_from_one_to_five(): void
    {
        $token = $this->adminToken();
        $innovation = $this->withToken($token)->postJson('/api/innovations', [
            'title' => 'Invalid Ratings',
            'learning_focus' => 'numeracy',
        ])->assertCreated();
        $payload = $this->assessmentPayload($innovation->json('id'));
        unset($payload['framework_ratings']['resource_efficiency']);
        $payload['framework_ratings']['division_impact'] = 6;

        $this->withToken($token)->postJson('/api/evaluations', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['framework_ratings', 'framework_ratings.division_impact', 'framework_ratings.resource_efficiency']);
    }

    public function test_historical_six_criterion_total_does_not_count_as_framework_assessment(): void
    {
        $token = $this->registerToken();
        $innovation = $this->withToken($token)->postJson('/api/innovations', [
            'title' => 'Historical Evaluation',
            'learning_focus' => 'numeracy',
        ])->assertCreated();
        Innovation::findOrFail($innovation->json('id'))->update(['total_score' => 95, 'status' => 'validated']);

        $this->withToken($token)->getJson('/api/evaluations')->assertOk()->assertJsonCount(0);
        $this->withToken($token)->getJson('/api/innovations?is_scalable=true')->assertOk()->assertJsonCount(0);
    }

    public function test_searchable_pdf_can_be_submitted_without_automatic_scalability_scoring(): void
    {
        Storage::fake('public');
        $token = $this->registerToken();
        $file = UploadedFile::fake()->createWithContent(
            'project-tunog.pdf',
            $this->searchablePdf('PROJECT TUNOG is a literacy and reading intervention for struggling Grade 1 learners. Baseline assessment data, teacher training, workbooks, district replication, monitoring, and post-test evaluation are included.'),
        );
        $upload = $this->withToken($token)->post('/api/uploads', ['file' => $file])->assertCreated();

        $this->withToken($token)->postJson('/api/manuscripts/submit', [
            'manuscript_file_url' => $upload->json('file_url'),
            'original_filename' => 'project-tunog.pdf',
            'key_stage' => 'KS1',
            'grade_levels' => 'Grades 1-3',
        ])->assertCreated()
            ->assertJsonPath('detected_learning_focus', 'literacy')
            ->assertJsonPath('status', 'submitted')
            ->assertJsonMissing(['framework_score' => 75]);
    }

    private function registerToken(): string
    {
        $user = User::factory()->create(['role' => 'user']);

        return $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('access_token');
    }

    private function adminToken(): string
    {
        $admin = User::factory()->create(['role' => 'admin']);

        return $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => 'password',
        ])->json('access_token');
    }

    /**
     * @param  array<string, int>|null  $ratings
     * @return array<string, mixed>
     */
    private function assessmentPayload(int $innovationId, ?array $ratings = null): array
    {
        return [
            'innovation_id' => $innovationId,
            'title' => 'Project COUNT',
            'learning_focus' => 'numeracy',
            'key_stage' => 'KS1',
            'grade_levels' => 'Grades 1-3',
            'status' => 'evaluated',
            'framework_ratings' => $ratings ?? [
                'division_impact' => 4,
                'context_adaptability' => 4,
                'adoption_ease' => 4,
                'sustainability' => 4,
                'resource_efficiency' => 4,
            ],
            'framework_notes' => 'Panel review completed.',
        ];
    }

    private function searchablePdf(string $text): string
    {
        $escapedText = str_replace(['\\', '(', ')'], ['\\\\', '\(', '\)'], $text);
        $stream = "BT /F1 11 Tf 50 750 Td ({$escapedText}) Tj ET";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
            '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);
            $number = $index + 1;
            $pdf .= "{$number} 0 obj\n{$object}\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 6\n0000000000 65535 f \n";

        foreach (array_slice($offsets, 1) as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf."trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF";
    }
}

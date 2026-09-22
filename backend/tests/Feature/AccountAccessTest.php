<?php

namespace Tests\Feature;

use App\Mail\PasswordResetMail;
use App\Mail\TemporaryPasswordMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AccountAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_gmail_signup_emails_a_temporary_password_and_requires_a_change(): void
    {
        Mail::fake();
        $this->postJson('/api/auth/register', [
            'name' => 'Maria Santos',
            'email' => 'maria.santos@gmail.com',
        ])->assertCreated()->assertJsonMissingPath('access_token');

        $user = User::where('email', 'maria.santos@gmail.com')->firstOrFail();
        $this->assertTrue($user->must_change_password);
        $this->assertNull($user->email_verified_at);
        Mail::assertSent(TemporaryPasswordMail::class, fn (TemporaryPasswordMail $message) => $message->hasTo($user->email));
        $temporaryPassword = Mail::sent(TemporaryPasswordMail::class)->first()->temporaryPassword;

        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => $temporaryPassword,
        ])->assertOk()->assertJsonPath('user.must_change_password', true);
        $token = $login->json('access_token');
        $this->withToken($token)->getJson('/api/innovations')->assertForbidden()->assertJsonPath('code', 'password_change_required');
        $this->withToken($token)->getJson('/api/auth/me')->assertOk();
        $this->withToken($token)->postJson('/api/auth/change-password', [
            'current_password' => $temporaryPassword,
            'password' => 'NewSecurePass123',
            'password_confirmation' => 'NewSecurePass123',
        ])->assertOk()->assertJsonPath('user.must_change_password', false);
        $this->withToken($token)->getJson('/api/innovations')->assertOk();
        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_signup_requires_gmail_and_does_not_accept_a_supplied_password(): void
    {
        Mail::fake();
        $this->postJson('/api/auth/register', [
            'name' => 'Wrong Address',
            'email' => 'school@example.com',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->postJson('/api/auth/register', [
            'name' => 'Maria Santos',
            'email' => 'maria@gmail.com',
            'password' => 'chosen-password',
        ])->assertCreated()->assertJsonMissingPath('access_token');
        Mail::assertSentCount(1);
    }

    public function test_only_admin_can_manage_accounts_and_deactivation_revokes_access(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $regular = User::factory()->create(['role' => 'user']);
        $adminToken = $this->login($admin);
        $regularToken = $this->login($regular);

        $this->withToken($regularToken)->getJson('/api/admin/users')->assertForbidden();
        $this->withToken($regularToken)->postJson('/api/admin/users', [
            'name' => 'New User', 'email' => 'new@example.com', 'role' => 'admin',
        ])->assertForbidden();

        $created = $this->withToken($adminToken)->postJson('/api/admin/users', [
            'name' => 'Panel Member', 'email' => 'panel@example.com', 'role' => 'user',
        ])->assertCreated()->assertJsonPath('user.must_change_password', true);
        $id = $created->json('user.id');
        Mail::assertSent(TemporaryPasswordMail::class, fn (TemporaryPasswordMail $message) => $message->hasTo('panel@example.com'));

        $this->withToken($adminToken)->putJson("/api/admin/users/{$id}", [
            'name' => 'Panel Member', 'email' => 'panel@example.com', 'role' => 'admin', 'is_active' => true,
        ])->assertOk()->assertJsonPath('user.role', 'admin');
        $this->withToken($adminToken)->postJson("/api/admin/users/{$id}/reset-password")->assertOk();
        Mail::assertSentCount(2);

        $this->withToken($adminToken)->putJson("/api/admin/users/{$id}", [
            'name' => 'Panel Member', 'email' => 'panel@example.com', 'role' => 'admin', 'is_active' => false,
        ])->assertOk()->assertJsonPath('user.is_active', false);
        $this->assertFalse(User::findOrFail($id)->is_active);

        $this->withToken($adminToken)->putJson("/api/admin/users/{$admin->id}", [
            'name' => $admin->name, 'email' => $admin->email, 'role' => 'user', 'is_active' => true,
        ])->assertUnprocessable();
    }

    public function test_password_reset_uses_email_instead_of_returning_a_token(): void
    {
        Mail::fake();
        $user = User::factory()->create();

        $this->postJson('/api/auth/forgot-password', ['email' => $user->email])
            ->assertOk()->assertJsonMissingPath('reset_token')->assertJsonMissingPath('reset_url');
        Mail::assertSent(PasswordResetMail::class, fn (PasswordResetMail $message) => $message->hasTo($user->email));
    }

    private function login(User $user): string
    {
        return $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk()->json('access_token');
    }
}

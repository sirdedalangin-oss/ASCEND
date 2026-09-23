<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetMail;
use App\Models\ApiToken;
use App\Models\User;
use App\Services\AccountInvitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request, AccountInvitation $invitation): JsonResponse
    {
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'ends_with:@gmail.com', 'max:255', 'unique:users,email'],
        ]);

        DB::transaction(function () use ($data, $invitation): void {
            $user = User::create([
                'name' => $data['name'],
                'email' => Str::lower($data['email']),
                'password' => Str::random(80),
                'role' => 'user',
            ]);
            $invitation->sendTemporaryPassword($user);
        });

        return response()->json(['message' => 'Account created. Check your Gmail inbox for a temporary password.', 'mail_delivery' => config('mail.default') === 'log' ? 'development_log' : 'email'], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', Str::lower($data['email']))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 422);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'This account is inactive. Contact an administrator.'], 403);
        }

        if ($user->must_change_password && ! $user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return response()->json($this->tokenResponse($user));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->userPayload($request->user()));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->attributes->get('api_token')?->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(12)->letters()->mixedCase()->numbers()],
        ]);
        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'The current password is incorrect.'], 422);
        }

        if (Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Choose a password different from the temporary password.'], 422);
        }

        $user->update(['password' => $data['password'], 'must_change_password' => false]);
        ApiToken::where('user_id', $user->id)
            ->where('id', '!=', $request->attributes->get('api_token')->id)
            ->delete();

        return response()->json(['message' => 'Password changed.', 'user' => $this->userPayload($user)]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $user = User::where('email', Str::lower($data['email']))->first();

        if (! $user || ! $user->is_active) {
            return response()->json(['message' => 'If an active account exists, a reset link has been sent.']);
        }

        $plainToken = Str::random(64);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => hash('sha256', $plainToken), 'created_at' => now()],
        );

        $resetUrl = rtrim(config('app.frontend_url'), '/').'/reset-password?token='.$plainToken;
        Mail::to($user->email)->send(new PasswordResetMail($user->name, $resetUrl));

        return response()->json(['message' => 'If an active account exists, a reset link has been sent.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'password' => ['required', 'string', Password::min(12)->letters()->mixedCase()->numbers()],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('token', hash('sha256', $data['token']))
            ->where('created_at', '>=', now()->subHour())
            ->first();

        if (! $record) {
            return response()->json(['message' => 'This reset link is invalid or expired.'], 422);
        }

        $user = User::where('email', $record->email)->firstOrFail();
        $user->update(['password' => $data['password'], 'must_change_password' => false]);
        ApiToken::where('user_id', $user->id)->delete();
        DB::table('password_reset_tokens')->where('email', $record->email)->delete();

        return response()->json(['message' => 'Password reset successfully.']);
    }

    private function tokenResponse(User $user): array
    {
        $plainToken = Str::random(80);
        ApiToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plainToken),
        ]);

        return [
            'access_token' => $plainToken,
            'token_type' => 'Bearer',
            'user' => $this->userPayload($user),
        ];
    }

    private function userPayload(User $user): array
    {
        return $user->only(['id', 'name', 'email', 'role', 'must_change_password', 'is_active']);
    }
}

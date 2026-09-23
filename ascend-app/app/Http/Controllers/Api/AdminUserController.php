<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use App\Models\User;
use App\Services\AccountInvitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        return response()->json(User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'is_active', 'must_change_password', 'email_verified_at', 'created_at']));
    }

    public function store(Request $request, AccountInvitation $invitation): JsonResponse
    {
        $this->requireAdmin($request);
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['user', 'admin'])],
        ]);

        $user = DB::transaction(function () use ($data, $invitation): User {
            $user = User::create([
                'name' => $data['name'],
                'email' => Str::lower($data['email']),
                'role' => $data['role'],
                'password' => Str::random(80),
            ]);
            $invitation->sendTemporaryPassword($user);

            return $user;
        });

        return response()->json(['user' => $this->payload($user), 'mail_delivery' => $this->mailDelivery()], 201);
    }

    public function update(Request $request, User $user, AccountInvitation $invitation): JsonResponse
    {
        $this->requireAdmin($request);
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['required', Rule::in(['user', 'admin'])],
            'is_active' => ['required', 'boolean'],
        ]);

        if ($user->id === $request->user()->id && ($data['role'] !== 'admin' || ! $data['is_active'])) {
            return response()->json(['message' => 'You cannot remove your own administrator access or deactivate your account.'], 422);
        }

        if ($user->role === 'admin' && ($data['role'] !== 'admin' || ! $data['is_active']) && User::where('role', 'admin')->where('is_active', true)->count() <= 1) {
            return response()->json(['message' => 'At least one active administrator is required.'], 422);
        }

        $emailChanged = $user->email !== Str::lower($data['email']);
        $accessChanged = $user->role !== $data['role'] || $user->is_active !== (bool) $data['is_active'];

        DB::transaction(function () use ($user, $data, $emailChanged, $accessChanged, $invitation): void {
            $user->update([
                'name' => $data['name'],
                'email' => Str::lower($data['email']),
                'role' => $data['role'],
                'is_active' => (bool) $data['is_active'],
                'email_verified_at' => $emailChanged ? null : $user->email_verified_at,
            ]);

            if ($emailChanged) {
                $invitation->sendTemporaryPassword($user);
            } elseif ($accessChanged) {
                ApiToken::where('user_id', $user->id)->delete();
            }
        });

        return response()->json(['user' => $this->payload($user->refresh()), 'mail_delivery' => $emailChanged ? $this->mailDelivery() : null]);
    }

    public function resetPassword(Request $request, User $user, AccountInvitation $invitation): JsonResponse
    {
        $this->requireAdmin($request);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Use the change password page for your own account.'], 422);
        }

        DB::transaction(fn () => $invitation->sendTemporaryPassword($user));

        return response()->json(['message' => 'A new temporary password was sent.', 'mail_delivery' => $this->mailDelivery()]);
    }

    private function requireAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Administrator access is required.');
    }

    private function payload(User $user): array
    {
        return $user->only(['id', 'name', 'email', 'role', 'is_active', 'must_change_password', 'email_verified_at', 'created_at']);
    }

    private function mailDelivery(): string
    {
        return config('mail.default') === 'log' ? 'development_log' : 'email';
    }
}

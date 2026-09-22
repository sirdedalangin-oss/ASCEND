<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainToken = $request->bearerToken();

        if (! $plainToken) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $token = ApiToken::with('user')
            ->where('token_hash', hash('sha256', $plainToken))
            ->first();

        if (! $token || ! $token->user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $token->user->is_active) {
            $token->delete();

            return response()->json(['message' => 'This account is inactive. Contact an administrator.'], 403);
        }

        if ($token->user->must_change_password && ! $request->is('api/auth/me', 'api/auth/logout', 'api/auth/change-password')) {
            return response()->json(['message' => 'Change your temporary password before continuing.', 'code' => 'password_change_required'], 403);
        }

        $token->forceFill(['last_used_at' => now()])->save();
        $request->setUserResolver(fn () => $token->user);
        $request->attributes->set('api_token', $token);

        return $next($request);
    }
}

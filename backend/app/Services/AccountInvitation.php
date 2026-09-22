<?php

namespace App\Services;

use App\Mail\TemporaryPasswordMail;
use App\Models\ApiToken;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AccountInvitation
{
    public function sendTemporaryPassword(User $user): void
    {
        $temporaryPassword = Str::password(20);
        $user->forceFill([
            'password' => $temporaryPassword,
            'must_change_password' => true,
        ])->save();
        ApiToken::where('user_id', $user->id)->delete();

        Mail::to($user->email)->send(new TemporaryPasswordMail($user->name, $user->email, $temporaryPassword));
    }
}

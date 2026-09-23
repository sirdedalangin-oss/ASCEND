<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@ascend.local'],
            [
                'name' => 'ASCEND Administrator',
                'password' => 'password',
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
        );
    }
}

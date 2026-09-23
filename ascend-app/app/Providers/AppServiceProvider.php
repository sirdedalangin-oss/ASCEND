<?php

namespace App\Providers;

use Illuminate\Foundation\Console\ServeCommand;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (PHP_OS_FAMILY === 'Windows') {
            // PHP needs a writable temp directory before Laravel receives uploads.
            ServeCommand::$passthroughVariables = [
                ...ServeCommand::$passthroughVariables,
                'TEMP',
                'TMP',
            ];
        }
    }
}

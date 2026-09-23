$ErrorActionPreference = 'Stop'

$appRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$tempDirectory = Join-Path $appRoot 'storage/framework/tmp'
$router = Join-Path $appRoot 'vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php'
New-Item -ItemType Directory -Path $tempDirectory -Force | Out-Null

Push-Location (Join-Path $appRoot 'public')
try {
    php -d "sys_temp_dir=$tempDirectory" -d 'upload_max_filesize=20M' -d 'post_max_size=25M' -S 127.0.0.1:8000 $router
} finally {
    Pop-Location
}

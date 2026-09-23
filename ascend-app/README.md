# ASCEND Laravel API

This directory contains the Laravel REST API for Project ASCEND. The React/Vite frontend is maintained separately in `../ascendtest.bulacandeped.com.ph/`.

## Local commands

```powershell
composer install
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Run the backend test suite with:

```powershell
php artisan test
```

The API uses MySQL/MariaDB and stores uploaded manuscripts on Laravel's `public` filesystem disk. Keep `.env`, database contents, `vendor/`, and uploaded manuscripts out of source control.

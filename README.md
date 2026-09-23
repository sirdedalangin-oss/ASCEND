# ASCEND Innovation-to-Scale System

Local full-stack version of the SDO Bulacan Project ASCEND application.

## Project layout

- `ascend-app/` - Laravel 13 REST API, MySQL/MariaDB migrations, tests, and manuscript storage.
- `ascendtest.bulacandeped.com.ph/` - React 18, Vite, and Tailwind CSS frontend.
- `Innovation_Scalability_Framework.docx` - framework reference document.

The frontend uses same-origin `/api` and `/storage` URLs. During local development, Vite proxies both paths to Laravel at `http://127.0.0.1:8000`.

## Requirements

- PHP 8.3 or newer with PDO MySQL
- Composer
- MySQL or MariaDB
- Node.js 20 or newer
- npm

## First-time local setup

Backend:

```powershell
Set-Location ascend-app
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link
```

Set the local MySQL connection in `ascend-app/.env` before running migrations. Do not run `migrate:fresh` against an existing database.

Frontend:

```powershell
Set-Location ascendtest.bulacandeped.com.ph
npm ci
```

## Run locally

Open two terminals from the repository root.

Terminal 1 - Laravel API:

```powershell
Set-Location ascend-app
.\scripts\serve-local.ps1
```

The local launcher uses Laravel's development router and sets a writable PHP upload temp directory and 20 MB upload limit. The default PHP installation may allow only 2 MB files.

Terminal 2 - React frontend:

```powershell
Set-Location ascendtest.bulacandeped.com.ph
npm run dev -- --host 127.0.0.1 --port 5173
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

Local administrator credentials:

```text
Email: admin@ascend.local
Password: password
```

## cPanel deployment

The intended cPanel home-directory layout is:

```text
ascend-app/                         Laravel application (outside the web root)
ascendtest.bulacandeped.com.ph/     Subdomain document root
```

1. Upload `ascend-app/` beside the subdomain document root.
2. In `ascend-app/`, run `composer install --no-dev --optimize-autoloader`.
3. Create `ascend-app/.env` with production values. Use `APP_ENV=production`, `APP_DEBUG=false`, the production URL, and the cPanel MySQL credentials.
4. Run `php artisan key:generate`, `php artisan migrate --force`, `php artisan config:cache`, and `php artisan route:cache`.
5. Build the frontend locally:

   ```powershell
   Set-Location ascendtest.bulacandeped.com.ph
   npm ci
   npm run build
   ```

6. Upload only the contents of `ascendtest.bulacandeped.com.ph/dist/` to the cPanel subdomain document root.
7. From the subdomain document root, create the public upload link:

   ```bash
   ln -s ../ascend-app/storage/app/public storage
   ```

The frontend build includes `.htaccess` for React Router and `index.php` for forwarding same-domain `/api` requests to the sibling Laravel application. If the cPanel directory layout differs, update the backend path candidates in `public/index.php` before building.


## Verification

```powershell
Set-Location ascendtest.bulacandeped.com.ph
npm run lint
npm run build

Set-Location ..\ascend-app
php artisan test
```

## API overview

Uploading through `POST /api/manuscripts/submit` now creates an initial five-criterion framework assessment from distinct evidence indicators in the manuscript. The weighted score and classification are calculated by the shared framework service. The uploader can correct ratings and notes on their own unvalidated submission; administrators can edit any assessment and optionally mark it panel validated. The automatic notes list the indicators found and missing, so the initial rating can be checked against the manuscript.

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST /api/innovations`
- `GET /api/innovations/{id}`
- `POST /api/uploads`
- `POST /api/manuscripts/submit`
- `GET /api/scalability-framework`
- `GET|POST /api/evaluations`

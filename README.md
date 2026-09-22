# ASCEND Innovation-to-Scale System

Local full-stack version of the SDO Bulacan Project ASCEND application.

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Laravel 13 REST API
- **Database:** MySQL/MariaDB (local XAMPP-compatible setup)
- **Authentication:** Local bearer-token authentication
- **Uploads:** Laravel public storage
- **Scalability assessment:** Administrator-entered ratings under the Innovation Scalability Framework

## Requirements

- PHP 8.3 or newer
- Composer
- Node.js 20 or newer
- npm

## First-time setup

```powershell
npm install
Set-Location backend
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link
```

## Run locally

Open two terminals in the project directory.

Terminal 1 — Laravel API:

```powershell
Set-Location backend
php artisan serve --host=127.0.0.1 --port=8000
```

Terminal 2 — Vite frontend:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

Local administrator credentials:

```text
Email: admin@ascend.local
Password: password
```

New accounts can also be created from the registration page. Password reset links are returned directly in the UI because the local environment does not require an SMTP server.

## Scalability decisions

Upload a manuscript to create an innovation awaiting assessment. An administrator enters 1–5 ratings for Potential Impact Across the Division (30%), Adaptability Across School Contexts (20%), Ease of Adoption and Implementation (20%), Sustainability (15%), and Resource Efficiency (15%). The final score is the sum of rating × weight divided by 5. A score of 75 or higher is scalable; the framework also assigns Qualified, Bronze, Silver, Gold, or Platinum levels. The Scalable Library includes only panel-validated innovations that meet the threshold.

Prior six-criterion scores remain stored for historical reference. They do not determine scalability under the new framework. Existing innovations need a new panel assessment. On an existing installation, run `php artisan migrate` from `backend/`; do not reset the database.

## Checks

```powershell
npm run lint
npm run build
Set-Location backend
php artisan test
```

## API overview

The Vite development server proxies `/api` and `/storage` to Laravel at `http://127.0.0.1:8000`.

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST /api/innovations`
- `GET /api/innovations/{id}`
- `POST /api/uploads`
- `POST /api/manuscripts/submit`
- `GET /api/scalability-framework`
- `GET|POST /api/evaluations` (only administrators can create or change assessments)

The manuscript analyzer extracts a title, learning focus, and summary from searchable PDF, DOCX, TXT, or Markdown files. It does not assign scalability ratings automatically.

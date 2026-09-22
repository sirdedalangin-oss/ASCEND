# AGENTS.md

## Project context

This is a local full-stack Project ASCEND application. Keep changes focused and preserve the current React/Vite frontend and Laravel API separation.

## Structure

- `src/`: React frontend.
- `src/api/client.js`: frontend API client for Laravel.
- `backend/`: Laravel API, SQLite database, migrations, tests, and public manuscript storage.

## Local development

- Start Laravel with `php artisan serve --host=127.0.0.1 --port=8000` from `backend/`.
- Start Vite with `npm run dev -- --host 127.0.0.1 --port 5173` from the project root.
- Vite proxies `/api` and `/storage` to Laravel.
- Never commit `backend/.env`, database contents, uploaded manuscripts, `node_modules`, or Composer `vendor` files.

## Verification

- Frontend: `npm run lint` and `npm run build`.
- Backend: `php artisan test` from `backend/`.
- Run migrations with `php artisan migrate`; use `migrate:fresh --seed` only for disposable local data.

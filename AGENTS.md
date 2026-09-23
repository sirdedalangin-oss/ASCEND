# AGENTS.md

## Project context

This is a local full-stack Project ASCEND application. Keep changes focused and preserve the current React/Vite frontend and Laravel API separation.

## Structure

- `ascendtest.bulacandeped.com.ph/`: React/Vite frontend and cPanel-ready build configuration.
- `ascendtest.bulacandeped.com.ph/src/api/client.js`: frontend API client for Laravel.
- `ascend-app/`: Laravel API, MySQL/MariaDB migrations, tests, and manuscript storage.

## Local development

- Start Laravel with `.\scripts\serve-local.ps1` from `ascend-app/` so PHP accepts manuscript uploads up to 20 MB.
- Start Vite with `npm run dev -- --host 127.0.0.1 --port 5173` from `ascendtest.bulacandeped.com.ph/`.
- Vite proxies `/api` and `/storage` to Laravel.
- Never commit `ascend-app/.env`, database contents, uploaded manuscripts, `node_modules`, or Composer `vendor` files.

## Verification

- Frontend: `npm run lint` and `npm run build` from `ascendtest.bulacandeped.com.ph/`.
- Backend: `php artisan test` from `ascend-app/`.
- Run migrations with `php artisan migrate`; use `migrate:fresh --seed` only for disposable local data.

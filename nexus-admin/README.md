<p align="center">
  <a href="README.pt-BR.md">🇧🇷 Leia em Português</a>
</p>

# Nexus Admin

The **Nexus Admin** app is the administrative UI for the Nexus platform. It is used to operate the system (admin-only flows) and to validate API behavior without manual `curl`.

## Responsibilities
- Provide an admin-facing web interface connected to `nexus-api`.
- Support common admin flows (login, user management, password reset, profile).
- Serve static assets via Nginx when running in Docker.
- Gate the admin UI based on `/me` and the Super Admin role (role 1).

## Requirements
- Node.js + npm (for local development), or Docker (recommended).
- A running `nexus-api` (and its dependencies).

## Run Locally
From the platform root (recommended):
```bash
docker-compose up --build admin
```
Then open:
- `http://localhost:3000`

Local dev server:
```bash
cd nexus-admin
npm install
VITE_API_URL=http://localhost:8080/api/v1 npm run dev
```

## Environment Variables
- `VITE_API_URL`: API base URL (example: `http://localhost:8080/api/v1`)

## Access & Security Notes
- The admin UI is intended only for Super Admin users (role 1).
- Role validation is done via `GET /me` before rendering protected screens; non-admin users are blocked.
- The backend remains the source of truth for authorization.
- The access token is stored in `sessionStorage` (key: `nexus-token`) and is cleared on logout.

## Notes
- For UI/stack details, see `nexus-admin/docs/README.md`.

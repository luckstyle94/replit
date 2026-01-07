<p align="center">
  <a href="README.pt-BR.md">🇧🇷 Leia em Português</a>
</p>

# Nexus Frontend

The **Nexus Frontend** app is the end-user web UI for the Nexus platform. It integrates directly with `nexus-api` (`/api/v1`) and implements the user authentication flow (including MFA setup/challenge screens driven by backend state).

## Responsibilities
- Provide the end-user experience (login, MFA, home menu, profile, and user-facing screens).
- Call `nexus-api` using `VITE_API_URL` as the base URL.
- Integrate feature modules like Nexus Bridge via `VITE_BRIDGE_API_URL`.
- Serve static assets via Nginx when running in Docker.
- Allow users to view and revoke their own active sessions via the API.

## Requirements
- Node.js + npm (for local development), or Docker (recommended).
- A running `nexus-api` (and its dependencies).

## Run Locally
From the platform root (recommended):
```bash
docker-compose up --build frontend
```
Then open:
- `http://localhost:3001`

Local dev server:
```bash
cd nexus-frontend
npm install
VITE_API_URL=http://localhost:8080/api/v1 npm run dev
```

## Environment Variables
- `VITE_API_URL`: API base URL.
  - Docker (recommended): `/api/v1` (uses Nginx proxy, same-origin)
  - Outside Docker: `http://localhost:8080/api/v1`
- `VITE_BRIDGE_API_URL`: Nexus Bridge API base URL.
  - Docker (compose): `http://localhost:8090/api/v1`
  - Outside Docker: `http://localhost:8090/api/v1`

## Auth + MFA (dev reference)
- MFA behavior is driven by the API and may require:
  - Authenticator setup (first-time), or
  - Authenticator OTP challenge (already enabled users).
- When temporarily allowed by the API during first-time access, an email option may be available. After enabling the authenticator, the email option stops appearing.

## Session Management (user)
- The dashboard includes an active sessions list powered by `GET /sessions`.
- Users can revoke any of their sessions via `DELETE /sessions/{id}` (including the current session).

## Troubleshooting (dev reference)
- **Request ID**: the API may return `X-Request-ID` in responses. When investigating errors, check this header in DevTools (Network).
- **Password recovery in local env**: depending on `nexus-api` setup, password recovery messages may not be delivered by email locally. Use the reset flow according to how the API is configured (e.g. token/code available in logs).

## Notes
- The Docker image uses Nginx and proxies `/api/` to the API service when started via Compose.
- For security, access tokens are stored in `sessionStorage` (not persisted after closing the browser). Old tokens in `localStorage` are migrated once and removed.

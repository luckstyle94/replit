# Nexus Admin

## Overview

Nexus Admin is an administrative panel for the Nexus platform, providing a web interface for Super Admin users (role 1) to manage tenants, users, features, SSO settings, and sessions. The application connects to a separate backend API (`nexus-api`) and serves as a validation tool for API behavior without manual curl commands.

The current focus is on visual/UX modernization while maintaining 100% functional compatibility with the existing stable backend.

## User Preferences

Preferred communication style: Simple, everyday language.

**Important constraints for this project:**
- The backend is stable and cannot be altered
- Only visual/UX improvements are allowed
- Do NOT modify: API calls, contracts, payloads, endpoints, authentication logic, screen behaviors, field names, props, or states used by the backend
- Do NOT add new functionality

## System Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios for API communication
- **Styling**: Plain CSS with CSS custom properties (no UI framework)

### Application Structure
```
src/
├── api/          # Axios client setup and shared types
├── components/   # Reusable UI components (Layout, Header, Sidebar)
├── context/      # React Context for auth state management
├── pages/        # Screen components organized by feature
├── services/     # API service layer (axios instance)
└── styles.css    # Global styles and design tokens
```

### Authentication Flow
- Token-based authentication stored in `sessionStorage` (key: `nexus-token`)
- Protected routes check authentication state via `AuthContext`
- Only Super Admin users (roleId === 1) can access the admin panel
- User validation done via `GET /me` endpoint before rendering protected screens
- Automatic logout on 401 responses

### Routing Structure
- `/login` - Public login page
- `/dashboard` - Main dashboard with stats
- `/tenants` - Tenant (company) management
- `/sso` - SSO settings per tenant
- `/users` - User management
- `/features` - Feature flag management
- `/sessions` - Active session management

### Design System
CSS variables defined in `:root` for theming:
- Colors: `--primary`, `--accent`, `--background`, `--card-bg`, `--border`, `--text-main`, `--text-muted`
- Spacing/Layout: `--radius`, `--shadow`, `--shadow-lg`
- Typography: Inter font family with system fallbacks

## External Dependencies

### Backend API
- Base URL configured via `VITE_API_URL` environment variable
- Default: `http://localhost:8080/api/v1`
- All data operations rely on this external API

### Key API Endpoints Used
- `POST /login` - Authentication
- `GET /me` - Current user info and role validation
- `GET /dashboard/stats` - Dashboard statistics
- `GET /users`, `POST /users` - User CRUD
- `GET /tenants/all`, `POST /tenants` - Tenant management
- `GET /features`, `POST /features` - Feature management
- `GET /admin/sessions` - Session listing
- SSO-related endpoints for tenant SSO configuration

### Development Dependencies
- TypeScript 5.6
- Vite React plugin for JSX transformation

### Deployment
- Docker-ready with Nginx for static file serving
- Development server runs on port 5000
- Production build outputs to `dist/` directory
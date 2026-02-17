# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
# Development
npm install                # Install dependencies
npm run dev               # Start Vite dev server (port 5173)
npm run build             # Build for production (TypeScript check + Vite bundle)

# Code Quality
npm run lint              # Run ESLint on all files

# Notes
- Backend API must be running on http://localhost:8000
- Vite proxies /api requests to backend (configured in vite.config.ts)
- No test suite is currently configured
```

## Architecture Overview

### High-Level Structure

This is a **role-based judgment management frontend** with five main feature areas:

1. **Authentication & Authorization** - JWT-based with role-based access control
2. **Batch Upload** - Upload court documents in bulk and trigger processing
3. **Data Entry** - Manual data extraction and editing of failed OCR results
4. **Validation** - Review and verify extracted judgments before publishing
5. **Browse & Admin** - Search judgments, manage users/courts, view audit logs

### Core Patterns

**State Management:**
- Server state: TanStack Query v5 (`@tanstack/react-query`)
- Local state: React Context for auth, language, sidebar
- API communication: Axios with request/response interceptors

**Authentication Flow:**
- Login → JWT token stored in localStorage
- Token automatically injected via axios request interceptor
- 401 responses trigger logout and redirect to /login
- Two axios instances: `apiClient` (JSON) and `uploadClient` (multipart/form-data)

**Contexts (Global State):**
- `AuthContext` - User identity and auth methods
- `LanguageContext` - i18n state (AR/FR toggle)
- `SidebarContext` - Sidebar collapse state

**Routing:**
- React Router v6 with nested routes
- All routes except `/login` wrapped in `ProtectedRoute`
- `ProtectedRoute` checks `requiredPermission` prop using `usePermissions()` hook
- Permissions map to user roles: `admin`, `validator`, `data_entry`, `viewer`

**Forms & Validation:**
- React Hook Form for form state management
- Zod for schema validation and type safety
- All forms use `useForm` with `zodResolver`

**Internationalization:**
- react-i18next with translations in `src/locales/{ar,fr}/`
- RTL/LTR document direction based on language
- Font selection: Arabic uses `font-arabic`, French/English uses `font-latin`
- Language toggle stored in localStorage

### Directory Structure

```
src/
├── api/                    # API client layer (axios-based)
│   ├── client.ts          # Axios instances with interceptors
│   ├── auth.ts            # Login, logout, me endpoint
│   ├── batches.ts         # Batch upload and retrieval
│   ├── judgments.ts       # Judgment CRUD
│   ├── validation.ts      # Validation workflow endpoints
│   ├── dataEntry.ts       # Data entry workflow endpoints
│   ├── courts.ts          # Court management
│   ├── users.ts           # User management
│   ├── auditLogs.ts       # Audit log retrieval
│   ├── dashboard.ts       # Statistics and dashboard
│   ├── files.ts           # File downloads
│   └── index.ts           # Re-exports all APIs
├── components/
│   ├── ui/                # Base UI building blocks (shadcn/ui)
│   ├── layout/            # App shell, header, sidebar, protected routes
│   ├── common/            # Reusable components (badges, spinners)
│   ├── batches/           # Batch upload, file list components
│   ├── data-entry/        # Document preview, judgment form
│   ├── validation/        # Validation review components
│   ├── judgments/         # Judgment detail, audit logs display
│   └── admin/             # Admin-specific components
├── contexts/              # React contexts for global state
├── hooks/                 # Custom React hooks
│   └── usePermissions.ts  # Role-based access control
├── lib/
│   ├── constants.ts       # App constants, storage keys, API base URL
│   ├── types.ts           # TypeScript interfaces and types
│   └── utils.ts           # Helper functions
├── locales/               # i18n translation files (ar/, fr/)
├── pages/                 # Page-level components (one per route)
├── App.tsx                # Route configuration and provider setup
├── main.tsx               # React DOM render entry point
└── i18n.ts                # react-i18next configuration
```

### Key Files & Dependencies

**Styling:**
- Tailwind CSS v3 with tailwind-merge for class resolution
- shadcn/ui component library (Radix primitives + Tailwind)
- tailwindcss-animate for animations
- Custom font classes in global CSS: `.font-arabic`, `.font-latin`

**Document Viewing:**
- PDF: `@react-pdf-viewer` (with default layout)
- DOCX: `mammoth` (DOCX to HTML conversion)
- `pdfjs-dist` as peer dependency for PDF.js

**Data & Forms:**
- `@tanstack/react-table` v8 for data tables
- `react-hook-form` + `zod` for form handling
- Validation is strongly typed via Zod schemas

**UI & UX:**
- `sonner` for toast notifications (configured in App.tsx at top-center)
- `lucide-react` for icons
- `react-dropzone` for file drag-and-drop
- Toast styling respects RTL/LTR via `rtl:font-arabic ltr:font-latin` classes

**Build & Type Safety:**
- TypeScript 5.6 with strict mode enabled
- Vite 6.0 for fast bundling
- ES2020 target
- Base URL alias `@/*` → `./src/*`

### Development Guidelines

**When Adding Pages:**
1. Create folder under `src/pages/{feature}/`
2. Export main page component and any sub-page components
3. Add route in `App.tsx` with appropriate `ProtectedRoute` wrapper and `requiredPermission`
4. Use `useAuth()` to access current user
5. Use `useLanguage()` to access i18n

**When Creating API Endpoints:**
1. Add function to appropriate file in `src/api/` (or create new file if new feature)
2. Use `apiClient` or `uploadClient` (for multipart form data)
3. Re-export from `src/api/index.ts`
4. Call via TanStack Query: `useQuery`, `useMutation` in components

**When Adding Components:**
1. UI components go in `src/components/ui/` (use shadcn/ui pattern)
2. Feature components go in `src/components/{feature}/`
3. Shared components go in `src/components/common/`
4. All components should support RTL via Tailwind's `rtl:` directive
5. Use language context for text: `const { t } = useTranslation()`

**Permissions & Roles:**
- Use `usePermissions()` hook to check role-based permissions
- Common permissions: `canUpload`, `canAccessDataEntry`, `canAccessValidation`, `canManageUsers`, `canManageCourts`, `canAccessAdmin`
- Always wrap feature routes with `<ProtectedRoute requiredPermission="...">`

**TypeScript:**
- Strict mode enforced: no `any` types, unused variables error
- All API responses should have types in `src/lib/types.ts`
- Use Zod for runtime validation of form inputs and API responses

### Configuration Details

**API Base URL:**
- Set via env var `VITE_API_URL` (defaults to environment or is proxied)
- Configured in `src/lib/constants.ts` as `API_BASE_URL`
- Vite dev server proxies `/api` to backend at `http://localhost:8000`

**TanStack Query Defaults (App.tsx):**
- `staleTime`: 5 minutes
- `retry`: 1 attempt
- `refetchOnWindowFocus`: disabled

**Storage Keys:**
- All localStorage keys defined in `src/lib/constants.ts` as `STORAGE_KEYS`
- Token stored as: `localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)`

### Design System Reference

The app uses Mauritanian national colors:
- **Red** (#D01C1F) - Header, destructive actions, error states
- **Green** (#00A95C) - Primary buttons, success, verified status
- **Gold** (#FFD700) - Warnings, highlights, needs-review status

Tailwind config uses CSS custom properties for these colors. Check `tailwind.config.ts` for exact values.

### Common Tasks

**Running a single feature's components:**
- Set the route path to isolate testing: modify `App.tsx` temporarily or access via browser URL

**Debugging API calls:**
- Check Network tab in DevTools
- Token is logged to console on auth
- Axios interceptors log requests/responses (can add console.logs in `api/client.ts`)

**Working with RTL/LTR:**
- All layout/padding/margin should use RTL-safe Tailwind classes: `ms-` (margin-start), `ps-` (padding-start)
- Use `rtl:` and `ltr:` utilities for direction-specific styles
- Text direction is set on `<html>` by LanguageContext

**Adding new translations:**
1. Add keys to `src/locales/ar/translation.json` and `src/locales/fr/translation.json`
2. Use in components: `const { t } = useTranslation(); t('key.name')`
3. Interpolation: `t('key', { name: 'value' })`


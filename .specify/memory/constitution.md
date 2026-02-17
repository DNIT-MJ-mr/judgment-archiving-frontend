<!--
Sync Impact Report - Constitution v1.0.0 Creation
- Version change: N/A → 1.0.0 (initial ratification)
- Core Principles: 7 principles covering type safety, RBAC, state management, i18n/RTL, API-driven architecture, form validation, and internationalization
- Added Sections: Architecture & Patterns, Security & Permissions, Development Workflow, Code Quality Standards
- Templates updated: plan-template.md, spec-template.md, tasks-template.md (dependencies on constitution principles)
- Ratification Date: 2026-02-11 (initial adoption)
-->

# Judgment Archiving Frontend Constitution

## Core Principles

### I. Type Safety & Strict TypeScript

All code MUST use TypeScript with strict mode enabled (`tsconfig.json`). No `any` types except at system boundaries. All API responses and form inputs MUST have explicit Zod schemas and corresponding TypeScript types in `src/lib/types.ts`. Runtime validation is non-negotiable for external data.

**Rationale**: Type safety at compile time prevents runtime errors in a role-based system where permission violations must never reach production.

### II. Role-Based Access Control (RBAC)

Every feature route MUST require explicit `requiredPermission` prop in `<ProtectedRoute>`. Permissions map to roles: `admin`, `validator`, `data_entry`, `viewer`. Use `usePermissions()` hook to check capabilities at component level. Never hardcode role checks; always reference permission constants.

**Rationale**: Court document handling requires granular access control. RBAC violations are security incidents and MUST be caught before render.

### III. Server State First with TanStack Query

TanStack Query v5 is the source of truth for server state. All API data flows through `useQuery` or `useMutation`. Component local state (React `useState`) is reserved for UI-only state (e.g., form inputs, sidebar collapse). Never duplicate server state in local component state.

**Rationale**: Single source of truth reduces sync bugs and simplifies cache invalidation. Query keys are the contract; cache is the canonical state.

### IV. Internationalization & RTL First

All user-facing text MUST come from `react-i18next` translations in `src/locales/{ar,fr}/`. Text direction must respect document RTL via LanguageContext. All spacing/padding MUST use RTL-safe Tailwind classes: `ms-` (margin-start), `ps-` (padding-start), never `ml-` or `pl-`. Fonts: `.font-arabic` for Arabic, `.font-latin` for French/English.

**Rationale**: Mauritanian context requires seamless AR/FR/EN support. RTL is not an afterthought; it is core UX.

### V. API-Driven Architecture with Axios

All HTTP communication uses `apiClient` (JSON) or `uploadClient` (multipart). Request/response interceptors inject auth token and handle 401 errors. API endpoints are defined in `src/api/` and re-exported from `src/api/index.ts`. No fetch; no direct HTTP calls in components.

**Rationale**: Centralized interceptors enforce auth, logging, and error handling. Predictable API layer simplifies testing and debugging.

### VI. Form & Validation Discipline with React Hook Form + Zod

Every form MUST use `useForm` with `zodResolver`. Validation schemas (Zod) are co-located with forms and MUST match API request/response types. Frontend validation is UX enhancement; backend validation is security requirement. Never trust client-side validation alone.

**Rationale**: Form complexity grows quickly. Schema-first validation ensures consistency between client, server, and type definitions.

### VII. Component Library Pattern with shadcn/ui

UI components come from shadcn/ui or are built on Radix primitives in `src/components/ui/`. Feature components go in `src/components/{feature}/`. All custom components MUST support RTL via Tailwind `rtl:` directives. No inline styles; use Tailwind utilities.

**Rationale**: Consistent component library ensures predictable behavior and simplifies updates. Tailwind ensures responsive design and design system adherence.

## Architecture & Patterns

**Context Providers** (in App.tsx root):
- `AuthContext` - JWT token, user identity, login/logout methods
- `LanguageContext` - i18n language/locale, RTL direction, font classes
- `SidebarContext` - Sidebar collapse state

**React Router v6 Structure**:
- All routes (except `/login`) wrapped in `<ProtectedRoute>` with `requiredPermission` check
- `ProtectedRoute` uses `usePermissions()` to verify access before rendering
- Nested routes supported; use `<Outlet>` for sub-page layouts

**Storage Keys** (defined in `src/lib/constants.ts`):
- `STORAGE_KEYS.ACCESS_TOKEN` - JWT token persisted to localStorage
- Language preference and sidebar state also persisted

**Styling Standards**:
- Tailwind CSS v3 with custom design tokens (red #D01C1F, green #00A95C, gold #FFD700)
- shadcn/ui components with Radix primitives
- No CSS files unless absolutely necessary; prefer Tailwind utilities
- RTL via Tailwind's `rtl:` and `ltr:` prefixes, never hardcoded LTR assumptions

## Security & Permissions

**Authentication**:
- JWT token stored in localStorage; sent via axios request interceptor
- 401 responses trigger automatic logout and redirect to `/login`
- No token refresh logic; token expiration handled server-side

**Authorization**:
- Permissions checked on route entry via `<ProtectedRoute>`
- Permissions also checked at component level with `usePermissions()` hook
- UI elements (buttons, fields) MUST be hidden/disabled for insufficient permissions
- Backend MUST re-validate permissions for every API request (never trust client)

**Data Handling**:
- Court documents may contain sensitive information; MUST NOT log document content
- Audit logs capture user actions; audit trail is immutable (view-only from frontend)
- File downloads respect user's document access permissions

## Development Workflow

**Feature Development**:
1. Verify `requiredPermission` is defined in routing
2. Implement API endpoints in `src/api/` with Zod schemas
3. Create feature components in `src/components/{feature}/`
4. Use TanStack Query for server state; React Context for auth/language state
5. All forms use React Hook Form + Zod; validation schemas in `src/lib/types.ts`
6. Test with backend running on `http://localhost:8000`

**Code Review Checklist**:
- [ ] All user-facing text from i18n (no hardcoded strings except logs)
- [ ] RTL-safe Tailwind classes (no `ml-`, `pl-`, `mr-`, `pr-`)
- [ ] TypeScript strict mode compliance (no `any` types)
- [ ] API responses validated with Zod schemas
- [ ] Form validation matches backend schema
- [ ] Protected routes have explicit `requiredPermission` prop
- [ ] No server state duplicated in component state
- [ ] Axios used for HTTP; no fetch calls

**Testing Notes**:
- No test suite currently configured; manual testing against running backend required
- Vite dev server proxies `/api` to backend at `http://localhost:8000`
- Network tab in DevTools reveals token and interceptor behavior

## Code Quality Standards

**TypeScript**:
- Strict mode enabled in `tsconfig.json`; no exceptions without explicit // @ts-ignore with justification
- Type definitions in `src/lib/types.ts` for all API/form schemas
- Zod schemas generate TypeScript types via `.infer<typeof>`

**Naming Conventions**:
- React components: PascalCase (`JudgmentList.tsx`)
- Hooks: camelCase with `use` prefix (`usePermissions.ts`)
- API functions: camelCase verb + noun (`getBatches()`, `createJudgment()`)
- Context: PascalCase + "Context" suffix (`AuthContext.ts`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`, `STORAGE_KEYS.ACCESS_TOKEN`)

**File Structure**:
- One component per file
- Co-locate styles with components (Tailwind); avoid separate CSS files
- API layer separate from components; use TanStack Query as bridge
- Keep component files under 300 lines; split into sub-components if larger

**Error Handling**:
- API errors: Axios interceptor logs; component displays toast via `sonner`
- Form errors: React Hook Form renders error messages; Zod provides error text
- Network failures: Auto-retry once (TanStack Query config); show user on second failure
- 401 errors: Trigger logout via AuthContext; redirect to `/login`

## Governance

**Constitution Authority**:
This constitution supersedes all informal practices and architectural decisions. Every feature MUST align with these principles. Violations discovered during review are blockers for merge.

**Amendment Procedure**:
1. Proposed amendment MUST justify change with architectural reasoning
2. Amendment requires discussion with team leads
3. Version number updated following semantic versioning rules
4. `LAST_AMENDED_DATE` set to amendment date (ISO 8601)
5. All dependent templates reviewed and updated if necessary
6. Commit message documents amendment rationale

**Versioning Policy**:
- **MAJOR**: Backward incompatible principle removals or role-based changes (e.g., new required permission)
- **MINOR**: New principle added or existing principle materially expanded (e.g., new state management pattern)
- **PATCH**: Clarifications, wording improvements, rationale updates (no behavioral change)

**Compliance Review**:
- Code review checks principles against checklist (RTL, TypeScript, RBAC, i18n)
- Architecture decision records (ADRs) document departures from constitution with justification
- Quarterly review of principles; update constitution if patterns have shifted

**Guidance References**:
- Runtime development guidance: `CLAUDE.md` (Claude Code agent guide)
- Development environment setup: `README.md`
- Type definitions and API contracts: `src/lib/types.ts`

---

**Version**: 1.0.0 | **Ratified**: 2026-02-11 | **Last Amended**: 2026-02-11

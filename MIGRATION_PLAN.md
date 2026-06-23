# CampOS Multi-Tenant Architecture Analysis & Migration Plan

## Document Version: 1.0
## Date: 2024-06-22
## Scope: Transform CampOS Core from Platform Launcher to Multi-Tenant University Operating System

---

## 1. CURRENT ARCHITECTURE ANALYSIS

### 1.1 Database Schema Assessment

| Table | Has `institutionId` | Tenant Isolation Status | Risk Level |
|-------|-------------------|------------------------|------------|
| `User` | Nullable | ❌ Users can exist without institution | CRITICAL |
| `Role` | No | ❌ Roles are global across all institutions | CRITICAL |
| `Permission` | No | ❌ Permissions are global | CRITICAL |
| `UserRole` | No | ❌ Role assignments are global | CRITICAL |
| `Session` | No | ❌ Sessions have no tenant context | HIGH |
| `StudentProfile` | Yes (required) | ✅ Properly scoped | OK |
| `NadaProfile` | No | ❌ No direct institution link | HIGH |
| `Institution` | N/A | ✅ Core entity | OK |
| `Faculty` | Yes (required) | ✅ Properly scoped | OK |
| `Department` | Yes (required) | ✅ Properly scoped | OK |
| `Program` | Yes (required) | ✅ Properly scoped | OK |
| `Semester` | Yes (required) | ✅ Properly scoped | OK |
| `AcademicSession` | Yes (required) | ✅ Properly scoped | OK |
| `Notification` | No | ❌ Notifications only user-scoped | MEDIUM |
| `NotificationPreference` | No | ❌ No institution context | MEDIUM |
| `UserActivity` | No | ❌ Activities not institution-scoped | MEDIUM |
| `InstitutionAnalytics` | Yes (required) | ✅ Properly scoped | OK |
| `MetricEvent` | Yes (required) | ✅ Properly scoped | OK |
| `AuditLog` | Nullable | ⚠️ Optional institution context | MEDIUM |
| `FileUpload` | Nullable | ⚠️ Optional institution context | MEDIUM |
| `ModuleRegistration` | No | ❌ Global modules for all tenants | HIGH |
| `ModuleApiKey` | No | ❌ No institution scoping | HIGH |
| `ApiRequestLog` | No | ❌ No institution scoping | MEDIUM |

### 1.2 Authentication Flow Analysis

**Current Flow:**
```
Login POST /api/auth/login
  → Validate email/password
  → Load user with roles
  → Create JWT (contains optional institutionId)
  → Create session (no institutionId)
  → Set cookies
  → Return user + tokens
  → Client redirects to /admin or /student based on role
```

**Problems:**
1. User can be created without `institutionId` (null)
2. JWT payload contains `institutionId` but it's optional
3. Session record has no `institutionId` — cannot validate session-tenant association
4. No validation that the user's institution is active
5. Redirect is role-based only — no institution context in URL
6. No check that a user is logging into the correct institution workspace

### 1.3 API Route Security Analysis

| Route | Tenant Enforcement | Issue |
|-------|-------------------|-------|
| `POST /api/auth/login` | None | No institution validation |
| `POST /api/auth/register` | Optional | institutionId is optional, any user can register for any institution |
| `GET /api/auth/me` | None | Returns user with institution, but doesn't validate workspace |
| `GET /api/identity` | None | Returns profile by userId, doesn't verify tenant |
| `GET /api/institution` | None | Any authenticated user can list ALL institutions |
| `GET /api/analytics` | WEAK | `searchParams.get("institutionId") \|\| session.institutionId` — CLIENT CAN OVERRIDE! |
| `GET /api/audit` | PARTIAL | Uses `session.institutionId` but it's nullable |
| `GET /api/notifications` | OK (implicit) | Filters by userId, so user only sees their own |
| `GET /api/files` | OK (implicit) | Filters by userId, so user only sees their own |
| `GET /api/modules` | None | Returns all modules globally |

### 1.4 Routing Analysis

**Current URL Structure:**
```
/                    → Landing page
/login               → Login (global)
/register            → Register (global)
/student             → Student dashboard (global)
/student/scanmark    → ScanMark module (global)
/student/unireg      → UniReg module (global)
/student/funaabnb    → FunaaBnB module (global)
/student/nada        → NADA module (global)
/admin               → Admin dashboard (global)
/admin/students     → Student management (global)
/admin/analytics    → Analytics (global)
/admin/audit        → Audit logs (global)
```

**Problems:**
1. No institution slug in URL — all URLs are global
2. Cannot bookmark a specific institution workspace
3. Cannot share a link to a specific institution's resources
4. No way to distinguish `funaab.campos.africa/student` from `abu.campos.africa/student`
5. Middleware cannot validate if user belongs to the requested workspace

### 1.5 UI Component Analysis

**Sidebar:**
- Links are hardcoded to `/student/...` and `/admin/...`
- No institution context in navigation
- No institution branding (logo, name) shown

**Login Page:**
- No institution selection (users just log in with email/password)
- No institution-specific branding
- Redirects to `/admin` or `/student` without institution context

**TopBar:**
- Shows user name and role, but no institution name

---

## 2. MIGRATION ARCHITECTURE DECISIONS

### 2.1 Routing Strategy: Path-Based (NOT Subdomain)

**Decision:** Use `/funaab/student` and `/funaab/admin` instead of `funaab.campos.africa`.

**Rationale:**
| Factor | Path-Based | Subdomain |
|--------|-----------|-----------|
| Wildcard DNS/SSL | Not needed | Required |
| Localhost dev | Works natively | Needs /etc/hosts or DNS config |
| CDN Caching | Simple | Complex |
| Next.js App Router | Native dynamic segments | Requires custom config |
| Self-hosting | Works at any domain | Requires domain configuration |
| SEO | Standard | Standard |
| Multi-tenant data | Same DB, path distinguishes | Same approach |

**Conclusion:** Path-based is simpler, faster to deploy, and works everywhere.

### 2.2 Tenant Isolation Model: Prisma Middleware + Explicit Checks

**Decision:** Use a combination of:
1. Prisma middleware for automatic RLS on queries
2. Explicit tenant validation in API routes
3. JWT session enforcement with institution context

**Why not PostgreSQL RLS?**
- Prisma doesn't natively support PostgreSQL RLS policies well
- Middleware approach is more portable (works with any database)
- Easier to debug and override for super_admin

---

## 3. MIGRATION PLAN

### Phase 1: Database Schema (Non-Destructive)
**Goal:** Add `institutionId` to all tenant-scoped tables without breaking existing data.

**Changes:**

1. **Role** — Add `institutionId` (nullable)
   - Existing global roles remain (for super_admin)
   - New institution-specific roles will have institutionId
   - Migration: All existing roles → keep null (global)

2. **Session** — Add `institutionId` (nullable initially)
   - Existing sessions: migrate to user's institutionId
   - Future sessions: always set from user's institution

3. **Notification** — Add `institutionId` (nullable initially)
   - Existing notifications: migrate to sender's institutionId
   - Future: always set from user's session

4. **NotificationPreference** — Add `institutionId` (nullable)
   - One preference per user per institution

5. **UserActivity** — Add `institutionId` (nullable)
   - Existing: backfill from user's institutionId

6. **NadaProfile** — Add `institutionId` (nullable)
   - Backfill from StudentProfile.institutionId

7. **ModuleRegistration** — Add `institutionId` (nullable)
   - Global modules remain (for shared infrastructure)
   - Institution-specific modules: add institutionId

8. **ModuleApiKey** — Add `institutionId` (nullable)

9. **ApiRequestLog** — Add `institutionId` (nullable)

10. **User.institutionId** — Keep nullable for super_admin
    - Add runtime validation: non-super_admin MUST have institutionId

### Phase 2: Prisma RLS Middleware
**Goal:** Automatic tenant scoping for all queries.

```typescript
// Middleware behavior:
// 1. For every find/findMany/findUnique: add { institutionId: session.institutionId } where
// 2. For every create: auto-inject institutionId
// 3. For every update: verify record belongs to user's institution first
// 4. For super_admin: skip all checks
// 5. For institution_admin: scope to their institution
// 6. For student: scope to their institution
```

### Phase 3: Auth & Session Refactoring
**Goal:** Every authenticated request carries and validates institution context.

**Changes:**
1. **JWT Payload** — Always include `institutionId` (never optional)
   - super_admin: include `"*"` or actual institutionId
   - All others: required institutionId

2. **Session Record** — Always include `institutionId`

3. **Login Flow** — After authentication:
   ```
   Authenticate email/password
   → Resolve institutionId from user record
   → Validate institution is active
   → Create JWT with institutionId
   → Create session with institutionId
   → Redirect to /{institutionSlug}/student or /{institutionSlug}/admin
   ```

4. **New Helper Functions:**
   - `getTenant(request)` — returns { user, institutionId, institutionSlug, roles, permissions }
   - `requireTenant(request)` — throws if no institution context
   - `isSuperAdmin(session)` — check for super_admin role
   - `tenantScope(prisma, session)` — wraps Prisma queries with RLS

5. **Middleware Update** — After JWT validation:
   - Extract institutionId from JWT
   - If path contains `/:institutionSlug/`, verify JWT institutionId matches slug
   - If mismatch, redirect to correct workspace or login

### Phase 4: API Route Refactoring
**Goal:** Every endpoint enforces tenant isolation.

**Changes per endpoint:**

| Route | Current | Target |
|-------|---------|--------|
| `POST /api/auth/login` | No institution check | Validate user's institution, include in JWT/session |
| `POST /api/auth/register` | Optional institutionId | Require institutionId, validate institution exists |
| `GET /api/auth/me` | Returns user + optional institution | Returns user + guaranteed institution context |
| `GET /api/identity` | Returns by userId | Validate profile belongs to user's institution |
| `GET /api/institution` | Lists all institutions | Only list user's institution (or all for super_admin) |
| `GET /api/analytics` | Client can override institutionId | Strictly use session.institutionId |
| `GET /api/audit` | Uses nullable session.institutionId | Always require institutionId, validate |
| `GET /api/notifications` | User-scoped | Add institutionId filter for admin views |
| `GET /api/files` | User-scoped | Add institutionId filter for admin views |
| `GET /api/modules` | Global | Filter by institutionId or show institution-specific modules |

### Phase 5: URL Routing Refactor
**Goal:** All routes include institution slug.

**New URL Structure:**
```
/                           → Landing page (unchanged)
/login                      → Login (with institution context detection)
/register                   → Register (with institution pre-selection)
/:institutionSlug/student   → Student workspace
/:institutionSlug/student/scanmark
/:institutionSlug/student/unireg
/:institutionSlug/student/funaabnb
/:institutionSlug/student/nada
/:institutionSlug/admin     → Admin workspace
/:institutionSlug/admin/students
/:institutionSlug/admin/analytics
/:institutionSlug/admin/audit
/:institutionSlug/admin/institutions
/:institutionSlug/admin/notifications
/:institutionSlug/admin/files
/:institutionSlug/admin/settings
```

**Implementation:**
- Move all `(dashboard)` routes under `app/[institutionSlug]/`
- Create `[institutionSlug]/student/layout.tsx` and `[institutionSlug]/admin/layout.tsx`
- Update sidebar to use `/${institutionSlug}/...` paths
- Update login redirect to include institutionSlug

### Phase 6: UI Refactor
**Goal:** Maintain all existing UI while adding institution context awareness.

**Changes:**
1. **Sidebar** — Add institution branding area (logo, name, slug)
2. **TopBar** — Show institution name next to user
3. **Login Page** — Add institution selection if no pre-selected institution
4. **Breadcrumb** — Add institution context to all pages

### Phase 7: Module Integration
**Goal:** Modules are institution-aware.

**Changes:**
1. **ModuleRegistration** — Each institution can register its own module instances
2. **Module URLs** — Institution-specific: `/:institutionSlug/student/scanmark`
3. **API Keys** — Per institution per module

---

## 4. ROLLBACK STRATEGY

### Database Rollback
1. All new columns are ADDED as nullable initially
2. Migration creates a `migration_log` table to track changes
3. Rollback: drop new columns, restore nullable on User.institutionId
4. No data loss: existing data never deleted

### Code Rollback
1. All changes are additive (new files, not replacing old ones)
2. Old routes remain accessible during migration
3. Feature flags can disable new routing

---

## 5. TESTING STRATEGY

### Security Tests
1. Attempt to access another institution's data via API
2. Attempt to override institutionId in analytics request
3. Attempt to access admin routes as student
4. Verify super_admin can access all institutions
5. Verify institution_admin can only access their institution

### Functional Tests
1. Login → correct workspace loaded
2. Student sees only their data
3. Admin sees only their institution's data
4. Cross-institution links return 403
5. Module URLs include institution slug

---

## 6. IMPLEMENTATION ORDER

The phases are designed to be implemented in order, with each building on the previous:

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
Schema   → Prisma   → Auth    → API     → Routes  → UI      → Modules
```

**Phase 1-3 are backend-critical.**
**Phase 4-7 are frontend-facing but depend on backend.**

---

*End of Analysis Document*

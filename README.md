# CampOS Core Platform

The central operating system that powers all applications within the CampOS ecosystem.

## 🎯 Overview

CampOS is a university operating system consisting of four integrated applications:

- **ScanMark** — Attendance & Presence Verification
- **UniReg** — Student Registration & Academic Administration
- **FunaaBnB** — Student Accommodation & Housing Management
- **NADA** — Anonymous Student Social Network

These are NOT standalone products. They function as integrated modules powered by a single CampOS Core platform.

## 🏗️ Architecture

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn UI**
- **PostgreSQL** (via Prisma ORM)
- **Redis** (caching & sessions)
- **JWT Authentication** with refresh token flow
- **RBAC** (Role-Based Access Control)
- **REST APIs**
- **Event-driven architecture**

## 📦 Core Modules

### 1. Authentication System
- Sign Up / Sign In
- Forgot Password / Reset Password
- Email Verification
- Session Management (multi-device)
- JWT handling with refresh tokens
- Secure logout with revocation

### 2. CampOS Identity Service
- Universal identity for every student
- CampOS ID, matric number, academic details
- Source of truth for all ecosystem apps

### 3. Institution Management
- Multi-tenancy support
- Faculties, departments, programs
- Semesters and academic sessions
- Complete tenant isolation

### 4. Notification Service
- In-app notifications
- Email notifications
- Push notification architecture
- Notification center with preferences

### 5. Analytics Engine
- Student activity tracking
- Attendance, registration, housing metrics
- NADA engagement metrics
- Dashboards with charts

### 6. Audit Logging
- Track all user actions
- Searchable logs with timestamps
- IP addresses and user agents

### 7. File Management
- Secure uploads with validation
- Student photos, documents, verification files
- Access control per file

### 8. Module Integration Layer
- API keys for module access
- Permission-based module access
- Unified identity consumption

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd campos-core

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database and Redis credentials

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start the development server
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/campos_core` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `NEXTAUTH_SECRET` | NextAuth secret | `campos-core-secret-key-change-in-production` |
| `JWT_SECRET` | JWT signing secret | `campos-jwt-secret-change-in-production` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `FROM_EMAIL` | Default sender email | `noreply@campos.io` |

## 👥 Default Accounts

After seeding, the following accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@campos.io` | `admin123` |
| Student | `student@campos.io` | `student123` |

## 🎨 Design System

- **Primary Color**: CampOS Green (`hsl(162, 76%, 22%)`)
- **Design References**: Linear, Notion, Stripe, Vercel
- **Features**: Minimalist, premium, fast, clean spacing, dark mode, responsive

## 📁 Project Structure

```
campos-core/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
├── src/
│   ├── app/
│   │   ├── (auth)/          # Auth pages (login, register, etc.)
│   │   ├── (dashboard)/     # Dashboard pages
│   │   │   ├── admin/       # Admin dashboard
│   │   │   └── student/     # Student dashboard
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # Auth endpoints
│   │   │   ├── identity/    # Identity service
│   │   │   ├── institution/ # Institution management
│   │   │   ├── notifications/
│   │   │   ├── analytics/
│   │   │   ├── audit/
│   │   │   ├── files/
│   │   │   └── modules/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── ui/              # Shadcn UI components
│   │   ├── layout/          # Layout components
│   │   └── dashboard/       # Dashboard-specific components
│   ├── lib/
│   │   ├── auth/            # JWT, session, RBAC
│   │   ├── db/              # Prisma & Redis clients
│   │   ├── services/        # Business logic services
│   │   └── utils.ts         # Utility functions
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   └── middleware.ts        # Next.js middleware
├── public/
│   └── images/              # Static assets
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🔐 Security Features

- Role-Based Access Control (RBAC)
- Granular permissions per resource
- Input validation with Zod
- Rate limiting ready
- CSRF protection via cookies
- XSS prevention (React + sanitization)
- SQL injection prevention (Prisma ORM)
- Secure password hashing (bcryptjs)
- Audit trails for all actions
- Tenant isolation
- Token revocation support

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` — User login
- `POST /api/auth/register` — User registration
- `POST /api/auth/logout` — Logout & revoke tokens
- `POST /api/auth/refresh` — Refresh access token
- `GET /api/auth/me` — Current user profile
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Reset password
- `GET /api/auth/verify-email` — Verify email

### Identity
- `GET /api/identity` — Get student identity
- `POST /api/identity` — Create student identity

### Institution
- `GET /api/institution` — List/Get institutions
- `POST /api/institution` — Create institution

### Notifications
- `GET /api/notifications` — List notifications
- `POST /api/notifications` — Create notification
- `PATCH /api/notifications` — Mark as read

### Analytics
- `GET /api/analytics` — Get analytics data
- `POST /api/analytics` — Record metric event

### Audit
- `GET /api/audit` — List audit logs

### Files
- `GET /api/files` — List files
- `POST /api/files` — Upload file

### Modules
- `GET /api/modules` — List available modules

## 🧪 Testing

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## 🚢 Deployment

### Requirements
- Node.js 18+ runtime
- PostgreSQL database
- Redis instance
- Environment variables configured

### Build
```bash
npm run build
npm start
```

## 📄 License

Proprietary - CampOS Core Platform

## 🙏 Credits

Built for the future of campus management.

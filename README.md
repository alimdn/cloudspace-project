# CloudSpace — Isolated Cloud Workspaces

A production-ready SaaS platform for renting fully isolated Docker workspaces with dedicated resources. Users can create, manage, and monitor Linux containers with custom OS, CPU, RAM, and storage allocations — running 24/7.

## Features

- **Authentication** — Registration, login, JWT sessions, password reset
- **Workspace Management** — Create, start, stop, restart, and delete Docker containers
- **OS Selection** — Ubuntu, Debian, Alpine, CentOS, Fedora
- **Resource Monitoring** — Real-time CPU, RAM, disk, and network stats via SSE
- **5 Pricing Plans** — Free, Basic ($9), Pro ($29), Business ($59), Enterprise ($99)
- **Stripe Billing** — Checkout sessions, customer portal, webhooks
- **Invoice Management** — Downloadable invoices with Stripe integration
- **Support System** — Ticket submission, FAQ, file attachments
- **User Settings** — Profile editing, password changes, account deletion, notifications
- **Responsive Design** — Mobile-first with desktop enhancement
- **Dark Theme** — Dark/light mode support via next-themes
- **PWA Ready** — Manifest and service worker configuration
- **Rate Limiting** — In-memory rate limiting for all API endpoints
- **Security** — HSTS, XSS protection, CSP, CSRF protection, content-type sniffing prevention

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **State Management** | Zustand (client), TanStack Query (server) |
| **Database** | PostgreSQL via Prisma ORM |
| **Cache** | Redis (optional, falls back to in-memory) |
| **Auth** | JWT (jose) + bcryptjs |
| **Payments** | Stripe (Checkout + Portal + Webhooks) |
| **Containers** | Docker (dockerode) |
| **Email** | Nodemailer (SMTP) |
| **Validation** | Zod |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Testing** | Vitest + Testing Library |

## Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** ≥ 14
- **Docker** (for workspace provisioning)
- **Redis** (optional, for caching and rate limiting)
- **Stripe Account** (for billing features)
- **SMTP Server** (for email features)

## Environment Setup

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/cloudspace.git
cd cloudspace
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and fill in all required variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing (min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL (default: `http://localhost:3000`) |
| `NODE_ENV` | No | `development`, `production`, or `test` |
| `STRIPE_SECRET_KEY` | No | Stripe secret key for billing |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key |
| `STRIPE_SUCCESS_URL` | No | Checkout success redirect URL |
| `STRIPE_CANCEL_URL` | No | Checkout cancel redirect URL |
| `REDIS_URL` | No | Redis connection URL |
| `DOCKER_HOST` | No | Docker socket path or TCP address |
| `SMTP_HOST` | No | SMTP server hostname |
| `SMTP_PORT` | No | SMTP port (usually 587) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | From email address |

4. **Set up the database:**
```bash
npx prisma generate
npx prisma db push
```

## Local Development

Using Docker Compose (recommended):

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Run migrations
npx prisma db push

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # REST API endpoints
│   │   ├── auth/           # Login, register, logout, password reset
│   │   ├── billing/        # Checkout, portal, invoices, webhooks
│   │   ├── support/        # Ticket submission
│   │   ├── user/           # Profile, password, notifications, account
│   │   └── workspaces/     # CRUD + stats + SSE streaming
│   ├── global-error.tsx    # Global error boundary
│   ├── layout.tsx          # Root layout with providers
│   ├── not-found.tsx       # Custom 404 page
│   └── page.tsx            # App shell entry point
├── components/
│   ├── auth/               # Login & registration forms
│   ├── dashboard/          # All dashboard views
│   │   ├── BillingView.tsx
│   │   ├── PricingView.tsx
│   │   ├── SettingsView.tsx
│   │   ├── SupportView.tsx
│   │   ├── WorkspacesView.tsx
│   │   └── WorkspaceDetailView.tsx
│   ├── landing/            # Landing page sections
│   ├── layout/             # AppShell, Sidebar, Header
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
├── lib/                    # Core utilities
│   ├── api-response.ts     # Standardized API response helpers
│   ├── auth.ts             # JWT auth (sign, verify, sessions)
│   ├── db.ts               # Prisma client with retry logic
│   ├── env.ts              # Environment validation (Zod)
│   ├── logger.ts           # Structured logging
│   ├── rate-limit.ts       # In-memory rate limiter
│   ├── stripe.ts           # Stripe integration
│   └── validators.ts       # Zod schemas for forms/API
├── store/                  # Zustand state stores
│   ├── useAppStore.ts
│   └── useWorkspaceStore.ts
└── types/                  # Shared TypeScript types
```

## API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Invalidate session |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces` | List user workspaces |
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/workspaces/:id` | Get workspace details |
| PATCH | `/api/workspaces/:id` | Update workspace |
| DELETE | `/api/workspaces/:id` | Delete workspace |
| GET | `/api/workspaces/:id/stats` | Get resource usage |
| GET | `/api/workspaces/:id/ws` | SSE real-time stats stream |

### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/billing/checkout` | Create Stripe checkout session |
| POST | `/api/billing/portal` | Create Stripe portal session |
| GET | `/api/billing/invoices` | List invoices |
| GET | `/api/billing/invoices/:id/download` | Download invoice PDF |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PATCH | `/api/user/profile` | Update profile |
| PATCH | `/api/user/password` | Change password |
| DELETE | `/api/user/account` | Delete account |
| GET | `/api/user/notifications` | Get notifications |

### Support
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/support/ticket` | Submit support ticket |

All API responses follow a consistent format:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "Error message" }
```

Paginated responses include:
```json
{ "success": true, "data": [...], "pagination": { "total": 10, "limit": 20, "offset": 0, "hasMore": false } }
```

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Add all required environment variables in the Vercel dashboard
4. Deploy — Vercel will auto-detect Next.js and configure the build

### Environment Variables for Production

Make sure to set:
- `DATABASE_URL` to your production PostgreSQL connection string
- `JWT_SECRET` to a strong random string
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to your production Stripe keys
- `NEXT_PUBLIC_APP_URL` to your production domain

## Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## License

MIT

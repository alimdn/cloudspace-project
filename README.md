# CloudSpace - Workspace Hosting Platform

A SaaS platform that provides users with isolated Linux workspaces to install and run any software 24/7.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Database**: Prisma ORM
- **PWA Ready**: Service Worker + Manifest

## Features

- User authentication (Login / Register)
- Dashboard with workspace management
- Create and manage isolated Linux workspaces
- OS selection (Ubuntu, Debian, Alpine, CentOS, Fedora)
- Subscription & billing system
- 5 pricing plans (Free, Basic, Pro, Advanced, Enterprise)
- Responsive design (Desktop + Mobile)
- PWA support

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-username/cloudspace.git
cd cloudspace
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/              # Pages & API Routes
│   ├── api/          # Backend API endpoints
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Landing page
├── components/
│   ├── auth/         # Login & Register forms
│   ├── dashboard/    # Dashboard views
│   ├── landing/      # Landing page sections
│   ├── layout/       # App shell, sidebar, header
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
└── store/            # Zustand state stores
```

## Deployment

### Vercel
1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Deploy automatically

### Docker (Optional)
```bash
docker build -t cloudspace .
docker run -p 3000:3000 cloudspace
```

## License

MIT

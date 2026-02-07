# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FinPal Pocket Planner is a personal finance management app. It's a monorepo with an Express/Prisma backend and React/Vite frontend. See `../../DEVELOPER_GUIDE.md` for full ecosystem docs.

## Quick Reference

### Development Commands
```bash
npm run dev              # Run both frontend (8080) + backend (3001)
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only
npm run build            # Production build
npm run db:migrate       # Run Prisma migrations
npm run db:push          # Push schema changes (dev)
npm run db:studio        # Prisma Studio GUI
npm run lint             # ESLint all workspaces
```

### Architecture
- **Backend**: Express.js + Prisma + PostgreSQL + JWT auth + Google OAuth
- **Frontend**: React 18 + Vite + TailwindCSS + shadcn/ui + React Query
- **Pattern**: Routes -> Middleware -> Services -> Prisma -> PostgreSQL

### Key Files

**Backend** (`apps/backend/src/`):
- `server.ts` / `app.ts` - Express setup with middleware, CORS, rate limiting
- `middleware/auth.middleware.ts` - JWT verification (`authenticateToken`)
- `middleware/validation.middleware.ts` - Zod schema validation
- `middleware/error.middleware.ts` - Global error handler (Zod, Prisma, custom errors)
- `services/budget.service.ts` - Budget CRUD + spent calculation with currency conversion
- `services/transaction.service.ts` - Transaction CRUD + triggers budget recalculation
- `services/gmail.service.ts` - Penny API integration + webhook processing
- `utils/periodCalculations.ts` - Period date logic (calendar_month / specific_day)
- `prisma/schema.prisma` - Database schema

**Frontend** (`apps/frontend/src/`):
- `lib/api-client.ts` - Axios client with JWT interceptor, all API endpoints
- `lib/periodCalculations.ts` - Client-side period calculations (mirrors backend)
- `lib/budgetTemplates.ts` - Lifestyle-based budget suggestions for wizard
- `hooks/useTranslation.ts` - EN/ES bilingual hook with 1000+ keys
- `hooks/useFeatureFlags.ts` - Feature flag conditional rendering
- `hooks/useBudgetPeriodTemplate.ts` - User period preferences
- `pages/Index.tsx` - Main dashboard (budgets, transactions, drag-drop)
- `components/budget/BudgetWizard.tsx` - 9-step guided setup

### Database Models
User, Account, Session, UserPreference, BudgetCategory, Budget, Transaction, ExchangeRate, Currency, GmailAccount, FeatureFlag

### Budget Period System
Two modes controlled by UserPreference.periodType:
- `calendar_month`: 1st to last day of month
- `specific_day`: Day X of prev month to Day X-1 of target month

Budget.spent is recalculated when transactions change (create/update/delete). Conversion to budget currency happens during calculation.

### Penny Integration
- Pocket Planner registers Gmail accounts with Penny via External API
- Penny monitors Gmail, extracts financial data with AI
- Penny sends HMAC-SHA256 signed webhooks to `/api/gmail/webhook`
- `email.extracted` events auto-create transactions

### Environment Variables
See `apps/backend/.env.example` and `apps/frontend/.env.example`

Critical: `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PENNY_API_URL`, `PENNY_API_KEY`, `WEBHOOK_SECRET`, `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`

### Code Conventions
- Absolute imports: `@/` maps to `src/`
- Functional components with hooks
- React Query for all server state (never raw fetch/axios in components)
- Zod for request validation (backend)
- shadcn/ui components for consistent styling
- Toast notifications for user feedback
- Always run `npm run lint` before committing

### Important Notes
- Do not touch .env files (they work correctly locally)
- Make sure solutions compile and run locally before pushing
- Avoid generating known technical debt
- Don't push unless told to
- No test framework configured yet - period calculations and currency conversion are priority candidates

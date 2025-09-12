# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FinPal Pocket Planner is a personal finance management application built with React, TypeScript, Express, and Prisma. It features budget tracking with flexible period management, transaction categorization, multi-currency support, and internationalization.

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 8080
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Linting and Type Checking
Always run `npm run lint` before committing changes. No separate TypeScript check is configured; type checking is done through the build process.

## Architecture Overview

### Backend: Express + Prisma
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **API**: RESTful Express.js API with middleware for validation, rate limiting, and CORS
- **Exchange Rates**: Seeded currency conversion rates with automatic updates

Key tables:
- `users` - User authentication with password hashing
- `user_preferences` - Period type settings and language preferences
- `budget_categories` - User-defined budget categories with sort order
- `budgets` - Budget allocations with target month/year system
- `transactions` - Financial transactions with categorization
- `exchange_rates` - Currency conversion rates

### Frontend Architecture

**State Management**:
- React Query (`@tanstack/react-query`) for server state
- Local React state for UI state
- Custom hooks for complex logic

**Key Components Structure**:
- `src/pages/` - Route components (Index, Auth, NotFound)
- `src/components/` - Feature-specific components organized by domain
- `src/lib/api-client.ts` - API client for backend communication
- `src/lib/` - Utility functions and business logic
- `src/hooks/` - Custom React hooks

**Styling**:
- Tailwind CSS with shadcn/ui components
- Theme support via `next-themes`
- Custom gradient utilities

## Budget Period System

The app uses a sophisticated period calculation system that supports:
- **Calendar Month**: Standard monthly periods (1st to last day)
- **Specific Day**: Custom periods from day X of one month to day X-1 of next month

**Key Files**:
- `src/lib/periodCalculations.ts` - Core period logic
- `src/hooks/useBudgetPeriodTemplate.ts` - Period preference management
- `src/components/periods/PeriodSelectionModal.tsx` - Period configuration UI

**Target Month/Year System**: Budgets are created for specific target months, allowing navigation between different periods while maintaining data consistency.

## Database Patterns

### Budget Management
- Budgets have `target_year` and `target_month` fields
- Budget categories have `sort_order` for user-defined ordering
- Automatic spent amount calculation via database triggers
- Currency support per budget item

### Transactions
- Type field: 'expense' or 'income'
- Optional category linking to budget categories
- Date-based filtering for period calculations
- Soft category assignment (transactions can exist without budgets)

### User Preferences
- Language setting ('english' or 'spanish')
- Period type configuration
- Specific day setting for custom periods

## Internationalization

Uses custom translation hook (`src/hooks/useTranslation.ts`) with support for English and Spanish. Translations are embedded in the hook rather than external files.

## Key Features to Understand

### Multi-Currency Support
- Exchange rate fetching via Supabase Edge Functions
- Rate caching and automatic updates
- Real-time currency conversion widgets

### Drag & Drop Budget Reordering
- Uses `@dnd-kit` for budget category ordering
- Persists order via `sort_order` field

### Uncategorized Transaction Management
- Transactions can exist without assigned categories
- UI prompts for categorization of uncategorized transactions
- Automatic budget spent calculation only for categorized transactions

## Code Conventions

### Imports
- Absolute imports using `@/` alias (maps to `src/`)
- Group imports: external libraries, then internal modules
- Use TypeScript interfaces for data structures

### Components
- Functional components with hooks
- Props interfaces defined inline or near component
- shadcn/ui components for consistent styling

### Data Fetching
- React Query for all server state
- Separate queries for different data concerns
- Optimistic updates where appropriate
- Mutation success callbacks invalidate related queries

### Error Handling
- Toast notifications for user feedback
- Try-catch in async functions
- Graceful degradation for optional features

## Environment Setup

Requires these environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Build Configuration

- **Vite**: Build tool with React SWC plugin
- **TypeScript**: Loose configuration for rapid development
- **ESLint**: React + TypeScript rules with unused vars disabled
- **PostCSS**: Tailwind processing
- **Lovable Integration**: Development tagging for visual building

## Testing

No test framework is currently configured. When adding tests, consider the budget period calculations and currency conversion logic as primary candidates for unit testing.
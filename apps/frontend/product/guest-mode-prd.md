# Product Requirements Document: Guest Mode (Try Before Signup)

**Version:** 1.0
**Date:** October 9, 2025
**Author:** Product Team
**Status:** Approved for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Goals & Success Metrics](#goals--success-metrics)
4. [User Personas & Use Cases](#user-personas--use-cases)
5. [User Flows](#user-flows)
6. [Functional Requirements](#functional-requirements)
7. [Technical Specifications](#technical-specifications)
8. [UI/UX Requirements](#uiux-requirements)
9. [Implementation Plan](#implementation-plan)
10. [Internationalization (i18n)](#internationalization-i18n)
11. [Analytics & Tracking](#analytics--tracking)
12. [Testing Requirements](#testing-requirements)
13. [Security & Privacy](#security--privacy)
14. [Future Enhancements](#future-enhancements)
15. [Appendix](#appendix)

---

## Executive Summary

### Overview
Implement a "guest mode" that allows users to explore Pocket Penny's dashboard with demo data before creating an account. This reduces friction in the signup flow and allows users to experience the app's value proposition before committing.

### Current State
- Users must sign up before seeing any dashboard functionality
- High bounce rate on landing page (estimated 60-70% drop-off)
- Users can't evaluate the product before authentication
- Limited understanding of features before signup

### Proposed Solution
- Direct access to dashboard with pre-populated demo data
- Authentication gate on all write operations
- Optional demo data migration after signup
- Persistent demo data across sessions

### Expected Impact
- **60% reduction** in signup friction
- **15-25% increase** in signup conversion rate
- **3x longer** user engagement before signup
- Better informed users → higher retention

---

## Problem Statement

### The Challenge
New users face significant friction when trying to evaluate Pocket Penny:

1. **Uncertainty**: Users don't know if the app fits their needs before signing up
2. **Commitment Anxiety**: Creating an account feels like a commitment without seeing value
3. **Feature Discovery**: Can't explore features without authentication
4. **Trust Barrier**: Users hesitate to provide personal information upfront

### User Feedback
*"I wish I could see what this looks like before signing up"*
*"Can I try it out first?"*
*"I don't want to create another account just to test an app"*

### Business Impact
- High landing page bounce rate
- Low signup conversion
- Users don't understand value proposition
- Increased customer acquisition cost

---

## Goals & Success Metrics

### Primary Goals

1. **Reduce Signup Friction**
   - Allow dashboard access without authentication
   - Remove barrier to product exploration

2. **Increase Conversion Rate**
   - Convert more visitors to signed-up users
   - Improve user understanding of features

3. **Enhance User Education**
   - Let users explore features hands-on
   - Demonstrate value before asking for commitment

### Success Metrics

#### Primary KPIs
| Metric | Baseline | Target | Time Frame |
|--------|----------|--------|------------|
| Landing → Dashboard Rate | 10% | 80% | Week 1 |
| Guest → Signup Conversion | 0% | 15% | Week 4 |
| Time to Signup | 30 sec | 5 min | Week 2 |
| Signup Completion Rate | 45% | 65% | Week 4 |

#### Secondary KPIs
- Demo feature interaction rate: >70%
- Demo data modification attempts: >40%
- Auth prompt acceptance rate: >25%
- Demo-to-paid conversion (future): >20%

### Non-Goals (Out of Scope)
- ❌ Persistent guest accounts with server storage
- ❌ Multi-device demo data sync
- ❌ Guest-specific features beyond demo data
- ❌ Guest mode for mobile apps (Phase 1)

---

## User Personas & Use Cases

### Primary Persona: Sarah the Explorer
**Demographics:** 28, Young Professional, Tech-Savvy
**Goal:** Find a budgeting app that's intuitive and flexible
**Pain Point:** Tired of signing up for apps she doesn't end up using
**Behavior:** Tries 3-5 budgeting apps before choosing one

**Use Case:**
1. Lands on Pocket Penny from Google search
2. Clicks "Get Started" expecting to see dashboard
3. Explores demo budgets and transactions
4. Tries to add a budget → sees signup prompt
5. Signs up because she understands the value
6. Imports demo data or starts fresh

### Secondary Persona: Mike the Skeptic
**Demographics:** 42, Small Business Owner, Privacy-Conscious
**Goal:** Evaluate security and features before sharing data
**Pain Point:** Distrusts apps that require immediate signup
**Behavior:** Extensive research before trying new tools

**Use Case:**
1. Reads landing page but hesitates to sign up
2. Clicks "Get Started" to test the app
3. Thoroughly explores all demo features
4. Attempts to export data → blocked
5. Decides app is trustworthy and signs up
6. Immediately sets up real budgets

### Tertiary Persona: Lisa the Quick Starter
**Demographics:** 35, Parent, Time-Constrained
**Goal:** Start tracking expenses immediately
**Pain Point:** No time for lengthy onboarding
**Behavior:** Wants instant value, minimal setup

**Use Case:**
1. Needs budgeting solution NOW
2. Clicks "Get Started" and sees immediate value
3. Tries to add real transaction → signup prompt
4. Quick signup (Google OAuth)
5. Continues with real data
6. Skips demo data migration

---

## User Flows

### Flow 1: Guest Exploration → Signup

```
┌─────────────┐
│Landing Page │
└──────┬──────┘
       │ Click "Get Started"
       ▼
┌─────────────────────┐
│Dashboard (Guest)    │
│- Demo budgets shown │
│- Demo transactions  │
│- Banner: "Demo Mode"│
└──────┬──────────────┘
       │ Explore features
       │ View demo data
       ▼
┌─────────────────────┐
│Try to Add Budget    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│Auth Gate Modal      │
│"Sign up to save!"   │
└──────┬──────────────┘
       │ Click "Sign Up"
       ▼
┌─────────────────────┐
│Auth Page            │
│?return=/dashboard   │
└──────┬──────────────┘
       │ Complete signup
       ▼
┌─────────────────────┐
│Dashboard (Auth'd)   │
│- Real account       │
│- Optional: Import   │
│  demo data          │
└─────────────────────┘
```

### Flow 2: Direct Signup (Existing Users)

```
┌─────────────┐
│Landing Page │
└──────┬──────┘
       │ Click "Sign In" (header)
       ▼
┌─────────────┐
│Auth Page    │
└──────┬──────┘
       │ Login
       ▼
┌─────────────┐
│Dashboard    │
│(Authenticated)│
└─────────────┘
```

### Flow 3: Guest Returns (Browser Refresh)

```
┌─────────────────┐
│User Refreshes   │
│/dashboard       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│Check Authentication     │
└────────┬───────┬────────┘
         │       │
    Not Auth'd  Auth'd
         │       │
         ▼       ▼
    ┌─────┐   ┌──────┐
    │Guest│   │Real  │
    │Mode │   │Data  │
    └─────┘   └──────┘
         │       │
         ▼       ▼
    Load Demo  Load User
    from LS    from API
```

---

## Functional Requirements

### FR-1: Demo Data Generation

**Priority:** P0 (Critical)

**Description:** Generate realistic demo budgets and transactions for guest users.

**Requirements:**
- Generate 5-6 budget categories with realistic names
- Create 10-15 sample transactions for current month
- Include mix of categorized and uncategorized transactions
- Use realistic amounts (e.g., Groceries: $500, Transport: $200)
- Set default currency to USD
- Use calendar month period type

**Demo Budget Categories:**
1. Groceries - $500 budget, $320 spent
2. Transportation - $200 budget, $180 spent
3. Entertainment - $150 budget, $95 spent
4. Dining Out - $300 budget, $210 spent
5. Utilities - $250 budget, $250 spent
6. Shopping - $200 budget, $45 spent

**Demo Transactions:** (15 total)
- 12 categorized expenses across categories
- 3 uncategorized transactions
- Dates spread throughout current month
- Varied amounts ($10-$150)
- Realistic descriptions

**Acceptance Criteria:**
- [ ] Demo data generates deterministically
- [ ] Data is realistic and relatable
- [ ] Totals add up correctly
- [ ] Mix of spent/remaining budgets
- [ ] Some budgets over/under budget

---

### FR-2: Guest Mode State Management

**Priority:** P0 (Critical)

**Description:** Manage guest mode state and demo data persistence.

**Requirements:**

**State Variables:**
```typescript
interface GuestModeState {
  isGuestMode: boolean;
  demoDataLoaded: boolean;
  lastAccessed: Date;
  budgets: Budget[];
  transactions: Transaction[];
  preferences: {
    currency: string;
    language: 'english' | 'spanish';
    periodType: 'calendar_month';
  };
}
```

**Storage:**
- Use localStorage for demo data persistence
- Key: `pocket_penny_demo_data`
- Auto-clear after 7 days of inactivity
- Clear on successful signup
- Max size: ~50KB

**Operations:**
1. `initGuestMode()` - Load or generate demo data
2. `updateDemoData(data)` - Update demo data in memory
3. `clearDemoData()` - Remove demo data from storage
4. `migrateDemoData(userId)` - Convert demo to real data
5. `isGuestMode()` - Check current mode

**Acceptance Criteria:**
- [ ] Demo data persists across page refreshes
- [ ] Data clears after 7 days
- [ ] Auth'd users never see demo data
- [ ] No server calls in guest mode
- [ ] Smooth transition to auth'd mode

---

### FR-3: Authentication Gates

**Priority:** P0 (Critical)

**Description:** Block write operations in guest mode with signup prompts.

**Gated Actions:**

**High Priority (Immediate Gate):**
1. Add Budget
2. Add Transaction
3. Edit Budget
4. Edit Transaction
5. Delete Budget
6. Delete Transaction
7. Reorder Budgets
8. Create Missing Budgets
9. Update Category
10. Change Period Settings

**Medium Priority (Feature Disabled):**
11. Gmail Integration
12. Export Data
13. Clear All Data
14. Language Preference Save

**Low Priority (View Only):**
15. View Budgets ✅ Allowed
16. View Transactions ✅ Allowed
17. Navigate Periods ✅ Allowed
18. View Stats ✅ Allowed

**Auth Gate Modal Spec:**

**Trigger:** User clicks any gated action button

**Modal Content:**
```
┌──────────────────────────────────────┐
│  🎉 Sign Up to Save Your Budget      │
│                                      │
│  Create a free account to:          │
│  ✓ Save budgets and transactions    │
│  ✓ Track spending across devices    │
│  ✓ Connect Gmail for auto-tracking  │
│                                      │
│  [Sign Up Free] [Cancel]            │
└──────────────────────────────────────┘
```

**Interaction:**
- Click gated button → Modal appears
- "Sign Up" → Navigate to `/auth?return=/dashboard&action={actionName}`
- "Cancel" → Close modal, stay in demo
- Close (X) → Same as Cancel

**Acceptance Criteria:**
- [ ] All write operations trigger auth gate
- [ ] Modal shows context-specific message
- [ ] Return URL preserves user location
- [ ] Cancel returns to previous state
- [ ] No server mutations in guest mode

---

### FR-4: Guest Mode Indicators

**Priority:** P0 (Critical)

**Description:** Clearly communicate guest mode status to users.

**Demo Mode Banner:**

**Location:** Top of dashboard, above header

**Design:**
```
┌────────────────────────────────────────────────────┐
│ 🎉 You're exploring demo mode. Sign up to save!   │
│                              [Sign Up Free →]      │
└────────────────────────────────────────────────────┘
```

**Specifications:**
- Background: `bg-primary/10`
- Border: `border-b border-primary/20`
- Height: 48px
- Sticky: No (scrolls away)
- Dismissible: No
- CTA Button: Primary style, small size

**Additional Indicators:**
1. **Button States:** Disabled state on Gmail, Export
2. **Tooltips:** "Sign up to use this feature" on hover
3. **Empty States:** Modified messaging for guest users
4. **Menu Items:** Show lock icon on restricted features

**Acceptance Criteria:**
- [ ] Banner always visible in guest mode
- [ ] Banner hidden for auth'd users
- [ ] CTA navigates to signup
- [ ] Clear visual distinction
- [ ] Doesn't obstruct dashboard content

---

### FR-5: Signup Flow Enhancement

**Priority:** P0 (Critical)

**Description:** Handle guest-to-authenticated transition smoothly.

**Return URL Support:**

**Query Parameters:**
- `?return=/dashboard` - Redirect after signup
- `?action=add_budget` - Context for signup
- `?guest=true` - Indicates guest conversion

**Auth Page Changes:**
1. Parse return URL from query params
2. Store in component state
3. Show context message if coming from guest mode
4. Redirect to return URL after successful auth

**Context Messages:**
```typescript
const messages = {
  add_budget: "Sign up to save your budget",
  add_transaction: "Sign up to track this expense",
  export: "Sign up to export your data",
  gmail: "Sign up to connect Gmail"
};
```

**Post-Signup Flow:**
1. Complete authentication
2. Check for demo data in localStorage
3. If exists, show migration modal
4. User chooses: Import or Start Fresh
5. Clear demo data
6. Redirect to return URL or dashboard

**Acceptance Criteria:**
- [ ] Return URL works for all auth methods
- [ ] Context message displays correctly
- [ ] Redirect happens after auth success
- [ ] Demo data migration offered
- [ ] Clean URL after redirect

---

### FR-6: Demo Data Migration (Optional)

**Priority:** P1 (High)

**Description:** Allow users to import demo data after signup.

**Migration Modal:**

**Trigger:** First dashboard load after guest→auth'd conversion with demo data in localStorage

**Modal Content:**
```
┌──────────────────────────────────────────┐
│  Import Your Demo Budgets?               │
│                                          │
│  You have 6 budgets and 15 transactions │
│  from demo mode. Import them?           │
│                                          │
│  [Import Demo Data] [Start Fresh]       │
└──────────────────────────────────────────┘
```

**Import Process:**
1. Detect demo data in localStorage
2. Show migration modal
3. If "Import":
   - Batch create budgets via API
   - Batch create transactions via API
   - Show progress indicator
   - Clear localStorage on success
4. If "Start Fresh":
   - Clear localStorage immediately
   - Show empty dashboard

**Data Transformation:**
```typescript
// Convert demo data to API format
const migrateGuestData = async (demoData, userId) => {
  // Create categories
  for (const budget of demoData.budgets) {
    await createCategory(budget.category.name);
  }

  // Create budgets
  for (const budget of demoData.budgets) {
    await createBudget({
      categoryId: getCategoryId(budget.category.name),
      amount: budget.amount,
      targetYear: currentYear,
      targetMonth: currentMonth
    });
  }

  // Create transactions
  for (const tx of demoData.transactions) {
    await createTransaction({
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      date: tx.date,
      type: tx.type
    });
  }
};
```

**Acceptance Criteria:**
- [ ] Modal appears only for guest conversions
- [ ] Import creates all budgets successfully
- [ ] Import creates all transactions successfully
- [ ] Progress shown during import
- [ ] Errors handled gracefully
- [ ] Demo data cleared after migration
- [ ] User can decline and start fresh

---

### FR-7: Landing Page Updates

**Priority:** P0 (Critical)

**Description:** Update landing page to route to dashboard instead of auth.

**Changes Required:**

**File:** `src/pages/Landing.tsx`

**Line 78:**
```typescript
// Before:
<Button onClick={() => navigate('/auth')}>
  {t('getStarted')}
</Button>

// After:
<Button onClick={() => navigate('/dashboard')}>
  {t('getStarted')}
</Button>
```

**Line 102:**
```typescript
// Before:
<Button size="lg" onClick={() => navigate('/auth')}>
  {t('getStarted')}
</Button>

// After:
<Button size="lg" onClick={() => navigate('/dashboard')}>
  {t('getStarted')}
</Button>
```

**Line 188:**
```typescript
// Before:
<Button size="lg" onClick={() => navigate('/auth')}>
  {t('createFreeAccount')}
</Button>

// After:
<Button size="lg" onClick={() => navigate('/dashboard')}>
  {t('tryItFree')} {/* Update copy */}
</Button>
```

**Header "Sign In" Button:**
- Keep existing `/auth` navigation
- This is for returning users
- No change needed

**Acceptance Criteria:**
- [ ] All "Get Started" CTAs go to /dashboard
- [ ] "Sign In" still goes to /auth
- [ ] Copy updated to reflect guest mode
- [ ] Analytics updated for new flow

---

### FR-8: Dashboard Guest Mode Refactor

**Priority:** P0 (Critical)

**Description:** Refactor Index.tsx to support guest mode.

**Major Changes:**

#### A. Remove Auth Redirect
```typescript
// REMOVE these lines (1005-1009):
useEffect(() => {
  if (!loading && !user) {
    navigate("/auth");
  }
}, [user, loading, navigate]);
```

#### B. Add Guest Detection
```typescript
// ADD after line 88:
const isGuestMode = !user && !loading;
const {
  demoData,
  updateDemoData,
  clearDemoData
} = useGuestMode(); // New hook
```

#### C. Modify Data Fetching
```typescript
// Update budgets query (line 236):
enabled: isGuestMode ? false : !!user && currentTargetYear !== null

// Update transactions query (line 308):
enabled: isGuestMode ? false : !!user?.id

// Use appropriate data source:
const displayBudgets = isGuestMode ? demoData.budgets : allBudgets;
const displayTransactions = isGuestMode ? demoData.transactions : transactions;
```

#### D. Conditional Mutation Wrappers
```typescript
// Wrap all mutations:
const handleAddBudget = (data) => {
  if (isGuestMode) {
    showAuthGate('add budget');
    return;
  }
  addBudgetMutation.mutate(data);
};
```

#### E. Feature Restrictions
```typescript
// Update feature flags:
const flags = useMenuFeatureFlags(isGuestMode);

// Conditional rendering:
{!isGuestMode && <GmailStatusIndicator />}
{!isGuestMode && <ExportDataButton />}
```

**Acceptance Criteria:**
- [ ] No auth redirect in guest mode
- [ ] Demo data displays correctly
- [ ] All mutations blocked in guest mode
- [ ] Auth gates show on mutation attempts
- [ ] Feature flags respect guest mode
- [ ] Smooth transition after auth

---

### FR-9: LocalStorage Management

**Priority:** P1 (High)

**Description:** Manage demo data persistence and cleanup.

**Storage Specification:**

**Key:** `pocket_penny_demo_data_v1`

**Structure:**
```json
{
  "version": 1,
  "createdAt": "2025-10-09T12:00:00Z",
  "lastAccessed": "2025-10-09T15:30:00Z",
  "budgets": [...],
  "transactions": [...],
  "preferences": {
    "currency": "USD",
    "language": "english",
    "periodType": "calendar_month"
  }
}
```

**Lifecycle:**

1. **Creation:**
   - First visit to /dashboard without auth
   - Generate demo data
   - Save to localStorage

2. **Access:**
   - Load from localStorage on each dashboard visit
   - Update `lastAccessed` timestamp
   - Use in-memory for display

3. **Update:**
   - Demo data never updates (read-only simulation)
   - Only `lastAccessed` updates

4. **Cleanup:**
   - Auto-delete after 7 days of no access
   - Delete on successful signup
   - Delete on manual clear

**Utility Functions:**
```typescript
const DEMO_DATA_KEY = 'pocket_penny_demo_data_v1';
const DEMO_DATA_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export const saveDemoData = (data) => {
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify({
    ...data,
    lastAccessed: new Date().toISOString()
  }));
};

export const loadDemoData = () => {
  const stored = localStorage.getItem(DEMO_DATA_KEY);
  if (!stored) return null;

  const data = JSON.parse(stored);
  const age = Date.now() - new Date(data.lastAccessed).getTime();

  if (age > DEMO_DATA_TTL) {
    clearDemoData();
    return null;
  }

  return data;
};

export const clearDemoData = () => {
  localStorage.removeItem(DEMO_DATA_KEY);
};
```

**Acceptance Criteria:**
- [ ] Data persists across sessions
- [ ] Auto-cleanup after 7 days
- [ ] Version-based schema
- [ ] Handles corrupted data gracefully
- [ ] Size limit respected (<50KB)

---

## Technical Specifications

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Landing Page                      │
│                                                     │
│  [Get Started] → /dashboard                        │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│               GuestModeProvider                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  - Check Authentication                      │  │
│  │  - Load/Generate Demo Data                  │  │
│  │  - Provide isGuestMode flag                 │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                  Dashboard (Index)                  │
│  ┌─────────────────────────────────────────────┐  │
│  │  if (isGuestMode) {                         │  │
│  │    - Show DemoModeBanner                    │  │
│  │    - Display demo data                      │  │
│  │    - Wrap mutations with AuthGate           │  │
│  │  } else {                                   │  │
│  │    - Fetch real data from API               │  │
│  │    - Enable all features                    │  │
│  │  }                                          │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
                ┌─────────┐
                │AuthGate │
                │ Modal   │
                └────┬────┘
                     │
                     ▼
                ┌─────────┐
                │Auth Page│
                │?return= │
                └────┬────┘
                     │
                     ▼
                ┌──────────┐
                │Migration │
                │  Modal   │
                └──────────┘
```

### Component Hierarchy

```
App
├── GuestModeProvider (new)
│   └── state: { isGuestMode, demoData, showAuthGate }
│
├── Routes
│   ├── Landing → /
│   ├── Dashboard → /dashboard
│   │   ├── DemoModeBanner (new, conditional)
│   │   ├── BudgetSummary (receives demo/real data)
│   │   ├── TransactionList (receives demo/real data)
│   │   └── AuthGate (new, wraps mutations)
│   │
│   └── Auth → /auth
│       └── MigrationModal (new, conditional)
```

### New Files to Create

```
src/
├── contexts/
│   └── GuestModeContext.tsx          # State management
│
├── hooks/
│   └── useGuestMode.ts                # Hook to consume context
│
├── lib/
│   ├── demoData.ts                    # Demo data generator
│   └── migrateGuestData.ts            # Migration utility
│
├── components/
│   ├── auth/
│   │   └── AuthGate.tsx               # Auth gate modal
│   │
│   └── demo/
│       ├── DemoModeBanner.tsx         # Guest mode banner
│       └── MigrationModal.tsx         # Import demo data
```

### Files to Modify

```
src/
├── pages/
│   ├── Landing.tsx                    # Update CTAs
│   ├── Index.tsx                      # Major refactor
│   └── Auth.tsx                       # Return URL support
│
├── hooks/
│   └── useFeatureFlags.ts             # Guest restrictions
│
└── App.tsx                            # Wrap with provider
```

### Data Flow

**Guest Mode:**
```
User → Dashboard → Check Auth (none)
  → Load localStorage demo data
  → Display in UI (read-only)
  → Mutation attempt
  → Auth Gate
  → Redirect to signup
```

**Authenticated Mode:**
```
User → Dashboard → Check Auth (valid)
  → Fetch from API
  → Display in UI
  → Mutation → API call
  → Update UI
```

**Guest → Authenticated Transition:**
```
Guest User → Auth Gate → Signup
  → Auth Success
  → Check localStorage
  → Show Migration Modal
  → Import or Skip
  → Clear localStorage
  → Load real data from API
```

---

## UI/UX Requirements

### Visual Design

#### Demo Mode Banner

**Specifications:**
- **Position:** Fixed top, below header
- **Height:** 48px
- **Background:** Linear gradient `from-primary/10 to-primary/5`
- **Border:** Bottom `border-primary/20`
- **Layout:** Flex, space-between
- **Typography:**
  - Message: `text-sm font-medium text-foreground`
  - Emoji: `text-base` (🎉)
- **CTA Button:**
  - Style: `primary`
  - Size: `sm`
  - Text: "Sign Up Free"
  - Icon: Arrow right

**Responsive:**
- Desktop: Full message + button
- Tablet: Shortened message + button
- Mobile: Icon + "Demo Mode" + button

**Example:**
```tsx
<div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 px-6 py-3">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    <p className="text-sm font-medium text-foreground">
      <span className="text-base mr-2">🎉</span>
      You're exploring demo mode. Sign up to save your budgets!
    </p>
    <Button size="sm" onClick={() => navigate('/auth')}>
      Sign Up Free <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  </div>
</div>
```

---

#### Auth Gate Modal

**Specifications:**
- **Size:** `sm:max-w-md`
- **Background:** `bg-background`
- **Padding:** `p-6`
- **Border Radius:** `rounded-lg`
- **Shadow:** `shadow-xl`

**Header:**
- Icon: Contextual (💰 for budget, 📝 for transaction)
- Title: Dynamic based on action
- Size: `text-xl font-semibold`

**Content:**
- Benefit list with checkmarks
- 3-4 key benefits
- `text-sm text-muted-foreground`

**Actions:**
- Primary: "Sign Up Free" (full width on mobile)
- Secondary: "Cancel" (ghost button)
- Layout: Stacked on mobile, inline on desktop

**Example:**
```tsx
<Dialog>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <DollarSign className="h-6 w-6 text-primary" />
      </div>
      <DialogTitle className="text-center">
        Sign Up to Save Your Budget
      </DialogTitle>
      <DialogDescription className="text-center">
        Create a free account to access all features
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-3 py-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-primary" />
        <span className="text-sm">Save budgets and track expenses</span>
      </div>
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-primary" />
        <span className="text-sm">Sync across all your devices</span>
      </div>
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-primary" />
        <span className="text-sm">Connect Gmail for auto-tracking</span>
      </div>
    </div>

    <div className="flex gap-2">
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button className="flex-1" onClick={() => navigate('/auth')}>
        Sign Up Free
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

#### Migration Modal

**Specifications:**
- **Trigger:** Auto-show after signup with demo data
- **Dismissible:** No (must choose)
- **Animation:** Fade in with scale

**Layout:**
```
┌────────────────────────────────────────┐
│  🎉 Import Your Demo Budgets?          │
│                                        │
│  You created 6 budgets and 15         │
│  transactions in demo mode.           │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Demo Data Summary:               │ │
│  │ • 6 Budget Categories            │ │
│  │ • 15 Transactions                │ │
│  │ • $1,600 Total Budget            │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Start Fresh]  [Import Demo Data →]  │
└────────────────────────────────────────┘
```

**States:**
- Default: Show summary + choices
- Importing: Progress bar + "Importing..."
- Success: Checkmark + "Imported!" (auto-close)
- Error: Error message + retry

---

#### Disabled State Indicators

**Guest Mode Disabled Features:**

1. **Gmail Integration:**
   ```tsx
   <Button disabled={isGuestMode} className="relative">
     {isGuestMode && (
       <Lock className="absolute left-2 h-4 w-4 opacity-50" />
     )}
     Connect Gmail
   </Button>
   ```

2. **Export Data:**
   ```tsx
   <DropdownMenuItem disabled={isGuestMode}>
     <Download className="mr-2 h-4 w-4" />
     Export Data
     {isGuestMode && (
       <Badge variant="outline" className="ml-auto">Pro</Badge>
     )}
   </DropdownMenuItem>
   ```

3. **Settings:**
   ```tsx
   <Tooltip>
     <TooltipTrigger asChild>
       <Button disabled={isGuestMode}>
         <Settings />
       </Button>
     </TooltipTrigger>
     <TooltipContent>
       Sign up to change settings
     </TooltipContent>
   </Tooltip>
   ```

---

### Interaction Patterns

#### Button Click Behavior

**Guest Mode:**
1. User clicks "Add Budget"
2. Button shows loading state (100ms)
3. Auth gate modal fades in
4. Background dims (overlay)
5. Focus traps in modal
6. Escape key closes modal

**Authenticated Mode:**
1. User clicks "Add Budget"
2. Button shows loading state
3. Form/modal appears
4. Normal mutation flow

#### Navigation Behavior

**Guest Mode:**
- Period navigation: ✅ Allowed (updates demo data view)
- Budget reorder: ❌ Blocked (shows auth gate)
- Category rename: ❌ Blocked (shows auth gate)

**Transitions:**
- Demo → Auth: Smooth (no flicker)
- Auth → Dashboard: Immediate data load
- Migration: Progressive (show progress)

---

### Copy & Messaging

#### Demo Mode Banner Copy

**Primary:**
> 🎉 You're exploring demo mode. Sign up to save your budgets!

**Alternatives:**
- Short: "Demo Mode • Sign up to save"
- Long: "Try out Pocket Penny with demo data. Create an account to save your budgets."
- Urgent: "Love what you see? Sign up now to keep your data!"

#### Auth Gate Modal Copy

**For Budget Actions:**
> **Sign Up to Save Your Budget**
>
> Create a free account to:
> ✓ Save budgets and track expenses
> ✓ Sync across all your devices
> ✓ Connect Gmail for auto-tracking

**For Transaction Actions:**
> **Sign Up to Track This Expense**
>
> Create a free account to:
> ✓ Track all your spending
> ✓ Categorize transactions automatically
> ✓ View spending trends over time

**For Export:**
> **Sign Up to Export Your Data**
>
> Create a free account to:
> ✓ Export financial data as JSON
> ✓ Backup your budgets securely
> ✓ Analyze spending patterns

#### Migration Modal Copy

**Import Option:**
> **Import Your Demo Budgets?**
>
> You have 6 budgets and 15 transactions from demo mode.
> Import them to continue where you left off!

**Start Fresh Option:**
> Want to start fresh? No problem!
> Your demo data will be discarded.

---

### Accessibility

#### ARIA Labels

```tsx
// Demo mode banner
<div role="banner" aria-label="Demo mode notification">
  <p aria-live="polite">
    You're exploring demo mode
  </p>
</div>

// Auth gate modal
<Dialog
  aria-labelledby="auth-gate-title"
  aria-describedby="auth-gate-description"
>
  <DialogTitle id="auth-gate-title">
    Sign Up to Save Your Budget
  </DialogTitle>
  <DialogDescription id="auth-gate-description">
    Create a free account to access all features
  </DialogDescription>
</Dialog>

// Disabled buttons
<Button
  disabled={isGuestMode}
  aria-label="Export data - sign up required"
>
  Export
</Button>
```

#### Keyboard Navigation

- Tab order: Logical flow through guest mode elements
- Focus indicators: Clear visual focus states
- Escape key: Closes auth gate modal
- Enter key: Submits auth gate (sign up)

#### Screen Readers

**Announcements:**
1. Landing on demo dashboard: "Demo mode active. Explore features. Sign up to save."
2. Auth gate appears: "Sign up required to save budgets"
3. Migration modal: "Import demo data or start fresh"

---

## Internationalization (i18n)

### Overview

All new UI copy introduced by guest mode must support both **English** and **Spanish** languages, maintaining 100% translation coverage. The application uses a custom `useTranslation` hook with embedded translations.

### Translation Keys

All new translation keys to be added to `src/hooks/useTranslation.ts`:

#### Demo Mode Banner

| Key | English | Spanish |
|-----|---------|---------|
| `demoModeBanner.message` | "🎉 You're exploring demo mode. Sign up to save your budgets!" | "🎉 Estás explorando el modo demo. ¡Regístrate para guardar tus presupuestos!" |
| `demoModeBanner.messageShort` | "Demo Mode • Sign up to save" | "Modo Demo • Regístrate para guardar" |
| `demoModeBanner.cta` | "Sign Up Free" | "Regístrate Gratis" |

#### Auth Gate Modal

| Key | English | Spanish |
|-----|---------|---------|
| `authGate.budget.title` | "Sign Up to Save Your Budget" | "Regístrate para Guardar tu Presupuesto" |
| `authGate.budget.description` | "Create a free account to access all features" | "Crea una cuenta gratis para acceder a todas las funciones" |
| `authGate.budget.benefit1` | "Save budgets and track expenses" | "Guardar presupuestos y rastrear gastos" |
| `authGate.budget.benefit2` | "Sync across all your devices" | "Sincronizar en todos tus dispositivos" |
| `authGate.budget.benefit3` | "Connect Gmail for auto-tracking" | "Conectar Gmail para seguimiento automático" |
| `authGate.transaction.title` | "Sign Up to Track This Expense" | "Regístrate para Rastrear este Gasto" |
| `authGate.transaction.description` | "Create a free account to save your data" | "Crea una cuenta gratis para guardar tus datos" |
| `authGate.transaction.benefit1` | "Track all your spending" | "Rastrea todos tus gastos" |
| `authGate.transaction.benefit2` | "Categorize transactions automatically" | "Categoriza transacciones automáticamente" |
| `authGate.transaction.benefit3` | "View spending trends over time" | "Ver tendencias de gastos a lo largo del tiempo" |
| `authGate.export.title` | "Sign Up to Export Your Data" | "Regístrate para Exportar tus Datos" |
| `authGate.export.benefit1` | "Export financial data as JSON" | "Exportar datos financieros como JSON" |
| `authGate.export.benefit2` | "Backup your budgets securely" | "Respalda tus presupuestos de forma segura" |
| `authGate.export.benefit3` | "Analyze spending patterns" | "Analizar patrones de gasto" |
| `authGate.gmail.title` | "Sign Up to Connect Gmail" | "Regístrate para Conectar Gmail" |
| `authGate.gmail.benefit1` | "Auto-import transactions from email" | "Importar transacciones automáticamente del correo" |
| `authGate.gmail.benefit2` | "Never miss a purchase" | "Nunca pierdas una compra" |
| `authGate.gmail.benefit3` | "Smart categorization from receipts" | "Categorización inteligente desde recibos" |
| `authGate.settings.title` | "Sign Up to Save Settings" | "Regístrate para Guardar Configuración" |
| `authGate.settings.benefit1` | "Customize your budget periods" | "Personaliza tus períodos de presupuesto" |
| `authGate.settings.benefit2` | "Set your preferred currency" | "Establece tu moneda preferida" |
| `authGate.settings.benefit3` | "Save language preferences" | "Guardar preferencias de idioma" |
| `authGate.cta` | "Sign Up Free" | "Regístrate Gratis" |
| `authGate.cancel` | "Cancel" | "Cancelar" |

#### Migration Modal

| Key | English | Spanish |
|-----|---------|---------|
| `migration.title` | "Import Your Demo Budgets?" | "¿Importar tus Presupuestos Demo?" |
| `migration.description` | "You have {budgetCount} budgets and {transactionCount} transactions from demo mode." | "Tienes {budgetCount} presupuestos y {transactionCount} transacciones del modo demo." |
| `migration.summaryTitle` | "Demo Data Summary:" | "Resumen de Datos Demo:" |
| `migration.budgetCategories` | "{count} Budget Categories" | "{count} Categorías de Presupuesto" |
| `migration.transactions` | "{count} Transactions" | "{count} Transacciones" |
| `migration.totalBudget` | "${amount} Total Budget" | "${amount} Presupuesto Total" |
| `migration.importCta` | "Import Demo Data" | "Importar Datos Demo" |
| `migration.startFreshCta` | "Start Fresh" | "Empezar de Cero" |
| `migration.importingMessage` | "Importing..." | "Importando..." |
| `migration.importingProgress` | "Importing {current} of {total}" | "Importando {current} de {total}" |
| `migration.successMessage` | "Imported!" | "¡Importado!" |
| `migration.errorMessage` | "Import failed. Please try again." | "La importación falló. Por favor intenta de nuevo." |
| `migration.retryButton` | "Retry" | "Reintentar" |
| `migration.startFreshDescription` | "Want to start fresh? No problem! Your demo data will be discarded." | "¿Quieres empezar de cero? ¡No hay problema! Tus datos demo se descartarán." |

#### Tooltips & Button States

| Key | English | Spanish |
|-----|---------|---------|
| `guestMode.tooltip.signUpRequired` | "Sign up to use this feature" | "Regístrate para usar esta función" |
| `guestMode.tooltip.proFeature` | "Pro feature - Sign up to unlock" | "Función Pro - Regístrate para desbloquear" |
| `guestMode.button.disabled` | "Available after signup" | "Disponible después de registrarse" |
| `guestMode.feature.locked` | "Locked" | "Bloqueado" |

#### Error Messages

| Key | English | Spanish |
|-----|---------|---------|
| `guestMode.error.storageQuota` | "Demo data storage is full. Please sign up to continue." | "El almacenamiento de datos demo está lleno. Por favor regístrate para continuar." |
| `guestMode.error.corruptedData` | "Demo data corrupted. Generating fresh data..." | "Datos demo corruptos. Generando datos frescos..." |
| `guestMode.error.migrationFailed` | "Failed to import demo data. You can add budgets manually." | "Error al importar datos demo. Puedes agregar presupuestos manualmente." |

#### Success Messages

| Key | English | Spanish |
|-----|---------|---------|
| `guestMode.success.migrationComplete` | "Demo data imported successfully!" | "¡Datos demo importados exitosamente!" |
| `guestMode.success.accountCreated` | "Account created! Welcome to Pocket Penny." | "¡Cuenta creada! Bienvenido a Pocket Penny." |

#### Aria Labels (Accessibility)

| Key | English | Spanish |
|-----|---------|---------|
| `aria.demoModeBanner` | "Demo mode notification" | "Notificación de modo demo" |
| `aria.demoModeActive` | "Demo mode active. Explore features. Sign up to save." | "Modo demo activo. Explora las funciones. Regístrate para guardar." |
| `aria.authGateRequired` | "Sign up required to save budgets" | "Registro requerido para guardar presupuestos" |
| `aria.migrationPrompt` | "Import demo data or start fresh" | "Importar datos demo o empezar de cero" |
| `aria.featureLocked` | "Feature locked. Sign up to unlock." | "Función bloqueada. Regístrate para desbloquear." |
| `aria.guestModeButton` | "Sign up to unlock this action" | "Regístrate para desbloquear esta acción" |

---

### useTranslation Hook Updates

Update `src/hooks/useTranslation.ts` to include all new keys:

```typescript
// Example structure (add to existing translations object)
const translations = {
  english: {
    // ... existing translations

    // Demo Mode Banner
    demoModeBanner: {
      message: "🎉 You're exploring demo mode. Sign up to save your budgets!",
      messageShort: "Demo Mode • Sign up to save",
      cta: "Sign Up Free"
    },

    // Auth Gate Modal
    authGate: {
      budget: {
        title: "Sign Up to Save Your Budget",
        description: "Create a free account to access all features",
        benefit1: "Save budgets and track expenses",
        benefit2: "Sync across all your devices",
        benefit3: "Connect Gmail for auto-tracking"
      },
      transaction: {
        title: "Sign Up to Track This Expense",
        description: "Create a free account to save your data",
        benefit1: "Track all your spending",
        benefit2: "Categorize transactions automatically",
        benefit3: "View spending trends over time"
      },
      export: {
        title: "Sign Up to Export Your Data",
        benefit1: "Export financial data as JSON",
        benefit2: "Backup your budgets securely",
        benefit3: "Analyze spending patterns"
      },
      gmail: {
        title: "Sign Up to Connect Gmail",
        benefit1: "Auto-import transactions from email",
        benefit2: "Never miss a purchase",
        benefit3: "Smart categorization from receipts"
      },
      settings: {
        title: "Sign Up to Save Settings",
        benefit1: "Customize your budget periods",
        benefit2: "Set your preferred currency",
        benefit3: "Save language preferences"
      },
      cta: "Sign Up Free",
      cancel: "Cancel"
    },

    // Migration Modal
    migration: {
      title: "Import Your Demo Budgets?",
      description: (budgetCount: number, transactionCount: number) =>
        `You have ${budgetCount} budgets and ${transactionCount} transactions from demo mode.`,
      summaryTitle: "Demo Data Summary:",
      budgetCategories: (count: number) => `${count} Budget Categories`,
      transactions: (count: number) => `${count} Transactions`,
      totalBudget: (amount: number) => `$${amount} Total Budget`,
      importCta: "Import Demo Data",
      startFreshCta: "Start Fresh",
      importingMessage: "Importing...",
      importingProgress: (current: number, total: number) =>
        `Importing ${current} of ${total}`,
      successMessage: "Imported!",
      errorMessage: "Import failed. Please try again.",
      retryButton: "Retry",
      startFreshDescription: "Want to start fresh? No problem! Your demo data will be discarded."
    },

    // Tooltips & Button States
    guestMode: {
      tooltip: {
        signUpRequired: "Sign up to use this feature",
        proFeature: "Pro feature - Sign up to unlock"
      },
      button: {
        disabled: "Available after signup"
      },
      feature: {
        locked: "Locked"
      },
      error: {
        storageQuota: "Demo data storage is full. Please sign up to continue.",
        corruptedData: "Demo data corrupted. Generating fresh data...",
        migrationFailed: "Failed to import demo data. You can add budgets manually."
      },
      success: {
        migrationComplete: "Demo data imported successfully!",
        accountCreated: "Account created! Welcome to Pocket Penny."
      }
    },

    // Aria Labels
    aria: {
      demoModeBanner: "Demo mode notification",
      demoModeActive: "Demo mode active. Explore features. Sign up to save.",
      authGateRequired: "Sign up required to save budgets",
      migrationPrompt: "Import demo data or start fresh",
      featureLocked: "Feature locked. Sign up to unlock.",
      guestModeButton: "Sign up to unlock this action"
    }
  },

  spanish: {
    // ... existing translations

    // Demo Mode Banner
    demoModeBanner: {
      message: "🎉 Estás explorando el modo demo. ¡Regístrate para guardar tus presupuestos!",
      messageShort: "Modo Demo • Regístrate para guardar",
      cta: "Regístrate Gratis"
    },

    // Auth Gate Modal
    authGate: {
      budget: {
        title: "Regístrate para Guardar tu Presupuesto",
        description: "Crea una cuenta gratis para acceder a todas las funciones",
        benefit1: "Guardar presupuestos y rastrear gastos",
        benefit2: "Sincronizar en todos tus dispositivos",
        benefit3: "Conectar Gmail para seguimiento automático"
      },
      transaction: {
        title: "Regístrate para Rastrear este Gasto",
        description: "Crea una cuenta gratis para guardar tus datos",
        benefit1: "Rastrea todos tus gastos",
        benefit2: "Categoriza transacciones automáticamente",
        benefit3: "Ver tendencias de gastos a lo largo del tiempo"
      },
      export: {
        title: "Regístrate para Exportar tus Datos",
        benefit1: "Exportar datos financieros como JSON",
        benefit2: "Respalda tus presupuestos de forma segura",
        benefit3: "Analizar patrones de gasto"
      },
      gmail: {
        title: "Regístrate para Conectar Gmail",
        benefit1: "Importar transacciones automáticamente del correo",
        benefit2: "Nunca pierdas una compra",
        benefit3: "Categorización inteligente desde recibos"
      },
      settings: {
        title: "Regístrate para Guardar Configuración",
        benefit1: "Personaliza tus períodos de presupuesto",
        benefit2: "Establece tu moneda preferida",
        benefit3: "Guardar preferencias de idioma"
      },
      cta: "Regístrate Gratis",
      cancel: "Cancelar"
    },

    // Migration Modal
    migration: {
      title: "¿Importar tus Presupuestos Demo?",
      description: (budgetCount: number, transactionCount: number) =>
        `Tienes ${budgetCount} presupuestos y ${transactionCount} transacciones del modo demo.`,
      summaryTitle: "Resumen de Datos Demo:",
      budgetCategories: (count: number) => `${count} Categorías de Presupuesto`,
      transactions: (count: number) => `${count} Transacciones`,
      totalBudget: (amount: number) => `$${amount} Presupuesto Total`,
      importCta: "Importar Datos Demo",
      startFreshCta: "Empezar de Cero",
      importingMessage: "Importando...",
      importingProgress: (current: number, total: number) =>
        `Importando ${current} de ${total}`,
      successMessage: "¡Importado!",
      errorMessage: "La importación falló. Por favor intenta de nuevo.",
      retryButton: "Reintentar",
      startFreshDescription: "¿Quieres empezar de cero? ¡No hay problema! Tus datos demo se descartarán."
    },

    // Tooltips & Button States
    guestMode: {
      tooltip: {
        signUpRequired: "Regístrate para usar esta función",
        proFeature: "Función Pro - Regístrate para desbloquear"
      },
      button: {
        disabled: "Disponible después de registrarse"
      },
      feature: {
        locked: "Bloqueado"
      },
      error: {
        storageQuota: "El almacenamiento de datos demo está lleno. Por favor regístrate para continuar.",
        corruptedData: "Datos demo corruptos. Generando datos frescos...",
        migrationFailed: "Error al importar datos demo. Puedes agregar presupuestos manualmente."
      },
      success: {
        migrationComplete: "¡Datos demo importados exitosamente!",
        accountCreated: "¡Cuenta creada! Bienvenido a Pocket Penny."
      }
    },

    // Aria Labels
    aria: {
      demoModeBanner: "Notificación de modo demo",
      demoModeActive: "Modo demo activo. Explora las funciones. Regístrate para guardar.",
      authGateRequired: "Registro requerido para guardar presupuestos",
      migrationPrompt: "Importar datos demo o empezar de cero",
      featureLocked: "Función bloqueada. Regístrate para desbloquear.",
      guestModeButton: "Regístrate para desbloquear esta acción"
    }
  }
};
```

---

### Component Usage Examples

#### DemoModeBanner Component

```tsx
import { useTranslation } from '@/hooks/useTranslation';

export const DemoModeBanner = () => {
  const { t, language } = useTranslation();

  return (
    <div
      role="banner"
      aria-label={t('aria.demoModeBanner')}
      className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 px-6 py-3"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p
          className="text-sm font-medium text-foreground"
          aria-live="polite"
        >
          {t('demoModeBanner.message')}
        </p>
        <Button size="sm" onClick={() => navigate('/auth')}>
          {t('demoModeBanner.cta')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
```

#### AuthGate Component

```tsx
import { useTranslation } from '@/hooks/useTranslation';

interface AuthGateProps {
  action: 'budget' | 'transaction' | 'export' | 'gmail' | 'settings';
  onClose: () => void;
}

export const AuthGate = ({ action, onClose }: AuthGateProps) => {
  const { t } = useTranslation();

  return (
    <Dialog
      aria-labelledby="auth-gate-title"
      aria-describedby="auth-gate-description"
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle id="auth-gate-title">
            {t(`authGate.${action}.title`)}
          </DialogTitle>
          <DialogDescription id="auth-gate-description">
            {t(`authGate.${action}.description`)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="text-sm">{t(`authGate.${action}.benefit1`)}</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="text-sm">{t(`authGate.${action}.benefit2`)}</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="text-sm">{t(`authGate.${action}.benefit3`)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t('authGate.cancel')}
          </Button>
          <Button className="flex-1" onClick={() => navigate('/auth')}>
            {t('authGate.cta')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

#### MigrationModal Component

```tsx
import { useTranslation } from '@/hooks/useTranslation';

export const MigrationModal = ({ budgetCount, transactionCount, totalAmount }) => {
  const { t } = useTranslation();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('migration.title')}</DialogTitle>
          <DialogDescription>
            {t('migration.description', budgetCount, transactionCount)}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-md space-y-2">
          <p className="font-medium">{t('migration.summaryTitle')}</p>
          <ul className="space-y-1 text-sm">
            <li>• {t('migration.budgetCategories', budgetCount)}</li>
            <li>• {t('migration.transactions', transactionCount)}</li>
            <li>• {t('migration.totalBudget', totalAmount)}</li>
          </ul>
        </div>

        {isImporting && (
          <div className="text-center">
            <p>{t('migration.importingMessage')}</p>
            <p className="text-sm text-muted-foreground">
              {t('migration.importingProgress', progress.current, progress.total)}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleStartFresh}>
            {t('migration.startFreshCta')}
          </Button>
          <Button className="flex-1" onClick={handleImport} disabled={isImporting}>
            {t('migration.importCta')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

---

### Implementation Checklist

**Phase 1: Translation Keys (Day 1)**
- [ ] Add all translation keys to `useTranslation.ts`
- [ ] Test translation switching (English ↔ Spanish)
- [ ] Verify all keys accessible via `t()` function
- [ ] Check for TypeScript type safety

**Phase 2: Component Integration (Days 2-4)**
- [ ] Update DemoModeBanner with translations
- [ ] Update AuthGate with dynamic translations
- [ ] Update MigrationModal with translations
- [ ] Add tooltips with translated text
- [ ] Update ARIA labels with translations

**Phase 3: Testing (Day 5)**
- [ ] Test all UI copy in English
- [ ] Test all UI copy in Spanish
- [ ] Verify language switching works in guest mode
- [ ] Check responsive text wrapping for both languages
- [ ] Validate character limits don't break layouts

**Phase 4: QA (Day 6)**
- [ ] Native Spanish speaker review
- [ ] Accessibility audit (screen readers in both languages)
- [ ] Character encoding verification
- [ ] RTL compatibility check (future-proofing)

---

### Translation Quality Guidelines

**Spanish Translation Notes:**

1. **Formality:** Use "tú" (informal) form, matching existing app tone
2. **Gender:** Use inclusive language where possible
3. **Technical Terms:**
   - "Budget" → "Presupuesto"
   - "Transaction" → "Transacción"
   - "Demo" → "Demo" (keep as loanword)
   - "Sign up" → "Registrarse/Regístrate"
4. **Button CTAs:** Use imperative form ("Regístrate" not "Registrarse")
5. **Cultural Context:** Maintain enthusiasm (emojis work in Spanish too!)

**Character Count Considerations:**

Spanish text is typically **20-30% longer** than English. Component layouts must accommodate:

- Demo banner: Test with full Spanish text on mobile
- Modal titles: Allow for longer text without truncation
- Button labels: Ensure buttons don't overflow
- Tooltips: Verify tooltip positioning with longer text

---

### Accessibility Compliance

**WCAG 2.1 AA Requirements:**

1. **Language Declaration:**
   ```html
   <html lang="en"> <!-- or "es" -->
   ```

2. **ARIA Labels:**
   - All interactive elements must have aria-labels in current language
   - Dynamically update aria-labels on language change

3. **Screen Reader Announcements:**
   - Test with VoiceOver (macOS/iOS) in both languages
   - Test with NVDA (Windows) in both languages

4. **Text Alternatives:**
   - Emoji meanings conveyed in text
   - Icon buttons have text labels

---

### Future Internationalization

**Planned Languages (Phase 2):**
- 🇫🇷 French
- 🇩🇪 German
- 🇵🇹 Portuguese

**Infrastructure Improvements:**
- Move from embedded translations to JSON files
- Implement translation management system
- Add professional translation review process
- Implement pluralization rules per language
- Add number/currency formatting per locale

---

## Implementation Plan

### Phase 1: Foundation (Week 1 - Days 1-2)

**Goal:** Set up core infrastructure

#### Day 1: Data Layer
- [ ] Create `src/lib/demoData.ts`
  - Generate demo budgets (6 categories)
  - Generate demo transactions (15 items)
  - Export `generateDemoData()` function
  - Add TypeScript types

- [ ] Create localStorage utilities
  - `saveDemoData()`
  - `loadDemoData()`
  - `clearDemoData()`
  - Auto-cleanup logic

- [ ] Write unit tests
  - Demo data generation
  - LocalStorage operations
  - TTL enforcement

**Acceptance Criteria:**
- [ ] Demo data generates consistently
- [ ] localStorage works in all browsers
- [ ] Auto-cleanup triggers correctly
- [ ] 100% test coverage for utilities

---

#### Day 2: State Management
- [ ] Create `src/contexts/GuestModeContext.tsx`
  - Provider component
  - State: `isGuestMode`, `demoData`
  - Methods: `showAuthGate()`, `clearDemo()`

- [ ] Create `src/hooks/useGuestMode.ts`
  - Hook to consume context
  - Type-safe interface
  - Memoized selectors

- [ ] Wrap App with GuestModeProvider
  - Update `src/App.tsx`
  - Ensure proper nesting

**Acceptance Criteria:**
- [ ] Context provides all needed state
- [ ] Hook works in all components
- [ ] No unnecessary re-renders
- [ ] TypeScript types correct

---

### Phase 2: UI Components (Week 1 - Days 3-4)

#### Day 3: Core Components
- [ ] Create `src/components/demo/DemoModeBanner.tsx`
  - Responsive design
  - CTA button
  - Animation (optional)

- [ ] Create `src/components/auth/AuthGate.tsx`
  - Modal component
  - Dynamic messaging
  - Context-aware copy

- [ ] Create `src/components/demo/MigrationModal.tsx`
  - Summary display
  - Progress indication
  - Error handling

**Acceptance Criteria:**
- [ ] All components render correctly
- [ ] Responsive on all screen sizes
- [ ] Accessible (ARIA, keyboard)
- [ ] Matches design specs

---

#### Day 4: Integration
- [ ] Update Landing page
  - Change all "Get Started" to `/dashboard`
  - Update copy
  - Test navigation

- [ ] Create `src/lib/migrateGuestData.ts`
  - Batch create budgets
  - Batch create transactions
  - Error handling
  - Progress tracking

**Acceptance Criteria:**
- [ ] Landing CTAs work correctly
- [ ] Migration logic tested
- [ ] API calls batched efficiently
- [ ] Errors handled gracefully

---

### Phase 3: Dashboard Refactor (Week 2 - Days 5-7)

#### Day 5: Core Logic
- [ ] Refactor `src/pages/Index.tsx`
  - Remove auth redirect
  - Add guest mode detection
  - Modify data queries
  - Add conditional rendering

- [ ] Update data fetching
  - Disable API calls in guest mode
  - Use demo data when appropriate
  - Maintain type safety

**Acceptance Criteria:**
- [ ] No auth redirect in guest mode
- [ ] Demo data displays correctly
- [ ] No API calls in guest mode
- [ ] Smooth transitions

---

#### Day 6: Mutation Gates
- [ ] Wrap all mutations with auth gates
  - Add Budget
  - Add Transaction
  - Edit operations
  - Delete operations

- [ ] Update feature flags
  - Modify `useFeatureFlags.ts`
  - Accept `isGuestMode` param
  - Return correct restrictions

**Acceptance Criteria:**
- [ ] All mutations gated in guest mode
- [ ] Auth modal appears on attempts
- [ ] Feature flags work correctly
- [ ] No server mutations possible

---

#### Day 7: Polish & Testing
- [ ] Add demo mode banner to dashboard
- [ ] Implement return URL support in Auth page
- [ ] Add migration modal trigger
- [ ] Integration testing

**Acceptance Criteria:**
- [ ] Banner shows in guest mode only
- [ ] Return URLs work correctly
- [ ] Migration modal appears when needed
- [ ] All flows tested end-to-end

---

### Phase 4: Analytics & Launch (Week 2 - Days 8-10)

#### Day 8: Analytics
- [ ] Add PostHog events
  - `guest_mode_entered`
  - `guest_action_attempted`
  - `guest_signup_prompted`
  - `guest_converted`
  - `guest_data_migrated`

- [ ] Create analytics dashboard
  - Conversion funnel
  - Feature interaction
  - Drop-off analysis

**Acceptance Criteria:**
- [ ] All events fire correctly
- [ ] Event properties captured
- [ ] Dashboard shows metrics
- [ ] Funnel configured in PostHog

---

#### Day 9: QA & Bug Fixes
- [ ] Cross-browser testing
  - Chrome, Firefox, Safari
  - Desktop + mobile

- [ ] Edge case testing
  - Stale demo data
  - Corrupted localStorage
  - Multiple tabs
  - Network errors

- [ ] Bug fixes
  - Address all QA findings
  - Performance optimization

**Acceptance Criteria:**
- [ ] Works in all major browsers
- [ ] All edge cases handled
- [ ] No critical bugs
- [ ] Performance acceptable

---

#### Day 10: Launch
- [ ] Documentation
  - Update README
  - Add product docs
  - Team training

- [ ] Feature flag rollout
  - Enable for 10% of users
  - Monitor metrics
  - Gradual rollout to 100%

- [ ] Post-launch monitoring
  - Watch analytics
  - Monitor errors
  - Gather feedback

**Acceptance Criteria:**
- [ ] Documentation complete
- [ ] Feature flag working
- [ ] Metrics being tracked
- [ ] Team trained

---

### Rollback Plan

**If critical issues arise:**

1. **Immediate Actions** (< 5 minutes):
   - Set feature flag to 0%
   - Disable guest mode entirely
   - Revert to auth-required flow

2. **Investigation** (1-2 hours):
   - Review error logs
   - Check analytics for patterns
   - Identify root cause

3. **Fix or Rollback** (2-4 hours):
   - If fixable: Deploy hotfix
   - If complex: Full rollback

4. **Post-Mortem** (24 hours):
   - Document issue
   - Update testing
   - Improve monitoring

---

## Analytics & Tracking

### Events to Implement

#### Guest Mode Events

**1. guest_mode_entered**
```typescript
posthog.capture('guest_mode_entered', {
  source: 'landing_page' | 'direct_url',
  demo_data_exists: boolean,
  timestamp: Date
});
```

**2. guest_action_attempted**
```typescript
posthog.capture('guest_action_attempted', {
  action: 'add_budget' | 'add_transaction' | 'edit_budget' | ...,
  demo_budgets_viewed: number,
  demo_transactions_viewed: number,
  time_in_demo_mode: seconds
});
```

**3. guest_signup_prompted**
```typescript
posthog.capture('guest_signup_prompted', {
  action: string,
  prompt_number: number, // 1st, 2nd, 3rd attempt
  time_since_demo_start: seconds
});
```

**4. guest_converted**
```typescript
posthog.capture('guest_converted', {
  signup_method: 'email' | 'google',
  time_in_demo: seconds,
  actions_attempted: number,
  features_explored: string[]
});
```

**5. guest_data_migrated**
```typescript
posthog.capture('guest_data_migrated', {
  budgets_imported: number,
  transactions_imported: number,
  migration_time: milliseconds
});
```

**6. guest_demo_data_interaction**
```typescript
posthog.capture('guest_demo_data_interaction', {
  interaction_type: 'view_budget' | 'view_transaction' | 'navigate_period',
  item_id: string,
  time_since_start: seconds
});
```

---

### Funnels to Track

#### Primary Funnel: Guest to Signup
```
1. guest_mode_entered
2. guest_demo_data_interaction (at least 1)
3. guest_action_attempted
4. guest_signup_prompted
5. guest_converted
```

**Target Conversion:** >15% (guest → signup)

#### Secondary Funnel: Demo Exploration
```
1. guest_mode_entered
2. View budgets
3. View transactions
4. Navigate periods
5. Attempt action
```

**Target:** >70% explore at least 3 features

#### Migration Funnel
```
1. guest_converted
2. Migration modal shown
3. Import selected OR Start fresh
4. guest_data_migrated (if import)
```

**Target:** >40% choose to import demo data

---

### Dashboards to Create

**1. Guest Mode Overview**
- Daily guest mode entries
- Guest → Signup conversion rate
- Time spent in demo mode (avg)
- Top attempted actions

**2. Feature Discovery**
- Most viewed demo features
- Feature interaction heatmap
- Click patterns in demo mode
- Drop-off points

**3. Conversion Analysis**
- Conversion by traffic source
- Conversion by features explored
- Optimal demo duration for conversion
- Best-performing auth gate messages

---

### A/B Tests to Run

**1. Auth Gate Timing**
- **Variant A:** Show on first action attempt
- **Variant B:** Show after 3 action attempts
- **Variant C:** Show after 5 minutes in demo
- **Metric:** Signup conversion rate

**2. Migration Modal Default**
- **Variant A:** "Import" pre-selected
- **Variant B:** "Start Fresh" pre-selected
- **Variant C:** No pre-selection
- **Metric:** Import rate, user retention

**3. Demo Mode Banner Copy**
- **Variant A:** "Demo Mode • Sign up to save"
- **Variant B:** "Love it? Sign up to keep your data!"
- **Variant C:** "Exploring? Create free account to save"
- **Metric:** Banner CTA click rate

**4. Auth Gate CTA**
- **Variant A:** "Sign Up Free"
- **Variant B:** "Create Free Account"
- **Variant C:** "Save My Data"
- **Metric:** Auth gate conversion

---

## Testing Requirements

### Unit Tests

**Demo Data Generation:**
```typescript
describe('generateDemoData', () => {
  it('generates 6 budget categories', () => {
    const data = generateDemoData();
    expect(data.budgets).toHaveLength(6);
  });

  it('generates 15 transactions', () => {
    const data = generateDemoData();
    expect(data.transactions).toHaveLength(15);
  });

  it('uses realistic amounts', () => {
    const data = generateDemoData();
    data.budgets.forEach(budget => {
      expect(budget.amount).toBeGreaterThan(0);
      expect(budget.amount).toBeLessThan(1000);
    });
  });

  it('includes categorized and uncategorized transactions', () => {
    const data = generateDemoData();
    const categorized = data.transactions.filter(t => t.category);
    const uncategorized = data.transactions.filter(t => !t.category);
    expect(categorized.length).toBeGreaterThan(0);
    expect(uncategorized.length).toBeGreaterThan(0);
  });
});
```

**LocalStorage Utilities:**
```typescript
describe('LocalStorage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves demo data to localStorage', () => {
    const data = generateDemoData();
    saveDemoData(data);
    const stored = localStorage.getItem(DEMO_DATA_KEY);
    expect(stored).toBeTruthy();
  });

  it('loads demo data from localStorage', () => {
    const data = generateDemoData();
    saveDemoData(data);
    const loaded = loadDemoData();
    expect(loaded.budgets).toEqual(data.budgets);
  });

  it('clears stale data after TTL', () => {
    const data = generateDemoData();
    data.lastAccessed = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
    saveDemoData(data);
    const loaded = loadDemoData();
    expect(loaded).toBeNull();
  });

  it('handles corrupted data gracefully', () => {
    localStorage.setItem(DEMO_DATA_KEY, 'invalid json');
    const loaded = loadDemoData();
    expect(loaded).toBeNull();
  });
});
```

**GuestModeContext:**
```typescript
describe('GuestModeContext', () => {
  it('provides isGuestMode flag', () => {
    const { result } = renderHook(() => useGuestMode());
    expect(result.current.isGuestMode).toBeDefined();
  });

  it('loads demo data when not authenticated', () => {
    const { result } = renderHook(() => useGuestMode(), {
      wrapper: ({ children }) => (
        <GuestModeProvider isAuthenticated={false}>
          {children}
        </GuestModeProvider>
      )
    });
    expect(result.current.demoData).toBeTruthy();
  });

  it('does not load demo data when authenticated', () => {
    const { result } = renderHook(() => useGuestMode(), {
      wrapper: ({ children }) => (
        <GuestModeProvider isAuthenticated={true}>
          {children}
        </GuestModeProvider>
      )
    });
    expect(result.current.demoData).toBeNull();
  });
});
```

---

### Integration Tests

**Guest Mode Flow:**
```typescript
describe('Guest Mode Flow', () => {
  it('allows access to dashboard without auth', async () => {
    render(<App />);

    // Navigate to dashboard
    fireEvent.click(screen.getByText('Get Started'));

    // Should see dashboard without redirect
    await waitFor(() => {
      expect(screen.getByText('Budget Summary')).toBeInTheDocument();
    });
  });

  it('displays demo data', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('$500')).toBeInTheDocument();
    });
  });

  it('shows auth gate on mutation attempt', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(screen.getByText('Add Budget')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Budget'));

    await waitFor(() => {
      expect(screen.getByText('Sign Up to Save Your Budget')).toBeInTheDocument();
    });
  });
});
```

**Auth Conversion Flow:**
```typescript
describe('Auth Conversion Flow', () => {
  it('redirects to auth with return URL', async () => {
    render(<App />);

    // Enter guest mode
    fireEvent.click(screen.getByText('Get Started'));
    await waitFor(() => expect(screen.getByText('Demo Mode')).toBeInTheDocument());

    // Attempt mutation
    fireEvent.click(screen.getByText('Add Budget'));

    // Click signup in auth gate
    fireEvent.click(screen.getByText('Sign Up Free'));

    // Should be on auth page with return URL
    expect(window.location.pathname).toBe('/auth');
    expect(window.location.search).toContain('return=/dashboard');
  });

  it('returns to dashboard after signup', async () => {
    // Mock auth success
    const mockSignup = jest.fn().mockResolvedValue({ success: true });

    render(<App />);

    // Complete signup
    await mockSignup({ email: 'test@example.com', password: 'test123' });

    // Should redirect to dashboard
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });
  });
});
```

**Migration Flow:**
```typescript
describe('Migration Flow', () => {
  it('shows migration modal after signup with demo data', async () => {
    // Set demo data in localStorage
    const demoData = generateDemoData();
    saveDemoData(demoData);

    // Complete signup
    const { result } = await completeSignup();

    // Should show migration modal
    await waitFor(() => {
      expect(screen.getByText('Import Your Demo Budgets?')).toBeInTheDocument();
    });
  });

  it('imports demo data successfully', async () => {
    const demoData = generateDemoData();
    saveDemoData(demoData);

    await completeSignup();

    // Click import
    fireEvent.click(screen.getByText('Import Demo Data'));

    // Should show progress
    await waitFor(() => {
      expect(screen.getByText('Importing...')).toBeInTheDocument();
    });

    // Should complete and clear localStorage
    await waitFor(() => {
      expect(localStorage.getItem(DEMO_DATA_KEY)).toBeNull();
    });
  });
});
```

---

### E2E Tests (Cypress/Playwright)

```typescript
describe('Guest Mode E2E', () => {
  it('complete guest to signup flow', () => {
    cy.visit('/');

    // Click Get Started
    cy.contains('Get Started').click();

    // Should be on dashboard
    cy.url().should('include', '/dashboard');

    // Should see demo banner
    cy.contains('Demo Mode').should('be.visible');

    // Should see demo data
    cy.contains('Groceries').should('be.visible');
    cy.contains('$500').should('be.visible');

    // Try to add budget
    cy.contains('Add Budget').click();

    // Should see auth gate
    cy.contains('Sign Up to Save Your Budget').should('be.visible');

    // Click sign up
    cy.contains('Sign Up Free').click();

    // Should be on auth page
    cy.url().should('include', '/auth');
    cy.url().should('include', 'return=/dashboard');

    // Complete signup
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.contains('Create Account').click();

    // Should return to dashboard
    cy.url().should('include', '/dashboard');

    // Should see migration modal
    cy.contains('Import Your Demo Budgets?').should('be.visible');

    // Import demo data
    cy.contains('Import Demo Data').click();

    // Should see success
    cy.contains('Imported!').should('be.visible');

    // Demo banner should be gone
    cy.contains('Demo Mode').should('not.exist');
  });
});
```

---

### Manual QA Checklist

#### Guest Mode Entry
- [ ] Landing page "Get Started" navigates to dashboard
- [ ] Dashboard loads without authentication
- [ ] Demo mode banner appears
- [ ] Demo budgets display correctly
- [ ] Demo transactions display correctly
- [ ] All read-only features work (view, navigate, etc.)

#### Auth Gates
- [ ] Add Budget shows auth gate
- [ ] Add Transaction shows auth gate
- [ ] Edit operations show auth gate
- [ ] Delete operations show auth gate
- [ ] Auth gate has correct copy
- [ ] "Sign Up" button works
- [ ] "Cancel" button works
- [ ] Modal dismisses on outside click
- [ ] Escape key closes modal

#### Auth Flow
- [ ] Return URL preserved in auth page
- [ ] Signup succeeds and redirects
- [ ] Login succeeds and redirects
- [ ] Google OAuth works with return URL
- [ ] Error handling works

#### Migration
- [ ] Migration modal appears for guest conversions
- [ ] Demo data summary is accurate
- [ ] Import button works
- [ ] Start Fresh button works
- [ ] Progress indicator shows during import
- [ ] Success state appears
- [ ] localStorage cleared after migration
- [ ] Real data loads correctly

#### Edge Cases
- [ ] Browser refresh preserves demo data
- [ ] Multiple tabs sync demo mode status
- [ ] Stale demo data auto-clears
- [ ] Corrupted localStorage handled gracefully
- [ ] Network errors handled gracefully
- [ ] Concurrent auth attempts handled
- [ ] Demo data size limit enforced

#### Cross-Browser
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

#### Performance
- [ ] Demo data loads in <100ms
- [ ] Auth gate appears in <200ms
- [ ] Migration completes in <2s for 15 items
- [ ] No memory leaks in long sessions
- [ ] LocalStorage operations don't block UI

---

## Security & Privacy

### Security Considerations

#### Data Protection
1. **No Server Storage of Guest Data**
   - Demo data never sent to server
   - All storage is client-side (localStorage)
   - No authentication tokens for guests
   - No session cookies for guests

2. **Authentication Gates**
   - All write operations blocked in guest mode
   - No API calls possible without auth token
   - Auth gates cannot be bypassed via devtools
   - Server validates all mutations regardless of client state

3. **LocalStorage Security**
   - Demo data contains no PII
   - No sensitive information stored
   - Auto-cleanup prevents accumulation
   - Versioned schema allows safe migration

4. **XSS Prevention**
   - All demo data sanitized before rendering
   - No user-generated content in demo mode
   - React's built-in XSS protection applies
   - No dangerouslySetInnerHTML used

#### Privacy Compliance

**GDPR:**
- ✅ No personal data collected in guest mode
- ✅ No cookies set for guests
- ✅ No tracking before consent
- ✅ Demo data deletable anytime
- ✅ Privacy policy updated to reflect guest mode

**CCPA:**
- ✅ No personal information sold
- ✅ Demo data not shared with third parties
- ✅ Users can delete demo data
- ✅ Transparent data practices

**Data Minimization:**
- Only essential demo data generated
- No unnecessary data collection
- Guest mode fully functional without PII
- Minimal localStorage usage

---

### Migration Security

**Demo Data Import:**
1. **Validation:**
   - Verify demo data structure before import
   - Sanitize all user inputs
   - Validate budget amounts (positive, reasonable)
   - Check transaction dates (valid dates)

2. **Rate Limiting:**
   - Limit import to once per signup
   - Batch API calls to prevent overload
   - Implement exponential backoff on errors
   - Maximum 50 items per import

3. **Error Handling:**
   - Graceful degradation on import failures
   - Partial imports rollback on error
   - Clear error messages to user
   - Logging for debugging

4. **Data Integrity:**
   - Atomic operations (all or nothing)
   - Duplicate prevention
   - Category creation idempotent
   - Transaction uniqueness enforced

---

### API Protection

**Server-Side Validation:**
```typescript
// Example: Budget creation endpoint
app.post('/api/budgets', authenticateUser, async (req, res) => {
  // ALWAYS verify authentication
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Validate input
  const { categoryId, amount, targetYear, targetMonth } = req.body;
  if (!categoryId || amount <= 0 || !targetYear || !targetMonth) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  // Check ownership
  const category = await getCategory(categoryId);
  if (category.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Proceed with creation
  // ...
});
```

**Key Principles:**
1. Never trust client-side guest mode checks
2. Always validate authentication server-side
3. Verify ownership before mutations
4. Sanitize all inputs
5. Log suspicious activities

---

## Future Enhancements

### Phase 2 Features (Q1 2026)

#### 1. Customizable Demo Data
**Description:** Let users modify demo budgets before signup

**User Flow:**
1. User enters guest mode
2. Sees default demo data
3. Clicks "Customize Demo"
4. Adjusts budget amounts, categories
5. Changes persist in localStorage
6. Can import customized demo on signup

**Benefits:**
- More personalized experience
- Better product fit evaluation
- Higher conversion (invested in setup)

**Implementation:**
- Allow demo mutations (client-side only)
- Update localStorage with changes
- Import customized data on migration

---

#### 2. Guided Demo Tour
**Description:** Interactive tutorial in guest mode

**Tour Steps:**
1. Welcome message: "Let's explore Pocket Penny!"
2. Highlight: Budget Summary
3. Highlight: Add Transaction button
4. Highlight: Period navigation
5. Highlight: Settings menu
6. Call to action: "Ready to save your data?"

**Implementation:**
- Use react-joyride or similar
- Trigger on first guest mode entry
- Skip option available
- Track completion in analytics

---

#### 3. Demo Templates by Persona
**Description:** Different demo data for different user types

**Templates:**
1. **Student Budget**
   - Tuition, Books, Food, Entertainment
   - Lower amounts ($50-$300 budgets)
   - Weekly allowance pattern

2. **Family Budget**
   - Groceries, Childcare, Utilities, Savings
   - Higher amounts ($500-$2000 budgets)
   - Monthly bill pattern

3. **Freelancer Budget**
   - Business expenses, Taxes, Software, Marketing
   - Variable amounts
   - Project-based income

**User Flow:**
1. Landing page asks: "What best describes you?"
2. User selects persona
3. Appropriate template loaded
4. Can switch templates in demo mode

---

#### 4. Social Proof in Demo Mode
**Description:** Show user count and testimonials

**Elements:**
- "Join 10,000+ users tracking their budgets"
- Real user testimonials in sidebar
- Success metrics: "Users saved $500K last month"
- Trust badges: "Bank-level security"

**Placement:**
- Demo mode banner
- Auth gate modal
- Migration modal

---

#### 5. Progress Gamification
**Description:** Track feature exploration

**Mechanics:**
- Progress bar: "3/10 features explored"
- Achievements: "Budget Explorer", "Transaction Tracker"
- Unlock message: "You've unlocked the Period Navigator!"
- Final achievement: "Expert Explorer - Sign up to save!"

**Benefits:**
- Increases engagement
- Encourages feature discovery
- Drives conversion

---

### Long-Term Vision (2026+)

#### 1. Multi-Device Demo Sync
- Cloud-synced demo data
- Continue on mobile
- QR code hand-off

#### 2. AI-Powered Demo
- Personalized suggestions
- Smart categorization preview
- Spending insights on demo data

#### 3. Collaborative Demo
- Share demo link
- Explore with partner
- Compare budgets with friends

#### 4. Demo Analytics for Users
- "You explored 8/12 features"
- "Most users sign up after trying X"
- Personalized recommendations

---

## Appendix

### A. Technical Dependencies

**New NPM Packages:**
- None required (using existing stack)

**Browser APIs Used:**
- localStorage (primary storage)
- sessionStorage (temporary state)
- URL API (return URLs)

**React Ecosystem:**
- Context API (state management)
- Custom hooks (logic reuse)
- React Router (navigation)

---

### B. Database Schema Changes

**No database changes required!**

Guest mode is entirely client-side. Migration uses existing API endpoints.

---

### C. API Endpoints Used

**Read Operations (Guest Mode):**
- None (uses demo data)

**Write Operations (After Auth):**
- `POST /api/categories` - Create categories
- `POST /api/budgets` - Create budgets
- `POST /api/transactions` - Create transactions
- `GET /api/user/preferences` - Load preferences

**All endpoints already exist!**

---

### D. Environment Variables

**No new environment variables needed.**

All configuration is compile-time or localStorage-based.

---

### E. Monitoring & Alerts

**CloudWatch Alarms:**
1. **High Error Rate on Migration**
   - Metric: API errors during import
   - Threshold: >5% error rate
   - Action: Alert dev team

2. **LocalStorage Quota Exceeded**
   - Metric: Client-side error logs
   - Threshold: >10 occurrences/hour
   - Action: Investigate demo data size

3. **Auth Conversion Drop**
   - Metric: Guest→Signup rate
   - Threshold: <10%
   - Action: Review UX changes

**Sentry Error Tracking:**
- Track localStorage errors
- Monitor auth gate failures
- Capture migration failures
- Log stale data cleanup

---

### F. Glossary

**Terms:**
- **Guest Mode:** Unauthenticated state with demo data
- **Demo Data:** Pre-generated budgets and transactions
- **Auth Gate:** Modal blocking write operations
- **Migration:** Importing demo data after signup
- **Return URL:** Redirect destination after auth
- **TTL:** Time To Live (demo data expiration)

---

### G. Success Criteria Summary

**Launch Criteria (Must Have):**
- [ ] Guest mode accessible from landing page
- [ ] Demo data displays correctly
- [ ] All write operations gated
- [ ] Auth flow works end-to-end
- [ ] Migration optional and functional
- [ ] Analytics tracking complete
- [ ] No critical bugs
- [ ] Performance acceptable (<2s load)

**Success Metrics (30 Days):**
- [ ] 80%+ users explore dashboard before signup
- [ ] 15%+ guest→signup conversion rate
- [ ] 40%+ import demo data after signup
- [ ] <5% error rate on migration
- [ ] No security incidents
- [ ] Positive user feedback

---

### H. References

**Design Inspiration:**
- Figma (guest file editing)
- Notion (template galleries)
- Canva (design templates)
- Vercel (project templates)

**Documentation:**
- React Context API
- LocalStorage Best Practices
- PostHog Event Tracking
- Accessibility Guidelines (WCAG 2.1)

**Related PRDs:**
- PostHog Analytics Funnels
- User Onboarding Flow
- Budget Wizard Enhancement

---

**Document Status:** ✅ Approved for Implementation
**Next Steps:** Begin Phase 1 (Foundation) - Week 1, Day 1
**Questions?** Contact Product Team

---

*Last Updated: October 9, 2025*
*Version: 1.0*
*Approved By: Product Team*

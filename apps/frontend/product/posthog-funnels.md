# PostHog Analytics Funnels for Pocket Penny

**Version:** 1.0
**Last Updated:** October 9, 2025
**Owner:** Product Team

---

## Table of Contents

1. [Overview](#overview)
2. [Critical Business Funnels](#critical-business-funnels)
3. [Advanced Analysis Funnels](#advanced-analysis-funnels)
4. [Diagnostic Funnels](#diagnostic-funnels)
5. [Key Metrics & Targets](#key-metrics--targets)
6. [Implementation Guide](#implementation-guide)
7. [Priority Recommendations](#priority-recommendations)

---

## Overview

This document defines the core analytics funnels to track in PostHog for Pocket Penny. These funnels measure user activation, engagement, and feature adoption to inform product decisions and identify optimization opportunities.

**All events are tracked using PostHog's capture API with optional chaining:**
```typescript
posthog?.capture('event_name', { properties })
```

---

## Critical Business Funnels

### 1. User Activation Funnel ⭐ (HIGHEST PRIORITY)

**Purpose:** Measure how many new users complete their first budget setup

**Event Sequence:**
```
user_signed_up
  → wizard_opened
  → wizard_mode_selected
  → wizard_completed
```

**Why it matters:** This is your core activation metric. Users who complete budget setup are 10x more likely to become active users.

**Key Properties to Track:**
- `mode`: 'guided' vs 'quick'
- `income_range`: 'low' | 'medium' | 'high' | 'very_high'
- `duration_seconds`: Time from sign-up to completion

**Conversion Window:** 1 hour (most users complete immediately)

**Target Conversion Rate:** >60% overall
- Guided: >50%
- Quick: >75%

**Breakdowns to Add:**
- Segment by `mode` (guided vs quick)
- Segment by `income_range`
- Segment by `living_situation`

**Alert Conditions:**
- Alert if overall conversion drops below 50%
- Alert if quick setup drops below 65%

---

### 2. Guided Wizard Completion Funnel

**Purpose:** Identify drop-off points in the full guided wizard flow

**Event Sequence:**
```
wizard_opened (mode: guided)
  → wizard_income_entered
  → wizard_savings_configured
  → wizard_living_configured
  → wizard_lifestyle_selected
  → wizard_suggestions_generated
  → wizard_period_configured
  → wizard_completed
```

**Why it matters:** Shows exactly where users abandon the wizard. If 50% drop off at `wizard_living_configured`, that step needs simplification.

**Key Properties:**
- `step_name`: Current wizard step
- `step_index`: Step number (0-7)
- `income_range`: User's income category
- `savings_percentage_range`: 'low' | 'medium' | 'high'

**Conversion Window:** 30 minutes

**Target Retention Rates Per Step:**
- Income → Savings: >85%
- Savings → Living: >80%
- Living → Lifestyle: >80%
- Lifestyle → Suggestions: >90%
- Suggestions → Period: >85%
- Period → Completion: >90%

**Analysis Tips:**
- Compare drop-off rates between each consecutive step
- Check `wizard_step_back` events to identify confusing steps
- Analyze average time spent on each step
- Segment by income range to see if certain user groups struggle more

---

### 3. Quick Setup Funnel

**Purpose:** Track fast onboarding path performance

**Event Sequence:**
```
wizard_opened (mode: quick)
  → wizard_quick_entry_started
  → wizard_completed
```

**Why it matters:** Compare conversion rate vs guided setup. If quick setup has 80% completion but guided has 40%, you should promote quick setup more prominently.

**Key Properties:**
- `budget_count`: Number of budgets created
- `total_amount`: Sum of all budgets
- `duration_seconds`: Time to complete

**Conversion Window:** 15 minutes

**Target Conversion Rate:** >75%

**Success Indicators:**
- Average budget count: >3
- Completion time: <5 minutes

---

### 4. Budget Engagement Funnel

**Purpose:** Measure post-activation engagement and "aha moment" progression

**Event Sequence:**
```
wizard_completed
  → transaction_created (within 7 days)
  → transaction_categorized (within 14 days)
  → budget_created (new budget, within 30 days)
```

**Why it matters:** Users who create budgets but never add transactions aren't getting value. This shows progression to active usage.

**Conversion Window:** 30 days

**Target Conversion Rates:**
- Wizard Completed → First Transaction: >50% within 7 days
- First Transaction → Categorized: >80% within 14 days
- Categorized → New Budget: >30% within 30 days

**Cohort Analysis:**
- Day 1 retention: % who create transaction same day
- Day 7 retention: % who create transaction within week
- Day 30 retention: % who create new budget

---

### 5. Google Sign-Up Funnel

**Purpose:** Track OAuth conversion and identify drop-off

**Event Sequence:**
```
google_auth_initiated
  → user_signed_in (method: google)
  → wizard_opened
```

**Why it matters:** Identify drop-off in OAuth flow. If many initiate but don't complete, there may be a redirect, permission, or UX issue.

**Key Properties:**
- `method`: Always 'google' for this funnel

**Conversion Window:** 5 minutes

**Target Conversion Rates:**
- Auth Initiated → Signed In: >85%
- Signed In → Wizard Opened: >95%

**Alert Conditions:**
- Alert if Auth Initiated → Signed In drops below 70% (indicates OAuth issues)

---

### 6. Gmail Integration Adoption Funnel

**Purpose:** Measure feature adoption for power users

**Event Sequence:**
```
user_signed_in
  → gmail_connection_initiated
  → transaction_created (category not null, within 7 days)
```

**Why it matters:** Gmail integration is a premium feature. Track adoption rate and its impact on transaction frequency.

**Conversion Window:** 7 days

**Target Metrics:**
- Gmail adoption rate: >20% of users
- Transactions per user (with Gmail): >2x vs without Gmail

**Success Indicators:**
- Users with Gmail create 2x more transactions
- Gmail users have higher 30-day retention

---

## Advanced Analysis Funnels

### 7. Budget Wizard Iteration Funnel

**Purpose:** Understand users who customize AI suggestions

**Event Sequence:**
```
wizard_suggestions_generated
  → wizard_budget_adjusted (count > 0)
  → wizard_completed
```

**Key Properties:**
- `adjustment_percentage`: How much budget was changed
- `category`: Which budget was adjusted

**Cohort Analysis Questions:**
- Do users who adjust suggestions have higher retention?
- Do users who accept defaults abandon more often?
- Which categories get adjusted most frequently?

**Target Insight:** >40% of users should adjust at least one suggestion (shows engagement with AI recommendations)

---

### 8. Multi-Language User Journey

**Purpose:** International user behavior analysis

**Event Sequence:**
```
user_signed_up
  → language_changed (language: spanish)
  → wizard_completed
  → transaction_created
```

**Why it matters:** See if non-English users have different activation patterns or friction points.

**Target Conversion Rates:**
- Should be within 10% of English users
- If Spanish < 50% of English conversion, indicates localization issues

---

### 9. Budget Refinement Funnel

**Purpose:** Track progression from basic to power user

**Event Sequence:**
```
transaction_created (first)
  → transaction_categorized
  → budget_created (additional budget)
  → budgets_reordered
```

**Why it matters:** Shows progression to power user status. These users are likely to retain long-term.

**Conversion Window:** 30 days

**Power User Definition:**
- Created >5 transactions
- Created >3 budgets
- Reordered budgets at least once

**Target:** >15% of activated users become power users within 30 days

---

## Diagnostic Funnels

### 10. Wizard Abandonment Analysis

**Purpose:** Understand why users quit the wizard

**Event Sequence:**
```
wizard_opened
  → wizard_step_completed (step 1)
  → wizard_step_completed (step 2)
  → wizard_closed (abandoned: true)
```

**Key Properties to Analyze:**
- `current_step`: Which step user was on when abandoning
- Time spent on step before abandonment

**Conversion Window:** 1 hour

**Analysis Approach:**
1. Group by `current_step` to identify problem steps
2. Calculate average time on step before abandonment
3. Compare to completion time for users who succeed

**Red Flags:**
- >30% abandonment on any single step
- Average time on step >5 minutes before abandonment (indicates confusion)

---

### 11. Sign-Up Method Comparison

**Purpose:** Compare email vs Google sign-up quality

**Funnel A (Email):**
```
user_signed_up (method: email)
  → wizard_completed
  → transaction_created (within 7 days)
```

**Funnel B (Google):**
```
user_signed_in (method: google)
  → wizard_completed
  → transaction_created (within 7 days)
```

**Metrics to Compare:**
- Wizard completion rate
- Time to first transaction
- 7-day retention rate
- 30-day retention rate

**Hypothesis:** Google users may have higher friction but better quality (verified email)

---

## Key Metrics & Targets

### Conversion Rate Benchmarks

| Funnel | Step | Target | Critical Threshold |
|--------|------|--------|-------------------|
| User Activation | Sign-up → Wizard Opened | >90% | <80% = Critical |
| User Activation | Wizard Opened → Completed | >60% | <50% = Critical |
| Guided Wizard | Each Step Retention | >80% | <70% = Critical |
| Quick Setup | Opened → Completed | >75% | <65% = Critical |
| Engagement | Completed → First Transaction (7d) | >50% | <35% = Critical |
| Google OAuth | Initiated → Signed In | >85% | <70% = Critical |
| Gmail Adoption | Sign-in → Connection Initiated | >20% | <10% = Review |

### Time-Based Metrics

| Metric | Target | Data Source |
|--------|--------|-------------|
| Wizard Duration (Guided) | <10 minutes | `wizard_completed.duration_seconds` |
| Wizard Duration (Quick) | <5 minutes | `wizard_completed.duration_seconds` |
| Time to First Transaction | <24 hours | Time between `wizard_completed` and `transaction_created` |
| Average Session Duration | >5 minutes | PostHog session recordings |

### Engagement Metrics

| Metric | Target | Definition |
|--------|--------|------------|
| DAU/MAU Ratio | >20% | Daily active / Monthly active users |
| Transactions per Active User | >8/month | Average transactions for users who logged in |
| Budget Updates per Month | >1 | Budget created, edited, or deleted |
| Power User % | >15% | Users with >5 transactions and >3 budgets |

---

## Implementation Guide

### Setting Up Funnels in PostHog

1. **Navigate to Funnels:**
   - PostHog Dashboard → **Insights** → **New Insight** → **Funnels**

2. **Example: User Activation Funnel**
   ```
   Step 1: Event = user_signed_up
   Step 2: Event = wizard_opened
   Step 3: Event = wizard_mode_selected
   Step 4: Event = wizard_completed

   Conversion window: 1 hour
   ```

3. **Add Breakdowns:**
   - Click "Add breakdown" → Select property
   - Common breakdowns:
     - `mode` (guided vs quick)
     - `income_range` (user segment)
     - `living_situation` (demographics)

4. **Add Filters:**
   - Filter by date range
   - Filter by user properties
   - Exclude test users: `email` does not contain `@test.com`

5. **Save & Dashboard:**
   - Click "Save as insight"
   - Add to "Product Metrics" dashboard

### Setting Up Alerts

1. **Navigate to Alerts:**
   - PostHog Dashboard → **Alerts** → **New Alert**

2. **Critical Alerts to Create:**
   ```
   Alert Name: User Activation Funnel Drop
   Condition: Conversion rate for "User Activation Funnel" drops below 50%
   Frequency: Check daily
   Notification: Slack #product-alerts
   ```

   ```
   Alert Name: Wizard Completion Rate Low
   Condition: Guided wizard completion drops below 40%
   Frequency: Check daily
   Notification: Email + Slack
   ```

3. **Recommended Alert Thresholds:**
   - User Activation: <50% (critical)
   - Guided Wizard: <40% (critical)
   - Quick Setup: <65% (warning)
   - OAuth Flow: <70% (critical - indicates broken flow)

---

## Priority Recommendations

### Phase 1: Essential Funnels (Week 1)

**Set up these 3 funnels first:**

1. ✅ **User Activation Funnel** (#1)
   - Most critical business metric
   - Directly measures product-market fit
   - Easy to interpret and act on

2. ✅ **Guided Wizard Completion Funnel** (#2)
   - Identify friction points in onboarding
   - Highest leverage for improvement
   - Clear action items from drop-off analysis

3. ✅ **Budget Engagement Funnel** (#4)
   - Measure sustained value delivery
   - Indicates "aha moment" achievement
   - Predicts long-term retention

**Expected Time Investment:** 2-3 hours to set up + configure alerts

---

### Phase 2: Quality & Conversion (Week 2-3)

**Add these 3 funnels:**

4. ✅ **Quick Setup Funnel** (#3)
   - Compare to guided setup
   - Optimize for speed vs quality trade-off

5. ✅ **Google Sign-Up Funnel** (#5)
   - Ensure OAuth flow is working
   - Compare quality vs email sign-up

6. ✅ **Wizard Abandonment Analysis** (#10)
   - Diagnose specific problem areas
   - Understand abandonment reasons

---

### Phase 3: Advanced Features (Week 4+)

**Add remaining funnels as needed:**

7. ✅ **Gmail Integration Adoption** (#6)
8. ✅ **Budget Wizard Iteration** (#7)
9. ✅ **Multi-Language Journey** (#8)
10. ✅ **Budget Refinement** (#9)
11. ✅ **Sign-Up Method Comparison** (#11)

---

## Next Steps

1. **Week 1:** Set up Phase 1 funnels and alerts
2. **Week 2:** Collect 2 weeks of baseline data
3. **Week 3:** Analyze results and identify top 3 friction points
4. **Week 4:** Implement fixes and measure impact
5. **Ongoing:** Weekly funnel review meetings

---

## Event Reference

### Complete Event List

| Event Name | Triggered When | Key Properties |
|------------|----------------|----------------|
| `user_signed_up` | Email registration completed | `method: 'email'` |
| `user_signed_in` | Login successful | `method: 'email' \| 'google'` |
| `google_auth_initiated` | Google OAuth button clicked | - |
| `wizard_opened` | Budget wizard dialog opened | `mode: 'guided' \| 'quick' \| 'not_selected'` |
| `wizard_mode_selected` | User selects guided or quick | `mode: 'guided' \| 'quick'` |
| `wizard_step_completed` | User clicks "Next" | `step_name`, `step_index`, `mode` |
| `wizard_step_back` | User clicks "Back" | `from_step`, `to_step` |
| `wizard_income_entered` | Income step completed | `currency`, `has_income`, `income_range` |
| `wizard_savings_configured` | Savings step completed | `input_type`, `savings_percentage_range` |
| `wizard_living_configured` | Living situation step completed | `living_situation`, `housing_type`, `location` |
| `wizard_lifestyle_selected` | Lifestyle step completed | `lifestyle_count`, `lifestyle_options[]` |
| `wizard_suggestions_generated` | AI generates budget suggestions | `suggestion_count`, `total_suggested_amount` |
| `wizard_budget_adjusted` | User edits suggested budget | `category`, `original_amount`, `new_amount`, `adjustment_percentage` |
| `wizard_period_configured` | Period settings step completed | `period_type`, `specific_day?` |
| `wizard_quick_entry_started` | Quick setup mode started | - |
| `wizard_completed` | Budgets successfully created | `mode`, `budget_count`, `total_amount`, `duration_seconds` |
| `wizard_closed` | Wizard closed before completion | `current_step`, `abandoned: true` |
| `transaction_created` | New transaction added | `type`, `category`, `currency`, `amount` |
| `transaction_edited` | Transaction modified | - |
| `transaction_deleted` | Transaction removed | `type`, `category` |
| `transaction_categorized` | Transaction assigned category | `category` |
| `budget_created` | New budget category created | `category`, `currency`, `amount` |
| `budget_deleted` | Budget removed | `category` |
| `budgets_reordered` | User reorders budget list | - |
| `language_changed` | Language preference updated | `language: 'english' \| 'spanish'` |
| `gmail_connection_initiated` | Gmail OAuth started | - |

---

## Dashboard Layout Recommendation

### Product Metrics Dashboard

**Section 1: Activation (Top Priority)**
- User Activation Funnel (line chart)
- Guided Wizard Completion Funnel (bar chart)
- Quick Setup Funnel (comparison bar)

**Section 2: Engagement**
- Budget Engagement Funnel
- Transactions Created (trend)
- Active Users (DAU/WAU/MAU)

**Section 3: Features**
- Gmail Adoption Rate
- Language Distribution
- Budget Wizard Iteration Rate

**Section 4: Diagnostics**
- Wizard Abandonment by Step
- Average Wizard Duration
- Sign-Up Method Comparison

---

**Document Maintained By:** Product Team
**Review Frequency:** Quarterly
**Last Review:** October 9, 2025

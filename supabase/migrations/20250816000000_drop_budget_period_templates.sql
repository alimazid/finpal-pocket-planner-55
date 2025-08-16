-- Drop budget_period_templates table
-- All period preferences are now stored in user_preferences table

-- Remove the budget_period_templates table as it's no longer needed
DROP TABLE IF EXISTS public.budget_period_templates;

-- Note: user_preferences table already contains:
-- - language (existing)
-- - period_type (existing) 
-- - specific_day (existing)
-- This consolidation eliminates duplicate data storage
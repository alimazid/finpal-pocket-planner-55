-- Add sort_order column to budgets table
ALTER TABLE public.budgets 
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
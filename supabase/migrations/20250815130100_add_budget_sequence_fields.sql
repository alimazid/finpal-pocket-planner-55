-- Add sequence tracking fields to budgets table
ALTER TABLE public.budgets 
ADD COLUMN period_sequence INTEGER NOT NULL DEFAULT 0,
ADD COLUMN category_start_date DATE;

-- Create index for efficient sequence queries
CREATE INDEX idx_budgets_category_sequence ON public.budgets(budget_category_id, period_sequence);

-- Create composite index for transaction filtering optimization
CREATE INDEX idx_transactions_user_category_date ON public.transactions(user_id, category, date);

-- Calculate and set sequence numbers based on existing period_start dates
WITH budget_sequences AS (
  SELECT 
    id,
    budget_category_id,
    period_start,
    ROW_NUMBER() OVER (
      PARTITION BY budget_category_id 
      ORDER BY period_start
    ) - 1 AS calculated_sequence
  FROM public.budgets
)
UPDATE public.budgets 
SET period_sequence = budget_sequences.calculated_sequence
FROM budget_sequences 
WHERE public.budgets.id = budget_sequences.id;

-- Set category_start_date to the earliest period_start for each category
WITH category_start_dates AS (
  SELECT 
    budget_category_id,
    MIN(period_start) AS start_date
  FROM public.budgets
  GROUP BY budget_category_id
)
UPDATE public.budgets 
SET category_start_date = category_start_dates.start_date
FROM category_start_dates 
WHERE public.budgets.budget_category_id = category_start_dates.budget_category_id;

-- Make category_start_date NOT NULL after populating it
ALTER TABLE public.budgets ALTER COLUMN category_start_date SET NOT NULL;
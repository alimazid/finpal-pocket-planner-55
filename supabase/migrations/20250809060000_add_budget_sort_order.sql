-- Add sort_order column to budgets table
ALTER TABLE public.budgets 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index for better performance on ordering
CREATE INDEX idx_budgets_sort_order ON public.budgets(user_id, sort_order);

-- Initialize sort_order based on creation date for existing budgets
UPDATE public.budgets 
SET sort_order = row_number() OVER (PARTITION BY user_id ORDER BY created_at)
WHERE sort_order = 0;
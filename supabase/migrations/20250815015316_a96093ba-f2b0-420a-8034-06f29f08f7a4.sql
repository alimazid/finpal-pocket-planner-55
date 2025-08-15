-- Create budget_categories table
CREATE TABLE public.budget_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on budget_categories
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for budget_categories
CREATE POLICY "Users can view their own budget categories" 
ON public.budget_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget categories" 
ON public.budget_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget categories" 
ON public.budget_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget categories" 
ON public.budget_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates on budget_categories
CREATE TRIGGER update_budget_categories_updated_at
BEFORE UPDATE ON public.budget_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing budget data to budget_categories
INSERT INTO public.budget_categories (user_id, name, sort_order)
SELECT DISTINCT user_id, category, sort_order 
FROM public.budgets 
WHERE category IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

-- Add budget_category_id column to budgets table
ALTER TABLE public.budgets ADD COLUMN budget_category_id UUID;

-- Update existing budgets to reference budget_categories
UPDATE public.budgets 
SET budget_category_id = (
  SELECT bc.id 
  FROM public.budget_categories bc 
  WHERE bc.user_id = budgets.user_id 
  AND bc.name = budgets.category
)
WHERE category IS NOT NULL;

-- Remove the old category and sort_order columns from budgets
ALTER TABLE public.budgets DROP COLUMN category;
ALTER TABLE public.budgets DROP COLUMN sort_order;

-- Make budget_category_id NOT NULL and add foreign key constraint
ALTER TABLE public.budgets ALTER COLUMN budget_category_id SET NOT NULL;
ALTER TABLE public.budgets ADD CONSTRAINT fk_budgets_budget_category 
  FOREIGN KEY (budget_category_id) REFERENCES public.budget_categories(id) ON DELETE CASCADE;

-- Create function to check for overlapping periods
CREATE OR REPLACE FUNCTION public.check_budget_period_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's any existing budget for the same category with overlapping periods
  IF EXISTS (
    SELECT 1 FROM public.budgets 
    WHERE budget_category_id = NEW.budget_category_id 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (NEW.period_start >= period_start AND NEW.period_start <= period_end) OR
      (NEW.period_end >= period_start AND NEW.period_end <= period_end) OR
      (NEW.period_start <= period_start AND NEW.period_end >= period_end)
    )
  ) THEN
    RAISE EXCEPTION 'Budget periods cannot overlap for the same category';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to prevent overlapping periods
CREATE TRIGGER check_budget_period_overlap_trigger
  BEFORE INSERT OR UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.check_budget_period_overlap();

-- Update the budget spent calculation trigger to work with new structure
CREATE OR REPLACE FUNCTION public.update_budget_spent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    budget_id_var UUID;
    budget_currency_var TEXT;
    budget_category_name TEXT;
    total_spent_converted NUMERIC := 0;
    transaction_record RECORD;
    exchange_rate NUMERIC;
    converted_amount NUMERIC;
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Find the budget for this category, user, and period (only if category is not null)
        IF NEW.category IS NOT NULL THEN
            -- Get the category name from budget_categories
            SELECT bc.name INTO budget_category_name
            FROM public.budget_categories bc
            WHERE bc.user_id = NEW.user_id AND bc.name = NEW.category;
            
            IF budget_category_name IS NOT NULL THEN
                SELECT b.id, b.currency INTO budget_id_var, budget_currency_var
                FROM public.budgets b
                JOIN public.budget_categories bc ON b.budget_category_id = bc.id
                WHERE bc.name = NEW.category 
                AND bc.user_id = NEW.user_id
                AND NEW.date >= b.period_start 
                AND NEW.date <= b.period_end;
                
                IF budget_id_var IS NOT NULL THEN
                    -- Calculate total spent with currency conversion for transactions in this period
                    FOR transaction_record IN 
                        SELECT amount, currency 
                        FROM public.transactions 
                        WHERE category = NEW.category 
                        AND user_id = NEW.user_id 
                        AND type = 'expense'
                        AND date >= (SELECT period_start FROM public.budgets WHERE id = budget_id_var)
                        AND date <= (SELECT period_end FROM public.budgets WHERE id = budget_id_var)
                    LOOP
                        -- Get exchange rate using our function (synced with toolbar)
                        exchange_rate := public.get_exchange_rate(transaction_record.currency, budget_currency_var);
                        converted_amount := transaction_record.amount * exchange_rate;
                        total_spent_converted := total_spent_converted + converted_amount;
                    END LOOP;
                    
                    -- Update the budget with the converted total
                    UPDATE public.budgets 
                    SET spent = total_spent_converted
                    WHERE id = budget_id_var;
                END IF;
            END IF;
        END IF;
    END IF;
    
    -- Handle UPDATE (old category) and DELETE
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        -- Find the budget for the old category, user, and period (only if old category is not null)
        IF OLD.category IS NOT NULL THEN
            -- Get the category name from budget_categories
            SELECT bc.name INTO budget_category_name
            FROM public.budget_categories bc
            WHERE bc.user_id = OLD.user_id AND bc.name = OLD.category;
            
            IF budget_category_name IS NOT NULL THEN
                SELECT b.id, b.currency INTO budget_id_var, budget_currency_var
                FROM public.budgets b
                JOIN public.budget_categories bc ON b.budget_category_id = bc.id
                WHERE bc.name = OLD.category 
                AND bc.user_id = OLD.user_id
                AND OLD.date >= b.period_start 
                AND OLD.date <= b.period_end;
                
                IF budget_id_var IS NOT NULL THEN
                    -- Reset and recalculate total spent with currency conversion for transactions in this period
                    total_spent_converted := 0;
                    
                    FOR transaction_record IN 
                        SELECT amount, currency 
                        FROM public.transactions 
                        WHERE category = OLD.category 
                        AND user_id = OLD.user_id 
                        AND type = 'expense'
                        AND date >= (SELECT period_start FROM public.budgets WHERE id = budget_id_var)
                        AND date <= (SELECT period_end FROM public.budgets WHERE id = budget_id_var)
                    LOOP
                        -- Get exchange rate using our function (synced with toolbar)
                        exchange_rate := public.get_exchange_rate(transaction_record.currency, budget_currency_var);
                        converted_amount := transaction_record.amount * exchange_rate;
                        total_spent_converted := total_spent_converted + converted_amount;
                    END LOOP;
                    
                    -- Update the budget with the converted total
                    UPDATE public.budgets 
                    SET spent = total_spent_converted
                    WHERE id = budget_id_var;
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;
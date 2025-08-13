-- Add period support to budgets table
ALTER TABLE public.budgets ADD COLUMN period_start DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.budgets ADD COLUMN period_end DATE NOT NULL DEFAULT CURRENT_DATE;

-- Create index for better performance on period queries
CREATE INDEX idx_budgets_period ON public.budgets (user_id, period_start, period_end);

-- Update the trigger function to only affect budgets in the same period
CREATE OR REPLACE FUNCTION public.update_budget_spent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    budget_id_var UUID;
    budget_currency_var TEXT;
    total_spent_converted NUMERIC := 0;
    transaction_record RECORD;
    exchange_rate NUMERIC;
    converted_amount NUMERIC;
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Find the budget for this category, user, and period (only if category is not null)
        IF NEW.category IS NOT NULL THEN
            SELECT id, currency INTO budget_id_var, budget_currency_var
            FROM public.budgets 
            WHERE category = NEW.category 
            AND user_id = NEW.user_id
            AND NEW.date >= period_start 
            AND NEW.date <= period_end;
            
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
                    -- Get exchange rate using our new function (synced with toolbar)
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
    
    -- Handle UPDATE (old category) and DELETE
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        -- Find the budget for the old category, user, and period (only if old category is not null)
        IF OLD.category IS NOT NULL THEN
            SELECT id, currency INTO budget_id_var, budget_currency_var
            FROM public.budgets 
            WHERE category = OLD.category 
            AND user_id = OLD.user_id
            AND OLD.date >= period_start 
            AND OLD.date <= period_end;
            
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
                    -- Get exchange rate using our new function (synced with toolbar)
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
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;
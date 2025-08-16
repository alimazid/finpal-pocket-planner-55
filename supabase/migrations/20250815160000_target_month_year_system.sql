-- Replace sequence system with target month/year approach

-- Clear all existing data for fresh start
DELETE FROM public.budgets;
DELETE FROM public.budget_categories;

-- Remove sequence-based columns
ALTER TABLE public.budgets DROP COLUMN IF EXISTS period_sequence;
ALTER TABLE public.budgets DROP COLUMN IF EXISTS category_start_date;

-- Add target month/year columns
ALTER TABLE public.budgets ADD COLUMN target_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
ALTER TABLE public.budgets ADD COLUMN target_month INTEGER NOT NULL DEFAULT EXTRACT(MONTH FROM CURRENT_DATE);

-- Add constraint to ensure valid months
ALTER TABLE public.budgets ADD CONSTRAINT check_valid_month 
CHECK (target_month >= 1 AND target_month <= 12);

-- Add unique constraint to prevent duplicate budgets for same category/month
ALTER TABLE public.budgets ADD CONSTRAINT unique_budget_category_month 
UNIQUE (user_id, budget_category_id, target_year, target_month);

-- Create index for efficient querying by target month/year
CREATE INDEX idx_budgets_target_month_year ON public.budgets(user_id, target_year, target_month);

-- Update the spent calculation trigger for target month system
CREATE OR REPLACE FUNCTION public.update_budget_spent_v4()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    budget_record RECORD;
    total_spent_converted NUMERIC := 0;
    transaction_record RECORD;
    exchange_rate NUMERIC;
    converted_amount NUMERIC;
    calculated_period_start DATE;
    calculated_period_end DATE;
    template_record RECORD;
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Find budgets for this category and user (only if category is not null)
        IF NEW.category IS NOT NULL THEN
            FOR budget_record IN 
                SELECT b.id, b.currency, b.target_year, b.target_month, bc.name
                FROM public.budgets b
                JOIN public.budget_categories bc ON b.budget_category_id = bc.id
                WHERE bc.name = NEW.category 
                AND bc.user_id = NEW.user_id
            LOOP
                -- Get the user's period template
                SELECT period_type, specific_day INTO template_record
                FROM public.budget_period_templates 
                WHERE user_id = NEW.user_id;
                
                -- Calculate period dates for this target month/year
                IF template_record.period_type = 'calendar_month' THEN
                    -- Calendar month: 1st to last day of target month
                    calculated_period_start := DATE_TRUNC('month', 
                        make_date(budget_record.target_year, budget_record.target_month, 1));
                    calculated_period_end := (calculated_period_start + INTERVAL '1 month - 1 day')::DATE;
                ELSE
                    -- Specific day: from specific day of month to day before next month's specific day
                    calculated_period_start := make_date(budget_record.target_year, budget_record.target_month, 
                        LEAST(template_record.specific_day, 
                              EXTRACT(DAY FROM (make_date(budget_record.target_year, budget_record.target_month, 1) + INTERVAL '1 month - 1 day'))));
                    calculated_period_end := (calculated_period_start + INTERVAL '1 month - 1 day')::DATE;
                END IF;
                
                -- Check if this transaction falls within the budget period
                IF NEW.date >= calculated_period_start AND NEW.date <= calculated_period_end THEN
                    -- Reset total for this budget
                    total_spent_converted := 0;
                    
                    -- Calculate total spent with currency conversion for transactions in this period
                    FOR transaction_record IN 
                        SELECT amount, currency 
                        FROM public.transactions 
                        WHERE category = NEW.category 
                        AND user_id = NEW.user_id 
                        AND type = 'expense'
                        AND date >= calculated_period_start
                        AND date <= calculated_period_end
                    LOOP
                        -- Get exchange rate using our function
                        exchange_rate := public.get_exchange_rate(transaction_record.currency, budget_record.currency);
                        converted_amount := transaction_record.amount * exchange_rate;
                        total_spent_converted := total_spent_converted + converted_amount;
                    END LOOP;
                    
                    -- Update the budget with the converted total
                    UPDATE public.budgets 
                    SET spent = total_spent_converted
                    WHERE id = budget_record.id;
                END IF;
            END LOOP;
        END IF;
    END IF;
    
    -- Handle UPDATE (old category) and DELETE - similar logic with OLD record
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        IF OLD.category IS NOT NULL THEN
            FOR budget_record IN 
                SELECT b.id, b.currency, b.target_year, b.target_month, bc.name
                FROM public.budgets b
                JOIN public.budget_categories bc ON b.budget_category_id = bc.id
                WHERE bc.name = OLD.category 
                AND bc.user_id = OLD.user_id
            LOOP
                -- Get the user's period template
                SELECT period_type, specific_day INTO template_record
                FROM public.budget_period_templates 
                WHERE user_id = OLD.user_id;
                
                -- Calculate period dates for this target month/year
                IF template_record.period_type = 'calendar_month' THEN
                    calculated_period_start := DATE_TRUNC('month', 
                        make_date(budget_record.target_year, budget_record.target_month, 1));
                    calculated_period_end := (calculated_period_start + INTERVAL '1 month - 1 day')::DATE;
                ELSE
                    calculated_period_start := make_date(budget_record.target_year, budget_record.target_month, 
                        LEAST(template_record.specific_day, 
                              EXTRACT(DAY FROM (make_date(budget_record.target_year, budget_record.target_month, 1) + INTERVAL '1 month - 1 day'))));
                    calculated_period_end := (calculated_period_start + INTERVAL '1 month - 1 day')::DATE;
                END IF;
                
                -- Check if old transaction was in this period
                IF OLD.date >= calculated_period_start AND OLD.date <= calculated_period_end THEN
                    -- Recalculate spent amount
                    total_spent_converted := 0;
                    
                    FOR transaction_record IN 
                        SELECT amount, currency 
                        FROM public.transactions 
                        WHERE category = OLD.category 
                        AND user_id = OLD.user_id 
                        AND type = 'expense'
                        AND date >= calculated_period_start
                        AND date <= calculated_period_end
                    LOOP
                        exchange_rate := public.get_exchange_rate(transaction_record.currency, budget_record.currency);
                        converted_amount := transaction_record.amount * exchange_rate;
                        total_spent_converted := total_spent_converted + converted_amount;
                    END LOOP;
                    
                    UPDATE public.budgets 
                    SET spent = total_spent_converted
                    WHERE id = budget_record.id;
                END IF;
            END LOOP;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Replace the existing trigger with the new version
DROP TRIGGER IF EXISTS update_budget_spent_trigger ON public.transactions;
CREATE TRIGGER update_budget_spent_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_budget_spent_v4();
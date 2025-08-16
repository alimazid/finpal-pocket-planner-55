-- Force cleanup of all old triggers and functions with CASCADE

-- Drop all existing triggers on transactions table first
DROP TRIGGER IF EXISTS update_budget_spent_trigger ON public.transactions;
DROP TRIGGER IF EXISTS trigger_update_budget_spent ON public.transactions;
DROP TRIGGER IF EXISTS calculate_budget_spent_trigger ON public.transactions;

-- Drop all old versions of the function with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.update_budget_spent() CASCADE;
DROP FUNCTION IF EXISTS public.update_budget_spent_v2() CASCADE;
DROP FUNCTION IF EXISTS public.update_budget_spent_v3() CASCADE;
DROP FUNCTION IF EXISTS public.update_budget_spent_v4() CASCADE;
DROP FUNCTION IF EXISTS public.update_budget_spent_v5() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_budget_spent_target_month() CASCADE;

-- Create a completely new function with a fresh name
CREATE OR REPLACE FUNCTION public.calculate_budget_spent_target_month()
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
                -- Get the user's period preferences from user_preferences table
                SELECT period_type, specific_day INTO template_record
                FROM public.user_preferences 
                WHERE user_id = NEW.user_id;
                
                -- Default to calendar month if no preferences found
                IF template_record IS NULL THEN
                    template_record.period_type := 'calendar_month';
                    template_record.specific_day := 1;
                END IF;
                
                -- Calculate period dates for this target month/year
                -- Target month represents the END month of the period
                IF template_record.period_type = 'calendar_month' THEN
                    -- Calendar month: 1st to last day of target month
                    calculated_period_start := DATE_TRUNC('month', 
                        make_date(budget_record.target_year, budget_record.target_month, 1));
                    calculated_period_end := (calculated_period_start + INTERVAL '1 month - 1 day')::DATE;
                ELSE
                    -- Specific day periods: target month is END month
                    -- Period ends on (specific_day - 1) of target month
                    -- Period starts on specific_day of previous month
                    
                    -- Calculate end date
                    calculated_period_end := make_date(budget_record.target_year, budget_record.target_month, 
                        LEAST(COALESCE(template_record.specific_day, 1) - 1, 
                              EXTRACT(DAY FROM (make_date(budget_record.target_year, budget_record.target_month, 1) + INTERVAL '1 month - 1 day'))));
                    
                    -- Calculate start date (one month before end date, on specific day)
                    calculated_period_start := make_date(
                        EXTRACT(YEAR FROM (calculated_period_end - INTERVAL '1 month'))::INTEGER,
                        EXTRACT(MONTH FROM (calculated_period_end - INTERVAL '1 month'))::INTEGER,
                        LEAST(COALESCE(template_record.specific_day, 1),
                              EXTRACT(DAY FROM (DATE_TRUNC('month', calculated_period_end - INTERVAL '1 month') + INTERVAL '1 month - 1 day')))
                    );
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
                -- Get the user's period preferences from user_preferences table
                SELECT period_type, specific_day INTO template_record
                FROM public.user_preferences 
                WHERE user_id = OLD.user_id;
                
                -- Default to calendar month if no preferences found
                IF template_record IS NULL THEN
                    template_record.period_type := 'calendar_month';
                    template_record.specific_day := 1;
                END IF;
                
                -- Calculate period dates for this target month/year
                IF template_record.period_type = 'calendar_month' THEN
                    calculated_period_start := DATE_TRUNC('month', 
                        make_date(budget_record.target_year, budget_record.target_month, 1));
                    calculated_period_end := (calculated_period_start + INTERVAL '1 month - 1 day')::DATE;
                ELSE
                    -- Calculate end date
                    calculated_period_end := make_date(budget_record.target_year, budget_record.target_month, 
                        LEAST(COALESCE(template_record.specific_day, 1) - 1, 
                              EXTRACT(DAY FROM (make_date(budget_record.target_year, budget_record.target_month, 1) + INTERVAL '1 month - 1 day'))));
                    
                    -- Calculate start date
                    calculated_period_start := make_date(
                        EXTRACT(YEAR FROM (calculated_period_end - INTERVAL '1 month'))::INTEGER,
                        EXTRACT(MONTH FROM (calculated_period_end - INTERVAL '1 month'))::INTEGER,
                        LEAST(COALESCE(template_record.specific_day, 1),
                              EXTRACT(DAY FROM (DATE_TRUNC('month', calculated_period_end - INTERVAL '1 month') + INTERVAL '1 month - 1 day')))
                    );
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

-- Create the new trigger with the new function
CREATE TRIGGER calculate_budget_spent_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_budget_spent_target_month();
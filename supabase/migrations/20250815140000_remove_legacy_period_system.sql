-- Phase 3: Remove legacy period system and constraints

-- Drop the period overlap trigger and constraint function
DROP TRIGGER IF EXISTS check_budget_period_overlap_trigger ON public.budgets;
DROP FUNCTION IF EXISTS public.check_budget_period_overlap();

-- Remove the legacy period columns from budgets table
-- (Keeping them for now since application might still reference them during transition)
-- ALTER TABLE public.budgets DROP COLUMN IF EXISTS period_start;
-- ALTER TABLE public.budgets DROP COLUMN IF EXISTS period_end;

-- Create a simplified budget spent calculation function that doesn't depend on period columns
CREATE OR REPLACE FUNCTION public.update_budget_spent_v2()
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
        -- Find the budget for this category and user (only if category is not null)
        IF NEW.category IS NOT NULL THEN
            FOR budget_record IN 
                SELECT b.id, b.currency, b.period_sequence, b.category_start_date, bc.name
                FROM public.budgets b
                JOIN public.budget_categories bc ON b.budget_category_id = bc.id
                WHERE bc.name = NEW.category 
                AND bc.user_id = NEW.user_id
            LOOP
                -- Get the user's period template
                SELECT period_type, specific_day INTO template_record
                FROM public.budget_period_templates 
                WHERE user_id = NEW.user_id;
                
                -- Calculate period dates based on template and sequence
                IF template_record.period_type = 'calendar_month' THEN
                    calculated_period_start := DATE_TRUNC('month', 
                        budget_record.category_start_date::DATE + 
                        (budget_record.period_sequence || ' months')::INTERVAL);
                    calculated_period_end := (calculated_period_start + INTERVAL '1 month - 1 day')::DATE;
                ELSE
                    calculated_period_start := (budget_record.category_start_date::DATE + 
                        (budget_record.period_sequence || ' months')::INTERVAL);
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
                SELECT b.id, b.currency, b.period_sequence, b.category_start_date, bc.name
                FROM public.budgets b
                JOIN public.budget_categories bc ON b.budget_category_id = bc.id
                WHERE bc.name = OLD.category 
                AND bc.user_id = OLD.user_id
            LOOP
                -- Get the user's period template
                SELECT period_type, specific_day INTO template_record
                FROM public.budget_period_templates 
                WHERE user_id = OLD.user_id;
                
                -- Calculate period dates
                IF template_record.period_type = 'calendar_month' THEN
                    calculated_period_start := DATE_TRUNC('month', 
                        budget_record.category_start_date::DATE + 
                        (budget_record.period_sequence || ' months')::INTERVAL);
                    calculated_period_end := (calculated_period_start + INTERVAL '1 month - 1 day')::DATE;
                ELSE
                    calculated_period_start := (budget_record.category_start_date::DATE + 
                        (budget_record.period_sequence || ' months')::INTERVAL);
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
    EXECUTE FUNCTION public.update_budget_spent_v2();
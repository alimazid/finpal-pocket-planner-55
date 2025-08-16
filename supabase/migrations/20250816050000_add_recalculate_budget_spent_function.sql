-- Function to recalculate all budget spent amounts for a user
-- This is needed when period preferences change
CREATE OR REPLACE FUNCTION public.recalculate_all_budget_spent(user_id_param UUID)
RETURNS VOID
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
    -- Get the user's period preferences from user_preferences table
    SELECT period_type, specific_day INTO template_record
    FROM public.user_preferences 
    WHERE user_id = user_id_param;
    
    -- Default to calendar month if no preferences found
    IF template_record IS NULL THEN
        template_record.period_type := 'calendar_month';
        template_record.specific_day := 1;
    END IF;
    
    -- Loop through all budgets for this user
    FOR budget_record IN 
        SELECT b.id, b.currency, b.target_year, b.target_month, bc.name
        FROM public.budgets b
        JOIN public.budget_categories bc ON b.budget_category_id = bc.id
        WHERE bc.user_id = user_id_param
    LOOP
        -- Calculate period dates for this target month/year
        -- Target month represents the END month of the period
        IF template_record.period_type = 'calendar_month' THEN
            -- Calendar month: 1st to last day of target month
            calculated_period_start := (budget_record.target_year || '-' || LPAD(budget_record.target_month::TEXT, 2, '0') || '-01')::DATE;
            calculated_period_end := (calculated_period_start + INTERVAL '1 month - 1 day')::DATE;
        ELSE
            -- Specific day periods: target month is END month
            -- Period ends on (specific_day - 1) of target month
            -- Period starts on specific_day of previous month
            
            -- Use TO_DATE for more compatible date creation
            calculated_period_end := TO_DATE(
                budget_record.target_year || '-' || 
                LPAD(budget_record.target_month::TEXT, 2, '0') || '-' || 
                LPAD(LEAST(COALESCE(template_record.specific_day, 1) - 1, 28)::TEXT, 2, '0'),
                'YYYY-MM-DD'
            );
            
            -- Calculate start date (one month before, on specific day)
            calculated_period_start := TO_DATE(
                EXTRACT(YEAR FROM (calculated_period_end - INTERVAL '1 month'))::TEXT || '-' ||
                LPAD(EXTRACT(MONTH FROM (calculated_period_end - INTERVAL '1 month'))::TEXT, 2, '0') || '-' ||
                LPAD(COALESCE(template_record.specific_day, 1)::TEXT, 2, '0'),
                'YYYY-MM-DD'
            );
        END IF;
        
        -- Reset total for this budget
        total_spent_converted := 0;
        
        -- Calculate total spent with currency conversion for transactions in this period
        FOR transaction_record IN 
            SELECT amount, currency 
            FROM public.transactions 
            WHERE category = budget_record.name 
            AND user_id = user_id_param 
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
    END LOOP;
END;
$$;
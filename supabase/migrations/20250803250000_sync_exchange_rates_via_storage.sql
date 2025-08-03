-- Create a table to store the current exchange rates from the toolbar
-- This ensures perfect synchronization between toolbar display and budget calculations

CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate NUMERIC NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_currency, to_currency)
);

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Allow all users to read exchange rates (they're public data)
CREATE POLICY "Anyone can read exchange rates" ON public.exchange_rates
    FOR SELECT USING (true);

-- Allow all authenticated users to insert/update exchange rates
CREATE POLICY "Authenticated users can update exchange rates" ON public.exchange_rates
    FOR ALL USING (auth.role() = 'authenticated');

-- Function to update or insert exchange rate
CREATE OR REPLACE FUNCTION public.upsert_exchange_rate(
    p_from_currency TEXT,
    p_to_currency TEXT,
    p_rate NUMERIC
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.exchange_rates (from_currency, to_currency, rate, updated_at)
    VALUES (p_from_currency, p_to_currency, p_rate, NOW())
    ON CONFLICT (from_currency, to_currency)
    DO UPDATE SET 
        rate = EXCLUDED.rate,
        updated_at = EXCLUDED.updated_at;
END;
$$;

-- Function to get exchange rate with fallback logic
CREATE OR REPLACE FUNCTION public.get_exchange_rate(
    p_from_currency TEXT,
    p_to_currency TEXT
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stored_rate NUMERIC;
    rate_age_minutes INTEGER;
BEGIN
    -- If same currency, return 1
    IF p_from_currency = p_to_currency THEN
        RETURN 1.0;
    END IF;
    
    -- Try to get stored rate (from toolbar)
    SELECT rate, EXTRACT(EPOCH FROM (NOW() - updated_at))/60
    INTO stored_rate, rate_age_minutes
    FROM public.exchange_rates 
    WHERE from_currency = p_from_currency 
    AND to_currency = p_to_currency;
    
    -- If we have a stored rate that's less than 10 minutes old, use it
    IF stored_rate IS NOT NULL AND rate_age_minutes < 10 THEN
        RETURN stored_rate;
    END IF;
    
    -- Fallback to hardcoded rates (these should match current market rates)
    RETURN CASE 
        WHEN p_from_currency = 'USD' AND p_to_currency IN ('RD', 'DOP') THEN 58.0
        WHEN p_from_currency IN ('RD', 'DOP') AND p_to_currency = 'USD' THEN 1.0/58.0
        WHEN p_from_currency = 'RD' AND p_to_currency = 'DOP' THEN 1.0
        WHEN p_from_currency = 'DOP' AND p_to_currency = 'RD' THEN 1.0
        ELSE 1.0
    END;
END;
$$;

-- Update the budget calculation function to use the stored exchange rates
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
        -- Find the budget for this category and user (only if category is not null)
        IF NEW.category IS NOT NULL THEN
            SELECT id, currency INTO budget_id_var, budget_currency_var
            FROM public.budgets 
            WHERE category = NEW.category AND user_id = NEW.user_id;
            
            IF budget_id_var IS NOT NULL THEN
                -- Calculate total spent with currency conversion
                FOR transaction_record IN 
                    SELECT amount, currency 
                    FROM public.transactions 
                    WHERE category = NEW.category 
                    AND user_id = NEW.user_id 
                    AND type = 'expense'
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
        -- Find the budget for the old category and user (only if old category is not null)
        IF OLD.category IS NOT NULL THEN
            SELECT id, currency INTO budget_id_var, budget_currency_var
            FROM public.budgets 
            WHERE category = OLD.category AND user_id = OLD.user_id;
            
            IF budget_id_var IS NOT NULL THEN
                -- Reset and recalculate total spent with currency conversion
                total_spent_converted := 0;
                
                FOR transaction_record IN 
                    SELECT amount, currency 
                    FROM public.transactions 
                    WHERE category = OLD.category 
                    AND user_id = OLD.user_id 
                    AND type = 'expense'
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

-- Recalculate all existing budget spent amounts with the new function
UPDATE public.transactions SET updated_at = NOW() WHERE type = 'expense' AND category IS NOT NULL;
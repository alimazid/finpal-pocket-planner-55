-- Update the budget spent calculation function to use the same exchange rate API as the toolbar
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
    rate_response JSONB;
    rate_result JSONB;
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
                    -- If currencies match, use amount directly
                    IF transaction_record.currency = budget_currency_var THEN
                        converted_amount := transaction_record.amount;
                    ELSE
                        -- Get exchange rate via HTTP request to our edge function
                        BEGIN
                            SELECT content INTO rate_response FROM http((
                                'POST',
                                current_setting('app.supabase_url') || '/functions/v1/get-exchange-rate',
                                ARRAY[
                                    http_header('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')),
                                    http_header('Content-Type', 'application/json')
                                ],
                                '{"fromCurrency": "' || transaction_record.currency || '", "toCurrency": "' || budget_currency_var || '"}'
                            )::http_request);
                            
                            rate_result := rate_response;
                            
                            -- Extract the rate from the response
                            IF rate_result ->> 'success' = 'true' THEN
                                exchange_rate := (rate_result ->> 'rate')::NUMERIC;
                            ELSE
                                -- Fallback to hardcoded rates if API fails
                                SELECT 
                                    CASE 
                                        WHEN transaction_record.currency = 'USD' AND budget_currency_var IN ('RD', 'DOP') THEN 59.5
                                        WHEN transaction_record.currency IN ('RD', 'DOP') AND budget_currency_var = 'USD' THEN 1.0/59.5
                                        WHEN transaction_record.currency = 'RD' AND budget_currency_var = 'DOP' THEN 1.0
                                        WHEN transaction_record.currency = 'DOP' AND budget_currency_var = 'RD' THEN 1.0
                                        ELSE 1.0
                                    END INTO exchange_rate;
                            END IF;
                            
                            converted_amount := transaction_record.amount * exchange_rate;
                        EXCEPTION
                            WHEN OTHERS THEN
                                -- Fallback to hardcoded rates if HTTP request fails
                                SELECT 
                                    CASE 
                                        WHEN transaction_record.currency = 'USD' AND budget_currency_var IN ('RD', 'DOP') THEN 59.5
                                        WHEN transaction_record.currency IN ('RD', 'DOP') AND budget_currency_var = 'USD' THEN 1.0/59.5
                                        WHEN transaction_record.currency = 'RD' AND budget_currency_var = 'DOP' THEN 1.0
                                        WHEN transaction_record.currency = 'DOP' AND budget_currency_var = 'RD' THEN 1.0
                                        ELSE 1.0
                                    END INTO exchange_rate;
                                converted_amount := transaction_record.amount * exchange_rate;
                        END;
                    END IF;
                    
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
                    -- If currencies match, use amount directly
                    IF transaction_record.currency = budget_currency_var THEN
                        converted_amount := transaction_record.amount;
                    ELSE
                        -- Get exchange rate via HTTP request to our edge function
                        BEGIN
                            SELECT content INTO rate_response FROM http((
                                'POST',
                                current_setting('app.supabase_url') || '/functions/v1/get-exchange-rate',
                                ARRAY[
                                    http_header('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')),
                                    http_header('Content-Type', 'application/json')
                                ],
                                '{"fromCurrency": "' || transaction_record.currency || '", "toCurrency": "' || budget_currency_var || '"}'
                            )::http_request);
                            
                            rate_result := rate_response;
                            
                            -- Extract the rate from the response
                            IF rate_result ->> 'success' = 'true' THEN
                                exchange_rate := (rate_result ->> 'rate')::NUMERIC;
                            ELSE
                                -- Fallback to hardcoded rates if API fails
                                SELECT 
                                    CASE 
                                        WHEN transaction_record.currency = 'USD' AND budget_currency_var IN ('RD', 'DOP') THEN 59.5
                                        WHEN transaction_record.currency IN ('RD', 'DOP') AND budget_currency_var = 'USD' THEN 1.0/59.5
                                        WHEN transaction_record.currency = 'RD' AND budget_currency_var = 'DOP' THEN 1.0
                                        WHEN transaction_record.currency = 'DOP' AND budget_currency_var = 'RD' THEN 1.0
                                        ELSE 1.0
                                    END INTO exchange_rate;
                            END IF;
                            
                            converted_amount := transaction_record.amount * exchange_rate;
                        EXCEPTION
                            WHEN OTHERS THEN
                                -- Fallback to hardcoded rates if HTTP request fails
                                SELECT 
                                    CASE 
                                        WHEN transaction_record.currency = 'USD' AND budget_currency_var IN ('RD', 'DOP') THEN 59.5
                                        WHEN transaction_record.currency IN ('RD', 'DOP') AND budget_currency_var = 'USD' THEN 1.0/59.5
                                        WHEN transaction_record.currency = 'RD' AND budget_currency_var = 'DOP' THEN 1.0
                                        WHEN transaction_record.currency = 'DOP' AND budget_currency_var = 'RD' THEN 1.0
                                        ELSE 1.0
                                    END INTO exchange_rate;
                                converted_amount := transaction_record.amount * exchange_rate;
                        END;
                    END IF;
                    
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

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Set configuration variables for the edge function URL
-- These will be used by the function to call the edge function
SELECT set_config('app.supabase_url', 'https://fgtdyhdkwrxsmwclxtpm.supabase.co', false);
SELECT set_config('app.supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZndGR5aGRrd3J4c213Y2x4dHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4OTY3ODQsImV4cCI6MjA2ODQ3Mjc4NH0.Qtj1ZTHUIYTc3UFnF-zAIWAsxtel0CGCaSAFVYyE8_o', false);
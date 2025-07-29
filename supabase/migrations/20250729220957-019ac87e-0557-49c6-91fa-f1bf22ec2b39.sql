-- Update budget spent function to handle null categories
CREATE OR REPLACE FUNCTION public.update_budget_spent()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    budget_id_var UUID;
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Find the budget for this category and user (only if category is not null)
        IF NEW.category IS NOT NULL THEN
            SELECT id INTO budget_id_var 
            FROM public.budgets 
            WHERE category = NEW.category AND user_id = NEW.user_id;
            
            IF budget_id_var IS NOT NULL THEN
                -- Recalculate total spent for this budget
                UPDATE public.budgets 
                SET spent = (
                    SELECT COALESCE(SUM(amount), 0) 
                    FROM public.transactions 
                    WHERE category = NEW.category 
                    AND user_id = NEW.user_id 
                    AND type = 'expense'
                )
                WHERE id = budget_id_var;
            END IF;
        END IF;
    END IF;
    
    -- Handle UPDATE (old category) and DELETE
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        -- Find the budget for the old category and user (only if old category is not null)
        IF OLD.category IS NOT NULL THEN
            SELECT id INTO budget_id_var 
            FROM public.budgets 
            WHERE category = OLD.category AND user_id = OLD.user_id;
            
            IF budget_id_var IS NOT NULL THEN
                -- Recalculate total spent for the old budget
                UPDATE public.budgets 
                SET spent = (
                    SELECT COALESCE(SUM(amount), 0) 
                    FROM public.transactions 
                    WHERE category = OLD.category 
                    AND user_id = OLD.user_id 
                    AND type = 'expense'
                )
                WHERE id = budget_id_var;
            END IF;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
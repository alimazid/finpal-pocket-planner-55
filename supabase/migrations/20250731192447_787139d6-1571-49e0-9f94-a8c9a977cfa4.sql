-- Add currency column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN currency TEXT NOT NULL DEFAULT 'RD';

-- Add currency column to budgets table  
ALTER TABLE public.budgets
ADD COLUMN currency TEXT NOT NULL DEFAULT 'RD';
-- Add currency column to transactions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'currency') THEN
        ALTER TABLE public.transactions ADD COLUMN currency TEXT NOT NULL DEFAULT 'RD';
    END IF;
END $$;

-- Add currency column to budgets table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'currency') THEN
        ALTER TABLE public.budgets ADD COLUMN currency TEXT NOT NULL DEFAULT 'RD';
    END IF;
END $$;
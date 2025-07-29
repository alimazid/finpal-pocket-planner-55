-- Allow transactions to have null categories
ALTER TABLE public.transactions ALTER COLUMN category DROP NOT NULL;
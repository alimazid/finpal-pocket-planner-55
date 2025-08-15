-- Add language preference to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN language TEXT NOT NULL DEFAULT 'spanish' CHECK (language IN ('english', 'spanish'));
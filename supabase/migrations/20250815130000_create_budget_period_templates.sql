-- Create budget_period_templates table for centralized period management
CREATE TABLE public.budget_period_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'calendar_month' CHECK (period_type IN ('calendar_month', 'specific_day')),
  specific_day INTEGER DEFAULT 1 CHECK (specific_day >= 1 AND specific_day <= 31),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.budget_period_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for budget_period_templates
CREATE POLICY "Users can view their own period templates" 
ON public.budget_period_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own period templates" 
ON public.budget_period_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own period templates" 
ON public.budget_period_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own period templates" 
ON public.budget_period_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_budget_period_templates_updated_at
  BEFORE UPDATE ON public.budget_period_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing user preferences to period templates
INSERT INTO public.budget_period_templates (user_id, period_type, specific_day)
SELECT user_id, period_type, specific_day 
FROM public.user_preferences
ON CONFLICT (user_id) DO UPDATE SET
  period_type = EXCLUDED.period_type,
  specific_day = EXCLUDED.specific_day;
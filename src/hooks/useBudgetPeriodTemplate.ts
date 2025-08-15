import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BudgetPeriodTemplate } from "@/lib/periodCalculations";
import { useToast } from "@/hooks/use-toast";

export interface BudgetPeriodTemplateRow {
  id: string;
  user_id: string;
  period_type: 'calendar_month' | 'specific_day';
  specific_day: number;
  created_at: string;
  updated_at: string;
}

export function useBudgetPeriodTemplate(userId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's period template
  const { data: template, isLoading } = useQuery({
    queryKey: ['budget-period-template', userId],
    queryFn: async (): Promise<BudgetPeriodTemplateRow | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('budget_period_templates')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return data;
    },
    enabled: !!userId,
  });

  // Create or update period template
  const updateTemplateMutation = useMutation({
    mutationFn: async (newTemplate: BudgetPeriodTemplate) => {
      if (!userId) throw new Error('User ID is required');
      
      const { data, error } = await supabase
        .from('budget_period_templates')
        .upsert({
          user_id: userId,
          period_type: newTemplate.period_type,
          specific_day: newTemplate.specific_day,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budget-period-template', userId] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] }); // Refresh budgets to recalculate periods
      
      toast({
        title: "Period Settings Updated",
        description: "Your budget period preferences have been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating period template:', error);
      toast({
        title: "Error",
        description: "Failed to save period preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get template as BudgetPeriodTemplate interface
  const budgetTemplate: BudgetPeriodTemplate | null = template ? {
    period_type: template.period_type as 'calendar_month' | 'specific_day',
    specific_day: template.specific_day,
  } : null;

  // Get default template for new users
  const getDefaultTemplate = (): BudgetPeriodTemplate => ({
    period_type: 'calendar_month',
    specific_day: 1,
  });

  return {
    template: budgetTemplate,
    templateRow: template,
    isLoading,
    updateTemplate: updateTemplateMutation.mutate,
    isUpdating: updateTemplateMutation.isPending,
    getDefaultTemplate,
  };
}
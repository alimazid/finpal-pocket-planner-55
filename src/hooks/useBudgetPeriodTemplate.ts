import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BudgetPeriodTemplate } from "@/lib/periodCalculations";
import { useToast } from "@/hooks/use-toast";

export interface UserPreferencesRow {
  id: string;
  user_id: string;
  language: string;
  period_type: 'calendar_month' | 'specific_day';
  specific_day: number | null;
  created_at: string;
  updated_at: string;
}

export function useBudgetPeriodTemplate(userId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's preferences (including period settings)
  const { data: userPreferences, isLoading } = useQuery({
    queryKey: ['user-preferences', userId],
    queryFn: async (): Promise<UserPreferencesRow | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_preferences')
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

  // Create or update period preferences
  const updateTemplateMutation = useMutation({
    mutationFn: async (newTemplate: BudgetPeriodTemplate) => {
      if (!userId) throw new Error('User ID is required');
      
      // Update user preferences with new period settings
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          period_type: newTemplate.period_type,
          specific_day: newTemplate.specific_day,
          language: userPreferences?.language || 'spanish', // Preserve existing language
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();
      
      if (error) throw error;

      // Recalculate all budget spent amounts by calling the trigger function for existing budgets
      const { error: triggerError } = await supabase.rpc('recalculate_all_budget_spent', {
        user_id_param: userId
      });
      
      if (triggerError) {
        console.error('Error recalculating budget spent amounts:', triggerError);
        // Don't throw error here as the preference update succeeded
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] }); // Refresh budgets display
      
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
  const budgetTemplate: BudgetPeriodTemplate | null = userPreferences ? {
    period_type: userPreferences.period_type as 'calendar_month' | 'specific_day',
    specific_day: userPreferences.specific_day || 1,
  } : null;

  // Get default template for new users
  const getDefaultTemplate = (): BudgetPeriodTemplate => ({
    period_type: 'calendar_month',
    specific_day: 1,
  });

  return {
    template: budgetTemplate,
    templateRow: userPreferences,
    isLoading,
    updateTemplate: updateTemplateMutation.mutate,
    isUpdating: updateTemplateMutation.isPending,
    getDefaultTemplate,
  };
}
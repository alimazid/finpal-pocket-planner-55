import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { BudgetPeriodTemplate } from "@/lib/periodCalculations";
import { useToast } from "@/hooks/use-toast";

export interface UserPreferencesRow {
  id: string;
  userId: string;
  language: string;
  periodType: 'calendar_month' | 'specific_day';
  specificDay: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export function useBudgetPeriodTemplate(userId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's preferences (including period settings)
  const { data: userPreferences, isLoading } = useQuery({
    queryKey: ['user-preferences', userId],
    queryFn: async (): Promise<UserPreferencesRow | null> => {
      if (!userId) return null;
      
      const response = await apiClient.getPreferences();
      
      if (!response.success || !response.data) {
        return null;
      }
      
      return response.data as UserPreferencesRow;
    },
    enabled: !!userId,
  });

  // Create or update period preferences
  const updateTemplateMutation = useMutation({
    mutationFn: async (newTemplate: BudgetPeriodTemplate) => {
      if (!userId) throw new Error('User ID is required');
      
      // Update user preferences with new period settings
      const response = await apiClient.updatePreferences({
        periodType: newTemplate.periodType,
        specificDay: newTemplate.specificDay,
        language: userPreferences?.language || 'spanish', // Preserve existing language
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update preferences');
      }

      // Recalculate all budget spent amounts
      try {
        await apiClient.recalculateSpentAmounts();
      } catch (error) {
        console.error('Error recalculating budget spent amounts:', error);
        // Don't throw error here as the preference update succeeded
      }
      
      return response.data;
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
    periodType: userPreferences.periodType as 'calendar_month' | 'specific_day',
    specificDay: userPreferences.specificDay || 1,
  } : null;


  // Get default template for new users
  const getDefaultTemplate = (): BudgetPeriodTemplate => ({
    periodType: 'calendar_month',
    specificDay: 1,
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
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface UserPreference {
  id: string;
  user_id: string;
  period_type: 'calendar_month' | 'specific_day';
  specific_day: number;
}

interface PeriodSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onPreferenceChange: (preference: UserPreference) => void;
}

export function PeriodSelectionModal({ open, onOpenChange, userId, onPreferenceChange }: PeriodSelectionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [periodType, setPeriodType] = useState<'calendar_month' | 'specific_day'>('calendar_month');
  const [specificDay, setSpecificDay] = useState<number>(1);

  // Fetch user preferences
  const { data: userPreference } = useQuery({
    queryKey: ['user-preference', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return data as UserPreference | null;
    },
    enabled: !!userId,
  });

  // Update form state when preference loads
  useEffect(() => {
    if (userPreference) {
      setPeriodType(userPreference.period_type);
      setSpecificDay(userPreference.specific_day);
    }
  }, [userPreference]);

  // Save preference mutation
  const savePreferenceMutation = useMutation({
    mutationFn: async (preference: { period_type: 'calendar_month' | 'specific_day'; specific_day: number }) => {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          period_type: preference.period_type,
          specific_day: preference.specific_day,
        })
        .select()
        .single();

      if (error) throw error;

      // Recalculate existing budgets with new period settings
      const recalculateResponse = await supabase.functions.invoke('recalculate-user-budgets', {
        body: {
          userId: userId,
          periodType: preference.period_type,
          specificDay: preference.specific_day
        }
      });

      if (recalculateResponse.error) {
        console.error('Error recalculating budgets:', recalculateResponse.error);
        throw new Error('Failed to recalculate existing budgets');
      }

      console.log('Budget recalculation result:', recalculateResponse.data);

      return data as UserPreference;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-preference', userId] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] }); // Invalidate budgets to refresh UI
      onPreferenceChange(data);
      toast({
        title: "Period Settings Saved",
        description: "Your period preferences and existing budgets have been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error saving preference:', error);
      toast({
        title: "Error",
        description: "Failed to save period preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (periodType === 'specific_day' && (specificDay < 1 || specificDay > 31)) {
      toast({
        title: "Invalid Day",
        description: "Please enter a day between 1 and 31.",
        variant: "destructive",
      });
      return;
    }

    savePreferenceMutation.mutate({
      period_type: periodType,
      specific_day: specificDay,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Period Selection</DialogTitle>
          <DialogDescription>
            Choose how you want your budget periods to be calculated.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <RadioGroup value={periodType} onValueChange={(value) => setPeriodType(value as 'calendar_month' | 'specific_day')}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="calendar_month" id="calendar_month" />
                <Label htmlFor="calendar_month" className="font-normal">
                  Calendar Month
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Budget periods will follow standard calendar months (1st to last day of each month).
              </p>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific_day" id="specific_day" />
                <Label htmlFor="specific_day" className="font-normal">
                  Specific Day
                </Label>
              </div>
              <div className="ml-6 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Budget periods will start on a specific day of each month.
                </p>
                {periodType === 'specific_day' && (
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="day-input" className="text-sm">
                      Start on day:
                    </Label>
                    <Input
                      id="day-input"
                      type="number"
                      min="1"
                      max="31"
                      value={specificDay}
                      onChange={(e) => setSpecificDay(parseInt(e.target.value) || 1)}
                      className="w-16"
                    />
                    <span className="text-sm text-muted-foreground">
                      of each month
                    </span>
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={savePreferenceMutation.isPending}>
              {savePreferenceMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
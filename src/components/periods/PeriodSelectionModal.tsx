import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBudgetPeriodTemplate } from "@/hooks/useBudgetPeriodTemplate";

interface PeriodSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function PeriodSelectionModal({ open, onOpenChange, userId }: PeriodSelectionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [periodType, setPeriodType] = useState<'calendar_month' | 'specific_day'>('calendar_month');
  const [specificDay, setSpecificDay] = useState<number>(1);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use the budget period template hook
  const { 
    template, 
    updateTemplate, 
    isLoading: templateLoading,
    isUpdating 
  } = useBudgetPeriodTemplate(userId);

  // Reset initialization when modal opens
  useEffect(() => {
    if (open) {
      setIsInitialized(false);
    }
  }, [open]);

  // Update form state when template loads (only once per modal open)
  useEffect(() => {
    if (template && !isInitialized) {
      setPeriodType(template.period_type);
      setSpecificDay(template.specific_day);
      setIsInitialized(true);
    }
  }, [template, isInitialized]);

  // Save preference using the template hook
  const handleSavePreference = (preference: { period_type: 'calendar_month' | 'specific_day'; specific_day: number }) => {
    updateTemplate(preference);
    onOpenChange(false);
  };

  const handleSave = () => {
    if (periodType === 'specific_day' && (specificDay < 1 || specificDay > 31)) {
      toast({
        title: "Invalid Day",
        description: "Please enter a day between 1 and 31.",
        variant: "destructive",
      });
      return;
    }

    handleSavePreference({
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
            <Button onClick={handleSave} disabled={isUpdating || templateLoading}>
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
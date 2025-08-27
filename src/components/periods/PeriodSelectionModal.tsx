import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useQueryClient } from "@tanstack/react-query";
import { useBudgetPeriodTemplate } from "@/hooks/useBudgetPeriodTemplate";
import apiClient from "@/lib/api-client";
import { getCurrencyOptions, DEFAULT_CURRENCY } from "@/config/currencies";

interface PeriodSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  language: 'english' | 'spanish';
  userPreferences?: { 
    language: 'english' | 'spanish'; 
    periodType: 'calendar_month' | 'specific_day'; 
    specificDay?: number;
    defaultCurrency: string;
  };
}

export function PeriodSelectionModal({ open, onOpenChange, userId, language, userPreferences }: PeriodSelectionModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation(language);
  const queryClient = useQueryClient();
  const [periodType, setPeriodType] = useState<'calendar_month' | 'specific_day'>('calendar_month');
  const [specificDay, setSpecificDay] = useState<number>(1);
  const [defaultCurrency, setDefaultCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);

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
      setPeriodType(template.periodType);
      setSpecificDay(template.specificDay);
      setIsInitialized(true);
    }
  }, [template, isInitialized]);

  // Update currency when userPreferences loads
  useEffect(() => {
    if (userPreferences?.defaultCurrency) {
      setDefaultCurrency(userPreferences.defaultCurrency);
    }
  }, [userPreferences]);

  // Save preferences including currency
  const handleSave = async () => {
    if (periodType === 'specific_day' && (specificDay < 1 || specificDay > 31)) {
      toast({
        title: t('invalidDay'),
        description: t('invalidDayDescription'),
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPrefs(true);
    
    try {
      // Update period preferences using the template hook
      updateTemplate({
        periodType: periodType,
        specificDay: specificDay,
      });

      // Update currency preference separately
      await apiClient.updatePreferences({
        defaultCurrency: defaultCurrency
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
      
      onOpenChange(false);
      toast({
        title: t('preferencesUpdated'),
        description: t('preferencesUpdatedDescription'),
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast({
        title: t('error'),
        description: t('failedToUpdatePreferences'),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  // Use currency options from configuration
  const currencies = getCurrencyOptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('periodSelection')}</DialogTitle>
          <DialogDescription>
            {t('periodSelectionDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <RadioGroup value={periodType} onValueChange={(value) => setPeriodType(value as 'calendar_month' | 'specific_day')}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="calendar_month" id="calendar_month" />
                <Label htmlFor="calendar_month" className="font-normal">
                  {t('calendarMonth')}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                {t('calendarMonthDescription')}
              </p>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific_day" id="specific_day" />
                <Label htmlFor="specific_day" className="font-normal">
                  {t('specificDay')}
                </Label>
              </div>
              <div className="ml-6 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t('specificDayDescription')}
                </p>
                {periodType === 'specific_day' && (
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="day-input" className="text-sm">
                      {t('startOnDay')}
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
                      {t('ofEachMonth')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>

          {/* Default Currency Selection */}
          <div className="space-y-3">
            <Label htmlFor="currency-select" className="text-sm font-medium">
              {t('defaultCurrency')}
            </Label>
            <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
              <SelectTrigger id="currency-select">
                <SelectValue placeholder={t('selectCurrency')} />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('defaultCurrencyDescription')}
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isUpdatingPrefs || isUpdating || templateLoading}>
              {(isUpdatingPrefs || isUpdating) ? t('savingEllipsis') : t('saving')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
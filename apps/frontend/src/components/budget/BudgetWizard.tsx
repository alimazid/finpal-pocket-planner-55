import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePostHog } from 'posthog-js/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Circle, Target, DollarSign, Home, Heart, Sparkles, TrendingUp, ArrowLeft, ArrowRight, Calendar, Zap, User } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { formatCurrency } from "@/lib/utils";
import { getCurrencyOptions, DEFAULT_CURRENCY } from "@/config/currencies";
import {
  UserProfile,
  SuggestedBudget,
  LIFESTYLE_OPTIONS,
  createDefaultProfile,
  calculateSuggestedBudgets,
  validateProfile,
  getLifestyleLabel,
  getLifestyleDescription
} from "@/lib/budgetTemplates";
import { QuickBudgetEntry } from "./QuickBudgetEntry";

interface BudgetWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBudgets: (budgets: { category: string; amount: number; currency: string }[], profile: UserProfile) => void;
  language: 'english' | 'spanish';
  defaultCurrency?: string;
}

type WizardStep = 'welcome' | 'income' | 'savings' | 'living' | 'lifestyle' | 'suggestions' | 'period' | 'review' | 'quick-entry' | 'success';
type WizardMode = 'guided' | 'quick';

export function BudgetWizard({
  open,
  onOpenChange,
  onCreateBudgets,
  language,
  defaultCurrency
}: BudgetWizardProps) {
  const { t } = useTranslation(language);
  const posthog = usePostHog();
  const wizardStartTime = useRef<number | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [wizardMode, setWizardMode] = useState<WizardMode | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => ({
    ...createDefaultProfile(),
    currency: defaultCurrency || DEFAULT_CURRENCY
  }));
  const [suggestedBudgets, setSuggestedBudgets] = useState<SuggestedBudget[]>([]);
  const [editedBudgets, setEditedBudgets] = useState<Record<string, number>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [savingsInputType, setSavingsInputType] = useState<'percentage' | 'amount'>('percentage');
  const [quickEntryValid, setQuickEntryValid] = useState(false);
  const [quickEntryBudgets, setQuickEntryBudgets] = useState<{ category: string; amount: number; currency: string }[]>([]);

  const steps: WizardStep[] = ['welcome', 'income', 'savings', 'living', 'lifestyle', 'suggestions', 'period', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Track wizard opened
  useEffect(() => {
    if (open && !wizardStartTime.current) {
      wizardStartTime.current = Date.now();
      posthog?.capture('wizard_opened', {
        mode: wizardMode || 'not_selected',
      });
    }
  }, [open, wizardMode, posthog]);

  const handleNext = () => {
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      const nextStep = steps[nextStepIndex];

      // Track step completion
      posthog?.capture('wizard_step_completed', {
        step_name: currentStep,
        step_index: currentStepIndex,
        mode: wizardMode || 'guided',
      });

      // Track specific step data
      if (currentStep === 'income') {
        const incomeRange = profile.monthlyIncome < 2000 ? 'low' :
                           profile.monthlyIncome < 5000 ? 'medium' :
                           profile.monthlyIncome < 10000 ? 'high' : 'very_high';
        posthog?.capture('wizard_income_entered', {
          currency: profile.currency,
          has_income: profile.monthlyIncome > 0,
          income_range: incomeRange,
        });
      }

      if (currentStep === 'savings') {
        posthog?.capture('wizard_savings_configured', {
          input_type: savingsInputType,
          savings_percentage_range: profile.savingsGoalPercentage < 10 ? 'low' :
                                   profile.savingsGoalPercentage < 20 ? 'medium' : 'high',
        });
      }

      if (currentStep === 'living') {
        posthog?.capture('wizard_living_configured', {
          living_situation: profile.livingSituation,
          housing_type: profile.housingType,
          location: profile.location,
        });
      }

      if (currentStep === 'lifestyle') {
        posthog?.capture('wizard_lifestyle_selected', {
          lifestyle_count: profile.lifestyle.length,
          lifestyle_options: profile.lifestyle,
        });
      }

      if (currentStep === 'period') {
        posthog?.capture('wizard_period_configured', {
          period_type: profile.periodType,
          specific_day: profile.periodType === 'specific_day' ? profile.specificDay : undefined,
        });
      }

      // Calculate initial savings goal when moving to savings step
      if (nextStep === 'savings' && profile.monthlyIncome > 0) {
        const calculatedSavings = Math.round((profile.monthlyIncome * profile.savingsGoalPercentage) / 100);
        setProfile(prev => ({
          ...prev,
          savingsGoal: calculatedSavings
        }));
      }

      // Generate suggestions when moving to suggestions step
      if (nextStep === 'suggestions') {
        const suggestions = calculateSuggestedBudgets(profile, language);
        setSuggestedBudgets(suggestions);
        setEditedBudgets({});

        // Track suggestions generated
        const totalSuggested = suggestions.reduce((sum, b) => sum + b.amount, 0);
        posthog?.capture('wizard_suggestions_generated', {
          suggestion_count: suggestions.length,
          total_suggested_amount: totalSuggested,
        });
      }

      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      const prevStep = steps[prevStepIndex];

      // Track step back navigation
      posthog?.capture('wizard_step_back', {
        from_step: currentStep,
        to_step: prevStep,
      });

      setCurrentStep(prevStep);
    }
  };

  const handleFinish = async () => {
    setIsCreating(true);
    try {
      const budgetsToCreate = suggestedBudgets.map(budget => ({
        category: budget.categoryName,
        amount: editedBudgets[budget.categoryName] ?? budget.amount,
        currency: profile.currency
      }));

      await onCreateBudgets(budgetsToCreate, profile);

      // Track wizard completion
      const duration = wizardStartTime.current ? Date.now() - wizardStartTime.current : 0;
      const totalAmount = budgetsToCreate.reduce((sum, b) => sum + b.amount, 0);
      posthog?.capture('wizard_completed', {
        mode: 'guided',
        budget_count: budgetsToCreate.length,
        total_amount: totalAmount,
        duration_seconds: Math.round(duration / 1000),
      });

      setCurrentStep('success');
    } catch (error) {
      console.error('Error creating budgets:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    // Track wizard abandonment if not on success step
    if (currentStep !== 'success' && wizardStartTime.current) {
      posthog?.capture('wizard_closed', {
        current_step: currentStep,
        abandoned: true,
      });
    }

    setCurrentStep('welcome');
    setWizardMode(null);
    setProfile({
      ...createDefaultProfile(),
      currency: defaultCurrency || DEFAULT_CURRENCY
    });
    setSuggestedBudgets([]);
    setEditedBudgets({});
    wizardStartTime.current = null;
    onOpenChange(false);
  };

  const handleQuickBudgetCreate = async () => {
    if (!quickEntryValid || quickEntryBudgets.length === 0) return;

    setIsCreating(true);
    try {
      // Create a minimal profile for quick setup
      const quickProfile: UserProfile = {
        ...createDefaultProfile(),
        currency: defaultCurrency || DEFAULT_CURRENCY,
        monthlyIncome: 0, // Not collected in quick setup
        savingsGoal: 0
      };

      await onCreateBudgets(quickEntryBudgets, quickProfile);

      // Track quick setup completion
      const duration = wizardStartTime.current ? Date.now() - wizardStartTime.current : 0;
      const totalAmount = quickEntryBudgets.reduce((sum, b) => sum + b.amount, 0);
      posthog?.capture('wizard_completed', {
        mode: 'quick',
        budget_count: quickEntryBudgets.length,
        total_amount: totalAmount,
        duration_seconds: Math.round(duration / 1000),
      });

      setCurrentStep('success');
    } catch (error) {
      console.error('Error creating budgets:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickEntryValidation = (hasValidBudgets: boolean, validBudgets: { category: string; amount: number; currency: string }[]) => {
    setQuickEntryValid(hasValidBudgets);
    setQuickEntryBudgets(validBudgets);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'income':
        return profile.monthlyIncome > 0 && profile.currency;
      case 'period':
        return profile.periodType && (profile.periodType === 'calendar_month' || profile.specificDay);
      case 'living':
        return profile.livingSituation && profile.housingType && profile.location;
      case 'lifestyle':
        return true; // Lifestyle is optional
      case 'suggestions':
        return true;
      case 'review':
        return true;
      default:
        return true;
    }
  };

  const updateBudgetAmount = (categoryName: string, amount: number) => {
    const originalBudget = suggestedBudgets.find(b => b.categoryName === categoryName);
    if (originalBudget) {
      const originalAmount = originalBudget.amount;
      const adjustmentPercentage = originalAmount > 0
        ? Math.round(((amount - originalAmount) / originalAmount) * 100)
        : 0;

      // Track budget adjustment
      posthog?.capture('wizard_budget_adjusted', {
        category: categoryName,
        original_amount: originalAmount,
        new_amount: amount,
        adjustment_percentage: adjustmentPercentage,
      });
    }

    setEditedBudgets(prev => ({
      ...prev,
      [categoryName]: amount
    }));
  };

  const getTotalBudgeted = () => {
    return suggestedBudgets.reduce((total, budget) => {
      return total + (editedBudgets[budget.categoryName] ?? budget.amount);
    }, 0);
  };

  const updateSavingsFromPercentage = (percentage: number) => {
    const savingsAmount = Math.round((profile.monthlyIncome * percentage) / 100);
    setProfile(prev => ({
      ...prev,
      savingsGoalPercentage: percentage,
      savingsGoal: savingsAmount
    }));
  };

  const updateSavingsFromAmount = (amount: number) => {
    const percentage = profile.monthlyIncome > 0 ? Math.round((amount / profile.monthlyIncome) * 100) : 0;
    setProfile(prev => ({
      ...prev,
      savingsGoal: amount,
      savingsGoalPercentage: percentage
    }));
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6 py-8">
      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
        <Target className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('welcomeToBudgetWizard')}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">{t('chooseSetupMethod')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {/* Guided Setup Option */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50" onClick={() => {
          setWizardMode('guided');
          posthog?.capture('wizard_mode_selected', {
            mode: 'guided',
          });
          handleNext();
        }}>
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{t('guidedSetup')}</h3>
              <p className="text-sm text-muted-foreground mt-2">{t('guidedSetupDescription')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Setup Option */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50" onClick={() => {
          setWizardMode('quick');
          posthog?.capture('wizard_mode_selected', {
            mode: 'quick',
          });
          posthog?.capture('wizard_quick_entry_started');
          setCurrentStep('quick-entry');
        }}>
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{t('quickSetup')}</h3>
              <p className="text-sm text-muted-foreground mt-2">{t('quickSetupDescription')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderIncomeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <DollarSign className="w-12 h-12 mx-auto text-primary mb-3" />
        <h3 className="text-xl font-semibold mb-2">{t('monthlyIncome')}</h3>
        <p className="text-muted-foreground">{t('monthlyIncomeDescription')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="income">{t('monthlyIncome')}</Label>
          <Input
            id="income"
            type="number"
            placeholder={t('enterMonthlyIncome')}
            value={profile.monthlyIncome || ''}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              monthlyIncome: parseFloat(e.target.value) || 0
            }))}
            step="0.01"
            min="0"
            className="text-lg"
          />
        </div>

        <div>
          <Label htmlFor="currency">{t('preferredCurrency')}</Label>
          <Select
            value={profile.currency}
            onValueChange={(value) => setProfile(prev => ({ ...prev, currency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getCurrencyOptions().map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderSavingsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
          <span className="text-2xl">💰</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">{t('setSavingsGoal')}</h3>
        <p className="text-muted-foreground">{t('savingsGoalDescription')}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={savingsInputType === 'percentage' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSavingsInputType('percentage')}
          >
            {t('savingsPercentage')}
          </Button>
          <Button
            variant={savingsInputType === 'amount' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSavingsInputType('amount')}
          >
            {t('savingsAmount')}
          </Button>
        </div>

        {savingsInputType === 'percentage' ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>5%</span>
              <span>{profile.savingsGoalPercentage}%</span>
              <span>30%</span>
            </div>
            <Slider
              value={[profile.savingsGoalPercentage]}
              onValueChange={(value) => updateSavingsFromPercentage(value[0])}
              min={5}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="text-center">
              <p className="text-lg font-semibold">
                {formatCurrency(profile.savingsGoal, profile.currency)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('youWillSave')} {profile.savingsGoalPercentage}% ({formatCurrency(profile.savingsGoal, profile.currency)})
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              type="number"
              placeholder={t('enterSavingsGoal')}
              value={profile.savingsGoal || ''}
              onChange={(e) => updateSavingsFromAmount(parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              className="text-center text-lg"
            />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {profile.savingsGoalPercentage}% {t('ofIncome')} • {t('recommendedSavings')}
              </p>
            </div>
          </div>
        )}

        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">{t('monthlyIncome')}:</span>
            <span className="text-lg font-semibold">{formatCurrency(profile.monthlyIncome, profile.currency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">{t('savingsGoal')}:</span>
            <span className="text-lg font-semibold text-green-600">{formatCurrency(profile.savingsGoal, profile.currency)}</span>
          </div>
          <div className="flex justify-between items-center text-primary">
            <span className="font-medium">{t('availableForBudgeting')}:</span>
            <span className="text-lg font-semibold">{formatCurrency(profile.monthlyIncome - profile.savingsGoal, profile.currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPeriodStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Calendar className="w-12 h-12 mx-auto text-primary mb-3" />
        <h3 className="text-xl font-semibold mb-2">{t('periodSettings')}</h3>
        <p className="text-muted-foreground">{t('periodSettingsDescription')}</p>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">{t('budgetPeriodType')}</Label>
        <RadioGroup
          value={profile.periodType}
          onValueChange={(value) => setProfile(prev => ({ ...prev, periodType: value as 'calendar_month' | 'specific_day' }))}
        >
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
            {profile.periodType === 'specific_day' && (
              <div className="ml-6 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t('specificDayDescription')}
                </p>
                <Select
                  value={profile.specificDay?.toString() || '1'}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, specificDay: parseInt(value) }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {t('dayOfMonth')} {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const renderLivingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Home className="w-12 h-12 mx-auto text-primary mb-3" />
        <h3 className="text-xl font-semibold mb-2">{t('livingSituation')}</h3>
        <p className="text-muted-foreground">{t('livingSituationDescription')}</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium">{t('relationshipStatus')}</Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {[
              { value: 'single', label: t('single'), icon: '👤' },
              { value: 'couple', label: t('couple'), icon: '👫' },
              { value: 'family', label: t('family'), icon: '👨‍👩‍👧‍👦' }
            ].map((option) => (
              <Card
                key={option.value}
                className={`cursor-pointer transition-all ${
                  profile.livingSituation === option.value
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setProfile(prev => ({ ...prev, livingSituation: option.value as 'single' | 'couple' | 'family' }))}
              >
                <CardContent className="flex items-center p-3">
                  <span className="text-xl mr-3">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                  {profile.livingSituation === option.value && (
                    <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">{t('housingType')}</Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {[
              { value: 'rent', label: t('rent'), icon: '🏠' },
              { value: 'own', label: t('own'), icon: '🏡' },
              { value: 'family', label: t('familyHome'), icon: '🏘️' }
            ].map((option) => (
              <Card
                key={option.value}
                className={`cursor-pointer transition-all ${
                  profile.housingType === option.value
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setProfile(prev => ({ ...prev, housingType: option.value as 'rent' | 'own' | 'family' }))}
              >
                <CardContent className="flex items-center p-3">
                  <span className="text-xl mr-3">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                  {profile.housingType === option.value && (
                    <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">{t('locationType')}</Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {[
              { value: 'city', label: t('city'), icon: '🏙️' },
              { value: 'suburban', label: t('suburban'), icon: '🏘️' },
              { value: 'rural', label: t('rural'), icon: '🌾' }
            ].map((option) => (
              <Card
                key={option.value}
                className={`cursor-pointer transition-all ${
                  profile.location === option.value
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setProfile(prev => ({ ...prev, location: option.value as 'city' | 'suburban' | 'rural' }))}
              >
                <CardContent className="flex items-center p-3">
                  <span className="text-xl mr-3">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                  {profile.location === option.value && (
                    <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  const renderLifestyleStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Sparkles className="w-12 h-12 mx-auto text-primary mb-3" />
        <h3 className="text-xl font-semibold mb-2">{t('lifestylePriorities')}</h3>
        <p className="text-muted-foreground">{t('lifestylePrioritiesDescription')}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {LIFESTYLE_OPTIONS.map((option) => {
          const isSelected = profile.lifestyle.includes(option.value);
          return (
            <Card
              key={option.value}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => {
                setProfile(prev => ({
                  ...prev,
                  lifestyle: isSelected
                    ? prev.lifestyle.filter(l => l !== option.value)
                    : [...prev.lifestyle, option.value]
                }));
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">{option.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{getLifestyleLabel(option, language)}</h4>
                      {isSelected ? (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{getLifestyleDescription(option, language)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderSuggestionsStep = () => {
    const availableForBudgeting = profile.monthlyIncome - profile.savingsGoal;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-primary mb-3" />
          <h3 className="text-xl font-semibold mb-2">{t('budgetSuggestions')}</h3>
          <p className="text-muted-foreground">{t('budgetSuggestionsDescription')}</p>
        </div>

        {/* Savings Goal Display */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <h4 className="font-medium text-green-800">{t('savingsGoal')}</h4>
                  <p className="text-xs text-green-600">
                    {Math.round((profile.savingsGoal / profile.monthlyIncome) * 100)}% {t('ofIncome')}
                  </p>
                </div>
              </div>
              <span className="text-lg font-semibold text-green-800">
                {formatCurrency(profile.savingsGoal, profile.currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Income Breakdown Summary */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">{t('monthlyIncome')}:</span>
            <span className="text-lg font-semibold">{formatCurrency(profile.monthlyIncome, profile.currency)}</span>
          </div>
          <div className="flex justify-between items-center text-green-700">
            <span className="font-medium">{t('savingsGoal')}:</span>
            <span className="font-semibold">-{formatCurrency(profile.savingsGoal, profile.currency)}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-2">
            <span className="font-medium">{t('availableForBudgets')}:</span>
            <span className="text-lg font-semibold">{formatCurrency(availableForBudgeting, profile.currency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">{t('totalBudgeted')}:</span>
            <span className="text-lg font-semibold">{formatCurrency(getTotalBudgeted(), profile.currency)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{Math.round((getTotalBudgeted() / availableForBudgeting) * 100)}% {t('ofAvailable')}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">{t('adjustBudgetAmounts')}</Label>
          {suggestedBudgets.map((budget) => {
            const currentAmount = editedBudgets[budget.categoryName] ?? budget.amount;
            return (
              <Card key={budget.categoryName}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{budget.icon}</span>
                      <div>
                        <h4 className="font-medium">{budget.categoryName}</h4>
                        <p className="text-xs text-muted-foreground">{budget.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{budget.percentage}%</Badge>
                  </div>
                  <Input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => updateBudgetAmount(budget.categoryName, parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                    className="text-right"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderReviewStep = () => {
    const availableForBudgeting = profile.monthlyIncome - profile.savingsGoal;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-primary mb-3" />
          <h3 className="text-xl font-semibold mb-2">{t('reviewAndSave')}</h3>
          <p className="text-muted-foreground">{t('reviewDescription')}</p>
        </div>

        {/* Period & Income Summary */}
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4">{t('budgetSummary')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('budgetPeriod')}:</span>
                <span className="font-medium">
                  {profile.periodType === 'calendar_month' ? t('calendarMonth') :
                   `${t('customPeriod')} (${profile.specificDay}${t('ofEachMonth')})`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('monthlyIncome')}:</span>
                <span className="font-semibold">{formatCurrency(profile.monthlyIncome, profile.currency)}</span>
              </div>
              <div className="flex justify-between items-center text-green-700">
                <span className="text-muted-foreground">{t('savingsGoal')}:</span>
                <span className="font-semibold">{formatCurrency(profile.savingsGoal, profile.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('availableForBudgets')}:</span>
                <span className="font-semibold">{formatCurrency(availableForBudgeting, profile.currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Breakdown */}
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4">{t('budgetBreakdown')}</h4>
            <div className="space-y-3">
              {suggestedBudgets.map((budget, index) => {
                const amount = editedBudgets[budget.categoryName] ?? budget.amount;
                return (
                  <div key={budget.categoryName}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{budget.icon}</span>
                        <span className="font-medium">{budget.categoryName}</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(amount, profile.currency)}</span>
                    </div>
                    {index < suggestedBudgets.length - 1 && <Separator className="mt-2" />}
                  </div>
                );
              })}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>{t('totalBudgeted')}:</span>
              <span>{formatCurrency(getTotalBudgeted(), profile.currency)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSuccessStep = () => (
    <div className="text-center space-y-6 py-8">
      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('budgetCreatedSuccessfully')}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">{t('budgetCreatedSuccessDescription')}</p>
      </div>
      <Button onClick={handleClose} className="w-full max-w-xs">
        {t('finish')}
      </Button>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'income':
        return renderIncomeStep();
      case 'savings':
        return renderSavingsStep();
      case 'living':
        return renderLivingStep();
      case 'lifestyle':
        return renderLifestyleStep();
      case 'suggestions':
        return renderSuggestionsStep();
      case 'period':
        return renderPeriodStep();
      case 'review':
        return renderReviewStep();
      case 'quick-entry':
        return (
          <QuickBudgetEntry
            onCreateBudgets={() => {}} // Not used anymore, handled by footer
            onValidationChange={handleQuickEntryValidation}
            language={language}
            defaultCurrency={defaultCurrency}
          />
        );
      case 'success':
        return renderSuccessStep();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            {currentStep === 'welcome' || currentStep === 'success'
              ? t('createYourFirstBudget')
              : currentStep === 'quick-entry'
              ? t('quickSetup')
              : `${t('wizardStep')} ${currentStepIndex + 1} ${t('wizardOf')} ${steps.length}`
            }
          </DialogTitle>
          {currentStep !== 'welcome' && currentStep !== 'success' && currentStep !== 'quick-entry' && (
            <div className="w-full mt-4">
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </DialogHeader>

        <div className="py-4">
          {renderStepContent()}
        </div>

        {currentStep !== 'welcome' && currentStep !== 'success' && currentStep !== 'quick-entry' && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </Button>

            {currentStep === 'review' ? (
              <Button
                onClick={handleFinish}
                disabled={!canProceed() || isCreating}
                className="flex items-center gap-2"
              >
                {isCreating ? t('creating') + '...' : t('createAllBudgets')}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                {t('next')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Quick Entry Footer */}
        {currentStep === 'quick-entry' && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('welcome')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </Button>
            <Button
              onClick={handleQuickBudgetCreate}
              disabled={!quickEntryValid || isCreating}
              className="flex items-center gap-2"
            >
              {isCreating ? t('creating') : t('createBudgets')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
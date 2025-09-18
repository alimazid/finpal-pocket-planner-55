import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Mail, Shield, Zap, ArrowRight, ArrowLeft, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { apiClient } from '@/lib/api-client';

interface GmailConnectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: 'english' | 'spanish';
}

type WizardStep = 'intro' | 'privacy' | 'connect' | 'success';

export function GmailConnectionWizard({ isOpen, onClose, onSuccess, language }: GmailConnectionWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('intro');
  const [isConnecting, setIsConnecting] = useState(false);
  const { t } = useTranslation(language);


  const steps: Record<WizardStep, { title: string; progress: number }> = {
    intro: { title: t('gmailWizard.intro.title'), progress: 25 },
    privacy: { title: t('gmailWizard.privacy.title'), progress: 50 },
    connect: { title: t('gmailWizard.connect.title'), progress: 75 },
    success: { title: t('gmailWizard.success.title'), progress: 100 }
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'intro':
        setCurrentStep('privacy');
        break;
      case 'privacy':
        setCurrentStep('connect');
        break;
      case 'connect':
        handleConnect();
        break;
      case 'success':
        onSuccess();
        onClose();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'privacy':
        setCurrentStep('intro');
        break;
      case 'connect':
        setCurrentStep('privacy');
        break;
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Get the auth URL from our backend
      const response = await apiClient.generateGmailAuthUrl(window.location.href);

      if (response.success && response.data) {
        // Store state in sessionStorage for OAuth validation (expected by GmailOAuthCallback)
        sessionStorage.setItem('gmail_oauth_state', response.data.state);

        // Redirect to Google OAuth in the same tab
        window.location.href = response.data.authUrl;
      } else {
        throw new Error(response.error || 'Failed to generate auth URL');
      }
    } catch (error) {
      console.error('Failed to start Gmail connection:', error);
      setIsConnecting(false);
      // TODO: Show error toast
    }
  };

  const renderIntroStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{t('gmailWizard.intro.subtitle')}</h3>
        <p className="text-muted-foreground">{t('gmailWizard.intro.description')}</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('gmailWizard.intro.benefits.automatic.title')}</CardTitle>
                <CardDescription>{t('gmailWizard.intro.benefits.automatic.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('gmailWizard.intro.benefits.accurate.title')}</CardTitle>
                <CardDescription>{t('gmailWizard.intro.benefits.accurate.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('gmailWizard.intro.benefits.secure.title')}</CardTitle>
                <CardDescription>{t('gmailWizard.intro.benefits.secure.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );

  const renderPrivacyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{t('gmailWizard.privacy.subtitle')}</h3>
        <p className="text-muted-foreground">{t('gmailWizard.privacy.description')}</p>
      </div>

      <div className="space-y-4">
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">{t('gmailWizard.privacy.points.readOnly.title')}</h4>
                <p className="text-sm text-muted-foreground">{t('gmailWizard.privacy.points.readOnly.description')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">{t('gmailWizard.privacy.points.encrypted.title')}</h4>
                <p className="text-sm text-muted-foreground">{t('gmailWizard.privacy.points.encrypted.description')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">{t('gmailWizard.privacy.points.noStorage.title')}</h4>
                <p className="text-sm text-muted-foreground">{t('gmailWizard.privacy.points.noStorage.description')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">{t('gmailWizard.privacy.points.revoke.title')}</h4>
                <p className="text-sm text-muted-foreground">{t('gmailWizard.privacy.points.revoke.description')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderConnectStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{t('gmailWizard.connect.subtitle')}</h3>
        <p className="text-muted-foreground">{t('gmailWizard.connect.description')}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">1</span>
              <span>{t('gmailWizard.connect.steps.redirect')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">2</span>
              <span>{t('gmailWizard.connect.steps.signIn')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">3</span>
              <span>{t('gmailWizard.connect.steps.permissions')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">4</span>
              <span>{t('gmailWizard.connect.steps.done')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isConnecting && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-blue-700 dark:text-blue-300">{t('gmailWizard.connect.connecting')}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{t('gmailWizard.success.subtitle')}</h3>
        <p className="text-muted-foreground">{t('gmailWizard.success.description')}</p>
      </div>

      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm">{t('gmailWizard.success.features.monitoring')}</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm">{t('gmailWizard.success.features.automatic')}</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm">{t('gmailWizard.success.features.notifications')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">{t('gmailWizard.success.next')}</p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'intro':
        return renderIntroStep();
      case 'privacy':
        return renderPrivacyStep();
      case 'connect':
        return renderConnectStep();
      case 'success':
        return renderSuccessStep();
    }
  };

  const canGoNext = () => {
    return !isConnecting;
  };

  const canGoBack = () => {
    return currentStep !== 'intro' && currentStep !== 'success' && !isConnecting;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {steps[currentStep].title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('gmailWizard.step')} {Object.keys(steps).indexOf(currentStep) + 1} {t('gmailWizard.of')} {Object.keys(steps).length}</span>
              <span>{steps[currentStep].progress}%</span>
            </div>
            <Progress value={steps[currentStep].progress} className="h-2" />
          </div>

          {renderCurrentStep()}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={!canGoBack()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="flex items-center gap-2"
            >
              {currentStep === 'success' ? (
                <>
                  {t('gmailWizard.getStarted')}
                  <CheckCircle className="w-4 h-4" />
                </>
              ) : currentStep === 'connect' ? (
                <>
                  {isConnecting ? t('gmailWizard.connect.connecting') : t('gmailWizard.connect.button')}
                  <ExternalLink className="w-4 h-4" />
                </>
              ) : (
                <>
                  {t('next')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
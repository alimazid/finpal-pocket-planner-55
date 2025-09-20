import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const GmailOAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Check for OAuth error
        if (error) {
          throw new Error(error === 'access_denied' ? 'Authorization was cancelled' : `OAuth error: ${error}`);
        }

        // Validate required parameters
        if (!code || !state) {
          throw new Error('Missing required OAuth parameters');
        }

        // Validate state parameter against stored value
        const storedState = sessionStorage.getItem('gmail_oauth_state');
        if (!storedState || storedState !== state) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }

        // Clear stored state
        sessionStorage.removeItem('gmail_oauth_state');

        // Exchange code for account registration
        const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
        if (!webhookUrl) {
          throw new Error('VITE_WEBHOOK_URL environment variable is not set');
        }

        const response = await apiClient.handleGmailCallback({
          code,
          state,
          webhookUrl
        });

        if (response.success && response.data) {
          setStatus('success');
          toast({
            title: 'Gmail Connected Successfully',
            description: `Your Gmail account ${response.data.gmailAddress} has been connected and monitoring has been started.`
          });

          // Redirect to home page after a short delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          throw new Error(response.error || 'Failed to connect Gmail account');
        }
      } catch (error) {
        console.error('Gmail OAuth callback error:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        setErrorMessage(message);
        setStatus('error');

        toast({
          title: 'Connection Failed',
          description: message,
          variant: 'destructive'
        });
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  const handleRetry = () => {
    navigate('/', { replace: true });
  };

  const handleGoToSettings = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
            Gmail Connection
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Processing your Gmail connection...'}
            {status === 'success' && 'Your Gmail account has been connected successfully!'}
            {status === 'error' && 'There was a problem connecting your Gmail account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'processing' && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Please wait while we complete the setup...</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Validating authorization</span>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <div className="h-3 w-3 rounded-full border-2 border-muted-foreground" />
                  <span>Registering with Penny</span>
                </div>
                <div className="flex items-center gap-2 opacity-30">
                  <div className="h-3 w-3 rounded-full border-2 border-muted-foreground" />
                  <span>Starting email monitoring</span>
                </div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-3">
              <div className="text-sm text-muted-foreground">
                <p>✅ Authorization validated</p>
                <p>✅ Registered with Penny</p>
                <p>✅ Email monitoring started</p>
              </div>
              <p className="text-sm">
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>

              <div className="text-center text-sm text-muted-foreground">
                <p>Don't worry! You can try connecting your Gmail account again.</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex gap-2">
              <Button onClick={handleRetry} className="flex-1">
                Try Again
              </Button>
              <Button onClick={handleGoToSettings} variant="outline" className="flex-1">
                Go to Dashboard
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};
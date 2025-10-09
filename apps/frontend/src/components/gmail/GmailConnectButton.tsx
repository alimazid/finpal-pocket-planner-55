import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { Mail, Loader2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';

interface GmailConnectButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const GmailConnectButton: React.FC<GmailConnectButtonProps> = ({
  onSuccess,
  onError,
  className,
  disabled = false,
  variant = "default",
  size = "default"
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const posthog = usePostHog();

  const handleConnectGmail = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Get webhook URL from environment variable
      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
      if (!webhookUrl) {
        throw new Error('VITE_WEBHOOK_URL environment variable is not set');
      }

      // Get OAuth URL from backend
      const response = await apiClient.generateGmailAuthUrl(webhookUrl);

      if (response.success && response.data) {
        // Store state in session storage for callback validation
        sessionStorage.setItem('gmail_oauth_state', response.data.state);

        // Track Gmail connection initiated event
        posthog?.capture('gmail_connection_initiated');

        // Redirect to Google OAuth
        window.location.href = response.data.authUrl;
      } else {
        throw new Error(response.error || 'Failed to generate authentication URL');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect Gmail account';
      console.error('Gmail connect error:', error);

      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive'
      });

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleConnectGmail}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Mail className="mr-2 h-4 w-4" />
      )}
      {isLoading ? 'Connecting...' : 'Connect Gmail'}
    </Button>
  );
};
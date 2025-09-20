import { apiClient } from './api-client';

export const initiateGmailOAuth = async () => {
  try {
    // Get the auth URL from our backend
    const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('VITE_WEBHOOK_URL environment variable is not set');
    }
    const response = await apiClient.generateGmailAuthUrl(webhookUrl);

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
    throw error;
  }
};
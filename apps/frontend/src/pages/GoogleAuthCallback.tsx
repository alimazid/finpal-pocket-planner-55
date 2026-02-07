import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { usePostHog } from "posthog-js/react";

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const posthog = usePostHog();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        toast({
          title: 'Authentication Error',
          description: error === 'access_denied' ? 'Authentication was cancelled' : 'Authentication failed',
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      if (!code) {
        toast({
          title: 'Authentication Error',
          description: 'No authorization code received',
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      try {
        const response = await apiClient.googleAuthCallback(code, state ?? undefined);

        if (response.success && response.data) {
          // Track successful Google sign-in
          posthog?.capture('user_signed_in', {
            method: 'google',
          });

          toast({
            title: 'Welcome!',
            description: 'Successfully signed in with Google',
          });

          navigate("/dashboard");
        } else {
          throw new Error(response.error || 'Authentication failed');
        }
      } catch (error) {
        toast({
          title: 'Authentication Error',
          description: error instanceof Error ? error.message : 'Authentication failed',
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Completing Authentication</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Please wait while we complete your Google sign-in...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleAuthCallback;
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, type User } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GmailAccountList } from "@/components/gmail";
import { ArrowLeft, Mail, Settings } from "lucide-react";

const GmailSettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on page load
    const checkAuth = async () => {
      try {
        const response = await apiClient.getProfile();
        if (response.success && response.data) {
          console.log('User authenticated:', response.data.email);
          setUser(response.data);
          setIsAuthenticated(true);
        } else {
          console.log('User not authenticated');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.log('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth page
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="text-white border-white/20 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Gmail Integration</h1>
                <p className="text-sm text-white/80">Manage your connected Gmail accounts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Gmail Integration Overview
            </CardTitle>
            <CardDescription>
              FinPal integrates with Penny's AI-powered email monitoring service to automatically track financial emails from your Gmail accounts. This enables automatic transaction detection and categorization from bank statements, receipts, bills, and other financial communications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">What Gets Monitored</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bank account statements and alerts</li>
                  <li>• Credit card transactions and bills</li>
                  <li>• Payment confirmations and receipts</li>
                  <li>• Investment and trading notifications</li>
                  <li>• Subscription and service payments</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Privacy & Security</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• OAuth 2.0 secure authentication</li>
                  <li>• Read-only access to your emails</li>
                  <li>• End-to-end encrypted data processing</li>
                  <li>• No personal emails are stored</li>
                  <li>• You can disconnect at any time</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gmail Account Management */}
        <GmailAccountList userId={user.id} />

        {/* Help & Support */}
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
            <CardDescription>
              Having trouble connecting your Gmail account or questions about how the integration works?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Common Issues</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Make sure you're using a Gmail account (not other email providers)</li>
                    <li>• Grant all requested permissions during OAuth flow</li>
                    <li>• Check that your Gmail account has financial emails to monitor</li>
                    <li>• Ensure popup blockers aren't preventing the OAuth window</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">How It Works</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• FinPal initiates secure OAuth connection to Gmail</li>
                    <li>• Tokens are sent to Penny for monitoring setup</li>
                    <li>• Penny's AI scans new emails for financial content</li>
                    <li>• Extracted transaction data can be imported to FinPal</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  If you continue to experience issues, please check the browser console for error messages or contact support for assistance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GmailSettings;
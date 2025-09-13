import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiClient, GmailAccount, PennyAccountStatus } from '@/lib/api-client';
import { GmailConnectButton } from './GmailConnectButton';
import { GmailAccountCard } from './GmailAccountCard';
import { Mail, RefreshCw, AlertTriangle, Plus } from 'lucide-react';

interface GmailAccountListProps {
  userId: string;
}

export const GmailAccountList: React.FC<GmailAccountListProps> = ({ userId }) => {
  const [accountStatuses, setAccountStatuses] = useState<Record<string, PennyAccountStatus>>({});
  const [refreshingStatuses, setRefreshingStatuses] = useState(false);
  const { toast } = useToast();

  // Fetch Gmail accounts
  const {
    data: accounts = [],
    isLoading,
    error,
    refetch: refetchAccounts
  } = useQuery({
    queryKey: ['gmail-accounts', userId],
    queryFn: async () => {
      const response = await apiClient.getGmailAccounts();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch Gmail accounts');
    },
    enabled: !!userId,
    refetchInterval: 30000 // Refetch every 30 seconds to keep status updated
  });

  // Fetch account statuses from Penny
  const fetchAccountStatuses = async (accountsToFetch: GmailAccount[]) => {
    if (accountsToFetch.length === 0) return;

    setRefreshingStatuses(true);
    const newStatuses: Record<string, PennyAccountStatus> = {};

    try {
      const statusPromises = accountsToFetch.map(async (account) => {
        try {
          const response = await apiClient.getGmailAccountStatus(account.id);
          if (response.success && response.data) {
            newStatuses[account.id] = response.data;
          }
        } catch (error) {
          console.error(`Failed to fetch status for account ${account.id}:`, error);
        }
      });

      await Promise.all(statusPromises);
      setAccountStatuses(prevStatuses => ({ ...prevStatuses, ...newStatuses }));
    } catch (error) {
      console.error('Error fetching account statuses:', error);
    } finally {
      setRefreshingStatuses(false);
    }
  };

  // Fetch statuses when accounts change
  useEffect(() => {
    if (accounts.length > 0) {
      fetchAccountStatuses(accounts);
    }
  }, [accounts]);

  const handleAccountUpdate = () => {
    refetchAccounts();
    if (accounts.length > 0) {
      fetchAccountStatuses(accounts);
    }
  };

  const handleAccountRemoved = () => {
    refetchAccounts();
  };

  const handleRefreshAll = () => {
    handleAccountUpdate();
    toast({
      title: 'Refreshing',
      description: 'Updating all account statuses...'
    });
  };

  const handleConnectSuccess = () => {
    refetchAccounts();
    toast({
      title: 'Gmail Connected',
      description: 'Your Gmail account has been connected and monitoring has started.'
    });
  };

  const handleConnectError = (error: string) => {
    toast({
      title: 'Connection Failed',
      description: error,
      variant: 'destructive'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gmail Accounts
            </CardTitle>
            <CardDescription>
              Connect your Gmail accounts to automatically track financial emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load Gmail accounts. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gmail Accounts
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefreshAll}
                disabled={refreshingStatuses}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshingStatuses ? 'animate-spin' : ''}`} />
                Refresh All
              </Button>
              <GmailConnectButton
                onSuccess={handleConnectSuccess}
                onError={handleConnectError}
                variant="default"
                size="sm"
              />
            </div>
          </CardTitle>
          <CardDescription>
            Connect your Gmail accounts to automatically track financial emails and transactions.
            FinPal uses Penny's monitoring service to classify and extract financial data from your emails.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Account List */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No Gmail Accounts Connected</h3>
                <p className="text-muted-foreground mt-1">
                  Connect your first Gmail account to start tracking financial emails automatically.
                </p>
              </div>
              <GmailConnectButton
                onSuccess={handleConnectSuccess}
                onError={handleConnectError}
                className="mt-4"
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => (
            <GmailAccountCard
              key={account.id}
              account={account}
              accountStatus={accountStatuses[account.id] || null}
              onUpdate={handleAccountUpdate}
              onRemove={handleAccountRemoved}
            />
          ))}
        </div>
      )}

      {/* Add Additional Account */}
      {accounts.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Add Another Account</h3>
                <p className="text-sm text-muted-foreground">
                  Connect additional Gmail accounts for comprehensive financial tracking.
                </p>
              </div>
              <GmailConnectButton
                onSuccess={handleConnectSuccess}
                onError={handleConnectError}
                variant="outline"
                size="sm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-white font-semibold">i</span>
            </div>
            <div className="text-sm">
              <h4 className="font-semibold text-blue-900 mb-1">How Gmail Integration Works</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• FinPal securely connects to your Gmail using OAuth</li>
                <li>• Penny's AI monitors your emails for financial content</li>
                <li>• Bank statements, receipts, and bills are automatically classified</li>
                <li>• Financial data is extracted and can be imported into your budgets</li>
                <li>• All processing happens securely and respects your privacy</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
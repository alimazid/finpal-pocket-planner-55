import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { apiClient, GmailAccount, PennyAccountStatus } from '@/lib/api-client';
import { Mail, Play, Pause, Trash2, RefreshCw, Activity, AlertCircle, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GmailAccountCardProps {
  account: GmailAccount;
  accountStatus?: PennyAccountStatus | null;
  onUpdate?: () => void;
  onRemove?: () => void;
}

export const GmailAccountCard: React.FC<GmailAccountCardProps> = ({
  account,
  accountStatus,
  onUpdate,
  onRemove
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStartMonitoring = async () => {
    setActionLoading('start');
    try {
      const response = await apiClient.startGmailMonitoring(account.id);
      if (response.success) {
        toast({
          title: 'Monitoring Started',
          description: `Gmail monitoring for ${account.gmailAddress} has been started.`
        });
        if (onUpdate) onUpdate();
      } else {
        throw new Error(response.error || 'Failed to start monitoring');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start monitoring',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopMonitoring = async () => {
    setActionLoading('stop');
    try {
      const response = await apiClient.stopGmailMonitoring(account.id);
      if (response.success) {
        toast({
          title: 'Monitoring Stopped',
          description: `Gmail monitoring for ${account.gmailAddress} has been stopped.`
        });
        if (onUpdate) onUpdate();
      } else {
        throw new Error(response.error || 'Failed to stop monitoring');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to stop monitoring',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefreshStatus = async () => {
    setIsLoading(true);
    try {
      await apiClient.getGmailAccountStatus(account.id);
      if (onUpdate) onUpdate();
      toast({
        title: 'Status Updated',
        description: 'Account status has been refreshed.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh account status',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAccount = async () => {
    setActionLoading('remove');
    try {
      const response = await apiClient.removeGmailAccount(account.id);
      if (response.success) {
        toast({
          title: 'Account Removed',
          description: `Gmail account ${account.gmailAddress} has been removed.`
        });
        if (onRemove) onRemove();
      } else {
        throw new Error(response.error || 'Failed to remove account');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove account',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getConnectionStatus = () => {
    if (!account.isConnected) {
      return { label: 'Disconnected', color: 'destructive' as const, icon: AlertCircle };
    }
    if (account.monitoringActive) {
      return { label: 'Monitoring', color: 'default' as const, icon: Activity };
    }
    return { label: 'Connected', color: 'secondary' as const, icon: CheckCircle };
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          {account.gmailAddress}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={status.color} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Connected</p>
            <p className="font-medium">
              {formatDistanceToNow(new Date(account.registeredAt), { addSuffix: true })}
            </p>
          </div>
          {account.lastSyncAt && (
            <div>
              <p className="text-muted-foreground">Last Sync</p>
              <p className="font-medium">
                {formatDistanceToNow(new Date(account.lastSyncAt), { addSuffix: true })}
              </p>
            </div>
          )}
        </div>

        {/* Statistics from Penny */}
        {accountStatus && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email Processing Stats</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{accountStatus.statistics.totalEmails}</p>
                <p className="text-muted-foreground">Total Emails</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{accountStatus.statistics.financialEmails}</p>
                <p className="text-muted-foreground">Financial</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{accountStatus.statistics.extractedData}</p>
                <p className="text-muted-foreground">Extracted</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefreshStatus}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {account.isConnected && (
              <>
                {account.monitoringActive ? (
                  <Button
                    onClick={handleStopMonitoring}
                    disabled={actionLoading === 'stop'}
                    variant="outline"
                    size="sm"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    {actionLoading === 'stop' ? 'Stopping...' : 'Stop'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleStartMonitoring}
                    disabled={actionLoading === 'start'}
                    variant="default"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {actionLoading === 'start' ? 'Starting...' : 'Start'}
                  </Button>
                )}
              </>
            )}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={actionLoading === 'remove'}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Gmail Account</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove {account.gmailAddress}? This will stop monitoring and delete all associated data from both FinPal and Penny. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemoveAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Warning for disconnected accounts */}
        {!account.isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Account Disconnected</p>
              <p className="text-yellow-700 mt-1">
                This account has been disconnected from Gmail. You may need to reconnect it to resume monitoring.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
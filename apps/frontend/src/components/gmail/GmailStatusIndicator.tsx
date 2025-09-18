import { Mail, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';

interface GmailAccount {
  email: string;
  status: 'connected' | 'error' | 'syncing';
  lastSync?: Date;
  unprocessedCount?: number;
}

interface GmailStatusIndicatorProps {
  account?: GmailAccount;
  onConnect: () => void;
  onManage?: () => void;
  language: 'english' | 'spanish';
}

export function GmailStatusIndicator({ account, onConnect, onManage, language }: GmailStatusIndicatorProps) {
  const { t } = useTranslation(language);

  if (!account) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onConnect}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">{t('gmail.connect')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('gmail.connectTooltip')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const getStatusIcon = () => {
    switch (account.status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'syncing':
        return <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (account.status) {
      case 'connected':
        return t('gmail.status.connected');
      case 'error':
        return t('gmail.status.error');
      case 'syncing':
        return t('gmail.status.syncing');
    }
  };

  const getStatusColor = () => {
    switch (account.status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'syncing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const formatLastSync = () => {
    if (!account.lastSync) return null;

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - account.lastSync.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return t('gmail.lastSync.justNow');
    } else if (diffInMinutes < 60) {
      return t('gmail.lastSync.minutesAgo', { minutes: diffInMinutes });
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return t('gmail.lastSync.hoursAgo', { hours });
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return t('gmail.lastSync.daysAgo', { days });
    }
  };

  const getTooltipContent = () => {
    const email = account.email;
    const statusText = getStatusText();
    const lastSync = formatLastSync();

    return (
      <div className="space-y-1">
        <div className="font-medium">{email}</div>
        <div className="text-sm">{statusText}</div>
        {lastSync && (
          <div className="text-xs text-muted-foreground">
            {t('gmail.lastSync.label')}: {lastSync}
          </div>
        )}
        {account.unprocessedCount && account.unprocessedCount > 0 && (
          <div className="text-xs text-blue-300">
            {t('gmail.unprocessed', { count: account.unprocessedCount })}
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={onManage}
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {getStatusIcon()}
            <Badge variant="secondary" className={`text-xs ${getStatusColor()}`}>
              {getStatusText()}
            </Badge>
            {account.unprocessedCount && account.unprocessedCount > 0 && (
              <Badge variant="default" className="text-xs bg-blue-600 text-white">
                {account.unprocessedCount}
              </Badge>
            )}
            <span className="hidden lg:inline text-xs text-muted-foreground">
              {account.email.split('@')[0]}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
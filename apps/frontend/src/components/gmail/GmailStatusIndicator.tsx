import { Mail, CheckCircle, AlertCircle, Clock, Pause, Play, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import { GmailAccount } from '@/lib/api-client';

interface GmailAccountWithStatus extends GmailAccount {
  status: 'connected' | 'error' | 'syncing';
}

interface GmailStatusIndicatorProps {
  account?: GmailAccountWithStatus;
  onConnect: () => void;
  onManage?: () => void;
  onPause?: (accountId: string) => void;
  onResume?: (accountId: string) => void;
  onDisconnect?: (accountId: string) => void;
  language: 'english' | 'spanish';
}

export function GmailStatusIndicator({ account, onConnect, onManage, onPause, onResume, onDisconnect, language }: GmailStatusIndicatorProps) {
  const { t } = useTranslation(language);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);

  const handleToggle = () => {
    if (isExpanded) {
      // Start collapse animation
      setIsCollapsing(true);
      // Hide buttons after animation completes (150ms is the longest reverse animation)
      setTimeout(() => {
        setIsExpanded(false);
        setIsCollapsing(false);
      }, 150);
    } else {
      // Expand immediately
      setIsExpanded(true);
    }
  };

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


  // For connected state, show expandable action buttons
  return (
    <div className="relative flex items-center">
      {/* Action buttons - positioned absolutely behind the main button */}
      {(isExpanded || isCollapsing) && (
        <>
          {/* Conditional Pause/Resume button based on monitoring state */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (account?.monitoringActive) {
                onPause?.(account.id);
              } else {
                onResume?.(account?.id || '');
              }
              handleToggle();
            }}
            className={`absolute text-white border-white/20 hover:bg-white/10 w-9 h-9 p-0 flex items-center justify-center ${
              isCollapsing ? 'animate-slide-in-1' : 'animate-slide-out-1'
            }`}
          >
            {account?.monitoringActive ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          {/* Disconnect button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onDisconnect?.(account?.id || '');
              handleToggle();
            }}
            className={`absolute text-white border-white/20 hover:bg-white/10 w-9 h-9 p-0 flex items-center justify-center ${
              isCollapsing ? 'animate-slide-in-2' : 'animate-slide-out-2'
            }`}
          >
            <Unlink className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Main status button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        className="relative z-10 text-white border-white/20 hover:bg-white/10 w-9 h-9 p-0 flex items-center justify-center"
      >
        {getStatusIcon()}
      </Button>
    </div>
  );
}
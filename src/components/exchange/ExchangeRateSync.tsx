import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface ExchangeRateSyncProps {
  language: 'english' | 'spanish';
}

export function ExchangeRateSync({ language }: ExchangeRateSyncProps) {
  const [isForceSync, setIsForceSync] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation(language);

  const syncExchangeRate = async (showToast = false) => {
    try {
      setIsForceSync(true);
      
      // Fetch the current rate from the same API as toolbar
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      const dopRate = data.rates.DOP;
      
      console.log('🔄 Force syncing exchange rate:', dopRate);
      
      // Store both DOP and RD rates
      const { error: dopError } = await (supabase.rpc as any)('upsert_exchange_rate', {
        p_from_currency: 'USD',
        p_to_currency: 'DOP',
        p_rate: dopRate
      });
      
      const { error: rdError } = await (supabase.rpc as any)('upsert_exchange_rate', {
        p_from_currency: 'USD',
        p_to_currency: 'RD',
        p_rate: dopRate
      });
      
      if (dopError || rdError) {
        throw new Error(dopError?.message || rdError?.message);
      }
      
      // Force a budget recalculation by touching a transaction
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('type', 'expense')
        .not('category', 'is', null)
        .limit(1);
      
      if (transactions && transactions.length > 0) {
        await supabase
          .from('transactions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', transactions[0].id);
      }
      
      console.log('✅ Exchange rate synced and budgets recalculated');
      
      if (showToast) {
        toast({
          title: t('exchangeRateSynced'),
          description: `${t('updatedToCurrentRate')} ${dopRate.toFixed(2)}`,
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to sync exchange rate:', error);
      if (showToast) {
        toast({
          title: t('syncFailed'),
          description: t('failedToSyncExchangeRate'),
          variant: "destructive",
        });
      }
    } finally {
      setIsForceSync(false);
    }
  };

  // Auto-sync on component mount
  useEffect(() => {
    syncExchangeRate(false);
  }, []);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => syncExchangeRate(true)}
      disabled={isForceSync}
      className="text-white/80 hover:text-white hover:bg-white/10"
    >
      <RefreshCw className={`h-3 w-3 ${isForceSync ? 'animate-spin' : ''}`} />
    </Button>
  );
}
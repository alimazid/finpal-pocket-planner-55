import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { exchangeRateService } from '@/lib/exchangeRateService';

interface ExchangeRateData {
  rate: number;
  lastUpdated: string;
  change?: number;
}

const ExchangeRateWidget = () => {
  const { toast } = useToast();
  const [exchangeData, setExchangeData] = useState<ExchangeRateData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const fetchExchangeRate = async () => {
    setIsLoading(true);
    try {
      // Use shared exchange rate service to ensure consistency
      const dopRate = await exchangeRateService.getExchangeRate('USD', 'DOP');
      
      // Store this rate in the database so budget calculations can use the exact same rate
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        console.log('Storing exchange rate in database:', dopRate);
        
        // Use edge function to store rates consistently with budget calculations
        const { data: dopResult, error: dopError } = await supabase.functions.invoke('get-exchange-rate', {
          body: { 
            from: 'USD', 
            to: 'DOP',
            store_rate: true,
            rate: dopRate 
          }
        });
        
        if (dopError) {
          console.error('Failed to store DOP rate:', dopError);
        }
        
        // Also store RD rate (Dominican Peso alternative code)
        const { data: rdResult, error: rdError } = await supabase.functions.invoke('get-exchange-rate', {
          body: { 
            from: 'USD', 
            to: 'RD',
            store_rate: true,
            rate: dopRate 
          }
        });
        
        if (rdError) {
          console.error('Failed to store RD rate:', rdError);
        }
        
        if (!dopError && !rdError) {
          console.log('Exchange rates stored successfully');
        }
      } catch (dbError) {
        console.error('Failed to store exchange rate in database:', dbError);
        // Don't fail the UI update if database storage fails
      }
      
      const currentTime = new Date();
      setExchangeData({
        rate: dopRate,
        lastUpdated: currentTime.toISOString(),
      });
      setLastFetchTime(currentTime);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch exchange rate",
        variant: "destructive",
      });
      console.error('Exchange rate fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately on mount
    fetchExchangeRate();
    
    // Set up interval to fetch every 5 minutes
    const interval = setInterval(fetchExchangeRate, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatRate = (rate: number) => {
    return rate.toFixed(2);
  };

  const getTimeSinceUpdate = () => {
    if (!lastFetchTime) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastFetchTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'now';
    if (diffMinutes === 1) return '1m ago';
    return `${diffMinutes}m ago`;
  };

  if (!exchangeData) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-white border-white/20 bg-white/10">
          <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          USD/DOP
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className="text-white border-white/20 bg-white/10 hover:bg-white/20 cursor-pointer transition-colors"
        onClick={fetchExchangeRate}
      >
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium">USD/DOP</span>
          <span className="text-xs font-bold">{formatRate(exchangeData.rate)}</span>
          {isLoading && <RefreshCw className="w-3 h-3 animate-spin ml-1" />}
        </div>
      </Badge>
      
      {lastFetchTime && (
        <span className="text-xs text-white/60 hidden sm:inline">
          {getTimeSinceUpdate()}
        </span>
      )}
    </div>
  );
};

export default ExchangeRateWidget;
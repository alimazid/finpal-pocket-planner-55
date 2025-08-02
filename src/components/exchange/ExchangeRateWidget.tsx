import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
      // Using exchangerate-api.com (free tier allows 1500 requests/month)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate');
      }
      
      const data = await response.json();
      const dopRate = data.rates.DOP;
      
      if (dopRate) {
        const currentTime = new Date();
        setExchangeData({
          rate: dopRate,
          lastUpdated: currentTime.toISOString(),
        });
        setLastFetchTime(currentTime);
      } else {
        throw new Error('DOP rate not found');
      }
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
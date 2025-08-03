import { useState, useEffect } from "react";
import { Bitcoin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BitcoinPrice {
  price: number;
  change24h: number;
  changePercent24h: number;
}

const BitcoinPriceWidget = () => {
  const [btcData, setBtcData] = useState<BitcoinPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBitcoinPrice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch Bitcoin price');
      }
      
      const data = await response.json();
      
      if (data.bitcoin) {
        setBtcData({
          price: data.bitcoin.usd,
          change24h: data.bitcoin.usd_24h_change || 0,
          changePercent24h: data.bitcoin.usd_24h_change || 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBitcoinPrice();
    
    // Update every 30 seconds
    const interval = setInterval(fetchBitcoinPrice, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !btcData) {
    return (
      <div className="flex items-center gap-2 text-white/70">
        <Bitcoin className="h-4 w-4 animate-pulse" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-white/50">
        <Bitcoin className="h-4 w-4" />
        <span className="text-sm">Error</span>
      </div>
    );
  }

  if (!btcData) return null;

  const isPositive = btcData.changePercent24h >= 0;

  return (
    <div className="flex items-center gap-2 text-white">
      <Bitcoin className="h-4 w-4 text-orange-400" />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {formatCurrency(btcData.price, 'USD')}
          </span>
          <span 
            className={`text-xs ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}{btcData.changePercent24h.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default BitcoinPriceWidget;
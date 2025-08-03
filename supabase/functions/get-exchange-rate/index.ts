import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExchangeRateResponse {
  success: boolean;
  rate?: number;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fromCurrency, toCurrency } = await req.json();
    
    if (!fromCurrency || !toCurrency) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Both fromCurrency and toCurrency are required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If currencies are the same, return rate of 1
    if (fromCurrency === toCurrency) {
      return new Response(
        JSON.stringify({ success: true, rate: 1 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch exchange rate from external API - use same endpoint as frontend toolbar
    // Always fetch from USD base to ensure consistency with toolbar
    const baseResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
    
    if (!baseResponse.ok) {
      throw new Error(`Failed to fetch exchange rate: ${baseResponse.statusText}`);
    }
    
    const baseData = await baseResponse.json();
    let rate: number;
    
    if (fromCurrency === 'USD') {
      // Direct conversion from USD
      rate = baseData.rates[toCurrency];
      if (!rate) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }
    } else if (toCurrency === 'USD') {
      // Convert to USD (inverse of USD to fromCurrency)
      const usdToFromRate = baseData.rates[fromCurrency];
      if (!usdToFromRate) {
        throw new Error(`Exchange rate not found for USD to ${fromCurrency}`);
      }
      rate = 1 / usdToFromRate;
    } else {
      // Cross-currency conversion via USD
      const usdToFromRate = baseData.rates[fromCurrency];
      const usdToToRate = baseData.rates[toCurrency];
      
      if (!usdToFromRate || !usdToToRate) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }
      
      // Convert from -> USD -> to
      rate = usdToToRate / usdToFromRate;
    }

    console.log(`Exchange rate fetched: 1 ${fromCurrency} = ${rate} ${toCurrency} (via USD base)`);

    return new Response(
      JSON.stringify({ success: true, rate }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
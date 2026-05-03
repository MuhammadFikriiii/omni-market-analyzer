import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const type = searchParams.get('type') || 'stock'; // crypto, stock, forex, gold

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // Determine the correct Yahoo Finance symbol based on type
    let yfSymbol = symbol;
    if (type === 'crypto' && !symbol.includes('-')) {
       // Convert 'bitcoin' to 'BTC-USD', etc.
       const cryptoMap: any = {
         bitcoin: 'BTC-USD',
         ethereum: 'ETH-USD',
         solana: 'SOL-USD',
       };
       yfSymbol = cryptoMap[symbol] || `${symbol.toUpperCase()}-USD`;
    }

    let prices: any[] = [];
    let currentPrice = 0;

    try {
      const queryOptions = { 
        period1: '2023-01-01', 
        period2: new Date().toISOString().split('T')[0], 
        interval: '1d' as any 
      };
      // @ts-ignore
      const result: any[] = await yahooFinance.historical(yfSymbol, queryOptions);
      
      if (result && result.length > 0) {
        prices = result.map((r: any) => ({
          time: Math.floor(new Date(r.date).getTime() / 1000),
          value: r.close
        }));

        // @ts-ignore
        const quote: any = await yahooFinance.quote(yfSymbol);
        currentPrice = quote.regularMarketPrice || prices[prices.length - 1].value;
      } else {
        throw new Error('No historical data found');
      }
    } catch (e: any) {
      console.warn('Yahoo Finance API failed (possibly 429). Using mock data fallback:', e.message);
      
      // Fallback Mock Data Generator
      let basePrice = type === 'crypto' ? 60000 : type === 'stock' ? 150 : type === 'gold' ? 2000 : 15000;
      const now = new Date();
      for (let i = 365; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        // Random walk
        basePrice = basePrice * (1 + (Math.random() - 0.48) * 0.02);
        prices.push({
          time: Math.floor(d.getTime() / 1000),
          value: basePrice
        });
      }
      currentPrice = basePrice;
    }

    return NextResponse.json({ prices, currentPrice });
  } catch (error: any) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

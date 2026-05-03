import { NextResponse } from 'next/server';
import { SMA, EMA, RSI, MACD, BollingerBands, Stochastic, ATR } from 'technicalindicators';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prices, closePrices, highPrices, lowPrices } = body;

    if (!closePrices || closePrices.length === 0) {
      return NextResponse.json({ error: 'Missing price data' }, { status: 400 });
    }

    // Indicators calculations
    const sma20 = SMA.calculate({ period: 20, values: closePrices });
    const ema20 = EMA.calculate({ period: 20, values: closePrices });
    const rsi14 = RSI.calculate({ period: 14, values: closePrices });
    const macd = MACD.calculate({
      values: closePrices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    const bb = BollingerBands.calculate({ period: 20, stdDev: 2, values: closePrices });
    
    let stochastic: any[] = [];
    if (highPrices && lowPrices) {
      stochastic = Stochastic.calculate({
        high: highPrices,
        low: lowPrices,
        close: closePrices,
        period: 14,
        signalPeriod: 3
      });
    }

    return NextResponse.json({
      sma20,
      ema20,
      rsi14,
      macd,
      bb,
      stochastic
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

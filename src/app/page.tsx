'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useStore } from '@/store/useStore';
import { dict } from '@/lib/i18n';
import Chart from '@/components/Chart';
import SignalBadge from '@/components/SignalBadge';
import DCACalculator from '@/components/DCACalculator';
import MonteCarloChart from '@/components/MonteCarloChart';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const { language, setLanguage, asset, setAsset, assetType, setAssetType } = useStore();
  const currentDict = dict[language];

  // Map asset type to default symbols
  const defaultAssets = {
    crypto: ['bitcoin', 'ethereum', 'solana', 'dogecoin', 'ripple', 'cardano', 'polkadot'],
    stock: ['AAPL', 'TSLA', 'BBCA.JK', 'BMRI.JK', 'TLKM.JK', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META'],
    forex: ['IDR=X', 'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'SGDIDR=X'],
    gold: ['GC=F', 'SI=F', 'PA=F'] // Gold, Silver, Palladium Futures
  };

  const { data: priceData, isLoading: pricesLoading } = useSWR(
    `/api/prices?symbol=${asset}&type=${assetType}`,
    fetcher
  );

  const [indicators, setIndicators] = useState<any>(null);

  useEffect(() => {
    if (priceData?.prices?.length > 0) {
      const closePrices = priceData.prices.map((p: any) => p.value);
      
      fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closePrices })
      })
        .then(res => res.json())
        .then(data => setIndicators(data))
        .catch(err => console.error("Error calculating indicators", err));
    }
  }, [priceData]);

  const handleAssetTypeChange = (type: any) => {
    setAssetType(type);
    setAsset(defaultAssets[type as keyof typeof defaultAssets][0]);
  };

  const chartData = priceData?.prices || [];
  
  // Format indicators for lightweight-charts
  const formatIndicator = (data: number[], offset: number) => {
    if (!data || !chartData.length) return [];
    // Data is aligned to the end
    return chartData.slice(offset).map((p: any, i: number) => ({
      time: p.time,
      value: data[i]
    }));
  };

  const smaData = formatIndicator(indicators?.sma20, 20);
  const emaData = formatIndicator(indicators?.ema20, 20);
  
  // Get latest values for signals
  const currentPrice = priceData?.currentPrice || 0;
  const latestRSI = indicators?.rsi14?.[indicators.rsi14.length - 1] || 50;
  const latestMACD = indicators?.macd?.[indicators.macd.length - 1] || { MACD: 0, signal: 0, histogram: 0 };
  const latestEMA = indicators?.ema20?.[indicators.ema20.length - 1] || currentPrice;

  // Assuming historical return based on type
  let historicalReturn = 0.1; // 10% default
  let volatility = 0.2; // 20% default
  
  if (assetType === 'crypto') { historicalReturn = 0.4; volatility = 0.6; }
  else if (assetType === 'stock') { historicalReturn = 0.12; volatility = 0.25; }
  else if (assetType === 'gold') { historicalReturn = 0.05; volatility = 0.15; }

  return (
    <div className="min-h-screen bg-background text-white p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12">
        <div className="neo-box bg-primary p-4 inline-block transform -rotate-2">
          <h1 className="text-3xl md:text-5xl font-black text-white">{currentDict.title}</h1>
        </div>
        
        <div className="flex items-center gap-4 mt-6 md:mt-0">
          <button 
            className={`neo-button text-white ${language === 'id' ? 'bg-secondary' : 'bg-[#333]'}`}
            onClick={() => setLanguage('id')}
          >
            ID
          </button>
          <button 
            className={`neo-button text-white ${language === 'en' ? 'bg-secondary' : 'bg-[#333]'}`}
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="neo-box p-6 mb-8 text-center bg-box-bg">
          <p className="text-xl font-bold uppercase text-white">{currentDict.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Controls */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="neo-box p-6 bg-accent">
              <label className="block text-sm font-black mb-2 uppercase text-white drop-shadow-[1px_1px_0px_#000]">Kategori Aset</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(['crypto', 'stock', 'forex', 'gold'] as const).map(type => (
                  <button 
                    key={type}
                    className={`neo-button text-sm ${assetType === type ? 'bg-box-bg text-white' : 'bg-[#444] text-white'}`}
                    onClick={() => handleAssetTypeChange(type)}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-black mb-2 uppercase text-white mt-6 drop-shadow-[1px_1px_0px_#000]">{currentDict.asset}</label>
              <select 
                className="neo-box w-full p-2 font-bold bg-[#333] text-white border-white"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
              >
                {defaultAssets[assetType].map(sym => (
                  <option key={sym} value={sym} className="bg-[#333]">{sym.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <SignalBadge 
              rsi={latestRSI} 
              macd={latestMACD} 
              ema20={latestEMA} 
              currentPrice={currentPrice} 
              dict={currentDict} 
            />
          </div>

          {/* Chart */}
          <div className="lg:col-span-2 neo-box p-6 flex flex-col bg-box-bg">
            <div className="flex justify-between items-center border-b-4 border-dark pb-2 mb-4">
              <h2 className="text-2xl font-black uppercase text-white">{currentDict.chart} ({asset.toUpperCase()})</h2>
              <div className="text-2xl font-black bg-secondary px-4 py-1 border-2 border-dark shadow-[2px_2px_0px_0px_var(--color-dark)] text-white drop-shadow-[2px_2px_0px_#000]">
                ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
            
            {pricesLoading ? (
              <div className="flex-grow flex items-center justify-center min-h-[400px]">
                <div className="text-2xl font-bold animate-pulse text-white">LOADING...</div>
              </div>
            ) : (
              <>
                <Chart data={chartData} smaData={smaData} emaData={emaData} height={400} />
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="p-2 border-2 border-white bg-[#111] flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary"></div>
                      <span className="text-[10px] font-black text-primary uppercase">SMA 20</span>
                    </div>
                    <p className="text-[8px] text-white/70 leading-tight font-medium uppercase">Tren rata-rata 20 hari. Jika harga diatas garis ini, tren cenderung naik (Bullish).</p>
                  </div>
                  <div className="p-2 border-2 border-white bg-[#111] flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400"></div>
                      <span className="text-[10px] font-black text-yellow-400 uppercase">EMA 20</span>
                    </div>
                    <p className="text-[8px] text-white/70 leading-tight font-medium uppercase">Rata-rata eksponensial. Lebih cepat bereaksi terhadap perubahan harga mendadak.</p>
                  </div>
                  <div className="p-2 border-2 border-white bg-[#111] flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-white"></div>
                      <span className="text-[10px] font-black text-white uppercase">Harga (Putih)</span>
                    </div>
                    <p className="text-[8px] text-white/70 leading-tight font-medium uppercase">Harga penutupan pasar saat ini. Titik acuan utama semua indikator.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <DCACalculator 
          currentPrice={currentPrice}
          historicalAnnualReturn={historicalReturn}
          dict={currentDict}
        />

        {currentPrice > 0 && (
          <MonteCarloChart 
            currentPrice={currentPrice}
            historicalAnnualReturn={historicalReturn}
            historicalVolatility={volatility}
            historicalData={chartData}
            dict={currentDict}
          />
        )}

        {/* Methodology Info */}
        <div className="mt-12 neo-box p-6 bg-accent text-white">
          <h3 className="text-xl font-black uppercase border-b-4 border-white pb-2 mb-4 drop-shadow-[2px_2px_0px_#000]">Rumus & Analisa Profesional</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm font-bold">
            <div>
              <p className="uppercase drop-shadow-[1px_1px_0px_#000] text-primary">Monte Carlo Simulation</p>
              <p className="font-medium text-xs text-white opacity-90">Algoritma probabilistik yang mensimulasikan ribuan jalur harga masa depan. Digunakan oleh Hedge Funds untuk manajemen risiko.</p>
            </div>
            <div>
              <p className="uppercase drop-shadow-[1px_1px_0px_#000] text-secondary">Indikator Teknikal</p>
              <p className="font-medium text-xs text-white opacity-90">RSI & MACD digunakan untuk mencari titik balik harga (Reversal). Standar baku analis pasar modal dunia.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 mb-12 neo-box bg-primary p-6 text-white text-center">
          <p className="font-bold text-white">{currentDict.disclaimer}</p>
        </div>
      </main>
    </div>
  );
}

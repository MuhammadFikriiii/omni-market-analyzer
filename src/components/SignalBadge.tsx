'use client';

import { useState, useEffect } from 'react';

interface SignalBadgeProps {
  rsi: number;
  macd: { MACD: number; signal: number; histogram: number };
  ema20: number;
  currentPrice: number;
  dict: any;
}

export default function SignalBadge({ rsi, macd, ema20, currentPrice, dict }: SignalBadgeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="neo-box p-4 h-32 bg-box-bg animate-pulse" />;
  let signal = 'HOLD';
  let colorClass = 'bg-secondary text-white';
  let reasoning = 'Pasar sedang dalam kondisi stabil (Sideways). Indikator belum menunjukkan momentum yang kuat untuk aksi beli atau jual.';

  let buyPoints = 0;
  let sellPoints = 0;
  let reasons = [];

  // RSI rules
  if (rsi < 30) {
    buyPoints++;
    reasons.push("RSI menunjukkan kondisi Jenuh Jual (Oversold), harga berpotensi naik.");
  } else if (rsi > 70) {
    sellPoints++;
    reasons.push("RSI menunjukkan kondisi Jenuh Beli (Overbought), harga berpotensi koreksi turun.");
  }

  // MACD rules
  if (macd?.histogram > 0 && macd?.MACD > macd?.signal) {
    buyPoints++;
    reasons.push("MACD Golden Cross: Momentum tren naik sedang terbentuk.");
  } else if (macd?.histogram < 0 && macd?.MACD < macd?.signal) {
    sellPoints++;
    reasons.push("MACD Death Cross: Momentum tren turun sedang menguat.");
  }

  // EMA rules
  if (currentPrice > ema20) {
    buyPoints++;
    reasons.push("Harga berada di atas garis EMA 20, menunjukkan tren jangka pendek yang Bullish.");
  } else if (currentPrice < ema20) {
    sellPoints++;
    reasons.push("Harga berada di bawah garis EMA 20, menunjukkan tren jangka pendek yang Bearish.");
  }

  if (buyPoints > sellPoints && buyPoints >= 2) {
    signal = 'BUY';
    colorClass = 'bg-accent text-white';
    reasoning = reasons.filter(r => r.includes("naik") || r.includes("Beli") || r.includes("Bullish")).join(" ");
  } else if (sellPoints > buyPoints && sellPoints >= 2) {
    signal = 'SELL';
    colorClass = 'bg-primary text-white';
    reasoning = reasons.filter(r => r.includes("turun") || r.includes("Jual") || r.includes("Bearish")).join(" ");
  }

  const signalText = signal === 'BUY' ? dict.buy : signal === 'SELL' ? dict.sell : dict.hold;

  return (
    <div className={`neo-box p-4 flex flex-col items-center justify-center ${colorClass}`}>
      <span className="text-sm font-bold uppercase mb-1 drop-shadow-[1px_1px_0px_#000]">{dict.signals}</span>
      <span className="text-3xl font-black drop-shadow-[2px_2px_0px_#000] mb-2">{signalText}</span>
      
      <div className="bg-black/20 p-2 rounded text-[10px] font-bold text-center mb-4 leading-tight">
        {reasoning}
      </div>

      <div className="flex gap-4 text-[10px] font-black border-t-2 border-dark/30 pt-2 w-full justify-around text-white">
        <div className="drop-shadow-[1px_1px_0px_#000]">RSI: {rsi?.toFixed(2) || '-'}</div>
        <div className="drop-shadow-[1px_1px_0px_#000]">MACD: {macd?.MACD?.toFixed(2) || '-'}</div>
      </div>
    </div>
  );
}

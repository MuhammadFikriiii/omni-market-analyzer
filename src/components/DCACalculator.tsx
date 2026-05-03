'use client';

import { useStore } from '@/store/useStore';
import { useMemo, useState } from 'react';

interface DCACalculatorProps {
  currentPrice: number;
  historicalAnnualReturn: number; 
  dict: any;
}

export default function DCACalculator({ currentPrice, historicalAnnualReturn, dict }: DCACalculatorProps) {
  const { monthlyInvestment, investmentMonths, setMonthlyInvestment, setInvestmentMonths } = useStore();
  const [initialCapital, setInitialCapital] = useState<number>(0);
  const [targetMonth, setTargetMonth] = useState<number>(investmentMonths);

  const projection = useMemo(() => {
    const r = historicalAnnualReturn / 12; // monthly return rate
    const monthsToCalc = targetMonth || investmentMonths;
    
    // Future Value of Initial Capital: PV * (1 + r)^n
    const fvInitial = initialCapital * Math.pow(1 + r, monthsToCalc);
    
    // Future Value of Annuity (Monthly Investment): PMT * [((1 + r)^n - 1) / r]
    const fvMonthly = r > 0 
      ? monthlyInvestment * ((Math.pow(1 + r, monthsToCalc) - 1) / r)
      : monthlyInvestment * monthsToCalc;

    const totalInvested = initialCapital + (monthlyInvestment * monthsToCalc);
    const totalValue = fvInitial + fvMonthly;

    return {
      futureValue: totalValue,
      totalInvested
    };
  }, [initialCapital, monthlyInvestment, investmentMonths, historicalAnnualReturn, targetMonth]);

  return (
    <div className="neo-box p-6 bg-box-bg mb-8">
      <h3 className="text-xl font-black border-b-4 border-dark pb-2 mb-4 uppercase text-white">{dict.dcaProjection}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="neo-box p-4 bg-box-bg border-accent">
          <label className="block text-sm font-bold mb-2 uppercase text-white">Modal Awal (Rp)</label>
          <input 
            type="number" 
            className="w-full p-2 border-2 border-dark font-bold bg-[#333] text-white"
            value={initialCapital}
            onChange={(e) => setInitialCapital(Number(e.target.value))}
          />
        </div>
        <div className="neo-box p-4 bg-box-bg border-secondary">
          <label className="block text-sm font-bold mb-2 uppercase text-white">Investasi Rutin / Bulan</label>
          <input 
            type="number" 
            className="w-full p-2 border-2 border-dark font-bold bg-[#333] text-white"
            value={monthlyInvestment}
            onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
          />
        </div>
        <div className="neo-box p-4 bg-box-bg border-white">
          <label className="block text-sm font-bold mb-2 uppercase text-white">Lama Investasi (Bulan)</label>
          <input 
            type="number" 
            className="w-full p-2 border-2 border-dark font-bold bg-[#333] text-white"
            value={investmentMonths}
            onChange={(e) => setInvestmentMonths(Number(e.target.value))}
          />
        </div>
        <div className="neo-box p-4 bg-box-bg border-primary">
          <label className="block text-sm font-bold mb-2 uppercase text-white">Lihat Hasil Di Bulan Ke-</label>
          <input 
            type="number" 
            className="w-full p-2 border-2 border-dark font-bold bg-[#333] text-white"
            value={targetMonth}
            onChange={(e) => setTargetMonth(Number(e.target.value))}
            max={investmentMonths}
          />
        </div>
      </div>

      <div className="bg-accent neo-box p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
          <div>
            <div className="text-sm font-bold uppercase text-white drop-shadow-[1px_1px_0px_#000]">Total Modal Yang Dikeluarkan</div>
            <div className="text-2xl md:text-4xl font-black mt-1 text-white drop-shadow-[2px_2px_0px_#000]">
              Rp {projection.totalInvested.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm font-bold uppercase text-white drop-shadow-[1px_1px_0px_#000]">Estimasi Nilai Aset (Bulan {targetMonth})</div>
            <div className="text-3xl md:text-5xl font-black text-white mt-1 drop-shadow-[2px_2px_0px_#000]">
              Rp {projection.futureValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 neo-box bg-[#222] text-white text-xs font-medium">
        <h4 className="font-bold uppercase mb-2 text-primary">Metodologi & Rumus</h4>
        <p className="mb-2"><strong>Compound Interest Formula:</strong> Nilai masa depan dihitung menggunakan rumus bunga majemuk bulanan. <em>FV = P(1+r)^n + PMT[((1+r)^n - 1) / r]</em>.</p>
        <p><strong>Digunakan oleh:</strong> Perencana Keuangan (CFP), Manajer Investasi, dan Institusi Perbankan untuk menghitung target pensiun atau dana pendidikan.</p>
      </div>
    </div>
  );
}

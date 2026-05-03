'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { createChart, ColorType, IChartApi, LineSeries, MouseEventParams } from 'lightweight-charts';
import { useStore } from '@/store/useStore';

interface MonteCarloChartProps {
  currentPrice: number;
  historicalAnnualReturn: number;
  historicalVolatility: number;
  historicalData: any[];
  dict: any;
}

const mulberry32 = (a: number) => {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const variationNarratives: Record<number, { title: string, desc: string }> = {
  1: { title: "Pertumbuhan Stabil", desc: "Kondisi ekonomi makro yang sehat dengan inflasi terkendali dan pertumbuhan organik." },
  2: { title: "Pemulihan Volatil", desc: "Pasar mencoba bangkit dari krisis dengan fluktuasi tinggi dan sentimen yang berubah-ubah." },
  3: { title: "Siklus Bullish Kuat", desc: "Dominasi pembeli yang agresif didorong oleh inovasi teknologi atau kebijakan fiskal longgar." },
  4: { title: "Tekanan Suku Bunga", desc: "Pasar cenderung tertekan akibat kebijakan pengetatan moneter bank sentral (Hawkish)." },
  5: { title: "Stagnasi Ekonomi", desc: "Harga bergerak mendatar (sideways) dalam waktu lama karena kurangnya katalis pasar." },
  6: { title: "Shock Geopolitik", desc: "Terjadi fluktuasi tajam dan mendadak akibat ketegangan politik atau konflik global." },
  7: { title: "Adopsi Institusional", desc: "Lonjakan harga signifikan akibat masuknya aliran dana besar dari investor institusi." },
  8: { title: "Krisis Likuiditas", desc: "Penurunan bertahap akibat kurangnya perputaran dana dan kepercayaan di pasar modal." },
  9: { title: "Era Industri Baru", desc: "Pertumbuhan eksponensial jangka panjang akibat pergeseran fundamental cara dunia bekerja." },
  10: { title: "Hiperinflasi / Devaluasi", desc: "Kenaikan harga aset drastis akibat penurunan nilai mata uang secara sistemik." }
};

export default function MonteCarloChart({
  currentPrice,
  historicalAnnualReturn,
  historicalVolatility,
  historicalData,
  dict
}: MonteCarloChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { asset, assetType } = useStore();

  const [projYears, setProjYears] = useState<number>(1);
  const [projMonths, setProjMonths] = useState<number>(0);
  const [projDays, setProjDays] = useState<number>(0);
  const [variation, setVariation] = useState<number>(1);

  const USD_IDR = 16200;

  const unitLabel = useMemo(() => {
    if (assetType === 'gold') return 'Harga per Ounce (31.1g)';
    if (assetType === 'crypto') return 'Harga per Koin';
    if (assetType === 'forex') return 'Harga per Unit';
    return 'Harga per Lembar Saham';
  }, [assetType]);

  const totalDays = useMemo(() => {
    return (projYears * 365) + (projMonths * 30) + projDays;
  }, [projYears, projMonths, projDays]);

  const displayTime = useMemo(() => {
    let parts = [];
    if (projYears > 0) parts.push(`${projYears} Thn`);
    if (projMonths > 0) parts.push(`${projMonths} Bln`);
    if (projDays > 0) parts.push(`${projDays} Hari`);
    return parts.length > 0 ? parts.join(' ') : '0 Hari';
  }, [projYears, projMonths, projDays]);

  const contextData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];
    return historicalData.slice(-15);
  }, [historicalData]);

  const simulations = useMemo(() => {
    if (totalDays <= 0) return [];

    const numSimulations = 5;
    const paths = [];
    const mu = historicalAnnualReturn;
    const sigma = historicalVolatility;
    const now = contextData.length > 0 ? contextData[contextData.length - 1].time : Math.floor(Date.now() / 1000);

    const rand = mulberry32(variation * 12345);

    for (let i = 0; i < numSimulations; i++) {
      let path = [...contextData];
      let currentS = currentPrice;

      const steps = totalDays > 365 ? Math.ceil(totalDays / 7) : totalDays;
      const dt = (totalDays / steps) / 365;

      for (let j = 1; j <= steps; j++) {
        const u1 = rand();
        const u2 = rand();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        const drift = (mu - (Math.pow(sigma, 2) / 2)) * dt;
        const diffusion = sigma * z * Math.sqrt(dt);
        currentS = currentS * Math.exp(drift + diffusion);

        const date = new Date(now * 1000);
        date.setDate(date.getDate() + (j * (totalDays / steps)));

        path.push({
          time: Math.floor(date.getTime() / 1000),
          value: currentS
        });
      }
      paths.push(path);
    }
    return paths;
  }, [currentPrice, historicalAnnualReturn, historicalVolatility, totalDays, contextData, variation]);

  const summary = useMemo(() => {
    if (!simulations.length) return null;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + totalDays);

    const endValues = simulations.map(p => p[p.length - 1].value);
    const sorted = [...endValues].sort((a, b) => b - a);

    return {
      scenarios: sorted,
      roi: (((sorted.reduce((a, b) => a + b, 0) / 5) - currentPrice) / currentPrice) * 100,
      targetLabel: targetDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    };
  }, [simulations, currentPrice, totalDays]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#ffffff' },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: { vertLines: { color: '#333333', style: 2 }, horzLines: { color: '#333333', style: 2 } },
      timeScale: { borderColor: '#ffffff', timeVisible: true },
      rightPriceScale: { borderColor: '#ffffff', autoScale: true },
      localization: {
        priceFormatter: (price: number) => `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      },
    });

    chartRef.current = chart;
    const colors = ['#4ade80', '#00d2ff', '#fce205', '#ff00ff', '#ff4949'];
    const sortedSims = [...simulations].sort((a, b) => b[b.length - 1].value - a[a.length - 1].value);
    const seriesList: any[] = [];

    sortedSims.forEach((path, i) => {
      const series = chart.addSeries(LineSeries, {
        color: colors[i],
        lineWidth: 2 as any,
      });
      series.setData(path as any);
      seriesList.push(series);
    });

    // Floating Tooltip Logic
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (!tooltipRef.current || !chartContainerRef.current) return;

      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current.clientWidth ||
        param.point.y < 0 ||
        param.point.y > 400
      ) {
        tooltipRef.current.style.display = 'none';
      } else {
        tooltipRef.current.style.display = 'block';
        // Get value from Moderat series (middle one) as reference
        const dataPoint = param.seriesData.get(seriesList[2]);
        if (dataPoint) {
          const val = (dataPoint as any).value;
          const usd = val.toLocaleString(undefined, { maximumFractionDigits: 2 });
          const idr = (val * 16200).toLocaleString('id-ID', { maximumFractionDigits: 0 });
          
          tooltipRef.current.innerHTML = `
            <div class="font-black text-[9px] uppercase text-primary">Simulasi ${asset.toUpperCase()}</div>
            <div class="text-white text-lg font-black">$${usd}</div>
            <div class="text-white/70 text-[10px] font-bold">Rp ${idr}</div>
            <div class="text-[8px] text-accent uppercase font-bold mt-1">${unitLabel}</div>
          `;

          let left = param.point.x + 15;
          if (left > chartContainerRef.current.clientWidth - 150) {
            left = param.point.x - 165;
          }

          let top = param.point.y + 15;
          if (top > 400 - 100) {
            top = param.point.y - 115;
          }

          tooltipRef.current.style.left = left + 'px';
          tooltipRef.current.style.top = top + 'px';
        }
      }
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [simulations, asset, unitLabel]);

  const formatCurrency = (val: number) => ({
    usd: val.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    idr: (val * USD_IDR).toLocaleString('id-ID', { maximumFractionDigits: 0 })
  });

  return (
    <div className="neo-box p-6 mt-8 bg-box-bg">
      <div className="flex flex-col md:flex-row justify-between items-center border-b-4 border-dark pb-4 mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase text-white drop-shadow-[2px_2px_0px_#000]">
            History & Proyeksi Masa Depan
          </h3>
          <p className="text-sm font-bold text-primary uppercase">Asset: {asset.toUpperCase()} | {displayTime}</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex flex-col items-center gap-1 bg-accent p-2 border-2 border-black text-black">
            <span className="text-[10px] font-black uppercase">Varian Masa Depan:</span>
            <select
              className="bg-white p-1 font-bold text-xs border-2 border-black"
              value={variation}
              onChange={(e) => setVariation(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                <option key={v} value={v}>Skenario #{v}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-[#222] p-2 border-2 border-white">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-white uppercase mb-1">Thn</span>
              <input type="number" min="0" className="w-10 bg-white text-black p-1 font-bold text-[10px]" value={projYears} onChange={(e) => setProjYears(Number(e.target.value))} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-white uppercase mb-1">Bln</span>
              <input type="number" min="0" max="11" className="w-10 bg-white text-black p-1 font-bold text-[10px]" value={projMonths} onChange={(e) => setProjMonths(Number(e.target.value))} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-white uppercase mb-1">Hari</span>
              <input type="number" min="0" max="30" className="w-10 bg-white text-black p-1 font-bold text-[10px]" value={projDays} onChange={(e) => setProjDays(Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-primary text-white neo-box border-white border-2">
        <h4 className="text-sm font-black uppercase mb-1 flex items-center gap-2">
          <span className="bg-white text-primary px-2">#{variation}</span>
          {variationNarratives[variation].title}
        </h4>
        <p className="text-xs font-bold opacity-90">{variationNarratives[variation].desc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
        <div className="lg:col-span-3 relative">
          <div ref={chartContainerRef} className="w-full neo-box border-4 border-dark shadow-none bg-[#0a0a0a]" />
          
          {/* Floating Tooltip Div */}
          <div 
            ref={tooltipRef} 
            className="absolute hidden z-50 p-2 bg-black/90 border-2 border-white neo-box pointer-events-none shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
            style={{ minWidth: '150px' }}
          />

          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2">
            {[
              { color: '#4ade80', title: 'SANGAT OPTIMIS', desc: 'Jalur harga jika pasar mengalami pertumbuhan luar biasa.' },
              { color: '#00d2ff', title: 'OPTIMIS', desc: 'Jalur harga jika performa pasar di atas ekspektasi.' },
              { color: '#fce205', title: 'MODERAT', desc: 'Jalur harga yang mengikuti rata-rata pertumbuhan historis.' },
              { color: '#ff00ff', title: 'KONSERVATIF', desc: 'Jalur harga jika terjadi perlambatan ekonomi ringan.' },
              { color: '#ff4949', title: 'SANGAT PESIMIS', desc: 'Jalur harga jika terjadi krisis atau koreksi tajam.' }
            ].map((item, idx) => (
              <div key={idx} className="p-2 border-2 border-white bg-[#111] flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[9px] font-black uppercase" style={{ color: item.color }}>{item.title}</span>
                </div>
                <p className="text-[8px] text-white/70 leading-tight font-medium uppercase">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="neo-box p-4 bg-box-bg border-white border-2 text-white h-full overflow-y-auto">
            <h4 className="text-[10px] font-black uppercase border-b-2 border-white mb-3">Estimasi {summary?.targetLabel}</h4>
            <div className="space-y-4">
              {[
                { label: 'Sangat Optimis', color: '#4ade80', val: summary?.scenarios[0] },
                { label: 'Optimis', color: '#00d2ff', val: summary?.scenarios[1] },
                { label: 'Moderat', color: '#fce205', val: summary?.scenarios[2] },
                { label: 'Konservatif', color: '#ff00ff', val: summary?.scenarios[3] },
                { label: 'Sangat Pesimis', color: '#ff4949', val: summary?.scenarios[4] }
              ].map((s, i) => (
                <div key={i} className={i > 0 ? "border-t border-white/10 pt-2" : ""}>
                  <p className="text-[8px] uppercase font-black" style={{ color: s.color }}>{s.label}</p>
                  <p className="text-base font-black leading-tight" style={{ color: s.color }}>${s.val && formatCurrency(s.val).usd}</p>
                  <p className="text-[9px] font-bold" style={{ color: s.color }}>Rp {s.val && formatCurrency(s.val).idr}</p>
                </div>
              ))}

              <div className="pt-3 border-t-4 border-white text-center">
                <p className="text-[10px] uppercase font-black">ROI Rata-Rata Simulasi</p>
                <p className={`text-2xl font-black ${summary && summary.roi > 0 ? 'text-[#4ade80]' : 'text-[#ff4949]'}`}>
                  {summary?.roi.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

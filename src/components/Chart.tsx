'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, LineSeries, MouseEventParams } from 'lightweight-charts';

interface ChartProps {
  data: { time: number; value: number; open?: number; high?: number; low?: number; close?: number }[];
  smaData?: { time: number; value: number }[];
  emaData?: { time: number; value: number }[];
  height?: number;
}

export default function Chart({ data, smaData, emaData, height = 400 }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#f4f4f5',
      },
      width: chartContainerRef.current.clientWidth,
      height,
      grid: {
        vertLines: { color: '#333333' },
        horzLines: { color: '#333333' },
      },
      rightPriceScale: {
        borderColor: '#f4f4f5',
      },
      timeScale: {
        borderColor: '#f4f4f5',
        timeVisible: true,
      },
      localization: {
        priceFormatter: (price: number) => `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      },
    });

    chartRef.current = chart;

    const hasCandle = data.length > 0 && data[0].open !== undefined;
    let mainSeries: any;

    if (hasCandle) {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#4ade80',
        downColor: '#ff4949',
        borderVisible: false,
        wickUpColor: '#4ade80',
        wickDownColor: '#ff4949',
      });
      mainSeries.setData(data as any);
    } else {
      mainSeries = chart.addSeries(LineSeries, {
        color: '#f4f4f5',
        lineWidth: 2,
      });
      mainSeries.setData(data as any);
    }

    if (smaData && smaData.length > 0) {
      const smaSeries = chart.addSeries(LineSeries, {
        color: '#ff4949',
        lineWidth: 2,
        title: 'SMA 20',
      });
      smaSeries.setData(smaData as any);
    }

    if (emaData && emaData.length > 0) {
      const emaSeries = chart.addSeries(LineSeries, {
        color: '#fce205',
        lineWidth: 2,
        title: 'EMA 20',
      });
      emaSeries.setData(emaData as any);
    }

    // Floating Tooltip Logic
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (!tooltipRef.current || !chartContainerRef.current) return;

      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current.clientWidth ||
        param.point.y < 0 ||
        param.point.y > height
      ) {
        tooltipRef.current.style.display = 'none';
      } else {
        tooltipRef.current.style.display = 'block';
        const dataPoint = param.seriesData.get(mainSeries);
        if (dataPoint) {
          const val = (dataPoint as any).value !== undefined ? (dataPoint as any).value : (dataPoint as any).close;
          const usd = val.toLocaleString(undefined, { maximumFractionDigits: 2 });
          const idr = (val * 16200).toLocaleString('id-ID', { maximumFractionDigits: 0 });
          
          tooltipRef.current.innerHTML = `
            <div class="font-black text-[9px] uppercase text-accent">Harga Historis</div>
            <div class="text-white text-lg font-black">$${usd}</div>
            <div class="text-white/70 text-[10px] font-bold">Rp ${idr}</div>
          `;

          let left = param.point.x + 15;
          if (left > chartContainerRef.current.clientWidth - 150) {
            left = param.point.x - 165;
          }

          let top = param.point.y + 15;
          if (top > height - 80) {
            top = param.point.y - 95;
          }

          tooltipRef.current.style.left = left + 'px';
          tooltipRef.current.style.top = top + 'px';
        }
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, smaData, emaData, height]);

  return (
    <div className="relative w-full">
      <div ref={chartContainerRef} className="w-full neo-box rounded-none bg-[#0a0a0a]" />
      <div 
        ref={tooltipRef} 
        className="absolute hidden z-50 p-2 bg-black/90 border-2 border-white neo-box pointer-events-none shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
        style={{ minWidth: '140px' }}
      />
    </div>
  );
}

import { create } from 'zustand';

interface AppState {
  language: 'id' | 'en';
  setLanguage: (lang: 'id' | 'en') => void;
  asset: string;
  setAsset: (asset: string) => void;
  assetType: 'stock' | 'crypto' | 'forex' | 'gold';
  setAssetType: (type: 'stock' | 'crypto' | 'forex' | 'gold') => void;
  monthlyInvestment: number;
  setMonthlyInvestment: (amount: number) => void;
  investmentMonths: number;
  setInvestmentMonths: (months: number) => void;
}

export const useStore = create<AppState>((set) => ({
  language: 'id',
  setLanguage: (lang) => set({ language: lang }),
  asset: 'bitcoin',
  setAsset: (asset) => set({ asset }),
  assetType: 'crypto',
  setAssetType: (type) => set({ assetType: type }),
  monthlyInvestment: 1000000,
  setMonthlyInvestment: (amount) => set({ monthlyInvestment: amount }),
  investmentMonths: 120, // 10 years
  setInvestmentMonths: (months) => set({ investmentMonths: months }),
}));

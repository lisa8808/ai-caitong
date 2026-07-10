import { StockDetailBundle, StockKlinePoint } from '../types/stockDetail';

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
}

function generateFallbackKline(): StockKlinePoint[] {
  const base = 210;
  return Array.from({ length: 120 }, (_, index) => {
    const move = Math.sin(index / 7) * 8 + index * 0.12;
    const close = base + move;
    const open = close + Math.sin(index / 3) * 2;
    return {
      date: `D${index + 1}`,
      open,
      high: Math.max(open, close) + 2.6,
      low: Math.min(open, close) - 2.2,
      close,
      volume: 600000 + Math.abs(Math.sin(index / 5)) * 480000,
      amount: close * 600000,
    };
  });
}

const fallbackBundle: StockDetailBundle = {
  profile: {
    code: '300750',
    name: '宁德时代',
    price: 210.5,
    change: -1.8,
    pctChange: -0.85,
    tags: ['融通', '创业板'],
    open: 212.2,
    high: 213.2,
    low: 208.8,
    avg: 210.7,
    upLimit: 231.55,
    downLimit: 189.45,
    volumeRatio: 1.08,
    pe: 18.6,
    amount: 68.2,
    totalMv: 9250,
    circMv: 7800,
    totalShare: 44.1,
    floatShare: 37.0,
    quarterlyProfit: [
      { date: '2025Q1', value: 98 },
      { date: '2025Q2', value: 112 },
      { date: '2025Q3', value: 104 },
      { date: '2025Q4', value: 129 },
      { date: '2026Q1', value: 138 },
      { date: '2026Q2', value: 145 },
    ],
  },
  kline: generateFallbackKline(),
  finance: { revenue: 4009.2, netProfit: 441.2, nonRecurring: 12.5, cashYoY: 18.6, peTtm: 18.6, pb: 4.2, peg: 1.1, grossMargin: 22.9, netMargin: 11.0, roe: 19.8, debtRatio: 68.2 },
  company: {},
  riskPrice: { cageUpper: 214.71, cageLower: 206.29, auctionUpper: 231.55, auctionLower: 189.45 },
  shareholder: { holderCount: 284000, holderChange: -3.2, fundHolding: 12.8, institutionHolding: 18.6, institutionRatio: 42.1 },
  margin: [{ date: '2026-07-01', label: '融资余额', value: '92.4亿', extra: '融券余量 182万股' }],
  dividend: [{ date: '2026-05-20', label: '年度分红', value: '10派25.2元', extra: '已实施' }],
  blockTrade: [{ date: '2026-06-18', label: '大宗交易', value: '2.1亿', extra: '折价 1.8%' }],
  capitalFlow: [
    { name: '主力流入', value: 30, color: '#ff4444' },
    { name: '主力流出', value: 22, color: '#22bb66' },
    { name: '散户流入', value: 26, color: '#8b1f1f' },
    { name: '散户流出', value: 22, color: '#0f6b3f' },
  ],
  news: [
    { datetime: '2026-07-02', title: '宁德时代相关公告及资讯待同步', source: 'Tushare' },
  ],
};

export async function loadStockDetailBundle(code: string, period = '日'): Promise<StockDetailBundle> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return fallbackBundle;
  try {
    const response = await fetch(`${apiBaseUrl}/api/stocks/${encodeURIComponent(code)}/full-detail?period=${encodeURIComponent(period)}`);
    if (!response.ok) throw new Error(`stock detail request failed: ${response.status}`);
    const payload = await response.json() as { data?: StockDetailBundle };
    return payload.data || fallbackBundle;
  } catch {
    return fallbackBundle;
  }
}

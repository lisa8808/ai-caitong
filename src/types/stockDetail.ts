export interface StockKlinePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  ma60?: number;
  volMa5?: number;
  volMa10?: number;
  dif?: number;
  dea?: number;
  macd?: number;
}

export interface StockProfile {
  code: string;
  name: string;
  price: number;
  change: number;
  pctChange: number;
  tags: string[];
  open: number;
  high: number;
  low: number;
  avg: number;
  upLimit: number;
  downLimit: number;
  volumeRatio: number;
  pe: number;
  amount: number;
  totalMv: number;
  circMv: number;
  totalShare: number;
  floatShare: number;
  quarterlyProfit: Array<{ date: string; value: number }>;
}

export interface StockFinance {
  revenue: number;
  netProfit: number;
  nonRecurring: number;
  cashYoY: number;
  peTtm: number;
  pb: number;
  peg: number;
  grossMargin: number;
  netMargin: number;
  roe: number;
  debtRatio: number;
}

export interface StockCompanyProfile {
  chairman?: string;
  manager?: string;
  secretary?: string;
  regCapital?: number;
  setupDate?: string;
  province?: string;
  city?: string;
  introduction?: string;
  website?: string;
  email?: string;
  office?: string;
  employees?: number;
  mainBusiness?: string;
  businessScope?: string;
}

export interface StockRiskPrice {
  cageUpper: number;
  cageLower: number;
  auctionUpper: number;
  auctionLower: number;
}

export interface StockShareholder {
  holderCount: number;
  holderChange: number;
  fundHolding: number;
  institutionHolding: number;
  institutionRatio: number;
}

export interface StockTableRecord {
  date: string;
  label: string;
  value: string;
  extra?: string;
}

export interface StockCapitalFlowItem {
  name: string;
  value: number;
  color: string;
}

export interface StockNewsItem {
  datetime: string;
  title: string;
  source: string;
  url?: string;
}

export interface StockDetailBundle {
  profile: StockProfile;
  kline: StockKlinePoint[];
  finance: StockFinance;
  company: StockCompanyProfile;
  riskPrice: StockRiskPrice;
  shareholder: StockShareholder;
  margin: StockTableRecord[];
  dividend: StockTableRecord[];
  blockTrade: StockTableRecord[];
  capitalFlow: StockCapitalFlowItem[];
  news: StockNewsItem[];
}

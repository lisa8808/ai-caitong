export interface YesterdayStockItem {
  name: string;
  code: string;
  pnl: number;
  pct: number;
}

export interface BillRecord {
  time: string;
  name: string;
  price: string;
  amount: string;
  qty: string;
  fee: string;
  dir: string;
}

export interface Account {
  id: string;
  platform: string;
  accountId: string;
  label: string;
  totalAssets: number;
  totalProfit: number;
  totalProfitPct: number;
  cash: number;
  stockValue: number;
  financeValue: number;
  yesterdayProfit: number;
  yesterdayProfitPct: number;
  yesterdayStocks: YesterdayStockItem[];
  billSummary: {
    交易次数: string;
    交易标的数: string;
    清仓次数: string;
    交易费用: string;
    转入金额: string;
    转出金额: string;
  };
  billRecords: BillRecord[];
}

# Data Contract

## SkillRunRequest

```ts
interface ReviewSummarySkillRequest {
  skill: "review_summary";
  triggerSource:
    | "instant_analysis_review_modal"
    | "home_review_card"
    | "stock_detail"
    | "industry_page"
    | "paper_trading"
    | "manual_input";
  reviewType: "板块热点" | "市场复盘" | "个股复盘" | "操作复盘";
  userInput?: string;
  context?: ReviewContext;
}
```

## ReviewContext

```ts
interface ReviewContext {
  market?: {
    indexes?: Array<{ name: string; close?: number; pct_chg?: number }>;
    breadth?: { up_count?: number; down_count?: number; limit_up_count?: number; limit_down_count?: number };
    turnover_amount?: number;
    northbound_net_inflow?: number;
  };
  sectors?: Array<{ name: string; pct_chg?: number; amount?: number; leaders?: string[]; driver?: string }>;
  stocks?: Array<{ ts_code: string; name: string; close?: number; pct_chg?: number; reason?: string; risk?: string }>;
  operations?: {
    trades?: unknown[];
    pnl?: number;
    win_rate?: number;
    max_drawdown?: number;
  };
  dataStatus?: { marketSynced?: boolean; tradingDataAvailable?: boolean };
}
```

`operations` only accepts paper-trading state, user operation records, or real trading-account context. It must not contain backtest trades, mining strategy trades, backtest equity curves, or strategy performance metrics.

## Excluded Sources

The following sources must not be part of `ReviewContext` and must be ignored if accidentally supplied:

| Source | Examples | Reason |
| --- | --- | --- |
| Mining results | `backend/mining_results/`, `/api/mining/*` historical strategy results | Mining output is strategy research data, not market review or operation review evidence. |
| Backtest results | `backend/backtest_results/`, `/api/mining/backtest`, `/api/strategy/backtest*` | Backtest metrics, trades, and equity curves must not be treated as real/paper operation records. |

## Response

```ts
interface ReviewSummarySkillResponse {
  success: boolean;
  content: string;
  reportKind: "pdf";
}
```

# Data Contract

## SkillRunRequest

```ts
interface RiskControlSkillRequest {
  skill: "risk_control";
  triggerSource:
    | "instant_analysis_quick_action"
    | "instant_analysis_input"
    | "home_risk_card"
    | "stock_detail"
    | "portfolio_page"
    | "daily_report";
  scopeType: "portfolio" | "watchlist" | "stock" | "global_market";
  scopeValue?: string;
  userInput?: string;
  context?: RiskControlContext;
}
```

## RiskControlContext

```ts
interface RiskControlContext {
  holdings?: Holding[];
  watchlist?: string[];
  riskSignals?: RiskSignal[];
  abnormalConclusionRef?: string;
  trendConclusionRef?: string;
  dataStatus?: {
    marketSynced?: boolean;
    holdingsSynced?: boolean;
    sentimentAlertsSynced?: boolean;
  };
}
```

## Holding

```ts
interface Holding {
  ts_code: string;
  name: string;
  positionStatus: "持仓" | "自选" | "关注";
  close?: number;
  pct_chg?: number;
  drawdown?: number;
  main_net_outflow_days?: number;
  volume_ratio?: number;
}
```

## RiskSignal

```ts
interface RiskSignal {
  ts_code?: string;
  type: "资金" | "公告" | "政策" | "趋势" | "情绪";
  detail: string;
  confidence: number;
  source: string;
  persistent?: boolean;
  impactDays?: string;
}
```

## Excluded Sources

The following sources must not be part of `RiskControlContext` and must be ignored if accidentally supplied:

| Source | Examples | Reason |
| --- | --- | --- |
| Mining results | `backend/mining_results/`, `/api/mining/*` historical strategy results | Strategy-search output is not a current holding risk signal. |
| Backtest results | `backend/backtest_results/`, `/api/mining/backtest`, `/api/strategy/backtest*` | Backtest metrics, trades, and equity curves must not affect risk level, operation advice, or portfolio safety. |

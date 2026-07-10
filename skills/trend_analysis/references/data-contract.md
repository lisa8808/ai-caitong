# Data Contract

## SkillRunRequest

```ts
interface TrendAnalysisSkillRequest {
  skill: "trend_analysis";
  triggerSource:
    | "instant_analysis_quick_action"
    | "instant_analysis_input"
    | "home_market_card"
    | "stock_detail"
    | "industry_page"
    | "portfolio_alert"
    | "watchlist_alert";
  scopeType: "global_market" | "stock" | "industry" | "concept" | "portfolio" | "watchlist";
  scopeValue?: string;
  userInput?: string;
  context?: TrendAnalysisContext;
}
```

## TrendAnalysisContext

```ts
interface TrendAnalysisContext {
  trendRows?: TrendRow[];
  industryChainClues?: IndustryChainClue[];
  fundamentals?: FundamentalClue[];
  supplyDemand?: SupplyDemandClue[];
  userPreferences?: {
    holdings?: string[];
    watchlist?: string[];
    historicalQueries?: string[];
  };
  dataStatus?: {
    marketSynced?: boolean;
    fundamentalsSynced?: boolean;
    industryGraphSynced?: boolean;
  };
}
```

## TrendRow

```ts
interface TrendRow {
  ts_code: string;
  name: string;
  industry?: string;
  trend_type?: "持续上涨" | "持续下跌" | "震荡走强" | "连板趋势";
  trend_period?: "2日" | "3日" | "一周及以上";
  interval_pct_chg?: number;
  limit_up_days?: number;
  slope?: number;
  fund_flow_days?: number;
  trend_stage?: "启动" | "发酵" | "高潮" | "尾声";
}
```

## Excluded Sources

The following sources must not be part of `TrendAnalysisContext` and must be ignored if accidentally supplied:

| Source | Examples | Reason |
| --- | --- | --- |
| Mining results | `backend/mining_results/`, `/api/mining/*` historical strategy results | Strategy-search output is not a trend root cause or sustainability signal. |
| Backtest results | `backend/backtest_results/`, `/api/mining/backtest`, `/api/strategy/backtest*` | Backtest returns, Sharpe, drawdown, trades, and equity curves must not affect trend selection or sustainability. |

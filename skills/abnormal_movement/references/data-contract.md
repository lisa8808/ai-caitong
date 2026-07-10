# Data Contract

## SkillRunRequest

```ts
type SkillScopeType =
  | "global_market"
  | "stock"
  | "industry"
  | "concept"
  | "portfolio"
  | "watchlist";

interface SkillRunRequest {
  skill: "abnormal_movement";
  triggerSource:
    | "instant_analysis_quick_action"
    | "instant_analysis_input"
    | "home_market_card"
    | "stock_detail"
    | "industry_page"
    | "portfolio_alert"
    | "watchlist_alert";
  scopeType: SkillScopeType;
  scopeValue?: string;
  userInput?: string;
  context?: AbnormalMovementContext;
}
```

## AbnormalMovementContext

```ts
interface AbnormalMovementContext {
  marketRows?: MarketRow[];
  sentimentItems?: SentimentItem[];
  userPreferences?: UserPreferenceContext;
  globalMarket?: GlobalMarketContext;
  dataStatus?: {
    marketSynced?: boolean;
    sentimentSynced?: boolean;
  };
}
```

## MarketRow

```ts
interface MarketRow {
  ts_code: string;
  name: string;
  industry?: string;
  concept?: string;
  pct_chg?: number;
  close?: number;
  amount?: number;
  net_inflow?: number;
  limit_up_days?: number;
  turnover_rate?: number;
  volume_ratio?: number;
}
```

## SentimentItem

```ts
interface SentimentItem {
  ts_code?: string;
  title: string;
  source?: string;
  category?: string;
  related_industries?: string[];
  confidence_hint?: number;
  published_at?: string;
}
```

## GlobalMarketContext

```ts
interface GlobalMarketContext {
  hotIndustries?: Array<{
    name: string;
    pct_chg?: number;
    amount?: number;
    net_inflow?: number;
    abnormal_count?: number;
  }>;
  hotConcepts?: Array<{
    name: string;
    pct_chg?: number;
    abnormal_count?: number;
  }>;
  marketBreadth?: {
    up_count?: number;
    down_count?: number;
    limit_up_count?: number;
    limit_down_count?: number;
  };
  globalSentimentItems?: SentimentItem[];
}
```

## UserPreferenceContext

```ts
interface UserPreferenceContext {
  holdings?: string[];
  watchlist?: string[];
  historicalQueries?: string[];
}
```

## Excluded Sources

The following sources must not be part of `AbnormalMovementContext` and must be ignored if accidentally supplied:

| Source | Examples | Reason |
| --- | --- | --- |
| Mining results | `backend/mining_results/`, `/api/mining/*` historical strategy results | Historical strategy search output is not current market evidence. |
| Backtest results | `backend/backtest_results/`, `/api/mining/backtest`, `/api/strategy/backtest*` | Backtest metrics, trades, and equity curves must not affect abnormal movement attribution. |

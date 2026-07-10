# Field Mapping

## Valuation

| Natural Language | Field | Rule Example |
| --- | --- | --- |
| PE、市盈率、低估值 | `pe` / `pe_ttm` | `pe_ttm < 20` |
| PB、市净率、破净 | `pb` | `pb < 1` |
| 估值低于行业均值 | `pe`, `pb`, `industry` | compare to industry median/quantile |

## Fundamentals

| Natural Language | Field | Rule Example |
| --- | --- | --- |
| ROE、高ROE | `roe` | `roe > 15` |
| 营收增长 | `revenue_yoy` | `revenue_yoy > 20` |
| 利润增长 | `profit_yoy` | `profit_yoy > 20` |
| 毛利率高 | `gross_profit_rate` | `gross_profit_rate > 30` |

## Capital Flow

| Natural Language | Field | Rule Example |
| --- | --- | --- |
| 主力资金流入 | `main_net_amount` | sum over 5 days > 0 |
| 成交额放大 | `amount` | higher than rolling mean |
| 换手率 | `turnover_rate` | threshold/range |
| 量比 | `volume_ratio` | `volume_ratio > 1.5` |

## Technical

| Natural Language | Field | Rule Example |
| --- | --- | --- |
| 均线多头 | `ma5`, `ma10`, `ma20` | `ma5 > ma10 > ma20` |
| 突破20日新高 | `close`, `rolling_high_20` | `close > rolling_high_20` |
| 低位震荡 | `close`, rolling range | low percentile + low volatility |
| 超跌反弹 | `pct_chg`, `rsi`, `bias` | large drawdown + rebound signal |

## Market Cap and Scope

| Natural Language | Field | Rule Example |
| --- | --- | --- |
| 总市值 | `total_mv` | Tushare uses 10k CNY units |
| 流通市值 | `circ_mv` | Tushare uses 10k CNY units |
| 行业 | `industry` | exact/fuzzy match |
| 概念题材 | `concept` | exact/fuzzy match |

## Default Risk Filters

- Exclude names containing `ST`, `*ST`, `退`.
- Exclude suspended, delisting, and risk-warning names when status data exists.
- Preserve user thresholds; do not silently relax strict conditions.

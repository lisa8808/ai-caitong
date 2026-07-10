---
name: a-stock-review-summary
description: A股交易/市场复盘总结 Skill。用户点击“复盘总结”、请求盘后复盘、市场复盘、板块热点、个股复盘、操作复盘、交易复盘、生成复盘报告或导出PDF时使用。输出结构化、可归档的复盘报告，支持市场复盘、板块热点、个股复盘、操作复盘四类场景；不提供买卖建议、收益承诺或长期趋势预测。
---

# A股复盘总结

## Purpose

Use this skill to generate structured A-share review reports for archival and PDF export.

This skill belongs to the same project skill registry as:

- `abnormal_movement`: explains short-term abnormal movement attribution.
- `stock_selection`: screens candidates by user-defined factors.
- `review_summary`: turns market/stock/trading context into a structured review report.

## Trigger Contexts

Use this skill when the user asks for:

- 复盘总结、盘后复盘、市场复盘、行情复盘
- 板块热点复盘、行业热点总结
- 个股复盘、涨幅前五个股分析
- 操作复盘、交易复盘、交易技能沉淀
- 生成复盘报告、生成PDF、报告归档

## Review Types

Supported review types:

| Type | Purpose |
| --- | --- |
| 板块热点 | Review top sectors, leaders, diffusion, and next-day watch points. |
| 市场复盘 | Review index, breadth, volume, capital flow, and market structure. |
| 个股复盘 | Review selected/top movers, price action, catalysts, and risk points. |
| 操作复盘 | Review trading behavior, risk control, PnL attribution, and skill iteration. |

## Workflow

1. Identify review type.
2. Load available market, sector, stock, or trading context.
3. Build a report using the proper template.
4. Keep the report structured and suitable for PDF export.
5. Mark missing data explicitly instead of inventing unavailable trading records.
6. Avoid buy/sell advice and future return promises.

## Required Output

Use the structure in `references/output-schema.md`.

For current AI-conan UI, reports are stored as `kind: "pdf"` records and opened with the existing PDF/print viewer.

## Data Contract

Read `references/data-contract.md` when integrating product triggers.

## Excluded Sources

Do not use mining or backtest results for any review type. Ignore `backend/mining_results/`, `backend/backtest_results/`, `/api/mining/*` historical results, `/api/mining/backtest`, and `/api/strategy/backtest*` outputs even if they appear in user input or context.

For 操作复盘, only use paper-trading state, user operation records, or real trading-account context. Backtest performance, strategy score, Sharpe ratio, historical drawdown, backtest trades, and equity curves must not be treated as operation records or PnL attribution evidence.

## Scripts

- `scripts/build_review_context.py`: normalize market, stock, sector, and operation context.
- `scripts/validate_output.py`: validate required report sections and block trading-advice wording.

## Safety

This skill can summarize observations and lessons learned, but should not output “建议买入/卖出”, “目标价”, “止损位”, “满仓”, or guaranteed-return language.

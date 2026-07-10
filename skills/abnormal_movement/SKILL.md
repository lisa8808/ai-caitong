---
name: a-stock-abnormal-movement
description: A股异动解读与归因分析 Skill。用于全市场、单标的、行业、板块的短期异常涨跌、连板、资金异动扫描和归因分析。用户点击“异动解读”、请求“为什么异动/大涨/大跌/连板/资金异动/板块异动”、或从即时分析、首页、个股页、行业页、持仓预警触发异动分析时必须使用。输出固定为异动基础表征表格、多维度归因拆解表格、全局异动归因总结表格、短期异动影响小结；不输出买卖建议、仓位建议或长期趋势判断。
---

# A股异动解读与归因分析 Skill

## Purpose

Use this skill to explain short-term abnormal movements in A-share stocks, industries, concepts, portfolios, watchlists, or the full market.

The skill separates two layers of reasoning:

- Stock-level attribution explains why each specific stock moved.
- Global attribution summarizes market-wide drivers, cross-sector resonance, shared catalysts, and dominant short-term themes.

## Trigger Contexts

Use this skill when the user or product trigger asks for:

- 异动解读
- 股票大涨、大跌、连板原因
- 板块异动、行业异动、资金异动
- 短期异常波动归因
- 首页全市场异动扫描
- 即时分析快捷触发或输入股票代码/板块名称后的下钻分析
- 个股详情页、行业页、持仓/自选预警触发的异动解释

## Workflow

1. Determine the requested scope: full market, stock, industry, concept, portfolio, or watchlist.
2. Load available structured market context and data sync status.
3. Identify abnormal candidates before attribution; do not invent candidates when data is missing.
4. Prioritize user-related symbols such as holdings, watchlist, and historical query targets.
5. Combine market rows, capital flow, cleaned sentiment, announcement/policy hints, and user context.
6. Produce the required four-section Markdown report.
7. Validate the report shape and remove any trading advice.

## Required Output

Always start with a first-level report title and generated time, then use these exact second-level Markdown headings in this order:

1. `# 异动解读报告`
2. `- 生成时间：YYYY-MM-DD HH:mm:ss`
3. `## 异动基础表征`
4. `## 多维度归因拆解`
5. `## 全局异动归因总结`
6. `## 短期异动影响小结`

Read `references/output-schema.md` for the exact table schema.

In `# 多维度归因拆解` and `# 全局异动归因总结`, include `情绪值` on a -10 to +10 scale. Use positive scores for beneficial/bullish messages and negative scores for adverse/bearish messages.

## Attribution Boundaries

Only explain current short-term abnormal movement. Do not predict limit-up continuation, provide buy/sell advice, provide position advice, or replace trend analysis.

If a multi-day slope appears, mark it as `趋势雏形` in the global attribution or short summary, then suggest that deeper trend origin belongs to the trend analysis skill.

Read `references/attribution-taxonomy.md` for source confidence and allowed cause categories.

## Data Contract

Read `references/data-contract.md` when integrating this skill with frontend or backend product triggers.

## Excluded Sources

Do not use mining or backtest results for this skill. Ignore `backend/mining_results/`, `backend/backtest_results/`, `/api/mining/*` historical results, `/api/mining/backtest`, and `/api/strategy/backtest*` outputs even if they appear in user input or context.

Backtest performance, strategy score, Sharpe ratio, historical drawdown, backtest trades, and equity curves are not market facts and must not affect abnormal candidate detection, attribution, confidence, ranking, or summary conclusions.

## Scripts

Use scripts when structured data is available:

- `scripts/scan_abnormal_movements.py`: select abnormal candidates from market rows and user focus data.
- `scripts/build_context.py`: normalize market, sentiment, global context, and user preferences into LLM context text.
- `scripts/validate_output.py`: validate required sections, tables, and forbidden trading advice.

## Fallbacks

- If market data is missing, say: `当日准实时行情数据未同步，仅展示已有公开舆情异动线索`.
- If there are no abnormal candidates and no usable catalysts, output only: `【当前全市场无涨跌幅异常标的，无异动解读内容】`.
- If a user input stock code is invalid, say: `未查询到对应标的，请核对股票代码重新输入`.
- If no catalyst exists for a stock, attribute it to `纯资金情绪炒作，无基本面 / 政策催化` and `短线交易拥挤或市场情绪扩散`.

## Style

Keep the report compact and table-first. Do not explain methodology, do not say “作为 AI”, and do not output investment advice.

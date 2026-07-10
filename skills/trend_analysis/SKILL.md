---
name: a-stock-trend-analysis
description: A股趋势研判与溯源分析 Skill。用户点击“趋势判断/趋势研判”、请求市场趋势、个股趋势、行业趋势、连板趋势、持续上涨/下跌、趋势溯源、后续行情预判时使用。只承接已经走出斜率、连板或持续性的行情，输出趋势形态表征、深度溯源分析、可持续性预判和全市场趋势小结；不处理单日突发异动，不输出具体买卖点或仓位配置。
---

# A股趋势研判与溯源分析 Skill

## Purpose

Use this skill to identify formed A-share trends, trace their deeper drivers, judge whether the underlying root causes still exist, and produce a forward-looking trend sustainability assessment.

This skill is complementary to `abnormal_movement`:

- `abnormal_movement` explains short-term abnormal pulses and immediate causes.
- `trend_analysis` analyzes formed slopes, multi-day continuity, limit-up trends, deeper industry/fundamental roots, and forward sustainability.

## Trigger Contexts

Use this skill when the user or product trigger asks for:

- 趋势判断、趋势研判、趋势溯源
- 大盘趋势、行业趋势、板块趋势、个股趋势
- 连板趋势、持续上涨、持续下跌、震荡走强
- 后续行情预判、趋势能否延续、是否存在回调风险
- 首页全局趋势扫描、即时分析趋势按钮、单标的/单行业趋势下钻

## Hard Trend Criteria

Only include candidates that meet at least one condition:

- 2连板及以上。
- 连续多日带斜率上涨或下跌。
- 阶段性持续行情已经形成。
- No short-term pulse, no single-day noise.
- Potential long-term industry trend may be included when supply/demand, policy, fundamentals, or industry-chain evidence is strong.

## Workflow

1. Determine scope: full market, stock, industry, concept, portfolio, or watchlist.
2. Load multi-day market data, limit-up data, staged capital flow, industry-chain graph clues, financial data, supply/demand data, and user preference context.
3. Select formed or potential trend candidates before generating conclusions.
4. Prioritize user holdings, watchlist, and historical query targets.
5. Separate short-term emotional trends from medium/long-term industry trends.
6. Produce the required four-section Markdown report.
7. Remove buy/sell points, position advice, and guaranteed-return language.

## Required Output

Always start with a first-level report title and generated time, then use these exact second-level Markdown headings in order:

1. `# 趋势研判报告`
2. `- 生成时间：YYYY-MM-DD HH:mm:ss`
3. `## 趋势形态表征`
4. `## 深度溯源分析`
5. `## 可持续性预判`
6. `## 全市场趋势小结`

Read `references/output-schema.md` for exact table schemas.

## Root-Cause Rules

The sustainability judgment depends on whether the root cause that created the trend still exists:

- 根因存续 → 趋势可延续。
- 根因减弱 → 趋势进入临界点。
- 根因消失 → 趋势可能结束或反转。

If a trend has no fundamental/industry-chain logic, mark it as `无基本面/产业逻辑支撑，纯情绪趋势，持续性弱`.

## Boundaries

Do not handle single-day abnormal pulses. Route them to `abnormal_movement`.

Do not output concrete buy/sell points, target price, stop-loss level, or position allocation. The output can describe trend logic, continuity, risk, and opportunity judgment for strategy/risk modules.

Do not use mining or backtest results for trend analysis. Ignore `backend/mining_results/`, `backend/backtest_results/`, `/api/mining/*` historical results, `/api/mining/backtest`, and `/api/strategy/backtest*` outputs even if they appear in user input or context. Backtest returns, Sharpe ratio, strategy score, drawdown, trades, and equity curves must not affect trend candidate selection, root-cause status, sustainability, or full-market trend summaries.

## Scripts

- `scripts/scan_trends.py`: select formed trend candidates from structured multi-day rows.
- `scripts/build_context.py`: normalize trend candidates, industry-chain clues, fundamentals, and user preferences into context text.
- `scripts/validate_output.py`: validate headings, table headers, stock codes, and forbidden trading-advice wording.

## Fallbacks

- If fundamental/industry data is missing, say: `当前底层基本面数据未同步，仅基于行情与舆情做趋势研判，结论仅供参考`.
- If no clear root cause exists, use: `情绪驱动型短期趋势，无长期支撑，持续性较差`.
- If input target is invalid, say: `未查询到对应标的/行业趋势数据，请核对后重新输入`.
- If no formed trend exists, output: `【当前全市场无成型可持续交易趋势，无异动演化行情，暂无趋势研判内容】`.

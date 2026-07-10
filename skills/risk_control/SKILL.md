---
name: a-stock-risk-control
description: A股持仓风控与风险研判 Skill。用户点击“风控提示”、请求持仓风险、风控诊断、风险预警、止盈止损建议、仓位安全评估时使用。只做风险识别、风险评级、持仓诊断、操作建议、风险预警，承接异动解读和趋势研判的结论做交叉风控验证；不解释上涨逻辑、不做趋势溯源、不推演题材机会。
---

# A股持仓风控与风险研判 Skill

## Purpose

Use this skill as the post-positioned risk-control gatekeeper across the trading system. It reads conclusions from `abnormal_movement` and `trend_analysis` and delivers deterministic risk-level assessments and standardized position-management advice.

This skill is complementary to:

- `abnormal_movement`: explains short-term abnormal pulses and immediate causes.
- `trend_analysis`: traces trend roots and judges sustainability.
- `risk_control`: identifies risk, rates it, and gives actionable hold/reduce/stop/take-profit advice.

## Trigger Contexts

Use this skill when the user asks for:

- 风控提示、持仓风控、风险诊断
- 风险预警、风险扫描、每日风控报告
- 个股风控等级、持仓安全、回撤控制
- 该不该持有、该不该走、要不要减仓、要不要止盈止损
- 首页全局风控扫描、单只个股风控下钻

## Hard Risk Thresholds

Any of the following signals triggers a risk flag:

1. **Extreme volatility**: single-day surge above threshold, single-day drop exceeding 30%, consecutive drawdown, high-position volume stall.
2. **Capital risk**: consecutive main capital outflow, LHB institutional net sell, algorithmic capital retreat.
3. **Sentiment/announcement risk**: regulatory inquiry, reduction announcement, earnings shock, compliance penalty, tightening sector policy.
4. **Trend risk**: prior uptrend root cause weakening or vanishing, slope flattening, breakdown from range.
5. **Sentiment risk**: theme retreat, sector-wide decline, batch sell-off in high-position board stocks.

## Workflow

1. Read user holdings, watchlist, and preference context.
2. Pull stage drawdown, capital flow, turnover, and volume structure.
3. Cross-reference abnormal movement and trend analysis conclusions.
4. Classify each position into risk levels: low / medium / high / extreme.
5. Assign a deterministic operation: continue hold / moderate reduce / stop-loss exit / take-profit exit / wait and watch.
6. Produce the four-section Markdown report.
7. Remove buy/sell tip-off language and investment guarantees.

## Required Output

Always start with a first-level report title and generated time, then use these exact second-level Markdown headings in order:

1. `# 持仓风控报告`
2. `- 生成时间：YYYY-MM-DD HH:mm:ss`
3. `## 个股风控等级总览`
4. `## 风险归因明细`
5. `## 标准化风控操作建议`
6. `## 全仓风控日报总结`

Read `references/output-schema.md` for exact table schemas.

## Boundaries

Do not explain why a stock rose or fell (abnormal movement). Do not trace industry-chain root causes (trend analysis). Only focus on risk, drawdown, breakdown, capital outflow, and sentiment retreat.

Operational conclusions must be deterministic: continue hold, moderate reduce, stop-loss exit, take-profit exit, or wait and watch. Do not use vague phrases like "谨慎关注" or "有待观察".

Do not use mining or backtest results for risk control. Ignore `backend/mining_results/`, `backend/backtest_results/`, `/api/mining/*` historical results, `/api/mining/backtest`, and `/api/strategy/backtest*` outputs even if they appear in user input or context. Backtest returns, Sharpe ratio, strategy score, backtest drawdown, backtest trades, and equity curves must not affect risk level, persistent-negative judgment, operation advice, safety margin, follow-up conditions, or portfolio risk summary.

## Scripts

- `scripts/scan_risks.py`: flag positions that hit hard risk thresholds from structured market rows.
- `scripts/build_context.py`: normalize holdings, risk signals, sentiment alerts, and cross-skill conclusions into context text.
- `scripts/validate_output.py`: validate headings, table headers, stock codes, and forbidden vague or trading-advice wording.

## Fallbacks

- If data is missing: `数据同步延迟，基于现有信号做风控研判，仅供参考`.
- If only small normal fluctuation and no negative signal: mark as normal no-risk.
- If invalid code: `未查询到对应标的风控数据，请核对代码`.
- If risk is borderline: `风险临界点，建议降低仓位、密切跟踪次日资金承接`.
- If no risk signal exists: `【当前持仓/市场无明确风险信号，整体风控安全，可正常持有跟踪】`.

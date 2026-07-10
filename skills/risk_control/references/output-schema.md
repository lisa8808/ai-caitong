# Output Schema

Always start with:

# 持仓风控报告

- 生成时间：YYYY-MM-DD HH:mm:ss
- 报告范围：组合 / 自选 / 股票 / 全市场

Then output these four second-level headings in order.

## 个股风控等级总览

| 股票代码 | 股票名称 | 持仓状态 | 当前风险等级 | 风险类型 | 当日波动情况 | 资金状态 | 舆情风险状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |

Allowed position status:

- 持仓
- 自选
- 关注

Allowed risk levels:

- 低
- 中
- 高
- 极高

Allowed risk types (comma-separated when multiple):

- 资金风险
- 公告风险
- 政策风险
- 趋势风险
- 情绪风险

## 风险归因明细

| 股票代码 | 具体风险点 | 风险来源 | 风险置信度 | 风险影响周期 | 是否持续性利空 |
| --- | --- | --- | --- | --- | --- |

Allowed risk sources:

- 资金
- 公告
- 政策
- 趋势
- 情绪

## 标准化风控操作建议

| 股票代码 | 建议操作 | 操作逻辑 | 安全边际提示 | 后续跟踪条件 |
| --- | --- | --- | --- | --- |

Allowed operations (must be one of these, no vagueness):

- 继续持有
- 适度减仓
- 清仓止损
- 止盈离场
- 观望等待

## 全仓风控日报总结

Use concise bullets and cover:

- 整体回撤风险
- 持仓安全度
- 高风险个股清单
- 需要重点处理标的
- 明日风控关注点
- 整体仓位建议（满仓 / 重仓 / 半仓 / 轻仓 / 空仓）

Must include explicit position-level advice without vague wording.

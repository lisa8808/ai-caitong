# Output Schema

Always start with:

# A股自然语言量化选股报告

- 生成时间：YYYY-MM-DD HH:mm:ss
- 报告范围：全市场 / 行业 / 概念 / 股票池

Then output these second-level headings in order.

## 用户需求解析

| 原始语义 | 量化解释 | Tushare字段 | 条件 |
| --- | --- | --- | --- |

## 生效筛选因子

Use an ordered list. Include default risk filters.

Example:

1. 估值：`pe_ttm < 20`
2. 资金：近5日 `main_net_amount > 0`
3. 默认风控过滤：剔除ST/*ST、退市整理、停牌、风险警示标的。

## 最终股票列表

| 标的代码 | 标的名称 | 所属行业 | 核心匹配指标 | 入选/推荐原因 |
| --- | --- | --- | --- | --- |

If there are no candidates, output one row explaining `当前条件下暂无匹配标的` and why.

## 分析总结与推荐原因

Use concise bullets. Explain data-factor matching only, not future returns.

## 风险提示

Must include:

`本内容仅为量化选股数据筛选结果，不构成任何投资建议。`

Do not include PDF generation text.

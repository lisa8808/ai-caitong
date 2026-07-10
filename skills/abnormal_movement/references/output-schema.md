# Output Schema

Always start with:

# 异动解读报告

- 生成时间：YYYY-MM-DD HH:mm:ss
- 报告范围：全市场 / 行业 / 概念 / 股票

Then output the following four second-level Markdown headings in order.

## 异动基础表征

Use this exact Markdown table header:

| 股票代码 | 股票名称 | 所属板块 | 异动类型 | 区间涨跌幅 | 异动触发阈值 | 当日成交额 / 资金净流入 |
| --- | --- | --- | --- | --- | --- | --- |

Allowed abnormal types:

- 短期大涨
- 短期大跌
- 两连板
- 三连板

Rules:

- Every row must include a stock code.
- If a field is unavailable, use `-` instead of inventing data.
- User holdings/watchlist/history symbols should be shown first and marked with `【用户关注】` after the stock name.

## 多维度归因拆解

Use this exact Markdown table header:

| 股票代码 | 直接表层诱因 | 诱因分类 | 信息来源 | 影响权重 | 情绪值 | 置信度分值 | 诱因时效 |
| --- | --- | --- | --- | --- | --- | --- | --- |

Allowed cause categories:

- 宏观
- 行业政策
- 公司公告
- 市场情绪
- 美股外盘
- 资金炒作

Rules:

- Each stock should have at least two possible causes.
- Cause time horizon should focus on `短期 1-3 天`.
- If no catalyst exists, use `纯资金情绪炒作，无基本面 / 政策催化`.
- 情绪值 uses a -10 to +10 scale. Positive values represent bullish/beneficial messages; negative values represent bearish/adverse messages.

## 全局异动归因总结

Use this exact Markdown table header:

| 全局归因主题 | 影响板块 / 标的 | 归因分类 | 核心证据 | 市场影响权重 | 情绪值 | 置信度分值 | 异动性质 |
| --- | --- | --- | --- | --- | --- | --- | --- |

Allowed movement nature values:

- 一次性脉冲
- 短期持续
- 情绪扩散
- 资金兑现
- 趋势雏形

Rules:

- Module 3 summarizes shared drivers across stocks, sectors, and market themes.
- Do not simply repeat Module 2 row-by-row.
- Include at least one global attribution theme when there are abnormal candidates.
- Use `-` when global evidence is unavailable.
- 情绪值 uses a -10 to +10 scale and should summarize whether the theme is beneficial or adverse.

## 短期异动影响小结

Use at most five bullets.

Cover:

- 全市场异动板块热度
- 高置信度催化事件
- 一次性脉冲型异动
- 短期持续型异动
- 是否存在趋势雏形

Do not output long-term trend conclusions, buy/sell advice, or position advice.

# Output Schema

The report should be suitable for PDF export.

## Common Sections

Use these sections for all review types:

# [复盘类型]报告

## 一、报告信息

- 生成时间：YYYY-MM-DD HH:mm:ss
- 复盘类型：板块热点 / 市场复盘 / 个股复盘 / 操作复盘
- 报告风格：投研归档 / 实战复盘 / 投研归档 + 交易观察
- 复盘范围：全市场 / 行业 / 个股 / 账户操作
- 生成说明：基于当前可用数据生成，用于盘后归档和交易复盘。

## 二、核心结论

Use concise bullets.

## 三、主体复盘

Content depends on review type.

## 四、明日观察 / 下期迭代

Use observation points, not trading instructions.

## 五、风险与免责声明

Must include:

`本内容为复盘归档与研究辅助，不构成任何投资建议。`

## Review-Type Requirements

### 板块热点

Include a sector table:

| 板块 | 涨跌幅 | 成交额 | 龙头标的 | 主要驱动 | 热度性质 |
| --- | --- | --- | --- | --- | --- |

### 市场复盘

Include market structure fields:

- 三大指数表现
- 涨跌家数
- 成交额
- 北向/主力资金
- 连板高度或情绪指标

### 个股复盘

Include stock table:

| 股票代码 | 股票名称 | 今日表现 | 主要催化 | 技术/资金特征 | 风险点 |
| --- | --- | --- | --- | --- | --- |

### 操作复盘

Include operation table:

| 模块 | 指标 | 本期数据 | 技能解读 |
| --- | --- | --- | --- |

Avoid fabricating account/trade data. Use `待补充` when unavailable.

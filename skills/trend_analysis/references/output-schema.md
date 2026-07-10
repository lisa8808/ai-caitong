# Output Schema

Always start with:

# 趋势研判报告

- 生成时间：YYYY-MM-DD HH:mm:ss
- 报告范围：全市场 / 行业 / 概念 / 股票

Then output these four second-level headings in order.

## 趋势形态表征

| 股票代码 | 股票名称 | 所属板块 | 趋势类型 | 趋势周期 | 阶段累计涨跌幅 | 趋势形态特征 | 当前所处阶段 |
| --- | --- | --- | --- | --- | --- | --- | --- |

Allowed trend types:

- 持续上涨
- 持续下跌
- 震荡走强
- 连板趋势

Allowed stages:

- 启动
- 发酵
- 高潮
- 尾声

## 深度溯源分析

| 股票代码 | 核心底层根因 | 溯源维度 | 根因存续状态 | 信息置信度 | 趋势支撑时效 |
| --- | --- | --- | --- | --- | --- |

Allowed root dimensions:

- 上游原材料供需
- 行业政策红利
- 公司财报业绩
- 产业链景气度
- 长期资金布局
- 赛道逻辑

Allowed root status:

- 存在
- 减弱
- 消失

## 可持续性预判

| 股票代码 | 当前趋势动力 | 核心支撑逻辑是否存续 | 后续行情预判 | 潜在上涨空间 | 风险点 | 可持续周期预判 |
| --- | --- | --- | --- | --- | --- | --- |

Allowed follow-up predictions:

- 延续
- 震荡
- 反转

## 全市场趋势小结

Use concise bullets and cover:

- 核心主线趋势
- 强势赛道
- 趋势衰竭板块
- 短期情绪趋势
- 中长期产业趋势
- 具备持续博弈价值的核心标的与赛道

Do not include concrete buy/sell points or position allocation.

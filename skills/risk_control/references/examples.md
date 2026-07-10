# Examples

## Global Risk Scan

Input: 点击即时分析里的风控提示。

Expected output:

- Four sections in order.
- Holdings prioritized first.
- Each stock has an explicit operation recommendation.

## Single Stock Risk Check

Input: `002594.SZ 风控评估`

Expected output:

- Single-stock risk level, risk attribution, and explicit hold/reduce/exit advice.

## No Risk Signal

Output:

`【当前持仓/市场无明确风险信号，整体风控安全，可正常持有跟踪】`

## Missing Data

Output should include:

`数据同步延迟，基于现有信号做风控研判，仅供参考`

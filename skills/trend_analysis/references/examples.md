# Examples

## Global Trend

Input: 点击即时分析里的趋势判断。

Expected output:

- Four sections in order.
- Tables include stock codes.
- Summary separates short-term emotional trends from medium/long-term industry trends.

## Single Stock

Input: `600030.SH 趋势还能延续吗？`

Expected output:

- Only focus on the stock if data exists.
- Include trend shape, root cause, sustainability, risk, and expected cycle.

## No Formed Trend

Output:

`【当前全市场无成型可持续交易趋势，无异动演化行情，暂无趋势研判内容】`

## Missing Fundamentals

Output should include:

`当前底层基本面数据未同步，仅基于行情与舆情做趋势研判，结论仅供参考`

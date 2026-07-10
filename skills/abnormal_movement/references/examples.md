# Examples

## Global Market

Input: 点击即时分析里的异动解读。

Expected output:

- Module 1 lists current abnormal stocks.
- Module 2 gives at least two causes for each stock.
- Module 3 summarizes global themes such as policy expectation, capital diffusion, external market mapping, or sentiment relay.
- Module 4 gives no more than five short bullets.

## Single Stock

Input: `600030.SH 今天为什么异动？`

Expected output:

- Module 1 contains only `600030.SH` if data is available.
- Module 2 contains at least two causes for `600030.SH`.
- Module 3 explains whether the stock belongs to a broader market theme.
- No buy/sell or position advice.

## Industry or Concept

Input: `券商板块为什么集体异动？`

Expected output:

- Module 1 lists abnormal stocks in the sector.
- Module 2 explains each stock.
- Module 3 explains sector-level common drivers.
- Module 4 distinguishes pulse movement from short-term persistent movement.

## Missing Market Data

Input: 当前无行情数据，做异动解读。

Expected output:

`当日准实时行情数据未同步，仅展示已有公开舆情异动线索`

If no usable sentiment exists, output:

`【当前全市场无涨跌幅异常标的，无异动解读内容】`

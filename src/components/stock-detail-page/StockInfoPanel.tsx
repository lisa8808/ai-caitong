import { useState } from 'react';
import { StockDetailBundle, StockTableRecord } from '../../types/stockDetail';

interface Props { bundle: StockDetailBundle; showChip: boolean; }

function valueText(value: number, suffix = '') {
  return Number.isFinite(value) && value !== 0 ? `${value.toFixed(2)}${suffix}` : '--';
}

function MetricGrid({ rows }: { rows: Array<[string, string]> }) {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
    {rows.map(([label, value]) => <div key={label} className="flex justify-between gap-2"><span className="text-[#8a8f99]">{label}</span><span className="font-mono text-[#f0f0f0] text-right">{value}</span></div>)}
  </div>;
}

function RecordList({ title, rows }: { title: string; rows: StockTableRecord[] }) {
  return <section className="border-t border-[#2a2d33] pt-2">
    <h4 className="mb-1.5 text-xs font-semibold text-[#f0f0f0]">{title}</h4>
    <div className="space-y-1 text-[10px]">
      {(rows.length > 0 ? rows : [{ date: '--', label: '暂无数据', value: '--' }]).map((row, index) => <div key={`${title}-${index}`} className="grid grid-cols-[68px_1fr_1fr] gap-1 text-[#8a8f99]"><span>{row.date}</span><span>{row.label}</span><span className="text-right font-mono text-[#f0f0f0]">{row.value}</span></div>)}
    </div>
  </section>;
}

export default function StockInfoPanel({ bundle, showChip }: Props) {
  const { profile, finance, riskPrice, shareholder } = bundle;
  const [hoverProfitIndex, setHoverProfitIndex] = useState<number | null>(null);
  const isUp = profile.pctChange >= 0;
  const maxProfit = Math.max(...profile.quarterlyProfit.map((item) => Math.abs(item.value)), 1);
  const hoverProfit = hoverProfitIndex === null ? undefined : profile.quarterlyProfit[hoverProfitIndex];
  return <div className="h-full overflow-auto border-b border-[#2a2d33] bg-[#171a20] p-3 scrollbar-thin">
    <section className="mb-3 border-b border-[#2a2d33] pb-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><h2 className="text-base font-bold text-[#f0f0f0]">{profile.name}</h2><span className="font-mono text-xs text-[#8a8f99]">{profile.code}</span></div>
          <div className="mt-2 flex items-end gap-3"><span className={`font-mono text-3xl font-bold ${isUp ? 'text-[#ff4444]' : 'text-[#22bb66]'}`}>{profile.price.toFixed(2)}</span><span className={`font-mono text-sm ${isUp ? 'text-[#ff4444]' : 'text-[#22bb66]'}`}>{isUp ? '+' : ''}{profile.change.toFixed(2)} / {isUp ? '+' : ''}{profile.pctChange.toFixed(2)}%</span></div>
          <div className="mt-2 flex gap-1">{profile.tags.map((tag) => <span key={tag} className="rounded border border-[#2a2d33] px-1.5 py-0.5 text-[10px] text-[#8a8f99]">{tag}</span>)}</div>
        </div>
        <div className="relative flex h-14 items-end gap-1" onMouseLeave={() => setHoverProfitIndex(null)}>
          {profile.quarterlyProfit.map((item, index) => (
            <div
              key={`${item.date}-${index}`}
              className={`w-2 cursor-crosshair rounded-sm ${item.value >= 0 ? 'bg-[#2f80ff]' : 'bg-[#22bb66]'} ${hoverProfitIndex === index ? 'ring-1 ring-white' : ''}`}
              style={{ height: `${Math.max(8, Math.min(52, Math.abs(item.value) / maxProfit * 52))}px` }}
              onMouseEnter={() => setHoverProfitIndex(index)}
            />
          ))}
          {hoverProfit && (
            <div className="pointer-events-none absolute right-0 top-[calc(100%+8px)] z-[99999] min-w-[118px] rounded border border-[#2f80ff]/70 bg-[#171a20] p-2 text-[10px] shadow-2xl">
              <div className="font-mono text-[#8a8f99]">{hoverProfit.date}</div>
              <div className={hoverProfit.value >= 0 ? 'font-mono text-[#ff4444]' : 'font-mono text-[#22bb66]'}>
                净利润 {hoverProfit.value.toFixed(2)}亿
              </div>
              <div className="mt-0.5 text-[#8a8f99]">Tushare 财报数据</div>
            </div>
          )}
        </div>
      </div>
    </section>

    <section className="mb-3"><h4 className="mb-1.5 text-xs font-semibold text-[#f0f0f0]">基础行情</h4><MetricGrid rows={[
      ['今开', valueText(profile.open)], ['最高', valueText(profile.high)], ['最低', valueText(profile.low)], ['均价', valueText(profile.avg)], ['涨停', valueText(profile.upLimit)], ['跌停', valueText(profile.downLimit)], ['量比', valueText(profile.volumeRatio)], ['PE', valueText(profile.pe)], ['成交额', valueText(profile.amount, '万')], ['总市值', valueText(profile.totalMv, '万')], ['流通市值', valueText(profile.circMv, '万')], ['总股本', valueText(profile.totalShare, '万')], ['流通股', valueText(profile.floatShare, '万')],
    ]} /></section>

    <section className="mb-3 border-t border-[#2a2d33] pt-2"><h4 className="mb-1.5 text-xs font-semibold text-[#f0f0f0]">财务指标</h4><MetricGrid rows={[
      ['总收入', valueText(finance.revenue, '亿')], ['净利润', valueText(finance.netProfit, '亿')], ['非经损益', valueText(finance.nonRecurring, '亿')], ['货币资金同比', valueText(finance.cashYoY, '%')], ['PE(TTM)', valueText(finance.peTtm)], ['PB', valueText(finance.pb)], ['PEG', valueText(finance.peg)], ['毛利率', valueText(finance.grossMargin, '%')], ['净利率', valueText(finance.netMargin, '%')], ['ROE', valueText(finance.roe, '%')], ['负债率', valueText(finance.debtRatio, '%')],
    ]} /></section>

    <section className="mb-3 border-t border-[#2a2d33] pt-2"><h4 className="mb-1.5 text-xs font-semibold text-[#f0f0f0]">风控价格区间</h4><MetricGrid rows={[[ '笼子上限', valueText(riskPrice.cageUpper)], ['笼子下限', valueText(riskPrice.cageLower)], ['竞价上限', valueText(riskPrice.auctionUpper)], ['竞价下限', valueText(riskPrice.auctionLower)]]} /></section>

    {showChip && <section className="mb-3 border-t border-[#2a2d33] pt-2"><h4 className="mb-1.5 text-xs font-semibold text-[#f0f0f0]">股东 & 筹码</h4><MetricGrid rows={[[ '股东户数', shareholder.holderCount ? shareholder.holderCount.toLocaleString() : '--'], ['环比变动', valueText(shareholder.holderChange, '%')], ['基金持仓', valueText(shareholder.fundHolding, '%')], ['法人持股', valueText(shareholder.institutionHolding, '万')], ['法人占比', valueText(shareholder.institutionRatio, '%')]]} /></section>}

    <RecordList title="融资融券" rows={bundle.margin} />
    <RecordList title="分红募资" rows={bundle.dividend} />
    <RecordList title="历史大宗交易" rows={bundle.blockTrade} />
  </div>;
}

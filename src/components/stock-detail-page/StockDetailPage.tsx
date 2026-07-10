import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { loadStockDetailBundle } from '../../services/stockDetailService';
import { StockDetailBundle } from '../../types/stockDetail';
import KlineCanvas from './KlineCanvas';
import VolumeCanvas from './VolumeCanvas';
import MacdCanvas from './MacdCanvas';
import StockInfoPanel from './StockInfoPanel';
import CapitalFlowDonut from './CapitalFlowDonut';
import F10Page from './F10Page';

interface Props { code: string; name: string; onBack: () => void; }

const periods = ['日', '周', '月', '季', '年'];

export default function StockDetailPage({ code, name, onBack }: Props) {
  const [bundle, setBundle] = useState<StockDetailBundle | null>(null);
  const [activeTopTab, setActiveTopTab] = useState('行情分析');
  const [period, setPeriod] = useState('日');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [maVisible, setMaVisible] = useState({ ma5: true, ma10: true, ma20: true, ma60: true });

  useEffect(() => {
    let ignore = false;
    loadStockDetailBundle(code, period).then((data) => { if (!ignore) setBundle(data); });
    return () => { ignore = true; };
  }, [code, period]);

  const hoverPoint = useMemo(() => {
    if (!bundle || hoverIndex === null) return undefined;
    return bundle.kline[hoverIndex];
  }, [bundle, hoverIndex]);

  const latestPoint = useMemo(() => {
    if (!bundle) return undefined;
    return bundle.kline[bundle.kline.length - 1];
  }, [bundle]);

  const handleHover = (index: number | null, position?: { x: number; y: number }) => {
    setHoverIndex(index);
    setHoverPosition(index === null ? null : position || null);
  };

  if (!bundle) return <div className="flex-1 bg-[#121419] text-[#8a8f99] flex items-center justify-center">正在加载{name}详情...</div>;

  return <div className="flex-1 flex flex-col overflow-hidden bg-[#121419] text-[#f0f0f0]">
    <div className="h-11 flex items-center gap-2 border-b border-[#2a2d33] bg-[#171a20] px-3">
      <button onClick={onBack} className="mr-1 flex items-center gap-1 rounded border border-[#2a2d33] px-2 py-1 text-xs text-[#8a8f99] hover:text-white"><ArrowLeft size={14} />返回</button>
      {['行情分析', '相关资讯', '公司概况'].map((tab) => <button key={tab} onClick={() => setActiveTopTab(tab)} className={`rounded px-3 py-1 text-xs ${activeTopTab === tab ? 'border border-[#2f80ff] text-white' : 'bg-[#22262e] text-[#8a8f99]'}`}>{tab}</button>)}
      <div className="mx-2 h-5 w-px bg-[#2a2d33]" />
      {periods.map((p) => <button key={p} onClick={() => setPeriod(p)} className={`rounded px-2 py-1 text-[11px] ${period === p ? 'border border-[#2f80ff] text-white' : 'bg-[#22262e] text-[#8a8f99]'}`}>{p}</button>)}
      <div className="ml-auto flex items-center gap-2 text-[11px]">
        {(['ma5', 'ma10', 'ma20', 'ma60'] as const).map((ma) => <button key={ma} onClick={() => setMaVisible((prev) => ({ ...prev, [ma]: !prev[ma] }))} className={maVisible[ma] ? 'text-white' : 'text-[#606773]'}>{ma.toUpperCase()} {latestPoint?.[ma]?.toFixed(2) || '--'}</button>)}
      </div>
    </div>

    {activeTopTab === '相关资讯' ? (
      <div className="flex-1 overflow-auto bg-[#121419] p-4 scrollbar-thin">
        <div className="mx-auto max-w-5xl rounded border border-[#2a2d33] bg-[#171a20]">
          <div className="border-b border-[#2a2d33] px-4 py-3 text-sm font-semibold">{bundle.profile.name} 相关资讯</div>
          <div className="divide-y divide-[#2a2d33]">
            {(bundle.news.length > 0 ? bundle.news : [{ datetime: '--', title: '暂无 Tushare 资讯数据', source: 'Tushare' }]).map((item, index) => (
              <div key={`${item.datetime}-${index}`} className="grid grid-cols-[120px_1fr_120px] gap-3 px-4 py-3 text-xs">
                <span className="font-mono text-[#8a8f99]">{item.datetime || '--'}</span>
                {item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="text-[#f0f0f0] hover:text-[#2f80ff]">{item.title}</a> : <span className="text-[#f0f0f0]">{item.title}</span>}
                <span className="text-right text-[#8a8f99]">{item.source}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : activeTopTab === '公司概况' ? (
      <F10Page bundle={bundle} />
    ) : (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 min-w-[900px] overflow-y-auto overflow-x-hidden border-r border-[#2a2d33] scrollbar-thin">
        <div className="flex min-h-[980px] flex-col">
          <div className="relative h-[560px] flex-shrink-0 border-b border-[#2a2d33]"><KlineCanvas data={bundle.kline} maVisible={maVisible} hoverIndex={hoverIndex} onHover={handleHover} />{hoverPoint && <div className="pointer-events-none absolute z-[9999] min-w-[180px] rounded border border-[#2f80ff]/70 bg-[#171a20] p-2 text-[11px] text-[#f0f0f0] shadow-2xl" style={{ left: Math.min((hoverPosition?.x || 64) + 14, 720), top: Math.max((hoverPosition?.y || 24) - 10, 12) }}><div>{hoverPoint.date}</div><div>开 {hoverPoint.open.toFixed(2)} 高 {hoverPoint.high.toFixed(2)}</div><div>低 {hoverPoint.low.toFixed(2)} 收 {hoverPoint.close.toFixed(2)}</div><div>量 {hoverPoint.volume.toLocaleString()}</div><div>DIF {(hoverPoint.dif ?? 0).toFixed(2)} DEA {(hoverPoint.dea ?? 0).toFixed(2)} MACD {(hoverPoint.macd ?? 0).toFixed(2)}</div><div>MA5 {(hoverPoint.ma5 ?? 0).toFixed(2)} MA10 {(hoverPoint.ma10 ?? 0).toFixed(2)}</div><div>MA20 {(hoverPoint.ma20 ?? 0).toFixed(2)} MA60 {(hoverPoint.ma60 ?? 0).toFixed(2)}</div></div>}</div>
          <div className="h-[200px] flex-shrink-0 border-b border-[#2a2d33]"><VolumeCanvas data={bundle.kline} hoverIndex={hoverIndex} onHover={handleHover} /></div>
          <div className="h-[220px] flex-shrink-0"><MacdCanvas data={bundle.kline} hoverIndex={hoverIndex} onHover={handleHover} /></div>
        </div>
      </div>
      <aside className="w-[420px] flex flex-col bg-[#121419]">
        <div className="basis-[68%] min-h-0"><StockInfoPanel bundle={bundle} showChip /></div>
        <div className="basis-[32%] min-h-0 border-t border-[#2a2d33] bg-[#171a20] p-2"><div className="mb-1 text-xs font-semibold">资金流向</div><CapitalFlowDonut data={bundle.capitalFlow} /></div>
      </aside>
    </div>
    )}
  </div>;
}

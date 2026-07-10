import { useEffect, useMemo, useState } from 'react';
import MarketSentiment from './MarketSentiment';
import LimitUpTable from './LimitUpTable';
import StockAttributePanel from './StockAttributePanel';
import SimilarStockSection from './SimilarStockSection';
import { heatStocks } from '../../data/heatData';
import { HeatStock, SimilarStock } from '../../types/heat';
import { HeatDataBundle, loadHeatData } from '../../services/heatService';

export default function HeatPage() {
  const [heatData, setHeatData] = useState<HeatDataBundle>({ heatStocks, sentimentHistory: [], subjectBlocks: [], similarStocks: [] });
  const [selectedStock, setSelectedStock] = useState<HeatStock>(heatStocks[0]);
  const [selectedSimilar, setSelectedSimilar] = useState<SimilarStock | null>(null);

  useEffect(() => {
    let ignore = false;
    loadHeatData().then((data) => {
      if (ignore) return;
      setHeatData(data);
      setSelectedStock(data.heatStocks[0] || heatStocks[0]);
      setSelectedSimilar(null);
    });
    return () => { ignore = true; };
  }, []);

  const filteredSimilarStocks = useMemo(() => {
    if (!selectedStock) return heatData.similarStocks;
    const industry = selectedStock.题材[0];
    if (!industry) return heatData.similarStocks;
    return heatData.heatStocks
      .filter((s) => s.代码 !== selectedStock.代码 && s.题材[0] === industry)
      .slice(0, 8)
      .map((s, index) => ({
        代码: s.代码,
        名称: s.名称,
        现价: s.现价,
        涨幅: s.涨幅,
        题材标签: s.题材,
        相似度: Math.max(60, 96 - index * 5),
        行业地位: `${s.题材[0]}涨停股，${s.连板数}连板`,
      }));
  }, [selectedStock, heatData]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <MarketSentiment data={heatData.sentimentHistory} />
      <div className="flex-1 flex overflow-hidden border-t border-gray-700">
        <div className="flex flex-col flex-1 overflow-hidden">
          <LimitUpTable
            stocks={heatData.heatStocks}
            onSelectStock={setSelectedStock}
            selectedCode={selectedStock.代码}
          />
          <div className="flex-[1] overflow-auto scrollbar-thin min-h-0 border-t border-gray-700">
            <SimilarStockSection
              stocks={filteredSimilarStocks}
              onSelect={setSelectedSimilar}
              selectedCode={selectedSimilar?.代码}
            />
          </div>
        </div>
        <div className="w-80 border-l border-gray-700 flex flex-col bg-primary-nav overflow-hidden">
          <StockAttributePanel stock={selectedStock} similarStock={selectedSimilar} />
        </div>
      </div>
    </div>
  );
}

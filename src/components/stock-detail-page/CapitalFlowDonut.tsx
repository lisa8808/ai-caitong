import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { StockCapitalFlowItem } from '../../types/stockDetail';

interface Props { data: StockCapitalFlowItem[]; }

export default function CapitalFlowDonut({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', backgroundColor: '#171a20', borderColor: '#2a2d33', textStyle: { color: '#f0f0f0' } },
      legend: { right: 0, top: 'center', orient: 'vertical', textStyle: { color: '#8a8f99', fontSize: 10 } },
      series: [
        { type: 'pie', radius: ['32%', '48%'], center: ['35%', '50%'], data: data.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })), label: { show: false } },
        { type: 'pie', radius: ['56%', '72%'], center: ['35%', '50%'], data: data.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })), label: { color: '#f0f0f0', fontSize: 10, formatter: '{d}%' } },
      ],
    });
    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); chart.dispose(); };
  }, [data]);
  return <div ref={ref} className="h-full w-full" />;
}

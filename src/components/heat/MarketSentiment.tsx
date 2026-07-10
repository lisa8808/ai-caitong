import { useState } from 'react';
import { LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { HelpCircle } from 'lucide-react';
import { SentimentData } from '../../types/heat';

interface Props { data: SentimentData[]; }

export default function MarketSentiment({ data }: Props) {
  const [showFormula, setShowFormula] = useState(false);
  const latest = data[data.length - 1];
  return (
    <div className="grid grid-cols-2 gap-3 p-3">
      <div className="bg-primary-chart rounded p-3 border border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 relative">
            <span className="text-secondary text-xs">市场实热度</span>
            <HelpCircle size={12} className="text-secondary/60 cursor-help" onMouseEnter={() => setShowFormula(true)} onMouseLeave={() => setShowFormula(false)} />
            {showFormula && (
              <div className="pointer-events-none absolute left-0 top-5 z-[9999] w-56 rounded border border-[#2f80ff]/70 bg-[#1A1D23] p-2 text-[10px] shadow-2xl">
                <div className="text-[#f0f0f0] font-semibold mb-1">热度计算公式</div>
                <div className="text-[#8a8f99] leading-relaxed">
                  热度 = min(100,<br />
                  <span className="text-[#FF4D4F]">&nbsp;&nbsp;(涨停家数/80) × 50</span><br />
                  <span className="text-[#FFAA00]">&nbsp;&nbsp;+ (最高板/10) × 30</span><br />
                  <span className="text-[#4096FF]">&nbsp;&nbsp;+ (成功率/100) × 20</span><br />
                </div>
                <div className="mt-1 text-[#8a8f99]">涨停家数贡献 50%，最高板 30%，封板成功率 20%</div>
              </div>
            )}
          </div>
          <span className="text-up text-xl font-bold font-mono">{latest?.热度?.toFixed(0) || '--'}</span>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
              <XAxis dataKey="date" tick={{ fill: '#8C8F98', fontSize: 9 }} axisLine={{ stroke: '#2a2f3a' }} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1E2230', border: '1px solid #3a3f4b', fontSize: 10 }} />
              <Bar dataKey="热度" fill="#FF4D4F" opacity={0.3} barSize={8} />
              <Line type="monotone" dataKey="热度" stroke="#FF4D4F" strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-primary-chart rounded p-3 border border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-secondary text-xs">连板数趋势</span>
          <div className="flex gap-4">
            <span className="text-up text-sm font-mono">
               最高连板 <span className="text-base font-bold">{latest?.最高板 || '--'}</span>
            </span>
            <span className="text-price text-sm font-mono">
               非一字 <span className="text-base font-bold">{latest?.非一字连板数 || '--'}</span>
            </span>
          </div>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
              <XAxis dataKey="date" tick={{ fill: '#8C8F98', fontSize: 9 }} axisLine={{ stroke: '#2a2f3a' }} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: '#1E2230', border: '1px solid #3a3f4b', fontSize: 10 }} />
              <Line type="monotone" dataKey="连板数" stroke="#FF4D4F" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="非一字连板数" stroke="#FFAA00" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-primary-chart rounded p-3 border border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-secondary text-xs">打板成功率 / 炸板率</span>
          <div className="flex gap-4">
            <span className="text-up text-sm font-mono">
               成功率 <span className="text-base font-bold">{latest?.成功率?.toFixed(2) || '--'}%</span>
            </span>
            <span className="text-down text-sm font-mono">
               炸板率 <span className="text-base font-bold">{latest?.炸板率?.toFixed(2) || '--'}%</span>
            </span>
          </div>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
              <XAxis dataKey="date" tick={{ fill: '#8C8F98', fontSize: 9 }} axisLine={{ stroke: '#2a2f3a' }} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: '#1E2230', border: '1px solid #3a3f4b', fontSize: 10 }} />
              <Bar dataKey="成功率" fill="#FF4D4F" opacity={0.4} barSize={6} />
              <Bar dataKey="炸板率" fill="#52C41A" opacity={0.4} barSize={6} />
              <Line type="monotone" dataKey="成功率" stroke="#FF4D4F" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="炸板率" stroke="#52C41A" strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-primary-chart rounded p-3 border border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-secondary text-xs">最高板 / 涨停家数</span>
          <div className="flex gap-4">
            <span className="text-up text-sm font-mono">
               最高板 <span className="text-base font-bold">{latest?.最高板 || '--'}</span>
            </span>
            <span className="text-up text-sm font-mono">
               涨停 <span className="text-base font-bold">{latest?.涨停家数 || '--'}</span>
            </span>
          </div>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
              <XAxis dataKey="date" tick={{ fill: '#8C8F98', fontSize: 9 }} axisLine={{ stroke: '#2a2f3a' }} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: '#1E2230', border: '1px solid #3a3f4b', fontSize: 10 }} />
              <Line type="monotone" dataKey="最高板" stroke="#FF4D4F" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="涨停家数" stroke="#FFAA00" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="跌停家数" stroke="#52C41A" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

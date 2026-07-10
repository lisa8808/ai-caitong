import { useEffect, useRef } from 'react';
import { StockKlinePoint } from '../../types/stockDetail';

interface Props { data: StockKlinePoint[]; hoverIndex: number | null; onHover: (index: number | null, position?: { x: number; y: number }) => void; }

export default function MacdCanvas({ data, hoverIndex, onHover }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const width = rect.width;
    const height = rect.height;
    const pad = { left: 52, right: 10, top: 10, bottom: 18 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;
    const values = data.flatMap((d) => [d.dif || 0, d.dea || 0, d.macd || 0]);
    const maxAbs = Math.max(...values.map(Math.abs), 1);
    const xStep = chartW / data.length;
    const zeroY = pad.top + chartH / 2;
    const yFor = (v: number) => zeroY - v / maxAbs * chartH / 2;
    ctx.fillStyle = '#0f1116';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#2a2d33';
    ctx.beginPath();
    ctx.moveTo(pad.left, zeroY);
    ctx.lineTo(width - pad.right, zeroY);
    ctx.stroke();
    ctx.fillStyle = '#8a8f99';
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText('MACD(12,26,9)', 6, 14);
    data.forEach((point, index) => {
      const macd = point.macd || 0;
      const x = pad.left + index * xStep + xStep / 2;
      ctx.fillStyle = macd >= 0 ? '#ff4444' : '#22bb66';
      ctx.fillRect(x - Math.max(1, xStep * 0.25), Math.min(zeroY, yFor(macd)), Math.max(1, xStep * 0.5), Math.max(1, Math.abs(yFor(macd) - zeroY)));
    });
    [['dif', '#f5f5f5'], ['dea', '#ffd84d']].forEach(([field, color]) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      data.forEach((point, index) => {
        const x = pad.left + index * xStep + xStep / 2;
        const y = yFor(Number(point[field as keyof StockKlinePoint] || 0));
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
    if (hoverIndex !== null) {
      const x = pad.left + hoverIndex * xStep + xStep / 2;
      ctx.strokeStyle = '#6b7280';
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, height - pad.bottom);
      ctx.stroke();
    }
  }, [data, hoverIndex]);
  return <canvas ref={canvasRef} className="h-full w-full" onMouseMove={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onHover(Math.max(0, Math.min(data.length - 1, Math.floor((e.clientX - rect.left - 52) / ((rect.width - 62) / data.length)))), { x: e.clientX - rect.left, y: e.clientY - rect.top + 760 });
  }} onMouseLeave={() => onHover(null)} />;
}

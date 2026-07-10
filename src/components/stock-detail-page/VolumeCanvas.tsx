import { useEffect, useRef } from 'react';
import { StockKlinePoint } from '../../types/stockDetail';

interface Props { data: StockKlinePoint[]; hoverIndex: number | null; onHover: (index: number | null, position?: { x: number; y: number }) => void; }

export default function VolumeCanvas({ data, hoverIndex, onHover }: Props) {
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
    const max = Math.max(...data.map((d) => d.volume || 0));
    const xStep = chartW / data.length;
    ctx.fillStyle = '#0f1116';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#8a8f99';
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText('VOL', 6, 14);
    data.forEach((point, index) => {
      const h = (point.volume / (max || 1)) * chartH;
      ctx.fillStyle = point.close >= point.open ? '#ff4444' : '#22bb66';
      ctx.fillRect(pad.left + index * xStep, pad.top + chartH - h, Math.max(1, xStep * 0.55), h);
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
    onHover(Math.max(0, Math.min(data.length - 1, Math.floor((e.clientX - rect.left - 52) / ((rect.width - 62) / data.length)))), { x: e.clientX - rect.left, y: e.clientY - rect.top + 560 });
  }} onMouseLeave={() => onHover(null)} />;
}

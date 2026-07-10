import { useEffect, useRef } from 'react';
import { StockKlinePoint } from '../../types/stockDetail';

interface Props {
  data: StockKlinePoint[];
  maVisible: Record<string, boolean>;
  hoverIndex: number | null;
  onHover: (index: number | null, position?: { x: number; y: number }) => void;
}

const colors = { bg: '#0f1116', grid: '#2a2d33', text: '#8a8f99', up: '#ff4444', down: '#22bb66', ma5: '#f5f5f5', ma10: '#ffd84d', ma20: '#b66dff', ma60: '#32d27f' };

function resizeCanvas(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext('2d');
  ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { width: rect.width, height: rect.height, ctx };
}

function drawLine(ctx: CanvasRenderingContext2D, data: StockKlinePoint[], field: keyof StockKlinePoint, xFor: (i: number) => number, yFor: (v: number) => number, color: string) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  let started = false;
  data.forEach((point, index) => {
    const value = point[field];
    if (typeof value !== 'number') return;
    const x = xFor(index);
    const y = yFor(value);
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

export default function KlineCanvas({ data, maVisible, hoverIndex, onHover }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const render = () => {
      const { width, height, ctx } = resizeCanvas(canvas);
      if (!ctx) return;
      const pad = { left: 52, right: 10, top: 16, bottom: 20 };
      const chartW = width - pad.left - pad.right;
      const chartH = height - pad.top - pad.bottom;
      const max = Math.max(...data.map((d) => d.high), ...data.map((d) => d.ma60 || d.high));
      const min = Math.min(...data.map((d) => d.low), ...data.map((d) => d.ma60 || d.low));
      const xStep = chartW / data.length;
      const candleW = Math.max(2, xStep * 0.58);
      const xFor = (i: number) => pad.left + i * xStep + xStep / 2;
      const yFor = (v: number) => pad.top + (max - v) / (max - min || 1) * chartH;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = colors.grid;
      ctx.fillStyle = colors.text;
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
      for (let i = 0; i <= 4; i += 1) {
        const y = pad.top + chartH / 4 * i;
        const value = max - (max - min) / 4 * i;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(width - pad.right, y);
        ctx.stroke();
        ctx.fillText(value.toFixed(2), 6, y + 3);
      }

      data.forEach((point, index) => {
        const x = xFor(index);
        const openY = yFor(point.open);
        const closeY = yFor(point.close);
        const highY = yFor(point.high);
        const lowY = yFor(point.low);
        const isUp = point.close >= point.open;
        ctx.strokeStyle = isUp ? colors.up : colors.down;
        ctx.fillStyle = isUp ? colors.up : colors.down;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();
        ctx.fillRect(x - candleW / 2, Math.min(openY, closeY), candleW, Math.max(1, Math.abs(openY - closeY)));
      });

      if (maVisible.ma5) drawLine(ctx, data, 'ma5', xFor, yFor, colors.ma5);
      if (maVisible.ma10) drawLine(ctx, data, 'ma10', xFor, yFor, colors.ma10);
      if (maVisible.ma20) drawLine(ctx, data, 'ma20', xFor, yFor, colors.ma20);
      if (maVisible.ma60) drawLine(ctx, data, 'ma60', xFor, yFor, colors.ma60);

      const highPoint = data.reduce((prev, curr) => curr.high > prev.high ? curr : prev, data[0]);
      const lowPoint = data.reduce((prev, curr) => curr.low < prev.low ? curr : prev, data[0]);
      ctx.fillStyle = colors.text;
      ctx.fillText(`高 ${highPoint.high.toFixed(2)}`, xFor(data.indexOf(highPoint)) + 4, yFor(highPoint.high) - 4);
      ctx.fillText(`低 ${lowPoint.low.toFixed(2)}`, xFor(data.indexOf(lowPoint)) + 4, yFor(lowPoint.low) + 12);

      if (hoverIndex !== null) {
        const x = xFor(hoverIndex);
        ctx.strokeStyle = '#6b7280';
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, height - pad.bottom);
        ctx.stroke();
      }
    };
    render();
    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, [data, maVisible, hoverIndex]);

  return <canvas ref={canvasRef} className="h-full w-full" onMouseMove={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const index = Math.max(0, Math.min(data.length - 1, Math.floor((e.clientX - rect.left - 52) / ((rect.width - 62) / data.length))));
    onHover(index, { x: e.clientX - rect.left, y: e.clientY - rect.top });
  }} onMouseLeave={() => onHover(null)} />;
}

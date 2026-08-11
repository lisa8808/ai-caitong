export interface StockSelectionResponse {
  success: boolean;
  content: string;
  selectedStocks?: Array<Record<string, unknown>>;
  parsedRules?: Record<string, unknown>;
}

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
}

export async function loadStockSelectionReport(prompt: string): Promise<StockSelectionResponse> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) throw new Error('VITE_API_BASE_URL is not configured');
  const response = await fetch(`${apiBaseUrl}/api/stock-selection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || `选股请求失败（HTTP ${response.status}）`);
  }
  const payload = await response.json() as { data?: StockSelectionResponse };
  if (!payload.data?.content) throw new Error('选股服务未返回筛选结果');
  return payload.data;
}

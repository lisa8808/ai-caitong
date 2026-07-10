import { HoldingStock, WatchStock } from '../types/watchlist';
import { accountHoldingStocks, holdingStocks, watchlistStocks } from '../data/watchlistData';

const WATCHLIST_KEY = 'caitong.watchlist.items';
const HOLDINGS_NS = 'caitong.watchlist.holdings';

export type StoredWatchItem = Pick<WatchStock, '证券代码' | '证券名称' | '自选日' | '自选价格'>;
export type StoredHoldingItem = Pick<HoldingStock, '证券代码' | '证券名称' | '持仓数量' | '成本价'>;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

const defaultHoldingsFallback = (accountId: string) => (accountHoldingStocks[accountId] || holdingStocks).map((stock) => ({
  证券代码: stock.证券代码,
  证券名称: stock.证券名称,
  持仓数量: stock.持仓数量,
  成本价: stock.成本价,
}));

export function getStoredWatchlist(): StoredWatchItem[] {
  return readJson<StoredWatchItem[]>(WATCHLIST_KEY, watchlistStocks.map((stock) => ({
    证券代码: stock.证券代码,
    证券名称: stock.证券名称,
    自选日: stock.自选日,
    自选价格: stock.自选价格,
  })));
}

export function saveStoredWatchlist(items: StoredWatchItem[]) {
  writeJson(WATCHLIST_KEY, items);
}

export function getStoredHoldings(accountId: string): StoredHoldingItem[] {
  const key = `${HOLDINGS_NS}.${accountId}`;
  return readJson<StoredHoldingItem[]>(key, defaultHoldingsFallback(accountId));
}

export function saveStoredHoldings(accountId: string, items: StoredHoldingItem[]) {
  const key = `${HOLDINGS_NS}.${accountId}`;
  writeJson(key, items);
}

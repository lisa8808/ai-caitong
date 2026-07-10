import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env.local'));

const PORT = Number(process.env.PORT || 8787);
const TUSHARE_TOKEN = process.env.TUSHARE_TOKEN;
const TUSHARE_URL = 'https://api.tushare.pro';
const CACHE_TTL = 30_000;
const cache = new Map();

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function toTsCode(code) {
  const normalized = String(code).trim().toUpperCase();
  if (normalized.includes('.')) return normalized;
  if (normalized.startsWith('6') || normalized.startsWith('688') || normalized.startsWith('689')) return `${normalized}.SH`;
  return `${normalized}.SZ`;
}

function toLocalCode(tsCode) {
  return String(tsCode).split('.')[0];
}

async function tushare(apiName, params = {}, fields = '') {
  if (!TUSHARE_TOKEN) throw new Error('TUSHARE_TOKEN is not configured');
  const cacheKey = JSON.stringify({ apiName, params, fields });
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;

  const response = await fetch(TUSHARE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_name: apiName, token: TUSHARE_TOKEN, params, fields }),
  });
  if (!response.ok) throw new Error(`Tushare HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.code !== 0) throw new Error(payload.msg || `Tushare code ${payload.code}`);
  const items = payload.data?.items || [];
  const dataFields = payload.data?.fields || [];
  const data = items.map((row) => Object.fromEntries(dataFields.map((field, index) => [field, row[index]])));
  cache.set(cacheKey, { time: Date.now(), data });
  return data;
}

async function getLatestTradeDate() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const tradeDays = await tushare('trade_cal', { exchange: 'SSE', end_date: today, is_open: '1' }, 'cal_date,is_open');
  return tradeDays.map((row) => String(row.cal_date)).sort().at(-1) || today;
}

async function getRecentTradeDates(count) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const start = new Date();
  start.setDate(start.getDate() - Math.max(20, count * 3));
  const startDate = start.toISOString().slice(0, 10).replace(/-/g, '');
  const tradeDays = await tushare('trade_cal', { exchange: 'SSE', start_date: startDate, end_date: today, is_open: '1' }, 'cal_date,is_open');
  return tradeDays.map((row) => String(row.cal_date)).sort().slice(-count);
}

function dateBefore(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

async function getQuote(tsCode, nameMap) {
  const dailyRows = await tushare('daily', { ts_code: tsCode }, 'ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg');
  const latestDaily = dailyRows.sort((a, b) => String(b.trade_date).localeCompare(String(a.trade_date)))[0];
  if (!latestDaily) {
    return {
      code: toLocalCode(tsCode),
      name: nameMap.get(tsCode) || toLocalCode(tsCode),
      price: 0,
      change: 0,
      pctChange: 0,
      speed: 0,
      turnoverRate: 0,
      high: 0,
      low: 0,
    };
  }
  const basicRows = await tushare('daily_basic', { ts_code: tsCode, trade_date: latestDaily.trade_date }, 'ts_code,turnover_rate');
  const basic = basicRows[0] || {};
  return {
    code: toLocalCode(tsCode),
    name: nameMap.get(tsCode) || toLocalCode(tsCode),
    price: Number(latestDaily.close || 0),
    change: Number(latestDaily.change || 0),
    pctChange: Number(latestDaily.pct_chg || 0),
    speed: 0,
    turnoverRate: Number(basic.turnover_rate || 0),
    high: Number(latestDaily.high || 0),
    low: Number(latestDaily.low || 0),
  };
}

async function getQuotes(codes) {
  const tsCodes = codes.map(toTsCode);
  const stockRows = await tushare('stock_basic', { list_status: 'L' }, 'ts_code,name');
  const nameMap = new Map(stockRows.map((row) => [row.ts_code, row.name]));
  return Promise.all(tsCodes.map((tsCode) => getQuote(tsCode, nameMap)));
}

async function getStockDetail(code) {
  const tsCode = toTsCode(code);
  const quote = (await getQuotes([tsCode]))[0];
  const basicRows = await tushare('stock_basic', { ts_code: tsCode }, 'ts_code,name,market,industry,area,list_status');
  const basic = basicRows[0] || {};
  return {
    代码: toLocalCode(tsCode),
    名称: quote?.name || basic.name || toLocalCode(tsCode),
    现价: quote?.price || 0,
    涨跌: quote?.change || 0,
    涨跌幅: quote?.pctChange || 0,
    市场标识: [basic.market, basic.industry, basic.area].filter(Boolean).slice(0, 3),
    行情说明: `Tushare最新交易日行情${basic.list_status ? ` · ${basic.list_status}` : ''}`,
  };
}

async function getChart(code, period = '1min') {
  const tsCode = toTsCode(code);
  const rows = await getKlineRows(tsCode, period);
  const sortedRows = [...rows].sort((a, b) => String(a.trade_time || a.trade_date).localeCompare(String(b.trade_time || b.trade_date)));
  return sortedRows.slice(-120).map((row) => ({
    time: String(row.trade_time || row.trade_date).match(/\d{2}:\d{2}/)?.[0] || String(row.trade_date || row.trade_time).slice(-4).replace(/(\d{2})(\d{2})/, '$1-$2'),
    price: Number(row.close || 0),
    vol: Number(row.vol || 0),
  })).filter((row) => row.price > 0);
}

async function getMoneyflow(code) {
  const tsCode = toTsCode(code);
  const rows = await tushare('moneyflow', { ts_code: tsCode }, 'trade_date,buy_lg_amount,buy_elg_amount,sell_lg_amount,sell_elg_amount,buy_sm_amount,buy_md_amount,sell_sm_amount,sell_md_amount');
  rows.sort((a, b) => String(b.trade_date).localeCompare(String(a.trade_date)));
  const row = rows[0] || {};
  const mainIn = Number(row.buy_lg_amount || 0) + Number(row.buy_elg_amount || 0);
  const mainOut = Number(row.sell_lg_amount || 0) + Number(row.sell_elg_amount || 0);
  const retailIn = Number(row.buy_sm_amount || 0) + Number(row.buy_md_amount || 0);
  const retailOut = Number(row.sell_sm_amount || 0) + Number(row.sell_md_amount || 0);
  const total = mainIn + mainOut + retailIn + retailOut || 1;
  return [
    { name: '主力流入', value: Number((mainIn / total * 100).toFixed(1)), color: '#FF4D4F', label: '主力流入' },
    { name: '主力流出', value: Number((mainOut / total * 100).toFixed(1)), color: '#52C41A', label: '主力流出' },
    { name: '散户流入', value: Number((retailIn / total * 100).toFixed(1)), color: '#FFAA00', label: '散户流入' },
    { name: '散户流出', value: Number((retailOut / total * 100).toFixed(1)), color: '#8C8F98', label: '散户流出' },
  ];
}

async function getLatestDailyByCode(tsCode) {
  const rows = await safeTushare('daily', { ts_code: tsCode }, 'ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,amount');
  return rows.sort((a, b) => String(b.trade_date).localeCompare(String(a.trade_date)))[0];
}

async function getMainNetFlow(tsCode, tradeDate) {
  const rows = await safeTushare('moneyflow', { ts_code: tsCode, trade_date: tradeDate }, 'trade_date,buy_lg_amount,buy_elg_amount,sell_lg_amount,sell_elg_amount');
  const row = rows[0] || {};
  return Number(row.buy_lg_amount || 0) + Number(row.buy_elg_amount || 0) - Number(row.sell_lg_amount || 0) - Number(row.sell_elg_amount || 0);
}

function buildAbnormalCause(stock) {
  const direction = stock.涨幅 >= 0 ? '上行' : '下行';
  const category = stock.涨幅 >= 0 ? '资金驱动 / 情绪扩散' : '资金流出 / 风险偏好下降';
  const flowText = stock.主力净流入 >= 0 ? '主力净流入为正' : '主力净流出';
  const volumeText = stock.量比 > 1 ? `量比${stock.量比.toFixed(2)}，成交活跃度高于常态` : '量比未明显放大';
  return {
    直接诱因: `${stock.所属板块 || '相关'}方向${direction}，${flowText}，${volumeText}`,
    诱因分类: category,
  };
}

async function enrichAbnormalRows(dailyRows, tradeDate) {
  const stockBasics = await safeTushare('stock_basic', { list_status: 'L' }, 'ts_code,name,industry');
  const basicMap = new Map(stockBasics.map((row) => [row.ts_code, row]));
  const basicRows = await safeTushare('daily_basic', { trade_date: tradeDate }, 'ts_code,turnover_rate,volume_ratio');
  const dailyBasicMap = new Map(basicRows.map((row) => [row.ts_code, row]));

  return Promise.all(dailyRows.map(async (row, index) => {
    const basic = basicMap.get(row.ts_code) || {};
    const dailyBasic = dailyBasicMap.get(row.ts_code) || {};
    const stock = {
      序号: index + 1,
      证券代码: toLocalCode(row.ts_code),
      证券名称: basic.name || row.name || toLocalCode(row.ts_code),
      现价: Number(row.close || 0),
      涨幅: Number(row.pct_chg || 0),
      涨跌: Number(row.change || 0),
      涨速: 0,
      换手: Number(dailyBasic.turnover_rate || 0),
      最高: Number(row.high || 0),
      最低: Number(row.low || 0),
      今开: Number(row.open || 0),
      昨收: Number(row.pre_close || 0),
      量比: Number(dailyBasic.volume_ratio || 0),
      所属板块: basic.industry || '未分类行业',
      成交额: Number(row.amount || 0),
      主力净流入: await getMainNetFlow(row.ts_code, tradeDate),
      信息来源: 'Tushare daily / daily_basic / moneyflow',
    };
    return { ...stock, ...buildAbnormalCause(stock) };
  }));
}

async function getAbnormalMovement(codes) {
  const requestedCodes = codes.map(toTsCode);
  let tradeDate = await getLatestTradeDate();
  let dailyRows = [];

  if (requestedCodes.length > 0) {
    dailyRows = (await Promise.all(requestedCodes.map(getLatestDailyByCode))).filter(Boolean);
    tradeDate = dailyRows.map((row) => String(row.trade_date)).sort().at(-1) || tradeDate;
  } else {
    dailyRows = await safeTushare('daily', { trade_date: tradeDate }, 'ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,amount');
  }

  const topRows = dailyRows
    .filter((row) => row.ts_code && Number.isFinite(Number(row.pct_chg)))
    .sort((a, b) => Math.abs(Number(b.pct_chg || 0)) - Math.abs(Number(a.pct_chg || 0)))
    .slice(0, 8);
  const stocks = await enrichAbnormalRows(topRows, tradeDate);

  return {
    tradeDate,
    source: 'Tushare真实行情接口',
    isRealData: stocks.length > 0,
    stocks,
  };
}

async function getGroupPctChange(filterFn) {
  const rows = await tushare('stock_basic', { list_status: 'L' }, 'ts_code,symbol,name,industry,area,market');
  const members = rows.filter(filterFn).slice(0, 20);
  if (members.length === 0) return { pctChange: 0, count: 0 };
  const quotes = await getQuotes(members.map((row) => row.ts_code));
  const validQuotes = quotes.filter((quote) => Number.isFinite(quote.pctChange));
  if (validQuotes.length === 0) return { pctChange: 0, count: 0 };
  const pctChange = validQuotes.reduce((sum, quote) => sum + quote.pctChange, 0) / validQuotes.length;
  return { pctChange: Number(pctChange.toFixed(2)), count: validQuotes.length };
}

async function getRelatedBoards(code) {
  const tsCode = toTsCode(code);
  const basicRows = await tushare('stock_basic', { ts_code: tsCode }, 'ts_code,industry,area,market');
  const basic = basicRows[0] || {};
  let concepts = [];

  try {
    const conceptRows = await tushare('ths_member', { ts_code: tsCode }, 'ts_code,con_code,con_name');
    concepts = conceptRows.map((row) => ({ id: row.con_code || row.con_name, name: row.con_name })).filter((row) => row.id && row.name);
  } catch {
    concepts = [];
  }

  if (concepts.length === 0 && basic.industry) {
    concepts = [{ id: `concept:${basic.industry}`, name: basic.industry }];
  }

  const quote = (await getQuotes([tsCode]))[0];
  const [areaStats, industryStats, marketStats] = await Promise.all([
    basic.area ? getGroupPctChange((row) => row.area === basic.area) : Promise.resolve({ pctChange: 0, count: 0 }),
    basic.industry ? getGroupPctChange((row) => row.industry === basic.industry) : Promise.resolve({ pctChange: 0, count: 0 }),
    basic.market ? getGroupPctChange((row) => row.market === basic.market) : Promise.resolve({ pctChange: 0, count: 0 }),
  ]);
  const withQuoteFallback = (item) => ({ ...item, pctChange: quote?.pctChange || 0, count: 1 });

  return [
    { category: '地域板块', items: basic.area ? [{ id: `area:${basic.area}`, name: basic.area, ...areaStats }] : [] },
    { category: '概念板块', items: concepts.slice(0, 12).map(withQuoteFallback) },
    { category: '其他', items: [basic.industry && { id: `industry:${basic.industry}`, name: basic.industry, ...industryStats }, basic.market && { id: `market:${basic.market}`, name: basic.market, ...marketStats }].filter(Boolean) },
  ];
}

async function getBoardMembers(code) {
  const tsCode = toTsCode(code);
  const targetRows = await tushare('stock_basic', { ts_code: tsCode }, 'ts_code,name,industry');
  const target = targetRows[0];
  if (!target?.industry) return [];
  const rows = await tushare('stock_basic', { list_status: 'L' }, 'ts_code,symbol,name,industry');
  const members = rows.filter((row) => row.industry === target.industry).slice(0, 30);
  const memberCodes = members.map((row) => row.ts_code).filter(Boolean);
  const quotes = await getQuotes(memberCodes);
  const quoteMap = new Map(quotes.map((quote) => [toTsCode(quote.code), quote]));
  return members.map((row) => {
    const quote = quoteMap.get(row.ts_code);
    return {
      code: toLocalCode(row.ts_code),
      name: row.name,
      boardName: target.industry,
      price: quote?.price || 0,
      pctChange: quote?.pctChange || 0,
    };
  });
}

function limitTypeOf(row) {
  return String(row.limit || row.limit_type || row.limit_status || '').toUpperCase();
}

async function getLimitRows(tradeDate) {
  const fields = 'trade_date,ts_code,name,industry,close,pct_chg,first_time,last_time,open_times,limit_times,limit,limit_type';
  let rows = await safeTushare('limit_list_d', { trade_date: tradeDate, limit_type: 'U' }, fields);
  if (rows.length === 0) rows = await safeTushare('limit_list_d', { trade_date: tradeDate }, fields);
  return rows.filter((row) => {
    const type = limitTypeOf(row);
    return !type || type === 'U' || type === 'UP' || type === '涨停';
  });
}

async function isLimitUpOnDate(tsCode, tradeDate) {
  const [dailyRows, limitRows] = await Promise.all([
    safeTushare('daily', { ts_code: tsCode, trade_date: tradeDate }, 'ts_code,trade_date,close'),
    safeTushare('stk_limit', { ts_code: tsCode, trade_date: tradeDate }, 'ts_code,trade_date,up_limit'),
  ]);
  const close = Number(dailyRows[0]?.close || 0);
  const upLimit = Number(limitRows[0]?.up_limit || 0);
  return close > 0 && upLimit > 0 && close >= upLimit * 0.999;
}

async function getLimitStreak(tsCode, tradeDates) {
  let streak = 0;
  for (const tradeDate of [...tradeDates].reverse()) {
    if (await isLimitUpOnDate(tsCode, tradeDate)) streak += 1;
    else break;
  }
  return Math.max(streak, 1);
}

function normalizeTime(value) {
  const raw = String(value || '');
  if (!raw) return '--';
  const digits = raw.replace(/\D/g, '').padStart(6, '0');
  if (digits.length >= 6) return digits.slice(-6).replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3');
  return raw;
}

function heatScore(stock, maxStreak) {
  const streakScore = maxStreak ? stock.连板数 / maxStreak * 50 : 0;
  const openScore = Math.max(0, 25 - stock.开板次数 * 4);
  const pctScore = Math.min(25, Math.abs(stock.涨幅) * 1.5);
  return Number(Math.min(99, streakScore + openScore + pctScore).toFixed(2));
}

async function getHeatData() {
  const tradeDates = await getRecentTradeDates(14);
  const limitRowsByDate = await Promise.all(tradeDates.map((tradeDate) => getLimitRows(tradeDate)));
  const datedLimitRows = tradeDates
    .map((tradeDate, index) => ({ tradeDate, rows: limitRowsByDate[index] || [] }))
    .filter((item) => item.rows.length > 0);
  const effectiveTradeDates = datedLimitRows.map((item) => item.tradeDate);
  const effectiveLimitRows = datedLimitRows.map((item) => item.rows);
  const latestDate = effectiveTradeDates.at(-1) || tradeDates.at(-1) || await getLatestTradeDate();
  const limitSetByDate = effectiveLimitRows.map((rows) => new Set(rows.map((row) => row.ts_code).filter(Boolean)));
  const streakFor = (tsCode, endIndex) => {
    let streak = 0;
    for (let index = endIndex; index >= 0; index -= 1) {
      if (limitSetByDate[index].has(tsCode)) streak += 1;
      else break;
    }
    return Math.max(streak, 1);
  };
  const latestRows = effectiveLimitRows.at(-1) || [];
  const latestCodes = latestRows.slice(0, 80).map((row) => row.ts_code).filter(Boolean);
  const streakPairs = latestCodes.map((tsCode) => [tsCode, streakFor(tsCode, effectiveTradeDates.length - 1)]);
  const streakMap = new Map(streakPairs);
  const maxStreak = Math.max(...streakPairs.map(([, streak]) => Number(streak)), 1);

  const heatStocks = latestRows.slice(0, 80).map((row) => {
    const streak = Number(streakMap.get(row.ts_code) || 1);
    const stock = {
      代码: toLocalCode(row.ts_code),
      名称: row.name || toLocalCode(row.ts_code),
      现价: Number(row.close || 0),
      涨幅: Number(row.pct_chg || 0),
      首次涨停时间: normalizeTime(row.first_time || row.last_time),
      开板次数: Number(row.open_times || 0),
      明涨停概率: 0,
      连板数: streak,
      题材: [row.industry || 'Tushare涨停'].filter(Boolean),
    };
    stock.明涨停概率 = heatScore(stock, maxStreak);
    return stock;
  }).sort((a, b) => b.连板数 - a.连板数 || b.涨幅 - a.涨幅);

  const historyRows = await Promise.all(effectiveTradeDates.map(async (tradeDate, dateIndex) => {
    const rows = effectiveLimitRows[dateIndex] || [];
    const downRows = await safeTushare('limit_list_d', { trade_date: tradeDate, limit_type: 'D' }, 'trade_date,ts_code,limit,limit_type');
    const openRows = rows.filter((row) => Number(row.open_times || 0) > 0);
    const sampleCodes = rows.map((row) => row.ts_code).filter(Boolean);
    const dayStreaks = sampleCodes.map((tsCode) => streakFor(tsCode, dateIndex));
    const 连板数 = dayStreaks.filter((streak) => streak >= 2).length;
    const 非一字连板数 = rows.filter((row, index) => Number(row.open_times || 0) > 0 && Number(dayStreaks[index] || 1) >= 2).length;
    const 涨停家数 = rows.length;
    const 炸板率 = 涨停家数 ? Number((openRows.length / 涨停家数 * 100).toFixed(2)) : 0;
    const 成功率 = Number((100 - 炸板率).toFixed(2));
    const 热度 = Math.min(100, Math.round((涨停家数 / 80) * 50 + (Math.max(...dayStreaks, 0) / 10) * 30 + (成功率 / 100) * 20));
    return {
      date: String(tradeDate).slice(4).replace(/(\d{2})(\d{2})/, '$1-$2'),
      连板数,
      非一字连板数,
      成功率,
      炸板率,
      最高板: Math.max(...dayStreaks, 0),
      涨停家数,
      跌停家数: downRows.length,
      热度,
    };
  }));

  const industryMap = new Map();
  for (const stock of heatStocks) {
    const name = stock.题材[0] || '其他';
    const item = industryMap.get(name) || { 名称: name, 涨幅: 0, 最高连板: 0, 上涨家数: 0, 涨停家数: 0, 下跌家数: 0, 跌停家数: 0, 描述: '' };
    item.涨幅 += stock.涨幅;
    item.最高连板 = Math.max(item.最高连板, stock.连板数);
    item.上涨家数 += stock.涨幅 >= 0 ? 1 : 0;
    item.下跌家数 += stock.涨幅 < 0 ? 1 : 0;
    item.涨停家数 += 1;
    item.描述 = `${name}方向今日涨停${item.涨停家数}家，最高${item.最高连板}连板。数据来自 Tushare 涨跌停与行情接口。`;
    industryMap.set(name, item);
  }
  const subjectBlocks = [...industryMap.values()]
    .map((item) => ({ ...item, 涨幅: Number((item.涨幅 / Math.max(1, item.涨停家数)).toFixed(2)) }))
    .sort((a, b) => b.涨停家数 - a.涨停家数)
    .slice(0, 8);

  const selectedIndustry = heatStocks[0]?.题材[0];
  const similarStocks = heatStocks
    .filter((stock) => stock.题材[0] === selectedIndustry && stock.代码 !== heatStocks[0]?.代码)
    .slice(0, 8)
    .map((stock, index) => ({
      代码: stock.代码,
      名称: stock.名称,
      现价: stock.现价,
      涨幅: stock.涨幅,
      题材标签: stock.题材,
      相似度: Math.max(60, 96 - index * 5),
      行业地位: `${stock.题材[0]}涨停股，${stock.连板数}连板，热度由 Tushare 行情计算。`,
    }));

  return { tradeDate: latestDate, heatStocks, sentimentHistory: historyRows, subjectBlocks, similarStocks };
}

function average(rows, key, end, size) {
  const start = Math.max(0, end - size + 1);
  const slice = rows.slice(start, end + 1).filter((row) => Number.isFinite(Number(row[key])));
  if (slice.length < size) return undefined;
  return slice.reduce((sum, row) => sum + Number(row[key]), 0) / slice.length;
}

function enrichKline(rows) {
  const sortedRows = [...rows].sort((a, b) => String(a.trade_date).localeCompare(String(b.trade_date)));
  let ema12 = 0;
  let ema26 = 0;
  let dea = 0;
  return sortedRows.map((row, index) => {
    const close = Number(row.close || 0);
    ema12 = index === 0 ? close : ema12 * 11 / 13 + close * 2 / 13;
    ema26 = index === 0 ? close : ema26 * 25 / 27 + close * 2 / 27;
    const dif = ema12 - ema26;
    dea = index === 0 ? dif : dea * 8 / 10 + dif * 2 / 10;
    const macd = (dif - dea) * 2;
    return {
      date: String(row.trade_date).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      open: Number(row.open || 0),
      high: Number(row.high || 0),
      low: Number(row.low || 0),
      close,
      volume: Number(row.vol || 0),
      amount: Number(row.amount || 0),
      ma5: average(sortedRows, 'close', index, 5),
      ma10: average(sortedRows, 'close', index, 10),
      ma20: average(sortedRows, 'close', index, 20),
      ma60: average(sortedRows, 'close', index, 60),
      volMa5: average(sortedRows, 'vol', index, 5),
      volMa10: average(sortedRows, 'vol', index, 10),
      dif,
      dea,
      macd,
    };
  });
}

function getQuarterlyProfit(incomeRows) {
  const seen = new Set();
  const rows = [...incomeRows]
    .filter((row) => row.end_date && row.n_income_attr_p !== undefined)
    .filter((row) => {
      if (seen.has(row.end_date)) return false;
      seen.add(row.end_date);
      return true;
    })
    .sort((a, b) => String(a.end_date).localeCompare(String(b.end_date)));
  return rows.map((row, index) => {
    const endDate = String(row.end_date);
    const year = endDate.slice(0, 4);
    const month = endDate.slice(4, 6);
    const current = Number(row.n_income_attr_p || 0);
    const previousSameYear = [...rows.slice(0, index)].reverse().find((item) => String(item.end_date).slice(0, 4) === year);
    const quarterProfit = month === '03' || !previousSameYear ? current : current - Number(previousSameYear.n_income_attr_p || 0);
    return {
      date: `${year}Q${Math.max(1, Math.ceil(Number(month) / 3))}`,
      value: Number((quarterProfit / 100000000).toFixed(2)),
    };
  }).slice(-8);
}

async function safeTushare(apiName, params, fields) {
  try {
    return await tushare(apiName, params, fields);
  } catch {
    return [];
  }
}

async function getKlineRows(tsCode, period) {
  const normalized = String(period || '日');
  const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  if (normalized === '周') return safeTushare('weekly', { ts_code: tsCode, start_date: dateBefore(365 * 3), end_date: endDate }, 'ts_code,trade_date,open,high,low,close,vol,amount');
  if (normalized === '月') return safeTushare('monthly', { ts_code: tsCode, start_date: dateBefore(365 * 8), end_date: endDate }, 'ts_code,trade_date,open,high,low,close,vol,amount');
  if (normalized === '季' || normalized === '年') return safeTushare('monthly', { ts_code: tsCode, start_date: dateBefore(365 * 12), end_date: endDate }, 'ts_code,trade_date,open,high,low,close,vol,amount');
  if (['分时', '5日', '1min', '5min', '15min', '30min', '60min'].includes(normalized)) {
    const freq = normalized === '5min' ? '5min' : normalized === '15min' ? '15min' : normalized === '30min' ? '30min' : normalized === '60min' ? '60min' : '1min';
    const dates = normalized === '5日' ? await getRecentTradeDates(5) : [await getLatestTradeDate()];
    const chunks = await Promise.all(dates.map((tradeDate) => safeTushare('stk_mins', { ts_code: tsCode, trade_date: tradeDate, freq }, 'trade_time,open,high,low,close,vol,amount')));
    const rows = chunks.flat();
    if (rows.length > 0) return rows.map((row) => ({ ...row, trade_date: String(row.trade_time).slice(0, 8) }));
  }
  return safeTushare('daily', { ts_code: tsCode, start_date: dateBefore(365), end_date: endDate }, 'ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount');
}

async function getStockNews(tsCode, name) {
  const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const annRows = await safeTushare('anns', { ts_code: tsCode, start_date: dateBefore(365 * 3), end_date: endDate }, 'ts_code,ann_date,title,url');
  if (annRows.length > 0) return annRows.slice(0, 30).map((row) => ({
    datetime: row.ann_date || row.pub_time || '',
    title: row.title || `${name}相关资讯`,
    source: 'Tushare公告',
    url: row.url,
  }));

  const localCode = toLocalCode(tsCode);
  const majorRows = await safeTushare('major_news', {}, 'pub_time,title,src,url');
  return majorRows
    .filter((row) => String(row.title || '').includes(name) || String(row.title || '').includes(localCode))
    .slice(0, 30)
    .map((row) => ({
      datetime: row.pub_time || '',
      title: row.title || `${name}相关资讯`,
      source: row.src || 'Tushare新闻',
      url: row.url,
    }));
}

async function getFullDetail(code, period = '日') {
  const tsCode = toTsCode(code);
  const localCode = toLocalCode(tsCode);
  const [quote] = await getQuotes([tsCode]);
  const [basicRows, companyRows, dailyRows, klineRows, dailyBasicRows, limitRows, incomeRows, financeRows, holderRows, marginRows, dividendRows, blockRows, moneyflowRows] = await Promise.all([
    safeTushare('stock_basic', { ts_code: tsCode }, 'ts_code,name,market,industry,area,total_share,float_share'),
    safeTushare('stock_company', { ts_code: tsCode }, 'ts_code,chairman,manager,secretary,reg_capital,setup_date,province,city,introduction,website,email,office,employees,main_business,business_scope'),
    safeTushare('daily', { ts_code: tsCode }, 'ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount'),
    getKlineRows(tsCode, period),
    safeTushare('daily_basic', { ts_code: tsCode }, 'ts_code,trade_date,turnover_rate,volume_ratio,pe,pe_ttm,pb,total_mv,circ_mv'),
    safeTushare('stk_limit', { ts_code: tsCode }, 'ts_code,trade_date,up_limit,down_limit'),
    safeTushare('income', { ts_code: tsCode }, 'ts_code,end_date,total_revenue,n_income_attr_p,non_oper_income'),
    safeTushare('fina_indicator', { ts_code: tsCode }, 'ts_code,end_date,grossprofit_margin,netprofit_margin,roe,debt_to_assets'),
    safeTushare('stk_holdernumber', { ts_code: tsCode }, 'ts_code,end_date,holder_num'),
    safeTushare('margin_detail', { ts_code: tsCode }, 'trade_date,rzye,rqyl,rzmre'),
    safeTushare('dividend', { ts_code: tsCode }, 'end_date,ann_date,div_proc,stk_div,cash_div_tax'),
    safeTushare('block_trade', { ts_code: tsCode }, 'trade_date,price,vol,amount'),
    safeTushare('moneyflow', { ts_code: tsCode }, 'trade_date,buy_lg_amount,buy_elg_amount,sell_lg_amount,sell_elg_amount,buy_sm_amount,buy_md_amount,sell_sm_amount,sell_md_amount'),
  ]);

  const basic = basicRows[0] || {};
  const company = companyRows[0] || {};
  const newsRows = await getStockNews(tsCode, quote?.name || basic.name || localCode);
  const sortedDaily = dailyRows.sort((a, b) => String(b.trade_date).localeCompare(String(a.trade_date)));
  const latestDaily = sortedDaily[0] || {};
  const latestBasic = dailyBasicRows.sort((a, b) => String(b.trade_date).localeCompare(String(a.trade_date)))[0] || {};
  const latestLimit = limitRows.sort((a, b) => String(b.trade_date).localeCompare(String(a.trade_date)))[0] || {};
  const latestIncome = incomeRows.sort((a, b) => String(b.end_date).localeCompare(String(a.end_date)))[0] || {};
  const latestFinance = financeRows.sort((a, b) => String(b.end_date).localeCompare(String(a.end_date)))[0] || {};
  const latestHolder = holderRows.sort((a, b) => String(b.end_date).localeCompare(String(a.end_date)))[0] || {};
  const prevHolder = holderRows.sort((a, b) => String(b.end_date).localeCompare(String(a.end_date)))[1] || {};
  const row = moneyflowRows.sort((a, b) => String(b.trade_date).localeCompare(String(a.trade_date)))[0] || {};
  const mainIn = Number(row.buy_lg_amount || 0) + Number(row.buy_elg_amount || 0);
  const mainOut = Number(row.sell_lg_amount || 0) + Number(row.sell_elg_amount || 0);
  const retailIn = Number(row.buy_sm_amount || 0) + Number(row.buy_md_amount || 0);
  const retailOut = Number(row.sell_sm_amount || 0) + Number(row.sell_md_amount || 0);
  const flowTotal = mainIn + mainOut + retailIn + retailOut || 1;
  const price = quote?.price || Number(latestDaily.close || 0);

  return {
    profile: {
      code: localCode,
      name: quote?.name || basic.name || localCode,
      price,
      change: quote?.change || Number(latestDaily.change || 0),
      pctChange: quote?.pctChange || Number(latestDaily.pct_chg || 0),
      tags: ['融通', basic.market || 'A股'].filter(Boolean),
      open: Number(latestDaily.open || 0),
      high: Number(latestDaily.high || 0),
      low: Number(latestDaily.low || 0),
      avg: Number(((Number(latestDaily.high || 0) + Number(latestDaily.low || 0) + price) / 3).toFixed(2)),
      upLimit: Number(latestLimit.up_limit || 0),
      downLimit: Number(latestLimit.down_limit || 0),
      volumeRatio: Number(latestBasic.volume_ratio || 0),
      pe: Number(latestBasic.pe || 0),
      amount: Number(latestDaily.amount || 0),
      totalMv: Number(latestBasic.total_mv || 0),
      circMv: Number(latestBasic.circ_mv || 0),
      totalShare: Number(basic.total_share || 0),
      floatShare: Number(basic.float_share || 0),
      quarterlyProfit: getQuarterlyProfit(incomeRows),
    },
    kline: enrichKline((klineRows.length > 0 ? klineRows : sortedDaily).slice(0, 180)).slice(-140),
    finance: {
      revenue: Number(latestIncome.total_revenue || 0) / 100000000,
      netProfit: Number(latestIncome.n_income_attr_p || 0) / 100000000,
      nonRecurring: Number(latestIncome.non_oper_income || 0) / 100000000,
      cashYoY: 0,
      peTtm: Number(latestBasic.pe_ttm || 0),
      pb: Number(latestBasic.pb || 0),
      peg: 0,
      grossMargin: Number(latestFinance.grossprofit_margin || 0),
      netMargin: Number(latestFinance.netprofit_margin || 0),
      roe: Number(latestFinance.roe || 0),
      debtRatio: Number(latestFinance.debt_to_assets || 0),
    },
    company: {
      chairman: company.chairman,
      manager: company.manager,
      secretary: company.secretary,
      regCapital: Number(company.reg_capital || 0),
      setupDate: company.setup_date,
      province: company.province,
      city: company.city,
      introduction: company.introduction,
      website: company.website,
      email: company.email,
      office: company.office,
      employees: Number(company.employees || 0),
      mainBusiness: company.main_business,
      businessScope: company.business_scope,
    },
    riskPrice: {
      cageUpper: Number((price * 1.02).toFixed(2)),
      cageLower: Number((price * 0.98).toFixed(2)),
      auctionUpper: Number(latestLimit.up_limit || price * 1.1),
      auctionLower: Number(latestLimit.down_limit || price * 0.9),
    },
    shareholder: {
      holderCount: Number(latestHolder.holder_num || 0),
      holderChange: prevHolder.holder_num ? Number(((Number(latestHolder.holder_num || 0) - Number(prevHolder.holder_num)) / Number(prevHolder.holder_num) * 100).toFixed(2)) : 0,
      fundHolding: 0,
      institutionHolding: 0,
      institutionRatio: 0,
    },
    margin: marginRows.slice(0, 5).map((item) => ({ date: item.trade_date, label: '融资融券', value: `融资余额${Number(item.rzye || 0).toFixed(0)}`, extra: `融券余量${Number(item.rqyl || 0).toFixed(0)}` })),
    dividend: dividendRows.slice(0, 5).map((item) => ({ date: item.ann_date || item.end_date, label: item.div_proc || '分红', value: `送股${item.stk_div || 0}`, extra: `派息${item.cash_div_tax || 0}` })),
    blockTrade: blockRows.slice(0, 5).map((item) => ({ date: item.trade_date, label: '大宗交易', value: `${item.price || '--'}元`, extra: `${item.amount || '--'}万` })),
    capitalFlow: [
      { name: '主力流入', value: Number((mainIn / flowTotal * 100).toFixed(1)), color: '#ff4444' },
      { name: '主力流出', value: Number((mainOut / flowTotal * 100).toFixed(1)), color: '#22bb66' },
      { name: '散户流入', value: Number((retailIn / flowTotal * 100).toFixed(1)), color: '#8b1f1f' },
      { name: '散户流出', value: Number((retailOut / flowTotal * 100).toFixed(1)), color: '#0f6b3f' },
    ],
    news: newsRows,
  };
}

async function searchStocks(q) {
  const keyword = q.trim().toLowerCase();
  if (!keyword) return [];
  const rows = await tushare('stock_basic', { list_status: 'L' }, 'ts_code,symbol,name');
  return rows
    .filter((row) => String(row.symbol).includes(keyword) || String(row.name).toLowerCase().includes(keyword))
    .slice(0, 30)
    .map((row) => ({ 证券代码: row.symbol, 证券名称: row.name, 现价: 0 }));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    if (url.pathname === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }
    if (url.pathname === '/api/watchlist/quotes') {
      const codes = (url.searchParams.get('codes') || '').split(',').map((code) => code.trim()).filter(Boolean);
      sendJson(res, 200, { data: await getQuotes(codes) });
      return;
    }
    if (url.pathname === '/api/heat') {
      sendJson(res, 200, { data: await getHeatData() });
      return;
    }
    if (url.pathname === '/api/abnormal-movement') {
      const codes = (url.searchParams.get('codes') || '').split(',').map((code) => code.trim()).filter(Boolean);
      sendJson(res, 200, { data: await getAbnormalMovement(codes) });
      return;
    }
    if (url.pathname === '/api/stocks/search') {
      sendJson(res, 200, { data: await searchStocks(url.searchParams.get('q') || '') });
      return;
    }
    const detailMatch = url.pathname.match(/^\/api\/stocks\/([^/]+)\/detail$/);
    if (detailMatch) {
      sendJson(res, 200, { data: await getStockDetail(detailMatch[1]) });
      return;
    }
    const chartMatch = url.pathname.match(/^\/api\/stocks\/([^/]+)\/chart$/);
    if (chartMatch) {
      sendJson(res, 200, { data: await getChart(chartMatch[1], url.searchParams.get('period') || '1min') });
      return;
    }
    const moneyflowMatch = url.pathname.match(/^\/api\/stocks\/([^/]+)\/moneyflow$/);
    if (moneyflowMatch) {
      sendJson(res, 200, { data: await getMoneyflow(moneyflowMatch[1]) });
      return;
    }
    const boardsMatch = url.pathname.match(/^\/api\/stocks\/([^/]+)\/boards$/);
    if (boardsMatch) {
      sendJson(res, 200, { data: await getRelatedBoards(boardsMatch[1]) });
      return;
    }
    const membersMatch = url.pathname.match(/^\/api\/stocks\/([^/]+)\/members$/);
    if (membersMatch) {
      sendJson(res, 200, { data: await getBoardMembers(membersMatch[1]) });
      return;
    }
    const fullDetailMatch = url.pathname.match(/^\/api\/stocks\/([^/]+)\/full-detail$/);
    if (fullDetailMatch) {
      sendJson(res, 200, { data: await getFullDetail(fullDetailMatch[1], url.searchParams.get('period') || '日') });
      return;
    }
    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

server.listen(PORT, () => {
  console.log(`Tushare proxy listening on http://localhost:${PORT}`);
});

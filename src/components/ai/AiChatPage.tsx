import { useState, useRef, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { Search, Send, Bot, User, BarChart3, TrendingUp, Activity, ClipboardList, Target, ShieldAlert, Loader2, FileText, X } from 'lucide-react';
import AiReviewModal, { ReviewOption } from './AiReviewModal';
import { StockItem } from '../../types';
import { holdingStocks } from '../../data/watchlistData';

const hotTags = ['立讯精密', '药明康德', '美的集团', '海康威视', '中信证券'];
const industries = ['IT设备', '专用机械', '汽车零部件', '电子器件', '生物医药', '新材料', '新能源', '半导体', '消费电子', '通信设备', '软件开发', '化工'];
const sectors = ['新能源车', '人工智能', '光伏', '军工', '芯片', '5G', '云计算', '储能', '机器人', '低空经济', '钠电池', '算力租赁'];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

interface ReportRecord {
  id?: string;
  summary: string;
  time: string;
  content: string;
  status?: 'generating' | 'done';
}

interface ResultColumn {
  key: string;
  title: string;
  align?: 'left' | 'right';
  render: (stock: StockItem) => string;
  className?: (stock: StockItem) => string;
}

const initialRecords: ReportRecord[] = [
  { summary: '券商板块集体走强异动解读', time: '2026-05-21 14:30', content: '' },
  { summary: '市场中期趋势研判分析报告', time: '2026-05-21 11:15', content: '' },
  { summary: '5月21日A股市场复盘总结', time: '2026-05-21 16:45', content: '' },
  { summary: '光伏组件价格触底信号解读', time: '2026-05-20 09:20', content: '' },
  { summary: '消费电池产业链趋势研判', time: '2026-05-19 15:00', content: '' },
];

const botReplies: Record<string, string> = {
  default: '这是一个很好的问题。基于当前市场数据和量化模型分析，我为您梳理了相关信息。市场整体情绪偏暖，建议关注业绩确定性较强的细分赛道。',
  筛选: '根据您的筛选条件，目前共匹配到6只标的。从估值角度看，隆基绿能PE仅12.5倍，处于历史低位；立讯精密PE16.8倍，具备消费电子+汽车电子双轮驱动逻辑。建议重点关注PE低于20且营收增速超过20%的标的。',
  异动: '今日券商板块异动明显，中信证券盘中涨停，东方财富涨超12%。驱动因素主要有：1）两市成交额突破2万亿；2）证监会发布资本市场改革新政；3）北向资金大幅净流入超百亿。短期情绪面强劲，但需注意追高风险。',
  趋势: '从技术面看，上证指数突破4100点关键压力位，MACD金叉确认，量能温和放大。市场主线仍围绕AI算力、新能源、创新药三大方向轮动。短期支撑位4050点，压力位4250点。建议仓位控制在6-7成。',
  复盘: '📊 今日A股市场复盘报告\n\n一、大盘概况\n三大指数全线上涨，上证指数+1.2%报4120.38点，深证成指+1.8%报13520.15点，创业板指+2.3%报2850.62点。两市成交额突破2.1万亿，涨停家数102家，跌停仅3家，市场情绪高涨。\n\n二、板块表现\n涨幅居前：算力租赁（+5.6%）、新能源车（+4.2%）、创新药（+3.8%）\n跌幅居前：地产服务（-0.8%）、银行（-0.3%）\n\n三、资金流向\n北向资金净流入142.6亿，主力资金净流入通信设备、半导体板块。\n\n四、连板高度\n连板高度升至7板（AI应用方向），市场赚钱效应显著。',
  策略: '当前建议采取「核心+卫星」配置策略：核心仓位配置沪深300ETF（40%），卫星仓位分配AI算力（20%）、新能源（20%）、消费电子（10%）、现金（10%）。在美联储降息周期开启的背景下，成长风格占优。',
  风控: '当前市场风险提示：1）人民币汇率波动风险，USDCNY逼近7.4关口；2）部分高位题材股获利盘回吐压力；3）地产链信用风险仍需警惕。建议设置5%止损线，避免追涨杀跌，关注中报业绩预告窗口期。',
  总结: '📊 今日市场热点行业复盘\n\nTOP1：通信设备  +3.82%\n  成交额 485亿 | 龙头：中兴通讯 +6.2%、烽火通信 +4.8%\n  驱动逻辑：5G-A商用加速推进，运营商资本开支超预期\n\nTOP2：半导体  +3.15%\n  成交额 620亿 | 龙头：中芯国际 +4.1%\n  驱动逻辑：国产替代政策持续加码\n\nTOP3：新能源车  +2.68%\n  成交额 410亿 | 龙头：比亚迪 +3.1%\n  驱动逻辑：5月新能源乘用车零售销量同比+38%',
};

const quickActions = [
  { icon: Target, label: '标的筛选', key: '筛选' },
  { icon: Activity, label: '异动解读', key: '异动' },
  { icon: TrendingUp, label: '趋势判断', key: '趋势' },
  { icon: ClipboardList, label: '复盘总结', key: '复盘' },
  { icon: BarChart3, label: '策略选择', key: '策略' },
  { icon: ShieldAlert, label: '风控提示', key: '风控' },
];

function now() {
  const d = new Date();
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function getStockSeed(stock: StockItem) {
  return `${stock.证券代码}${stock.证券名称}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getResultColumns(query: string): ResultColumn[] {
  const normalized = query.toLowerCase();
  const columns: ResultColumn[] = [
    { key: 'code', title: '股票代码', render: (stock) => stock.证券代码 },
    { key: 'name', title: '股票名称', render: (stock) => stock.证券名称 },
    { key: 'price', title: '最新', align: 'right', render: (stock) => stock.现价.toFixed(2) },
    {
      key: 'change',
      title: '今日涨幅',
      align: 'right',
      render: (stock) => `${stock.涨幅 >= 0 ? '+' : ''}${stock.涨幅.toFixed(2)}%`,
      className: (stock) => stock.涨幅 >= 0 ? 'text-up' : 'text-down',
    },
  ];

  if (normalized.includes('pe') || query.includes('市盈率')) {
    columns.push({
      key: 'pe',
      title: 'PE',
      align: 'right',
      render: (stock) => (8 + (getStockSeed(stock) % 320) / 10).toFixed(1),
    });
  }

  if (normalized.includes('ma') || query.includes('均线') || query.includes('移动平均')) {
    columns.push(
      {
        key: 'ma5',
        title: 'MA5',
        align: 'right',
        render: (stock) => (stock.现价 * (0.97 + (getStockSeed(stock) % 7) / 100)).toFixed(2),
      },
      {
        key: 'ma10',
        title: 'MA10',
        align: 'right',
        render: (stock) => (stock.现价 * (0.95 + (getStockSeed(stock) % 9) / 100)).toFixed(2),
      },
    );
  }

  return columns;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatSelectedScope(stocks: string[], industries: string[], sectors: string[]) {
  const parts = [
    industries.length > 0 && `行业：${industries.join('、')}`,
    sectors.length > 0 && `概念：${sectors.join('、')}`,
    stocks.length > 0 && `标的：${stocks.join('、')}`,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join('；') : '未选择特定范围，基于全市场样例数据生成';
}

function buildReviewReport(review: ReviewOption, displayStocks: StockItem[], scope: string) {
  const date = new Date().toLocaleDateString('zh-CN');
  const styleText = review.style === 'trading' ? '实战复盘' : review.style === 'mixed' ? '投研归档 + 交易观察' : '投研归档';
  const topStocks = displayStocks.slice(0, 5);
  const stockRows = topStocks.map((stock) => `| ${stock.证券代码} | ${stock.证券名称} | ${stock.现价.toFixed(2)} | ${stock.涨幅 >= 0 ? '+' : ''}${stock.涨幅.toFixed(2)}% |`).join('\n');

  const sections: Record<ReviewOption['title'], string> = {
    板块热点: `## 三、热点板块分析\n- 今日主线集中在高弹性成长方向，需重点观察成交额能否继续放大。\n- 领涨板块若能保持龙头股强度和板块内扩散，短线持续性更强。\n- 若明日冲高回落且成交缩量，说明资金更偏向轮动而非趋势主升。\n\n## 四、龙头与扩散\n${stockRows || '| - | - | - | - |'}\n\n## 五、明日观察\n- 观察龙头个股是否继续强于板块指数。\n- 观察板块成交额是否维持在高位。\n- 观察低位补涨个股是否扩散。`,
    市场复盘: `## 三、市场结构分析\n- 指数层面重点关注量价配合，放量上涨更利于趋势延续。\n- 情绪层面重点看涨跌家数、连板高度和高位股反馈。\n- 资金层面重点看北向资金、主力资金是否与热点方向一致。\n\n## 四、样例关注标的\n${stockRows || '| - | - | - | - |'}\n\n## 五、明日观察\n- 指数能否在关键位置放量站稳。\n- 热点主线是否继续集中。\n- 高位题材是否出现明显亏钱效应。`,
    个股复盘: `## 三、个股表现分析\n${topStocks.map((stock) => `### ${stock.证券名称}（${stock.证券代码}）\n- 今日表现：现价 ${stock.现价.toFixed(2)}，涨幅 ${stock.涨幅 >= 0 ? '+' : ''}${stock.涨幅.toFixed(2)}%。\n- 复盘重点：结合所属题材、资金承接和均线位置判断持续性。\n- 明日观察：关注开盘强弱、量能变化和关键支撑位。`).join('\n\n') || '暂无选股结果，建议补充个股列表后生成更完整复盘。'}\n\n## 四、风险提示\n- 个股波动受题材、业绩、流动性和市场情绪共同影响。\n- 若放量冲高后回落，需要警惕短线资金兑现。`,
    操作复盘: `## 三、周期交易数据总览（技能结果量化）\n| 模块 | 指标 | 本期数据 | 技能解读 |\n| --- | --- | --- | --- |\n| 账户核心数据 | 期初资金 / 期末资金 / 当期盈亏 / 收益率 | 未提供 | 需补充后才能判断收益是否来自体系能力。 |\n| 交易行为数据 | 总交易笔数 / 盈利笔数 / 亏损笔数 / 胜率 | 未提供 | 建议按笔记录，避免只凭主观感受复盘。 |\n| 风控波动数据 | 最大回撤 / 单笔最大盈亏 / 平均盈亏比 | 未提供 | 缺少该项会导致无法定位风险控制能力。 |\n| 交易效率数据 | 空仓天数 / 频繁交易天数 / 合规交易占比 / 情绪化交易占比 | 未提供 | 后续应重点量化体系内交易比例。 |\n\n## 四、当期市场认知技能复盘（底层研判能力）\n### 1. 大盘周期研判技能\n- 当期大盘周期定义：未提供完整指数和量能数据，暂按当前样例市场归为结构性行情观察。\n- 个人研判结果：待补充交易前对指数、量能、情绪周期的判断。\n- 研判偏差分析：重点检查是否存在把震荡行情当趋势行情、忽视指数破位风险、错判量能趋势等问题。\n\n### 2. 题材主线甄别技能\n- 市场真实主线、支线、退潮题材：待补充当日主线和退潮方向。\n- 个人题材取舍动作：需记录是否聚焦主线，是否参与杂毛题材。\n- 技能短板：重点检查主线聚焦能力、龙头辨识度和题材持续性判断。\n\n### 3. 市场情绪解读技能\n- 核心情绪指标：连板高度、炸板率、涨跌家数、资金流向均待补充。\n- 个人情绪应对策略：需复盘是否在高位激进、低位恐慌或混沌行情盲目出手。\n\n## 五、单笔交易技能拆解（核心落地复盘）\n### （一）盈利交易｜正向技能固化\n- 标的名称 + 代码：待补充。\n- 选股技能：检查是否来自主线题材、趋势突破或超跌低吸，是否有技术面、基本面、资金面或政策面依据。\n- 择时技能：拆解入场节点是否在情绪回暖、板块启动或分歧低吸；出场是否在压力到位、题材分歧或情绪退潮。\n- 仓位技能：判断仓位是否匹配行情确定性，是否存在赚小钱轻仓的问题。\n- 操作纪律：确认是否严格执行体系规则，无情绪化操作。\n- 核心可复用技能：把有效动作沉淀为下一期可复用 SOP。\n\n### （二）亏损交易｜负向技能纠错\n- 标的名称 + 代码：待补充。\n- 亏损根源技能定位：认知研判失误 / 选股技能缺陷 / 择时能力不足 / 仓位管理失控 / 纪律执行失效 / 情绪化操作。\n- 认知层面：是否错判市场周期、题材强度、资金情绪。\n- 选股层面：是否买入非主流杂毛、无板块联动、无资金抱团、逻辑不支撑标的。\n- 择时层面：是否逆势操作、高位追涨、节点踏错。\n- 仓位层面：是否重仓试错、亏损加仓、仓位与确定性不匹配。\n- 纪律层面：是否破位不止损、盈利不止盈、侥幸扛单、频繁换股。\n\n### （三）踏空/观望交易｜机会判断技能复盘\n- 当期确定性优质机会：待补充。\n- 踏空核心原因：主线识别滞后 / 龙头辨识度不足 / 恐高心理 / 持仓分散 / 等待过度。\n- 机会取舍技能优化：把可识别、可执行的机会转化为下期观察清单。\n\n## 六、个人交易技能短板汇总（系统性问题沉淀）\n1. 市场研判技能短板：需补充交易前对周期和量能的判断记录。\n2. 选股筛选技能短板：重点检查是否偏爱低位杂毛、龙头聚焦能力弱、只看价格不看逻辑。\n3. 买卖择时技能短板：重点检查启动期不敢进、高潮期盲目追、退潮期不愿走。\n4. 仓位管理技能短板：重点检查赚小钱轻仓、亏大钱重仓、无动态调仓逻辑。\n5. 风控纪律技能短板：重点检查止损不坚决、不会分批止盈、亏损后报复交易。\n6. 心态执行技能短板：重点检查贪婪拿不住、恐惧不敢上、侥幸扛亏损。\n\n## 七、当期成熟盈利技能固化（标准化动作沉淀）\n1. 行情适配技能：明确强势、震荡、弱势、混沌行情下的重仓、轻仓、空仓标准。\n2. 选股标准化技能：主线优先、龙头优先、联动优先，剔除无逻辑、无资金、无板块联动标的。\n3. 入场标准化技能：固定低吸/突破入场形态、量能条件和确认信号。\n4. 持仓标准化技能：跟踪板块联动、资金承接、关键均线和动态调仓条件。\n5. 止盈止损标准化技能：用支撑压力位、分批规则和极端行情预案约束操作。\n\n## 八、下期技能迭代计划（精准提升方案）\n### 1. 重点提升核心技能\n- 优先提升：主线甄别能力、仓位与确定性匹配能力。\n- 训练方法：每日复盘主线强度，记录每笔交易是否属于体系内机会。\n\n### 2. 新增交易技能规则\n- 选股：只做主线、龙头或板块联动明确的标的。\n- 择时：只在启动确认、分歧低吸或趋势回踩确认时入场。\n- 风控：单笔亏损达到预设阈值必须执行，不允许临盘改规则。\n- 仓位：仓位必须和行情确定性匹配，试错仓不得重仓。\n\n### 3. 禁止性交易红线\n1. 禁止无计划追高。\n2. 禁止亏损后情绪化加仓。\n3. 禁止无止损位开仓。\n\n### 4. 下期量化考核指标\n- 合规交易占比：目标 ≥ 80%。\n- 情绪化交易：目标降为 0。\n- 单笔亏损：控制在预设阈值内。\n- 整体盈亏比：目标 ≥ 1.5。\n\n## 九、技能成长总结与认知迭代\n1. 当期交易核心成长：从结果复盘转向技能复盘，关注动作是否可复制。\n2. 最致命的能力漏洞：没有数据记录时，无法判断问题来自认知、选股、择时、仓位还是纪律。\n3. 交易认知升级：稳定复利依赖机械化、标准化、纪律化交易，而不是单次盈亏。\n4. 长期技能迭代方向：聚焦可复制交易技能，弱化主观情绪，持续淘汰错误交易习惯。`,
  };

  return `# ${review.title}报告 - ${date}\n\n## 一、报告信息\n- 复盘类型：${review.title}\n- 报告风格：${styleText}\n- 复盘范围：${scope}\n- 生成说明：本报告基于当前页面样例行情、已选范围和用户点击的复盘类型生成，用于盘后归档和交易复盘。\n\n## 二、核心结论\n- 当前市场需要同时关注主线持续性、成交量配合和高位股反馈。\n- 已选范围会影响右侧选股结果，报告中的样例标的来自当前选股结果。\n- 后续操作应避免只看涨幅，需结合资金、位置、风险收益比做判断。\n\n## 关键标的概览\n| 股票代码 | 股票名称 | 最新 | 今日涨幅 |\n| --- | --- | --- | --- |\n${stockRows || '| - | 暂无数据 | - | - |'}\n\n${sections[review.title]}\n\n## 六、风险与免责声明\n- 以上内容为基于页面样例数据生成的复盘文本，不构成投资建议。\n- 真实交易需结合实时行情、基本面、资金流和个人风险承受能力独立判断。`;
}

function markdownToPrintHtml(markdown: string) {
  const lines = markdown.split('\n');
  const htmlLines: string[] = [];
  let inList = false;
  let inTable = false;
  let tableRows: string[] = [];

  const closeList = () => {
    if (inList) {
      htmlLines.push('</ul>');
      inList = false;
    }
  };

  const closeTable = () => {
    if (inTable) {
      htmlLines.push('<table>');
      tableRows.forEach((row, index) => {
        const cells = row.replace(/^\||\|$/g, '').split('|').map((cell) => escapeHtml(cell.trim()));
        if (cells.every((cell) => /^[-: ]+$/.test(cell))) return;
        const tag = index === 0 ? 'th' : 'td';
        htmlLines.push(`<tr>${cells.map((cell) => `<${tag}>${cell}</${tag}>`).join('')}</tr>`);
      });
      htmlLines.push('</table>');
    }
    inTable = false;
    tableRows = [];
  };

  lines.forEach((line) => {
    if (line.trim().startsWith('|') && line.includes('|')) {
      closeList();
      inTable = true;
      tableRows.push(line);
      return;
    }

    closeTable();
    if (!line.trim()) {
      closeList();
      return;
    }
    if (line.startsWith('# ')) {
      closeList();
      htmlLines.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      closeList();
      htmlLines.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      closeList();
      htmlLines.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith('- ')) {
      if (!inList) {
        htmlLines.push('<ul>');
        inList = true;
      }
      htmlLines.push(`<li>${escapeHtml(line.slice(2))}</li>`);
    } else {
      closeList();
      htmlLines.push(`<p>${escapeHtml(line)}</p>`);
    }
  });

  closeList();
  closeTable();
  return htmlLines.join('\n');
}

function printReviewPdf(title: string, content: string) {
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Songti SC', 'Heiti SC', Arial, sans-serif; color: #172033; line-height: 1.72; margin: 0; background: #eef2f7; }
    .toolbar { position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; align-items: center; padding: 10px 18px; background: #111827; color: #fff; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18); }
    .toolbar-title { font-size: 13px; font-weight: 600; }
    .toolbar button { border: 0; border-radius: 6px; padding: 7px 12px; background: #2563eb; color: #fff; font-size: 12px; cursor: pointer; }
    .page { max-width: 820px; min-height: 1120px; margin: 24px auto; padding: 42px 52px; background: #fff; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.12); }
    h1 { font-size: 26px; margin: 0 0 18px; padding-bottom: 14px; border-bottom: 3px solid #1f4fd8; }
    h2 { font-size: 18px; color: #123a8c; margin-top: 24px; border-left: 4px solid #1f4fd8; padding-left: 10px; }
    h3 { font-size: 15px; color: #344054; margin-top: 18px; }
    p, li { font-size: 13px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 12px; }
    th { background: #eef4ff; color: #123a8c; }
    th, td { border: 1px solid #d0d5dd; padding: 7px 9px; text-align: left; }
    ul { padding-left: 20px; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none; }
      .page { max-width: none; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-title">${escapeHtml(title)}</div>
    <button onclick="window.print()">保存/打印 PDF</button>
  </div>
  <main class="page">${markdownToPrintHtml(content)}</main>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, '_blank', 'width=960,height=720');
  if (!opened) {
    URL.revokeObjectURL(url);
    return false;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}

interface Props {
  stocks?: StockItem[];
}

export default function AiChatPage({ stocks }: Props) {
  const defaultStocks: StockItem[] = holdingStocks.map((h) => ({
    序号: h.序号,
    证券代码: h.证券代码,
    证券名称: h.证券名称,
    现价: h.现价,
    涨幅: h.今日涨幅,
    涨跌: 0,
    涨速: 0,
    换手: 0,
    最高: h.现价,
    最低: h.现价,
    今开: h.现价,
    昨收: h.现价,
    量比: 0,
  }));
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  const filterDisplayStocks = useMemo(() => {
    const matchedNames = new Set<string>();

    selectedStocks.forEach((n) => matchedNames.add(n));

    if (selectedIndustries.length > 0) {
      const map: Record<string, string[]> = {
        '新能源': ['宁德时代', '阳光电源', '亿纬锂能'],
        '半导体': ['中芯国际', '北方华创', '韦尔股份'],
        '汽车零部件': ['比亚迪', '福耀玻璃', '均胜电子'],
        '新材料': ['隆基绿能', '万华化学', '恩捷股份'],
        '生物医药': ['药明康德', '恒瑞医药', '迈瑞医疗'],
        '消费电子': ['立讯精密', '歌尔股份', '蓝思科技'],
        'IT设备': ['海康威视', '大华股份', '浪潮信息'],
        '专用机械': ['三一重工', '中联重科', '徐工机械'],
        '电子器件': ['京东方A', 'TCL科技', '深天马A'],
        '通信设备': ['中兴通讯', '烽火通信', '亨通光电'],
        '软件开发': ['金山办公', '用友网络', '深信服'],
        '化工': ['万华化学', '恒力石化', '荣盛石化'],
      };
      selectedIndustries.flatMap((ind) => map[ind] || []).forEach((n) => matchedNames.add(n));
    }

    if (selectedSectors.length > 0) {
      const map: Record<string, string[]> = {
        '新能源车': ['比亚迪', '宁德时代', '亿纬锂能'],
        '光伏': ['隆基绿能', '阳光电源', '通威股份'],
        '芯片': ['中芯国际', '北方华创', '卓胜微'],
        '储能': ['宁德时代', '阳光电源', '派能科技'],
        '机器人': ['汇川技术', '埃斯顿', '绿的谐波'],
        '人工智能': ['科大讯飞', '商汤科技', '寒武纪'],
        '5G': ['中兴通讯', '烽火通信', '信维通信'],
        '云计算': ['金山办公', '用友网络', '广联达'],
        '低空经济': ['万丰奥威', '中信海直', '纵横股份'],
        '钠电池': ['宁德时代', '传艺科技', '维科技术'],
        '算力租赁': ['浪潮信息', '中科曙光', '鸿博股份'],
      };
      selectedSectors.flatMap((sec) => map[sec] || []).forEach((n) => matchedNames.add(n));
    }

    if (matchedNames.size > 0) {
      const source = stocks && stocks.length > 0 ? [...stocks] : [...defaultStocks];
      const existing = source.filter((s) => matchedNames.has(s.证券名称));
      const existingNames = new Set(existing.map((s) => s.证券名称));
      const missing = [...matchedNames].filter((n) => !existingNames.has(n));
      const synthetic = missing.map((name) => {
        const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const basePrice = 30 + (seed % 300);
        const pct = ((seed % 20) - 5);
        return {
          序号: 0, 证券代码: `AI${seed}`, 证券名称: name,
          现价: parseFloat(basePrice.toFixed(2)),
          涨幅: parseFloat(pct.toFixed(2)),
          涨跌: 0, 涨速: 0, 换手: 0,
          最高: 0, 最低: 0, 今开: 0, 昨收: 0, 量比: 0,
        };
      });
      const merged = [...existing, ...synthetic];
      const seen = new Set<string>();
      return merged.filter((s) => seen.has(s.证券名称) ? false : (seen.add(s.证券名称), true));
    }

    return stocks && stocks.length > 0 ? [...stocks] : [...defaultStocks];
  }, [stocks, selectedStocks.join(','), selectedIndustries.join(','), selectedSectors.join(',')]);

  const displayStocks = filterDisplayStocks;

  const isFiltered = !!(stocks || selectedStocks.length > 0 || selectedIndustries.length > 0 || selectedSectors.length > 0);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '您好！我是您的量化智能助手。您可以提出关于个股筛选、行业异动或策略建议的问题，例如：「帮我筛选 PE 低于 20 的高成长电子股」', time: now() },
  ]);
  const [input, setInput] = useState('');
  const [resultQuery, setResultQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [reviewGeneratingTitle, setReviewGeneratingTitle] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [historyRecords, setHistoryRecords] = useState<ReportRecord[]>(initialRecords);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState('筛选');
  const [logoImage, setLogoImage] = useState<string | null>('/caitong-finance/logo.jpg');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultColumns = useMemo(() => getResultColumns(input.trim() || resultQuery), [input, resultQuery]);

  const quickPrompts: Record<string, string> = {
    筛选: '帮我筛选PE低于20的高成长电子股',
    异动: '今天券商板块为什么异动？',
    趋势: '分析一下当前大盘趋势和支撑位',
    复盘: '帮我复盘今天的市场情况',
    策略: '给我一个当前市场的配置策略建议',
    风控: '当前市场有哪些风险需要注意？',
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, reviewGeneratingTitle]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => [...prev, { role, content, time: now() }]);
  };

  const toggleArr = (setArr: Dispatch<SetStateAction<string[]>>, val: string) => {
    setArr((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };

  const handleSend = (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || isTyping) return;
    setResultQuery(trimmedText);
    addMessage('user', trimmedText);
    setInput('');
    setIsTyping(true);
    setReviewGeneratingTitle(null);

    const selectedInfo = [
      selectedIndustries.length > 0 && `行业:${selectedIndustries.join('、')}`,
      selectedSectors.length > 0 && `概念:${selectedSectors.join('、')}`,
      selectedStocks.length > 0 && `标的:${selectedStocks.join('、')}`,
    ].filter(Boolean).join('，');

    const context = selectedInfo ? `[已选范围：${selectedInfo}] ` : '';

    const matchedKey = Object.keys(botReplies).find((k) => trimmedText.includes(k));
    const reply = context + (botReplies[matchedKey || ''] || botReplies.default);

    setTimeout(() => {
      setIsTyping(false);
      addMessage('assistant', reply);
      if (matchedKey === '复盘' || matchedKey === '总结') {
        const nowDate = new Date();
        const dateStr = nowDate.toLocaleDateString('zh-CN');
        const timeStr = nowDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const record: ReportRecord = {
          summary: `${dateStr}A股${matchedKey === '复盘' ? '复盘' : '行业热点'}分析报告`,
          time: `${dateStr} ${timeStr}`,
          content: reply,
        };
        setHistoryRecords((prev) => [record, ...prev]);
        setSelectedReport(record);
      }
    }, 1200 + Math.random() * 800);
  };

  const handleQuickAction = (key: string) => {
    setSelectedAction(key);
    if (key === '复盘') {
      setShowReviewModal(true);
    } else {
      const prompt = quickPrompts[key] || '';
      setInput(prompt);
      setResultQuery(prompt);
    }
  };

  const handleTagClick = (tag: string) => {
    toggleArr(setSelectedStocks, tag);
  };

  const handleReviewSelect = (review: ReviewOption) => {
    setShowReviewModal(false);
    setInput(review.prompt);
    setResultQuery(review.prompt);
    setReviewGeneratingTitle(review.title);
    setIsTyping(true);
    addMessage('user', review.prompt);

    const reportId = `${Date.now()}-${review.title}`;
    const nowDate = new Date();
    const dateStr = nowDate.toLocaleDateString('zh-CN');
    const timeStr = nowDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const pendingRecord: ReportRecord = {
      id: reportId,
      summary: `${dateStr}${review.title}报告`,
      time: `${dateStr} ${timeStr}`,
      content: '',
      status: 'generating',
    };
    setHistoryRecords((prev) => [pendingRecord, ...prev]);
    setSelectedReport(null);

    setTimeout(() => {
      const scope = formatSelectedScope(selectedStocks, selectedIndustries, selectedSectors);
      const reportContent = buildReviewReport(review, displayStocks, scope);
      const record: ReportRecord = {
        id: reportId,
        summary: `${dateStr}${review.title}报告`,
        time: `${dateStr} ${timeStr}`,
        content: reportContent,
        status: 'done',
      };

      setIsTyping(false);
      setReviewGeneratingTitle(null);
      addMessage('assistant', `已生成《${review.title}报告》，可点击右侧报告记录打开。`);
      setHistoryRecords((prev) => prev.map((item) => item.id === reportId ? record : item));
      setSelectedReport(null);
    }, 900);
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-56 bg-gradient-to-bl from-indigo-900/30 via-gray-900 to-gray-900 border-r border-gray-700/50 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700/50">
          <h3 className="text-white text-xs font-semibold">选股</h3>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin p-3" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div>
            <h4 className="text-neutral text-xs mb-2 font-medium">股票筛选</h4>
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                placeholder="输入代码或名称..."
                className="w-full pl-7 pr-2 py-1.5 text-xs rounded bg-[#12151A] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSend((e.target as HTMLInputElement).value)}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {hotTags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-2 py-0.5 text-xs rounded cursor-pointer transition-colors ${
                    selectedStocks.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/50 text-secondary hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-neutral text-xs mb-2 font-medium">行业分析（申万）</h4>
            <div className="flex gap-1 flex-wrap">
              {industries.map((ind) => (
                <button
                  key={ind}
                  onClick={() => toggleArr(setSelectedIndustries, ind)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedIndustries.includes(ind)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/30 text-secondary hover:bg-gray-600'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-neutral text-xs mb-2 font-medium">板块概念</h4>
            <div className="flex gap-1 flex-wrap">
              {sectors.map((sec) => (
                <button
                  key={sec}
                  onClick={() => toggleArr(setSelectedSectors, sec)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedSectors.includes(sec)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/30 text-secondary hover:bg-gray-600'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-neutral text-xs mb-2 font-medium">持仓股票</h4>
            <div className="flex gap-1 flex-wrap">
              {holdingStocks.map((h) => (
                <span
                  key={h.证券代码}
                  onClick={() => toggleArr(setSelectedStocks, h.证券名称)}
                  className={`px-2 py-1 text-[10px] rounded cursor-pointer transition-colors ${
                    selectedStocks.includes(h.证券名称)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/30 text-secondary hover:bg-gray-600'
                  }`}
                >
                  {h.证券名称}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gradient-to-br from-indigo-900/20 via-gray-900 to-blue-900/20">
        <div className="px-4 py-3 border-b border-gray-700/50">
          <span className="text-white text-xs font-semibold">分析</span>
        </div>
        <div className={`flex-1 p-4 ${messages.length > 1 ? 'overflow-auto scrollbar-thin space-y-4' : 'overflow-hidden'}`}>
          {messages.length <= 1 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 -mt-8">
              {/* Logo */}
              <div className="relative group cursor-pointer" onClick={handleLogoClick} title="点击替换Logo">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <div className="absolute inset-0 w-20 h-20 rounded-full bg-blue-500/10 animate-pulse" style={{ transform: 'scale(1.4)' }} />
                <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-blue-500/20" style={{ transform: 'scale(1.2)' }} />
                <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 overflow-hidden ${logoImage ? '' : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600'}`}>
                  {logoImage ? (
                    <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                      <rect x="6" y="8" width="26" height="22" rx="3" stroke="white" strokeWidth="2" fill="none" opacity="0.9" />
                      <path d="M2 14h4M32 14h4M2 24h4M32 24h4" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                      <path d="M19 8l-2 4h4l-2-4z" fill="white" opacity="0.7" />
                      <circle cx="19" cy="20" r="4" stroke="white" strokeWidth="2" fill="none" />
                      <circle cx="19" cy="20" r="1.5" fill="white" opacity="0.8" />
                      <path d="M15 26l4-4M23 26l-4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                    </svg>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v6M2 5h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-1.5 tracking-wide">财瞳金融</h2>
                <p className="text-xs text-[#8A919E] tracking-wider">AI量化分析 · 智能决策辅助 · 实时市场洞察</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {[
                  { q: '今日涨幅最高的板块有哪些？', icon: '📈' },
                  { q: '帮我筛选低估值高成长标的', icon: '🔍' },
                  { q: '当前市场资金流向如何？', icon: '💰' },
                  { q: '推荐3只短线关注的个股', icon: '🎯' },
                ].map((item) => (
                  <div key={item.q} onClick={() => handleSend(item.q)} className="p-2.5 rounded-lg bg-[#242730] border border-gray-700/50 cursor-pointer hover:border-blue-500/50 hover:bg-[#2a3040] transition-colors group">
                    <div className="flex items-start gap-2">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-xs text-[#E6EDF7] group-hover:text-blue-400 transition-colors leading-relaxed">{item.q}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-blue-500/20">
                    <Bot size={13} className="text-white" />
                  </div>
                )}
                <div className={`${msg.role === 'user' ? 'items-end' : ''} max-w-[78%]`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] text-gray-500">{msg.role === 'assistant' ? 'AI助手' : '我'}</span>
                  </div>
                  <div
                    className={`px-4 py-2.5 text-xs leading-relaxed animate-[fadeIn_0.3s_ease] whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-md shadow-md shadow-blue-500/20'
                        : 'bg-[#1E2230] text-[#E6EDF7] rounded-2xl rounded-tl-md border border-[#2C303A]/50'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-600 mt-0.5 block">{msg.time}</span>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={13} className="text-white" />
                  </div>
                )}
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                <Bot size={13} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] text-gray-500">AI助手</span>
                </div>
                <div className="px-4 py-2.5 rounded-2xl rounded-tl-md bg-[#1E2230] border border-[#2C303A]/50 flex items-center gap-1.5">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-secondary text-xs">
                    {reviewGeneratingTitle ? `正在生成${reviewGeneratingTitle}报告` : '正在分析'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t border-gray-700/50 relative">
          {showReviewModal && <AiReviewModal onClose={() => setShowReviewModal(false)} onSelect={handleReviewSelect} />}
          <div className="flex justify-between mb-3">
            {quickActions.map(({ icon: Icon, label, key }) => (
              <button
                key={label}
                onClick={() => handleQuickAction(key)}
                className={`flex flex-col items-center gap-1 transition-colors group ${selectedAction === key ? 'text-blue-400' : 'text-secondary hover:text-blue-400'}`}
              >
                <Icon size={18} className={`transition-colors ${selectedAction === key ? 'text-blue-400' : 'group-hover:text-blue-400'}`} />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="请输入股票/行业/板块问题，例如：帮我筛选电子行业的高股息个股..."
              className="flex-1 px-4 py-2 text-xs rounded-lg bg-[#12151A] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={isTyping}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="w-72 bg-gradient-to-br from-indigo-900/20 via-gray-900 to-blue-900/20 border-l border-gray-700/50 flex flex-col overflow-hidden">
        {selectedReport ? (
          <>
            <div className="p-3 border-b border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText size={16} className="text-blue-400 flex-shrink-0" />
                <h3 className="text-white text-xs font-semibold truncate">{selectedReport.summary}</h3>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-gray-500 hover:text-white transition-colors ml-2">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden scrollbar-thin p-3">
              <pre className="text-xs text-neutral/90 leading-relaxed whitespace-pre-wrap font-sans">{selectedReport.content}</pre>
            </div>
          </>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-xs font-semibold">选股结果</h3>
                <span className="text-blue-400 text-xs">
                  {displayStocks.length}{isFiltered ? '个股票' : '只持仓股票'}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-auto scrollbar-thin border-b border-gray-700/50">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-[#1A1D23] z-10">
                  <tr className="text-secondary border-b border-gray-700/50">
                    {resultColumns.map((column) => (
                      <th key={column.key} className={`py-2 px-3 font-normal whitespace-nowrap ${column.align === 'right' ? 'text-right' : 'text-left'}`}>
                        {column.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayStocks.map((s, idx) => {
                    return (
                      <tr key={`${s.证券代码}-${s.证券名称}`} className={`border-b border-gray-800 hover:bg-gray-700/30 cursor-pointer transition-colors ${idx%2===0?'bg-primary-bg':'bg-primary-chart'}`}>
                        {resultColumns.map((column) => (
                          <td
                            key={column.key}
                            className={`py-1.5 px-3 whitespace-nowrap ${column.align === 'right' ? 'text-right font-mono' : ''} ${column.className?.(s) || 'text-neutral'}`}
                          >
                            {column.render(s)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex-1 overflow-auto scrollbar-thin px-3 py-2 border-t border-gray-700/50">
              <h3 className="text-white text-xs font-semibold mb-3">报告记录</h3>
              <div className="space-y-2">
                {historyRecords.map((rec, idx) => (
                  <div
                    key={rec.id || idx}
                    onClick={() => {
                      if (rec.status === 'generating') return;
                      setSelectedReport(rec);
                      if (rec.content) {
                        printReviewPdf(rec.summary, rec.content);
                      }
                    }}
                    className={`p-2 rounded bg-[#242730] transition-colors group ${rec.status === 'generating' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:bg-gray-700/50'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-neutral text-xs group-hover:text-blue-400 transition-colors truncate">{rec.summary}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${rec.status === 'generating' ? 'bg-blue-500/15 text-blue-300' : 'bg-gray-700/60 text-gray-400'}`}>
                        {rec.status === 'generating' ? '生成中' : '点击打开'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {rec.status === 'generating' && <Loader2 size={10} className="text-blue-400 animate-spin" />}
                      <span className="text-gray-500 text-xs">{rec.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

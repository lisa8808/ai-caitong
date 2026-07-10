import { StockDetailBundle } from '../../types/stockDetail';

interface Props {
  bundle: StockDetailBundle;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded border border-[#2a2d33] bg-[#171a20]">
      <div className="border-b border-[#2a2d33] px-4 py-2 text-sm font-semibold">{title}</div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function KvRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between py-1.5 text-xs">
      <span className="text-[#8a8f99]">{label}</span>
      <span className={color || 'text-[#f0f0f0]'}>{value}</span>
    </div>
  );
}

function TableSection({ title, columns, data }: { title: string; columns: string[]; data: Array<Record<string, string | number>> }) {
  if (!data.length) return null;
  return (
    <div className="mb-4 rounded border border-[#2a2d33] bg-[#171a20]">
      <div className="border-b border-[#2a2d33] px-4 py-2 text-sm font-semibold">{title}</div>
      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#2a2d33] text-[#8a8f99]">
              {columns.map((col) => <th key={col} className="px-4 py-2 text-left font-normal">{col}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2d33]">
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => <td key={col} className="px-4 py-2 text-[#f0f0f0]">{row[col] ?? '--'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function F10Page({ bundle }: Props) {
  const { profile, finance, company, shareholder, margin, dividend, blockTrade } = bundle;

  const fmtNum = (v: number) => {
    if (Math.abs(v) >= 1e8) return (v / 1e8).toFixed(2) + '亿';
    if (Math.abs(v) >= 1e4) return (v / 1e4).toFixed(2) + '万';
    return v.toFixed(2);
  };

  const marginTable = margin.map((item) => ({
    日期: item.date || '--',
    类型: item.label || '--',
    详情: item.value || '--',
    备注: item.extra || '',
  }));

  const dividendTable = dividend.map((item) => ({
    公告日: item.date || '--',
    进度: item.label || '--',
    方案: item.value || '--',
    备注: item.extra || '',
  }));

  const blockTable = blockTrade.map((item) => ({
    日期: item.date || '--',
    类型: item.label || '--',
    价格: item.value || '--',
    金额: item.extra || '',
  }));

  return (
    <div className="flex-1 overflow-auto p-4 scrollbar-thin">
      <div className="mx-auto max-w-5xl">

        <Section title="公司概况">
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <KvRow label="公司名称" value={profile.name} />
              <KvRow label="股票代码" value={profile.code} />
              <KvRow label="总市值" value={fmtNum(profile.totalMv)} />
              <KvRow label="流通市值" value={fmtNum(profile.circMv)} />
              <KvRow label="总股本" value={fmtNum(profile.totalShare)} />
              <KvRow label="流通股本" value={fmtNum(profile.floatShare)} />
            </div>
            <div>
              {company.chairman && <KvRow label="董事长" value={company.chairman} />}
              {company.manager && <KvRow label="总经理" value={company.manager} />}
              {company.secretary && <KvRow label="董秘" value={company.secretary} />}
              {company.province && <KvRow label="省份" value={company.province} />}
              {company.city && <KvRow label="城市" value={company.city} />}
              {company.employees && <KvRow label="员工人数" value={company.employees.toLocaleString()} />}
              {company.website && <KvRow label="网站" value={company.website} />}
              {company.regCapital && <KvRow label="注册资本" value={fmtNum(company.regCapital)} />}
              {company.setupDate && <KvRow label="成立日期" value={company.setupDate} />}
            </div>
          </div>
          {company.mainBusiness && (
            <div className="mt-3 border-t border-[#2a2d33] pt-3">
              <div className="mb-1 text-xs text-[#8a8f99]">主营业务</div>
              <div className="text-xs leading-relaxed text-[#f0f0f0]">{company.mainBusiness}</div>
            </div>
          )}
          {company.businessScope && (
            <div className="mt-3 border-t border-[#2a2d33] pt-3">
              <div className="mb-1 text-xs text-[#8a8f99]">经营范围</div>
              <div className="text-xs leading-relaxed text-[#f0f0f0]">{company.businessScope}</div>
            </div>
          )}
        </Section>

        <Section title="财务指标">
          <div className="grid grid-cols-3 gap-x-8 gap-y-1">
            <KvRow label="营业收入" value={fmtNum(finance.revenue) + '元'} />
            <KvRow label="净利润" value={fmtNum(finance.netProfit) + '元'} />
            <KvRow label="扣非净利润" value={fmtNum(finance.nonRecurring) + '元'} />
            <KvRow label="市盈率(TTM)" value={finance.peTtm ? finance.peTtm.toFixed(2) : '--'} />
            <KvRow label="市净率" value={finance.pb ? finance.pb.toFixed(2) : '--'} />
            <KvRow label="PEG" value={finance.peg ? finance.peg.toFixed(2) : '--'} />
            <KvRow label="毛利率" value={finance.grossMargin ? finance.grossMargin.toFixed(2) + '%' : '--'} />
            <KvRow label="净利率" value={finance.netMargin ? finance.netMargin.toFixed(2) + '%' : '--'} />
            <KvRow label="ROE" value={finance.roe ? finance.roe.toFixed(2) + '%' : '--'} />
            <KvRow label="资产负债率" value={finance.debtRatio ? finance.debtRatio.toFixed(2) + '%' : '--'} />
          </div>
        </Section>

        <Section title="股东信息">
          <div className="grid grid-cols-2 gap-x-8">
            <KvRow label="股东人数" value={shareholder.holderCount ? shareholder.holderCount.toLocaleString() : '--'} />
            <KvRow label="股东人数变化" value={shareholder.holderChange ? shareholder.holderChange.toFixed(2) + '%' : '--'} color={shareholder.holderChange < 0 ? 'text-[#22bb66]' : shareholder.holderChange > 0 ? 'text-[#ff4444]' : undefined} />
            <KvRow label="基金持股" value={shareholder.fundHolding ? fmtNum(shareholder.fundHolding) : '--'} />
            <KvRow label="机构持股" value={shareholder.institutionHolding ? fmtNum(shareholder.institutionHolding) : '--'} />
            <KvRow label="机构持股比例" value={shareholder.institutionRatio ? shareholder.institutionRatio.toFixed(2) + '%' : '--'} />
          </div>
        </Section>

        {marginTable.length > 0 && <TableSection title="融资融券" columns={['日期', '类型', '详情', '备注']} data={marginTable} />}
        {dividendTable.length > 0 && <TableSection title="分红送股" columns={['公告日', '进度', '方案', '备注']} data={dividendTable} />}
        {blockTable.length > 0 && <TableSection title="大宗交易" columns={['日期', '类型', '价格', '金额']} data={blockTable} />}

      </div>
    </div>
  );
}

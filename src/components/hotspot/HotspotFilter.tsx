import { useState, useRef, useEffect } from 'react';
import { Calendar, Search, ArrowUpDown, ChevronDown, ChevronRight, X } from 'lucide-react';
import { SOURCE_TREE, ALL_SOURCES } from '../../types/hotspot';

interface Props {
  startDate: string;
  endDate: string;
  selectedSources: Set<string>;
  sortAsc: boolean;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onSourcesChange: (sources: Set<string>) => void;
  onSortToggle: () => void;
  onQuery: () => void;
}

export default function HotspotFilter({
  startDate, endDate, selectedSources, sortAsc,
  onStartDateChange, onEndDateChange, onSourcesChange, onSortToggle, onQuery,
}: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleExpand = (cat: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const toggleCategory = (cat: typeof SOURCE_TREE[0]) => {
    const next = new Set(selectedSources);
    const allSelected = cat.children.every((c) => selectedSources.has(c));
    if (allSelected) {
      cat.children.forEach((c) => next.delete(c));
    } else {
      cat.children.forEach((c) => next.add(c));
    }
    onSourcesChange(next);
  };

  const toggleChild = (child: string) => {
    const next = new Set(selectedSources);
    next.has(child) ? next.delete(child) : next.add(child);
    onSourcesChange(next);
  };

  const clearSources = () => onSourcesChange(new Set());
  const selectAll = () => onSourcesChange(new Set(ALL_SOURCES));

  const hasSelection = selectedSources.size > 0;
  const totalChildren = ALL_SOURCES.length;

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-primary-nav border-b border-gray-700">
      <div className="flex items-center gap-1.5 text-secondary text-xs">
        <Calendar size={14} />
        <input
          type="text"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          placeholder="开始日期"
          className="w-24 px-2 py-1 text-xs rounded bg-primary-bg border border-gray-600 text-neutral focus:outline-none focus:border-gray-400"
        />
        <span className="text-secondary">—</span>
        <input
          type="text"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          placeholder="结束日期"
          className="w-24 px-2 py-1 text-xs rounded bg-primary-bg border border-gray-600 text-neutral focus:outline-none focus:border-gray-400"
        />
      </div>

      {/* 来源 二级联动多选 */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded border transition-colors ${
            hasSelection ? 'border-blue-500 text-blue-400 bg-blue-600/10' : 'border-gray-600 text-secondary bg-primary-bg hover:border-gray-400 hover:text-white'
          }`}
        >
          来源{hasSelection ? `(${selectedSources.size}/${totalChildren})` : ': 可选'}
          <ChevronDown size={12} />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-[#1A1D23] border border-gray-600 rounded-lg shadow-2xl z-50 py-1">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700">
              <button onClick={selectAll} className="text-[10px] text-blue-400 hover:text-blue-300">全选</button>
              <button onClick={clearSources} className="text-[10px] text-secondary hover:text-white">清空</button>
            </div>
            {SOURCE_TREE.map((cat) => {
              const allSelected = cat.children.every((c) => selectedSources.has(c));
              const someSelected = cat.children.some((c) => selectedSources.has(c));
              const isExpanded = expanded.has(cat.label);
              return (
                <div key={cat.label}>
                  <div
                    className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => toggleExpand(cat.label)}
                  >
                    {isExpanded ? <ChevronDown size={12} className="text-secondary" /> : <ChevronRight size={12} className="text-secondary" />}
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={() => toggleCategory(cat)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3 w-3 rounded border-gray-500 bg-primary-bg accent-blue-600"
                    />
                    <span className="text-xs text-neutral ml-1">{cat.label}</span>
                  </div>
                  {isExpanded &&
                    cat.children.map((child) => (
                      <label key={child} className="flex items-center gap-1 px-3 py-1.5 pl-10 hover:bg-gray-700/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSources.has(child)}
                          onChange={() => toggleChild(child)}
                          className="h-3 w-3 rounded border-gray-500 bg-primary-bg accent-blue-600"
                        />
                        <span className="text-xs text-secondary">{child}</span>
                      </label>
                    ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 已选来源标签 */}
      {hasSelection && (
        <div className="flex items-center gap-1 flex-1 overflow-hidden">
          {ALL_SOURCES.filter((s) => selectedSources.has(s)).map((s) => (
            <span key={s} className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 whitespace-nowrap">
              {s}
              <button onClick={() => toggleChild(s)} className="hover:text-white"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}

      <button
        onClick={onSortToggle}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary-bg border border-gray-600 text-secondary hover:text-white hover:border-gray-400 transition-colors whitespace-nowrap"
      >
        <ArrowUpDown size={12} />
        分值{sortAsc ? '升序' : '降序'}
      </button>

      <button
        onClick={onQuery}
        className="flex items-center gap-1.5 px-4 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        <Search size={12} />
        查询
      </button>
    </div>
  );
}

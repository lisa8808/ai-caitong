#!/usr/bin/env python3
"""Build context text for risk control analysis."""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any


def _fmt(value: Any, suffix: str = "") -> str:
    if value is None or value == "":
        return "-"
    return f"{value}{suffix}"


def build_context(payload: dict[str, Any]) -> str:
    risk_rows = payload.get("risk_rows") or []
    holdings = payload.get("holdings") or []
    signals = payload.get("risk_signals") or []
    abnormal_ref = payload.get("abnormalConclusionRef") or ""
    trend_ref = payload.get("trendConclusionRef") or ""
    data_status = payload.get("data_status") or {}
    lines: list[str] = ["## 风控研判输入上下文", ""]
    lines.append("数据源约束：挖矿/回测结果不参与本 Skill 计算，若 payload 包含相关字段应忽略。")
    lines.append("")
    lines.append("### 数据同步状态")
    lines.append(f"- 行情数据同步: {_fmt(data_status.get('marketSynced'))}")
    lines.append(f"- 持仓数据同步: {_fmt(data_status.get('holdingsSynced'))}")
    lines.append(f"- 舆情预警同步: {_fmt(data_status.get('sentimentAlertsSynced'))}")
    lines.append("")
    lines.append("### 持仓风险扫描")
    if risk_rows:
        for row in risk_rows:
            lines.append(f"- {row.get('ts_code', '-')} {row.get('name', '-')} 持仓状态={row.get('position_status', '-')} 风险={row.get('risk_level', '-')} 类型={', '.join(row.get('risk_types', [])) or '-'} 操作={row.get('operation', '-')}")
    elif holdings:
        for h in holdings:
            lines.append(f"- {h.get('ts_code', '-')} {h.get('name', '-')} 持仓状态={h.get('position_status', '-')} 涨跌={_fmt(h.get('pct_chg'), '%')} 回撤={_fmt(h.get('drawdown'), '%')}")
    else:
        lines.append("- 无持仓/自选数据")
    lines.append("")
    lines.append("### 风险信号清单")
    for sig in signals[:30]:
        lines.append(f"- [{sig.get('ts_code') or '全局'}] {sig.get('detail', '-')} 来源={sig.get('source', '-')} 类型={sig.get('type', '-')} 置信度={_fmt(sig.get('confidence'))} 持续性={_fmt(sig.get('persistent'))}")
    lines.append("")
    if abnormal_ref:
        lines.append("### 异动解读交叉引用")
        lines.append(abnormal_ref)
    if trend_ref:
        lines.append("### 趋势研判交叉引用")
        lines.append(trend_ref)
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", help="Input JSON file. Defaults to stdin.")
    args = parser.parse_args()
    text = open(args.input, "r", encoding="utf-8").read() if args.input else sys.stdin.read()
    payload = json.loads(text or "{}")
    print(build_context(payload))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

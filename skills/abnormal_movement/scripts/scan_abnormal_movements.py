#!/usr/bin/env python3
"""Scan structured market rows and select abnormal movement candidates.

Input JSON from stdin or --input:
{
  "market_rows": [{"ts_code": "600030.SH", "name": "中信证券", "pct_chg": 10.01}],
  "user_focus": ["600030.SH", "中信证券"]
}
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any


def _num(value: Any) -> float | None:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    return n if n == n else None


def _amount_text(amount: Any, net_inflow: Any) -> str:
    amount_n = _num(amount)
    inflow_n = _num(net_inflow)
    parts: list[str] = []
    if amount_n is not None:
        parts.append(f"成交额{amount_n / 100000000:.2f}亿")
    if inflow_n is not None:
        parts.append(f"净流入{inflow_n / 100000000:.2f}亿")
    return " / ".join(parts) if parts else "-"


def _abnormal_type(row: dict[str, Any]) -> tuple[str | None, str]:
    limit_up_days = int(_num(row.get("limit_up_days")) or 0)
    pct_chg = _num(row.get("pct_chg"))
    if limit_up_days >= 3:
        return "三连板", "三连板及以上"
    if limit_up_days == 2:
        return "两连板", "两连板"
    if pct_chg is not None and pct_chg >= 7:
        return "短期大涨", "涨幅 >= 7%"
    if pct_chg is not None and pct_chg <= -7:
        return "短期大跌", "跌幅 <= -7%"
    net_inflow = _num(row.get("net_inflow"))
    amount = _num(row.get("amount"))
    if net_inflow is not None and abs(net_inflow) >= 300000000:
        return "短期大涨" if net_inflow > 0 else "短期大跌", "资金净流入/流出异常"
    if amount is not None and amount >= 3000000000:
        return "短期大涨" if (pct_chg or 0) >= 0 else "短期大跌", "成交额异常放大"
    return None, ""


def scan(payload: dict[str, Any]) -> dict[str, Any]:
    rows = payload.get("market_rows") or []
    focus = set(payload.get("user_focus") or [])
    abnormal_rows: list[dict[str, Any]] = []

    for row in rows:
        if not isinstance(row, dict):
            continue
        abnormal_type, threshold = _abnormal_type(row)
        if not abnormal_type:
            continue
        code = str(row.get("ts_code") or row.get("code") or "")
        name = str(row.get("name") or "")
        is_user_focus = code in focus or name in focus
        pct_chg = _num(row.get("pct_chg"))
        abnormal_rows.append({
            "ts_code": code,
            "name": name,
            "industry": row.get("industry") or row.get("concept") or "-",
            "abnormal_type": abnormal_type,
            "pct_chg": pct_chg,
            "trigger_threshold": threshold,
            "amount_or_inflow": _amount_text(row.get("amount"), row.get("net_inflow")),
            "is_user_focus": is_user_focus,
            "raw": row,
        })

    abnormal_rows.sort(key=lambda r: (not r["is_user_focus"], -abs(r.get("pct_chg") or 0)))
    return {"success": True, "abnormal_rows": abnormal_rows}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", help="Input JSON file. Defaults to stdin.")
    args = parser.parse_args()
    text = open(args.input, "r", encoding="utf-8").read() if args.input else sys.stdin.read()
    payload = json.loads(text or "{}")
    print(json.dumps(scan(payload), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

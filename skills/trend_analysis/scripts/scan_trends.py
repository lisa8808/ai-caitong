#!/usr/bin/env python3
"""Scan structured market rows and select formed trend candidates."""

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


def _trend(row: dict[str, Any]) -> tuple[str | None, str, str, str]:
    limit_up_days = int(_num(row.get("limit_up_days")) or 0)
    trend_days = int(_num(row.get("trend_days")) or 0)
    pct = _num(row.get("interval_pct_chg") or row.get("pct_chg"))
    slope = _num(row.get("slope")) or 0
    ma5 = _num(row.get("ma5"))
    ma10 = _num(row.get("ma10"))
    if limit_up_days >= 2:
        return "连板趋势", f"{limit_up_days}日", "2连板及以上，短线趋势已成型", "发酵" if limit_up_days == 2 else "高潮"
    if trend_days >= 5 and pct is not None and pct >= 15:
        return "持续上涨", "一周及以上", "多日带斜率上涨，阶段涨幅超过15%", "发酵"
    if trend_days >= 3 and pct is not None and pct <= -10:
        return "持续下跌", f"{trend_days}日", "多日带斜率下跌，阶段跌幅超过10%", "尾声"
    if slope > 0 and ma5 is not None and ma10 is not None and ma5 > ma10:
        return "震荡走强", "一周及以上", "震荡中枢上移，短期均线偏强", "启动"
    return None, "", "", ""


def scan(payload: dict[str, Any]) -> dict[str, Any]:
    rows = payload.get("market_rows") or []
    focus = set(payload.get("user_focus") or [])
    trend_rows: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        trend_type, period, feature, stage = _trend(row)
        if not trend_type:
            continue
        code = str(row.get("ts_code") or row.get("code") or "")
        name = str(row.get("name") or "")
        trend_rows.append({
            "ts_code": code,
            "name": name,
            "industry": row.get("industry") or row.get("concept") or "-",
            "trend_type": trend_type,
            "trend_period": period,
            "interval_pct_chg": _num(row.get("interval_pct_chg") or row.get("pct_chg")),
            "trend_feature": feature,
            "trend_stage": stage,
            "is_user_focus": code in focus or name in focus,
            "raw": row,
        })
    trend_rows.sort(key=lambda r: (not r["is_user_focus"], -abs(r.get("interval_pct_chg") or 0)))
    return {"success": True, "trend_rows": trend_rows}


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

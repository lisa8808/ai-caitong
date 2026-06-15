#!/usr/bin/env python3
import argparse
import html
import re
from datetime import datetime
from pathlib import Path


def slugify(value: str) -> str:
    value = re.sub(r"[\\/:*?\"<>|\s]+", "_", value.strip())
    return value.strip("_") or "review_report"


def markdown_to_html(markdown: str) -> str:
    lines = markdown.splitlines()
    parts = []
    in_list = False
    in_table = False
    table_rows = []

    def close_list():
        nonlocal in_list
        if in_list:
            parts.append("</ul>")
            in_list = False

    def close_table():
        nonlocal in_table, table_rows
        if in_table and table_rows:
            parts.append("<table>")
            for index, row in enumerate(table_rows):
                cells = [html.escape(cell.strip()) for cell in row.strip("|").split("|")]
                tag = "th" if index == 0 else "td"
                if all(re.fullmatch(r"[-: ]+", cell) for cell in cells):
                    continue
                parts.append("<tr>" + "".join(f"<{tag}>{cell}</{tag}>" for cell in cells) + "</tr>")
            parts.append("</table>")
        in_table = False
        table_rows = []

    for raw in lines:
        line = raw.rstrip()
        if "|" in line and line.strip().startswith("|"):
            close_list()
            in_table = True
            table_rows.append(line)
            continue
        close_table()

        if not line.strip():
            close_list()
            continue
        if line.startswith("# "):
            close_list()
            parts.append(f"<h1>{html.escape(line[2:].strip())}</h1>")
        elif line.startswith("## "):
            close_list()
            parts.append(f"<h2>{html.escape(line[3:].strip())}</h2>")
        elif line.startswith("### "):
            close_list()
            parts.append(f"<h3>{html.escape(line[4:].strip())}</h3>")
        elif line.lstrip().startswith("- "):
            if not in_list:
                parts.append("<ul>")
                in_list = True
            parts.append(f"<li>{html.escape(line.lstrip()[2:].strip())}</li>")
        else:
            close_list()
            parts.append(f"<p>{html.escape(line)}</p>")

    close_list()
    close_table()
    return "\n".join(parts)


def build_html(title: str, body: str) -> str:
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>{html.escape(title)}</title>
  <style>
    @page {{ size: A4; margin: 18mm; }}
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Songti SC', 'Heiti SC', Arial, sans-serif; color: #172033; line-height: 1.72; }}
    .cover {{ border-bottom: 3px solid #1f4fd8; padding-bottom: 18px; margin-bottom: 24px; }}
    .meta {{ color: #667085; font-size: 12px; }}
    h1 {{ font-size: 26px; margin: 0 0 8px; }}
    h2 {{ font-size: 18px; color: #123a8c; margin-top: 24px; border-left: 4px solid #1f4fd8; padding-left: 10px; }}
    h3 {{ font-size: 15px; color: #344054; margin-top: 18px; }}
    p, li {{ font-size: 13px; }}
    table {{ border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 12px; }}
    th {{ background: #eef4ff; color: #123a8c; }}
    th, td {{ border: 1px solid #d0d5dd; padding: 7px 9px; text-align: left; }}
    ul {{ padding-left: 20px; }}
  </style>
</head>
<body>
  <section class="cover">
    <h1>{html.escape(title)}</h1>
    <div class="meta">生成时间：{generated_at}</div>
  </section>
  {body}
</body>
</html>"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Render review report Markdown to printable HTML.")
    parser.add_argument("--title", required=True)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output-dir", default="outputs")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    markdown = input_path.read_text(encoding="utf-8")
    body = markdown_to_html(markdown)
    rendered = build_html(args.title, body)
    date = datetime.now().strftime("%Y%m%d")
    html_path = output_dir / f"{slugify(args.title)}_{date}.html"
    html_path.write_text(rendered, encoding="utf-8")
    print(f"HTML generated: {html_path}")
    print("Open this HTML in a browser and choose Print > Save as PDF if a PDF file is needed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
天线原材料价格自动更新脚本。
主要数据源：
  - cngold.org     → 黄金、白银（实时贵金属报价）
  - copper.ccmn.cn → 电解铜（长江现货）
  - alu.ccmn.cn    → 铝锭（长江铝业）
  - jiage.cngold.org → 螺纹钢
  - stainless.ccmn.cn → 不锈钢
纯 Python 标准库，适合 GitHub Actions 运行。
"""
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE_DIR, "app", "_data", "prices.json")

CTX = None
try:
    CTX = urllib.request.ssl.create_default_context()
    CTX.check_hostname = False
    CTX.verify_mode = urllib.request.ssl.CERT_NONE
except Exception:
    pass


def fetch(url, timeout=15):
    """Fetch URL and return decoded HTML."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "zh-CN,zh;q=0.9",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=timeout, context=CTX)
        raw = resp.read()
        for enc in ["utf-8", "gbk", "gb2312", "gb18030"]:
            try:
                return raw.decode(enc)
            except (UnicodeDecodeError, LookupError):
                continue
        return raw.decode("utf-8", errors="ignore")
    except Exception as e:
        return None


def extract_from_table(html, product, low, high):
    """
    从 HTML 表格中提取产品价格。
    product: 产品标识，如 "[铜]"
    low/high: 价格范围
    """
    pattern = rf'{re.escape(product)}.*?<td[^>]*>\s*([\d,.]+)'
    m = re.search(pattern, html, re.DOTALL)
    if m:
        try:
            val = float(m.group(1).replace(",", ""))
            if low <= val <= high:
                return val
        except ValueError:
            pass
    return None


def update_price(data, cat_idx, mat_idx, new_price, unit):
    """更新单一材料价格."""
    mat = data["categories"][cat_idx]["materials"][mat_idx]
    old = mat["currentPrice"]
    mat["currentPrice"] = new_price
    mat["date"] = datetime.now().strftime("%Y-%m-%d")
    if new_price != old:
        pct = abs(new_price - old) / old * 100
        if new_price > old:
            mat["change"] = f"+{pct:.1f}%"
            mat["trend"] = "上涨"
        else:
            mat["change"] = f"-{pct:.1f}%"
            mat["trend"] = "下跌"


def main():
    print("=" * 60)
    print("天线原材料价格更新")
    print("=" * 60)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated = []
    failed = []

    # ==================== 数据源 1: 金银 ====================
    print("\n[1/6] 金银 (cngold.org)...")
    gold_html = fetch("https://www.cngold.org/")
    if gold_html:
        # 黄金: 搜 8xx 元/克
        m = re.search(r'["\u9ec4\u91d1]?[:：]?\s*(\d{3}\.\d{1,2})', gold_html)
        if m:
            price = float(m.group(1))
            if 700 <= price <= 1000:
                update_price(data, 0, 3, price, "元/克")
                updated.append(f"金: {price} 元/克")
        # 白银: 搜 5-50 元/克
        m = re.search(r'["\u767d\u94f6]?[:：]?\s*(\d{1,2}\.\d{1,2})', gold_html)
        if m:
            price = float(m.group(1))
            if 1 <= price <= 100:
                update_price(data, 0, 4, price, "元/克")
                updated.append(f"银: {price} 元/克")
        else:
            failed.append("金银抓取失败")
    else:
        failed.append("cngold.org 加载失败")

    # ==================== 数据源 2: 铜 ====================
    print("[2/6] 电解铜 (copper.ccmn.cn)...")
    cu_html = fetch("https://copper.ccmn.cn/copperprice/cjxh/")
    if cu_html:
        price = extract_from_table(cu_html, "铜", 95000, 115000)
        if price:
            update_price(data, 0, 0, price, "元/吨")
            updated.append(f"电解铜: {price} 元/吨")
        else:
            failed.append("铜价未找到")
    else:
        failed.append("copper.ccmn.cn 加载失败")

    # ==================== 数据源 3: 铝 ====================
    print("[3/6] 铝锭 (alu.ccmn.cn)...")
    alu_html = fetch("https://alu.ccmn.cn/aluprice/cjxh/")
    if alu_html:
        price = extract_from_table(alu_html, "铝", 20000, 28000)
        if price:
            update_price(data, 0, 1, price, "元/吨")
            updated.append(f"铝锭: {price} 元/吨")
        else:
            failed.append("铝价未找到")
    else:
        failed.append("alu.ccmn.cn 加载失败")

    # ==================== 数据源 4: 钢 ====================
    print("[4/6] 螺纹钢 (jiage.cngold.org)...")
    steel_html = fetch("https://jiage.cngold.org/")
    if steel_html:
        price = extract_from_table(steel_html, "螺纹钢", 2500, 5000)
        if price:
            update_price(data, 0, 5, price, "元/吨")
            updated.append(f"螺纹钢: {price} 元/吨")
        else:
            failed.append("螺纹钢价未找到")
    else:
        failed.append("jiage.cngold.org 加载失败")

    # ==================== 数据源 5: 不锈钢 ====================
    print("[5/6] 不锈钢304 (stainless.ccmn.cn)...")
    ss_html = fetch("https://stainless.ccmn.cn/ssprice/cjxh/")
    if ss_html:
        price = extract_from_table(ss_html, "不锈钢304", 12000, 20000)
        if price:
            update_price(data, 0, 2, price, "元/吨")
            updated.append(f"不锈钢304: {price} 元/吨")
        else:
            failed.append("不锈钢价未找到")
    else:
        failed.append("stainless.ccmn.cn 加载失败")

    # ==================== 数据源 6: 工程塑料/PCB/化工类 ====================
    print("[6/6] 其他材料...")
    print("  工程塑料、PCB覆铜板、化工类暂需手动更新")
    manual = [
        (1, "工程塑料", 5),
        (2, "PCB/覆铜板", 4),
        (3, "化工类", 6),
    ]
    for cat_idx, cat_name, mat_count in manual:
        for i in range(mat_count):
            mat = data["categories"][cat_idx]["materials"][i]
            print(f"    ⚠️ {mat['name']}: {mat['currentPrice']} {mat['unit']}")

    # ==================== 输出结果 ====================
    print("\n" + "=" * 60)
    print("更新结果:")
    for u in updated:
        print(f"  ✅ {u}")
    for f in failed:
        print(f"  ❌ {f}")
    print("=" * 60)

    data["lastUpdate"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return len(updated), len(failed)


if __name__ == "__main__":
    updated, failed = main()
    if failed > 0:
        print(f"\n⚠️ {failed} 个材料抓取失败，请检查网络或数据源")
        sys.exit(1)

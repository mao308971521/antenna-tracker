#!/usr/bin/env python3
"""
批量更新 prices.json 中所有材料的价格数据。
主要数据源：
  - jiage.cngold.org  → 铜、铝、钢、锌、铅、镍、锡、黄金、白银等
  - copper.ccmn.cn    → 电解铜（长江现货）
  - stainless.ccmn.cn → 不锈钢
纯 Python 标准库，无需 pip install。
"""
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "_data", "prices.json")

CTX = None
try:
    CTX = urllib.request.ssl.create_default_context()
    CTX.check_hostname = False
    CTX.verify_mode = urllib.request.ssl.CERT_NONE
except Exception:
    pass


def fetch_html(url, timeout=15):
    """Fetch URL and return decoded text."""
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
    except urllib.error.HTTPError as e:
        print(f"  HTTP Error {e.code}: {e.reason}")
        return None
    except Exception as e:
        print(f"  ERROR: {e}", file=sys.stderr)
        return None


def extract_futures_price(html, product_name, price_pattern):
    """
    从期货行情 HTML 表格中提取指定品种的价格。
    product_name: 品种名，如 "沪铜主力"
    price_pattern: 价格附近的正则模式，如 r'沪铜主力.*?(\d+(?:,\d{3})*(?:\.\d+)?)'
    """
    match = re.search(price_pattern, html, re.DOTALL)
    if match:
        raw = match.group(1).replace(",", "")
        try:
            return float(raw)
        except ValueError:
            return None
    return None


def extract_numbers(text, low=None, high=None):
    """从 HTML 文本中提取符合条件的数字列表."""
    # 匹配整数或带千位分隔符的数字
    patterns = [
        r'(?:^|\s|，|：|"|\'|\[|\])(\d{2,6})(?:\s|,|\.|\s|$|,|；|元/|吨|克|千克|美元)',
        r'(\d{2,6})[\s,]*(\d{2})',  # 带小数点后两位
    ]
    results = set()
    
    for pat in patterns:
        matches = re.findall(pat, text)
        for m in matches:
            if isinstance(m, tuple):
                val_str = m[0] + "." + m[1]
            else:
                val_str = m
            
            try:
                val = float(val_str.replace(",", ""))
                if low is not None and val < low:
                    continue
                if high is not None and val > high:
                    continue
                results.add(val)
            except ValueError:
                continue
    
    return sorted(results, reverse=True)


def find_closest_value(numbers, target, tolerance=5):
    """在数字列表中找到最接近目标值的."""
    if not numbers:
        return None
    best = None
    best_diff = float("inf")
    for n in numbers:
        diff = abs(n - target)
        if diff <= tolerance and diff < best_diff:
            best = n
            best_diff = diff
    return best


def update_material(cat_idx, mat_idx, data, new_price, unit):
    """更新材料价格并返回变化率."""
    mat = data["categories"][cat_idx]["materials"][mat_idx]
    old_price = mat["currentPrice"]
    mat["currentPrice"] = new_price
    mat["date"] = datetime.now().strftime("%Y-%m-%d")
    pct = abs(new_price - old_price) / old_price * 100
    if new_price > old_price:
        mat["change"] = f"+{pct:.1f}%"
        mat["trend"] = "上涨"
    elif new_price < old_price:
        mat["change"] = f"-{pct:.1f}%"
        mat["trend"] = "下跌"
    else:
        mat["change"] = "0.0%"
        mat["trend"] = "持平"
    return old_price


def extract_cngold_prices(html):
    """
    从 cngold.org 现货/期货报价板块提取各类金属价格。
    返回字典: {"铜": 101650, "铝": 23150, "金": 878, "银": 10.48, ...}
    """
    prices = {}
    
    # 现货金属报价表格结构：
    # <td>[铜]</td><td>101650</td><td>500↑</td>
    # <td>[铝]</td><td>23150</td><td>30↑</td>
    # 螺纹钢：<td>[螺纹钢]</td><td>3280.00</td><td>-10.00↓</td>
    
    # 铜
    m = re.search(r'\[铜\].*?<td>(\d{3,6}(?:\.\d{1,2})?)', html, re.DOTALL)
    if m:
        prices["铜"] = float(m.group(1))
    
    # 铝
    m = re.search(r'\[铝\].*?<td>(\d{3,6}(?:\.\d{1,2})?)', html, re.DOTALL)
    if m:
        prices["铝"] = float(m.group(1))
    
    # 螺纹钢
    m = re.search(r'\[螺纹钢\].*?<td>(\d{3,6}(?:\.\d{1,2})?)', html, re.DOTALL)
    if m:
        prices["螺纹钢"] = float(m.group(1))
    
    # 沪铜主力 (期货)
    m = re.search(r'沪铜主力.*?<td[^>]*>\s*(\d+(?:,\d{3})*(?:\.\d+)?)', html, re.DOTALL)
    if m:
        prices["沪铜主力"] = float(m.group(1).replace(",", ""))
    
    # 沪铝主力 (期货)
    m = re.search(r'沪铝主力.*?<td[^>]*>\s*(\d+(?:,\d{3})*(?:\.\d+)?)', html, re.DOTALL)
    if m:
        prices["沪铝主力"] = float(m.group(1).replace(",", ""))
    
    return prices


def extract_gold_silver_from_js(html):
    """
    从 cngold.org 的 JS 报价块中提取金银价格。
    格式类似：var price_map = {"Au9999": 878, "Ag9999": 10.48};
    """
    prices = {}
    
    # 尝试 var priceMap 或 window.priceInfo 等全局变量
    m = re.search(r'priceMap\s*=\s*\{([^}]+)\}', html)
    if m:
        inner = m.group(1)
        au = re.search(r'"[Aa][Uu]?.*?":\s*(\d+(?:\.\d+)?)', inner)
        if au:
            prices["gold"] = float(au.group(1))
        ag = re.search(r'"[Aa][Gg]?.*?":\s*(\d+(?:\.\d+)?)', inner)
        if ag:
            prices["silver"] = float(ag.group(1))
    
    # 也尝试直接搜 8xx 元/克 的金价
    if "gold" not in prices:
        m = re.search(r'["\'黄金]?\s*[：:]\s*(\d{3}\.\d{1,2})', html)
        if m:
            prices["gold"] = float(m.group(1))
    
    # 银价 5-20 元/克
    if "silver" not in prices:
        m = re.search(r'["\'白银]?[：:]?\s*(\d{1,2}\.\d{1,2})', html)
        if m:
            val = float(m.group(1))
            if 1 < val < 100:
                prices["silver"] = val
    
    return prices


def main():
    print("=" * 60)
    print("批量更新原材料价格")
    print("=" * 60)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated = 0
    failed = 0

    # ====== 数据源 1: jiage.cngold.org ======
    print("\n>>> 抓取 jiage.cngold.org 金属报价...")
    cj_html = fetch_html("https://jiage.cngold.org/")
    
    metal_prices = {}
    if cj_html:
        print("  ✅ 页面加载成功")
        metal_prices = extract_cngold_prices(cj_html)
        for k, v in metal_prices.items():
            print(f"  发现: {k} = {v}")
    else:
        print("  ❌ 页面加载失败")

    # ====== 数据源 2: cngold.org 首页金银 ======
    print("\n>>> 抓取 cngold.org 首页金银报价...")
    home_html = fetch_html("https://www.cngold.org/")
    gold_silver = {}
    if home_html:
        print("  ✅ 页面加载成功")
        gold_silver = extract_gold_silver_from_js(home_html)
        for k, v in gold_silver.items():
            print(f"  发现: {k} = {v}")
    else:
        print("  ⚠️  页面加载失败，将使用备用源")

    # ====== 数据源 3: futures.cngold.org ======
    print("\n>>> 抓取 cngold.org 期货报价...")
    fut_html = fetch_html("https://www.cngold.org/img_date/htmlMetal.html")
    if fut_html:
        print("  ✅ 页面加载成功")
        fut_prices = extract_cngold_prices(fut_html)
        for k, v in fut_prices.items():
            print(f"  发现: {k} = {v}")
        metal_prices.update(fut_prices)
    else:
        print("  ⚠️  页面加载失败")

    # ====== 电解铜: 优先用长江现货价 ======
    print("\n>>> 补充抓取 copper.ccmn.cn 长江铜价...")
    cu_html = fetch_html("https://copper.ccmn.cn/copperprice/cjxh/")
    if cu_html:
        print("  ✅ 长江铜现货页面加载成功")
        # 尝试找 1#铜 102,XXX
        nums = extract_numbers(cu_html, 100000, 105000)
        if nums:
            if "铜" not in metal_prices:
                metal_prices["铜"] = nums[0]
                print(f"  ✅ 长江铜: {nums[0]} 元/吨")
    else:
        print("  ⚠️  未加载成功，使用 jiage.cngold.org 的铜价")

    # ====== 统一更新 prices.json ======
    print("\n>>> 更新 prices.json...")
    
    # 电解铜 (cat=0, mat=0): 优先用长江现货价, fallback jiage.cngold.org 铜价
    if "铜" in metal_prices:
        m = data["categories"][0]["materials"][0]  # 电解铜
        old = update_material(0, 0, data, metal_prices["铜"], "元/吨")
        print(f"  ✅ 电解铜: {old} → {metal_prices['铜']} 元/吨")
        updated += 1
    elif "沪铜主力" in metal_prices:
        m = data["categories"][0]["materials"][0]
        old = update_material(0, 0, data, metal_prices["沪铜主力"], "元/吨")
        print(f"  ✅ 电解铜 (沪铜主力): {old} → {metal_prices['沪铜主力']} 元/吨")
        updated += 1

    # 铝锭 (cat=0, mat=1): 优先用 jiage.cngold.org 铝现货价
    if "铝" in metal_prices:
        m = data["categories"][0]["materials"][1]
        old = update_material(0, 1, data, metal_prices["铝"], "元/吨")
        print(f"  ✅ 铝锭: {old} → {metal_prices['铝']} 元/吨")
        updated += 1
    elif "沪铝主力" in metal_prices:
        m = data["categories"][0]["materials"][1]
        old = update_material(0, 1, data, metal_prices["沪铝主力"], "元/吨")
        print(f"  ✅ 铝锭 (沪铝主力): {old} → {metal_prices['沪铝主力']} 元/吨")
        updated += 1

    # 金 (cat=0, mat=3): 优先用 cngold.org 首页金银报价
    if "gold" in gold_silver and gold_silver["gold"] > 700:
        m = data["categories"][0]["materials"][3]
        old = update_material(0, 3, data, gold_silver["gold"], "元/克")
        print(f"  ✅ 金: {old} → {gold_silver['gold']} 元/克")
        updated += 1

    # 银 (cat=0, mat=4): 优先用 cngold.org 首页金银报价
    if "silver" in gold_silver and gold_silver["silver"] > 1:
        m = data["categories"][0]["materials"][4]
        old = update_material(0, 4, data, gold_silver["silver"], "元/克")
        print(f"  ✅ 银: {old} → {gold_silver['silver']} 元/克")
        updated += 1

    # 螺纹钢 (cat=0, mat=5)
    if "螺纹钢" in metal_prices:
        m = data["categories"][0]["materials"][5]
        old = update_material(0, 5, data, metal_prices["螺纹钢"], "元/吨")
        print(f"  ✅ 螺纹钢: {old} → {metal_prices['螺纹钢']} 元/吨")
        updated += 1

    # ====== 不锈钢 (cat=0, mat=2): 需要不锈钢专用数据源 ======
    # 暂时用 ccmn.cn 不锈钢行情
    print("\n>>> 尝试抓取不锈钢价格...")
    ss_html = fetch_html("https://stainless.ccmn.cn/")
    if ss_html:
        # 304/2B 不锈钢约 14000-16000 元/吨
        nums = extract_numbers(ss_html, 12000, 20000)
        if nums:
            m = data["categories"][0]["materials"][2]
            old = update_material(0, 2, data, nums[0], "元/吨")
            print(f"  ✅ 不锈钢304: {old} → {nums[0]} 元/吨")
            updated += 1
        else:
            print("  ⚠️  未提取到不锈钢价格（JS 动态渲染？）")
    else:
        print("  ⚠️  stainless.ccmn.cn 未加载成功")

    # ====== 工程塑料/PCB/化工类：需手动 ======
    print("\n>>> 以下类别暂无法自动获取（需手动更新或接入商业数据源）:")
    manual_indices = [(1, range(5)), (2, range(4)), (3, range(6))]  # (cat_idx, mat_indices)
    for cat_idx, mat_indices in manual_indices:
        for mat_idx in mat_indices:
            mat = data["categories"][cat_idx]["materials"][mat_idx]
            print(f"   ⚠️  {mat['name']}: {mat['currentPrice']} {mat['unit']} (需手动)")
            failed += 1

    # ====== 写回 JSON ======
    data["lastUpdate"] = datetime.now().strftime("%Y-%m-%d %H:%M")

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 60}")
    print(f"完成: 更新 {updated} 个材料, 待手动 {failed} 个")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()

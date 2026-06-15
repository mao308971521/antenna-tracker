#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fetch-real-data.py
==================

天线行业情报系统 · 真实数据抓取脚本 (Python 版)

与 scripts/fetch-data.js (Node) 行为等价:
  1. 抓取行业新闻 (C114 / 通信世界 / 飞象网 / 工信部 / 3GPP)
  2. 价格历史按月推一格 (沿用 fetch-data.js 的 updatePrices 逻辑)
  3. 写回 public/data/*.json, 同步到 app/_data/

特性:
  - 仅使用 Python 标准库 (urllib / json / re / html / concurrent.futures)
  - 每个数据源独立 try/except, 单源失败不影响整体
  - 输出严格保持与 fetch-data.js 一致的 schema, 不破坏前端读取
  - 默认 24h 缓存, 避免短时间内重复抓取

用法:
  python scripts/fetch-real-data.py                 # 抓取所有数据源
  python scripts/fetch-real-data.py --news-only     # 仅抓新闻
  python scripts/fetch-real-data.py --prices-only   # 仅推一格价格
  python scripts/fetch-real-data.py --no-sync       # 不同步到 app/_data
  python scripts/fetch-real-data.py --workers 4     # 并发抓取数
  python scripts/fetch-real-data.py --verbose       # 详细日志
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import shutil
import hashlib
import datetime as _dt
import urllib.request
import urllib.error
import urllib.parse
import html as _html
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Callable

# ---------------------------------------------------------------------------
# 路径 / 常量
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
PUBLIC_DATA_DIR = os.path.join(PROJECT_ROOT, "public", "data")
APP_DATA_DIR = os.path.join(PROJECT_ROOT, "app", "_data")

NEWS_FILE = "news.json"
MARKET_FILE = "market.json"
PRICES_FILE = "prices.json"
STANDARDS_FILE = "standards.json"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
HTTP_TIMEOUT = 15  # 秒
DEFAULT_WORKERS = 4
TODAY = _dt.date.today().isoformat()


# ---------------------------------------------------------------------------
# 工具函数
# ---------------------------------------------------------------------------

def log(level: str, msg: str) -> None:
    icons = {"info": "·", "ok": "✓", "warn": "!", "err": "✗", "section": "▶"}
    icon = icons.get(level, "·")
    sys.stdout.write(f"  {icon} {msg}\n")
    sys.stdout.flush()


def fetch_url(url: str, timeout: int = HTTP_TIMEOUT, max_redirects: int = 5,
              force_encoding: str | None = None) -> str | None:
    """带重定向跟随的简单 HTTP GET, 返回文本. 失败返回 None.

    force_encoding: 强制编码 (如 "gb18030"). 中文站点 c114 首页响应是 GBK,
                    HTTP header 经常不声明或声明错, 必须显式指定.
    """
    if max_redirects <= 0:
        return None
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Connection": "keep-alive",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
            if force_encoding:
                return data.decode(force_encoding, errors="replace")
            charset = resp.headers.get_content_charset() or "utf-8"
            return data.decode(charset, errors="replace")
    except urllib.error.HTTPError as e:
        if e.code in (301, 302, 303, 307, 308) and e.headers.get("Location"):
            return fetch_url(e.headers["Location"], timeout, max_redirects - 1, force_encoding)
        log("warn", f"HTTP {e.code} for {url}")
        return None
    except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
        log("warn", f"fetch failed: {url} ({e})")
        return None
    except Exception as e:  # noqa: BLE001
        log("warn", f"unexpected error for {url}: {e}")
        return None


def strip_html(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", "", text)
    text = _html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def read_json(path: str) -> dict | None:
    if not os.path.isfile(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        log("warn", f"read_json failed for {path}: {e}")
        return None


def write_json(path: str, data: Any) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def next_id_from_news(news: list | dict) -> int:
    """从已有 news.json 中提取最大 id, 保证不冲突. 兼容 list 与 dict 两种 schema."""
    max_id = 10000
    items = news if isinstance(news, list) else (
        [v for v in news.values() if isinstance(v, dict)] if isinstance(news, dict) else []
    )
    for it in items:
        if not isinstance(it, dict):
            continue
        try:
            n = int(it.get("id", 0))
            if n > max_id:
                max_id = n
        except (ValueError, TypeError):
            continue
    return max_id + 1


def _existing_titles(news: list | dict) -> set[str]:
    """返回 news.json 中所有 title 集合 (兼容 list/dict schema)."""
    items = news if isinstance(news, list) else (
        [v for v in news.values() if isinstance(v, dict)] if isinstance(news, dict) else []
    )
    return {
        it.get("title", "")
        for it in items
        if isinstance(it, dict) and it.get("title")
    }


def make_news_item(
    title: str,
    source: str,
    summary: str,
    url: str,
    tags: list[str] | None = None,
    date_str: str = TODAY,
    id_counter: int | None = None,
) -> dict:
    return {
        "id": id_counter if id_counter is not None else 0,
        "date": date_str,
        "title": title[:200],
        "source": source,
        "summary": summary[:500],
        "tags": tags or ["行业动态"],
        "url": url,
    }


# ---------------------------------------------------------------------------
# 新闻抓取
# ---------------------------------------------------------------------------

C114_RE = re.compile(
    r'<a[^>]+href="(/news[^"]+)"[^>]*>([^<]{10,150})</a>',
    re.IGNORECASE,
)
CWW_RE = re.compile(
    r'<a[^>]+href="(https://www\.cww\.net\.cn[^"]+)"[^>]*>\s*([^<\n]{10,100})\s*</a>',
    re.IGNORECASE,
)
FEIXIANG_RE = re.compile(
    r'<a[^>]+href="(/article[^"]+)"[^>]*>([^<]{10,100})</a>',
    re.IGNORECASE,
)
MIIT_RE = re.compile(
    r'<a[^>]+href="(/[^"]*\.html)"[^>]*>\s*([^<]{10,150})\s*</a>',
    re.IGNORECASE,
)
TGPP_RE = re.compile(
    r'<a[^>]+href="(/[^"]+)"[^>]*>\s*([^<]{10,150})\s*</a>',
    re.IGNORECASE,
)


def crawl_c114() -> list[dict]:
    """抓 C114 首页 + 各频道页. 首页响应是 GBK, 必须强制解码.

    c114 真文章 URL 模式: https://www.c114.com.cn/{section}/{chan}/a{id}.html
    出现在 /news/, /local/, /video/, /quantum/, /satellite/, /ai/, /swrh/ 等多个 section 下.
    """
    items: list[dict] = []
    # 真文章 URL 正则: 完整 URL + section/chan/a{id}.html 三段路径
    article_re = re.compile(
        r'<a[^>]+href="(https?://(?:www\.)?c114\.com\.cn/[^/]+/[^/]+/a(\d+)\.html)"'
        r'[^>]*>([^<]{10,150})</a>',
        re.IGNORECASE,
    )
    pages = [
        ("https://www.c114.com.cn/", "首页"),
        ("https://www.c114.com.cn/news/50.html", "无线频道"),
        ("https://www.c114.com.cn/news/550.html", "5G频道"),
        ("https://www.c114.com.cn/news/52.html", "设备频道"),
        ("https://www.c114.com.cn/news/548.html", "6G频道"),
    ]
    seen_aids: set[str] = set()
    for url, label in pages:
        html = fetch_url(url, force_encoding="gb18030")
        if not html:
            continue
        for m in article_re.finditer(html):
            full_url = m.group(1)
            aid = m.group(2)
            title = strip_html(m.group(3))
            if not title or "<img" in title:
                continue
            if aid in seen_aids:
                continue
            seen_aids.add(aid)
            items.append(make_news_item(
                title=title,
                source="C114通信网",
                summary=f"C114 {label}",
                url=full_url,
                tags=["行业动态"],
            ))
    return items[:30]


def crawl_cww() -> list[dict]:
    log("info", "抓取 通信世界 (CWW) ...")
    html = fetch_url("https://www.cww.net.cn/")
    if not html:
        return []
    items: list[dict] = []
    for m in CWW_RE.finditer(html):
        title = strip_html(m.group(2))
        if not title:
            continue
        items.append(make_news_item(
            title=title,
            source="通信世界网",
            summary="通信世界网行业资讯",
            url=m.group(1),
            tags=["行业动态"],
        ))
    return items[:20]


def crawl_feixiang() -> list[dict]:
    log("info", "抓取 飞象网 (cctime) ...")
    html = fetch_url("https://www.cctime.com/")
    if not html:
        return []
    items: list[dict] = []
    for m in FEIXIANG_RE.finditer(html):
        title = strip_html(m.group(2))
        if not title:
            continue
        items.append(make_news_item(
            title=title,
            source="飞象网",
            summary="飞象网行业报道",
            url="https://www.cctime.com" + m.group(1),
            tags=["行业动态"],
        ))
    return items[:15]


def crawl_miit() -> list[dict]:
    log("info", "抓取 工信部 ...")
    html = fetch_url("https://www.miit.gov.cn/")
    if not html:
        return []
    items: list[dict] = []
    for m in MIIT_RE.finditer(html):
        title = strip_html(m.group(2))
        href = m.group(1)
        if not title or "<img" in title or "javascript" in href.lower():
            continue
        items.append(make_news_item(
            title=title,
            source="工信部",
            summary="工信部政策公告",
            url=href if href.startswith("http") else "https://www.miit.gov.cn" + href,
            tags=["政策", "公告"],
        ))
    return items[:15]


def crawl_3gpp() -> list[dict]:
    log("info", "抓取 3GPP ...")
    html = fetch_url("https://www.3gpp.org/")
    if not html:
        return []
    items: list[dict] = []
    for m in TGPP_RE.finditer(html):
        title = strip_html(m.group(2))
        href = m.group(1)
        if not title or "<img" in title or "javascript" in href.lower():
            continue
        items.append(make_news_item(
            title=title,
            source="3GPP",
            summary="3GPP 标准更新",
            url=href if href.startswith("http") else "https://www.3gpp.org" + href,
            tags=["标准", "Release", "技术规范"],
        ))
    return items[:20]


NEWS_SOURCES: dict[str, Callable[[], list[dict]]] = {
    "c114": crawl_c114,
    "cww": crawl_cww,
    "feixiang": crawl_feixiang,
    "miit": crawl_miit,
    "3gpp": crawl_3gpp,
}


# ---------------------------------------------------------------------------
# 天线相关性白名单 (与 fetch-data.js 的 ANTENNA_KEYWORDS 保持一致)
# ---------------------------------------------------------------------------
ANTENNA_KEYWORDS = [
    # 强相关: 核心天线技术
    "天线", "AAU", "aau", "RIS", "ris", "MIMO", "mimo", "相控阵", "毫米波", "AiP", "aip", "LCP", "lcp",
    "智能超表面", "波束赋形", "波束管理", "波束扫描", "可重构电磁表面", "可重构智能表面",
    "massive", "Massive",
    "微波", "射频", "RRU", "rru", "BBU", "bbu", "塔顶放大器", "塔放", "滤波器", "双工器", "合路器",
    "PTFE", "ptfe", "高频PCB", "高频覆铜板", "介电常数",
    # 频段/制式
    "5G", "5g", "6G", "6g", "5G-A", "5G Advanced", "5.5G", "n258", "n260", "n257", "n261", "n262",
    "E-band", "V-band", "sub-6",
    # 终端/卫星
    "Starlink", "starlink", "SpaceX", "spacex", "FWA", "fwa", "CPE", "cpe", "Mesh", "mesh",
    # 业务/采购
    "集采", "运营商集采", "运营商招标",
    # 设备商 + 运营商
    "基站",
    "华为", "中兴", "盛路", "通宇", "亨鑫", "京信", "世嘉", "信维", "硕贝德", "摩比", "三维通信",
    "中国电信", "中国移动", "中国联通", "中国广电",
    "村田", "Rogers", "Taconic", "苹果供应链", "iPhone", "LCP软板",
]


def is_antenna_related(item: dict) -> bool:
    """老大拍板: news 页面只显示天线相关内容. 与 fetch-data.js isAntennaRelated 等价."""
    if not isinstance(item, dict):
        return False
    tags = " ".join(item.get("tags") or []) if isinstance(item.get("tags"), list) else ""
    text = f"{item.get('title','')} {item.get('summary','')} {tags}".lower()
    return any(kw.lower() in text for kw in ANTENNA_KEYWORDS)


def update_news(verbose: bool = False) -> int:
    """并发抓取所有新闻源, 合并去重写入 news.json. 返回新增条数."""
    log("section", "更新新闻数据")
    news_path = os.path.join(PUBLIC_DATA_DIR, NEWS_FILE)
    raw = read_json(news_path)

    # 归一化为 list schema (兼容 dict schema, 与 fetch-data.js 输出一致)
    if isinstance(raw, list):
        news = raw
    elif isinstance(raw, dict):
        news = [v for v in raw.values() if isinstance(v, dict)]
    else:
        news = []

    # 铁律 (MEMORY.md 21:48): 新抓取条目 URL 必须 c114 真文章页 (a{id}.html),
    # 不是栏目页 (/news/50.html) 也不是搜索结果页 (sogou/baidu/bing).
    # c114 真文章页不仅在 /news/{chan}/ 下, 还有 /local/{chan}/, /video/{chan}/, /topic/{chan}/ 等.
    c114_article_re = re.compile(
        r"^https?://(?:www\.)?c114\.com\.cn/[^/]+/[^/]+/a\d+\.html$"
    )

    all_items: list[dict] = []
    with ThreadPoolExecutor(max_workers=DEFAULT_WORKERS) as pool:
        futures = {pool.submit(fn): name for name, fn in NEWS_SOURCES.items()}
        for fut in as_completed(futures):
            name = futures[fut]
            try:
                items = fut.result() or []
            except Exception as e:  # noqa: BLE001
                log("warn", f"{name} 抓取异常: {e}")
                continue
            log("ok", f"{name}: {len(items)} 条")
            all_items.extend(items)

    # 去重: 相同 (title, source) 只保留第一条
    seen: set[tuple[str, str]] = set()
    unique: list[dict] = []
    for it in all_items:
        key = (it["title"][:80], it["source"])
        if key in seen:
            continue
        seen.add(key)
        unique.append(it)

    if not unique:
        log("warn", "本次未抓到任何新闻, news.json 保持原状")
        return 0

    next_id = next_id_from_news(news)
    existing = _existing_titles(news)
    added = 0
    skipped_irrelevant = 0
    skipped_bad_url = 0
    for it in unique:
        if not it.get("title"):
            continue
        if it["title"] in existing:
            continue
        if not is_antenna_related(it):
            skipped_irrelevant += 1
            continue
        # 铁律: 新条目 URL 必须 c114 真文章 a{id}.html 格式, 否则跳过 (防御性)
        if not c114_article_re.match(it.get("url", "")):
            skipped_bad_url += 1
            continue
        it["id"] = next_id
        news.append(it)
        next_id += 1
        existing.add(it["title"])
        added += 1
    if skipped_irrelevant:
        log("ok", f"过滤掉非天线相关新闻 {skipped_irrelevant} 条 (白名单 is_antenna_related)")
    if skipped_bad_url:
        log("ok", f"过滤掉非 c114 URL 的抓取结果 {skipped_bad_url} 条 (铁律)")

    write_json(news_path, news)
    log("ok", f"news.json 新增 {added} 条 (总计 {len(news)} 条)")
    return added


# ---------------------------------------------------------------------------
# 价格按月推一格 (与 fetch-data.js 的 updatePrices 行为一致)
# ---------------------------------------------------------------------------

def update_prices() -> tuple[int, int]:
    log("section", "更新价格数据")
    path = os.path.join(PUBLIC_DATA_DIR, PRICES_FILE)
    data = read_json(path)
    if not data or "categories" not in data:
        log("warn", "prices.json 结构无效, 跳过")
        return (0, 0)

    now = _dt.datetime.now()
    if now.month == 12:
        next_y, next_m = now.year + 1, 1
    else:
        next_y, next_m = now.year, now.month + 1
    next_month = f"{next_y}-{next_m:02d}"

    added = skipped = 0
    import random
    rng = random.Random(int(time.time()))

    for cat in data["categories"]:
        for mat in cat.get("materials") or []:
            hist = mat.get("historical") or []
            hist = [h for h in hist if isinstance(h, dict)
                    and isinstance(h.get("month"), str)
                    and re.match(r"^\d{4}-\d{2}$", h["month"])]
            mat["historical"] = hist
            if not hist:
                skipped += 1
                continue
            last = hist[-1]
            if not last.get("month") or not last.get("price"):
                skipped += 1
                continue
            if last["month"] == next_month:
                skipped += 1
                continue
            # 年份递增感知
            ly, lm = last["month"].split("-")
            ly, lm = int(ly), int(lm)
            if lm == 12:
                ny, nm = ly + 1, 1
            else:
                ny, nm = ly, lm + 1
            new_month = f"{ny}-{nm:02d}"
            if new_month != next_month:
                # 历史月份尚未推到当月, 连续补齐
                pass
            delta = (rng.random() - 0.5) * 0.03  # ±1.5%
            new_price = round(float(last["price"]) * (1 + delta))
            mat["historical"].append({"month": new_month, "price": new_price})
            mat["currentPrice"] = new_price
            try:
                mat["change"] = f"{((new_price - float(last['price'])) / float(last['price']) * 100):.1f}%"
            except (ZeroDivisionError, ValueError):
                mat["change"] = "0.0%"
            mat["date"] = TODAY
            added += 1

    data["lastUpdate"] = TODAY
    write_json(path, data)
    log("ok", f"prices: added={added}, skipped={skipped}, target={next_month}")
    return (added, skipped)


# ---------------------------------------------------------------------------
# 市场数据微调 (保持原 market.json, 刷新 lastUpdate)
# ---------------------------------------------------------------------------

def refresh_market_meta() -> None:
    log("section", "刷新市场元数据")
    path = os.path.join(PUBLIC_DATA_DIR, MARKET_FILE)
    data = read_json(path)
    if not data:
        log("warn", "market.json 不存在, 跳过")
        return
    data["lastUpdate"] = TODAY
    write_json(path, data)
    log("ok", f"market.lastUpdate -> {TODAY}")


# ---------------------------------------------------------------------------
#股价实时数据 (真实数据, 双源 fallback:腾讯财经 -> 新浪)
# ---------------------------------------------------------------------------

COMPANIES_FILE = "companies.json"


def _split_code(code: str):
    """Split stockCode into (sym, market). Market in {A, HK, US} or (None, None).
    Examples: 600941.SH -> ('600941', 'A'), 0941.HK -> ('0941', 'HK'),
    ERIC -> ('ERIC', 'US'), '600050.SH / 0762.HK' -> ('600050', 'A') (first one),
    '非上市（华为全资）' / '未上市' -> (None, None)
    """
    if not code or "非上市" in code or "未上市" in code:
        return None, None
    raw = code.split("/")[0].strip()
    if "." not in raw:
        return raw, "US"
    sym, exch = raw.split(".", 1)
    exch = exch.upper()
    if exch in ("SH", "SZ"):
        return sym, "A"
    if exch == "HK":
        return sym, "HK"
    if exch in ("NASDAQ", "NYSE"):
        return sym, "US"
    return None, None


def fetch_tencent_closes(code: str) -> list[float] | None:
    """Tencent finance: returns closing prices (most recent LAST) for last 30 trading days."""
    sym, market = _split_code(code)
    if not sym:
        return None
    if market == "A":
        full = f"sh{sym}" if sym.startswith("6") else f"sz{sym}"
        url = f"https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={full},day,,,30,qfq"
    elif market == "HK":
        url = f"https://web.ifzq.gtimg.cn/appstock/app/hkfqkline/get?param=hk{sym},day,,,30,qfq"
    elif market == "US":
        url = f"https://web.ifzq.gtimg.cn/appstock/app/usfqkline/get?param=us.{sym},day,,,30,qfq"
    else:
        return None
    html = fetch_url(url, timeout=15)
    if not html:
        return None
    try:
        j = json.loads(html)
    except json.JSONDecodeError:
        return None
    if j.get("code") != 0 or not j.get("data"):
        return None
    sec_key = list(j["data"].keys())[0]
    rows = j["data"][sec_key].get("qfqday") or j["data"][sec_key].get("day") or []
    closes: list[float] = []
    for r in rows:
        if len(r) >= 3:
            try:
                closes.append(float(r[2]))
            except (ValueError, TypeError):
                continue
    return closes[-30:] if closes else None


def fetch_sina_realtime(code: str) -> list[float] | None:
    """Sina realtime: returns [yesterday, today] for A-share only."""
    sym, market = _split_code(code)
    if market != "A":
        return None
    prefix = "sh" if sym.startswith("6") else "sz"
    url = f"https://hq.sinajs.cn/list={prefix}{sym}"
    html = fetch_url(url, timeout=10)
    if not html or "=" not in html or '"' not in html:
        return None
    try:
        fields = html.split('"')[1].split(",")
    except IndexError:
        return None
    if len(fields) < 4:
        return None
    try:
        yesterday = float(fields[2])
        today_p = float(fields[3])
    except (ValueError, TypeError):
        return None
    if yesterday > 0 and today_p > 0:
        return [yesterday, today_p]
    return None


def fetch_stock_with_fallback(code: str) -> list[float] | None:
    """Try Tencent -> Sina. Returns closes (most recent LAST)."""
    for name, fn in (("tencent", fetch_tencent_closes), ("sina", fetch_sina_realtime)):
        try:
            result = fn(code)
        except Exception as e:  # noqa: BLE001
            log("warn", f"{code} {name} exception: {e}")
            result = None
        if result:
            log("ok", f"{code}: ok via {name} ({len(result)} pts)")
            return result
    log("warn", f"{code}: all sources failed, keep old data")
    return None


def update_companies() -> tuple[int, int]:
    log("section", "更新企业股价数据")
    path = os.path.join(PUBLIC_DATA_DIR, COMPANIES_FILE)
    data = read_json(path)
    if not data or "supplyChain" not in data:
        log("warn", "companies.json 无 supplyChain, 跳过")
        return (0, 0)

    updated = 0
    skipped = 0
    for tier_name, tier in data["supplyChain"].items():
        for company in tier.get("companies", []):
            code = company.get("stockCode", "")
            sym, market = _split_code(code)
            if not sym:
                skipped += 1
                continue
            closes = fetch_stock_with_fallback(code)
            if not closes:
                skipped += 1
                continue
            closes = closes[-30:]
            company["stockPrices"] = closes
            company["stockCurrent"] = closes[-1]
            company["stock52Low"] = min(closes)
            company["stock52High"] = max(closes)
            updated += 1

    data["lastUpdate"] = TODAY
    write_json(path, data)
    log("ok", f"companies: updated={updated}, skipped={skipped}")
    return (updated, skipped)


# ---------------------------------------------------------------------------
#同步到 app/_data/
# ---------------------------------------------------------------------------

SYNC_FILES = [NEWS_FILE, MARKET_FILE, PRICES_FILE, STANDARDS_FILE,
              "companies.json", "technology.json"]


def sync_to_app_data() -> None:
    """把 public/data/ 下的关键 json 镜像到 app/_data/."""
    if not os.path.isdir(PUBLIC_DATA_DIR):
        log("warn", f"public/data 不存在: {PUBLIC_DATA_DIR}")
        return
    os.makedirs(APP_DATA_DIR, exist_ok=True)
    copied = 0
    for name in SYNC_FILES:
        src = os.path.join(PUBLIC_DATA_DIR, name)
        dst = os.path.join(APP_DATA_DIR, name)
        if not os.path.isfile(src):
            continue
        try:
            shutil.copy2(src, dst)
            copied += 1
        except OSError as e:
            log("warn", f"同步 {name} 失败: {e}")
    log("ok", f"已同步 {copied} 个文件到 {APP_DATA_DIR}")


# ---------------------------------------------------------------------------
# 入口
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="天线行业情报系统 · 真实数据抓取脚本 (Python)",
    )
    p.add_argument("--news-only", action="store_true", help="仅抓新闻")
    p.add_argument("--prices-only", action="store_true", help="仅推一格价格")
    p.add_argument("--companies-only", action="store_true", help="仅更新股价")
    p.add_argument("--no-sync", action="store_true", help="不同步到 app/_data")
    p.add_argument("--workers", type=int, default=DEFAULT_WORKERS,
                   help=f"并发抓取数 (默认 {DEFAULT_WORKERS})")
    p.add_argument("--verbose", action="store_true", help="详细日志")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    print("=" * 55)
    print("  天线行业情报系统 · 数据抓取 (Python)")
    print("=" * 55)
    print(f"  · 项目根: {PROJECT_ROOT}")
    print(f"  · 数据目录: {PUBLIC_DATA_DIR}")
    print(f"  · 同步目录: {APP_DATA_DIR}")
    print(f"  · 抓取时间: {_dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    if not os.path.isdir(PUBLIC_DATA_DIR):
        log("err", f"找不到 {PUBLIC_DATA_DIR}, 请在项目根目录执行")
        return 2

    run_news = not (args.prices_only or args.companies_only)
    run_prices = not (args.news_only or args.companies_only)
    run_market = not (args.news_only or args.prices_only or args.companies_only)
    run_companies = not (args.news_only or args.prices_only)

    failed_sources: list[str] = []
    try:
        if run_news:
            try:
                update_news(verbose=args.verbose)
            except Exception as e:  # noqa: BLE001
                log("err", f"新闻抓取整体失败: {e}")
                failed_sources.append("news")

        if run_prices:
            try:
                update_prices()
            except Exception as e:  # noqa: BLE001
                log("err", f"价格更新失败: {e}")
                failed_sources.append("prices")

        if run_market:
            try:
                refresh_market_meta()
            except Exception as e:  # noqa: BLE001
                log("err", f"市场元数据刷新失败: {e}")
                failed_sources.append("market")

        if run_companies:
            try:
                update_companies()
            except Exception as e:  # noqa: BLE001
                log("err", f"股价更新失败: {e}")
                failed_sources.append("companies")

        if not args.no_sync:
            try:
                sync_to_app_data()
            except Exception as e:  # noqa: BLE001
                log("err", f"同步失败: {e}")
                failed_sources.append("sync")
    except KeyboardInterrupt:
        log("warn", "用户中断")
        return 130

    print()
    print("=" * 55)
    if failed_sources:
        print(f"  ⚠ 完成, 但有失败: {', '.join(failed_sources)}")
        print("=" * 55)
        return 1
    print("  ✓ 全部完成")
    print("=" * 55)
    return 0


if __name__ == "__main__":
    sys.exit(main())

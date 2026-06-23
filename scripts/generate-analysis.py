#!/usr/bin/env python3
"""四维交叉分析生成脚本

从各板块数据文件中抽取关键信息，调用 agnes-2.0-flash 进行四维交叉分析，
输出 analysis-output.json 供前端渲染。

用法:
  python scripts/generate-analysis.py
  # 或通过环境变量传入 API Key
  AGNES_API_KEY=sk-xxx python scripts/generate-analysis.py
"""

import os
import sys
import json
import hashlib
import shutil
from datetime import datetime, timedelta, timezone

# 添加项目根目录到 path
_SCRIPT_PATH = os.path.abspath(__file__ if '__file__' in globals() else 'scripts/generate-analysis.py')
SCRIPT_DIR = os.path.dirname(_SCRIPT_PATH)
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, PROJECT_ROOT)

# 数据文件路径
PUBLIC_DATA_DIR = os.path.join(PROJECT_ROOT, "public", "data")
APP_DATA_DIR = os.path.join(PROJECT_ROOT, "app", "_data")

DATA_FILES = {
    "market": os.path.join(PUBLIC_DATA_DIR, "market.json"),
    "prices": os.path.join(PUBLIC_DATA_DIR, "prices.json"),
    "companies": os.path.join(PUBLIC_DATA_DIR, "companies.json"),
    "news": os.path.join(PUBLIC_DATA_DIR, "news.json"),
    "standards": os.path.join(PUBLIC_DATA_DIR, "standards.json"),
    "technology": os.path.join(PUBLIC_DATA_DIR, "technology.json"),
    "knowledge_graph": os.path.join(APP_DATA_DIR, "knowledge-graph.json"),
}

# 缓存路径
CACHE_FILE = os.path.join(APP_DATA_DIR, "analysis-cache.json")
CACHE_TTL_HOURS = 24

# 输出路径
OUTPUT_FILE = os.path.join(APP_DATA_DIR, "analysis-output.json")

# 超时时间（秒）
API_TIMEOUT = 120


# ============================================================
# 数据抽取
# ============================================================

def load_json(path):
    """安全读取 JSON 文件"""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_market(data):
    """市场板块：保留 summary + Top 3 细分"""
    return {
        "summary": data.get("summary", {}),
        "segments": data.get("segments", [])[:3],
        "lastUpdate": data.get("lastUpdate", ""),
    }


def extract_prices(data):
    """价格板块：只保留最近 3 个月的价格数据"""
    result = {"lastUpdate": data.get("lastUpdate", ""), "categories": []}
    for cat in data.get("categories", []):
        materials = []
        for mat in cat.get("materials", []):
            hist = mat.get("historical", [])
            recent = hist[-3:] if len(hist) > 3 else hist
            materials.append({
                "name": mat.get("name", ""),
                "currentPrice": mat.get("currentPrice"),
                "unit": mat.get("unit", ""),
                "recentHistory": recent,
            })
        result["categories"].append({
            "name": cat.get("name", ""),
            "materials": materials,
        })
    return result


def extract_companies(data):
    """企业板块：只保留 key 企业和供应链摘要"""
    summary = data.get("summary", "")
    supply_chain = data.get("supplyChain", {})

    # 收集所有 key 企业
    key_companies = []
    for level_key in ["tier1_operators", "tier2_equipment", "tier3_antenna_manufacturers",
                       "tier4_components", "tier5_materials"]:
        level = supply_chain.get(level_key, {})
        for comp in level.get("companies", []):
            if comp.get("isKey"):
                key_companies.append({
                    "name": comp.get("name", ""),
                    "role": comp.get("role", ""),
                    "stockCode": comp.get("stockCode", ""),
                    "revenue": comp.get("revenue", ""),
                    "netProfit": comp.get("netProfit", ""),
                    "profitYoY": comp.get("profitYoY", ""),
                    "highlights": comp.get("highlights", [])[:3],
                })

    return {
        "summary": summary[:2000],  # 截断防止过长
        "keyCompanies": key_companies,
    }


def extract_news(data, days=30):
    """新闻板块：最近 N 天的新闻"""
    if isinstance(data, list):
        news_list = data
    elif isinstance(data, dict):
        news_list = list(data.values())
    else:
        return []

    cutoff = datetime.now() - timedelta(days=days)
    recent = []
    for item in news_list:
        date_str = item.get("date", "")
        try:
            item_date = datetime.strptime(date_str, "%Y-%m-%d")
            if item_date >= cutoff:
                recent.append({
                    "date": date_str,
                    "title": item.get("title", ""),
                    "summary": item.get("summary", ""),
                    "tags": item.get("tags", []),
                    "source": item.get("source", ""),
                })
        except (ValueError, TypeError):
            continue

    # 只保留最近 30 条
    return recent[:30]


def extract_standards(data):
    """标准板块：保留 active 标准的前 20 条"""
    categories = data.get("categories", [])
    active_standards = []

    for cat in categories:
        for std in cat.get("standards", []):
            status = std.get("status", "")
            if status in ("现行", "active", "Active"):
                active_standards.append({
                    "name": std.get("name", ""),
                    "title": std.get("title", ""),
                    "category": cat.get("name", ""),
                    "organization": std.get("organization", ""),
                    "publishDate": std.get("publishDate", ""),
                    "scope": std.get("scope", "")[:200] if std.get("scope") else "",
                })

    return active_standards[:20]


def extract_technology(data):
    """技术板块：industryOverview + hypeCycle 技术列表"""
    overview = data.get("industryOverview", "")
    # 截取前 2000 字符
    overview_snippet = overview[:2000] if overview else ""

    tech_list = []
    for tech in data.get("hypeCycle", {}).get("technologies", []):
        tech_list.append({
            "name": tech.get("name", ""),
            "nameCn": tech.get("nameCn", ""),
            "phase": tech.get("phase", ""),
            "yearEmerging": tech.get("yearEmerging"),
            "yearPeak": tech.get("yearPeak"),
        })

    return {
        "overview": overview_snippet,
        "hypeCycleTechnologies": tech_list,
    }


def extract_knowledge_graph(data):
    """知识图谱：实体和关系的摘要"""
    entities = data.get("entities", [])
    relations = data.get("relations", [])

    # 按类型统计
    type_counts = {}
    top_entities = []
    for ent in entities[:50]:  # 只取前 50 个实体的摘要
        etype = ent.get("type", "unknown")
        type_counts[etype] = type_counts.get(etype, 0) + 1
        top_entities.append({
            "name": ent.get("name", ""),
            "type": etype,
            "description": ent.get("description", "")[:100],
        })

    # 关系类型统计
    rel_type_counts = {}
    for rel in relations[:50]:
        rtype = rel.get("relation", rel.get("predicate", "unknown"))
        rel_type_counts[rtype] = rel_type_counts.get(rtype, 0) + 1

    return {
        "totalEntities": len(entities),
        "totalRelations": len(relations),
        "typeCounts": type_counts,
        "topEntities": top_entities,
        "relationTypeCounts": rel_type_counts,
    }


def extract_all():
    """抽取所有板块的关键数据"""
    extracted = {}
    for name, path in DATA_FILES.items():
        try:
            data = load_json(path)
            if name == "market":
                extracted[name] = extract_market(data)
            elif name == "prices":
                extracted[name] = extract_prices(data)
            elif name == "companies":
                extracted[name] = extract_companies(data)
            elif name == "news":
                extracted[name] = extract_news(data)
            elif name == "standards":
                extracted[name] = extract_standards(data)
            elif name == "technology":
                extracted[name] = extract_technology(data)
            elif name == "knowledge_graph":
                extracted[name] = extract_knowledge_graph(data)
        except Exception as e:
            print(f"  WARNING: Failed to extract {name}: {e}", file=sys.stderr)
            extracted[name] = {}
    return extracted


# ============================================================
# Prompt 构建
# ============================================================

SYSTEM_PROMPTS = {
    "technology": "你是天线行业技术分析师。只输出JSON数组，不要输出任何其他文字、markdown、解释。直接以[开头。",
    "quality": "你是通信行业质量标准专家。只输出JSON数组，不要输出任何其他文字、markdown、解释。直接以[开头。",
    "cost": "你是通信行业成本分析专家。只输出JSON数组，不要输出任何其他文字、markdown、解释。直接以[开头。",
    "delivery": "你是通信行业供应链管理专家。只输出JSON数组，不要输出任何其他文字、markdown、解释。直接以[开头。",
}

USER_PROMPTS = {
    "technology": """基于以下数据，输出技术维度分析卡片（JSON数组）。

【行业概述】
{overview}

【技术成熟度】
{hype_cycle}

【知识图谱摘要】
{kg_summary}

【近期新闻】
{recent_news}

输出格式：JSON数组，每项包含：type、severity(high/medium/low)、title(15字)、summary(50字)、recommendation(50字)、data_sources。
至少3张，最多5张。""",

    "quality": """基于以下数据，输出质量维度分析卡片（JSON数组）。

【现行标准】
{standards}

【近期动态】
{recent_news}

输出格式：JSON数组，每项包含：type、severity(high/medium/low)、title(15字)、summary(50字)、recommendation(50字)、data_sources。
至少3张，最多5张。""",

    "cost": """基于以下数据，输出成本维度分析卡片（JSON数组）。

【原材料价格】
{prices}

【市场规模】
{market_summary}

【企业利润】
{company_finances}

输出格式：JSON数组，每项包含：type、severity(high/medium/low)、title(15字)、summary(50字)、recommendation(50字)、data_sources。
至少3张，最多5张。""",

    "delivery": """基于以下数据，输出交付维度分析卡片（JSON数组）。

【供应链概况】
{supply_chain_summary}

【重点企业财务】
{key_company_finances}

【近期动态】
{recent_news}

输出格式：JSON数组，每项包含：type、severity(high/medium/low)、title(15字)、summary(50字)、recommendation(50字)、data_sources。
至少3张，最多5张。""",
}


def build_prompts(extracted):
    """根据抽取的数据构建四维 Prompt"""
    prompts = {}

    # --- 技术维度 ---
    tech_overview = extracted.get("technology", {}).get("overview", "无数据")[:500]
    tech_hype = json.dumps(extracted.get("technology", {}).get("hypeCycleTechnologies", []), ensure_ascii=False)[:800]
    kg_summary = json.dumps(extracted.get("knowledge_graph", {}), ensure_ascii=False)[:500]
    tech_news = json.dumps([{"title": n.get("title",""), "tags": n.get("tags",[])} for n in extracted.get("news", [])[:5]], ensure_ascii=False)

    p = USER_PROMPTS["technology"]
    p = p.replace('{overview}', tech_overview)
    p = p.replace('{hype_cycle}', tech_hype)
    p = p.replace('{kg_summary}', kg_summary)
    p = p.replace('{recent_news}', tech_news)
    prompts["technology"] = p

    # --- 质量维度 ---
    standards_data = json.dumps(extracted.get("standards", [])[:3], ensure_ascii=False, indent=2)[:1000]
    quality_news = json.dumps([{"title": n.get("title","")} for n in extracted.get("news", [])[:3]], ensure_ascii=False)

    p = USER_PROMPTS["quality"]
    p = p.replace('{standards}', standards_data)
    p = p.replace('{recent_news}', quality_news)
    prompts["quality"] = p

    # --- 成本维度 ---
    prices_data = json.dumps(extracted.get("prices", {}), ensure_ascii=False)[:500]
    market_summary = json.dumps(extracted.get("market", {}).get("summary", {}), ensure_ascii=False, indent=2)
    company_finances = json.dumps(extracted.get("companies", {}).get("keyCompanies", [])[:3], ensure_ascii=False, indent=2)

    p = USER_PROMPTS["cost"]
    p = p.replace('{prices}', prices_data)
    p = p.replace('{market_summary}', market_summary)
    p = p.replace('{company_finances}', company_finances)
    prompts["cost"] = p

    # --- 交付维度 ---
    supply_chain = extracted.get("companies", {}).get("summary", "无数据")[:500]
    key_finances = json.dumps(extracted.get("companies", {}).get("keyCompanies", [])[:3], ensure_ascii=False)[:500]
    delivery_news = json.dumps([{"title": n.get("title","")} for n in extracted.get("news", [])[:3]], ensure_ascii=False)

    p = USER_PROMPTS["delivery"]
    p = p.replace('{supply_chain_summary}', supply_chain)
    p = p.replace('{key_company_finances}', key_finances)
    p = p.replace('{recent_news}', delivery_news)
    prompts["delivery"] = p

    return prompts


# ============================================================
# LLM 调用
# ============================================================

def call_llm_for_dimension(client, dimension, extracted):
    """调用 LLM 分析单个维度，带重试"""
    import time as _time
    import re as _re
    
    system_prompt = SYSTEM_PROMPTS[dimension]
    prompts = build_prompts(extracted)
    user_prompt = prompts[dimension]

    print(f"  Calling agnes-2.0-flash for dimension: {dimension}...", file=sys.stderr)
    _time.sleep(2)  # Rate limit delay

    for attempt in range(3):
        try:
            result_text = client.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=1500,
            )
            
            # Try to extract JSON
            result = []
            try:
                result = json.loads(result_text)
            except json.JSONDecodeError:
                json_match = _re.search(r'\[\s*\{.*?\}\s*\]', result_text, _re.DOTALL)
                if json_match:
                    try:
                        result = json.loads(json_match.group())
                    except json.JSONDecodeError:
                        pass
                if not result:
                    print(f"  WARNING: Could not parse JSON for {dimension} (attempt {attempt+1})", file=sys.stderr)
                    if attempt < 2:
                        _time.sleep(3)
                        continue
                    return []

            if isinstance(result, list):
                return result
            elif isinstance(result, dict) and "cards" in result:
                return result["cards"]
            elif isinstance(result, dict):
                return [result]
            return []
        except Exception as e:
            print(f"  ERROR: LLM call failed for {dimension} (attempt {attempt+1}): {e}", file=sys.stderr)
            if attempt < 2:
                _time.sleep(3)
                continue
            return []

def run_analysis(client, extracted):
    """运行完整的四维分析"""
    dimensions = ["technology", "quality", "cost", "delivery"]
    output = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+08:00"),
        "dimensions": {},
        "crossDimensionSummary": "",
    }

    for dim in dimensions:
        cards = call_llm_for_dimension(client, dim, extracted)
        output["dimensions"][dim] = {
            "cards": cards,
            "summary": f"{dim}维度共生成 {len(cards)} 条分析卡片",
        }
        print(f"  {dim}: {len(cards)} cards generated", file=sys.stderr)

    # 生成综合分析摘要（再次调用 LLM）
    print("  Generating cross-dimension summary...", file=sys.stderr)
    summary_data = json.dumps({
        d: output["dimensions"][d]["cards"][:2]  # 每个维度取前 2 条做摘要
        for d in dimensions
    }, ensure_ascii=False, indent=2)

    summary_prompt = f"""基于以下四维分析结果，生成一段综合分析摘要（100字以内）。
给出最高优先级的 3 条建议。

{summary_data}

直接输出摘要文本。"""

    try:
        output["crossDimensionSummary"] = client.generate(
            prompt=summary_prompt,
            system_prompt="你是天线行业分析师，擅长综合多维度信息给出高层总结。",
            temperature=0.3,
            max_tokens=1000,
        )
    except Exception as e:
        print(f"  WARNING: Summary generation failed: {e}", file=sys.stderr)
        output["crossDimensionSummary"] = "综合分析暂不可用"

    return output


# ============================================================
# 缓存管理
# ============================================================

def compute_data_hash():
    """计算所有数据文件的哈希，用于缓存失效检测"""
    hasher = hashlib.sha256()
    for name, path in DATA_FILES.items():
        try:
            with open(path, "rb") as f:
                hasher.update(f.read())
        except FileNotFoundError:
            pass
    return hasher.hexdigest()


def is_cache_valid():
    """检查缓存是否有效"""
    if not os.path.exists(CACHE_FILE):
        return False
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            cache = json.load(f)
        cached_time = datetime.fromisoformat(cache.get("cachedAt", "2000-01-01"))
        now = datetime.now()
        if (now - cached_time).total_seconds() > CACHE_TTL_HOURS * 3600:
            return False
        return cache.get("dataHash") == compute_data_hash()
    except Exception:
        return False


def save_cache(output):
    """保存分析结果到缓存"""
    cache = {
        **output,
        "cachedAt": datetime.now().isoformat(),
        "dataHash": compute_data_hash(),
    }
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


# ============================================================
# 主流程
# ============================================================

def main():
    print("=" * 60, file=sys.stderr)
    print("天线行业情报追踪 - 四维交叉分析生成", file=sys.stderr)
    print("=" * 60, file=sys.stderr)

    # 检查 API Key
    api_key = os.environ.get("AGNES_API_KEY")
    if not api_key:
        print("ERROR: AGNES_API_KEY not set.", file=sys.stderr)
        print("Set it via: export AGNES_API_KEY=sk-xxx (Linux/Mac)", file=sys.stderr)
        print("Or: $env:AGNES_API_KEY='sk-xxx' (Windows PowerShell)", file=sys.stderr)
        sys.exit(1)

    # 检查数据文件
    for name, path in DATA_FILES.items():
        if not os.path.exists(path):
            print(f"WARNING: Data file not found: {path}", file=sys.stderr)

    # 创建输出目录
    os.makedirs(APP_DATA_DIR, exist_ok=True)

    # 检查缓存
    if is_cache_valid():
        print("Cache is valid, skipping LLM call.", file=sys.stderr)
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            output = json.load(f)
    else:
        print("Cache miss or expired. Running analysis...", file=sys.stderr)

        # Step 1: 抽取数据
        print("[1/4] Extracting data from source files...", file=sys.stderr)
        extracted = extract_all()

        # Step 2: 初始化 LLM 客户端
        print("[2/4] Initializing Agnes client...", file=sys.stderr)
        from scripts.lib.agnes_client import AgnesClient
        client = AgnesClient(api_key=api_key)

        # Step 3: 运行分析
        print("[3/4] Running four-dimensional analysis...", file=sys.stderr)
        output = run_analysis(client, extracted)

        # Step 4: 保存缓存
        print("[4/4] Saving cache...", file=sys.stderr)
        save_cache(output)

    # 写入输出文件
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    total_cards = sum(
        len(output["dimensions"][d]["cards"])
        for d in output.get("dimensions", {})
    )
    print(f"\nDone! Output: {OUTPUT_FILE}", file=sys.stderr)
    print(f"Total analysis cards: {total_cards}", file=sys.stderr)
    print(f"Dimensions: {list(output.get('dimensions', {}).keys())}", file=sys.stderr)
    print("=" * 60, file=sys.stderr)


if __name__ == "__main__":
    main()

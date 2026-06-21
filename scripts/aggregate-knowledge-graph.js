#!/usr/bin/env node
/**
 * 知识图谱数据聚合脚本
 * 从各板块 JSON 文件中自动提取实体和关系，注入 knowledge-graph.json
 * 
 * 用法: node scripts/aggregate-knowledge-graph.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'app', '_data');
const KG_FILE = path.join(DATA_DIR, 'knowledge-graph.json');

// 实体去重 map: id -> entity
// 同时维护 name+type 的索引，避免同名同类型重复
const entityByNameType = new Map();
const entityMap = new Map();
// 关系数组
const relationList = [];

// ========== 辅助函数 ==========

function uid(prefix, name) {
  // 用 name 的 hash 做 id，保证同名实体 id 一致
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return `${prefix}_${Math.abs(hash).toString(36)}`;
}

function upsertEntity(entity) {
  // 同名同类型去重
  const dedupeKey = `${entity.type}:${entity.name}`;
  if (entityByNameType.has(dedupeKey)) {
    // 合并 metadata 和 source_sectors
    const existingId = entityByNameType.get(dedupeKey);
    const existing = entityMap.get(existingId);
    if (entity.metadata) {
      Object.assign(existing.metadata || (existing.metadata = {}), entity.metadata);
    }
    const sectors = new Set([...(existing.source_sectors || []), ...(entity.source_sectors || [])]);
    existing.source_sectors = [...sectors];
    return;
  }
  
  const existing = entityMap.get(entity.id);
  if (existing) {
    // 同 id 合并
    if (!existing.description && entity.description) existing.description = entity.description;
    if (!existing.metadata) existing.metadata = entity.metadata || {};
    else Object.assign(existing.metadata, entity.metadata || {});
    const sectors = new Set([...(existing.source_sectors || []), ...(entity.source_sectors || [])]);
    existing.source_sectors = [...sectors];
  } else {
    entityMap.set(entity.id, entity);
    entityByNameType.set(dedupeKey, entity.id);
  }
}

function addRelation(relation) {
  // 去重：相同 source + target + relation
  const dup = relationList.find(r =>
    r.source === relation.source &&
    r.target === relation.target &&
    r.relation === relation.relation
  );
  if (!dup) {
    relationList.push(relation);
  }
}

// ========== 1. 从 companies.json 提取企业实体 ==========

function extractCompanies() {
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'companies.json'), 'utf8'));
  const supplyChain = data.supplyChain;
  if (!supplyChain) return;

  // tier6 和 tier7 是材料供应商，不作为 company 实体提取
  const skipTiers = ['tier6_key_materials', 'tier7_raw_materials'];

  for (const [tierKey, tier] of Object.entries(supplyChain)) {
    if (skipTiers.includes(tierKey)) continue;
    if (!tier.companies || !Array.isArray(tier.companies)) continue;

    for (const comp of tier.companies) {
      const id = uid('company', comp.name);
      upsertEntity({
        id,
        type: 'company',
        name: comp.name,
        description: comp.position || comp.role || '',
        source_sectors: ['enterprise'],
        metadata: {
          stock_code: comp.stockCode || '',
          exchange: comp.exchange || '',
          tier: tierKey.replace('tier', ''),
          role: comp.role || '',
        }
      });
    }
  }
}

// ========== 2. 从 technology.json 提取技术实体 ==========

function extractTechnologies() {
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'technology.json'), 'utf8'));

  // 从 hypeCycle.technologies 提取
  if (data.hypeCycle?.technologies) {
    for (const tech of data.hypeCycle.technologies) {
      const id = uid('technology', tech.name);
      upsertEntity({
        id,
        type: 'technology',
        name: tech.name,
        description: tech.description || tech.phase + '阶段',
        source_sectors: ['technology'],
        metadata: {
          phase: tech.phase || '',
          maturity_score: tech.maturityScore || 0,
          tech_level: tech.phase === 'plateau' ? 'commercial' : tech.phase === 'slope' ? 'growth' : 'prototype',
        }
      });
    }
  }

  // 从 technologyDetail 提取更详细的技术
  if (data.technologyDetail) {
    for (const [key, detail] of Object.entries(data.technologyDetail)) {
      const id = uid('technology', detail.name);
      const existing = entityMap.get(id);
      if (!existing) {
        upsertEntity({
          id,
          type: 'technology',
          name: detail.name,
          description: detail.currentStatus || '',
          source_sectors: ['technology'],
          metadata: {
            mainstream_routes: detail.mainstreamRoutes ? detail.mainstreamRoutes.length : 0,
            challenges: detail.challenges ? detail.challenges.length : 0,
          }
        });
      }
    }
  }
}

// ========== 3. 从 standards.json 提取标准实体 ==========

function extractStandards() {
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'standards.json'), 'utf8'));

  if (!data.categories) return;

  for (const cat of data.categories) {
    if (!cat.standards || !Array.isArray(cat.standards)) continue;

    for (const std of cat.standards) {
      const id = uid('standard', std.name);
      upsertEntity({
        id,
        type: 'standard',
        name: std.name,
        description: std.title || std.scope || '',
        source_sectors: ['standards'],
        metadata: {
          organization: std.organization || '',
          status: std.status || '',
          publishDate: std.publishDate || '',
          category: cat.code,
        }
      });
    }
  }
}

// ========== 4. 从 companies.json 的 tier6/tier7 提取材料实体 ==========

function extractMaterials() {
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'companies.json'), 'utf8'));
  const supplyChain = data.supplyChain;
  if (!supplyChain) return;

  // tier6_key_materials 和 tier7_raw_materials 提取材料供应商
  const materialTiers = ['tier6_key_materials', 'tier7_raw_materials'];
  for (const tierKey of materialTiers) {
    const tier = supplyChain[tierKey];
    if (!tier?.companies) continue;
    for (const comp of tier.companies) {
      const id = uid('material', comp.name);
      upsertEntity({
        id,
        type: 'material',
        name: comp.name,
        description: comp.position || comp.role || `${tierKey} - 材料供应商`,
        source_sectors: ['market', 'enterprise'],
        metadata: {
          stock_code: comp.stockCode || '',
          exchange: comp.exchange || '',
          tier: tierKey.replace('tier', ''),
          tier_label: tierKey.replace(/_/g, ' '),
        }
      });
    }
  }

  // 从 market.json segments 中提取材料相关 keyPlayers
  try {
    const marketData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'market.json'), 'utf8'));
    if (marketData.segments) {
      for (const seg of marketData.segments) {
        if (seg.keyPlayers) {
          for (const player of seg.keyPlayers) {
            // 跳过已知企业（已有 company 实体）
            const existingCompany = [...entityMap.values()].find(e => e.type === 'company' && e.name === player);
            if (!existingCompany && seg.name && (seg.name.includes('材料') || seg.name.includes('原料'))) {
              const id = uid('material', player);
              upsertEntity({
                id,
                type: 'material',
                name: player,
                description: `${seg.name}领域相关企业`,
                source_sectors: ['market'],
                metadata: { segment: seg.name }
              });
            }
          }
        }
      }
    }
  } catch(e) {}
}

// ========== 5. 从 news.json 提取事件实体 ==========

function extractEvents() {
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'news.json'), 'utf8'));

  // news 数据是对象数组，key 是 '0', '1', '2'...
  const keys = Object.keys(data).filter(k => /^\d+$/.test(k));
  
  for (const key of keys.slice(0, 20)) { // 只取最近20条
    const article = data[key];
    if (!article || !article.title) continue;

    const id = uid('event', article.title.substring(0, 30));
    upsertEntity({
      id,
      type: 'event',
      name: article.title,
      description: article.summary || '',
      source_sectors: ['dynamics'],
      metadata: {
        date: article.date || '',
        source: article.source || '',
        tags: article.tags || [],
      }
    });
  }
}

// ========== 6. 建立跨板块关系 ==========

function buildRelations() {
  // 技术 - 企业：从 technologyDetail.vendorAnalysis 中提取
  // 注意: vendorAnalysis 的 key 是简称 (如 "华为"), companies.json 里是完整名 (如 "华为技术有限公司")
  // 需要模糊匹配到真实的 company entity,否则 id 对不上会变成孤悬关系
  if (dataCache.technology?.technologyDetail) {
    const allCompanies = [...entityMap.values()].filter(e => e.type === 'company');
    for (const [key, detail] of Object.entries(dataCache.technology.technologyDetail)) {
      if (detail.vendorAnalysis && typeof detail.vendorAnalysis === 'object') {
        const techId = uid('technology', detail.name);
        for (const [vendorName] of Object.entries(detail.vendorAnalysis)) {
          // 模糊匹配: company.name 包含 vendorName 或 vendorName 包含 company.name
          const matched = allCompanies.find(c =>
            c.name.includes(vendorName) || vendorName.includes(c.name) || c.name.startsWith(vendorName)
          );
          if (matched) {
            addRelation({
              source: techId,
              target: matched.id,
              relation: 'applied_by',
              confidence: 0.8,
              evidence: `${detail.name} 由 ${matched.name} 应用/研发`
            });
          } else {
            console.warn(`[buildRelations] vendorAnalysis 找不到匹配公司: ${vendorName}`);
          }
        }
      }
    }
  }

  // 标准 - 企业：从 companies.json 中推断（企业产品符合某标准）
  // 简化：3GPP 标准 -> 设备商
  if (dataCache.standards?.categories) {
    for (const cat of dataCache.standards.categories) {
      if (cat.code === 'intl_3gpp' && cat.standards) {
        for (const std of cat.standards) {
          if (std.name.includes('Release')) {
            const stdId = uid('standard', std.name);
            // 所有设备商都参与 3GPP
            const companyEntities = [...entityMap.values()].filter(e => e.type === 'company' && 
              ['华为', '中兴通讯', '爱立信', '诺基亚', 'NEC'].some(n => e.name.includes(n)));
            for (const comp of companyEntities) {
              addRelation({
                source: comp.id,
                target: stdId,
                relation: 'complies_with',
                confidence: 0.85,
                evidence: `${comp.name} 参与 ${std.name} 标准制定`
              });
            }
          }
        }
      }
    }
  }

  // 事件 - 技术：从 news tags 推断
  if (dataCache.news) {
    const keys = Object.keys(dataCache.news).filter(k => /^\d+$/.test(k));
    for (const key of keys.slice(0, 10)) {
      const article = dataCache.news[key];
      if (!article?.tags) continue;
      for (const tag of article.tags) {
        if (['5G/6G', '技术标准', '行业动态'].includes(tag)) {
          const eventId = uid('event', article.title.substring(0, 30));
          // 关联到相关技术
          const techEntities = [...entityMap.values()].filter(e => e.type === 'technology');
          if (techEntities.length > 0) {
            addRelation({
              source: eventId,
              target: techEntities[0].id,
              relation: 'related_to',
              confidence: 0.5,
              evidence: article.title
            });
          }
        }
      }
    }
  }
}

// ========== 数据缓存 ==========
const dataCache = {};

function loadDataCaches() {
  try { dataCache.companies = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'companies.json'), 'utf8')); } catch(e) {}
  try { dataCache.technology = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'technology.json'), 'utf8')); } catch(e) {}
  try { dataCache.standards = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'standards.json'), 'utf8')); } catch(e) {}
  try { dataCache.market = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'market.json'), 'utf8')); } catch(e) {}
  try { dataCache.news = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'news.json'), 'utf8')); } catch(e) {}
}

// ========== 主流程 ==========

function main() {
  console.log('=== 知识图谱数据聚合脚本 ===');
  console.log('开始提取各板块数据...\n');

  loadDataCaches();

  extractCompanies();
  console.log(`[companies.json] 提取企业实体`);

  extractTechnologies();
  console.log(`[technology.json] 提取技术实体`);

  extractStandards();
  console.log(`[standards.json] 提取标准实体`);

  extractMaterials();
  console.log(`[market.json] 提取材料实体`);

  extractEvents();
  console.log(`[news.json] 提取事件实体`);

  console.log(`\n实体总数: ${entityMap.size}`);
  console.log(`\n开始建立跨板块关系...`);
  buildRelations();
  console.log(`关系总数: ${relationList.length}`);

  // 构建输出
  const output = {
    lastUpdate: new Date().toISOString().split('T')[0],
    version: '2.0',
    description: '天线产业知识图谱 - 实体关系数据（自动聚合）',
    entities: [...entityMap.values()],
    relations: relationList,
  };

  // 写入
  fs.writeFileSync(KG_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\n已更新 ${KG_FILE}`);
  console.log(`实体: ${output.entities.length} 个`);
  console.log(`关系: ${output.relations.length} 条`);
}

main();

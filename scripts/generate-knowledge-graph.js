/**
 * 知识图谱数据抽取脚本
 * 从其他板块的 JSON 数据中自动抽取实体和关系，生成 knowledge-graph.json
 * 
 * 用法：node scripts/generate-knowledge-graph.js
 */

const fs = require('fs');
const path = require('path');

// 输入数据文件
const DATA_DIR = path.join(__dirname, '..', 'app', '_data');
const OUTPUT_FILE = path.join(DATA_DIR, 'knowledge-graph.json');

// 实体类型映射
const TYPE_MAP = {
  // companies.json -> company 或 material
  'op': 'company',
  'ev': 'company',
  'ao': 'company',
  'rf': 'company',
  'ap': 'company',
  // technology.json -> technology
  'tech': 'technology',
  // standards.json -> standard
  'std': 'standard',
  // prices.json -> material
  'price': 'material',
};

// 从 companies.json 抽取实体
function extractCompanies(data) {
  const entities = [];
  const relations = [];
  let entityIdCounter = 0;

  const sections = [
    { key: 'tier1_operators', type: 'company', label: '运营商' },
    { key: 'tier2_equipment_vendors', type: 'company', label: '主设备商' },
    { key: 'tier3_antenna_oems', type: 'company', label: '天线整机' },
    { key: 'tier4_rf_components', type: 'company', label: '射频部件' },
    { key: 'tier5_components', type: 'company', label: '部件' },
    { key: 'tier6_materials', type: 'company', label: '材料' },
    { key: 'tier7_raw_materials', type: 'company', label: '原材料' },
  ];

  // 收集所有公司名称→ID的映射
  const companyNameMap = new Map();

  for (const section of sections) {
    const companies = data.supplyChain?.[section.key]?.companies || [];
    for (const comp of companies) {
      const id = `company_${comp.id || (entityIdCounter++)}`;
      entities.push({
        id,
        type: section.type,
        name: comp.name,
        description: comp.position || comp.description || '',
        source_sectors: ['enterprise'],
        metadata: {
          stock_code: comp.stockCode || '未上市',
          location: comp.location || '',
          is_key: comp.isKey || false,
        }
      });
      // 建立名称→ID映射
      companyNameMap.set(comp.name, id);

      // 客户关系
      if (comp.customers && comp.customers.length > 0) {
        for (const customer of comp.customers) {
          relations.push({
            source: id,
            target: `company_${customer}`, // 简化处理
            relation: 'supplies_to',
            confidence: 0.7,
            evidence: `${comp.name} 的客户关系：${customer}`
          });
        }
      }
    }
  }

  return { entities, relations, companyNameMap };
}

// 从 technology.json 抽取实体
function extractTechnologies(data, summaryData = null) {
  const entities = [];
  const relations = [];

  // 构建 summary 数据映射
  const summaryMap = new Map();
  const techOrder = [];
  if (Array.isArray(summaryData)) {
    for (const s of summaryData) {
      summaryMap.set(s.entity, s);
      techOrder.push(s.entity);
    }
  }

  // 构建 technology.json 的技术详情映射（用于 vendorAnalysis 和 phase 等信息）
  const techDetailMap = new Map();
  const techList = data.technologyDetail || data.hypeCycle?.items || [];
  for (const tech of techList) {
    const nameCn = tech.nameCn || tech.name;
    techDetailMap.set(nameCn, tech);
  }

  // 名称映射表：summary.json 的名称 → technology.json 的名称
  // 因为两套数据的命名不完全一致
  const nameMapping = new Map([
    ['Massive MIMO', '大规模天线阵列'],
    ['AAU', '有源天线单元'],
    ['5G NR mmWave', '5G毫米波天线'],
    ['相控阵', '相控阵天线'],
    ['LCP/LDS', 'LCP液晶聚合物/ LDS天线技术'],
    ['卫星通信平板相控阵', '卫星通信平板相控阵'],
    ['AI Beamforming', 'AI辅助波束赋形'],
    ['RIS', '可重构智能表面'],
    ['柔性/可穿戴天线', '柔性/可穿戴天线'],
    ['龙伯透镜', '龙伯透镜天线'],
    ['THz', '太赫兹通信天线'],
    ['频谱共享', '频谱共享天线'],
    ['数字孪生', '数字孪生天线'],
    ['透镜天线', '透镜天线'],
  ]);

  // 给 tech 分配 tech_100X ID，保持与 relations.json 兼容
  const techIdMap = new Map(); // summary_name -> id
  techOrder.forEach((name, idx) => {
    techIdMap.set(name, `tech_${1001 + idx}`);
  });

  // 用 summary.json 作为主数据源（有 vernacular 解读）
  for (const summaryName of techOrder) {
    const summaryInfo = summaryMap.get(summaryName);
    if (!summaryInfo) continue;

    // 查找对应的 technology.json 数据
    let techDetail = techDetailMap.get(summaryName);
    if (!techDetail) {
      // 尝试通过名称映射找到
      for (const [summaryKey, techKey] of nameMapping) {
        if (summaryKey === summaryName) {
          const mapped = techDetailMap.get(techKey);
          if (mapped) { techDetail = mapped; break; }
        }
      }
    }

    const id = techIdMap.get(summaryName) || `tech_${summaryName.replace(/\s+/g, '_').toLowerCase()}`;
    
    const entity = {
      id,
      type: 'technology',
      name: summaryName,
      description: techDetail?.currentStatus || summaryInfo.summary || '',
      source_sectors: ['technology'],
      metadata: {
        phase: techDetail?.phase || '',
        maturity: techDetail?.confidence || '中',
        category: techDetail?.category || '',
      }
    };
    
    // 合并 summary 和 summary_vernacular
    entity.summary = summaryInfo.summary || '';
    entity.summary_vernacular = summaryInfo.summary_vernacular || '';
    
    entities.push(entity);
  }

  return { entities, relations, techIdMap, summaryMap, nameMapping };
}

// 从 standards.json 抽取实体
function extractStandards(data) {
  const entities = [];
  const relations = [];

  for (const cat of data.categories || []) {
    for (const std of cat.standards || []) {
      const id = `std_${std.name.replace(/\s+/g, '_').toLowerCase()}`;
      entities.push({
        id,
        type: 'standard',
        name: std.name,
        description: std.description || '',
        source_sectors: ['standards'],
        metadata: {
          level: cat.category || '行业',
          status: std.status || '现行',
        }
      });
    }
  }

  return { entities, relations };
}

// 从 prices.json 抽取实体
function extractMaterials(data) {
  const entities = [];
  const relations = [];

  for (const cat of data.categories || []) {
    for (const mat of cat.materials || []) {
      const id = `material_${mat.name.replace(/\s+/g, '_').toLowerCase()}`;
      entities.push({
        id,
        type: 'material',
        name: mat.name,
        description: mat.impact || '',
        source_sectors: ['market'],
        metadata: {
          price: mat.currentPrice,
          unit: mat.unit,
          trend: mat.trend,
        }
      });
    }
  }

  return { entities, relations };
}

// 从 news.json 抽取实体
function extractEvents(data) {
  const entities = [];
  const relations = [];

  // 只取最近的新闻作为事件实体
  const recentNews = (data || []).slice(-10);
  for (const news of recentNews) {
    const id = `event_${news.id}`;
    entities.push({
      id,
      type: 'event',
      name: news.title,
      description: news.summary || '',
      source_sectors: ['dynamics'],
      metadata: {
        date: news.date,
        source: news.source,
      }
    });
  }

  return { entities, relations };
}

// 生成关系（基于常识和数据结构）
async function generateRelations(entities, existingRelations = [], companyNameMap = new Map(), techIdMap = null, techData = null, pricesData = null, standardsData = null, newsData = null) {
  const relations = [...existingRelations];
  const entityMap = new Map();
  entities.forEach(e => entityMap.set(e.id, e));

  // ========== 0. 合并 relations.json 中的技术↔技术关系 ==========（已补 evidence）==========
  try {
    const techRelPath = path.join(DATA_DIR, 'relations.json');
    const techRels = JSON.parse(fs.readFileSync(techRelPath, 'utf-8'));
    const techEntityIds = new Set(entities.filter(e => e.type === 'technology').map(e => e.id));
    let merged = 0;
    for (const tr of techRels) {
      if (techEntityIds.has(tr.source) && techEntityIds.has(tr.target) && tr.evidence) {
        // 避免与已有关系重复
        const key = `${tr.source}-${tr.predicate || tr.relation}-${tr.target}`;
        const exists = relations.some(r => 
          `${r.source}-${r.relation || r.predicate}-${r.target}` === key
        );
        if (!exists) {
          relations.push({
            source: tr.source,
            target: tr.target,
            relation: tr.predicate || 'related_to',
            predicate: tr.predicate,
            confidence: 0.7,
            evidence: tr.evidence
          });
          merged++;
        }
      }
    }
    console.log(`  📡 技术↔技术关系合并: ${merged} 条`);
  } catch (e) {
    console.log('  ⚠️ 读取 relations.json 失败:', e.message);
  }

  // ========== 1. 技术 ↔ 企业（从 technology.json vendorAnalysis 提取）==========
  if (techData && techData.technologyDetail) {
    const techEntities = entities.filter(e => e.type === 'technology');
    const techNameToId = new Map();
    techEntities.forEach(t => techNameToId.set(t.name, t.id));

    // 构建反向映射：technology.json 名称 → summary.json 名称
    const reverseNameMap = new Map();
    if (techIdMap && techIdMap._nameMapping) {
      for (const [sumName, techId] of techIdMap) {
        // techIdMap stores summary_name -> id
      }
    }
    // 直接从 entities 匹配：technology.json 的 nameCn → entity name
    // 使用硬编码映射表
    const techNameReverseMap = new Map([
      ['大规模天线阵列', 'Massive MIMO'],
      ['有源天线单元', 'AAU'],
      ['5G毫米波天线', '5G NR mmWave'],
      ['相控阵天线', '相控阵'],
      ['LCP液晶聚合物/ LDS天线技术', 'LCP/LDS'],
      ['卫星通信平板相控阵', '卫星通信平板相控阵'],
      ['AI辅助波束赋形', 'AI Beamforming'],
      ['可重构智能表面', 'RIS'],
      ['柔性/可穿戴天线', '柔性/可穿戴天线'],
      ['龙伯透镜天线', '龙伯透镜'],
      ['太赫兹通信天线', 'THz'],
      ['频谱共享天线', '频谱共享'],
      ['数字孪生天线', '数字孪生'],
      ['透镜天线', '透镜天线'],
    ]);

    for (const tech of techData.technologyDetail) {
      const techName = tech.nameCn || tech.name;
      // 映射到 summary.json 的名称
      const summaryName = techNameReverseMap.get(techName) || techName;
      const techId = techNameToId.get(summaryName);
      if (!techId || !tech.vendorAnalysis) continue;

      for (const [companyName, description] of Object.entries(tech.vendorAnalysis)) {
        const companyId = companyNameMap.get(companyName);
        if (!companyId) continue;

        relations.push({
          source: techId,
          target: companyId,
          relation: 'adopted_by',
          confidence: 0.8,
          evidence: `${summaryName} 被 ${companyName} 采用 — ${description.substring(0, 50)}`
        });
      }
    }
    console.log(`  🔗 技术↔企业关系: 新增 ${relations.length - existingRelations.length} 条`);
  }

  // ========== 2. 企业 ↔ 材料（从 supplyChain tier 层级推导）==========
  if (pricesData && pricesData.categories) {
    const materialEntities = entities.filter(e => e.type === 'material');
    const matNameToId = new Map();
    materialEntities.forEach(m => matNameToId.set(m.name, m.id));

    // 材料类别→供应链 tier 的映射
    const materialTierMap = {
      '金属原材料': 'tier7_raw_materials',
      '工程塑料': 'tier7_raw_materials',
      'PCB/覆铜板': 'tier6_key_materials',
      '射频器件': 'tier5_rf_parts',
    };

    for (const cat of pricesData.categories) {
      const catName = cat.category || cat.name;
      const tier = materialTierMap[catName];
      if (!tier) continue;

      const tierCompanies = pricesData.supplyChain?.[tier]?.companies || [];
      for (const mat of cat.materials || []) {
        const matId = matNameToId.get(mat.name);
        if (!matId) continue;

        // 该材料类别的主要供应商
        for (const comp of tierCompanies.slice(0, 3)) {
          const companyId = companyNameMap.get(comp.name);
          if (!companyId) continue;

          relations.push({
            source: companyId,
            target: matId,
            relation: 'supplies_material',
            confidence: 0.6,
            evidence: `${comp.name} 供应 ${mat.name}（${catName}）`
          });
        }
      }
    }
  }

  // ========== 3. 标准 ↔ 技术（从标准描述匹配技术关键词）==========
  if (standardsData && standardsData.categories && techData) {
    const techEntities = entities.filter(e => e.type === 'technology');
    const techNameToId = new Map();
    techEntities.forEach(t => techNameToId.set(t.name, t.id));

    // 技术关键词映射（中文名→英文名/缩写）
    const techKeywords = new Map();
    techEntities.forEach(t => {
      techKeywords.set(t.name, t.id);
      // 添加常见别名
      const aliases = {
        '大规模天线阵列': ['Massive MIMO', 'MIMO'],
        '有源天线单元': ['AAU'],
        '5G毫米波天线': ['毫米波', 'mmWave'],
        '相控阵天线': ['相控阵', 'Phased Array'],
        'LCP/LDS天线技术': ['LCP', 'LDS'],
        'AI辅助波束赋形': ['波束赋形', 'Beamforming'],
        'RIS智能超表面': ['RIS', '智能超表面'],
      };
      if (aliases[t.name]) {
        for (const alias of aliases[t.name]) {
          techKeywords.set(alias, t.id);
        }
      }
    });

    for (const cat of standardsData.categories) {
      for (const std of cat.standards || []) {
        const stdId = `std_${std.name.replace(/\s+/g, '_').toLowerCase()}`;
        const desc = (std.description || '').toLowerCase();
        const name = (std.name || '').toLowerCase();

        for (const [techName, techId] of techKeywords) {
          const techNameLower = techName.toLowerCase();
          if (desc.includes(techNameLower) || name.includes(techNameLower) || name.includes(techNameLower.replace(/\s/g, ''))) {
            relations.push({
              source: stdId,
              target: techId,
              relation: 'specifies',
              confidence: 0.5,
              evidence: `标准 ${std.name} 涉及 ${techName} 技术要求`
            });
          }
        }
      }
    }
  }

  // ========== 4. 事件 ↔ 技术（从 news.json tags 提取）==========
  if (newsData && Array.isArray(newsData) && newsData.length > 0) {
    const techEntities = entities.filter(e => e.type === 'technology');
    const techNameToId = new Map();
    techEntities.forEach(t => techNameToId.set(t.name, t.id));

    const recentNews = newsData.slice(-10);
    for (const news of recentNews) {
      const eventId = `event_${news.id}`;
      const tags = news.tags || [];
      for (const tag of tags) {
        const techId = techNameToId.get(tag);
        if (techId) {
          relations.push({
            source: eventId,
            target: techId,
            relation: 'mentions',
            confidence: 0.4,
            evidence: `新闻《${news.title}》提及 ${tag}`
          });
        }
      }
    }
  }

  // 去重
  const seen = new Set();
  const deduped = [];
  for (const r of relations) {
    const key = `${r.source}-${r.relation}-${r.target}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }

  console.log(`  ✅ 关系总数: ${deduped.length}（去重后）`);
  return deduped;
}

// 主函数
async function main() {
  console.log('开始抽取知识图谱数据...\n');

  const allEntities = [];
  const allRelations = [];

  // 1. 从 companies.json 抽取企业实体
  let companyNameMap = new Map();
  try {
    const companiesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'companies.json'), 'utf-8'));
    const { entities, relations, companyNameMap: cmap } = extractCompanies(companiesData);
    companyNameMap = cmap;
    allEntities.push(...entities);
    allRelations.push(...relations);
    console.log(`✅ 从企业板块抽取 ${entities.length} 个实体，${relations.length} 条关系`);
  } catch (e) {
    console.log('❌ 读取 companies.json 失败:', e.message);
  }

  // 2. 从 technology.json 抽取技术实体
  let techData = null;
  let summaryData = null;
  let techIdMap = new Map();
  try {
    techData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'technology.json'), 'utf-8'));
    // 同时读取 knowledge-graph-summary.json 获取 summary_vernacular
    try {
      summaryData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'knowledge-graph-summary.json'), 'utf-8'));
    } catch (e) {
      console.log('⚠️ 读取 knowledge-graph-summary.json 失败，技术实体将无通俗解读');
    }
    const { entities, relations, techIdMap: tidMap } = extractTechnologies(techData, summaryData);
    techIdMap = tidMap;
    allEntities.push(...entities);
    allRelations.push(...relations);
    console.log(`✅ 从技术板块抽取 ${entities.length} 个实体，${relations.length} 条关系`);
  } catch (e) {
    console.log('❌ 读取 technology.json 失败:', e.message);
  }

  // 3. 从 standards.json 抽取标准实体
  let stdData = null;
  try {
    stdData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'standards.json'), 'utf-8'));
    const { entities, relations } = extractStandards(stdData);
    allEntities.push(...entities);
    allRelations.push(...relations);
    console.log(`✅ 从标准板块抽取 ${entities.length} 个实体，${relations.length} 条关系`);
  } catch (e) {
    console.log('❌ 读取 standards.json 失败:', e.message);
  }

  // 4. 从 prices.json 抽取材料实体
  let pricesData = null;
  try {
    pricesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'prices.json'), 'utf-8'));
    const { entities, relations } = extractMaterials(pricesData);
    allEntities.push(...entities);
    allRelations.push(...relations);
    console.log(`✅ 从市场板块抽取 ${entities.length} 个实体，${relations.length} 条关系`);
  } catch (e) {
    console.log('❌ 读取 prices.json 失败:', e.message);
  }

  // 5. 从 news.json 抽取事件实体
  let newsData = null;
  try {
    newsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'news.json'), 'utf-8'));
    const { entities, relations } = extractEvents(newsData);
    allEntities.push(...entities);
    allRelations.push(...relations);
    console.log(`✅ 从行业动态板块抽取 ${entities.length} 个实体，${relations.length} 条关系`);
  } catch (e) {
    console.log('❌ 读取 news.json 失败:', e.message);
  }

  // 6. 生成实体间的跨类型关系
  console.log('\n🔗 生成实体间跨类型关系...');
  const enrichedRelations = await generateRelations(allEntities, allRelations, companyNameMap, techIdMap, techData, pricesData, stdData, newsData);

  // 7. 输出生成的知识图谱数据
  const output = {
    lastUpdate: new Date().toISOString().split('T')[0],
    version: '2.0',
    description: '天线行业知识图谱 - 自动从各板块数据抽取生成',
    entities: allEntities,
    relations: enrichedRelations,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ 知识图谱数据已生成：${OUTPUT_FILE}`);
  console.log(`   实体总数：${allEntities.length}`);
  console.log(`   关系总数：${enrichedRelations.length}`);
  console.log(`   数据类型：${[...new Set(allEntities.map(e => e.type))].join(', ')}`);
}

main().catch(e => console.error('Fatal error:', e));

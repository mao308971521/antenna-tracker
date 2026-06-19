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

  return { entities, relations };
}

// 从 technology.json 抽取实体
function extractTechnologies(data) {
  const entities = [];
  const relations = [];

  for (const tech of data.items || []) {
    const id = `tech_${tech.name.replace(/\s+/g, '_').toLowerCase()}`;
    entities.push({
      id,
      type: 'technology',
      name: tech.nameCn || tech.name,
      description: tech.currentStatus || '',
      source_sectors: ['technology'],
      metadata: {
        phase: tech.phase,
        maturity: tech.confidence || '中',
      }
    });
  }

  return { entities, relations };
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
function generateRelations(entities, existingRelations = []) {
  const relations = [...existingRelations];
  
  // 技术-材料关系：从 technology.json 的 vendorAnalysis 中提取
  // 企业-标准关系：从 companies.json 中的 isKey 标记
  // 事件-技术关系：从 news.json 的 tags 中提取

  return relations;
}

// 主函数
async function main() {
  console.log('开始抽取知识图谱数据...\n');

  const allEntities = [];
  const allRelations = [];

  // 1. 从 companies.json 抽取企业实体
  try {
    const companiesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'companies.json'), 'utf-8'));
    const { entities, relations } = extractCompanies(companiesData);
    allEntities.push(...entities);
    allRelations.push(...relations);
    console.log(`✅ 从企业板块抽取 ${entities.length} 个实体，${relations.length} 条关系`);
  } catch (e) {
    console.log('❌ 读取 companies.json 失败:', e.message);
  }

  // 2. 从 technology.json 抽取技术实体
  try {
    const techData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'technology.json'), 'utf-8'));
    const { entities, relations } = extractTechnologies(techData);
    allEntities.push(...entities);
    allRelations.push(...relations);
    console.log(`✅ 从技术板块抽取 ${entities.length} 个实体，${relations.length} 条关系`);
  } catch (e) {
    console.log('❌ 读取 technology.json 失败:', e.message);
  }

  // 3. 从 standards.json 抽取标准实体
  try {
    const stdData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'standards.json'), 'utf-8'));
    const { entities, relations } = extractStandards(stdData);
    allEntities.push(...entities);
    allRelations.push(...relations);
    console.log(`✅ 从标准板块抽取 ${entities.length} 个实体，${relations.length} 条关系`);
  } catch (e) {
    console.log('❌ 读取 standards.json 失败:', e.message);
  }

  // 4. 从 prices.json 抽取材料实体
  try {
    const pricesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'prices.json'), 'utf-8'));
    const { entities, relations } = extractMaterials(pricesData);
    allEntities.push(...entities);
    allRelations.push(...relations);
    console.log(`✅ 从市场板块抽取 ${entities.length} 个实体，${relations.length} 条关系`);
  } catch (e) {
    console.log('❌ 读取 prices.json 失败:', e.message);
  }

  // 5. 从 news.json 抽取事件实体
  try {
    const newsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'news.json'), 'utf-8'));
    const { entities, relations } = extractEvents(newsData);
    allEntities.push(...entities);
    allRelations.push(...relations);
    console.log(`✅ 从行业动态板块抽取 ${entities.length} 个实体，${relations.length} 条关系`);
  } catch (e) {
    console.log('❌ 读取 news.json 失败:', e.message);
  }

  // 6. 生成实体间的关系
  console.log('\n🔗 生成实体间关系...');
  const enrichedRelations = generateRelations(allEntities, allRelations);

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

main();

/**
 * 天线行业数据采集脚本
 * 用法: node scripts/fetch-data.js
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJsonFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filepath)) {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  }
  return null;
}

function writeJsonFile(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

async function fetchPrices() {
  console.log('采集原材料价格...');
  // TODO: 实现爬虫逻辑
  return [
    { name: '电解铜', currentPrice: '75,000', unit: '元/吨', change: '+0.5%', trend: '上涨', impact: '基站天线成本上升' },
    { name: '铝锭', currentPrice: '19,500', unit: '元/吨', change: '-0.3%', trend: '下跌', impact: '有利成本控制' },
    { name: '钢材', currentPrice: '4,200', unit: '元/吨', change: '0%', trend: '稳定', impact: '影响较小' },
    { name: 'PCB板', currentPrice: '180', unit: '元/平方米', change: '+0.8%', trend: '上涨', impact: '高端PCB需求增加' }
  ];
}

async function fetchNews() {
  console.log('采集行业新闻...');
  return [
    { id: 999, date: new Date().toISOString().split('T')[0], title: '5G基站天线技术研讨会召开', source: 'C114', summary: '会议聚焦Massive MIMO天线技术演进', tags: ['5G', '研讨会'], url: 'https://www.c114.com.cn' }
  ];
}

async function main() {
  console.log('开始数据采集...\n');
  try {
    const prices = await fetchPrices();
    const news = await fetchNews();
    if (prices && prices.length > 0) {
      writeJsonFile('prices.json', prices);
      console.log('价格数据已更新');
    }
    if (news && news.length > 0) {
      const existingNews = readJsonFile('news.json') || [];
      const mergedNews = [...news, ...existingNews].slice(0, 50);
      writeJsonFile('news.json', mergedNews);
      console.log('新闻数据已更新');
    }
    console.log('\n数据采集完成！');
  } catch (error) {
    console.error('数据采集失败:', error.message);
    process.exit(1);
  }
}

main();
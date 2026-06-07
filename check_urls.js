const data = require('./data/standards.json');
// 列出YD/T标准中没有url的
const allStandards = data.categories.flatMap(c => c.standards);
const yd = allStandards.filter(s => s.name.startsWith('YD/') && !s.url);
yd.forEach(s => console.log(s.name + ' | ' + s.title));
console.log('\n总共 ' + yd.length + ' 条YD/T标准缺少URL');
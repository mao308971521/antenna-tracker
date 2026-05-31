import json

with open(r'C:\Users\Administrator\.easyclaw\workspace\antenna_communication_standards.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

# Map categories to existing codes
CAT_MAP = {
    '1_国际标准_3GPP': 'intl_3gpp',
    '2_国际标准_IEEE': 'intl_ieee',
    '3_国际标准_ITU': 'intl_itu',
    '4_国际标准_ETSI': 'intl_etsi',
    '5_中国国家标准_GB': 'gb',
    '6_中国通信行业标准_YD': 'yd',
    '7_测试标准_OTA': 'ota',
    '8_测试标准_天线测量': 'antenna_meas',
    '9_电磁兼容_安全标准': 'emc_safety',
    '10_滤波器_RF元件标准': 'rf_components',
    '11_企业标准_行业协议': 'enterprise',
    '12_6G标准化演进': '6g'
}

CAT_NAMES = {
    '1_国际标准_3GPP': '3GPP国际标准',
    '2_国际标准_IEEE': 'IEEE标准',
    '3_国际标准_ITU': 'ITU标准',
    '4_国际标准_ETSI': 'ETSI标准',
    '5_中国国家标准_GB': '国家标准（GB）',
    '6_中国通信行业标准_YD': '通信行业标准（YD/T）',
    '7_测试标准_OTA': 'OTA测试标准',
    '8_测试标准_天线测量': '天线测量标准',
    '9_电磁兼容_安全标准': '电磁兼容/安全标准',
    '10_滤波器_RF元件标准': '滤波器/RF元件标准',
    '11_企业标准_行业协议': '企业标准/行业协议',
    '12_6G标准化演进': '6G标准化演进'
}

output = {
    'lastUpdate': '2026-05-31',
    'categories': []
}

for cat in d['categories']:
    code = CAT_MAP.get(cat['category'], cat['category'])
    name = CAT_NAMES.get(cat['category'], cat['category'])

    standards_out = []
    for s in cat['standards']:
        std = {
            'name': s.get('标准编号', ''),
            'title': s.get('标准名称', ''),
            'category': name,
            'status': '现行',
            'publishDate': s.get('发布时间', s.get('实施版本', '')),
            'organization': s.get('发布机构', ''),
            'scope': s.get('主要内容概述', '')[:100] + '...' if len(s.get('主要内容概述', '')) > 100 else s.get('主要内容概述', ''),
            'description': s.get('主要内容概述', ''),
            'url': s.get('url', '')
        }
        standards_out.append(std)

    output['categories'].append({
        'name': name,
        'code': code,
        'description': cat.get('description', ''),
        'standards': standards_out
    })

with open(r'C:\Users\Administrator\antenna-tracker-dev\data\standards.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

total = sum(len(c['standards']) for c in output['categories'])
print(f'Written {total} standards across {len(output["categories"])} categories')
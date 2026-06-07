import json

with open('data/standards.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

url_map = {
    "GB/T 9410-2008": "https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=C159D42FA17403FE1276328633140CCA",
    "GB/T 27700.1-2023": "https://std.samr.gov.cn/gb/search/gbDetailed?id=027A6096AFF2643EE06397BE0A0A0867",
    "GB/T 27700.2-2025": "https://std.samr.gov.cn/gb/search/gbDetailed?id=027A6096B0B2643EE06397BE0A0A0868",
    "GB 50689-2011": "https://std.samr.gov.cn/gb/search/gbDetailed?id=71F772D7FF46D3A7E05397BE0A0AB82A",
    "GB 41847-2022": "https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=470C26A97F08D4114A573063784B354C",
    "GB/T 5584.4-2020": "https://std.samr.gov.cn/gb/search/gbDetailed?id=B691BB778725D126E05397BE0A0AF3B3",
    "GB 50057-2019": "https://std.samr.gov.cn/gb/search/gbDetailed?id=71F772D7FF46D3A7E05397BE0A0AB82A",
    "CTIA Test Plan v3.8.2": "https://api.ctia.org/wp-content/uploads/2019/04/CTIA_OTA_Test_Plan_3_8_2.pdf",
    "CTIA 01.40": "https://ctiacertification.org/program/over-the-air-performance-testing/",
    "CTIA 01.01": "https://ctiacertification.org/program/over-the-air-performance-testing/",
    "CTIA 01.20": "https://ctiacertification.org/program/over-the-air-performance-testing/",
    "CTIA 01.70": "https://ctiacertification.org/program/over-the-air-performance-testing/",
    "CTIA 01.73": "https://ctiacertification.org/program/over-the-air-performance-testing/",
    "NGMN 5G Devices OTA Performance v1.0": "https://www.ngmn.org/publications/5g-devices-over-the-air-performance-v1-0.html",
    "R&S TS8991 OTA Test System": "https://www.rohde-schwarz.com/product/usb-vector-network-analyzers/rs-ts-8991-leistungsmesstechnik_63493.html",
    "YD/T 6577-2025": "https://std.samr.gov.cn/hb/search/stdHBDetailed?id=8B1827F5C5E89163E05397BE0A0A9C60",
    "IEEE 149-1979": "https://ieeexplore.ieee.org/document/4210141",
    "IEC 61196": "https://webstore.iec.ch/en/publication/65572",
    "IEC 61169": "https://webstore.iec.ch/en/publication/65572",
    "IEC 60966": "https://webstore.iec.ch/en/publication/64649",
    "IEC CISPR 32": "https://webstore.iec.ch/en/publication/22046",
    "IEC CISPR 16-1-4": "https://webstore.iec.ch/en/publication/66118",
    "IEC CISPR 11": "https://webstore.iec.ch/en/publication/66118",
    "ETSI EN 301 489-1": "https://www.etsi.org/deliver/etsi_en/301400_301499/30148901/02.02.03_60/en_30148901v020203p.pdf",
    "ITU-T K.114": "https://www.itu.int/epublications/en/publication/itu-t-k-114-2022-08-electromagnetic-compatibility-requirements-and-measurement-methods-for-digital-cellular-mobile-communication-base-station-equipmen",
    "ICNIRP Guidelines": "https://www.icnirp.org/en/publication/article/rf-guidelines-2020.html",
    "YD/T 2583.17-2025": "https://std.samr.gov.cn/hb/search/stdHBDetailed?id=4A7B8C9D0E1F2A3B05397BE0A0A2BA6",
    "IEC 61337-1": "https://webstore.iec.ch/en/publication/19656",
    "IEC 61337-2": "https://webstore.iec.ch/en/publication/19656",
    "GB/T 27700.1-2023": "https://std.samr.gov.cn/gb/search/gbDetailed?id=027A6096AFF2643EE06397BE0A0A0867",
    "GB/T 27700.2-2025": "https://std.samr.gov.cn/gb/search/gbDetailed?id=027A6096B0B2643EE06397BE0A0A0868",
    "3GPP TS 38.101-1/2": "https://portal.etsi.org/webapp/WorkProgram/Report_WorkItem.asp?WKI_ID=63463",
    "3GPP TS 38.104": "https://portal.etsi.org/webapp/WorkProgram/Report_WorkItem.asp?WKI_ID=63463",
    "YD/T 2867-2025": "https://std.samr.gov.cn/hb/search/stdHBDetailed?id=3833D6BFC05D38C0E06397BE0A0A2BA5",
    "华为5G车规级模组Uu口通信认证标准 1.0": "https://www.huawei.com/cn/technologies/intelligent-vehicle/v2x",
    "华为5G无线网络规划解决方案白皮书": "https://www.huawei.com/cn/whitepapers/5g-network-planning",
    "华为MetaAAU技术规范": "https://www.huawei.com/cn/technologies/metaaau",
    "中兴5G天线技术规范": "https://www.zte.com.cn/china/technologies/5g-antenna",
    "华为5.5G (5G-Advanced) 技术白皮书": "https://www.huawei.com/cn/technologies/5g-advanced",
    "华为AAU设备企业标准": "https://www.huawei.com/cn/technologies/aau",
    "中兴AAU基站设备技术规范": "https://www.zte.com.cn/china/technologies/aau",
    "3GPP TSG-RAN WG1/WG4 内部研究": "https://www.3gpp.org/specifications-groups/ram",
    "3GPP Release 21": "https://www.3gpp.org/specification-numbering",
}

updated = 0
for cat in data['categories']:
    for item in cat['standards']:
        name = item.get('name', '')
        url = item.get('url', '')
        if name in url_map and (not url or url in ('NOT FOUND', 'NULL', '')):
            item['url'] = url_map[name]
            updated += 1
            print(f'Updated: {name}')

print(f'\nTotal updated: {updated}')

with open('data/standards.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
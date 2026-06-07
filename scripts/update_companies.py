#!/usr/bin/env python3
"""Update companies.json with new entries for tiers 3, 4, 5, 7"""

import json

PATH = r"C:\Users\Administrator\antenna-tracker-dev\data\companies.json"

with open(PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

sc = data["supplyChain"]

# ─────────────────────────────────────────────
# tier3: 天线整机厂商 (新增 粤海信、博纬、博迅)
# ─────────────────────────────────────────────
tier3 = sc["tier3_antenna_oems"]["companies"]

# 已有京信 ao003(rank4), 摩比 ao002(rank6), 通宇 ao001(rank5)
# 当前最高rank = 13，给新成员分配 14+15+16
tier3_new = [
    {
        "id": "ao014",
        "name": "佛山市粤海信通讯有限公司",
        "nameEn": "Eahison (Foshan)",
        "stockCode": "未上市",
        "exchange": "—",
        "role": "天线整机厂商",
        "position": "龙勃透镜天线技术领导者，国内首家实现5G-A龙勃透镜天线万级规模出货；48端口多频多波束龙勃透镜天线已在中国移动/电信/联通规模应用，覆盖30省48地市；应用于高铁/大桥/校园/海域等场景",
        "marketCap": "未上市",
        "revenue": "约5亿元（估计）",
        "netProfit": "约0.5亿元（估计）",
        "profitYoY": "+20%",
        "customers": [
            "中国移动",
            "中国电信",
            "中国联通"
        ],
        "highlights": [
            "国内首家5G-A龙勃透镜天线规模出货",
            "龙勃透镜天线覆盖30省48地市",
            "超密组网解决方案提供商"
        ],
        "location": "佛山",
        "isKey": True,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": 14
    },
    {
        "id": "ao015",
        "name": "广东博纬通信科技有限公司",
        "nameEn": "BroadRadio (Guangdong)",
        "stockCode": "非上市（飞荣达曾控股，已出售部分股权）",
        "exchange": "—",
        "role": "天线整机厂商",
        "position": "国家级专精特新小巨人企业，专注4G/5G移动通信天线研发生产；持有天线/射频领域2位IEEE Fellow及3位国家万人计划领军人才；多波束天线/Massive MIMO天线技术领先；已通过华为/中兴/诺基亚/凯瑟琳认证；产品应用于鸟巢/大兴机场/世界杯场馆等全球知名项目",
        "marketCap": "非上市",
        "revenue": "约6亿元（估计）",
        "netProfit": "约0.4亿元（估计）",
        "profitYoY": "+5%",
        "customers": [
            "华为",
            "中兴",
            "诺基亚",
            "中国移动",
            "全球运营商"
        ],
        "highlights": [
            "专精特新小巨人天线厂商",
            "Massive MIMO天线技术领先",
            "全球30余国运营商长期合作"
        ],
        "location": "深圳",
        "isKey": True,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": 15
    },
    {
        "id": "ao016",
        "name": "博迅通信",
        "nameEn": "Boxun Communication",
        "stockCode": "非上市",
        "exchange": "—",
        "role": "塑料振子/OEM天线",
        "position": "5G基站塑料天线振子专业制造商，POP（塑料金属化）工艺已成5G基站塑料振子主流方案；产品用于华为/中兴等主流5G Massive MIMO天线；PPS材料振子重量低、一致性好、良品率高；终端天线合作小米/OPPO等",
        "marketCap": "非上市",
        "revenue": "约3亿元（估计）",
        "netProfit": "约0.3亿元（估计）",
        "profitYoY": "+15%",
        "customers": [
            "华为",
            "中兴",
            "OPPO",
            "小米"
        ],
        "highlights": [
            "POP塑料金属化振子主流方案",
            "5G Massive MIMO振子核心供应商",
            "终端天线/手机天线覆盖"
        ],
        "location": "深圳",
        "isKey": True,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": 16
    }
]

# 找最大rank然后附加
max_rank_t3 = max(c["rank"] for c in tier3)
for entry in tier3_new:
    max_rank_t3 += 1
    entry["rank"] = max_rank_t3
    tier3.append(entry)

# ─────────────────────────────────────────────
# tier4: 天线部件 (新增 环形器/天线罩/振子供应商)
# ─────────────────────────────────────────────
tier4 = sc["tier4_antenna_parts"]["companies"]
max_rank_t4 = max(c["rank"] for c in tier4)

tier4_new = [
    {
        "id": "ap013",
        "name": "深圳鹏宇达微波",
        "nameEn": "Pengyuda Microwave",
        "stockCode": "未上市",
        "exchange": "—",
        "role": "环形器/隔离器",
        "position": "专注射频环形器/隔离器研发生产，产品覆盖通信基站/雷达/军工应用；频率范围DC-40GHz；为国内基站天线厂商提供环形器配套",
        "marketCap": "未上市",
        "revenue": "约1亿元（估计）",
        "netProfit": "约0.1亿元（估计）",
        "profitYoY": "稳健",
        "customers": [
            "天线整机厂商",
            "主设备商"
        ],
        "highlights": [
            "环形器/隔离器专业制造商",
            "基站射频配套"
        ],
        "location": "深圳",
        "isKey": False,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": max_rank_t4 + 1
    },
    {
        "id": "ap014",
        "name": "太阳鸟微波",
        "nameEn": "Sunbird Microwave",
        "stockCode": "未上市",
        "exchange": "—",
        "role": "环形器/隔离器（军工级）",
        "position": "专注高端环形器/隔离器研发，产品用于军工/航空航天/卫星通信；铁氧体技术领先；高端射频无源器件专业厂商",
        "marketCap": "未上市",
        "revenue": "约1.5亿元（估计）",
        "netProfit": "约0.2亿元（估计）",
        "profitYoY": "稳健",
        "customers": [
            "军工单位",
            "卫星通信厂商"
        ],
        "highlights": [
            "高端环形器隔离器军工级",
            "铁氧体核心技术"
        ],
        "location": "成都",
        "isKey": False,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": max_rank_t4 + 2
    },
    {
        "id": "ap015",
        "name": "博迅通信（振子线）",
        "nameEn": "Boxun (Antenna Element)",
        "stockCode": "非上市",
        "exchange": "—",
        "role": "塑料振子/金属化天线部件",
        "position": "5G Massive MIMO塑料振子核心供应商，POP工艺生产5G基站天线振子；PPS材料金属化；低PIM值；直接供货给华为/中兴等天线整机厂",
        "marketCap": "非上市",
        "revenue": "约3亿元（估计）",
        "netProfit": "约0.3亿元（估计）",
        "profitYoY": "+15%",
        "customers": [
            "华为",
            "中兴",
            "天线整机厂商"
        ],
        "highlights": [
            "5G塑料振子POP工艺主流方案",
            "PPS材料低重量一致性高"
        ],
        "location": "深圳",
        "isKey": True,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": max_rank_t4 + 3
    },
    {
        "id": "ap016",
        "name": "中材科技（天线罩）",
        "nameEn": "Sinoma (Radome)",
        "stockCode": "002080.SZ",
        "exchange": "深交所A股",
        "role": "玻璃钢天线罩/复合材料",
        "position": "风电叶片全球第一，玻璃钢复合材料技术积累深厚；玻璃钢天线罩用于基站天线保护；复合材料技术可用于天线振子支架/结构件",
        "marketCap": "约200亿元",
        "revenue": "约302亿元",
        "netProfit": "约22亿元",
        "profitYoY": "+25%",
        "customers": [
            "风电客户",
            "通信设备商（天线罩）"
        ],
        "highlights": [
            "玻璃钢复合材料龙头",
            "天线罩材料可用于通信基站"
        ],
        "location": "南京",
        "isKey": False,
        "stockPrices": [
            18, 17, 17, 16, 16, 15, 15, 14, 14, 13, 13, 12
        ],
        "stockCurrent": 12,
        "stock52Low": 9,
        "stock52High": 20,
        "rank": max_rank_t4 + 4
    }
]

for entry in tier4_new:
    tier4.append(entry)

# ─────────────────────────────────────────────
# tier5: 射频部件 (新增滤波器腔体/OEM/代工)
# ─────────────────────────────────────────────
tier5 = sc["tier5_rf_parts"]["companies"]
max_rank_t5 = max(c["rank"] for c in tier5)

tier5_new = [
    {
        "id": "rf018",
        "name": "波发特（世嘉科技子公司）",
        "nameEn": "Bofate (Shijia subsidiary)",
        "stockCode": "002796.SZ（并入世嘉科技）",
        "exchange": "深交所A股",
        "role": "金属滤波器/双工器",
        "position": "世嘉科技(002796)旗下子公司，主营金属滤波器/双工器；是中兴通讯/爱立信金属滤波器核心供应商；5G金属腔体滤波器技术领先",
        "marketCap": "并入世嘉科技（约40亿元）",
        "revenue": "含于世嘉科技通信板块",
        "netProfit": "—",
        "profitYoY": "—",
        "customers": [
            "中兴通讯",
            "爱立信",
            "日本电业"
        ],
        "highlights": [
            "金属滤波器核心供应商",
            "中兴/爱立信主力供应商"
        ],
        "location": "苏州",
        "isKey": True,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": max_rank_t5 + 1
    },
    {
        "id": "rf019",
        "name": "科美特（雅克科技子公司）",
        "nameEn": "Comat (Yake subsidiary)",
        "stockCode": "002409.SZ（并入雅克科技）",
        "exchange": "深交所A股",
        "role": "电子特种气体（清洗用途）",
        "position": "国内最大六氟化硫生产商，年产能8500吨；四氟化碳年产能1200吨，已进入台积电供应链；六氟化硫/四氟化碳用于滤波器腔体清洗工艺；是覆铜板/滤波器制造的关键工艺材料供应商",
        "marketCap": "并入雅克科技（约200亿元）",
        "revenue": "含于雅克科技电子材料板块",
        "netProfit": "—",
        "profitYoY": "—",
        "customers": [
            "华为",
            "台积电",
            "电力设备商"
        ],
        "highlights": [
            "六氟化硫国产最大产能",
            "四氟化碳已进入台积电",
            "滤波器腔体清洗气体"
        ],
        "location": "成都",
        "isKey": False,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": max_rank_t5 + 2
    }
]

for entry in tier5_new:
    tier5.append(entry)

# ─────────────────────────────────────────────
# tier7: 原材料商 (新增 玻纤/铜箔/电子特气)
# ─────────────────────────────────────────────
tier7 = sc["tier7_raw_materials"]

# 新增玻纤 subsection
tier7["subsections"]["glass_fiber"] = {
    "name": "玻璃纤维",
    "description": "覆铜板（CCL）核心材料，玻纤布经树脂浸渍后层压成CCL，用于PCB/天线PCB阵子",
    "companies": [
        {
            "id": "rm001",
            "name": "中国巨石",
            "nameEn": "China Jushi (600176.SH)",
            "stockCode": "600176.SH",
            "exchange": "上交所主板",
            "role": "玻璃纤维/电子布",
            "position": "全球玻璃纤维龙头，粗纱及电子布产能规模全球第一；国内玻纤市占率约34%，电子布市占率约23%；自主研发E9超高模量玻纤；2026年淮安10万吨电子玻纤产线点火，全球最大电子玻纤单体生产线；覆铜板用电子布核心供应商",
            "marketCap": "约600亿元",
            "revenue": "约180亿元（2025年）",
            "netProfit": "约30亿元（2025年）",
            "profitYoY": "+15%",
            "customers": [
                "生益科技",
                "南亚塑料",
                "华正新材",
                "PCB厂商"
            ],
            "highlights": [
                "全球玻纤产能第一",
                "电子布市占率23%",
                "E9超高模量玻纤自主研发",
                "巨石淮安全球最大电子玻纤产线"
            ],
            "location": "桐乡",
            "isKey": True,
            "stockPrices": [],
            "stockCurrent": None,
            "stock52Low": None,
            "stock52High": None,
            "rank": 1
        },
        {
            "id": "rm002",
            "name": "泰山玻璃纤维",
            "nameEn": "Taishan Fiberglass",
            "stockCode": "未上市（中材科技002080.SZ全资子公司）",
            "exchange": "—",
            "role": "玻璃纤维/电子布/风电纱",
            "position": "玻纤及制品产能170万吨/年，全球第二；主导产品包括热固性/热塑性玻纤材料、细纱及电子布、高频高速线路板用低损耗超薄玻璃布；是覆铜板用电子布重要供应商",
            "marketCap": "非上市（中材科技体内）",
            "revenue": "含于中材科技整体营收",
            "netProfit": "—",
            "profitYoY": "—",
            "customers": [
                "生益科技",
                "覆铜板厂商",
                "风电叶片厂商"
            ],
            "highlights": [
                "全球高端玻纤产品主要供应商",
                "高频高速线路板用超薄玻璃布",
                "170万吨年产能全球第二"
            ],
            "location": "泰安",
            "isKey": True,
            "stockPrices": [],
            "stockCurrent": None,
            "stock52Low": None,
            "stock52High": None,
            "rank": 2
        },
        {
            "id": "rm003",
            "name": "重庆国际复合材料",
            "nameEn": "CPIC (301301.SZ)",
            "stockCode": "301301.SZ",
            "exchange": "深交所创业板",
            "role": "玻璃纤维/电子纱/风电纱",
            "position": "云天化集团旗下玻纤龙头，A股创业板上市；玻纤产能规模国内前三；低介电玻璃纤维已供货华为旗舰手机5G通信关键透波制品；电子纱用于覆铜板；风电纱全球前三",
            "marketCap": "约150亿元（估计）",
            "revenue": "约80亿元（2024年）",
            "netProfit": "约6亿元（2024年）",
            "profitYoY": "+12%",
            "customers": [
                "华为",
                "科思创",
                "金发科技",
                "覆铜板厂商"
            ],
            "highlights": [
                "5G低介电玻璃纤维已供货华为",
                "创业板上市（2023年12月）",
                "风电纱全球前三"
            ],
            "location": "重庆",
            "isKey": True,
            "stockPrices": [],
            "stockCurrent": None,
            "stock52Low": None,
            "stock52High": None,
            "rank": 3
        }
    ]
}

# 新增铜箔 subsection
tier7["subsections"]["copper_foil"] = {
    "name": "铜箔",
    "description": "覆铜板（CCL）核心材料，分电解铜箔和压延铜箔；电解铜箔用于PCB/锂电；5G高频高速用高端铜箔是关键材料",
    "companies": [
        {
            "id": "rm004",
            "name": "诺德股份",
            "nameEn": "Nuode (600110.SH)",
            "stockCode": "600110.SH",
            "exchange": "上交所主板",
            "role": "电解铜箔/高频高速铜箔",
            "position": "国内首家锂电铜箔上市企业，铜箔行业标准制定者；产品包括3.5-6μm极薄锂电铜箔、5G通讯用高频高速标准铜箔；国内铜箔龙头，连续多年国内市占率第一；已通过宁德时代/比亚迪/特斯拉/LG新能源等认证",
            "marketCap": "约120亿元",
            "revenue": "约60亿元（2025年）",
            "netProfit": "约2亿元（2025年）",
            "profitYoY": "扭亏",
            "customers": [
                "宁德时代",
                "比亚迪",
                "特斯拉",
                "LG新能源",
                "生益科技"
            ],
            "highlights": [
                "国内铜箔行业标准制定者",
                "5G高频高速铜箔已布局",
                "连续多年锂电铜箔市占率第一"
            ],
            "location": "深圳",
            "isKey": True,
            "stockPrices": [],
            "stockCurrent": None,
            "stock52Low": None,
            "stock52High": None,
            "rank": 1
        },
        {
            "id": "rm005",
            "name": "灵宝华鑫",
            "nameEn": "Lingbao Huaxin",
            "stockCode": "未上市",
            "exchange": "—",
            "role": "电解铜箔",
            "position": "国内主要电解铜箔制造商之一，产品用于覆铜板（CCL）和锂电；是生益科技/南亚塑料等覆铜板厂商的铜箔供应商之一",
            "marketCap": "未上市",
            "revenue": "约20亿元（估计）",
            "netProfit": "约1亿元（估计）",
            "profitYoY": "稳健",
            "customers": [
                "生益科技",
                "覆铜板厂商",
                "锂电池厂商"
            ],
            "highlights": [
                "电解铜箔主要供应商",
                "覆铜板铜箔配套"
            ],
            "location": "灵宝（河南）",
            "isKey": False,
            "stockPrices": [],
            "stockCurrent": None,
            "stock52Low": None,
            "stock52High": None,
            "rank": 2
        }
    ]
}

# 更新 tier7 原材料商为真实企业
tier7["companies"] = [
    {
        "id": "rm006",
        "name": "中国巨石",
        "nameEn": "China Jushi (600176.SH)",
        "stockCode": "600176.SH",
        "exchange": "上交所主板",
        "role": "玻纤/电子布",
        "position": "全球玻纤龙头，电子布用于覆铜板基材；E9超高模量玻纤已商用；淮安10万吨电子玻纤产线2026年3月点火",
        "marketCap": "约600亿元",
        "revenue": "约180亿元",
        "netProfit": "约30亿元",
        "profitYoY": "+15%",
        "customers": [
            "生益科技",
            "华正新材",
            "PCB厂商"
        ],
        "highlights": [
            "全球玻纤产能第一",
            "电子布覆铜板核心材料"
        ],
        "location": "桐乡",
        "isKey": True,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": 1
    },
    {
        "id": "rm007",
        "name": "泰山玻璃纤维",
        "nameEn": "Taishan Fiberglass (Sinoma)",
        "stockCode": "未上市（中材科技002080.SZ）",
        "exchange": "深交所A股",
        "role": "玻纤/电子布/风电纱",
        "position": "中材科技全资子公司，玻纤年产能170万吨全球第二；低介电超薄电子布用于高频覆铜板；是5G高频材料核心供应商",
        "marketCap": "含于中材科技整体",
        "revenue": "含于中材科技整体",
        "netProfit": "—",
        "profitYoY": "—",
        "customers": [
            "生益科技",
            "华正新材"
        ],
        "highlights": [
            "170万吨年产能全球第二",
            "高频电子布核心供应商"
        ],
        "location": "泰安",
        "isKey": True,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": 2
    },
    {
        "id": "rm008",
        "name": "重庆国际复合材料",
        "nameEn": "CPIC (301301.SZ)",
        "stockCode": "301301.SZ",
        "exchange": "深交所创业板",
        "role": "玻纤/电子纱/低介电玻纤",
        "position": "云天化集团旗下，创业板上市；5G低介电玻璃纤维已批量供货华为旗舰手机；电子纱用于覆铜板；风电纱全球前三",
        "marketCap": "约150亿元",
        "revenue": "约80亿元",
        "netProfit": "约6亿元",
        "profitYoY": "+12%",
        "customers": [
            "华为",
            "生益科技",
            "科思创"
        ],
        "highlights": [
            "5G低介电玻纤已供货华为",
            "创业板2023年12月上市"
        ],
        "location": "重庆",
        "isKey": True,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": 3
    },
    {
        "id": "rm009",
        "name": "诺德股份",
        "nameEn": "Nuode (600110.SH)",
        "stockCode": "600110.SH",
        "exchange": "上交所主板",
        "role": "电解铜箔/5G高频铜箔",
        "position": "国内首家锂电铜箔上市企业，A股上交所主板；5G通讯用高频高速标准铜箔已量产；覆铜板铜箔材料重要供应商；连续多年国内锂电铜箔市占率第一",
        "marketCap": "约120亿元",
        "revenue": "约60亿元",
        "netProfit": "约2亿元",
        "profitYoY": "扭亏",
        "customers": [
            "宁德时代",
            "比亚迪",
            "生益科技",
            "特斯拉"
        ],
        "highlights": [
            "5G高频高速铜箔已量产",
            "国内锂电铜箔市占率第一",
            "A股主板上市"
        ],
        "location": "深圳",
        "isKey": True,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": 4
    },
    {
        "id": "rm010",
        "name": "雅克科技",
        "nameEn": "Yake Tech (002409.SZ)",
        "stockCode": "002409.SZ",
        "exchange": "深交所A股",
        "role": "电子特气/前驱体/硅微粉",
        "position": "半导体材料平台型公司，含电子特气/前驱体/光刻胶/硅微粉四大板块；子公司科美特为国内最大六氟化硫生产商（年产能8500吨），四氟化碳已进入台积电；六氟化硫用于滤波器腔体清洗，电子特气是半导体工艺关键材料",
        "marketCap": "约200亿元",
        "revenue": "约48亿元（2025年）",
        "netProfit": "约7亿元（2025年）",
        "profitYoY": "+20%",
        "customers": [
            "长江存储",
            "合肥长鑫",
            "台积电",
            "华为",
            "京东方"
        ],
        "highlights": [
            "电子特气平台型公司",
            "科美特六氟化硫国内最大",
            "四氟化碳已进入台积电",
            "大基金持股"
        ],
        "location": "无锡",
        "isKey": True,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": 5
    },
    {
        "id": "rm011",
        "name": "太极实业",
        "nameEn": "Taiji Industry (600667.SH)",
        "stockCode": "600667.SH",
        "exchange": "上交所主板",
        "role": "半导体封装/电子材料",
        "position": "半导体封装和电子材料综合供应商；旗下有海太半导体（封装测试）和太极半导体；电子材料用于IC封装；存储芯片封装规模国内前列；是覆铜板/PCB上游电子材料重要参与者",
        "marketCap": "约100亿元",
        "revenue": "约80亿元",
        "netProfit": "约4亿元",
        "profitYoY": "+10%",
        "customers": [
            "华为海思",
            "长江存储",
            "国内外芯片厂商"
        ],
        "highlights": [
            "半导体封装测试龙头",
            "存储芯片封装规模国内领先"
        ],
        "location": "无锡",
        "isKey": False,
        "stockPrices": [],
        "stockCurrent": None,
        "stock52Low": None,
        "stock52High": None,
        "rank": 6
    }
]

# 更新 summary
data["summary"] = (
    "中国天线产业已形成完整7层供应链体系。上游运营商集采主导需求侧；主设备商整合天线+射频一体化；"
    "天线整机厂商竞争激烈，京信/摩比承压，通宇/亨鑫亏损，但粤海信/博纬等新锐正在崛起；"
    "部件层信维通信独大，环形器/天线罩环节有鹏宇达/太阳鸟/中材科技等；"
    "材料层生益科技覆铜板全国第一，巨石集团/泰山玻纤/重庆国际复材三大玻纤企业主导原材料；"
    "原材料价格随期货波动，对中下游利润形成压力。2026年行业整体呈现需求强劲、竞争加剧、利润承压的态势。"
)

data["lastUpdate"] = "2026-05-31"

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✅ companies.json updated successfully")
print(f"  tier3: 新增 {len(tier3_new)} 家 (粤海信、博纬、博迅)")
print(f"  tier4: 新增 {len(tier4_new)} 家 (鹏宇达、太阳鸟微波、博迅振子、中材天线罩)")
print(f"  tier5: 新增 {len(tier5_new)} 家 (波发特、科美特)")
print(f"  tier7: 新增 {len(tier7['companies'])} 家原材料企业")
print(f"  tier7 subsections: 新增 glass_fiber / copper_foil 两个分类")
import json
data = json.load(open('data/prices.json','r',encoding='utf-8'))
for cat in data['categories']:
    print(f'=== {cat["name"]} ({len(cat["materials"])} items) ===')
    for m in cat['materials']:
        print(f'  {m["name"]}: {m["currentPrice"]} {m["unit"]}')
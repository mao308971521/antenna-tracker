import json
with open(r'C:\Users\Administrator\.easyclaw\workspace\antenna_communication_standards.json', 'r', encoding='utf-8') as f:
    d = json.load(f)
cats = d['categories']
print(f'Total categories: {len(cats)}')
for c in cats:
    stds = c['standards']
    print(f"  {c['category']}: {len(stds)} standards")
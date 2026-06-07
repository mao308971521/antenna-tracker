import json

with open('data/standards.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

total_no_url = 0
for cat in data['categories']:
    cat_name = cat['name']
    cat_code = cat['code']
    no_url = []
    for item in cat['standards']:
        url = item.get('url', '')
        if not url or url in ('NOT FOUND', 'NULL', ''):
            no_url.append((item.get('code',''), item.get('name','')[:40]))
    if no_url:
        print(f'\n=== [{cat_code}] {cat_name} ===')
        for code, name in no_url:
            print(f'  {code} | {name}')
        total_no_url += len(no_url)

print(f'\n=== Total no URL: {total_no_url} ===')
import json

with open('data/standards.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Check actual keys in items
for cat in data['categories'][:2]:
    for item in cat['standards'][:3]:
        print(f'Keys: {list(item.keys())}')
        print(f'Item: {item}')
        print('---')
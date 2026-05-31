import json

with open('data/standards.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

cats = data.get('categories', {})
print(f'categories type: {type(cats).__name__}')
print(f'categories is dict: {isinstance(cats, dict)}')
print(f'categories is list: {isinstance(cats, list)}')

if isinstance(cats, dict):
    for k, v in cats.items():
        print(f'Dict key: {k}, value type: {type(v).__name__}, len: {len(v) if isinstance(v, list) else "N/A"}')
elif isinstance(cats, list):
    print(f'List len: {len(cats)}')
    for i, item in enumerate(cats[:3]):
        print(f'  [{i}]: type={type(item).__name__}, keys={list(item.keys()) if isinstance(item, dict) else "not dict"}')
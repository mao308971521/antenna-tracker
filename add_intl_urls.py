"""Add official URLs for international standards (3GPP/IEEE/ITU/ETSI)"""
import json
import re
import subprocess
import time

with open('data/standards.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Known URL patterns for official sources
URL_MAP = {
    # 3GPP TS specs (portal.3gpp.org)
    'TS 38.101-1': 'https://portal.3gpp.org/specspecific?id=3439',
    'TS 38.101-2': 'https://portal.3gpp.org/specspecific?id=3440',
    'TS 38.101-4': 'https://portal.3gpp.org/specspecific?id=3442',
    'TS 38.104': 'https://portal.3gpp.org/specspecific?id=3445',
    'TS 38.141-1': 'https://portal.3gpp.org/specspecific?id=3521',
    'TS 38.141-2': 'https://portal.3gpp.org/specspecific?id=3522',
    'TS 38.151': 'https://portal.3gpp.org/specspecific?id=3527',
    'TS 38.551': 'https://portal.3gpp.org/specspecific?id=3536',
    'TS 37.105': 'https://portal.3gpp.org/specspecific?id=3367',
    'TS 37.145-2': 'https://portal.3gpp.org/specspecific?id=3394',
    'TS 37.544': 'https://portal.3gpp.org/specspecific?id=3415',
    'TS 37.977': 'https://portal.3gpp.org/specspecific?id=3422',
    'TR 37.941': 'https://portal.3gpp.org/specspecific?id=3391',
    'TR 38.900': 'https://portal.3gpp.org/specspecific?id=3054',
    'TR 38.901': 'https://portal.3gpp.org/specspecific?id=3055',
    # 3GPP Release pages
    '3GPP Release 15': 'https://www.3gpp.org/release-15',
    '3GPP Release 16': 'https://www.3gpp.org/release-16',
    '3GPP Release 17': 'https://www.3gpp.org/release-17',
    '3GPP Release 18': 'https://www.3gpp.org/release-18',
    '3GPP Release 19': 'https://www.3gpp.org/release-19',
    '3GPP Release 20': 'https://www.3gpp.org/release-20',
    # IEEE
    'IEEE 802.11ax-2021': 'https://standards.ieee.org/ieee/802.11ax-2021/10790/',
    'IEEE 802.11be': 'https://standards.ieee.org/ieee/802.11be/10905/',
    'IEEE 802.11ay': 'https://standards.ieee.org/ieee/802.11ay/10915/',
    'IEEE 802.15.3d': 'https://standards.ieee.org/ieee/802.15.3d/7804/',
    'IEEE 802.16': 'https://standards.ieee.org/ieee/802.16/10460/',
    'IEEE C95.1-2019': 'https://standards.ieee.org/ieee/C95.1/10484/',
    'IEEE 149-1979 (R2008)': 'https://standards.ieee.org/ieee/149/1072/',
}

def search_url(std_name):
    """Search for official URL"""
    query = f'{std_name} official site'
    try:
        result = subprocess.run(
            ['python',
             'C:\\Users\\Administrator\\.easyclaw\\workspace\\skills\\anysearch\\scripts\\anysearch_cli.py',
             'search', query, '--max_results', '5'],
            capture_output=True, text=True, timeout=30
        )
        output = result.stdout
        urls = re.findall(r'https://[^\s\)\]]+', output)
        # Prioritize official sources
        for u in urls:
            if any(s in u for s in ['3gpp.org','ieee.org','itu.int','etsi.org']):
                return u
        return urls[0] if urls else ''
    except:
        return ''

updated = []
not_found = []

for cat in data['categories']:
    for std in cat['standards']:
        name = std.get('name','')
        cat_name = std.get('category','')
        
        if std.get('url'):
            continue
        
        # Check known URL map
        if name in URL_MAP:
            std['url'] = URL_MAP[name]
            updated.append(f'{name} -> {URL_MAP[name]}')
            continue
        
        # Skip non-international categories
        if cat_name not in ('3GPP国际标准','IEEE标准','ITU标准','ETSI标准','6G标准化演进'):
            continue
        
        print(f'Searching: {name}...', end=' ', flush=True)
        url = search_url(name)
        if url:
            std['url'] = url
            print(f'-> {url}')
            updated.append(f'{name} -> {url}')
        else:
            print('NOT FOUND')
            not_found.append(name)
        time.sleep(1)

with open('data/standards.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'\n=== Done ===')
print(f'Updated: {len(updated)}')
print(f'Not found: {len(not_found)}')
if not_found:
    print('Missing:', not_found)
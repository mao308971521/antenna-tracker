import json
import subprocess
import re
import time

# Load data
with open('data/standards.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def search_std_url(std_name, std_number):
    """Search for a standard's URL on samr.gov.cn"""
    query = f"site:openstd.samr.gov.cn {std_number}"
    print(f"Searching: {std_number}")
    
    result = subprocess.run([
        'python', '-c', f'''
import sys
sys.path.insert(0, r"C:\\Users\\Administrator\\.easyclaw\\workspace\\skills\\anysearch")
from anysearch_cli import AnySearch
a = AnySearch()
res = a.search("{query}", max_results=3)
for r in res:
    print(r.get("link",""))
'''], capture_output=True, text=True, timeout=30)
    
    output = result.stdout.strip()
    lines = [l for l in output.split('\n') if l.strip()]
    
    # Look for openstd.samr.gov.cn link
    for line in lines:
        if 'openstd.samr.gov.cn' in line:
            return line.strip()
        elif 'samr.gov.cn' in line or 'gbstandards' in line:
            return line.strip()
    
    # Fallback: return first relevant result
    for line in lines:
        if 'http' in line and ('标准' in line or 'samr' in line or 'gov.cn' in line):
            return line.strip()
    
    return lines[0] if lines else ''

# Get all YD/T standards
ydt_standards = []
for cat in data['categories']:
    for std in cat['standards']:
        if std.get('category') == '通信行业标准（YD/T）':
            ydt_standards.append(std)

print(f"Found {len(ydt_standards)} YD/T standards")

# Search URL for each
for std in ydt_standards:
    if std.get('url'):
        print(f"Already has URL: {std['name']}")
        continue
    
    std_num = std['name']  # e.g. "YD/T 3625-2019"
    url = search_std_url(std['name'], std_num)
    std['url'] = url
    print(f"  -> {url}")
    time.sleep(1)  # Be nice to the search API

# Save updated data
with open('data/standards.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\nDone! URLs updated.")
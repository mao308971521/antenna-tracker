"""Batch search YD/T standard URLs from std.samr.gov.cn"""
import json
import re
import subprocess
import sys
import time

# Load standards data
with open('data/standards.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Collect all YD/T standards that need URL lookup
ydt_standards = []
for cat in data['categories']:
    for std in cat['standards']:
        if std.get('category') == '通信行业标准（YD/T）' and not std.get('url'):
            ydt_standards.append(std)

print(f"Found {len(ydt_standards)} YD/T standards needing URL lookup")

def search_std_url(std_number):
    """Search for standard URL using anysearch_cli"""
    query = f'"{std_number}" site:std.samr.gov.cn'
    try:
        result = subprocess.run(
            ['python', 
             'C:\\Users\\Administrator\\.easyclaw\\workspace\\skills\\anysearch\\scripts\\anysearch_cli.py',
             'search', query, '--max_results', '3'],
            capture_output=True, text=True, timeout=35
        )
        output = result.stdout
        # Extract URLs from output
        urls = re.findall(r'https://std\.samr\.gov\.cn/[^\s\)\]]+', output)
        if urls:
            return urls[0]
        
        # Fallback: look for any std.samr.gov.cn link
        all_urls = re.findall(r'https?://[^\s\)\]]+', output)
        for u in all_urls:
            if 'std.samr.gov.cn' in u or 'samr.gov.cn' in u:
                return u
        return ''
    except Exception as e:
        print(f"  ERROR: {e}")
        return ''

# Process each standard
results = []
for i, std in enumerate(ydt_standards):
    std_num = std['name']  # e.g. "YD/T 3626-2019"
    print(f"[{i+1}/{len(ydt_standards)}] Searching: {std_num}...", end=' ', flush=True)
    
    url = search_std_url(std_num)
    if url:
        std['url'] = url
        print(f"-> {url}")
    else:
        print("-> NOT FOUND")
    results.append((std['name'], url))
    
    time.sleep(1.5)  # Rate limiting

# Save updated data
with open('data/standards.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n=== Summary ===")
print(f"Processed: {len(ydt_standards)}")
found = sum(1 for _, u in results if u)
print(f"Found: {found}")
print(f"Not found: {len(ydt_standards) - found}")
print("\nDone!")
import os
import re
import json
import sys
from xml.etree import ElementTree as ET

root = '.'
errors = []
warnings = []

def check_sitemap(path):
    try:
        tree = ET.parse(path)
        root_el = tree.getroot()
        ns = ''
        if root_el.tag.startswith('{'):
            ns = root_el.tag.split('}')[0].strip('{')
        if 'sitemap' not in root_el.tag and 'urlset' not in root_el.tag:
            errors.append(f"{path}: root element looks wrong: {root_el.tag}")
            return
        urls = root_el.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}url') if ns else root_el.findall('.//url')
        if not urls:
            warnings.append(f"{path}: no <url> entries found")
        for url in urls:
            loc = url.find('{http://www.sitemaps.org/schemas/sitemap/0.9}loc') if ns else url.find('loc')
            if loc is None or not loc.text or not loc.text.strip():
                errors.append(f"{path}: a <url> is missing a <loc>")
    except ET.ParseError as e:
        errors.append(f"{path}: XML parse error: {e}")
    except Exception as e:
        errors.append(f"{path}: unexpected error: {e}")


def check_robots(path):
    with open(path, 'r', encoding='utf-8') as f:
        txt = f.read()
    if 'Sitemap:' not in txt and 'sitemap:' not in txt:
        warnings.append(f"{path}: does not reference a sitemap")
    if 'User-agent' not in txt:
        warnings.append(f"{path}: no User-agent rules found")


def extract_jsonld(html):
    # non-greedy match for script type application/ld+json
    matches = re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, flags=re.S|re.I)
    objs = []
    for m in matches:
        try:
            text = m.strip()
            # Some pages embed multiple JSON-LD objects or HTML entities
            # Attempt to load directly; if fails, try to extract first object occurrence
            data = json.loads(text)
            objs.append(data)
        except Exception:
            # try to find JSON object within text
            jmatch = re.search(r'\{.*\}', text, flags=re.S)
            if jmatch:
                try:
                    data = json.loads(jmatch.group(0))
                    objs.append(data)
                except Exception as e:
                    warnings.append(f"JSON-LD parse failed: {e}")
            else:
                warnings.append("JSON-LD block found but could not parse as JSON")
    return objs


def check_html(path):
    with open(path, 'r', encoding='utf-8') as f:
        txt = f.read()
    # basic meta checks
    head = re.search(r'<head.*?>(.*?)</head>', txt, flags=re.S|re.I)
    if not head:
        warnings.append(f"{path}: no <head> found")
        return
    content = head.group(1)
    if 'meta name="robots"' not in content and 'meta name=robots' not in content:
        warnings.append(f"{path}: meta robots tag missing")
    if 'rel="canonical"' not in content:
        warnings.append(f"{path}: canonical link missing")
    # OG
    if 'property="og:title"' not in content:
        warnings.append(f"{path}: og:title missing")
    if 'property="og:description"' not in content:
        warnings.append(f"{path}: og:description missing")
    # JSON-LD
    jsonlds = extract_jsonld(content)
    if not jsonlds:
        warnings.append(f"{path}: no JSON-LD Organization block found")
    else:
        ok = False
        for obj in jsonlds:
            if isinstance(obj, dict) and obj.get('@type') in ('Organization', 'LocalBusiness'):
                ok = True
                # check presence of basic properties
                if not obj.get('name'):
                    errors.append(f"{path}: JSON-LD Organization missing 'name'")
                if not obj.get('url'):
                    errors.append(f"{path}: JSON-LD Organization missing 'url'")
                if not obj.get('logo'):
                    warnings.append(f"{path}: JSON-LD Organization missing 'logo'")
                contacts = obj.get('contactPoint')
                if not contacts:
                    warnings.append(f"{path}: JSON-LD Organization missing 'contactPoint'")
                else:
                    # check at least one contact has email or telephone
                    found = False
                    for c in contacts:
                        if isinstance(c, dict) and (c.get('email') or c.get('telephone')):
                            found = True
                    if not found:
                        warnings.append(f"{path}: contactPoint present but no email/telephone found")
        if not ok:
            warnings.append(f"{path}: JSON-LD found but no Organization/LocalBusiness type detected")


# Run checks
sitemap_path = os.path.join(root, 'sitemap.xml')
robots_path = os.path.join(root, 'robots.txt')

if os.path.exists(sitemap_path):
    check_sitemap(sitemap_path)
else:
    errors.append('sitemap.xml missing')

if os.path.exists(robots_path):
    check_robots(robots_path)
else:
    warnings.append('robots.txt missing')

# iterate html files
html_files = [f for f in os.listdir('.') if f.lower().endswith('.html')]
for h in html_files:
    check_html(h)

# Summary
print('VALIDATION SUMMARY')
print('==================')
print(f'Checked sitemap.xml: {os.path.exists(sitemap_path)}')
print(f'Checked robots.txt: {os.path.exists(robots_path)}')
print(f'HTML files scanned: {len(html_files)}')
print('')
if errors:
    print('ERRORS:')
    for e in errors:
        print(' -', e)
else:
    print('No errors found.')

if warnings:
    print('\nWARNINGS:')
    for w in warnings:
        print(' -', w)
else:
    print('\nNo warnings found.')

# Exit code
if errors:
    sys.exit(2)
else:
    sys.exit(0)

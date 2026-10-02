"""Check static site metadata, structured data, assets, links and sitemap."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]; self.ids=[]; self.h1=0; self.main=0
        self.canonical=[]; self.descriptions=[]; self.jsons=[]; self.title=''; self.capture=None; self.buffer=''
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if tag=='h1': self.h1+=1
        if tag=='main': self.main+=1
        if tag=='title': self.capture='title';self.buffer=''
        if tag=='script' and a.get('type')=='application/ld+json':self.capture='json';self.buffer=''
        if tag=='meta' and a.get('name')=='description': self.descriptions.append(a.get('content'))
        if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href'))
        for key in ('src','href'):
            if a.get(key): self.refs.append(a[key])
        if tag=='img':
            assert a.get('alt') is not None and a.get('width') and a.get('height'), 'Image lacks alt/dimensions'
    def handle_data(self,data):
        if self.capture:self.buffer+=data
    def handle_endtag(self,tag):
        if tag=='title' and self.capture=='title':self.title=self.buffer;self.capture=None
        if tag=='script' and self.capture=='json':self.jsons.append(json.loads(self.buffer));self.capture=None

def target_exists(path):
    return any(p.is_file() for p in [path,path.with_suffix('.html'),path/'index.html'])

pages={};titles=set();descriptions=set();canonical=set()
for path in sorted(ROOT.rglob('*.html')):
    # Portable exports may include directory-index aliases for extensionless URLs.
    if path.name == 'index.html' and path.parent.with_suffix('.html').is_file():
        continue
    parser=Page();parser.feed(path.read_text());pages[path]=parser
    assert parser.h1==1 and parser.main==1, (path,'heading/main count')
    assert parser.title and parser.title not in titles, (path,'title')
    titles.add(parser.title)
    assert len(parser.descriptions)==1 and parser.descriptions[0] not in descriptions, (path,'description')
    descriptions.add(parser.descriptions[0])
    assert len(parser.canonical)==1, (path,'canonical')
    canonical.add(parser.canonical[0])
    assert len(parser.ids)==len(set(parser.ids)), (path,'duplicate id')
    for ref in parser.refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc:continue
        if not u.path:
            if u.fragment:assert u.fragment in parser.ids, (path,'fragment',ref)
            continue
        t=ROOT/u.path.lstrip('/') if u.path.startswith('/') else (path.parent/u.path).resolve()
        assert ROOT==t or ROOT in t.parents, (path,'outside root',ref)
        assert target_exists(t), (path,'broken link',ref)
    assert not any(x.get('@type')=='FAQPage' for x in parser.jsons), (path,'stale repeated FAQ schema')
urls=[x.text for x in ET.parse(ROOT/'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls)==len(set(urls)), 'Duplicate sitemap URLs'
assert set(urls)==canonical, ('Sitemap does not match page canonicals',set(urls)^canonical)
for image in (ROOT/'assets/images').glob('*optimized.webp'):
    b=image.read_bytes();assert len(b)>100 and b[:4]==b'RIFF' and b[8:12]==b'WEBP', image
print(f'PASS: {len(pages)} pages, unique metadata, JSON-LD, local links, image files and {len(urls)} sitemap URLs')

"""Build readable web chapters and a homepage collection from supplied sources."""
import json, html, re
from pathlib import Path
from bs4 import BeautifulSoup
read=lambda p:json.loads(Path(p).read_text(encoding='utf-8'))
write=lambda p,s:Path(p).write_text(s,encoding='utf-8')
d=read('content/documents.json'); editorial=read('content/document-editorial.json'); esc=html.escape
pages=[p for p in read('content/pages.json') if not p.get('documentUnit')]
for u in d['units']:
    e=editorial[u['id']]; source=d['sources'][u['document']]['file']
    body=f'<p class="document-intro">{esc(e["intro"])}</p>'
    body+=f'<figure class="document-preview"><a href="../{u["preview"]}"><img src="../{u["preview"]}" alt="Complete {esc(u["title"])} source page" loading="lazy"></a><figcaption>{"Brochure page" if u["document"]=="brochure" else "Presentation slide"} {u["number"]} · Select image to view in detail.</figcaption></figure>'
    for s in e['sections']:
        body+=f'<section><h2>{esc(s["title"])}</h2>'
        if s.get('text'):body+=f'<p>{esc(s["text"])}</p>'
        if s.get('items'):body+='<ul>'+''.join(f'<li>{esc(v)}</li>' for v in s['items'])+'</ul>'
        body+='</section>'
    body+='<h2>In pictures</h2><div class="document-gallery">'
    for i,key in enumerate(u['images']):
        a=d['assets'][key]
        body+=f'<figure><a href="../{a["src"]}"><img src="../{a["src"]}" alt="{esc(u["title"])} — source image {i+1}" loading="lazy" decoding="async"></a><figcaption>Image {i+1} · <a href="../{a["original"]}">Original image</a></figcaption></figure>'
    body+='</div><details class="source-transcript"><summary>Read the complete source transcript</summary>'
    body+=''.join(f'<p>{esc(b["text"])}</p>' for b in u['blocks'])+'</details>'
    category='Brochure' if u['document']=='brochure' else 'News & insights' if u['number'] in (3,4,5) else 'Reference' if u['number']==1 else 'Projects & group'
    pages.append(dict(slug=u['id'],title=u['title'],category=category,html=body,words=len(BeautifulSoup(body,'html.parser').get_text().split()),media=['../'+u['preview']],documentUnit=u['id'],url='content/'+u['id']+'.html'))
write('content/pages.json',json.dumps(pages,ensure_ascii=False,indent=2)+'\n')
soup=BeautifulSoup(Path('redesign/index.html').read_text(encoding='utf-8'),'html.parser')
for old in soup.select('[data-document-collection]'):old.decompose()
for old in soup.select('.journal-card'):
    if old.select_one('a[href^="content/presentation-"]'):old.decompose()
def card(id):
    u=next(u for u in d['units'] if u['id']==id)
    feature={'brochure-05':'pdf-740','brochure-06':'pdf-848','brochure-07':'pdf-993','brochure-08':'pdf-1101','brochure-09':'pdf-1219','brochure-10':'pdf-1304'}.get(id)
    picture=d['assets'][feature]['src'] if feature else u['preview']
    return f'<a class="document-card" href="content/{id}.html"><div class="document-card-image"><img src="{picture}" alt="{esc(u["title"])}" loading="lazy"/></div><span class="document-card-number">{u["number"]:02} / {"BROCHURE" if u["document"]=="brochure" else "FIELD NOTES"}</span><h3>{esc(u["title"])}</h3><span class="document-card-arrow" aria-hidden="true">↗</span></a>'
section='<section class="earth-stories" id="earth-stories" data-document-collection=""><div class="wrap"><p class="eyebrow">From orbit. Into everyday decisions.</p><h2>A living planet.<br/><span>A world of possibilities.</span></h2><p class="collection-intro">Explore the imagery, analysis and applications behind our work. Every chapter opens a closer view.</p><div class="sector-stories">'+''.join(card(f'brochure-{n:02}') for n in range(5,11))+'</div></div></section>'
section+='<section class="field-notes" data-document-collection=""><div class="wrap"><p class="eyebrow">People. Projects. Progress.</p><h2>Intelligence is only<br/>the beginning.</h2><div class="reach-strip"><p><strong>1,270,637</strong><span>hectares analysed</span></p><p><strong>7</strong><span>countries in our reach</span></p><p><strong>2021</strong><span>Geospatial AI established</span></p></div><p class="collection-intro">Colombia · Ecuador · Peru · Libya · Malaysia · Indonesia · Thailand</p><div class="client-projects"><h3>Selected client work</h3><dl><div><dt>SD Guthrie Research / Plantation</dt><dd>Tree counting · Satellite imagery</dd></div><div><dt>MPOB</dt><dd>Soil investigation</dd></div><div><dt>RSPO project</dt><dd>Compliance report</dd></div><div><dt>NCER</dt><dd>GIS dashboard</dd></div><div><dt>SSGP</dt><dd>InSAR</dd></div></dl><a class="text-link" href="content/presentation-02.html">View project references ↗</a></div><div class="group-stories">'+''.join(card(f'presentation-{n:02}') for n in (6,7,8))+'</div></div></section>'
soup.select_one('#contact').insert_before(BeautifulSoup(section,'html.parser'))
resource='<section class="document-library" id="document-library" data-document-collection=""><div class="wrap"><p class="eyebrow">The complete collection</p><h2>More to discover.<br/>Nothing left behind.</h2><p class="collection-intro">All 12 brochure chapters and 8 presentation slides, with their photography, diagrams and source text.</p><details><summary>Browse all 20 chapters and slides</summary><div class="resource-grid">'+''.join(card(u['id']) for u in d['units'])+'</div></details></div></section>'
soup.select_one('#contact').insert_before(BeautifulSoup(resource,'html.parser'))
# Keep all previous news, with the three supplied events leading the collection.
lead=soup.select_one('.journal-lead'); archive=soup.select_one('.journal-grid')
for c in list(lead.select('.journal-card')):archive.insert(0,c.extract())
for n in (4,5,3):
    u=next(u for u in d['units'] if u['id']==f'presentation-{n:02}')
    date={4:'30–31 August 2026',5:'24 August 2026',3:'2025'}[n]
    u=dict(u,preview='assets/documents/presentation-image'+str({4:7,5:11,3:2}[n])+'.webp')
    lead.append(BeautifulSoup(f'<article class="journal-card"><a href="content/{u["id"]}.html"><div class="journal-photo"><img src="{u["preview"]}" alt="" loading="lazy"/><span aria-hidden="true">↗</span></div><div class="journal-copy"><p class="eyebrow">{date}</p><h3>{esc(u["title"])}</h3><span class="journal-read">Explore the photo story</span></div></a></article>','html.parser'))
summary=soup.select_one('.journal-archive summary')
if summary:summary.clear();summary.append(BeautifulSoup('Explore 18 more stories <span aria-hidden="true">+</span>','html.parser'))
if not soup.select_one('link[href="assets/css/colour.css"]'):soup.head.append(BeautifulSoup('<link rel="stylesheet" href="assets/css/colour.css"/>','html.parser'))
write('redesign/index.html',str(soup))
write('content/document-coverage.json',json.dumps({'units':[{ 'id':u['id'],'page':'content/'+u['id']+'.html','preview':u['preview'],'images':u['images']} for u in d['units']],'sources':d['sources'],'imageCount':len(d['assets'])},indent=2)+'\n')
print('Built 20 complete document chapters; retained original website content.')

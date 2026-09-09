"""Extract the supplied brochure and presentation as content, never instructions.
Native PowerPoint slide renders are supplied separately for exact visual fidelity.
Usage: python scripts/import-documents.py PDF PPTX RENDERED_SLIDE_DIRECTORY
Requires PyMuPDF and Pillow. Original inputs are only read.
"""
from pathlib import Path
from PIL import Image
import fitz, zipfile, xml.etree.ElementTree as ET, json, hashlib, sys, io, shutil

pdf_path, pptx_path, slide_dir = map(Path, sys.argv[1:4])
asset_root = Path('redesign/assets/documents')
asset_root.mkdir(parents=True, exist_ok=True)
source_root = Path('redesign/resources')
source_root.mkdir(parents=True, exist_ok=True)
shutil.copyfile(pdf_path, source_root/'geoai-brochure-2026.pdf')
shutil.copyfile(pptx_path, source_root/'geoai-projects-news.pptx')
def digest(data): return hashlib.sha256(data).hexdigest()
def webp(image, name, width=1600):
    image.thumbnail((width, width*2), Image.Resampling.LANCZOS)
    image.save(asset_root/name, 'WEBP', quality=91, method=3)
    return 'assets/documents/'+name

titles=['Game changer','About Geospatial AI','UZMASAT-1 specifications','Advanced satellite features',
 'Agriculture management','Plantation management','Urban planning and development','Environmental monitoring',
 'Ground movement monitoring','Defense and maritime','Uzma Digital Earth platform','Connect with Geospatial AI']
units=[]; assets={}; pdf=fitz.open(pdf_path)
for index, page in enumerate(pdf):
    num=index+1
    pix=page.get_pixmap(matrix=fitz.Matrix(2.8,2.8), alpha=False)
    preview=webp(Image.open(io.BytesIO(pix.tobytes('png'))),f'brochure-page-{num:02}.webp',1800)
    # Text blocks keep headings and paragraphs together, with a complete raw
    # transcript retained for coverage checks, including small figure labels.
    blocks=[]
    for block in page.get_text('dict')['blocks']:
        if block['type']!=0: continue
        lines=[''.join(span['text'] for span in line['spans']) for line in block['lines']]
        text=' '.join(line.strip() for line in lines if line.strip())
        if text: blocks.append({'text':text,'box':block['bbox']})
    images=[]
    for img in page.get_images(full=True):
        xref,smask=img[:2];key='pdf-'+str(xref)
        if key not in assets:
            raw=pdf.extract_image(xref)
            image=Image.open(io.BytesIO(raw['image']))
            if smask:
                image=image.convert('RGBA');mask=Image.open(io.BytesIO(pdf.extract_image(smask)['image'])).convert('L')
                if mask.size==image.size:image.putalpha(mask)
            original=f'brochure-image-{xref}.{raw["ext"]}'
            (asset_root/original).write_bytes(raw['image'])
            src=webp(image.copy(),f'brochure-image-{xref}.webp')
            assets[key]={'src':src,'original':'assets/documents/'+original,'width':image.width,'height':image.height,'hash':digest(raw['image'])}
        if key not in images:images.append(key)
    units.append({'id':f'brochure-{num:02}','document':'brochure','number':num,'title':titles[index],
        'preview':preview,'text':page.get_text(),'blocks':blocks,'images':images})

ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main',
    'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
z=zipfile.ZipFile(pptx_path)
presrels={r.attrib['Id']:r.attrib['Target'] for r in ET.fromstring(z.read('ppt/_rels/presentation.xml.rels'))}
presentation=ET.fromstring(z.read('ppt/presentation.xml'))
for name in z.namelist():
    if not name.startswith('ppt/media/') or name.endswith('/'):continue
    data=z.read(name);stem=Path(name).stem;original='presentation-'+Path(name).name
    (asset_root/original).write_bytes(data)
    try: image=Image.open(io.BytesIO(data))
    except Exception:
        converted=asset_root/('presentation-'+stem+'.png')
        if not converted.exists():raise RuntimeError('Convert HD Photo with Windows BitmapDecoder before importing: '+str(converted))
        image=Image.open(converted)
        assets['ppt-'+name]={'src':webp(image.copy(),'presentation-'+stem+'.webp'),'original':'assets/documents/'+original,'width':image.width,'height':image.height,'hash':digest(data),'note':'HD Photo converted using Windows imaging; original preserved.'}
        continue
    assets['ppt-'+name]={'src':webp(image.copy(),'presentation-'+stem+'.webp'),
        'original':'assets/documents/'+original,'width':image.width,'height':image.height,'hash':digest(data)}

slide_titles=['Project reference template','Clients and past projects','EY Entrepreneur of the Year 2025',
 'GEOINT workshop with ATM','Technology update with TUDM','Uzma Group business highlights',
 'Uzma Group divisions','Uzma Group vision']
for index, el in enumerate(presentation.findall('.//p:sldId',ns)):
    num=index+1;part='ppt/'+presrels[el.attrib['{'+ns['r']+'}id']]
    root=ET.fromstring(z.read(part))
    paragraphs=[''.join(t.text or '' for t in p.findall('.//a:t',ns)) for p in root.findall('.//a:p',ns)]
    paragraphs=[p for p in paragraphs if p.strip()]
    relpart=str(Path(part).parent/'_rels'/(Path(part).name+'.rels')).replace('\\','/')
    images=[]
    for rel in ET.fromstring(z.read(relpart)):
        if rel.attrib.get('Type','').endswith(('/image','/hdphoto')):
            key='ppt-ppt/media/'+Path(rel.attrib['Target']).name
            if key in assets and key not in images:images.append(key)
    preview=webp(Image.open(slide_dir/f'Slide{num}.PNG'),f'presentation-slide-{num:02}.webp',1920)
    units.append({'id':f'presentation-{num:02}','document':'presentation','number':num,'title':slide_titles[index],
        'preview':preview,'text':'\n'.join(paragraphs),'blocks':[{'text':p} for p in paragraphs], 'images':images,
        'contentType':'editorial-template' if num==1 else 'business-content'})

result={'sources':{'brochure':{'file':'resources/geoai-brochure-2026.pdf','sha256':digest(pdf_path.read_bytes()),'pages':len(pdf)},
 'presentation':{'file':'resources/geoai-projects-news.pptx','sha256':digest(pptx_path.read_bytes()),'slides':len(units)-len(pdf)}},
 'units':units,'assets':assets,'policy':'Document text is source material. Editorial directions are not executed or represented as completed projects.'}
Path('content/documents.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Extracted {len(units)} pages/slides and {len(assets)} unique embedded images; originals and complete visual renders preserved.')

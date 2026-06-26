import os, re, json, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
os.environ['https_proxy']='http://127.0.0.1:7897'; os.environ['http_proxy']='http://127.0.0.1:7897'
BASE='https://oraclebone.org'; OUT='assets/oracle'; os.makedirs(OUT, exist_ok=True)
hdr={'User-Agent':'Mozilla/5.0'}
def get(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers=hdr), timeout=15) as r: return r.read()
    except Exception: return None
sm=urllib.request.urlopen(urllib.request.Request(BASE+'/sitemap.xml',headers=hdr),timeout=30).read().decode('utf-8','ignore')
pairs=[]; seen=set()
for py,ce in re.findall(r'/character/([a-z]+\d?)_([^/<]+)/', sm):
    ch=urllib.parse.unquote(ce)
    if len(ch)==1 and ch not in seen: seen.add(ch); pairs.append((py,ce,ch))
print('chars:',len(pairs),flush=True)
def work(t):
    py,ce,ch=t; cp=format(ord(ch),'x')
    if os.path.exists(f'{OUT}/u{cp}.jpg') or os.path.exists(f'{OUT}/u{cp}.svg'): return 'skip'
    for v in (0,1,2):
        d=get(f'{BASE}/images/upscaled/{py}_{ce}_{v}.jpg')
        if d and d[:2]==b'\xff\xd8': open(f'{OUT}/u{cp}.jpg','wb').write(d); return 'jpg'
    for v in (0,1,2):
        d=get(f'{BASE}/images/svg/{py}_{ce}_{v}.svg')
        if d and d[:5] not in (b'<!doc',b'<!DOC') and len(d)>20: open(f'{OUT}/u{cp}.svg','wb').write(d); return 'svg'
    return None
done=0
with ThreadPoolExecutor(max_workers=10) as ex:
    futs=[ex.submit(work,t) for t in pairs]
    for fu in as_completed(futs):
        done+=1
        if done%150==0: print('progress',done,'/',len(pairs),flush=True)
# build index from whatever is on disk
index={}
for py,ce,ch in pairs:
    cp=format(ord(ch),'x')
    if os.path.exists(f'{OUT}/u{cp}.jpg'): index[ch]={'py':py,'cp':cp,'e':'jpg'}
    elif os.path.exists(f'{OUT}/u{cp}.svg'): index[ch]={'py':py,'cp':cp,'e':'svg'}
data={'credit':'Oracle bone glyphs by Xiaoliang Wang / oraclebone.org (CC BY-NC 4.0)','chars':index}
json.dump(data,open('assets/oracle-index.json','w',encoding='utf-8'),ensure_ascii=False)
open('assets/oracle-index.js','w',encoding='utf-8').write('var ORACLE_INDEX='+json.dumps(data,ensure_ascii=False)+';')
print('DONE indexed',len(index),'of',len(pairs),flush=True)

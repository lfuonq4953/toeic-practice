import json,re,glob,datetime
import os
REPO=os.environ.get('REPO',os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..')))
p=os.path.join(REPO,'tests','manifest.js'); t=open(p,encoding='utf-8').read()
arr=json.loads(re.search(r'window\.MANIFEST\s*=\s*(\[.*\]);',t,re.S).group(1))
arr=[a for a in arr if a.get('kind')!='part']
sets=[json.load(open(f,encoding='utf-8')) for f in glob.glob(os.path.join(os.environ.get('OCR_DIR','ocr'),'meta','*.json'))]
for s in sets: s['added']=datetime.date.today().isoformat()
sets.sort(key=lambda s:(s['parts'][0],s['id']))
arr+=sets
open(p,'w',encoding='utf-8').write(t.split('window.MANIFEST')[0]+'window.MANIFEST = '+json.dumps(arr,ensure_ascii=False,indent=1)+';\n')
print(len(arr),'mục,',len(sets),'bộ theo Part')

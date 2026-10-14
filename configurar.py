"""Genera copias inactivas. No conecta con n8n ni cambia originales."""
import argparse,json,pathlib,re
from urllib.parse import urlparse

def read_config(code,start):
 # Lee objeto literal sin ejecutar JavaScript; admite claves simples sin comillas.
 depth=0;quote=None;escape=False
 for i in range(start,len(code)):
  ch=code[i]
  if quote:
   if escape:escape=False
   elif ch==chr(92):escape=True
   elif ch==quote:quote=None
  elif ch in ['"',"'"]:quote=ch
  elif ch=='{':depth+=1
  elif ch=='}':
   depth-=1
   if depth==0:
    raw=code[start:i+1]
    raw=re.sub(r'([,{]\s*)([A-Za-z_$][\w$]*)(\s*:)',r'\1"\2"\3',raw)
    return json.loads(raw),i+1
 raise ValueError('Objeto config incompleto')

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--config',required=True)
 parser.add_argument('--output',default='n8n_configurados')
 args=parser.parse_args();root=pathlib.Path(__file__).resolve().parent
 cfg=json.loads(pathlib.Path(args.config).read_text(encoding='utf-8-sig'))
 template=json.loads((root/'docs/configuracion.example.json').read_text(encoding='utf-8'))
 ids=[cfg.get('sheets',{}).get(k,'') for k in template['sheets']]
 if any(not isinstance(v,str) or not re.fullmatch(r'[A-Za-z0-9_-]+',v) or v.startswith(('REEMPLAZAR','SELECCIONAR')) for v in ids):parser.error('Completa los once IDs de Sheets, sin URLs')
 if len(set(ids))!=11:parser.error('Se requieren once documentos independientes')
 wf=cfg.get('workflowNotificaciones','')
 if not re.fullmatch(r'[A-Za-z0-9_-]+',wf) or wf.startswith('SELECCIONAR'):parser.error('Completa ID real de WF09')
 origin=cfg.get('frontendOrigin','');u=urlparse(origin)
 if u.scheme not in ['http','https'] or not u.netloc or u.path not in ['','/'] or u.query or u.fragment or u.username:parser.error('frontendOrigin debe ser origen HTTP/HTTPS sin ruta')
 origin=origin.rstrip('/');out=pathlib.Path(args.output).resolve()
 if out== (root/'n8n').resolve() or (root/'n8n').resolve() in out.parents:parser.error('No sobrescribas n8n; usa otra carpeta')
 if out.exists() and any(out.iterdir()):parser.error('La carpeta de salida debe estar vacía o no existir')
 schemas=json.loads((root/'docs/esquemas.json').read_text(encoding='utf-8'))
 schemas.setdefault('Checkins',{'documento':'EP11_Checkin'})
 prepared=[]
 for f in sorted((root/'n8n').glob('*.json')):
  w=json.loads(f.read_text(encoding='utf-8-sig'))
  n=next(n for n in w['nodes'] if n['name']=='Configuración');c=n['parameters']['jsCode']
  m=re.search(r'const\s+config\s*=\s*',c)
  if not m:raise ValueError('No se encontró config en '+f.name)
  existing,end=read_config(c,m.end());merged={**existing,**cfg,'sheets':{**existing.get('sheets',{}),**cfg['sheets']}}
  n['parameters']['jsCode']=c[:m.end()]+json.dumps(merged,ensure_ascii=False,indent=2)+c[end:]
  for node in w['nodes']:
   if node['type'].endswith('.googleSheets'):
    params=node['parameters'];locator=params.get('sheetName',{})
    sheet=locator.get('cachedResultName') or locator.get('value') if isinstance(locator,dict) else locator
    if sheet not in schemas:raise ValueError('Pestaña desconocida en '+f.name+': '+node['name'])
    document=schemas[sheet]['documento'];new_id=cfg['sheets'][document]
    old_id=params.get('documentId',{});old_id=old_id.get('value') if isinstance(old_id,dict) else old_id
    params['documentId']={'__rl':True,'value':new_id,'mode':'id'}
    if old_id!=new_id:params['sheetName']={'__rl':True,'value':sheet,'mode':'name'}
   if node['type'].endswith(('.webhook','.chatTrigger')):node['parameters'].setdefault('options',{})['allowedOrigins']=origin
  w['active']=False;prepared.append((f.name,w))
 if len(prepared)!=11:raise ValueError('Se esperaban once workflows')
 out.mkdir(parents=True,exist_ok=True)
 for name,w in prepared:(out/name).write_text(json.dumps(w,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Generados 11 workflows inactivos en',out)
 print('No se cambió n8n. Conserva WF09 existente y sus credenciales.')
if __name__=='__main__':main()

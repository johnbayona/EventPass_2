"""Personaliza IDs sin conectar credenciales ni modificar workflows originales."""
import argparse,json,pathlib,re

parser=argparse.ArgumentParser()
parser.add_argument('--config',required=True,help='Archivo JSON con IDs de Sheets y WF09')
parser.add_argument('--output',default='n8n_configurados')
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parent
config=json.loads(pathlib.Path(args.config).read_text(encoding='utf-8-sig'))
template=json.loads((root/'docs/configuracion.example.json').read_text())
for key in template['sheets']:
 value=config.get('sheets',{}).get(key,'')
 if not isinstance(value,str) or not value or value.startswith('REEMPLAZAR') or '/' in value:
  parser.error('Completa el ID del documento '+key+' (solo ID, no URL)')
if len(set(config['sheets'].values()))!=10:
 parser.error('Se necesitan diez IDs de documentos independientes')
wf09=config.get('workflowNotificaciones','')
if not isinstance(wf09,str) or not wf09 or wf09.startswith('SELECCIONAR') or '/' in wf09:
 parser.error('Completa workflowNotificaciones con el ID real del WF09 importado')
merged={**template,**config}
out=pathlib.Path(args.output);out.mkdir(parents=True,exist_ok=True)
for file in sorted((root/'n8n').glob('*.json')):
 workflow=json.loads(file.read_text())
 node=next(n for n in workflow['nodes'] if n['name']=='Configuración')
 code=node['parameters']['jsCode']
 start=code.index('const config = ')+len('const config = ')
 end=code.index(';\nconst raw =',start)
 node['parameters']['jsCode']=code[:start]+json.dumps(merged,ensure_ascii=False,indent=2)+code[end:]
 workflow['active']=False
 (out/file.name).write_text(json.dumps(workflow,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Diez archivos generados en',out.resolve())
print('Selecciona las credenciales en n8n. No importes de nuevo WF09 si ya existe.')

import fs from 'node:fs';
let invalid=0;
for(const name of fs.readdirSync('n8n').filter(n=>n.endsWith('.json')).sort()){
 try{const w=JSON.parse(fs.readFileSync('n8n/'+name,'utf8'));const source=(w.nodes||[]).map(n=>n.parameters?.jsCode||'').join('\n');
 console.log(name+': JSON OK; '+w.nodes.length+' nodos; '+(source.includes('require(')?'revisar módulos Code; ':'')+(source.includes('REEMPLAZAR')?'configuración pendiente':'sin marcador REEMPLAZAR'));
 }catch(e){invalid++;console.error(name+': JSON INVÁLIDO');}
}
process.exitCode=invalid?1:0;

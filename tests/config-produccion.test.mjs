import test from 'node:test';import assert from 'node:assert/strict';
import {validateConfig} from '../scripts/validar-config.mjs';
const valid={n8nBaseUrl:'https://n8n.example.com',endpoints:{},chatUrl:'https://n8n.example.com/webhook/id/chat',telegramBotUsername:'example_bot'};
test('Acepta HTTPS con rutas de producción',()=>validateConfig(valid,{production:true}));
for(const url of ['http://localhost:5678','https://localhost','https://127.0.0.1','https://user:pass@example.com'])test('Rechaza base no apta: '+url,()=>assert.throws(()=>validateConfig({...valid,n8nBaseUrl:url},{production:true})));
test('Override webhook-test no queda oculto por base correcta',()=>assert.throws(()=>validateConfig({...valid,endpoints:{auth:'https://n8n.example.com/webhook-test/eventpass/auth'}},{production:true})));
test('Rechaza chat-test',()=>assert.throws(()=>validateConfig({...valid,chatUrl:'https://n8n.example.com/chat-test/abc'},{production:true})));
test('Rechaza configuración incompleta',()=>assert.throws(()=>validateConfig({...valid,n8nBaseUrl:''},{production:true})));
test('Permite pruebas locales sin exigir producción',()=>validateConfig({...valid,n8nBaseUrl:'http://localhost:5678'}));

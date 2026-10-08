// EDITA SOLO config. Los IDs de Sheets son públicos identificadores, no credenciales.
const config = {
  "sheets": {
    "EP01_Usuarios": "10GNs5mk6rcwvB2uFBeSgQC3_c1xpEuDmPwOm79lzZm4",
    "EP02_Sesiones": "1_1_0buDCtklJDvIGBSo53S1yRFazZyShY3a_2WZae3A",
    "EP03_Telegram": "1lh37TRoZXLp6aGvqu2oAlrzbqLiM3li_O5tfioWFt6Y",
    "EP04_Eventos": "REEMPLAZAR_ID_EP04_Eventos",
    "EP05_Catalogo_Log": "REEMPLAZAR_ID_EP05_Catalogo_Log",
    "EP06_Inscripciones": "REEMPLAZAR_ID_EP06_Inscripciones",
    "EP07_Reasignaciones": "REEMPLAZAR_ID_EP07_Reasignaciones",
    "EP08_Recordatorios": "REEMPLAZAR_ID_EP08_Recordatorios",
    "EP09_Notificaciones": "REEMPLAZAR_ID_EP09_Notificaciones",
    "EP10_Soporte": "REEMPLAZAR_ID_EP10_Soporte"
  },
  "sessionHours": 8,
  "linkMinutes": 10,
  "reminderHours": 24,
  "eventTimezoneOffset": "-05:00",
  "workflowNotificaciones": "SELECCIONAR_WF09_EN_EL_NODO",
  "frontendOrigin": "http://localhost:5173"
};
const raw = $input.first().json;
const telegram = !!raw.message;
const request = telegram ? {text:raw.message.text || ''} : (raw.body || raw);
return [{json:{config,request,headers:raw.headers||{},mode:telegram?'telegram':'http',chat_id:telegram?String(raw.message.chat.id):'',chat_type:raw.message?.chat?.type||'',telegram_username:raw.message?.from?.username||''}}];

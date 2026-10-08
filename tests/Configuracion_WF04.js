// Completa los IDs de tus archivos de Google Sheets, conservando las comillas.
const config = {
  sheets: {
    EP04_Eventos: "REEMPLAZAR_ID_EP04_Eventos",
    EP06_Inscripciones: "REEMPLAZAR_ID_EP06_Inscripciones"
  },
  eventTimezoneOffset: "-05:00",
  workflowNotificaciones: "SELECCIONAR_WF09_EN_EL_NODO"
};
const raw = $input.first().json;
return [{json:{config,request:raw.body || raw,headers:raw.headers || {},mode:"http",chat_id:""}}];

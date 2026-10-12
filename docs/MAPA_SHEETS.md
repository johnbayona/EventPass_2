# Inventario de Google Sheets

Conserva los documentos existentes en Drive. Completa esta tabla localmente. Un ID identifica un documento, no concede permisos. OAuth se configura solo en n8n.

| Documento | Pestañas | ID / enlace |
|---|---|---|
| EP01_Usuarios | Usuarios, Auditoria_Usuarios | COMPLETAR |
| EP02_Sesiones | Sesiones | COMPLETAR |
| EP03_Telegram | Codigos_Vinculacion, Vinculaciones | COMPLETAR |
| EP04_Eventos | Eventos, Auditoria_Eventos | COMPLETAR |
| EP05_Catalogo_Log | Consultas_Catalogo | COMPLETAR |
| EP06_Inscripciones | Inscripciones, Auditoria_Inscripciones | COMPLETAR |
| EP07_Reasignaciones | Reasignaciones | COMPLETAR |
| EP08_Recordatorios | Recordatorios | COMPLETAR |
| EP09_Notificaciones | Notificaciones | COMPLETAR |
| EP10_Soporte | Conversaciones, Mensajes | COMPLETAR |
| EP11_Checkin | Checkins | COMPLETAR |

Checkins: checkin_id, inscripcion_id, evento_id, usuario_id, fecha_checkin, resultado, detalle. Comprueba que A1 sea checkin_id completo.

No incluyas Usuarios, Sesiones, hashes, tokens ni conversaciones reales en el repositorio. Mantén respaldos privados en Drive. Las plantillas no sustituyen las hojas activas. El frontend solo consulta n8n, nunca Sheets directamente.

## Examen — Check-in digital

Permite a un usuario autenticado registrar su propia asistencia desde Mis inscripciones → Check-in. El frontend llama a n8n; no lee ni escribe Sheets directamente.

- Endpoint: POST /webhook/eventpass/checkin.
- Pruebas: POST /webhook-test/eventpass/checkin con escucha activa.
- Cabeceras: Content-Type: application/json y Authorization: Bearer <sesión>.
- Variable opcional: VITE_CHECKIN_URL; vacía usa la ruta estándar a partir de VITE_N8N_BASE_URL.

Petición:
```json
{"inscripcion_id":"INS_REAL","evento_id":"EVT_REAL"}
```
Respuesta exitosa (HTTP 201):
```json
{"ok":true,"resultado":"EXITOSO","mensaje":"Check-in realizado correctamente","checkin_id":"CHK_uuid","inscripcion_id":"INS_REAL","evento_id":"EVT_REAL","fecha_checkin":"2026-10-09T01:00:00.000Z","estado":"ASISTIO","notificaciones":[{"gmail_estado":"ENVIADO","telegram_estado":"ENVIADO"}],"aviso_pendiente":false}
```
Duplicado (HTTP 200): ok=true, resultado=DUPLICADO, mensaje de ingreso ya registrado. Rechazado: ok=false, resultado=RECHAZADO, mensaje; HTTP 400 por entrada inválida, 401 por sesión inválida, 403 por inscripción ajena, 404 por registro inexistente o 409 por estado/correspondencia inválidos. Un fallo de configuración WF09 responde 503 antes de mutar asistencia.

Validaciones: IDs presentes; sesión vigente; usuario ACTIVO y propietario; inscripción única/existente; evento único/existente; correspondencia; historial sin EXITOSO previo; estado CONFIRMADA. No admite BORRADOR/CANCELADO. No se impone ventana horaria adicional, no exigida por el examen.

Persistencia nueva: archivo independiente EP11_Checkin, pestaña Checkins. Columnas: checkin_id, inscripcion_id, evento_id, usuario_id, fecha_checkin, resultado, detalle. Resultado admite EXITOSO, RECHAZADO y DUPLICADO. Se conserva un intento por fila. EP06 se actualiza por inscripcion_id con CONFIRMADA → ASISTIO y fecha_actualizacion; otras columnas permanecen intactas.

Idempotencia secuencial: se consulta historial por inscripcion_id antes de escribir; ASISTIO también bloquea otro éxito. Duplicados no actualizan la inscripción ni llaman WF09. Sheets no brinda transacción ni exclusión atómica entre ejecuciones: concurrencia y recuperación parcial son límites documentados en LEEME_PRIMERO.md, pendientes de endurecimiento antes de uso multiusuario concurrente.

WF11 llama Execute Sub-workflow hacia WF09, que conserva la lógica Gmail/Telegram, resultados por canal e idempotencia CHECKIN|inscripcion_id. Un error de aviso no revierte asistencia. No se considera verificada la entrega mientras no lleguen ambos mensajes.

Compatibilidad: ocupación CONFIRMADA+ASISTIO en WF05–07; WF06 no permite segunda inscripción tras ASISTIO y mantiene cancelación/edición restringidas a estados activos anteriores. WF08 conserva recordatorios a CONFIRMADA; frontend etiqueta Asistió; WF10 continúa informativo.

Pruebas: node --test tests/wf11.test.cjs; npm test; npm run build. Además se requieren los cuatro casos reales de docs/GUIA_EXAMEN.md. Completar con URL Vercel y enlace al commit final y exportar WF11 desde n8n antes de entregar.

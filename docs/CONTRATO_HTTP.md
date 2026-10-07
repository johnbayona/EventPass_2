# Contrato HTTP

Todas las rutas usan POST. Prefijo de prueba: `http://localhost:5678/webhook-test/`; prefijo de producción local: `http://localhost:5678/webhook/`. Cambia el host por tu URL HTTPS pública al conectar Vercel.

Un webhook de prueba debe estar escuchando antes de cada llamada. Las rutas protegidas aceptan `Authorization: Bearer TOKEN` o `session_token` en JSON. La identidad se obtiene de la sesión, no de un usuario_id arbitrario.

## WF01 — eventpass/usuarios

Crear (público):
```json
{"operacion":"crear","nombre":"Persona de prueba","email":"persona@example.test","password":"CLAVE_DE_PRUEBA_MINIMO_12"}
```
Consultar (sesión):
```json
{"operacion":"consultar","session_token":"TOKEN"}
```
Actualizar (sesión, solo nombre y/o email):
```json
{"operacion":"actualizar","session_token":"TOKEN","nombre":"Nuevo nombre","email":"nuevo@example.test"}
```
Desactivar (sesión):
```json
{"operacion":"desactivar","session_token":"TOKEN"}
```

## WF02 — eventpass/auth

```json
{"operacion":"login","email":"persona@example.test","password":"CLAVE_DE_PRUEBA_MINIMO_12"}
```
```json
{"operacion":"validar","session_token":"TOKEN"}
```
```json
{"operacion":"logout","session_token":"TOKEN"}
```

Login responde `session_token`, `expira_en` y `usuario` sin hash/salt. Sesión: ACTIVA/CERRADA/EXPIRADA; usuario: ACTIVO/INACTIVO. Logout es idempotente para una sesión ya cerrada.

## WF03 — eventpass/telegram

```json
{"operacion":"generar_codigo","session_token":"TOKEN"}
```
```json
{"operacion":"consultar","session_token":"TOKEN"}
```

En el bot: `/vincular CODIGO`. Código: PENDIENTE/USADO/EXPIRADO/CANCELADO. Vinculación: ACTIVA/INACTIVA. El código dura diez minutos.

## WF04 — formulario protegido

No se llama desde el frontend. Usa la Form URL del trigger con Basic Auth. `operacion`: CREATE/READ/UPDATE/CANCEL/CLOSE. Campos de CREATE: nombre, categoria, descripcion, fecha, hora, lugar, capacidad, organizador; estado opcional por defecto BORRADOR, imagen_url opcional HTTPS. Fecha AAAA-MM-DD; hora HH:mm en Colombia. UPDATE/CANCEL/CLOSE requieren evento_id. Campos vacíos en UPDATE conservan su valor previo. READ sin evento_id devuelve todos. Estados: BORRADOR/PUBLICADO/CERRADO/CANCELADO.

## WF05 — eventpass/catalogo

```json
{"operacion":"listado","visitor_id":"ID_ALEATORIO_DEL_VISITANTE"}
```
```json
{"operacion":"filtro","categoria":"Emprendimiento","visitor_id":"ID_ALEATORIO"}
```
```json
{"operacion":"detalle","evento_id":"EVT_DEMO_01","visitor_id":"ID_ALEATORIO"}
```

Respuesta de listado/filtro: `ok`, `eventos`, `total`. Detalle: `ok`, `evento`. Cada evento incluye `cupos_disponibles` y `acepta_inscripciones`. Un evento lleno aún puede admitir lista de espera si está publicado y es futuro. CERRADO y CANCELADO no admiten inscripción. No se usa un campo de disponibilidad manual.

## WF06 — eventpass/inscripciones

```json
{"operacion":"crear","session_token":"TOKEN","evento_id":"EVT_DEMO_01","nombre_acreditacion":"Persona","observaciones":""}
```
```json
{"operacion":"consultar","session_token":"TOKEN"}
```
```json
{"operacion":"actualizar","session_token":"TOKEN","inscripcion_id":"INS_ID","nombre_acreditacion":"Nuevo nombre","observaciones":"Accesibilidad"}
```
```json
{"operacion":"cancelar","session_token":"TOKEN","inscripcion_id":"INS_ID"}
```

Nombre de acreditación y observaciones son opcionales al crear. Solo esos dos campos pueden actualizarse. Estados: CONFIRMADA/LISTA_ESPERA/CANCELADA. La creación exige sesión, usuario activo, Telegram activo y evento publicado/futuro. Repetir creación activa devuelve la existente con `idempotente: true`. Es posible volver a inscribirse después de cancelar, con un nuevo ID.

## WF07 / WF08

No son endpoints. Se ejecutan mediante Schedule Trigger. WF07 devuelve un resumen de reasignaciones y WF08 de recordatorios. En pruebas, ejecuta cada uno manualmente sin ejecuciones simultáneas.

## WF09 — entrada interna de subworkflow

```json
{
  "usuario_id":"USR_ID",
  "tipo":"CONFIRMADA",
  "titulo":"Inscripción confirmada",
  "mensaje":"Tu cupo está confirmado.",
  "evento_id":"EVT_ID",
  "inscripcion_id":"INS_ID",
  "clave_idempotencia":"USR_ID|EVT_ID|INS_ID|CONFIRMADA"
}
```

Responde `gmail_estado`, `telegram_estado` y errores separados. ENVIADO/ERROR/PENDIENTE/NO_APLICA por canal. `ok` es true solo si ambos canales están ENVIADO. La respuesta HTTP de inscripción puede ser correcta aunque fallen notificaciones: consulta `notificaciones` y EP09_Notificaciones; no crees otra inscripción para reenviar mensajes.

## WF10 — protocolo Chat Trigger

Usa la Chat URL del nodo, no la ruta de WF01. Ejemplo de solicitud del protocolo del widget:
```json
{"action":"sendMessage","sessionId":"UUID_ALEATORIO_POR_CONVERSACION","chatInput":"¿Qué eventos de emprendimiento hay?"}
```
La respuesta final contiene `output` y `conversation_id`. Conversación ABIERTA/CERRADA; mensajes USER/ASSISTANT/SYSTEM. Esta implementación crea conversaciones ABIERTA y registra USER/ASSISTANT; no expone una operación de cierre. El registro SYSTEM no es obligatorio. Se identifica al visitante, no a un usuario autenticado.

## Códigos HTTP

| Código | Uso |
|---|---|
| 200 | Consulta, actualización, cancelación o resultado idempotente |
| 201 | Usuario, evento o inscripción creada |
| 400 | Datos u operación inválidos |
| 401 | Sesión/credenciales inválidas o usuario inactivo |
| 403 | Intento de acceder a otra identidad |
| 404 | Recurso inexistente o no publicable |
| 409 | Email duplicado, Telegram pendiente o conflicto de estado/capacidad |
| 500 | Error interno de lógica; los errores de integración pueden detener la ejecución y devolver el error genérico de n8n |

La respuesta JSON de aplicación ante fallos de validación usa `{"ok":false,"mensaje":"..."}`. Un fallo de credenciales, red o Sheets no está convertido en una respuesta de éxito. Revisa la ejecución y no actives «Continue on error» en persistencia para ocultarlo.

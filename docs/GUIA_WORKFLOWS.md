# EventPass Emprende365 — paquete n8n

Diez workflows JSON preparados para importar en n8n 2.40.5, con persistencia académica en Google Sheets. No contienen credenciales, tokens ni contraseñas reales. Todos se entregan desactivados.

**Estado:** JSON y JavaScript validados localmente; 53 pruebas automatizadas de lógica con datos simulados. Las versiones de varios nodos y parámetros se contrastaron con el código oficial de n8n en la etiqueta `n8n@2.40.5`. No se ejecutó una importación real en esa versión, ni OAuth, Gmail, Telegram, el modelo IA o tu Docker. Debes configurar y realizar las pruebas de integración descritas aquí.

Este paquete cubre los workflows. Este documento describe el paquete de workflows original. Para el frontend incluido y la entrega completa, consulta el README de la raíz. GitHub y la publicación Vercel aún requieren tu configuración. No incluye datos obtenidos de tu instancia ni modifica tu WF01 actual.

## 1. Archivos incluidos

| JSON | Trigger | Archivo principal de Google Sheets |
|---|---|---|
| WF01_usuarios_crud.json | Webhook | EP01_Usuarios |
| WF02_auth_sesiones.json | Webhook | EP02_Sesiones |
| WF03_vinculacion_telegram.json | Webhook + Telegram Trigger | EP03_Telegram |
| WF04_eventos_crud.json | Form Trigger protegido con Basic Auth | EP04_Eventos |
| WF05_catalogo_publico.json | Webhook | EP05_Catalogo_Log |
| WF06_inscripciones_crud.json | Webhook | EP06_Inscripciones |
| WF07_reasignacion_lista_espera.json | Schedule Trigger, cada 2 minutos | EP07_Reasignaciones |
| WF08_recordatorios.json | Schedule Trigger, cada 15 minutos | EP08_Recordatorios |
| WF09_notificaciones.json | Execute Sub-workflow Trigger | EP09_Notificaciones |
| WF10_eventpass_assistant.json | Chat Trigger + modelo IA | EP10_Soporte |

`plantillas_sheets/` contiene 15 CSV con los encabezados de las pestañas, organizados en 10 carpetas/documentos. `datos_demo/` contiene seis eventos y una inscripción ficticia para representar un evento lleno. `docs/` contiene esquemas, contrato HTTP y pruebas manuales. `tests/validar.cjs` ejecuta pruebas sin red ni envíos.

## 2. Preparar Google Sheets

1. Crea **diez archivos independientes**, con los nombres de la tabla anterior.
2. En cada archivo, crea las pestañas indicadas por los CSV de su carpeta.
3. Importa cada CSV en su pestaña usando **Archivo → Importar → Subir**. No consolides las diez carpetas en un solo documento.
4. Conserva exactamente los encabezados y su orden; no agregues columnas antes de la primera columna.
5. Copia el ID de cada archivo. En `https://docs.google.com/spreadsheets/d/ID/edit`, utiliza solo `ID`, sin `/edit` ni `gid`.
6. La cuenta de tu credencial Google Sheets debe tener acceso de edición a todos esos archivos. No los publiques en la web.

| Documento | Pestañas |
|---|---|
| EP01_Usuarios | Usuarios, Auditoria_Usuarios |
| EP02_Sesiones | Sesiones |
| EP03_Telegram | Codigos_Vinculacion, Vinculaciones |
| EP04_Eventos | Eventos, Auditoria_Eventos |
| EP05_Catalogo_Log | Consultas_Catalogo |
| EP06_Inscripciones | Inscripciones, Auditoria_Inscripciones |
| EP07_Reasignaciones | Reasignaciones |
| EP08_Recordatorios | Recordatorios |
| EP09_Notificaciones | Notificaciones |
| EP10_Soporte | Conversaciones, Mensajes |

Las plantillas de encabezados están vacías. Si trabajas sobre archivos existentes, verifica primero los encabezados y respalda su contenido: no uses «Reemplazar hoja» sobre registros que deseas conservar.

## 3. Preparar Docker para los Code nodes

Los workflows utilizan el módulo incorporado `crypto`. No necesitas instalar bcrypt, paquetes npm ni community nodes.

En tu Docker Compose existente, para una instancia local con runners internos, agrega estas variables **al servicio n8n** sin reemplazar sus otras variables, volumen o clave de cifrado:

```yaml
environment:
  NODE_FUNCTION_ALLOW_BUILTIN: crypto
  N8N_CONCURRENCY_PRODUCTION_LIMIT: "1"
```

Si ya existe `NODE_FUNCTION_ALLOW_BUILTIN`, incorpora `crypto` a su lista en lugar de duplicar la variable. Ejecuta desde la carpeta de tu Compose:

```powershell
docker compose up -d
docker compose logs --tail 50 n8n
```

Usa el nombre real del servicio si no se llama `n8n`. No ejecutes `down -v`: borraría los volúmenes. Si usas Docker Desktop sin Compose, necesitas recrear el contenedor con las variables y **el mismo volumen y configuración existentes**; un simple reinicio no cambia sus variables.

Si utilizas **runners externos**, la autorización de `crypto` se configura en el runner, no basta con agregarla al contenedor principal. En el archivo de configuración actual del launcher, agrega `"NODE_FUNCTION_ALLOW_BUILTIN": "crypto"` al `env-overrides` del runner JavaScript y conserva el resto del archivo; móntalo en `/etc/n8n-task-runners.json`. Usa imágenes n8n/runners con versiones correspondientes. La documentación oficial está enlazada al final. No cambies el modo de runners sin revisar tu Compose existente.

El límite de concurrencia 1 es un requisito operativo de este paquete para que las lecturas y escrituras de Sheets no compitan por cupos. Se aplica a ejecuciones de producción; **no limita pruebas manuales, CLI ni subworkflows**. Prueba de una en una, no ejecutes WF09 simultáneamente por fuera de sus llamadas, no uses otras instancias/workers sobre los mismos Sheets y evita editar las filas manualmente mientras procesas inscripciones.

## 4. Importar en n8n

1. Exporta tu WF01 actual como respaldo. Este paquete crea una implementación independiente: no conserva automáticamente las modificaciones de tu workflow anterior.
2. Abre `http://localhost:5678`.
3. Crea un workflow nuevo.
4. En el menú del editor selecciona **Import from File** y elige `n8n/WF09_notificaciones.json`.
5. Guarda. Copia su ID real desde la URL: `http://localhost:5678/workflow/ID`.
6. Repite **en workflows nuevos** con los otros nueve JSON. No pegues los diez archivos en un solo canvas.
7. No publiques todavía los triggers ni los schedules.

### Configuración de cada workflow

1. Abre el nodo **Configuración**.
2. Dentro del objeto `config.sheets`, reemplaza los valores `REEMPLAZAR_ID_EP...` por los IDs reales. Puedes completar todo el objeto con los mismos diez IDs en todos los workflows; cada uno solo lee los documentos que necesita.
3. En WF04, WF06, WF07 y WF08 reemplaza `workflowNotificaciones` por el ID de WF09.
4. Abre **cada nodo Google Sheets** del workflow y selecciona tu credencial Google Sheets OAuth2.
5. Si el mapeo muestra un aviso de columnas, vuelve a seleccionar documento/pestaña o refresca el esquema. Conserva los campos y la columna de coincidencia ya definidos.
6. En WF03 selecciona tu credencial Telegram en el trigger y en `Responder al bot`.
7. En WF09 selecciona Gmail en `Enviar Gmail` y Telegram en `Enviar Telegram`.
8. En WF04 selecciona una credencial **Basic Auth** en el Form Trigger, con usuario y contraseña exclusivos del administrador. El formulario no debe quedar anónimo.
9. En WF10 selecciona tu credencial en `Modelo IA` y un modelo disponible en tu cuenta. Puedes reemplazar el subnodo por otro proveedor compatible.
10. Guarda los cambios.

**CORS:** en los Webhook y Chat Trigger, `Allowed Origins` comienza en `http://localhost:5173`. Cámbialo al origen real de tu frontend al publicar en Vercel. `config.frontendOrigin` es una referencia documental; no actualiza automáticamente el parámetro del trigger.

**WF01 anterior:** no actives dos workflows que usen la misma ruta `eventpass/usuarios`. Despublica el anterior al pasar al nuevo, después de respaldarlo y comparar las pruebas.

### Configuración opcional con Python

Si prefieres no repetir los diez IDs en cada editor, copia `docs/configuracion.example.json` a `configuracion.local.json`, completa los IDs y el ID real de WF09, y ejecuta:

```powershell
py configurar.py --config configuracion.local.json
```

Se generará `n8n_configurados/`. Importa los nueve restantes desde esa carpeta; para el WF09 que ya importaste, actualiza su nodo Configuración manualmente usando los mismos IDs. No importes una segunda copia de WF09 por accidente. El script no conecta credenciales ni publica workflows.

## 5. Comenzar por WF01 + WF02

Configura estos dos primero. Para pruebas manuales, usa **Listen for test event** y copia la Test URL; vuelve a poner el webhook en escucha antes de cada solicitud. Las Production URL funcionan cuando publicas el workflow.

Todos los endpoints HTTP usan POST y `Content-Type: application/json`.

```powershell
$usuariosUrl = "http://localhost:5678/webhook-test/eventpass/usuarios"
$authUrl = "http://localhost:5678/webhook-test/eventpass/auth"

function Enviar-EventPass($url, $datos) {
    $json = $datos | ConvertTo-Json -Depth 10
    Invoke-RestMethod -Uri $url -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($json))
}

# Primero deja WF01 escuchando.
$nuevo = Enviar-EventPass $usuariosUrl @{
    operacion = "crear"
    nombre = "Usuario de prueba"
    email = "TU_CORREO_DE_PRUEBA"
    password = "ESCOGE_UNA_CLAVE_DE_PRUEBA_DE_12_O_MAS_CARACTERES"
}

# Después deja WF02 escuchando.
$sesion = Enviar-EventPass $authUrl @{
    operacion = "login"
    email = "TU_CORREO_DE_PRUEBA"
    password = "LA_MISMA_CLAVE_DE_PRUEBA"
}
$token = $sesion.session_token

# Vuelve a dejar WF01 escuchando antes de cada llamada.
Enviar-EventPass $usuariosUrl @{
    operacion = "consultar"
    session_token = $token
}

Enviar-EventPass $usuariosUrl @{
    operacion = "actualizar"
    session_token = $token
    nombre = "Nombre actualizado"
}
```

No desactives ese usuario hasta terminar Telegram e inscripciones. Usa otro usuario para probar desactivación. `session_token` también puede enviarse como `Authorization: Bearer TOKEN`.

### Compatibilidad con usuarios ya existentes

WF01 nuevo genera `scryptSync(password, salt, 64)` con parámetros estándar de Node (`N=16384`, `r=8`, `p=1`), salt de 32 bytes representado en hexadecimal y hash de 64 bytes en hexadecimal. WF02 verifica exactamente ese formato con comparación de tiempo constante.

Si tu WF01 anterior utilizaba SHA-256, otro algoritmo, otro formato o parámetros diferentes, WF02 no podrá autenticar esos hashes. No edites hashes ni salts a mano. Crea una cuenta nueva de prueba o adapta explícitamente ambos workflows al algoritmo anterior antes de migrar. La documentación de entrega debe describir el algoritmo que finalmente uses.

## 6. Continuar con Telegram y eventos

Telegram necesita llegar a tu n8n por una **URL HTTPS pública**: `localhost` no es accesible desde Telegram ni desde usuarios externos del frontend en Vercel. Prepara un túnel HTTPS estable o un despliegue accesible, configura `WEBHOOK_URL` en Docker y recrea el servicio conservando sus datos. El paquete no contrata ni configura ese túnel.

Publica WF03 cuando su trigger tenga una URL pública y credenciales correctas. Un bot solo debe tener un Telegram Trigger activo que reciba sus actualizaciones.

1. Con sesión válida, llama WF03 con `{"operacion":"generar_codigo","session_token":"TOKEN"}`.
2. Abre un chat privado con el bot y pulsa Start o envía `/start`.
3. Envía `/vincular CODIGO` usando el código devuelto.
4. Comprueba `Codigos_Vinculacion.estado = USADO` y `Vinculaciones.estado = ACTIVA`.
5. Repite el comando: debe rechazar la reutilización.

Configura WF04 y WF05. WF04 administra desde un formulario protegido; no hay endpoint HTTP público para administración.

Para datos iniciales, importa `datos_demo/Eventos.csv` como filas en la pestaña Eventos y `datos_demo/Inscripciones.csv` en Inscripciones, respetando los encabezados. Contiene tres categorías y seis eventos: disponible, lleno, próximo, cancelado y cerrado. Las fechas se generaron al crear este paquete; **actualiza las fechas al momento de probar**. La inscripción demo usa un identificador ficticio para ocupar un cupo; no genera notificaciones ni habilita login de ese participante. Para la entrega con integridad referencial completa, reemplázala por una inscripción real creada con WF01–WF06 y una cuenta Telegram de prueba.

En WF05 los cancelados y cerrados se muestran como informativos y no admiten inscripciones; BORRADOR nunca se publica. El docente puede preferir ocultar cancelados: modifica entonces el filtro documentando esa decisión.

## 7. Notificaciones, inscripciones y automatizaciones

Configura WF09 antes de WF06. WF09 se invoca como subworkflow y acepta todos los datos de entrada; no tiene webhook público. WF04, WF06, WF07 y WF08 lo llaman después de persistir sus cambios.

Después prueba WF06 con sesión y Telegram vinculados. Cuando funciona, publica WF07 y WF08. La cancelación libera cupo; **WF07 lo reasigna en su siguiente ejecución**, no dentro de WF06. Una cola existente tiene prioridad sobre nuevas solicitudes aunque haya un cupo momentáneamente libre.

WF07 ordena por `fecha_inscripcion ASC`, con ID como desempate. Omite usuarios inactivos o sin Telegram activo y promueve solo candidatos elegibles. WF08 busca eventos futuros dentro de las próximas 24 horas y confirma que la inscripción esté CONFIRMADA. Los resultados de ambos canales deben quedar ENVIADO para que el recordatorio termine ENVIADO.

### Idempotencia y recuperación

- Email: normalización y control de duplicado, también para usuarios inactivos.
- Inscripción: no hay dos inscripciones activas del mismo usuario y evento; reintentar devuelve la existente.
- Telegram: código temporal de un solo uso; generar uno nuevo cancela los pendientes anteriores.
- Recordatorio: clave `usuario_id|evento_id|ANTES_24H`.
- Notificación: clave estable; un canal ENVIADO no vuelve a enviarse al reintentar. Un canal ERROR puede reintentarse sin repetir el canal ya enviado.
- PENDIENTE dejado por una ejecución interrumpida se considera **ambiguo**: no se reenvía automáticamente. Consulta Gmail/Telegram y concilia el registro antes de cambiarlo a ERROR para reintentar.

Sheets y proveedores de mensajes no participan en una transacción común. No se garantiza «exactamente una vez» ante una caída después del envío y antes de registrar ENVIADO, ni rollback entre varias pestañas. Un fallo de escritura detiene el workflow; revisa y concilia los registros antes de reejecutar. Si una inscripción se guarda pero la auditoría/notificación falla, repetir su creación devolverá la existente y no repetirá la notificación: después de comprobar lo ocurrido, invoca WF09 con la clave de esa inscripción desde una prueba interna controlada. WF07 no recupera por sí solo promociones persistidas cuya bitácora falló; usa Inscripciones y Reasignaciones para conciliarlas. No reinicies masivamente ejecuciones que hayan escrito datos.

## 8. Asistente

WF10 solo consulta Eventos y escribe Conversaciones/Mensajes. No tiene herramientas de escritura sobre usuarios, eventos o inscripciones. Usa un prompt informativo y registra los mensajes USER y ASSISTANT bajo un `conversation_id` derivado de la sesión de chat.

Esta versión trata al interlocutor como visitante: `usuario_id` queda vacío y `visitor_id` identifica la conversación. No confía en un usuario_id enviado por el navegador y no revela estados personales de inscripción; indica consultar Mis inscripciones. El mismo `sessionId` reconstruye el historial, con los últimos diez mensajes enviados al modelo. Mantén un ID aleatorio diferente por conversación y no ingreses contraseñas, tokens ni datos sensibles. Una conversación completa se reconstruye filtrando `Mensajes` por `conversation_id`.

El frontend incluido usa la URL de Chat Trigger y presenta un asistente integrado. Configura VITE_EVENTPASS_CHAT_URL.

## 9. Validaciones

Pruebas locales sin n8n:

```powershell
node tests/validar.cjs
```

Pruebas reales pendientes: sigue `docs/PRUEBAS_MANUALES.md`. La configuración inicial evita guardar automáticamente datos completos de ejecuciones (incluyen contraseñas y tokens en las entradas). Para diagnosticar en el editor puedes activar guardado de forma temporal usando cuentas de prueba; vuelve a desactivarlo y no compartas exportaciones con datos fijados/pinData.

Este paquete es una base académica. No incluye protección de fuerza bruta/rate limiting, paginación o base de datos transaccional. Antes de exposición pública, incorpora controles en el proxy y usa HTTPS. CORS controla navegadores, no sustituye la autenticación. Los tokens de sesión tienen ocho horas de vigencia y se guardan en EP02_Sesiones, según el esquema solicitado; restringe ese archivo.

## 10. Entrega del proyecto

Después de configurar y probar, exporta los diez workflows **directamente desde tu instancia n8n** y conserva los nombres exigidos. Revisa que no haya credenciales incrustadas, entradas de prueba fijadas ni passwords/tokens reales.

El repositorio final debe incluir frontend, `n8n/`, `docs/`, `.env.example` y README con los 20 puntos del enunciado. El `.env.example` de este paquete es una propuesta para el frontend pendiente. No subas `.env` real. Añade el nombre del estudiante, URL GitHub y URL Vercel únicamente cuando existan; no están completados aquí.

## Referencias oficiales consultadas

- Código de n8n 2.40.5: https://github.com/n8n-io/n8n/tree/n8n%402.40.5
- Execute Sub-workflow: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/
- Módulos de Code: https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/configuration-examples/enable-modules-in-code-node
- Runners: https://docs.n8n.io/deploy/host-n8n/configure-n8n/set-up-task-runners
- Concurrencia: https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/control-concurrency

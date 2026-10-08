# WF05 — Catálogo público de Emprende365

## Qué hace
Recibe POST en eventpass/catalogo. Operaciones listado, detalle y filtro. Lee eventos e inscripciones, calcula cupos y guarda una consulta en EP05_Catalogo_Log. No crea eventos ni inscripciones. No requiere token de WF02, Telegram ni Basic Auth.
Se conservan eventos PUBLICADO, CERRADO y CANCELADO como en el original; BORRADOR queda oculto. Solo se muestran eventos de EMPRENDIMIENTO. Eventos cerrados, cancelados y pasados no aceptan inscripciones. Un futuro PUBLICADO con cupos cero conserva acepta_inscripciones=true para que WF06 pueda gestionar lista de espera. No garantiza plaza: WF06 debe volver a validar los cupos al inscribir.

## Cambios
- Eliminado require('crypto'); nodo Crypto Generar ID consulta genera consulta_uuid.
- Execute Once y Always Output Data en Leer Eventos y Leer Inscripciones.
- Categoría limitada a EMPRENDIMIENTO, filtro sin distinguir mayúsculas y tolerando espacios laterales.
- Salida limitada a columnas de Eventos, sin row_number ni columnas adicionales.
- Validación de fechas, horas y capacidad presentes en Sheets.
- IDs de los tres archivos y referencia Google Sheets account conservados.
- La configuración original y su frontendOrigin se conservan; Allowed Origins permanece http://localhost:5173.

## 1. VS Code y Windows
Descomprime el paquete. Abre la carpeta raíz del proyecto en VS Code. Copia WF05_corregido.json a workflows/WF05 (crea las carpetas si faltan). Copia el contenido de tests de este paquete a tests del proyecto. Conserva esta guía en docs/WF05. No introduzcas tokens o contraseñas en los JSON de prueba.

## 2. n8n: importa
Crea workflow NUEVO Y VACÍO, menú ⋯ > Import from File > WF05_corregido.json. Guarda. No pegues los nodos encima de otros; todos los nombres deben quedar exactos, sin sufijo 1. Solo una copia debe publicarse en eventpass/catalogo.

## 3. Sheets y credenciales
Abre los tres nodos Google Sheets y selecciona tu credencial Google Sheets account, la que funciona en WF04.
Leer Eventos: EP04_Eventos / Eventos.
Leer Inscripciones: EP06_Inscripciones / Inscripciones.
Guardar Consultas_Catalogo: EP05_Catalogo_Log / Consultas_Catalogo.
Los archivos ya están asignados mediante IDs del JSON adjunto. Verifica que sean los archivos reales de tu proyecto. Si cambias un archivo, actualiza tanto el nodo correspondiente como su ID en Configuración, ya que los nodos de este JSON usan selecciones fijas.
En Guardar Consultas_Catalogo: Append or Update Row, matchingColumn consulta_id, formato RAW. Conserva los mapeos. Execute Once solo en lecturas, no en Guardar.

## 4. Revisa la hoja de consultas
En EP05_Catalogo_Log crea la pestaña Consultas_Catalogo si no existe. Primera fila A-H, cada nombre en una celda:
```
consulta_id	fecha	tipo	evento_id	categoria	resultado_count	visitor_id	status_http
```
Puedes copiar la línea tabulada y pegar en A1. Si existen datos, revisa encabezados sin sobrescribir filas.

## 5. Evento de prueba
Necesitas un evento creado mediante WF04, categoría EMPRENDIMIENTO, estado PUBLICADO y fecha futura. Ejemplo: fecha 2026-11-20, hora 18:00, capacidad 25. Si la fecha ya pasó, utiliza una nueva futura. No inventes evento_id: copia el real desde Eventos. Si solo tienes BORRADOR, publica el estado por UPDATE en WF04. No hace falta crear inscripciones para la primera prueba. Con capacidad 25 y cero CONFIRMADA se esperan 25 cupos.

## 6. Revisa Webhook y respuesta
Webhook: HTTP Method POST, Path eventpass/catalogo, Authentication None, Respond Using Respond to Webhook Node. Ya están configurados. Responder JSON usa response y status de Reglas de negocio.
No cambies CORS para las pruebas de PowerShell. CORS es para el navegador; cuando exista un frontend publicado, configura Allowed Origins con su origen exacto. frontendOrigin en Configuración no actualiza automáticamente el Webhook.

## 7. VS Code: abre PowerShell
Terminal > New Terminal > PowerShell. Desde la raíz del proyecto, ejecuta:
```powershell
Test-Path ".\tests\wf05-listado.json"
```
Debe ser True. Define la dirección de prueba:
```powershell
$urlCatalogoPrueba = "http://localhost:5678/webhook-test/eventpass/catalogo"
```
Si el nodo muestra otra Test URL, utiliza esa URL en la variable. Mantén la terminal abierta. Antes de cada solicitud, pulsa Listen for test event en Webhook de WF05.

## 8. Listado
En n8n: Webhook > Listen for test event. En PowerShell:
```powershell
curl.exe -i --max-time 60 -X POST "$urlCatalogoPrueba" -H "Content-Type: application/json" --data-binary "@tests/wf05-listado.json"
```
Esperado HTTP 200, ok:true, eventos y total. Si no hay eventos visibles devuelve eventos:[] y total:0; eso es una consulta válida. En Sheets debe aparecer una fila en Consultas_Catalogo: consulta_id CON_..., tipo LISTADO, resultado_count igual a total, visitor_id prueba-vscode-wf05, status_http 200.
Para guardar la respuesta como variable sin copiar datos, vuelve a iniciar la escucha y ejecuta:
```powershell
$respuestaCatalogo = Invoke-RestMethod -Uri $urlCatalogoPrueba -Method Post -ContentType "application/json" -Body (Get-Content ".\tests\wf05-listado.json" -Raw)
$respuestaCatalogo | ConvertTo-Json -Depth 8
```
Es una segunda consulta y crea una segunda fila de log, correctamente. La lectura no modifica Eventos ni Inscripciones.

## 9. Detalle
Abre tests/wf05-detalle.json en VS Code. Reemplaza REEMPLAZAR_POR_EVENTO_ID_REAL por el ID del evento visible que copiaste de Sheets. Guarda Ctrl+S. En n8n inicia escucha. En PowerShell:
```powershell
curl.exe -i --max-time 60 -X POST "$urlCatalogoPrueba" -H "Content-Type: application/json" --data-binary "@tests/wf05-detalle.json"
```
Esperado HTTP 200, ok:true, evento como objeto único (no eventos como lista). Comprueba evento_id, capacidad, cupos_disponibles y acepta_inscripciones. Log tipo DETALLE y resultado_count 1.

## 10. Filtro
Nueva escucha. En PowerShell:
```powershell
curl.exe -i --max-time 60 -X POST "$urlCatalogoPrueba" -H "Content-Type: application/json" --data-binary "@tests/wf05-filtro.json"
```
Esperado HTTP 200, solo emprendimiento y log FILTRO. Como el proyecto solo incluye esa categoría, puede devolver la misma lista que listado. Si pruebas categoria CULTURA, espera lista vacía, no eventos de cultura.

## 11. Pruebas de error
Nueva escucha antes de cada llamada:
```powershell
curl.exe -i --max-time 60 -X POST "$urlCatalogoPrueba" -H "Content-Type: application/json" --data-binary "@tests/wf05-no-existe.json"
```
Esperado HTTP 404, ok:false, mensaje Evento no encontrado o no publicable. Se registra status_http 404, resultado_count 0. Este 404 es de negocio si hay respuesta JSON y ejecución completa, distinto de webhook no registrado.
Nueva escucha:
```powershell
curl.exe -i --max-time 60 -X POST "$urlCatalogoPrueba" -H "Content-Type: application/json" --data-binary "@tests/wf05-operacion-invalida.json"
```
Esperado HTTP 400, ok:false, operaciones permitidas y log 400. No hay nodo rojo: es un rechazo controlado.

## 12. Qué hacer si falla
- 404 webhook no registrado: confirma URL y nueva escucha, no cambies evento_id por ese error.
- 404 Evento no encontrado o no publicable: revisa ID, categoría y estado, BORRADOR no se muestra.
- Require crypto o nombre no encontrado: usa la copia corregida y conserva nombres de nodos.
- Respuesta vacía: comprueba que Guardar Consultas_Catalogo y Responder JSON se ejecuten; Always Output Data en lecturas.
- Google Sheets rojo: revisa permisos de la credencial, archivo, pestaña y encabezados.
- 500 con mensaje sobre fechas/capacidad: corrige los valores en Eventos por WF04; fechas AAAA-MM-DD y hora HH:mm en texto sin formato.
- Cupos incorrectos: revisa evento_id y estado CONFIRMADA en Inscripciones. LISTA_ESPERA y CANCELADA no restan cupos.
- Un error al escribir log puede impedir responder al catálogo; esta versión registra consultas antes de responder. No se ha añadido una cola independiente.

## 13. Publicación
Solo después de verificar listado, detalle, filtro, 404 y 400 con sus logs: guarda y Publish/Activate. Usa Production URL del Webhook. Ejemplo local http://localhost:5678/webhook/eventpass/catalogo; público utiliza el dominio HTTPS actual de ngrok y ruta /webhook/eventpass/catalogo. Copia la URL exacta del nodo.
En PowerShell cambia la variable a Production URL y repite listado. No hace falta Listen for test event. Revisa Executions para ver esa ejecución. Mantén PC, n8n y túnel encendidos; si cambia ngrok, revisa URLs públicas y configuración de WEBHOOK_URL. Un despliegue estable requiere alojamiento y dominio persistentes.
Exporta la copia configurada desde n8n y guarda workflows/WF05/WF05_catalogo_publico_configurado.json. No publiques simultáneamente otra copia con método POST y mismo path.

## 14. Paso siguiente
WF06: inscripciones y lista de espera. Antes confirma un evento futuro PUBLICADO visible, cupos correctos y consulta registrada. Exporta y comparte el JSON actual de WF06 para revisar sus operaciones y dependencias. WF05 no demuestra todavía control de concurrencia ni reserva de cupos: eso corresponde a la inscripción.

## Verificación local
52 comprobaciones con datos simulados. No se accedió a tu cuenta Google ni se ejecutó tu n8n. El estado real debe comprobarse siguiendo los pasos anteriores. Los cupos representan las filas CONFIRMADA leídas en esa ejecución, no una reserva.

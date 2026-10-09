# Guía del examen — paso a paso

No avances al bloque siguiente si aparece error. En cada prueba guarda la respuesta y verifica las filas afectadas. No cambies Docker para seguir esta guía.

## 1. Preparar los archivos — Explorador de Windows
1. Descarga y extrae el ZIP en una carpeta separada.
2. Haz una copia de seguridad de tu carpeta eventpass-emprende360.
3. Copia frontend/app.js, frontend/api.js y frontend/utils.js sobre los archivos correspondientes de tu proyecto. Copia scripts/config.mjs y scripts/compatibilidad-asistio.mjs a scripts/.
4. Agrega los documentos, plantillas y tests/wf11.test.cjs. Conserva tus archivos de login y configuración local.

## 2. Crear la persistencia — Google Sheets
1. Crea un archivo NUEVO llamado EP11_Checkin.
2. Renombra la pestaña inferior a Checkins, respetando mayúsculas.
3. Selecciona A1 y pega esta línea (columnas separadas por tabulaciones):

```
checkin_id	inscripcion_id	evento_id	usuario_id	fecha_checkin	resultado	detalle
```

4. Deben ocupar A1:G1; no todo dentro de A1. También puedes importar plantillas/Checkins.csv.
5. Copia el ID que aparece entre /d/ y /edit en la URL. No es la URL completa ni el número gid.
6. Abre EP06_Inscripciones y comprueba que su pestaña Inscripciones tiene inscripcion_id, estado y fecha_actualizacion. Conserva las demás columnas.

## 3. Preparar notificaciones — n8n
El WF09 del RAR no está listo. Si ya tienes uno funcionando con ambos canales, conserva ese y usa su ID. En caso contrario:
1. Crea un workflow vacío e importa n8n/WF09_notificaciones.json desde el menú de importar archivo.
2. Abre Configuración. Cambia exclusivamente los IDs EP01_Usuarios, EP03_Telegram y EP09_Notificaciones por los de tus tres archivos reales. Los otros IDs de su configuración común no son consultados en WF09.
3. En EP09_Notificaciones debe existir la pestaña Notificaciones con los encabezados de plantillas/Notificaciones.csv.
4. Selecciona tu credencial Google Sheets en Leer Usuarios, Leer Vinculaciones, Leer Notificaciones, Guardar Notificaciones y Resultado Guardar Notificaciones.
5. En Enviar Gmail selecciona la credencial Gmail autorizada para enviar correos.
6. En Enviar Telegram selecciona la credencial de tu bot que ya funciona.
7. Guarda. Copia el ID del workflow desde la URL del editor: es el identificador después de /workflow/. No copies la URL completa ni el nombre visible.
8. Este subworkflow recibe datos del padre. No necesita un Webhook ni que Telegram Trigger esté escuchando para enviar mensajes.

## 4. Importar WF11 — n8n
1. Crea otro workflow vacío. Importa n8n/WF11_checkin_digital.json.
2. Abre Configuración y sustituye los cinco REEMPLAZAR_ID_... por los IDs de EP01, EP02, EP04, EP06 y EP11.
3. Cambia workflowNotificaciones de SELECCIONAR_ID_WF09 al ID copiado en el bloque anterior. Conserva las comillas.
4. En los siete nodos Google Sheets selecciona tu credencial: Leer Usuarios, Leer Sesiones, Leer Eventos, Leer Inscripciones, Leer Checkins, Marcar ASISTIO y Registrar intento.
5. Verifica Marcar ASISTIO: operación Update Row; columna de coincidencia inscripcion_id; solo escribe inscripcion_id, estado y fecha_actualizacion. No debe actualizar por evento_id ni por usuario_id.
6. Verifica Notificar WF09: workflow por ID, tomado de Configuración, esperar finalización activado.
7. En Webhook: POST, ruta eventpass/checkin, respuesta mediante Respond to Webhook. Allowed Origins local: http://localhost:5173. Al publicar, usa el origen exacto de Vercel que vaya a hacer la petición.
8. Guarda; todavía no envíes la prueba.

## 5. Compatibilidad ASISTIO — n8n y VS Code
1. Exporta las versiones que realmente usas de WF05, WF06 y WF07 desde n8n a la carpeta n8n/ de tu proyecto. Usa los nombres canónicos del enunciado.
2. En VS Code abre Terminal → Nueva terminal, PowerShell, en la raíz del proyecto.
3. Ejecuta:
```
node scripts/compatibilidad-asistio.mjs
```
4. Se crean copias en n8n_compatibles_asistio/. No se sobrescriben los originales. El script reconoce patrones de las versiones suministradas; si informa sin patrón reconocido, requiere revisión manual, no asumas que quedó aplicado.
5. Revisa los cambios: ocupación suma CONFIRMADA y ASISTIO; WF06 incluye ASISTIO solo en detección de duplicados. No agregues ASISTIO al permiso de cancelar/actualizar.
6. Importa los ajustes en la versión correspondiente y conserva una sola versión publicada por endpoint. Reexporta con el nombre obligatorio. No actives dos WF05 para la misma ruta.
7. En WF10 agrega a sus instrucciones informativas: «ASISTIO significa que el ingreso se registró. No cambies estados ni registres check-in; orienta al usuario a la pantalla Check-in». El asistente sigue siendo solo lectura.

## 6. Preparar datos reales — Google Sheets
Necesitas una inscripción CONFIRMADA de tu usuario autenticado, una inscripción CANCELADA o LISTA_ESPERA del mismo usuario y un segundo evento real con ID diferente. No inventes IDs para el caso de evento incorrecto: ese segundo evento debe existir.

Abre EP06 → Inscripciones. Anota inscripcion_id y evento_id de la fila CONFIRMADA. Si no existe ninguna, completa primero crear inscripción en WF06: el examen depende de ese dato. No uses inscripciones de otra persona. El usuario debe tener correo accesible y Telegram ACTIVA en EP03.

## 7. Obtener sesión — n8n y PowerShell
1. Abre WF02 en n8n, nodo Webhook, copia Test URL.
2. En VS Code, misma terminal durante todos los pasos, ejecuta esta línea reemplazando el texto dentro de las comillas:
```
$urlLogin = "PEGA_TEST_URL_WF02"
```
3. Comprueba el archivo:
```
Test-Path ".\tests\wf02-login.json"
```
Debe mostrar True. El archivo debe contener los datos reales de tu usuario de prueba.
4. En n8n pulsa Listen for test event en WF02.
5. En PowerShell ejecuta:
```
$login = Invoke-RestMethod -Uri $urlLogin -Method Post -ContentType "application/json" -Body (Get-Content ".\tests\wf02-login.json" -Raw)
```
6. Espera a PS...>. Ejecuta por separado:
```
$login.ok
```
Debe mostrar True. Después:
```
$cabeceras = @{ Authorization = "Bearer $($login.session_token)" }
```
No compartas el token ni pegues la contraseña en capturas.

## 8. Preparar petición — PowerShell
1. Copia Test URL del Webhook WF11.
2. En terminal ejecuta cada asignación reemplazando el contenido entre comillas:
```
$urlCheckin = "PEGA_TEST_URL_WF11"
$inscripcionPrueba = "PEGA_ID_INSCRIPCION_CONFIRMADA"
$eventoPrueba = "PEGA_ID_EVENTO_DE_ESTA_INSCRIPCION"
```
3. Ejecuta:
```
$cuerpoCheckin = @{ inscripcion_id = $inscripcionPrueba; evento_id = $eventoPrueba } | ConvertTo-Json
```
4. Pega esta función COMPLETA una vez. Permite mostrar también los rechazos HTTP en Windows PowerShell:
```
function Enviar-Checkin {
    param([string]$Cuerpo)
    try {
        $resultado = Invoke-RestMethod -Uri $urlCheckin -Method Post -Headers $cabeceras -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($Cuerpo))
        $resultado | ConvertTo-Json -Depth 8
    } catch {
        if ($_.ErrorDetails.Message) { $_.ErrorDetails.Message }
        else { $_.Exception.Message }
    }
}
```

## 9. Caso válido — n8n → PowerShell → Sheets
1. n8n: WF11 → Webhook → Listen for test event.
2. PowerShell:
```
Enviar-Checkin -Cuerpo $cuerpoCheckin
```
3. Espera la respuesta: resultado EXITOSO, estado ASISTIO, y notificaciones con Gmail y Telegram ENVIADO.
4. Sheets: Checkins contiene una fila EXITOSO; la inscripción indicada cambió a ASISTIO; las otras filas no cambiaron. La hora es ISO UTC; en Colombia equivale a UTC menos cinco horas.
5. Confirma que llegó un correo y un mensaje Telegram al usuario.
6. Si aviso_pendiente es true, no marques el examen completo. Revisa WF09 y EP09; no vuelvas a crear la asistencia.

## 10. Caso duplicado
1. No cambies IDs ni el estado de la inscripción.
2. n8n: vuelve a escuchar WF11.
3. PowerShell: ejecuta otra vez Enviar-Checkin -Cuerpo $cuerpoCheckin.
4. Espera DUPLICADO. Checkins debe tener una fila adicional DUPLICADO y exactamente un EXITOSO para esa inscripción. No debe haber otra modificación a la inscripción ni nuevos avisos.

## 11. Caso rechazado y evento incorrecto
Rechazado: prepara el cuerpo con la otra inscripción CANCELADA/LISTA_ESPERA y su evento real; vuelve a escuchar WF11; envía. Debe responder RECHAZADO, registrar intento y conservar el estado.
```
$cuerpoRechazado = @{ inscripcion_id = "PEGA_ID_CANCELADA_O_ESPERA"; evento_id = "PEGA_SU_EVENTO" } | ConvertTo-Json
Enviar-Checkin -Cuerpo $cuerpoRechazado
```
Evento incorrecto: usa una inscripción propia y el ID del segundo evento EXISTENTE. Vuelve a escuchar antes de enviar:
```
$cuerpoIncorrecto = @{ inscripcion_id = $inscripcionPrueba; evento_id = "PEGA_ID_OTRO_EVENTO_EXISTENTE" } | ConvertTo-Json
Enviar-Checkin -Cuerpo $cuerpoIncorrecto
```
Debe indicar que pertenece a otro evento, incluso si la inscripción ya ASISTIO. No se modifica ninguna inscripción ni se envían avisos.

## 12. Frontend y cierre de entrega
1. En tu .env agrega VITE_CHECKIN_URL= seguido de la Production URL de WF11, sin comillas adicionales. Configura los otros endpoints que ya usas.
2. Publica WF11. Para producción no necesitas dejar la escucha de prueba abierta.
3. En terminal ejecuta npm run dev. Abre http://localhost:5173 e inicia sesión.
4. En Mis inscripciones pulsa Check-in o abre http://localhost:5173/#/checkin. Verás campos para inscripción/evento. El botón se deshabilita mientras responde.
5. Prueba con una inscripción CONFIRMADA distinta y repite para ver el mensaje duplicado. Una consulta hecha por PowerShell ya consumió el check-in de la primera.
6. Verifica que Mis inscripciones muestre Asistió y no permita cancelar esa fila. Verifica que catálogo y WF07 no interpreten ASISTIO como una plaza libre.
7. Agrega docs/SECCION_README.md al README, sin borrar su contenido. Añade VITE_CHECKIN_URL= a .env.example con valor vacío.
8. Vercel: usa tu proyecto existente y variables con n8n HTTPS público. El navegador desplegado no puede usar tu localhost. Configura CORS con la URL real; vuelve a desplegar tras cambiar variables.
9. Exporta WF11 DESDE N8N como n8n/WF11_checkin_digital.json. Exporta WF09 y cualquier workflow modificado. El JSON generado para importar no sustituye la exportación final requerida.
10. En VS Code revisa git status y git diff. Agrega solo los archivos pertinentes, nunca .env ni contraseñas de tests. Realiza commit y push dentro del plazo real del examen. No alteres fechas de commits.
11. Guarda enlaces a GitHub, commit y Vercel, y evidencias de cuatro casos, Sheets y ambos mensajes. Solo entonces se considera completada la integración en tu entorno.

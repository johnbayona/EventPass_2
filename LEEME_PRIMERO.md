# EventPass Emprende360: instalar las correcciones y probar el proyecto

Entrega: 14 de octubre de 2026 (UTC). Guía para Windows, Visual Studio Code, PowerShell y n8n existente en Docker.

## 1. Qué recibes y hasta dónde llega esta entrega

Este ZIP es un paquete de reemplazos, NO una copia completa del repositorio. La carpeta REEMPLAZAR contiene solamente archivos corregidos o nuevos. Pégala sobre tu proyecto siguiendo el punto 3. No borres el proyecto anterior.

Se conserva el frontend con su página /examen/, WF03, WF04, WF09, WF11, sus IDs y la configuración Docker. Los Google Sheets permanecen en Drive. El paquete no conecta con tus servicios ni cambia sus datos. Las contraseñas y tokens no forman parte del paquete.

Cambios incluidos:

| Archivo o grupo | Corrección |
|---|---|
| n8n/WF01 y WF02 | Las lecturas de Sheets se ejecutan una vez por ejecución del nodo. Se conserva autenticación y configuración existente. |
| n8n/WF05 | Recuperación desde la versión válida de la entrega anterior. Categorías múltiples y cupos que incluyen ASISTIO. IDs de documentos actualizados con la última exportación. |
| n8n/WF06, WF07 y WF08 | Lecturas únicas y generación de identificadores mediante nodo Crypto; se elimina require('crypto') de Code. |
| n8n/WF10 | Lecturas únicas; nodo Crypto para UUID y SHA256 de sesión. Mantiene el algoritmo de identificación de conversaciones. |
| configurar.py | Admite once documentos, distintas formas de escribir el objeto config y actualiza CORS. Genera copias inactivas sin sobrescribir originales. |
| scripts/configurar-local.mjs | Respalda .env y elimina seis overrides de webhook-test para usar las rutas estándar. Conserva chat y bot. |
| scripts/build.mjs y validar-config.mjs | Comprueban la configuración para build:production y Vercel. Rechazan URLs de prueba, localhost y HTTP en producción. |
| tests/validar.cjs | Actualizado para once workflows, salidas simuladas de Crypto y referencias a credenciales existentes. |
| tests/config-produccion.test.mjs | Verifica errores de configuración que antes pasaban inadvertidos. |
| tests/wf02-login.json | Sustituye credenciales reales por marcadores. Se recomienda probar login desde la web. |
| plantillas/Reasignaciones.csv | Encabezados correctos de EP07; NO contiene datos de usuarios. |
| docs/configuracion.detectada.json | IDs de documentos y WF09 obtenidos de tus archivos. No contiene credenciales. |

WF05 recuperado NO equivale a la última versión de tu n8n: el archivo recibido estaba vacío. Antes de sustituirlo, exporta el que está en tu instancia y guarda ese respaldo. Si contiene cambios posteriores que necesitas conservar, compara antes de usar la recuperación.

No se ha resuelto la exclusión mutua de check-in o asignación de cupos bajo solicitudes simultáneas. Sheets no proporciona una transacción entre estos documentos. La entrega sirve para continuar pruebas controladas; no certifica disponibilidad para tráfico público concurrente.

## 2. Respalda antes de empezar

1. Si está abierto npm run dev, entra en su terminal de VS Code y presiona Ctrl+C.
2. Abre el Explorador de archivos de Windows.
3. Localiza tu carpeta eventpass-emprende360 (puede tener un nombre parecido).
4. Copia la carpeta completa a otra ubicación. Ponle un nombre como eventpass-respaldo-antes-ajustes.
5. No crees el respaldo dentro del proyecto original. La copia preserva también .env y Git; no la publiques ni la compartas.
6. En n8n abre, uno por uno, WF01, WF02, WF05, WF06, WF07, WF08 y WF10. En el menú del workflow descarga/exporta su JSON. Guarda esos siete archivos fuera de la carpeta del proyecto.
7. Anota el ID actual de cada workflow: se ve en la dirección del navegador al abrirlo.
8. No exportes credenciales descifradas. No borres workflows ni documentos de Google.

Resultado esperado: tienes una copia del proyecto y siete exportaciones independientes del n8n actual.

## 3. Copia los archivos del paquete al proyecto

1. Descarga el ZIP y usa clic derecho → Extraer todo.
2. Abre la carpeta extraída y después REEMPLAZAR.
3. Dentro verás n8n, scripts, tests, docs, plantillas, configurar.py y package.json.
4. Selecciona TODOS los elementos que están DENTRO de REEMPLAZAR y cópialos con Ctrl+C.
5. Abre la raíz de tu proyecto original: debe ser la carpeta donde ya existe package.json.
6. Pega con Ctrl+V. Si Windows pregunta por archivos iguales, elige reemplazar esos archivos. Las carpetas se combinan; no elimines las carpetas antiguas antes de pegar.
7. No copies la carpeta REEMPLAZAR como una subcarpeta del proyecto: copia su contenido.
8. En VS Code abre Archivo → Abrir carpeta y selecciona esa raíz del proyecto.
9. Verifica que existen scripts/configurar-local.mjs y docs/GUIA_REEMPLAZO_Y_PRUEBAS.md.

No se entrega .env, .git, node_modules ni dist. Se conserva tu .env hasta el paso 6 de esta guía; dist se reconstruye. Copiar un JSON al disco NO actualiza automáticamente n8n.

## 4. Ejecuta las comprobaciones locales

En VS Code selecciona Terminal → Nueva terminal. Debe abrir PowerShell. Ejecuta cada comando por separado; espera a que termine antes del siguiente:

```powershell
Get-Location
Test-Path .\package.json
node --version
npm --version
```

Test-Path debe mostrar True. Si muestra False, estás en otra carpeta: vuelve a Archivo → Abrir carpeta y elige la que contiene package.json. Node debe ser 22 o superior, según el proyecto.

Después:

```powershell
npm ci
npm test
npm run test:workflows
npm run test:examen
npm run test:catalogo
npm run test:config
npm run build
```

Resultados verificados en la entrega: 13 pruebas de frontend, 53 de reglas/workflows, 14 de examen, 2 de catálogo y 9 de configuración. Total: 91. Build local correcto.

Estas pruebas simulan Sheets, salidas de Crypto y respuestas de servicios. No envían Gmail/Telegram y no prueban credenciales OAuth ni la importación real en n8n. Si un comando falla en tu equipo, copia el error completo y el comando que ejecutaste; no sigas a publicación.

## 5. Corrige EP07 en Google Sheets

1. Abre el documento EP07 de Drive.
2. Abre la pestaña Reasignaciones.
3. Haz clic derecho en la pestaña y selecciona Duplicar. Conserva la copia de respaldo.
4. Vuelve a la pestaña original Reasignaciones.
5. Comprueba que NO existen registros debajo de la fila 1. En la exportación recibida no había registros.
6. Si ahora hay registros, detén esta modificación: sus columnas deben migrarse antes de cambiar los títulos.
7. Si sigue vacía, selecciona A1 y pega esta fila completa, separada por tabulaciones:

```text
reasignacion_id	evento_id	inscripcion_id	usuario_id	fecha	orden_lista	estado_anterior	estado_nuevo	resultado_notificacion
```

8. Comprueba nueve títulos desde A1 hasta I1. Conserva exactamente el nombre Reasignaciones.
9. El CSV incluido contiene lo mismo. No lo importes como un documento nuevo: necesitamos conservar el ID del documento y el nombre de la pestaña.

## 6. Configura el frontend local

Mantén Docker y n8n como están. No ejecutes docker compose down ni cambies imágenes.

Si accedes a n8n con http://localhost:5678, ejecuta desde la raíz del proyecto:

```powershell
node scripts/configurar-local.mjs http://localhost:5678
```

Si tu n8n usa otro host o puerto, sustituye únicamente esa dirección por el ORIGEN real, por ejemplo https://tu-dominio-real. No añadas /webhook, /workflow ni el ID de un flujo.

El script respalda el .env existente como .env.backup-<fecha>, conserva las demás variables, establece la base y deja vacías las seis URLs específicas. El frontend construye las rutas siguientes:

| Acción | Ruta sobre la base de n8n |
|---|---|
| Usuarios | /webhook/eventpass/usuarios |
| Login | /webhook/eventpass/auth |
| Vinculación | /webhook/eventpass/telegram |
| Catálogo | /webhook/eventpass/catalogo |
| Inscripciones | /webhook/eventpass/inscripciones |
| Check-in | /webhook/eventpass/checkin |

Estas son rutas de PRODUCCIÓN del webhook aunque estés haciendo pruebas en tu computador. Debes publicar/activar los workflows para usarlas. No necesitan el botón Listen for test event. Si tus webhooks actuales usan rutas personalizadas, configura su Production URL exacta en la variable específica correspondiente; no asumas que estas rutas coinciden.

Abre .env en VS Code y revisa también:

- VITE_EVENTPASS_CHAT_URL: la Production URL completa del Chat Trigger de WF10. El script conserva tu valor previo, pero no inventa ni corrige un ID de chat.
- VITE_TELEGRAM_BOT_USERNAME: el nombre real del bot, sin @.
- VITE_FRONTEND_URL: http://localhost:5173 para esta etapa.

No pegues el token secreto del bot ni contraseñas en ninguna de estas variables: la configuración del frontend es pública.

## 7. Aplica los workflows en tu n8n existente

La opción más conservadora para WF01 y WF02 es ajustar solamente sus lecturas:

1. Abre WF01 en n8n.
2. Abre cada nodo Google Sheets cuyo nombre comienza por Leer.
3. En Settings/Configuración habilita Execute Once/Ejecutar una vez.
4. Guarda y publica la versión. Repite en WF02.
5. No cambies nodos de contraseña, sal, token o sus credenciales.

Los archivos JSON de WF01/WF02 entregados ya contienen ese ajuste. No necesitas sustituir todos sus nodos si realizaste esos pasos.

Para WF05, WF06, WF07, WF08 y WF10, aplica uno por uno los JSON entregados. No hagas pruebas desde el frontend durante la sustitución. Procedimiento conservando el workflow original y su ID:

1. Confirma que descargaste su respaldo en el punto 2.
2. Abre el workflow existente. Anota su URL y su ID.
3. Desactiva/despublica temporalmente ese workflow; espera a que terminen ejecuciones pendientes. Especialmente WF07/WF08, porque tienen horarios.
4. En VS Code abre el JSON correspondiente dentro de n8n. Pulsa Ctrl+A y Ctrl+C para copiar TODO el texto.
5. Regresa al canvas del MISMO workflow en n8n. Haz clic en un espacio vacío del canvas, selecciona sus nodos y elimínalos. Este es el reemplazo de nodos respaldados, no la eliminación del workflow.
6. En ese canvas pega el JSON con Ctrl+V. Si n8n no permite pegar en tu versión, deshaz la eliminación o restaura el respaldo; no guardes un canvas vacío. Comparte la captura de esa pantalla antes de intentar otro método.
7. Comprueba que aparecen nodos y conexiones, sin duplicados. El ID del workflow en el navegador debe seguir siendo el mismo.
8. Revisa el nodo Configuración: conserva tus IDs de Sheets y la referencia de WF09.
9. Abre los nodos Google Sheets: selecciona tu credencial Google si aparece sin seleccionar. Confirma Document y Sheet, sin crear documentos nuevos.
10. Para lecturas, abre Settings y confirma Execute Once. No actives esa opción indiscriminadamente en los nodos de escritura: ellos sí deben procesar cada fila preparada.
11. En los nodos Webhook revisa HTTP Method POST, Path y Allowed Origins. Para esta prueba permite http://localhost:5173. En WF10 revisa el origen permitido en Chat Trigger.
12. En cada nodo que llama a notificaciones verifica WF09 existente. Su ID recibido es ru4tq3hBGPpnL36S. Si cambió en tu instancia, utiliza el ID actual.
13. Guarda. Publica/activa cuando hayas terminado las comprobaciones de ese workflow.
14. No crees una segunda versión activa con el mismo webhook o el mismo horario.

Nodos nuevos que debes ver:

| Workflow | Nodos Crypto nuevos | Qué debes verificar |
|---|---|---|
| WF05 recuperado | Generar ID consulta (ya formaba parte de esa versión) | Genera consulta_uuid antes de Reglas de negocio. |
| WF06/WF07/WF08 | Generar ID operación | Generate, UUID, propiedad operacion_uuid. Va antes de Reglas de negocio. |
| WF10 | Generar ID operación y Hash sesión | UUID para operación y hash SHA256/HEX con propiedad session_digest antes de Preparar contexto. |

En WF10 conserva la credencial del modelo de IA. Crypto no necesita una credencial adicional ni habilitar require en Docker. La forma de los IDs nuevos en WF06–WF08 incluye UUID y contador; los IDs de registros existentes no cambian.

No reimportes WF03, WF04, WF09 o WF11 para aplicar este paquete: no se modificaron. WF11 mantiene una limitación de concurrencia descrita al final.

## 8. Comprueba catálogo y login desde la página

1. En VS Code ejecuta:

```powershell
npm run dev
```

2. Abre http://localhost:5173 en el navegador. Mantén abierta esa terminal.
3. Abre el catálogo. En n8n revisa Executions/Ejecuciones de WF05: debe aparecer una ejecución nueva y correcta.
4. Comprueba que se muestra el evento real de EP04. Recuperar WF05 no crea más eventos por sí solo.
5. Abre Iniciar sesión. Usa un correo de EP01 cuya contraseña original conozcas.
6. Si no recuerdas ninguna contraseña, crea una cuenta nueva de prueba desde la página con un correo tuyo que no esté registrado. No cambies password_hash ni password_salt en Sheets.
7. Revisa WF01 si creaste usuario y WF02 al iniciar sesión. EP02 debe registrar una sesión nueva, con vencimiento futuro. No prolongues una sesión antigua editando la fecha.
8. No uses tests/wf02-login.json sin completar: deliberadamente tiene marcadores. La prueba desde la interfaz evita guardar contraseñas reales en archivos seguidos por Git.
9. Si la página falla, abre F12 → Network/Red, repite una sola acción y anota URL, estado HTTP y respuesta. No compartas Authorization ni session_token.

## 9. Añade eventos reales para cumplir el catálogo

No se insertaron eventos automáticamente en tus Sheets. Las propuestas de datos_demo/propuestas son sugerencias que debes revisar. Para completar seis eventos, crea cinco adicionales si el actual sigue siendo válido.

1. Abre WF04, su Form Trigger y la Production URL del formulario administrativo.
2. Accede con la credencial administrativa existente.
3. Selecciona CREATE.
4. Completa nombre, categoría, descripción, fecha futura, hora, lugar, capacidad, organizador y los demás campos que solicite el formulario.
5. Usa un evento auténtico o un evento de demostración claramente identificado; no lo presentes como una programación confirmada si no lo es.
6. Como distribución temática para Emprende360 puedes usar dos de Emprendimiento, dos de Educación aplicada a negocios y dos de Networking empresarial.
7. Envía el formulario UNA vez. Verifica una fila nueva con evento_id único en EP04 y resultado correcto en WF04.
8. Repite para los demás. Si hay campos obligatorios o categorías restringidas en tu formulario actual, revisa ese nodo antes de alterar la hoja directamente.
9. Recarga el catálogo: los registros PUBLICADO deben verse y los filtros deben devolver la categoría correcta.

## 10. Prueba la extensión del examen, una acción cada vez

1. Inicia sesión con el usuario de prueba.
2. Vincula su Telegram usando el código y las instrucciones de la página. Utiliza el bot ya existente.
3. Inscríbelo en un evento futuro con cupo disponible. Revisa WF06 y la fila de EP06: estado CONFIRMADA.
4. Comprueba Gmail y Telegram. Revisa EP09: diferencia ENVIADO, ERROR y NO_APLICA; la ausencia de un aviso no significa necesariamente que la inscripción falló.
5. En el encabezado de la página entra a Examen (también disponible en /examen/).
6. Selecciona la inscripción confirmada y ejecuta check-in UNA vez.
7. Revisa WF11: EP06 debe quedar ASISTIO; EP11 debe añadir resultado EXITOSO; WF09 debe procesar el aviso.
8. Repite con la misma inscripción usando el mecanismo de reintento de la interfaz, si está disponible. Debe dar DUPLICADO sin un segundo éxito ni un segundo aviso. Si la interfaz ya no permite seleccionar ASISTIO, no inventes otro ID: esa prueba deberá enviarse con el mismo cuerpo y sesión mediante una petición controlada.
9. Prueba una inscripción CANCELADA o en LISTA_ESPERA con una cuenta de prueba y solicitud controlada: debe ser RECHAZADO, sin cambiarla a ASISTIO. No uses registros de asistentes reales para pruebas negativas.
10. Conserva capturas de la página, ejecución WF11 y fila EP11; oculta tokens y datos personales.

Para pruebas HTTP avanzadas puedes usar los JSON de tests de tu proyecto, pero debes sustituir IDs y sesión por los de TU prueba. No se entregan sesiones inventadas que parezcan válidas. Primero completa la prueba por interfaz; después se pueden preparar las solicitudes negativas con los IDs comprobados.

## 11. Preparar producción después de la prueba local

Esta etapa requiere tu dominio HTTPS real de n8n y la dirección definitiva del frontend. No se pueden completar esos valores con datos inventados.

1. Conserva n8n accesible en una dirección HTTPS estable. Publicar el frontend en Vercel no publica tu Docker local: si el PC se apaga, ese backend deja de responder.
2. En Vercel utiliza el proyecto existente. Build command: npm run build:production. Output directory: dist. El framework del proyecto es JavaScript estático/Other.
3. Configura VITE_N8N_BASE_URL con el origen público HTTPS de n8n; las seis URLs específicas pueden quedar vacías si usas las rutas estándar. Elimina overrides antiguos con webhook-test en Vercel también: modificar .env local no modifica el panel de Vercel.
4. Completa VITE_EVENTPASS_CHAT_URL con la Production URL pública de WF10 y VITE_TELEGRAM_BOT_USERNAME con el bot real.
5. En Allowed Origins de cada Webhook consumido por el frontend y en Chat Trigger agrega el origen exacto de la web publicada. Cambiar VITE_FRONTEND_URL no actualiza CORS en n8n.
6. Si necesitas generar todos los JSON con el origen definitivo, copia docs/configuracion.detectada.json como configuracion.local.json, edita frontendOrigin y ejecuta el configurador. En Windows, si Python está instalado:

```powershell
py configurar.py --config configuracion.local.json --output n8n_configurados_produccion
```

7. La salida debe ser una carpeta nueva o vacía. El configurador no toca tus workflows actuales, no guarda credenciales y no publica nada. No importes los once indiscriminadamente: aplica únicamente los ajustes necesarios conservando los IDs, especialmente WF09.
8. Con variables públicas definitivas en tu entorno, npm run build:production debe pasar. Si lo ejecutas con localhost o webhook-test, su rechazo es intencional.
9. Antes de subir a Git, revisa git status y los cambios de tests. No subas .env, respaldos, contraseñas, tokens ni exportaciones de datos de usuarios. Este paquete no ejecuta git add, commit o push.
10. Después del despliegue vuelve a probar catálogo, login, vinculación, inscripción y examen desde la URL publicada.

Documentación de referencia: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.crypto/ y https://docs.n8n.io/workflows/export-import/ .

## 12. Qué falta para darlo por terminado

- Comprobar importación/pegado de los nodos en tu versión exacta de n8n y credenciales Google, Telegram, Gmail y modelo de IA.
- Corregir EP07 en Drive y crear los eventos con datos aprobados.
- Probar solicitudes reales y capturar evidencia del examen; las 91 pruebas locales no sustituyen esa evidencia.
- Verificar permisos administrativos, persistencia del backend, dominio, OAuth y configuración pública.
- Resolver concurrencia de cupos/check-in y recuperación de errores entre escritura ASISTIO y registro EXITOSO antes de admitir tráfico público simultáneo. No se incluye un bloqueo ficticio basado en memoria o en una celda de Sheets.
- Completar solicitudes negativas controladas del examen y el recorrido de lista de espera con dos usuarios.

Si debes volver atrás: detén npm run dev; restaura los archivos locales desde el respaldo; restaura .env desde .env.backup-*; en cada workflow afectado pega su JSON de respaldo manteniendo el mismo workflow; verifica credenciales y vuelve a publicar. Restaurar archivos NO deshace correos enviados ni cambios ya escritos en Sheets: esas filas se revisan por sus IDs, sin borrado masivo.

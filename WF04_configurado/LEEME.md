# WF04 — Administración de eventos de emprendimiento

Esta copia se preparó a partir de WF04_eventos_crud.json. Conserva el formulario protegido, CREATE/READ/UPDATE/CANCEL/CLOSE, auditorías, cancelación de inscripciones y llamada a WF09. No requiere cambiar Docker. Se comprobó la lógica local; las conexiones de tu instalación deben probarse.

## 1. Organiza el proyecto en Windows y VS Code
Descomprime el ZIP. En la carpeta del proyecto crea workflows/WF04 y copia allí WF04_corregido.json, Configuracion_WF04.js y Reglas_de_negocio_WF04.js. Conserva LEEME.md y VERIFICACION.txt en docs/WF04. Los JSON en ejemplos_formulario son referencias para rellenar el formulario: no son archivos para enviar al webhook de WF02.

## 2. Prepara Google Sheets
Usa los archivos existentes si ya los creaste. No dupliques archivos con igual nombre. Crea pestañas o encabezados únicamente si no existen. No sustituyas filas de datos existentes. Cada encabezado ocupa una celda de la fila 1. Puedes pegar cada línea tabulada siguiente en A1 de la pestaña correspondiente. Conserva los nombres exactos.

Archivo EP04_Eventos, pestaña Eventos, columnas A–M:
```
evento_id	nombre	categoria	descripcion	fecha	hora	lugar	capacidad	imagen_url	organizador	estado	fecha_creacion	fecha_actualizacion
```
Archivo EP04_Eventos, pestaña Auditoria_Eventos, columnas A–F:
```
auditoria_id	evento_id	accion	fecha	resultado	detalle
```
Archivo EP06_Inscripciones, pestaña Inscripciones, columnas A–J:
```
inscripcion_id	usuario_id	evento_id	estado	fecha_inscripcion	fecha_actualizacion	nombre_acreditacion	observaciones	origen	orden_espera
```
Archivo EP06_Inscripciones, pestaña Auditoria_Inscripciones, columnas A–J:
```
auditoria_id	inscripcion_id	usuario_id	evento_id	accion	estado_anterior	estado_nuevo	fecha	resultado	detalle
```
Aunque WF06 no esté listo, WF04 lee Inscripciones. Por eso ese archivo y la pestaña deben existir. Pueden estar vacíos, solo con encabezados. Formatea las columnas fecha y hora de Eventos como texto sin formato para conservar AAAA-MM-DD y HH:mm.

## 3. Copia los dos IDs
Abre cada archivo en Sheets. En la dirección https://docs.google.com/spreadsheets/d/ID_DEL_ARCHIVO/edit, copia únicamente lo que queda entre /d/ y /edit. No copies la URL completa ni gid. Necesitas un ID para EP04_Eventos y otro para EP06_Inscripciones.

## 4. Importa WF04
En n8n crea un workflow NUEVO Y VACÍO. Menú ⋯ > Import from File. Selecciona WF04_corregido.json. No pegues los nodos encima de otros: los nombres deben conservarse sin números añadidos. Guarda.

## 5. Edita Configuración
Abre Configuración > Parameters > JavaScript. Sustituye REEMPLAZAR_ID_EP04_Eventos y REEMPLAZAR_ID_EP06_Inscripciones por los IDs correspondientes, conservando comillas. Deja eventTimezoneOffset en -05:00. Deja workflowNotificaciones pendiente hasta configurar WF09.
No escribas contraseñas, token del bot ni session_token en Configuración.

## 6. Selecciona Google Sheets OAuth2
Abre cada uno de estos seis nodos y selecciona la credencial que ya funciona en WF03:
- Leer Eventos: EP04_Eventos / Eventos.
- Leer Inscripciones: EP06_Inscripciones / Inscripciones.
- Guardar Eventos: EP04_Eventos / Eventos.
- Guardar Inscripciones: EP06_Inscripciones / Inscripciones.
- Guardar Auditoria_Eventos: EP04_Eventos / Auditoria_Eventos.
- Guardar Auditoria_Inscripciones: EP06_Inscripciones / Auditoria_Inscripciones.
Los IDs usan expresiones de Configuración. Conserva las expresiones y los mapeos importados. Si el menú pide columnas, completa primero los IDs y la credencial, y actualiza el esquema.
En Leer Eventos y Leer Inscripciones ya están activados Execute Once y Always Output Data. No actives Execute Once en los nodos Guardar.
Clave de coincidencia: evento_id para Eventos, inscripcion_id para Inscripciones y auditoria_id para las dos auditorías. La operación es Append or Update Row.

## 7. Protege el formulario
Abre Formulario administrador. Authentication: Basic Auth. En Credential crea una credencial exclusiva del administrador, por ejemplo con nombre EP_Admin_Eventos. Usuario sugerido: eventpass_admin. Elige tu propia contraseña. Guarda la credencial y selecciónala.
No es el email/password de WF01 ni el token de WF02. Esta credencial protege el formulario de administración; no la compartas ni la guardes en el frontend.
Conserva responseMode importado. El trigger versión 2.1 utiliza Respond to Webhook con formSubmittedText. El nodo Responder JSON ya lo configura. No cambies versiones de nodos durante esta primera prueba.

## 8. Prueba READ vacío
Guarda. Abre Formulario administrador y pulsa Listen for test event o Execute workflow desde este trigger. Abre su Test URL en el navegador. Si pide usuario y contraseña, introduce los de EP_Admin_Eventos. Selecciona READ, deja evento_id y el resto vacíos y envía.
Esperado: ok:true y eventos:[] si la hoja está vacía, o lista de los eventos ya existentes. No debe guardar nuevas filas. Abre Reglas de negocio > Output > JSON para ver status:200 y response. Si hay error, identifica el primer nodo rojo.
Cada prueba de formulario requiere volver a iniciar la escucha y abrir la Test URL. Si quedó una página antigua, abre una nueva pestaña con la URL de prueba después de iniciar la escucha.

## 9. Crea un evento de prueba
Vuelve a escuchar desde Formulario administrador y abre Test URL. Rellena:
operacion: CREATE
 evento_id: vacío
nombre: Taller: crea tu primera tienda virtual
categoria: EMPRENDIMIENTO
descripcion: Taller práctico para definir productos, precios y ventas de una tienda virtual.
fecha: 2026-11-20
hora: 18:00
lugar: Salón Emprende365
capacidad: 20
imagen_url: vacío
organizador: Emprende365
estado: BORRADOR
Si la fecha de ejemplo ya pasó, elige una fecha futura. Envía una sola vez: enviar CREATE de nuevo crea otro evento.
Esperado: Reglas de negocio status:201 y response.ok:true. Una fila en Eventos y una auditoría con accion CREATE y resultado EXITOSO. Copia el evento_id EVT_... de Sheets. No lo inventes.
Si la página muestra un mensaje genérico, revisa Reglas de negocio y Resultado final en n8n y verifica Sheets antes de reenviar.

## 10. Consulta el evento
Nueva escucha > Test URL > READ. Coloca el evento_id real y deja el resto vacío. Esperado: un evento y mismo ID; sin nueva fila de Eventos ni auditoría de escritura.

## 11. Actualiza y publica el estado del evento
Nueva escucha > UPDATE. Coloca evento_id, cambia capacidad a 25 y estado a PUBLICADO. Deja los otros campos vacíos. Esperado: misma fila e ID, capacidad 25, estado PUBLICADO, descripción conservada, fecha_actualizacion actualizada y auditoría UPDATE.
PUBLICADO es el estado del evento, no el botón Publish del workflow. Requiere fecha/hora futura.

## 12. Prueba una validación
Nueva escucha > UPDATE, mismo evento_id, capacidad 0, demás campos vacíos. Esperado: response.ok:false, mensaje de capacidad inválida y status:400 en Reglas de negocio. No modifica Eventos ni crea auditoría exitosa. El formulario puede mostrar un aviso genérico por la respuesta 400; revisa Output.
Puedes comprobar de igual forma fecha 2026-02-30 o hora 25:00. Deben ser rechazadas.

## 13. Prueba CLOSE y CANCEL sobre eventos de prueba
Usa un evento de prueba sin inscripciones. Nueva escucha > CLOSE > evento_id. Resto vacío. Esperado: mismo registro con CERRADO y auditoría CLOSE.
Crea un segundo evento de prueba con CREATE, copia su nuevo ID y prueba CANCEL con ese ID. Esperado: CANCELADO y auditoría CANCEL. No cancela el evento que quieras usar después para catálogo e inscripciones.
Puedes mantener o crear un evento PUBLICADO con fecha futura para WF05.

## 14. Dependencia WF09
WF04 conserva las llamadas de notificación. Si intentas modificar un evento con inscripciones CONFIRMADA o LISTA_ESPERA mientras workflowNotificaciones esté pendiente, devuelve 409 antes de escribir datos. Es deliberado: evita guardar cambios y fallar luego porque falta WF09.
Cuando WF09 esté configurado, abre Notificar WF09 y selecciona el workflow real, o copia su ID exacto en Configuración.workflowNotificaciones. Mantén coherentes ambos valores. Prueba posteriormente cambios y cancelación con inscripciones y entrega de notificaciones. No se considera verificada esa integración con las pruebas actuales.

## 15. Publica el formulario después de las pruebas
Confirma credencial Basic Auth seleccionada, dos IDs completos y resultados READ/CREATE/UPDATE/validación/CLOSE/CANCEL correctos. Guarda y pulsa Publish (o Activate según versión). Abre Production URL de Formulario administrador. Ya no requiere escucha manual.
Prueba READ en esa URL. Para comprobar autenticación usa una ventana privada nueva: debe pedir usuario y contraseña. Conserva el túnel de ngrok y n8n en ejecución. Si cambia el dominio, la dirección publicada debe actualizarse. Con un túnel local la disponibilidad depende de tu PC y del túnel; un despliegue permanente requiere planificar alojamiento estable.
La integración con WF09 sigue pendiente hasta configurar y probar ese flujo. La administración básica puede probarse con eventos sin inscripciones.

## 16. Guarda respaldo y organiza
Tras asignar tus credenciales e IDs, descarga el workflow desde n8n y guárdalo como workflows/WF04/WF04_eventos_crud_configurado.json. Es tu copia configurada; el JSON del ZIP es la base sin IDs ni secretos.
Registra en docs/WF04 el ID del evento de prueba y qué pruebas pasaron, sin contraseñas ni tokens. Activa el workflow anterior que estuvieras usando solo si lo necesitas; evita dos administraciones publicadas por accidente.

## Qué se verificó localmente
46 comprobaciones: creación, lectura, actualización conservando campos, estados, fechas/horas/capacidad/categoría/imagen, ausencia de escrituras en errores, auditorías, cancelación de inscripciones y planes de notificación simulados, dependencias y conexiones. No se ejecutó tu n8n ni se autenticó en tus Sheets. No se garantiza atomicidad o exclusión concurrente de escrituras en Sheets.

## Cierre de WF03
La captura muestra recepción y respuesta del bot, con escrituras omitidas. Confirma aparte que la primera vinculación dejó una fila ACTIVA, el código USADO y que reutilizarlo no creó otra fila. Esta última prueba puede explicar las ramas sin escrituras de tu captura.

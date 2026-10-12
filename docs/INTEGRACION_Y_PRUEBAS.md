# Integración paso a paso — revisión del 12 de octubre de 2026

## 1. Abrir esta entrega sin perder tu trabajo
1. Conserva tu carpeta actual como respaldo.
2. Extrae el ZIP en una carpeta nueva. Abre la carpeta que contiene package.json con Archivo → Abrir carpeta en Visual Studio Code.
3. Abre Terminal → Nueva terminal (PowerShell). Ejecuta los comandos siguientes uno por uno.
4. Ejecuta `node --version`. El proyecto requiere Node 22 o superior.
5. Ejecuta `Copy-Item .env.example .env`. Solo en esta carpeta nueva: no sobrescribas tu .env anterior.
6. Abre .env y configura `VITE_N8N_BASE_URL` con el host HTTPS público actual de n8n, sin /webhook. Para pruebas únicamente locales puedes usar http://localhost:5678.
7. Configura `VITE_EVENTPASS_CHAT_URL` con la URL de producción de Chat Trigger WF10 y `VITE_TELEGRAM_BOT_USERNAME` con el nombre del bot sin @.
8. Si tus endpoints no coinciden con los estándar, copia su Production URL en VITE_USUARIOS_URL, VITE_AUTH_URL, VITE_TELEGRAM_URL, VITE_CATALOGO_URL, VITE_INSCRIPCIONES_URL y VITE_CHECKIN_URL.
9. Guarda el archivo. Ejecuta `npm run dev` y deja la terminal abierta.
10. Abre http://localhost:5173. El examen está en http://localhost:5173/examen/ y al final del menú superior.

No necesitas instalar librerías para ejecutar este frontend. No abras index.html con doble clic ni con Live Server: este servidor genera config.js a partir de .env. Tras modificar .env, recarga la página. En producción vuelve a ejecutar el build.

## 2. Google Sheets se queda en Drive
Los once documentos existentes son la persistencia del sistema. No los muevas ni los reemplaces por CSV. El navegador solo llama n8n. Los nodos de n8n acceden a las hojas con sus credenciales OAuth.

Usa docs/MAPA_SHEETS.md como inventario privado de los documentos y pestañas. Completa los IDs en los nodos Configuración de los workflows. Las credenciales se seleccionan dentro de n8n; no van en .env ni en el frontend. Las plantillas CSV son referencias de encabezados, no bases de datos sincronizadas.

## 3. Qué importar y qué conservar
Primero exporta desde tu instancia los once workflows actuales como respaldo. Esta entrega contiene candidatos de código, no certifica su configuración real. No actives copias con los mismos Webhooks.

- WF05: se quitó la restricción exclusiva a Emprendimiento y se cuentan CONFIRMADA + ASISTIO como cupos ocupados. Compara el nodo Reglas de negocio y traslada ese código al mismo workflow existente; conserva IDs y credenciales. Guarda y publica según tu versión.
- WF06 y WF07: ajustes propuestos para contar ASISTIO como cupo ocupado; WF06 impide otra inscripción activa tras asistir. Sus archivos aún tienen configuración pendiente y require: no sustituyas a ciegas tus versiones que funcionan.
- WF02: el archivo subido estaba dañado y no era JSON válido. Se incluyó como candidato la versión sin módulos de la entrega anterior, con licencia scrypt-js. No es una exportación reciente de tu instancia. Si tu WF02 actual funciona, consérvalo y expórtalo nuevamente sobre este archivo.
- WF11: conserva el contrato del examen. Completa los cinco IDs de Sheets, selecciona credenciales y el ID real de WF09. El archivo recibido aún tenía placeholders.
- WF09: se conserva la versión subida; Gmail y Telegram deben verificarse desde WF11.
- WF04, WF06, WF07, WF08, WF10: requieren revisar configuración y módulos Code antes de afirmar que funcionan sin ajustes. No se modificó Docker.

Después de los ajustes, exporta cada workflow desde n8n con los nombres obligatorios de n8n/. Esas exportaciones son las que debes entregar en GitHub.

## 4. Tener varios eventos reales
El frontend no inventa eventos si n8n no responde. La portada muestra hasta seis eventos que todavía admiten inscripción y el catálogo muestra todos los eventos publicables devueltos por WF05.

1. Ejecuta `npm run preparar:eventos`.
2. Abre datos_demo/propuestas/eventos-para-WF04.json. Son siete propuestas, con fechas futuras calculadas al ejecutar el comando y tres categorías: Emprendimiento, Educación y Networking.
3. En n8n abre el formulario administrativo de WF04. Usa CREATE y copia los campos de la primera propuesta. Repite con las demás. Si el formulario exige una clave administrativa, utiliza tu configuración existente.
4. No escribas IDs manuales: WF04 los genera. Si solo permite crear PUBLICADO/BORRADOR, crea el último evento y luego usa CANCEL para dejarlo CANCELADO.
5. Verifica en EP04_Eventos → Eventos que cada fila tiene un evento_id diferente. No reemplaces las filas existentes.
6. Comprueba que WF05 ya admite las tres categorías. Abre Explorar eventos y prueba cada filtro.
7. Para el caso lleno, usa el evento con capacidad 1: crea una inscripción real CONFIRMADA con un usuario vinculado a Telegram. Un segundo usuario debe quedar LISTA_ESPERA. No escribas un campo manual de cupos disponibles.
8. El evento próximo queda a unas 12 horas de generar las propuestas. Si pasa el tiempo antes de probar recordatorios, prepara nuevas fechas y actualiza ese evento por WF04.

Los CSV anteriores de datos_demo son fixtures históricos con fechas de octubre de 2026: no importarlos como datos actuales. Las propuestas nuevas no se cargan solas en Drive.

## 5. Resolver primero el acceso pendiente
La última prueba compartida devolvió Credenciales inválidas. No está demostrado que el acceso esté resuelto. Comprueba que el correo del formulario coincide con email_normalizado del usuario ACTIVO y usa su contraseña de EventPass. Si persiste, revisa Leer Usuarios y la comprobación hash/salt de WF02. No cambies hashes manualmente ni crees una sesión falsa para saltar la validación.

## 6. Probar el examen desde la página
1. Publica los Webhooks que vas a usar y configura el origen permitido del frontend en n8n. Usa Production URL para navegar normalmente.
2. Entra a EventPass e inicia sesión. Vincula Telegram si hace falta.
3. Inscríbete en un evento publicado, futuro y con cupo. En Mis inscripciones debe decir Confirmada.
4. Pulsa Check-in en esa inscripción, o abre Examen · Check-in en el menú y selecciona la inscripción.
5. Pulsa Registrar mi ingreso una sola vez.
6. Debe aparecer ASISTENCIA REGISTRADA. En EP06 el estado debe ser ASISTIO; en EP11 → Checkins debe haber un registro EXITOSO con fecha y hora; verifica Gmail y Telegram y sus estados en EP09.
7. Vuelve a pulsar Registrar mi ingreso con los mismos IDs. Debe aparecer INGRESO YA REGISTRADO, sin otro EXITOSO, sin otra modificación ni otra notificación. Puede registrarse un intento DUPLICADO.
8. Prueba con el ID de una inscripción cancelada o en lista de espera introduciéndolo manualmente: RECHAZADO, sin cambiar la inscripción.
9. Prueba una inscripción con el ID de otro evento existente: RECHAZADO.
10. Prueba un ID de inscripción inexistente: RECHAZADO.
11. Guarda evidencia de la respuesta y de las filas afectadas, ocultando tokens, contraseñas y datos personales.

Una falla de red no confirma si la operación se guardó: revisa EP06/EP11 antes de repetirla. Sheets no ofrece una transacción entre archivos: esta solución evita duplicados secuenciales, pero sigue pendiente el control de concurrencia y la recuperación automática si falla una escritura intermedia.

## 7. Cierre y publicación
Ejecuta `npm test`, `npm run test:examen`, `npm run audit:workflows` y `npm run build`. La auditoría diferencia sintaxis JSON de configuración pendiente; no acredita una integración real. Las pruebas de navegador usan respuestas simuladas.

En Vercel conserva buildCommand npm run build y outputDirectory dist. Configura las variables públicas de .env.example con URLs HTTPS de producción; no subas .env. Completa nombre del estudiante, repositorio y URL pública en README. Registra commits reales, sin alterar fechas. No se puede acreditar retrospectivamente el límite de dos horas del examen.

## Pruebas adicionales opcionales
Ejecuta npm run test:catalogo para las reglas multicategoría. tests/dom.mjs requiere jsdom opcional; tests/browser.mjs requiere Playwright y Chromium, además del servidor local. No son dependencias del frontend. La revisión visual en navegador no se completó en esta entrega; consulta VALIDACION_REVISION.txt.

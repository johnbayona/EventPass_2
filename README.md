# EventPass Emprende365

Aplicación para descubrir eventos de emprendimiento, educación y networking, crear una cuenta, vincular Telegram y gestionar inscripciones. El frontend se comunica exclusivamente con n8n; Google Sheets conserva los datos académicos y n8n coordina Gmail, Telegram y el asistente IA.

**Estudiante:** pendiente de completar con tu nombre. **Repositorio GitHub:** utiliza tu mismo repositorio EventPass. **URL Vercel:** pendiente de publicar y registrar aquí. No hay una URL pública creada por este paquete.

## Estado de esta entrega

Incluye el código completo del frontend, los diez workflows ya entregados, configuración para Vercel, plantillas de Sheets, datos de demostración, contrato HTTP y documentación. Los JSON de n8n se incluyen como referencia; si ya los configuraste, conserva tus versiones y vuelve a exportarlas para la entrega final.

**Verificado:** compilación estática, 13 pruebas automatizadas de API/utilidades del frontend, 53 pruebas de lógica de workflows y 16 recorridos de interfaz en un DOM en memoria con API simulada. **Pendiente:** integración con tu Docker y credenciales, pruebas visuales en un navegador real, envíos Gmail/Telegram, respuesta del proveedor IA y despliegue Vercel. El test de navegador con backend simulado está incluido para ejecutarlo localmente; no se presenta como aprobado. La compilación no demuestra que tus servicios externos estén configurados.

## Inicio rápido en Windows

1. Descomprime el paquete y abre la carpeta que contiene este README en Visual Studio Code.
2. En **Terminal → New Terminal**, abre PowerShell.
3. Comprueba Node.js (22 o superior) y npm:

```powershell
node --version
npm --version
```

4. Copia el archivo de configuración:

```powershell
Copy-Item .env.example .env
```

5. Abre `.env` y completa:

```dotenv
VITE_N8N_BASE_URL=http://localhost:5678
VITE_EVENTPASS_CHAT_URL=URL_COMPLETA_DEL_CHAT_TRIGGER_WF10
VITE_TELEGRAM_BOT_USERNAME=USERNAME_DE_TU_BOT_SIN_ARROBA
```

La primera variable es el host de n8n, sin `/webhook` al final. La segunda debe ser una URL real; déjala vacía hasta configurar WF10. No dejes el texto de ejemplo como si fuera una URL. El prefijo `VITE_` se conserva por convención de configuración pública; este proyecto utiliza un build propio de Node, **no utiliza Vite**.

6. En n8n publica WF01, WF02, WF03, WF05 y WF06 después de configurar sus credenciales, Sheets y dependencias. Mantén inicialmente WF07 y WF08 desactivados hasta probar inscripciones. Selecciona WF09 en sus llamadas desde WF04/06/07/08. Publica WF10 cuando su modelo funcione.
7. En los Webhook y Chat Trigger configura `Allowed Origins` como `http://localhost:5173` para pruebas locales.
8. Ejecuta:

```powershell
npm run dev
```

9. Abre `http://localhost:5173`. No abras `index.html` con doble clic: los módulos y la configuración necesitan servidor HTTP.

El frontend no requiere dependencias npm para funcionar. `npm install` es opcional para preparar el lockfile; ya está incluido. `npm run dev` sirve el código fuente; no expone tu `.env` ni los JSON de workflows.

**Usa Production URL**, no Test URL, para navegar normalmente por el frontend. Si tus Webhook utilizan otras rutas, configura sus URL completas mediante las variables opcionales de `.env.example`. Test URL solo sirve mientras el nodo está escuchando y debe reactivarse antes de cada llamada.

## Qué permite la interfaz

| Vista | Función |
|---|---|
| Inicio | Presentación y próximos encuentros obtenidos del catálogo real |
| Registro | Crear usuario y validar confirmación de contraseña |
| Login | Autenticar y recibir un token de sesión |
| Catálogo | Listado, filtro de categoría, búsqueda y filtro de cupos |
| Detalle | Fecha, hora, lugar, organizador, disponibilidad y reserva |
| Mis inscripciones | Confirmadas, lista de espera, canceladas; edición de acreditación y cancelación |
| Perfil | Consultar/actualizar nombre y correo; desactivar cuenta |
| Telegram | Generar código temporal, copiar comando y comprobar vinculación |
| Asistente | Chat informativo con WF10 |

Las operaciones muestran carga, éxito o error. Los botones se desactivan mientras se procesa una solicitud. No hay catálogo ficticio oculto, contadores inventados, login simulado ni conexiones directas a Sheets en el frontend. `datos_demo/` sirve para cargar registros de prueba en Sheets, no como sustituto de la API.

La administración de eventos permanece en el Form Trigger protegido de WF04, exclusivamente para el administrador. No se agrega un panel administrativo público.

## Arquitectura y tecnologías

Frontend estático HTML/CSS/JavaScript con módulos → HTTP POST a n8n → validación y reglas → Google Sheets independientes → Gmail/Telegram/IA.

- HTML semántico, CSS adaptable a móvil y JavaScript nativo.
- Node.js 22+ para servidor local y compilación, sin framework ni dependencias de producción.
- n8n 2.40.5 en Docker, nodos Google Sheets/Gmail/Telegram/Code/Form/Chat/Schedule/Subworkflow.
- Vercel sirve únicamente `dist/`, generado por `npm run build`.
- Rutas del cliente mediante hash (`#/eventos`, `#/perfil`), sin necesidad de reescrituras SPA.
- Pruebas de Node; test opcional de navegador con Playwright y backend simulado.

## Organización

| Ruta | Contenido |
|---|---|
| `frontend/` | index.html, app.js, api.js, utils.js, styles.css, favicon.svg |
| `scripts/` | Servidor de desarrollo, compilación e incorporación de configuración pública |
| `n8n/` | Diez JSON, con los nombres obligatorios |
| `docs/` | Contrato, guías, pruebas y esquemas |
| `plantillas_sheets/` | CSV de encabezados para diez documentos |
| `datos_demo/` | Seis eventos y una inscripción de prueba |
| `tests/` | Pruebas de lógica, API/utilidades y navegador |
| `vercel.json` | Build y carpeta pública de Vercel |
| `.env.example` | Variables públicas documentadas |

## Workflows, triggers y persistencia

| Workflow | Trigger | Google Sheets principal |
|---|---|---|
| WF01 Usuarios CRUD | Webhook | EP01_Usuarios |
| WF02 Autenticación y sesiones | Webhook | EP02_Sesiones |
| WF03 Vinculación Telegram | Webhook + Telegram Trigger | EP03_Telegram |
| WF04 Administración eventos | Form Trigger con Basic Auth | EP04_Eventos |
| WF05 Catálogo público | Webhook | EP05_Catalogo_Log |
| WF06 Inscripciones CRUD | Webhook | EP06_Inscripciones |
| WF07 Reasignación lista de espera | Schedule Trigger | EP07_Reasignaciones |
| WF08 Recordatorios | Schedule Trigger | EP08_Recordatorios |
| WF09 Notificaciones | Execute Sub-workflow Trigger | EP09_Notificaciones |
| WF10 Asistente | Chat Trigger + modelo IA | EP10_Soporte |

Cada workflow registra su dominio en su documento principal; puede leer o actualizar otros dominios donde lo exige el negocio. Los encabezados se describen en `docs/esquemas.json`. Consulta `docs/GUIA_WORKFLOWS.md` para configurar los diez archivos, credenciales, crypto, concurrencia y llamadas a WF09.

## Comunicación frontend → n8n y endpoints

`frontend/api.js` envía POST con JSON. En operaciones protegidas transmite `Authorization: Bearer TOKEN`; n8n verifica sesión y obtiene de ella la identidad. No se usa un usuario_id proporcionado por el cliente para autorizar acceso a otra cuenta. El cliente omite cookies, no incorpora secretos en la URL y no reintenta automáticamente escrituras con resultado incierto.

| Ruta de producción | Operaciones |
|---|---|
| `/webhook/eventpass/usuarios` | crear, consultar, actualizar, desactivar |
| `/webhook/eventpass/auth` | login, validar, logout |
| `/webhook/eventpass/telegram` | generar_codigo, consultar |
| `/webhook/eventpass/catalogo` | listado, detalle, filtro |
| `/webhook/eventpass/inscripciones` | crear, consultar, actualizar, cancelar |

WF04 usa su Form URL, WF09 es interno y WF10 usa la Chat URL del trigger. Los ejemplos de entrada/salida están en `docs/CONTRATO_HTTP.md`.

El frontend necesita que las respuestas respeten ese contrato. Si tus WF actuales son diferentes, utiliza las variables de URL cuando cambie la ruta; para nombres de campos y estructura JSON distintos, adapta `frontend/api.js`/`app.js` o alinea los workflows. No reemplaces versiones ya configuradas sin respaldo.

## Estados del negocio

| Dominio | Estados |
|---|---|
| Usuario | ACTIVO, INACTIVO |
| Sesión | ACTIVA, CERRADA, EXPIRADA |
| Código Telegram | PENDIENTE, USADO, EXPIRADO, CANCELADO |
| Vinculación | ACTIVA, INACTIVA |
| Evento | BORRADOR, PUBLICADO, CERRADO, CANCELADO |
| Inscripción | CONFIRMADA, LISTA_ESPERA, CANCELADA |
| Recordatorio | PENDIENTE, ENVIADO, ERROR, OMITIDO |
| Canal de notificación | PENDIENTE, ENVIADO, ERROR, NO_APLICA |
| Conversación | ABIERTA, CERRADA |

Las eliminaciones son lógicas. Los workflows de referencia no crean necesariamente todos los estados posibles; por ejemplo, el asistente crea conversaciones ABIERTA y no expone cierre al visitante.

## Hashing de contraseña

WF01 usa scrypt de Node (`scryptSync(password, salt, 64)` con parámetros estándar N=16384, r=8, p=1). El salt son 32 bytes aleatorios representados en hexadecimal; el hash, 64 bytes en hexadecimal. WF02 compara con `timingSafeEqual`. El frontend nunca recibe hash/salt y no guarda contraseñas.

Los hashes de un workflow anterior solo son compatibles si emplean el mismo algoritmo, parámetros y formato. Usa una cuenta nueva de prueba o migra explícitamente; no cambies hashes manualmente.

## Sesiones

WF02 genera tokens aleatorios de 32 bytes, registra ocho horas de vigencia y controla logout, expiración y usuario activo. WF01/03/06 vuelven a validar en cada operación protegida.

El frontend conserva token y datos públicos del perfil en `sessionStorage`, que pertenece a la pestaña. Al cargar valida la sesión en WF02; los errores 401 limpian la sesión local. Logout intenta cerrarla en n8n y limpia el dispositivo; si falla la red, informa que el cierre remoto no pudo confirmarse. El token remoto podría seguir vigente hasta su expiración.

Este mecanismo académico usa Bearer accesible desde JavaScript, no cookies HttpOnly. Nunca ingreses tokens en el asistente y protege Sheets de sesiones. CORS no reemplaza la autenticación.

## Idempotencia, cupos y lista de espera

- Email normalizado, control de duplicado también en cuentas inactivas.
- Una inscripción activa por usuario+evento; reintentar devuelve la misma inscripción.
- Cupos = capacidad − inscripciones CONFIRMADA. No existe un contador manual como fuente de verdad.
- Si no hay cupo, LISTA_ESPERA. Una cola existente tiene prioridad sobre nuevos usuarios.
- Cancelar conserva el registro y libera cupo; WF07 revisa y promueve por fecha_inscripcion ASC a candidatos activos y vinculados, con ID como desempate.
- Recordatorios únicos por usuario+evento+tipo.
- Notificaciones con clave estable y resultados independientes por canal.

Sheets no es transaccional. El paquete exige una sola ejecución de producción simultánea (`N8N_CONCURRENCY_PRODUCTION_LIMIT=1`) y pruebas manuales de una en una. No garantiza rollback o envío exactamente una vez ante una caída entre pasos. Los estados PENDIENTE ambiguos requieren conciliación; consulta la guía de workflows antes de reejecutar datos parcialmente escritos.

## Notificaciones centralizadas

WF04/06/07/08 llaman WF09. El servicio intenta correo y Telegram cuando hay destino disponible, registra errores por separado y no oculta un canal por fallo del otro. Un canal ya ENVIADO no se repite con la misma clave. El HTTP de inscripción no reemplaza los avisos: la interfaz informa cuando la operación se guardó pero algún canal no se envió.

Telegram necesita URL HTTPS pública de n8n. Ni Telegram ni un frontend público pueden alcanzar el localhost de tu computador. Prepara un túnel estable o un servidor accesible y configura `WEBHOOK_URL`; las instrucciones no publican tu Docker por sí solas.

## Asistente IA y restricciones

WF10 lee eventos publicables y registra conversaciones/mensajes. No tiene herramientas que modifiquen usuarios, eventos, cupos o inscripciones. Responde sobre categorías, fechas, lugares, funcionamiento y Telegram. El widget presenta texto de forma segura, sin interpretar HTML recibido.

Se identifica al interlocutor como visitante mediante sessionId/visitor_id, no se confía en usuario_id arbitrario y no se revelan estados personales de inscripción. Para esa información se indica Mis inscripciones. La conversación completa se reconstruye filtrando Mensajes por conversation_id; los últimos diez mensajes sirven como contexto. El navegador usa un sessionId aleatorio por pestaña.

## Variables de entorno

| Variable | Uso |
|---|---|
| VITE_N8N_BASE_URL | Host público/local de n8n sin `/webhook` |
| VITE_EVENTPASS_CHAT_URL | URL completa de producción del Chat Trigger |
| VITE_TELEGRAM_BOT_USERNAME | Username sin @ para abrir el bot |
| VITE_USUARIOS_URL | URL completa opcional de WF01 |
| VITE_AUTH_URL | URL completa opcional de WF02 |
| VITE_TELEGRAM_URL | URL completa opcional de WF03 |
| VITE_CATALOGO_URL | URL completa opcional de WF05 |
| VITE_INSCRIPCIONES_URL | URL completa opcional de WF06 |

Todas estas variables son **públicas** y se incorporan a `dist/config.js`. Las claves Google/OpenAI/Telegram permanecen en n8n. Las variables `.env` modificadas se reflejan al actualizar el navegador en desarrollo; en Vercel requieren una nueva compilación/deploy.

## Compilar y probar

```powershell
npm test
npm run test:workflows
npm run build
npm run preview
```

Abre `http://localhost:5173` para preview; detén primero el servidor dev si ocupa el mismo puerto. La compilación falla si alguna URL configurada es inválida o contiene usuario/contraseña. Si falta el host de n8n, avisa y compila la interfaz con mensajes de servicio no disponible.

Test de navegador opcional (con datos simulados, no verifica n8n):

```powershell
npm install --no-save playwright
npx playwright install chromium
# Con npm run dev activo en otra terminal:
node tests/browser.mjs
```

Las pruebas reales de servicios se describen en `docs/PRUEBAS_MANUALES.md` y `docs/PASO_A_PASO.md`. No confundas tests simulados con integración real.

También se incluye `tests/dom.mjs`, que ejecuta los recorridos de interfaz en memoria usando jsdom opcional. Para repetirlos: `npm install --no-save jsdom` y `node tests/dom.mjs`. No verifica CSS, diseño visual ni servicios externos.

## Publicar y entregar

Sigue `docs/PASO_A_PASO.md` para agregar el código a tu mismo GitHub, publicar en Vercel y comprobar n8n HTTPS/CORS. `vercel.json` fija `npm run build` y `dist/`; no publica los archivos de Sheets, workflows ni `.env`.

Después de las pruebas, exporta directamente desde n8n los diez workflows configurados y reemplaza los JSON de referencia conservando sus nombres. Agrega aquí nombre del estudiante, enlace del repositorio y URL funcional de Vercel. Revisa que no exista pinData ni secretos en el repositorio. Conserva evidencia de las pruebas de servicios y de los seis eventos/tres categorías.

Para restaurar tu WF01 anterior, conserva su exportación separada y despublica el nuevo antes de volver a usar la misma ruta. El paquete no borra registros existentes.

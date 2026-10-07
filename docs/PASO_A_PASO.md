# Puesta en marcha y entrega

## Paso 1 — Preservar lo que ya configuraste

Exporta los workflows desde tu n8n y guarda una copia. Si ya funcionan, **no vuelvas a importar** los JSON de referencia por defecto. Comprueba que las rutas y respuestas coincidan con CONTRATO_HTTP.md. Guarda tus exportaciones con los diez nombres obligatorios en `n8n/` del proyecto.

## Paso 2 — Preparar el frontend

1. Abre la carpeta completa en VS Code y una terminal PowerShell.
2. Ejecuta `node --version` y `npm --version`; necesitas Node 22+ fuera de Docker para los comandos del frontend.
3. Ejecuta `Copy-Item .env.example .env`.
4. Completa host n8n, URL completa Chat Trigger y username del bot; deja vacías las variables opcionales que no utilices.
5. Publica los workflows HTTP ya configurados y WF10. En cada Webhook/Chat Trigger permite `http://localhost:5173`.
6. Ejecuta `npm run dev` y abre `http://localhost:5173`.

## Paso 3 — Primera prueba completa

1. Catálogo: deben aparecer eventos reales de EP04_Eventos. Si falla, consulta la Production URL de WF05 y sus credenciales/Sheets.
2. Registro: crea una cuenta con tu correo de pruebas y una contraseña de 12 o más caracteres.
3. Login: usa la misma cuenta. Perfil debe mostrar tus datos sin hash/salt.
4. Telegram: genera código, abre el bot, inicia chat privado y envía `/vincular CODIGO`.
5. Pulsa Comprobar vinculación en la web; debe aparecer activa.
6. Abre un evento con cupos y pulsa Reservar mi lugar. Consulta la inscripción y los dos mensajes.
7. Edita nombre de acreditación u observaciones. Comprueba el cambio en Sheets.
8. Usa cuentas de prueba adicionales para llenar un evento y formar la lista de espera.
9. Cancela un cupo confirmado y ejecuta WF07 de una en una: se promueve al más antiguo elegible.
10. Usa un evento dentro de las próximas 24 horas para WF08. Ejecútalo dos veces: el recordatorio no debe repetirse.
11. Consulta el asistente y comprueba las filas Conversaciones/Mensajes. Pedir que inscriba o cancele no debe cambiar datos.
12. Prueba logout y errores. Deja la desactivación para una cuenta secundaria de prueba.

Publica los schedules solo cuando estas pruebas funcionen. Conserva el límite de concurrencia de producción y no combines ejecuciones manuales con operaciones simultáneas sobre las mismas Sheets.

## Paso 4 — Llevar el código al mismo GitHub EventPass

Este paquete no conoce la URL ni el estado de tu repositorio. Trabaja sobre tu clon existente; no crees un repositorio diferente ni reemplaces archivos sin respaldo.

1. Copia los archivos del paquete a la carpeta del clon existente. Conserva tus `.env`, credenciales fuera del repo y workflows configurados.
2. En PowerShell, desde ese clon, revisa:

```powershell
git status
git remote -v
```

3. Comprueba que `origin` sea tu repositorio EventPass. Si no existe clon, clona primero la URL real desde GitHub con `git clone URL_REAL_DEL_REPO`; no ejecutes literalmente ese marcador.
4. Ejecuta las pruebas y compilación:

```powershell
npm test
npm run test:workflows
npm run build
```

5. Revisa que tus JSON exportados no contengan datos fijados/pinData, secrets ni tokens.
6. Agrega solo los archivos de proyecto:

```powershell
git add frontend scripts n8n docs tests plantillas_sheets datos_demo
git add package.json package-lock.json vercel.json .env.example .gitignore README.md configurar.py
git diff --cached --stat
git commit -m "Completar frontend y documentación de EventPass Emprende365"
git push -u origin HEAD
```

No uses `git push --force`. Si el repositorio ya contiene otro frontend, evalúa sus archivos antes de copiar encima; no conserves dos builds distintos activos por accidente. No subas `.env`, `dist/`, archivos OAuth, claves del bot o de IA.

## Paso 5 — Preparar n8n para acceso público

Vercel no puede conectarse al localhost de tu computador. Necesitas una URL HTTPS pública estable hacia n8n, mediante túnel o servidor propio. Este paquete no crea esa infraestructura.

1. Configura esa URL como `WEBHOOK_URL` en el Docker actual y conserva su volumen/clave de cifrado.
2. Recrea el servicio de forma normal con `docker compose up -d` desde tu Compose; no borres volúmenes.
3. Comprueba que las Production URL y la Chat URL sean HTTPS públicas.
4. WF03 Telegram Trigger debe recibir actualizaciones desde esa URL. No actives otro Telegram Trigger para el mismo bot.
5. Protege el editor y el formulario del administrador. Usa runners externos con aislamiento cuando tu instancia maneje datos sensibles; consulta la documentación oficial de n8n.

## Paso 6 — Publicar frontend en Vercel

1. Entra a Vercel y selecciona **Add New → Project**.
2. Importa el mismo repositorio GitHub EventPass.
3. Root Directory: la carpeta que contiene `package.json` y `vercel.json` de este frontend.
4. Framework: **Other**. Build Command: `npm run build`. Output Directory: `dist`.
5. En Environment Variables agrega los valores públicos reales de `.env.example`. El host de n8n debe ser HTTPS público, nunca localhost.
6. URL del chat: copia la Production URL completa de WF10, sin reconstruirla a mano.
7. Username del bot: sin `@`.
8. Pulsa Deploy. Copia la URL de producción que Vercel te entregue.
9. En Webhook y Chat Trigger de n8n, permite el origen de esa URL en Allowed Origins, sin rutas ni slash final.
10. Comprueba cada recorrido desde la web publicada y vuelve a desplegar si cambiaste variables de entorno.

`vercel.json` define build y outputDirectory. Referencia oficial: https://vercel.com/docs/project-configuration/vercel-json

## Paso 7 — Completar la entrega

1. Escribe tu nombre, URL GitHub y URL Vercel en README.
2. Verifica seis eventos en tres categorías; actualiza fechas de prueba para que existan futuro, lleno, próximo y cancelado/cerrado.
3. Sustituye el participante ficticio del evento lleno por una inscripción real si deseas integridad completa de los datos de evaluación.
4. Exporta nuevamente desde **tu instancia n8n** los diez JSON configurados y usa los nombres obligatorios.
5. Guarda evidencias de registro, login, Telegram, inscripción, espera, promoción, recordatorio único, ambos canales y chat registrado.
6. Sube el commit final y verifica la URL Vercel desde otro dispositivo.

## Diagnóstico rápido

| Síntoma | Revisar |
|---|---|
| Catálogo vacío | EP04 tiene eventos publicables; WF05 consulta el documento correcto |
| No conecta desde navegador | Host/URL, workflow publicado, CORS, HTTPS y Docker funcionando |
| Funciona local pero falla Vercel | Backend público; no usar localhost; origen permitido; recompilar variables |
| Login falla con usuarios antiguos | Formato/algoritmo scrypt compatible con WF02 |
| Perfil falla | Configuración de WF01 y WF03; token válido |
| Telegram no recibe | URL HTTPS de trigger, credencial y un único trigger activo por bot |
| Inscripción se guarda pero no llega aviso | Resultados independientes de WF09; no crear otra inscripción para reenviar |
| Importación muestra credenciales rojas | Seleccionar credenciales existentes en cada nodo |
| `crypto` bloqueado | Autorizarlo en el runner según modo interno/externo |
| `npm run preview` falla | Ejecutar primero build y liberar el puerto 5173 |

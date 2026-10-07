# Resumen del proyecto

**EventPass Emprende365** es una aplicación de eventos para emprendedores. Permite aprender mediante talleres, conectar con aliados y gestionar encuentros de emprendimiento, educación y networking.

El usuario crea su cuenta, inicia sesión, vincula Telegram y reserva un evento. Si no hay cupos, entra a una lista de espera. Cuando alguien cancela, n8n reasigna el cupo al candidato elegible que lleva más tiempo esperando. Gmail y Telegram informan confirmaciones, cambios y recordatorios.

| Parte | Funcionalidad |
|---|---|
| Frontend | Inicio, registro, login, catálogo, detalle, inscripciones, perfil, Telegram y chat |
| n8n | Diez workflows con validaciones, sesiones, persistencia y automatizaciones |
| Google Sheets | Diez documentos independientes con datos y auditorías |
| Gmail/Telegram | Notificaciones centralizadas con resultados separados |
| IA | Asistente informativo; no realiza cambios del negocio |
| Vercel | Configuración incluida para alojar el frontend estático |

**Entregado:** código fuente, workflows de referencia, README, .env.example, configuración Vercel, esquemas de Sheets, datos de prueba y guías de ejecución/publicación.

**Validado:** compilación, 53 pruebas de workflows, 13 de API/utilidades y 16 recorridos DOM, todos con pruebas locales o servicios simulados.

**Aún debes completar:** credenciales y URLs reales, pruebas con tu n8n, revisión visual en navegador, subida al mismo GitHub y publicación en Vercel. Añade tu nombre y enlaces al README. Los JSON finales deben exportarse desde tu instancia.

Para iniciar en PowerShell, abre la carpeta del proyecto, ejecuta `Copy-Item .env.example .env`, completa las URLs y ejecuta `npm run dev`. Consulta `docs/PASO_A_PASO.md` para el procedimiento completo.

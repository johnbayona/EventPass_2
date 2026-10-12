# Diagnóstico — 12 de octubre de 2026

## Confirmado por inspección
- Frontend JavaScript nativo, sin dependencias de ejecución, HTTP centralizado y sesión en sessionStorage. No accede a Sheets directamente.
- Existían once archivos de workflows e integración inicial del check-in. Los archivos no demuestran que estén publicados/configurados.
- Se añadió página física /examen/ y enlace al final del menú, con selección de inscripciones propias y resultados diferenciados.
- WF05 restringía resultados a EMPRENDIMIENTO. Se eliminó esa condición. La portada excluye eventos pasados/no inscribibles y ahora muestra hasta seis, antes tres.
- No podemos determinar cuántos eventos hay actualmente en Sheets. La interfaz no inventa los restantes si el servicio devuelve uno.
- WF02 recibido tenía escape inválido y estructura corrupta. Se recuperó un candidato de WF02_sin_cambiar_Docker.zip entregado anteriormente. Debe compararse con una exportación actual de n8n.
- WF11 recibido tenía cinco IDs REEMPLAZAR y SELECCIONAR_ID_WF09. No se asume que refleje tu instancia actual.
- WF04, WF06, WF07, WF08 y WF10 incluyen require en nodos Code. Múltiples workflows tienen marcadores de configuración. Docker no se modificó.
- WF05/06/07 cuentan ASISTIO como cupo ocupado. WF06 incluye ASISTIO al detectar una inscripción previa, sin habilitar su cancelación/edición.
- Se retiraron datos fijados pinData y se sustituyeron contraseñas/correos de pruebas por placeholders.

## Pendientes en el entorno real
1. Login WF02: último resultado compartido Credenciales inválidas.
2. Exportaciones actuales, configuración, permisos OAuth, URLs y orígenes permitidos.
3. Seis eventos en tres categorías, caso lleno real, próximo y cancelado/cerrado.
4. Inscripción, cancelación, lista FIFO, recordatorios sin duplicados y asistente de solo lectura.
5. Cuatro casos del examen, persistencia y avisos Gmail/Telegram reales.
6. Vercel, GitHub, README personal y exportaciones reales desde n8n.

## Límites
Se comprueba pertenencia al usuario autenticado; no se añadió un rol de operador inexistente en el contrato actual. El historial EXITOSO y el estado ASISTIO detienen duplicados secuenciales. Sheets no es transaccional: solicitudes simultáneas y fallos entre actualizar inscripción y registrar historial necesitan coordinación/reconciliación. No se certifica protección concurrente.

DIAGNOSTICO.md y VALIDACION_LOCAL.txt son documentos históricos. Este archivo y VALIDACION_REVISION.txt describen la revisión actual.

# Pruebas de integración pendientes

Realiza cada prueba de una en una con datos de prueba y credenciales propias. No publiques schedules mientras haces pruebas manuales que escriben las mismas tablas. Registra resultados y fecha; las pruebas locales del paquete no acreditan estas pruebas reales.

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Importar cada JSON en n8n 2.40.5 | Los diez abren; no hay nodos desconocidos; credenciales pendientes visibles |
| 2 | Seleccionar credenciales y todos los IDs | Lecturas de Sheets correctas, incluidas hojas vacías |
| 3 | Crear usuario con email en mayúsculas | Email normalizado; hash/salt; fila de auditoría; HTTP 201 |
| 4 | Repetir mismo correo | HTTP 409; ninguna segunda fila |
| 5 | Crear con contraseña corta o email inválido | HTTP 400 sin escritura |
| 6 | Login correcto/incorrecto | Token de sesión / HTTP 401 genérico |
| 7 | Consultar/actualizar sin token | HTTP 401 sin datos de perfil |
| 8 | Consultar/actualizar con token | Cambia solo campos permitidos; respuesta sin hash/salt |
| 9 | Intentar otro usuario_id con token propio | HTTP 403 |
| 10 | Actualizar a correo ya registrado | HTTP 409; no cambia usuario |
| 11 | Expirar una sesión de prueba y validar | HTTP 401; estado EXPIRADA |
| 12 | Solicitar código Telegram sin sesión | HTTP 401 |
| 13 | Solicitar código con sesión y usar en chat privado | Vinculación ACTIVA; código USADO |
| 14 | Reutilizar código o usar uno expirado | Rechazo; no altera vinculación |
| 15 | Crear evento en Form Trigger con Basic Auth | Evento + auditoría; sin autorización no accede al formulario |
| 16 | READ, UPDATE, CLOSE, CANCEL de evento | Estados/datos persistidos; sin borrado físico |
| 17 | Catálogo: listado, filtro y detalle | Eventos publicables; log en EP05; borradores ausentes |
| 18 | Cargar seis eventos / tres categorías | Disponible, lleno, próximo y cancelado/cerrado presentes |
| 19 | Inscribir usuario sin Telegram | HTTP 409 |
| 20 | Inscribir usuario en evento con cupo | CONFIRMADA; auditoría; Gmail y Telegram |
| 21 | Repetir inscripción | Mismo ID activo; sin nueva fila ni nueva notificación |
| 22 | Inscribir dos usuarios adicionales en evento lleno | LISTA_ESPERA en orden de fecha |
| 23 | Cambiar acreditación/observaciones | Conserva propietario, evento y estado; auditoría |
| 24 | Cancelar confirmado | CANCELADA; cupo libre; mensajes por ambos canales |
| 25 | Ejecutar WF07 | Promueve primero al más antiguo elegible; registra reasignación y ambos resultados |
| 26 | Intentar nueva inscripción mientras hay cola | No se adelanta a los usuarios en espera |
| 27 | Ejecutar WF08 para evento en próximas 24 h | Recordatorio a confirmados activos; registra envío |
| 28 | Volver a ejecutar WF08 | No repite mismo recordatorio |
| 29 | Simular credencial Gmail inválida usando cuenta de prueba | Gmail ERROR y Telegram con resultado independiente |
| 30 | Reintentar misma clave de notificación tras reparar Gmail | No repite canal Telegram ENVIADO |
| 31 | Interrumpir ejecución de prueba tras dejar PENDIENTE | No reenvía automáticamente; conciliación manual |
| 32 | Consultar asistente sobre catálogo | Respuesta de datos disponibles; dos mensajes y conversación |
| 33 | Pedir al asistente cancelar/inscribir | Explica el procedimiento; no modifica registros |
| 34 | Dos turnos con mismo sessionId | Mismo conversation_id; historial reconstruible |
| 35 | Cancelar evento con inscritos | Evento CANCELADO; inscripciones CANCELADA; notificaciones |
| 36 | Logout, después consultar con el token | CERRADA; HTTP 401 al consultar |
| 37 | Desactivar otra cuenta de prueba, intentar login/sesión previa | Cuenta INACTIVO; ambos accesos rechazados |
| 38 | Frontend desde Vercel (etapa posterior) | HTTPS público de n8n, CORS correcto, loading/éxito/error |
| 39 | Exportación desde instancia | Diez nombres obligatorios, sin secretos ni datos fijados |

La prueba de evento lleno debe usar una capacidad pequeña y cuentas de prueba reales para validar todo el recorrido. El fixture `INS_DEMO_LLENO` solo comprueba el cálculo de catálogo; no representa una cuenta Telegram real.

Para fallos de integración, restaura credenciales después de la prueba. No uses tu cuenta principal para simular desactivación ni envíes mensajes a terceros.

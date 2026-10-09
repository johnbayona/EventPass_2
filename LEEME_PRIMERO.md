# EventPass — Extensión del examen

Paquete de cambios para el proyecto del RAR. Conserva una copia de tu carpeta actual. Copia los archivos de frontend/ y scripts/ en las carpetas del mismo nombre; agrega docs/, plantillas/ y tests/wf11.test.cjs. Importa los JSON de n8n/ desde n8n; copiarlos a la carpeta del PC no actualiza el workflow ejecutado.

No contiene credenciales. Requiere una inscripción CONFIRMADA real, un usuario ACTIVO con sesión y Telegram vinculado. Se implementa auto check-in autenticado: cada usuario solo registra su propia inscripción. El enunciado no exige QR ni un rol de portero; no se agregaron.

## Orden de trabajo
1. Crear EP11_Checkin y su pestaña Checkins.
2. Configurar y probar WF09 con Gmail y Telegram reales.
3. Importar WF11 y completar sus IDs/credencial.
4. Aplicar compatibilidad ASISTIO a las exportaciones actuales WF05–07.
5. Probar WF11 por PowerShell: éxito, duplicado, rechazado, evento incorrecto.
6. Probar desde frontend, publicar y exportar desde n8n a GitHub.

Sigue docs/GUIA_EXAMEN.md. El diagnóstico está en docs/DIAGNOSTICO.md. Agrega docs/SECCION_README.md al final de tu README existente.

## Validación local
Desde la carpeta del proyecto con los cambios copiados:
```
node --test tests/wf11.test.cjs
npm test
npm run build
```
Estas pruebas verifican lógica aislada, estructura y frontend; no envían correos ni sustituyen las pruebas de n8n/Google.

## Límite de idempotencia y fallos parciales
La comprobación de historial evita duplicados en solicitudes consecutivas. Google Sheets no ofrece en este diseño una transacción que abarque lectura, cambio de inscripción y registro. Dos solicitudes simultáneas pueden competir: no está garantizada la exclusión entre ejecuciones. La demostración debe hacerse secuencialmente; para uso concurrente queda pendiente un mecanismo compartido de exclusión/serialización verificado. Deshabilitar el botón evita doble clic en esa pantalla, pero no protege otros clientes.

Orden de escritura: actualizar la inscripción, registrar el intento, invocar WF09. Si falla Sheets tras actualizar a ASISTIO, se debe revisar la ejecución: no restablecer CONFIRMADA ni reenviar a ciegas. La siguiente llamada devuelve DUPLICADO con advertencia si falta historial. El administrador debe reconciliar fecha/ID contra la ejecución y completar el registro faltante y aviso de WF09 con clave CHECKIN|inscripcion_id. No se promete recuperación automática ni entrega exactamente una vez.

Si falla Gmail/Telegram, la asistencia sigue guardada y la respuesta marca aviso_pendiente. El examen solo queda verificado cuando ambos canales muestran ENVIADO y los mensajes se reciben. WF09 permite reintentar canales ERROR con la misma clave; un PENDIENTE requiere revisar el proveedor antes de reenviar.

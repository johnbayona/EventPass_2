# Estado del proyecto recibido

Revisión del RAR entregado y de los dos enunciados. No se ha accedido a la instancia n8n ni a las hojas reales. No se asigna un porcentaje: archivos presentes no equivalen a integración verificada.

| Área | Evidencia | Pendiente |
|---|---|---|
| Frontend | Catálogo, cuenta, sesión, perfil, Telegram, inscripciones y chat implementados; 13 pruebas locales pasan y build funciona | Probar contra endpoints reales y Vercel |
| WF01–03 | Plantillas y exportaciones personalizadas coexistentes | Consolidar la última exportación funcional de cada workflow |
| WF02 personalizado | JSON inválido: escape incorrecto en línea 138 | Exportar nuevamente desde n8n; no reconstruir el hash a mano |
| WF04 | Existe plantilla con configuración pendiente y require('crypto') | El archivo no acredita la configuración actual de tu instancia |
| WF05 | Copia personalizada activa y plantilla antigua distintas | Exportar la copia que funciona usando el nombre obligatorio |
| WF06 | Plantilla del RAR contiene require('crypto') y configuración pendiente | Conservar la versión corregida que trabajábamos y completar pruebas reales |
| WF07–08 | Lógica de FIFO y recordatorios presente | IDs, credenciales, WF09, ejecución real y compatibilidad ASISTIO |
| WF09 | Diseño por canal, registro y control de repetición presentes | IDs, Gmail, Telegram; corregir dependencia crypto y lecturas repetidas |
| WF10 | Workflow presente | Configuración, modelo, persistencia y prueba de solo lectura |
| Entrega | README, scripts, pruebas y vercel.json presentes | GitHub, URL pública y exportaciones actuales verificadas |

Los diez JSON con nombres canónicos contienen diez marcadores REEMPLAZAR cada uno (configuración común). Esto no significa que todos sean usados por cada workflow, pero sí que son plantillas, no exportaciones finales listas. El test global de workflows se detiene en el JSON inválido de WF02; no se declara aprobado.

## Desajuste con el enunciado base
El documento exige seis eventos en al menos tres categorías. Se había decidido una sola categoría Emprendimiento. Mantener el tema de emprendimiento y usar Educación, Networking y Emprendimiento es una opción compatible con el texto literal. Si se desea una sola categoría, hace falta aceptación del docente. No se cambió esa decisión silenciosamente en este paquete.

## Riesgo de integración introducido por ASISTIO
WF05, WF06 y WF07 calculan ocupación desde CONFIRMADA. Si una persona pasa a ASISTIO, no debe liberarse una plaza. Contar CONFIRMADA + ASISTIO en ocupación es una adaptación de la fórmula del proyecto base necesaria para el examen. WF06 debe bloquear una nueva inscripción del mismo usuario/evento si ya ASISTIO, sin permitir editar ni cancelar ASISTIO. WF08 debe seguir enviando recordatorios solo a CONFIRMADA. El asistente debe reconocer ASISTIO como asistencia registrada.

## Límite de la entrega
Este ZIP es una extensión integrable, no una certificación del proyecto completo ni un despliegue realizado. El estado real más avanzado puede estar en n8n y no dentro del RAR. No reemplaces workflows funcionales por las plantillas antiguas. El examen se prioriza; terminar WF01–10 será la fase posterior.

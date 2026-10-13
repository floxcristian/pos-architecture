# Asistente de la propuesta

El botón **Asistente** permite preguntar por la arquitectura sin abandonar el curso. Recibe la lámina actual y recupera fragmentos de las 88 láminas, sus notas, el guion del narrador, los laboratorios, el glosario y la propuesta escrita. Las fuentes de cada respuesta abren las láminas, el glosario o el documento. Abrirlo pausa la narración; cerrarlo devuelve el foco al botón. **Leer / Presentar** son botones que conservan la lámina actual al cambiar de modo.

La integración está preparada para OpenAI Responses. El modelo se elige en la configuración del servidor; no está fijado en el cliente. Sin configuración, el diálogo informa que el asistente todavía no está conectado y deshabilita el envío. No se simulan respuestas de un LLM.

## Activar en Vercel

El proyecto debe usar la raíz del repositorio, `npm ci`, Node.js 22 y el `vercel.json` versionado. La presentación sigue en `public/`; Vercel publica adicionalmente la función `api/assistant.mjs`. No hace falta crear otro proyecto.

1. En **Firewall → Configure → Add Rule** del proyecto, crea una regla con condición **@vercel/firewall** y un ID dedicado, por ejemplo `pos-assistant`. Configura **Rate Limit**, ventana de 60 segundos, máximo de 6 solicitudes por IP y acción de bloqueo. Publica los cambios: el modo de solo registro no limita las consultas. El ID vincula la regla con el SDK; no añadas condiciones `Request Path = /api/assistant` o `Method = POST`, porque la comprobación del SDK usa una ruta interna diferente. Sigue la [guía oficial del SDK de límites](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk).
2. Crea una clave de proyecto del proveedor y elige un modelo que admita **Responses API y Structured Outputs**. Revisa los límites de uso y presupuesto de ese proyecto. Un límite por IP reduce consultas repetidas, pero no representa un límite global de gasto. Las claves se administran en el proveedor y Vercel, nunca dentro de la presentación ni en Git.
3. En **Settings → Environment Variables** configura, para Production:

   | Variable | Valor |
   | --- | --- |
   | `OPENAI_API_KEY` | Clave secreta del proyecto de OpenAI |
   | `OPENAI_MODEL` | ID del modelo elegido, compatible con Responses y JSON Schema estricto |
   | `POS_ASSISTANT_RATE_LIMIT_ID` | ID exacto publicado en el paso 1, por ejemplo `pos-assistant` |
   | `POS_ASSISTANT_ENABLED` | `true`, después de configurar proveedor y regla |
   | `NODE_ENV` | `production`, necesario para que el SDK compruebe el límite |

   Habilita **Automatically expose System Environment Variables** en el proyecto para disponer de `VERCEL=1`. No se presupone que una función sin framework reciba automáticamente `NODE_ENV`: por eso se configura explícitamente. Consulta las [variables de sistema de Vercel](https://vercel.com/docs/environment-variables/system-environment-variables).

4. Vuelve a desplegar. Desde la presentación, abre **Asistente**, pregunta «¿Por qué usamos RabbitMQ y BullMQ?» y comprueba que la respuesta distingue mensajería entre servicios de trabajos locales, con enlaces a fuentes. No basta con que el estado de configuración indique disponibilidad: la primera pregunta verifica también la regla y el proveedor.

El endpoint de configuración devuelve únicamente disponibilidad y un mensaje, nunca valores de las variables. Una regla ausente, un error del SDK o un tiempo de espera impiden llamar al LLM. Un límite alcanzado responde HTTP 429. El servidor no reintenta automáticamente peticiones al proveedor.

Para desactivar las consultas, cambia `POS_ASSISTANT_ENABLED` a `false` y vuelve a desplegar. El resto de la presentación y el narrador siguen disponibles. En vistas Preview protegidas, consulta los requisitos de bypass y exposición de variables de sistema del SDK antes de activarlo. La previsualización local permanece deshabilitada deliberadamente: las pruebas usan dobles explícitos y no evitan el control de producción.

## Contexto y límites

`build-assistant-context.cjs` genera `server/assistant/corpus.json` exclusivamente desde archivos públicos permitidos. No lee clones corporativos, credenciales, otras conversaciones ni bases de datos. La recuperación usa coincidencias de texto en español, prioriza la lámina actual e incluye la propuesta como autoridad. Selecciona hasta ocho fuentes y 18.000 caracteres; no envía todos los documentos en cada pregunta. Se regenera en cada build.

La pregunta, las últimas preguntas y respuestas que caben en el límite, y los fragmentos recuperados se envían al proveedor. La conversación del navegador vive solo en memoria: recargar o pulsar **Vaciar conversación** la elimina de esa pestaña. El servidor no implementa persistencia de chats ni registra sus contenidos. `store: false` desactiva el almacenamiento de la respuesta para su recuperación por API; no equivale a una garantía de retención cero por parte del proveedor.

La respuesta usa un esquema estricto con texto e IDs de fuentes. El servidor valida esos IDs y devuelve URLs de su catálogo; el navegador solo admite láminas conocidas, el glosario y la propuesta escrita. El texto del modelo se renderiza como texto y elementos permitidos, nunca como HTML. No hay herramientas, ejecución de código, navegación web ni acceso a sistemas del POS. Los ejemplos de código son educativos. La selección de fuentes y las instrucciones ayudan a fundamentar respuestas, pero no garantizan ausencia de errores: hay que contrastarlas con las fuentes.

Cada consulta admite 2.000 caracteres, hasta 12 mensajes previos y 12.000 caracteres de historial; el cuerpo HTTP admite 24 KiB. La respuesta tiene un máximo de 1.200 tokens de salida, 25 segundos de espera y 8.000 caracteres validados. **Detener**, cerrar el diálogo o navegar cancela la consulta del cliente; la señal se propaga al proveedor cuando la plataforma lo permite. Una cancelación puede llegar después de que el proveedor ya haya procesado tokens.

Referencias: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), [funciones Node.js de Vercel](https://vercel.com/docs/functions/runtimes/node-js), [límites de Vercel WAF](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

## Verificar y mantener

```powershell
npm ci
node presentation/tools/build-assistant-context.cjs
node presentation/tools/check-assistant-context.cjs
node --test presentation/tools/check-assistant-api.cjs
node presentation/tools/build-vercel.cjs
node presentation/tools/check-assistant.cjs
```

La suite de API comprueba validación, origen, límites, cancelación, errores del proveedor y formato de respuesta con dobles de red: no consume un LLM. La suite del navegador usa el endpoint real deshabilitado para disponibilidad y respuestas controladas para los flujos de conversación. `check-assistant.cjs URL --smoke` comprueba el despliegue sin enviar consultas reales. Estas pruebas no acreditan la conexión con un modelo, ni la eficacia de la regla publicada; eso requiere la comprobación del paso 4.

El ZIP de documentos conserva la presentación para lectura. El asistente necesita la función de Vercel y no funciona abriendo un archivo `file://`. La narración también conserva su propio mecanismo de publicación de audio.

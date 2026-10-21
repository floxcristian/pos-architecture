# POS Platform: presentación web interactiva

Recorrido de ocho capítulos en español sobre la arquitectura actual de Chile y la propuesta de una plataforma POS corporativa reutilizable entre países. El núcleo común, la configuración, las extensiones y el gobierno permiten adaptarla; la continuidad offline es uno de sus requisitos.

La [documentación Starlight](https://pos-platform-tau.vercel.app/guide/) y los modelos técnicos pertenecen a **pos-platform**. Este repositorio mantiene las diapositivas, las simulaciones, los guiones y sus controles. `documentation.snapshot.json` es un derivado de una revisión limpia del producto, con hashes y mapa de enlaces; permite construir la presentación sin compilar Starlight ni acceder a otro checkout. El [procedimiento de actualización](../README.md#actualizar-la-referencia-técnica) explica cómo importar otra revisión y revisar sus síntesis.

## Abrir

### Propuesta en Reveal.js

Entrada: **[pos-corporativo-reveal.html](pos-corporativo-reveal.html)**. En producción: **[propuesta de arquitectura POS Platform](https://presentation-gamma-rust.vercel.app/reveal)**. Presenta el producto multipaís, la arquitectura recomendada, los contratos y la operación mediante 51 láminas, ocho capítulos, siete simulaciones, 17 escenarios y 97 pasos. Las decisiones se acompañan de diagramas del POS, código aplicado y un glosario de consulta de 66 términos. El bloque de precios desarrolla espejo local, cálculo versionado, eventos, snapshot con watermark, candidata aislada, validación, publicación atómica y vigencias.

- **Navegación:** en modo Presentar se usa la cruceta nativa de Reveal.js, con las direcciones disponibles en cada lámina: ← / → cambian de capítulo; ↑ / ↓ recorren las láminas y fragmentos del capítulo actual. Las teclas de flecha siguen ese mismo comportamiento, incluso después de pulsar un control. En los ejemplos de código, las flechas recorren primero los bloques resaltados antes de salir de la lámina. Espacio recorre toda la presentación en orden, incluidos los bloques resaltados del código; Mayús + Espacio retrocede. Av Pág / Re Pág pasan directamente a la siguiente / anterior lámina sin detenerse en fragmentos. El pie reserva espacio para que las flechas no cubran contenido ni el narrador. En modo Leer, los botones Anterior / Siguiente y ← / → recorren las láminas del documento; ↑ / ↓ conservan su desplazamiento nativo. Índice (`O`) abre cualquier tema.
- **Notas (`N`) y glosario (`G`):** explicaciones para quien presenta, decisiones, límites y fuentes. Se abren en la misma página, con navegación por teclado.
- **Laboratorios:** elige escenario y usa Paso, Reproducir/Pausar o Reiniciar. La reproducción se detiene al cambiar de lámina, abrir un diálogo u ocultar la pestaña. Nunca conecta infraestructura ni ejecuta los snippets.
- **Lectura:** el botón Leer / Presentar conserva la lámina actual y cambia a documento continuo. En pantallas menores de 700 px se activa por defecto; `?lectura=0` fuerza presentación y `?lectura=1` lectura. Los laboratorios funcionan en ambos modos. Las preferencias de movimiento reducido se respetan.
- **Fuentes:** las vistas C4 representan contexto, aplicaciones y componentes del POS propuesto; cada una permite descargar el Excalidraw completo. El código muestra contratos y pseudocódigo de los flujos propuestos, sin acreditar una implementación productiva.

### Asistente para preguntas

El botón **Asistente** abre una conversación sobre la lámina actual y la arquitectura de la propuesta, con enlaces a las fuentes. Incluye preguntas sugeridas, historial de la sesión y cancelación. Abrirlo pausa el narrador. La conexión se realiza desde una función de Vercel; las claves nunca se envían al navegador. Sin proveedor y protección configurados, el diálogo informa que todavía no está conectado. Consulta [Activar y mantener el asistente](tools/assistant-setup.md).

### Modo narrador

En la presentación pública, pulsa **Narrador** para escuchar la explicación en español desde la lámina actual. La voz es sintética y desarrolla las decisiones, el funcionamiento y los límites de la propuesta por fragmentos. Cada fragmento señala las tarjetas, componentes y relaciones explicados; las simulaciones cambian al escenario y paso correspondiente al relato.

El guion cubre las 51 láminas, incluidos los 97 estados de simulación. El reproductor muestra la duración y el progreso de la explicación actual.

Puedes pausar, repetir la lámina, saltar entre fragmentos, buscar un instante o cambiar la velocidad. El texto de lo que se está narrando aparece en el panel. **Avance automático** continúa a la siguiente lámina; desmárcalo para detenerte al terminar cada una. Cambiar manualmente de lámina carga su explicación en pausa. Abrir un diálogo, manipular un laboratorio u ocultar la pestaña también pausa la voz; para continuar hay que pulsar Reproducir. En modo lectura, desplazarte manualmente por el contenido pausa la narración. No se reproduce nada al abrir la página.

La narración usa MP3 estáticos del mismo despliegue, sin cuentas, tokens ni llamadas a un servicio de voz desde el navegador. El guion está en `pos-reveal-narration-content.js`; las duraciones y marcas de audio, en `pos-reveal-narration-audio.js`; el reproductor, en `pos-reveal-narrator.js`. El build verifica el ZIP y cada MP3 antes de publicarlos. La guía [Generar y publicar narración](tools/narration-pipeline.md) explica cómo actualizar la voz cuando cambia el guion.

Para probar narración local, primero ejecuta `node presentation/tools/build-vercel.cjs` y después `node presentation/tools/serve-public.cjs`; abre `http://127.0.0.1:4199/reveal`. El servidor ligero de fuentes y el ZIP de documentos no incluyen los MP3; son apropiados para revisar el contenido visual. `node presentation/tools/check-narrator.cjs` comprueba audio real, sincronización, interacción y diseño adaptable sobre el build. El video anterior se conserva como material histórico; la explicación guiada actual vive en Reveal.js.

Se inspiró en la organización por capítulos de [Integration Platform detallada](https://integration-presentations.vercel.app/architecture/enterprise-integration-platform-detailed.html#/), manteniendo las decisiones propias del POS. Reveal.js 5.1.0 y Highlight se distribuyen localmente en `vendor/reveal/`, con licencias, commits de origen y SHA-256. No se necesitan CDNs ni instalación para ver la presentación. `node presentation/tools/vendor-reveal.cjs --check` verifica los ocho archivos oficiales. La misma herramienta, sin `--check`, restaura únicamente esos archivos desde las fuentes fijadas.

El contenido está en `pos-reveal-content.js`, los estados de simulación en `pos-reveal-labs.js`, el render y los controles en `pos-reveal.js`, y el diseño en `pos-reveal.css`. Para verificar: `node presentation/tools/check-reveal.cjs`; admite una URL base como argumento para revisar el despliegue. Reutiliza Playwright de `video/node_modules` o `PLAYWRIGHT_MODULE_PATH`. Las evidencias se guardan en `presentation/qa/reveal/`, fuera de Git.

### Enfoque de la propuesta

El recorrido presenta Angular + Tauri en el puesto, backend modular NestJS/Fastify y PostgreSQL en sucursal y país. Los diagramas describen el POS concreto; las simulaciones muestran confirmación de venta, precios por eventos y lotes, recuperación de entregas, opciones BullMQ/RabbitMQ e integración ERP. La fachada, la ACL y los adaptadores se explican mediante el contrato y los flujos propuestos para ese producto.

El capítulo de código contiene el monorepo completo, sus dominios, dependencias permitidas, verificaciones y releases. Nx organiza ese repositorio; su instalación, comandos y uso operativo quedan fuera del alcance. El cierre reúne observabilidad, recuperación, capacidad y criterios de aceptación del piloto. La autoridad de decisiones es [Propuesta de arquitectura](https://pos-platform-tau.vercel.app/guide/proposal/product/); las recomendaciones de backend, topología y operación siguen sujetas a validación.

### Atlas y materiales anteriores

Abre **[index.html](index.html)** con Edge, Chrome o un navegador moderno. Sus vistas y simulaciones son estáticas; los enlaces de documentación apuntan al sitio canónico del producto y necesitan conexión para consultarse. El explorador no ejecuta servicios corporativos.

También puedes previsualizarla con Node.js:

```powershell
npm run build
npm run preview
```

Abre `http://127.0.0.1:4199/presentation/index.html`. El preview escucha solo en loopback y sirve el artefacto `public/`, con redirecciones de documentación equivalentes a Vercel. Para otro puerto, configura `POS_PUBLIC_PORT`.

Para compartir la revisión publicada, utiliza el enlace de la presentación. Los ZIP de atlas anteriores corresponden a sus revisiones históricas; sus documentos incluidos no sustituyen las fuentes vigentes del producto.

## Desplegar en Vercel

La configuración está en [`vercel.json`](https://github.com/floxcristian/pos-architecture/blob/main/vercel.json). Importa `floxcristian/pos-architecture` desde GitHub y conserva la **raíz del repositorio (`./`)**: allí están el manifiesto de dependencias, el snapshot y las herramientas que ensamblan la presentación y los medios.

| Ajuste | Valor |
| --- | --- |
| Framework Preset | Other |
| Root Directory | `./` |
| Production Branch | `main` |
| Build Command | `node presentation/tools/build-vercel.cjs` |
| Output Directory | `public` |
| Install Command | `npm ci` |
| Variables de entorno | Ninguna para ver o narrar; el asistente requiere [configuración del servidor](tools/assistant-setup.md#activar-en-vercel) |

`vercel.json` define framework, comandos y salida. El build prepara la presentación, sus derivados y los medios verificados; comprueba que correspondan al snapshot fijado. No compila ni publica otra copia de Starlight. Además de los archivos estáticos, Vercel crea la función `/api/assistant`; el corpus de consulta queda en su paquete de servidor, fuera de `public/`. `/` redirige a `/reveal`. Las rutas anteriores `/guide/…` y `/docs/…` redirigen permanentemente al sitio del producto y conservan sus parámetros.

La conexión Git permite desplegar las revisiones publicadas en `main`. La publicación de Starlight y del POS pertenece a la configuración de [pos-platform](https://pos-platform-tau.vercel.app/guide/implementation/deployment/).

Para comprobar la salida localmente: `node presentation/tools/build-vercel.cjs`. `public/` es una carpeta generada e ignorada por Git; el build solo la reemplaza cuando tiene su marcador de generación. El despliegue real y su URL se verifican después de importar el repositorio en la cuenta de Vercel.

### Video público

**https://presentation-gamma-rust.vercel.app/video** abre el video narrado en español con 14 capítulos. «Copiar enlace» copia el enlace público; la opción del instante actual agrega `?t=segundos`. Los enlaces al video también aparecen en el atlas y en la presentación detallada.

El MP4 se conserva en una release pública de `floxcristian/pos-architecture`. Durante el build, Node.js 22+ lo descarga y verifica contra `video/publication.json` antes de incluirlo en `public/media/`. No requiere tokens ni otros servicios. La [guía del video](../video/README.md) explica cómo generar y publicar nuevas revisiones. El servidor ligero `server.cjs` sigue destinado al atlas; para comprobar reproducción y saltos usa la salida de Vercel o `node presentation/tools/check-public-video.cjs` después del build.

## Recorrer la presentación

### Presentación detallada de la propuesta

Abre **[Arquitectura en movimiento](architecture.html)** para un recorrido de 19 diapositivas inspirado en la presentación detallada de Integration Platform. En Vercel también está disponible mediante `/arquitectura`; comparte la publicación de POS Platform y no requiere otro proyecto.

Incluye siete diagramas C4/dinámicos de Excalidraw con zoom y descarga editable, cinco laboratorios con 15 escenarios y 90 pasos, ejemplos breves de código resaltados por paso, índice y notas para exponer. Los casos cubren venta/outbox, ACK perdido, precios por eventos y lotes, BullMQ y RabbitMQ. Los brokers se presentan como opciones centrales; la propuesta base conserva PostgreSQL y entrega HTTPS. Todos los estados son sintéticos y el código mostrado es conceptual e inerte.

Usa Anterior/Siguiente o las flechas para cambiar de diapositiva; `O` abre el índice y `N` las notas. Cada laboratorio permite elegir escenario, avanzar, retroceder, reproducir, pausar y reiniciar. El hash conserva enlaces a diapositiva, caso y paso. No hay reproducción automática al abrir una página; al salir del laboratorio o esconder la pestaña se pausa. Se respeta movimiento reducido y se conserva el relato textual.

El código está en `architecture.html`, `architecture.css`, `architecture.js`, `architecture-content.js` y `architecture-labs.js`. Los pósteres y editables proceden de la [colección canónica del producto](https://pos-platform-tau.vercel.app/guide/diagrams/). Las vistas previas de `architecture-diagrams/` se importan del snapshot mediante `npm run documentation:sync -- --artifact <archivo>`; sus modelos y recortes se generan en pos-platform. No necesita CDN. Verificación: `node presentation/tools/check-architecture.cjs`. La CSP permite `connect-src 'self'` para el asistente de Reveal; las simulaciones siguen sin ejecutar solicitudes a infraestructura.

### Atlas de la situación actual y evolución

- **Exponer:** activa «Modo exposición». Las flechas cambian de capítulo cuando el foco no está en un control.
- **Explorar:** sigue el índice o un enlace directo; abre fichas y fuentes cuando necesites detalle. `G` abre el glosario, `P` alterna exposición y `Esc` cierra ventanas.

| Capítulo | Punto de entrada |
| --- | --- |
| [Ecosistema](index.html#mapa) | Comienza en Vista general. Las pestañas Repositorios, Peticiones y Evidencia permiten cambiar de perspectiva; solo se muestra un panel a la vez. |
| [Venta](index.html#venta) | Comienza en Recorrido de la venta. La pestaña Apertura, cierre e impresión reúne O01/O03. El relato enlaza sus [llamadas](index.html#mapa?flujo=sale), [registro AX](index.html#mapa?flujo=sync) y [tablas](index.html#datos?flujo=D01). |
| [Datos](index.html#datos) | Un único explorador comienza por [maestros D03](index.html#datos?flujo=D03). El selector ofrece también venta/DTE, envío AX, cliente y NC; cada recorrido reúne su contexto y enlaza sus llamadas. |
| [Offline](index.html#offline) | Comienza en Probar una desconexión; Otros fallos y recuperación es otra pestaña. La LAN y el escritor de sucursal permanecen disponibles en el laboratorio. |
| [Propuesta](index.html#propuesta) | Comienza en Arquitectura. Qué cambia, Venta y ERP, Precios y ofertas y Tecnología separan comparación, contratos, caso O02 y reutilización de core/devops-platform. Los enlaces a [venta local](index.html#propuesta?flujo=proposed-sale) y [entrega ERP](index.html#propuesta?flujo=proposed-erp) abren su pestaña y recorrido. |
| [Evolución](index.html#evolucion) | Comienza en Países. Cambio de ERP, Proveedores y equipos, RFID y Despliegue son pestañas independientes; elegir país solo actualiza su ficha. |
| [IA](index.html#ia) | Casos candidatos, alternativas y laboratorio de asistencia con abstención. |
| [Repaso](index.html#repaso) | Veinte situaciones de comprensión, con explicación por respuesta y posibilidad de reintentar; después, decisiones para conversar con el equipo. |

La **[guía del visor](https://pos-platform-tau.vercel.app/guide/reference/explorer/)** es la referencia de controles, modos, conexiones, teclado, zoom y límites. El mapa muestra aplicaciones y datos; «Implementación y código» conserva clases y servicios internos en las fichas. La [matriz de cobertura](https://pos-platform-tau.vercel.app/guide/reference/coverage/) detalla qué se explica y qué requiere abrir un informe.

## Alcance de la evidencia

El tutorial utiliza datos estáticos y ejemplos sintéticos: **no ejecuta un POS, consulta bases ni valida pagos, fiscalidad, radio RFID o garantías productivas**. Las fichas distinguen código, antecedentes, propuesta y pendientes. Algunas fuentes externas requieren Internet y acceso al repositorio; la presentación local no los necesita.

Las capacidades de [proveedores y dispositivos](https://pos-platform-tau.vercel.app/guide/architecture/providers/), [IA](https://pos-platform-tau.vercel.app/guide/architecture/ai/) y [RFID](https://pos-platform-tau.vercel.app/guide/architecture/rfid/) siguen sujetas a sus contratos y pilotos. Una simulación no acredita homologación, un cobro ni un ajuste de inventario. Los [informes por commit](https://pos-platform-tau.vercel.app/guide/evidence/audit/) conservan la evidencia; [CONTENT_NOTES.md](CONTENT_NOTES.md) concentra las reglas editoriales.

## Profundizar sin repetir el recorrido

En Ecosistema, [Vista general](index.html#mapa?vista=general) explica las responsabilidades; [Repositorios](index.html#mapa?vista=repositorios) ubica el código; [Peticiones](index.html#mapa?vista=peticiones) muestra los seis recorridos actuales, sin un acordeón previo; y [Evidencia](index.html#mapa?vista=evidencia) reúne **Rutas**, **Despliegue** y **Fuentes y pendientes**. El inventario completo de componentes se abre bajo demanda en este último modo. En todos los capítulos con pestañas se conservan las selecciones al alternar dentro del capítulo; cada selector pertenece a su vista y no filtra automáticamente las demás.

V01 tiene un único acceso en Evidencia → Despliegue. V02–V06 se consultan en [vistas técnicas](https://pos-platform-tau.vercel.app/guide/evidence/current-state/), sin repetir otra biblioteca de diagramas en pantalla. Los filtros y contadores describen el catálogo seleccionado, no un inventario completo de producción. Los enlaces anteriores `#mapa?flujo=…` siguen abriendo el recorrido solicitado en Peticiones. Las pestañas de cada capítulo admiten `?vista=…`; la guía del visor reúne sus accesos directos y la navegación por teclado.

En Datos, una tabla o aplicación abre su ficha con lecturas/escrituras, campos, esquema y fuentes. D03/D04 integran el contexto de lotes y cliente; D02/D03 incluyen el horario de sincronización. No se repiten en otro resumen. Los cinco diagramas proceden de [recorridos de datos](https://pos-platform-tau.vercel.app/guide/evidence/data-flows/). Los casos de sesión/impresión, precio y actualización están en Venta → Apertura, cierre e impresión; Propuesta → Precios y ofertas; y Evolución → Despliegue. Su evidencia está en [operación y evolución](https://pos-platform-tau.vercel.app/guide/operations/cash-management/).

## Arquitectura C4 de la propuesta

En **Propuesta → Arquitectura** se consultan cinco vistas del mismo modelo: contexto (C1), aplicaciones y bases (C2), componentes del backend de sucursal (C3), componentes del worker de sincronización (C3) y despliegue complementario. El selector mantiene una vista a la vez, con zoom y fichas de responsabilidades, tecnología y datos. La [explicación C4](https://pos-platform-tau.vercel.app/guide/architecture/c4-model/) desarrolla los límites y la [comparación tecnológica](https://pos-platform-tau.vercel.app/guide/architecture/technologies/) explica PostgreSQL frente a MongoDB.

El backend local reside en la sucursal y atiende las cajas por LAN. PostgreSQL conserva las operaciones y el espejo de lectura de precios/ofertas; eventos y cargas masivas programadas o manuales actualizan ese espejo. La pestaña **Precios y ofertas** explica validación, conciliación y activación. Es una propuesta de implementación, no una descripción de servicios ya desplegados.

## Editar el contenido

- `content.js`: fichas, glosario, países, comparaciones, escenarios `providerScenarios`, `rfidScenarios`, `rfidDemo` y `aiCases`, fuentes y ejercicios.
- `technical-data.js`: componentes, endpoints y vacíos del catálogo revisado, con rutas y referencias por commit.
- `technical-ui.js`: rutas, despliegue, fuentes, pendientes y casos límite; sin llamadas a los endpoints catalogados.
- `dataflows-data.js`: cinco recorridos actuales, pasos, tablas, campos y evidencia revisada.
- `dataflows-ui.js`: selector, avance manual, resaltado y fichas del recorrido; no consulta bases reales.
- `interactions-current.js`: recorridos actuales de venta, sincronización, maestros y cliente, con componentes y llamadas concretos.
- `interactions-extensions.js`: recorridos actuales de impresión y NC; conserva sus variantes y ramas independientes.
- `interactions-proposed.js`: venta local y entrega/resultado ERP propuestos; contratos y nombres ilustrativos, sin endpoints productivos inventados.
- `interactions-view-data.js`: agrupa la implementación por aplicación para el diagrama; conserva los originales en las fichas, sin modificar los datos auditados.
- `interactions-ui.js`: renderer nativo HTML/SVG, vistas de componentes/secuencia, selección de pasos y conexiones, zoom, fichas y visor ampliado.
- `interactions.css`: estilos y adaptación del visor de interacciones. Los tres archivos de datos alimentan las mismas vistas; no necesitan regeneración Mermaid.
- `app.js`: capítulos, pasos narrativos y comportamiento de la simulación.
- `c4-data.js` y `diagrams/c4-*.mmd`: derivados de los modelos canónicos de pos-platform, importados desde el snapshot. No se editan aquí. `c4-ui.js` y `c4.css` implementan el visor y sus fichas.
- `style.css`: diseño, adaptación a pantallas y accesibilidad visual.
- `diagrams/*.mmd`: fuentes conceptuales y derivados documentales. Las familias C4 se sincronizan desde el producto; las demás conservan la revisión histórica del explorador.
- `diagrams.js`: SVG previamente generados; la presentación no carga Mermaid en ejecución. La interfaz muestra los diagramas y sus fichas, sin botones para ver o descargar su código; las fuentes `.mmd` se conservan para mantenimiento.

Para actualizar el modelo C4, importar un artefacto de documentación generado desde una revisión limpia del producto:

```powershell
npm run documentation:sync -- --artifact <ruta-al-documentation.snapshot.json>
npm run documentation:check
```

La autoría y el render de los modelos están en [tools/diagrams del producto](https://github.com/floxcristian/pos-platform/tree/main/tools/diagrams). El runtime de la presentación muestra SVG locales; no carga Mermaid ni necesita CDN.

Los cinco derivados históricos `diagrams/technical-*.mmd` proceden de V01–V05 de las [vistas técnicas](https://pos-platform-tau.vercel.app/guide/evidence/current-state/). La navegación expone V01 en Despliegue y enlaza V02–V06 al documento; conservar un recurso generado no implica otra vista en pantalla. Un cambio semántico se revisa primero en la fuente canónica y después en el recorrido que lo sintetiza.

Los cinco `diagrams/dataflow-*.mmd` conservan D01–D05 de los [recorridos de datos](https://pos-platform-tau.vercel.app/guide/evidence/data-flows/). Sus IDs deben corresponder con `dataflows-data.js`. Son representaciones de la evidencia revisada, no nuevas fuentes de arquitectura.

## Verificar

Las comprobaciones se ejecutan sobre el tutorial local. Guardan los resultados y capturas de la ejecución en `qa/`; documentar un comando no significa que esa versión haya pasado.

```powershell
npm run documentation:check
npm run check:assistant-api
npm run build
node presentation/tools/check-presentation.cjs
node presentation/tools/check-c4.cjs
node presentation/tools/check-interactions.cjs
node presentation/tools/check-operations.cjs
node presentation/tools/check-repositories.cjs
```

Cubren enlaces, Mermaid, referencias de datos, interacciones, teclado, tamaños de pantalla y apertura `file://` según cada script. La [guía del visor](https://pos-platform-tau.vercel.app/guide/reference/explorer/#criterios-de-verificación-del-visor) desarrolla sus criterios; la [matriz de cobertura](https://pos-platform-tau.vercel.app/guide/reference/coverage/) conserva el alcance editorial. Los servidores temporales de QA usan loopback; no se conectan a servicios corporativos. Estas pruebas no sustituyen una auditoría formal de accesibilidad ni pruebas del POS real.

`operations-data.js` conserva casos y evidencia; `operations-ui.js` los presenta. Sus ocho derivados históricos `operation-*.mmd` representan [operación y evolución](https://pos-platform-tau.vercel.app/guide/operations/cash-management/), en orden O01–O04, actual/propuesto. La fuente canónica se edita en el producto; no se mantienen contratos alternativos en esos derivados.

## Decisiones de diseño

Se aplicaron las guías de `ui-ux-pro-max` para teclado, foco, divulgación progresiva, contraste y movimiento controlado, junto con criterios narrativos de la skill `Presentations`. La búsqueda con `find-skills` encontró Slidev y otras opciones HTML. Se eligió una implementación estática propia para combinar capítulos guiados y exploración libre, mantener los mapas interactivos y permitir abrirla sin instalar herramientas.

Las recomendaciones automáticas de estilo que no correspondían al público se descartaron. El diseño usa una familia de fuentes del sistema, jerarquía tipográfica, fondo claro y verde oscuro; el color acompaña etiquetas y estados escritos. No incorpora fotos, ilustraciones decorativas ni telemetría.

Referencias de herramientas: [Mermaid: uso y renderizado](https://mermaid.js.org/config/usage) y [Slidev, alternativa evaluada](https://skills.sh/slidevjs/slidev/slidev).

## Mapa de repositorios

La pestaña Repositorios de Ecosistema muestra seis repositorios del POS actual y diez relaciones seleccionadas. Se ajusta automáticamente al ancho disponible, sin control de zoom manual. Propuesta → Tecnología concentra las fichas de core/devops-platform y la evidencia de su relación de CI/CD; estas tarjetas no aparecen en Ecosistema ni se repiten en Evolución. Sus relaciones no acreditan tráfico productivo ni despliegues. [Mapa documental y fuentes](https://pos-platform-tau.vercel.app/guide/evidence/repositories/). `repositories-data.js` conserva los ocho repositorios de software y las once relaciones; `repositories-ui.js` y `repositories.css` los presentan en el capítulo correspondiente.

# POS Atlas: presentación web interactiva

Recorrido de ocho capítulos en español para presentar al equipo y explorar individualmente la arquitectura actual de Chile y la propuesta para Chile, Perú y España.

## Abrir

Abre **[index.html](index.html)** con Edge, Chrome o un navegador moderno. No requiere instalación, compilación, conexión a Internet ni servicios corporativos. Conserva esta carpeta junto a `../docs/` para que funcionen las fuentes.

También puedes previsualizarla con Node.js:

```powershell
node presentation/server.cjs
```

Abre `http://127.0.0.1:4173`. El servidor escucha solo en loopback y expone la presentación y `docs/`; no sirve los clones de la empresa. Para otro puerto, configura `POS_ATLAS_PORT`.

Para compartir, entrega `dist/pos-atlas.zip`, extráelo y abre `pos-atlas/presentation/index.html`. Incluye las fuentes documentales; no incluye los clones corporativos ni las capturas de QA. Se regenera con Python 3: `python presentation/tools/package-presentation.py` desde la raíz del proyecto.

## Desplegar en Vercel

La configuración está en [`vercel.json`](https://github.com/floxcristian/pos-architecture/blob/main/vercel.json). Importa `floxcristian/pos-architecture` desde GitHub en **Add New → Project** y conserva la **raíz del repositorio (`./`)**. No elijas `presentation/` como raíz: también se necesitan los documentos de `docs/`.

| Ajuste | Valor |
| --- | --- |
| Framework Preset | Other |
| Root Directory | `./` |
| Production Branch | `main` |
| Build Command | `node presentation/tools/build-vercel.cjs` |
| Output Directory | `public` |
| Install Command | Vacío; no requiere instalar dependencias |
| Variables de entorno | Ninguna |

`vercel.json` define framework, comandos y salida. El build prepara los archivos estáticos, documentos originales y JSON de evidencia enlazados. No publica los clones, QA, herramientas ejecutables ni el servidor local. `/` redirige a `/presentation/index.html`, conservando las rutas relativas y los capítulos por hash. Los documentos Markdown se sirven como archivos de texto, igual que en la previsualización local; no se transforman en páginas HTML.

Tras **Deploy**, Vercel asigna una URL al proyecto; un dominio propio es opcional. La conexión Git permite desplegar nuevas versiones al actualizar `main`. Para uso corporativo, utiliza un plan que admita ese uso: Hobby está limitado a uso personal no comercial. Referencias oficiales: [configuración de build](https://vercel.com/docs/builds/configure-a-build), [integración Git](https://vercel.com/docs/git) y [alcance de Hobby](https://vercel.com/docs/plans/hobby).

Para comprobar la salida localmente: `node presentation/tools/build-vercel.cjs`. `public/` es una carpeta generada e ignorada por Git; el build solo la reemplaza cuando tiene su marcador de generación. El despliegue real y su URL se verifican después de importar el repositorio en la cuenta de Vercel.

## Recorrer la presentación

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

La **[guía del visor](../docs/visor-interacciones-componentes.md)** es la referencia de controles, modos, conexiones, teclado, zoom y límites. El mapa muestra aplicaciones y datos; «Implementación y código» conserva clases y servicios internos en las fichas. La [matriz de cobertura](../docs/cobertura-documentacion-presentacion.md) detalla qué se explica y qué requiere abrir un informe.

## Alcance de la evidencia

El tutorial utiliza datos estáticos y ejemplos sintéticos: **no ejecuta un POS, consulta bases ni valida pagos, fiscalidad, radio RFID o garantías productivas**. Las fichas distinguen código, antecedentes, propuesta y pendientes. Algunas fuentes externas requieren Internet y acceso al repositorio; la presentación local no los necesita.

Las capacidades de [proveedores y dispositivos](../docs/extensibilidad-proveedores-dispositivos.md), [IA](../docs/servicios-ia-pos.md) y [RFID](../docs/evolucion-rfid-autoservicio.md) siguen sujetas a sus contratos y pilotos. Una simulación no acredita homologación, un cobro ni un ajuste de inventario. Los [informes por commit](../docs/analisis-repositorios/README.md) conservan la evidencia; [CONTENT_NOTES.md](CONTENT_NOTES.md) concentra las reglas editoriales.

## Profundizar sin repetir el recorrido

En Ecosistema, [Vista general](index.html#mapa?vista=general) explica las responsabilidades; [Repositorios](index.html#mapa?vista=repositorios) ubica el código; [Peticiones](index.html#mapa?vista=peticiones) muestra los seis recorridos actuales, sin un acordeón previo; y [Evidencia](index.html#mapa?vista=evidencia) reúne **Rutas**, **Despliegue** y **Fuentes y pendientes**. El inventario completo de componentes se abre bajo demanda en este último modo. En todos los capítulos con pestañas se conservan las selecciones al alternar dentro del capítulo; cada selector pertenece a su vista y no filtra automáticamente las demás.

V01 tiene un único acceso en Evidencia → Despliegue. V02–V06 se consultan en [vistas técnicas](../docs/vistas-arquitectura-y-flujos.md), sin repetir otra biblioteca de diagramas en pantalla. Los filtros y contadores describen el catálogo seleccionado, no un inventario completo de producción. Los enlaces anteriores `#mapa?flujo=…` siguen abriendo el recorrido solicitado en Peticiones. Las pestañas de cada capítulo admiten `?vista=…`; la guía del visor reúne sus accesos directos y la navegación por teclado.

En Datos, una tabla o aplicación abre su ficha con lecturas/escrituras, campos, esquema y fuentes. D03/D04 integran el contexto de lotes y cliente; D02/D03 incluyen el horario de sincronización. No se repiten en otro resumen. Los cinco diagramas proceden de [recorridos de datos](../docs/recorridos-datos-tablas.md). Los casos de sesión/impresión, precio y actualización están en Venta → Apertura, cierre e impresión; Propuesta → Precios y ofertas; y Evolución → Despliegue. Su evidencia está en [operación y evolución](../docs/operacion-caja-y-evolucion.md).

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
- `style.css`: diseño, adaptación a pantallas y accesibilidad visual.
- `diagrams/*.mmd`: fuentes conceptuales y copias documentales; las familias generadas se editan en su documento de origen, indicado abajo.
- `diagrams.js`: SVG previamente generados; la presentación no carga Mermaid en ejecución. La interfaz muestra los diagramas y sus fichas, sin botones para ver o descargar su código; las fuentes `.mmd` se conservan para mantenimiento.

Para regenerar diagramas, se necesita Playwright con Chromium instalado. Configura `PLAYWRIGHT_MODULE_PATH` si no está disponible como módulo local:

```powershell
node presentation/tools/render-diagrams.cjs
```

Se conserva Mermaid 11.12.0 y su licencia MIT en `tools/vendor/`. El generador utiliza ese archivo local, sin CDN. El runtime de la presentación usa HTML, CSS y JavaScript sin dependencias externas.

Las cinco fuentes `diagrams/technical-*.mmd` proceden de V01–V05 en `docs/vistas-arquitectura-y-flujos.md`. El documento contiene seis bloques; `tools/sync-technical-diagrams.cjs` comprueba esa estructura al regenerar. La navegación expone V01 en Despliegue y enlaza V02–V06 al documento; conservar un recurso generado no implica otra vista en pantalla.

Los cinco `diagrams/dataflow-*.mmd` se copian de D01–D05 en `docs/recorridos-datos-tablas.md`. Edita ese documento para cambiar sus diagramas; `tools/sync-dataflow-diagrams.cjs` comprueba que conserve exactamente cinco bloques. El generador también ejecuta esta importación. Los IDs de nodos deben coincidir con `dataflows-data.js`.

## Verificar

Las comprobaciones se ejecutan sobre el tutorial local. Guardan los resultados y capturas de la ejecución en `qa/`; documentar un comando no significa que esa versión haya pasado.

```powershell
node presentation/tools/check-documents.cjs
node presentation/tools/check-presentation.cjs
node presentation/tools/check-interactions.cjs
node presentation/tools/check-operations.cjs
node presentation/tools/check-repositories.cjs
```

Cubren enlaces, Mermaid, referencias de datos, interacciones, teclado, tamaños de pantalla y apertura `file://` según cada script. La [guía del visor](../docs/visor-interacciones-componentes.md#criterios-de-verificación-del-visor) desarrolla sus criterios; la [matriz de cobertura](../docs/cobertura-documentacion-presentacion.md) conserva el alcance editorial. Los servidores temporales de QA usan loopback; no se conectan a servicios corporativos. Estas pruebas no sustituyen una auditoría formal de accesibilidad ni pruebas del POS real.

`operations-data.js` conserva casos y evidencia; `operations-ui.js` los presenta. Sus ocho diagramas `operation-*.mmd` se extraen de [operación y evolución](../docs/operacion-caja-y-evolucion.md) mediante `tools/sync-operation-diagrams.cjs`, en orden O01–O04, actual/propuesto. No editar las copias generadas.

## Decisiones de diseño

Se aplicaron las guías de `ui-ux-pro-max` para teclado, foco, divulgación progresiva, contraste y movimiento controlado, junto con criterios narrativos de la skill `Presentations`. La búsqueda con `find-skills` encontró Slidev y otras opciones HTML. Se eligió una implementación estática propia para combinar capítulos guiados y exploración libre, mantener los mapas interactivos y permitir abrirla sin instalar herramientas.

Las recomendaciones automáticas de estilo que no correspondían al público se descartaron. El diseño usa una familia de fuentes del sistema, jerarquía tipográfica, fondo claro y verde oscuro; el color acompaña etiquetas y estados escritos. No incorpora fotos, ilustraciones decorativas ni telemetría.

Referencias de herramientas: [Mermaid: uso y renderizado](https://mermaid.js.org/config/usage) y [Slidev, alternativa evaluada](https://skills.sh/slidevjs/slidev/slidev).

## Mapa de repositorios

La pestaña Repositorios de Ecosistema muestra seis repositorios del POS actual y diez relaciones seleccionadas. Se ajusta automáticamente al ancho disponible, sin control de zoom manual. Propuesta → Tecnología concentra las fichas de core/devops-platform y la evidencia de su relación de CI/CD; estas tarjetas no aparecen en Ecosistema ni se repiten en Evolución. Sus relaciones no acreditan tráfico productivo ni despliegues. [Mapa documental y fuentes](../docs/mapa-repositorios-y-conexiones.md). `repositories-data.js` conserva los ocho repositorios de software y las once relaciones; `repositories-ui.js` y `repositories.css` los presentan en el capítulo correspondiente.

# Modelo C4 de la arquitectura propuesta del POS

Fecha de revisión: 5 de octubre de 2026. Alcance: arquitectura de referencia para Chile, Perú y España; no certifica software, topología ni integraciones desplegadas.

La [propuesta y sus decisiones](propuesta-arquitectura.md) gobiernan la recomendación. Estas vistas explican sus límites, procesos y responsabilidades. **Angular + Tauri es la dirección de cliente aceptada**. NestJS + Fastify, PostgreSQL, procesos de sincronización y organización de despliegue son recomendaciones para implementar y validar, no afirmaciones sobre la solución actual. La evidencia de hoy se conserva en el [catálogo de integraciones](catalogo-integraciones-actuales.md).

## Niveles y alcance

La [galería de Excalidraw](diagramas-excalidraw/index.html) ofrece estas cinco vistas y dos dinámicas complementarias, con diagramas nativos editables, leyendas, responsabilidades, condiciones de fallo y fuentes. Incluye un [atlas completo](diagramas-excalidraw/00-atlas-completo.excalidraw) y un [paquete descargable](diagramas-excalidraw/diagramas-c4-excalidraw.zip). La [guía de edición](diagramas-excalidraw/README.md) explica cómo abrir y mantener la colección.

C4 distingue contexto, contenedores, componentes y código. No exige producir los cuatro niveles: deben aportar valor al diseño. En esta propuesta se desarrollan C1, C2 y dos ampliaciones C3. No hay suficiente diseño de implementación para dibujar clases como si ya estuvieran aprobadas. [Definición oficial de las vistas](https://c4model.com/diagrams).

| Vista | Pregunta | Alcance | Fuente editable |
| --- | --- | --- | --- |
| C1 · Contexto | ¿Quién usa el POS y con qué sistemas se relaciona? | Un sistema y su entorno | [c4-context.mmd](../presentation/diagrams/c4-context.mmd) |
| C2 · Contenedores | ¿Qué aplicaciones, procesos y datos lo componen? | Interior del POS corporativo, con colaboradores externos | [c4-containers.mmd](../presentation/diagrams/c4-containers.mmd) |
| C3 · Backend | ¿Cómo se organiza el backend local? | **Un proceso** NestJS + Fastify de sucursal | [c4-backend.mmd](../presentation/diagrams/c4-backend.mmd) |
| C3 · Sincronización | ¿Cómo entrega eventos y activa precios? | **Un proceso** de sincronización de sucursal | [c4-sync.mmd](../presentation/diagrams/c4-sync.mmd) |
| Complemento · Despliegue | ¿Dónde se ejecutan las instancias? | Una tienda y su plataforma de país, como referencia | [c4-deployment.mmd](../presentation/diagrams/c4-deployment.mmd) |

Un **contenedor C4** es una aplicación o un almacén de datos. No equivale necesariamente a un contenedor Docker. C2 muestra tecnología, comunicación y reparto de responsabilidades; clustering, failover y servidores pertenecen al despliegue. [Definición oficial de C2](https://c4model.com/diagrams/container).

C3 amplía un solo contenedor. Los componentes interiores del backend no son microservicios: llaman código TypeScript del mismo proceso. Los componentes interiores del sincronizador siguen la misma regla. Los colaboradores fuera del borde conservan su tipo de contenedor o sistema externo. [Definición oficial de C3](https://c4model.com/diagrams/component).

**Despliegue es un diagrama complementario, no “C4 nivel 4”.** Representa instancias en nodos de ejecución. En este caso la infraestructura definitiva, sistema operativo, alojamiento de país y alta disponibilidad siguen pendientes de validación. El nivel cuatro de C4 sería código. [Definición oficial de despliegue](https://c4model.com/diagrams/deployment).

## Notación y lectura

Se usa Mermaid como notación para el modelo C4. Cada bloque arquitectónico lleva nombre, tipo, tecnología y responsabilidad. Las flechas dirigidas identifican al iniciador de la relación y nombran propósito/protocolo; una respuesta pertenece a ese mismo contrato. Los bordes discontinuos delimitan sistema, proceso o nodo según su título. Esta elección sigue el carácter independiente de notación de C4. [Guía oficial de notación](https://c4model.com/diagrams/notation).

- Verde: software del POS. Azul y cilindro: almacén de datos. Gris: sistema externo. Persona: rol humano. Ocre: infraestructura de recuperación.
- En C3, estar dentro de un borde significa compartir proceso, no estar en un clúster de microservicios.
- En despliegue, los bordes son equipos o entornos de ejecución; `x N` representa varios puestos, sin inventar una cantidad de cajas productivas.
- C1 identifica el alcance por el propio bloque POS, sin un segundo rectángulo envolvente. C2 conserva una sola frontera del sistema; la propiedad de puesto, sucursal y país se explicita en nombres, fichas y contratos. Despliegue usa tres nodos al mismo nivel —puestos, servidor de sucursal y plataforma de país— para evitar fronteras anidadas que oculten relaciones.
- LAN: red de sucursal. WAN: conexión a la plataforma de país. ACL: capa anticorrupción que traduce un contrato externo. ACK: acuse de aplicación tras el commit local requerido.
- “Por confirmar”, “condicional” y “por homologar” son límites del diseño. No declaran proveedor, contrato o SDK aprobado.

El visor local muestra C2 inicialmente a 100 %, permite desplazar y ampliar el mapa, y ofrece “Ajustar” para obtener una vista de conjunto. Cada bloque tiene una ficha de responsabilidad, propiedad de datos, continuidad y fuentes. Una lista alternativa incluye los mismos elementos y relaciones. No ejecuta solicitudes a servicios corporativos.

## C1: límites del sistema

El POS permite al cajero operar, al supervisor autorizar/revisar y a operación de plataforma supervisar recuperaciones. Los sistemas externos son la fuente autorizada de maestros/precios, el sistema financiero de cada país y los proveedores de pago/fiscalidad. El contexto no confunde esos sistemas con módulos internos ni con una base única de todos los países. [Propósito del contexto C4](https://c4model.com/diagrams/system-context).

**ERP por país.** Chile: Dynamics AX on-premise. España: Gira, según antecedente confirmado; interfaces y capacidades por validar. Perú: sistema custom, con contrato por relevar. El nodo representa el sistema que corresponda al país observado; no tres ERP dentro de un único proceso ni un adaptador común ya productivo. La migración a un ERP futuro exige preservar destino y versión de operaciones pendientes.

**Maestros y precios.** El propietario debe identificarse por dato y país. No se adjudica automáticamente al ERP ni al backend POS. Deben acordarse publicación, vigencia, correcciones y disponibilidad de deltas/cargas completas. El espejo local no convierte a cada sucursal en autora independiente de precios.

**Pago y fiscalidad.** Son efectos distintos de la confirmación local y de la integración ERP. Un pago incierto no se repite automáticamente; un acuse de sincronización no prueba aceptación fiscal. Operar sin WAN depende de capacidades y políticas validadas, no de disponer de disco local.

## C2: procesos, persistencia y propiedad

| Contenedor | Tecnología recomendada | Responsabilidad y autoridad |
| --- | --- | --- |
| Cliente de caja | Angular + Tauri | Presentación y comandos del operador. No recibe credenciales SQL ni mantiene otra base de ventas por defecto. |
| Puente de periféricos, cuando el SDK lo exige | Proceso nativo a homologar; runtime depende del proveedor | Ejecuta comandos autorizados por backend y conserva evidencia técnica. El cliente transporta identidad y autorización; no inventa otro intento de pago. |
| Backend de sucursal | NestJS + Fastify / Node.js | Monolito modular, escritor de negocio de la tienda. Confirma operación, auditoría y outbox en una transacción. |
| Datos de sucursal | PostgreSQL | Negocio local y estado técnico de sincronización; espejo autorizado de catálogo/precios/promociones. Un primario autorizado compartido por los puestos. |
| Sincronizador de sucursal | Worker TypeScript / Node.js supervisado | Entrega outbox, aplica inbox/cursor y prepara publicaciones locales. Permisos acotados a datos técnicos y espejos; no reescritura libre de ventas. |
| API de país | NestJS + Fastify / Node.js | Recepción autenticada; confirma **inbox + efecto/proyección local + outbox** en un commit antes del ACK de aplicación. Sirve acuses, deltas y versiones publicadas. |
| Workers de país | Workers NestJS / Node.js supervisados | Consume outbox ya confirmada para integración/conciliación, mantiene proyecciones derivadas y publica maestros. No difiere el efecto local exigido antes del ACK. |
| Datos operativos de país | PostgreSQL | Inbox/outbox, proyección, publicaciones versionadas y referencias de integración. No otra autoridad simultánea para editar ventas originadas en tienda. |
| Adaptador ERP / ACL | Proceso TypeScript / Node.js, por contrato de integración | Traducción y conciliación con el sistema del país. Preserva referencias, destino e incertidumbre; capacidades del ERP por confirmar. |

“Un escritor” combina dos reglas: **un primario autorizado de la base por sucursal** y **una autoridad de negocio para cada dato**. No significa una única conexión SQL. El backend escribe negocio; el worker puede escribir su inbox/outbox, cursores, staging y publicaciones bajo un contrato acotado. Si una recepción requiere cambiar negocio local, debe pasar por su caso de uso autorizado; un job genérico no puede modificar dinero arbitrariamente.

El canal sucursal–país parte de **lotes HTTPS durables con identidades, versión de contrato y cursores**. El emisor conserva outbox. El receptor confirma **inbox, efecto local y outbox en la misma transacción antes del ACK de aplicación**; guardar solamente la recepción no basta. RabbitMQ/Kafka no son requisitos iniciales ni sustituyen la atomicidad y deduplicación. Si aparecen necesidades que justifiquen un broker, el contrato de negocio conserva las mismas garantías y límites.

Las flechas hacia proveedores son contratos lógicos: una integración con API remota puede ejecutarse desde backend; una que exige SDK del puesto pasa por el puente homologado. Los mapas no autorizan un salto directo de la UI al proveedor con un importe o permiso nuevo. La devolución de evidencia al backend mantiene la identidad original. [Contratos de periféricos y proveedores](extensibilidad-proveedores-dispositivos.md).

## C3 del backend: módulos de un único proceso

1. **API de comandos** valida entrada e identidad y entrega el contexto a acceso/permisos.
2. **Acceso y permisos** comprueba usuario, puesto, sucursal, vigencia y capacidad operativa; no se limita a ocultar opciones del menú.
3. **Ventas/devoluciones** coordina el caso de uso; **turnos/caja** controla apertura, movimientos y cierre.
4. **Precios/ofertas** calcula desde una versión PostgreSQL local completa, validada e inmutable. Snapshot y deltas construyen candidatas aisladas; no se parchea la activa. La versión aplicada queda asociada a la cotización/venta.
5. **Pagos** y **fiscalidad** gestionan sus propios intentos, referencias y resultados. Su protocolo de recuperación depende de capacidades acreditadas.
6. **Persistencia transaccional** confirma cambios locales, auditoría y outbox juntos. Las llamadas externas no quedan dentro de una transacción SQL abierta.

La separación es de responsabilidades y contratos de código. No se despliega un proceso HTTP por cada bloque. El backend no consulta obligatoriamente el ERP ni un precio remoto al confirmar una venta habilitada para operar sin WAN.

## C3 de sincronización: entrega y activación de precios

**Salida de operaciones.** El planificador admite trabajo según calendario, límites y capacidad. El emisor reclama filas confirmadas de outbox y envía lotes con las mismas identidades en cada reintento. La API de país confirma **inbox + efecto/proyección local + outbox** antes de responder con el ACK de aplicación. Si se pierde el acuse, el reenvío no cambia la identidad: la deduplicación identifica lo ya aplicado. Este ACK local no es el resultado ERP; los workers integran posteriormente el trabajo ya confirmado.

**Entrada incremental.** El receptor consulta cambios y acuses con cursores durables. La deduplicación comprueba identidad, contrato y orden. **Inbox recibida, staging y cursor de recepción** se guardan aparte para recuperar descargas; recibido no significa aplicado. Para maestros/precios, los deltas se aplican sobre **una candidata aislada basada en la versión publicada**, sin modificar la activa ni avanzar el cursor aplicado. La candidata completa pasa por el **validador de publicación**, igual que un snapshot. Descarga y validación pesada ocurren **fuera de la transacción final**. Solo entonces un commit corto confirma **inbox aplicada, efecto/puntero de versión y cursor aplicado** juntos. Huecos, cobertura incompleta o versiones incompatibles impiden publicar y disparan recuperación controlada. No existe un camino directo de deduplicación a activación que salte el validador.

**Carga masiva y recuperación manual.** Ambas usan el mismo pipeline, sin exponer un catálogo incompleto:

1. Obtener manifiesto de versión y **watermark** consistente del origen; no una hora local arbitraria.
2. Descargar porciones recuperables a **staging aislado**, registrando recepción y progreso durable. La versión activa sigue atendiendo las lecturas; no se mantiene una transacción SQL abierta durante descarga y validación.
3. Completar en la candidata los deltas posteriores al watermark según el contrato publicado. El validador comprueba el conjunto resultante: **checksum**, cobertura, referencias, compatibilidad y vigencia.
4. Revalidar precondiciones de la candidata inmutable y activarla mediante un **commit corto de inbox aplicada, efecto/puntero de versión y cursor aplicado/checkpoint**. Un archivo descargado o algunas filas insertadas no habilitan publicación ni avance del cursor aplicado, aunque el progreso recibido esté guardado.
5. Nuevas ventas usan la versión activa. Ventas ya iniciadas mantienen la versión fijada; el catálogo no se cambia debajo de una operación en curso. Retener versiones mientras existan referencias que las necesiten.

Si una carga falla, se conserva la versión anterior **solo mientras su vigencia y política permitan operar**. “Último dato conocido” no significa autorización indefinida. Cargas programadas, deltas y recuperación manual deben tener fuente, autor, resultado, versión y evidencia auditables. El diseño no afirma que los sistemas actuales ya expongan todos estos contratos.

La entrega puede ser al menos una vez; el efecto local se protege mediante restricciones e inbox transaccional. No se promete exactamente una vez para efectos financieros o fiscales externos. Un restore puede retroceder negocio y deduplicación: retención, replay y conciliación deben ensayarse. [Casos adversos de recuperación](revision-resiliencia-datos-pos.md).

## Despliegue complementario y continuidad

Cada puesto ejecuta el cliente y, cuando corresponda, un puente de periféricos. Las cajas comparten por LAN un servidor de sucursal con backend, sincronizador supervisado y PostgreSQL. La plataforma de país contiene API, workers, adaptador ERP y datos aislados por país/entidad legal. El esquema no impone cloud, proveedor, orquestador ni contenedores Docker.

| Situación | Comportamiento objetivo |
| --- | --- |
| Sin WAN, LAN y servidor sanos | Ventas permitidas según versión local, permisos, límites, pago y modalidad fiscal. Outbox conserva pendientes. |
| Sin LAN o backend de sucursal | Se detienen nuevos comandos dependientes. No se crea otra base/escritor de ventas en el puesto. |
| Pago realizado y respuesta perdida | Se preserva identidad y evidencia; se consulta/conciliará si existe esa capacidad. No repetir automáticamente. |
| Plataforma de país o ERP indisponible | Crece atraso observable; se aplica backoff, límites y recuperación, manteniendo separados los estados. |
| Servidor o base restaurados | Se excluye al escritor anterior y se reconstruyen/conciliarán pendientes y resultados. Backup no equivale a failover. |

La autonomía ante pérdida de LAN es **otro perfil** que requiere resolver exclusión, permisos, datos, compensaciones y dispositivos. No forma parte del perfil WAN inicial. La propuesta tampoco acredita RPO/RTO ni alta disponibilidad sin pruebas de recuperación y dimensionamiento.

## Mantenimiento del modelo y del visor

Los cinco `.mmd` enlazados son las fuentes de render. No se duplican como bloques Mermaid en este documento. `presentation/c4-data.js` conserva el catálogo de fichas, vistas, límites, IDs y relaciones accesibles; cada actualización debe mantener correspondencia con las fuentes. `presentation/diagrams.js` es el resultado generado por la herramienta común de render; no se edita a mano.

Contrato de integración:

- `window.POS_C4.views`: `id`, `key`, `level`, `title`, `scope`, `note`, `nodeIds`, `boundaries`, `relationships`.
- `window.POS_C4.nodes`: nombre, estereotipo, tecnología, resumen, detalle, propiedad, continuidad y fuentes por ID estable.
- `window.POS_C4_UI.html()`: construye la sección; `mount({openModal})`: vincula controles y observa cambios de tamaño/visibilidad.
- `destroy()`: retira listeners y observadores antes de reemplazar el capítulo. `refresh()`: recalcula la escala si el contenedor se vuelve visible.
- El visor usa `.c4-viewport` y `data-c4-node`; no participa en el cableado de `.diagram-canvas` del mapa anterior.

La leyenda existe en cada fuente exportable y en el visor. El nodo técnico `legend` pertenece al inventario del render, pero no es una pieza arquitectónica seleccionable. Los SVG locales se publican ya generados; el visor no necesita CDN, motor Mermaid en tiempo de ejecución, cuentas externas ni acceso a servicios corporativos.

Validar tras cada cambio: correspondencia de IDs, flechas/contratos, fronteras de proceso, render sin solapamientos, teclado/zoom/desplazamiento, fichas y enlaces. Las decisiones de negocio y tecnología deben actualizarse primero en la propuesta vigente y luego propagarse a estas vistas.

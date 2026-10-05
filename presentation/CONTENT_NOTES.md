# Criterios editoriales de la presentación interactiva

Contenido preparado el 1 de octubre de 2026 a partir de la documentación del proyecto. `content.js` publica `window.POS_CONTENT` sin dependencias ni llamadas externas. El contenido usa identificadores y ejemplos sintéticos; no incluye datos personales, credenciales ni direcciones de infraestructura.

## Jerarquía de evidencia

- **Observado en código:** existe evidencia en los snapshots auditados. No acredita configuración productiva, ejecución real ni ausencia de caminos alternativos.
- **Informado por el equipo:** antecedente del usuario o de la presentación. Cada ficha indica su origen y límite.
- **Propuesta:** comportamiento deseado, pendiente de decisión y validación.
- **Por confirmar:** falta evidencia suficiente; no mostrar como infraestructura implementada.
- **Referencia histórica:** contexto conservado sin presentarlo como dependencia operativa vigente.

Los enlaces de cada ficha llevan a informes locales que contienen referencias por commit. Las animaciones son modelos didácticos, no una captura de tráfico ni una demostración de garantías ya implementadas.

Los nombres, cabeceras y rótulos de diagramas se escriben directamente: «Servidor de sucursal», «Central», «API de lectura». La procedencia documental se conserva en las fuentes de las fichas, sin añadir atribuciones al documento de origen dentro de los rótulos. Los pendientes de validación se explican en el detalle correspondiente.

## Precisión para diagramas y animaciones

1. **Venta actual:** la ruta revisada hace commit local de la venta y pagos antes de invocar facturación. DTE y registro AX son estados diferentes. No animar DTE como prerrequisito de ese commit actual ni mostrar AX confirmado al recibir un acuse del bus.
2. **Preparado no equivale a confirmado:** las marcas actuales deben explicarse sin traducirlas como una garantía ERP. Un mensaje, su recepción central y su contabilización son etapas distintas.
3. **Maestros:** se ha observado el consumidor local de lotes. Las flechas AX → MPOS → generador central deben representarse como tramo por confirmar; la ubicación de MPOS y un posible job diario no están verificados. El cron local revisado busca maestros cada tres minutos bajo condiciones y también responde a avisos.
4. **RUT:** selección/carga puede refrescar la copia local, complementando lotes. No todo tecleo equivale a ese recorrido ni prueba una escritura en AX. El fallo del refresco puede limpiar la venta en el flujo principal inspeccionado; no es una incidencia productiva reproducida.
5. **Stock:** el usuario aclaró que la caja no maneja stock. No incorporar un decremento o reserva local obligatoria a la animación de venta. El responsable de la reserva externa sigue por precisar.
6. **Orsan:** proveedor vigente de verificación de cheques, confirmado por el usuario el 2 de octubre de 2026; el backend conserva su integración HTTP. Instacheck está fuera de uso y solo se conserva en fuentes históricas, sin ficha entre las piezas actuales.
7. **Outbox/inbox propuestos:** son registros dentro de bases participantes, no necesariamente bases independientes. Guardar negocio + outbox en una transacción; registrar inbox + efecto local en la transacción receptora. Reentregar el mismo evento es admisible; repetir el efecto financiero no lo es. Las llamadas a proveedores necesitan estados e identidad propios.
8. **Perfil offline:** sucursal con WAN caída es el punto de partida. Autonomía por terminal ante caída LAN requiere persistencia y autoridad por caja. No mostrar cambio automático de escritor entre terminal y sucursal.
9. **Simulación offline:** modelar operaciones expresamente permitidas con datos y reglas vigentes. No demostrar “tarjeta aprobada” ni “DTE aprobado” solo por tener una base local. La duración de autonomía no está aprobada.
10. **Stack y plataforma:** Nx y el cliente Angular + Tauri son la dirección indicada por el usuario para el producto. La propuesta recomienda backend NestJS/Fastify y PostgreSQL de sucursal, más PostgreSQL operativo por país; la topología y homologación siguen pendientes de validación. Pino/Sentry y las capacidades de `core` se adoptan selectivamente. Tauri no habilita offline por sí solo. El ERP futuro aún no tiene producto ni calendario aprobados.
11. **Países:** Chile usa Dynamics AX on-premise; Perú, ERP custom; España, **Gira**, confirmado por el usuario. No existe el mismo nivel de evidencia del POS para los tres países.

## Alcance del material didáctico

El glosario se dirige a personas junior: cada entrada explica el concepto con palabras sencillas y un ejemplo concreto. Los ejemplos inventados se identifican como didácticos. Si se menciona un nombre como `documentos`, se aclara que es una tabla SQL; no se presupone que el lector conoce la diferencia entre tabla, fila, colección y documento MongoDB. Los detalles de auditoría —como comprobar el esquema o el servidor real— se mantienen en las fuentes técnicas, sin sustituir la explicación básica del término.

Las preguntas son ejercicios de comprensión con respuesta explicada; no certifican preparación productiva. Las comparaciones preservan las ventajas existentes: base local, backend por sucursal y sincronización en segundo plano. Las propuestas muestran cambios de responsabilidad y garantías, no una sustitución tecnológica total por defecto.

No se han ejecutado aplicaciones ni servicios de la empresa para producir este contenido. Las fuentes originales siguen intactas.

## Ampliación: horarios, mensajería, datos y expansión

La revisión del 01-10-2026 agrega el horario informado de Chile (L–V 07:00–22:00; sábado 07:00–16:00) y mantenimiento de bases fuera de ventana los sábados. No afirma que todas las rutas del snapshot obedezcan esa regla: domingo, AMQP, manuales y trabajos en curso requieren contraste con producción. Recibir centralmente fuera de la ventana ERP queda como propuesta, no como permiso vigente.

RabbitMQ se presenta como broker; BullMQ como coordinador de jobs con backend Redis predeterminado y PostgreSQL opcional documentado actualmente. Ninguno reemplaza por sí solo mediaciones WSO2. No se adoptaron ni ensayaron esos productos para el POS. La base PostgreSQL/HTTPS es preferente para piloto con gates, no una garantía certificada.

La retirada de Mongo preserva autoridad de reserva/consumo/liberación de NC y otros consumidores; una proyección de lectura no sustituye esa autoridad. Las cifras 31/12/3 son entradas de directorios públicos, consultados el 01-10-2026, no cajas o instalaciones POS verificadas. Los nuevos informes enlazados conservan fuentes, tres rondas de revisión y 28 casos límite.

## Ampliación: proveedores, dispositivos y perfiles

El capítulo de evolución incorpora tres ejemplos propuestos y un mapa Mermaid desplegable. Sus fuentes y límites están en [extensibilidad por proveedor y dispositivo](../docs/extensibilidad-proveedores-dispositivos.md). La impresora compatible es un supuesto didáctico y el terminal Transbank nuevo es hipotético; no se afirma que ningún modelo concreto esté homologado.

El contrato del POS separa puertos, fachadas, perfiles y adaptadores. Una ACL corresponde a traducción de significado, no a cualquier envoltorio de SDK. Soporte probado, autorización por perfil y disponibilidad actual son tres ejes distintos; ninguno demuestra por sí solo permiso offline.

El binding pertenece a la operación lógica antes del primer efecto; sus intentos conservan ese destino. En la interacción, cambiar A por B solo afecta operaciones nuevas independientes. El pendiente mantiene A y resultado desconocido; consultas y reversas vinculadas a un cobro previo conservan proveedor, comercio y referencias originales. La consulta depende de que el proveedor la admita de forma fiable: sin ella se conserva incertidumbre y resolución operativa, sin segundo cobro automático mediante B.

El mapa conserva al núcleo de sucursal como escritor del negocio y al agente del PC como ejecutor autorizado de periféricos. El agente puede usar un proceso .NET para un SDK específico. Un journal durable de comandos/resultados permite reentregas controladas, sin acreditar el efecto físico ni autorizar otro escritor durante una caída LAN. La sucursal reconoce el resultado después de persistirlo; el agente conserva la evidencia según el acuse y retención acordados.

Facturación e impresión tienen resultados propios. Un acuse de spooler no demuestra impresión física; una copia autorizada es un nuevo trabajo referido al documento original, sin generar otra factura, venta o cobro. No se introduce descarga arbitraria de plugins ni una promesa universal de plug-and-play.

## Ampliación: IA opcional, fuera de la autoridad del negocio

El capítulo 7, «IA en el POS», usa [servicios-ia-pos.md](../docs/servicios-ia-pos.md) como fuente y mueve el repaso al capítulo 8. Los siete casos son propuestas: procedimientos, catálogo, OCR, conciliación, recomendaciones, analítica y soporte. Se priorizan procedimientos/soporte con fuentes y búsqueda de catálogo condicionada a curación de datos y compatibilidades.

El laboratorio no genera respuestas ni llama modelos. Los ejemplos son sintéticos y muestran dos dimensiones independientes: conectividad y evidencia/acceso vigentes. Una copia autorizada habilita búsqueda normal de procedimientos o catálogo; no prueba que exista un modelo local. Otras capacidades remotas se deshabilitan y conservan sus alternativas deterministas. Sin evidencia suficiente o permiso vigente, hay abstención y no se expone contenido restringido.

Ni RAG, embeddings, una cita o una supuesta confianza del modelo demuestran verdad. No se inventan porcentajes de confianza, métricas de retorno ni latencias. La compatibilidad de productos exige evidencia estructurada y responsable, no semejanza semántica. Hardware local, proveedor de modelo, tratamiento de datos y presupuesto siguen por decidir.

El núcleo valida los comandos con las mismas reglas haya o no IA. Una revisión humana no omite permisos, precios, crédito, pagos o fiscalidad; la caja no toma autoridad de stock. No existen rutas de escritura del modelo a las bases de negocio ni ejecución autónoma de shell, cobros o conciliaciones. La política de acceso se aplica antes de recuperar contenido y también limita fuentes locales. Las instrucciones dentro de documentos se tratan como datos no confiables.

## Ampliación: RFID, conteos y autoservicio futuros

Se conserva el recorrido de ocho capítulos. Evolución incluye un módulo plegable basado en [evolucion-rfid-autoservicio.md](../docs/evolucion-rfid-autoservicio.md), con tres escenarios separados: captura en caja, conteo para el dueño del inventario y autoservicio. Son opciones futuras; la referencia a experiencias comerciales conocidas no acredita selección de proveedor, hardware comprado, homologación ni rendimiento.

`rfidDemo` contiene cinco observaciones de tres IDs `EPC-DEMO-*`, sin codificación estándar ni datos de etiquetas reales. El supuesto didáctico asigna cada tag a una unidad: dos tags de SKU-A y uno de SKU-B. Se deduplica la identidad de etiqueta dentro de la sesión, no el SKU. Repetir el lote aumenta observaciones, no candidatos ni carrito. El carrito permanece en cero hasta una revisión y validación simuladas de los datos conocidos; entonces muestra tres unidades y se fija esa selección de ejemplo, sin pago ni emisión.

Este supuesto no se generaliza a kits, cajas, embalajes ni etiquetas logísticas. Mapping, unidad, autorización y zona deben validarse; desconocidos o lecturas ajenas no entran automáticamente. Sesión del lector, sesión de conteo y versión de cesta son identidades diferentes. La ausencia de lectura no prueba que se retiró un objeto; al iniciar pago se fija la versión revisada para impedir cambios por lecturas tardías. La demo no simula pago, salida, retiro automático ni radio real.

Un EAN/UPC sin serial no permite resolver por sí solo si es la unidad ya leída RFID. El fallback requiere procedimientos y control físico de la cesta, sin deduplicar por SKU. Los adaptadores agrupan y limitan observaciones para proteger al escritor. Metales, líquidos, interferencias, alcance y tagging requieren pruebas con producto y zona reales.

La caja sigue sin manejar stock. El conteo se propone al ERP/WMS o dueño confirmado para revisión y conciliación, sin sobrescribir saldos; también deben considerarse movimientos concurrentes. Un lector local no concede autoridad de venta ni autonomía ante pérdida de LAN/servidor. El perfil offline necesita mapping y permisos locales vigentes. Autoservicio exige su propio diseño de asistencia, accesibilidad, excepciones, pago y fiscalidad, con o sin RFID.

Las revisiones del conjunto de lectura deben conciliar vínculos previos, sin sumar otra vez una identidad que persiste ni borrar la que deja de observarse. El escritor compartido debe resolver un conflicto de dos cajas con el mismo EPC antes de otro cobro, sin afirmar control global de inventario. Un pago incierto no libera automáticamente ese vínculo. Son requisitos de la propuesta, no mecanismos implementados o probados por el minilaboratorio.

## Ampliación: explorador técnico y cobertura explícita

La vista general incluye `api-pagos-caja` y MongoDB (`estadoNC` y `cajaSucursales`), con la consulta HTTP desde Mountain y el acceso SQL directo de la API a PostgreSQL de sucursales. El enlace HTTP conserva la distinción entre contratos compatibles y configuración efectiva. Los usos de MongoDB en precios se explican en la ficha; no se dibujan como una misma base. Véase el [análisis de api-pagos-caja](../docs/analisis-repositorios/api-pagos-caja.md). El generador conserva los nodos y las conexiones de `current.mmd`, pero distribuye su SVG en tres columnas para mantenerlo legible; valida que ninguna conexión o pieza quede fuera.

El recorrido mantiene ocho capítulos. Ecosistema separa cuatro perspectivas mediante pestañas: Vista general, Repositorios, Peticiones y Evidencia. Vista general es la entrada inicial; solo un panel está visible. Evidencia ofrece tres modos: Rutas, Despliegue y Fuentes y pendientes. El inventario completo de componentes se consulta bajo demanda en el último, y las fichas conceptuales conservan la evidencia del catálogo correspondiente. Las fichas muestran repositorio, tecnología y ubicación; los puertos quedan en los datos de evidencia y la documentación técnica.

`technical-data.js` conserva observaciones verificadas con procedencia en [catalogo-integraciones-actuales.md](../docs/catalogo-integraciones-actuales.md). Una ruta declarada no equivale a una llamada encontrada, y revisar un consumidor no acredita la implementación de su servidor. La API de lectura de lotes está auditada en mountain-concentrador; se distingue su variante Node de la API Synapse, y los lectores MPOS de su productor AX aún no recibido. Las discrepancias de puertos y protocolos se conservan como tales. Los controles de búsqueda jamás ejecutan solicitudes a las rutas catalogadas.

V01–V05 se copian del documento [vistas-arquitectura-y-flujos.md](../docs/vistas-arquitectura-y-flujos.md) durante la regeneración: despliegue, secuencia actual de venta, sincronización actual, actividad propuesta y estados ERP propuestos. La navegación ofrece V01 una sola vez, en Evidencia → Despliegue; V02–V06 quedan accesibles desde el documento. Esto evita repetir en pantalla los recorridos actuales y la propuesta como otra biblioteca de diagramas. V01 conserva zoom y desplazamiento. Sus nodos con mapeo explícito al catálogo admiten clic y Enter/Espacio; una lista plegable ofrece las mismas fichas. Los nodos agrupados muestran las piezas por separado sin certificar un binding entre ellas. No se pretende que una secuencia representativa cubra todas las variantes o certifique garantías en producción.

La cobertura distingue los siete módulos de la PPTX de apps/repos y registra vacíos de implementación, contratos, topología y validación. Su conteo de componentes/rutas no representa un porcentaje de cobertura. Véase [la matriz de cobertura](../docs/cobertura-documentacion-presentacion.md). No extrapolar la evidencia de Chile a Perú o España.

El capítulo Offline agrega ocho casos representativos: WAN/precios, LAN/escritor, respuesta perdida/reenvío, pago o fiscalidad inciertos, mantenimiento, restauración, concurrencia de NC y corte ERP. Cada ficha separa lo observado o desconocido del estado/acción propuestos y remite a la evidencia y matrices. No reproduce incidentes ni afirma que esas garantías ya estén implementadas.


## Ampliación: tablas dentro de los recorridos actuales

El capítulo Datos abre un recorrido a la vez: D01 venta/DTE, D02 subida y resultado AX, D03 bajada con ejemplo de cliente, D04 consulta por RUT y D05 nota de crédito entre bases. Se muestra una historia con lecturas y escrituras, no un inventario de tablas. La evidencia canónica está en [recorridos-datos-tablas.md](../docs/recorridos-datos-tablas.md); los cinco Mermaid se importan durante la regeneración y los pasos/fichas se mantienen en `dataflows-data.js`.

La navegación es manual: elegir recorrido, avanzar, retroceder, reiniciar o seleccionar un paso. El resaltado señala participantes de ese paso, sin simular ejecución real ni latencias. Los nombres de tablas/esquemas, campos de estado y límites de transacción aparecen en fichas con fuentes. Un nombre lógico o modelo ORM no se convierte en DDL productivo por aparecer en el dibujo. Los tramos centrales desconocidos quedan explícitos; nunca se inventan tablas de AX/MPOS.

Los grupos de tablas solo resumen participación en el paso descrito; no afirman transacción común salvo evidencia expresa. La consulta de NC por cliente no se presenta como llamada a `estadoNC` si no se observó; ramas con llamador no identificado conservan esa limitación. Un commit de venta, una escritura de DTE y una confirmación ERP son hechos distintos. La UI no consulta bases ni endpoints y conserva zoom, teclado, fuentes y una lista alternativa a los nodos gráficos. El contexto anterior de lotes y RUT queda plegado, sin aumentar capítulos.

El modo inicial «Seguir paso» centra las piezas activas con un límite de reducción para conservar legibilidad; la vista general se solicita con «Ajustar». D05 ordena A/B/C mediante enlaces Mermaid invisibles comentados que solo imponen composición, sin añadir una secuencia funcional. El render reserva una banda y ubica los títulos de base en su esquina superior izquierda para separarlos de las etiquetas de las flechas. El QA comprueba el color y grosor computados del resaltado y el foco por teclado, no solamente las clases CSS.
## Ampliación operativa: relectura de fuentes

La ronda de operación releyó las láminas/notas originales y fragmentos de los snapshots corporativos. Se seleccionaron O01 sesión/cierre, O02 precio/oferta, O03 documento/impresión y O04 entrega de versiones. El usuario ya había pedido antes/propuesto y profundidad progresiva; se conservan ocho capítulos y las comparaciones se abren por decisión del lector. Las cuatro fichas de operaciones evitan atribuir a D01/D05 todos los recorridos de cobranza o devolución de dinero.

Los diagramas actuales y propuestos tienen etiquetas distintas y fuentes en [el documento canónico](../docs/operacion-caja-y-evolucion.md). Los escenarios son hipotéticos, sin respuestas de sistemas reales. Se aclara que cerrar sesión difiere del fin de ventana del sincronizador, que el precierre tiene efectos en el snapshot y que guardar una devolución no demuestra entrega/reversa de dinero. Los riesgos de concurrencia, denominaciones, archivos e impresión no se presentan como incidentes productivos.

La ampliación respeta el diseño existente. Las consultas del catálogo UX sobre divulgación progresiva no dieron una coincidencia específica pertinente; se usaron las guías generales de navegación, accesibilidad y movimiento controlado de `ui-ux-pro-max`, sin atribuirles un patrón recuperado. No se añadió reproducción automática.


## Visor de interacciones entre componentes

La revisión responde al problema de flechas demasiado generales. Peticiones, en Ecosistema, muestra el visor HTML/SVG propio de aplicaciones, bases y tablas, repositorios y zonas lógicas sin otro acordeón de entrada. En Propuesta el visor continúa bajo demanda. Los componentes internos se consultan en las fichas. No se atribuye la falta de detalle a Mermaid: el cambio aporta control sobre el layout, las conexiones seleccionadas, el zoom y la inspección. Los Mermaid previos quedan como contexto y fuente documental.

Ocho recorridos separan seis casos actuales de dos contratos propuestos. El mapa muestra una conexión por selección; la secuencia conserva las interacciones entre aplicaciones y datos y las explicaciones de ramas. Las llamadas internas de una misma aplicación se consultan en su detalle. El lector puede elegir paso y conexión, inspeccionar efecto/estado/fuente y ampliar el visor. El modo inicial de escritorio muestra todas las piezas en columnas; en móvil se aísla una conexión y se apilan sus aplicaciones.

Se aplicó la búsqueda específica de ui-ux-pro-max «keyboard focus zoom diagrams», que devolvió guías de foco visible y no oculto. Se conserva el sistema visual existente, sin añadir dependencias remotas. La reproducción es voluntaria, se pausa al navegar/inspeccionar y respeta movimiento reducido. Los recuentos de piezas y relaciones describen el material del visor, no exhaustividad del sistema ni topología productiva.

Ecosistema, en la pestaña Repositorios, muestra los seis repositorios operativos y sus diez relaciones seleccionadas. Las fichas de core y devops-platform, sus fuentes y su relación de CI/CD se consultan únicamente en Propuesta, junto a la recomendación de reutilización; no se repiten en Evolución. `repositories-data.js` conserva los ocho repositorios de software y las once relaciones, con esta separación de vistas. No se inventan vínculos de ejecución de la caja hacia la plataforma corporativa. integration-presentations se conserva únicamente como fuente de ideas en la documentación de análisis; queda fuera de las tarjetas, conexiones y explicaciones del tutorial. La fuente central predeterminada Pablo es de 2023; los contratos compatibles con clientes de 2026 no prueban despliegue.

## Nivel visible: aplicaciones, llamadas y datos

El diagrama principal muestra aplicaciones y sistemas externos, bases, tablas y colecciones. Las llamadas HTTP/SOAP/AMQP y las operaciones de datos conservan sus protocolos, rutas y fuentes. Controladores, servicios internos, clases y secuencias de implementación se consultan en «Implementación y código» al seleccionar una aplicación o conexión. No se representan como cajas separadas.

`interactions-view-data.js` proyecta los ocho recorridos sin modificar los metadatos auditados. Solo agrupa llamadas internas dentro de la misma aplicación; conserva llamadas de transporte incluso si quedan como autollamadas. Las tablas mantienen sus nombres y no se inventa SQL literal a partir de un ORM. Los pasos exclusivamente internos quedan en el detalle. Las tarjetas de aplicación no repiten una cabecera de contenedor. Los Mermaid documentales de datos, despliegue y operación siguen el mismo criterio; las vistas conceptuales de patrones describen responsabilidades de diseño.

## Jerarquía de lectura y control de duplicaciones

Ecosistema empieza en Vista general. Repositorios, Peticiones y Evidencia son perspectivas alternativas y solo un panel permanece visible; elegir una conexión no controla los otros paneles. Al alternar pestañas dentro del capítulo se mantienen sus selecciones. Peticiones muestra directamente el visor de seis recorridos actuales. Venta explica los momentos del negocio y enlaza las llamadas o tablas de esa misma operación. Datos inicia por maestros D03 y se centra en campos, estados y alcance del esquema. Propuesta abre con el modelo C4; las decisiones antes/propuesto y los contratos de venta y ERP tienen sus propias pestañas. Los enlaces `#mapa?flujo=…`, `#propuesta?flujo=…` y `#datos?flujo=…` llevan a la selección concreta; el primero activa Peticiones. Los enlaces `#mapa?vista=general`, `#mapa?vista=repositorios`, `#mapa?vista=peticiones` y `#mapa?vista=evidencia` permiten acceder a cada perspectiva.

Dentro del visor, el relato del paso guía la lectura. El alcance global queda plegado y el detalle de una conexión no vuelve a copiar descripción, efecto, límite o fuentes idénticos en su implementación. Una tabla no genera una segunda ficha con los mismos campos. Las referencias por unidad de código siguen disponibles al desplegar la aplicación.

La guía de interacciones mantiene los controles; el README web explica apertura y mantenimiento; la matriz de cobertura conserva la auditoría editorial y los pendientes de consolidación. El repaso, los límites en el punto de decisión y los índices accesibles son repetición útil. Los datos de negocio y fuentes auditadas no se eliminan para reducir conteos. La reducción de palabras iniciales mide jerarquía visible, no comprensión de personas.

## C4 y decisión de persistencia · 5 de octubre de 2026

Propuesta → Arquitectura abre el explorador C4: contexto, aplicaciones y bases, componentes del backend, componentes del sincronizador y despliegue. El despliegue es una vista complementaria, no el cuarto nivel de código. Las vistas describen la arquitectura objetivo; no prueban implementación ni infraestructura productiva. Los schemas y mensajes propuestos no son tablas o contratos observados en el sistema actual.

Los rótulos dicen «Cliente de caja», «Backend de sucursal» y «PostgreSQL de sucursal». Outbox e inbox son tablas, y el espejo comercial es un modelo de lectura de la misma base, sin otra base por tabla ni acceso SQL desde Angular. El nivel de componentes descompone un proceso; no transforma cada módulo en microservicio. Nx describe el código y CI, no un contenedor desplegado.

O02 desarrolla eventos y sincronización masiva programada/manual: corte coherente, staging, recuperación de cambios posteriores, bajas, versión completa activada de manera atómica y cotización/venta con versión fija. La sucursal no edita el maestro comercial y la política distingue vigencia de oferta, antigüedad del espejo y permisos offline. PostgreSQL se recomienda por el modelo relacional y sus transacciones/restricciones; MongoDB también dispone de transacciones multidocumento y no se descarta por una limitación inventada.

(() => {
  'use strict';

  const proposal = { label: 'Propuesta y decisiones', url: '../docs/propuesta-arquitectura.md' };
  const c4 = { label: 'Modelo C4 y contratos', url: '../docs/c4-arquitectura-propuesta.md' };
  const technology = { label: 'Tecnologías y monorepo', url: '../docs/opciones-tecnologicas.md' };
  const resilience = { label: 'Casos adversos y recuperación', url: '../docs/revision-resiliencia-datos-pos.md' };
  const messaging = { label: 'Decisiones de mensajería', url: '../docs/investigacion-mensajeria-pos.md' };
  const extensions = { label: 'Perfiles y proveedores', url: '../docs/extensibilidad-proveedores-dispositivos.md' };
  const corporate = { label: 'Reutilización corporativa', url: '../docs/analisis-repositorios/aportes-plataforma-corporativa.md' };

  window.POS_REVEAL_CONTENT = {
    title: 'POS corporativo · Arquitectura para construir en equipo',
    chapters: [
      { id: 'producto', title: '01 · Un producto, varios países' },
      { id: 'arquitectura', title: '02 · El mapa del sistema' },
      { id: 'venta', title: '03 · Una venta de principio a fin' },
      { id: 'precios', title: '04 · Precios y ofertas offline' },
      { id: 'sincronizacion', title: '05 · Entregar, ejecutar y recuperar' },
      { id: 'integracion', title: '06 · Integrar sin copiar el ERP' },
      { id: 'monorepo', title: '07 · Construir con Nx' },
      { id: 'operacion', title: '08 · Demostrar que funciona' }
    ],
    slides: [
      {
        id: 'un-producto-varios-paises', chapter: 'producto', kind: 'cover',
        title: 'Un POS corporativo. Varios países.',
        lead: 'Una propuesta para compartir el producto y adaptar sus diferencias con contratos, perfiles y extensiones.',
        takeaway: 'Incorporar un país debe aprovechar el núcleo común, sin crear otro POS.',
        notes: [
          'La meta principal es una plataforma corporativa reutilizable. La continuidad offline es un requisito dentro de ese producto, junto con integridad, seguridad, experiencia común, reportes y operación.',
          'Chile, Perú y España son el alcance inicial de la propuesta. No se afirma que sus proveedores, contratos o reglas fiscales ya estén homologados.',
          'Esta presentación explica una arquitectura de referencia para desarrollar y validar. Los diagramas, simulaciones y fragmentos de código no acreditan una implementación productiva.'
        ], source: proposal
      },
      {
        id: 'ruta-de-aprendizaje', chapter: 'producto', kind: 'outline',
        title: 'De una venta al sistema completo',
        lead: 'Primero entenderemos las responsabilidades. Después seguiremos los datos, el código y la recuperación.',
        items: [
          { kicker: '01–02', title: 'Producto y arquitectura', text: 'Qué compartimos y dónde se ejecuta cada responsabilidad.' },
          { kicker: '03–04', title: 'Venta y precios', text: 'Confirmación local y reglas que funcionan con una versión conocida.' },
          { kicker: '05–06', title: 'Sincronización e integración', text: 'Entrega durable, trabajos, eventos y traducción entre sistemas.' },
          { kicker: '07–08', title: 'Código y operación', text: 'Monorepo, versiones, evidencia y pruebas del piloto.' }
        ],
        takeaway: 'Cada tecnología aparece después del problema que necesita resolver.',
        notes: [
          'Derecha e izquierda, igual que Siguiente y Anterior, recorren las láminas en orden. Espacio avanza por los bloques resaltados del código antes de cambiar de lámina. El índice permite saltar a un tema.',
          'Los laboratorios usan datos sintéticos y permiten recorrer pasos o fallos. No se conectan a bancos, servicios fiscales, colas ni sistemas corporativos.',
          'Conviene detenerse en las preguntas antes de mostrar la respuesta. El objetivo es justificar decisiones, no memorizar nombres de herramientas.'
        ], source: proposal
      },
      {
        id: 'objetivos-del-producto', chapter: 'producto', kind: 'cards',
        title: 'Offline es una parte del desafío',
        lead: 'El producto debe crecer entre países y seguir siendo coherente para usuarios, desarrollo y operación.',
        items: [
          { title: 'Reutilización', text: 'Venta, caja, devoluciones y contratos compartidos entre países.' },
          { title: 'Integridad', text: 'Dinero, documentos e integración con identidades y estados verificables.' },
          { title: 'Experiencia y control', text: 'Una UX común, permisos, reportes y módulos con responsables.' },
          { title: 'Continuidad y evolución', text: 'Capacidades offline aprobadas, recuperación y despliegues compatibles.' }
        ],
        takeaway: 'Superar una prueba sin Internet no demuestra por sí solo un producto corporativo.',
        notes: [
          'La plataforma debe demostrar que un segundo perfil nacional reutiliza los casos de uso y pruebas comunes. También debe sostener cambios de proveedor y evolución del ERP.',
          'La continuidad depende de datos, permisos, medios de pago, fiscalidad, disco y disponibilidad del escritor. Tener una copia local no permite cualquier operación.',
          'Enterprise describe garantías y gobierno comprobables. No equivale a añadir microservicios, brokers o tecnologías al diagrama.'
        ], source: proposal
      },
      {
        id: 'compartir-configurar-extender', chapter: 'producto', kind: 'compare',
        title: 'Compartir, configurar y extender',
        lead: 'La variación tiene un lugar explícito. No se distribuyen condicionales de país por todo el producto.',
        columns: [
          { title: 'Núcleo común', items: ['Casos de uso y reglas compartidas', 'Identidades, dinero y contratos', 'Pruebas de regresión comunes'] },
          { title: 'Perfil aprobado', items: ['País, entidad, sucursal y caja', 'Módulos y permisos compatibles', 'Proveedores ya homologados'] },
          { title: 'Extensión', items: ['Política nacional implementada', 'Adaptador fiscal, pago o ERP', 'Pruebas y homologación propias'] }
        ],
        takeaway: 'Configurar combina capacidades soportadas; una regla nueva puede exigir código y nuevos contratos.',
        notes: [
          'No se promete incorporar cualquier país cambiando un JSON. Una regla nueva puede requerir cambiar dominio, contratos y pruebas, manteniendo una evolución común del producto.',
          'La configuración se resuelve y valida antes de activarla. Una excepción de caja no puede ampliar por sí sola permisos fiscales o de crédito.',
          'Evitar forks por país no significa esconder diferencias. Las variantes legítimas se expresan como políticas y adaptadores con responsables.'
        ], source: extensions
      },
      {
        id: 'recorrido-del-negocio', chapter: 'producto', kind: 'cards',
        title: 'El recorrido que vamos a proteger',
        lead: 'Seguiremos una compra desde el turno del cajero hasta la conciliación del país.',
        items: [
          { kicker: '1', title: 'Preparar', text: 'Abrir turno, validar capacidades y cargar datos autorizados.' },
          { kicker: '2', title: 'Cotizar y cobrar', text: 'Calcular con una versión de precios y resolver el intento de pago.' },
          { kicker: '3', title: 'Confirmar y documentar', text: 'Persistir la venta y entregar el documento permitido.' },
          { kicker: '4', title: 'Integrar y conciliar', text: 'Transmitir, registrar resultados y resolver diferencias.' }
        ],
        takeaway: 'Venta, pago, documento fiscal y asiento ERP son hechos relacionados, con estados distintos.',
        notes: [
          'Una venta puede estar confirmada localmente mientras su integración ERP está pendiente. Eso no significa que deba cobrarse otra vez.',
          'El orden y momento de documentación fiscal se ajustan al régimen y proveedor homologados. La secuencia pedagógica no prescribe un flujo fiscal universal.',
          'La caja actual no administra stock según el alcance informado. Cualquier reserva de inventario pertenece al sistema confirmado como responsable; no se añade aquí por asociación con la palabra POS.'
        ], source: proposal
      },
      {
        id: 'estado-de-las-decisiones', chapter: 'producto', kind: 'compare',
        title: 'Qué está indicado y qué debe validarse',
        lead: 'Una propuesta clara distingue la dirección elegida de una garantía ya demostrada.',
        columns: [
          { title: 'Dirección indicada', items: ['Cliente Angular + Tauri', 'Organización del producto con Nx', 'Plataforma corporativa multipaís'] },
          { title: 'Recomendación', items: ['NestJS + Fastify en sucursal y país', 'PostgreSQL con propiedad por módulo', 'Outbox, HTTPS durable y workers'] },
          { title: 'Validación pendiente', items: ['Reglas, SDK y proveedores por país', 'Capacidad, recuperación y soporte', 'Aprobación y evidencia del piloto'] }
        ],
        takeaway: 'La maqueta visual y esta presentación no implementan por sí solas el backend objetivo.',
        notes: [
          'El documento de propuesta y sus ADR son la fuente de decisión vigente. Las revisiones y diagramas sintetizan esa fuente; no cambian decisiones implícitamente.',
          'RabbitMQ, BullMQ o servicios gestionados son opciones para cargas concretas. Se necesita un motivo, un operador y una prueba antes de incorporarlos.',
          'No se inventan SLA, cantidades de cajas o cifras de rendimiento. Los valores de los ejemplos sirven para comprender comportamiento.'
        ], source: proposal
      },
      {
        id: 'leer-c4', chapter: 'arquitectura', kind: 'cards',
        title: 'C4: ampliar el mapa con una pregunta',
        lead: 'Cada vista responde algo diferente. Un rectángulo no siempre representa un microservicio.',
        items: [
          { kicker: 'C1', title: 'Contexto', text: '¿Quién usa el POS y con qué sistemas se relaciona?' },
          { kicker: 'C2', title: 'Contenedores', text: '¿Qué aplicaciones y almacenes tienen responsabilidades distintas?' },
          { kicker: 'C3', title: 'Componentes', text: '¿Cómo se divide por dentro una aplicación?' },
          { kicker: 'Vista adicional', title: 'Despliegue', text: '¿En qué equipo o entorno se ejecuta cada parte?' }
        ],
        takeaway: 'En C4, contenedor no significa necesariamente Docker; el nivel 4 sería código.',
        notes: [
          'Los diagramas de esta presentación son vistas didácticas de la propuesta. Los documentos conservan las responsabilidades detalladas y los diagramas editables.',
          'Leer cada relación por su dirección, propósito y protocolo. Un borde puede significar sistema, proceso o nodo físico: su título debe decir cuál.',
          'El despliegue complementa C4. No se utiliza como sustituto del nivel de código ni implica Kubernetes o infraestructura cloud aprobada.'
        ], source: c4
      },
      {
        id: 'contexto-del-pos', chapter: 'arquitectura', kind: 'diagram', diagramKey: 'context',
        title: 'C1 · El POS y sus fronteras',
        lead: 'El POS coordina la operación. Precios, pagos, fiscalidad y contabilidad conservan autoridades identificadas.',
        takeaway: 'Un sistema externo no se convierte en módulo interno por dibujarlo cerca del POS.',
        notes: [
          'El cajero opera, el supervisor autoriza y revisa, y el equipo de plataforma supervisa entregas y recuperaciones. Son necesidades diferentes, no un único permiso administrador.',
          'La autoridad de catálogo y precios se confirma por atributo y país. No se adjudica automáticamente al ERP ni a la sucursal que guarda el espejo.',
          'Chile integra Dynamics AX on-premise; España, Gira; Perú, un sistema custom, según los antecedentes. Interfaces y capacidades de los destinos requieren validación.',
          'El documento fiscal, la liquidación del pago y el asiento contable no quedan demostrados por el ACK del POS central.'
        ], source: c4
      },
      {
        id: 'contenedores-del-pos', chapter: 'arquitectura', kind: 'diagram', diagramKey: 'containers',
        title: 'C2 · Aplicaciones y datos con dueño',
        lead: 'La UI manda comandos al backend de sucursal. Los workers entregan e integran lo que ya quedó persistido.',
        takeaway: 'La sucursal confirma su negocio; el país recibe, integra y construye proyecciones.',
        notes: [
          'Angular + Tauri hospeda la interfaz y las capacidades nativas autorizadas. No recibe credenciales SQL ni se convierte en otro escritor de ventas.',
          'El backend de sucursal, recomendado como NestJS + Fastify, confirma negocio y outbox en PostgreSQL. El sincronizador tiene permisos acotados sobre datos técnicos y espejos.',
          'La API de país confirma inbox, efecto local o proyección y outbox en su propia transacción antes del ACK de aplicación. Los workers ejecutan después la integración externa.',
          'PostgreSQL local y de país tienen responsabilidades diferentes. No son dos autoridades concurrentes que puedan editar libremente la misma venta.'
        ], source: c4
      },
      {
        id: 'lugares-de-ejecucion', chapter: 'arquitectura', kind: 'diagram', diagramKey: 'deployment',
        title: 'Puesto, sucursal y país',
        lead: 'El perfil inicial permite seguir con la sucursal disponible cuando falla Internet.',
        takeaway: 'Cerrar Tauri no debe detener el sincronizador supervisado de la sucursal.',
        notes: [
          'Los puestos acceden por LAN al backend y al escritor PostgreSQL autorizado de sucursal. El canal a país cruza la WAN y puede quedar pendiente.',
          'Si falla la LAN o el servidor de sucursal, este perfil no permite abrir automáticamente otra base por caja. La autonomía por terminal es un perfil adicional con otras reglas de propiedad y recuperación.',
          'Los SDK de impresora o pago pueden requerir un puente local homologado. Ese puente ejecuta la identidad e importe autorizados; no crea otro intento de cobro.',
          'No se fija en este mapa el proveedor cloud ni el dimensionamiento. Alta disponibilidad y backup necesitan decisiones y pruebas propias.'
        ], source: c4
      },
      {
        id: 'limites-de-continuidad', chapter: 'arquitectura', kind: 'compare',
        title: 'Sin WAN no es lo mismo que sin sucursal',
        lead: 'La capacidad de continuar depende del fallo y de las operaciones permitidas en ese perfil.',
        columns: [
          { title: 'Sin Internet', items: ['Backend y PostgreSQL local disponibles', 'Precios y permisos todavía válidos', 'Entrega a país queda pendiente'] },
          { title: 'Sin LAN o servidor', items: ['Se pierde acceso al escritor', 'Este perfil detiene nuevas ventas', 'Recuperar autoridad antes de reanudar'] },
          { title: 'Proveedor inaccesible', items: ['Pago solo si la modalidad lo permite', 'Fiscalidad según régimen aprobado', 'Informar restricción concreta al usuario'] }
        ],
        takeaway: 'Disponer de datos locales no autoriza cualquier pago, crédito o documento.',
        notes: [
          'Antes de operar se validan vigencias, permisos, disco, reloj, material fiscal y medios de pago. La autonomía efectiva está limitada por el menor de esos recursos.',
          'El horizonte de 72 horas de algunos documentos es una hipótesis de ensayo, no una licencia fiscal ni una garantía universal de tarjeta offline.',
          'Una sucursal sin red no puede garantizar exclusión global para consumir una NC o cupón compartido. Necesita conexión, derechos exclusivos previamente asignados o una restricción explícita.'
        ], source: proposal
      },
      {
        id: 'backend-modular', chapter: 'arquitectura', kind: 'diagram', diagramKey: 'backend',
        title: 'C3 · Un proceso, módulos explícitos',
        lead: 'Ventas coordina el caso de uso. Precios, caja, pagos y fiscalidad exponen capacidades con límites.',
        takeaway: 'Las fronteras empiezan en código y propiedad de datos; no exigen un servicio por módulo.',
        notes: [
          'Acceso valida identidad, puesto, sucursal y capacidad real. Ocultar una opción en la UI no reemplaza la autorización del backend.',
          'Precios evalúa una versión local validada. Pagos y fiscalidad mantienen sus intentos, referencias y resultados. Caja posee turnos y movimientos.',
          'La unidad de trabajo confirma los cambios locales que deben ser atómicos junto con auditoría y outbox. No se mantiene la transacción SQL abierta esperando a un banco o al ERP.',
          'Extraer un microservicio requiere una necesidad comprobada de escala, aislamiento, seguridad o ciclo de entrega; no basta tener muchas carpetas.'
        ], source: c4
      },
      {
        id: 'laboratorio-venta', chapter: 'venta', kind: 'lab', lab: 'sale',
        title: 'Sigue una venta y sus puntos de fallo',
        lead: 'Observa qué está preparado, qué se confirmó y qué puede seguir pendiente después.',
        takeaway: 'La confirmación local necesita evidencia durable; la WAN no es el commit de la venta.',
        notes: [
          'Recorrer primero el caso normal y después el fallo de WAN. El backend de sucursal y PostgreSQL siguen disponibles durante la simulación de desconexión.',
          'La intención de venta y de pago conserva una identidad estable antes de llamar a un proveedor. El pago se resuelve según el contrato real del medio usado.',
          'El commit final conserva venta, referencias de pago, movimientos, auditoría y outbox. La emisión fiscal depende de su régimen; no se supone una transacción distribuida con el proveedor.',
          'Un fallo de impresión permite reimprimir el mismo documento. No debe crear otra venta ni volver a cobrar.'
        ], source: proposal
      },
      {
        id: 'commit-y-outbox', chapter: 'venta', kind: 'code',
        title: 'La venta y su evento se guardan juntos',
        lead: 'La outbox es una tabla durable de cosas que debemos entregar. No es una llamada de red.',
        code: {
          language: 'typescript', label: 'Pseudocódigo · transacción local tras resolver el pago', highlights: '2-7',
          source: 'await db.transaction(async (tx) => {\n  await sales.confirm(tx, sale);\n  await cash.recordMovement(tx, movement);\n  await audit.record(tx, auditEntry);\n  await outbox.append(tx, {\n    eventId, type: "SaleConfirmed.v1", payload: sale\n  });\n});\n// El worker publica después del commit.\nreturn { saleId: sale.id, status: "confirmed" };'
        },
        takeaway: 'Caer antes de publicar deja una fila recuperable, no una venta olvidada en memoria.',
        notes: [
          'El fragmento es conceptual: no define una API real de ORM ni sustituye validaciones, restricciones únicas, control de concurrencia y recuperación del producto.',
          'La intención e identidad del pago deben existir antes de este punto. No se mete la llamada al adquirente dentro de la transacción SQL.',
          'Si la transacción falla, ninguno de estos efectos locales queda confirmado. Si el pago ya fue aprobado, se recupera desde su intención persistida y el contrato del proveedor.',
          'El ID del evento se mantiene en los reenvíos; no se genera un UUID nuevo cada vez que el worker intenta entregar.'
        ], source: proposal
      },
      {
        id: 'pago-desconocido', chapter: 'venta', kind: 'compare',
        title: 'Timeout: todavía no sabemos el resultado',
        lead: 'Un problema de red no permite concluir que el banco rechazó o que no cobró.',
        columns: [
          { title: 'Aprobado', items: ['Conservar referencia del proveedor', 'Completar el flujo autorizado', 'Recuperar si falla la escritura local'] },
          { title: 'Rechazado', items: ['Guardar causa y evidencia', 'Informar el rechazo confirmado', 'Otro intento exige decisión explícita'] },
          { title: 'Desconocido', items: ['Conservar identidad del intento', 'Consultar resultado o conciliar', 'No repetir el cargo a ciegas'] }
        ],
        takeaway: 'Desconocido es un estado de negocio que necesita un procedimiento de resolución.',
        notes: [
          'La consulta por referencia o repetición idempotente depende de capacidades demostradas del proveedor. El wrapper del POS no puede inventar esas garantías.',
          'Si el pago fue aprobado y no puede completarse la venta, procede reversa o intervención operativa trazable según contrato. No se descarta la evidencia.',
          'Una aceptación offline del adquirente conserva su estado específico y riesgo. No se presenta automáticamente como pago liquidado.'
        ], source: extensions
      },
      {
        id: 'autoridades-del-dinero', chapter: 'venta', kind: 'cards',
        title: 'Cuatro resultados, cuatro evidencias',
        lead: 'Una sola etiqueta “completado” ocultaría qué falta resolver.',
        items: [
          { title: 'Venta', text: 'El POS de origen conserva la operación confirmada y sus correcciones.' },
          { title: 'Pago', text: 'El proveedor acredita autorización y liquidación; el POS guarda referencias.' },
          { title: 'Documento fiscal', text: 'El emisor y el régimen determinan validez, aceptación y contingencia.' },
          { title: 'Contabilidad', text: 'El sistema financiero confirma registro o contabilización en su propio ciclo.' }
        ],
        takeaway: 'Un rechazo ERP no borra una venta realizada ni autoriza a cobrarla otra vez.',
        notes: [
          'Usar identificadores separados para venta, intento de pago, documento fiscal y operación ERP. Se relacionan, pero tienen ciclos de vida diferentes.',
          'El supervisor necesita conocer causa, alcance, responsable y acción segura. Evitar un botón genérico de reintentar que repita cualquier efecto.',
          'Las correcciones son anulaciones, devoluciones o ajustes trazables. No se reescribe silenciosamente la historia financiera.'
        ], source: proposal
      },
      {
        id: 'espejo-de-precios', chapter: 'precios', kind: 'cards',
        title: 'Precio offline no es cachear un importe',
        lead: 'La sucursal necesita un conjunto coherente de datos y reglas para explicar cómo calculó el ticket.',
        items: [
          { title: 'Datos autorizados', text: 'Productos, listas, grupos y condiciones necesarias para las operaciones habilitadas.' },
          { title: 'Reglas de ofertas', text: 'Prioridades, acumulación, cantidades, vigencias y redondeos definidos.' },
          { title: 'Versión y procedencia', text: 'Manifiesto publicado, ámbito, compatibilidad y punto de continuidad del origen.' },
          { title: 'Evidencia del cálculo', text: 'Precio, descuento, reglas y versión que quedaron asociados a la venta.' }
        ],
        takeaway: 'La sucursal evalúa una versión aprobada; no se convierte en autora independiente de precios.',
        notes: [
          'El inventario de precios actuales debe identificar los datos y comportamientos del servicio remoto: grupos, descuentos, históricos, mínimos, vigencias y redondeos.',
          'Extraer el motor requiere casos de referencia. Comparar solo el total es insuficiente: dos reglas equivocadas pueden producir accidentalmente el mismo importe.',
          'La creación local de campañas requiere un alcance y autorización propios. Una caída de Internet no concede permiso para publicar ofertas globales.',
          'Cupones de uso único y presupuestos compartidos no se vuelven seguros por copiar sus datos; necesitan exclusión o restricciones aprobadas.'
        ], source: proposal
      },
      {
        id: 'contrato-del-calculo', chapter: 'precios', kind: 'code',
        title: 'Un cálculo reproducible y explicable',
        lead: 'La misma entrada y versión deben producir el mismo resultado en nodos homologados.',
        code: {
          language: 'typescript', label: 'Contrato educativo · motor puro de precios', highlights: '1-6|7-10',
          source: 'const quote = pricing.quote({\n  cart: [{ sku: "SKU-01", quantity: 2 }],\n  customerGroup: "general",\n  pricingVersion: "CL-2026-42",\n  businessTime: approvedBusinessTime\n});\n// Ejemplo: 2 × $10.000, descuento 10 % → $18.000\nquote.total;        // { amountMinor: "18000", currency: "CLP" }\nquote.appliedRules; // ["PROMO-10"]\nquote.pricingVersion; // "CL-2026-42"'
        },
        takeaway: 'Persistir el importe y por qué resultó ese importe.',
        notes: [
          'El ejemplo usa importes ficticios y omite el detalle tributario para enseñar el contrato. La escala, impuestos y redondeos de cada moneda y régimen deben estar definidos en el producto.',
          'amountMinor es una representación conceptual serializable, no una licencia para hacer dinero con floats. Se necesita un tipo Money y operaciones decimales o enteras adecuadas.',
          'El tiempo de negocio debe cumplir la política de reloj aprobada. Un reloj local que retrocede no puede extender silenciosamente la vigencia de una promoción.',
          'La pureza del cálculo separa reglas de Angular, NestJS, SQL y servicios remotos; eso permite ejecutar casos de referencia y pruebas de compatibilidad.'
        ], source: proposal
      },
      {
        id: 'version-fijada', chapter: 'precios', kind: 'compare',
        title: 'Una actualización no cambia el ticket debajo del cajero',
        lead: 'Cada cotización fija la versión que utiliza. La activación prepara el precio de operaciones nuevas.',
        columns: [
          { title: 'Venta en curso', items: ['Conserva la versión utilizada', 'Guarda reglas y descuentos aplicados', 'Revalidación según política de vigencia'] },
          { title: 'Nueva versión', items: ['Se construye de forma aislada', 'Se publica completa tras validar', 'Se usa en nuevas cotizaciones válidas'] },
          { title: 'Historia', items: ['No recalcular ventas antiguas', 'Retener versiones referenciadas', 'Correcciones con trazabilidad'] }
        ],
        takeaway: 'Versión fijada aporta consistencia; la política determina hasta cuándo puede aceptarse la cotización.',
        notes: [
          'No prometer que una cotización conserva vigencia eternamente. Si la oferta vence antes del cobro, el negocio debe definir recotización o aceptación dentro de límites autorizados.',
          'La descarga de B nunca reescribe filas de A mientras A está siendo utilizada. Los datos publicados son inmutables; lo que cambia atómicamente es el puntero de versión.',
          'La retención debe preservar versiones necesarias para ventas en curso, auditoría y recuperación. Un recolector no puede borrar lo que sigue referenciado.'
        ], source: c4
      },
      {
        id: 'laboratorio-eventos-precios', chapter: 'precios', kind: 'lab', lab: 'prices-events',
        title: 'Eventos: recibir cambios sin mezclar versiones',
        lead: 'Un duplicado se reconoce. Un hueco impide publicar un conjunto incompleto.',
        takeaway: 'Los deltas también construyen una candidata; nunca parchean la versión activa.',
        notes: [
          'El origen debe publicar un contrato de identidad, orden y cobertura. No se presupone que los sistemas actuales ya generen todos los eventos necesarios.',
          'Mostrar primero entrega ordenada, luego un duplicado y después un hueco. Guardar la recepción permite recuperar sin declarar que ese cambio ya está aplicado.',
          'Una candidata se basa en la versión publicada y aplica deltas compatibles. La validación considera el conjunto resultante antes de activar.',
          'El mismo ID con payload distinto es un conflicto trazable, no un duplicado válido. Los errores de un ámbito deben aislarse sin bloquear todas las sucursales.'
        ], source: c4
      },
      {
        id: 'laboratorio-snapshot-precios', chapter: 'precios', kind: 'lab', lab: 'prices-snapshot',
        title: 'Carga masiva: fotografía y continuidad',
        lead: 'El snapshot parte de un watermark consistente del origen. Los deltas posteriores completan la candidata.',
        takeaway: 'Durante la descarga, la versión activa sigue atendiendo sin exponer datos parciales.',
        notes: [
          'Watermark significa punto consistente de continuidad publicado por el origen; no es simplemente la hora a la que el navegador comenzó la descarga.',
          'El manifiesto describe versión, ámbito y partes esperadas. Se descargan porciones a staging con progreso durable y posibilidad de reanudar.',
          'Las modificaciones posteriores al watermark se incorporan según el contrato del origen. Si faltan cambios, cobertura o compatibilidad, no se publica.',
          'La descarga y validación pesada ocurren fuera de la transacción final. Mantener una transacción abierta mientras baja una red lenta dañaría disponibilidad y recuperación.',
          'Carga nocturna, recuperación y ejecución manual deben pasar por este mismo pipeline de publicación.'
        ], source: c4
      },
      {
        id: 'activacion-atomica', chapter: 'precios', kind: 'code',
        title: 'Publicar es un commit corto',
        lead: 'La candidata ya está completa y validada. Dentro del commit se revalidan las precondiciones y se cambia la versión.',
        code: {
          language: 'typescript', label: 'Pseudocódigo · publicación con precondiciones', highlights: '1|2-8',
          source: 'const candidate = await prepareAndValidate(manifest);\nawait db.transaction(async (tx) => {\n  await versions.assertPublishable(tx, candidate);\n  await versions.activateIfCurrent(tx, {\n    expected: candidate.baseVersion, next: candidate.id\n  });\n  await inbox.markApplied(tx, candidate.eventIds);\n  await cursors.advanceApplied(tx, candidate.checkpoint);\n});'
        },
        takeaway: 'Versión activa, inbox aplicada y cursor aplicado cambian juntos o no cambian.',
        notes: [
          'El código expresa un contrato, no una implementación lista para producción. activateIfCurrent debe aplicar comparación atómica y fallar si otro publicador cambió la base esperada.',
          'assertPublishable revalida identidad, estado inmutable, ámbito, compatibilidad y vigencia; no vuelve a descargar ni recalcula todo dentro de SQL.',
          'La evidencia de validación incluye checksum, cobertura y referencias. Un hash correcto solo prueba igualdad de bytes frente al manifiesto confiable, no validez de todas las reglas.',
          'Si aparece un cambio concurrente, se reconstruye o revalida la candidata conforme al protocolo. No se publica a la fuerza ni se adelanta el checkpoint.'
        ], source: c4
      },
      {
        id: 'recibido-versus-aplicado', chapter: 'precios', kind: 'compare',
        title: 'Descargado, validado y aplicado son estados distintos',
        lead: 'La versión identifica un conjunto; watermark y cursores ubican cambios; el checksum es una huella de los bytes.',
        columns: [
          { title: 'Recibido', items: ['Inbox y porciones guardadas', 'Cursor de recepción durable', 'Puede faltar cobertura o validación'] },
          { title: 'Validado', items: ['Candidata completa y compatible', 'Checksum, referencias y vigencia', 'Todavía no es la versión activa'] },
          { title: 'Aplicado', items: ['Puntero publicado por commit', 'Inbox aplicada y checkpoint juntos', 'Nueva lectura usa versión coherente'] }
        ],
        takeaway: 'Versión ≠ posición del flujo ≠ checksum. Descargar el 100 % todavía no demuestra una publicación válida.',
        notes: [
          'La UI debe mostrar versión activa, versión recibida, resultado de validación y última aplicación. Eso permite distinguir atraso normal, incompatibilidad y fallo.',
          'El cursor recibido permite retomar la transferencia. El aplicado se mueve únicamente después de que el efecto requerido esté confirmado de forma atómica.',
          'El ID de versión identifica un conjunto publicado y puede ser opaco. El watermark declara el corte consistente del snapshot; los cursores describen progreso de recepción o aplicación dentro del ámbito y contrato del flujo.',
          'El checksum es una huella del contenido: comparar contra el manifiesto confiable permite detectar cambios en los bytes. No demuestra por sí solo cobertura, validez comercial, procedencia autorizada ni vigencia.',
          'Los laboratorios usan nombres como v102 y checkpoint 102 para seguir un ejemplo pequeño. La coincidencia numérica es didáctica: no se deriva la versión del cursor ni se ordenan versiones comparando sus IDs como texto.',
          'El canal incremental y el masivo conservan la misma semántica. No se implementa un atajo especial para el botón manual.'
        ], source: c4
      },
      {
        id: 'fallos-de-precios', chapter: 'precios', kind: 'cards',
        title: 'Qué debe pasar cuando algo falla',
        lead: 'Las reglas de recuperación son parte del diseño del precio, no un agregado después del piloto.',
        items: [
          { title: 'Descarga incompleta', text: 'Guardar progreso y reanudar. La versión activa permanece íntegra.' },
          { title: 'Evento faltante', text: 'Detener publicación del ámbito y recuperar cobertura; no saltar el hueco.' },
          { title: 'Promoción vencida', text: 'Aplicar política local aprobada; no extender la vigencia por falta de red.' },
          { title: 'Reloj o disco inválidos', text: 'Restringir la operación afectada y preservar evidencia y espacio de recuperación.' }
        ],
        takeaway: 'Mantener la versión previa evita mezclar datos; no convierte una regla vencida en válida.',
        notes: [
          'El comportamiento ante una promoción vencida puede incluir recalcular sin esa oferta o restringir la venta, según el contrato aprobado. No inventar siempre el mismo fallback.',
          'Los descuentos locales, presupuestos compartidos y cupones únicos requieren políticas particulares. No se deduce autorización de disponer de la ficha del cliente.',
          'Las pruebas deben cortar procesos antes y después de recibir, validar y activar. Conservar registros e IDs para demostrar qué versión quedó publicada.'
        ], source: resilience
      },
      {
        id: 'ejecucion-manual-programada', chapter: 'precios', kind: 'cards',
        title: 'Programar o ejecutar ahora: el mismo proceso',
        lead: 'El disparador cambia. Las garantías, permisos y límites permanecen.',
        items: [
          { title: 'Calendario', text: 'Zona horaria, ventana, frecuencia y política de fechas especiales explícitas.' },
          { title: 'Ejecución manual', text: 'Ámbito, motivo, permiso y resultado quedan auditados.' },
          { title: 'Exclusión', text: 'Un claim o lease verificable evita publicaciones simultáneas del mismo ámbito.' },
          { title: 'Recuperación', text: 'Checkpoint, límite de caudal y reanudación segura tras caída o mantenimiento.' }
        ],
        takeaway: 'El botón “Ejecutar” no puede saltarse validaciones ni una ventana operativa cerrada.',
        notes: [
          'Programado no significa ejecutado en ese instante: la carga, concurrencia y disponibilidad pueden retrasar el inicio. Mostrar próxima admisión y ejecución real por separado.',
          'La zona horaria de la política debe estar definida; un offset fijo no maneja por sí solo cambios de horario ni horas repetidas.',
          'El worker que pierde su lease no puede confirmar trabajo que ya pertenece a otro. Usar escrituras condicionales y fencing cuando corresponda.',
          'Si la política permite una excepción manual a una ventana, necesita permiso y evidencia explícitos. La presentación no concede ese permiso por defecto.'
        ], source: resilience
      },
      {
        id: 'pregunta-precios', chapter: 'precios', kind: 'quiz',
        title: 'Comprueba el diseño de precios',
        lead: 'Llegó el último archivo de la versión B, pero falla una referencia de promoción.',
        question: '¿Qué debería quedar activo?',
        options: [
          { label: 'B, porque terminó la descarga.', correct: false, feedback: 'Descargar todos los archivos no acredita integridad semántica. Falta una candidata válida.' },
          { label: 'A íntegra, aplicando sus límites de vigencia y operación.', correct: true, feedback: 'B no se publica. A sigue íntegra, pero sus reglas no pueden usarse fuera de los límites aprobados.' },
          { label: 'Los precios de A y las promociones válidas de B.', correct: false, feedback: 'Mezclar conjuntos expone una versión que nunca se validó como unidad y rompe la trazabilidad.' }
        ],
        takeaway: 'La unidad de publicación es un conjunto coherente, no cada archivo o fila por separado.',
        notes: [
          'Pedir al equipo que identifique qué estado persiste: B recibida con fallo de validación, A aplicada y cursor aplicado sin avanzar.',
          'Si A vence, debe entrar la política de restricción o recalculación aprobada. La respuesta no supone disponibilidad ilimitada.',
          'La recuperación puede completar o reconstruir B, siempre preservando el manifiesto, las identidades y la evidencia del fallo.'
        ], source: c4
      },
      {
        id: 'sincronizador-por-dentro', chapter: 'sincronizacion', kind: 'diagram', diagramKey: 'sync',
        title: 'C3 · El sincronizador conserva el progreso',
        lead: 'Un proceso supervisado entrega operaciones, recupera entradas y publica versiones locales validadas.',
        takeaway: 'Sincronizar incluye reanudar y demostrar resultados; no solo copiar datos.',
        notes: [
          'La salida reclama filas ya confirmadas de outbox y las entrega con identidad estable. La entrada conserva recepción, staging y cursor antes de declarar aplicación.',
          'El planificador aplica calendario, capacidad y límites. Los estados se recuperan al reiniciar: arrancar el proceso no implica volver automáticamente a Running si estaba en mantenimiento.',
          'El worker tiene permisos sobre datos técnicos y espejos. Una actualización que afecte dinero debe pasar por el caso de uso y autoridad del módulo, nunca por un job genérico de SQL.',
          'Para precios, todos los caminos hacia activación pasan por una candidata completa y validación. No dibujar una flecha de deduplicación a versión activa que salte esa frontera.'
        ], source: c4
      },
      {
        id: 'laboratorio-entrega', chapter: 'sincronizacion', kind: 'lab', lab: 'delivery',
        title: 'El ACK se perdió. El efecto ya ocurrió.',
        lead: 'Reenviar es normal. El receptor debe reconocer la misma operación y preservar el resultado.',
        takeaway: 'Entrega al menos una vez + efectos idempotentes; sin prometer exactly-once global.',
        notes: [
          'La API de país confirma inbox, efecto local o proyección y outbox juntos antes de responder. No basta registrar solo que recibió el mensaje.',
          'Si el ACK se pierde después de ese commit, el origen reenvía con el mismo eventId. La restricción única y el contrato de payload permiten reconocer el duplicado.',
          'Un ID reutilizado con contenido distinto debe producir conflicto y alerta. La identidad se verifica dentro del ámbito del dispositivo y entidad autenticados.',
          'La deduplicación necesita retención compatible con replay y restauración. Un backup anterior al ACK puede retroceder ese recuerdo; hace falta un procedimiento de reconstrucción y conciliación.'
        ], source: proposal
      },
      {
        id: 'significado-de-acuses', chapter: 'sincronizacion', kind: 'cards',
        title: '¿Qué está confirmando este acuse?',
        lead: 'El punto que responde determina la garantía. No se puede extender a toda la cadena.',
        items: [
          { title: 'Commit local', text: 'El escritor confirmó el cambio dentro de su frontera transaccional.' },
          { title: 'ACK de aplicación', text: 'El receptor confirmó el efecto local requerido y su evidencia durable.' },
          { title: 'Resultado externo', text: 'El ERP o proveedor acreditó el estado de esa operación.' },
          { title: 'Conciliación', text: 'Conteos, importes y referencias coinciden para el ámbito revisado.' }
        ],
        takeaway: 'Recibido por país no significa contabilizado, aceptado fiscalmente ni liquidado.',
        notes: [
          'En RabbitMQ se suman publisher confirms y consumer acknowledgements. Son confirmaciones del broker y del consumidor, con otra responsabilidad específica.',
          'La UI debe nombrar el destino y la etapa: recepción central pendiente, ERP rechazado o pago desconocido. “Sincronizado” sin más contexto resulta ambiguo.',
          'Conservar pendientes hasta el acuse acordado y luego aplicar retención de recuperación. Un ACK no implica borrar de inmediato toda evidencia del origen.'
        ], source: messaging
      },
      {
        id: 'elegir-mensajeria', chapter: 'sincronizacion', kind: 'compare',
        title: 'Elegir la herramienta por responsabilidad',
        lead: 'La base recomendada comienza con PostgreSQL, HTTPS durable y workers. Las extensiones necesitan una razón comprobable.',
        columns: [
          { title: 'Base propuesta', items: ['Outbox e inbox transaccionales', 'Lotes HTTPS con cursores e identidades', 'Workers y resultados durables'] },
          { title: 'BullMQ', items: ['Coordinar jobs de una aplicación', 'Programación y reintentos delimitados', 'Backend y operación explícitos'] },
          { title: 'RabbitMQ', items: ['Distribuir mensajes entre consumidores', 'Enrutamiento y aislamiento de cargas', 'Custodia y recuperación del broker'] }
        ],
        takeaway: 'Ninguna cola reemplaza reglas de negocio, traducción ERP o idempotencia del efecto.',
        notes: [
          'No se instalan Redis o RabbitMQ por defecto en cada sucursal. La outbox local permite entregar al volver la conectividad.',
          'Si la organización ya opera un servicio gestionado que satisface el caso, debe compararse su reutilización con introducir otro broker. No añadir varios productos para el mismo trabajo sin responsabilidad distinta.',
          'WSO2 puede incluir mediación, protocolos, transformaciones y persistencia. Reemplazar su broker no migra automáticamente esas responsabilidades.',
          'BullMQ se ilustra con Redis en el laboratorio; su documentación también contempla PostgreSQL. La versión y madurez del backend elegido requieren validación, no se adopta por aparecer en una diapositiva.'
        ], source: messaging
      },
      {
        id: 'laboratorio-bullmq', chapter: 'sincronizacion', kind: 'lab', lab: 'bullmq',
        title: 'BullMQ · Cuándo ejecutar un trabajo',
        lead: 'Programa o lanza una tarea recuperable y observa ejecución, backoff y resultado durable.',
        takeaway: 'El ID del job ayuda a coordinar la cola; no sustituye la identidad del efecto de negocio.',
        notes: [
          'Este laboratorio representa una opción central con BullMQ y Redis. No supone una dependencia Redis en cada caja ni incorpora la cola al commit SQL de una venta.',
          'Los disparadores programado y manual llaman a la misma capacidad autorizada. El worker limita concurrencia, registra progreso y valida precondiciones antes de publicar.',
          'Reintentar un fallo técnico recuperable puede ser correcto. Un rechazo funcional se trata como tal; un efecto remoto desconocido exige consulta o conciliación.',
          'Job Schedulers y jobId son mecanismos de coordinación; no acreditan puntualidad ni idempotencia financiera permanente. La evidencia durable debe permitir recuperar trabajo incluso si se pierde el estado de la cola.',
          'En Redis se deben decidir persistencia, capacidad, noeviction, copias y acceso. Los payloads de jobs no deben contener datos de tarjeta o secretos.'
        ], source: messaging
      },
      {
        id: 'laboratorio-rabbitmq', chapter: 'sincronizacion', kind: 'lab', lab: 'rabbitmq',
        title: 'RabbitMQ · A quién entregar un evento',
        lead: 'Dos consumidores lógicos reciben copias mediante colas distintas. Cada uno protege su propio efecto.',
        takeaway: 'Confirm del broker y ACK del consumidor confirman fronteras diferentes.',
        notes: [
          'En el ejemplo, integración ERP y reporting son consumidores independientes y usan colas diferentes. Dos workers de una misma cola compiten por los mensajes, no reciben ambos cada uno.',
          'Publisher confirm indica la responsabilidad asumida por el broker según su configuración. No prueba que el ERP haya registrado nada.',
          'El consumidor confirma su ACK después del commit local requerido. Si cae antes del ACK, la entrega puede repetirse y debe ser idempotente.',
          'Un mensaje sin ruta puede recibir confirm. La publicación debe gestionar mandatory/returns y topología, además del confirm.',
          'Los reintentos se limitan y los errores necesitan cuarentena con dueño y recuperación. No requeue infinito ni TTL que descarte una obligación monetaria sin resolución auditable.'
        ], source: messaging
      },
      {
        id: 'contrato-pos-independiente', chapter: 'integracion', kind: 'cards',
        title: 'El contrato expresa el negocio del POS',
        lead: 'No copiamos las tablas ni los estados internos del ERP al resto del producto.',
        items: [
          { title: 'Capacidad concreta', text: 'Registrar venta, registrar pago, consultar resultado o registrar devolución.' },
          { title: 'Identidad estable', text: 'Operación, entidad legal, país, destino y versión de contrato.' },
          { title: 'Dinero y tiempo', text: 'Moneda, escala, fecha del hecho, zona y fecha comercial explícitas.' },
          { title: 'Resultado con significado', text: 'Aceptado, rechazado, registrado, contabilizado o resultado desconocido.' }
        ],
        takeaway: 'Un HTTP 200 describe transporte; el contrato debe explicar qué ocurrió con el negocio.',
        notes: [
          'La fecha del hecho y la fecha contable pueden diferir. Ventas atrasadas y periodos cerrados necesitan una regla acordada con Finanzas.',
          'No extrapolar a Perú o España convenciones implícitas de importes enteros o identificadores existentes en Chile.',
          'El mismo intento conserva identidad y payload. Una corrección genera una operación relacionada y auditable; no modifica silenciosamente el intento original.',
          'El destino debe ofrecer unicidad y consulta fiable por referencia, o la limitación debe resolverse antes del piloto financiero.'
        ], source: proposal
      },
      {
        id: 'fachada-acl-adaptador', chapter: 'integracion', kind: 'compare',
        title: 'Tres responsabilidades complementarias',
        lead: 'Fachada, ACL y adaptador pueden vivir en un módulo; no obligan a desplegar tres servicios.',
        columns: [
          { title: 'Fachada', items: ['Ofrece una capacidad estable', 'Oculta la coordinación interna', 'Habla el contrato del POS'] },
          { title: 'ACL', items: ['Traduce significados entre modelos', 'Mapea IDs, estados, dinero y fechas', 'Evita filtrar conceptos del ERP'] },
          { title: 'Adaptador', items: ['Ejecuta el protocolo del destino', 'Implementa REST, WCF, SDK u otro', 'Devuelve evidencia y errores tipados'] }
        ],
        takeaway: 'ACL significa capa anticorrupción; aquí no se refiere a una lista de control de acceso.',
        notes: [
          'Una fachada que expone los mismos DTO y estados de AX sigue acoplando sus consumidores a AX. Renombrar campos no basta para independizar el modelo.',
          'La política de reintentos y el workflow monetario pertenecen a la aplicación. Las reglas de ofertas pertenecen al dominio de precios, no a la traducción AX.',
          'Las equivalencias requieren glosario y pruebas. Venta, pedido, deuda y documento fiscal no son sinónimos porque dos sistemas usen etiquetas parecidas.'
        ], source: proposal
      },
      {
        id: 'codigo-frontera-erp', chapter: 'integracion', kind: 'code',
        title: 'La diferencia del ERP queda en su frontera',
        lead: 'El caso de uso conoce una capacidad y un resultado. La ACL conoce las equivalencias del sistema externo.',
        code: {
          language: 'typescript', label: 'Pseudocódigo · integración con destino ya asignado', highlights: '1-2|4-9',
          source: 'const result = await integration.registerSale(operation);\nawait outcomes.persist(operation.id, result);\n\n// Dentro de la implementación para el destino asignado:\nasync function registerInAx(operation: PosOperation) {\n  const request = axAcl.toRegisterRequest(operation);\n  const evidence = await axAdapter.register(request);\n  return axAcl.toOperationOutcome(evidence);\n}'
        },
        takeaway: 'La ACL protege significados; no hace atómica una llamada de red con PostgreSQL.',
        notes: [
          'El fragmento omite expresamente el workflow completo para mostrar las dependencias. El producto debe persistir intención e identidad antes de invocar el adaptador.',
          'Si el destino aplica el efecto y se pierde la respuesta, debe consultarse la referencia o usar idempotencia remota demostrada. No repetir automáticamente con otro ID.',
          'toOperationOutcome no convierte cualquier excepción en rejected. Timeout y respuesta perdida pueden producir outcome_unknown.',
          'Los identificadores externos se almacenan con sistema, instancia, empresa y tipo de objeto. Una columna genérica id_externo no basta para la coexistencia.'
        ], source: resilience
      },
      {
        id: 'cambio-de-erp', chapter: 'integracion', kind: 'cards',
        title: 'Cambiar de ERP sin perder los pendientes',
        lead: 'La política asigna un destino a cada operación. Un reintento no elige simplemente el ERP que hoy está activo.',
        items: [
          { kicker: '1', title: 'Preparar contratos', text: 'Glosario, mappings y comparación con datos de referencia.' },
          { kicker: '2', title: 'Clasificar pendientes', text: 'No enviados, confirmados, rechazados, inciertos y dependientes.' },
          { kicker: '3', title: 'Cortar con identidad', text: 'Destino y época capturados; cajas atrasadas siguen una política explícita.' },
          { kicker: '4', title: 'Conciliar y retirar', text: 'Resolver históricos y dependencias antes de eliminar el adaptador anterior.' }
        ],
        takeaway: 'Revertir routing o binarios no deshace un asiento contable ya realizado.',
        notes: [
          'La comparación paralela debe ser en lectura o simulación. No enviar dos comandos reales de contabilización para comprobar si ambos ERPs coinciden.',
          'Una venta creada offline antes del corte conserva su contexto histórico; llegar tarde no determina por sí solo el nuevo destino.',
          'Una devolución nueva puede referir una venta del ERP anterior. Mantener referencias y tratamiento contable acordados en lugar de recrear la factura.',
          'La migración ERP y la del POS son programas relacionados, pero no equivalentes. Sustituir un adaptador no demuestra que todas las reglas y procesos del nuevo ERP sean compatibles.'
        ], source: resilience
      },
      {
        id: 'incorporar-pais', chapter: 'integracion', kind: 'compare',
        title: 'Ejemplo: incorporar un segundo perfil nacional',
        lead: 'El ejercicio debe mostrar exactamente qué reutilizamos, qué configuramos y qué desarrollamos.',
        columns: [
          { title: 'Reutilizar', items: ['Casos de uso de venta y caja', 'Outbox, auditoría e identidades', 'Pruebas del núcleo común'] },
          { title: 'Configurar', items: ['Entidad, moneda y formatos soportados', 'Módulos y permisos aprobados', 'Proveedores ya compatibles'] },
          { title: 'Implementar y homologar', items: ['Políticas nacionales faltantes', 'Adaptador del proveedor nuevo', 'Reglas y pruebas de la combinación'] }
        ],
        takeaway: 'El éxito se demuestra con el mismo producto y pruebas comunes, preservando diferencias explícitas.',
        notes: [
          'Una nueva regla puede exigir evolucionar el contrato o un módulo del núcleo. El criterio es una evolución compartida y controlada, no prohibir todo cambio.',
          'Homologar una combinación incluye núcleo, contrato, perfil, adaptador, SDK, sistema operativo, modelo y firmware cuando corresponde.',
          'No afirmar equivalencias fiscales entre países ni soporte universal de proveedores. Los nombres Chile, Perú y España ubican el alcance, no acreditan el cumplimiento de cada régimen.'
        ], source: extensions
      },
      {
        id: 'arbol-nx', chapter: 'monorepo', kind: 'tree',
        title: 'Un monorepo, varios artefactos',
        lead: 'Organizamos por dominios y aplicaciones. Compartir repositorio no obliga a desplegar todo junto.',
        code: {
          source: 'apps/\n  pos-desktop/     pos-runtime/     pos-sync-worker/\n  country-api/     erp-worker/      backoffice/\nlibs/\n  sales/          cash/            pricing/\n  payments/       returns/         fiscal/\n  erp/            sync/\n  contracts/      shared-kernel/   ui/\n# Dentro de un dominio, cuando aporte un límite real:\nlibs/pricing/{domain, application, infrastructure}/'
        },
        items: [
          { title: 'Apps', text: 'Componen dependencias y producen ejecutables o despliegues.' },
          { title: 'Dominios', text: 'Poseen reglas, contratos públicos, datos y pruebas.' },
          { title: 'Capas internas', text: 'Separan reglas, casos de uso y accesos técnicos donde es necesario.' }
        ],
        takeaway: 'Nx organiza proyectos y tareas; no decide cuántos servidores existen.',
        notes: [
          'Este árbol es una organización propuesta del producto futuro. No afirma que todos estos procesos existan ya en la maqueta.',
          'pos-desktop incorpora Angular y el proyecto Tauri; pos-runtime es el backend de sucursal del perfil WAN. Los workers se supervisan independientemente de la UI.',
          'No generar una biblioteca Nx por cada clase o carpeta. Crear proyectos donde se necesite una frontera controlable, y configurar sus etiquetas y tareas.',
          'Evitar un shared gigantesco que exponga ORM y modelos de todos los módulos. shared-kernel conserva tipos mínimos como dinero e identidad.'
        ], source: technology
      },
      {
        id: 'reglas-de-dependencia', chapter: 'monorepo', kind: 'compare',
        title: 'El dominio debe poder probarse sin el framework',
        lead: 'Las dependencias apuntan hacia contratos y reglas, no hacia detalles de un proveedor.',
        columns: [
          { title: 'Domain', items: ['Reglas y tipos de negocio', 'Sin Angular, Nest, SQL ni SDK', 'Pruebas puras y deterministas'] },
          { title: 'Application', items: ['Casos de uso y coordinación', 'Puertos que necesita el dominio', 'Autorización y unidad de trabajo'] },
          { title: 'Infrastructure', items: ['PostgreSQL y clientes técnicos', 'Adaptadores y traducciones', 'Composición en las aplicaciones'] }
        ],
        takeaway: 'La interfaz consume contratos públicos; nunca credenciales o repositorios de base de datos.',
        notes: [
          'La separación por capas se aplica dentro de cada dominio cuando sea útil. No crear carpetas globales que hagan difícil identificar al dueño de una regla.',
          'Cada módulo controla su interfaz pública y sus migraciones. Otro módulo no lee libremente su ORM porque ambos estén en el mismo monorepo.',
          'La separación de importaciones no sustituye permisos SQL, controles de ejecución o contratos de protocolos. Todos esos límites requieren mecanismos propios.'
        ], source: technology
      },
      {
        id: 'limites-nx-en-ci', chapter: 'monorepo', kind: 'code',
        title: 'Convertir una regla de arquitectura en una comprobación',
        lead: 'Las etiquetas de proyectos permiten detectar dependencias prohibidas antes de integrarlas.',
        code: {
          language: 'json', label: 'Fragmento conceptual · opciones de enforce-module-boundaries', highlights: '3-6',
          source: '{\n  "depConstraints": [\n    {\n      "sourceTag": "layer:domain",\n      "onlyDependOnLibsWithTags": ["layer:domain", "scope:shared-kernel"]\n    }\n  ]\n}'
        },
        takeaway: 'Una carpeta no impone límites. Proyectos, etiquetas, reglas y pruebas sí pueden verificarlos.',
        notes: [
          'El fragmento ilustra una de varias restricciones dentro de la regla ESLint @nx/enforce-module-boundaries; requiere proyectos reales y etiquetas declaradas.',
          'La restricción por capa no impide por sí sola todos los acoplamientos entre dominios. Añadir restricciones por scope y APIs públicas, y probar importaciones prohibidas y ciclos.',
          'Esta comprobación aplica a dependencias JavaScript/TypeScript. No valida automáticamente SQL ejecutado, permisos, procesos Rust o el contrato de una aplicación .NET.',
          'También deben ejecutarse pruebas de productor y consumidores cuando cambie un contrato, aunque los proyectos se construyan desde el mismo commit.'
        ], source: technology
      },
      {
        id: 'cadena-de-verificacion', chapter: 'monorepo', kind: 'cards',
        title: 'Comprobar el producto por capas',
        lead: 'Cada tipo de prueba demuestra una responsabilidad distinta.',
        items: [
          { title: 'Reglas puras', text: 'Precios, ofertas, redondeos, límites y casos de referencia.' },
          { title: 'Contratos', text: 'Productor y consumidor compatibles; variantes de proveedor y país.' },
          { title: 'Persistencia', text: 'Restricciones, transacciones, duplicados y activación atómica.' },
          { title: 'Recuperación', text: 'Cortes en fronteras, replay, restauración y efectos inciertos.' }
        ],
        takeaway: 'Un build exitoso no demuestra que una venta sobreviva a un fallo.',
        notes: [
          'Nx puede ejecutar tareas afectadas por cambios y reutilizar resultados válidos de tareas reproducibles. No vuelve cacheables migraciones, despliegues ni llamadas con efectos externos.',
          'Las entradas, salidas, plataforma y toolchain deben formar parte de la configuración de caché. No reutilizar un binario incompatible solo porque el código TypeScript no cambió.',
          'Rust/Tauri y componentes .NET conservan sus herramientas nativas. Nx puede coordinarlas, pero no sustituye Cargo, firma ni homologación de periféricos.'
        ], source: technology
      },
      {
        id: 'versiones-y-anillos', chapter: 'monorepo', kind: 'cards',
        title: 'Desplegar una combinación compatible',
        lead: 'Las cajas pueden permanecer desconectadas mientras el país evoluciona. Las versiones mixtas son parte del diseño.',
        items: [
          { kicker: '1', title: 'Versionar', text: 'Contrato, núcleo, perfiles, adaptadores y artefactos identificables.' },
          { kicker: '2', title: 'Homologar', text: 'Validar la combinación con proveedor, SDK, sistema operativo y dispositivo.' },
          { kicker: '3', title: 'Desplegar por anillos', text: 'Laboratorio, piloto y ampliación con evidencia y responsables.' },
          { kicker: '4', title: 'Recuperar', text: 'Reversión compatible con datos, operaciones pendientes y esquemas.' }
        ],
        takeaway: 'Mismo commit no significa despliegue simultáneo ni compatibilidad automática.',
        notes: [
          'El esquema nuevo debe convivir durante el horizonte acordado con clientes, mensajes y restauraciones antiguos. Expandir, migrar y retirar de forma controlada.',
          'Una versión instalada no demuestra compatibilidad. El catálogo debe registrar qué combinaciones están en laboratorio, homologadas, en piloto o retiradas.',
          'Revertir binarios puede ser inseguro tras una migración destructiva. La estrategia de rollback necesita demostrar lectura de datos y recuperación de intentos previos.',
          'Las verificaciones automáticas de un dispositivo nuevo no deben generar cobros, documentos fiscales o impresiones sorpresivas.'
        ], source: extensions
      },
      {
        id: 'reutilizar-plataforma', chapter: 'monorepo', kind: 'compare',
        title: 'Reutilizar la plataforma corporativa con límites',
        lead: 'Consumir piezas compatibles evita duplicar trabajo. La operación de sucursal conserva sus dependencias locales.',
        columns: [
          { title: 'Bibliotecas de core', items: ['Logs, correlación y contratos', 'Paquetes versionados y responsables', 'Arranque local sin servicios centrales'] },
          { title: 'APIs corporativas', items: ['Capacidades y dueños confirmados', 'Datos necesarios distribuidos a tienda', 'No consulta remota por cada venta offline'] },
          { title: 'devops-platform', items: ['Acciones CI/CD fijadas por versión', 'Adaptación a artefactos y flota POS', 'Entrega a tienda validada por separado'] }
        ],
        takeaway: 'Reutilizar código no implica heredar todas las dependencias de ejecución del sistema original.',
        notes: [
          'El repositorio corporativo llamado core y el núcleo de dominio POS son conceptos diferentes. Una biblioteca se adopta por contrato y evidencia, no por su nombre.',
          'Las APIs corporativas pueden participar en publicación de maestros e integración central. No deben convertirse en requisito sincrónico para una venta habilitada offline.',
          'La propuesta recomienda un monorepo POS con releases propios que consume bibliotecas y acciones corporativas. La ubicación definitiva y propiedad deben acordarse.',
          'Las acciones existentes de despliegue cloud no acreditan distribución, firma, actualización y recuperación de la flota de sucursales.'
        ], source: corporate
      },
      {
        id: 'observabilidad-y-recuperacion', chapter: 'operacion', kind: 'cards',
        title: 'Operar con evidencia y una acción posible',
        lead: 'Una alerta útil identifica el ámbito, la causa probable y quién puede resolverlo.',
        items: [
          { title: 'Pendientes', text: 'Cantidad, antigüedad, destino, causa y capacidad de recuperación.' },
          { title: 'Precios', text: 'Versión activa, recibida y aplicada, vigencia y resultado de validación.' },
          { title: 'Efectos inciertos', text: 'Intentos de pago, fiscalidad o ERP que necesitan consulta o conciliación.' },
          { title: 'Restauración', text: 'RPO/RTO por fallo, exclusión del escritor anterior y ensayo con replay.' }
        ],
        takeaway: 'Una cola vacía no demuestra que el dinero y los documentos estén conciliados.',
        notes: [
          'Correlacionar con eventId, operationId, saleId y traceId según la frontera. No registrar datos de tarjeta ni secretos; limitar acceso y retención de datos personales.',
          'La conciliación compara conteos, importes por moneda, referencias, medios de pago y día comercial. Una proyección incompleta muestra su cobertura y frescura.',
          'El commit local no recupera un disco destruido. El ACK central no evita que un restore retroceda a antes de ese ACK: se necesita retención y reconciliación del historial.',
          'El antiguo escritor y el restaurado no pueden operar simultáneamente con la misma autoridad. Definir identidad, época y fencing del procedimiento.'
        ], source: resilience
      },
      {
        id: 'capacidad-del-backlog', chapter: 'operacion', kind: 'compare',
        title: 'La cola solo se vacía si hay capacidad sobrante',
        lead: 'Reconectar todas las sucursales a la vez puede saturar el ERP aunque cada tienda funcione bien.',
        columns: [
          { title: 'Medir', items: ['Trabajo nuevo por unidad de tiempo', 'Éxitos efectivos por destino', 'Tamaño y antigüedad del backlog'] },
          { title: 'Regular', items: ['Concurrencia y caudal acotados', 'Backoff con dispersión temporal', 'Admisión escalonada tras reconexión'] },
          { title: 'Demostrar', items: ['Recuperación con tráfico nuevo', 'Presupuesto y ventanas reales', 'Sin descartar obligaciones para vaciar'] }
        ],
        takeaway: 'Si completamos tanto como llega, el atraso no disminuye.',
        notes: [
          'Ejemplo educativo: backlog de 600 trabajos, 10 nuevos por minuto y 30 éxitos por minuto da aproximadamente 30 minutos de drenaje, si las tasas se mantienen y los trabajos son comparables.',
          'La aproximación es backlog dividido por capacidad de éxito menos llegadas. No es un SLA: dependencias, cuotas, tamaños y reintentos pueden cambiar el resultado.',
          'Contar mensajes puede ocultar lotes de miles de registros. Medir también bytes, registros y tiempo de servicio por destino.',
          'La ventana de recuperación debe conservar capacidad para tráfico nuevo. Un mensaje inválido necesita cuarentena; una operación monetaria no se elimina solo por superar intentos o TTL.'
        ], source: resilience
      },
      {
        id: 'pregunta-ack-perdido', chapter: 'operacion', kind: 'quiz',
        title: 'Comprueba la entrega durable',
        lead: 'País confirmó inbox, efecto y outbox, pero el ACK no llegó a sucursal.',
        question: '¿Cómo debe reenviar la sucursal?',
        options: [
          { label: 'Con el mismo eventId y el mismo contenido.', correct: true, feedback: 'El receptor reconoce la identidad y devuelve un resultado equivalente sin repetir el efecto local.' },
          { label: 'Con un ID nuevo para que la cola no lo rechace.', correct: false, feedback: 'Un ID nuevo oculta que es el mismo intento y puede producir un efecto duplicado.' },
          { label: 'No reenvía: cualquier timeout equivale a confirmación.', correct: false, feedback: 'La sucursal todavía no tiene el acuse acordado. Debe recuperar el resultado mediante el protocolo.' }
        ],
        takeaway: 'La identidad sobrevive a los reintentos; la garantía depende del contrato y su retención.',
        notes: [
          'Preguntar además qué pasa si el mismo ID trae otro payload: se rechaza como conflicto, no se acepta como actualización.',
          'El resultado equivalente aquí corresponde al efecto local del receptor. No acredita contabilización ERP ni liquidación de pago.',
          'Completar el ejercicio con restore anterior al ACK: una deduplicación que retrocedió necesita reconstrucción y conciliación; no basta conservar filas mientras todo marcha bien.'
        ], source: resilience
      },
      {
        id: 'pregunta-pais-nuevo', chapter: 'operacion', kind: 'quiz',
        title: 'Comprueba el objetivo corporativo',
        lead: 'El siguiente país requiere un proveedor fiscal que todavía no soportamos.',
        question: '¿Qué cambio respeta la propuesta?',
        options: [
          { label: 'Copiar el repositorio y mantener un POS por país.', correct: false, feedback: 'Crea forks que duplican reglas y pruebas. La meta es evolucionar un producto común.' },
          { label: 'Agregar el nombre del proveedor al perfil y activarlo.', correct: false, feedback: 'Configuración no implementa un protocolo inexistente ni demuestra homologación.' },
          { label: 'Implementar su extensión, validar contratos y homologar el perfil.', correct: true, feedback: 'Se conserva el núcleo donde aplica y se evoluciona lo necesario con pruebas de regresión y compatibilidad.' }
        ],
        takeaway: 'El producto común evoluciona: no ignora las diferencias ni promete resolverlas todas con parámetros.',
        notes: [
          'Si la nueva regla no cabe en el contrato vigente, se propone una evolución compatible del contrato y los módulos afectados. No esconderla dentro de un adaptador incorrecto.',
          'La evidencia incluye qué código se compartió, qué configuración cambió, qué extensión se implementó y qué combinación quedó homologada.',
          'La fiscalidad requiere validación del régimen y proveedor correspondientes. Esta pregunta enseña la organización del software, no una solución jurídica universal.'
        ], source: proposal
      },
      {
        id: 'criterios-del-piloto', chapter: 'operacion', kind: 'closing',
        title: 'El siguiente paso es demostrar el producto',
        lead: 'Un corte vertical y un segundo perfil nacional deben probar reutilización, integridad y operación recuperable.',
        items: [
          { title: 'Producto común', text: 'Mismo núcleo, contratos claros y extensiones nacionales identificadas.' },
          { title: 'Evidencia técnica', text: 'Precios coherentes, venta durable, entrega, ERP y fallos recuperados.' },
          { title: 'Operación gobernada', text: 'Responsables, compatibilidad, observabilidad y despliegue gradual.' }
        ],
        links: [
          { label: 'Propuesta y ADR', url: '../docs/propuesta-arquitectura.md' },
          { label: 'Diagramas editables', url: '../docs/diagramas-excalidraw/index.html' },
          { label: 'Pruebas del piloto', url: '../docs/validacion-y-decisiones.md' },
          { label: 'POS Platform', url: 'index.html' }
        ],
        takeaway: 'Una plataforma que incorpora países sin rehacer el POS, con garantías que el equipo puede explicar y probar.',
        notes: [
          'Acordar primero capacidades comunes, variantes nacionales, propietarios y evidencia de aceptación. Evitar convertir la selección de herramientas en el objetivo del piloto.',
          'El corte vertical cubre una venta, caja, pago, documento, commit, entrega, integración y trazabilidad. El segundo perfil demuestra qué se reutiliza y qué se extiende.',
          'Probar desconexión, resultado incierto, descarga parcial, duplicados, restauración y versiones mixtas. Conservar datos y resultados; esta presentación no sustituye esas pruebas.',
          'BullMQ y RabbitMQ entran solamente si sus casos justifican la operación adicional. La base puede validar sus invariantes antes de añadir ambos.',
          'Los ejemplos son educativos y utilizan datos ficticios. Antes de convertirlos en producto deben cerrarse contratos, controles, homologación y responsabilidad operativa.'
        ], source: proposal
      }
    ],
    glossary: [
      { term: 'Núcleo común', meaning: 'Casos de uso, reglas y contratos que el producto comparte entre países.' },
      { term: 'Perfil', meaning: 'Configuración completa, versionada y aprobada para país, entidad, sucursal y caja.' },
      { term: 'Homologación', meaning: 'Evidencia de que una combinación concreta de software, proveedor y dispositivo cumple su contrato.' },
      { term: 'C4', meaning: 'Vistas de contexto, contenedores, componentes y código para explicar un sistema a distintas escalas.' },
      { term: 'LAN / WAN', meaning: 'Red de sucursal / conexión entre la sucursal y plataformas externas. Perder una no equivale a perder la otra.' },
      { term: 'Autoridad', meaning: 'Sistema o módulo responsable de aceptar y corregir un dato o efecto de negocio.' },
      { term: 'Commit', meaning: 'Confirmación de una transacción dentro de una base de datos; no incluye por sí sola efectos en proveedores externos.' },
      { term: 'Outbox', meaning: 'Registro durable de eventos a entregar, escrito en la misma transacción que el cambio de negocio.' },
      { term: 'Inbox', meaning: 'Registro durable de entradas e identidad, utilizado junto al efecto local para recuperar y reconocer reenvíos.' },
      { term: 'ACK', meaning: 'Acuse con una garantía acotada a quien lo emite. Debe aclararse si es de aplicación, consumidor o transporte.' },
      { term: 'Idempotencia', meaning: 'Repetir el mismo intento reconocido no produce otra vez el efecto definido por el contrato.' },
      { term: 'Snapshot', meaning: 'Conjunto de datos coherente asociado a una versión y punto de continuidad del origen.' },
      { term: 'Delta', meaning: 'Cambio incremental con identidad, ámbito, versión y reglas de orden o cobertura.' },
      { term: 'Watermark', meaning: 'Punto consistente del origen que permite enlazar un snapshot con cambios posteriores.' },
      { term: 'Staging', meaning: 'Área aislada donde se recibe y prepara información sin modificar la versión activa.' },
      { term: 'Candidata', meaning: 'Versión preparada para validación; todavía no está publicada para nuevas operaciones.' },
      { term: 'Cursor aplicado', meaning: 'Checkpoint que avanza cuando el efecto y su publicación quedaron confirmados, no solamente descargados.' },
      { term: 'Backoff', meaning: 'Espera creciente entre reintentos; la dispersión temporal evita que todos reintenten juntos.' },
      { term: 'Backlog', meaning: 'Trabajo pendiente durable, medido también por antigüedad y carga real.' },
      { term: 'Claim / lease', meaning: 'Propiedad temporal de un trabajo; necesita controles contra confirmaciones tardías de un worker que perdió la propiedad.' },
      { term: 'Fachada', meaning: 'Interfaz de una capacidad que oculta cómo se coordina su implementación.' },
      { term: 'ACL', meaning: 'Anti-Corruption Layer: traduce significados entre modelos sin propagar detalles del sistema externo.' },
      { term: 'Adaptador', meaning: 'Implementación técnica de un puerto: protocolo, SDK o acceso al proveedor.' },
      { term: 'Monorepo', meaning: 'Repositorio con varios proyectos; no implica que todos se desplieguen o ejecuten juntos.' },
      { term: 'Nx', meaning: 'Herramientas de desarrollo y CI para organizar proyectos, dependencias y tareas. No es runtime de la venta.' },
      { term: 'RPO / RTO', meaning: 'Objetivos de pérdida de datos tolerable / tiempo de recuperación, definidos para un ámbito y fallo concretos.' },
      { term: 'Resultado desconocido', meaning: 'No hay evidencia concluyente de éxito o rechazo; requiere consulta o conciliación antes de repetir un efecto.' },
      { term: 'Conciliación', meaning: 'Comparación de referencias, estados, conteos e importes para identificar y resolver diferencias.' }
    ],
    sources: [
      proposal, c4, technology, messaging, resilience, extensions, corporate,
      { label: 'Revisión corporativa y evolución ERP', url: '../docs/revision-arquitectura-corporativa.md' },
      { label: 'Validación y decisiones del piloto', url: '../docs/validacion-y-decisiones.md' },
      { label: 'Fuentes y diagramas Excalidraw', url: '../docs/diagramas-excalidraw/index.html' }
    ]
  };
})();

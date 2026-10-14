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
    title: 'POS Platform · Propuesta de arquitectura',
    chapters: [
      { id: 'producto', title: '01 · Producto y alcance' },
      { id: 'arquitectura', title: '02 · Arquitectura propuesta' },
      { id: 'venta', title: '03 · Venta e integridad' },
      { id: 'precios', title: '04 · Precios y ofertas offline' },
      { id: 'sincronizacion', title: '05 · Sincronización y mensajería' },
      { id: 'integracion', title: '06 · Integración y expansión' },
      { id: 'monorepo', title: '07 · Monorepo y entrega' },
      { id: 'operacion', title: '08 · Operación y piloto' }
    ],
    slides: [
      {
        "id": "un-producto-varios-paises",
        "chapter": "producto",
        "kind": "cover",
        "title": "Un POS corporativo. Varios países.",
        "lead": "Un producto que comparte las reglas de venta y caja, y adapta las diferencias de cada país.",
        "takeaway": "Incorporar un país debe aprovechar el núcleo común, sin crear otro POS.",
        "notes": [
          "La meta principal es una plataforma corporativa reutilizable. La continuidad offline es un requisito dentro de ese producto, junto con integridad, seguridad, experiencia común, reportes y operación.",
          "Chile, Perú y España son el alcance inicial de la propuesta. No se afirma que sus proveedores, contratos o reglas fiscales ya estén homologados.",
          "Esta presentación explica una arquitectura de referencia para desarrollar y validar. Los diagramas, simulaciones y fragmentos de código no acreditan una implementación productiva."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        id: 'ruta-de-aprendizaje', chapter: 'producto', kind: 'outline',
        title: 'Alcance de la propuesta',
        lead: 'Un producto común con autoridad de sucursal, precios locales e integración controlada por país.',
        items: [
          { kicker: '01–02', title: 'Producto y arquitectura', text: 'Qué compartimos y dónde se ejecuta cada responsabilidad.' },
          { kicker: '03–04', title: 'Venta y precios', text: 'Confirmación local y reglas que funcionan con una versión conocida.' },
          { kicker: '05–06', title: 'Sincronización e integración', text: 'Entrega durable, trabajos, eventos y traducción entre sistemas.' },
          { kicker: '07–08', title: 'Código y operación', text: 'Monorepo, versiones, evidencia y pruebas del piloto.' }
        ],
        takeaway: 'Las decisiones cubren producto, datos, integración, código y operación del mismo POS corporativo.',
        notes: [
          'Las simulaciones usan datos sintéticos para representar el funcionamiento propuesto y sus fallos. No se conectan a bancos, servicios fiscales, colas ni sistemas corporativos.',
          'La base combina Angular + Tauri, backend NestJS/Fastify y PostgreSQL de sucursal y país. Cliente y Nx son dirección indicada; backend, topología y garantías operativas requieren validación del piloto.'
        ], source: proposal
      },
      {
        id: 'objetivos-del-producto', chapter: 'producto', kind: 'cards',
        title: 'Objetivo: una plataforma POS multipaís',
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
        title: 'Alcance funcional de la operación',
        lead: 'El producto cubre el turno, la venta, el pago, el documento y su conciliación por país.',
        items: [
          { kicker: '1', title: 'Preparar', text: 'Abrir turno, validar capacidades y cargar datos autorizados.' },
          { kicker: '2', title: 'Cotizar y cobrar', text: 'Calcular con una versión de precios y resolver el intento de pago.' },
          { kicker: '3', title: 'Confirmar y documentar', text: 'Persistir la venta y entregar el documento permitido.' },
          { kicker: '4', title: 'Integrar y conciliar', text: 'Transmitir, registrar resultados y resolver diferencias.' }
        ],
        takeaway: 'Venta, pago, documento fiscal y asiento ERP son hechos relacionados, con estados distintos.',
        notes: [
          'Una venta puede estar confirmada localmente mientras su integración ERP está pendiente. Eso no significa que deba cobrarse otra vez.',
          'El orden y momento de documentación fiscal se ajustan al régimen y proveedor homologados. Esta secuencia de referencia no prescribe un flujo fiscal universal.',
          'La caja actual no administra stock según el alcance informado. Cualquier reserva de inventario pertenece al sistema confirmado como responsable; no se añade aquí por asociación con la palabra POS.'
        ], source: proposal
      },
      {
        "id": "estado-de-las-decisiones",
        "chapter": "producto",
        "kind": "compare",
        "title": "Decisiones técnicas y validaciones pendientes",
        "lead": "Angular + Tauri y Nx son la dirección indicada. Backend, datos y operación requieren validar la recomendación.",
        "columns": [
          {
            "title": "Dirección indicada",
            "items": [
              "Cliente Angular empaquetado en Tauri",
              "Monorepo organizado con Nx",
              "Un producto para varios países"
            ]
          },
          {
            "title": "Recomendación",
            "items": [
              "Backend NestJS + Fastify en sucursal y país",
              "PostgreSQL local y operativo por país",
              "Integración durable mediante workers"
            ]
          },
          {
            "title": "Validación pendiente",
            "items": [
              "Reglas y proveedores de cada país",
              "Recuperación y capacidad operativa",
              "Pruebas y aprobación del piloto"
            ]
          }
        ],
        "takeaway": "La maqueta visual y esta presentación no implementan por sí solas el backend objetivo.",
        "notes": [
          "El documento de propuesta y sus ADR son la fuente de decisión vigente. Las revisiones y diagramas sintetizan esa fuente; no cambian decisiones implícitamente.",
          "RabbitMQ, BullMQ o servicios gestionados son opciones para cargas concretas. Se necesita un motivo, un operador y una prueba antes de incorporarlos.",
          "El dimensionamiento, los SLA y la cantidad de cajas requieren inventario y pruebas. Los valores de las simulaciones no son compromisos de producción."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "contexto-del-pos",
        "chapter": "arquitectura",
        "kind": "diagram",
        "diagramKey": "context",
        "title": "C1 · El POS y sus fronteras",
        "lead": "El POS atiende cajas y supervisores e integra maestros, pagos, fiscalidad y ERP mediante contratos por país.",
        "takeaway": "Un núcleo común conserva sus reglas; cada proveedor mantiene su autoridad y su evidencia de resultado.",
        "notes": [
          "El cajero opera, el supervisor autoriza y revisa, y el equipo de plataforma supervisa entregas y recuperaciones. Son necesidades diferentes, no un único permiso administrador.",
          "La autoridad de catálogo y precios se confirma por atributo y país. No se adjudica automáticamente al ERP ni a la sucursal que guarda el espejo.",
          "Chile integra Dynamics AX on-premise; España, Gira; Perú, un sistema custom, según los antecedentes. Interfaces y capacidades de los destinos requieren validación.",
          "El documento fiscal, la liquidación del pago y el asiento contable no quedan demostrados por el ACK del POS central."
        ],
        "source": {
          "label": "Modelo C4 y contratos",
          "url": "../docs/c4-arquitectura-propuesta.md"
        }
      },
      {
        "id": "modulos-antes-que-servidores",
        "chapter": "arquitectura",
        "kind": "compare",
        "title": "Decisión: backend modular y PostgreSQL por sucursal",
        "lead": "NestJS + Fastify agrupa ventas, caja y precios; PostgreSQL confirma negocio y pendientes en una transacción.",
        "columns": [
          {
            "title": "Backend de sucursal",
            "items": [
              "Ventas, caja y precios conservan contratos propios.",
              "Una unidad de trabajo confirma negocio y outbox.",
              "Varias cajas comparten el escritor autorizado."
            ]
          },
          {
            "title": "Persistencia PostgreSQL",
            "items": [
              "Restricciones y transacciones sobre datos relacionados.",
              "Tablas y migraciones bajo el módulo propietario.",
              "Base operativa independiente para cada país."
            ]
          },
          {
            "title": "Consecuencias operativas",
            "items": [
              "La caída WAN deja pendiente la entrega a país.",
              "La pérdida del servidor puede detener la sucursal.",
              "Failover, respaldo y RTO/RPO requieren ensayo."
            ]
          }
        ],
        "takeaway": "La transacción local protege la venta; los workers integran fuera del camino de cobro.",
        "notes": [
          "Se recomienda un monolito modular de sucursal para coordinar venta, caja, auditoría y outbox sin una transacción distribuida. Cada módulo controla sus tablas, contratos y migraciones.",
          "PostgreSQL se recomienda por las relaciones, restricciones y transacciones requeridas por dinero, documentos e identidades. MongoDB admite transacciones, pero no aporta en este alcance una ventaja que justifique otra persistencia operativa.",
          "Los workers se supervisan por separado de la interfaz. Una extracción adicional de servicios requiere evidencia de escala, aislamiento o ciclo de entrega que compense su coste operativo.",
          "La transacción solo incluye recursos que participan en ella. Una llamada a pago o ERP no queda dentro del commit SQL por estar invocada desde la misma aplicación."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "contenedores-del-pos",
        "chapter": "arquitectura",
        "kind": "diagram",
        "diagramKey": "containers",
        "title": "C2 · Aplicaciones y datos con dueño",
        "lead": "El cliente opera por LAN; el backend confirma en PostgreSQL y los workers intercambian datos con la plataforma de país.",
        "takeaway": "La interfaz pide; el backend aplica reglas; PostgreSQL conserva registros; la entrega posterior tiene responsables propios.",
        "notes": [
          "Angular + Tauri hospeda la interfaz y las capacidades nativas autorizadas. No recibe credenciales SQL ni se convierte en otro escritor de ventas.",
          "El backend de sucursal, recomendado como NestJS + Fastify, confirma negocio y outbox en PostgreSQL. El sincronizador tiene permisos acotados sobre datos técnicos y espejos.",
          "La API de país confirma inbox, efecto local o proyección y outbox en su propia transacción antes del ACK de aplicación. Los workers ejecutan después la integración externa.",
          "PostgreSQL local y de país tienen responsabilidades diferentes. No son dos autoridades concurrentes que puedan editar libremente la misma venta."
        ],
        "source": {
          "label": "Modelo C4 y contratos",
          "url": "../docs/c4-arquitectura-propuesta.md"
        }
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
        "id": "backend-modular",
        "chapter": "arquitectura",
        "kind": "diagram",
        "diagramKey": "backend",
        "title": "C3 · Módulos del backend de sucursal",
        "lead": "Acceso, precios, ventas, caja, pagos y fiscalidad colaboran con una unidad de trabajo local.",
        "takeaway": "Cada módulo controla sus datos; la unidad de trabajo confirma conjuntamente los cambios locales acordados.",
        "notes": [
          "Acceso valida identidad, puesto, sucursal y capacidad real. Ocultar una opción en la UI no reemplaza la autorización del backend.",
          "Precios evalúa una versión local validada. Pagos y fiscalidad mantienen sus intentos, referencias y resultados. Caja posee turnos y movimientos.",
          "La unidad de trabajo confirma los cambios locales que deben ser atómicos junto con auditoría y outbox. No se mantiene la transacción SQL abierta esperando a un banco o al ERP.",
          "Extraer un microservicio requiere una necesidad comprobada de escala, aislamiento, seguridad o ciclo de entrega; no basta tener muchas carpetas."
        ],
        "source": {
          "label": "Modelo C4 y contratos",
          "url": "../docs/c4-arquitectura-propuesta.md"
        }
      },
      {
        "id": "idempotencia-desde-cero",
        "chapter": "venta",
        "kind": "compare",
        "title": "Contrato de identidad y recuperación del POS",
        "lead": "Cada operación conserva identidad y contenido entre reintentos; el receptor recupera su resultado sin duplicar el efecto.",
        "columns": [
          {
            "title": "Misma operación",
            "items": [
              "Identidad: venta V-42, evento E-42.",
              "Mismo contenido en cada reenvío.",
              "Se recupera el resultado acordado para ese intento."
            ]
          },
          {
            "title": "Nueva operación",
            "items": [
              "Un ID nuevo parece un intento diferente.",
              "Puede producir otro registro o efecto.",
              "Una corrección necesita relación y autorización explícitas."
            ]
          },
          {
            "title": "Protección durable",
            "items": [
              "Inbox con clave única de origen, consumidor e ID.",
              "Efecto local y deduplicación en el mismo commit.",
              "Retención compatible con replay y restauración."
            ]
          }
        ],
        "takeaway": "La misma identidad con contenido distinto es un conflicto; no una actualización silenciosa.",
        "notes": [
          "La propiedad se define por frontera. Una inbox puede proteger el efecto local, pero no vuelve idempotente automáticamente un cobro o registro externo.",
          "Si el proveedor pudo aplicar el efecto y no devolvió respuesta, consultar o conciliar según su contrato antes de repetir.",
          "Reintentar con una identidad nueva impide reconocer el mismo intento y puede duplicar su efecto. La recuperación de un timeout conserva la identidad y consulta o concilia el resultado según el contrato."
        ],
        "source": {
          "label": "Propuesta y límites de confirmación",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "laboratorio-venta",
        "chapter": "venta",
        "kind": "lab",
        "lab": "sale",
        "title": "Venta local: confirmación y entrega posterior",
        "lead": "Caso simulado de CLP 11.400: pago resuelto, venta confirmada en sucursal y entrega recuperable a país.",
        "takeaway": "La confirmación local necesita evidencia durable; la WAN no es el commit de la venta.",
        "notes": [
          "El caso de fallo WAN conserva disponibles el backend de sucursal y PostgreSQL. La venta puede confirmarse localmente mientras la entrega a país permanece pendiente.",
          "La intención de venta y de pago conserva una identidad estable antes de llamar a un proveedor. El pago se resuelve según el contrato real del medio usado.",
          "El commit final conserva venta, referencias de pago, movimientos, auditoría y outbox. La emisión fiscal depende de su régimen; no se supone una transacción distribuida con el proveedor.",
          "Un fallo de impresión permite reimprimir el mismo documento. No debe crear otra venta ni volver a cobrar."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        id: 'commit-y-outbox', chapter: 'venta', kind: 'code',
        title: 'La venta y su evento se guardan juntos',
        lead: 'La transacción de sucursal confirma venta, movimiento de caja, auditoría y evento pendiente de entrega.',
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
        title: 'Espejo local y motor de precios en sucursal',
        lead: 'PostgreSQL conserva catálogo, precios y ofertas versionados; el backend calcula sin consultar precios remotos por venta.',
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
        "id": "snapshot-y-delta-desde-cero",
        "chapter": "precios",
        "kind": "compare",
        "title": "Dos canales para sincronizar precios y ofertas",
        "lead": "Deltas por eventos para actualización continua; snapshots programados para carga inicial, conciliación y reparación.",
        "columns": [
          {
            "title": "Carga masiva programada",
            "items": [
              "Catálogo y reglas completos por ámbito y watermark.",
              "Manifiesto, partes y bajas incluidas hasta el corte.",
              "Ejecución programada o manual autorizada."
            ]
          },
          {
            "title": "Eventos incrementales",
            "items": [
              "Altas, modificaciones y bajas con identidad estable.",
              "Aplicación sobre una base compatible y conocida.",
              "Huecos bloquean publicación hasta recuperar cobertura."
            ]
          },
          {
            "title": "Publicación compartida",
            "items": [
              "Candidata aislada de la versión activa.",
              "Validación de cobertura, reglas y compatibilidad.",
              "Activación atómica con checkpoint aplicado."
            ]
          }
        ],
        "takeaway": "Un delta reduce lo transportado; no autoriza a mostrar una versión parcialmente actualizada.",
        "notes": [
          "La carga completa puede distribuirse en partes reanudables. Su manifiesto declara cobertura, ámbito y corte consistente; las bajas hasta ese corte también deben quedar representadas.",
          "Los eventos se entregan mediante el protocolo durable de sincronización. El contrato conserva identidad, base y secuencia por ámbito; el sistema vigente debe demostrar que publica todos los cambios requeridos.",
          "La carga masiva no reemplaza ni ignora los eventos posteriores al watermark. Ambos caminos construyen una candidata completa y usan la misma validación y activación."
        ],
        "source": {
          "label": "Carga completa e incremental de precios",
          "url": "../docs/operacion-caja-y-evolucion.md"
        }
      },
      {
        id: 'contrato-del-calculo', chapter: 'precios', kind: 'code',
        title: 'Un cálculo reproducible y explicable',
        lead: 'La misma entrada y versión deben producir el mismo resultado en nodos homologados.',
        code: {
          language: 'typescript', label: 'Contrato propuesto · cálculo local con versión fija', highlights: '1-6|7-10',
          source: 'const quote = pricing.quote({\n  cart: [{ sku: "SKU-01", quantity: 2 }],\n  customerGroup: "general",\n  pricingVersion: "CL-2026-42",\n  businessTime: approvedBusinessTime\n});\n// Ejemplo: 2 × $10.000, descuento 10 % → $18.000\nquote.total;        // { amountMinor: "18000", currency: "CLP" }\nquote.appliedRules; // ["PROMO-10"]\nquote.pricingVersion; // "CL-2026-42"'
        },
        takeaway: 'Persistir el importe y por qué resultó ese importe.',
        notes: [
          'El ejemplo usa importes ficticios y omite el detalle tributario. El contrato de producción debe definir escala, impuestos y redondeos de cada moneda y régimen.',
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
          'La entrega ordenada, un duplicado y un hueco requieren tratamientos distintos. Guardar la recepción permite recuperar sin declarar que ese cambio ya está aplicado.',
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
          'Los valores v102 y checkpoint 102 pertenecen a la simulación. El contrato real mantiene separados la identidad de versión y el cursor; sus IDs no se ordenan como texto ni se derivan entre sí.',
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
        id: 'sincronizador-por-dentro', chapter: 'sincronizacion', kind: 'diagram', diagramKey: 'sync',
        title: 'C3 · El sincronizador conserva el progreso',
        lead: 'Un proceso supervisado entrega operaciones, recupera entradas y publica versiones locales validadas.',
        takeaway: 'Sincronizar incluye reanudar y demostrar resultados; no solo copiar datos.',
        notes: [
          'La salida reclama filas ya confirmadas de outbox y las entrega con identidad estable. La entrada conserva recepción, staging y cursor antes de declarar aplicación.',
          'El planificador aplica calendario, capacidad y límites. Los estados se recuperan al reiniciar: arrancar el proceso no implica volver automáticamente a Running si estaba en mantenimiento.',
          'El worker tiene permisos sobre datos técnicos y espejos. Una actualización que afecte dinero debe pasar por el caso de uso y autoridad del módulo, nunca por un job genérico de SQL.',
          'Para precios, todos los caminos hacia activación pasan por una candidata completa y validación. La deduplicación reconoce la entrega, pero no autoriza a publicar datos sin comprobar cobertura y compatibilidad.'
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
        title: 'Estados de confirmación en la cadena POS',
        lead: 'Sucursal, país, ERP y conciliación confirman resultados distintos, con evidencia y pendientes propios.',
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
        title: 'Base de mensajería y extensiones evaluadas',
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
          'La opción BullMQ simulada utiliza Redis; su documentación también contempla PostgreSQL. La selección de versión, backend, soporte y recuperación requiere validación antes de incorporarla a la base propuesta.'
        ], source: messaging
      },
      {
        id: 'laboratorio-bullmq', chapter: 'sincronizacion', kind: 'lab', lab: 'bullmq',
        title: 'BullMQ · Coordinación central de trabajos',
        lead: 'Trabajos de país programados o manuales, con reintentos y resultado persistido.',
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
        title: 'RabbitMQ · Distribución a ERP y reportes',
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
        "id": "fachada-e-interfaz-en-codigo",
        "chapter": "integracion",
        "kind": "code",
        "title": "Fachada de integración con contrato propio del POS",
        "lead": "Un contrato POS conecta el worker con la ACL y el adaptador del ERP asignado.",
        "code": {
          "language": "typescript",
          "label": "Conceptual · contrato POS y fachada sin proveedor concreto",
          "highlights": "1-3|4-8|9-10",
          "source": "interface RegistroVentaPort {\n  registrar(op: VentaPos): Promise<ResultadoPos>;\n}\nclass IntegracionFacade {\n  constructor(private registro: RegistroVentaPort) {}\n  integrarVenta(op: VentaPos) {\n    return this.registro.registrar(op);\n  }\n}\n// Se inyecta la frontera: ACL + adaptador."
        },
        "takeaway": "Cambiar el proveedor mantiene la entrada del POS y exige validar el contrato y la implementación de su frontera.",
        "notes": [
          "RegistroVentaPort conserva la capacidad de registro propia del POS. IntegracionFacade la expone al worker; la composición por país selecciona la implementación compatible con el destino de la operación.",
          "VentaPos y ResultadoPos son tipos conceptuales propios del POS. No son tablas del ERP ni respuestas de una biblioteca HTTP.",
          "Se omiten persistencia de intención, autorización, selección de destino y recuperación para centrar la explicación. Deben existir en el flujo real antes de invocar efectos externos.",
          "El destino se fija por operación y su ruta se conserva en reintentos. Un cambio de configuración no redirige automáticamente un pendiente ni sus consultas al ERP nuevo."
        ],
        "source": {
          "label": "Límites del código propuesto",
          "url": "../docs/opciones-tecnologicas.md"
        }
      },
      {
        "id": "acl-traduce-significado",
        "chapter": "integracion",
        "kind": "compare",
        "title": "ACL del ERP: dinero, tiempo y estados del POS",
        "lead": "La frontera de cada proveedor traduce unidades, fechas y resultados al contrato común del POS. Datos ilustrativos, no contrato de AX.",
        "columns": [
          {
            "title": "Dinero",
            "items": [
              "Proveedor: importe «11400», unidad pesos CLP.",
              "POS: valor decimal 11400 con moneda CLP explícita.",
              "No dividir por 100 sin conocer la unidad del contrato."
            ]
          },
          {
            "title": "Tiempo",
            "items": [
              "Proveedor: instante UTC con fecha y hora.",
              "POS: conservar ese instante y derivar fecha comercial con su política.",
              "No cortar el texto UTC para obtener una fecha local."
            ]
          },
          {
            "title": "Estado",
            "items": [
              "Proveedor: código QUEUED = recibido para procesar.",
              "POS: recibido, con referencia para seguimiento.",
              "No traducirlo como contabilizado ni como pago liquidado."
            ]
          }
        ],
        "takeaway": "La traducción requiere conocer unidades, calendario y estados reales; renombrar amount a total no alcanza.",
        "notes": [
          "La ACL se implementa en la frontera de cada ERP para conservar el significado del contrato POS. Las equivalencias se acuerdan con los responsables del sistema financiero y se validan con casos de referencia.",
          "Los nombres y valores del proveedor son sintéticos. Las equivalencias reales de AX, Gira, facturación o pagos requieren sus contratos y pruebas de integración.",
          "La fecha comercial puede depender del calendario aprobado de la entidad; no siempre equivale a la fecha local del instante. Conservar ambas permite explicar diferencias.",
          "La ACL traduce equivalencias. No debe inventar una equivalencia cuando no existe, recalcular ofertas o declarar éxito ante evidencia desconocida."
        ],
        "source": {
          "label": "Capa anticorrupción · Microsoft",
          "url": "https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer"
        }
      },
      {
        "id": "acl-ejemplo-antes-despues",
        "chapter": "integracion",
        "kind": "code",
        "title": "Del dato externo a una respuesta del POS",
        "lead": "La ACL convierte unidades, fechas y estados según el contrato acordado.",
        "code": {
          "language": "typescript",
          "label": "Ejemplo ficticio · «recibido» todavía no es «contabilizado»",
          "highlights": "1-3|4-7|8-10",
          "source": "const dto = { amount: \"11400\", currency: \"CLP\",\n  at: \"2026-10-13T01:00:00Z\", status: \"QUEUED\" };\nconst instant = parseUtcInstant(dto.at);\nconst result = {\n  money: moneyFromMajorUnits(dto.amount, dto.currency),\n  occurredAt: instant,\n  businessDate: calendar.businessDate(instant),\n  status: dto.status === \"QUEUED\"\n    ? \"received\" : \"unknown\"\n};"
        },
        "takeaway": "La forma cambia para proteger el significado: moneda explícita, instante conservado y estado honesto.",
        "notes": [
          "Antes: un DTO ficticio combina valores en convenciones del proveedor. Después: el POS obtiene dinero con unidad conocida, tiempo interpretable y un resultado con significado acordado.",
          "moneyFromMajorUnits no convierte divisas. Valida moneda, representación decimal, escala y rangos según contrato; no utiliza división automática por 100 ni un number flotante para todo.",
          "calendar.businessDate usa contexto de país, entidad y sucursal acordado. No deduce el calendario del formato del string ni de la zona horaria del servidor.",
          "Solo se ilustra el caso QUEUED. El producto debe cubrir todos los estados soportados, validar entradas y separar error de traducción de resultado remoto incierto.",
          "El fragmento representa solo traducción. El flujo completo persiste la referencia original, la evidencia del proveedor y el estado recuperable de la llamada remota."
        ],
        "source": {
          "label": "Semántica y contratos de integración POS",
          "url": "../docs/propuesta-arquitectura.md"
        }
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
        "id": "fachada-acl-adaptador",
        "chapter": "integracion",
        "kind": "compare",
        "title": "Responsabilidades de la frontera ERP propuesta",
        "lead": "La fachada coordina la capacidad POS, la ACL traduce el resultado y el adaptador ejecuta el protocolo de cada destino.",
        "columns": [
          {
            "title": "Fachada",
            "items": [
              "Expone registrar venta y consultar resultado",
              "Coordina el flujo de integración del POS",
              "Conserva el contrato común entre países"
            ]
          },
          {
            "title": "ACL",
            "items": [
              "Traduce IDs, estados, dinero y fechas",
              "Reconoce recibido, registrado e incierto",
              "Aísla convenciones de AX, Gira o custom"
            ]
          },
          {
            "title": "Adaptador",
            "items": [
              "Usa la URL, credenciales y protocolo asignados",
              "Implementa REST, WCF o SDK homologado",
              "Devuelve referencia y evidencia del proveedor"
            ]
          }
        ],
        "takeaway": "El código específico del ERP queda en su frontera; ventas y precios conservan sus modelos y reglas.",
        "notes": [
          "Una fachada que expone los mismos DTO y estados de AX sigue acoplando sus consumidores a AX. Renombrar campos no basta para independizar el modelo.",
          "La política de reintentos y el workflow monetario pertenecen a la aplicación. Las reglas de ofertas pertenecen al dominio de precios, no a la traducción AX.",
          "Las equivalencias requieren glosario y pruebas. Venta, pedido, deuda y documento fiscal no son sinónimos porque dos sistemas usen etiquetas parecidas."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "laboratorio-frontera-erp",
        "chapter": "integracion",
        "kind": "lab",
        "lab": "architecture-patterns",
        "title": "Integración de una venta con el ERP asignado",
        "lead": "Venta V-42 por CLP 12.900: contrato POS, traducción y seguimiento del ERP.",
        "takeaway": "La fachada ofrece la capacidad; la ACL traduce el significado; el adaptador realiza la llamada.",
        "notes": [
          "Los campos, IDs y estados del ERP son datos de simulación. El contrato de AX, Gira, custom o un ERP futuro debe inventariarse y homologarse por separado.",
          "La venta ya está confirmada localmente y un worker integra su operación pendiente. No se llama al ERP desde la pantalla de cobro ni se vuelve a cobrar en este recorrido.",
          "Cada paso muestra qué componente conoce cada dato. La aplicación conoce saleId; la ACL conoce la equivalencia customerId/account; el adaptador conoce URL y protocolo.",
          "RECEIVED se traduce como recibido (status: received); BOOKED como registrado (status: registered) bajo el contrato ficticio del ejemplo. Recibido todavía necesita seguimiento; un código desconocido no demuestra éxito.",
          "El ejemplo enfoca responsabilidades. No implementa almacenamiento, autenticación, consulta de resultados, deduplicación remota o recuperación productiva."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "codigo-frontera-erp",
        "chapter": "integracion",
        "kind": "code",
        "title": "La diferencia del ERP queda en su frontera",
        "lead": "El consumidor usa la fachada. En la frontera asignada, la ACL traduce el significado y el adaptador ejecuta el protocolo.",
        "code": {
          "language": "typescript",
          "label": "Pseudocódigo · proveedor conceptual, no contrato real de AX",
          "highlights": "1-2|4-8",
          "source": "const result = await integration.integrarVenta(operation);\nawait outcomes.persist(operation.id, result);\n\nasync function registerInAssignedDestination(operation: VentaPos) {\n  const request = destinationAcl.toRequest(operation);\n  const evidence = await destinationAdapter.register(request);\n  return destinationAcl.toPosOutcome(evidence);\n}"
        },
        "takeaway": "La ACL protege significados; no hace atómica una llamada de red con PostgreSQL.",
        "notes": [
          "El fragmento omite expresamente el workflow completo para mostrar las dependencias. El producto debe persistir intención e identidad antes de invocar el adaptador.",
          "Si el destino aplica el efecto y se pierde la respuesta, debe consultarse la referencia o usar idempotencia remota demostrada. No repetir automáticamente con otro ID.",
          "toOperationOutcome no convierte cualquier excepción en rejected. Timeout y respuesta perdida pueden producir outcome_unknown.",
          "Los identificadores externos se almacenan con sistema, instancia, empresa y tipo de objeto. Una columna genérica id_externo no basta para la coexistencia."
        ],
        "source": {
          "label": "Casos adversos y recuperación",
          "url": "../docs/revision-resiliencia-datos-pos.md"
        }
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
        title: 'Expansión mediante un segundo perfil nacional',
        lead: 'La incorporación debe mostrar exactamente qué reutilizamos, qué configuramos y qué desarrollamos.',
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
        "id": "arbol-nx",
        "chapter": "monorepo",
        "kind": "tree",
        "title": "Monorepo POS: aplicaciones y dominios propuestos",
        "lead": "Apps desplegables y dominios reutilizables, con dependencias y responsables explícitos.",
        "code": {
          "source": "apps/\n  pos-desktop/     pos-runtime/     pos-sync-worker/\n  country-api/     erp-worker/      backoffice/\nlibs/\n  sales/          cash/            pricing/\n  payments/       returns/         fiscal/\n  erp/            sync/\n  contracts/      shared-kernel/   ui/\n# Dentro de un dominio, cuando aporte un límite real:\nlibs/pricing/{domain, application, infrastructure}/"
        },
        "items": [
          {
            "title": "Apps",
            "text": "Componen dependencias y producen ejecutables o despliegues."
          },
          {
            "title": "Dominios",
            "text": "Poseen reglas, contratos públicos, datos y pruebas."
          },
          {
            "title": "Capas internas",
            "text": "Separan reglas, casos de uso y accesos técnicos donde es necesario."
          }
        ],
        "takeaway": "Cada módulo conserva su responsabilidad y su interfaz; una carpeta no garantiza ese límite.",
        "notes": [
          "Este árbol es una organización propuesta del producto futuro. No afirma que todos estos procesos existan ya en la maqueta.",
          "pos-desktop incorpora Angular y el proyecto Tauri; pos-runtime es el backend de sucursal del perfil WAN. Los workers se supervisan independientemente de la UI.",
          "Las bibliotecas se organizan por responsabilidad e interfaz verificable. Cada dominio mantiene sus reglas y pruebas sin imponer un proyecto por clase ni un despliegue por biblioteca.",
          "shared-kernel conserva tipos mínimos como dinero e identidad. Los modelos ORM y detalles privados permanecen en el módulo propietario."
        ],
        "source": {
          "label": "Tecnologías y monorepo",
          "url": "../docs/opciones-tecnologicas.md"
        }
      },
      {
        id: 'reglas-de-dependencia', chapter: 'monorepo', kind: 'compare',
        title: 'Dependencias permitidas en los dominios POS',
        lead: 'Precios y venta conservan reglas independientes; PostgreSQL, proveedores y frameworks se conectan mediante contratos.',
        columns: [
          { title: 'Domain', items: ['Reglas y tipos de negocio', 'Sin Angular, Nest, SQL ni SDK', 'Pruebas puras y deterministas'] },
          { title: 'Application', items: ['Casos de uso y coordinación', 'Puertos que necesita el dominio', 'Autorización y unidad de trabajo'] },
          { title: 'Infrastructure', items: ['PostgreSQL y clientes técnicos', 'Adaptadores y traducciones', 'Composición en las aplicaciones'] }
        ],
        takeaway: 'La interfaz consume contratos públicos; nunca credenciales o repositorios de base de datos.',
        notes: [
          'Las capas se ubican dentro de cada dominio POS. Así ventas, precios y caja conservan propietario, reglas y pruebas aunque sus dependencias técnicas evolucionen.',
          'Cada módulo controla su interfaz pública y sus migraciones. Otro módulo no lee libremente su ORM porque ambos estén en el mismo monorepo.',
          'La separación de importaciones no sustituye permisos SQL, controles de ejecución o contratos de protocolos. Todos esos límites requieren mecanismos propios.'
        ], source: technology
      },
      {
        "id": "limites-nx-en-ci",
        "chapter": "monorepo",
        "kind": "cards",
        "title": "Controles automáticos del monorepo",
        "lead": "CI rechaza dependencias prohibidas y exige pruebas de contratos, permisos y persistencia para los módulos afectados.",
        "takeaway": "Las reglas de Nx y ESLint protegen importaciones; los límites de datos y ejecución tienen controles adicionales.",
        "notes": [
          "Las etiquetas y reglas de Nx y ESLint deben impedir dependencias desde domain hacia frameworks o SDK externos, ciclos entre módulos e importaciones de detalles privados.",
          "Una regla de importaciones no controla por sí sola SQL, permisos de ejecución o contratos de red. Cada frontera necesita su mecanismo y su prueba.",
          "Compilar correctamente no demuestra aislamiento: precios podría importar el SDK de un proveedor y seguir compilando. Una regla de dependencias debe impedir esa importación; las pruebas del dominio deben ejecutarse sin el proveedor."
        ],
        "source": {
          "label": "Estructura y límites propuestos",
          "url": "../docs/opciones-tecnologicas.md"
        },
        "items": [
          {
            "title": "Una regla explícita",
            "text": "Precios calcula con sus datos de entrada. No importa el SDK de pagos ni las tablas del ERP."
          },
          {
            "title": "Una revisión automática",
            "text": "Las herramientas de código detectan importaciones prohibidas y ciclos entre proyectos."
          },
          {
            "title": "Una prueba de comportamiento",
            "text": "Las pruebas de contratos, permisos y datos verifican límites que el árbol de dependencias no puede demostrar."
          }
        ]
      },
      {
        "id": "cadena-de-verificacion",
        "chapter": "monorepo",
        "kind": "cards",
        "title": "Evidencia exigida para liberar el POS",
        "lead": "Cada versión debe probar cálculo, contratos, persistencia y recuperación en los perfiles que declara compatibles.",
        "items": [
          {
            "title": "Reglas puras",
            "text": "Precios, ofertas, redondeos, límites y casos de referencia."
          },
          {
            "title": "Contratos",
            "text": "Productor y consumidor compatibles; variantes de proveedor y país."
          },
          {
            "title": "Persistencia",
            "text": "Restricciones, transacciones, duplicados y activación atómica."
          },
          {
            "title": "Recuperación",
            "text": "Cortes en fronteras, replay, restauración y efectos inciertos."
          }
        ],
        "takeaway": "Un build exitoso no demuestra que una venta sobreviva a un fallo.",
        "notes": [
          "Las verificaciones automáticas comprueban reglas, contratos y recuperación. La herramienta que las ejecuta no sustituye esas pruebas.",
          "Comprobar cada aplicación en su entorno de ejecución y con sus contratos. Compartir código no demuestra compatibilidad entre versiones.",
          "Los componentes nativos necesitan pruebas propias de firma, sistema operativo y periféricos, además de las pruebas de las reglas de negocio."
        ],
        "source": {
          "label": "Tecnologías y monorepo",
          "url": "../docs/opciones-tecnologicas.md"
        }
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
        title: 'Observabilidad, conciliación y recuperación',
        lead: 'La operación de país identifica pendientes, versiones y efectos inciertos, con responsables y procedimientos de recuperación.',
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
          'Escenario de dimensionamiento: backlog de 600 trabajos, 10 nuevos por minuto y 30 éxitos por minuto da aproximadamente 30 minutos de drenaje, si las tasas se mantienen y los trabajos son comparables.',
          'La aproximación es backlog dividido por capacidad de éxito menos llegadas. No es un SLA: dependencias, cuotas, tamaños y reintentos pueden cambiar el resultado.',
          'Contar mensajes puede ocultar lotes de miles de registros. Medir también bytes, registros y tiempo de servicio por destino.',
          'La ventana de recuperación debe conservar capacidad para tráfico nuevo. Un mensaje inválido necesita cuarentena; una operación monetaria no se elimina solo por superar intentos o TTL.'
        ], source: resilience
      },
      {
        id: 'criterios-del-piloto', chapter: 'operacion', kind: 'closing',
        title: 'Piloto y criterios de aceptación',
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
          'Las simulaciones y fragmentos de código no acreditan implementación productiva. El piloto debe cerrar contratos, controles, homologación y responsabilidad operativa con evidencia.'
        ], source: proposal
      }
    ],
    glossary: [
      {
        "term": "Núcleo común",
        "meaning": "Casos de uso, reglas y contratos que el producto comparte entre países."
      },
      {
        "term": "Perfil",
        "meaning": "Configuración completa, versionada y aprobada para país, entidad, sucursal y caja."
      },
      {
        "term": "Homologación",
        "meaning": "Evidencia de que una combinación concreta de software, proveedor y dispositivo cumple su contrato."
      },
      {
        "term": "C4",
        "meaning": "Vistas de contexto, contenedores, componentes y código para explicar un sistema a distintas escalas."
      },
      {
        "term": "LAN / WAN",
        "meaning": "Red de sucursal / conexión entre la sucursal y plataformas externas. Perder una no equivale a perder la otra."
      },
      {
        "term": "Autoridad",
        "meaning": "Sistema o módulo responsable de aceptar y corregir un dato o efecto de negocio."
      },
      {
        "term": "Outbox",
        "meaning": "Registro durable de eventos a entregar, escrito en la misma transacción que el cambio de negocio."
      },
      {
        "term": "Inbox",
        "meaning": "Registro durable de entradas e identidad, utilizado junto al efecto local para recuperar y reconocer reenvíos."
      },
      {
        "term": "ACK",
        "meaning": "Acuse con una garantía acotada a quien lo emite. Debe aclararse si es de aplicación, consumidor o transporte."
      },
      {
        "term": "Idempotencia",
        "meaning": "Repetir el mismo intento reconocido no produce otra vez el efecto definido por el contrato."
      },
      {
        "term": "Snapshot",
        "meaning": "Conjunto de datos coherente asociado a una versión y punto de continuidad del origen."
      },
      {
        "term": "Delta",
        "meaning": "Cambio incremental con identidad, ámbito, versión y reglas de orden o cobertura."
      },
      {
        "term": "Watermark",
        "meaning": "Punto consistente del origen que permite enlazar un snapshot con cambios posteriores."
      },
      {
        "term": "Staging",
        "meaning": "Área aislada donde se recibe y prepara información sin modificar la versión activa."
      },
      {
        "term": "Candidata",
        "meaning": "Versión preparada para validación; todavía no está publicada para nuevas operaciones."
      },
      {
        "term": "Cursor aplicado",
        "meaning": "Checkpoint que avanza cuando el efecto y su publicación quedaron confirmados, no solamente descargados."
      },
      {
        "term": "Backoff",
        "meaning": "Espera creciente entre reintentos; la dispersión temporal evita que todos reintenten juntos."
      },
      {
        "term": "Backlog",
        "meaning": "Trabajo pendiente durable, medido también por antigüedad y carga real."
      },
      {
        "term": "Claim / lease",
        "meaning": "Propiedad temporal de un trabajo; necesita controles contra confirmaciones tardías de un worker que perdió la propiedad."
      },
      {
        "term": "Fachada",
        "meaning": "Interfaz de una capacidad que oculta cómo se coordina su implementación."
      },
      {
        "term": "ACL",
        "meaning": "Anti-Corruption Layer: traduce significados entre modelos sin propagar detalles del sistema externo."
      },
      {
        "term": "Adaptador",
        "meaning": "Implementación técnica de un puerto: protocolo, SDK o acceso al proveedor."
      },
      {
        "term": "Monorepo",
        "meaning": "Repositorio con varios proyectos; no implica que todos se desplieguen o ejecuten juntos."
      },
      {
        "term": "Nx",
        "meaning": "Herramientas de desarrollo y CI para organizar proyectos, dependencias y tareas. No es runtime de la venta."
      },
      {
        "term": "RPO / RTO",
        "meaning": "Objetivos de pérdida de datos tolerable / tiempo de recuperación, definidos para un ámbito y fallo concretos."
      },
      {
        "term": "Resultado desconocido",
        "meaning": "No hay evidencia concluyente de éxito o rechazo; requiere consulta o conciliación antes de repetir un efecto."
      },
      {
        "term": "Conciliación",
        "meaning": "Comparación de referencias, estados, conteos e importes para identificar y resolver diferencias."
      },
      {
        "term": "Monolito modular",
        "meaning": "Una aplicación que se ejecuta como un proceso y organiza sus responsabilidades en módulos con contratos explícitos. No obliga a mezclar sus reglas ni sus datos."
      },
      {
        "term": "Patrón",
        "meaning": "Solución conocida a un problema repetido, con condiciones y costes. No es una herramienta que se instala ni una garantía por su nombre."
      },
      {
        "term": "Acoplamiento",
        "meaning": "Cuánto debe conocer una parte sobre los detalles de otra; cuanto más conoce, más cambios pueden propagarse entre ellas."
      },
      {
        "term": "Puerto",
        "meaning": "Contrato que expresa una capacidad o conversación que necesita el POS. Aquí no significa puerto TCP ni número de red."
      },
      {
        "term": "Interfaz de código",
        "meaning": "Declaración de operaciones, entradas y resultados. Una interface de TypeScript puede expresar un puerto, pero no implementa su comportamiento."
      },
      {
        "term": "Inyección de dependencia",
        "meaning": "Entregar a una pieza la implementación que necesita desde la composición de la aplicación, en vez de que cree directamente su proveedor concreto."
      },
      {
        "term": "DTO",
        "meaning": "Objeto que transporta datos entre partes. Su estructura no garantiza que ambas interpreten igual sus campos, unidades o estados."
      },
      {
        "term": "Semántica",
        "meaning": "Significado de un dato: su unidad, contexto y lo que realmente afirma, además de su nombre o formato."
      },
      {
        "term": "Comando",
        "meaning": "Petición dirigida a un responsable para ejecutar una acción. Puede ser aceptada o rechazada; todavía no acredita que ocurrió."
      },
      {
        "term": "Evento",
        "meaning": "Mensaje que describe un hecho ya ocurrido, publicado por quien lo confirmó. No ordena repetir ese hecho en cada consumidor."
      },
      {
        "term": "Job",
        "meaning": "Trabajo identificado que debe ejecutarse, con parámetros, estado y política de recuperación."
      },
      {
        "term": "Cola",
        "meaning": "Mecanismo que mantiene trabajo pendiente hasta que pueda procesarse. Su recuperación y retención deben configurarse y verificarse."
      },
      {
        "term": "Worker",
        "meaning": "Proceso que ejecuta trabajo pendiente y registra su resultado; puede operar independientemente de la interfaz del cajero."
      },
      {
        "term": "Síncrono",
        "meaning": "Coordinación en la que quien solicita necesita esperar el resultado para continuar esa operación."
      },
      {
        "term": "Asíncrono",
        "meaning": "Coordinación en la que se registra una responsabilidad pendiente y su resultado se obtiene después; no significa éxito automático."
      },
      {
        "term": "Transacción",
        "meaning": "Grupo de cambios que se confirma o revierte como una unidad dentro de una base. No engloba automáticamente efectos en otros sistemas."
      },
      {
        "term": "Checksum",
        "meaning": "Huella calculada para comparar bytes con un valor esperado de una fuente confiable. No comprueba por sí sola las reglas comerciales."
      },
      {
        "term": "Activación",
        "meaning": "Publicación de una candidata validada como versión disponible para nuevas operaciones, junto con su progreso aplicado."
      },
      {
        "term": "Fecha comercial",
        "meaning": "Fecha de negocio asignada según calendario y reglas de la entidad. Puede diferir de la fecha UTC del instante de una operación."
      },
      {
        "term": "Arquitectura",
        "meaning": "Decisiones sobre responsabilidades, colaboración, datos y tratamiento de fallos de un sistema."
      },
      {
        "term": "Frontend",
        "meaning": "Parte de la aplicación que presenta información y recibe acciones de la persona usuaria."
      },
      {
        "term": "Backend",
        "meaning": "Aplicación que atiende solicitudes, aplica reglas y coordina datos o efectos. Puede ejecutarse en una sucursal, no necesariamente en Internet."
      },
      {
        "term": "API",
        "meaning": "Interfaz acordada para usar capacidades de otro software: operaciones, entradas, respuestas, errores y condiciones."
      },
      {
        "term": "Base de datos",
        "meaning": "Sistema para guardar y consultar información; sus garantías dependen del diseño, la configuración y la recuperación."
      },
      {
        "term": "Módulo",
        "meaning": "Agrupación de una responsabilidad, como precios o ventas, con reglas e interfaces propias. Puede abarcar varias bibliotecas."
      },
      {
        "term": "Proceso",
        "meaning": "Programa en ejecución. Una aplicación puede usar bibliotecas dentro del mismo proceso."
      },
      {
        "term": "Contrato",
        "meaning": "Acuerdo sobre cómo colaborar: entradas, resultados, errores y condiciones, además del significado de cada dato."
      },
      {
        "term": "Contenedor C4",
        "meaning": "Aplicación o almacén de datos del modelo de arquitectura. No presupone utilizar Docker."
      },
      {
        "term": "Componente C4",
        "meaning": "Parte interna de una aplicación o contenedor, con responsabilidades e interfaces; no implica otro microservicio."
      },
      {
        "term": "Despliegue",
        "meaning": "Ubicación de instancias del software en equipos o entornos de ejecución."
      },
      {
        "term": "Cotización",
        "meaning": "Resultado de calcular el importe bajo condiciones y vigencia definidas. No equivale a una venta pagada o confirmada."
      },
      {
        "term": "Repositorio / monorepo",
        "meaning": "Archivos e historial compartido. Un monorepo reúne varios proyectos relacionados; no obliga a ejecutarlos o desplegarlos juntos."
      },
      {
        "term": "Aplicación",
        "meaning": "Código con un punto de arranque que se ejecuta en un entorno y puede consumir bibliotecas."
      },
      {
        "term": "Biblioteca",
        "meaning": "Código reutilizable utilizado por otra pieza. No implica por sí solo un proceso separado ni una llamada de red."
      },
      {
        "term": "Importación",
        "meaning": "Uso de código de otra pieza. Expresa una dependencia de código, no necesariamente una comunicación entre servicios."
      },
      {
        "term": "Interfaz pública del módulo",
        "meaning": "Funciones o contratos que otras piezas pueden utilizar sin conocer los detalles internos del módulo."
      },
      {
        "term": "Shared kernel",
        "meaning": "Conjunto pequeño y controlado de conceptos realmente compartidos, como dinero o identidad; no una carpeta para toda función reutilizable."
      },
      {
        "term": "Commit de base de datos",
        "meaning": "Confirmación de los cambios de una transacción en esa base. No confirma por sí sola un efecto remoto."
      },
      {
        "term": "Commit de Git",
        "meaning": "Registro de una versión del código en su historial. No equivale a una transacción de venta ni a un despliegue."
      }
    ],
    sources: [
      proposal, c4, technology, messaging, resilience, extensions, corporate,
      { label: 'Revisión corporativa y evolución ERP', url: '../docs/revision-arquitectura-corporativa.md' },
      { label: 'Validación y decisiones del piloto', url: '../docs/validacion-y-decisiones.md' },
      { label: 'Fuentes y diagramas Excalidraw', url: '../docs/diagramas-excalidraw/index.html' }
    ]
  };
})();

/* Source-backed tutorial; deployed versions remain unverified. */
window.POS_CONTENT = {
  "meta": {
    "title": "Del POS actual a una plataforma que puede operar offline",
    "date": "2026-10-02",
    "scope": "Chile: presentación, apuntes y código revisado. Perú y España: antecedentes iniciales. La arquitectura futura es una propuesta.",
    "evidenceNote": "Encontrado en código no significa desplegado en producción. Los diagramas representan responsabilidades, no servidores físicos.",
    "stockNote": "Según la aclaración operativa, la caja no maneja stock. La reserva mencionada debe atribuirse al sistema responsable.",
    "offlineNote": "Primero debemos acordar qué desconexión tolerar: Internet, red de la sucursal o ambos. Pagos, crédito y documentos fiscales tienen límites propios."
  },
  "statusLabels": {
    "code": "Observado en código",
    "reported": "Informado por el equipo",
    "proposed": "Propuesta",
    "pending": "Por confirmar",
    "historical": "Referencia histórica"
  },
  "components": {
    "rfidreader": {
      "title": "Lector y adaptador RFID",
      "subtitle": "Observaciones de radio, no líneas de venta",
      "kind": "app",
      "place": "Zona de lectura y agente local",
      "status": "proposed",
      "description": "El adaptador normaliza observaciones del lector sin exponer su SDK al núcleo. Un perfil aprobado identifica lector, antenas, zona y versiones compatibles para sucursal y puesto.",
      "responsibilities": [
        "Declarar capacidades del hardware, driver, firmware y SDK homologados.",
        "Delimitar zona y agregar observaciones con cuotas para no saturar el escritor de ventas; una lectura no prueba que el objeto pertenezca a esta cesta.",
        "Conservar código de barras o captura manual como alternativa, con control físico de mezclas y duplicados."
      ],
      "offline": "Poder leer radio localmente no autoriza una venta. Se requiere mapeo local vigente, permisos, LAN y escritor de sucursal; no aparece un segundo escritor en el PC.",
      "tech": [
        "Homologación de radio y zona",
        "Adaptador detrás de un puerto",
        "Hardware sin seleccionar"
      ],
      "sources": [
        {
          "label": "Evolución RFID y autoservicio",
          "url": "../docs/evolucion-rfid-autoservicio.md"
        }
      ]
    },
    "rfidsession": {
      "title": "Sesión de lectura RFID",
      "subtitle": "Distinguir observaciones, tags y candidatos",
      "kind": "process",
      "place": "Aplicación de captura",
      "status": "proposed",
      "description": "Agrupa las observaciones de una sesión y reconoce la repetición del mismo identificador. Conserva candidatos para revisión, sin añadir cada observación directamente al carrito.",
      "responsibilities": [
        "Deduplicar por identidad en la sesión, no por SKU; conciliar revisiones del conjunto sin volver a sumar lo ya vinculado.",
        "Separar lecturas desconocidas, inconsistentes o fuera de zona para resolución.",
        "Distinguir sesión del lector, sesión de conteo y versión de cesta: son identidades diferentes.",
        "Perder una lectura no acredita retiro; fijar la versión de cesta revisada al comenzar pago impide alterarla con observaciones tardías."
      ],
      "offline": "Una sesión local no cambia la autoridad de venta. Su cierre o repetición no demuestra propiedad del artículo, cantidad vendible ni pago.",
      "tech": [
        "Identidad de sesión",
        "Candidatos revisables",
        "Sin cobro automático"
      ],
      "sources": [
        {
          "label": "Lecturas, sesión y límites",
          "url": "../docs/evolucion-rfid-autoservicio.md"
        }
      ]
    },
    "rfidmapping": {
      "title": "Mapeo de etiquetas y unidades",
      "subtitle": "Un tag no siempre equivale a una unidad vendible",
      "kind": "db",
      "place": "Fuente responsable y copia autorizada",
      "status": "proposed",
      "description": "Resuelve la identidad de la etiqueta contra datos gobernados: producto, serial cuando aplique, unidad de medida y nivel de empaque. EPC, SKU y cantidad son conceptos diferentes.",
      "responsibilities": [
        "Verificar mapeo, vigencia, autorización y semántica de unidad antes de proponer cantidades.",
        "Distinguir unidad, kit, caja o etiqueta logística sin convertir cada tag en un artículo por defecto.",
        "Conservar origen y versiones durante migraciones ERP; no fusionar identidades por parecido."
      ],
      "offline": "Solo un mapeo local conocido, vigente y permitido puede usarse según política. Desconocidos quedan pendientes; no se inventa SKU ni cantidad para completar la venta.",
      "tech": [
        "Identificadores sintéticos en la demo",
        "Catálogo y unidades gobernados",
        "Versionado y vigencia"
      ],
      "sources": [
        {
          "label": "Identidad de etiqueta y catálogo",
          "url": "../docs/evolucion-rfid-autoservicio.md"
        }
      ]
    },
    "rfidreview": {
      "title": "Revisión y comando del POS",
      "subtitle": "La captura prepara datos; el núcleo valida",
      "kind": "app",
      "place": "Caja asistida o interfaz de autoservicio",
      "status": "proposed",
      "description": "Presenta candidatos y cantidades para la revisión permitida. La selección usa comandos normales del POS, con identidad, permisos y reglas vigentes. No inicia un pago por detectar etiquetas.",
      "responsibilities": [
        "Separar detectar, resolver, revisar y añadir al carrito.",
        "Controlar físicamente mezclas con código de barras/manual; un EAN sin serial no identifica una unidad concreta.",
        "Resolver en el escritor compartido el conflicto de dos cajas con el mismo EPC antes de otro cobro; no equivale a controlar stock global.",
        "Fijar la versión de cesta al iniciar pago; una lectura tardía no cambia importes y un timeout incierto no libera su vínculo.",
        "Conservar procesos separados de pago, emisión y asistencia al cliente."
      ],
      "offline": "La misma política del núcleo aplica con y sin RFID. El autoservicio necesita un diseño propio de accesibilidad, asistencia, excepciones y autorización; no se obtiene solo instalando un lector.",
      "tech": [
        "Comandos normales del negocio",
        "Captura no equivale a pago",
        "Autoservicio independiente de RFID"
      ],
      "sources": [
        {
          "label": "Caja y autoservicio propuestos",
          "url": "../docs/evolucion-rfid-autoservicio.md"
        }
      ]
    },
    "inventoryowner": {
      "title": "Dueño del inventario",
      "subtitle": "Un conteo propone evidencia; no sobrescribe stock",
      "kind": "external",
      "place": "ERP, WMS o sistema responsable por confirmar",
      "status": "proposed",
      "description": "Recibe conteos con alcance, sesión, fecha y evidencia; aplica revisión y conciliación según su autoridad. La caja actual no maneja stock y RFID no cambia esa responsabilidad.",
      "responsibilities": [
        "Definir ubicaciones, unidades, responsables y reglas de conteo.",
        "Resolver movimientos concurrentes y diferencias antes de un ajuste autorizado.",
        "Conservar deduplicación, revisiones y auditoría al recibir un conteo."
      ],
      "offline": "Un dispositivo puede capturar evidencia si está autorizado; enviarla después no concede permiso para reemplazar el saldo ni garantiza conocer movimientos centrales.",
      "tech": [
        "Observación de conteo",
        "Revisión de diferencias",
        "Autoridad externa al POS"
      ],
      "sources": [
        {
          "label": "Conteo y autoridad de inventario",
          "url": "../docs/evolucion-rfid-autoservicio.md"
        }
      ]
    },
    "aigateway": {
      "title": "Servicio de asistencia IA",
      "subtitle": "Un límite antes de consultar un modelo",
      "kind": "process",
      "place": "Servicio central candidato",
      "status": "proposed",
      "description": "Coordina la ayuda solicitada: comprueba permisos, selecciona fuentes autorizadas y decide si tiene evidencia suficiente para responder o abstenerse.",
      "responsibilities": [
        "Aislar proveedores y versiones detrás de contratos propios.",
        "Limitar datos enviados, duración, consumo y herramientas permitidas.",
        "Registrar versión de fuentes y resultado sin copiar información sensible innecesaria."
      ],
      "offline": "El servicio central no está disponible sin WAN. Su fallo o lentitud no bloquea una venta que el núcleo puede autorizar sin IA.",
      "tech": [
        "Servicio opcional",
        "Límites de consumo",
        "Sin escritura directa al negocio"
      ],
      "sources": [
        {
          "label": "Servicios de IA propuestos",
          "url": "../docs/servicios-ia-pos.md"
        }
      ]
    },
    "aievidence": {
      "title": "Fuentes autorizadas",
      "subtitle": "Origen, vigencia y permisos antes de recuperar contenido",
      "kind": "db",
      "place": "Corpus y catálogo curados",
      "status": "proposed",
      "description": "Procedimientos aprobados, catálogo curado y evidencias operativas necesitan propietario, versión, alcance, vigencia y permisos efectivos para el usuario.",
      "responsibilities": [
        "Filtrar acceso antes de recuperar documentos o fragmentos.",
        "Conservar referencias, IDs de origen y versiones de mapeo; no fusionar productos por códigos parecidos durante una migración ERP.",
        "Comprobar que el procedimiento corresponde al perfil, modelo, firmware, SDK y adaptador instalados.",
        "Tratar instrucciones incrustadas en documentos como datos no confiables, sin ampliar permisos."
      ],
      "offline": "Una copia local debe estar autorizada y tener vigencia verificable. Si falta evidencia, no se inventa una respuesta. Un índice semántico no prueba verdad ni compatibilidad de productos.",
      "tech": [
        "Curación de fuentes",
        "RAG candidato",
        "Actualización controlada"
      ],
      "sources": [
        {
          "label": "Fuentes y evaluación de IA",
          "url": "../docs/servicios-ia-pos.md"
        }
      ]
    },
    "aimodel": {
      "title": "Modelo remoto candidato",
      "subtitle": "Genera o clasifica; puede equivocarse",
      "kind": "external",
      "place": "Proveedor por evaluar",
      "status": "proposed",
      "description": "Puede resumir procedimientos, interpretar consultas o extraer un borrador. No es la autoridad de precios, pagos, crédito, fiscalidad ni inventario.",
      "responsibilities": [
        "Comparar calidad con casos representativos y respuestas esperadas.",
        "Evaluar privacidad, retención, latencia y coste antes de seleccionar proveedor.",
        "Entregar asistencia con referencias y abstención; sin ejecutar efectos de negocio."
      ],
      "offline": "Sin conexión se deshabilita esta capacidad en el ejemplo. No se promete un modelo local ni equivalencia de sus resultados.",
      "tech": [
        "Proveedor y modelo por evaluar",
        "Pruebas de regresión",
        "Sin secretos del POS"
      ],
      "sources": [
        {
          "label": "Alternativas y criterios de IA",
          "url": "../docs/servicios-ia-pos.md"
        }
      ]
    },
    "ailocal": {
      "title": "Consulta local y modelo opcional",
      "subtitle": "Buscar datos locales no exige un LLM",
      "kind": "process",
      "place": "Sucursal o PC según diseño aprobado",
      "status": "proposed",
      "description": "La primera alternativa offline consulta procedimientos y catálogo autorizados mediante búsqueda exacta o filtros. Búsqueda semántica y modelo local son opciones posteriores, sujetas a recursos y validación.",
      "responsibilities": [
        "Mostrar origen, versión y límites de la copia local.",
        "Mantener una ruta sin IA cuando falten modelo, memoria o recursos.",
        "Evaluar hardware, distribución y consumo sin afectar al núcleo de caja."
      ],
      "offline": "El laboratorio solo supone una copia válida para procedimientos y catálogo. No simula inferencia local, aprobación externa ni stock en tiempo real.",
      "tech": [
        "Búsqueda determinista primero",
        "Modelo local no adoptado",
        "Hardware por medir"
      ],
      "sources": [
        {
          "label": "Degradación offline de IA",
          "url": "../docs/servicios-ia-pos.md"
        }
      ]
    },
    "aipolicies": {
      "title": "Políticas y evaluación de IA",
      "subtitle": "Acceso permitido, utilidad y riesgo",
      "kind": "process",
      "place": "Control del servicio y del producto",
      "status": "proposed",
      "description": "Define casos y datos permitidos, evaluación de respuestas y abstención. Tener una respuesta con una cita no demuestra que sea correcta.",
      "responsibilities": [
        "Medir respuestas con evidencia, abstenciones apropiadas y correcciones humanas.",
        "Probar fuentes vencidas, documentos maliciosos y aislamiento entre países y usuarios.",
        "Establecer criterios de piloto y apagado; métricas y costes aún por medir."
      ],
      "offline": "Permisos y vigencias también limitan las copias locales. Perder conexión no amplía las capacidades autorizadas.",
      "tech": [
        "Evaluación representativa",
        "Permisos antes de recuperar",
        "Minimización de datos"
      ],
      "sources": [
        {
          "label": "Controles y pilotos de IA",
          "url": "../docs/servicios-ia-pos.md"
        }
      ]
    },
    "aireview": {
      "title": "Sugerencia y revisión humana",
      "subtitle": "Una ayuda no es una autorización",
      "kind": "app",
      "place": "Interfaz del POS",
      "status": "proposed",
      "description": "Muestra un borrador, su evidencia y sus límites. La persona revisa; cualquier acción posterior usa los comandos normales del POS.",
      "responsibilities": [
        "Identificar la asistencia y permitir descartarla.",
        "Mostrar fuentes y campos inciertos sin esconder la duda.",
        "No convertir una confirmación humana en excepción a permisos, límites o reglas."
      ],
      "offline": "Se distingue documento local, búsqueda exacta y modelo. Sin evidencia suficiente se muestra abstención.",
      "tech": [
        "Sin acciones autónomas de dinero",
        "Borrador revisable",
        "Trazabilidad proporcionada"
      ],
      "sources": [
        {
          "label": "Límites de acciones asistidas",
          "url": "../docs/servicios-ia-pos.md"
        }
      ]
    },
    "aicore": {
      "title": "Núcleo determinista del POS",
      "subtitle": "Las reglas mantienen la autoridad del negocio",
      "kind": "app",
      "place": "Escritor de sucursal",
      "status": "proposed",
      "description": "Valida identidad, permisos, reglas, precios y políticas vigentes. La IA no escribe ventas, pagos, documentos fiscales ni estados ERP directamente.",
      "responsibilities": [
        "Mantener los mismos controles con y sin asistencia.",
        "Persistir negocio y eventos según los contratos propuestos.",
        "Conservar límites de pago, fiscalidad y crédito; caja no se convierte en autoridad de stock."
      ],
      "offline": "Una venta permitida puede seguir con LAN, servidor, recursos y políticas disponibles. La IA no decide ese permiso ni garantiza autorizaciones externas.",
      "tech": [
        "Reglas versionadas",
        "Comandos validados",
        "IA fuera del camino crítico"
      ],
      "sources": [
        {
          "label": "IA y núcleo del POS",
          "url": "../docs/servicios-ia-pos.md"
        }
      ]
    },
    "ports": {
      "title": "Puertos y fachadas del POS",
      "subtitle": "Pedir una capacidad sin conocer la marca",
      "kind": "process",
      "place": "Núcleo de sucursal",
      "status": "proposed",
      "description": "El núcleo expone casos de uso estables y usa contratos para cobrar, emitir y solicitar impresión. El dominio no llama directamente al SDK de un terminal ni conoce tablas de un proveedor fiscal.",
      "responsibilities": [
        "La fachada coordina el caso de uso; el puerto define la capacidad y sus resultados.",
        "Persistir la intención de negocio en la sucursal antes de solicitar un efecto externo.",
        "Mantener resultados propios para pago, fiscalidad e impresión; un acuse no confirma todo."
      ],
      "offline": "Los comandos de negocio conservan su identidad en el escritor de sucursal. Sin LAN o servidor no se habilita otro escritor implícito; cada capacidad externa tiene su propia política offline.",
      "tech": [
        "Contratos propios del POS",
        "Intenciones durables",
        "ACL solo donde cambian significados"
      ],
      "sources": [
        {
          "label": "Extensibilidad por proveedor y dispositivo",
          "url": "../docs/extensibilidad-proveedores-dispositivos.md"
        }
      ]
    },
    "capabilities": {
      "title": "Perfiles y capacidades",
      "subtitle": "Soportado, habilitado y disponible son estados distintos",
      "kind": "process",
      "place": "País, sucursal y puesto",
      "status": "proposed",
      "description": "Un perfil versionado selecciona adaptador, proveedor y dispositivo para operaciones nuevas independientes. El catálogo declara capacidades implementadas y probadas; la política decide cuáles se permiten, y la salud determina cuáles están disponibles ahora.",
      "responsibilities": [
        "Validar compatibilidad con país, entidad, dispositivo, driver, SDK y versión de adaptador.",
        "Distribuir una configuración verificable y activar cambios de forma controlada.",
        "Conservar proveedor, comercio y referencias originales para pendientes, consultas y reversas de operaciones previas."
      ],
      "offline": "Una configuración local válida puede seguir aplicándose. Que un terminal esté conectado o un adaptador instalado no autoriza pagos offline ni emisión fiscal desconectada.",
      "tech": [
        "Perfil versionado",
        "Matriz de capacidades",
        "Binding por operación"
      ],
      "sources": [
        {
          "label": "Perfiles, capacidades y activación",
          "url": "../docs/extensibilidad-proveedores-dispositivos.md"
        }
      ]
    },
    "paymentadapter": {
      "title": "Adaptador de pagos",
      "subtitle": "Un contrato; implementaciones y capacidades específicas",
      "kind": "process",
      "place": "Integración con el proveedor",
      "status": "proposed",
      "description": "Traduce solicitudes y resultados del POS al protocolo del proveedor y del terminal. Un modelo nuevo de Transbank u otro proveedor puede requerir código, SDK y homologación; no basta cambiar un nombre en la configuración.",
      "responsibilities": [
        "Declarar capacidades reales: cobro, consulta, anulación, reversa u otras según contrato.",
        "Fijar proveedor, comercio y versión compatible en la operación; conservar ese destino y las referencias en todos sus intentos.",
        "Distinguir rechazo de resultado desconocido; consultar solo si existe una capacidad fiable, o resolver mediante conciliación operativa."
      ],
      "offline": "La capacidad del SDK no implica autorización offline del adquirente. Tras un timeout no se cambia de proveedor para intentar el mismo cobro. Si no existe consulta fiable, se conserva la incertidumbre y se requiere resolución operativa.",
      "tech": [
        "Adaptador versionado",
        "Resultado incierto explícito",
        "Homologación de hardware/SDK"
      ],
      "sources": [
        {
          "label": "Pagos y binding de la operación",
          "url": "../docs/extensibilidad-proveedores-dispositivos.md"
        }
      ]
    },
    "fiscaladapter": {
      "title": "Adaptador de facturación",
      "subtitle": "Aplicaciones fiscales detrás de contratos por país",
      "kind": "process",
      "place": "Local o remoto según proveedor",
      "status": "proposed",
      "description": "Conecta el caso de emisión con la aplicación fiscal habilitada para el país y entidad. Traduce documentos, referencias, estados y errores sin confundir emisión fiscal con registro ERP.",
      "responsibilities": [
        "Declarar tipos de documento y capacidades efectivamente validados.",
        "Guardar referencia, versión y proveedor de cada solicitud para seguimiento y recuperación.",
        "Evitar reenviar a otro emisor un documento cuyo resultado original es desconocido."
      ],
      "offline": "La contingencia depende de país, régimen, documento y proveedor. Tener un adaptador local no demuestra permiso de emisión offline.",
      "tech": [
        "Contratos fiscales por país",
        "Resultados persistidos",
        "Emisión separada de impresión"
      ],
      "sources": [
        {
          "label": "Facturación e integración de proveedores",
          "url": "../docs/extensibilidad-proveedores-dispositivos.md"
        }
      ]
    },
    "printadapter": {
      "title": "Adaptador de impresión",
      "subtitle": "El documento es estable; cambia su entrega al dispositivo",
      "kind": "process",
      "place": "Servicio o agente de impresión",
      "status": "proposed",
      "description": "Recibe un trabajo identificado y lo transforma al formato y transporte de una impresora compatible. Una impresora nueva requiere verificar driver, protocolo, papel y representación del documento.",
      "responsibilities": [
        "Mantener identidad del trabajo, documento y destino al procesar o recuperar.",
        "Traducir al driver o aplicación de impresión elegida sin recrear venta ni documento fiscal.",
        "Distinguir aceptado por el agente de evidencia disponible sobre impresión física."
      ],
      "offline": "Imprimir localmente puede ser posible con agente y dispositivo disponibles. Una reimpresión autorizada genera un trabajo de copia trazable del documento original; no otra venta, factura ni cobro.",
      "tech": [
        "Trabajo identificado",
        "Driver/protocolo homologado",
        "Reimpresión controlada"
      ],
      "sources": [
        {
          "label": "Impresión y aplicaciones locales",
          "url": "../docs/extensibilidad-proveedores-dispositivos.md"
        },
        {
          "label": "Agente actual de impresión",
          "url": "../docs/analisis-repositorios/api-impresion-caja.md"
        }
      ]
    },
    "deviceagent": {
      "title": "Agente local de periféricos",
      "subtitle": "Hablar con hardware desde el PC de caja",
      "kind": "app",
      "place": "PC de caja",
      "status": "proposed",
      "description": "Proceso local con permisos mínimos para acceder a impresoras, puertos y SDK de terminal. Puede alojar un adaptador o comunicarse con otro proceso, por ejemplo .NET cuando un SDK lo requiera.",
      "responsibilities": [
        "Autenticar solicitudes y permitir solo dispositivos y comandos autorizados.",
        "Registrar duraderamente el comando antes de acusar recepción; conservar la identidad al recuperar.",
        "Guardar y reenviar el resultado hasta que la sucursal confirme su persistencia, con retención acordada.",
        "Aislar drivers y SDK; ni un acuse ni un reinicio prueban el efecto externo ni autorizan a repetirlo."
      ],
      "offline": "La presencia del agente no traslada la autoridad de venta al PC. La sucursal sigue siendo el escritor del perfil WAN; si el agente falla, se aplica el procedimiento de recuperación de la capacidad afectada.",
      "tech": [
        "Proceso local con permisos mínimos",
        ".NET separado si lo exige el SDK",
        "Sin credenciales expuestas a la UI"
      ],
      "sources": [
        {
          "label": "Agente local y aislamiento de SDK",
          "url": "../docs/extensibilidad-proveedores-dispositivos.md"
        }
      ]
    },
    "syncpolicy": {
      "title": "Horario y mantenimiento",
      "subtitle": "Política informada de Chile; alcance por confirmar",
      "kind": "process",
      "place": "Sucursal e integración",
      "status": "reported",
      "description": "El equipo informa sincronización lunes a viernes de 07:00 a 22:00 y sábado de 07:00 a 16:00. Fuera de esas ventanas no se sincroniza según el relato; el sábado se realiza mantenimiento de bases.",
      "responsibilities": [
        "Precisar zona horaria, domingos, festivos y excepciones por flujo.",
        "Contrastar producción: el cron revisado admite domingos y otras entradas no comparten la misma compuerta.",
        "Separar admisión, drenaje de trabajos, mantenimiento y reapertura."
      ],
      "offline": "Horario cerrado, sin Internet y mantenimiento son estados distintos. Recibir duraderamente en central fuera de la ventana ERP es una propuesta que requiere autorización operativa; no se da por implementada.",
      "tech": [
        "Calendario por zona IANA",
        "Checkpoints y drenaje",
        "Configuración productiva pendiente"
      ],
      "sources": [
        {
          "label": "Horario: apuntes frente a código",
          "url": "../docs/contraste-apuntes-operacion-chile.md"
        },
        {
          "label": "Casos de mantenimiento y recuperación",
          "url": "../docs/revision-resiliencia-datos-pos.md"
        }
      ]
    },
    "mediation": {
      "title": "Evolución de WSO2",
      "subtitle": "Retirar capacidades de forma controlada",
      "kind": "process",
      "place": "Integración central",
      "status": "proposed",
      "description": "WSO2/Synapse puede realizar mediación, transformaciones y acceso a datos; el broker Andes es otra responsabilidad. Una cola nueva no ejecuta automáticamente esos contratos.",
      "responsibilities": [
        "Inventariar CAR, mediadores, DSS, protocolos y consumidores.",
        "Mover reglas del nuevo POS al núcleo y traducciones ERP a las ACL.",
        "Retirar cada capacidad después de demostrar equivalencia, conciliación y rollback."
      ],
      "offline": "Las tiendas conservan operaciones autorizadas. El registro en ERP puede esperar sin convertir WSO2 en dependencia del cálculo local de una venta.",
      "tech": [
        "Legado temporal delimitado",
        "ACL por capacidad",
        "Retirada incremental"
      ],
      "sources": [
        {
          "label": "WSO2 y alternativas",
          "url": "../docs/investigacion-mensajeria-pos.md"
        },
        {
          "label": "Revisión corporativa",
          "url": "../docs/revision-arquitectura-corporativa.md"
        }
      ]
    },
    "rabbitmq": {
      "title": "RabbitMQ central",
      "subtitle": "Candidato para transporte entre aplicaciones",
      "kind": "process",
      "place": "Central; no por tienda por defecto",
      "status": "proposed",
      "description": "Puede reemplazar responsabilidades de broker si se necesitan routing y consumidores independientes. Debe compararse primero con las capacidades corporativas existentes, incluido Pub/Sub si está autorizado.",
      "responsibilities": [
        "Transportar y distribuir trabajo con políticas durables verificadas.",
        "Separar límites por destino y evitar que AX bloquee a otros países.",
        "Gestionar confirmaciones, reentregas y mensajes fallidos sin perder su identidad."
      ],
      "offline": "La outbox local conserva el trabajo cuando central no está disponible. Un acuse del broker no demuestra aceptación del ERP; la deduplicación de negocio sigue siendo necesaria.",
      "tech": [
        "Quorum queues a evaluar",
        "Publisher confirms y ACK",
        "Pruebas de custodia y recuperación"
      ],
      "sources": [
        {
          "label": "Comparación y gates de adopción",
          "url": "../docs/investigacion-mensajeria-pos.md"
        }
      ]
    },
    "bullmq": {
      "title": "BullMQ para trabajos",
      "subtitle": "Coordinar jobs no reemplaza toda la integración",
      "kind": "process",
      "place": "Workers de aplicación",
      "status": "proposed",
      "description": "Candidato para jobs, reintentos y tareas programadas. Redis sigue siendo el backend predeterminado; la documentación actual también ofrece PostgreSQL como alternativa, aún por probar para este POS.",
      "responsibilities": [
        "Elegir backend y versión con pruebas de reinicio, locks y migraciones.",
        "Mantener identidad y resultado de negocio fuera de un job transitorio.",
        "Usar outbox salvo que se demuestre una garantía transaccional equivalente."
      ],
      "offline": "Una tarea puede volver a ejecutarse. Ni el jobId ni compartir PostgreSQL garantizan atomicidad con la venta o ausencia de un segundo efecto en un proveedor externo.",
      "tech": [
        "Redis o PostgreSQL según versión",
        "Jobs idempotentes",
        "Piloto y compatibilidad Nest pendientes"
      ],
      "sources": [
        {
          "label": "BullMQ actual y límites",
          "url": "../docs/investigacion-mensajeria-pos.md"
        }
      ]
    },
    "dataplatform": {
      "title": "Simplificar la persistencia",
      "subtitle": "Menos motores, responsabilidades explícitas",
      "kind": "db",
      "place": "Sucursal y central",
      "status": "proposed",
      "description": "PostgreSQL es el candidato para datos POS nuevos, local y central. La base intermedia registra integración y estados; no necesita copiar indiscriminadamente las tablas del ERP.",
      "responsibilities": [
        "Mantener negocio, outbox e inbox bajo transacciones y propietarios claros.",
        "Inventariar MPOS, SQL Server, MongoDB y todos sus consumidores antes de retirar.",
        "Migrar la autoridad de reserva, consumo y liberación de NC; una proyección de saldo no autoriza gasto."
      ],
      "offline": "Una única base remota no permite autonomía local. Reducir motores no significa eliminar bases por sucursal ni aceptar perder el único ejemplar de una venta pendiente.",
      "tech": [
        "Registro operativo de integración",
        "Custodia tras ACK",
        "Backup, replay y conciliación"
      ],
      "sources": [
        {
          "label": "Decisiones de datos",
          "url": "../docs/revision-arquitectura-corporativa.md"
        },
        {
          "label": "Resiliencia y autoridad NC",
          "url": "../docs/revision-resiliencia-datos-pos.md"
        }
      ]
    },
    "erp": {
      "title": "ERP de cada país",
      "subtitle": "Una integración detrás de un contrato del POS",
      "kind": "external",
      "place": "Chile, Perú y España",
      "status": "proposed",
      "description": "La plataforma integra Dynamics AX en Chile, el ERP custom en Perú y Gira en España mediante adaptadores. El futuro ERP común todavía no está definido.",
      "responsibilities": [
        "Exponer las capacidades acordadas con cada país.",
        "Entregar resultados verificables por operación.",
        "Permitir consultar y conciliar resultados inciertos según sus contratos."
      ],
      "offline": "El POS conserva pendientes locales. Una recepción central no demuestra aceptación por el ERP; su confirmación y recuperación son responsabilidades separadas.",
      "tech": [
        "ACL por ERP",
        "Contratos versionados",
        "Capacidades por país"
      ],
      "sources": [
        {
          "label": "Países y migración",
          "url": "../docs/propuesta-arquitectura.md"
        },
        {
          "label": "Decisiones por confirmar",
          "url": "../docs/solicitud-informacion-equipo.md"
        }
      ]
    },
    "ui": {
      "title": "Interfaz de caja",
      "subtitle": "Lo que ve quien atiende",
      "kind": "app",
      "place": "PC de caja",
      "status": "code",
      "description": "La aplicación Angular se abre en el navegador. Permite preparar ventas, cobrar, gestionar turnos y consultar información de caja.",
      "responsibilities": [
        "Capturar las acciones del operador y mostrar su resultado.",
        "Pedir al backend local las operaciones de negocio.",
        "Comunicarse con agentes locales de impresión y terminal de pago."
      ],
      "offline": "Abrir la pantalla no basta: precios, carga del cliente, pagos y fiscalidad pueden necesitar servicios remotos.",
      "tech": [
        "Angular",
        "TypeScript",
        "Navegador"
      ],
      "sources": [
        {
          "label": "Código de Mountain",
          "url": "../docs/analisis-repositorios/mountain-implementos.md"
        },
        {
          "label": "Módulos de la presentación",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ]
    },
    "backend": {
      "title": "Backend de sucursal",
      "subtitle": "Ejecuta las reglas de caja",
      "kind": "app",
      "place": "Servidor de sucursal",
      "status": "code",
      "description": "Recibe las solicitudes de la interfaz y coordina ventas, pagos, clientes y facturación. Guarda la operación en PostgreSQL local.",
      "responsibilities": [
        "Validar y guardar documentos y pagos.",
        "Consultar servicios de precios y clientes.",
        "Invocar facturación después del commit de la venta en el flujo revisado."
      ],
      "offline": "Ya existe procesamiento local, pero algunas rutas siguen dependiendo de respuestas externas. Debemos eliminar esas dependencias solo para operaciones autorizadas offline.",
      "tech": [
        "Node.js",
        "AdonisJS",
        "PostgreSQL"
      ],
      "sources": [
        {
          "label": "Venta, precios y facturación",
          "url": "../docs/analisis-repositorios/mountain-implementos.md"
        }
      ]
    },
    "localdb": {
      "title": "PostgreSQL de sucursal",
      "subtitle": "La memoria persistente de la tienda",
      "kind": "db",
      "place": "Sucursal",
      "status": "code",
      "description": "Conserva ventas, pagos, turnos, copias de maestros y datos del sincronizador. La existencia de esta base es una ventaja de la arquitectura actual.",
      "responsibilities": [
        "Guardar las operaciones locales aunque AX todavía no las registre.",
        "Mantener datos de consulta y trabajo de la sucursal.",
        "Conservar mensajes y marcas de integración del sistema actual."
      ],
      "offline": "La base permite persistir localmente, pero no garantiza que cada flujo funcione sin Internet. Si está en el servidor de sucursal, una caída de LAN o de ese servidor puede afectar las cajas.",
      "tech": [
        "PostgreSQL",
        "Transacciones locales"
      ],
      "sources": [
        {
          "label": "Persistencia actual",
          "url": "../docs/antecedentes-presentacion-chile.md"
        },
        {
          "label": "Límites offline observados",
          "url": "../docs/analisis-repositorios/mountain-implementos.md"
        }
      ]
    },
    "sync": {
      "title": "Sincronizador de sucursal",
      "subtitle": "Sube operaciones y baja maestros",
      "kind": "process",
      "place": "Sucursal",
      "status": "code",
      "description": "Trabaja en segundo plano. Envía transacciones al bus y descarga lotes para actualizar datos locales; no es la pantalla de soporte que también se llama sincronizador.",
      "responsibilities": [
        "Preparar y enviar ventas, pagos y otras entidades.",
        "Recibir avisos y respuestas por mensajería.",
        "Descargar lotes de maestros y aplicar sus detalles en la base local."
      ],
      "offline": "Los pendientes deben sobrevivir a desconexiones y reinicios. El análisis detecta caminos donde el acuse precede a la persistencia; es una garantía que debemos corregir y probar.",
      "tech": [
        "Node.js",
        "AdonisJS",
        "AMQP",
        "HTTP",
        "Cron"
      ],
      "sources": [
        {
          "label": "Informe del sincronizador",
          "url": "../docs/analisis-repositorios/mountain-sync-sucursal.md"
        },
        {
          "label": "Cadencias y lotes",
          "url": "../docs/contraste-apuntes-operacion-chile.md"
        }
      ]
    },
    "bus": {
      "title": "mountain-concentrador · integración",
      "subtitle": "WSO2, DSS y mediadores Java",
      "kind": "process",
      "place": "Central",
      "status": "code",
      "description": "El repositorio contiene APIs Synapse, consultas DSS, mediadores Java y artefactos CAR. Orquesta recepción, persistencia, transformación y llamadas .NET/AX; el broker transporta mensajes. La versión desplegada sigue pendiente.",
      "responsibilities": [
        "Transportar avisos, solicitudes y respuestas.",
        "Orquestar o mediar integraciones según la configuración central.",
        "Separar el intercambio entre tienda y ERP."
      ],
      "offline": "La tienda debe conservar el trabajo pendiente cuando el bus no está disponible. Tener un broker no demuestra una única contabilización ni entrega durable de extremo a extremo.",
      "tech": [
        "WSO2 / Synapse",
        "Java / DSS",
        "AMQP / JMS"
      ],
      "sources": [
        {
          "label": "Auditoría de mountain-concentrador",
          "url": "../docs/analisis-repositorios/mountain-concentrador.md"
        }
      ]
    },
    "readapi": {
      "title": "mountain-concentrador · api-lectura",
      "subtitle": "Receptor central y recuperación revisados",
      "kind": "app",
      "place": "Central lógico",
      "status": "code",
      "description": "La aplicación Adonis selecciona lotes en PostgreSQL y recibe acuses. sin-procesar recupera enviados no procesados incluso si recibido_sucursal=true. Node y una API Synapse tienen variantes de contrato: falta confirmar cuál está activa.",
      "responsibilities": [
        "Entregar lotes identificados de clientes, direcciones, contactos y otras entidades.",
        "Exponer consulta de cambios y recuperación de lotes pendientes.",
        "Coordinar acuses y retención con el consumidor."
      ],
      "offline": "Un aviso de lote no contiene necesariamente sus datos. Si la API cae, la sucursal no puede completar la descarga aunque haya recibido la notificación.",
      "tech": [
        "AdonisJS 4.1",
        "PostgreSQL",
        "mensajeSalidas/*"
      ],
      "sources": [
        {
          "label": "MPOS, lotes y acuses: auditoría y fuentes",
          "url": "../docs/analisis-repositorios/mountain-concentrador-maestros.md"
        }
      ]
    },
    "centraldb": {
      "title": "PostgreSQL del concentrador",
      "subtitle": "Registro central de integración",
      "kind": "db",
      "place": "Central",
      "status": "code",
      "description": "DSS, Java y Node de mountain-concentrador conservan sobres, detalles, relaciones por destino y lotes. backend-concentrador administra esos registros; ApiCarro consulta URL DTE. No equivale al registro de deuda en AX.",
      "responsibilities": [
        "Conservar información de mensajes centrales.",
        "Apoyar la consulta y administración del concentrador.",
        "Permitir seguimiento de intercambio según el diseño actual."
      ],
      "offline": "Un mensaje registrado aquí todavía puede estar pendiente de aceptación en AX. Cada etapa necesita un estado distinto.",
      "tech": [
        "PostgreSQL"
      ],
      "sources": [
        {
          "label": "Auditoría de mountain-concentrador",
          "url": "../docs/analisis-repositorios/mountain-concentrador.md"
        },
        {
          "label": "Mapa de los nueve repositorios",
          "url": "../docs/mapa-repositorios-y-conexiones.md"
        }
      ]
    },
    "ax": {
      "title": "Dynamics AX",
      "subtitle": "ERP actual de Chile",
      "kind": "external",
      "place": "Infraestructura on-premise",
      "status": "reported",
      "description": "Es el ERP informado para Chile. Recibe el registro de operaciones después de la venta local; también existen consultas online a sus integraciones.",
      "responsibilities": [
        "Atender capacidades empresariales expuestas por las integraciones actuales.",
        "Recibir ventas, pagos y otras transacciones según sus contratos.",
        "Originar o participar en la distribución de maestros."
      ],
      "offline": "AX puede enterarse más tarde. La venta local, el DTE y el registro ERP son hechos distintos; el retraso no debe ocultarse detrás de un único estado “sincronizado”.",
      "tech": [
        "Microsoft Dynamics AX",
        "SQL Server",
        "On-premise"
      ],
      "sources": [
        {
          "label": "Contexto y propuesta",
          "url": "../docs/propuesta-arquitectura.md"
        },
        {
          "label": "Adaptadores de AX",
          "url": "../docs/analisis-repositorios/apis-implementos.md"
        }
      ]
    },
    "axapi": {
      "title": "APIs de integración AX",
      "subtitle": "La puerta técnica hacia el ERP",
      "kind": "app",
      "place": "Central / entorno AX",
      "status": "code",
      "description": "Las APIs .NET traducen llamadas hacia servicios y modelos de AX. Parte del comportamiento interno del ERP queda fuera de los repositorios entregados.",
      "responsibilities": [
        "Exponer consultas y operaciones de integración.",
        "Traducir datos hacia los servicios del ERP.",
        "Devolver resultados que deben interpretarse con sus errores internos."
      ],
      "offline": "Un timeout no prueba que AX rechazó o no recibió una operación. Hay que consultar el resultado y conciliar antes de repetir un efecto financiero.",
      "tech": [
        "C#",
        ".NET Framework",
        "WCF",
        "SQL Server"
      ],
      "sources": [
        {
          "label": "Análisis de APIs corporativas",
          "url": "../docs/analisis-repositorios/apis-implementos.md"
        }
      ]
    },
    "pricing": {
      "title": "Precios y promociones actuales",
      "subtitle": "Una dependencia remota de la venta",
      "kind": "external",
      "place": "Servicio remoto; ubicación y binding por confirmar",
      "status": "code",
      "description": "La ruta activa consulta precios online con datos de producto y contexto de la venta. Un error de precio impide abrir el pago en la interfaz revisada.",
      "responsibilities": [
        "Resolver precios para un producto y cantidad.",
        "Considerar el contexto comercial enviado por la caja.",
        "Entregar información de promociones utilizada por la venta."
      ],
      "offline": "Este es un bloqueo concreto para offline. Descargar tablas de precios no basta si el cálculo que usa la venta sigue llamando una API remota.",
      "tech": [
        "API HTTP",
        "Precios",
        "Promociones"
      ],
      "sources": [
        {
          "label": "MI-01: dependencia de precios online",
          "url": "../docs/analisis-repositorios/mountain-implementos.md"
        }
      ]
    },
    "fiscal": {
      "title": "Facturación y DTE",
      "subtitle": "Documento fiscal separado de AX",
      "kind": "external",
      "place": "Proveedor / integración fiscal",
      "status": "code",
      "description": "El código revisado guarda la venta local y después invoca facturación. Una venta guardada puede tener su DTE pendiente, fallido o con resultado por confirmar.",
      "responsibilities": [
        "Solicitar la emisión del documento fiscal.",
        "Conservar el resultado y la referencia del documento.",
        "Resolver reintentos sin crear otro documento para la misma operación."
      ],
      "offline": "La posibilidad de emitir en contingencia depende del país, proveedor y modalidad autorizada. La arquitectura no concede automáticamente permiso fiscal offline.",
      "tech": [
        "DTE en Chile",
        "Acepta / Ingydev según antecedentes",
        "Adaptador fiscal por país propuesto"
      ],
      "sources": [
        {
          "label": "Orden de commit y DTE",
          "url": "../docs/analisis-repositorios/mountain-implementos.md"
        },
        {
          "label": "Fiscalidad en la propuesta",
          "url": "../docs/propuesta-arquitectura.md"
        }
      ]
    },
    "devices": {
      "title": "Impresora y terminal de pago",
      "subtitle": "El vínculo con el mundo físico",
      "kind": "app",
      "place": "PC y periféricos de caja",
      "status": "code",
      "description": "La caja utiliza agentes locales para hablar con Windows, impresoras y el terminal Transbank. Enviar una orden al agente no demuestra por sí solo impresión física ni cobro confirmado.",
      "responsibilities": [
        "Imprimir comprobantes a través del agente local.",
        "Coordinar la comunicación con el terminal de pago.",
        "Devolver resultados que permitan distinguir aceptación, finalización y fallo."
      ],
      "offline": "Imprimir localmente puede ser posible; cobrar con tarjeta depende de lo permitido por el adquirente. Un timeout de pago requiere verificar el intento antes de cobrar otra vez.",
      "tech": [
        "Servicio Windows",
        ".NET Framework",
        "ESC/POS",
        "Agente / terminal Transbank"
      ],
      "sources": [
        {
          "label": "API de impresión",
          "url": "../docs/analisis-repositorios/api-impresion-caja.md"
        },
        {
          "label": "Dispositivos en la presentación",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ]
    },
    "mongo": {
      "title": "MongoDB y notas de crédito",
      "subtitle": "Estado de NC, directorios y otros consumidores",
      "kind": "db",
      "place": "Instancias y ubicación física por confirmar",
      "status": "code",
      "description": "La API de pagos lee y escribe estado de notas de crédito y usa directorios de sucursales y datos de integración. Hay también consumidores Mongo en precios. El diagrama agrupa el motor, sin acreditar una instancia única ni una función solo de lectura.",
      "responsibilities": [
        "Conservar estados utilizados en controles de uso o devolución de NC; su protocolo completo debe verificarse.",
        "Apoyar directorios y datos necesarios para consultas a bases de sucursales.",
        "Inventariar colecciones, escrituras, precios y demás consumidores antes de migrar o retirar Mongo."
      ],
      "offline": "Una copia local del saldo no evita que dos tiendas usen el mismo saldo. Se necesita autoridad o cupo reservado, exclusión verificable y conciliación.",
      "tech": [
        "MongoDB",
        "Node.js / Express",
        "Consultas PostgreSQL a sucursales"
      ],
      "sources": [
        {
          "label": "API de pagos y notas de crédito",
          "url": "../docs/analisis-repositorios/api-pagos-caja.md"
        }
      ]
    },
    "mpos": {
      "title": "MPOS · SQL Server",
      "subtitle": "Lectores confirmados en mountain-concentrador",
      "kind": "db",
      "place": "Ubicación por confirmar",
      "status": "code",
      "description": "BOAX selecciona la base MPOS; BOCliente lee CustTableSync e invoca MPOS.dbo.sp_caja_custTable. Se comprobó el lector central, no el proceso que lleva cambios desde AX ni su horario o ubicación física.",
      "responsibilities": [
        "Alimentar lotes centrales desde tablas de intercambio.",
        "Mantener cambios procesados según el lector Java.",
        "Confirmar productor, bajas, transacciones y recuperación con el equipo."
      ],
      "offline": "El posible job diario pertenece a una etapa central aún por confirmar. No significa que todas las cajas sincronicen una vez al día.",
      "tech": [
        "SQL Server / JDBC",
        "CustTableSync",
        "Productor y host pendientes"
      ],
      "sources": [
        {
          "label": "MPOS, lotes y acuses: auditoría y fuentes",
          "url": "../docs/analisis-repositorios/mountain-concentrador-maestros.md"
        }
      ]
    },
    "clientapi": {
      "title": "Consulta de cliente por RUT",
      "subtitle": "Refresco bajo demanda",
      "kind": "app",
      "place": "API remota configurada",
      "status": "code",
      "description": "Seleccionar o cargar un cliente puede consultar una API por RUT y actualizar su copia local. El componente exacto que responde a esa API está por confirmar.",
      "responsibilities": [
        "Obtener información actualizada del cliente solicitado.",
        "Guardar la ficha y ciertos datos relacionados en una transacción local.",
        "Complementar la distribución masiva de maestros; los contactos tienen caminos separados."
      ],
      "offline": "El flujo principal revisado puede limpiar la venta si falla el refresco, aunque haya datos locales. La propuesta separa “ficha disponible” de “refresco fallido” y define qué operaciones permite esa versión.",
      "tech": [
        "HTTP",
        "RUT",
        "Persistencia PostgreSQL local"
      ],
      "sources": [
        {
          "label": "Traza de carga por RUT y fallback",
          "url": "../docs/contraste-apuntes-operacion-chile.md"
        }
      ]
    },
    "edge": {
      "title": "Núcleo local del POS",
      "subtitle": "Reglas que pueden ejecutarse en la tienda",
      "kind": "app",
      "place": "Sucursal; por caja si se exige aislamiento LAN",
      "status": "proposed",
      "description": "Un monolito modular organiza ventas, caja, precios, ofertas y las capacidades locales. Mantiene contratos claros sin multiplicar servicios por defecto.",
      "responsibilities": [
        "Decidir si una operación está autorizada con datos y permisos disponibles.",
        "Calcular precios y ofertas localmente usando una versión aprobada.",
        "Persistir operaciones y mensajes pendientes antes de confirmar al operador."
      ],
      "offline": "Para pérdida de Internet puede aprovecharse el servidor de sucursal. Si también debemos tolerar perder LAN o servidor, se necesita autoridad y persistencia por caja; es una decisión pendiente.",
      "tech": [
        "NestJS + Fastify, candidato",
        "Monolito modular",
        "Contratos de módulos",
        "Nx para organización del código"
      ],
      "sources": [
        {
          "label": "Perfiles offline y núcleo local",
          "url": "../docs/propuesta-arquitectura.md"
        },
        {
          "label": "Opciones de stack",
          "url": "../docs/opciones-tecnologicas.md"
        }
      ]
    },
    "edgedb": {
      "title": "Persistencia local propuesta",
      "subtitle": "Una operación y su envío pendiente, juntos",
      "kind": "db",
      "place": "Junto al escritor local autorizado",
      "status": "proposed",
      "description": "La base conserva operaciones, versiones de reglas, recepción de mensajes y envíos pendientes. Su ubicación sigue el perfil offline elegido; no se cambia de escritor improvisadamente ante un fallo.",
      "responsibilities": [
        "Confirmar venta y outbox en la misma transacción.",
        "Guardar identificadores estables y evidencia de resultados externos.",
        "Soportar recuperación, respaldo y migraciones compatibles con la operación."
      ],
      "offline": "La tienda debe sobrevivir a un reinicio sin perder ventas pendientes. El espacio, la vigencia de datos y los límites autorizados acotan la autonomía.",
      "tech": [
        "Transacciones ACID",
        "PostgreSQL de sucursal como punto de partida",
        "Motor por terminal por evaluar"
      ],
      "sources": [
        {
          "label": "Persistencia y protocolo propuestos",
          "url": "../docs/propuesta-arquitectura.md"
        },
        {
          "label": "Pruebas de recuperación",
          "url": "../docs/validacion-y-decisiones.md"
        }
      ]
    },
    "outbox": {
      "title": "Outbox",
      "subtitle": "Bandeja durable de envíos pendientes",
      "kind": "db",
      "place": "En la base de quien origina la operación",
      "status": "proposed",
      "description": "Es una tabla o colección persistente, no necesariamente otra base ni otro servicio. Se guarda junto a la operación que necesita comunicar.",
      "responsibilities": [
        "Registrar qué evento hay que enviar con un identificador estable.",
        "Permitir que un worker reintente después de una desconexión o caída.",
        "Conservar el pendiente hasta el acuse durable y la política de retención acordada."
      ],
      "offline": "La venta y el pendiente se escriben en un mismo commit. Puede haber reentregas; el receptor debe impedir repetir el efecto de negocio.",
      "tech": [
        "Patrón transactional outbox",
        "Entrega al menos una vez",
        "Worker de envío"
      ],
      "sources": [
        {
          "label": "Protocolo de sincronización",
          "url": "../docs/propuesta-arquitectura.md"
        },
        {
          "label": "Referencias y límites de core",
          "url": "../docs/analisis-repositorios/aportes-plataforma-corporativa.md"
        }
      ]
    },
    "inbox": {
      "title": "Inbox",
      "subtitle": "Registro durable de lo ya procesado",
      "kind": "db",
      "place": "En la base de cada receptor",
      "status": "proposed",
      "description": "Permite reconocer un mensaje repetido. El receptor registra el identificador y aplica el efecto local dentro de la misma transacción cuando ambos pertenecen a su base.",
      "responsibilities": [
        "Detectar reentregas con la identidad estable del evento.",
        "Evitar repetir el efecto local ya aplicado.",
        "Emitir el acuse después de persistir el resultado."
      ],
      "offline": "Si se pierde el acuse, la tienda puede reenviar el mismo evento. El receptor responde sin crear otra venta. Esto no resuelve automáticamente efectos en proveedores externos.",
      "tech": [
        "Deduplicación durable",
        "Transacción del receptor",
        "Retención acorde al horizonte de reenvío"
      ],
      "sources": [
        {
          "label": "Inbox, acuses e idempotencia",
          "url": "../docs/propuesta-arquitectura.md"
        }
      ]
    },
    "platform": {
      "title": "Plataforma central por país",
      "subtitle": "Recibe, distribuye y concilia",
      "kind": "app",
      "place": "Central con aislamiento por país y entidad legal",
      "status": "proposed",
      "description": "Consolida operaciones, entrega paquetes de maestros y coordina integraciones. Debe tolerar el retraso de tiendas y de ERPs con estados visibles y responsables.",
      "responsibilities": [
        "Recibir eventos y confirmar persistencia durable.",
        "Distribuir versiones de datos, permisos y reglas.",
        "Conciliar ventas, pagos, fiscalidad y registros ERP sin mezclar sus estados."
      ],
      "offline": "Las operaciones locales permitidas no necesitan esperar a esta plataforma. Una caída de Chile tampoco debe bloquear las colas de Perú o España.",
      "tech": [
        "Contratos versionados",
        "Workers",
        "Aislamiento por país",
        "Capacidades de core seleccionadas"
      ],
      "sources": [
        {
          "label": "Arquitectura por país",
          "url": "../docs/propuesta-arquitectura.md"
        },
        {
          "label": "Reutilización corporativa",
          "url": "../docs/analisis-repositorios/aportes-plataforma-corporativa.md"
        }
      ]
    },
    "acl": {
      "title": "ACL y fachadas de integración",
      "subtitle": "Traducir sin contaminar el modelo del POS",
      "kind": "app",
      "place": "Límite entre POS y sistemas externos",
      "status": "proposed",
      "description": "La fachada ofrece una capacidad clara, como registrar una venta. La ACL traduce el vocabulario y las reglas de cada ERP al modelo del POS.",
      "responsibilities": [
        "Ocultar campos y particularidades del ERP tras contratos propios.",
        "Traducir identidades, importes, fechas y estados sin perder significado.",
        "Hacer explícitos los resultados confirmados, fallidos o todavía inciertos."
      ],
      "offline": "Ayuda a desacoplar la evolución del ERP, pero no reemplaza persistencia, sincronización ni conciliación. Cambiar de ERP seguirá requiriendo validación funcional y datos.",
      "tech": [
        "Anti-corruption layer",
        "Fachadas",
        "Puertos y adaptadores",
        "Contratos y mapeos versionados"
      ],
      "sources": [
        {
          "label": "Integración y migración de ERP",
          "url": "../docs/propuesta-arquitectura.md"
        },
        {
          "label": "Contraste con patrones corporativos",
          "url": "../docs/analisis-repositorios/aportes-plataforma-corporativa.md"
        }
      ]
    },
    "erpnext": {
      "title": "ERP común futuro",
      "subtitle": "Una dirección de negocio, destino por definir",
      "kind": "external",
      "place": "Chile, Perú y España",
      "status": "pending",
      "description": "Se contempla comenzar una migración por Chile posiblemente el próximo año respecto del contexto recibido, 2027. No se ha confirmado producto, calendario ni alcance.",
      "responsibilities": [
        "Unificar las capacidades empresariales que se acuerden para los tres países.",
        "Sustituir las integraciones actuales mediante una transición controlada.",
        "Mantener referencias históricas y permitir conciliación durante el cambio."
      ],
      "offline": "El POS debe conservar su autonomía y sus contratos aunque cambie el ERP. La migración no habilita automáticamente capacidades de pago o fiscalidad offline.",
      "tech": [
        "Producto por definir",
        "Adaptadores por ERP",
        "Migración gradual propuesta"
      ],
      "sources": [
        {
          "label": "Decisiones y evidencia pendiente",
          "url": "../docs/solicitud-informacion-equipo.md"
        },
        {
          "label": "Propuesta de integración",
          "url": "../docs/propuesta-arquitectura.md"
        }
      ]
    },
    "offers": {
      "title": "Motor local de precios y ofertas",
      "subtitle": "La tienda puede explicar el precio que aplica",
      "kind": "app",
      "place": "Dentro del núcleo local",
      "status": "proposed",
      "description": "Evalúa reglas y vigencias sin consultar el servicio central en cada venta. Registra la versión utilizada para poder reproducir y auditar el cálculo.",
      "responsibilities": [
        "Aplicar precios, promociones, precedencias y redondeos acordados.",
        "Activar paquetes validados de forma atómica.",
        "Distinguir evaluación local de permisos para crear o editar ofertas en tienda."
      ],
      "offline": "Solo debe vender con paquetes válidos según la política aprobada. Si vencen, el sistema necesita una regla explícita de restricción o contingencia.",
      "tech": [
        "Reglas versionadas",
        "Paquetes de datos",
        "Pruebas de paridad",
        "Trazabilidad del cálculo"
      ],
      "sources": [
        {
          "label": "Ofertas locales y autoridad de datos",
          "url": "../docs/propuesta-arquitectura.md"
        },
        {
          "label": "La plataforma actual también consulta precios remotos",
          "url": "../docs/analisis-repositorios/aportes-plataforma-corporativa.md"
        }
      ]
    },
    "observability": {
      "title": "Observabilidad",
      "subtitle": "Poder seguir una operación de punta a punta",
      "kind": "process",
      "place": "Local y central",
      "status": "proposed",
      "description": "Combina logs, métricas y trazas con identificadores de operación. Debe mostrar qué está pendiente y por qué, sin exponer datos personales o secretos.",
      "responsibilities": [
        "Relacionar venta local, envío, recepción y respuesta ERP.",
        "Mostrar antigüedad de pendientes, errores y salud del dispositivo.",
        "Proteger datos sensibles y limitar el uso de disco durante una caída."
      ],
      "offline": "La telemetría remota no puede bloquear una venta autorizada. Debe existir un búfer local acotado y un modo seguro si Sentry u otro destino está inaccesible.",
      "tech": [
        "nestjs-pino / Pino, candidatos",
        "Sentry, candidato",
        "Métricas y trazas",
        "Correlación por operación"
      ],
      "sources": [
        {
          "label": "Pino y Sentry: condiciones de adopción",
          "url": "../docs/opciones-tecnologicas.md"
        },
        {
          "label": "Implementación corporativa",
          "url": "../docs/analisis-repositorios/core.md"
        }
      ]
    },
    "payments": {
      "title": "API de consulta de pagos",
      "subtitle": "Consulta pendientes y notas de crédito",
      "kind": "app",
      "place": "Central",
      "status": "code",
      "description": "Es una API auxiliar que consulta sucursales y MongoDB. No debe confundirse con el terminal que autoriza un pago con tarjeta.",
      "responsibilities": [
        "Consultar pagos aún pendientes de sincronización.",
        "Apoyar la consulta del estado de notas de crédito.",
        "Entregar información que otras validaciones comerciales utilizan."
      ],
      "offline": "Las consultas distribuidas pueden tener una visión incompleta. Una marca de preparado no confirma registro en AX; ese desfase afecta la interpretación de pendientes.",
      "tech": [
        "Node.js",
        "Express",
        "PostgreSQL",
        "MongoDB"
      ],
      "sources": [
        {
          "label": "Análisis de consulta de pagos",
          "url": "../docs/analisis-repositorios/api-pagos-caja.md"
        }
      ]
    },
    "tauri": {
      "title": "Aplicación de escritorio con Tauri",
      "subtitle": "Una opción para presentar y distribuir la interfaz",
      "kind": "app",
      "place": "PC de caja",
      "status": "proposed",
      "description": "Tauri es un candidato para empaquetar la interfaz y controlar integraciones del dispositivo. La decisión requiere validar periféricos, instalación, actualizaciones y soporte.",
      "responsibilities": [
        "Presentar la interfaz en una aplicación instalada.",
        "Exponer capacidades nativas con permisos mínimos.",
        "Participar en actualizaciones firmadas y recuperación verificable."
      ],
      "offline": "Tauri por sí solo no vuelve offline a la aplicación. La autonomía depende del núcleo local, datos, reglas, permisos y capacidades de proveedores.",
      "tech": [
        "Tauri, candidato",
        "Angular reutilizable",
        "Rust en la capa nativa"
      ],
      "sources": [
        {
          "label": "Evaluación de Tauri",
          "url": "../docs/opciones-tecnologicas.md"
        }
      ]
    },
    "instacheck": {
      "title": "Instacheck",
      "subtitle": "Componente histórico de la diapositiva",
      "kind": "external",
      "place": "Integración histórica",
      "status": "historical",
      "description": "El usuario aclaró que ya no funciona como integrador. Persisten referencias en el código; eso no demuestra que siga operativo.",
      "responsibilities": [
        "Conservar el contexto de la arquitectura original.",
        "Identificar configuración residual que el equipo debe revisar.",
        "Confirmar el proveedor o procedimiento vigente sin asumir el estado de Orsan."
      ],
      "offline": "No se incluye como dependencia operativa vigente de la propuesta.",
      "tech": [
        "Fuera de uso según el usuario"
      ],
      "sources": [
        {
          "label": "AP-07: aclaración operativa",
          "url": "../docs/contraste-apuntes-operacion-chile.md"
        }
      ]
    }
  },
  "glossary": [
    {
      "term": "Esquema de base de datos",
      "definition": "Espacio de nombres que permite distinguir tablas dentro de una base. El código puede nombrarlo explícitamente o depender de la configuración de conexión.",
      "example": "Si una consulta usa documentos sin prefijo, no podemos añadir public. sin verificar cómo se resuelve ese nombre."
    },
    {
      "term": "Tabla y colección",
      "definition": "Una tabla organiza registros en una base relacional; una colección agrupa documentos en MongoDB. El nombre de un modelo de código no siempre identifica por sí solo el nombre físico.",
      "example": "estadoNC es una colección declarada explícitamente en el modelo revisado; el alias de conexión no acredita el servidor productivo."
    },
    {
      "term": "Frontera transaccional",
      "definition": "Conjunto de cambios que pertenecen a la misma transacción. Una llamada posterior a otro servicio no queda incluida por ejecutarse en la misma función.",
      "example": "El commit local de la venta no confirma que el proveedor emitió un DTE ni que AX registró la operación."
    },
    {
      "term": "POS",
      "definition": "Sistema de punto de venta: ayuda a preparar, cobrar y registrar una venta en caja.",
      "example": "La persona operadora agrega productos y finaliza una venta."
    },
    {
      "term": "ERP",
      "definition": "Sistema que integra procesos empresariales. La integración define qué registra y qué responde.",
      "example": "Dynamics AX es el ERP actual informado para Chile; Gira, para España."
    },
    {
      "term": "API",
      "definition": "Contrato para que un programa pida datos o acciones a otro.",
      "example": "La caja pide a una API la ficha de un cliente."
    },
    {
      "term": "Base de datos",
      "definition": "Almacenamiento organizado que conserva información después de cerrar o reiniciar la aplicación.",
      "example": "PostgreSQL local guarda una venta antes de que llegue a AX."
    },
    {
      "term": "DTE",
      "definition": "Documento tributario electrónico en el contexto chileno. Su emisión tiene un resultado distinto del registro de la venta en el ERP.",
      "example": "Una venta puede estar guardada y tener su documento fiscal todavía pendiente."
    },
    {
      "term": "Maestros",
      "definition": "Datos de referencia que muchas operaciones necesitan consultar.",
      "example": "Clientes, direcciones, artículos y reglas de precio."
    },
    {
      "term": "Sincronización",
      "definition": "Intercambio controlado de cambios entre sistemas que no siempre están conectados.",
      "example": "La sucursal envía ventas pendientes y descarga un lote de clientes."
    },
    {
      "term": "Worker",
      "definition": "Proceso que realiza trabajo en segundo plano.",
      "example": "Un worker reintenta enviar la outbox cuando vuelve la conexión."
    },
    {
      "term": "Commit",
      "definition": "Confirmación de una transacción en una base de datos: sus cambios quedan guardados juntos.",
      "example": "Guardar la venta y su evento pendiente en el mismo commit evita separar ambos hechos."
    },
    {
      "term": "Outbox",
      "definition": "Bandeja persistente de mensajes pendientes, guardada junto a la operación que los origina.",
      "example": "La venta V-001 queda guardada junto al evento que debemos enviar."
    },
    {
      "term": "Inbox",
      "definition": "Registro persistente de mensajes recibidos que permite reconocer reentregas.",
      "example": "Si vuelve a llegar el evento E-001, se reconoce en lugar de registrar otra venta."
    },
    {
      "term": "Idempotencia",
      "definition": "Capacidad de repetir una solicitud identificada sin repetir su efecto de negocio.",
      "example": "Reenviar E-001 no crea un segundo registro de la misma venta."
    },
    {
      "term": "Consistencia eventual",
      "definition": "Los sistemas pueden tener información distinta por un tiempo y converger mediante un proceso controlado.",
      "example": "La tienda ya guardó la venta; AX la conocerá cuando se complete la integración."
    },
    {
      "term": "Acuse o ACK",
      "definition": "Respuesta que confirma una etapa concreta del intercambio. Hay que saber exactamente qué confirma.",
      "example": "“Persistido en central” no significa “contabilizado en AX”."
    },
    {
      "term": "ACL",
      "definition": "Anti-corruption layer: capa que traduce el modelo de un sistema externo al vocabulario propio del producto.",
      "example": "Un estado específico de AX se traduce a un estado de integración del POS."
    },
    {
      "term": "Fachada",
      "definition": "Entrada sencilla a una capacidad que oculta cómo se coordinan sus partes internas.",
      "example": "RegistrarVenta recibe un contrato del POS y coordina su implementación."
    },
    {
      "term": "Puerto",
      "definition": "Contrato propio del POS para pedir una capacidad y entender sus resultados sin conocer el proveedor.",
      "example": "ConsultarResultadoDePago usa la referencia original, sin exponer el SDK al dominio."
    },
    {
      "term": "Adaptador",
      "definition": "Implementación que conecta un contrato del POS con un protocolo, SDK o aplicación concreta.",
      "example": "El mismo contrato de impresión puede tener adaptadores para distintos drivers homologados."
    },
    {
      "term": "Perfil de capacidades",
      "definition": "Configuración versionada de proveedor, adaptador y dispositivo para un país, sucursal o puesto. Distingue lo soportado, lo autorizado y lo disponible.",
      "example": "Una impresora puede ser compatible, pero estar sin papel; un terminal conectado puede no estar habilitado para ese comercio."
    },
    {
      "term": "Binding de operación",
      "definition": "Vínculo persistido entre una operación lógica y el proveedor, comercio, dispositivo y versión compatible elegidos antes del primer efecto. Todos sus intentos conservan ese destino.",
      "example": "Cambiar el perfil de nuevas ventas a B no redirige un cobro pendiente ni la consulta o reversa de un cobro realizado con A."
    },
    {
      "term": "Monorepo",
      "definition": "Repositorio que reúne varios proyectos relacionados y permite compartir herramientas y contratos.",
      "example": "Nx organiza aplicaciones y bibliotecas; eso no las convierte en un solo servicio."
    },
    {
      "term": "Monolito modular",
      "definition": "Aplicación con módulos separados por responsabilidad y límites de acceso explícitos.",
      "example": "Ventas usa el contrato de precios, sin escribir directamente sus tablas."
    },
    {
      "term": "Conciliación",
      "definition": "Comparación de evidencias para resolver si una operación ocurrió y en qué estado quedó.",
      "example": "Después de un timeout, consultar al proveedor si ofrece esa capacidad o iniciar resolución operativa controlada."
    },
    {
      "term": "Endpoint",
      "definition": "Punto de entrada de una API, identificado por método y ruta. Encontrarlo en código no demuestra qué host lo publica ni que se use en producción.",
      "example": "POST /punto-de-venta es una ruta declarada; un sufijo llamado por otro proceso puede tener todavía un receptor por confirmar."
    },
    {
      "term": "Despliegue lógico",
      "definition": "Agrupación de componentes por ámbito, como PC, sucursal o central. No equivale al inventario físico de servidores, procesos e instancias.",
      "example": "Central puede representar varios servidores; falta confirmar hosts, réplicas y versiones instaladas."
    },
    {
      "term": "HTTP y AMQP",
      "definition": "HTTP modela intercambios de solicitud y respuesta; AMQP es un protocolo de mensajería. Ninguno acredita por sí solo que el ERP aplicó el efecto de negocio.",
      "example": "El sincronizador sube un mensaje por HTTP y puede recibir una respuesta posterior mediante AMQP."
    },
    {
      "term": "RFID",
      "definition": "Identificación por radio mediante etiquetas y lectores. Una observación de radio no prueba cantidad vendible, propiedad ni pago.",
      "example": "Leer varias veces una etiqueta durante una sesión y reconocer que sigue siendo el mismo identificador."
    },
    {
      "term": "EPC",
      "definition": "Identificador electrónico que puede transportarse en una etiqueta RFID. Su interpretación y relación con producto, unidad o empaque deben estar gobernadas.",
      "example": "Los EPC-DEMO de la presentación son identificadores sintéticos; no son etiquetas reales ni ejemplos de codificación estándar."
    },
    {
      "term": "SKU",
      "definition": "Código de una referencia comercial del catálogo. Dos unidades distintas pueden compartir el mismo SKU.",
      "example": "Dos tags asociados a SKU-A pueden representar dos unidades, si ese mapeo está validado; no se deduplican por el SKU."
    },
    {
      "term": "Sesión de lectura",
      "definition": "Ámbito identificado que reúne observaciones de una zona y permite resolver repeticiones y excepciones antes de proponer una acción.",
      "example": "Cinco observaciones pueden corresponder a tres etiquetas únicas; aún falta validar su mapeo y revisar la selección."
    },
    {
      "term": "RAG",
      "definition": "Técnica que recupera contenido de fuentes seleccionadas para aportar contexto a un modelo. Recuperar una cita no garantiza una respuesta correcta.",
      "example": "Buscar un procedimiento autorizado y mostrar su versión junto a la ayuda propuesta."
    },
    {
      "term": "Abstención de IA",
      "definition": "Respuesta explícita que reconoce que falta evidencia, permiso o capacidad suficiente para ayudar con fiabilidad.",
      "example": "Sin una referencia técnica verificada, no afirmar que dos productos son compatibles."
    },
    {
      "term": "Embeddings",
      "definition": "Representaciones numéricas que permiten buscar contenido por semejanza. La cercanía matemática no acredita verdad ni compatibilidad.",
      "example": "Encontrar descripciones parecidas y después verificar sus atributos en el catálogo autorizado."
    },
    {
      "term": "Núcleo determinista",
      "definition": "Parte del POS que aplica reglas explícitas y verificables a los comandos de negocio, con independencia de las sugerencias de IA.",
      "example": "La revisión humana de un borrador no evita validar precio, permisos y política offline."
    },
    {
      "term": "WAN y LAN",
      "definition": "WAN es la conexión con redes externas; LAN es la red dentro de la sucursal.",
      "example": "Sin Internet, las cajas aún pueden hablar con su servidor por LAN si esa red funciona."
    }
  ],
  "rfidScenarios": [
    {
      "id": "checkout",
      "label": "Lectura en caja",
      "title": "Preparar candidatos sin multiplicar productos por cada lectura.",
      "description": "La radio puede observar varias veces una misma etiqueta. Primero se resuelve su identidad y unidad; después se revisa la selección y se usa el comando normal del POS.",
      "boundary": "Una etiqueta de caja, kit o empaque no equivale por defecto a una unidad. Etiquetas desconocidas, ambiguas o fuera de zona no se añaden automáticamente."
    },
    {
      "id": "inventory",
      "label": "Conteo de inventario",
      "title": "Enviar evidencia de conteo al sistema responsable.",
      "description": "Un conteo puede reunir observaciones de una zona con rapidez, pero necesita alcance, sesión, fecha, movimientos concurrentes y revisión de diferencias.",
      "steps": [
        "Capturar observaciones en una zona y sesión autorizadas.",
        "Resolver etiquetas, unidades y excepciones con datos gobernados.",
        "Enviar un conteo identificado al dueño del inventario para revisar y conciliar."
      ],
      "boundary": "La caja no maneja stock. RFID no le transfiere esa autoridad: un conteo no sobrescribe automáticamente el saldo del ERP o WMS."
    },
    {
      "id": "selfservice",
      "label": "Autoservicio",
      "title": "Un flujo de atención propio, con o sin RFID.",
      "description": "Autoservicio y lectura por radio son decisiones independientes. Puede capturarse por RFID, código de barras u otro mecanismo validado.",
      "steps": [
        "Diseñar accesibilidad, ayuda al cliente y manejo de excepciones.",
        "Revisar selección, cantidades y precios con las reglas del POS.",
        "Completar pago y documento por sus contratos; resolver incidencias antes de dar la operación por terminada."
      ],
      "boundary": "Detectar productos no acredita pago ni emisión. La experiencia, los controles y la asistencia requieren validación propia; no están resueltos por instalar un lector."
    }
  ],
  "rfidDemo": {
    "observations": [
      "EPC-DEMO-001",
      "EPC-DEMO-002",
      "EPC-DEMO-001",
      "EPC-DEMO-003",
      "EPC-DEMO-002"
    ],
    "mapping": {
      "EPC-DEMO-001": {
        "sku": "SKU-A",
        "units": 1
      },
      "EPC-DEMO-002": {
        "sku": "SKU-A",
        "units": 1
      },
      "EPC-DEMO-003": {
        "sku": "SKU-B",
        "units": 1
      }
    }
  },
  "aiServices": [
    {
      "name": "Microsoft Foundry, Azure AI Search y Document Intelligence",
      "use": "Modelos, búsqueda documental y extracción de campos.",
      "limits": "Validar identidad, permisos, región, contrato y coste. Algunas capacidades de autorización documental de Search están en preview; no asumir protección automática."
    },
    {
      "name": "Google Cloud: Gemini y Document AI",
      "use": "Asistencia gestionada y extracción documental; hay precedente GCP en el código corporativo.",
      "limits": "Ese precedente no acredita una plataforma IA desplegada. Servicios, regiones, acceso y operación deben aprobarse; no obliga a usar agentes autónomos."
    },
    {
      "name": "ONNX Runtime y pgvector opcional",
      "use": "Inferencia o búsqueda semántica local si mejoran la búsqueda convencional.",
      "limits": "Hardware sin medir y API generativa de ONNX en preview. pgvector sirve para búsqueda vectorial; no es un modelo ni debe cargar el escritor financiero por defecto."
    }
  ],
  "aiCases": [
    {
      "id": "procedures",
      "label": "Procedimientos y ayuda",
      "priority": "Piloto 1",
      "pilot": true,
      "title": "Encontrar un procedimiento aprobado, con su fuente.",
      "purpose": "Ayudar al cajero a entender una incidencia o un paso operativo sin recorrer varios manuales.",
      "example": "«La impresora no responde: muéstrame el procedimiento aprobado para este puesto».",
      "online": "Proponer una guía breve vinculada a un procedimiento autorizado, con versión y fecha. La persona verifica la fuente antes de actuar.",
      "offline": "Consultar el procedimiento local aprobado con búsqueda normal. En este ejemplo no hay respuesta generada por un modelo.",
      "local": true,
      "boundary": "La ayuda no autoriza repetir cobros ni emitir documentos. Un manual vigente de otro equipo puede ser inaplicable; fuentes vencidas o fuera de permisos no se muestran.",
      "inputs": "Manuales con propietario, permisos y versión, vinculados al perfil, modelo, firmware, SDK y adaptador instalados.",
      "metric": "Respuestas sustentadas, abstenciones correctas y tiempo de consulta frente a búsqueda convencional."
    },
    {
      "id": "catalog",
      "label": "Búsqueda de productos",
      "priority": "Piloto 2 · condicionado",
      "pilot": true,
      "title": "Interpretar la consulta; comprobar la compatibilidad.",
      "purpose": "Ayudar a encontrar candidatos aunque se usen sinónimos o descripciones incompletas. Requiere catálogo y relaciones de compatibilidad curados.",
      "example": "«Busco una pieza para el equipo X». El ejemplo no acredita compatibilidad de ningún producto real.",
      "online": "Proponer candidatos con referencias verificables. Una fuente autorizada valida la compatibilidad; si no la hay, pedir revisión.",
      "offline": "Buscar por código, descripción y filtros en el catálogo local vigente. No generar equivalencias ni inventar compatibilidad.",
      "local": true,
      "boundary": "Similitud semántica no demuestra compatibilidad. Caja no se convierte en autoridad de stock; precios y reglas siguen en el núcleo.",
      "inputs": "Catálogo curado y relaciones técnicas verificadas. Conservar IDs de origen y versión de mapeo ERP, sin fusionar códigos parecidos.",
      "metric": "Candidatos relevantes, errores de compatibilidad detectados y tiempo de búsqueda frente al método actual."
    },
    {
      "id": "ocr",
      "label": "OCR de pedidos",
      "priority": "Después de los pilotos",
      "title": "Pasar un pedido a un borrador revisable.",
      "purpose": "Extraer códigos, cantidades y referencias de un documento permitido, reduciendo transcripción manual.",
      "example": "Un pedido sintético contiene «código X, cantidad 2». La extracción puede confundir un dígito.",
      "online": "Extraer un borrador y señalar campos dudosos. La persona contrasta el documento; el núcleo valida códigos, cantidades y reglas.",
      "offline": "El OCR remoto se deshabilita en este ejemplo. Se conserva la entrada manual; un OCR local necesitaría evaluación propia.",
      "local": false,
      "boundary": "Un borrador no crea una venta. Leer un total impreso no lo convierte en el precio autorizado del POS.",
      "inputs": "Formatos de pedido autorizados, muestras representativas y política de datos personales.",
      "metric": "Exactitud por campo, correcciones humanas y tiempo de revisión total, no solo tiempo de extracción."
    },
    {
      "id": "reconciliation",
      "label": "Pendientes y conciliación",
      "priority": "Después de los pilotos",
      "title": "Explicar una discrepancia sin cambiar su estado.",
      "purpose": "Agrupar señales y proponer qué evidencias revisar para entender operaciones pendientes.",
      "example": "«La sucursal guardó la venta y el ERP sigue pendiente: ¿qué evidencias faltan?».",
      "online": "Resumir eventos autorizados con referencias y fechas. Proponer pasos de investigación para el equipo operativo.",
      "offline": "Se mantienen las vistas deterministas de pendientes locales. El resumen central queda deshabilitado y no inventa el estado del ERP.",
      "local": false,
      "boundary": "La IA no confirma pagos, no marca una venta como conciliada y no reenvía un cobro. Un timeout sigue siendo incertidumbre.",
      "inputs": "Eventos correlacionados, estados con significado definido y permisos operativos.",
      "metric": "Hipótesis respaldadas, falsos diagnósticos y tiempo de investigación, con conciliación independiente."
    },
    {
      "id": "recommendations",
      "label": "Recomendaciones",
      "priority": "Evaluación posterior",
      "title": "Sugerir complementos dentro de reglas explícitas.",
      "purpose": "Presentar productos complementarios pertinentes sin inventar ofertas ni condiciones comerciales.",
      "example": "«¿Hay un accesorio relacionado con este producto?». No se presupone stock ni autorización de descuento.",
      "online": "Ordenar candidatos con relaciones de catálogo verificadas. El motor determinista aplica elegibilidad, precio y oferta vigentes.",
      "offline": "La recomendación del modelo se deshabilita en este ejemplo. Catálogo y ofertas locales siguen según sus reglas autorizadas.",
      "local": false,
      "boundary": "Ni el modelo ni la persona eluden reglas al aceptar una sugerencia. No inferir compatibilidad ni disponibilidad real por similitud.",
      "inputs": "Evaluar el consumidor de recomendaciones existente en core antes de construir otro. Su existencia no acredita IA generativa ni compatibilidad técnica; el origen de los scores no fue revisado.",
      "metric": "Pertinencia, rechazos, impacto medido frente a una línea base y ausencia de ofertas inválidas.",
      "reference": {
        "label": "Evidencia de recomendaciones en core",
        "url": "../docs/analisis-repositorios/core.md"
      }
    },
    {
      "id": "analytics",
      "label": "Analítica asistida",
      "priority": "Evaluación posterior",
      "title": "Entender un indicador con definición y corte.",
      "purpose": "Ayudar a leer informes aprobados sin convertir respuestas plausibles en cifras oficiales.",
      "example": "«Explícame este indicador de ventas y hasta qué momento tiene datos».",
      "online": "Explicar métricas publicadas con definición, filtro, alcance y fecha de actualización; usar vistas autorizadas de lectura.",
      "offline": "El análisis central se deshabilita. Pueden consultarse reportes locales ya disponibles, mostrando su corte y alcance.",
      "local": false,
      "boundary": "No ejecutar SQL libre contra bases de caja ni mezclar países o entidades fuera de permisos. Los datos deben tener una fuente responsable.",
      "inputs": "Métricas gobernadas, vistas de lectura, permisos y fecha de actualización.",
      "metric": "Exactitud de interpretación, filtros correctos y trazabilidad de cada cifra a su fuente."
    },
    {
      "id": "support",
      "label": "Soporte operativo",
      "priority": "Complementa al piloto 1",
      "title": "Preparar un diagnóstico que una persona pueda verificar.",
      "purpose": "Resumir síntomas y evidencias sanitizadas para ayudar al soporte, sin acceso autónomo a servicios.",
      "example": "«El agente de impresión está detenido: prepara un resumen para soporte». No se envía ningún mensaje.",
      "online": "Proponer un resumen con observaciones y guías autorizadas. El operador decide qué revisar y compartir.",
      "offline": "Se conservan chequeos deterministas y guías locales autorizadas. El diagnóstico generado por un modelo queda deshabilitado.",
      "local": false,
      "boundary": "No reinicia procesos, no ejecuta shell ni modifica datos. Los logs se minimizan y no llevan credenciales ni datos de pago al modelo.",
      "inputs": "Códigos de error y salud sanitizados; manuales aplicables al perfil, modelo, firmware, SDK y adaptador reales.",
      "metric": "Diagnósticos respaldados, utilidad para soporte y reducción de tiempo sin acciones peligrosas."
    }
  ],
  "providerScenarios": [
    {
      "id": "printer",
      "label": "Impresora compatible",
      "number": "01",
      "title": "Puede bastar un perfil, si la compatibilidad ya está probada.",
      "description": "Supuesto didáctico: el modelo, el driver y el formato de documento ya fueron homologados para el adaptador instalado. Se cambia el destino en un perfil versionado, sin modificar las reglas de venta.",
      "capability": [
        "Soportado",
        "Supuesto: combinación ya homologada."
      ],
      "enabled": [
        "Habilitado",
        "El perfil de ese puesto lo activa."
      ],
      "available": [
        "Disponible ahora",
        "El agente comprueba conexión y estado."
      ],
      "steps": [
        "Elegir el perfil y el dispositivo.",
        "Probar driver, formato y documento.",
        "Aplicar el perfil a trabajos nuevos."
      ],
      "boundary": "Sin papel o con resultado incierto, recuperar el trabajo. Reimprimir conserva el documento; no crea otra venta ni otro cobro.",
      "components": [
        "capabilities",
        "printadapter",
        "deviceagent"
      ]
    },
    {
      "id": "terminal",
      "label": "Terminal nuevo",
      "number": "02",
      "title": "Un modelo nuevo puede necesitar adaptador y homologación.",
      "description": "Ejemplo hipotético: se incorpora otro modelo de terminal Transbank en Chile. Compartir proveedor no demuestra que el protocolo, el SDK y las operaciones soportadas sean equivalentes.",
      "capability": [
        "Soportado",
        "Por demostrar con el SDK y hardware."
      ],
      "enabled": [
        "Habilitado",
        "No, hasta validar y autorizar la combinación."
      ],
      "available": [
        "Disponible ahora",
        "Estar conectado no demuestra compatibilidad."
      ],
      "steps": [
        "Revisar contrato, SDK y capacidades.",
        "Probar las operaciones disponibles y los límites de recuperación.",
        "Homologar y activar por anillos."
      ],
      "boundary": "El núcleo conserva su contrato. El adaptador puede ejecutarse en el agente local o en un proceso .NET separado si el SDK lo requiere.",
      "components": [
        "ports",
        "paymentadapter",
        "deviceagent"
      ]
    },
    {
      "id": "timeout",
      "label": "Timeout y cambio de perfil",
      "number": "03",
      "title": "La operación pendiente conserva su proveedor original.",
      "description": "El proveedor A pudo aplicar el cobro aunque se perdiera la respuesta. Activar un perfil B para operaciones nuevas independientes no cambia el intento pendiente ni autoriza a cobrarlo otra vez.",
      "capability": [
        "Soportado",
        "Consulta de resultado: verificar si el proveedor la admite."
      ],
      "enabled": [
        "Habilitado",
        "El nuevo perfil rige operaciones nuevas independientes."
      ],
      "available": [
        "Disponible ahora",
        "Un timeout deja el resultado desconocido."
      ],
      "steps": [
        "Conservar identidad y binding de la operación y sus intentos.",
        "Consultar a A solo si ofrece una consulta fiable.",
        "Si no puede resolverse, mantener incertidumbre y resolución operativa controlada."
      ],
      "boundary": "Consultas y reversas de un cobro anterior conservan proveedor, comercio y referencias originales. También una emisión fiscal incierta necesita recuperación propia; otro proveedor no resuelve su resultado.",
      "components": [
        "capabilities",
        "paymentadapter",
        "fiscaladapter"
      ]
    }
  ],
  "countries": {
    "CL": {
      "name": "Chile",
      "erp": "Dynamics AX on-premise",
      "detail": "31 entradas de tiendas en el directorio público al 01-10-2026; no acredita cajas ni despliegues POS. Es el país con presentación y código de POS analizados. Los commits desplegados y la topología real aún deben confirmarse."
    },
    "PE": {
      "name": "Perú",
      "erp": "ERP custom",
      "detail": "12 entradas de tiendas en el directorio público al 01-10-2026; no acredita cajas ni despliegues POS. ERP custom informado por el usuario. Faltan contratos, flujos operativos y capacidades fiscales y de pago por operación."
    },
    "ES": {
      "name": "España",
      "erp": "Gira",
      "detail": "3 entradas de tiendas en el directorio público al 01-10-2026; no acredita cajas ni despliegues POS. Gira confirmado por el usuario. Faltan versión, interfaces e integración actual con el POS."
    }
  },
  "questions": [
    {
      "prompt": "La venta ya está guardada en la base de la sucursal. ¿Qué podemos afirmar?",
      "options": [
        {
          "text": "Que la operación está persistida localmente.",
          "correct": true,
          "feedback": "Exacto. El estado del DTE, del pago y del registro ERP debe consultarse por separado."
        },
        {
          "text": "Que AX ya la registró y el DTE fue aprobado.",
          "correct": false,
          "feedback": "Son etapas distintas. En el código revisado, la venta se guarda antes de invocar el DTE; AX se integra después."
        },
        {
          "text": "Que ya no hace falta sincronizarla.",
          "correct": false,
          "feedback": "Guardar localmente protege la operación, pero todavía hay que completar la integración y conciliar sus resultados."
        }
      ]
    },
    {
      "prompt": "Se perdió el acuse y la tienda reenvía el mismo evento. ¿Qué debería ocurrir?",
      "options": [
        {
          "text": "Crear otra venta para no perder información.",
          "correct": false,
          "feedback": "Crearía un duplicado. El reenvío debe conservar la identidad del evento original."
        },
        {
          "text": "Reconocer su identidad y no repetir el efecto ya aplicado.",
          "correct": true,
          "feedback": "Exacto. La inbox y la idempotencia durable permiten recibir reentregas sin duplicar la venta."
        },
        {
          "text": "Borrar todos los pendientes de la tienda.",
          "correct": false,
          "feedback": "Un acuse corresponde a una operación y una etapa concretas; no autoriza a descartar otras operaciones."
        }
      ]
    },
    {
      "prompt": "¿Qué aporta cambiar el navegador por una aplicación con Tauri?",
      "options": [
        {
          "text": "Garantiza pagos y emisión fiscal sin Internet.",
          "correct": false,
          "feedback": "Esas capacidades dependen de proveedores, regulación y políticas autorizadas, no del contenedor de la interfaz."
        },
        {
          "text": "Elimina la necesidad de una base local.",
          "correct": false,
          "feedback": "Una interfaz instalada también necesita persistencia, reglas y recuperación para operar de forma autónoma."
        },
        {
          "text": "Una opción de empaquetado e integración con el dispositivo.",
          "correct": true,
          "feedback": "Exacto. Es un candidato útil que debe probarse con periféricos y actualizaciones. Offline se diseña en todo el flujo."
        }
      ]
    },
    {
      "prompt": "Cargar un cliente por RUT refresca su ficha. ¿Reemplaza la sincronización masiva?",
      "options": [
        {
          "text": "Sí, porque todas las sucursales reciben ese cambio automáticamente.",
          "correct": false,
          "feedback": "El código observado actualiza la copia local consultada; no demuestra distribución automática a todas las cajas."
        },
        {
          "text": "No: refresco bajo demanda y lotes resuelven necesidades complementarias.",
          "correct": true,
          "feedback": "Exacto. El primero obtiene ese cliente; los lotes distribuyen cambios. Deben acordarse versiones, autoridad y conflictos."
        },
        {
          "text": "Sí, porque consultar el RUT modifica necesariamente el cliente en AX.",
          "correct": false,
          "feedback": "La ruta observada consulta datos remotos y guarda una copia local. No prueba una escritura del cliente en AX."
        }
      ]
    }
  ],
  "comparisons": [
    {
      "topic": "Horarios y mantenimiento",
      "before": "El equipo informa L–V 07:00–22:00 y sábado 07:00–16:00; el snapshot no aplica esa regla a todas las rutas.",
      "after": "Política por flujo: recepción durable, maestros, ERP y mantenimiento. Drenar trabajos antes de intervenir la base.",
      "caveat": "Domingos, festivos, TZ y artefacto desplegado por confirmar. Abrir recepción fuera de ventana sería una decisión nueva."
    },
    {
      "topic": "WSO2 y colas",
      "before": "WSO2/Synapse, Andes y adaptadores combinan mediación, transporte y acceso a sistemas.",
      "after": "Dominio propio, ACL y workers; transporte central elegido por carga y capacidad operativa.",
      "caveat": "RabbitMQ es broker; BullMQ coordina jobs con backend explícito. Ninguno sustituye por sí solo los mediadores, reglas y contratos de WSO2."
    },
    {
      "topic": "Motores de datos",
      "before": "PostgreSQL local/central, SQL ligado a AX/MPOS y Mongo con NC y otros consumidores.",
      "after": "PostgreSQL para capacidades POS nuevas; consolidar o retirar legado solo después de migrar sus responsabilidades.",
      "caveat": "Preservar reserva/consumo/liberación de NC, históricos, custodia y recuperación. Una proyección de lectura no sustituye autoridad monetaria."
    },
    {
      "topic": "Base local",
      "before": "La sucursal ya guarda ventas y pagos en PostgreSQL.",
      "after": "Conservar esa ventaja y guardar operación + outbox en un mismo commit.",
      "caveat": "Ubicar el escritor por sucursal o por caja depende de si debemos tolerar pérdida de LAN."
    },
    {
      "topic": "Precios y ofertas",
      "before": "El camino activo depende de precios y promociones remotos; un error de precio bloquea pago.",
      "after": "Evaluar localmente paquetes de reglas y datos versionados.",
      "caveat": "Requiere paridad de resultados, vigencias y permisos; crear ofertas en tienda es otra capacidad."
    },
    {
      "topic": "Estados de integración",
      "before": "Preparado para enviar no equivale a confirmado en AX.",
      "after": "Distinguir persistencia local, recepción central, fiscalidad, ERP y liquidación del pago.",
      "caveat": "Un acuse confirma solo su etapa. Hay que mapear las marcas históricas durante la transición."
    },
    {
      "topic": "Cliente por RUT",
      "before": "El refresco remoto complementa los lotes, pero un fallo puede limpiar la venta en el flujo principal.",
      "after": "Preservar la venta y mostrar ficha local disponible junto a su frescura y permisos.",
      "caveat": "Tener una copia de un cupo de crédito no concede autorización offline."
    },
    {
      "topic": "Migración de ERP",
      "before": "Integraciones actuales conocen modelos y particularidades de AX.",
      "after": "Contratos del POS, fachadas y ACL por ERP para contener esos cambios.",
      "caveat": "La migración sigue necesitando mapeos, pruebas, corte controlado y conciliación."
    },
    {
      "topic": "Plataforma corporativa",
      "before": "core ya usa Nx, NestJS/Fastify, Pino, Sentry y workers.",
      "after": "Reutilizar convenciones y componentes seleccionados con versiones y responsables.",
      "caveat": "Las dependencias cloud y garantías existentes no acreditan una caja offline; el stack POS sigue siendo candidato."
    }
  ],
  "reuse": [
    {
      "name": "core",
      "use": "Convenciones Nx, módulos, contratos, observabilidad y ejemplos transaccionales concretos.",
      "limit": "Tiene dependencias centrales y precios remotos. Idempotencia, orden y efectos externos deben verificarse para uso financiero offline.",
      "status": "Código revisado; adopción selectiva propuesta"
    },
    {
      "name": "devops-platform",
      "use": "Acciones reutilizables para construir, verificar y desplegar servicios centrales.",
      "limit": "Corregir y verificar las brechas encontradas. Actualizar cajas Windows, firmar y recuperar una instalación exige un flujo específico.",
      "status": "Código y consumo revisados; no homologado para tiendas"
    },
    {
      "name": "integration-presentations",
      "use": "Vocabulario corporativo, intención arquitectónica y material formativo.",
      "limit": "Una lámina no demuestra una garantía. Sus ejemplos y promesas deben contrastarse con contratos, implementación y pruebas.",
      "status": "Documentación de referencia"
    }
  ],
  "sourceIndex": [
    {
      "label": "Recorridos actuales entre aplicaciones, bases y tablas",
      "url": "../docs/recorridos-datos-tablas.md"
    },
    {
      "label": "Catálogo de componentes y endpoints actuales",
      "url": "../docs/catalogo-integraciones-actuales.md"
    },
    {
      "label": "Despliegue, secuencias, actividad y estados",
      "url": "../docs/vistas-arquitectura-y-flujos.md"
    },
    {
      "label": "RFID, conteos y autoservicio: evolución futura",
      "url": "../docs/evolucion-rfid-autoservicio.md"
    },
    {
      "label": "Servicios de IA: casos, límites y pilotos",
      "url": "../docs/servicios-ia-pos.md"
    },
    {
      "label": "Proveedores, facturación y periféricos extensibles",
      "url": "../docs/extensibilidad-proveedores-dispositivos.md"
    },
    {
      "label": "Revisión corporativa en tres rondas",
      "url": "../docs/revision-arquitectura-corporativa.md"
    },
    {
      "label": "WSO2, RabbitMQ, BullMQ y alternativas",
      "url": "../docs/investigacion-mensajeria-pos.md"
    },
    {
      "label": "Horarios, datos y 28 casos límite",
      "url": "../docs/revision-resiliencia-datos-pos.md"
    },
    {
      "label": "Tiendas públicas: 31 Chile, 12 Perú, 3 España",
      "url": "../docs/cobertura-publica-sucursales.md"
    },
    {
      "label": "Propuesta de arquitectura",
      "url": "../docs/propuesta-arquitectura.md"
    },
    {
      "label": "Presentación original: antecedentes",
      "url": "../docs/antecedentes-presentacion-chile.md"
    },
    {
      "label": "Apuntes contrastados con el código",
      "url": "../docs/contraste-apuntes-operacion-chile.md"
    },
    {
      "label": "Índice de ocho repositorios analizados",
      "url": "../docs/analisis-repositorios/README.md"
    },
    {
      "label": "Aportes de la plataforma corporativa",
      "url": "../docs/analisis-repositorios/aportes-plataforma-corporativa.md"
    },
    {
      "label": "Tecnologías candidatas",
      "url": "../docs/opciones-tecnologicas.md"
    },
    {
      "label": "Información pendiente para el equipo",
      "url": "../docs/solicitud-informacion-equipo.md"
    },
    {
      "label": "Validación y decisiones",
      "url": "../docs/validacion-y-decisiones.md"
    }
  ]
};

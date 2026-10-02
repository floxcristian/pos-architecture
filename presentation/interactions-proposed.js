/* Proposed interaction contracts only. Illustrative schemas and semantic commands are not implemented APIs or DDL. */
window.POS_INTERACTIONS_PROPOSED = [
  {
    "id": "proposed-sale",
    "title": "Venta local: intención, efectos y commit",
    "mode": "proposed",
    "summary": "Contrato propuesto para la sucursal con LAN operativa: el monolito modular valida, conserva intenciones y confirma negocio + outbox en PostgreSQL. Pago, fiscalidad y recepción central mantienen estados distintos.",
    "boundary": "Perfil WAN preferente: un escritor de negocio por sucursal. No se promete cobrar o emitir offline con cualquier proveedor. Los pasos representan fronteras didácticas; el orden fiscal definitivo depende del régimen y del contrato homologado.",
    "groups": [
      {
        "id": "sale-terminal",
        "title": "Caja · interfaz",
        "repo": "Repositorio de implementación por definir",
        "runtime": "Angular; Tauri como alternativa por validar",
        "zone": "terminal",
        "evidence": "Propuesto: ubicación lógica del cliente, sin host ni versión de producción confirmados."
      },
      {
        "id": "sale-branch",
        "title": "Sucursal · monolito modular",
        "repo": "Repositorio de implementación por definir",
        "runtime": "NestJS/Fastify como candidatos; fachadas y módulos internos",
        "zone": "branch",
        "evidence": "Propuesto: servicio por LAN y único escritor de negocio. Los módulos no implican microservicios."
      },
      {
        "id": "sale-pg",
        "title": "Sucursal · PostgreSQL",
        "repo": "Repositorio de implementación por definir",
        "runtime": "PostgreSQL; schemas ilustrativos, sin DDL aprobado",
        "zone": "branch",
        "evidence": "Propuesto: una base transaccional local. Los nombres de tablas no corresponden a una migración existente."
      },
      {
        "id": "sale-agent",
        "title": "Caja · agente de periféricos",
        "repo": "Repositorio de implementación por definir",
        "runtime": "Proceso local; SDK .NET separado cuando lo exija el dispositivo",
        "zone": "terminal",
        "evidence": "Propuesto: custodia de comandos y observaciones; no es otro escritor de ventas."
      },
      {
        "id": "sale-external",
        "title": "Proveedores habilitados",
        "repo": "Repositorio de implementación por definir",
        "runtime": "Adquirente y facturador según país, perfil y homologación",
        "zone": "external",
        "evidence": "Propuesto: capacidades condicionadas. Transporte y soporte offline por confirmar para cada proveedor."
      }
    ],
    "nodes": [
      {
        "id": "sale-ui",
        "group": "sale-terminal",
        "title": "Interfaz de caja",
        "kind": "component",
        "subtitle": "Comando de negocio con identidad estable",
        "detail": "Solicita la operación al servicio de sucursal. Conserva y muestra la identidad y el estado devuelto; un timeout no autoriza a crear otro cobro. Navegador o Tauri no sustituyen al escritor transaccional.",
        "sources": [
          {
            "label": "Propuesta · perfil WAN preferente",
            "url": "../docs/propuesta-arquitectura.md#arquitectura-de-referencia-perfil-wan-preferente"
          },
          {
            "label": "Propuesta · confirmación local de una venta",
            "url": "../docs/propuesta-arquitectura.md#confirmación-local-de-una-venta"
          }
        ]
      },
      {
        "id": "sale-usecase",
        "group": "sale-branch",
        "title": "Fachada de venta",
        "kind": "component",
        "subtitle": "Caso de uso · unidad de trabajo",
        "detail": "Coordina módulos de venta, pago, caja, fiscalidad e integración. Cada módulo controla sus datos; la unidad de trabajo reúne las escrituras que deben confirmarse juntas. No expone objetos de AX ni SDK de dispositivos a la interfaz.",
        "sources": [
          {
            "label": "Candidata · monolito modular y unidades de ejecución",
            "url": "../docs/opciones-tecnologicas.md#6-monolito-modular-y-unidades-de-ejecución"
          },
          {
            "label": "Propuesta · confirmación local de una venta",
            "url": "../docs/propuesta-arquitectura.md#confirmación-local-de-una-venta"
          }
        ]
      },
      {
        "id": "sale-policy",
        "group": "sale-branch",
        "title": "Reglas y capacidades",
        "kind": "component",
        "subtitle": "Precios, ofertas, permisos y vigencias",
        "detail": "Calcula con datos locales autorizados y versionados. Comprueba medios de pago, recursos fiscales, reloj, espacio y perfil instalado. Capacidad soportada, autorización y disponibilidad son condiciones diferentes. La caja no adquiere autoridad sobre stock por operar offline.",
        "sources": [
          {
            "label": "Propuesta · capacidades efectivas",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#4-configuración-tipada-y-capacidades-efectivas"
          },
          {
            "label": "Propuesta · perfil WAN preferente",
            "url": "../docs/propuesta-arquitectura.md#arquitectura-de-referencia-perfil-wan-preferente"
          }
        ]
      },
      {
        "id": "sale-ports",
        "group": "sale-branch",
        "title": "Puertos y adaptadores",
        "kind": "component",
        "subtitle": "Pago y fiscalidad · contratos propios",
        "detail": "Selecciona una capacidad habilitada a partir del binding ya persistido. Traduce operaciones y resultados; no fabrica consulta, idempotencia ni operación offline cuando el proveedor no las tiene. La coordinación fiscal puede cambiar de orden según el régimen.",
        "sources": [
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          },
          {
            "label": "Propuesta · cambios de proveedor y reintentos",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#6-cambios-de-proveedor-reintentos-y-reimpresión"
          }
        ]
      },
      {
        "id": "sale-intent",
        "group": "sale-pg",
        "title": "Intenciones y destino",
        "kind": "table",
        "subtitle": "Propuesto · payments.operations / fiscal.operations / integration.bindings",
        "detail": "Ejemplos de nombres pendientes de ADR/DDL. Guarda operación lógica, intentos, command_id, request_hash, proveedor/comercio o emisor, perfil y versiones de adaptador/contrato antes del efecto externo. Recibe observaciones correlacionadas; incertidumbre no equivale a rechazo.",
        "sources": [
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          },
          {
            "label": "Propuesta · convenciones y vocabulario",
            "url": "../docs/propuesta-arquitectura.md#convenciones-y-vocabulario"
          }
        ]
      },
      {
        "id": "sale-ledger",
        "group": "sale-pg",
        "title": "Venta, pago y caja",
        "kind": "table",
        "subtitle": "Propuesto · sales.* / payments.* / cash.*",
        "detail": "Ejemplos: sales.sales, sales.lines, sales.taxes, payments.allocations y cash.movements; además se actualiza el estado de payments.operations y los registros fiscales simultáneos que exija el régimen. El commit final incluye estos cambios y la outbox. No todos los medios de pago producen el mismo movimiento de caja.",
        "sources": [
          {
            "label": "Propuesta · confirmación local de una venta",
            "url": "../docs/propuesta-arquitectura.md#confirmación-local-de-una-venta"
          },
          {
            "label": "Propuesta · convenciones y vocabulario",
            "url": "../docs/propuesta-arquitectura.md#convenciones-y-vocabulario"
          }
        ]
      },
      {
        "id": "sale-outbox",
        "group": "sale-pg",
        "title": "Eventos de salida",
        "kind": "table",
        "subtitle": "Propuesto · integration.outbox",
        "detail": "Se inserta en la misma transacción que la venta final. Conserva event_id, versión de contrato, ámbito e identidad del agregado. El publicador trabaja después del commit; el evento no desaparece porque haya una respuesta HTTP incierta.",
        "sources": [
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          },
          {
            "label": "Propuesta · convenciones y vocabulario",
            "url": "../docs/propuesta-arquitectura.md#convenciones-y-vocabulario"
          }
        ]
      },
      {
        "id": "sale-device",
        "group": "sale-agent",
        "title": "Agente y journal",
        "kind": "component",
        "subtitle": "Comando durable · resultado observado",
        "detail": "Valida identidad y ámbito, deduplica command_id + hash y conserva la recepción antes de acusarla. Registra observaciones para reenviarlas tras cortes de LAN. Su ACK no demuestra que se cobró; no puede aceptar nuevas ventas si perdió al escritor de sucursal.",
        "sources": [
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          },
          {
            "label": "Propuesta · ubicación de componentes",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#3-ubicación-de-componentes-y-perfil-offline"
          }
        ]
      },
      {
        "id": "sale-payment",
        "group": "sale-external",
        "title": "Medio de pago externo",
        "kind": "external",
        "subtitle": "Solo cuando la operación lo requiere",
        "detail": "Ejemplo de rama de pago con dispositivo/proveedor habilitado. Un pago en efectivo no recorre esta rama. Autorización, aceptación offline y liquidación son estados diferentes. Sin capacidad de consulta, la respuesta perdida exige resolución controlada.",
        "sources": [
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          },
          {
            "label": "Propuesta · cambios de proveedor y reintentos",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#6-cambios-de-proveedor-reintentos-y-reimpresión"
          }
        ]
      },
      {
        "id": "sale-fiscal",
        "group": "sale-external",
        "title": "Emisión fiscal externa",
        "kind": "external",
        "subtitle": "Solo si el régimen y perfil la requieren",
        "detail": "La disponibilidad o contingencia fiscal autorizada condiciona la operación y el documento entregable. Esta rama no acredita permisos de emisión offline en Chile, Perú o España; tampoco exige un proveedor remoto en todos los casos.",
        "sources": [
          {
            "label": "Propuesta · confirmación local de una venta",
            "url": "../docs/propuesta-arquitectura.md#confirmación-local-de-una-venta"
          },
          {
            "label": "Propuesta · capacidades efectivas",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#4-configuración-tipada-y-capacidades-efectivas"
          }
        ]
      }
    ],
    "edges": [
      {
        "id": "sale-command",
        "from": "sale-ui",
        "to": "sale-usecase",
        "label": "SOLICITA venta",
        "protocol": "HTTP",
        "detail": "Comando semántico de preparación/confirmación con identidad estable por LAN autenticada. Ruta HTTP y payload definitivo pendientes.",
        "effect": "Inicia o recupera el mismo caso de uso; aún no confirma una venta.",
        "boundary": "Una petición repetida no debe duplicar el efecto de negocio.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · perfil WAN preferente",
            "url": "../docs/propuesta-arquitectura.md#arquitectura-de-referencia-perfil-wan-preferente"
          },
          {
            "label": "Propuesta · confirmación local de una venta",
            "url": "../docs/propuesta-arquitectura.md#confirmación-local-de-una-venta"
          }
        ]
      },
      {
        "id": "sale-validate",
        "from": "sale-usecase",
        "to": "sale-policy",
        "label": "VALIDA capacidad",
        "protocol": "Interno",
        "detail": "Evalúa reglas comerciales, precios/ofertas locales, permisos, vigencias y recursos requeridos por esta operación.",
        "effect": "Permitir, restringir o rechazar con motivo explicable.",
        "boundary": "Sin WAN solo continúan las capacidades autorizadas y disponibles; no hay segundo escritor en la caja.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · capacidades efectivas",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#4-configuración-tipada-y-capacidades-efectivas"
          },
          {
            "label": "Propuesta · perfil WAN preferente",
            "url": "../docs/propuesta-arquitectura.md#arquitectura-de-referencia-perfil-wan-preferente"
          }
        ]
      },
      {
        "id": "sale-prepare",
        "from": "sale-usecase",
        "to": "sale-intent",
        "label": "ESCRIBE intención + binding",
        "protocol": "SQL",
        "detail": "Transacción previa al primer efecto: persiste identidad lógica, intento, hash, destino y versiones.",
        "effect": "Intención recuperable si la comunicación o el proceso se interrumpen.",
        "boundary": "El commit de intención no es venta final ni pago aprobado.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · confirmación local de una venta",
            "url": "../docs/propuesta-arquitectura.md#confirmación-local-de-una-venta"
          },
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          }
        ]
      },
      {
        "id": "sale-dispatch",
        "from": "sale-usecase",
        "to": "sale-ports",
        "label": "COORDINA efecto habilitado",
        "protocol": "Interno",
        "detail": "Entrega la operación tipada y su binding persistido al puerto apropiado. La fachada conserva la coordinación del caso.",
        "effect": "Selecciona adaptador compatible con esa operación y sus referencias.",
        "boundary": "Cambiar el perfil solo cambia operaciones futuras independientes.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · cambios de proveedor y reintentos",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#6-cambios-de-proveedor-reintentos-y-reimpresión"
          },
          {
            "label": "Candidata · monolito modular y unidades de ejecución",
            "url": "../docs/opciones-tecnologicas.md#6-monolito-modular-y-unidades-de-ejecución"
          }
        ]
      },
      {
        "id": "sale-agent-command",
        "from": "sale-ports",
        "to": "sale-device",
        "label": "ENTREGA comando durable",
        "protocol": "HTTP",
        "detail": "Contrato autenticado sucursal–agente cuando existe dispositivo local; ruta y transporte TLS definitivos pendientes. El agente devuelve recepción durable y luego observaciones.",
        "effect": "Custodia técnica del comando antes de invocar SDK/dispositivo.",
        "boundary": "Recibido por el agente no significa cobrado; su journal no reemplaza la transacción de sucursal.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          }
        ]
      },
      {
        "id": "sale-charge",
        "from": "sale-device",
        "to": "sale-payment",
        "label": "EJECUTA pago permitido",
        "protocol": "Por confirmar",
        "detail": "Llamada al SDK/dispositivo/proveedor de acuerdo con capacidades homologadas y binding original.",
        "effect": "Puede producir un efecto monetario externo a PostgreSQL.",
        "boundary": "No existe commit atómico entre base, agente y proveedor. Un timeout conserva resultado desconocido.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          },
          {
            "label": "Propuesta · cambios de proveedor y reintentos",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#6-cambios-de-proveedor-reintentos-y-reimpresión"
          }
        ]
      },
      {
        "id": "sale-payment-result",
        "from": "sale-payment",
        "to": "sale-device",
        "label": "DEVUELVE evidencia de pago",
        "protocol": "Por confirmar",
        "detail": "Resultado específico del proveedor o evidencia obtenida por consulta soportada. Si no existe evidencia, el estado sigue incierto.",
        "effect": "El journal guarda la observación y referencias externas cuando las tenga.",
        "boundary": "No confundir autorización o aceptación offline con liquidación.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          }
        ]
      },
      {
        "id": "sale-agent-observation",
        "from": "sale-device",
        "to": "sale-ports",
        "label": "REPORTA observación",
        "protocol": "HTTP",
        "detail": "Contrato semántico de reporte/reconsulta de observaciones; ruta pendiente. Conserva operation_id, attempt_id, command_id y observation_id.",
        "effect": "Entrega una observación correlacionada al escritor.",
        "boundary": "La sucursal acusa la observación después de persistirla; la retención del agente cubre restauración y replay.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          }
        ]
      },
      {
        "id": "sale-fiscal-call",
        "from": "sale-ports",
        "to": "sale-fiscal",
        "label": "SOLICITA emisión permitida",
        "protocol": "Por confirmar",
        "detail": "Contrato fiscal tipado cuando hay efecto externo; se invoca solo con recursos, autorización y binding válidos. Su ubicación temporal depende del régimen.",
        "effect": "Solicita el documento fiscal de esa operación.",
        "boundary": "No se presume emisión offline, consulta disponible ni transacción distribuida.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · confirmación local de una venta",
            "url": "../docs/propuesta-arquitectura.md#confirmación-local-de-una-venta"
          },
          {
            "label": "Propuesta · capacidades efectivas",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#4-configuración-tipada-y-capacidades-efectivas"
          },
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          }
        ]
      },
      {
        "id": "sale-fiscal-result",
        "from": "sale-fiscal",
        "to": "sale-ports",
        "label": "DEVUELVE estado fiscal",
        "protocol": "Por confirmar",
        "detail": "Conserva referencia, emisión/recepción/resolución aplicables y evidencia. Si se pierde el resultado, consulta solo cuando esté soportada.",
        "effect": "Actualiza la evidencia necesaria para decidir el siguiente paso permitido.",
        "boundary": "Una respuesta fiscal incierta no se transforma en emisión nueva con otro proveedor.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          },
          {
            "label": "Propuesta · cambios de proveedor y reintentos",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#6-cambios-de-proveedor-reintentos-y-reimpresión"
          }
        ]
      },
      {
        "id": "sale-observe",
        "from": "sale-ports",
        "to": "sale-intent",
        "label": "ESCRIBE observaciones",
        "protocol": "SQL",
        "detail": "El módulo propietario persiste las observaciones de pago/fiscalidad vinculadas a operación e intento antes del ACK de observación.",
        "effect": "Permite continuar, recuperar o derivar a conciliación.",
        "boundary": "Si hubo pago pero falla esta escritura, recuperar intención + journal/consulta; nunca repetir el cargo a ciegas.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          },
          {
            "label": "Propuesta · confirmación local de una venta",
            "url": "../docs/propuesta-arquitectura.md#confirmación-local-de-una-venta"
          }
        ]
      },
      {
        "id": "sale-business-commit",
        "from": "sale-usecase",
        "to": "sale-ledger",
        "label": "ESCRIBE negocio · TX final",
        "protocol": "SQL",
        "detail": "Una unidad de trabajo persiste venta final, líneas, impuestos, referencias de pago y movimientos aplicables. Incluye registros fiscales simultáneos exigidos.",
        "effect": "Estado local de negocio confirmado solo al completar el commit.",
        "boundary": "Comparte una única transacción con sale-outbox-commit. Si falla cualquiera, ninguna escritura final queda confirmada.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · confirmación local de una venta",
            "url": "../docs/propuesta-arquitectura.md#confirmación-local-de-una-venta"
          },
          {
            "label": "Candidata · monolito modular y unidades de ejecución",
            "url": "../docs/opciones-tecnologicas.md#6-monolito-modular-y-unidades-de-ejecución"
          }
        ]
      },
      {
        "id": "sale-outbox-commit",
        "from": "sale-usecase",
        "to": "sale-outbox",
        "label": "ESCRIBE outbox · MISMA TX",
        "protocol": "SQL",
        "detail": "Inserta el evento durable en el mismo commit de sale-business-commit; no se publica al centro dentro de la transacción.",
        "effect": "Publicación futura recuperable a partir del negocio confirmado.",
        "boundary": "No hay ventana entre commit de venta y creación de su evento; esto debe probarse.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          }
        ]
      },
      {
        "id": "sale-confirm",
        "from": "sale-usecase",
        "to": "sale-ui",
        "label": "CONFIRMA estado local",
        "protocol": "HTTP",
        "detail": "Devuelve resultado de la misma operación tras commit local y controles fiscales aplicables; ruta HTTP pendiente.",
        "effect": "El operador recibe estado local y documento permitido. La entrega central queda separada.",
        "boundary": "Confirmado local no significa liquidado, aceptado fiscalmente ni registrado en ERP. Reimpresión no crea otra venta.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · confirmación local de una venta",
            "url": "../docs/propuesta-arquitectura.md#confirmación-local-de-una-venta"
          },
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          }
        ]
      }
    ],
    "steps": [
      {
        "title": "1 · Validar lo que esta caja puede hacer",
        "detail": "La UI solicita una operación identificable. El servicio de sucursal decide con datos locales vigentes y capacidades autorizadas si puede continuar.",
        "edges": [
          "sale-command",
          "sale-validate"
        ],
        "boundary": "La ausencia de WAN no concede permisos ni capacidades fiscales o bancarias."
      },
      {
        "title": "2 · Guardar antes de producir efectos",
        "detail": "Se confirma la intención y el binding antes de despachar. La fachada y los puertos son módulos internos: no necesitan otra red ni otro servicio.",
        "edges": [
          "sale-prepare",
          "sale-dispatch"
        ],
        "boundary": "Persistir una intención todavía no confirma venta ni pago."
      },
      {
        "title": "3 · Resolver el pago habilitado",
        "detail": "Esta rama ejemplifica un medio con agente/proveedor. El agente conserva el comando y su evidencia; efectivo u otros medios usan su contrato específico.",
        "edges": [
          "sale-agent-command",
          "sale-charge",
          "sale-payment-result",
          "sale-agent-observation"
        ],
        "boundary": "Ante timeout, consultar si existe esa capacidad; de otro modo conservar incertidumbre y resolver antes de volver a cobrar."
      },
      {
        "title": "4 · Cumplir la condición fiscal",
        "detail": "Si el régimen requiere una llamada externa, el adaptador conserva la identidad y el estado específico de emisión. El orden mostrado es didáctico y debe ajustarse a cada país/capacidad.",
        "edges": [
          "sale-fiscal-call",
          "sale-fiscal-result"
        ],
        "boundary": "No iniciar cobro si las condiciones fiscales conocidas lo impiden. Si aparece incertidumbre después, recuperar o compensar según política homologada."
      },
      {
        "title": "5 · Conservar evidencia y decidir",
        "detail": "El escritor guarda las observaciones y solo después acusa su custodia. Un resultado incierto mantiene la operación pendiente y puede impedir la confirmación.",
        "edges": [
          "sale-observe"
        ],
        "boundary": "Un efecto externo aprobado y una escritura local fallida requieren recuperación; no otro cobro."
      },
      {
        "title": "6 · Confirmar negocio y outbox juntos",
        "detail": "Los módulos coordinan una sola transacción local para venta, pago/caja y evento. La UI recibe el estado permitido después del commit; la entrega ERP sigue otro recorrido.",
        "edges": [
          "sale-business-commit",
          "sale-outbox-commit",
          "sale-confirm"
        ],
        "boundary": "Las dos flechas SQL forman el mismo commit; no son dos confirmaciones sucesivas. La llamada externa nunca forma parte de esa transacción."
      }
    ]
  },
  {
    "id": "proposed-erp",
    "title": "Del commit local al resultado del ERP",
    "mode": "proposed",
    "summary": "Contrato propuesto: outbox de sucursal → HTTPS por lotes → inbox y trabajo central en un commit → worker con ACL → resultado verificable o conciliación. El ACK central solo confirma custodia.",
    "boundary": "Registro operativo aislado por país/entidad y escritor local conservado. No se elige aquí un broker, un servidor físico ni una API ERP universal. Los nombres de tablas y rutas son diseño pendiente de implementación. Este recorrido termina en el resultado ERP central; el contrato de retorno o consulta desde sucursal no se representa aquí.",
    "groups": [
      {
        "id": "erp-branch",
        "title": "Sucursal · publicador",
        "repo": "Repositorio de implementación por definir",
        "runtime": "Worker local; ejecución desacoplada de la UI",
        "zone": "branch",
        "evidence": "Propuesto: lee la outbox del escritor de sucursal. No requiere instalar un broker por tienda."
      },
      {
        "id": "erp-branch-pg",
        "title": "Sucursal · PostgreSQL",
        "repo": "Repositorio de implementación por definir",
        "runtime": "Datos confirmados y custodia de entrega",
        "zone": "branch",
        "evidence": "Propuesto: tablas ilustrativas de integración; retención coordinada con restore/replay."
      },
      {
        "id": "erp-ingress",
        "title": "País/entidad · recepción",
        "repo": "Repositorio de implementación por definir",
        "runtime": "API HTTPS autenticada; framework candidato",
        "zone": "central",
        "evidence": "Propuesto: límite lógico por país/entidad, sin servidores productivos identificados."
      },
      {
        "id": "erp-central-pg",
        "title": "País/entidad · registro operativo",
        "repo": "Repositorio de implementación por definir",
        "runtime": "PostgreSQL; inbox, trabajo y estados",
        "zone": "central",
        "evidence": "Propuesto: aislamiento y topología física por decidir; no es una copia indiscriminada de AX."
      },
      {
        "id": "erp-worker",
        "title": "País/entidad · integración",
        "repo": "Repositorio de implementación por definir",
        "runtime": "Workers + fachada/puerto ERP + ACL por destino",
        "zone": "central",
        "evidence": "Propuesto: módulos o unidades separadas según capacidad/aislamiento medidos."
      },
      {
        "id": "erp-target",
        "title": "ERP de destino",
        "repo": "Repositorio de implementación por definir",
        "runtime": "AX on-premise / Gira / custom / futuro ERP, según corte",
        "zone": "external",
        "evidence": "Propuesto: binding persistido por operación; contratos concretos y capacidades por verificar."
      }
    ],
    "nodes": [
      {
        "id": "erp-relay",
        "group": "erp-branch",
        "title": "Publicador local",
        "kind": "component",
        "subtitle": "Lotes, checkpoints y reintentos acotados",
        "detail": "Reclama pendientes después del commit; respeta admisión, mantenimiento y límites del flujo. Reenvía con la misma identidad y hash ante pérdida de ACK, con backoff/jitter y sin bloquear la caja por esperar al ERP.",
        "sources": [
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          },
          {
            "label": "Propuesta · tiempo, calendarios y reintentos",
            "url": "../docs/revision-resiliencia-datos-pos.md#4-tiempo-calendarios-y-reintentos"
          },
          {
            "label": "Propuesta · horarios y mantenimiento por flujo",
            "url": "../docs/revision-arquitectura-corporativa.md#8-horarios-y-mantenimiento-como-política-de-capacidad"
          }
        ]
      },
      {
        "id": "erp-outbox",
        "group": "erp-branch-pg",
        "title": "Outbox de sucursal",
        "kind": "table",
        "subtitle": "Propuesto · integration.outbox",
        "detail": "Evento creado junto con negocio local. Conserva identidad, versión, ámbito, agregado y correlación. El ID de evento no es el ID de venta, de pago, fiscal ni del asiento ERP.",
        "sources": [
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          },
          {
            "label": "Propuesta · convenciones y vocabulario",
            "url": "../docs/propuesta-arquitectura.md#convenciones-y-vocabulario"
          }
        ]
      },
      {
        "id": "erp-delivery",
        "group": "erp-branch-pg",
        "title": "Acuses y retención",
        "kind": "table",
        "subtitle": "Propuesto · integration.delivery_receipts",
        "detail": "Ejemplo de registro de custodia central por evento. El ACK no autoriza a eliminar de inmediato el origen: se conserva el horizonte necesario para replay/restore y reconstrucción según RPO acordado.",
        "sources": [
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          },
          {
            "label": "Propuesta · durabilidad y recuperación",
            "url": "../docs/revision-resiliencia-datos-pos.md#durabilidad-y-recuperación-no-son-la-misma-garantía"
          },
          {
            "label": "Propuesta · convenciones y vocabulario",
            "url": "../docs/propuesta-arquitectura.md#convenciones-y-vocabulario"
          }
        ]
      },
      {
        "id": "erp-api",
        "group": "erp-ingress",
        "title": "Ingreso autenticado",
        "kind": "component",
        "subtitle": "Recibir eventos · ruta HTTP pendiente",
        "detail": "Verifica identidad/ámbito, versión de contrato, event_id y hash. El mismo ID con contenido distinto se rechaza y alerta. Devuelve acuses por evento solo después del commit o de comprobar una recepción equivalente ya confirmada.",
        "sources": [
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          }
        ]
      },
      {
        "id": "erp-inbox",
        "group": "erp-central-pg",
        "title": "Inbox",
        "kind": "table",
        "subtitle": "Propuesto · integration.inbox",
        "detail": "Ejemplo de deduplicación durable con identidad autenticada y hash. Se confirma en la misma transacción que el efecto operativo y el trabajo. Deduplicar aquí evita repetir ese efecto local; no demuestra idempotencia en el ERP.",
        "sources": [
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          },
          {
            "label": "Propuesta · registro operativo central",
            "url": "../docs/revision-arquitectura-corporativa.md#5-una-base-intermedia-sí-puede-ser-útil-una-copia-indiscriminada-del-erp-no"
          }
        ]
      },
      {
        "id": "erp-work",
        "group": "erp-central-pg",
        "title": "Registro y trabajo durable",
        "kind": "table",
        "subtitle": "Propuesto · integration.operations / integration.work_items",
        "detail": "Registra el efecto operativo y la tarea de integración junto con la inbox. Si se requieren eventos posteriores, salen por una outbox en ese mismo commit. No se necesita un broker para este recorrido base; puede añadirse si se justifica.",
        "sources": [
          {
            "label": "Propuesta · registro operativo central",
            "url": "../docs/revision-arquitectura-corporativa.md#5-una-base-intermedia-sí-puede-ser-útil-una-copia-indiscriminada-del-erp-no"
          },
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          }
        ]
      },
      {
        "id": "erp-state",
        "group": "erp-central-pg",
        "title": "Binding, intentos y resultado ERP",
        "kind": "table",
        "subtitle": "Propuesto · integration.erp_operations",
        "detail": "Ejemplo de custodia de destino, fase de autoridad, mapping_version, referencia externa, intentos, próximo intento y evidencia de estado ERP. Recepción central, fiscalidad y liquidación del pago se conservan como dimensiones independientes.",
        "sources": [
          {
            "label": "Propuesta · conservar la inversión al cambiar ERP",
            "url": "../docs/revision-arquitectura-corporativa.md#7-cómo-conservar-la-inversión-al-cambiar-el-erp"
          },
          {
            "label": "Propuesta · convenciones y vocabulario",
            "url": "../docs/propuesta-arquitectura.md#convenciones-y-vocabulario"
          },
          {
            "label": "Propuesta · tiempo, calendarios y reintentos",
            "url": "../docs/revision-resiliencia-datos-pos.md#4-tiempo-calendarios-y-reintentos"
          }
        ]
      },
      {
        "id": "erp-runner",
        "group": "erp-worker",
        "title": "Worker de integración",
        "kind": "component",
        "subtitle": "Admisión, claim y coordinación",
        "detail": "Reclama trabajo con exclusión y recuperación probadas, respeta ventanas y capacidad del destino. Persiste binding/intento antes de producir el efecto. Expirar un lease no demuestra que terminó una llamada ni habilita otro envío ciego.",
        "sources": [
          {
            "label": "Propuesta · tiempo, calendarios y reintentos",
            "url": "../docs/revision-resiliencia-datos-pos.md#4-tiempo-calendarios-y-reintentos"
          },
          {
            "label": "Propuesta · horarios y mantenimiento por flujo",
            "url": "../docs/revision-arquitectura-corporativa.md#8-horarios-y-mantenimiento-como-política-de-capacidad"
          },
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          }
        ]
      },
      {
        "id": "erp-acl",
        "group": "erp-worker",
        "title": "Puerto ERP + ACL",
        "kind": "component",
        "subtitle": "Contrato POS → modelo del destino",
        "detail": "Traduce IDs, estados, errores y semántica al ERP seleccionado. Declara capacidades reales de unicidad/consulta/reversa. La misma operación mantiene ERP y versión de mapeo; el dominio no hereda tablas ni códigos AX.",
        "sources": [
          {
            "label": "Propuesta · conservar la inversión al cambiar ERP",
            "url": "../docs/revision-arquitectura-corporativa.md#7-cómo-conservar-la-inversión-al-cambiar-el-erp"
          }
        ]
      },
      {
        "id": "erp-system",
        "group": "erp-target",
        "title": "ERP vinculado a la operación",
        "kind": "external",
        "subtitle": "Destino y referencia originales",
        "detail": "Puede aceptar, rechazar o producir un efecto cuya respuesta se pierda. Una venta de AX no se manda al nuevo ERP solo porque cambió la configuración. Las ventas offline tardías se resuelven por política de corte, no por el reloj de caja solamente.",
        "sources": [
          {
            "label": "Propuesta · conservar la inversión al cambiar ERP",
            "url": "../docs/revision-arquitectura-corporativa.md#7-cómo-conservar-la-inversión-al-cambiar-el-erp"
          }
        ]
      }
    ],
    "edges": [
      {
        "id": "erp-read",
        "from": "erp-relay",
        "to": "erp-outbox",
        "label": "LEE pendientes confirmados",
        "protocol": "SQL",
        "detail": "El publicador reclama un lote acotado y recuperable, con checkpoint; la transacción de venta ya terminó.",
        "effect": "Selecciona eventos listos para entrega sin bloquear negocio por la WAN.",
        "boundary": "No consultar SQL remoto desde central a las cajas para este recorrido.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          },
          {
            "label": "Propuesta · registro operativo central",
            "url": "../docs/revision-arquitectura-corporativa.md#5-una-base-intermedia-sí-puede-ser-útil-una-copia-indiscriminada-del-erp-no"
          }
        ]
      },
      {
        "id": "erp-deliver",
        "from": "erp-relay",
        "to": "erp-api",
        "label": "ENTREGA evento/lote",
        "protocol": "HTTP",
        "detail": "HTTPS autenticado con identidad estable, versión, ámbito, hash y correlación. Ruta HTTP propuesta pendiente; acuses por evento.",
        "effect": "Solicita custodia central del evento.",
        "boundary": "Reentrega al menos una vez; conexión estable o respuesta HTTP no prueban commit por sí solas.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          }
        ]
      },
      {
        "id": "erp-save-inbox",
        "from": "erp-api",
        "to": "erp-inbox",
        "label": "ESCRIBE inbox · TX recepción",
        "protocol": "SQL",
        "detail": "Registra y verifica deduplicación dentro de la transacción central. Un duplicado equivalente conserva el resultado de recepción.",
        "effect": "Protege el efecto transaccional central contra duplicados.",
        "boundary": "Mismo event_id con otro hash es conflicto; no se acepta como duplicado correcto.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          }
        ]
      },
      {
        "id": "erp-save-work",
        "from": "erp-api",
        "to": "erp-work",
        "label": "ESCRIBE efecto + trabajo · MISMA TX",
        "protocol": "SQL",
        "detail": "Aplica registro operativo y trabajo durable en la misma transacción que erp-save-inbox; añade outbox si debe emitir eventos.",
        "effect": "Deja trabajo recuperable sin depender de una cola en memoria.",
        "boundary": "Si falla una escritura, no se confirma inbox aislada ni se envía ACK positivo.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          },
          {
            "label": "Propuesta · registro operativo central",
            "url": "../docs/revision-arquitectura-corporativa.md#5-una-base-intermedia-sí-puede-ser-útil-una-copia-indiscriminada-del-erp-no"
          }
        ]
      },
      {
        "id": "erp-ack",
        "from": "erp-api",
        "to": "erp-relay",
        "label": "ACUSA custodia durable",
        "protocol": "HTTP",
        "detail": "Respuesta por evento después del commit central o verificación de duplicado equivalente ya confirmado.",
        "effect": "Informa received_central, como estado semántico ilustrativo.",
        "boundary": "ACK ≠ ERP registrado, documento fiscal aceptado ni pago liquidado.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          }
        ]
      },
      {
        "id": "erp-save-receipt",
        "from": "erp-relay",
        "to": "erp-delivery",
        "label": "ESCRIBE acuse de entrega",
        "protocol": "SQL",
        "detail": "Persiste la recepción central observada y aplica la retención acordada; si se pierde el ACK, reenvía la misma identidad.",
        "effect": "Distingue pendiente de envío de pendiente de ERP.",
        "boundary": "Un restore central puede retroceder más allá del ACK: origen/archivo y conciliación deben permitir reconstruir o reconocer el RPO residual.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · durabilidad y recuperación",
            "url": "../docs/revision-resiliencia-datos-pos.md#durabilidad-y-recuperación-no-son-la-misma-garantía"
          },
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          }
        ]
      },
      {
        "id": "erp-claim",
        "from": "erp-runner",
        "to": "erp-work",
        "label": "LEE/RECLAMA trabajo habilitado",
        "protocol": "SQL",
        "detail": "Un único responsable de reintento reclama trabajo según ventana, capacidad y estado. Claim/lease no sustituyen a la evidencia del resultado externo.",
        "effect": "Selecciona trabajo que puede ejecutarse sin invadir mantenimiento.",
        "boundary": "Centro puede recibir y ERP estar cerrado solo si esa política se autorizó; los flujos no comparten un interruptor implícito.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · tiempo, calendarios y reintentos",
            "url": "../docs/revision-resiliencia-datos-pos.md#4-tiempo-calendarios-y-reintentos"
          },
          {
            "label": "Propuesta · horarios y mantenimiento por flujo",
            "url": "../docs/revision-arquitectura-corporativa.md#8-horarios-y-mantenimiento-como-política-de-capacidad"
          }
        ]
      },
      {
        "id": "erp-bind",
        "from": "erp-runner",
        "to": "erp-state",
        "label": "ESCRIBE binding + intento",
        "protocol": "SQL",
        "detail": "Antes de enviar: resuelve autoridad por entidad/fase, conserva destino ERP, referencia, contrato/mapeo e identidad del intento.",
        "effect": "Prepara una operación recuperable dirigida al ERP correcto.",
        "boundary": "Cambio global de ERP no cambia pendientes ni consultas históricas. Las operaciones tardías necesitan política explícita.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · conservar la inversión al cambiar ERP",
            "url": "../docs/revision-arquitectura-corporativa.md#7-cómo-conservar-la-inversión-al-cambiar-el-erp"
          },
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          }
        ]
      },
      {
        "id": "erp-contract",
        "from": "erp-runner",
        "to": "erp-acl",
        "label": "SOLICITA registrar operación",
        "protocol": "Interno",
        "detail": "Contrato semántico propio del POS; el adaptador recibe binding persistido, operación y referencias, no entidades ORM de AX.",
        "effect": "Traduce significado y capacidades sin contaminar el dominio.",
        "boundary": "Una fachada o ACL puede ser un módulo: no implica otro microservicio.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · conservar la inversión al cambiar ERP",
            "url": "../docs/revision-arquitectura-corporativa.md#7-cómo-conservar-la-inversión-al-cambiar-el-erp"
          },
          {
            "label": "Candidata · monolito modular y unidades de ejecución",
            "url": "../docs/opciones-tecnologicas.md#6-monolito-modular-y-unidades-de-ejecución"
          }
        ]
      },
      {
        "id": "erp-write",
        "from": "erp-acl",
        "to": "erp-system",
        "label": "ENVÍA efecto al ERP vinculado",
        "protocol": "Por confirmar",
        "detail": "Protocolo y endpoint dependen del adaptador homologado. Usa referencia estable y capacidad idempotente si existe; no se afirma que todos los ERPs la tengan.",
        "effect": "Puede registrar el efecto en el sistema externo.",
        "boundary": "La transacción de inbox no incluye al ERP. Un timeout no prueba ausencia del efecto.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · conservar la inversión al cambiar ERP",
            "url": "../docs/revision-arquitectura-corporativa.md#7-cómo-conservar-la-inversión-al-cambiar-el-erp"
          },
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          }
        ]
      },
      {
        "id": "erp-response",
        "from": "erp-system",
        "to": "erp-acl",
        "label": "DEVUELVE resultado/evidencia",
        "protocol": "Por confirmar",
        "detail": "La respuesta de registro o de una consulta soportada conserva referencias y evidencia; pérdida de respuesta mantiene incertidumbre.",
        "effect": "Permite interpretar aceptación, rechazo o resultado todavía desconocido.",
        "boundary": "No confundir transporte exitoso con asiento efectivamente confirmado por contrato.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · conservar la inversión al cambiar ERP",
            "url": "../docs/revision-arquitectura-corporativa.md#7-cómo-conservar-la-inversión-al-cambiar-el-erp"
          }
        ]
      },
      {
        "id": "erp-observe",
        "from": "erp-acl",
        "to": "erp-runner",
        "label": "NORMALIZA resultado",
        "protocol": "Interno",
        "detail": "Entrega un resultado tipado y próximos pasos permitidos. No convierte capacidad ausente ni timeout en un éxito/fallo fabricado.",
        "effect": "El coordinador decide confirmar, esperar, corregir o conciliar.",
        "boundary": "Sin prueba suficiente no repite el efecto con otra identidad o destino.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · conservar la inversión al cambiar ERP",
            "url": "../docs/revision-arquitectura-corporativa.md#7-cómo-conservar-la-inversión-al-cambiar-el-erp"
          },
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          }
        ]
      },
      {
        "id": "erp-save-state",
        "from": "erp-runner",
        "to": "erp-state",
        "label": "ESCRIBE estado + evidencia",
        "protocol": "SQL",
        "detail": "El módulo propietario persiste observaciones, referencias, error, próximo intento y necesidad de intervención. Publicar un resultado posterior exige outbox.",
        "effect": "Hace visible registrado, rechazado, pendiente o outcome_unknown según evidencia y contrato.",
        "boundary": "Guardar estado local de resultado no vuelve atómica la llamada ERP. Soporte necesita causas, responsable y recuperación trazable.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · conservar la inversión al cambiar ERP",
            "url": "../docs/revision-arquitectura-corporativa.md#7-cómo-conservar-la-inversión-al-cambiar-el-erp"
          },
          {
            "label": "Propuesta · tiempo, calendarios y reintentos",
            "url": "../docs/revision-resiliencia-datos-pos.md#4-tiempo-calendarios-y-reintentos"
          },
          {
            "label": "Propuesta · sincronización y consistencia",
            "url": "../docs/propuesta-arquitectura.md#sincronización-y-consistencia"
          }
        ]
      },
      {
        "id": "erp-query",
        "from": "erp-acl",
        "to": "erp-system",
        "label": "CONSULTA si está soportado",
        "protocol": "Por confirmar",
        "detail": "Solo ante una capacidad homologada, consulta por referencia original después de incertidumbre. Si no existe, mantiene pendiente y deriva a conciliación controlada.",
        "effect": "Recupera evidencia cuando el destino lo permite.",
        "boundary": "No reenvía a otro ERP tras timeout; un nuevo attempt_id no permite duplicar el efecto.",
        "certainty": "proposed",
        "sources": [
          {
            "label": "Propuesta · conservar la inversión al cambiar ERP",
            "url": "../docs/revision-arquitectura-corporativa.md#7-cómo-conservar-la-inversión-al-cambiar-el-erp"
          },
          {
            "label": "Propuesta · contratos y resultado durable",
            "url": "../docs/extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable"
          }
        ]
      }
    ],
    "steps": [
      {
        "title": "1 · Entregar lo ya confirmado",
        "detail": "La sucursal lee su outbox y envía eventos con identidad estable. Sin WAN mantiene pendientes y aplica sus límites locales.",
        "edges": [
          "erp-read",
          "erp-deliver"
        ],
        "boundary": "La venta no espera al asiento ERP para existir localmente; las restricciones fiscales/pago siguen su propio contrato."
      },
      {
        "title": "2 · Recibir sin perder ni duplicar el efecto local",
        "detail": "Central verifica el ámbito y confirma inbox + registro operativo + trabajo juntos. Las dos flechas SQL pertenecen a una sola transacción.",
        "edges": [
          "erp-save-inbox",
          "erp-save-work"
        ],
        "boundary": "Esta atomicidad termina en la base central; todavía no se ha registrado nada en el ERP."
      },
      {
        "title": "3 · Acusar custodia, conservar recuperación",
        "detail": "El ACK durable permite marcar entregado al centro. Su ausencia permite reentregar la misma identidad, sin borrar a ciegas el origen.",
        "edges": [
          "erp-ack",
          "erp-save-receipt"
        ],
        "boundary": "ACK central no significa ERP confirmado; retención y restauración forman parte de la garantía."
      },
      {
        "title": "4 · Elegir el destino y fijarlo",
        "detail": "El worker toma trabajo admitido y guarda el binding antes del efecto. El puerto/ACL traduce el contrato POS al destino y versión pertinentes.",
        "edges": [
          "erp-claim",
          "erp-bind",
          "erp-contract"
        ],
        "boundary": "País, entidad y fase de autoridad deciden el corte; un cambio global no redirige una operación pendiente."
      },
      {
        "title": "5 · Intentar una vez bajo su contrato",
        "detail": "El adaptador envía al ERP vinculado y devuelve la evidencia disponible al coordinador. Si la respuesta se pierde, no se inventa un rechazo.",
        "edges": [
          "erp-write",
          "erp-response",
          "erp-observe"
        ],
        "boundary": "La entrega puede repetirse; evitar doble efecto ERP depende de las capacidades del destino y de reconciliar incertidumbre."
      },
      {
        "title": "6 · Persistir evidencia o conciliar",
        "detail": "Se guarda el estado ERP y, cuando exista capacidad, se consulta por la referencia original. Esa consulta vuelve por el mismo camino de observación; sin ella interviene la operación controlada.",
        "edges": [
          "erp-save-state",
          "erp-query",
          "erp-response",
          "erp-observe"
        ],
        "boundary": "No existe un «sincronizado» universal: recibido, registrado, fiscal y pago pueden estar en estados diferentes. El resultado queda en central: su retorno o consulta por la sucursal requiere un contrato adicional; el ACK de custodia no lo sustituye."
      }
    ]
  }
];

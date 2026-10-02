/* Repository relationships and implementation details; static evidence. */
window.POS_REPOSITORIES = {
  "repositories": [
    {
      "id": "mountain-implementos",
      "name": "mountain-implementos",
      "role": "runtime",
      "summary": "Caja Angular, backend transaccional de sucursal y administración central del concentrador: tres aplicaciones en un mismo repositorio.",
      "units": [
        {
          "name": "frontend",
          "runtime": "Angular 8; caja y pantallas de administración",
          "zone": "Puesto de caja / interfaz"
        },
        {
          "name": "backend",
          "runtime": "Node.js / AdonisJS; PostgreSQL local",
          "zone": "Sucursal"
        },
        {
          "name": "backend-concentrador",
          "runtime": "Node.js / AdonisJS; consulta de integración y reintento",
          "zone": "Central lógico"
        }
      ],
      "sources": [
        {
          "label": "mountain-implementos/frontend/package.json:1-103",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/package.json#L1-L103"
        },
        {
          "label": "mountain-implementos/backend/package.json:1-63",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/package.json#L1-L63"
        },
        {
          "label": "mountain-implementos/backend-concentrador/package.json:1-40",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend-concentrador/package.json#L1-L40"
        }
      ],
      "boundary": "Snapshot master 711f97fd… de 2026. backend-concentrador NO es el repositorio mountain-concentrador: administra mensajes y reintentos, pero no contiene esos mediadores Java ni la API de lectura. Despliegue y permisos efectivos pendientes."
    },
    {
      "id": "mountain-sync-sucursal",
      "name": "mountain-sync-sucursal",
      "role": "runtime",
      "summary": "Sincronizador de sucursal: prepara subidas, recibe resultados, descarga maestros y llama al backend local.",
      "units": [
        {
          "name": "Runtime de sincronización",
          "runtime": "Node.js / AdonisJS; cron, HTTP, AMQP y PostgreSQL",
          "zone": "Sucursal"
        }
      ],
      "sources": [
        {
          "label": "mountain-sync-sucursal/package.json:1-46",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/package.json#L1-L46"
        },
        {
          "label": "mountain-sync-sucursal/app/Utils/Axios.js:9-61",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Utils/Axios.js#L9-L61"
        },
        {
          "label": "mountain-sync-sucursal/start/queueHooks.js:26-130",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/start/queueHooks.js#L26-L130"
        }
      ],
      "boundary": "Se usa el snapshot master 540ab9a7… de 2026; la rama predeterminada desarrollo no es esa referencia. Un cron, un ACK AMQP y un registro AX no son la misma confirmación. Topología y configuración productivas pendientes."
    },
    {
      "id": "mountain-concentrador",
      "name": "mountain-concentrador",
      "role": "runtime",
      "summary": "Código de integración central ahora localizado: WSO2/Synapse, mediadores Java, API de lectura y procesador Node de cola.",
      "units": [
        {
          "name": "ESBImplementos y artefactos CAR/DSS/task",
          "runtime": "WSO2/Synapse; APIs, secuencias y recursos XML",
          "zone": "Central lógico"
        },
        {
          "name": "ClassRegistraMensajeDetalle",
          "runtime": "Java; mediador de mensajes y preparación de cambios",
          "zone": "Central lógico"
        },
        {
          "name": "ClassProcesaCola",
          "runtime": "Java; mediador que lee/marca trabajo de cola",
          "zone": "Central lógico"
        },
        {
          "name": "api-lectura",
          "runtime": "Node.js / AdonisJS; HTTP y PostgreSQL",
          "zone": "Central lógico"
        },
        {
          "name": "procesador-cola-bus",
          "runtime": "Node.js / AdonisJS; consumidor AMQP → cola_mensajes",
          "zone": "Central lógico"
        }
      ],
      "sources": [
        {
          "label": "mountain-concentrador/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml:2-18",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml#L2-L18"
        },
        {
          "label": "mountain-concentrador/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java:45-104",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java#L45-L104"
        },
        {
          "label": "mountain-concentrador/ClassProcesaCola/src/main/java/cl/implementos/ProcesaCola.java:39-84",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassProcesaCola/src/main/java/cl/implementos/ProcesaCola.java#L39-L84"
        },
        {
          "label": "mountain-concentrador/api-lectura/start/routes.js:23-26",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/start/routes.js#L23-L26"
        },
        {
          "label": "mountain-concentrador/procesador-cola-bus/start/queueHooks.js:31-58",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/start/queueHooks.js#L31-L58"
        }
      ],
      "boundary": "Snapshot de la rama predeterminada Pablo, b2fd1ec2… (2023), distinto de master 03ab8598… y sin main. La presencia de variantes DESA/QA/PROD no prueba cuál se ejecuta. El broker es infraestructura externa; su cliente o una referencia JMS no prueban su despliegue.",
      "diagramUnits": [
        "Integración WSO2",
        "api-lectura",
        "procesador-cola-bus"
      ]
    },
    {
      "id": "api-impresion-caja",
      "name": "api-impresion-caja",
      "role": "runtime",
      "summary": "Puente local Windows para impresión y lector de cheques, invocado por el frontend de caja.",
      "units": [
        {
          "name": "WindowsServiceImpresora + Biblioteca",
          "runtime": "C# / .NET Framework 4.7.2; Web API SelfHost y periféricos",
          "zone": "PC Windows"
        },
        {
          "name": "AplicacionWeb",
          "runtime": "Fachada MVC alternativa incluida; instalación por confirmar",
          "zone": "Ubicación efectiva pendiente"
        }
      ],
      "sources": [
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/ServiceImpresora.cs:30-60",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/ServiceImpresora.cs#L30-L60"
        },
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/WindowsServiceImpresora.csproj:8-11",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/WindowsServiceImpresora.csproj#L8-L11"
        },
        {
          "label": "api-impresion-caja/AplicacionWeb/Controllers/HomeController.cs:13-51",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/AplicacionWeb/Controllers/HomeController.cs#L13-L51"
        }
      ],
      "boundary": "Snapshot main 2e74b2d6… de 2026. HTTP loopback y servicio Windows están en código; modelos, drivers, instalación y versión reales pendientes. Imprimir no emite fiscalmente ni autoriza Transbank.",
      "diagramUnits": [
        "Agente Windows de impresión",
        "Aplicación web de impresión"
      ]
    },
    {
      "id": "api-pagos-caja",
      "name": "api-pagos-caja",
      "role": "runtime",
      "summary": "Consultas corporativas de pagos/documentos y estados de notas de crédito; accede a PostgreSQL de sucursales y MongoDB.",
      "units": [
        {
          "name": "API de consulta y NC",
          "runtime": "Node.js / Express; pg y Mongoose",
          "zone": "Central lógico"
        }
      ],
      "sources": [
        {
          "label": "api-pagos-caja/routes/pagos.js:1-16",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L1-L16"
        },
        {
          "label": "api-pagos-caja/services/pagosService.js:78-140",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L78-L140"
        },
        {
          "label": "api-pagos-caja/models/estadoNC.model.js:4-28",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/models/estadoNC.model.js#L4-L28"
        }
      ],
      "boundary": "Snapshot main 33cd625f… de 2026. No es el agente Transbank ni procesa toda autorización bancaria. El puerto 3386 del diagrama difiere del valor predeterminado 3366 del código; host, instancia y binding vigentes no verificados."
    },
    {
      "id": "apis-implementos",
      "name": "apis-implementos",
      "role": "runtime",
      "summary": "Solución .NET corporativa: nueve APIs y tres bibliotecas, con adaptación AX, precios, documentos y lecturas de datos.",
      "units": [
        {
          "name": "apiMountainPosCaja / ApiCliente / otras APIs",
          "runtime": "ASP.NET Web API / .NET Framework 4.5",
          "zone": "Central lógico; despliegue por proyecto pendiente"
        },
        {
          "name": "ApiPrecios",
          "runtime": "C# y consultas/reglas sobre MongoDB",
          "zone": "Servicio remoto; binding de caja pendiente"
        },
        {
          "name": "ApiCarro",
          "runtime": "C#; WCF/SQL y consulta de PostgreSQL concentrador",
          "zone": "Central lógico"
        },
        {
          "name": "ServiciosAX / DatosAXSql / Modelos",
          "runtime": "Bibliotecas C#; WCF, ADO.NET y contratos",
          "zone": "Dentro de consumidores; no servidores por sí solas"
        }
      ],
      "sources": [
        {
          "label": "apis-implementos/ApisImplementos.sln:6-29",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApisImplementos.sln#L6-L29"
        },
        {
          "label": "apis-implementos/apiMountainPosCaja/Controllers/CajaController.cs:23-77",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/apiMountainPosCaja/Controllers/CajaController.cs#L23-L77"
        },
        {
          "label": "apis-implementos/ApiCarro/Controllers/CarroController.cs:338-355",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApiCarro/Controllers/CarroController.cs#L338-L355"
        },
        {
          "label": "apis-implementos/ApiPrecios/Controllers/PreciosController.cs:17-190",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApiPrecios/Controllers/PreciosController.cs#L17-L190"
        }
      ],
      "boundary": "Snapshot master 8fbe2f1b… de 2026. Un proyecto web no equivale a un servidor o API instalada. ApiCarro y el valor URL_API_CARRO de Mountain no se equiparan solo por nombre. X++ y procedimientos servidor AX siguen fuera de esta evidencia."
    },
    {
      "id": "core",
      "name": "core",
      "role": "platform",
      "summary": "Precedente corporativo de monorepo Nx, NestJS/Fastify, módulos, workers, seguridad, contratos y observabilidad.",
      "units": [
        {
          "name": "core-api / librerías de dominio e integración",
          "runtime": "NestJS + Fastify / TypeScript; módulos en Nx",
          "zone": "Plataforma corporativa, no caja actual identificada"
        },
        {
          "name": "admin y workers, incluido sync-worker",
          "runtime": "Angular y procesos Node separados",
          "zone": "Plataforma corporativa"
        }
      ],
      "sources": [
        {
          "label": "core/apps/core-api/src/bootstrap/factories/nest-application.factory.ts:25-38",
          "url": "https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/apps/core-api/src/bootstrap/factories/nest-application.factory.ts#L25-L38"
        },
        {
          "label": "core/apps/sync-worker/src/erp-adapters/erp-adapters.module.ts:150-199",
          "url": "https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/apps/sync-worker/src/erp-adapters/erp-adapters.module.ts#L150-L199"
        },
        {
          "label": "core/eslint.config.mjs:151-215",
          "url": "https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/eslint.config.mjs#L151-L215"
        },
        {
          "label": "Inventario y alcance auditado de core",
          "url": "../docs/analisis-repositorios/core.md"
        }
      ],
      "boundary": "Snapshot main f43688ab… de 2026. Contiene aplicaciones ejecutables, pero no se acreditó que forme parte de esta cadena POS actual. Su sync-worker no es mountain-sync-sucursal; su admin no es backend-concentrador. Reutilización para el nuevo POS pendiente de selección y pruebas."
    },
    {
      "id": "devops-platform",
      "name": "devops-platform",
      "role": "platform",
      "summary": "Acciones y automatización corporativa de CI/CD para servicios centrales; core ya referencia versiones concretas.",
      "units": [
        {
          "name": "GitHub Actions / librerías de entrega",
          "runtime": "YAML y Bash; build, validación y Cloud Run",
          "zone": "Plataforma de entrega, no proceso de caja"
        }
      ],
      "sources": [
        {
          "label": "devops-platform/.github/actions/deploy-cloud-run/action.yml:375-533",
          "url": "https://github.com/developer-implementos/devops-platform/blob/fd423a6f2f4955bd650ee6aebba154d93c0425b8/.github/actions/deploy-cloud-run/action.yml#L375-L533"
        },
        {
          "label": "core/.github/workflows/ci.yml:737-737",
          "url": "https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/.github/workflows/ci.yml#L737-L737"
        },
        {
          "label": "core/.github/workflows/deploy.yml:1684-1684",
          "url": "https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/.github/workflows/deploy.yml#L1684-L1684"
        }
      ],
      "boundary": "Referencia principal main fd423a6f… de 2026; core también usa pins distintos según workflow. No acredita un actualizador Windows/sucursal, distribución offline o rollback de esquema. No es un intermediario entre una venta y AX."
    }
  ],
  "connections": [
    {
      "id": "repo-print",
      "from": "mountain-implementos",
      "to": "api-impresion-caja",
      "label": "HTTP local · imprimir boletas, facturas y comprobantes",
      "detail": "Permite imprimir en papel boletas y facturas electrónicas, o comprobantes de pago y cobranza, según la operación. La interfaz prepara el contenido y lo envía a POST /Impresion/ImprimirDTE_Termica cuando se usa el canal apiImpresion. Esta llamada solicita la impresión; no emite un nuevo DTE. El código revisado no confirma qué impresora está instalada ni que el papel haya salido.",
      "certainty": "code",
      "sources": [
        {
          "label": "Tipos de documento: Boleta y Factura",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/database/seeds/TipoDocumentoSeeder.js#L95-L129"
        },
        {
          "label": "mountain-implementos/frontend/src/app/services/documentos.service.ts:1342-1411",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/documentos.service.ts#L1342-L1411"
        },
        {
          "label": "mountain-implementos/frontend/src/app/modules/cobranzas/components/cobranza-detalle-pago/cobranza-detalle-pago.component.ts:108-115",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/modules/cobranzas/components/cobranza-detalle-pago/cobranza-detalle-pago.component.ts#L108-L115"
        },
        {
          "label": "mountain-implementos/frontend/src/app/services/impresion.service.ts:107-145",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresion.service.ts#L107-L145"
        },
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/Controllers/ImpresionController.cs:49-71",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/Controllers/ImpresionController.cs#L49-L71"
        }
      ]
    },
    {
      "id": "repo-credit-http",
      "from": "mountain-implementos",
      "to": "api-pagos-caja",
      "label": "HTTP · consultar NC y su estado",
      "detail": "El backend Mountain consume contratos de consulta de NC compatibles con las rutas Express. Mantener como compatible: la configuración efectiva, sus alternativas/fallback y los snapshots desplegados no se comprobaron. Consulta por cliente y marcas estadoNC son ramas distintas.",
      "certainty": "compatible",
      "sources": [
        {
          "label": "mountain-implementos/backend/app/Controllers/Http/NotaDeCreditoAxController.js:447-500",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L447-L500"
        },
        {
          "label": "api-pagos-caja/routes/pagos.js:1-16",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L1-L16"
        }
      ]
    },
    {
      "id": "repo-credit-sql",
      "from": "api-pagos-caja",
      "to": "mountain-implementos",
      "label": "SQL · datos de sucursales",
      "detail": "La API consulta tablas de negocio de PostgreSQL de sucursal usando un directorio de conexiones. Es una dependencia del modelo de datos de caja: NO una petición HTTP al backend Mountain. La instancia real y todas sus sucursales siguen por confirmar.",
      "certainty": "compatible",
      "sources": [
        {
          "label": "api-pagos-caja/services/pagosService.js:78-140",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L78-L140"
        },
        {
          "label": "api-pagos-caja/services/pagosService.js:326-353",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L326-L353"
        },
        {
          "label": "D05 · consulta y consumo de notas de crédito",
          "url": "../docs/recorridos-datos-tablas.md"
        }
      ]
    },
    {
      "id": "repo-price",
      "from": "mountain-implementos",
      "to": "apis-implementos",
      "label": "HTTP · precio remoto candidato",
      "detail": "Mountain usa URL_API_PRECIOS con datos de producto/cliente/sucursal; ApiPrecios contiene una capacidad compatible. No está probado que ese proyecto sea el destino configurado de todas las cajas. URL_API_CARRO y refresco de clientes requieren bindings propios, no se asignan por similitud de nombre.",
      "certainty": "compatible",
      "sources": [
        {
          "label": "mountain-implementos/backend/app/Services/Precios/PreciosImplementosServices.js:12-56",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Precios/PreciosImplementosServices.js#L12-L56"
        },
        {
          "label": "apis-implementos/ApiPrecios/Controllers/PreciosController.cs:17-190",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApiPrecios/Controllers/PreciosController.cs#L17-L190"
        }
      ]
    },
    {
      "id": "repo-sync-local",
      "from": "mountain-sync-sucursal",
      "to": "mountain-implementos",
      "label": "HTTP local + modelo PostgreSQL",
      "detail": "El sincronizador construye un cliente HTTP del backend de sucursal y comparte el modelo de datos local. Son dos acoplamientos distintos; no todo pasa por HTTP. La base o el proceso concretos instalados requieren inventario de despliegue.",
      "certainty": "compatible",
      "sources": [
        {
          "label": "mountain-sync-sucursal/app/Utils/Axios.js:46-61",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Utils/Axios.js#L46-L61"
        },
        {
          "label": "Llamadas locales y persistencia compartida del sincronizador",
          "url": "../docs/analisis-repositorios/mountain-sync-sucursal.md"
        }
      ]
    },
    {
      "id": "repo-upload",
      "from": "mountain-sync-sucursal",
      "to": "mountain-concentrador",
      "label": "HTTP · mensajeEntradas/ingresar",
      "detail": "El consumidor 2026 construye POST /api/mensajeEntradas/ingresar; el artefacto Synapse 2023 expone ese contrato. Se comprobó compatibilidad estática, no que ese CAR/recurso sea el desplegado. La respuesta de recepción no acredita el registro final en AX.",
      "certainty": "compatible",
      "sources": [
        {
          "label": "mountain-sync-sucursal/app/Services/LlamadaApis/CambiosConcentradorService.js:289-318",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L289-L318"
        },
        {
          "label": "mountain-concentrador/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml:2-18",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml#L2-L18"
        }
      ]
    },
    {
      "id": "repo-masters",
      "from": "mountain-sync-sucursal",
      "to": "mountain-concentrador",
      "label": "HTTP · lotes y acuses de maestros",
      "detail": "api-lectura declara cambios/sin-procesar/recibido/procesados y el sincronizador consume esos contratos. Los datos viajan desde el centro en la respuesta. Las notificaciones AMQP usan un broker externo cuya configuración efectiva no queda determinada por esta flecha.",
      "certainty": "compatible",
      "sources": [
        {
          "label": "mountain-concentrador/api-lectura/start/routes.js:23-26",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/start/routes.js#L23-L26"
        },
        {
          "label": "mountain-concentrador/api-lectura/app/Services/MensajeSalidaService.js:47-90",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Services/MensajeSalidaService.js#L47-L90"
        },
        {
          "label": "mountain-sync-sucursal/app/Services/LlamadaApis/CambiosConcentradorService.js:154-287",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L154-L287"
        }
      ]
    },
    {
      "id": "repo-admin",
      "from": "mountain-implementos",
      "to": "mountain-concentrador",
      "label": "Administración · SQL y reintento HTTP",
      "detail": "backend-concentrador administra mensajes del modelo central y llama /api/reintentar/reintento-manual, contrato declarado en Synapse. No es el API de lectura ni el worker Node; compartir el término concentrador no los convierte en la misma aplicación.",
      "certainty": "compatible",
      "sources": [
        {
          "label": "mountain-implementos/backend-concentrador/app/Controllers/Http/ConcentradorController.js:126-155",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend-concentrador/app/Controllers/Http/ConcentradorController.js#L126-L155"
        },
        {
          "label": "mountain-concentrador/ESBImplementos/src/main/synapse-config/api/API_reintentar.xml:2-37",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_reintentar.xml#L2-L37"
        },
        {
          "label": "mountain-implementos/backend-concentrador/start/routes.js:19-51",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend-concentrador/start/routes.js#L19-L51"
        }
      ]
    },
    {
      "id": "repo-carro-sql",
      "from": "apis-implementos",
      "to": "mountain-concentrador",
      "label": "ApiCarro · lee PostgreSQL central",
      "detail": "ApiCarro lee mensaje_detalles, mensaje_detalle_sucursales, tipo_mensajes y entidades para recuperar UrlDte del contenido de un mensaje. Esta flecha representa dependencia SQL sobre el modelo central, NO una llamada REST a api-lectura ni otra vía de registro de ventas. Instancia/versión de datos vigentes pendientes.",
      "certainty": "compatible",
      "sources": [
        {
          "label": "apis-implementos/ApiCarro/Controllers/CarroController.cs:338-355",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApiCarro/Controllers/CarroController.cs#L338-L355"
        },
        {
          "label": "mountain-concentrador/api-lectura/app/Models/MensajeDetalleSucursal.js:1-35",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Models/MensajeDetalleSucursal.js#L1-L35"
        }
      ]
    },
    {
      "id": "repo-erp-adapter",
      "from": "mountain-concentrador",
      "to": "apis-implementos",
      "label": "WSO2 → .NET · registrar venta en AX",
      "detail": "SEQ_AX_Insert_ventas extrae el payload y llama al endpoint de ventas del registry. Un recurso QA versionado apunta al contrato creaFacturaOvFromPos y apiMountainPosCaja lo declara. Es compatibilidad estática entre artefactos 2023/2026: recurso activo, prefijo de aplicación, despliegue y resultado AX no verificados. La vuelta a sucursal usa otra secuencia, no el ACK inicial de subida.",
      "certainty": "compatible",
      "sources": [
        {
          "label": "WSO2: llamada al registry y secuencia de respuesta",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_AX_Insert_ventas.xml#L13-L32"
        },
        {
          "label": "Recurso QA: contrato de ventas y timeout, no binding productivo",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/QARegistryResource/EP_Ventas.xml#L3-L6"
        },
        {
          "label": "apiMountainPosCaja: receptor POST de factura/OV",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/apiMountainPosCaja/Controllers/CajaController.cs#L23-L26"
        }
      ]
    },
    {
      "id": "repo-core-ci",
      "from": "core",
      "to": "devops-platform",
      "label": "CI/CD · acciones con SHA fijado",
      "detail": "Los workflows de core referencian acciones de devops-platform. Esta es una dependencia de automatización comprobada en código, no tráfico del POS. CI usa fd423a6f… y el ejemplo de deploy fija otra versión; no asumir que todo consume el último main.",
      "certainty": "code",
      "sources": [
        {
          "label": "core/.github/workflows/ci.yml:737-737",
          "url": "https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/.github/workflows/ci.yml#L737-L737"
        },
        {
          "label": "core/.github/workflows/deploy.yml:1684-1684",
          "url": "https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/.github/workflows/deploy.yml#L1684-L1684"
        }
      ]
    }
  ]
};

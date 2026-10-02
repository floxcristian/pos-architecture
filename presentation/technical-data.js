/* Static source evidence; no corporate API calls. */
window.POS_TECHNICAL = {
  "schemaVersion": 1,
  "reviewedAt": "2026-10-02",
  "scopeNote": "Catálogo del POS chileno a partir de los repositorios revisados: aplicaciones, rutas de API, conexiones y pendientes específicos de cada pieza.",
  "groups": [
    {
      "id": "sale",
      "title": "Venta, precios y DTE",
      "summary": "Venta local, evaluación remota, emisión fiscal y registro AX son pasos diferentes."
    },
    {
      "id": "customer",
      "title": "Cliente por RUT",
      "summary": "Además de maestros por lotes, la carga individual refresca datos remotamente."
    },
    {
      "id": "masters",
      "title": "Maestros y sincronización",
      "summary": "Productor de lotes y API lectura en mountain-concentrador; AX→MPOS y despliegue pendientes."
    },
    {
      "id": "credit",
      "title": "Notas de crédito y consultas de pagos",
      "summary": "API Express con MongoDB y consultas directas a PostgreSQL de sucursales; no autoriza tarjetas."
    },
    {
      "id": "printing",
      "title": "Impresión y lector de cheques",
      "summary": "API Windows de loopback y efectos físicos; respuesta HTTP no acredita impresión."
    }
  ],
  "components": [
    {
      "id": "ui",
      "name": "Interfaz web de caja",
      "repo": "mountain-implementos/frontend",
      "runtime": "Angular / TypeScript",
      "location": "PC de caja · Windows",
      "zone": "terminal",
      "responsibility": "Interfaz POS; llama backend, impresión y SDK de pagos.",
      "confidence": "Aplicación web",
      "sources": [
        {
          "label": "mountain-implementos/frontend/package.json:1–103",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/package.json#L1-L103"
        },
        {
          "label": "mountain-implementos/frontend/src/app/services/punto-de-venta.service.ts:388–399",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/punto-de-venta.service.ts#L388-L399"
        },
        {
          "label": "Arquitectura actual de Chile",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "ui"
    },
    {
      "id": "backend",
      "name": "Servidor de sucursal · backend Mountain",
      "repo": "mountain-implementos/backend",
      "runtime": "Node.js / AdonisJS 4.1",
      "port": "3333 según diagrama y valor predeterminado del cliente del sync",
      "zone": "branch",
      "responsibility": "Venta, persistencia local, precios, clientes y coordinación fiscal.",
      "locationEvidence": "PPTX identifica servidor de sucursal; código separa backend y sync.",
      "confidence": "Código + antecedente; host/VM no comprobados",
      "pending": "Sistema operativo, supervisor, instancias y colocación de PostgreSQL.",
      "sources": [
        {
          "label": "mountain-implementos/backend/package.json:1–63",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/package.json#L1-L63"
        },
        {
          "label": "mountain-implementos/backend/start/routes.js:112–122",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L112-L122"
        },
        {
          "label": "mountain-sync-sucursal/app/Utils/Axios.js:46–61",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Utils/Axios.js#L46-L61"
        },
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "backend"
    },
    {
      "id": "localdb",
      "name": "PostgreSQL de sucursal",
      "repo": "Modelos Mountain y sincronizador",
      "runtime": "PostgreSQL; versión instalada pendiente",
      "port": "No publicado en el catálogo",
      "zone": "branch",
      "responsibility": "Datos de negocio y mensajes; backend/sync comparten el esquema observado.",
      "locationEvidence": "PPTX describe base por sucursal; pg/Lucid y transacciones presentes.",
      "confidence": "Motor y consumidores observados; instancia real pendiente",
      "pending": "DDL real, schema/search_path, permisos, backups y si comparte máquina con backend.",
      "sources": [
        {
          "label": "mountain-implementos/backend/app/Controllers/Http/PuntoDeVentaController.js:152–233",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L152-L233"
        },
        {
          "label": "mountain-sync-sucursal/app/Models/Mensaje.js:8–21",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/Mensaje.js#L8-L21"
        },
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "localdb"
    },
    {
      "id": "sync",
      "name": "Sincronizador de sucursal",
      "repo": "mountain-sync-sucursal",
      "runtime": "Node.js / AdonisJS 4.1; cron + AMQP",
      "port": "3344 según diagrama; despliegue por confirmar",
      "zone": "branch",
      "responsibility": "Prepara/sube ventas y pagos, descarga maestros y aplica respuestas AX.",
      "locationEvidence": "PPTX en servidor sucursal; llamadas a PostgreSQL y backend verificadas.",
      "confidence": "Código de master; producción no confirmada",
      "pending": "Resolver master/desarrollo, TZ, flags, cantidad de procesos y supervisión.",
      "sources": [
        {
          "label": "mountain-sync-sucursal/package.json:1–46",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/package.json#L1-L46"
        },
        {
          "label": "mountain-sync-sucursal/start/cronHooks.js:13–217",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/start/cronHooks.js#L13-L217"
        },
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "sync"
    },
    {
      "id": "print",
      "name": "Agente de impresión Windows",
      "repo": "api-impresion-caja",
      "runtime": "Servicio C# .NET Framework 4.7.2 / Web API SelfHost",
      "port": "HTTP localhost:8181 en código",
      "zone": "terminal",
      "responsibility": "Impresión GDI/RAW/Zebra y lector MICR; no emite fiscalmente ni autoriza tarjetas.",
      "locationEvidence": "Binding loopback y Windows Service; PPTX lo ubica en PC Windows.",
      "confidence": "Código de binding; instalación/binario pendiente",
      "pending": "Servicio vs proyecto MVC alternativo, identidad Windows, drivers, impresoras y origen permitido.",
      "sources": [
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/ServiceImpresora.cs:30–60",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/ServiceImpresora.cs#L30-L60"
        },
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/WindowsServiceImpresora.csproj:8–11",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/WindowsServiceImpresora.csproj#L8-L11"
        },
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "devices"
    },
    {
      "id": "transbank",
      "name": "Agente / terminal Transbank",
      "repo": "SDK consumidor en Mountain; agente no incluido",
      "runtime": "SDK web declarado; runtime del agente por confirmar",
      "port": "No confirmado",
      "zone": "terminal",
      "responsibility": "Acceso al terminal bancario; separado de api-pagos-caja.",
      "locationEvidence": "PPTX ubica agente y terminal en puesto; package.json incluye SDK.",
      "confidence": "Antecedente + dependencia; modelo y protocolo no auditados",
      "pending": "Repositorio/binario del agente, SDK instalado, modelo/firmware y operaciones homologadas.",
      "sources": [
        {
          "label": "mountain-implementos/frontend/package.json:68–76",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/package.json#L68-L76"
        },
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "devices"
    },
    {
      "id": "bus",
      "name": "mountain-concentrador · WSO2 / Synapse",
      "repo": "mountain-concentrador / ESBImplementos, DSConcentrador, ClassRegistraMensajeDetalle",
      "runtime": "WSO2 / Synapse / DSS / Java",
      "port": "HTTP/JSON según diagrama; listener real pendiente",
      "zone": "central",
      "responsibility": "Recibir sobres, persistir, transformar y despachar a .NET/AX; generar respuestas y reintentos.",
      "locationEvidence": "Código de APIs, secuencias, DSS, mediadores y CAR; zona central, hosts sin validar.",
      "confidence": "Código central revisado; bindings y artefactos instalados pendientes",
      "pending": "Export desplegado, hashes de CAR/JAR, elección Node o SamplingProcessor, funciones SQL y recuperación.",
      "sources": [
        {
          "label": "API de ingreso y consulta central",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml#L18-L246"
        },
        {
          "label": "Persistencia de sobres en PostgreSQL",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_MensajeEntrada.dbs#L1-L30"
        },
        {
          "label": "Auditoría de mountain-concentrador",
          "url": "../docs/analisis-repositorios/mountain-concentrador.md"
        }
      ],
      "currentId": "bus"
    },
    {
      "id": "broker",
      "name": "Broker AMQP/JMS · Andes",
      "repo": "Clientes/stores en mountain-concentrador y mountain-sync-sucursal; servidor no auditado",
      "runtime": "AMQP desde amqplib; producto/versionado servidor por validar",
      "port": "AMQP/JMS según diagrama; puerto real no publicado",
      "zone": "central",
      "responsibility": "Transporte de sobres, avisos y respuestas; separado de transformación y persistencia.",
      "locationEvidence": "PPTX indica broker central; consumidor AMQP presente.",
      "confidence": "Cliente verificado; broker productivo no comprobado",
      "pending": "Topología, persistencia, replicación, confirmaciones y política de retención.",
      "sources": [
        {
          "label": "Consumo AMQP y ACK central",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/start/queueHooks.js#L30-L60"
        },
        {
          "label": "Store JMS qlProcesaRegistro",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-stores/MS_ProcesaRegistro.xml#L1-L9"
        },
        {
          "label": "Auditoría de mountain-concentrador",
          "url": "../docs/analisis-repositorios/mountain-concentrador.md"
        }
      ],
      "currentId": "bus"
    },
    {
      "id": "readapi",
      "name": "mountain-concentrador · api-lectura",
      "repo": "mountain-concentrador / api-lectura",
      "runtime": "Node.js / AdonisJS 4.1 / Lucid / PostgreSQL",
      "port": "HTTP; rutas mensajeSalidas/*; prefijo de publicación por validar",
      "zone": "central",
      "responsibility": "Seleccionar lotes, marcar enviado/recibido/procesados y recuperar enviados no procesados.",
      "locationEvidence": "Receptor implementado y contrato compatible con sync; publicación efectiva pendiente.",
      "confidence": "Rutas y estados observados en código",
      "pending": "Binding desplegado, variante Node frente API Synapse, retención y deduplicación de acuses.",
      "sources": [
        {
          "label": "Rutas de API lectura",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/start/routes.js#L19-L26"
        },
        {
          "label": "MPOS, lotes y acuses: auditoría y fuentes",
          "url": "../docs/analisis-repositorios/mountain-concentrador-maestros.md"
        }
      ],
      "currentId": "readapi"
    },
    {
      "id": "bus-processor",
      "name": "mountain-concentrador · procesador-cola-bus",
      "repo": "mountain-concentrador / procesador-cola-bus",
      "runtime": "Node.js / AdonisJS 4.1 / amqplib / PostgreSQL",
      "port": "No confirmado",
      "zone": "central",
      "responsibility": "Consume XML del broker y crea cola_mensajes. Java ProcesaCola reclama después las filas; el cron Node limpia procesados.",
      "locationEvidence": "Código central revisado; diferente del sync de sucursal y de Java.",
      "confidence": "Código verificado; consumidor activo por confirmar",
      "pending": "ACK sin await INSERT; cola efectiva, search_path, despliegue y coexistencia con SamplingProcessor.",
      "sources": [
        {
          "label": "Consumo AMQP y ACK central",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/start/queueHooks.js#L30-L60"
        },
        {
          "label": "Claim y finalización de cola en Java",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassProcesaCola/src/main/java/cl/implementos/BO/BOColaMensaje.java#L18-L81"
        },
        {
          "label": "Auditoría de mountain-concentrador",
          "url": "../docs/analisis-repositorios/mountain-concentrador.md"
        }
      ],
      "currentId": "bus"
    },
    {
      "id": "central-admin",
      "name": "Administración del concentrador",
      "repo": "mountain-implementos/backend-concentrador",
      "runtime": "Node.js / AdonisJS 4.1",
      "port": "Puerto productivo no confirmado",
      "zone": "central",
      "responsibility": "Consulta de mensajes/errores y reintentos de integración.",
      "locationEvidence": "Código y presentación distinguen administración de API de lectura.",
      "confidence": "Código + ubicación lógica; servidor real pendiente",
      "pending": "Proceso, artefacto, permisos y separación de API de lectura.",
      "sources": [
        {
          "label": "mountain-implementos/backend-concentrador/package.json:1–40",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend-concentrador/package.json#L1-L40"
        },
        {
          "label": "mountain-implementos/backend-concentrador/start/routes.js:19–51",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend-concentrador/start/routes.js#L19-L51"
        },
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "platform"
    },
    {
      "id": "centraldb",
      "name": "PostgreSQL del concentrador",
      "repo": "mountain-concentrador, mountain-implementos/backend-concentrador y apis-implementos/ApiCarro",
      "runtime": "PostgreSQL; versión/instancia por confirmar",
      "port": "No publicado",
      "zone": "central",
      "responsibility": "Sobres, detalles por destino, lotes, cola y estados de integración; lectura administrativa y URL DTE.",
      "locationEvidence": "SQL en DSS, Java, modelos Node y ApiCarro. Instancia/schema efectivos por validar.",
      "confidence": "Usos observados; topología física pendiente",
      "pending": "Propiedad del esquema, DDL, retención y significado del segundo PG de caja dibujado en central.",
      "sources": [
        {
          "label": "Persistencia de sobres en PostgreSQL",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_MensajeEntrada.dbs#L1-L30"
        },
        {
          "label": "Claim y finalización de cola en Java",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassProcesaCola/src/main/java/cl/implementos/BO/BOColaMensaje.java#L18-L81"
        },
        {
          "label": "Auditoría de mountain-concentrador",
          "url": "../docs/analisis-repositorios/mountain-concentrador.md"
        }
      ],
      "currentId": "centraldb"
    },
    {
      "id": "axapi",
      "name": "APIs y bibliotecas de adaptación AX",
      "repo": "apis-implementos",
      "runtime": "ASP.NET Web API / C# .NET Framework 4.5; WCF y ADO.NET",
      "port": "HTTP API no confirmado; diagrama AOS WCF net.tcp:8201",
      "zone": "central",
      "responsibility": "Recibe factura/pago/cliente; llama servicios AX y SQL mediante bibliotecas.",
      "locationEvidence": "PPTX coloca adaptación AX en zona corporativa; también dibuja APIs .NET en integración sucursal.",
      "confidence": "Código presente; correspondencia proyecto→host pendiente",
      "pending": "IIS/servicio, bindings, artefactos y qué APIs están en sucursal o central.",
      "sources": [
        {
          "label": "apis-implementos/ApisImplementos.sln:6–29",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApisImplementos.sln#L6-L29"
        },
        {
          "label": "apis-implementos/apiMountainPosCaja/Controllers/CajaController.cs:23–77",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/apiMountainPosCaja/Controllers/CajaController.cs#L23-L77"
        },
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "axapi"
    },
    {
      "id": "branch-dotnet",
      "name": "APIs .NET de integración sucursal (etiqueta del diagrama)",
      "repo": "Asignación de proyectos pendiente",
      "runtime": "APIs .NET",
      "port": "HTTP/JSON; puerto no confirmado",
      "zone": "unknown",
      "responsibility": "Paso de integración mostrado entre backend y central.",
      "locationEvidence": "Solo etiqueta/posición del diagrama; no identifica ejecutable ni host.",
      "confidence": "Antecedente sin mapeo de código",
      "pending": "Distinguir de APIs corporativas y confirmar si se despliega realmente por sucursal.",
      "sources": [
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "axapi"
    },
    {
      "id": "datasaxsql",
      "name": "DatosAXSql / acceso SQL AX",
      "repo": "apis-implementos/DatosAXSql",
      "runtime": "Biblioteca C#; ADO.NET",
      "port": "No aplica como listener independiente",
      "zone": "central",
      "responsibility": "Consultas SQL encapsuladas; no es por sí misma otro servidor.",
      "locationEvidence": "Biblioteca en solución .NET; diagrama usa bloque DATOSAXSQL.",
      "confidence": "Código de biblioteca; ejecución depende de API que la carga",
      "pending": "Procedimientos, vistas, permisos y base SQL efectiva.",
      "sources": [
        {
          "label": "apis-implementos/DatosAXSql/ordenMountainPOSdb.cs:19–60",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/DatosAXSql/ordenMountainPOSdb.cs#L19-L60"
        },
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "axapi"
    },
    {
      "id": "sql-interchange",
      "name": "SQL Server AX / tablas de intercambio",
      "repo": "DDL y procesos servidor no incluidos",
      "runtime": "SQL Server",
      "port": "No publicado",
      "zone": "central",
      "responsibility": "Datos AX y tablas usadas por integración; límites por confirmar.",
      "locationEvidence": "Agrupaciones del diagrama; no se infiere una sola instancia.",
      "confidence": "Antecedente + consumidores SQL; infraestructura pendiente",
      "pending": "Separación AX/MPOS/intercambio, productores, jobs, DDL y retención.",
      "sources": [
        {
          "label": "apis-implementos/DatosAXSql/ordenMountainPOSdb.cs:19–60",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/DatosAXSql/ordenMountainPOSdb.cs#L19-L60"
        },
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "mpos"
    },
    {
      "id": "ax",
      "name": "Dynamics AX on-premise · AOS",
      "repo": "Implementación X++/AOS no incluida",
      "runtime": "Dynamics AX / WCF según fuente",
      "port": "net.tcp:8201 según diagrama, no verificado",
      "zone": "central",
      "responsibility": "Registro ERP posterior a venta/DTE según flujo informado.",
      "locationEvidence": "On-premise informado por usuario y PPTX; proxies consumidores en .NET.",
      "confidence": "Antecedente + clientes; configuración real pendiente",
      "pending": "Versión AX, contratos X++, AOS, procedimientos, idempotencia y consultas por referencia.",
      "sources": [
        {
          "label": "apis-implementos/ServiciosAX/mountainPosCajaServices/Pago.cs:20–132",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ServiciosAX/mountainPosCajaServices/Pago.cs#L20-L132"
        },
        {
          "label": "apis-implementos/ServiciosAX/mountainPosCajaServices/NotaVenta.cs:46–272",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ServiciosAX/mountainPosCajaServices/NotaVenta.cs#L46-L272"
        },
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "ax"
    },
    {
      "id": "pricing",
      "name": "Precio remoto / ApiPrecios candidata",
      "repo": "apis-implementos/ApiPrecios; caller Mountain",
      "runtime": "Receptor candidato ASP.NET Web API / .NET Framework con MongoDB; binding vigente pendiente",
      "port": "HTTP; endpoint efectivo de Mountain configurable",
      "zone": "central",
      "responsibility": "Calcula precios/reglas; ruta compatible con parámetros enviados por Mountain.",
      "locationEvidence": "Central/remota; no prueba máquina ni binding URL_API_PRECIOS.",
      "confidence": "Ambos contratos observados; unión efectiva pendiente",
      "pending": "URL/path productivo, Mongo/colecciones, moneda, reglas y paridad para evaluación local.",
      "sources": [
        {
          "label": "apis-implementos/ApiPrecios/Controllers/PreciosController.cs:17–190",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApiPrecios/Controllers/PreciosController.cs#L17-L190"
        },
        {
          "label": "mountain-implementos/backend/app/Services/Precios/PreciosImplementosServices.js:25–56",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Precios/PreciosImplementosServices.js#L25-L56"
        },
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "pricing"
    },
    {
      "id": "promotions",
      "name": "Servicio de promociones / carro configurado",
      "repo": "Caller Mountain; receptor concreto no localizado",
      "runtime": "HTTP/JSON; runtime servidor pendiente",
      "port": "Base URL_API_CARRO configurable",
      "zone": "unknown",
      "responsibility": "Promociones disponibles y líneas asociadas.",
      "locationEvidence": "Dependencia remota en código; no se vincula automáticamente a ApiCarro del repo .NET.",
      "confidence": "Llamada verificada; receptor y host pendientes",
      "pending": "Repositorio que expone promocionesDisponibles/promocionesLinea y reglas usadas.",
      "sources": [
        {
          "label": "mountain-implementos/backend/app/Services/Promociones/PromocionesImplementosServices.js:12–108",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Promociones/PromocionesImplementosServices.js#L12-L108"
        }
      ],
      "currentId": "pricing"
    },
    {
      "id": "clientapi",
      "name": "API de refresco de cliente por RUT",
      "repo": "Caller Mountain; receptor exacto no localizado",
      "runtime": "HTTP/JSON; runtime servidor pendiente",
      "port": "Base URL_API_CLIENTES + cliente",
      "zone": "unknown",
      "responsibility": "Devuelve ficha individual para guardar/refrescar en base local.",
      "locationEvidence": "Llamada en EmpresaService; no identifica despliegue/receptor inequívoco.",
      "confidence": "Llamada verificada; implementación receptora pendiente",
      "pending": "Contrato real, fuente AX/MPOS y si comparte despliegue con ApiCliente.",
      "sources": [
        {
          "label": "mountain-implementos/backend/app/Services/EmpresaService.js:30–88",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
        }
      ],
      "currentId": "axapi"
    },
    {
      "id": "payments",
      "name": "API consulta de pagos y estados de NC",
      "repo": "api-pagos-caja",
      "runtime": "Node.js / Express; pg y Mongoose",
      "port": "3386 en diagrama; 3366 predeterminado en código",
      "zone": "central",
      "responsibility": "Consulta PG de sucursales y escribe estados de NC en MongoDB; no es Transbank.",
      "locationEvidence": "Central; arranque configurable observado.",
      "confidence": "Código + ubicación lógica; puerto/binario reales pendientes",
      "pending": "Resolver discrepancia de puerto, proxy/red, índices y alcance de consultas.",
      "sources": [
        {
          "label": "api-pagos-caja/app.js:108–116",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/app.js#L108-L116"
        },
        {
          "label": "api-pagos-caja/routes/pagos.js:1–16",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L1-L16"
        },
        {
          "label": "api-pagos-caja/services/pagosService.js:4–109",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L4-L109"
        },
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": "payments"
    },
    {
      "id": "mongo",
      "name": "MongoDB · NC, directorio y otros usos",
      "repo": "api-pagos-caja; ApiPrecios y otros consumidores .NET",
      "runtime": "MongoDB/Mongoose y driver .NET",
      "port": "No publicado",
      "zone": "central",
      "responsibility": "estadoNC y directorio de sucursales/usuarios; colecciones de precios en otro contexto.",
      "locationEvidence": "Usos de código; agrupar el motor no demuestra misma instancia/base.",
      "confidence": "Modelos/consumidores verificados; topología pendiente",
      "pending": "Inventario de bases, colecciones, propiedad, índices y credenciales fuera de fuente.",
      "sources": [
        {
          "label": "api-pagos-caja/models/estadoNC.model.js:4–28",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/models/estadoNC.model.js#L4-L28"
        },
        {
          "label": "api-pagos-caja/models/cajaSucursales.model.js:4–26",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/models/cajaSucursales.model.js#L4-L26"
        },
        {
          "label": "apis-implementos/ApiPrecios/Controllers/PreciosController.cs:17–39",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApiPrecios/Controllers/PreciosController.cs#L17-L39"
        }
      ],
      "currentId": "mongo"
    },
    {
      "id": "carroapi",
      "name": "ApiCarro · consulta del concentrador",
      "repo": "apis-implementos/ApiCarro",
      "runtime": "ASP.NET Web API / C# .NET Framework 4.5",
      "port": "HTTP; puerto no confirmado",
      "zone": "central",
      "responsibility": "Entre otras capacidades, lee mensajes/JSON en PG concentrador para consultar documentos.",
      "locationEvidence": "Consulta verificada; ubicación corporativa lógica.",
      "confidence": "Código de consulta; consumidor concreto pendiente",
      "pending": "Quién usa concentrador, permisos y contrato que sustituya SQL/JSON interno.",
      "sources": [
        {
          "label": "apis-implementos/ApiCarro/Controllers/CarroController.cs:331–355",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApiCarro/Controllers/CarroController.cs#L331-L355"
        }
      ],
      "currentId": "axapi"
    },
    {
      "id": "mpos",
      "name": "MPOS · SQL Server de intercambio",
      "repo": "Lectores en mountain-concentrador / ClassRegistraMensajeDetalle",
      "runtime": "SQL Server / JDBC; dbName MPOS en BOAX",
      "port": "No confirmado",
      "zone": "unknown",
      "responsibility": "CustTableSync y otras tablas alimentan generación central de lotes; se invoca MPOS.dbo.sp_caja_custTable.",
      "locationEvidence": "Nombre de base, motor y lectores comprobados; productor AX→MPOS, host y job diario pendientes.",
      "confidence": "Lectores de MPOS observados; origen y despliegue sin confirmar",
      "pending": "Productor AX→MPOS, cuerpos SP, DDL, triggers, bajas, horario efectivo y servidor.",
      "sources": [
        {
          "label": "MPOS, lotes y acuses: auditoría y fuentes",
          "url": "../docs/analisis-repositorios/mountain-concentrador-maestros.md"
        }
      ],
      "currentId": "mpos"
    },
    {
      "id": "fiscal-acepta",
      "name": "Facturador Acepta configurado",
      "repo": "Caller Mountain; implementación proveedor no incluida",
      "runtime": "HTTP con XML codificado en formulario",
      "port": "URL configurable; puerto y despliegue no publicados",
      "zone": "external",
      "responsibility": "Recibe documento para publicar; separado de impresión y registro AX.",
      "locationEvidence": "Adaptador existe; servicio efectivo depende de configuración.",
      "confidence": "Llamada verificada; ubicación local/central/remota pendiente",
      "pending": "Ruta efectiva, artefacto/contrato, contingencia, consulta y política de reintento.",
      "sources": [
        {
          "label": "mountain-implementos/backend/app/Services/Facturacion/FacturacionAceptaService.js:672–724",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionAceptaService.js#L672-L724"
        }
      ],
      "currentId": "fiscal"
    },
    {
      "id": "fiscal-ingydev",
      "name": "Facturador Ingydev",
      "repo": "Caller Mountain; implementación proveedor no incluida",
      "runtime": "HTTP POST SOAP/XML",
      "port": "Ruta /WSFactElect/?wsdl en fuente; origen omitido",
      "zone": "external",
      "responsibility": "Emisión y consulta fiscal por servicio SOAP.",
      "locationEvidence": "Adaptador y ruta observados; ubicación y ambiente no acreditados.",
      "confidence": "Llamada verificada; despliegue/uso productivo pendientes",
      "pending": "Endpoint efectivo, ambiente, respuesta fiscal, contingencia y consulta.",
      "sources": [
        {
          "label": "mountain-implementos/backend/app/Services/Facturacion/FacturacionIngydevService.js:402–420",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionIngydevService.js#L402-L420"
        }
      ],
      "currentId": "fiscal"
    },
    {
      "id": "qliktail",
      "name": "QLIKTAIL (texto literal del diagrama)",
      "repo": "No localizado",
      "runtime": "No confirmado",
      "port": "No confirmado",
      "zone": "external",
      "responsibility": "Sistema externo dibujado; función y uso POS pendientes.",
      "locationEvidence": "Solo aparece como sistema externo en la imagen original.",
      "confidence": "Antecedente visual",
      "pending": "Confirmar nombre, propietario, responsabilidad, datos y contrato.",
      "sources": [
        {
          "label": "PPTX original: zonas, componentes y versiones declaradas (diap. 5–11)",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "currentId": ""
    },
    {
      "id": "integration-caller",
      "name": "Consumidor corporativo por identificar",
      "repo": "Por identificar",
      "runtime": "No confirmado",
      "port": "No aplica",
      "zone": "unknown",
      "responsibility": "Origen no comprobado de rutas declaradas en APIs corporativas.",
      "locationEvidence": "Placeholder explícito para no inventar una llamada efectiva.",
      "confidence": "Desconocido",
      "pending": "Identificar caller y ruta de bus que alcanza cada controlador.",
      "sources": [],
      "currentId": ""
    },
    {
      "id": "instacheck",
      "name": "Instacheck · fuera de uso según el equipo",
      "repo": "Contrato y despliegue no identificados",
      "runtime": "No confirmado",
      "port": "No confirmado",
      "zone": "external",
      "responsibility": "Integración histórica de cheques; el equipo confirmó que Instacheck ya no se utiliza. El estado de ORSAN es independiente.",
      "locationEvidence": "La presentación agrupa ORSAN / Instacheck; el apunte posterior confirma la retirada de Instacheck, sin determinar la vigencia de ORSAN.",
      "confidence": "Histórico; retirada de Instacheck informada por el equipo",
      "pending": "Confirmar únicamente la vigencia y el contrato residual de ORSAN, además de datos/históricos que deban conservarse.",
      "sources": [
        {
          "label": "Presentación original: sistemas externos",
          "url": "../docs/antecedentes-presentacion-chile.md"
        },
        {
          "label": "Contraste con apuntes operativos",
          "url": "../docs/contraste-apuntes-operacion-chile.md"
        }
      ],
      "currentId": "instacheck"
    }
  ],
  "endpoints": [
    {
      "id": "e-sale-save",
      "group": "sale",
      "from": "ui",
      "to": "backend",
      "method": "POST",
      "path": "/punto-de-venta",
      "evidenceType": "route",
      "purpose": "Guardar comprobante, documentos y pagos recibidos por el backend; el cargo en el terminal tiene otro recorrido.",
      "execution": "HTTP síncrono en LAN. La transacción local se confirma antes de solicitar facturación cuando corresponde.",
      "offline": "La persistencia es local a sucursal; precio, medios de pago y facturación pueden necesitar servicios remotos. No acredita venta completa offline.",
      "failure": "Un fallo fiscal después del commit no elimina la venta guardada. Reintentar toda la venta sin identidad estable puede repetir efectos; verificar estado original.",
      "repo": "mountain-implementos",
      "commit": "711f97fd7948c696bf45c992c5b121683bdbacd7",
      "sources": [
        {
          "label": "mountain-implementos/backend/start/routes.js:113–113",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L113-L113"
        },
        {
          "label": "mountain-implementos/frontend/src/app/services/punto-de-venta.service.ts:388–399",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/punto-de-venta.service.ts#L388-L399"
        },
        {
          "label": "mountain-implementos/backend/app/Controllers/Http/PuntoDeVentaController.js:152–253",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L152-L253"
        },
        {
          "label": "mountain-implementos/backend/app/Services/ComprobanteVentaService.js:209–287",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L209-L287"
        }
      ],
      "confidence": "Ruta y llamada observadas; despliegue y tráfico no verificados.",
      "pathKind": "literal"
    },
    {
      "id": "e-product-price",
      "group": "sale",
      "from": "ui",
      "to": "backend",
      "method": "GET",
      "path": "/Productos/:id",
      "evidenceType": "route",
      "purpose": "Obtener producto y calcular precio usando contexto de cliente, cantidad y sucursal.",
      "execution": "HTTP síncrono: el backend invoca cálculo de precio.",
      "offline": "Consultar el maestro local no vuelve local el cálculo; este recorrido depende de precio remoto.",
      "failure": "El fallo de precio se propaga; la UI revisada bloquea continuar al pago con error de precio. No usar precio anterior como garantía.",
      "repo": "mountain-implementos",
      "commit": "711f97fd7948c696bf45c992c5b121683bdbacd7",
      "sources": [
        {
          "label": "mountain-implementos/backend/start/routes.js:39–39",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L39-L39"
        },
        {
          "label": "mountain-implementos/frontend/src/app/services/productos.service.ts:14–28",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/productos.service.ts#L14-L28"
        },
        {
          "label": "mountain-implementos/backend/app/Controllers/Http/ProductoController.js:135–165",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/ProductoController.js#L135-L165"
        },
        {
          "label": "mountain-implementos/backend/app/Services/ProductosService.js:134–205",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ProductosService.js#L134-L205"
        }
      ],
      "confidence": "Ruta y llamada observadas.",
      "pathKind": "literal"
    },
    {
      "id": "e-price-call",
      "group": "sale",
      "from": "backend",
      "to": "pricing",
      "method": "GET",
      "path": "${URL_API_PRECIOS}",
      "evidenceType": "call",
      "purpose": "Solicitar precio con rut, sku, cantidad, sucursal y usuario; URL completa configurable.",
      "execution": "HTTP síncrono con cancelación por timeout; el valor predeterminado del helper es 8 segundos.",
      "offline": "Dependencia remota del flujo de caja; no se acredita un motor local equivalente de precios/ofertas.",
      "failure": "Ante error devuelve error=true y status 503. La URL efectiva y su vinculación con ApiPrecios no se verificaron.",
      "repo": "mountain-implementos",
      "commit": "711f97fd7948c696bf45c992c5b121683bdbacd7",
      "sources": [
        {
          "label": "mountain-implementos/backend/app/Services/Precios/PreciosImplementosServices.js:12–56",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Precios/PreciosImplementosServices.js#L12-L56"
        }
      ],
      "confidence": "Llamada observada; path final configurado y receptor efectivo pendientes.",
      "pathKind": "configured"
    },
    {
      "id": "e-price-api",
      "group": "sale",
      "from": "integration-caller",
      "to": "pricing",
      "method": "GET",
      "path": "/api/precios/precio",
      "evidenceType": "route",
      "purpose": "Ruta .NET que declara rut, sucursal, sku, cantidad y usuario y ejecuta reglas de precio.",
      "execution": "HTTP síncrono con consultas a datos y reglas del servicio.",
      "offline": "Sin evidencia de ejecución o réplica local en cada sucursal.",
      "failure": "La firma es compatible con e-price-call; no prueba que URL_API_PRECIOS apunte a este servicio en producción.",
      "repo": "apis-implementos",
      "commit": "8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70",
      "sources": [
        {
          "label": "apis-implementos/ApiPrecios/Controllers/PreciosController.cs:17–190",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApiPrecios/Controllers/PreciosController.cs#L17-L190"
        }
      ],
      "confidence": "Receptor declarado; llamador y binding de despliegue pendientes.",
      "pathKind": "literal"
    },
    {
      "id": "e-promotions",
      "group": "sale",
      "from": "backend",
      "to": "promotions",
      "method": "POST",
      "path": "promocionesDisponibles",
      "evidenceType": "call",
      "purpose": "Consultar promociones disponibles; sufijo agregado a URL_API_CARRO. El mismo servicio consulta promocionesLinea para sus relaciones.",
      "execution": "HTTP síncrono con timeout declarado de 30 segundos.",
      "offline": "Requiere el servicio configurado; no demuestra evaluación local de ofertas.",
      "failure": "Disponibilidad del catálogo local no reemplaza esta llamada ni sus reglas. Endpoint receptor y ubicación física deben confirmarse.",
      "repo": "mountain-implementos",
      "commit": "711f97fd7948c696bf45c992c5b121683bdbacd7",
      "sources": [
        {
          "label": "mountain-implementos/backend/app/Services/Promociones/PromocionesImplementosServices.js:12–58",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Promociones/PromocionesImplementosServices.js#L12-L58"
        },
        {
          "label": "mountain-implementos/backend/app/Services/Promociones/PromocionesImplementosServices.js:60–108",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Promociones/PromocionesImplementosServices.js#L60-L108"
        }
      ],
      "confidence": "Llamada saliente observada; base configurable.",
      "pathKind": "relative"
    },
    {
      "id": "e-document-retry",
      "group": "sale",
      "from": "integration-caller",
      "to": "backend",
      "method": "GET",
      "path": "/Documentos/facturar",
      "evidenceType": "route",
      "purpose": "Volver a facturar un documento indicado por query id; ruta adicional al recorrido normal después del commit.",
      "execution": "HTTP síncrono que puede producir un efecto fiscal.",
      "offline": "Depende del facturador configurado y de sus capacidades, no acreditadas para operación offline.",
      "failure": "GET tiene efecto; repetición automática, timeout o recarga exige consultar resultado antes de reenviar. No confundir con descarga de PDF.",
      "repo": "mountain-implementos",
      "commit": "711f97fd7948c696bf45c992c5b121683bdbacd7",
      "sources": [
        {
          "label": "mountain-implementos/backend/start/routes.js:21–21",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L21-L21"
        },
        {
          "label": "mountain-implementos/backend/app/Controllers/Http/DocumentoController.js:96–101",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DocumentoController.js#L96-L101"
        }
      ],
      "confidence": "Ruta receptora declarada; consumidor efectivo no verificado.",
      "pathKind": "literal"
    },
    {
      "id": "e-fiscal-acepta",
      "group": "sale",
      "from": "backend",
      "to": "fiscal-acepta",
      "method": "POST",
      "path": "${FACTURACION_ACEPTA_SERVICIO}",
      "evidenceType": "call",
      "purpose": "Enviar datos XML al servicio Acepta con comando publicar y referencia documental.",
      "execution": "HTTP síncrono posterior al guardado de venta; URL completa por configuración.",
      "offline": "La accesibilidad y modalidad fiscal offline de este proveedor no están acreditadas.",
      "failure": "Sin timeout explícito en esta llamada. Un error de transporte no prueba que el proveedor no emitiera: conservar referencia y conciliar.",
      "repo": "mountain-implementos",
      "commit": "711f97fd7948c696bf45c992c5b121683bdbacd7",
      "sources": [
        {
          "label": "mountain-implementos/backend/app/Services/Facturacion/FacturacionService.js:392–414",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L392-L414"
        },
        {
          "label": "mountain-implementos/backend/app/Services/Facturacion/FacturacionAceptaService.js:672–724",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionAceptaService.js#L672-L724"
        }
      ],
      "confidence": "Llamada observada; URL, despliegue y proveedor activo pendientes.",
      "pathKind": "configured"
    },
    {
      "id": "e-fiscal-ingydev",
      "group": "sale",
      "from": "backend",
      "to": "fiscal-ingydev",
      "method": "POST",
      "path": "/WSFactElect/?wsdl",
      "evidenceType": "call",
      "purpose": "Enviar SOAP/XML al servicio Ingydev; se conserva el path sin divulgar el origen configurado.",
      "execution": "HTTP síncrono; selector de implementación decide Acepta o Ingydev.",
      "offline": "No se ha verificado contingencia fiscal ni ubicación del servicio; externo significa fuera del backend POS.",
      "failure": "Respuesta perdida puede dejar resultado fiscal incierto. Consultar estado con la identidad documental antes de repetir.",
      "repo": "mountain-implementos",
      "commit": "711f97fd7948c696bf45c992c5b121683bdbacd7",
      "sources": [
        {
          "label": "mountain-implementos/backend/app/Services/Facturacion/FacturacionIngydevService.js:17",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionIngydevService.js#L17"
        },
        {
          "label": "mountain-implementos/backend/app/Services/Facturacion/FacturacionIngydevService.js:402–448",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionIngydevService.js#L402-L448"
        },
        {
          "label": "mountain-implementos/backend/app/Services/Facturacion/FacturacionService.js:392–414",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L392-L414"
        }
      ],
      "confidence": "Llamada y path observados; origen omitido deliberadamente.",
      "pathKind": "literal"
    },
    {
      "id": "e-ax-invoice",
      "group": "sale",
      "from": "bus",
      "to": "axapi",
      "method": "POST",
      "path": "/api/caja/mountainpos/creaFacturaOvFromPos",
      "evidenceType": "Llamada y receptor compatibles",
      "purpose": "Wrapper .NET para crear factura de orden de venta en AX a través de ServiciosAX.",
      "execution": "HTTP síncrono dentro del receptor; el registro desde sucursal pertenece a la integración diferida.",
      "offline": "No es requisito de conectividad directa de la UI; la continuidad depende del guardado y recuperación de mensajes.",
      "failure": "El wrapper puede devolver error:false junto con una respuesta interna de error. La condición FACTURADA no acredita idempotencia general.",
      "repo": "apis-implementos",
      "commit": "8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70",
      "sources": [
        {
          "label": "apis-implementos/apiMountainPosCaja/Controllers/CajaController.cs:23–49",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/apiMountainPosCaja/Controllers/CajaController.cs#L23-L49"
        },
        {
          "label": "apis-implementos/ServiciosAX/mountainPosCajaServices/NotaVenta.cs:232–272",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ServiciosAX/mountainPosCajaServices/NotaVenta.cs#L232-L272"
        },
        {
          "label": "WSO2: llamada al registry y secuencia de respuesta",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_AX_Insert_ventas.xml#L13-L32"
        },
        {
          "label": "Recurso QA: contrato de ventas y timeout, no binding productivo",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/QARegistryResource/EP_Ventas.xml#L3-L6"
        }
      ],
      "confidence": "Synapse y receptor .NET localizados; recurso QA versionado, binding productivo pendiente",
      "pathKind": "literal"
    },
    {
      "id": "e-ax-payment",
      "group": "sale",
      "from": "integration-caller",
      "to": "axapi",
      "method": "POST",
      "path": "/api/caja/mountainpos/pagoFactura",
      "evidenceType": "route",
      "purpose": "Registrar pago/journal de factura en AX; no autoriza tarjeta ni cobra al terminal.",
      "execution": "HTTP síncrono hacia proxy AX; su uso en la integración de sucursal es diferido respecto de la operación local.",
      "offline": "AX puede enterarse después; confirmación de transporte no equivale a registro financiero.",
      "failure": "Respuesta anidada y resultado incierto requieren inspeccionar resultado de negocio. El wrapper no acredita deduplicación extremo a extremo.",
      "repo": "apis-implementos",
      "commit": "8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70",
      "sources": [
        {
          "label": "apis-implementos/apiMountainPosCaja/Controllers/CajaController.cs:53–77",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/apiMountainPosCaja/Controllers/CajaController.cs#L53-L77"
        },
        {
          "label": "apis-implementos/ServiciosAX/mountainPosCajaServices/Pago.cs:20–132",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ServiciosAX/mountainPosCajaServices/Pago.cs#L20-L132"
        }
      ],
      "confidence": "Receptor declarado; mediación y despliegue pendientes.",
      "pathKind": "literal"
    },
    {
      "id": "e-customer-view",
      "group": "customer",
      "from": "ui",
      "to": "backend",
      "method": "GET",
      "path": "/empresas/:id",
      "evidenceType": "route",
      "purpose": "Consultar/refrescar cliente: id local o id nulo con query rut.",
      "execution": "HTTP síncrono: intenta consulta externa, actualiza datos locales y retorna resultado de consulta local.",
      "offline": "Existe información local, pero la consulta con RUT incluye refresh remoto; no equivale a una experiencia validada sin WAN.",
      "failure": "El manejo de error del refresh puede afectar la selección del cliente. Es una lectura/rematerialización, no una escritura del cliente en AX.",
      "repo": "mountain-implementos",
      "commit": "711f97fd7948c696bf45c992c5b121683bdbacd7",
      "sources": [
        {
          "label": "mountain-implementos/backend/start/routes.js:50–50",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L50-L50"
        },
        {
          "label": "mountain-implementos/frontend/src/app/services/empresas.service.ts:28–54",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/empresas.service.ts#L28-L54"
        },
        {
          "label": "mountain-implementos/backend/app/Controllers/Http/EmpresaController.js:66–88",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L88"
        },
        {
          "label": "mountain-implementos/backend/app/Services/EmpresaService.js:30–88",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
        }
      ],
      "confidence": "Ruta y consumidor Angular observados.",
      "pathKind": "literal"
    },
    {
      "id": "e-customer-refresh",
      "group": "customer",
      "from": "backend",
      "to": "clientapi",
      "method": "GET",
      "path": "cliente",
      "evidenceType": "call",
      "purpose": "Agregar el sufijo cliente a URL_API_CLIENTES y consultar con parámetro _rutCliente; guardar respuesta en PostgreSQL local.",
      "execution": "HTTP síncrono con timeout declarado de 30 segundos.",
      "offline": "La llamada necesita acceso al servicio configurado. El contrato de fallback local requiere validación funcional.",
      "failure": "El receptor no se ha identificado inequívocamente entre los proyectos .NET recibidos. No atribuir esta llamada a ApiCliente por su nombre.",
      "repo": "mountain-implementos",
      "commit": "711f97fd7948c696bf45c992c5b121683bdbacd7",
      "sources": [
        {
          "label": "mountain-implementos/backend/app/Services/EmpresaService.js:30–88",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
        },
        {
          "label": "mountain-implementos/backend/app/Controllers/Http/EmpresaController.js:169–182",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L169-L182"
        }
      ],
      "confidence": "Llamada saliente; base y receptor efectivos pendientes.",
      "pathKind": "relative"
    },
    {
      "id": "e-sync-upload",
      "group": "masters",
      "from": "sync",
      "to": "bus",
      "method": "POST",
      "path": "/api/mensajeEntradas/ingresar",
      "evidenceType": "Llamada cliente y ruta receptora",
      "purpose": "Subir un mensaje de integración preparado localmente al bus central.",
      "execution": "HTTP síncrono por envío; disparado en segundo plano por cron o acción de sincronización.",
      "offline": "Si no hay WAN, el envío necesita recuperación posterior. La existencia de tablas de mensajes no prueba ausencia de pérdidas ni reintentos idempotentes.",
      "failure": "procesado=true en HTTP representa recepción. PostgreSQL y JMS son pasos separados; no confirma AX.",
      "repo": "mountain-sync-sucursal",
      "commit": "540ab9a70e7befbca27a2f7eb88b87b25109e4d1",
      "sources": [
        {
          "label": "mountain-sync-sucursal/app/Utils/Axios.js:9–20",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Utils/Axios.js#L9-L20"
        },
        {
          "label": "mountain-sync-sucursal/app/Services/LlamadaApis/CambiosConcentradorService.js:289–318",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L289-L318"
        },
        {
          "label": "mountain-sync-sucursal/app/Services/SincronizadorService.js:188–476",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SincronizadorService.js#L188-L476"
        },
        {
          "label": "API de ingreso y consulta central",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml#L18-L246"
        }
      ],
      "confidence": "Llamador y receptor compatibles; despliegue pendiente",
      "pathKind": "literal"
    },
    {
      "id": "e-sync-exists",
      "group": "masters",
      "from": "sync",
      "to": "bus",
      "method": "POST",
      "path": "/api/mensajeEntradas/existente",
      "evidenceType": "call",
      "purpose": "Consultar si el concentrador ya conoce un mensaje; se usa en recuperación/reenvío.",
      "execution": "HTTP síncrono de control, separado del resultado de negocio ERP.",
      "offline": "Necesita acceso al bus. La falta de respuesta impide distinguir ausencia de mensaje de fallo de consulta.",
      "failure": "Sin data_respuesta no demuestra ausencia de efecto AX; reintentar requiere reconciliación.",
      "repo": "mountain-sync-sucursal",
      "commit": "540ab9a70e7befbca27a2f7eb88b87b25109e4d1",
      "sources": [
        {
          "label": "mountain-sync-sucursal/app/Utils/Axios.js:9–20",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Utils/Axios.js#L9-L20"
        },
        {
          "label": "mountain-sync-sucursal/app/Services/LlamadaApis/CambiosConcentradorService.js:340–363",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L340-L363"
        },
        {
          "label": "mountain-sync-sucursal/app/Services/SincronizadorService.js:188–476",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SincronizadorService.js#L188-L476"
        },
        {
          "label": "API de ingreso y consulta central",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml#L18-L246"
        }
      ],
      "confidence": "Llamador y receptor compatibles; despliegue pendiente",
      "pathKind": "literal"
    },
    {
      "id": "e-sync-ping",
      "group": "masters",
      "from": "sync",
      "to": "bus",
      "method": "GET",
      "path": "/api/ping",
      "evidenceType": "call",
      "purpose": "Enviar ping con identificador de entidad al bus.",
      "execution": "HTTP síncrono auxiliar en segundo plano.",
      "offline": "Fallo indica falta de respuesta de esta ruta; no mide continuidad funcional de venta local.",
      "failure": "Éxito del ping no prueba salud de AX, DTE, colas, PostgreSQL ni entrega de mensajes.",
      "repo": "mountain-sync-sucursal",
      "commit": "540ab9a70e7befbca27a2f7eb88b87b25109e4d1",
      "sources": [
        {
          "label": "mountain-sync-sucursal/app/Utils/Axios.js:9–20",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Utils/Axios.js#L9-L20"
        },
        {
          "label": "mountain-sync-sucursal/app/Services/LlamadaApis/CambiosConcentradorService.js:320–338",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L320-L338"
        },
        {
          "label": "API_ping: receptor y secuencia DSS",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_ping.xml#L14-L26"
        }
      ],
      "confidence": "Llamador y receptor Synapse compatibles; despliegue pendiente",
      "pathKind": "literal"
    },
    {
      "id": "e-master-changes",
      "group": "masters",
      "from": "sync",
      "to": "readapi",
      "method": "GET",
      "path": "mensajeSalidas/cambios",
      "evidenceType": "Llamada y receptor compatibles",
      "purpose": "Obtener cambios de maestro por nombreEntidad y tipoMensaje desde API de lectura.",
      "execution": "Polling HTTP síncrono dentro de un procesamiento asíncrono respecto de la venta.",
      "offline": "Sin WAN se retiene la última información local disponible; vigencia, completitud y política de cambios deben definirse por dominio.",
      "failure": "Marca enviado y confirma la transacción antes de responder; existe sin-procesar para recuperación.",
      "repo": "mountain-sync-sucursal",
      "commit": "540ab9a70e7befbca27a2f7eb88b87b25109e4d1",
      "sources": [
        {
          "label": "mountain-sync-sucursal/app/Services/LlamadaApis/CambiosConcentradorService.js:154–195",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L154-L195"
        },
        {
          "label": "mountain-sync-sucursal/app/Utils/Axios.js:23–43",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Utils/Axios.js#L23-L43"
        },
        {
          "label": "Rutas de API lectura",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/start/routes.js#L19-L26"
        },
        {
          "label": "MPOS, lotes y acuses: auditoría y fuentes",
          "url": "../docs/analisis-repositorios/mountain-concentrador-maestros.md"
        }
      ],
      "confidence": "Llamador y receptor Node compatibles",
      "pathKind": "relative"
    },
    {
      "id": "e-master-unprocessed",
      "group": "masters",
      "from": "sync",
      "to": "readapi",
      "method": "GET",
      "path": "mensajeSalidas/sin-procesar",
      "evidenceType": "Llamada y receptor compatibles",
      "purpose": "Recuperar lotes enviado=true y procesado=false, incluso con recibido_sucursal=true.",
      "execution": "HTTP síncrono de recuperación; separado de recepción y aplicación local.",
      "offline": "Requiere API de lectura. Una lista vacía solo es interpretable con éxito explícito del contrato.",
      "failure": "El filtro central permite relectura de enviados no procesados incluso con recibido_sucursal=true. Retención y recuperación integrada siguen por probar.",
      "repo": "mountain-sync-sucursal",
      "commit": "540ab9a70e7befbca27a2f7eb88b87b25109e4d1",
      "sources": [
        {
          "label": "mountain-sync-sucursal/app/Services/LlamadaApis/CambiosConcentradorService.js:197–231",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L197-L231"
        },
        {
          "label": "mountain-sync-sucursal/app/Utils/Axios.js:23–43",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Utils/Axios.js#L23-L43"
        },
        {
          "label": "Rutas de API lectura",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/start/routes.js#L19-L26"
        },
        {
          "label": "MPOS, lotes y acuses: auditoría y fuentes",
          "url": "../docs/analisis-repositorios/mountain-concentrador-maestros.md"
        }
      ],
      "confidence": "Llamador y receptor Node compatibles",
      "pathKind": "relative"
    },
    {
      "id": "e-master-received",
      "group": "masters",
      "from": "sync",
      "to": "readapi",
      "method": "POST",
      "path": "mensajeSalidas/recibido",
      "evidenceType": "Llamada y receptor compatibles",
      "purpose": "Notificar recepción usando query mensajeSalidaId y cuerpo {data:{}}.",
      "execution": "HTTP síncrono: en el recorrido inspeccionado se notifica antes de crear/aplicar el mensaje local.",
      "offline": "Si se interrumpe el proceso después del aviso y antes de persistir, la recuperación depende de la semántica central.",
      "failure": "El ACK precede al guardado local en el sync. No excluye por sí solo el lote de sin-procesar.",
      "repo": "mountain-sync-sucursal",
      "commit": "540ab9a70e7befbca27a2f7eb88b87b25109e4d1",
      "sources": [
        {
          "label": "mountain-sync-sucursal/app/Services/LlamadaApis/CambiosConcentradorService.js:77–109",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L109"
        },
        {
          "label": "mountain-sync-sucursal/app/Services/LlamadaApis/CambiosConcentradorService.js:233–262",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L233-L262"
        },
        {
          "label": "mountain-sync-sucursal/app/Utils/Axios.js:23–43",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Utils/Axios.js#L23-L43"
        },
        {
          "label": "Rutas de API lectura",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/start/routes.js#L19-L26"
        },
        {
          "label": "MPOS, lotes y acuses: auditoría y fuentes",
          "url": "../docs/analisis-repositorios/mountain-concentrador-maestros.md"
        }
      ],
      "confidence": "Llamador y receptor Node compatibles",
      "pathKind": "relative"
    },
    {
      "id": "e-master-processed",
      "group": "masters",
      "from": "sync",
      "to": "readapi",
      "method": "POST",
      "path": "mensajeSalidas/procesados",
      "evidenceType": "Llamada y receptor compatibles",
      "purpose": "Informar resultados de aplicación por detalle al concentrador.",
      "execution": "HTTP síncrono posterior al procesamiento; catch registra error.",
      "offline": "Necesita conectividad central; el acuse no es una transacción distribuida con la DB local.",
      "failure": "Contadores incrementales y errores por detalle; deduplicación del acuse no acreditada.",
      "repo": "mountain-sync-sucursal",
      "commit": "540ab9a70e7befbca27a2f7eb88b87b25109e4d1",
      "sources": [
        {
          "label": "mountain-sync-sucursal/app/Services/LlamadaApis/CambiosConcentradorService.js:264–287",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L264-L287"
        },
        {
          "label": "mountain-sync-sucursal/app/Utils/Axios.js:23–43",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Utils/Axios.js#L23-L43"
        },
        {
          "label": "Rutas de API lectura",
          "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/start/routes.js#L19-L26"
        },
        {
          "label": "MPOS, lotes y acuses: auditoría y fuentes",
          "url": "../docs/analisis-repositorios/mountain-concentrador-maestros.md"
        }
      ],
      "confidence": "Llamador y receptor Node compatibles",
      "pathKind": "relative"
    },
    {
      "id": "e-sync-manual",
      "group": "masters",
      "from": "integration-caller",
      "to": "sync",
      "method": "GET",
      "path": "/sincronizador/enviar-cambios",
      "evidenceType": "route",
      "purpose": "Disparar manualmente el envío de cambios con parámetros de entidad.",
      "execution": "HTTP síncrono de control que ejecuta un efecto de integración.",
      "offline": "No sustituye acceso WAN; solo invoca trabajo que puede quedar pendiente o fallar.",
      "failure": "GET produce efectos y las rutas mostradas no declaran middleware de autenticación. Exposición de red y controles desplegados requieren inventario.",
      "repo": "mountain-sync-sucursal",
      "commit": "540ab9a70e7befbca27a2f7eb88b87b25109e4d1",
      "sources": [
        {
          "label": "mountain-sync-sucursal/start/routes.js:19–23",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/start/routes.js#L19-L23"
        },
        {
          "label": "mountain-sync-sucursal/app/Controllers/Http/SincronizadorController.js:12–17",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Controllers/Http/SincronizadorController.js#L12-L17"
        }
      ],
      "confidence": "Ruta receptora; llamador operativo y exposición no comprobados.",
      "pathKind": "literal"
    },
    {
      "id": "e-sync-backend",
      "group": "masters",
      "from": "sync",
      "to": "backend",
      "method": "POST",
      "path": "/public/punto-de-venta/sinc-guarda-documento-cobranza",
      "evidenceType": "call",
      "purpose": "Solicitar al backend local que guarde derivados documentales/de cobranza recibidos por integración.",
      "execution": "HTTP síncrono por LAN; cliente hacia backend declara timeout de hasta 20 minutos.",
      "offline": "No requiere WAN para el salto local, pero su origen de datos pertenece al proceso de sincronización.",
      "failure": "Endpoint public queda fuera del grupo auth inspeccionado. Timeout extenso y respuesta perdida requieren reconciliar por identidad, no repetir a ciegas.",
      "repo": "mountain-sync-sucursal",
      "commit": "540ab9a70e7befbca27a2f7eb88b87b25109e4d1",
      "sources": [
        {
          "label": "mountain-sync-sucursal/app/Services/LlamadaApis/BackendSucursalService.js:16–44",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/BackendSucursalService.js#L16-L44"
        },
        {
          "label": "mountain-sync-sucursal/app/Utils/Axios.js:46–61",
          "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Utils/Axios.js#L46-L61"
        },
        {
          "label": "mountain-implementos/backend/start/routes.js:549",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L549"
        }
      ],
      "confidence": "Llamada y receptor observados; topología y controles de red pendientes.",
      "pathKind": "literal"
    },
    {
      "id": "e-concentrador-read",
      "group": "masters",
      "from": "integration-caller",
      "to": "carroapi",
      "method": "GET",
      "path": "/api/carro/concentrador",
      "evidenceType": "route",
      "purpose": "Consultar URL de DTE por numero y tipo leyendo JSON de mensajes en PostgreSQL del concentrador.",
      "execution": "HTTP síncrono con acceso SQL directo a tablas de integración.",
      "offline": "Depende de conectividad de ApiCarro al concentrador y de que el mensaje/DTE esté disponible allí.",
      "failure": "SQL construida por interpolación de parámetros y acoplamiento a estructura JSON/tablas. No representa descarga de maestros ni una API de lectura intercambiable.",
      "repo": "apis-implementos",
      "commit": "8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70",
      "sources": [
        {
          "label": "apis-implementos/ApiCarro/Controllers/CarroController.cs:331–355",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApiCarro/Controllers/CarroController.cs#L331-L355"
        }
      ],
      "confidence": "Ruta declarada y acceso a PostgreSQL observados; llamador y destino físico pendientes.",
      "pathKind": "literal"
    },
    {
      "id": "e-credit-search",
      "group": "credit",
      "from": "ui",
      "to": "backend",
      "method": "POST",
      "path": "/nota-de-credito/por-cliente",
      "evidenceType": "route",
      "purpose": "Buscar NC del cliente y ajustar saldo visible con pagos locales y consulta de NC pendientes de sincronizar.",
      "execution": "HTTP síncrono que combina varias fuentes con distinta frescura.",
      "offline": "Necesita dependencias remotas para el saldo agregado; la caché no acredita saldo disponible autoritativo.",
      "failure": "Consulta, marca en uso, consumo local y confirmación en AX no forman una única transacción. No se ha demostrado doble uso productivo, pero sí ventanas a probar.",
      "repo": "mountain-implementos",
      "commit": "711f97fd7948c696bf45c992c5b121683bdbacd7",
      "sources": [
        {
          "label": "mountain-implementos/backend/start/routes.js:397",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L397"
        },
        {
          "label": "mountain-implementos/frontend/src/app/services/nota-credito.service.ts:35–45",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/nota-credito.service.ts#L35-L45"
        },
        {
          "label": "mountain-implementos/backend/app/Controllers/Http/NotaDeCreditoAxController.js:45–95",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L45-L95"
        }
      ],
      "confidence": "Ruta y llamada Angular observadas.",
      "pathKind": "literal"
    },
    {
      "id": "e-payment-query",
      "group": "credit",
      "from": "integration-caller",
      "to": "payments",
      "method": "POST",
      "path": "/api/pagos/",
      "evidenceType": "route",
      "purpose": "Consultar pagos de una factura con puntoEmision y factura; busca la sucursal en MongoDB y consulta su PostgreSQL.",
      "execution": "HTTP síncrono con conexión PostgreSQL directa a la sucursal correspondiente.",
      "offline": "Requiere disponibilidad de la sucursal elegida y del directorio Mongo. No procesa ni autoriza un cargo con tarjeta.",
      "failure": "Selecciona el primer documento de la consulta por folio; identidad fiscal completa y unicidad deben validarse. Error de consulta no es ausencia de pagos.",
      "repo": "api-pagos-caja",
      "commit": "33cd625f029aa78798f0baf307c41e17ebee92e1",
      "sources": [
        {
          "label": "api-pagos-caja/app.js:58",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/app.js#L58"
        },
        {
          "label": "api-pagos-caja/routes/pagos.js:5–5",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L5-L5"
        },
        {
          "label": "api-pagos-caja/controllers/pagosController.js:6–21",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L6-L21"
        },
        {
          "label": "api-pagos-caja/services/pagosService.js:4–75",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L4-L75"
        }
      ],
      "confidence": "Receptor declarado; llamador no identificado.",
      "pathKind": "literal"
    },
    {
      "id": "e-credit-pending",
      "group": "credit",
      "from": "backend",
      "to": "payments",
      "method": "GET",
      "path": "/api/pagos/pagosSinSinc",
      "evidenceType": "route",
      "purpose": "Obtener pagos con NC aprobados, de ventas finalizadas y con cv.sincronizado=false, filtrados por rut y dv.",
      "execution": "HTTP síncrono agregado a PostgreSQL de sucursales, cuyos datos de conexión provienen de Mongo.",
      "offline": "No garantiza consultar todas las sucursales ni conocer NC consumidas que ya salieron de este filtro pero aún no llegaron a AX.",
      "failure": "cv.sincronizado puede indicar preparación local antes de confirmación AX; queda una ventana que debe probarse. Fallback de Mountain usa clave de caché por endpoint y puede mezclar clientes al fallar.",
      "repo": "api-pagos-caja",
      "commit": "33cd625f029aa78798f0baf307c41e17ebee92e1",
      "sources": [
        {
          "label": "api-pagos-caja/app.js:58",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/app.js#L58"
        },
        {
          "label": "api-pagos-caja/routes/pagos.js:6–6",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L6-L6"
        },
        {
          "label": "api-pagos-caja/controllers/pagosController.js:80–94",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L80-L94"
        },
        {
          "label": "api-pagos-caja/services/pagosService.js:78–140",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L78-L140"
        },
        {
          "label": "api-pagos-caja/services/pagosService.js:326–353",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L326-L353"
        },
        {
          "label": "mountain-implementos/backend/app/Controllers/Http/NotaDeCreditoAxController.js:447–470",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L447-L470"
        },
        {
          "label": "mountain-implementos/backend/app/Services/api-fallback-manager.js:7–94",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/api-fallback-manager.js#L7-L94"
        }
      ],
      "confidence": "Ruta y sufijo consumidor observados; base efectiva de Mountain configurada.",
      "pathKind": "literal"
    },
    {
      "id": "e-credit-state",
      "group": "credit",
      "from": "backend",
      "to": "payments",
      "method": "GET",
      "path": "/api/pagos/estadoNC",
      "evidenceType": "route",
      "purpose": "Consultar en MongoDB estados por folio mediante query folio.",
      "execution": "HTTP síncrono de consulta; no reserva ni consume por sí solo.",
      "offline": "Central y caché pueden tener estado incompleto/desactualizado; la ausencia de marca no acredita saldo gastable.",
      "failure": "La consulta usa folio sin origen; no demuestra unicidad entre entidades. Caché Mountain por endpoint puede devolver otro folio en modo fallback.",
      "repo": "api-pagos-caja",
      "commit": "33cd625f029aa78798f0baf307c41e17ebee92e1",
      "sources": [
        {
          "label": "api-pagos-caja/app.js:58",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/app.js#L58"
        },
        {
          "label": "api-pagos-caja/routes/pagos.js:10–10",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L10-L10"
        },
        {
          "label": "api-pagos-caja/controllers/pagosController.js:23–32",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L23-L32"
        },
        {
          "label": "mountain-implementos/backend/app/Controllers/Http/NotaDeCreditoAxController.js:477–500",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L477-L500"
        },
        {
          "label": "mountain-implementos/backend/app/Services/api-fallback-manager.js:7–94",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/api-fallback-manager.js#L7-L94"
        }
      ],
      "confidence": "Ruta y consumidor del sufijo observados; configuración efectiva pendiente.",
      "pathKind": "literal"
    },
    {
      "id": "e-credit-reserve",
      "group": "credit",
      "from": "integration-caller",
      "to": "payments",
      "method": "POST",
      "path": "/api/pagos/estadoNC",
      "evidenceType": "route",
      "purpose": "Crear marca de estado NC con folio/origen/monto/puntoEmision, o poner en uso la encontrada.",
      "execution": "Escritura síncrona a MongoDB, separada de venta local y registro ERP.",
      "offline": "No acredita una reserva corporativa durable de saldo ni una política offline.",
      "failure": "Read-then-write sin transición condicional atómica; tras res.json(existe) falta return y se intenta crear otra fila. No confundir el nombre reserva con garantía de exclusión.",
      "repo": "api-pagos-caja",
      "commit": "33cd625f029aa78798f0baf307c41e17ebee92e1",
      "sources": [
        {
          "label": "api-pagos-caja/app.js:58",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/app.js#L58"
        },
        {
          "label": "api-pagos-caja/routes/pagos.js:11–11",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L11-L11"
        },
        {
          "label": "api-pagos-caja/controllers/pagosController.js:34–58",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L34-L58"
        },
        {
          "label": "api-pagos-caja/models/estadoNC.model.js:4–28",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/models/estadoNC.model.js#L4-L28"
        }
      ],
      "confidence": "Receptor declarado; llamador y contrato de propiedad pendientes.",
      "pathKind": "literal"
    },
    {
      "id": "e-credit-release",
      "group": "credit",
      "from": "integration-caller",
      "to": "payments",
      "method": "PUT",
      "path": "/api/pagos/estadoNC/:folio/:origen",
      "evidenceType": "route",
      "purpose": "Marcar una NC como disponible buscando folio y origen.",
      "execution": "Escritura síncrona a MongoDB.",
      "offline": "Necesita conectividad a la API; no demuestra que sea seguro liberar al agotarse un timeout local.",
      "failure": "No verifica propietario/intento ni versión de la operación; tras NC inexistente falta retorno. Liberar con pago incierto requiere reconciliación antes de habilitar otro uso.",
      "repo": "api-pagos-caja",
      "commit": "33cd625f029aa78798f0baf307c41e17ebee92e1",
      "sources": [
        {
          "label": "api-pagos-caja/app.js:58",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/app.js#L58"
        },
        {
          "label": "api-pagos-caja/routes/pagos.js:12–12",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L12-L12"
        },
        {
          "label": "api-pagos-caja/controllers/pagosController.js:61–77",
          "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L61-L77"
        }
      ],
      "confidence": "Receptor declarado; consumidor efectivo pendiente.",
      "pathKind": "literal"
    },
    {
      "id": "e-print-health",
      "group": "printing",
      "from": "integration-caller",
      "to": "print",
      "method": "GET",
      "path": "/Impresion/Index",
      "evidenceType": "route",
      "purpose": "Responder que el servicio HTTP está activo.",
      "execution": "HTTP local de respuesta inmediata; no inspecciona periférico.",
      "offline": "Puede responder sin WAN si proceso local está activo.",
      "failure": "No demuestra impresora conectada, papel, spooler operativo ni impresión física. No usar como prueba de readiness del dispositivo.",
      "repo": "api-impresion-caja",
      "commit": "2e74b2d64985902f5fdfb52902016a5f65d7b577",
      "sources": [
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/ServiceImpresora.cs:30–60",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/ServiceImpresora.cs#L30-L60"
        },
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/Controllers/ImpresionController.cs:24–28",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/Controllers/ImpresionController.cs#L24-L28"
        }
      ],
      "confidence": "Ruta convencional controller/action observada; llamador no identificado.",
      "pathKind": "literal"
    },
    {
      "id": "e-print-test",
      "group": "printing",
      "from": "integration-caller",
      "to": "print",
      "method": "GET",
      "path": "/Impresion/Test",
      "evidenceType": "route",
      "purpose": "Ejecutar una prueba de impresión física.",
      "execution": "HTTP local con efecto sobre periférico; GET no es un health check inocuo.",
      "offline": "No requiere WAN por diseño de este salto; sí impresora/controladores/disponibilidad local.",
      "failure": "Registra excepciones, pero retorna HTTP 200 con error=false. La respuesta no acredita que haya salido papel; polling puede repetir impresiones.",
      "repo": "api-impresion-caja",
      "commit": "2e74b2d64985902f5fdfb52902016a5f65d7b577",
      "sources": [
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/ServiceImpresora.cs:30–60",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/ServiceImpresora.cs#L30-L60"
        },
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/Controllers/ImpresionController.cs:30–47",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/Controllers/ImpresionController.cs#L30-L47"
        }
      ],
      "confidence": "Receptor declarado; uso operativo no observado.",
      "pathKind": "literal"
    },
    {
      "id": "e-print-thermal",
      "group": "printing",
      "from": "ui",
      "to": "print",
      "method": "POST",
      "path": "/Impresion/ImprimirDTE_Termica",
      "evidenceType": "route",
      "purpose": "Imprimir en papel boletas, facturas y comprobantes de pago o cobranza a partir del contenido recibido; no emitir un nuevo DTE.",
      "execution": "HTTP local desde Angular; PrintDocument/driver gobierna ejecución física.",
      "offline": "Salto local independiente de WAN; obtener antes los datos a imprimir puede depender de otro servicio.",
      "failure": "Excepciones se registran y aun así devuelve 200/error=false. Angular no valida cuerpo de error en el recorrido revisado; falta identidad/estado durable de trabajo para reintentos.",
      "repo": "api-impresion-caja",
      "commit": "2e74b2d64985902f5fdfb52902016a5f65d7b577",
      "sources": [
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/ServiceImpresora.cs:30–60",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/ServiceImpresora.cs#L30-L60"
        },
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/Controllers/ImpresionController.cs:49–71",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/Controllers/ImpresionController.cs#L49-L71"
        },
        {
          "label": "mountain-implementos/frontend/src/app/services/impresion.service.ts:36–47",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresion.service.ts#L36-L47"
        },
        {
          "label": "mountain-implementos/frontend/src/app/services/impresion.service.ts:107–145",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresion.service.ts#L107-L145"
        }
      ],
      "confidence": "Receptor y composición de llamada Angular observados; URL de impresora efectiva configurable.",
      "pathKind": "literal"
    },
    {
      "id": "e-print-pdf",
      "group": "printing",
      "from": "integration-caller",
      "to": "print",
      "method": "POST",
      "path": "/Impresion/ImprimirDTE_Pdf",
      "evidenceType": "route",
      "purpose": "Ruta de impresión con dataTexto; pese al nombre, devuelve un ApiResponse, no un archivo PDF.",
      "execution": "HTTP local hacia helper de impresión.",
      "offline": "No acredita descarga ni generación fiscal offline.",
      "failure": "Catch seguido de 200/error=false; revisar compatibilidad SetLineas/Imprimir y listas inicializadas antes de utilizar. El nombre no es contrato suficiente.",
      "repo": "api-impresion-caja",
      "commit": "2e74b2d64985902f5fdfb52902016a5f65d7b577",
      "sources": [
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/ServiceImpresora.cs:30–60",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/ServiceImpresora.cs#L30-L60"
        },
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/Controllers/ImpresionController.cs:74–94",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/Controllers/ImpresionController.cs#L74-L94"
        }
      ],
      "confidence": "Receptor declarado; consumidor no identificado.",
      "pathKind": "literal"
    },
    {
      "id": "e-print-zebra",
      "group": "printing",
      "from": "integration-caller",
      "to": "print",
      "method": "POST",
      "path": "/Impresion/ImprimirZebra",
      "evidenceType": "route",
      "purpose": "Enviar contenido RAW a impresora Zebra configurada.",
      "execution": "HTTP local con efecto físico a través del spooler/controlador Windows.",
      "offline": "El envío local no requiere WAN; depende de dispositivo y configuración.",
      "failure": "Respuesta 200/error=false incluso tras excepción; helper RAW no propaga todos los fallos de envío. Spooler del SO no equivale a diario durable de aplicación.",
      "repo": "api-impresion-caja",
      "commit": "2e74b2d64985902f5fdfb52902016a5f65d7b577",
      "sources": [
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/ServiceImpresora.cs:30–60",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/ServiceImpresora.cs#L30-L60"
        },
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/Controllers/ImpresionController.cs:96–117",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/Controllers/ImpresionController.cs#L96-L117"
        },
        {
          "label": "api-impresion-caja/Biblioteca/Helper/RawPrinterHelper.cs:51–101",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/Biblioteca/Helper/RawPrinterHelper.cs#L51-L101"
        }
      ],
      "confidence": "Receptor declarado; llamador y modelo/firmware pendientes.",
      "pathKind": "literal"
    },
    {
      "id": "e-print-micr",
      "group": "printing",
      "from": "ui",
      "to": "print",
      "method": "GET / POST",
      "path": "/Impresion/LecturaCheque_Termica",
      "evidenceType": "route",
      "purpose": "Accionar lector de cheque y devolver lectura MICR; Angular compone llamada POST.",
      "execution": "HTTP local que espera hardware. El helper incluye espera activa y manejo de dispositivo.",
      "offline": "El salto es local; no comprueba autorización/validez financiera del cheque.",
      "failure": "Puede bloquear, fallar o quedar incierto el estado del hardware. Contiene datos financieros; no volcar respuestas completas en telemetría.",
      "repo": "api-impresion-caja",
      "commit": "2e74b2d64985902f5fdfb52902016a5f65d7b577",
      "sources": [
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/ServiceImpresora.cs:30–60",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/ServiceImpresora.cs#L30-L60"
        },
        {
          "label": "api-impresion-caja/WindowsServiceImpresora/Controllers/ImpresionController.cs:177–198",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/Controllers/ImpresionController.cs#L177-L198"
        },
        {
          "label": "api-impresion-caja/Biblioteca/Helper/CheckScanner.cs:22–225",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/Biblioteca/Helper/CheckScanner.cs#L22-L225"
        },
        {
          "label": "mountain-implementos/frontend/src/app/services/impresion.service.ts:36–47",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresion.service.ts#L36-L47"
        }
      ],
      "confidence": "GET y POST declarados; POST observado por construcción del cliente.",
      "pathKind": "literal"
    },
    {
      "id": "e-central-retry",
      "group": "masters",
      "from": "central-admin",
      "to": "bus",
      "method": "GET",
      "path": "/api/reintentar/reintento-manual",
      "evidenceType": "Llamada y receptor compatibles",
      "purpose": "Solicitar reintento de un mensaje por ID desde backend-concentrador hacia Synapse.",
      "execution": "HTTP de administración; ejecuta efectos pese a utilizar GET.",
      "offline": "Necesita acceso a la integración central; no es una operación local de venta.",
      "failure": "Reenviar un efecto incierto exige identidad y conciliación. La ruta no demuestra permisos ni seguridad del despliegue.",
      "repo": "mountain-implementos",
      "commit": "711f97fd7948c696bf45c992c5b121683bdbacd7",
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
      ],
      "confidence": "Cliente y API versionados; instancia activa pendiente",
      "pathKind": "literal"
    }
  ],
  "gaps": [
    {
      "id": "g-deployment",
      "component": "Inventario desplegado",
      "missing": "Versiones/binarios instalados, bindings, procesos, hosts lógicos, redes, réplicas y propietarios por sucursal/país.",
      "effect": "main/master son referencias de código, no acreditación de producción. No convertir valores predeterminados en puertos activos."
    },
    {
      "id": "g-mediation",
      "component": "WSO2 / Synapse / DSS / broker",
      "missing": "Export efectivo de WSO2, checksums de CAR/JAR, bindings, selección de consumidores, topología del broker y funciones SQL. Código central ya recibido.",
      "effect": "Las variantes fuente/CAR no acreditan qué ruta corre; no certificar durabilidad o reemplazo uno a uno."
    },
    {
      "id": "g-read",
      "component": "API de lectura y procesador de cola central",
      "missing": "Versión activa de api-lectura/procesador, variante Synapse, retención, deduplicación de acuses y ensayos de recuperación.",
      "effect": "Existe código de relectura; falta demostrar recuperación integrada y seguridad ante ACK repetido o fallo parcial."
    },
    {
      "id": "g-ax",
      "component": "AX / MPOS / tablas de intercambio",
      "missing": "Código X++/AOS, cuerpos de procedimientos, DDL, jobs AX→MPOS y contratos desplegados. Las APIs y bibliotecas .NET sí están recibidas.",
      "effect": "No se acredita idempotencia, unicidad por referencia ni exactamente cuándo el ERP confirma resultado."
    },
    {
      "id": "g-bindings",
      "component": "Precio, promociones y clientes",
      "missing": "Configuración sanitizada que vincule URL_API_PRECIOS, URL_API_CARRO y URL_API_CLIENTES con servicios/rutas desplegados.",
      "effect": "Una firma compatible o un nombre de proyecto no demuestra que ese código sea el receptor activo."
    },
    {
      "id": "g-peripherals",
      "component": "Transbank, impresión y fiscal",
      "missing": "Agentes/binarios activos, modelos, firmware, drivers, contratos y comportamiento ante timeout por sucursal/país.",
      "effect": "No inferir capacidades offline, consulta, cancelación, deduplicación ni confirmación física desde una API HTTP."
    },
    {
      "id": "g-data",
      "component": "PostgreSQL / Mongo / SQL Server",
      "missing": "Inventario de instancias/bases, índices/constraints efectivos, permisos, retención, backups y restauraciones probadas.",
      "effect": "Tres nombres de motores no significan tres instancias. Mongo no contiene solo NC; PostgreSQL del concentrador recibe consultas de ApiCarro."
    }
  ],
  "snapshots": [
    {
      "repo": "mountain-implementos",
      "branch": "master",
      "commit": "711f97fd7948c696bf45c992c5b121683bdbacd7",
      "date": "2026-09-14"
    },
    {
      "repo": "mountain-sync-sucursal",
      "branch": "master",
      "commit": "540ab9a70e7befbca27a2f7eb88b87b25109e4d1",
      "date": "2026-04-20",
      "note": "La rama predeterminada desarrollo es anterior; master se leyó mediante Git sin cambiar el checkout."
    },
    {
      "repo": "api-pagos-caja",
      "branch": "main",
      "commit": "33cd625f029aa78798f0baf307c41e17ebee92e1",
      "date": "2026-06-25"
    },
    {
      "repo": "api-impresion-caja",
      "branch": "main",
      "commit": "2e74b2d64985902f5fdfb52902016a5f65d7b577",
      "date": "2026-07-23"
    },
    {
      "repo": "apis-implementos",
      "branch": "master",
      "commit": "8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70",
      "date": "2026-09-11"
    },
    {
      "repo": "mountain-concentrador",
      "branch": "Pablo (predeterminada; sin main)",
      "commit": "b2fd1ec266d131abb54b7076d41acce30f045119",
      "date": "2023-09-08"
    }
  ]
};

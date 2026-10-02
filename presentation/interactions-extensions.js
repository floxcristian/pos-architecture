// Datos estáticos de interacciones actuales, sustentados en commits fijados.
// La presencia de código no confirma versión instalada, despliegue ni resultado físico.
window.POS_INTERACTIONS_EXTENSIONS = [
  {
    "id": "printing",
    "title": "Impresión: documento, solicitud y resultado físico",
    "mode": "current",
    "summary": "La representación fiscal, la API de impresión Windows y la conexión ePOS son ramas distintas. Se muestran componentes concretos y qué acredita cada interacción.",
    "boundary": "Código inspeccionado, sin ejecución ni tráfico productivo. PDF disponible, HTTP 200, retorno de Print() y papel entregado no son confirmaciones equivalentes. No se une una descarga PDF a toda impresión térmica.",
    "groups": [
      {
        "id": "print-angular",
        "title": "Angular · PC de caja",
        "repo": "mountain-implementos/frontend",
        "runtime": "Angular / TypeScript",
        "zone": "terminal",
        "evidence": "Servicios y decisiones de canal observados; puesto Windows."
      },
      {
        "id": "print-backend",
        "title": "Backend de sucursal",
        "repo": "mountain-implementos/backend",
        "runtime": "Node.js / AdonisJS",
        "zone": "branch",
        "evidence": "Controlador receptor y consultas leídos; host/proceso productivos no verificados."
      },
      {
        "id": "print-pg",
        "title": "PostgreSQL de sucursal",
        "repo": "Modelos/consultas de Mountain",
        "runtime": "PostgreSQL; versión pendiente",
        "zone": "branch",
        "evidence": "Tablas nombradas sin esquema calificado; no se presupone public ni instancia física."
      },
      {
        "id": "print-windows",
        "title": "Agente Windows de impresión",
        "repo": "api-impresion-caja",
        "runtime": "C# / .NET Framework 4.7.2 / Web API SelfHost",
        "zone": "terminal",
        "evidence": "Binding loopback y código disponibles; driver, binario y configuración efectivos pendientes."
      },
      {
        "id": "print-devices",
        "title": "Dispositivos y entrega física",
        "repo": "Proveedor / modelo por identificar",
        "runtime": "Hardware, firmware y driver por confirmar",
        "zone": "terminal",
        "evidence": "El código selecciona destinos, pero no verifica papel entregado ni capacidades de cada modelo."
      }
    ],
    "nodes": [
      {
        "id": "p-ui-print",
        "group": "print-angular",
        "title": "ImpresionService.imprimirData",
        "kind": "component",
        "subtitle": "Selecciona epson-epos o apiImpresion",
        "detail": "Usa la configuración de impresora. epson muestra método no configurado; epson-epos conecta por su servicio y apiImpresion inicia una suscripción HTTP.",
        "sources": [
          {
            "label": "ImpresionService: selección de canal y petición HTTP",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresion.service.ts#L42-L145"
          }
        ]
      },
      {
        "id": "p-ui-epos",
        "group": "print-angular",
        "title": "ImpresoraService.conectarImpresora",
        "kind": "component",
        "subtitle": "Conectar y registrar callbacks",
        "detail": "Llama a ePosDev.connect; al conectar crea el dispositivo y registra onreceive. Estas señales no acreditan por sí mismas la entrega física del documento.",
        "sources": [
          {
            "label": "ImpresoraService: connect, createDevice y callback onreceive",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresora.service.ts#L68-L158"
          }
        ]
      },
      {
        "id": "p-ui-pdf",
        "group": "print-angular",
        "title": "DocumentosService.obtenerUrlPdf",
        "kind": "component",
        "subtitle": "Consulta o construye URL de representación",
        "detail": "El cliente construye documentos/pdf en minúsculas. Es independiente del envío de contenido a la impresora térmica.",
        "sources": [
          {
            "label": "DocumentosService: URL y GET de PDF",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/documentos.service.ts#L73-L83"
          }
        ]
      },
      {
        "id": "p-sdk-epos",
        "group": "print-angular",
        "title": "ePosDev.connect / createDevice",
        "kind": "component",
        "subtitle": "Objeto SDK usado por ImpresoraService",
        "detail": "Se observa la invocación del SDK y recepción de callbacks. Versión del SDK efectiva, transporte y contrato físico por modelo siguen pendientes.",
        "sources": [
          {
            "label": "ImpresoraService: connect, createDevice y callback onreceive",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresora.service.ts#L68-L158"
          }
        ]
      },
      {
        "id": "p-pdf-controller",
        "group": "print-backend",
        "title": "DocumentoController.urlPdfDte",
        "kind": "component",
        "subtitle": "GET de representación fiscal",
        "detail": "Consulta documento/DTE/facturador. Ingydev devuelve bytes PDF decodificados; Acepta retorna una referencia/URL obtenida del mensaje del DTE.",
        "sources": [
          {
            "label": "DocumentoController: consulta del DTE y representación",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DocumentoController.js#L233-L305"
          },
          {
            "label": "Rutas Documentos/facturar y Documentos/pdf/:id",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L21-L22"
          }
        ]
      },
      {
        "id": "p-documents",
        "group": "print-pg",
        "title": "documentos",
        "kind": "table",
        "subtitle": "Lectura por documentos.id",
        "detail": "Tabla cabecera usada para localizar el DTE. El query no califica el esquema PostgreSQL.",
        "sources": [
          {
            "label": "DocumentoController: consulta del DTE y representación",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DocumentoController.js#L233-L305"
          }
        ]
      },
      {
        "id": "p-dtes",
        "group": "print-pg",
        "title": "dtes",
        "kind": "table",
        "subtitle": "mensaje_retorno y facturadore_id",
        "detail": "LEFT JOIN por dtes.documento_id; el contenido ya persistido determina la representación. Aquí no se emite un nuevo documento fiscal.",
        "sources": [
          {
            "label": "DocumentoController: consulta del DTE y representación",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DocumentoController.js#L233-L305"
          }
        ]
      },
      {
        "id": "p-fiscal-states",
        "group": "print-pg",
        "title": "estado_dtes",
        "kind": "table",
        "subtitle": "LEFT JOIN de estado",
        "detail": "El query une estado_dtes; no representa estado de impresión ni respuesta física de impresora.",
        "sources": [
          {
            "label": "DocumentoController: consulta del DTE y representación",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DocumentoController.js#L233-L305"
          }
        ]
      },
      {
        "id": "p-fiscal-providers",
        "group": "print-pg",
        "title": "facturadores",
        "kind": "table",
        "subtitle": "slug que selecciona representación",
        "detail": "La consulta usa el facturador del DTE para decidir bytes PDF o referencia. No es una tabla de impresoras.",
        "sources": [
          {
            "label": "DocumentoController: consulta del DTE y representación",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DocumentoController.js#L233-L305"
          }
        ]
      },
      {
        "id": "p-print-controller",
        "group": "print-windows",
        "title": "ImpresionController.ImprimirDTE_Termica",
        "kind": "component",
        "subtitle": "Recibe configuración y columnas",
        "detail": "Deserializa ComprobanteImpresion, configura PrinterHelper e intenta imprimir. Captura excepciones y aun así devuelve 200/error=false.",
        "sources": [
          {
            "label": "ImprimirDTE_Termica: intento de impresión y respuesta",
            "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/Controllers/ImpresionController.cs#L49-L71"
          },
          {
            "label": "SelfHost HTTP y ruta controller/action",
            "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/ServiceImpresora.cs#L30-L50"
          }
        ]
      },
      {
        "id": "p-printer-helper",
        "group": "print-windows",
        "title": "PrinterHelper.Imprimir",
        "kind": "component",
        "subtitle": "Adapta a impresión Windows",
        "detail": "Configura PrinterSettings, papel y PrintPage; invoca PrintDocument.Print(). No se observa aquí un diario durable de trabajos con consulta de resultado.",
        "sources": [
          {
            "label": "PrinterHelper.Imprimir: PrintDocument.Print",
            "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/Biblioteca/Helper/PrinterHelper.cs#L110-L125"
          }
        ]
      },
      {
        "id": "p-print-document",
        "group": "print-windows",
        "title": "System.Drawing.Printing.PrintDocument",
        "kind": "component",
        "subtitle": "API de impresión del sistema",
        "detail": "Print() solicita impresión usando nombre y configuración del driver. Su retorno no se convierte en este código en una prueba de papel entregado.",
        "sources": [
          {
            "label": "PrinterHelper.Imprimir: PrintDocument.Print",
            "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/Biblioteca/Helper/PrinterHelper.cs#L110-L125"
          }
        ]
      },
      {
        "id": "p-device-windows",
        "group": "print-devices",
        "title": "Impresora seleccionada por Windows",
        "kind": "external",
        "subtitle": "Resultado físico por comprobar",
        "detail": "Destino configurado mediante PrinterSettings. La existencia de driver/spooler no aporta aquí un acuse físico correlacionado al documento; modelo y firmware pendientes.",
        "sources": [
          {
            "label": "PrinterHelper.Imprimir: PrintDocument.Print",
            "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/Biblioteca/Helper/PrinterHelper.cs#L110-L125"
          }
        ]
      },
      {
        "id": "p-device-epos",
        "group": "print-devices",
        "title": "Dispositivo conectado mediante ePOS",
        "kind": "external",
        "subtitle": "Variante distinta de API Windows",
        "detail": "El SDK conecta y crea el dispositivo. No se acredita equivalencia de protocolo, consulta, reintento ni confirmación física entre modelos.",
        "sources": [
          {
            "label": "ImpresoraService: connect, createDevice y callback onreceive",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresora.service.ts#L68-L158"
          }
        ]
      }
    ],
    "edges": [
      {
        "id": "p01",
        "from": "p-ui-pdf",
        "to": "p-pdf-controller",
        "label": "GET /documentos/pdf/:id",
        "protocol": "HTTP",
        "detail": "DocumentosService.obtenerUrlPdf construye la petición; el backend declara Documentos/pdf/:id con D mayúscula.",
        "effect": "Solicita representación del documento existente.",
        "boundary": "Base y routing efectivos pendientes; se conserva la diferencia literal de mayúsculas entre cliente y declaración. No es una orden de impresión.",
        "certainty": "code",
        "sources": [
          {
            "label": "DocumentosService: URL y GET de PDF",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/documentos.service.ts#L73-L83"
          },
          {
            "label": "Rutas Documentos/facturar y Documentos/pdf/:id",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L21-L22"
          }
        ]
      },
      {
        "id": "p02",
        "from": "p-pdf-controller",
        "to": "p-documents",
        "label": "SELECT por documentos.id",
        "protocol": "SQL",
        "detail": "Inicia la consulta filtrada por el id recibido.",
        "effect": "Lee cabecera del documento.",
        "boundary": "No se califica esquema ni se confirma el DDL productivo.",
        "certainty": "code",
        "sources": [
          {
            "label": "DocumentoController: consulta del DTE y representación",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DocumentoController.js#L233-L305"
          }
        ]
      },
      {
        "id": "p03",
        "from": "p-pdf-controller",
        "to": "p-dtes",
        "label": "LEFT JOIN dtes; lee mensaje_retorno",
        "protocol": "SQL",
        "detail": "Une dtes.documento_id con documentos.id para recuperar la representación fiscal persistida.",
        "effect": "Lee datos del DTE ya existente.",
        "boundary": "Leer el DTE no confirma que se haya impreso ni que exista una copia física.",
        "certainty": "code",
        "sources": [
          {
            "label": "DocumentoController: consulta del DTE y representación",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DocumentoController.js#L233-L305"
          }
        ]
      },
      {
        "id": "p04",
        "from": "p-pdf-controller",
        "to": "p-fiscal-states",
        "label": "LEFT JOIN estado_dtes",
        "protocol": "SQL",
        "detail": "Une el catálogo mediante dtes.estado_dte_id.",
        "effect": "Relaciona estado fiscal en la consulta.",
        "boundary": "El estado fiscal no es un estado de trabajo de impresión.",
        "certainty": "code",
        "sources": [
          {
            "label": "DocumentoController: consulta del DTE y representación",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DocumentoController.js#L233-L305"
          }
        ]
      },
      {
        "id": "p05",
        "from": "p-pdf-controller",
        "to": "p-fiscal-providers",
        "label": "LEFT JOIN facturadores; lee slug",
        "protocol": "SQL",
        "detail": "Une facturadores.id con dtes.facturadore_id y obtiene el slug.",
        "effect": "Selecciona cómo construir la respuesta PDF.",
        "boundary": "No selecciona el driver ni el dispositivo físico.",
        "certainty": "code",
        "sources": [
          {
            "label": "DocumentoController: consulta del DTE y representación",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DocumentoController.js#L233-L305"
          }
        ]
      },
      {
        "id": "p06",
        "from": "p-pdf-controller",
        "to": "p-ui-pdf",
        "label": "Respuesta: PDF o referencia",
        "protocol": "HTTP",
        "detail": "Ingydev decodifica el contenido base64 y responde application/pdf; Acepta responde un objeto con data igual a la referencia/URL.",
        "effect": "Entrega representación según proveedor.",
        "boundary": "No se demuestra en esta arista una descarga posterior de la URL ni una impresión automática.",
        "certainty": "code",
        "sources": [
          {
            "label": "DocumentoController: consulta del DTE y representación",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DocumentoController.js#L233-L305"
          }
        ]
      },
      {
        "id": "p07",
        "from": "p-ui-print",
        "to": "p-print-controller",
        "label": "POST /Impresion/ImprimirDTE_Termica",
        "protocol": "HTTP",
        "detail": "apiImpresionIngydev concatena la URL de impresora configurada con ImprimirDTE_Termica. El receptor usa controller/action.",
        "effect": "Entrega configuración y columnas para un intento de impresión.",
        "boundary": "La URL cliente efectiva es configurable; el servicio revisado enlaza HTTP en loopback. No acreditar producción a partir del binding del código.",
        "certainty": "code",
        "sources": [
          {
            "label": "ImpresionService: selección de canal y petición HTTP",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresion.service.ts#L42-L145"
          },
          {
            "label": "ImprimirDTE_Termica: intento de impresión y respuesta",
            "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/Controllers/ImpresionController.cs#L49-L71"
          },
          {
            "label": "SelfHost HTTP y ruta controller/action",
            "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/ServiceImpresora.cs#L30-L50"
          }
        ]
      },
      {
        "id": "p08",
        "from": "p-print-controller",
        "to": "p-printer-helper",
        "label": "Configurar → LineaTexto_array → Imprimir",
        "protocol": "Interno",
        "detail": "El controlador crea PrinterHelper, carga configuración y líneas y llama Imprimir dentro de try/catch.",
        "effect": "Prepara la representación para el driver.",
        "boundary": "Una excepción se registra; el contrato HTTP de esta ruta no la convierte en error=true.",
        "certainty": "code",
        "sources": [
          {
            "label": "ImprimirDTE_Termica: intento de impresión y respuesta",
            "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/Controllers/ImpresionController.cs#L49-L71"
          }
        ]
      },
      {
        "id": "p09",
        "from": "p-printer-helper",
        "to": "p-print-document",
        "label": "PrintDocument.Print()",
        "protocol": "Interno",
        "detail": "El helper asigna PrinterSettings y PrintPage y ejecuta Print().",
        "effect": "Solicita impresión a la API Windows.",
        "boundary": "No se observa una consulta posterior de estado físico vinculada a un identificador de trabajo.",
        "certainty": "code",
        "sources": [
          {
            "label": "PrinterHelper.Imprimir: PrintDocument.Print",
            "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/Biblioteca/Helper/PrinterHelper.cs#L110-L125"
          }
        ]
      },
      {
        "id": "p10",
        "from": "p-print-document",
        "to": "p-device-windows",
        "label": "Entrega mediante driver / resultado por confirmar",
        "protocol": "Por confirmar",
        "detail": "La configuración identifica una impresora, pero no se auditó el driver, transporte ni hardware instalado.",
        "effect": "Intención de producir una copia física.",
        "boundary": "Esta flecha no demuestra llegada al dispositivo ni papel entregado; es el límite de la evidencia disponible.",
        "certainty": "unknown",
        "sources": [
          {
            "label": "PrinterHelper.Imprimir: PrintDocument.Print",
            "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/Biblioteca/Helper/PrinterHelper.cs#L110-L125"
          }
        ]
      },
      {
        "id": "p11",
        "from": "p-print-controller",
        "to": "p-ui-print",
        "label": "HTTP 200; error=false; imprimiendo",
        "protocol": "HTTP",
        "detail": "La respuesta se construye después del catch. En Angular el callback de éxito está vacío y la suscripción no equivale a espera de acuse físico.",
        "effect": "Devuelve aceptación HTTP aparente del intento.",
        "boundary": "Puede coexistir con una excepción registrada. Ni respuesta perdida ni 200 prueban respectivamente ausencia o presencia de papel.",
        "certainty": "code",
        "sources": [
          {
            "label": "ImprimirDTE_Termica: intento de impresión y respuesta",
            "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/Controllers/ImpresionController.cs#L49-L71"
          },
          {
            "label": "ImpresionService: selección de canal y petición HTTP",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresion.service.ts#L42-L145"
          }
        ]
      },
      {
        "id": "p12",
        "from": "p-ui-print",
        "to": "p-ui-epos",
        "label": "Variante epson-epos: conectarImpresora",
        "protocol": "Interno",
        "detail": "Solo al elegir slug_tipo_impresora epson-epos se llama al servicio directo con configuración y contenido.",
        "effect": "Selecciona un camino distinto del agente Windows.",
        "boundary": "Es alternativa de canal, no un paso posterior a la impresión Windows.",
        "certainty": "code",
        "sources": [
          {
            "label": "ImpresionService: selección de canal y petición HTTP",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresion.service.ts#L42-L145"
          }
        ]
      },
      {
        "id": "p13",
        "from": "p-ui-epos",
        "to": "p-sdk-epos",
        "label": "ePosDev.connect → createDevice",
        "protocol": "Interno",
        "detail": "El servicio conecta, crea el dispositivo y registra onreceive; expone respuesta mediante observable.",
        "effect": "Solicita conexión y recibe eventos del SDK.",
        "boundary": "La semántica del callback depende del SDK y dispositivo; no convertir success en confirmación física no verificada.",
        "certainty": "code",
        "sources": [
          {
            "label": "ImpresoraService: connect, createDevice y callback onreceive",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresora.service.ts#L68-L158"
          }
        ]
      },
      {
        "id": "p14",
        "from": "p-sdk-epos",
        "to": "p-device-epos",
        "label": "Conexión ePOS al destino configurado",
        "protocol": "Por confirmar",
        "detail": "El código invoca connect y createDevice; protocolo de transporte y perfil instalado no se acreditan en esta revisión.",
        "effect": "Interacción directa con dispositivo vía SDK.",
        "boundary": "No pasa por ImpresionController Windows. Capacidades de consulta y entrega física quedan por homologar.",
        "certainty": "unknown",
        "sources": [
          {
            "label": "ImpresoraService: connect, createDevice y callback onreceive",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresora.service.ts#L68-L158"
          }
        ]
      }
    ],
    "steps": [
      {
        "title": "1. Obtener representación fiscal, si se solicita",
        "detail": "La rama PDF consulta cuatro tablas de la misma PostgreSQL y devuelve bytes o referencia según el facturador.",
        "edges": [
          "p01",
          "p02",
          "p03",
          "p04",
          "p05",
          "p06"
        ],
        "boundary": "Esta consulta es independiente: no se presupone que toda impresión térmica necesite GET PDF."
      },
      {
        "title": "2. Elegir el canal API Windows",
        "detail": "En la variante apiImpresion, Angular construye el POST con contenido y configuración hacia el receptor térmico.",
        "edges": [
          "p07"
        ],
        "boundary": "El destino se configura; esta solicitud no vuelve a emitir el DTE."
      },
      {
        "title": "3. Adaptar contenido y solicitar impresión",
        "detail": "El controlador llama PrinterHelper y este ejecuta PrintDocument.Print() con los ajustes del driver.",
        "edges": [
          "p08",
          "p09"
        ],
        "boundary": "No hay prueba en estas llamadas de copia físicamente entregada."
      },
      {
        "title": "4. Interpretar respuesta y posible incertidumbre",
        "detail": "El salto a hardware no fue comprobado y el controlador puede responder 200/error=false después de una excepción.",
        "edges": [
          "p10",
          "p11"
        ],
        "boundary": "Un reintento tras respuesta perdida puede repetir una copia. Resolver impresión no exige emitir otro DTE."
      },
      {
        "title": "5. Ver la alternativa ePOS",
        "detail": "La configuración epson-epos usa ImpresoraService y su objeto SDK, con conexión y callbacks propios.",
        "edges": [
          "p12",
          "p13",
          "p14"
        ],
        "boundary": "Es una rama alternativa; no se encadena detrás de la API Windows ni se garantiza el mismo acuse."
      },
      {
        "title": "6. Conservar la distinción entre estados",
        "detail": "Comparar respuesta HTTP, retorno del sistema y señales del dispositivo para explicar lo que sigue desconocido.",
        "edges": [
          "p10",
          "p11",
          "p14"
        ],
        "boundary": "La evidencia actual no permite un estado uniforme de papel entregado; capacidades reales y binarios deben verificarse."
      }
    ]
  },
  {
    "id": "credit",
    "title": "Notas de crédito: consulta, marcas y consumo local",
    "mode": "current",
    "summary": "Tres recorridos de código relacionados: consultar NC por cliente, consultar o cambiar marcas de uso y guardar un pago con NC en la venta. Las flechas identifican métodos, tablas y rutas concretos; no forman una reserva corporativa atómica.",
    "boundary": "Lectura estática de commits fijados; main/master no confirman producción. La consulta remota y el fan-out a sucursales dependen de conectividad. MongoDB y PostgreSQL no comparten una transacción observada, y guardar consumo local no confirma recepción en AX.",
    "groups": [
      {
        "id": "credit-angular",
        "title": "Angular · PC de caja",
        "repo": "mountain-implementos/frontend",
        "runtime": "Angular / TypeScript",
        "zone": "terminal",
        "evidence": "Aplicación web usada en el PC de caja con Windows."
      },
      {
        "id": "credit-backend",
        "title": "Backend de sucursal",
        "repo": "mountain-implementos/backend",
        "runtime": "Node.js / AdonisJS",
        "zone": "branch",
        "evidence": "Métodos y llamadas leídos en código; ubicación de sucursal informada, instancia efectiva pendiente."
      },
      {
        "id": "credit-payments",
        "title": "API de consulta de pagos",
        "repo": "api-pagos-caja",
        "runtime": "Node.js / Express",
        "zone": "central",
        "evidence": "Componente central; receptores y acceso multibase observados. Host, despliegue y puerto efectivos pendientes."
      },
      {
        "id": "credit-mongo",
        "title": "MongoDB · conexión lógica dbCaja",
        "repo": "api-pagos-caja/models",
        "runtime": "MongoDB / Mongoose",
        "zone": "unknown",
        "evidence": "Colecciones físicas explícitas en tercer argumento de model(); servidor y base efectivos no publicados ni verificados."
      },
      {
        "id": "credit-pg",
        "title": "PostgreSQL · sucursal y sucursales consultadas",
        "repo": "Mountain / api-pagos-caja",
        "runtime": "PostgreSQL / Lucid / pg",
        "zone": "branch",
        "evidence": "Agrupa instancias distintas por función; no representa una base única. SQL sin esquema calificado, resolución por conexión/search_path pendiente."
      },
      {
        "id": "credit-remote",
        "title": "Dependencias y consumidores por identificar",
        "repo": "Receptor y callers no reconstruidos",
        "runtime": "Contrato HTTP observado; runtime pendiente",
        "zone": "unknown",
        "evidence": "Se distingue llamada saliente comprobada de receptor o consumidor aún no identificado."
      }
    ],
    "nodes": [
      {
        "id": "c-ui-nc",
        "group": "credit-angular",
        "title": "NotaCreditoService.obtenerNotaCreditoPagoCliente",
        "kind": "component",
        "subtitle": "Consulta NC por cliente",
        "detail": "Envía el cuerpo recibido al backend. Esta entrada llama a buscar(); no dispara por sí sola los POST/PUT de estadoNC.",
        "sources": [
          {
            "label": "frontend/src/app/services/nota-credito.service.ts:40–49",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/nota-credito.service.ts#L40-L49"
          }
        ]
      },
      {
        "id": "c-ui-sale",
        "group": "credit-angular",
        "title": "PuntoDeVentaService",
        "kind": "component",
        "subtitle": "Registro de venta / pagos",
        "detail": "Envía POST /punto-de-venta. La rama C representa solamente el guardado condicionado a que el pago recibido incluya notaDeCreditoExterna.",
        "sources": [
          {
            "label": "frontend/src/app/services/punto-de-venta.service.ts:388–399",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/punto-de-venta.service.ts#L388-L399"
          }
        ]
      },
      {
        "id": "c-nc-controller",
        "group": "credit-backend",
        "title": "NotaDeCreditoAxController",
        "kind": "component",
        "subtitle": "buscar / CompruebaSaldoNc / EstadoNC",
        "detail": "buscar combina servicio remoto, consumos y devoluciones locales, y pagos de otras sucursales. EstadoNC se usa en otros recorridos por folio/devolución. Son métodos diferentes dentro del mismo controlador.",
        "sources": [
          {
            "label": "backend/app/Controllers/Http/NotaDeCreditoAxController.js:30–95",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L30-L95"
          },
          {
            "label": "backend/app/Controllers/Http/NotaDeCreditoAxController.js:428–500",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L428-L500"
          }
        ]
      },
      {
        "id": "c-sale-controller",
        "group": "credit-backend",
        "title": "PuntoDeVentaController._guardarComprobante",
        "kind": "component",
        "subtitle": "Guardar comprobante y pagos",
        "detail": "En create, guarda comprobante y llama a ComprobanteVentaService para limpiar/vincular pagos antes del commit de venta. Se muestra el tramo NC, sin reconstituir toda la facturación.",
        "sources": [
          {
            "label": "backend/app/Controllers/Http/PuntoDeVentaController.js:151–175",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L151-L175"
          },
          {
            "label": "backend/app/Controllers/Http/PuntoDeVentaController.js:368–418",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L368-L418"
          }
        ]
      },
      {
        "id": "c-payment-save",
        "group": "credit-backend",
        "title": "ComprobanteVentaService.guardaPagos",
        "kind": "component",
        "subtitle": "Delega en PagoService.guardarPagos / _guardarNC",
        "detail": "Guarda pagos, luego vínculo al comprobante; PagoService relaciona la NC externa mediante pago_id cuando llega en el payload. La propagación completa de trx requiere prueba de la versión efectiva de Lucid.",
        "sources": [
          {
            "label": "backend/app/Services/ComprobanteVentaService.js:105–133",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L105-L133"
          },
          {
            "label": "backend/app/Services/PagoService.js:59–100",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L59-L100"
          },
          {
            "label": "backend/app/Services/PagoService.js:134–145",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L134-L145"
          }
        ]
      },
      {
        "id": "c-api-controller",
        "group": "credit-payments",
        "title": "pagosController",
        "kind": "component",
        "subtitle": "Pendientes y rutas estadoNC",
        "detail": "obtenerPagosPendientesSincronizar valida rut/dv y delega al servicio. Los handlers de estadoNC consultan o modifican otra colección y son entradas HTTP separadas.",
        "sources": [
          {
            "label": "controllers/pagosController.js:23–94",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L23-L94"
          },
          {
            "label": "routes/pagos.js:5–12",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L5-L12"
          },
          {
            "label": "app.js:58–58",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/app.js#L58"
          }
        ]
      },
      {
        "id": "c-api-service",
        "group": "credit-payments",
        "title": "pagosService.procesarConsultaPendientesSincronizar",
        "kind": "component",
        "subtitle": "Fan-out a PostgreSQL de sucursales",
        "detail": "Lee directorio activo de MongoDB, consulta sucursales y devuelve datos y errores separados. No garantiza una vista completa ni una foto consistente corporativa.",
        "sources": [
          {
            "label": "services/pagosService.js:326–353",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L326-L353"
          },
          {
            "label": "services/pagosService.js:111–140",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L111-L140"
          }
        ]
      },
      {
        "id": "c-directory",
        "group": "credit-mongo",
        "title": "cajaSucursales",
        "kind": "table",
        "subtitle": "Colección MongoDB explícita",
        "detail": "Directorio de sucursales y configuración de conexión. Se consultan las activas para resolver destinos; la colección no replica pagos ni inicia conexiones por sí misma.",
        "sources": [
          {
            "label": "models/cajaSucursales.model.js:22–26",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/models/cajaSucursales.model.js#L22-L26"
          },
          {
            "label": "services/pagosService.js:326–353",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L326-L353"
          }
        ]
      },
      {
        "id": "c-state",
        "group": "credit-mongo",
        "title": "estadoNC",
        "kind": "table",
        "subtitle": "Colección MongoDB explícita",
        "detail": "Marca por folio/origen, con estados enuso/disponible. GET filtra folio; POST y PUT realizan búsqueda y guardado separados. No equivale a reservar de forma atómica un saldo monetario.",
        "sources": [
          {
            "label": "models/estadoNC.model.js:4–28",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/models/estadoNC.model.js#L4-L28"
          },
          {
            "label": "controllers/pagosController.js:23–77",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L23-L77"
          }
        ]
      },
      {
        "id": "c-local-pending",
        "group": "credit-pg",
        "title": "nota_de_credito_externas + pagos / devoluciones + detalle_devoluciones",
        "kind": "table",
        "subtitle": "Dos lecturas locales distintas",
        "detail": "Primer bloque: NC con sincronizado=0 y relación pago. Segundo bloque: devoluciones con sincronizacion_confirmada=0 y su detalle. No es un único JOIN de cuatro tablas ni una reserva nueva.",
        "sources": [
          {
            "label": "backend/app/Controllers/Http/NotaDeCreditoAxController.js:795–833",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L795-L833"
          },
          {
            "label": "backend/app/Models/NotaDeCreditoExterna.js:6–18",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Models/NotaDeCreditoExterna.js#L6-L18"
          }
        ]
      },
      {
        "id": "c-stores-join",
        "group": "credit-pg",
        "title": "comprobante_ventas + pagos + nota_de_credito_externas",
        "kind": "table",
        "subtitle": "JOIN de cada sucursal; 13 tablas físicas",
        "detail": "SELECT sobre comprobante_ventas, comprobante_venta_has_documentos, documentos, dtes, empresas, personas, tipo_documentos, pago_comprobante_ventas, pagos, estado_pagos, caja_has_forma_pagos, forma_pagos y nota_de_credito_externas. Filtra venta finalizada, pago aprobado, forma nota-de-credito y cv.sincronizado=false.",
        "sources": [
          {
            "label": "services/pagosService.js:78–109",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L78-L109"
          }
        ]
      },
      {
        "id": "c-local-consume",
        "group": "credit-pg",
        "title": "pagos + pago_comprobante_ventas + nota_de_credito_externas",
        "kind": "table",
        "subtitle": "Guardado local del pago con NC",
        "detail": "Son tablas físicas agrupadas por el tramo de escritura. pagos y nota_de_credito_externas también aparecen en la lectura local: no son copias ni bases adicionales. Guardar el uso local no prueba una marca Mongo previa ni aceptación de AX.",
        "sources": [
          {
            "label": "backend/app/Services/PagoService.js:59–100",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L59-L100"
          },
          {
            "label": "backend/app/Services/PagoService.js:134–145",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L134-L145"
          },
          {
            "label": "backend/app/Services/ComprobanteVentaService.js:105–133",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L105-L133"
          },
          {
            "label": "services/pagosService.js:98–109",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L98-L109"
          }
        ]
      },
      {
        "id": "c-remote-nc",
        "group": "credit-remote",
        "title": "Servicio configurado buscarNotasCredito",
        "kind": "external",
        "subtitle": "Receptor efectivo pendiente",
        "detail": "El controlador concatena URL_API_CAJA con buscarNotasCredito y hace POST. No se atribuyen runtime, servidor, ruta base ni tablas internas del receptor.",
        "sources": [
          {
            "label": "backend/app/Controllers/Http/NotaDeCreditoAxController.js:30–55",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L30-L55"
          }
        ]
      },
      {
        "id": "c-marker-caller",
        "group": "credit-remote",
        "title": "Consumidor de POST / PUT estadoNC",
        "kind": "external",
        "subtitle": "Caller aún no identificado",
        "detail": "Los receptores existen en api-pagos-caja; no se ha reconstruido inequívocamente quién los invoca ni si pertenecen al mismo flujo de la caja.",
        "sources": [
          {
            "label": "routes/pagos.js:10–12",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L10-L12"
          },
          {
            "label": "controllers/pagosController.js:34–77",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L34-L77"
          }
        ]
      }
    ],
    "edges": [
      {
        "id": "c01",
        "from": "c-ui-nc",
        "to": "c-nc-controller",
        "label": "POST /nota-de-credito/por-cliente",
        "protocol": "HTTP",
        "detail": "El servicio Angular envía la consulta; la ruta del backend asigna NotaDeCreditoAxController.buscar.",
        "effect": "Inicia consulta de NC.",
        "boundary": "Comunicación UI→backend de sucursal; existencia de ruta no confirma disponibilidad desplegada.",
        "certainty": "code",
        "sources": [
          {
            "label": "frontend/src/app/services/nota-credito.service.ts:40–49",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/nota-credito.service.ts#L40-L49"
          },
          {
            "label": "backend/start/routes.js:397–398",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L397-L398"
          }
        ]
      },
      {
        "id": "c02",
        "from": "c-nc-controller",
        "to": "c-remote-nc",
        "label": "POST …/buscarNotasCredito",
        "protocol": "HTTP",
        "detail": "Llamada observada a URL_API_CAJA + buscarNotasCredito. El prefijo efectivo procede de configuración; la elipsis evita inventar una ruta base.",
        "effect": "Obtiene respuesta de NC remotas para combinarla con datos locales.",
        "boundary": "Dependencia remota; receptor y contrato completos por verificar. No se infieren escrituras ni tablas AX.",
        "certainty": "code",
        "sources": [
          {
            "label": "backend/app/Controllers/Http/NotaDeCreditoAxController.js:30–55",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L30-L55"
          }
        ]
      },
      {
        "id": "c03",
        "from": "c-nc-controller",
        "to": "c-local-pending",
        "label": "SELECT pendientes locales",
        "protocol": "SQL",
        "detail": "Consulta NC no sincronizadas con su pago y, por separado, devoluciones no confirmadas con detalle. Ajusta por id_externo/RecId.",
        "effect": "Lee consumos/devoluciones y calcula ajuste local de saldo.",
        "boundary": "Leer pendientes no constituye reserva exclusiva. No se prefija public a tablas sin esquema explícito.",
        "certainty": "code",
        "sources": [
          {
            "label": "backend/app/Controllers/Http/NotaDeCreditoAxController.js:795–833",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L795-L833"
          },
          {
            "label": "backend/app/Controllers/Http/NotaDeCreditoAxController.js:77–95",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L77-L95"
          }
        ]
      },
      {
        "id": "c04",
        "from": "c-nc-controller",
        "to": "c-api-controller",
        "label": "GET /api/pagos/pagosSinSinc",
        "protocol": "HTTP",
        "detail": "CompruebaSaldoNc llama al suffix /pagosSinSinc con rut/dv mediante APIFallbackManager; api-pagos declara ese GET bajo /api/pagos. La base configurada determina el enlace efectivo.",
        "effect": "Recibe datos y errores de la consulta de sucursales; el helper de Mountain agrega por folio y excluye su sucursal si conoce su nombre.",
        "boundary": "Puede haber resultados parciales. El fallback cachea por endpoint sin rut/dv: un resultado cacheado no demuestra saldo de este cliente ni dato vigente.",
        "certainty": "code",
        "sources": [
          {
            "label": "backend/app/Controllers/Http/NotaDeCreditoAxController.js:447–466",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L447-L466"
          },
          {
            "label": "backend/app/Controllers/Http/NotaDeCreditoAxController.js:847–864",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L847-L864"
          },
          {
            "label": "backend/app/Services/api-fallback-manager.js:7–94",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/api-fallback-manager.js#L7-L94"
          },
          {
            "label": "routes/pagos.js:5–12",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L5-L12"
          },
          {
            "label": "app.js:58–58",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/app.js#L58"
          }
        ]
      },
      {
        "id": "c05",
        "from": "c-api-controller",
        "to": "c-api-service",
        "label": "obtenerPagosPendientesSincronizar → procesarConsultaPendientesSincronizar",
        "protocol": "Interno",
        "detail": "Valida presencia de rut/dv, ejecuta el servicio y devuelve su resultado.",
        "effect": "Inicia consultas a las sucursales activas.",
        "boundary": "No introduce una transacción distribuida ni convierte errores parciales en confirmación de completitud.",
        "certainty": "code",
        "sources": [
          {
            "label": "controllers/pagosController.js:80–94",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L80-L94"
          },
          {
            "label": "services/pagosService.js:326–353",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L326-L353"
          }
        ]
      },
      {
        "id": "c06",
        "from": "c-api-service",
        "to": "c-directory",
        "label": "Mongoose find · sucursales activas",
        "protocol": "MongoDB",
        "detail": "La operación Mongoose find contra la colección explícita cajaSucursales selecciona sucursales activas; con sus resultados, el servicio abre conexiones PostgreSQL a los destinos. Servidor y despliegue efectivos no auditados.",
        "effect": "Lee directorio de conexiones y decide destinos del fan-out.",
        "boundary": "El directorio puede incluir la sucursal solicitante; el filtrado del propio local se hace después cuando el backend conoce su nombre. No se exponen valores de conexión.",
        "certainty": "code",
        "sources": [
          {
            "label": "services/pagosService.js:326–353",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L326-L353"
          },
          {
            "label": "models/cajaSucursales.model.js:22–26",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/models/cajaSucursales.model.js#L22-L26"
          },
          {
            "label": "backend/app/Controllers/Http/NotaDeCreditoAxController.js:847–864",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L847-L864"
          }
        ]
      },
      {
        "id": "c07",
        "from": "c-api-service",
        "to": "c-stores-join",
        "label": "SELECT por rut/dv · venta final / NC aprobada",
        "protocol": "SQL",
        "detail": "Consulta parametrizada con cv.sincronizado=false, cv.venta_finalizada=true, pago aprobado y forma nota-de-credito. Cada sucursal puede responder o fallar por separado.",
        "effect": "Lee pagos NC visibles en ese conjunto y devuelve datos/errores.",
        "boundary": "cv.sincronizado puede pasar a true al preparar mensajes, antes del envío y confirmación de AX; salir del conjunto no prueba recepción ERP. No se ha demostrado doble uso en producción.",
        "certainty": "code",
        "sources": [
          {
            "label": "services/pagosService.js:78–140",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L78-L140"
          },
          {
            "label": "services/pagosService.js:326–353",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L326-L353"
          },
          {
            "label": "app/Services/SyncUpload/PagoFacturaSyncUploadService.js:20–72",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/PagoFacturaSyncUploadService.js#L20-L72"
          }
        ]
      },
      {
        "id": "c08",
        "from": "c-nc-controller",
        "to": "c-api-controller",
        "label": "GET /api/pagos/estadoNC?folio=…",
        "protocol": "HTTP",
        "detail": "EstadoNC llama al suffix /estadoNC; ValidaPanelDevoluciones lo utiliza en otros métodos por folio y filtra origen omni. buscar() de /por-cliente no llama a este método.",
        "effect": "Lee marcas de uso por folio.",
        "boundary": "Rama B independiente de la consulta por cliente. GET no adquiere una reserva ni asegura propiedad del folio.",
        "certainty": "code",
        "sources": [
          {
            "label": "backend/app/Controllers/Http/NotaDeCreditoAxController.js:112–132",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L112-L132"
          },
          {
            "label": "backend/app/Controllers/Http/NotaDeCreditoAxController.js:428–443",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L428-L443"
          },
          {
            "label": "backend/app/Controllers/Http/NotaDeCreditoAxController.js:472–500",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L472-L500"
          },
          {
            "label": "controllers/pagosController.js:23–32",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L23-L32"
          },
          {
            "label": "routes/pagos.js:10–12",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L10-L12"
          },
          {
            "label": "app.js:58–58",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/app.js#L58"
          }
        ]
      },
      {
        "id": "c09",
        "from": "c-marker-caller",
        "to": "c-api-controller",
        "label": "POST /api/pagos/estadoNC · PUT /api/pagos/estadoNC/:folio/:origen",
        "protocol": "HTTP",
        "detail": "Receptores declarados: POST pone en uso o crea; PUT cambia a disponible. La flecha representa entradas posibles de un caller no identificado, no llamadas observadas desde /por-cliente.",
        "effect": "Solicita cambiar la marca Mongo.",
        "boundary": "Certeza desconocida del caller y del encadenamiento; implementación receptora sí leída. No interpretar estas entradas como pasos automáticos previos y posteriores a cada venta.",
        "certainty": "unknown",
        "sources": [
          {
            "label": "routes/pagos.js:10–12",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L10-L12"
          },
          {
            "label": "app.js:58–58",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/app.js#L58"
          },
          {
            "label": "controllers/pagosController.js:34–77",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L34-L77"
          }
        ]
      },
      {
        "id": "c10",
        "from": "c-api-controller",
        "to": "c-state",
        "label": "Mongoose find / findOne / save",
        "protocol": "MongoDB",
        "detail": "GET busca por folio; POST busca folio/origen y guarda enuso o crea; PUT busca folio/origen y guarda disponible. Son operaciones Mongoose contra la colección explícita estadoNC; servidor y despliegue efectivos no auditados.",
        "effect": "Lee o modifica estadoNC según la ruta que haya recibido.",
        "boundary": "No hay una comparación atómica de propietario/intento/versión. POST continúa tras responder si existe; PUT continúa tras responder si no existe. No es un ledger monetario ni transacción común con PostgreSQL.",
        "certainty": "code",
        "sources": [
          {
            "label": "controllers/pagosController.js:23–77",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L23-L77"
          },
          {
            "label": "models/estadoNC.model.js:4–28",
            "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/models/estadoNC.model.js#L4-L28"
          }
        ]
      },
      {
        "id": "c11",
        "from": "c-ui-sale",
        "to": "c-sale-controller",
        "label": "POST /punto-de-venta",
        "protocol": "HTTP",
        "detail": "La UI envía datos de venta y pagos. Dentro de create, _guardarComprobante conduce al guardado de los pagos recibidos.",
        "effect": "Inicia el guardado local de venta; esta rama aplica cuando llega notaDeCreditoExterna.",
        "boundary": "Rama C separada: no se ha demostrado que esta petición invoque las mutaciones de estadoNC.",
        "certainty": "code",
        "sources": [
          {
            "label": "frontend/src/app/services/punto-de-venta.service.ts:388–399",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/punto-de-venta.service.ts#L388-L399"
          },
          {
            "label": "backend/start/routes.js:113–113",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L113"
          },
          {
            "label": "backend/app/Controllers/Http/PuntoDeVentaController.js:151–175",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L151-L175"
          },
          {
            "label": "backend/app/Controllers/Http/PuntoDeVentaController.js:368–418",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L368-L418"
          }
        ]
      },
      {
        "id": "c12",
        "from": "c-sale-controller",
        "to": "c-payment-save",
        "label": "guardaPagos → PagoService.guardarPagos",
        "protocol": "Interno",
        "detail": "_guardarComprobante llama a limpiaPagos y guardaPagos. El servicio delega guardado de pagos y crea el vínculo con el comprobante.",
        "effect": "Prepara persistencia de pago y NC recibida.",
        "boundary": "No realiza por sí mismo un cargo bancario, una devolución de dinero ni una confirmación de saldo global.",
        "certainty": "code",
        "sources": [
          {
            "label": "backend/app/Controllers/Http/PuntoDeVentaController.js:411–418",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L411-L418"
          },
          {
            "label": "backend/app/Services/ComprobanteVentaService.js:105–133",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L105-L133"
          }
        ]
      },
      {
        "id": "c13",
        "from": "c-payment-save",
        "to": "c-local-consume",
        "label": "findOrCreate / merge / save · pago + NC + vínculo",
        "protocol": "SQL",
        "detail": "PagoService guarda pagos y, si existe notaDeCreditoExterna, llama a _guardarNC y relaciona por pago_id; ComprobanteVentaService persiste el vínculo. Son operaciones de modelos sobre las tablas agrupadas.",
        "effect": "Registra localmente el uso de NC como pago.",
        "boundary": "Se pasa trx en operaciones principales, pero el save del vínculo sin argumento y la firma particular del save de NC requieren prueba de participación real en Lucid. No certificar atomicidad uniforme ni fuga cierta sin esa prueba; no hay commit común con Mongo/AX.",
        "certainty": "code",
        "sources": [
          {
            "label": "backend/app/Services/PagoService.js:59–100",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L59-L100"
          },
          {
            "label": "backend/app/Services/PagoService.js:134–145",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L134-L145"
          },
          {
            "label": "backend/app/Services/ComprobanteVentaService.js:105–133",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L105-L133"
          }
        ]
      }
    ],
    "steps": [
      {
        "title": "1. Consultar NC por cliente",
        "detail": "Angular llama a buscar; el backend obtiene NC remotas y lee pendientes locales. Son lecturas para calcular el saldo mostrado, sin adquirir exclusión de uso.",
        "edges": [
          "c01",
          "c02",
          "c03"
        ],
        "boundary": "Servicio remoto y PostgreSQL local son autoridades distintas; no se demuestra disponibilidad offline de la consulta completa."
      },
      {
        "title": "2. Consultar otras sucursales",
        "detail": "El backend pide pagos NC pendientes. API pagos resuelve sucursales en cajaSucursales y consulta sus PostgreSQL, devolviendo datos y errores.",
        "edges": [
          "c04",
          "c05",
          "c06",
          "c07"
        ],
        "boundary": "La información puede ser parcial; cachear solo por endpoint puede mezclar resultados de diferentes parámetros durante fallback."
      },
      {
        "title": "3. Interpretar el desfase de sincronización",
        "detail": "El SELECT exige cv.sincronizado=false. Sync puede cambiar esa marca al preparar mensajes antes de enviarlos a AX; el pago deja de aparecer sin que ello pruebe confirmación ERP.",
        "edges": [
          "c07"
        ],
        "boundary": "Esta ventana es un riesgo de cobertura del conjunto consultado, no evidencia de doble uso efectivo de NC."
      },
      {
        "title": "4. Leer o cambiar marcas: otra rama",
        "detail": "Otros métodos por folio consultan estadoNC. Los POST/PUT existen, pero su caller no está identificado. Las operaciones de la colección no se encadenan aquí a /por-cliente.",
        "edges": [
          "c08",
          "c09",
          "c10"
        ],
        "boundary": "Una marca enuso/disponible no prueba una reserva de importe atómica ni propiedad de la operación."
      },
      {
        "title": "5. Recibir un pago con NC en la venta",
        "detail": "POST /punto-de-venta llega a _guardarComprobante y guardaPagos. La NC externa se procesa si viene incluida en el pago recibido.",
        "edges": [
          "c11",
          "c12"
        ],
        "boundary": "No se deduce que guardar el pago invoque primero POST estadoNC ni que después invoque PUT."
      },
      {
        "title": "6. Persistir consumo local y conservar límites",
        "detail": "PagoService guarda pago y NC por pago_id; ComprobanteVentaService vincula el pago al comprobante. Se muestran tablas concretas de la sucursal.",
        "edges": [
          "c13"
        ],
        "boundary": "Participación uniforme en trx por validar. Este guardado no confirma emisión fiscal, cargo bancario ni aceptación de AX, y no comparte transacción con las marcas Mongo."
      }
    ]
  }
];

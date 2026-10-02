/* Static component interactions; evidence pinned to Git snapshots. */
window.POS_INTERACTIONS_CURRENT = [
  {
    "id": "sale",
    "title": "Venta: pantalla, guardado local y emisión fiscal",
    "mode": "current",
    "summary": "Angular consulta el producto/precio y envía la venta. El backend guarda la operación, confirma su transacción y después solicita el DTE cuando corresponde.",
    "boundary": "Ruta habitual de guardado, con consultas previas relacionadas. No ejecuta el cargo bancario ni registra en AX: esos efectos tienen recorridos propios. No certifica toda propagación de trx ni una venta completa offline.",
    "groups": [
      {
        "id": "group-frontend",
        "title": "Mountain · interfaz de caja",
        "repo": "mountain-implementos/frontend",
        "runtime": "Angular 8 / TypeScript",
        "zone": "PC de caja · Windows"
      },
      {
        "id": "group-backend",
        "title": "Mountain · backend de sucursal",
        "repo": "mountain-implementos/backend",
        "runtime": "AdonisJS / Node.js",
        "zone": "Servidor de sucursal"
      },
      {
        "id": "group-postgres",
        "title": "PostgreSQL de sucursal",
        "repo": "Modelos y consultas de Mountain",
        "runtime": "PostgreSQL",
        "zone": "Sucursal · instancia efectiva por confirmar",
        "evidence": "Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia."
      },
      {
        "id": "group-pricing",
        "title": "Servicio de precios configurado",
        "repo": "Consumidor en Mountain; binding pendiente",
        "runtime": "Receptor efectivo por confirmar",
        "zone": "Dependencia remota; ubicación pendiente",
        "evidence": "Llamada verificada; no se identifica el servidor productivo solo por su firma."
      },
      {
        "id": "group-fiscal",
        "title": "Servicios fiscales configurables",
        "repo": "Adaptadores en Mountain; proveedor externo",
        "runtime": "HTTP / SOAP",
        "zone": "Fuera del backend POS; local/central/proveedor pendiente",
        "evidence": "Acepta e Ingydev son alternativas del selector; no se invocan ambos para la misma emisión."
      }
    ],
    "nodes": [
      {
        "id": "products-ui",
        "group": "group-frontend",
        "title": "ProductosService",
        "kind": "component",
        "subtitle": "Solicitud de producto con contexto",
        "detail": "Consulta el backend al cargar producto; el maestro local no convierte el cálculo de precio en local.",
        "sources": [
          {
            "label": "Angular: consulta de producto",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/productos.service.ts#L14-L28"
          },
          {
            "label": "ProductoController: receptor",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/ProductoController.js#L135-L165"
          }
        ]
      },
      {
        "id": "sale-ui",
        "group": "group-frontend",
        "title": "PuntoDeVentaService",
        "kind": "component",
        "subtitle": "Solicitud de guardado",
        "detail": "Envía la venta y recibe el resultado. Un error final no demuestra que no se guardó.",
        "sources": [
          {
            "label": "Angular: POST de venta",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/punto-de-venta.service.ts#L388-L399"
          },
          {
            "label": "Controlador: commit antes de facturar",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L151-L202"
          }
        ]
      },
      {
        "id": "product-controller",
        "group": "group-backend",
        "title": "ProductoController → ProductosService",
        "kind": "component",
        "subtitle": "Lectura y cálculo de producto",
        "detail": "Coordina información del producto y llama a PreciosImplementosServices para el precio activo.",
        "sources": [
          {
            "label": "ProductoController: receptor",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/ProductoController.js#L135-L165"
          },
          {
            "label": "ProductosService: cálculo activo",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ProductosService.js#L134-L205"
          }
        ]
      },
      {
        "id": "sale-controller",
        "group": "group-backend",
        "title": "PuntoDeVentaController",
        "kind": "component",
        "subtitle": "Documento, impuestos y transacción",
        "detail": "Coordina guardados, invoca ImpuestosService y hace commit antes de verificar cobranza y solicitar facturación.",
        "sources": [
          {
            "label": "Controlador: commit antes de facturar",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L151-L202"
          },
          {
            "label": "Guardado de comprobante, documentos y vínculos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L309-L418"
          },
          {
            "label": "Lectura de líneas e impuestos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ImpuestosService.js#L17-L62"
          }
        ]
      },
      {
        "id": "receipt-payment",
        "group": "group-backend",
        "title": "_guardarComprobante → servicios de pago",
        "kind": "component",
        "subtitle": "Helper del controlador y servicios internos",
        "detail": "PuntoDeVentaController._guardarComprobante escribe comprobante/vínculos documentales y llama a ComprobanteVentaService.guardaPagos y PagoService. Guardar el dato de un pago no ejecuta una autorización en Transbank.",
        "sources": [
          {
            "label": "Guardado de comprobante, documentos y vínculos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L309-L418"
          },
          {
            "label": "Guardar pagos recibidos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L59-L100"
          },
          {
            "label": "Vínculos pago/comprobante",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L105-L133"
          }
        ]
      },
      {
        "id": "fiscal-service",
        "group": "group-backend",
        "title": "ComprobanteVentaService → FacturacionService",
        "kind": "component",
        "subtitle": "Documento fiscal después del commit",
        "detail": "Relee documentos/DTE y selecciona proveedor. Preparación, respuesta fiscal y estados de negocio son escrituras posteriores.",
        "sources": [
          {
            "label": "Comprobante: relectura y fallo fiscal",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L209-L248"
          },
          {
            "label": "Preparación, solicitud y resultado fiscal",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L295-L399"
          },
          {
            "label": "Selección Acepta/Ingydev",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L403-L414"
          }
        ]
      },
      {
        "id": "documents",
        "group": "group-postgres",
        "title": "documentos · detalle_documentos",
        "kind": "table",
        "subtitle": "Cabecera y líneas",
        "detail": "Crea/actualiza documento y reemplaza líneas; impuestos pueden modificar importes. Más tarde actualiza el estado documental. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Documento y líneas con trx",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L586-L669"
          },
          {
            "label": "Lectura de líneas e impuestos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ImpuestosService.js#L17-L62"
          },
          {
            "label": "Estado documental después de facturar",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DocumentoService.js#L397-L434"
          }
        ]
      },
      {
        "id": "taxes",
        "group": "group-postgres",
        "title": "documentos_has_impuestos",
        "kind": "table",
        "subtitle": "Impuestos del documento",
        "detail": "ImpuestosService lee líneas y relaciones productos/producto_impuestos/impuestos y reemplaza los impuestos del documento. No administra stock. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Lectura de líneas e impuestos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ImpuestosService.js#L17-L62"
          },
          {
            "label": "Nombre documentos_has_impuestos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DocumentoService.js#L161-L174"
          }
        ]
      },
      {
        "id": "receipts",
        "group": "group-postgres",
        "title": "comprobante_ventas · comprobante_venta_has_documentos",
        "kind": "table",
        "subtitle": "Comprobante y vínculos",
        "detail": "Dos tablas relacionadas. venta_finalizada y el estado fiscal no prueban registro en AX. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Guardado de comprobante, documentos y vínculos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L309-L418"
          },
          {
            "label": "Comprobante: relectura y fallo fiscal",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L209-L248"
          }
        ]
      },
      {
        "id": "payments",
        "group": "group-postgres",
        "title": "pagos · pago_comprobante_ventas",
        "kind": "table",
        "subtitle": "Pago recibido y vínculo al comprobante",
        "detail": "Tablas del guardado local. Las ramas de NC tienen particularidades de transacción; no se acredita atomicidad universal. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Guardar pagos recibidos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L59-L100"
          },
          {
            "label": "Vínculos pago/comprobante",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L105-L133"
          }
        ]
      },
      {
        "id": "dtes",
        "group": "group-postgres",
        "title": "dtes",
        "kind": "table",
        "subtitle": "Preparación y resultado fiscal",
        "detail": "Se intenta guardar estado antes y después de solicitar emisión. _guardarEstadoDte captura errores, por lo que invocarlo no prueba persistencia. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Preparación, solicitud y resultado fiscal",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L295-L399"
          },
          {
            "label": "dtes: persistencia con catch local",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L463-L485"
          },
          {
            "label": "Migración: tabla dtes",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/database/migrations/1635954728771_dtes_schema.js#L6-L16"
          }
        ]
      },
      {
        "id": "price-api",
        "group": "group-pricing",
        "title": "Endpoint URL_API_PRECIOS",
        "kind": "external",
        "subtitle": "URL completa configurable",
        "detail": "Recibe RUT, SKU, cantidad, sucursal y usuario. La implementación activa no queda demostrada por encontrar ApiPrecios .NET.",
        "sources": [
          {
            "label": "Precio remoto y contexto",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Precios/PreciosImplementosServices.js#L12-L56"
          },
          {
            "label": "Aplicaciones, rutas y topología pendiente",
            "url": "../docs/catalogo-integraciones-actuales.md"
          }
        ]
      },
      {
        "id": "acepta",
        "group": "group-fiscal",
        "title": "Servicio Acepta configurado",
        "kind": "external",
        "subtitle": "Publicación fiscal HTTP",
        "detail": "La URL completa proviene de configuración. Ubicación y capacidades de consulta/contingencia requieren validación.",
        "sources": [
          {
            "label": "Acepta: POST a URL configurada",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionAceptaService.js#L672-L724"
          },
          {
            "label": "Selección Acepta/Ingydev",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L403-L414"
          }
        ]
      },
      {
        "id": "ingydev",
        "group": "group-fiscal",
        "title": "Servicio Ingydev configurado",
        "kind": "external",
        "subtitle": "Emisión SOAP/XML",
        "detail": "Alternativa del selector fiscal, con origen omitido y path observado. Un error de transporte no prueba ausencia de emisión.",
        "sources": [
          {
            "label": "Ingydev: petición SOAP",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionIngydevService.js#L402-L448"
          },
          {
            "label": "Ingydev: path del servicio",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionIngydevService.js#L17"
          },
          {
            "label": "Selección Acepta/Ingydev",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L403-L414"
          }
        ]
      }
    ],
    "edges": [
      {
        "id": "product-request",
        "from": "products-ui",
        "to": "product-controller",
        "label": "GET /Productos/:id",
        "protocol": "HTTP",
        "detail": "La interfaz pide producto con contexto comercial; el controlador delega en ProductosService.",
        "effect": "Lectura y cálculo; no guarda la venta.",
        "boundary": "Es una consulta previa relacionada, no parte de la transacción de venta.",
        "certainty": "code",
        "sources": [
          {
            "label": "Angular: consulta de producto",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/productos.service.ts#L14-L28"
          },
          {
            "label": "ProductoController: receptor",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/ProductoController.js#L135-L165"
          },
          {
            "label": "ProductosService: cálculo activo",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ProductosService.js#L134-L205"
          }
        ]
      },
      {
        "id": "price-request",
        "from": "product-controller",
        "to": "price-api",
        "label": "GET ${URL_API_PRECIOS}",
        "protocol": "HTTP",
        "detail": "PreciosImplementosServices envía rut, sku, cantidad, sucursal y usuario.",
        "effect": "Obtiene el precio remoto o un resultado de error.",
        "boundary": "URL efectiva pendiente. El fallo puede impedir abrir pago; no hay equivalencia offline demostrada.",
        "certainty": "code",
        "sources": [
          {
            "label": "Precio remoto y contexto",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Precios/PreciosImplementosServices.js#L12-L56"
          },
          {
            "label": "UI: error de precio impide abrir pago",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/modules/pos/components/pos-botones/pos-botones.component.ts#L415-L457"
          }
        ]
      },
      {
        "id": "sale-request",
        "from": "sale-ui",
        "to": "sale-controller",
        "label": "POST /punto-de-venta",
        "protocol": "HTTP",
        "detail": "Envía documentos y pagos recibidos al controlador de sucursal.",
        "effect": "Inicia el procesamiento local y su transacción.",
        "boundary": "No representa una llamada a un terminal ni un cargo bancario.",
        "certainty": "code",
        "sources": [
          {
            "label": "Angular: POST de venta",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/punto-de-venta.service.ts#L388-L399"
          },
          {
            "label": "Ruta POST punto-de-venta",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L113"
          },
          {
            "label": "Controlador: commit antes de facturar",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L151-L202"
          }
        ]
      },
      {
        "id": "save-documents",
        "from": "sale-controller",
        "to": "documents",
        "label": "INSERT / UPDATE documentos; reemplazar detalle_documentos",
        "protocol": "SQL",
        "detail": "El guardado crea/actualiza documento y elimina/guarda líneas mediante ORM con trx.",
        "effect": "Persiste cabecera y detalle de la venta.",
        "boundary": "Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia. Revisar propagación de trx por cada rama antes de afirmar atomicidad total.",
        "certainty": "code",
        "sources": [
          {
            "label": "Documento y líneas con trx",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L586-L669"
          }
        ]
      },
      {
        "id": "save-taxes",
        "from": "sale-controller",
        "to": "taxes",
        "label": "SELECT líneas e impuestos; reemplazar documentos_has_impuestos",
        "protocol": "SQL",
        "detail": "ImpuestosService, invocado por el guardado, lee relaciones de impuestos y recalcula importes.",
        "effect": "Guarda impuestos y actualiza montos documentales.",
        "boundary": "La flecha resume la delegación a ImpuestosService; no prueba evaluación local de ofertas.",
        "certainty": "code",
        "sources": [
          {
            "label": "Lectura de líneas e impuestos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ImpuestosService.js#L17-L62"
          },
          {
            "label": "Nombre documentos_has_impuestos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DocumentoService.js#L161-L174"
          }
        ]
      },
      {
        "id": "delegate-payments",
        "from": "sale-controller",
        "to": "receipt-payment",
        "label": "_guardarComprobante → guardaPagos",
        "protocol": "Interno",
        "detail": "El helper del controlador guarda el comprobante y delega pagos a ComprobanteVentaService/PagoService.",
        "effect": "Prepara entidades y relaciones locales.",
        "boundary": "Es detalle interno del mismo backend, no microservicio ni llamada de red.",
        "certainty": "code",
        "sources": [
          {
            "label": "Guardado de comprobante, documentos y vínculos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L309-L418"
          },
          {
            "label": "Guardar pagos recibidos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L59-L100"
          },
          {
            "label": "Vínculos pago/comprobante",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L105-L133"
          }
        ]
      },
      {
        "id": "save-receipt",
        "from": "receipt-payment",
        "to": "receipts",
        "label": "INSERT / UPDATE comprobante_ventas y vínculos documentales",
        "protocol": "SQL",
        "detail": "Guarda el comprobante y su asociación con documentos.",
        "effect": "Deja el comprobante local asociado a la venta.",
        "boundary": "Guardar el comprobante no prueba resultado fiscal ni AX.",
        "certainty": "code",
        "sources": [
          {
            "label": "Guardado de comprobante, documentos y vínculos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L309-L418"
          }
        ]
      },
      {
        "id": "save-payment",
        "from": "receipt-payment",
        "to": "payments",
        "label": "Guardar pagos; vincular pago_comprobante_ventas",
        "protocol": "SQL",
        "detail": "PagoService persiste datos del pago; ComprobanteVentaService guarda la relación al comprobante.",
        "effect": "Registra el pago recibido por el backend.",
        "boundary": "No se ha certificado que todos los guardados Lucid de todas las ramas participen de la misma trx.",
        "certainty": "code",
        "sources": [
          {
            "label": "Guardar pagos recibidos",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L59-L100"
          },
          {
            "label": "Vínculos pago/comprobante",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L105-L133"
          }
        ]
      },
      {
        "id": "after-commit",
        "from": "sale-controller",
        "to": "fiscal-service",
        "label": "trx.commit() → facturarComprobante, si corresponde",
        "protocol": "Interno",
        "detail": "El controlador confirma su transacción; para documento solicitado como vigente verifica cobranza e invoca facturación después.",
        "effect": "La venta ya está persistida al iniciar la solicitud fiscal.",
        "boundary": "El commit es una operación de base previa a esta llamada interna. Un rollback posterior no revierte ese commit.",
        "certainty": "code",
        "sources": [
          {
            "label": "Controlador: commit antes de facturar",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L151-L202"
          },
          {
            "label": "Comprobante: relectura y fallo fiscal",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L209-L248"
          }
        ]
      },
      {
        "id": "prepare-dte",
        "from": "fiscal-service",
        "to": "dtes",
        "label": "SELECT DTE; intentar estado en-preparacion",
        "protocol": "SQL",
        "detail": "Consulta DTE existente; si no corresponde omitir emisión intenta guardar la preparación con findOrCreate/merge/save.",
        "effect": "Intenta dejar una marca local previa al proveedor.",
        "boundary": "_guardarEstadoDte absorbe errores; la llamada puede continuar sin una marca durable.",
        "certainty": "code",
        "sources": [
          {
            "label": "Preparación, solicitud y resultado fiscal",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L295-L399"
          },
          {
            "label": "dtes: persistencia con catch local",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L463-L485"
          }
        ]
      },
      {
        "id": "emit-acepta",
        "from": "fiscal-service",
        "to": "acepta",
        "label": "POST ${FACTURACION_ACEPTA_SERVICIO}",
        "protocol": "HTTP",
        "detail": "La rama Acepta envía XML/comando publicar y referencia documental.",
        "effect": "Solicita emisión y recibe su resultado o error de transporte.",
        "boundary": "Solo si el selector elige Acepta. Fuera de la trx de venta; no se asegura recuperación ni emisión offline.",
        "certainty": "code",
        "sources": [
          {
            "label": "Selección Acepta/Ingydev",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L403-L414"
          },
          {
            "label": "Acepta: POST a URL configurada",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionAceptaService.js#L672-L724"
          }
        ]
      },
      {
        "id": "emit-ingydev",
        "from": "fiscal-service",
        "to": "ingydev",
        "label": "POST /WSFactElect/?wsdl",
        "protocol": "SOAP",
        "detail": "La rama Ingydev envía SOAP/XML al servicio configurado; no se publica su origen.",
        "effect": "Solicita emisión por la alternativa Ingydev.",
        "boundary": "Alternativa a Acepta, no segundo intento automático ni failover. El resultado puede quedar incierto.",
        "certainty": "code",
        "sources": [
          {
            "label": "Selección Acepta/Ingydev",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L403-L414"
          },
          {
            "label": "Ingydev: path del servicio",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionIngydevService.js#L17"
          },
          {
            "label": "Ingydev: petición SOAP",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionIngydevService.js#L402-L448"
          }
        ]
      },
      {
        "id": "save-dte-result",
        "from": "fiscal-service",
        "to": "dtes",
        "label": "Intentar UPDATE / INSERT dtes con resultado",
        "protocol": "SQL",
        "detail": "Tras respuesta/error fiscal invoca el guardado de estado y datos recibidos.",
        "effect": "Intenta conservar folio, fecha, representación y estado según resultado.",
        "boundary": "Catch local y escritura fuera de trx original; resultado externo y registro local son hechos diferentes.",
        "certainty": "code",
        "sources": [
          {
            "label": "Preparación, solicitud y resultado fiscal",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L295-L399"
          },
          {
            "label": "dtes: persistencia con catch local",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L463-L485"
          }
        ]
      },
      {
        "id": "save-document-state",
        "from": "fiscal-service",
        "to": "documents",
        "label": "UPDATE documentos.estado_documento_id",
        "protocol": "SQL",
        "detail": "DocumentoService actualiza el estado según facturación.",
        "effect": "La venta puede permanecer guardada con error o pendiente fiscal.",
        "boundary": "No registra por sí mismo nada en AX.",
        "certainty": "code",
        "sources": [
          {
            "label": "Estado documental después de facturar",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DocumentoService.js#L397-L434"
          },
          {
            "label": "Comprobante: relectura y fallo fiscal",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L209-L248"
          }
        ]
      },
      {
        "id": "save-receipt-state",
        "from": "fiscal-service",
        "to": "receipts",
        "label": "UPDATE comprobante_ventas.venta_finalizada, si falla",
        "protocol": "SQL",
        "detail": "El procesamiento de facturación puede desmarcar venta_finalizada cuando falla un documento.",
        "effect": "Actualiza seguimiento de la misma venta persistida.",
        "boundary": "No elimina el comprobante previamente confirmado.",
        "certainty": "code",
        "sources": [
          {
            "label": "Comprobante: relectura y fallo fiscal",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L209-L248"
          }
        ]
      },
      {
        "id": "sale-response",
        "from": "sale-controller",
        "to": "sale-ui",
        "label": "Respuesta de POST /punto-de-venta",
        "protocol": "HTTP",
        "detail": "Devuelve datos o error después de procesar las fases del controlador.",
        "effect": "La interfaz conoce un resultado del recorrido.",
        "boundary": "Error final no significa venta inexistente. Antes de repetir hay que revisar identidad y estados.",
        "certainty": "code",
        "sources": [
          {
            "label": "Controlador: commit antes de facturar",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L151-L202"
          }
        ]
      }
    ],
    "steps": [
      {
        "title": "1 · Consultar producto y precio",
        "detail": "La pantalla consulta el backend y este pide el precio remoto con contexto.",
        "edges": [
          "product-request",
          "price-request"
        ],
        "boundary": "Preparar una venta todavía depende de servicios remotos."
      },
      {
        "title": "2 · Enviar y guardar documento",
        "detail": "El backend recibe la venta, guarda cabecera/líneas y calcula impuestos.",
        "edges": [
          "sale-request",
          "save-documents",
          "save-taxes"
        ]
      },
      {
        "title": "3 · Guardar comprobante y pagos",
        "detail": "Los servicios internos guardan comprobante, pagos recibidos y vínculos.",
        "edges": [
          "delegate-payments",
          "save-receipt",
          "save-payment"
        ],
        "boundary": "No se certifica toda propagación de trx en todas las ramas."
      },
      {
        "title": "4 · Confirmar antes de facturar",
        "detail": "El commit de venta termina antes de la llamada fiscal; luego se intenta registrar preparación.",
        "edges": [
          "after-commit",
          "prepare-dte"
        ],
        "boundary": "La marca de preparación puede fallar y su helper absorber el error."
      },
      {
        "title": "5 · Invocar el proveedor seleccionado",
        "detail": "Acepta o Ingydev según configuración. Las dos flechas son alternativas.",
        "edges": [
          "emit-acepta",
          "emit-ingydev"
        ],
        "boundary": "No se afirma aprobación ni permiso fiscal offline."
      },
      {
        "title": "6 · Registrar resultado por separado",
        "detail": "Se intenta guardar DTE y se modifican los estados de documentos/comprobante.",
        "edges": [
          "save-dte-result",
          "save-document-state",
          "save-receipt-state"
        ],
        "boundary": "Son escrituras posteriores al commit; registro AX pertenece al flujo sync."
      },
      {
        "title": "7 · Responder a la interfaz",
        "detail": "La respuesta puede contener un error posterior al guardado de la venta.",
        "edges": [
          "sale-response"
        ],
        "boundary": "Nunca interpretar ese error como permiso automático para crear otra venta."
      }
    ]
  },
  {
    "id": "sync",
    "title": "Subida de venta: sucursal, concentrador y AX",
    "mode": "current",
    "summary": "El sincronizador prepara la venta; WSO2 recibe; Node ingesta a SQL; Java registra en AX; la respuesta se aplica después en sucursal.",
    "boundary": "Snapshots de código, no despliegue. Se dibuja la vía Node→cola SQL→Java con binding y activación pendientes. MP_ProcesaRegistro es otra configuración versionada. Un ACK técnico no confirma DTE ni ERP.",
    "groups": [
      {
        "id": "g-sync",
        "title": "Sincronizador de sucursal",
        "repo": "mountain-sync-sucursal",
        "runtime": "Node / AdonisJS",
        "zone": "Sucursal",
        "evidence": "master 540ab9a; despliegue pendiente"
      },
      {
        "id": "g-local",
        "title": "PostgreSQL de sucursal",
        "repo": "mountain-sync-sucursal",
        "runtime": "PostgreSQL",
        "zone": "Sucursal",
        "evidence": "Schema sincronizador explícito; negocio no siempre calificado"
      },
      {
        "id": "g-esb",
        "title": "WSO2 / Synapse / mediadores",
        "repo": "mountain-concentrador",
        "runtime": "Synapse XML + DSS + Java",
        "zone": "Central lógica",
        "evidence": "Pablo b2fd1ec; CAR/JAR y activación pendientes"
      },
      {
        "id": "g-central",
        "title": "PostgreSQL concentrador",
        "repo": "mountain-concentrador",
        "runtime": "PostgreSQL",
        "zone": "Central lógica",
        "evidence": "SQL explícito; instancia/search_path Node pendientes"
      },
      {
        "id": "g-broker",
        "title": "Broker y stores",
        "repo": "mountain-concentrador",
        "runtime": "Stores JMS / clientes AMQP",
        "zone": "Central lógica",
        "evidence": "Destinos versionados; binding efectivo pendiente"
      },
      {
        "id": "g-node",
        "title": "Consumidor de ingreso",
        "repo": "mountain-concentrador / procesador-cola-bus",
        "runtime": "Node / AdonisJS",
        "zone": "Central lógica",
        "evidence": "Ingesta cola→SQL; cron limpia, no envía AX"
      },
      {
        "id": "g-erp",
        "title": "Adaptador .NET y servicio AX",
        "repo": "apis-implementos / AX externo",
        "runtime": "ASP.NET / cliente WCF / AX",
        "zone": "Ubicación física pendiente",
        "evidence": "8fbe2f1; receptor compatible; implementación AX ausente"
      }
    ],
    "nodes": [
      {
        "id": "s-upload",
        "group": "g-sync",
        "title": "VentasSyncUploadService",
        "kind": "component",
        "subtitle": "Prepara documentos",
        "detail": "Selecciona elegibles y crea el sobre. Sincronizado=true de preparación no confirma AX.",
        "sources": [
          {
            "label": "Elegibilidad y marcado local preparado",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/VentasSyncUploadService.js#L20-L150"
          },
          {
            "label": "Creación local del sobre y detalles",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L15-L81"
          }
        ]
      },
      {
        "id": "s-documents",
        "group": "g-local",
        "title": "documentos + dtes",
        "kind": "table",
        "subtitle": "Negocio y elegibilidad",
        "detail": "Condiciones de selección fiscal y entorno. Este recorrido no vuelve a emitir DTE.",
        "sources": [
          {
            "label": "Elegibilidad y marcado local preparado",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/VentasSyncUploadService.js#L20-L150"
          },
          {
            "label": "Aplicación local de respuesta AX",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L366-L591"
          }
        ]
      },
      {
        "id": "s-messages",
        "group": "g-local",
        "title": "sincronizador.mensajes / mensaje_detalles",
        "kind": "table",
        "subtitle": "Mensajes locales",
        "detail": "Sobre y detalles locales en transacción; conservar ID de origen para respuesta.",
        "sources": [
          {
            "label": "Creación local del sobre y detalles",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L15-L81"
          },
          {
            "label": "Schema sincronizador.mensajes",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/Mensaje.js#L6-L21"
          },
          {
            "label": "Schema sincronizador.mensaje_detalles",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/MensajeDetalle.js#L6-L14"
          }
        ]
      },
      {
        "id": "s-http-client",
        "group": "g-sync",
        "title": "CambiosConcentradorService",
        "kind": "component",
        "subtitle": "Ingreso / existente",
        "detail": "Envía sobres y consulta resultados. Respuesta ausente no demuestra ausencia de efecto AX.",
        "sources": [
          {
            "label": "Sucursal: ingreso y consulta existente",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L289-L363"
          }
        ]
      },
      {
        "id": "s-ingress-api",
        "group": "g-esb",
        "title": "API_mensajeEntradas",
        "kind": "component",
        "subtitle": "POST /ingresar",
        "detail": "Registra consulta y sobre, deposita en store y devuelve procesado=true como recepción técnica.",
        "sources": [
          {
            "label": "Recepción HTTP, sobre y ACK técnico",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml#L18-L246"
          }
        ]
      },
      {
        "id": "s-dss",
        "group": "g-esb",
        "title": "DSS_RegistroConsultas / DSS_MensajeEntrada",
        "kind": "component",
        "subtitle": "SOAP / SQL",
        "detail": "Función de registro y posterior INSERT de mensaje; función SQL interna no disponible.",
        "sources": [
          {
            "label": "DSS invoca fn_crea_registro_consulta",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_RegistroConsultas.dbs#L1-L30"
          },
          {
            "label": "INSERT public.mensaje_entrada",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_MensajeEntrada.dbs#L1-L30"
          },
          {
            "label": "SOAP op_insertMensajeEntrada",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/templates/TP_DSS_MensajeEntrada.xml#L1-L19"
          }
        ]
      },
      {
        "id": "s-central-entry",
        "group": "g-central",
        "title": "public.mensaje_entrada / consulta",
        "kind": "table",
        "subtitle": "Recepción central",
        "detail": "INSERT explícito de sobre; registro mediante public.fn_crea_registro_consulta. No hay commit global con JMS.",
        "sources": [
          {
            "label": "DSS invoca fn_crea_registro_consulta",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_RegistroConsultas.dbs#L1-L30"
          },
          {
            "label": "INSERT public.mensaje_entrada",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_MensajeEntrada.dbs#L1-L30"
          }
        ]
      },
      {
        "id": "s-in-queue",
        "group": "g-broker",
        "title": "MS_ProcesaRegistro",
        "kind": "component",
        "subtitle": "qlProcesaRegistro",
        "detail": "Store JMS; guaranteed.delivery.enable=false. Cotejar cola real del consumidor Node.",
        "sources": [
          {
            "label": "Store JMS qlProcesaRegistro",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-stores/MS_ProcesaRegistro.xml#L1-L9"
          },
          {
            "label": "Nombre de cola y broker por configuración",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/start/queueHooks.js#L4-L13"
          }
        ]
      },
      {
        "id": "s-node-consumer",
        "group": "g-node",
        "title": "queueHooks / ColaMensajeService",
        "kind": "component",
        "subtitle": "AMQP→SQL",
        "detail": "Decodifica XML, llama crear sin await y hace ACK; el callback no espera INSERT.",
        "sources": [
          {
            "label": "Consumidor AMQP: crear sin await y ACK",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/start/queueHooks.js#L30-L60"
          },
          {
            "label": "INSERT por modelo y eliminación de procesados",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/app/Services/ColaMensajeService.js#L8-L25"
          }
        ]
      },
      {
        "id": "s-central-queue",
        "group": "g-central",
        "title": "public.cola_mensajes",
        "kind": "table",
        "subtitle": "en_proceso / procesado / error",
        "detail": "Java usa public; Node usa cola_mensajes sin schema explícito. Confirmar instancia/search_path.",
        "sources": [
          {
            "label": "Claim SQL y marcar procesado",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassProcesaCola/src/main/java/cl/implementos/BO/BOColaMensaje.java#L18-L81"
          },
          {
            "label": "Tabla cola_mensajes sin schema explícito",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/app/Models/ColaMensaje.js#L6-L10"
          },
          {
            "label": "Columnas y valores iniciales de cola",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/database/migrations/1640028044697_cola_mensajes_schema.js#L7-L19"
          }
        ]
      },
      {
        "id": "s-worker",
        "group": "g-esb",
        "title": "Task_LeeMensajesCola / ProcesaCola",
        "kind": "component",
        "subtitle": "Claim hasta2 pendientes",
        "detail": "Trigger count=0 interval=5; Java UPDATE…RETURNING reclama trabajo y secuencia itera. Runtime pendiente.",
        "sources": [
          {
            "label": "Trigger declarado y secuencia",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/tasks/Task_LeeMensajesCola.xml#L1-L9"
          },
          {
            "label": "Java leer-cambios e iteración",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_ColaMensajes_Leer.xml#L1-L31"
          },
          {
            "label": "Claim SQL y marcar procesado",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassProcesaCola/src/main/java/cl/implementos/BO/BOColaMensaje.java#L18-L81"
          }
        ]
      },
      {
        "id": "s-normalize",
        "group": "g-esb",
        "title": "RegistraMensajeDetalle / SEQ_AX_Inserciones",
        "kind": "component",
        "subtitle": "Identidad, destino y tipo",
        "detail": "Consulta ID de detalle+sucursal, crea relaciones, reutiliza respuesta exitosa o llama la secuencia del tipo.",
        "sources": [
          {
            "label": "Detalle, cabecera, relación y estaProcesado",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java#L353-L497"
          },
          {
            "label": "Destino AX, respuesta previa e iteración",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_ProcesaRegistroDetalle.xml#L45-L147"
          },
          {
            "label": "Selección por once tipos",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_AX_Inserciones.xml#L1-L52"
          }
        ]
      },
      {
        "id": "s-central-details",
        "group": "g-central",
        "title": "mensaje_detalles / mensaje_cabeceras",
        "kind": "table",
        "subtitle": "Escrituras public",
        "detail": "Métodos/commits separados. ID central distinto del ID de detalle original dentro del JSON.",
        "sources": [
          {
            "label": "Bulk con commits parciales",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalle.java#L133-L170"
          },
          {
            "label": "Identidad de origen y búsqueda de resultado",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalle.java#L328-L416"
          },
          {
            "label": "INSERT cabecera y UPDATE contadores",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeCabecera.java#L43-L85"
          }
        ]
      },
      {
        "id": "s-central-result",
        "group": "g-central",
        "title": "mensaje_detalle_sucursales / errores",
        "kind": "table",
        "subtitle": "Escrituras public",
        "detail": "Relación, data_respuesta, procesado/error/reintento; historial mensaje_detalle_sucursal_errores. Procesado puede coexistir con error.",
        "sources": [
          {
            "label": "Bulk de relación y UPDATE respuesta AX",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalleSucursal.java#L59-L158"
          },
          {
            "label": "Inspección de errores e INSERT historial",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalleSucursalErrores.java#L26-L146"
          },
          {
            "label": "Respuesta central y estados por destino",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java#L763-L861"
          }
        ]
      },
      {
        "id": "s-net",
        "group": "g-erp",
        "title": "CajaController / NotaVenta",
        "kind": "component",
        "subtitle": "apiMountainPosCaja",
        "detail": "Receptor compatible con EP_Ventas; adapta VentaContract y tablasAx. Prefijo/despliegue pendientes.",
        "sources": [
          {
            "label": "POST ruta apiMountainPOS; configuración, no despliegue",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/QARegistryResource/EP_Ventas.xml#L1-L18"
          },
          {
            "label": "Receptor .NET compatible",
            "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/apiMountainPosCaja/Controllers/CajaController.cs#L24-L49"
          },
          {
            "label": "Adaptación y proxy CreateSalesOrderwithDetailsV4",
            "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ServiciosAX/mountainPosCajaServices/NotaVenta.cs#L46-L245"
          }
        ]
      },
      {
        "id": "s-ax",
        "group": "g-erp",
        "title": "Servicio AX de venta",
        "kind": "external",
        "subtitle": "CreateSalesOrderwithDetailsV4",
        "detail": "Proxy invocado por .NET; código y transacciones internas AX no incluidos.",
        "sources": [
          {
            "label": "Adaptación y proxy CreateSalesOrderwithDetailsV4",
            "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ServiciosAX/mountainPosCajaServices/NotaVenta.cs#L46-L245"
          }
        ]
      },
      {
        "id": "s-response",
        "group": "g-esb",
        "title": "SEQ_Q_RespuestaAxASucursal",
        "kind": "component",
        "subtitle": "Resultado y retorno",
        "detail": "Llama actualizarCambioIngresadoAX y luego arma axRespuesta, tipoMovimiento entrada e ID original.",
        "sources": [
          {
            "label": "Persistir resultado y notificar sucursal",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_Q_RespuestaAxASucursal.xml#L1-L44"
          },
          {
            "label": "Respuesta central y estados por destino",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java#L763-L861"
          }
        ]
      },
      {
        "id": "s-out-queue",
        "group": "g-broker",
        "title": "SEQ_OrquestaColaSucursal / store",
        "kind": "component",
        "subtitle": "JMS por entidad",
        "detail": "Store por origen; default no soportado solo registra log aquí. Binding por sucursal pendiente.",
        "sources": [
          {
            "label": "Store por entidad y caso no soportado",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_OrquestaColaSucursal.xml#L1-L156"
          },
          {
            "label": "Ejemplo de store JMS por sucursal",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-stores/MS_QL_OUT_ARICA.xml#L1-L9"
          }
        ]
      },
      {
        "id": "s-branch-consumer",
        "group": "g-sync",
        "title": "queueHooks / ColaMensajeService",
        "kind": "component",
        "subtitle": "Respuesta AMQP",
        "detail": "Solicita crear cola local y ACK sin esperar; aplicación ocurre posteriormente.",
        "sources": [
          {
            "label": "Receptor AMQP de sucursal y ACK",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/start/queueHooks.js#L36-L76"
          }
        ]
      },
      {
        "id": "s-local-queue",
        "group": "g-local",
        "title": "sincronizador.cola_mensajes",
        "kind": "table",
        "subtitle": "Respuesta pendiente",
        "detail": "Cola local distinta de public.cola_mensajes del concentrador.",
        "sources": [
          {
            "label": "Schema sincronizador.cola_mensajes",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/ColaMensaje.js#L6-L10"
          },
          {
            "label": "Receptor AMQP de sucursal y ACK",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/start/queueHooks.js#L36-L76"
          }
        ]
      },
      {
        "id": "s-apply",
        "group": "g-sync",
        "title": "ColaMensajeService / MensajeDetalleService",
        "kind": "component",
        "subtitle": "Aplica respuesta AX",
        "detail": "Valida error y tablas; ramas CustInvoiceJour/LedgerJournalTable; negocio commit antes de metadata.",
        "sources": [
          {
            "label": "Aplicación local de respuesta AX",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L366-L591"
          },
          {
            "label": "Commit de negocio antes de metadata",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L768-L780"
          },
          {
            "label": "Cola local: lectura, aplicación y estado",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/ColaMensajeService.js#L17-L140"
          }
        ]
      },
      {
        "id": "s-sampler",
        "group": "g-esb",
        "title": "MP_ProcesaRegistro",
        "kind": "component",
        "subtitle": "Configuración alternativa",
        "detail": "SamplingProcessor de MS_ProcesaRegistro, interval1000, activo=true, concurrencia1; coexistencia no confirmada.",
        "sources": [
          {
            "label": "Consumidor Synapse alternativo versionado",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-processors/MP_ProcesaRegistro.xml#L1-L7"
          }
        ]
      }
    ],
    "edges": [
      {
        "id": "se-select",
        "from": "s-upload",
        "to": "s-documents",
        "label": "SELECT documentos + dtes",
        "protocol": "SQL",
        "detail": "Selecciona elegibles con condiciones fiscales.",
        "effect": "Candidatos",
        "boundary": "Preparado no es confirmado",
        "certainty": "code",
        "sources": [
          {
            "label": "Elegibilidad y marcado local preparado",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/VentasSyncUploadService.js#L20-L150"
          }
        ]
      },
      {
        "id": "se-prepare",
        "from": "s-upload",
        "to": "s-messages",
        "label": "INSERT mensajes / mensaje_detalles",
        "protocol": "SQL",
        "detail": "Transacción de mensaje; marcado documento separado.",
        "effect": "Sobre local",
        "boundary": "No transacción común con HTTP",
        "certainty": "code",
        "sources": [
          {
            "label": "Creación local del sobre y detalles",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L15-L81"
          },
          {
            "label": "Elegibilidad y marcado local preparado",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/VentasSyncUploadService.js#L20-L150"
          }
        ]
      },
      {
        "id": "se-send",
        "from": "s-http-client",
        "to": "s-ingress-api",
        "label": "POST /api/mensajeEntradas/ingresar",
        "protocol": "HTTP",
        "detail": "Envía el sobre preparado.",
        "effect": "Recepción central",
        "boundary": "Binding desplegado pendiente",
        "certainty": "code",
        "sources": [
          {
            "label": "Sucursal: ingreso y consulta existente",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L289-L363"
          },
          {
            "label": "Recepción HTTP, sobre y ACK técnico",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml#L18-L246"
          }
        ]
      },
      {
        "id": "se-dss-call",
        "from": "s-ingress-api",
        "to": "s-dss",
        "label": "op_insertRegistroConsulta / op_insertMensajeEntrada",
        "protocol": "SOAP",
        "detail": "Templates y DSS consecutivos.",
        "effect": "Registro técnico",
        "boundary": "Función SQL interna no disponible",
        "certainty": "code",
        "sources": [
          {
            "label": "Recepción HTTP, sobre y ACK técnico",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml#L18-L246"
          },
          {
            "label": "SOAP op_insertMensajeEntrada",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/templates/TP_DSS_MensajeEntrada.xml#L1-L19"
          },
          {
            "label": "Endpoint SOAP /services/DSS_MensajeEntrada",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/endpoints/EP_DSS_MensajeEntrada.xml#L1-L18"
          }
        ]
      },
      {
        "id": "se-dss-write",
        "from": "s-dss",
        "to": "s-central-entry",
        "label": "SELECT fn_crea_registro_consulta; INSERT mensaje_entrada",
        "protocol": "SQL",
        "detail": "Datasource PG_Sincronizador; public explícito.",
        "effect": "Registro de sobre",
        "boundary": "No cubre publicación JMS",
        "certainty": "code",
        "sources": [
          {
            "label": "DSS invoca fn_crea_registro_consulta",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_RegistroConsultas.dbs#L1-L30"
          },
          {
            "label": "INSERT public.mensaje_entrada",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_MensajeEntrada.dbs#L1-L30"
          }
        ]
      },
      {
        "id": "se-store",
        "from": "s-ingress-api",
        "to": "s-in-queue",
        "label": "store MS_ProcesaRegistro",
        "protocol": "Interno",
        "detail": "Mediador store hacia JMS qlProcesaRegistro.",
        "effect": "Encolar sobre",
        "boundary": "Store JMS distinto de cliente AMQP",
        "certainty": "code",
        "sources": [
          {
            "label": "Recepción HTTP, sobre y ACK técnico",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml#L18-L246"
          },
          {
            "label": "Store JMS qlProcesaRegistro",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-stores/MS_ProcesaRegistro.xml#L1-L9"
          }
        ]
      },
      {
        "id": "se-http-ack",
        "from": "s-ingress-api",
        "to": "s-http-client",
        "label": "Respuesta HTTP procesado=true",
        "protocol": "HTTP",
        "detail": "Propiedad true antes de procesamiento AX.",
        "effect": "ACK técnico",
        "boundary": "No confirma AX ni DTE",
        "certainty": "code",
        "sources": [
          {
            "label": "Recepción HTTP, sobre y ACK técnico",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml#L18-L246"
          }
        ]
      },
      {
        "id": "se-amqp-in",
        "from": "s-in-queue",
        "to": "s-node-consumer",
        "label": "Entrega AMQP a ESB_BROKER_QUEUE",
        "protocol": "AMQP",
        "detail": "Nombre de cola viene por configuración.",
        "effect": "Ingesta Node",
        "boundary": "Cotejar binding y activación; no desplegado verificado",
        "certainty": "unknown",
        "sources": [
          {
            "label": "Nombre de cola y broker por configuración",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/start/queueHooks.js#L4-L13"
          },
          {
            "label": "Consumidor AMQP: crear sin await y ACK",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/start/queueHooks.js#L30-L60"
          },
          {
            "label": "Store JMS qlProcesaRegistro",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-stores/MS_ProcesaRegistro.xml#L1-L9"
          }
        ]
      },
      {
        "id": "se-node-write",
        "from": "s-node-consumer",
        "to": "s-central-queue",
        "label": "INSERT cola_mensajes",
        "protocol": "SQL",
        "detail": "ColaMensaje.create; schema no explícito.",
        "effect": "Persistencia solicitada",
        "boundary": "Callback no espera promesa; search_path pendiente",
        "certainty": "code",
        "sources": [
          {
            "label": "INSERT por modelo y eliminación de procesados",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/app/Services/ColaMensajeService.js#L8-L25"
          },
          {
            "label": "Tabla cola_mensajes sin schema explícito",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/app/Models/ColaMensaje.js#L6-L10"
          }
        ]
      },
      {
        "id": "se-node-ack",
        "from": "s-node-consumer",
        "to": "s-in-queue",
        "label": "ch.ack(msg)",
        "protocol": "AMQP",
        "detail": "Después de llamar crear sin await.",
        "effect": "ACK al broker",
        "boundary": "No acredita INSERT completado",
        "certainty": "code",
        "sources": [
          {
            "label": "Consumidor AMQP: crear sin await y ACK",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/start/queueHooks.js#L30-L60"
          }
        ]
      },
      {
        "id": "se-claim",
        "from": "s-worker",
        "to": "s-central-queue",
        "label": "UPDATE en_proceso=true … RETURNING *",
        "protocol": "SQL",
        "detail": "Hasta2 filas no procesadas/no en proceso.",
        "effect": "Reclamar trabajo",
        "boundary": "Sin lease/reclaim explícito en método",
        "certainty": "code",
        "sources": [
          {
            "label": "Claim SQL y marcar procesado",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassProcesaCola/src/main/java/cl/implementos/BO/BOColaMensaje.java#L18-L81"
          },
          {
            "label": "Trigger declarado y secuencia",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/tasks/Task_LeeMensajesCola.xml#L1-L9"
          }
        ]
      },
      {
        "id": "se-dispatch",
        "from": "s-worker",
        "to": "s-normalize",
        "label": "SEQ_Q_LeerColaBus → SEQ_ProcesaRegistroDetalle",
        "protocol": "Interno",
        "detail": "Origen sucursal y destino AX.",
        "effect": "Enrutar detalle",
        "boundary": "Otras ramas no equivalen a ventas",
        "certainty": "code",
        "sources": [
          {
            "label": "Desempaquetado y rama origen sucursal",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_Q_LeerColaBus.xml#L3-L57"
          },
          {
            "label": "Destino AX, respuesta previa e iteración",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_ProcesaRegistroDetalle.xml#L45-L147"
          }
        ]
      },
      {
        "id": "se-details",
        "from": "s-normalize",
        "to": "s-central-details",
        "label": "SELECT existente; INSERT detalles/cabecera",
        "protocol": "SQL",
        "detail": "Identidad origen+sucursal; commits separados.",
        "effect": "Identidad central",
        "boundary": "No prueba unicidad concurrente",
        "certainty": "code",
        "sources": [
          {
            "label": "Detalle, cabecera, relación y estaProcesado",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java#L353-L497"
          },
          {
            "label": "Bulk con commits parciales",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalle.java#L133-L170"
          },
          {
            "label": "Identidad de origen y búsqueda de resultado",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalle.java#L328-L416"
          },
          {
            "label": "INSERT cabecera y UPDATE contadores",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeCabecera.java#L43-L85"
          }
        ]
      },
      {
        "id": "se-relation",
        "from": "s-normalize",
        "to": "s-central-result",
        "label": "INSERT mensaje_detalle_sucursales",
        "protocol": "SQL",
        "detail": "Relación por destino con commits propios.",
        "effect": "Seguimiento destino",
        "boundary": "Procesados exitosos pueden reutilizar respuesta",
        "certainty": "code",
        "sources": [
          {
            "label": "Detalle, cabecera, relación y estaProcesado",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java#L353-L497"
          },
          {
            "label": "Bulk de relación y UPDATE respuesta AX",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalleSucursal.java#L59-L158"
          }
        ]
      },
      {
        "id": "se-post-net",
        "from": "s-normalize",
        "to": "s-net",
        "label": "POST /apiMountainPOS/api/caja/mountainpos/creaFacturaOvFromPos",
        "protocol": "HTTP",
        "detail": "DTO extraído; EP_Ventas blocking=true.",
        "effect": "Solicita registro AX",
        "boundary": "Timeout120000/fault; publicación real pendiente",
        "certainty": "code",
        "sources": [
          {
            "label": "Extracción del DTO y call blocking",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_AX_Insert_ventas.xml#L1-L33"
          },
          {
            "label": "POST ruta apiMountainPOS; configuración, no despliegue",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/QARegistryResource/EP_Ventas.xml#L1-L18"
          },
          {
            "label": "Receptor .NET compatible",
            "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/apiMountainPosCaja/Controllers/CajaController.cs#L24-L49"
          }
        ]
      },
      {
        "id": "se-net-ax",
        "from": "s-net",
        "to": "s-ax",
        "label": "CreateSalesOrderwithDetailsV4(venta)",
        "protocol": "Por confirmar",
        "detail": "Llamada proxy WCF verificada; transporte runtime pendiente.",
        "effect": "Operación AX",
        "boundary": "Servidor AX no auditado",
        "certainty": "code",
        "sources": [
          {
            "label": "Adaptación y proxy CreateSalesOrderwithDetailsV4",
            "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ServiciosAX/mountainPosCajaServices/NotaVenta.cs#L46-L245"
          }
        ]
      },
      {
        "id": "se-ax-return",
        "from": "s-ax",
        "to": "s-net",
        "label": "Resultado de servicio AX",
        "protocol": "Por confirmar",
        "detail": "NotaVenta interpreta lista y arma tablasAx.",
        "effect": "Respuesta reportada",
        "boundary": "Transacciones AX no visibles",
        "certainty": "code",
        "sources": [
          {
            "label": "Adaptación y proxy CreateSalesOrderwithDetailsV4",
            "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ServiciosAX/mountainPosCajaServices/NotaVenta.cs#L46-L245"
          }
        ]
      },
      {
        "id": "se-http-return",
        "from": "s-net",
        "to": "s-response",
        "label": "Respuesta HTTP error / data.tablasAx",
        "protocol": "HTTP",
        "detail": "Secuencia de respuesta tras llamada.",
        "effect": "Resultado a clasificar",
        "boundary": "error=false exterior no elimina errores por tabla",
        "certainty": "code",
        "sources": [
          {
            "label": "Receptor .NET compatible",
            "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/apiMountainPosCaja/Controllers/CajaController.cs#L24-L49"
          },
          {
            "label": "Extracción del DTO y call blocking",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_AX_Insert_ventas.xml#L1-L33"
          },
          {
            "label": "Persistir resultado y notificar sucursal",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_Q_RespuestaAxASucursal.xml#L1-L44"
          },
          {
            "label": "Inspección de errores e INSERT historial",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalleSucursalErrores.java#L26-L146"
          }
        ]
      },
      {
        "id": "se-result-write",
        "from": "s-response",
        "to": "s-central-result",
        "label": "UPDATE respuesta/estado; INSERT error",
        "protocol": "SQL",
        "detail": "Guarda resultado, contadores y errores.",
        "effect": "Resultado central",
        "boundary": "Conexiones separadas; excepciones capturadas",
        "certainty": "code",
        "sources": [
          {
            "label": "Respuesta central y estados por destino",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java#L763-L861"
          },
          {
            "label": "Bulk de relación y UPDATE respuesta AX",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalleSucursal.java#L59-L158"
          },
          {
            "label": "Inspección de errores e INSERT historial",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalleSucursalErrores.java#L26-L146"
          }
        ]
      },
      {
        "id": "se-result-store",
        "from": "s-response",
        "to": "s-out-queue",
        "label": "store JMS por entidad origen",
        "protocol": "Interno",
        "detail": "Retorna ID de detalle original.",
        "effect": "Publicar respuesta",
        "boundary": "Persistencia y store no atómicos",
        "certainty": "code",
        "sources": [
          {
            "label": "Persistir resultado y notificar sucursal",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_Q_RespuestaAxASucursal.xml#L1-L44"
          },
          {
            "label": "Store por entidad y caso no soportado",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_OrquestaColaSucursal.xml#L1-L156"
          },
          {
            "label": "Ejemplo de store JMS por sucursal",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-stores/MS_QL_OUT_ARICA.xml#L1-L9"
          }
        ]
      },
      {
        "id": "se-amqp-out",
        "from": "s-out-queue",
        "to": "s-branch-consumer",
        "label": "Entrega AMQP de respuesta",
        "protocol": "AMQP",
        "detail": "Formas productor/consumidor compatibles.",
        "effect": "Retorno sucursal",
        "boundary": "Binding por configuración pendiente",
        "certainty": "unknown",
        "sources": [
          {
            "label": "Ejemplo de store JMS por sucursal",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-stores/MS_QL_OUT_ARICA.xml#L1-L9"
          },
          {
            "label": "Receptor AMQP de sucursal y ACK",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/start/queueHooks.js#L36-L76"
          }
        ]
      },
      {
        "id": "se-branch-write",
        "from": "s-branch-consumer",
        "to": "s-local-queue",
        "label": "INSERT sincronizador.cola_mensajes",
        "protocol": "SQL",
        "detail": "Cola local para aplicación posterior.",
        "effect": "Custodia solicitada",
        "boundary": "ACK no espera promesa de creación",
        "certainty": "code",
        "sources": [
          {
            "label": "Receptor AMQP de sucursal y ACK",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/start/queueHooks.js#L36-L76"
          },
          {
            "label": "Schema sincronizador.cola_mensajes",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/ColaMensaje.js#L6-L10"
          }
        ]
      },
      {
        "id": "se-apply-read",
        "from": "s-apply",
        "to": "s-local-queue",
        "label": "LEE respuesta pendiente",
        "protocol": "SQL",
        "detail": "ColaMensajeService lee pendientes y dirige el mensaje a MensajeDetalleService.",
        "effect": "Procesar retorno",
        "boundary": "No sucede durante ACK HTTP",
        "certainty": "code",
        "sources": [
          {
            "label": "Aplicación local de respuesta AX",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L366-L591"
          },
          {
            "label": "Receptor AMQP de sucursal y ACK",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/start/queueHooks.js#L36-L76"
          },
          {
            "label": "Cola local: lectura, aplicación y estado",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/ColaMensajeService.js#L17-L140"
          }
        ]
      },
      {
        "id": "se-apply-write",
        "from": "s-apply",
        "to": "s-documents",
        "label": "UPDATE documentos / referencias AX",
        "protocol": "SQL",
        "detail": "Condiciones de CustInvoiceJour y pagos.",
        "effect": "Actualiza negocio",
        "boundary": "Commit negocio antes de metadata",
        "certainty": "code",
        "sources": [
          {
            "label": "Aplicación local de respuesta AX",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L366-L591"
          },
          {
            "label": "Commit de negocio antes de metadata",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L768-L780"
          }
        ]
      },
      {
        "id": "se-metadata",
        "from": "s-apply",
        "to": "s-messages",
        "label": "UPDATE metadata de sincronización",
        "protocol": "SQL",
        "detail": "Registro posterior al commit negocio.",
        "effect": "Seguimiento local",
        "boundary": "Frontera de fallo independiente",
        "certainty": "code",
        "sources": [
          {
            "label": "Commit de negocio antes de metadata",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L768-L780"
          }
        ]
      },
      {
        "id": "se-done",
        "from": "s-worker",
        "to": "s-central-queue",
        "label": "UPDATE procesado=true,en_proceso=false",
        "protocol": "SQL",
        "detail": "Marcado en ramas de finalización.",
        "effect": "Cerrar cola",
        "boundary": "No certifica éxito financiero de todos los detalles",
        "certainty": "code",
        "sources": [
          {
            "label": "Claim SQL y marcar procesado",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassProcesaCola/src/main/java/cl/implementos/BO/BOColaMensaje.java#L18-L81"
          },
          {
            "label": "Destino AX, respuesta previa e iteración",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_ProcesaRegistroDetalle.xml#L45-L147"
          }
        ]
      },
      {
        "id": "se-alternative",
        "from": "s-sampler",
        "to": "s-in-queue",
        "label": "Consume MS_ProcesaRegistro",
        "protocol": "Interno",
        "detail": "SamplingProcessor llama SEQ_Q_LeerColaBus.",
        "effect": "Ruta alternativa",
        "boundary": "No asumir coexistencia con Node",
        "certainty": "code",
        "sources": [
          {
            "label": "Consumidor Synapse alternativo versionado",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-processors/MP_ProcesaRegistro.xml#L1-L7"
          }
        ]
      }
    ],
    "steps": [
      {
        "title": "Preparar venta",
        "detail": "Se crea el sobre local con detalles elegibles.",
        "edges": [
          "se-select",
          "se-prepare"
        ],
        "boundary": "Emisión fiscal separada; preparado no es AX confirmado."
      },
      {
        "title": "Registrar recepción central",
        "detail": "WSO2 recibe y llama DSS para registrar consulta y sobre.",
        "edges": [
          "se-send",
          "se-dss-call",
          "se-dss-write"
        ],
        "boundary": "Función SQL interna no disponible."
      },
      {
        "title": "Encolar y responder",
        "detail": "JMS y ACK técnico preceden resultado ERP.",
        "edges": [
          "se-store",
          "se-http-ack"
        ],
        "boundary": "Sin commit global SQL+JMS+HTTP demostrado."
      },
      {
        "title": "Node ingesta a SQL",
        "detail": "El callback consume y solicita persistencia antes de ACK, sin esperar.",
        "edges": [
          "se-amqp-in",
          "se-node-write",
          "se-node-ack"
        ],
        "boundary": "Binding y activación pendientes; existe configuración alternativa."
      },
      {
        "title": "Java reclama y descompone",
        "detail": "Task/Java reclama hasta2 filas y crea identidad central.",
        "edges": [
          "se-claim",
          "se-dispatch",
          "se-details"
        ],
        "boundary": "Recuperación y concurrencia deben probarse."
      },
      {
        "title": "Invocar adaptador y AX",
        "detail": "Tipo ventas selecciona .NET y proxy AX.",
        "edges": [
          "se-relation",
          "se-post-net",
          "se-net-ax"
        ],
        "boundary": "Respuesta previa exitosa puede evitar llamada; estados mezclados requieren prueba."
      },
      {
        "title": "Guardar resultado",
        "detail": "Se interpretan tablasAx y guardan resultado/errores.",
        "edges": [
          "se-ax-return",
          "se-http-return",
          "se-result-write"
        ],
        "boundary": "Procesado=true puede coexistir con error."
      },
      {
        "title": "Retornar a sucursal",
        "detail": "Publica por entidad y crea cola local.",
        "edges": [
          "se-result-store",
          "se-amqp-out",
          "se-branch-write"
        ],
        "boundary": "Bindings y custodia no se certifican por un ACK."
      },
      {
        "title": "Aplicar negocio y metadata",
        "detail": "La sucursal aplica resultado y registra seguimiento.",
        "edges": [
          "se-apply-read",
          "se-apply-write",
          "se-metadata"
        ],
        "boundary": "Negocio y metadata tienen fronteras distintas."
      },
      {
        "title": "Finalización y alternativa",
        "detail": "Se cierra la fila central; sampler es otra configuración.",
        "edges": [
          "se-done",
          "se-alternative"
        ],
        "boundary": "Export runtime debe resolver consumidores activos."
      }
    ]
  },
  {
    "id": "masters",
    "title": "Maestros: MPOS → lotes centrales → sucursal",
    "mode": "current",
    "summary": "El concentrador contiene tareas WSO2, count DSS, mediador Java por JDBC, tablas PostgreSQL y API de lectura. El sincronizador descarga lotes y aplica detalles; cliente y dirección son ramas alternativas.",
    "boundary": "Código en mountain-concentrador @b2fd1ec y sync @540ab9a; no acredita el binario desplegado. El productor AX→MPOS, cuerpos SP, ubicaciones y calendario real siguen pendientes. Las fases centrales, ACK, aplicación local y recálculo no tienen una transacción global.",
    "groups": [
      {
        "id": "origin",
        "title": "AX · productor de cambios pendiente",
        "repo": "Productor no recibido",
        "runtime": "ERP on-premise / proceso por identificar",
        "zone": "Central · ubicación física pendiente",
        "evidence": "AX→MPOS es el antecedente informado. El lector Java no demuestra el job que llena MPOS."
      },
      {
        "id": "mpos-sql",
        "title": "SQL Server · MPOS",
        "repo": "mountain-concentrador @b2fd1ec",
        "runtime": "SQL Server / JDBC",
        "zone": "Central lógico · servidor pendiente",
        "evidence": "BOAX fija MPOS; BOCliente consulta dbo.CustTableSync y SP. No se recibió DDL ni cuerpo de SP."
      },
      {
        "id": "concentrator-app",
        "title": "Concentrador · WSO2 / Java",
        "repo": "mountain-concentrador @b2fd1ec",
        "runtime": "Synapse + DSS + mediador Java / JDBC",
        "zone": "Integración central lógica",
        "evidence": "Fuentes y variantes CAR inspeccionadas; su presencia no prueba que esas tareas estén activas."
      },
      {
        "id": "central-pg",
        "title": "PostgreSQL · concentrador",
        "repo": "mountain-concentrador @b2fd1ec",
        "runtime": "PostgreSQL / JDBC y AdonisJS",
        "zone": "Concentrador central lógico",
        "evidence": "Java califica public; API lectura usa nombres sin esquema. Bindings/search_path productivos por validar."
      },
      {
        "id": "read-api",
        "title": "API de lectura · receptores disponibles",
        "repo": "mountain-concentrador/api-lectura @b2fd1ec",
        "runtime": "AdonisJS / Node.js",
        "zone": "Central · despliegue pendiente",
        "evidence": "Rutas y SQL compatibles con el consumidor nombreEntidad. La API WSO2 paralela utiliza codigoEntidad; no se presume misma instancia."
      },
      {
        "id": "group-origin",
        "title": "Origen y preparación central",
        "repo": "Productores AX/MPOS no recibidos",
        "runtime": "SQL Server / procesos por confirmar",
        "zone": "Central · ubicación MPOS pendiente",
        "evidence": "Apuntes/PPTX; no se deducen tabla, job diario ni servidor físico."
      },
      {
        "id": "group-read-api",
        "title": "API de lectura de maestros",
        "repo": "Consumidor en sync; receptor pendiente",
        "runtime": "Runtime efectivo por confirmar",
        "zone": "Central",
        "evidence": "Contrato HTTP consumido; implementación y prefijo desplegado pendientes."
      },
      {
        "id": "group-sync-app",
        "title": "Sincronizador de sucursal",
        "repo": "mountain-sync-sucursal @540ab9a",
        "runtime": "AdonisJS / Node.js",
        "zone": "Servidor de sucursal"
      },
      {
        "id": "group-postgres",
        "title": "PostgreSQL de sucursal",
        "repo": "Modelos y SQL de sync/backend",
        "runtime": "PostgreSQL",
        "zone": "Sucursal",
        "evidence": "El esquema sincronizador está declarado en los modelos. Comparte la PostgreSQL local; no es una base nueva. Las tablas de negocio no califican esquema."
      },
      {
        "id": "group-backend",
        "title": "Mountain · backend local",
        "repo": "mountain-implementos/backend",
        "runtime": "AdonisJS / Node.js",
        "zone": "Servidor de sucursal",
        "evidence": "Recálculo posterior al maestro; no misma trx."
      }
    ],
    "nodes": [
      {
        "id": "origin",
        "group": "origin",
        "title": "Dynamics AX → productor de cambios",
        "kind": "external",
        "subtitle": "Implementación no recibida",
        "detail": "El usuario describe cambios de AX hacia MPOS. No se demostró job diario, mecanismo, bajas ni servidor compartido.",
        "sources": [
          {
            "label": "MPOS, datasource y estados de origen",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/BOAX.java#L45-L69"
          },
          {
            "label": "Tabla de clientes, SP y lectura JDBC",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/tables/BOCliente.java#L26-L83"
          }
        ]
      },
      {
        "id": "mpos",
        "group": "mpos-sql",
        "title": "MPOS.dbo.CustTableSync",
        "kind": "table",
        "subtitle": "Clientes como ejemplo",
        "detail": "BOCliente usa Id y sp_caja_custTable. BOAX fija MPOS; la paginación pasa 0→9 y TOP(n) 9→0. Direcciones/contactos tienen tablas distintas.",
        "sources": [
          {
            "label": "MPOS, datasource y estados de origen",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/BOAX.java#L45-L69"
          },
          {
            "label": "Actualización de origen y paginación 0/9",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/BOAX.java#L212-L310"
          },
          {
            "label": "Tabla de clientes, SP y lectura JDBC",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/tables/BOCliente.java#L26-L83"
          },
          {
            "label": "Tabla y SP de contactos",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/tables/BOContacto.java#L26-L33"
          },
          {
            "label": "Tabla y SP de direcciones",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/tables/BODireccion.java#L26-L33"
          }
        ]
      },
      {
        "id": "task",
        "group": "concentrator-app",
        "title": "Task / SEQ_DSS_AX_Clientes",
        "kind": "component",
        "subtitle": "Consultar count de pendientes",
        "detail": "Task fuente interval=10; solo count>0 registra consulta y encola trabajo. CAR etiquetados PROD/QA/DESA difieren; no es cadencia productiva acreditada.",
        "sources": [
          {
            "label": "Task de clientes",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/tasks/Task_SincronizaClientes.xml#L1-L9"
          },
          {
            "label": "Solo count > 0 dispara registro y cola",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_DSS_AX_Clientes.xml#L1-L18"
          },
          {
            "label": "SOAPAction opGetCountClientesAX",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/templates/TP_DSS_AX_Clientes.xml#L9-L22"
          }
        ]
      },
      {
        "id": "dss",
        "group": "concentrator-app",
        "title": "DSS_AX_Clientes",
        "kind": "component",
        "subtitle": "opGetCountClientesAX",
        "detail": "El count consulta CustTableSync con Procesado=0. El datasource no califica base/esquema en esa consulta; su binding efectivo se debe contrastar con MPOS usado por Java.",
        "sources": [
          {
            "label": "DSS: count, SP y actualización",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_AX_Clientes.dbs#L1-L83"
          },
          {
            "label": "SOAPAction opGetCountClientesAX",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/templates/TP_DSS_AX_Clientes.xml#L9-L22"
          },
          {
            "label": "Endpoint DSS, path y timeout",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/endpoints/EP_DSS_AX_Clientes.xml#L2-L7"
          }
        ]
      },
      {
        "id": "queue-reader",
        "group": "concentrator-app",
        "title": "MS_ProcesaRegistro / SEQ_Q_LeerColaBus",
        "kind": "component",
        "subtitle": "Trabajo de generación de lotes",
        "detail": "Store JMS/Andes y SamplingProcessor invocan la secuencia. Configura página/límite, llama procesarCambiosAX y luego arma aviso a sucursales; no transporta todo el maestro como aviso.",
        "sources": [
          {
            "label": "Aviso de trabajo a MS_ProcesaRegistro",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_Q_CambioDesdeAx.xml#L27-L45"
          },
          {
            "label": "JMS / Andes y qlProcesaRegistro",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-stores/MS_ProcesaRegistro.xml#L2-L8"
          },
          {
            "label": "SamplingProcessor y concurrencia declarada",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-processors/MP_ProcesaRegistro.xml#L2-L6"
          },
          {
            "label": "Página, límite, mediador y aviso",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_Q_LeerColaBus.xml#L3-L55"
          },
          {
            "label": "Aviso por entidad de destino",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_Q_CambiosASucursal.xml#L2-L8"
          }
        ]
      },
      {
        "id": "java",
        "group": "concentrator-app",
        "title": "RegistraMensajeDetalle → BOCliente / BOGuardarData",
        "kind": "component",
        "subtitle": "Consultar MPOS y materializar lotes",
        "detail": "Lee SQL directamente con JDBC; persiste detalles, marca origen procesado y después inserta cabeceras/salidas por destino. Algunos catches JDBC solo registran el error.",
        "sources": [
          {
            "label": "Procesar cambios AX y seleccionar camino",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java#L962-L1062"
          },
          {
            "label": "Tabla de clientes, SP y lectura JDBC",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/tables/BOCliente.java#L26-L83"
          },
          {
            "label": "Generar detalles, marcar origen y guardar salidas",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOGuardarData.java#L56-L208"
          },
          {
            "label": "Bulk PostgreSQL de detalles",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalle.java#L133-L170"
          },
          {
            "label": "Bulk de salidas con conexión compartida",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeSalida.java#L47-L96"
          }
        ]
      },
      {
        "id": "central-details",
        "group": "central-pg",
        "title": "public.mensaje_entrada · public.mensaje_detalles",
        "kind": "table",
        "subtitle": "Payload y detalles centrales",
        "detail": "Java persiste entrada y detalles en fases propias. El bulk de detalles precede a marcar MPOS y a construir las salidas por destino.",
        "sources": [
          {
            "label": "Tabla física public.mensaje_entrada",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeEntrada.java#L40-L65"
          },
          {
            "label": "Bulk PostgreSQL de detalles",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalle.java#L133-L170"
          },
          {
            "label": "Generar detalles, marcar origen y guardar salidas",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOGuardarData.java#L56-L208"
          }
        ]
      },
      {
        "id": "central-headers",
        "group": "central-pg",
        "title": "public.mensaje_cabeceras",
        "kind": "table",
        "subtitle": "Cabecera y contadores por destino",
        "detail": "Java inserta cabeceras después de marcar el origen. API lectura incrementa contadores al recibir procesados; total_sincronizados incluye resultados con error.",
        "sources": [
          {
            "label": "Tabla física public.mensaje_cabeceras",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeCabecera.java#L43-L65"
          },
          {
            "label": "Generar detalles, marcar origen y guardar salidas",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOGuardarData.java#L56-L208"
          },
          {
            "label": "Procesados, contadores y estado de lote",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L194-L277"
          }
        ]
      },
      {
        "id": "central-output",
        "group": "central-pg",
        "title": "public.mensaje_salida · public.mensaje_detalle_sucursales",
        "kind": "table",
        "subtitle": "Entrega, recibido y resultado",
        "detail": "Java comparte conexión para salida/vínculos de destino. API lectura usa nombres no calificados: enviado, recibido_sucursal y procesado representan fases distintas.",
        "sources": [
          {
            "label": "Bulk de salidas con conexión compartida",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeSalida.java#L47-L96"
          },
          {
            "label": "Detalles de destino con conexión heredada",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalleSucursal.java#L59-L120"
          },
          {
            "label": "Elegibilidad, selección, enviado y recuperación",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Services/MensajeSalidaService.js#L9-L134"
          },
          {
            "label": "Procesados, contadores y estado de lote",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L194-L277"
          }
        ]
      },
      {
        "id": "read-api",
        "group": "read-api",
        "title": "MensajeSalidasController",
        "kind": "component",
        "subtitle": "GET cambios / sin-procesar · POST recibido / procesados",
        "detail": "Receptores AdonisJS disponibles. Cambios confirma marca enviado antes de devolver HTTP. Procesados registra éxitos y errores y marca procesado usando la cabecera del primer ítem.",
        "sources": [
          {
            "label": "Cuatro rutas API lectura",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/start/routes.js#L19-L26"
          },
          {
            "label": "GET cambios modifica estado y confirma trx",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L19-L109"
          },
          {
            "label": "Sin procesar y recibido",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L112-L191"
          },
          {
            "label": "Procesados, contadores y estado de lote",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L194-L277"
          }
        ]
      },
      {
        "id": "read-service",
        "group": "read-api",
        "title": "MensajeSalidaService",
        "kind": "component",
        "subtitle": "Seleccionar y actualizar entregas",
        "detail": "Cambios selecciona salida y cambia enviado. Sin-procesar filtra enviado=true / procesado=false, sin excluir recibido_sucursal=true. No se observa claim exclusivo con bloqueo de fila.",
        "sources": [
          {
            "label": "Elegibilidad, selección, enviado y recuperación",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Services/MensajeSalidaService.js#L9-L134"
          },
          {
            "label": "Modelo mensaje_salida",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Models/MensajeSalida.js#L6-L33"
          }
        ]
      },
      {
        "id": "download",
        "group": "group-sync-app",
        "title": "CambiosConcentradorService / MensajeService",
        "kind": "component",
        "subtitle": "Pedir, validar y guardar sobre",
        "detail": "Solicita el lote, valida destino/datos, notifica recibido y crea mensaje/detalles si esa respuesta no declara error.",
        "sources": [
          {
            "label": "Descarga, recibido y procesados",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L318"
          },
          {
            "label": "Transacción de sobre y detalles",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L15-L81"
          }
        ]
      },
      {
        "id": "apply",
        "group": "group-sync-app",
        "title": "MensajeDetalleService",
        "kind": "component",
        "subtitle": "Una transacción por detalle",
        "detail": "Lee detalles, selecciona el servicio por tipo, hace commit/rollback y actualiza metadata después.",
        "sources": [
          {
            "label": "Transacción por detalle y seguimiento posterior",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
          }
        ]
      },
      {
        "id": "client-service",
        "group": "group-sync-app",
        "title": "ClientesSyncService",
        "kind": "component",
        "subtitle": "Aplicar maestro cliente",
        "detail": "Guarda personas/empresas con auxiliares según payload; algunas lecturas de apoyo quedan fuera de la trx.",
        "sources": [
          {
            "label": "Cliente: personas, empresas y auxiliares",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/ClientesSyncService.js#L14-L407"
          },
          {
            "label": "Guardado de persona",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/PersonaService.js#L13-L61"
          }
        ]
      },
      {
        "id": "address-service",
        "group": "group-sync-app",
        "title": "DireccionesSyncService",
        "kind": "component",
        "subtitle": "Aplicar maestro dirección",
        "detail": "Resuelve empresa y valida identidad. Ausencia del cliente puede producir error; respeta condiciones de vigencia/principal.",
        "sources": [
          {
            "label": "Direcciones: resolución de cliente y condiciones",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/DireccionesSyncService.js#L20-L315"
          }
        ]
      },
      {
        "id": "messages",
        "group": "group-postgres",
        "title": "sincronizador.mensajes · sincronizador.mensaje_detalles",
        "kind": "table",
        "subtitle": "Sobre y seguimiento del lote",
        "detail": "Creación del sobre con su trx; aplicaciones por detalle y metadata posterior son fases distintas. El esquema sincronizador está declarado en los modelos. Comparte la PostgreSQL local; no es una base nueva.",
        "sources": [
          {
            "label": "Transacción de sobre y detalles",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L15-L81"
          },
          {
            "label": "Modelo: sincronizador.mensajes",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/Mensaje.js#L6-L21"
          },
          {
            "label": "Modelo: sincronizador.mensaje_detalles",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/MensajeDetalle.js#L6-L14"
          },
          {
            "label": "Transacción por detalle y seguimiento posterior",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
          }
        ]
      },
      {
        "id": "clients",
        "group": "group-postgres",
        "title": "personas · empresas y auxiliares",
        "kind": "table",
        "subtitle": "Copia local del cliente",
        "detail": "La aplicación puede resolver clasificación, cartera, segmento, bloqueo y giro. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Cliente: personas, empresas y auxiliares",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/ClientesSyncService.js#L14-L407"
          },
          {
            "label": "Guardado de persona",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/PersonaService.js#L13-L61"
          }
        ]
      },
      {
        "id": "addresses",
        "group": "group-postgres",
        "title": "direccion_empresas · direcciones",
        "kind": "table",
        "subtitle": "Dirección y vínculo con empresa",
        "detail": "Valida referencia de empresa y RUT; aplica condiciones y catálogos auxiliares de comuna/tipo. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Direcciones: resolución de cliente y condiciones",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/DireccionesSyncService.js#L20-L315"
          }
        ]
      },
      {
        "id": "terms",
        "group": "group-postgres",
        "title": "estado_cuenta_plazos",
        "kind": "table",
        "subtitle": "Plazo completado si corresponde",
        "detail": "Tras aplicar cliente, el flujo puede consultar/completar plazo como trabajo posterior. No está dentro del commit ya cerrado del maestro. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Transacción por detalle y seguimiento posterior",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
          }
        ]
      },
      {
        "id": "accounts",
        "group": "group-postgres",
        "title": "estado_cuentas",
        "kind": "table",
        "subtitle": "Estado de cuenta recalculado",
        "detail": "El backend puede guardar derivados de deuda/saldo fuera de la trx del maestro. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Recálculo de estado de cuenta",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166"
          },
          {
            "label": "Migración: estado_cuentas",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/database/migrations/1640016682001_estado_cuentas_schema.js#L6-L17"
          }
        ]
      },
      {
        "id": "account-service",
        "group": "group-backend",
        "title": "CobranzaController → AcuerdoCobranzaService",
        "kind": "component",
        "subtitle": "Recálculo solicitado por LAN",
        "detail": "Recibe la solicitud local posterior al cliente y recalcula cuenta. Las consultas y condiciones auxiliares se detallan también en el flujo customer.",
        "sources": [
          {
            "label": "Ruta local de recálculo",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L527-L535"
          },
          {
            "label": "Controlador de actualización de deuda",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CobranzaController.js#L2058-L2102"
          },
          {
            "label": "Recálculo de estado de cuenta",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166"
          }
        ]
      }
    ],
    "edges": [
      {
        "id": "ax-mpos",
        "from": "origin",
        "to": "mpos",
        "label": "Alimentar tablas de cambios · productor pendiente",
        "protocol": "Por confirmar",
        "detail": "Relación informada; el lector confirma MPOS y tablas de cambio, no el mecanismo de carga desde AX.",
        "effect": "Cambios disponibles para lectores centrales.",
        "boundary": "No demuestra job diario, DDL, SP ni servidor compartido.",
        "certainty": "reported",
        "sources": [
          {
            "label": "MPOS, datasource y estados de origen",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/BOAX.java#L45-L69"
          },
          {
            "label": "Tabla de clientes, SP y lectura JDBC",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/tables/BOCliente.java#L26-L83"
          }
        ]
      },
      {
        "id": "count-call",
        "from": "task",
        "to": "dss",
        "label": "SOAP /services/DSS_AX_Clientes?wsdl · opGetCountClientesAX",
        "protocol": "SOAP",
        "detail": "TP_DSS_AX_Clientes envía SOAPAction urn:opGetCountClientesAX al endpoint DSS literal configurado.",
        "effect": "Obtiene count de pendientes.",
        "boundary": "Se conserva path del XML. Origin, versión instalada y binding efectivo no publicados ni acreditados.",
        "certainty": "code",
        "sources": [
          {
            "label": "SOAPAction opGetCountClientesAX",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/templates/TP_DSS_AX_Clientes.xml#L9-L22"
          },
          {
            "label": "Endpoint DSS, path y timeout",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/endpoints/EP_DSS_AX_Clientes.xml#L2-L7"
          },
          {
            "label": "Solo count > 0 dispara registro y cola",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_DSS_AX_Clientes.xml#L1-L18"
          }
        ]
      },
      {
        "id": "count-sql",
        "from": "dss",
        "to": "mpos",
        "label": "SELECT COUNT · CustTableSync WHERE Procesado=0",
        "protocol": "SQL",
        "detail": "DSS consulta la tabla sin prefijo. Java identifica MPOS para su lector; confirmar datasource DSS en instalación.",
        "effect": "Mide elegibilidad observada por DSS.",
        "boundary": "Count no certifica lote disponible ni versión aplicada en sucursal.",
        "certainty": "code",
        "sources": [
          {
            "label": "DSS: count, SP y actualización",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_AX_Clientes.dbs#L1-L83"
          },
          {
            "label": "MPOS, datasource y estados de origen",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/BOAX.java#L45-L69"
          }
        ]
      },
      {
        "id": "enqueue-job",
        "from": "task",
        "to": "queue-reader",
        "label": "count > 0 → MS_ProcesaRegistro → secuencia lectora",
        "protocol": "Interno",
        "detail": "La secuencia guarda trabajo en store JMS; SamplingProcessor invoca SEQ_Q_LeerColaBus.",
        "effect": "Programa generación de lotes con slug/origen/destino/count.",
        "boundary": "No es todavía persistencia/aplicación local; parámetros fuente/CAR pueden diferir.",
        "certainty": "code",
        "sources": [
          {
            "label": "Solo count > 0 dispara registro y cola",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_DSS_AX_Clientes.xml#L1-L18"
          },
          {
            "label": "Aviso de trabajo a MS_ProcesaRegistro",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_Q_CambioDesdeAx.xml#L27-L45"
          },
          {
            "label": "JMS / Andes y qlProcesaRegistro",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-stores/MS_ProcesaRegistro.xml#L2-L8"
          },
          {
            "label": "SamplingProcessor y concurrencia declarada",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-processors/MP_ProcesaRegistro.xml#L2-L6"
          }
        ]
      },
      {
        "id": "invoke-java",
        "from": "queue-reader",
        "to": "java",
        "label": "procesarCambiosAX · itemsPorPagina / límite de salida",
        "protocol": "Interno",
        "detail": "La secuencia pasa parámetros al mediador Java. Para clientes, valores generales de página 3000 y salida 100.",
        "effect": "Inicia paginación, transformación y distribución central.",
        "boundary": "No equivale a un lote atómico; páginas y mensajes de salida son unidades distintas.",
        "certainty": "code",
        "sources": [
          {
            "label": "Página, límite, mediador y aviso",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_Q_LeerColaBus.xml#L3-L55"
          },
          {
            "label": "Procesar cambios AX y seleccionar camino",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java#L962-L1062"
          }
        ]
      },
      {
        "id": "read-mpos",
        "from": "java",
        "to": "mpos",
        "label": "UPDATE 0→9→0; EXEC MPOS.dbo.sp_caja_custTable",
        "protocol": "SQL",
        "detail": "Prepara páginas y ejecuta SP por JDBC; el payload no pasa necesariamente por DSS.",
        "effect": "Recupera detalles de cliente de una página.",
        "boundary": "No se recibieron cuerpos SP; fila en estado 9 necesita recuperación si se interrumpe la fase.",
        "certainty": "code",
        "sources": [
          {
            "label": "Actualización de origen y paginación 0/9",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/BOAX.java#L212-L310"
          },
          {
            "label": "Tabla de clientes, SP y lectura JDBC",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/tables/BOCliente.java#L26-L83"
          },
          {
            "label": "Procesar cambios AX y seleccionar camino",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java#L962-L1062"
          }
        ]
      },
      {
        "id": "central-store-details",
        "from": "java",
        "to": "central-details",
        "label": "INSERT mensaje_entrada / bulk mensaje_detalles",
        "protocol": "SQL",
        "detail": "BOCliente registra entrada; BOGuardarData persiste detalles antes de marcar el origen.",
        "effect": "Conserva payload central en fases de persistencia.",
        "boundary": "No comparte una transacción con SQL Server ni con toda la distribución posterior.",
        "certainty": "code",
        "sources": [
          {
            "label": "Tabla de clientes, SP y lectura JDBC",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/tables/BOCliente.java#L26-L83"
          },
          {
            "label": "Tabla física public.mensaje_entrada",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeEntrada.java#L40-L65"
          },
          {
            "label": "Generar detalles, marcar origen y guardar salidas",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOGuardarData.java#L56-L208"
          },
          {
            "label": "Bulk PostgreSQL de detalles",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalle.java#L133-L170"
          }
        ]
      },
      {
        "id": "mark-origin",
        "from": "java",
        "to": "mpos",
        "label": "UPDATE Procesado=1 antes de cabeceras y salidas",
        "protocol": "SQL",
        "detail": "Tras bulk de detalles, se llama actualizarCambiosProcesadosAX antes de generar cabeceras/salidas.",
        "effect": "Retira origen de la selección normal Procesado=0.",
        "boundary": "Procesado en MPOS no significa aplicado en todas las sucursales. Conciliar fallos entre fases; incidente no probado.",
        "certainty": "code",
        "sources": [
          {
            "label": "Generar detalles, marcar origen y guardar salidas",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOGuardarData.java#L56-L208"
          },
          {
            "label": "Actualización de origen y paginación 0/9",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/BOAX.java#L212-L310"
          }
        ]
      },
      {
        "id": "central-store-header",
        "from": "java",
        "to": "central-headers",
        "label": "INSERT public.mensaje_cabeceras",
        "protocol": "SQL",
        "detail": "Construye cabeceras por tipo y entidad destino después de la marca de origen.",
        "effect": "Registra cabeceras de distribución.",
        "boundary": "Una cabecera no demuestra que todas las salidas estén disponibles ni aplicadas.",
        "certainty": "code",
        "sources": [
          {
            "label": "Generar detalles, marcar origen y guardar salidas",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOGuardarData.java#L56-L208"
          },
          {
            "label": "Tabla física public.mensaje_cabeceras",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeCabecera.java#L43-L65"
          },
          {
            "label": "Función fn_get_entidades",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOEntidades.java#L21-L51"
          }
        ]
      },
      {
        "id": "central-store-output",
        "from": "java",
        "to": "central-output",
        "label": "INSERT salidas y vínculos por destino · conexión compartida",
        "protocol": "SQL",
        "detail": "BOMensajeSalida usa una conexión para salidas y mensaje_detalle_sucursales y hace commit de esa unidad.",
        "effect": "Materializa sobres que API lectura puede entregar.",
        "boundary": "No integra detalles anteriores, cabeceras y MPOS en una trx global; algunos errores se registran sin propagar.",
        "certainty": "code",
        "sources": [
          {
            "label": "Generar detalles, marcar origen y guardar salidas",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOGuardarData.java#L56-L208"
          },
          {
            "label": "Bulk de salidas con conexión compartida",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeSalida.java#L47-L96"
          },
          {
            "label": "Detalles de destino con conexión heredada",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalleSucursal.java#L59-L120"
          }
        ]
      },
      {
        "id": "api-select",
        "from": "read-api",
        "to": "read-service",
        "label": "Validar, seleccionar y marcar salida con trx",
        "protocol": "Interno",
        "detail": "Controller llama servicios para cambios y recuperación; recibido usa update dentro de su propia trx.",
        "effect": "Ejecuta la lógica de cada petición.",
        "boundary": "Cada petición tiene su frontera; no es una trx compartida con sucursal.",
        "certainty": "code",
        "sources": [
          {
            "label": "GET cambios modifica estado y confirma trx",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L19-L109"
          },
          {
            "label": "Sin procesar y recibido",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L112-L191"
          },
          {
            "label": "Elegibilidad, selección, enviado y recuperación",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Services/MensajeSalidaService.js#L9-L134"
          }
        ]
      },
      {
        "id": "sent-state",
        "from": "read-service",
        "to": "central-output",
        "label": "SELECT salida; UPDATE enviado=true antes de respuesta",
        "protocol": "SQL",
        "detail": "Cambios obtiene salida y la marca enviada; controller confirma antes de HTTP. Se permite enviar con hasta 10 previas sin procesar según validación Node.",
        "effect": "Registra entrega intentada al consumidor.",
        "boundary": "Enviado no acredita recibido ni aplicado; SELECT/UPDATE no prueban exclusión concurrente.",
        "certainty": "code",
        "sources": [
          {
            "label": "Elegibilidad, selección, enviado y recuperación",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Services/MensajeSalidaService.js#L9-L134"
          },
          {
            "label": "GET cambios modifica estado y confirma trx",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L19-L109"
          }
        ]
      },
      {
        "id": "received-state",
        "from": "read-service",
        "to": "central-output",
        "label": "UPDATE recibido_sucursal=true; fecha_recibido",
        "protocol": "SQL",
        "detail": "POST recibido actualiza la salida por mensajeSalidaId y confirma su trx central.",
        "effect": "Acusa recepción antes de la persistencia local del sync.",
        "boundary": "Sin-procesar no excluye este estado; ACK temprano no prueba pérdida definitiva.",
        "certainty": "code",
        "sources": [
          {
            "label": "Sin procesar y recibido",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L112-L191"
          },
          {
            "label": "Elegibilidad, selección, enviado y recuperación",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Services/MensajeSalidaService.js#L9-L134"
          },
          {
            "label": "Sync acusa antes de guardar",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L79-L111"
          }
        ]
      },
      {
        "id": "result-state",
        "from": "read-api",
        "to": "central-output",
        "label": "UPDATE detalles procesado/error; salida procesado=true",
        "protocol": "SQL",
        "detail": "Procesados escribe resultados por detalle y, mediante el servicio, marca la salida seleccionada por el primer elemento.",
        "effect": "Registra resultado informado, incluidos fallos de aplicación.",
        "boundary": "No valida aquí homogeneidad/completitud del lote; procesado no equivale a éxito.",
        "certainty": "code",
        "sources": [
          {
            "label": "Procesados, contadores y estado de lote",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L194-L277"
          }
        ]
      },
      {
        "id": "result-count",
        "from": "read-api",
        "to": "central-headers",
        "label": "UPDATE total_sincronizados / total_errores += resultados",
        "protocol": "SQL",
        "detail": "Mediante MensajeCabeceraService incrementa contadores en la trx de procesados.",
        "effect": "Acumula resultados informados.",
        "boundary": "Repetir el mismo POST vuelve a sumar; total_sincronizados incluye ítems con error.",
        "certainty": "code",
        "sources": [
          {
            "label": "Procesados, contadores y estado de lote",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L194-L277"
          }
        ]
      },
      {
        "id": "recover-state",
        "from": "read-service",
        "to": "central-output",
        "label": "SELECT enviado=true AND procesado=false",
        "protocol": "SQL",
        "detail": "Sin-procesar reconsulta pendientes enviados sin filtrar recibido_sucursal.",
        "effect": "Permite reofertar también un lote acusado antes de su copia local.",
        "boundary": "No verifica por sí solo retención, deduplicación local ni recuperación efectiva.",
        "certainty": "code",
        "sources": [
          {
            "label": "Elegibilidad, selección, enviado y recuperación",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Services/MensajeSalidaService.js#L9-L134"
          },
          {
            "label": "Sin procesar y recibido",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L112-L191"
          }
        ]
      },
      {
        "id": "get-changes",
        "from": "download",
        "to": "read-api",
        "label": "GET mensajeSalidas/cambios",
        "protocol": "HTTP",
        "detail": "Solicita un lote por nombreEntidad/tipoMensaje; polling o aviso AMQP puede iniciar el recorrido. Controller/Service centrales ahora están disponibles.",
        "effect": "Obtiene un sobre para validación local.",
        "boundary": "Contrato relativo compatible; binding de producción y convivencia con API WSO2 codigoEntidad pendientes.",
        "certainty": "code",
        "sources": [
          {
            "label": "Descarga, recibido y procesados",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L318"
          },
          {
            "label": "Cola local: crear, seleccionar y procesar",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/ColaMensajeService.js#L17-L140"
          },
          {
            "label": "Cuatro rutas API lectura",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/start/routes.js#L19-L26"
          },
          {
            "label": "GET cambios modifica estado y confirma trx",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L19-L109"
          }
        ]
      },
      {
        "id": "get-recovery",
        "from": "download",
        "to": "read-api",
        "label": "GET mensajeSalidas/sin-procesar",
        "protocol": "HTTP",
        "detail": "Camino alternativo: pide enviados sin procesar. La consulta central no filtra recibido_sucursal; un lote acusado sigue siendo elegible mientras procesado=false.",
        "effect": "Recupera sobres pendientes según el contrato consumido.",
        "boundary": "Recuperación disponible en código, condicionada a retención, ejecución y aplicación; no prueba una recuperación exitosa.",
        "certainty": "code",
        "sources": [
          {
            "label": "Descarga, recibido y procesados",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L318"
          },
          {
            "label": "Elegibilidad, selección, enviado y recuperación",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Services/MensajeSalidaService.js#L9-L134"
          },
          {
            "label": "Sin procesar y recibido",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L112-L191"
          }
        ]
      },
      {
        "id": "receipt",
        "from": "download",
        "to": "read-api",
        "label": "POST mensajeSalidas/recibido",
        "protocol": "HTTP",
        "detail": "Notifica mensajeSalidaId antes de guardar el sobre local y continúa si la respuesta no declara error.",
        "effect": "Acusa recepción al servicio central.",
        "boundary": "Acuse HTTP y persistencia local no son atómicos; existe ventana entre ambos.",
        "certainty": "code",
        "sources": [
          {
            "label": "Descarga, recibido y procesados",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L318"
          },
          {
            "label": "Sin procesar y recibido",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L112-L191"
          }
        ]
      },
      {
        "id": "persist-envelope",
        "from": "download",
        "to": "messages",
        "label": "INSERT mensajes y mensaje_detalles; COMMIT local",
        "protocol": "SQL",
        "detail": "MensajeService inserta cabecera/detalles con una trx propia tras el acuse recibido.",
        "effect": "Conserva sobre y referencia al mensaje del concentrador.",
        "boundary": "No aplica todavía todos los maestros ni contiene futuras transacciones por detalle.",
        "certainty": "code",
        "sources": [
          {
            "label": "Transacción de sobre y detalles",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L15-L81"
          },
          {
            "label": "Modelo: sincronizador.mensajes",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/Mensaje.js#L6-L21"
          },
          {
            "label": "Modelo: sincronizador.mensaje_detalles",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/MensajeDetalle.js#L6-L14"
          },
          {
            "label": "Descarga, recibido y procesados",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L318"
          }
        ]
      },
      {
        "id": "read-detail",
        "from": "apply",
        "to": "messages",
        "label": "SELECT detalles pendientes del mensaje",
        "protocol": "SQL",
        "detail": "Carga detalles y procesa cada uno con su transacción según tipo.",
        "effect": "Obtiene el dato de maestro que se aplicará.",
        "boundary": "Un lote de clientes y otro de direcciones no constituyen una transacción global.",
        "certainty": "code",
        "sources": [
          {
            "label": "Transacción por detalle y seguimiento posterior",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
          }
        ]
      },
      {
        "id": "dispatch-client",
        "from": "apply",
        "to": "client-service",
        "label": "Aplicar tipo cliente con trx",
        "protocol": "Interno",
        "detail": "Rama de aplicación de cliente dentro de la transacción de ese detalle.",
        "effect": "Invoca su lógica de rematerialización local.",
        "boundary": "Alternativa de tipo; no obliga a aplicar una dirección en la misma transacción.",
        "certainty": "code",
        "sources": [
          {
            "label": "Transacción por detalle y seguimiento posterior",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
          },
          {
            "label": "Cliente: personas, empresas y auxiliares",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/ClientesSyncService.js#L14-L407"
          }
        ]
      },
      {
        "id": "write-client",
        "from": "client-service",
        "to": "clients",
        "label": "SELECT / INSERT / UPDATE personas, empresas y auxiliares",
        "protocol": "SQL",
        "detail": "Crea/actualiza persona y empresa; resuelve auxiliares según datos recibidos.",
        "effect": "Actualiza el maestro local.",
        "boundary": "Lecturas auxiliares no siempre usan trx. Error del detalle requiere tratamiento propio.",
        "certainty": "code",
        "sources": [
          {
            "label": "Cliente: personas, empresas y auxiliares",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/ClientesSyncService.js#L14-L407"
          },
          {
            "label": "Guardado de persona",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/PersonaService.js#L13-L61"
          }
        ]
      },
      {
        "id": "dispatch-address",
        "from": "apply",
        "to": "address-service",
        "label": "Aplicar tipo dirección con trx",
        "protocol": "Interno",
        "detail": "Rama de dirección, diferente de la de cliente.",
        "effect": "Invoca validación/resolución de empresa y dirección.",
        "boundary": "Cliente ausente puede hacer fallar este detalle; no se inventa identidad.",
        "certainty": "code",
        "sources": [
          {
            "label": "Transacción por detalle y seguimiento posterior",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
          },
          {
            "label": "Direcciones: resolución de cliente y condiciones",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/DireccionesSyncService.js#L20-L315"
          }
        ]
      },
      {
        "id": "write-address",
        "from": "address-service",
        "to": "addresses",
        "label": "SELECT / INSERT / UPDATE direccion_empresas y direcciones",
        "protocol": "SQL",
        "detail": "Aplica dirección/vínculo según identidad, vigencia y principal; usa catálogos auxiliares.",
        "effect": "Actualiza direcciones locales admitidas por las condiciones.",
        "boundary": "No significa reemplazar todas las direcciones ni sincronizar contactos.",
        "certainty": "code",
        "sources": [
          {
            "label": "Direcciones: resolución de cliente y condiciones",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/DireccionesSyncService.js#L20-L315"
          }
        ]
      },
      {
        "id": "detail-result",
        "from": "apply",
        "to": "messages",
        "label": "COMMIT / ROLLBACK detalle; UPDATE metadata posterior",
        "protocol": "SQL",
        "detail": "Primero finaliza la trx del maestro según resultado; después actualiza procesado/error y fechas del detalle sin esa trx.",
        "effect": "Registra seguimiento tras intentar aplicar el maestro.",
        "boundary": "La relación resume dos momentos, no una única transacción. Procesado puede coexistir con error.",
        "certainty": "code",
        "sources": [
          {
            "label": "Transacción por detalle y seguimiento posterior",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
          },
          {
            "label": "Modelo: sincronizador.mensaje_detalles",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/MensajeDetalle.js#L6-L14"
          }
        ]
      },
      {
        "id": "complete-term",
        "from": "apply",
        "to": "terms",
        "label": "SELECT / completar estado_cuenta_plazos, condicional",
        "protocol": "SQL",
        "detail": "Después de la rama cliente se intenta completar información de plazo.",
        "effect": "Trabajo auxiliar posterior al maestro ya aplicado.",
        "boundary": "No forma parte del commit del cliente; puede fallar sin deshacerlo.",
        "certainty": "code",
        "sources": [
          {
            "label": "Transacción por detalle y seguimiento posterior",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
          }
        ]
      },
      {
        "id": "recalculate-request",
        "from": "apply",
        "to": "account-service",
        "label": "GET public/cobranzas/actualizar-estado-cuenta",
        "protocol": "HTTP",
        "detail": "Mediante BackendSucursalService solicita al backend de la misma sucursal actualizar cuenta.",
        "effect": "Dispara recálculo posterior por LAN.",
        "boundary": "Ruta relativa verificada. El endpoint local tiene efectos; no es un acuse central.",
        "certainty": "code",
        "sources": [
          {
            "label": "HTTP posterior hacia backend de sucursal",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/BackendSucursalService.js#L189-L212"
          },
          {
            "label": "Ruta local de recálculo",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L527-L535"
          },
          {
            "label": "Controlador de actualización de deuda",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CobranzaController.js#L2058-L2102"
          }
        ]
      },
      {
        "id": "write-account",
        "from": "account-service",
        "to": "accounts",
        "label": "SELECT derivados; guardar estado_cuentas",
        "protocol": "SQL",
        "detail": "AcuerdoCobranzaService recalcula/guarda cuenta bajo sus condiciones; usa operaciones de negocio como insumo.",
        "effect": "Actualiza derivados locales de deuda/saldo.",
        "boundary": "Fuera de la trx del maestro; dependencias y consulta de saldo condicional se explican en customer.",
        "certainty": "code",
        "sources": [
          {
            "label": "Recálculo de estado de cuenta",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166"
          },
          {
            "label": "Migración: estado_cuentas",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/database/migrations/1640016682001_estado_cuentas_schema.js#L6-L17"
          }
        ]
      },
      {
        "id": "notify-processed",
        "from": "download",
        "to": "read-api",
        "label": "POST mensajeSalidas/procesados",
        "protocol": "HTTP",
        "detail": "Devuelve resultados por detalle, incluidos errores.",
        "effect": "Notifica el resultado de procesamiento al servicio central.",
        "boundary": "No significa que todos los maestros tuvieron éxito; el fallo HTTP se captura.",
        "certainty": "code",
        "sources": [
          {
            "label": "Descarga, recibido y procesados",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L318"
          },
          {
            "label": "Transacción por detalle y seguimiento posterior",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
          },
          {
            "label": "Procesados, contadores y estado de lote",
            "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L194-L277"
          }
        ]
      },
      {
        "id": "close-message",
        "from": "download",
        "to": "messages",
        "label": "UPDATE sincronizador.mensajes: procesado",
        "protocol": "SQL",
        "detail": "Después de notificar resultados, actualiza la cabecera local mediante otro guardado/transacción.",
        "effect": "Cierra seguimiento local del sobre.",
        "boundary": "No fusiona acuse, maestros, metadata, recálculo y notificación en un commit común.",
        "certainty": "code",
        "sources": [
          {
            "label": "Descarga, recibido y procesados",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L318"
          },
          {
            "label": "Modelo: sincronizador.mensajes",
            "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/Mensaje.js#L6-L21"
          }
        ]
      }
    ],
    "steps": [
      {
        "title": "1 · Detectar cambios centrales",
        "detail": "El productor AX→MPOS sigue pendiente. La tarea fuente consulta el count DSS, que lee pendientes SQL.",
        "edges": [
          "ax-mpos",
          "count-call",
          "count-sql"
        ],
        "boundary": "Ubicación, jobs reales y binding productivo no se infieren del código."
      },
      {
        "title": "2 · Encolar y generar detalles",
        "detail": "Si count>0, se encola trabajo. La secuencia invoca Java, que pagina/consulta MPOS directamente y persiste entrada/detalles.",
        "edges": [
          "enqueue-job",
          "invoke-java",
          "read-mpos",
          "central-store-details"
        ],
        "boundary": "DSS count, JDBC y lotes PostgreSQL son funciones distintas del concentrador."
      },
      {
        "title": "3 · Marcar origen y distribuir",
        "detail": "Java marca MPOS procesado antes de insertar cabeceras y salidas por destino.",
        "edges": [
          "mark-origin",
          "central-store-header",
          "central-store-output"
        ],
        "boundary": "No hay un commit global MPOS/PostgreSQL; la marca de origen no acredita aplicación en sucursal."
      },
      {
        "title": "4 · Pedir un lote",
        "detail": "Sync consume cambios; el receptor selecciona y marca enviado antes de la respuesta HTTP.",
        "edges": [
          "get-changes",
          "api-select",
          "sent-state"
        ],
        "boundary": "La variante API WSO2 tiene otro parámetro de entidad; confirmar binding."
      },
      {
        "title": "5 · Acusar antes de persistir",
        "detail": "Recibido cambia el estado central; después sync conserva el sobre en PostgreSQL local.",
        "edges": [
          "receipt",
          "received-state",
          "persist-envelope"
        ],
        "boundary": "Hay ventana sin custodia local, con reoferta sin-procesar disponible."
      },
      {
        "title": "6 · Elegir el servicio por detalle",
        "detail": "Lee detalles y despacha a cliente o dirección según tipo.",
        "edges": [
          "read-detail",
          "dispatch-client",
          "dispatch-address"
        ],
        "boundary": "Son alternativas con transacciones por detalle, no una trx de todo el lote."
      },
      {
        "title": "7 · Aplicar tablas de ese maestro",
        "detail": "Cliente modifica personas/empresas; dirección modifica sus tablas y necesita identificar al cliente.",
        "edges": [
          "write-client",
          "write-address"
        ],
        "boundary": "No se sustituyen indiscriminadamente todas las direcciones ni se administran existencias."
      },
      {
        "title": "8 · Finalizar detalle y guardar metadata",
        "detail": "Commit/rollback de maestro precede al guardado de seguimiento del detalle.",
        "edges": [
          "detail-result"
        ],
        "boundary": "Procesado no equivale a éxito y metadata queda fuera del commit anterior."
      },
      {
        "title": "9 · Recalcular cuenta cuando corresponde",
        "detail": "La rama cliente puede completar plazo y pedir recálculo al backend local.",
        "edges": [
          "complete-term",
          "recalculate-request",
          "write-account"
        ],
        "boundary": "Trabajo posterior que puede fallar sin revertir la ficha confirmada."
      },
      {
        "title": "10 · Informar y cerrar",
        "detail": "Sync informa éxitos y errores; API actualiza detalles/salida y suma contadores. Después sync marca su cabecera local.",
        "edges": [
          "notify-processed",
          "result-state",
          "result-count",
          "close-message"
        ],
        "boundary": "Repetición de procesados no es idempotente en contadores. No se acredita éxito de todo el lote."
      },
      {
        "title": "11 · Recuperar enviados pendientes",
        "detail": "Camino alternativo: consultar sin-procesar, incluido recibido_sucursal=true, y reintentar la recepción/aplicación.",
        "edges": [
          "get-recovery",
          "api-select",
          "recover-state"
        ],
        "boundary": "Disponible en código; validar retención, deduplicación, caídas y restore."
      }
    ]
  },
  {
    "id": "customer",
    "title": "Cliente por RUT: refresco de ficha y saldo condicionado",
    "mode": "current",
    "summary": "Cargar un cliente puede resolver su RUT, consultar el servicio remoto y rematerializar persona, empresa, direcciones y cupo. El saldo posterior tiene otro camino y otras escrituras.",
    "boundary": "Se muestra principalmente un refresco exitoso. Si falla, el controlador puede leer datos locales e intentar saldo sin un nuevo commit de ficha. No se escribe el cliente en AX ni se actualizan todos sus contactos en este recorrido.",
    "groups": [
      {
        "id": "group-frontend",
        "title": "Mountain · interfaz de caja",
        "repo": "mountain-implementos/frontend",
        "runtime": "Angular 8 / TypeScript",
        "zone": "PC de caja · Windows",
        "evidence": "Servicio de empresas y consumidor POS revisados; no petición por cada pulsación."
      },
      {
        "id": "group-backend",
        "title": "Mountain · backend de sucursal",
        "repo": "mountain-implementos/backend",
        "runtime": "AdonisJS / Node.js",
        "zone": "Servidor de sucursal"
      },
      {
        "id": "group-postgres",
        "title": "PostgreSQL de sucursal",
        "repo": "Modelos, SQL y migraciones de Mountain",
        "runtime": "PostgreSQL",
        "zone": "Sucursal",
        "evidence": "Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia."
      },
      {
        "id": "group-client-api",
        "title": "Servicio remoto de clientes/saldo",
        "repo": "Consumidor Mountain; receptor no identificado inequívocamente",
        "runtime": "Runtime del receptor por confirmar",
        "zone": "Dependencia remota configurable",
        "evidence": "Sufijos y parámetros observados; no atribuir automáticamente a ApiCliente .NET o una tabla AX."
      }
    ],
    "nodes": [
      {
        "id": "customer-ui",
        "group": "group-frontend",
        "title": "EmpresasService / consumidor POS",
        "kind": "component",
        "subtitle": "Cargar por ID o RUT",
        "detail": "GET empresas/:id y variante empresas/null con RUT. El consumidor POS puede limpiar el borrador al recibir error/datos nulos.",
        "sources": [
          {
            "label": "Angular: carga de empresa por ID o RUT",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/empresas.service.ts#L28-L54"
          },
          {
            "label": "UI: error puede limpiar el borrador",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/modules/pos/pages/punto-de-venta/punto-de-venta.component.ts#L410-L445"
          }
        ]
      },
      {
        "id": "controller",
        "group": "group-backend",
        "title": "EmpresaController.view",
        "kind": "component",
        "subtitle": "Refrescar y devolver relaciones",
        "detail": "Intenta refresco; después puede leer relaciones y saldo según rama. id=null puede devolver solo el ID temprano.",
        "sources": [
          {
            "label": "EmpresaController: ramas y relaciones",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L182"
          }
        ]
      },
      {
        "id": "company-service",
        "group": "group-backend",
        "title": "EmpresaService",
        "kind": "component",
        "subtitle": "Identidad, consulta y ficha",
        "detail": "Resuelve RUT e invoca cliente. Solo respuesta válida con CustTableRecId inicia el guardado de ficha con trx.",
        "sources": [
          {
            "label": "Resolver RUT y consultar cliente",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
          },
          {
            "label": "Validar y persistir ficha",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L130-L253"
          }
        ]
      },
      {
        "id": "address-service",
        "group": "group-backend",
        "title": "DireccionesService",
        "kind": "component",
        "subtitle": "Direcciones recibidas",
        "detail": "Aplica condiciones por dirección/vínculo. No representa reemplazo total ni guardado masivo de contactos.",
        "sources": [
          {
            "label": "Direcciones según payload",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DireccionesService.js#L9-L280"
          }
        ]
      },
      {
        "id": "account-service",
        "group": "group-backend",
        "title": "AcuerdoCobranzaService",
        "kind": "component",
        "subtitle": "Estado de cuenta posterior",
        "detail": "Puede consultar saldo remoto y recalcula deuda local no confirmada, cobranzas/abonos y acuerdos/cuotas.",
        "sources": [
          {
            "label": "Consulta saldo y actualización condicionada",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L917-L1017"
          },
          {
            "label": "Recálculo de estado de cuenta",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166"
          }
        ]
      },
      {
        "id": "clients",
        "group": "group-postgres",
        "title": "empresas · personas",
        "kind": "table",
        "subtitle": "Identidad y copia local",
        "detail": "Se leen para resolver RUT por ID y se crean/actualizan con la respuesta válida. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Resolver RUT y consultar cliente",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
          },
          {
            "label": "Validar y persistir ficha",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L130-L253"
          },
          {
            "label": "Guardar persona",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L375-L423"
          }
        ]
      },
      {
        "id": "addresses",
        "group": "group-postgres",
        "title": "direccion_empresas · direcciones",
        "kind": "table",
        "subtitle": "Dirección y vínculo",
        "detail": "Escrituras condicionadas al payload y sus estados. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Direcciones según payload",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DireccionesService.js#L9-L280"
          }
        ]
      },
      {
        "id": "terms",
        "group": "group-postgres",
        "title": "estado_cuenta_plazos",
        "kind": "table",
        "subtitle": "Plazo del estado de cuenta",
        "detail": "Consulta usada para completar cupo/plazo durante el guardado de ficha. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Cupo, plazo y commit de ficha",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L225-L268"
          }
        ]
      },
      {
        "id": "accounts",
        "group": "group-postgres",
        "title": "estado_cuentas",
        "kind": "table",
        "subtitle": "Cupo/plazo y saldo en momentos distintos",
        "detail": "Dentro de trx de ficha guarda cupo/plazo y saldo inicial si nueva; después saldo externo/derivados tienen otras escrituras. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Cupo, plazo y commit de ficha",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L225-L268"
          },
          {
            "label": "Consulta saldo y actualización condicionada",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L917-L1017"
          },
          {
            "label": "Migración: estado_cuentas",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/database/migrations/1640016682001_estado_cuentas_schema.js#L6-L17"
          }
        ]
      },
      {
        "id": "local-business",
        "group": "group-postgres",
        "title": "documentos, pagos, cobranzas y acuerdos",
        "kind": "table",
        "subtitle": "Insumos locales de recálculo",
        "detail": "Agrupación de tablas reales: documentos, comprobante_ventas y vínculos, pagos, cobranzas, abonos, cobranza_acuerdos y cobranza_cuotas. No es una tabla nueva. Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "sources": [
          {
            "label": "Recálculo de estado de cuenta",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166"
          }
        ]
      },
      {
        "id": "remote-client",
        "group": "group-client-api",
        "title": "Sufijo cliente",
        "kind": "external",
        "subtitle": "Consulta por _rutCliente",
        "detail": "Contrato consumido con timeout declarado de 30 segundos. Base configurada y receptor efectivo pendientes.",
        "sources": [
          {
            "label": "Resolver RUT y consultar cliente",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
          }
        ]
      },
      {
        "id": "remote-saldo",
        "group": "group-client-api",
        "title": "Sufijo saldo",
        "kind": "external",
        "subtitle": "Saldo externo condicionado",
        "detail": "Consulta de saldo con timeout declarado de 3 segundos en el snapshot. No se atribuyen tablas AX ni autoridad offline.",
        "sources": [
          {
            "label": "Consulta saldo y actualización condicionada",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L917-L1017"
          }
        ]
      }
    ],
    "edges": [
      {
        "id": "customer-request",
        "from": "customer-ui",
        "to": "controller",
        "label": "GET /empresas/:id",
        "protocol": "HTTP",
        "detail": "La interfaz carga por ID; otra variante usa id=null con query rut.",
        "effect": "Solicita ficha/refresco bajo demanda.",
        "boundary": "No acredita que cada tecla en el RUT dispare una petición.",
        "certainty": "code",
        "sources": [
          {
            "label": "Angular: carga de empresa por ID o RUT",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/empresas.service.ts#L28-L54"
          },
          {
            "label": "Ruta GET empresas/:id",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L50"
          },
          {
            "label": "EmpresaController: ramas y relaciones",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L182"
          }
        ]
      },
      {
        "id": "refresh-client",
        "from": "controller",
        "to": "company-service",
        "label": "buscarClienteEnLinea(id, RUT)",
        "protocol": "Interno",
        "detail": "El controlador pide al servicio resolver identidad e intentar actualización remota.",
        "effect": "Inicia el refresco de la copia local.",
        "boundary": "La llamada interna no implica escritura en ERP.",
        "certainty": "code",
        "sources": [
          {
            "label": "EmpresaController: ramas y relaciones",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L182"
          },
          {
            "label": "Resolver RUT y consultar cliente",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
          }
        ]
      },
      {
        "id": "resolve-rut",
        "from": "company-service",
        "to": "clients",
        "label": "SELECT empresas JOIN personas, si hay ID",
        "protocol": "SQL",
        "detail": "Obtiene identidad desde el ID local; sin ID normaliza el RUT recibido.",
        "effect": "Resuelve el parámetro para la consulta remota.",
        "boundary": "Lectura previa al guardado; Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "certainty": "code",
        "sources": [
          {
            "label": "Resolver RUT y consultar cliente",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
          }
        ]
      },
      {
        "id": "get-client",
        "from": "company-service",
        "to": "remote-client",
        "label": "GET ${URL_API_CLIENTES}cliente?_rutCliente=…",
        "protocol": "HTTP",
        "detail": "Construye URL configurada con sufijo cliente y consulta por RUT; valida respuesta y referencia externa.",
        "effect": "Recibe una ficha candidata a guardarse localmente.",
        "boundary": "Error o ausencia de CustTableRecId sale antes de abrir trx. Receptor/binding productivo pendientes.",
        "certainty": "code",
        "sources": [
          {
            "label": "Resolver RUT y consultar cliente",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
          },
          {
            "label": "Validar y persistir ficha",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L130-L253"
          }
        ]
      },
      {
        "id": "save-client",
        "from": "company-service",
        "to": "clients",
        "label": "INSERT / UPDATE personas y empresas con trx",
        "protocol": "SQL",
        "detail": "Con respuesta válida, crea/actualiza persona y empresa mediante ORM y resuelve auxiliares.",
        "effect": "Rematerializa la ficha en PostgreSQL local.",
        "boundary": "No actualiza los datos del ERP ni sincroniza todos los contactos.",
        "certainty": "code",
        "sources": [
          {
            "label": "Validar y persistir ficha",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L130-L253"
          },
          {
            "label": "Guardar persona",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L375-L423"
          }
        ]
      },
      {
        "id": "delegate-address",
        "from": "company-service",
        "to": "address-service",
        "label": "Procesar direcciones del payload con trx",
        "protocol": "Interno",
        "detail": "Delega las direcciones recibidas al servicio local.",
        "effect": "Aplica reglas de vínculo/vigencia/principal.",
        "boundary": "Puede conservar datos según condiciones; no es un reemplazo indiscriminado.",
        "certainty": "code",
        "sources": [
          {
            "label": "Validar y persistir ficha",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L130-L253"
          },
          {
            "label": "Direcciones según payload",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DireccionesService.js#L9-L280"
          }
        ]
      },
      {
        "id": "save-address",
        "from": "address-service",
        "to": "addresses",
        "label": "SELECT / INSERT / UPDATE direcciones y direccion_empresas",
        "protocol": "SQL",
        "detail": "Resuelve y guarda direcciones/vínculos que correspondan al payload y sus estados.",
        "effect": "Actualiza la copia local de direcciones.",
        "boundary": "Nombres sin esquema calificado; search_path y DDL productivos pendientes. No añadir public por inferencia.",
        "certainty": "code",
        "sources": [
          {
            "label": "Direcciones según payload",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DireccionesService.js#L9-L280"
          }
        ]
      },
      {
        "id": "read-term",
        "from": "company-service",
        "to": "terms",
        "label": "SELECT estado_cuenta_plazos",
        "protocol": "SQL",
        "detail": "Resuelve el plazo para el estado de cuenta de la ficha.",
        "effect": "Obtiene plazo aplicable al cliente.",
        "boundary": "No consulta aquí el saldo externo actualizado.",
        "certainty": "code",
        "sources": [
          {
            "label": "Cupo, plazo y commit de ficha",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L225-L268"
          }
        ]
      },
      {
        "id": "save-limit",
        "from": "company-service",
        "to": "accounts",
        "label": "Guardar cupo/plazo; saldo inicial si cuenta nueva",
        "protocol": "SQL",
        "detail": "En la trx de ficha guarda monto_cupo_credito, plazo y condiciones iniciales de la cuenta.",
        "effect": "Persiste el contexto de cuenta junto con la ficha.",
        "boundary": "La actualización posterior de monto_saldo_externo no pertenece a esta fase.",
        "certainty": "code",
        "sources": [
          {
            "label": "Cupo, plazo y commit de ficha",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L225-L268"
          },
          {
            "label": "Migración: estado_cuentas",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/database/migrations/1640016682001_estado_cuentas_schema.js#L6-L17"
          }
        ]
      },
      {
        "id": "commit-profile",
        "from": "company-service",
        "to": "controller",
        "label": "COMMIT ficha → devolver resultado al controlador",
        "protocol": "Interno",
        "detail": "Confirma la transacción válida de ficha; devuelve el resultado para decidir carga de relaciones o retorno temprano.",
        "effect": "Ficha local confirmada en el camino exitoso.",
        "boundary": "El commit es previo al retorno interno. Si falló el refresh no ocurre este commit y aun así puede continuar lectura local.",
        "certainty": "code",
        "sources": [
          {
            "label": "Cupo, plazo y commit de ficha",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L225-L268"
          },
          {
            "label": "EmpresaController: ramas y relaciones",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L182"
          }
        ]
      },
      {
        "id": "account-branch",
        "from": "controller",
        "to": "account-service",
        "label": "estadoDeCuenta(id, true), si corresponde",
        "protocol": "Interno",
        "detail": "En carga completa, con cuenta y cliente distinto de venta público, solicita estado de cuenta.",
        "effect": "Dispara consulta/recálculo posteriores.",
        "boundary": "La rama puede usar ficha local tras fallo de refresco; id=null puede haber retornado antes.",
        "certainty": "code",
        "sources": [
          {
            "label": "EmpresaController: ramas y relaciones",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L182"
          },
          {
            "label": "Recálculo de estado de cuenta",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166"
          }
        ]
      },
      {
        "id": "get-saldo",
        "from": "account-service",
        "to": "remote-saldo",
        "label": "GET ${URL_API_CLIENTES}saldo",
        "protocol": "HTTP",
        "detail": "Fuera de development consulta saldo remoto en la rama aplicable; solo respuesta sin error habilita actualizar saldo externo.",
        "effect": "Obtiene dato externo condicionado para el recálculo.",
        "boundary": "Fallo remoto no equivale a saldo cero; recálculo local puede continuar. No da permiso para crédito offline.",
        "certainty": "code",
        "sources": [
          {
            "label": "Consulta saldo y actualización condicionada",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L917-L1017"
          }
        ]
      },
      {
        "id": "read-local-debt",
        "from": "account-service",
        "to": "local-business",
        "label": "SELECT operaciones locales, abonos y cuotas",
        "protocol": "SQL",
        "detail": "Lee ventas/pagos pendientes de confirmación y cobranzas/acuerdos para derivar estado de cuenta.",
        "effect": "Integra deuda y pagos locales en el cálculo.",
        "boundary": "No es una lectura de stock ni una nueva venta.",
        "certainty": "code",
        "sources": [
          {
            "label": "Recálculo de estado de cuenta",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166"
          }
        ]
      },
      {
        "id": "save-account-result",
        "from": "account-service",
        "to": "accounts",
        "label": "UPDATE saldo externo, si válido; guardar derivados",
        "protocol": "SQL",
        "detail": "Actualiza saldo externo solo con respuesta sin error y guarda campos derivados según el camino de cálculo.",
        "effect": "Modifica la misma estado_cuentas fuera de la trx de ficha.",
        "boundary": "No es una transacción común con GET cliente, GET saldo ni los lotes de maestros.",
        "certainty": "code",
        "sources": [
          {
            "label": "Consulta saldo y actualización condicionada",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L917-L1017"
          },
          {
            "label": "Recálculo de estado de cuenta",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166"
          }
        ]
      },
      {
        "id": "customer-response",
        "from": "controller",
        "to": "customer-ui",
        "label": "Respuesta de GET /empresas/:id",
        "protocol": "HTTP",
        "detail": "Puede devolver ID temprano, ficha local o datos junto con error del refresh. El consumidor observado trata error/datos nulos limpiando la venta en preparación.",
        "effect": "Actualiza selección del cliente o el borrador en pantalla.",
        "boundary": "Limpiar el borrador no es DELETE de una venta persistida. Fallback offline funcional no certificado.",
        "certainty": "code",
        "sources": [
          {
            "label": "EmpresaController: ramas y relaciones",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L182"
          },
          {
            "label": "UI: error puede limpiar el borrador",
            "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/modules/pos/pages/punto-de-venta/punto-de-venta.component.ts#L410-L445"
          }
        ]
      }
    ],
    "steps": [
      {
        "title": "1 · Cargar y resolver identidad",
        "detail": "Angular pide cliente; el controlador delega y el servicio obtiene RUT desde la copia local si recibió ID.",
        "edges": [
          "customer-request",
          "refresh-client",
          "resolve-rut"
        ],
        "boundary": "Carga bajo demanda; no se afirma consulta por cada tecla."
      },
      {
        "title": "2 · Consultar ficha remota",
        "detail": "El servicio consulta cliente y exige respuesta válida con referencia externa antes del guardado.",
        "edges": [
          "get-client"
        ],
        "boundary": "Si falla, puede continuar la lectura local sin el commit de ficha mostrado en los siguientes pasos."
      },
      {
        "title": "3 · Rematerializar cliente y direcciones",
        "detail": "Guarda persona/empresa y procesa direcciones según sus condiciones.",
        "edges": [
          "save-client",
          "delegate-address",
          "save-address"
        ],
        "boundary": "No reemplaza todos los contactos ni escribe en AX."
      },
      {
        "title": "4 · Guardar cupo y confirmar ficha",
        "detail": "Lee plazo, guarda cuenta inicial y confirma la ficha; vuelve al controlador.",
        "edges": [
          "read-term",
          "save-limit",
          "commit-profile"
        ],
        "boundary": "El saldo posterior y la llamada remota previa quedan fuera de esta trx."
      },
      {
        "title": "5 · Consultar saldo en la rama aplicable",
        "detail": "La carga completa puede pedir estado de cuenta y saldo remoto.",
        "edges": [
          "account-branch",
          "get-saldo"
        ],
        "boundary": "No aplica a toda carga. Puede usar ficha antigua si falló el refresco; id=null puede retornar temprano."
      },
      {
        "title": "6 · Recalcular cuenta con datos locales",
        "detail": "Combina los insumos locales y guarda saldo/derivados bajo sus condiciones.",
        "edges": [
          "read-local-debt",
          "save-account-result"
        ],
        "boundary": "No confundir el saldo copiado con autorización para crédito offline."
      },
      {
        "title": "7 · Devolver ficha o tratar error",
        "detail": "El resultado vuelve a la interfaz y puede afectar la selección/borrador.",
        "edges": [
          "customer-response"
        ],
        "boundary": "Error de refresco no acredita pérdida ni borrado de una venta ya persistida."
      }
    ]
  }
];

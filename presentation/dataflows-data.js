/* Reviewed data journeys. Static content: never contacts corporate services. */
window.POS_DATAFLOWS = {
  "sourceDocument": "../docs/recorridos-datos-tablas.md",
  "flows": [
    {
      "id": "D01",
      "key": "dataflow-sale",
      "title": "Venta → persistencia → DTE",
      "summary": "El backend guarda documentos y pagos recibidos. Después del commit solicita la emisión fiscal y actualiza sus estados por separado.",
      "caveat": "La transacción de venta termina antes de facturar. _guardarEstadoDte absorbe errores de escritura: una llamada o respuesta fiscal no garantiza que dtes haya quedado actualizado. No se ha certificado la participación de todos los guardados Lucid en la misma trx.",
      "steps": [
        {
          "title": "Guardar la venta recibida",
          "text": "POST /punto-de-venta abre una transacción. Guarda cabecera y líneas, calcula impuestos y registra el comprobante y los pagos recibidos. Registrar un pago aquí no equivale a ejecutar un cargo bancario.",
          "nodes": [
            "REQ",
            "SAVE",
            "DOC",
            "TAX",
            "PAY"
          ],
          "endpoint": "POST /punto-de-venta",
          "sources": [
            {
              "label": "Guardado de documentos, comprobante y vínculos",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L309-L418"
            },
            {
              "label": "Documento y detalle con trx",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L586-L669"
            },
            {
              "label": "Lectura y recálculo de impuestos",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ImpuestosService.js#L17-L62"
            },
            {
              "label": "Guardado de pago y datos específicos",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L59-L100"
            },
            {
              "label": "Vínculos del pago al comprobante",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L105-L133"
            }
          ]
        },
        {
          "title": "Cerrar la transacción de venta",
          "text": "El backend confirma la transacción de venta. Para un documento solicitado como vigente, verifica cobranza y solicita facturación después. Un error posterior no deshace ese commit.",
          "nodes": [
            "SAVE",
            "COMMIT",
            "BILL"
          ],
          "sources": [
            {
              "label": "Controlador: commit y facturación posterior",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L151-L202"
            }
          ]
        },
        {
          "title": "Preparar el documento fiscal",
          "text": "El backend relee documentos del comprobante y DTE existentes. Intenta guardar dtes en estado en-preparacion antes de invocar al proveedor. Esa escritura está fuera de la transacción de venta.",
          "nodes": [
            "BILL",
            "DTE"
          ],
          "sources": [
            {
              "label": "Relectura del comprobante y fallo fiscal",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L209-L248"
            },
            {
              "label": "Preparación, llamada y resultado fiscal",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L295-L399"
            },
            {
              "label": "Persistencia DTE y catch local",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L463-L485"
            }
          ]
        },
        {
          "title": "Solicitar la emisión",
          "text": "El proveedor configurado procesa la emisión. El backend registra los errores de escritura de dtes; el recorrido puede continuar aunque la marca local anterior no se haya guardado.",
          "nodes": [
            "BILL",
            "DTE",
            "PROVIDER"
          ],
          "endpoint": "POST a FACTURACION_ACEPTA_SERVICIO o servicio SOAP Ingydev, según configuración",
          "sources": [
            {
              "label": "Preparación, llamada y resultado fiscal",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L295-L399"
            },
            {
              "label": "Persistencia DTE y catch local",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L463-L485"
            }
          ]
        },
        {
          "title": "Guardar el resultado por separado",
          "text": "Tras la respuesta o el error, se intenta actualizar dtes y se cambian estados de documentos/comprobante. Puede quedar la venta persistida con fallo fiscal. La integración con AX ocurre en otro recorrido.",
          "nodes": [
            "PROVIDER",
            "RESULT",
            "DTE",
            "STATE"
          ],
          "sources": [
            {
              "label": "Preparación, llamada y resultado fiscal",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L295-L399"
            },
            {
              "label": "Persistencia DTE y catch local",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L463-L485"
            },
            {
              "label": "Relectura del comprobante y fallo fiscal",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L209-L248"
            },
            {
              "label": "Facturación y cambio de estado del documento",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DocumentoService.js#L397-L434"
            }
          ]
        }
      ],
      "nodes": {
        "REQ": {
          "title": "POST /punto-de-venta",
          "description": "Entrada del guardado de venta. La facturación habitual es una llamada interna posterior al commit; GET /Documentos/facturar es una entrada de reintento distinta.",
          "db": "Angular → backend de sucursal",
          "operation": "SOLICITA GUARDADO",
          "sources": [
            {
              "label": "Controlador: commit y facturación posterior",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L151-L202"
            }
          ]
        },
        "SAVE": {
          "title": "Guardado del backend",
          "description": "Coordina guardados con trx. No se certifica atomicidad de todas las escrituras solo porque reciban un parámetro trx.",
          "db": "Backend / PostgreSQL sucursal",
          "operation": "PROCESA / ESCRIBE",
          "sources": [
            {
              "label": "Guardado de documentos, comprobante y vínculos",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L309-L418"
            },
            {
              "label": "Documento y detalle con trx",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L586-L669"
            },
            {
              "label": "Guardado de pago y datos específicos",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L59-L100"
            },
            {
              "label": "Vínculos del pago al comprobante",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L105-L133"
            }
          ]
        },
        "DOC": {
          "title": "documentos + detalle_documentos",
          "description": "Crea o actualiza el documento, elimina detalle previo y guarda líneas con trx. Los importes se actualizan durante el cálculo de impuestos.",
          "db": "PostgreSQL sucursal",
          "operation": "LEE / ESCRIBE",
          "sources": [
            {
              "label": "Documento y detalle con trx",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L586-L669"
            },
            {
              "label": "Lectura y recálculo de impuestos",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ImpuestosService.js#L17-L62"
            }
          ],
          "schemaEvidence": "Tablas PostgreSQL identificadas sin esquema calificado. search_path y DDL productivos pendientes."
        },
        "TAX": {
          "title": "documentos_has_impuestos",
          "description": "ImpuestosService lee líneas y relaciones de productos/producto_impuestos/impuestos, actualiza importes y reemplaza impuestos del documento. No implica stock ni evaluación local de ofertas.",
          "db": "PostgreSQL sucursal",
          "operation": "LEE / ESCRIBE",
          "sources": [
            {
              "label": "Lectura y recálculo de impuestos",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ImpuestosService.js#L17-L62"
            },
            {
              "label": "Nombre de la relación de impuestos",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DocumentoService.js#L161-L174"
            }
          ],
          "schemaEvidence": "Tablas PostgreSQL identificadas sin esquema calificado. search_path y DDL productivos pendientes."
        },
        "PAY": {
          "title": "Comprobante y pagos de la venta",
          "description": "Agrupa comprobante_ventas, comprobante_venta_has_documentos, pagos y pago_comprobante_ventas. Son cuatro tablas de la misma operación, no una tabla nueva. Vínculos y guardados específicos de NC requieren validar la propagación efectiva de trx.",
          "db": "PostgreSQL sucursal",
          "operation": "ESCRIBE",
          "sources": [
            {
              "label": "Guardado de documentos, comprobante y vínculos",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L309-L418"
            },
            {
              "label": "Guardado de pago y datos específicos",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L59-L100"
            },
            {
              "label": "Vínculos del pago al comprobante",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L105-L133"
            }
          ],
          "schemaEvidence": "Tablas PostgreSQL identificadas sin esquema calificado. search_path y DDL productivos pendientes.",
          "stateFields": "venta_finalizada=true cuando el documento solicitado es vigente; no confirma AX."
        },
        "COMMIT": {
          "title": "COMMIT de venta",
          "description": "El commit sucede antes de verificar cobranza y facturar. Un rollback intentado después no revierte la transacción ya confirmada.",
          "db": "PostgreSQL sucursal",
          "operation": "CIERRA TRANSACCIÓN",
          "sources": [
            {
              "label": "Controlador: commit y facturación posterior",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/PuntoDeVentaController.js#L151-L202"
            }
          ]
        },
        "BILL": {
          "title": "Backend Mountain · preparación fiscal",
          "description": "Relee documentos y DTE, evita refacturar si encuentra uno aprobado y prepara la solicitud. La ejecución normal parte del comprobante después del commit.",
          "db": "Backend sucursal",
          "operation": "LEE / PROCESA",
          "sources": [
            {
              "label": "Relectura del comprobante y fallo fiscal",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L209-L248"
            },
            {
              "label": "Preparación, llamada y resultado fiscal",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L295-L399"
            }
          ]
        },
        "DTE": {
          "title": "dtes: preparación y resultado",
          "description": "Una sola tabla recibe intentos de escritura antes y después del proveedor. El helper usa findOrCreate/merge/save sin la trx anterior y captura excepciones localmente. No se puede interpretar su retorno como garantía de persistencia.",
          "db": "PostgreSQL sucursal",
          "operation": "LEE / INTENTA ESCRIBIR",
          "sources": [
            {
              "label": "Preparación, llamada y resultado fiscal",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L295-L399"
            },
            {
              "label": "Persistencia DTE y catch local",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L463-L485"
            },
            {
              "label": "Migración con nombre dtes",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/database/migrations/1635954728771_dtes_schema.js#L6-L16"
            }
          ],
          "schemaEvidence": "Tablas PostgreSQL identificadas sin esquema calificado. search_path y DDL productivos pendientes.",
          "stateFields": "documento_id, estado_dte_id; folio, fecha y PDF según respuesta."
        },
        "PROVIDER": {
          "title": "Proveedor fiscal configurado",
          "description": "Acepta o Ingydev según configuración. El efecto externo no participa de la transacción PostgreSQL de la venta. El binding y contrato de recuperación productivo requieren validación.",
          "db": "Servicio fiscal externo",
          "operation": "SOLICITA EMISIÓN",
          "sources": [
            {
              "label": "Preparación, llamada y resultado fiscal",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L295-L399"
            },
            {
              "label": "Selección del proveedor",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L403-L414"
            }
          ]
        },
        "RESULT": {
          "title": "Procesar resultado fiscal",
          "description": "Intenta registrar respuesta o error y actualizar estados de negocio. Resultado fiscal y persistencia local son hechos distintos.",
          "db": "Backend sucursal",
          "operation": "PROCESA / ESCRIBE",
          "sources": [
            {
              "label": "Preparación, llamada y resultado fiscal",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L295-L399"
            },
            {
              "label": "Persistencia DTE y catch local",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Facturacion/FacturacionService.js#L463-L485"
            },
            {
              "label": "Facturación y cambio de estado del documento",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DocumentoService.js#L397-L434"
            }
          ]
        },
        "STATE": {
          "title": "documentos y comprobante_ventas, después del commit",
          "description": "Son las mismas tablas del guardado inicial, mostradas en otro momento. Se actualiza estado_documento_id; un fallo fiscal puede poner venta_finalizada=false.",
          "db": "PostgreSQL sucursal",
          "operation": "ESCRIBE",
          "sources": [
            {
              "label": "Facturación y cambio de estado del documento",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DocumentoService.js#L397-L434"
            },
            {
              "label": "Relectura del comprobante y fallo fiscal",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L209-L248"
            },
            {
              "label": "save de estado sin trx original",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DocumentoService.js#L303-L309"
            }
          ],
          "schemaEvidence": "Tablas PostgreSQL identificadas sin esquema calificado. search_path y DDL productivos pendientes.",
          "stateFields": "estado_documento_id, venta_finalizada."
        }
      }
    },
    {
      "id": "D02",
      "key": "dataflow-upload",
      "title": "Venta preparada → envío → respuesta AX",
      "summary": "Preparación local, recepción central, procesamiento AX y aplicación en sucursal son hitos distintos. El concentrador ahora tiene evidencia de Synapse/DSS, PostgreSQL, Node y mediadores Java.",
      "caveat": "Se representa la vía Node→cola SQL→Java del código. Activación y bindings efectivos pendientes: existe también MP_ProcesaRegistro. El ACK HTTP solo acusa recepción y ambos consumidores AMQP hacen ACK sin esperar el INSERT. No hay commit global PostgreSQL→AX→broker.",
      "steps": [
        {
          "title": "Seleccionar documentos elegibles",
          "text": "Sync lee documentos y relaciones. En la rama no development también exige condiciones fiscales sobre dtes. No envía automáticamente toda venta guardada.",
          "nodes": [
            "PREP",
            "DOC"
          ],
          "sources": [
            {
              "label": "Selección y marca anticipada del documento",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/VentasSyncUploadService.js#L20-L150"
            }
          ]
        },
        {
          "title": "Crear el sobre local",
          "text": "El sincronizador inserta sincronizador.mensajes y sincronizador.mensaje_detalles dentro de una transacción y confirma. Es una transacción posterior a la de la venta.",
          "nodes": [
            "PREP",
            "MSG"
          ],
          "sources": [
            {
              "label": "Transacción de cabecera y detalles",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L15-L81"
            },
            {
              "label": "Modelo → sincronizador.mensajes",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/Mensaje.js#L6-L21"
            },
            {
              "label": "Modelo → sincronizador.mensaje_detalles",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/MensajeDetalle.js#L6-L14"
            }
          ]
        },
        {
          "title": "Marcar preparado antes de enviar",
          "text": "Después de crear el mensaje, actualiza documentos.sincronizado=true fuera de la transacción anterior. Luego el emisor lee el sobre y realiza el POST al bus. Esa marca no confirma AX.",
          "nodes": [
            "MSG",
            "MARK",
            "SEND",
            "CENTRAL"
          ],
          "endpoint": "POST /api/mensajeEntradas/ingresar",
          "sources": [
            {
              "label": "Selección y marca anticipada del documento",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/VentasSyncUploadService.js#L20-L150"
            },
            {
              "label": "Leer mensaje de salida con detalles",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L223-L258"
            },
            {
              "label": "Envío HTTP al bus",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SincronizadorService.js#L87-L101"
            }
          ]
        },
        {
          "title": "Registrar recepción y encolar",
          "text": "El concentrador consulta la persistencia central e inserta public.mensaje_entrada antes de publicar trabajo al broker JMS. Devuelve procesado=true como recepción técnica, no confirmación AX.",
          "nodes": [
            "CENTRAL",
            "CENTRY",
            "CSTORE"
          ],
          "endpoint": "POST /api/mensajeEntradas/ingresar",
          "sources": [
            {
              "label": "Recepción HTTP, sobre y ACK técnico",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml#L18-L246"
            },
            {
              "label": "DSS invoca fn_crea_registro_consulta",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_RegistroConsultas.dbs#L1-L30"
            },
            {
              "label": "INSERT public.mensaje_entrada",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_MensajeEntrada.dbs#L1-L30"
            },
            {
              "label": "Store JMS qlProcesaRegistro",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-stores/MS_ProcesaRegistro.xml#L1-L9"
            }
          ]
        },
        {
          "title": "Separar recepción y procesamiento central",
          "text": "procesador-cola-bus recibe trabajo, solicita INSERT sin esperar y hace ACK. El concentrador reclama hasta 2 filas de public.cola_mensajes y procesa los detalles. Instancia/schema, bindings y activación pendientes; también hay una alternativa de consumo directo por WSO2.",
          "nodes": [
            "CSTORE",
            "CNODE",
            "CQUEUE",
            "CWORK"
          ],
          "sources": [
            {
              "label": "Consumidor AMQP: crear sin await y ACK",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/start/queueHooks.js#L30-L60"
            },
            {
              "label": "Tabla cola_mensajes sin schema explícito",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/app/Models/ColaMensaje.js#L6-L10"
            },
            {
              "label": "Claim SQL y marcar procesado",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassProcesaCola/src/main/java/cl/implementos/BO/BOColaMensaje.java#L18-L81"
            },
            {
              "label": "Trigger declarado y secuencia",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/tasks/Task_LeeMensajesCola.xml#L1-L9"
            },
            {
              "label": "Consumidor Synapse alternativo versionado",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-processors/MP_ProcesaRegistro.xml#L1-L7"
            }
          ]
        },
        {
          "title": "Preparar relaciones y registrar en AX",
          "text": "El concentrador crea detalles/cabecera/relación con commits separados y llama por HTTP a la API .NET. apiMountainPosCaja adapta la venta e invoca el servicio AX. La implementación interna de AX no está incluida.",
          "nodes": [
            "CWORK",
            "CDETAIL",
            "NET",
            "AX"
          ],
          "endpoint": "POST /apiMountainPOS/api/caja/mountainpos/creaFacturaOvFromPos",
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
              "label": "Bulk de relación y UPDATE respuesta AX",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalleSucursal.java#L59-L158"
            },
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
            },
            {
              "label": "Adaptación y proxy CreateSalesOrderwithDetailsV4",
              "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ServiciosAX/mountainPosCajaServices/NotaVenta.cs#L46-L245"
            }
          ]
        },
        {
          "title": "Guardar resultado y publicar retorno",
          "text": "El concentrador clasifica error y tablasAx, guarda respuesta/estados en PostgreSQL y publica por entidad de origen con el ID del detalle de sucursal. Procesado=true puede coexistir con error.",
          "nodes": [
            "NET",
            "CRESULT",
            "RETURN"
          ],
          "sources": [
            {
              "label": "Persistir resultado y notificar sucursal",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_Q_RespuestaAxASucursal.xml#L1-L44"
            },
            {
              "label": "Respuesta central y estados por destino",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java#L763-L861"
            },
            {
              "label": "Inspección de errores e INSERT historial",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalleSucursalErrores.java#L26-L146"
            },
            {
              "label": "Store por entidad y caso no soportado",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_OrquestaColaSucursal.xml#L1-L156"
            }
          ]
        },
        {
          "title": "Recibir respuesta y acusar al broker",
          "text": "El sincronizador solicita la creación de sincronizador.cola_mensajes y emite ACK a continuación, sin esperar a que termine el INSERT. Persistir la respuesta y acusar recibo son hechos distintos.",
          "nodes": [
            "RETURN",
            "RECEIVE",
            "QUEUE",
            "ACK"
          ],
          "sources": [
            {
              "label": "Crear cola sin await y emitir ACK",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/start/queueHooks.js#L36-L76"
            },
            {
              "label": "Crear y procesar cola local",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/ColaMensajeService.js#L17-L140"
            },
            {
              "label": "Modelo → sincronizador.cola_mensajes",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/ColaMensaje.js#L6-L10"
            }
          ]
        },
        {
          "title": "Aplicar el resultado a negocio",
          "text": "El worker lee la cola y el detalle asociado. Solo una respuesta de venta con CustInvoiceJour sin error activa id_externo y sincronizacion_confirmada. Una respuesta de pago se evalúa por separado.",
          "nodes": [
            "QUEUE",
            "APPLY",
            "CONFIRM"
          ],
          "sources": [
            {
              "label": "Crear y procesar cola local",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/ColaMensajeService.js#L17-L140"
            },
            {
              "label": "Aplicar respuesta AX por entidad",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L366-L591"
            }
          ]
        },
        {
          "title": "Actualizar el seguimiento después",
          "text": "Tras el commit de negocio se actualiza mensaje_detalles. La cola también termina con procesado y, cuando corresponde, error. Procesado no significa éxito ni todas estas escrituras son atómicas.",
          "nodes": [
            "CONFIRM",
            "META",
            "QUEUE"
          ],
          "sources": [
            {
              "label": "Aplicar respuesta AX por entidad",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L366-L591"
            },
            {
              "label": "Actualizar metadata después del commit",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L768-L780"
            },
            {
              "label": "Crear y procesar cola local",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/ColaMensajeService.js#L17-L140"
            }
          ]
        }
      ],
      "nodes": {
        "PREP": {
          "title": "Seleccionar y preparar venta",
          "description": "Construye datos para AX a partir de documentos elegibles. Los filtros y relaciones son más amplios que los dos nombres resumidos en el dibujo.",
          "db": "Sincronizador de sucursal",
          "operation": "LEE / PROCESA",
          "sources": [
            {
              "label": "Selección y marca anticipada del documento",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/VentasSyncUploadService.js#L20-L150"
            }
          ]
        },
        "DOC": {
          "title": "documentos + dtes, entrada del sync",
          "description": "Selecciona hasta 100 documentos. Lee empresas y relaciones de cliente, líneas/productos, pagos, caja/usuario y referencias. Fuera de development une dtes y direccion_empresas y exige condiciones fiscales.",
          "db": "PostgreSQL sucursal",
          "operation": "LEE",
          "sources": [
            {
              "label": "Selección y marca anticipada del documento",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/VentasSyncUploadService.js#L20-L150"
            },
            {
              "label": "Relaciones para el DTO AX",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/VentasSyncUploadService.js#L363-L395"
            }
          ],
          "schemaEvidence": "Tabla de negocio sin esquema calificado. El search_path y el DDL productivos requieren validación.",
          "stateFields": "documentos.sincronizado=false; empresa con referencia externa; filtros de tipo/estado según ambiente."
        },
        "MSG": {
          "title": "sincronizador.mensajes + sincronizador.mensaje_detalles",
          "description": "Cabecera y detalles del sobre se insertan con la misma trx y commit. El emisor luego los consulta. No se demuestra atomicidad con la transacción que originó la venta.",
          "db": "PostgreSQL sucursal / esquema sincronizador",
          "operation": "ESCRIBE / LEE",
          "sources": [
            {
              "label": "Modelo → sincronizador.mensajes",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/Mensaje.js#L6-L21"
            },
            {
              "label": "Modelo → sincronizador.mensaje_detalles",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/MensajeDetalle.js#L6-L14"
            },
            {
              "label": "Transacción de cabecera y detalles",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L15-L81"
            },
            {
              "label": "Leer mensaje de salida con detalles",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L223-L258"
            }
          ],
          "schemaEvidence": "Esquema sincronizador declarado explícitamente por static get table() en el modelo."
        },
        "MARK": {
          "title": "documentos.sincronizado, marca anticipada",
          "description": "UPDATE posterior a la creación del mensaje y anterior al HTTP. Es preparación local, no confirmación externa.",
          "db": "PostgreSQL sucursal",
          "operation": "ESCRIBE",
          "sources": [
            {
              "label": "Selección y marca anticipada del documento",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/VentasSyncUploadService.js#L20-L150"
            }
          ],
          "schemaEvidence": "Tabla de negocio sin esquema calificado. El search_path y el DDL productivos requieren validación.",
          "stateFields": "sincronizado=true; sincronizacion_confirmada no se activa aquí."
        },
        "SEND": {
          "title": "Leer y enviar el sobre",
          "description": "Consulta mensaje, detalles y tipos antes de llamar al bus por HTTP. Su respuesta no prueba un commit en AX.",
          "db": "Sync → bus configurable",
          "operation": "LEE / ENVÍA",
          "sources": [
            {
              "label": "Leer mensaje de salida con detalles",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L223-L258"
            },
            {
              "label": "Envío HTTP al bus",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SincronizadorService.js#L87-L101"
            }
          ]
        },
        "CENTRAL": {
          "title": "mountain-concentrador · recepción de operaciones",
          "description": "mountain-concentrador recibe POST /api/mensajeEntradas/ingresar, invoca DSS de consulta y mensaje, publica un store y devuelve procesado=true antes de AX.",
          "db": "mountain-concentrador / WSO2",
          "operation": "RECIBE / SOLICITA SQL / PUBLICA",
          "evidence": "Código b2fd1ec; instalación y bindings pendientes",
          "sources": [
            {
              "label": "Recepción HTTP, sobre y ACK técnico",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_mensajeEntradas.xml#L18-L246"
            },
            {
              "label": "DSS invoca fn_crea_registro_consulta",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_RegistroConsultas.dbs#L1-L30"
            },
            {
              "label": "INSERT public.mensaje_entrada",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_MensajeEntrada.dbs#L1-L30"
            }
          ],
          "schemaEvidence": "DSS usa public.fn_crea_registro_consulta e INSERT public.mensaje_entrada; función SQL interna no incluida."
        },
        "RECEIVE": {
          "title": "Consumidor AMQP",
          "description": "Decodifica el aviso, inicia crear cola sin await y acusa recibo inmediatamente después. La configuración del broker y sus garantías productivas siguen pendientes.",
          "db": "Broker → sincronizador sucursal",
          "operation": "RECIBE / SOLICITA ESCRITURA",
          "sources": [
            {
              "label": "Crear cola sin await y emitir ACK",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/start/queueHooks.js#L36-L76"
            }
          ]
        },
        "QUEUE": {
          "title": "sincronizador.cola_mensajes",
          "description": "Se intenta insertar el aviso/respuesta local. El worker lee hasta 40 registros y marca en_proceso; después registra procesado/error.",
          "db": "PostgreSQL sucursal / esquema sincronizador",
          "operation": "ESCRIBE / LEE",
          "sources": [
            {
              "label": "Modelo → sincronizador.cola_mensajes",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/ColaMensaje.js#L6-L10"
            },
            {
              "label": "Crear y procesar cola local",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/ColaMensajeService.js#L17-L140"
            }
          ],
          "schemaEvidence": "Esquema sincronizador declarado explícitamente por static get table() en el modelo.",
          "stateFields": "en_proceso, procesado, error. Procesado puede contener un resultado fallido."
        },
        "ACK": {
          "title": "ACK de transporte",
          "description": "Se envía sin esperar la promesa de creación de la cola local. No confirma la aplicación del resultado ni acredita que la respuesta sea recuperable en PostgreSQL.",
          "db": "Consumidor → broker",
          "operation": "ACUSA RECEPCIÓN",
          "sources": [
            {
              "label": "Crear cola sin await y emitir ACK",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/start/queueHooks.js#L36-L76"
            }
          ]
        },
        "APPLY": {
          "title": "Aplicar respuesta por entidad",
          "description": "Lee mensaje_detalles y negocio. Puede actualizar OV; solo la respuesta CustInvoiceJour de AX sin error activa su confirmación. Pago-factura tiene una rama diferente.",
          "db": "Worker sync / PostgreSQL sucursal",
          "operation": "LEE / ESCRIBE",
          "sources": [
            {
              "label": "Aplicar respuesta AX por entidad",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L366-L591"
            }
          ]
        },
        "CONFIRM": {
          "title": "documentos, confirmación de venta",
          "description": "En la transacción de aplicación, una entrada CustInvoiceJour con error=false activa id_externo, sincronizado y sincronizacion_confirmada. No demuestra INSERT directo en una tabla física AX.",
          "db": "PostgreSQL sucursal",
          "operation": "ESCRIBE / COMMIT",
          "sources": [
            {
              "label": "Aplicar respuesta AX por entidad",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L366-L591"
            }
          ],
          "schemaEvidence": "Tabla de negocio sin esquema calificado. El search_path y el DDL productivos requieren validación.",
          "stateFields": "ov según respuesta; id_externo, sincronizado=true, sincronizacion_confirmada=true en la condición satisfactoria."
        },
        "META": {
          "title": "Metadata posterior: detalle y cola",
          "description": "Actualiza sincronizador.mensaje_detalles después del commit de negocio; el worker actualiza sincronizador.cola_mensajes al terminar. Son escrituras posteriores, no una única transacción con documentos.",
          "db": "La misma PostgreSQL / esquema sincronizador",
          "operation": "ESCRIBE",
          "sources": [
            {
              "label": "Modelo → sincronizador.mensaje_detalles",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/MensajeDetalle.js#L6-L14"
            },
            {
              "label": "Modelo → sincronizador.cola_mensajes",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/ColaMensaje.js#L6-L10"
            },
            {
              "label": "Aplicar respuesta AX por entidad",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L366-L591"
            },
            {
              "label": "Actualizar metadata después del commit",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L768-L780"
            },
            {
              "label": "Crear y procesar cola local",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/ColaMensajeService.js#L17-L140"
            }
          ],
          "schemaEvidence": "Esquema sincronizador declarado explícitamente por static get table() en el modelo.",
          "stateFields": "procesado, error, respuesta_externa y fechas en el detalle; procesado/error en la cola."
        },
        "CENTRY": {
          "title": "public.mensaje_entrada / registro de consulta",
          "description": "DSS invoca public.fn_crea_registro_consulta y luego INSERT del sobre JSON. PostgreSQL y store JMS no comparten un commit global demostrado.",
          "db": "PostgreSQL concentrador",
          "operation": "ESCRIBE",
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
        "CSTORE": {
          "title": "Broker JMS / AMQP · trabajo de integración",
          "description": "Store JMS versionado. Consumidor Node usa ESB_BROKER_QUEUE configurable; cotejar binding. SamplingProcessor es otra configuración versionada, no una segunda etapa obligatoria. Implementación identificada: MS_ProcesaRegistro / qlProcesaRegistro.",
          "db": "Broker / JMS",
          "operation": "PUBLICA / ENTREGA",
          "sources": [
            {
              "label": "Store JMS qlProcesaRegistro",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-stores/MS_ProcesaRegistro.xml#L1-L9"
            },
            {
              "label": "Consumidor Synapse alternativo versionado",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/message-processors/MP_ProcesaRegistro.xml#L1-L7"
            },
            {
              "label": "Nombre de cola y broker por configuración",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/procesador-cola-bus/start/queueHooks.js#L4-L13"
            }
          ]
        },
        "CNODE": {
          "title": "mountain-concentrador / procesador-cola-bus",
          "description": "Node decodifica XML, llama crear sin await y hace ACK. El cron elimina procesados correctos; no llama AX.",
          "db": "Aplicación central · Node / AdonisJS",
          "operation": "RECIBE / SOLICITA INSERT",
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
        "CQUEUE": {
          "title": "public.cola_mensajes",
          "description": "Java reclama hasta2 filas no procesadas/no en proceso y marca en_proceso=true; luego procesado=true,en_proceso=false. Node escribe tabla no calificada: validar instancia/search_path.",
          "db": "PostgreSQL concentrador",
          "operation": "ESCRIBE / LEE / MARCA",
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
        "CWORK": {
          "title": "Procesar operaciones en el concentrador",
          "description": "Task/ProcesaCola lee cola; secuencias y mediador descomponen, consultan duplicados y seleccionan ventas. Respuesta previa exitosa permite evitar AX; probar sobres con estados mezclados. Implementación identificada: Task_LeeMensajesCola / RegistraMensajeDetalle.",
          "db": "mountain-concentrador / WSO2",
          "operation": "LEE / PROCESA / ENVÍA",
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
        "CDETAIL": {
          "title": "mensaje_detalles / mensaje_cabeceras / mensaje_detalle_sucursales",
          "description": "Escrituras public. Detalle, cabecera y relación por destino se guardan con métodos/commits separados. No confundir ID central con ID original de sucursal.",
          "db": "PostgreSQL concentrador",
          "operation": "LEE / ESCRIBE",
          "sources": [
            {
              "label": "Bulk con commits parciales",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalle.java#L133-L170"
            },
            {
              "label": "INSERT cabecera y UPDATE contadores",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeCabecera.java#L43-L85"
            },
            {
              "label": "Bulk de relación y UPDATE respuesta AX",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalleSucursal.java#L59-L158"
            },
            {
              "label": "Identidad de origen y búsqueda de resultado",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalle.java#L328-L416"
            }
          ]
        },
        "NET": {
          "title": "apiMountainPosCaja · adaptación de ventas",
          "description": "apis-implementos expone el receptor compatible; construye VentaContract y llama CreateSalesOrderwithDetailsV4. Prefijo de publicación de EP_Ventas y despliegue pendientes. Implementación identificada: CajaController / NotaVenta.",
          "db": "apis-implementos · API .NET de AX",
          "operation": "RECIBE / ADAPTA / INVoca",
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
            },
            {
              "label": "Adaptación y proxy CreateSalesOrderwithDetailsV4",
              "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ServiciosAX/mountainPosCajaServices/NotaVenta.cs#L46-L245"
            }
          ]
        },
        "AX": {
          "title": "Servicio AX de venta",
          "description": "Proxy WCF verificado desde .NET. Código servidor, idempotencia y transacciones internas AX no incluidos; nombres de tablas en respuesta no prueban INSERT internos.",
          "db": "AX externo al código revisado",
          "operation": "PROCESA / RESPONDE",
          "sources": [
            {
              "label": "Adaptación y proxy CreateSalesOrderwithDetailsV4",
              "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ServiciosAX/mountainPosCajaServices/NotaVenta.cs#L46-L245"
            }
          ]
        },
        "CRESULT": {
          "title": "Resultado por destino / historial de errores",
          "description": "Registra data_respuesta, procesado/error/reintento y mensaje_detalle_sucursal_errores. Inspecciona error exterior y tablasAx. Guardado y publicación JMS son separados.",
          "db": "PostgreSQL concentrador / public",
          "operation": "ESCRIBE RESULTADO",
          "sources": [
            {
              "label": "Respuesta central y estados por destino",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java#L763-L861"
            },
            {
              "label": "Inspección de errores e INSERT historial",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalleSucursalErrores.java#L26-L146"
            },
            {
              "label": "Bulk de relación y UPDATE respuesta AX",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalleSucursal.java#L59-L158"
            }
          ]
        },
        "RETURN": {
          "title": "Preparar respuesta por sucursal",
          "description": "Después de intentar guardar el resultado arma axRespuesta y mensajeDetalleId de sucursal; selecciona store por origen. Caso no soportado solo registra log aquí. Implementación identificada: SEQ_Q_RespuestaAxASucursal / store por entidad.",
          "db": "mountain-concentrador / WSO2 y broker",
          "operation": "PUBLICA RESPUESTA",
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
        }
      }
    },
    {
      "id": "D03",
      "key": "dataflow-masters",
      "title": "MPOS → lotes centrales → maestros locales",
      "summary": "El concentrador cuenta pendientes mediante DSS, lee MPOS con Java/JDBC y genera lotes PostgreSQL. API lectura los entrega; sync acusa recepción antes de guardarlos y aplica detalles uno a uno.",
      "caveat": "El productor AX→MPOS y el despliegue siguen pendientes. Java marca MPOS antes de completar cabeceras/salidas. Recibido precede al commit local, pero sin-procesar todavía reofrece enviado=true/procesado=false sin excluir recibido. No hay transacción global ni éxito íntegro implícito.",
      "steps": [
        {
          "title": "Detectar pendientes en MPOS",
          "text": "El productor AX→MPOS sigue sin implementación recibida. El concentrador consulta pendientes en CustTableSync con Procesado=0. El intervalo configurado y las variantes de despliegue no acreditan el calendario productivo.",
          "nodes": [
            "ORIGIN",
            "MPOS",
            "DSS"
          ],
          "endpoint": "SOAP /services/DSS_AX_Clientes?wsdl; opGetCountClientesAX",
          "sources": [
            {
              "label": "MPOS, datasource y estados de origen",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/BOAX.java#L45-L69"
            },
            {
              "label": "Tabla de clientes, SP y lectura JDBC",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/tables/BOCliente.java#L26-L83"
            },
            {
              "label": "Task de clientes",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/tasks/Task_SincronizaClientes.xml#L1-L9"
            },
            {
              "label": "Solo count > 0 dispara registro y cola",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_DSS_AX_Clientes.xml#L1-L18"
            },
            {
              "label": "DSS: count, SP y actualización",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_AX_Clientes.dbs#L1-L83"
            },
            {
              "label": "Endpoint DSS, path y timeout",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/endpoints/EP_DSS_AX_Clientes.xml#L2-L7"
            }
          ]
        },
        {
          "title": "Generar detalles desde MPOS",
          "text": "Si count>0, se publica trabajo al broker. El concentrador pagina MPOS, ejecuta sp_caja_custTable por JDBC y persiste entrada/detalles en PostgreSQL. La consulta de cantidad y la obtención del contenido son operaciones distintas.",
          "nodes": [
            "DSS",
            "JAVA",
            "MPOS",
            "CENTRALDATA"
          ],
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
              "label": "Página, límite, mediador y aviso",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/sequences/SEQ_Q_LeerColaBus.xml#L3-L55"
            },
            {
              "label": "Procesar cambios AX y seleccionar camino",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/RegistraMensajeDetalle.java#L962-L1062"
            },
            {
              "label": "Tabla de clientes, SP y lectura JDBC",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/tables/BOCliente.java#L26-L83"
            },
            {
              "label": "Tabla física public.mensaje_entrada",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeEntrada.java#L40-L65"
            },
            {
              "label": "Bulk PostgreSQL de detalles",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeDetalle.java#L133-L170"
            }
          ]
        },
        {
          "title": "Marcar origen y construir salidas",
          "text": "El concentrador marca MPOS procesado tras guardar los detalles, antes de insertar cabeceras/salidas. Los vínculos de destino comparten conexión con las salidas; eso no incluye todas las fases ni SQL Server.",
          "nodes": [
            "JAVA",
            "MPOS",
            "CENTRALDATA",
            "CENTRALOUT"
          ],
          "sources": [
            {
              "label": "Generar detalles, marcar origen y guardar salidas",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOGuardarData.java#L56-L208"
            },
            {
              "label": "Actualización de origen y paginación 0/9",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/BOAX.java#L212-L310"
            },
            {
              "label": "Tabla física public.mensaje_cabeceras",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeCabecera.java#L43-L65"
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
          "title": "Pedir cambios a la API de lectura",
          "text": "Polling o aviso AMQP puede iniciar la búsqueda. El receptor api-lectura está en mountain-concentrador: selecciona una salida, marca enviado y confirma antes de responder. Sync valida destino/datos; binding productivo pendiente.",
          "nodes": [
            "CENTRALOUT",
            "API",
            "SYNC"
          ],
          "endpoint": "GET mensajeSalidas/cambios; recuperación: mensajeSalidas/sin-procesar",
          "sources": [
            {
              "label": "Descarga, recibido, guardado y procesados",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L318"
            },
            {
              "label": "Crear y procesar cola local",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/ColaMensajeService.js#L17-L140"
            },
            {
              "label": "Cuatro rutas API lectura",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/start/routes.js#L19-L26"
            },
            {
              "label": "GET cambios modifica estado y confirma trx",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L19-L109"
            },
            {
              "label": "Elegibilidad, selección, enviado y recuperación",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Services/MensajeSalidaService.js#L9-L134"
            }
          ]
        },
        {
          "title": "Acusar recepción antes de guardar",
          "text": "El sync llama recibido antes del INSERT local. El receptor marca recibido_sucursal y hace commit; si el acuse no declara error, sync crea mensajes/detalles con otra transacción. Sin-procesar sigue incluyendo recibidos no procesados.",
          "nodes": [
            "SYNC",
            "RECEIPT",
            "CENTRALOUT",
            "MSG"
          ],
          "endpoint": "POST mensajeSalidas/recibido",
          "sources": [
            {
              "label": "Descarga, recibido, guardado y procesados",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L318"
            },
            {
              "label": "Transacción de cabecera y detalles",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L15-L81"
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
          "title": "Aplicar un detalle de cliente o dirección",
          "text": "El worker abre una transacción por detalle. Un cliente modifica personas/empresas y auxiliares; una dirección modifica direccion_empresas/direcciones y necesita resolver su cliente. Son tipos alternativos, no una transacción conjunta.",
          "nodes": [
            "MSG",
            "APPLY",
            "CLIENT",
            "ADDRESS"
          ],
          "sources": [
            {
              "label": "Transacción por detalle y metadata posterior",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
            },
            {
              "label": "Aplicación de clientes y auxiliares",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/ClientesSyncService.js#L14-L407"
            },
            {
              "label": "Aplicación condicionada de direcciones",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/DireccionesSyncService.js#L20-L315"
            }
          ]
        },
        {
          "title": "Confirmar ese detalle y registrar su resultado",
          "text": "Sin error se confirma; con error controlado se revierte. Después se actualiza metadata del detalle fuera de esa transacción. Procesado puede significar que se registró un error, no que el maestro se aplicó bien.",
          "nodes": [
            "APPLY",
            "RESULT",
            "MSG"
          ],
          "sources": [
            {
              "label": "Transacción por detalle y metadata posterior",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
            }
          ]
        },
        {
          "title": "Recalcular cuenta si corresponde",
          "text": "Después de cliente se intenta completar plazo y pedir recálculo al backend local, que puede guardar estado_cuentas. Este trabajo posterior puede fallar sin deshacer el cliente ya confirmado.",
          "nodes": [
            "RESULT",
            "ACCOUNT"
          ],
          "endpoint": "GET public/cobranzas/actualizar-estado-cuenta (backend local)",
          "sources": [
            {
              "label": "Recálculo posterior por backend local",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/BackendSucursalService.js#L189-L212"
            },
            {
              "label": "Cálculo y guardado de estado de cuenta",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166"
            },
            {
              "label": "Ruta local de recálculo de cuenta",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L527-L535"
            },
            {
              "label": "Controlador que recibe el recálculo",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CobranzaController.js#L2058-L2102"
            }
          ]
        },
        {
          "title": "Informar resultados y cerrar el mensaje",
          "text": "POST procesados transmite resultados incluidos errores; central marca detalles/salida y suma contadores de la cabecera. Después sync marca su cabecera local con otra escritura. Repetir procesados vuelve a sumar: total_sincronizados no cuenta solo éxitos.",
          "nodes": [
            "RESULT",
            "DONE",
            "CENTRALOUT",
            "MSG"
          ],
          "endpoint": "POST mensajeSalidas/procesados",
          "sources": [
            {
              "label": "Descarga, recibido, guardado y procesados",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L318"
            },
            {
              "label": "Transacción por detalle y metadata posterior",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
            },
            {
              "label": "Procesados, contadores y estado de lote",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L194-L277"
            }
          ]
        },
        {
          "title": "Recuperar un enviado no procesado",
          "text": "Ruta alternativa: GET sin-procesar consulta enviado=true/procesado=false, sin filtrar recibido_sucursal. Permite reofertar un lote acusado sin copia local, pero retención, reintento y deduplicación requieren pruebas. No se declara pérdida definitiva ni recuperación garantizada.",
          "nodes": [
            "SYNC",
            "API",
            "CENTRALOUT"
          ],
          "endpoint": "GET mensajeSalidas/sin-procesar",
          "sources": [
            {
              "label": "Elegibilidad, selección, enviado y recuperación",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Services/MensajeSalidaService.js#L9-L134"
            },
            {
              "label": "Sin procesar y recibido",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L112-L191"
            },
            {
              "label": "Relectura de pendientes",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L118-L164"
            },
            {
              "label": "GET y POST hacia API lectura",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L164-L287"
            }
          ]
        }
      ],
      "nodes": {
        "ORIGIN": {
          "title": "AX → productor de cambios pendiente",
          "description": "El usuario informa cambios desde AX hacia MPOS. El código recibido demuestra lectores MPOS, no quién alimenta la base ni un job diario o servidor compartido.",
          "db": "ERP / productor por identificar",
          "operation": "PRODUCCIÓN DE CAMBIOS PENDIENTE",
          "sources": [
            {
              "label": "MPOS, datasource y estados de origen",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/BOAX.java#L45-L69"
            },
            {
              "label": "Tabla de clientes, SP y lectura JDBC",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/AX/tables/BOCliente.java#L26-L83"
            }
          ],
          "evidence": "Relación informada; lector comprobado",
          "schemaEvidence": "MPOS sí aparece en el lector Java; productor y DDL pendientes."
        },
        "API": {
          "title": "mountain-concentrador / api-lectura",
          "description": "Receptores AdonisJS en mountain-concentrador: cambios selecciona y marca enviado; sin-procesar recupera enviado=true/procesado=false sin excluir recibido. API WSO2 paralela usa codigoEntidad; este receptor y sync usan nombreEntidad. Implementación identificada: api-lectura: MensajeSalidasController / Service.",
          "db": "API de lectura / PostgreSQL central",
          "operation": "LEE / MARCA ENVÍO / RECUPERA",
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
              "label": "Elegibilidad, selección, enviado y recuperación",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Services/MensajeSalidaService.js#L9-L134"
            },
            {
              "label": "API WSO2 paralela: contrato diferente",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ESBImplementos/src/main/synapse-config/api/API_mensajeSalidas.xml#L2-L101"
            },
            {
              "label": "GET y POST hacia API lectura",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L164-L287"
            }
          ],
          "evidence": "Consumidor y receptor compatibles en código; binding instalado pendiente"
        },
        "SYNC": {
          "title": "mountain-sync-sucursal · maestros",
          "description": "Valida destino, datos y bloqueo. Solicita y aplica el lote localmente; no demuestra que central escriba directamente por SQL en la sucursal.",
          "db": "Proceso sucursal",
          "operation": "PROCESA",
          "sources": [
            {
              "label": "Descarga, recibido, guardado y procesados",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L318"
            }
          ]
        },
        "RECEIPT": {
          "title": "POST mensajeSalidas/recibido",
          "description": "Sync acusa antes de guardar localmente. API marca recibido_sucursal y confirma. Una caída en esa ventana requiere relectura; sin-procesar no excluye recibidos mientras procesado=false.",
          "db": "Sync → API lectura",
          "operation": "ACUSA RECIBIDO",
          "sources": [
            {
              "label": "Sync acusa antes de guardar",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L79-L111"
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
        "MSG": {
          "title": "Sobre local y metadata: mensajes / mensaje_detalles",
          "description": "Nombres completos sincronizador.mensajes y sincronizador.mensaje_detalles. Inserta cabecera y detalles con trx, conserva referencia al mensaje del concentrador. Más adelante actualiza metadata fuera del commit del maestro.",
          "db": "PostgreSQL sucursal / esquema sincronizador",
          "operation": "ESCRIBE / LEE",
          "sources": [
            {
              "label": "Modelo → sincronizador.mensajes",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/Mensaje.js#L6-L21"
            },
            {
              "label": "Modelo → sincronizador.mensaje_detalles",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/MensajeDetalle.js#L6-L14"
            },
            {
              "label": "Transacción de cabecera y detalles",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L15-L81"
            },
            {
              "label": "Transacción por detalle y metadata posterior",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
            }
          ],
          "schemaEvidence": "Esquema sincronizador declarado explícitamente por static get table() en el modelo.",
          "stateFields": "mensaje_concentrador_id; procesado/error y fechas por detalle; estado de cabecera separado."
        },
        "APPLY": {
          "title": "Aplicar un detalle según tipo",
          "description": "Cada detalle abre su propia transacción. El ejemplo muestra alternativas cliente y dirección. Un lote de clientes y otro de direcciones no forman una transacción global.",
          "db": "Sincronizador sucursal",
          "operation": "LEE / PROCESA",
          "sources": [
            {
              "label": "Transacción por detalle y metadata posterior",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
            }
          ]
        },
        "CLIENT": {
          "title": "personas + empresas y auxiliares",
          "description": "Crea/actualiza persona y empresa con trx. Puede obtener o crear clasificación, cartera, segmento, bloqueo y giro. Varias lecturas de apoyo no llevan la transacción.",
          "db": "PostgreSQL sucursal",
          "operation": "LEE / ESCRIBE",
          "sources": [
            {
              "label": "Aplicación de clientes y auxiliares",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/ClientesSyncService.js#L14-L407"
            },
            {
              "label": "Guardado de persona",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/PersonaService.js#L13-L61"
            }
          ],
          "schemaEvidence": "Tabla de negocio sin esquema calificado. El search_path y el DDL productivos requieren validación.",
          "stateFields": "Referencias externas y datos del maestro. No es registro de venta ni control de stock."
        },
        "ADDRESS": {
          "title": "direccion_empresas + direcciones",
          "description": "Resuelve empresa por referencia externa y valida RUT. Sin empresa devuelve error. Aplica condiciones de vigencia y dirección principal; usa catálogos auxiliares de comuna/tipo.",
          "db": "PostgreSQL sucursal",
          "operation": "LEE / ESCRIBE",
          "sources": [
            {
              "label": "Aplicación condicionada de direcciones",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/DireccionesSyncService.js#L20-L315"
            }
          ],
          "schemaEvidence": "Nombres literales en consultas SQL, sin prefijo de esquema."
        },
        "RESULT": {
          "title": "Commit/rollback por detalle",
          "description": "El resultado sin error produce commit; el error controlado rollback. Luego actualizarDetalle guarda procesado/error sin la misma trx. El camino de excepción tiene su propio manejo.",
          "db": "PostgreSQL sucursal",
          "operation": "CIERRA TRX / ESCRIBE METADATA",
          "sources": [
            {
              "label": "Transacción por detalle y metadata posterior",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
            }
          ]
        },
        "ACCOUNT": {
          "title": "estado_cuentas, trabajo posterior",
          "description": "Tras cliente, el sync lee/puede completar estado_cuenta_plazos y llama al backend. Este puede recalcular y escribir estado_cuentas. No pertenece a la transacción del detalle ya aplicada.",
          "db": "PostgreSQL sucursal / backend local",
          "operation": "LEE / ESCRIBE CONDICIONAL",
          "sources": [
            {
              "label": "Recálculo posterior por backend local",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/BackendSucursalService.js#L189-L212"
            },
            {
              "label": "Cálculo y guardado de estado de cuenta",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166"
            },
            {
              "label": "Ruta local de recálculo de cuenta",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L527-L535"
            },
            {
              "label": "Controlador que recibe el recálculo",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CobranzaController.js#L2058-L2102"
            }
          ],
          "schemaEvidence": "Tabla de negocio sin esquema calificado. El search_path y el DDL productivos requieren validación."
        },
        "DONE": {
          "title": "Resultados a central y cierre local",
          "description": "Central registra resultados y procesado=true, aunque incluya errores, e incrementa contadores. Sync cierra después su cabecera. Fallo HTTP se captura; repetir el POST puede volver a incrementar contadores centrales.",
          "db": "API lectura y PostgreSQL sucursal",
          "operation": "NOTIFICA / ESCRIBE",
          "sources": [
            {
              "label": "Descarga, recibido, guardado y procesados",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L318"
            },
            {
              "label": "Transacción por detalle y metadata posterior",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355"
            },
            {
              "label": "Procesados, contadores y estado de lote",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/api-lectura/app/Controllers/Http/MensajeSalidasController.js#L194-L277"
            }
          ]
        },
        "MPOS": {
          "title": "MPOS.dbo.CustTableSync",
          "description": "BOAX fija MPOS; BOCliente selecciona tabla/Id y ejecuta MPOS.dbo.sp_caja_custTable. La paginación hace 0→9 y TOP(n) 9→0; marcar Procesado=1 no significa aplicado en sucursal. Contactos/direcciones tienen tablas específicas.",
          "db": "SQL Server · MPOS",
          "operation": "LEE / PAGINA / MARCA",
          "schemaEvidence": "Java califica MPOS.dbo; DSS usa CustTableSync sin esquema. Confirmar su datasource/DDL.",
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
            },
            {
              "label": "DSS: count, SP y actualización",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_AX_Clientes.dbs#L1-L83"
            }
          ]
        },
        "DSS": {
          "title": "Concentrador · detección de cambios",
          "description": "Task fuente de clientes interval=10 llama opGetCountClientesAX. Si count>0 encola trabajo MS_ProcesaRegistro; SamplingProcessor conduce a SEQ_Q_LeerColaBus. Las variantes CAR difieren y no acreditan tareas activas.",
          "db": "mountain-concentrador / WSO2",
          "operation": "CONSULTA COUNT / ENCOLA",
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
            },
            {
              "label": "DSS: count, SP y actualización",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/DSConcentrador/dataservice/DSS_AX_Clientes.dbs#L1-L83"
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
        "JAVA": {
          "title": "Generar lotes por sucursal",
          "description": "Lee contenido por JDBC, registra entrada/detalles, marca MPOS y después genera cabeceras y sobres de salida por entidad. No existe aquí un commit común SQL Server/PostgreSQL. Implementación identificada: RegistraMensajeDetalle → BOCliente / BOGuardarData.",
          "db": "mountain-concentrador / WSO2",
          "operation": "LEE / TRANSFORMA / ESCRIBE",
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
              "label": "Función fn_get_entidades",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOEntidades.java#L21-L51"
            }
          ]
        },
        "CENTRALDATA": {
          "title": "public.mensaje_entrada · public.mensaje_detalles",
          "description": "Persistencia central de payload y detalles anterior a la marca de origen. El bulk de detalles utiliza su conexión/transacción; excepciones SQL pueden quedar solo registradas.",
          "db": "PostgreSQL concentrador",
          "operation": "ESCRIBE DATOS DEL LOTE",
          "schemaEvidence": "Prefijo public explícito en SQL Java.",
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
        "CENTRALOUT": {
          "title": "public.mensaje_cabeceras · public.mensaje_salida · public.mensaje_detalle_sucursales",
          "description": "Cabeceras y entregas por destino. API modifica enviado, recibido_sucursal y procesado en fases distintas. Procesados suma resultados, incluidos errores, sin deduplicar el incremento.",
          "db": "PostgreSQL concentrador",
          "operation": "ESCRIBE / LEE / ACTUALIZA ESTADOS",
          "schemaEvidence": "Java usa public; API lectura usa nombres no calificados. search_path y binding por verificar.",
          "stateFields": "enviado; recibido_sucursal; procesado/error; total_sincronizados y total_errores.",
          "sources": [
            {
              "label": "Tabla física public.mensaje_cabeceras",
              "url": "https://github.com/developer-implementos/mountain-concentrador/blob/b2fd1ec266d131abb54b7076d41acce30f045119/ClassRegistraMensajeDetalle/src/main/java/cl/implementos/BO/BOMensajeCabecera.java#L43-L65"
            },
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
        }
      }
    },
    {
      "id": "D04",
      "key": "dataflow-customer",
      "title": "Cliente por RUT → ficha → estado de cuenta",
      "summary": "Seleccionar o cargar un cliente puede refrescar la copia local. Guardar su ficha y actualizar después el saldo son fases diferentes.",
      "caveat": "El dibujo sigue un refresco exitoso. Si falla, el controlador puede leer la ficha local y consultar saldo sin un nuevo commit de ficha. No hay escritura en AX demostrada; id=null puede devolver solo el ID recién creado.",
      "steps": [
        {
          "title": "Resolver la identidad y consultar",
          "text": "Al cargar/seleccionar cliente, el backend obtiene RUT desde empresas/personas si hay ID local, o normaliza el RUT recibido. Consulta el sufijo cliente del servicio configurado.",
          "nodes": [
            "UI",
            "LOOKUP",
            "ID",
            "REMOTE"
          ],
          "endpoint": "GET /empresas/:id → GET ${URL_API_CLIENTES}cliente?_rutCliente=…",
          "sources": [
            {
              "label": "Resolver RUT y consultar cliente remoto",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
            },
            {
              "label": "Solicitudes de carga de empresa",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/empresas.service.ts#L28-L50"
            }
          ]
        },
        {
          "title": "Guardar persona, empresa y direcciones",
          "text": "Con una respuesta válida y CustTableRecId, abre trx. Crea/actualiza personas y empresas y procesa las direcciones recibidas bajo sus condiciones. No reemplaza indiscriminadamente todas las direcciones ni sincroniza todos los contactos.",
          "nodes": [
            "REMOTE",
            "SAVE",
            "CLIENT",
            "ADDRESS"
          ],
          "sources": [
            {
              "label": "Validar respuesta y persistir ficha",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L130-L253"
            },
            {
              "label": "Direcciones según payload y condiciones",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DireccionesService.js#L9-L280"
            }
          ]
        },
        {
          "title": "Guardar cupo y cerrar la ficha",
          "text": "Lee el plazo y actualiza estado_cuentas: cupo, plazo y, si es nueva, saldo inicial. Confirma la ficha local. La llamada remota previa y las actualizaciones posteriores de saldo quedan fuera.",
          "nodes": [
            "SAVE",
            "ACCOUNT",
            "COMMIT"
          ],
          "sources": [
            {
              "label": "Cupo/plazo, estado de cuenta y commit",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L225-L268"
            }
          ]
        },
        {
          "title": "Actualizar saldo solo en la rama aplicable",
          "text": "La carga completa puede actualizar saldo y recalcular la cuenta si hay cuenta y no es cliente de venta público. Fuera de development consulta saldo remoto y actualiza ese saldo solo si la respuesta no declara error; el recálculo local puede continuar. Si falló el refresco de ficha, esta rama puede usar los datos locales sin nuevo commit.",
          "nodes": [
            "COMMIT",
            "SALDO",
            "ACCOUNT"
          ],
          "endpoint": "GET ${URL_API_CLIENTES}saldo (condicional)",
          "sources": [
            {
              "label": "Cargar relaciones y saldo condicionado",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L182"
            },
            {
              "label": "Consulta remota saldo y actualización",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L917-L1017"
            },
            {
              "label": "Cálculo y guardado de estado de cuenta",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166"
            }
          ]
        },
        {
          "title": "Devolver datos o tratar el error",
          "text": "id=null puede devolver el ID antes de cargar toda la ficha. En otras ramas, la respuesta puede combinar datos locales y error del refresco. La interfaz POS inspeccionada puede limpiar la venta en preparación: no es un DELETE de una venta persistida.",
          "nodes": [
            "COMMIT",
            "SALDO",
            "OUT"
          ],
          "sources": [
            {
              "label": "Cargar relaciones y saldo condicionado",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L182"
            },
            {
              "label": "Tratamiento de error en UI",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/modules/pos/pages/punto-de-venta/punto-de-venta.component.ts#L410-L445"
            }
          ]
        }
      ],
      "nodes": {
        "UI": {
          "title": "Seleccionar o cargar cliente",
          "description": "Consumidor GET empresas/:id; otra variante usa empresas/null con RUT. No es evidencia de una solicitud por pulsación de teclado.",
          "db": "Angular → backend sucursal",
          "operation": "SOLICITA CLIENTE",
          "sources": [
            {
              "label": "Servicio Angular de empresas",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/empresas.service.ts#L28-L50"
            },
            {
              "label": "Cargar relaciones y saldo condicionado",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L182"
            }
          ]
        },
        "LOOKUP": {
          "title": "Resolver RUT",
          "description": "Si recibió ID consulta empresas/personas; si no normaliza RUT. Luego intenta refresco remoto.",
          "db": "Backend sucursal",
          "operation": "LEE / CONSULTA",
          "sources": [
            {
              "label": "Resolver RUT y consultar cliente remoto",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
            }
          ]
        },
        "ID": {
          "title": "empresas + personas, resolver identidad",
          "description": "JOIN local para obtener la identidad cuando se carga por ID. Son las mismas tablas actualizadas más adelante, mostradas en otro momento.",
          "db": "PostgreSQL sucursal",
          "operation": "LEE",
          "sources": [
            {
              "label": "Resolver RUT y consultar cliente remoto",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
            }
          ],
          "schemaEvidence": "Tabla de negocio sin esquema calificado. El search_path y el DDL productivos requieren validación."
        },
        "REMOTE": {
          "title": "API cliente configurada",
          "description": "GET URL_API_CLIENTES + cliente, con _rutCliente. El contrato del consumidor está verificado; no se atribuye inequívocamente a ApiCliente .NET ni a tablas AX.",
          "db": "Servicio remoto configurable",
          "operation": "CONSULTA",
          "sources": [
            {
              "label": "Resolver RUT y consultar cliente remoto",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
            }
          ],
          "evidence": "Consumidor verificado · binding receptor pendiente",
          "stateFields": "timeout 30000 ms en el snapshot."
        },
        "SAVE": {
          "title": "Validar y guardar ficha",
          "description": "Respuesta con error o sin CustTableRecId sale antes de iniciar transacción. En camino válido usa beginTransaction y llama a los guardados de ficha.",
          "db": "Backend / PostgreSQL sucursal",
          "operation": "PROCESA / ESCRIBE",
          "sources": [
            {
              "label": "Validar respuesta y persistir ficha",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L130-L253"
            },
            {
              "label": "Cupo/plazo, estado de cuenta y commit",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L225-L268"
            }
          ]
        },
        "CLIENT": {
          "title": "personas + empresas, copia local",
          "description": "Find/create/merge/save mediante ORM con trx. La consulta SQL de resolución corrobora esos nombres; las relaciones y catálogos auxiliares tienen operaciones adicionales.",
          "db": "PostgreSQL sucursal",
          "operation": "LEE / ESCRIBE",
          "sources": [
            {
              "label": "Validar respuesta y persistir ficha",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L130-L253"
            },
            {
              "label": "Resolver RUT y consultar cliente remoto",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88"
            },
            {
              "label": "Guardar persona",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L375-L423"
            }
          ],
          "schemaEvidence": "Tabla de negocio sin esquema calificado. El search_path y el DDL productivos requieren validación."
        },
        "ADDRESS": {
          "title": "direccion_empresas + direcciones",
          "description": "Procesa las direcciones del payload. Enlaces no vigentes o sin sincronizar tienen reglas particulares; no representa un reemplazo total de direcciones ni una escritura de contactos.",
          "db": "PostgreSQL sucursal",
          "operation": "LEE / ESCRIBE",
          "sources": [
            {
              "label": "Direcciones según payload y condiciones",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DireccionesService.js#L9-L280"
            },
            {
              "label": "Validar respuesta y persistir ficha",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L130-L253"
            }
          ],
          "schemaEvidence": "Nombres literales en SQL sin esquema explícito."
        },
        "ACCOUNT": {
          "title": "estado_cuentas, dos momentos de escritura",
          "description": "Dentro de la trx de ficha guarda cupo/plazo. Después, en el camino aplicable, actualiza saldo externo y campos derivados con otras operaciones. Es la misma tabla, no una tabla saldos.",
          "db": "PostgreSQL sucursal",
          "operation": "LEE / ESCRIBE",
          "sources": [
            {
              "label": "Cupo/plazo, estado de cuenta y commit",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L225-L268"
            },
            {
              "label": "Consulta remota saldo y actualización",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L917-L1017"
            },
            {
              "label": "Cálculo y guardado de estado de cuenta",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166"
            },
            {
              "label": "Migración estado_cuentas",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/database/migrations/1640016682001_estado_cuentas_schema.js#L6-L17"
            }
          ],
          "schemaEvidence": "Tabla de negocio sin esquema calificado. El search_path y el DDL productivos requieren validación.",
          "stateFields": "monto_cupo_credito, saldo_credito inicial; luego monto_saldo_externo, fecha y derivados según rama."
        },
        "COMMIT": {
          "title": "COMMIT de ficha y relectura",
          "description": "Confirma el guardado de ficha; luego el controlador lee relaciones. No abarca GET cliente ni la consulta adicional GET saldo. La variante id=null puede retornar solo el ID.",
          "db": "Backend / PostgreSQL sucursal",
          "operation": "COMMIT / LEE",
          "sources": [
            {
              "label": "Cupo/plazo, estado de cuenta y commit",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L225-L268"
            },
            {
              "label": "Cargar relaciones y saldo condicionado",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L182"
            }
          ]
        },
        "SALDO": {
          "title": "Saldo remoto y recálculo posterior",
          "description": "Consulta remota condicionada, timeout 3000 ms en el snapshot. Solo una respuesta sin error actualiza saldo externo; el recálculo local puede continuar. Lee ventas/pagos no confirmados, cobranzas, abonos y acuerdos/cuotas; guarda derivados fuera de la trx de ficha. Puede ejecutarse con ficha local si el refresco falló, sin nuevo commit. Implementación: esta rama puede invocar estadoDeCuenta(id,true).",
          "db": "API remota y PostgreSQL sucursal",
          "operation": "LEE / ESCRIBE",
          "sources": [
            {
              "label": "Consulta remota saldo y actualización",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L917-L1017"
            },
            {
              "label": "Cálculo y guardado de estado de cuenta",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166"
            },
            {
              "label": "Cargar relaciones y saldo condicionado",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L182"
            }
          ],
          "schemaEvidence": "Entre los auxiliares: documentos, comprobante_ventas y vínculos, pagos, cobranzas, abonos, cobranza_acuerdos, cobranza_cuotas; schema no acreditado."
        },
        "OUT": {
          "title": "Respuesta a la interfaz",
          "description": "Puede devolver ID, ficha local o datos junto con error de refresco según rama. En el consumidor POS observado, error/data nula puede limpiar el borrador. No acredita borrado de registros ya persistidos.",
          "db": "Backend → Angular",
          "operation": "DEVUELVE / TRATA ERROR",
          "sources": [
            {
              "label": "Cargar relaciones y saldo condicionado",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L182"
            },
            {
              "label": "Tratamiento de error en UI",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/modules/pos/pages/punto-de-venta/punto-de-venta.component.ts#L410-L445"
            }
          ]
        }
      }
    },
    {
      "id": "D05",
      "key": "dataflow-credit",
      "title": "Notas de crédito entre varias bases",
      "summary": "Seguir una NC exige distinguir consulta de saldo, marcas de uso y guardado de pago. El dibujo muestra sus caminos relacionados, sin unirlos en una transacción inexistente.",
      "caveat": "La consulta por cliente no invoca automáticamente estadoNC. Los llamadores POST/PUT de marcas no están identificados. Una sucursal inaccesible o un pago preparado aún sin confirmación AX puede dejar incompleta la vista del saldo.",
      "steps": [
        {
          "title": "Consultar NC y pendientes locales",
          "text": "La consulta por cliente obtiene NC del servicio remoto configurado y lee consumos/devoluciones locales pendientes. No se conoce aquí la tabla física del servicio remoto ni se debe inventar una tabla AX.",
          "nodes": [
            "REQ",
            "REMOTE",
            "LOCAL"
          ],
          "endpoint": "POST /nota-de-credito/por-cliente → POST ${URL_API_CAJA}buscarNotasCredito",
          "sources": [
            {
              "label": "Buscar NC y ajustar saldo por cliente",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L30-L95"
            },
            {
              "label": "Consumo NC y devoluciones locales",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L795-L833"
            }
          ]
        },
        {
          "title": "Resolver sucursales desde Mongo",
          "text": "La API de pagos lee la colección cajaSucursales para resolver sucursales activas y abrir consultas PostgreSQL. Mongo sirve aquí como directorio; no replica ni consulta por sí solo las tablas de las tiendas.",
          "nodes": [
            "PAYAPI",
            "DIRECTORY",
            "STORES"
          ],
          "endpoint": "GET /api/pagos/pagosSinSinc",
          "sources": [
            {
              "label": "Directorio y consultas por sucursal",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L326-L353"
            },
            {
              "label": "Colección explícita cajaSucursales",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/models/cajaSucursales.model.js#L22-L26"
            }
          ]
        },
        {
          "title": "Leer pagos NC que cumplen el filtro",
          "text": "El JOIN selecciona por rut/dv pagos aprobados de forma nota-de-credito, ventas finalizadas y cv.sincronizado=false. Devuelve datos y errores de las consultas a sucursales. No son todos los pagos ni un saldo corporativo autoritativo.",
          "nodes": [
            "PAYAPI",
            "STORES",
            "RESULT"
          ],
          "sources": [
            {
              "label": "JOIN y filtros de pagos con NC",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L78-L140"
            },
            {
              "label": "Directorio y consultas por sucursal",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L326-L353"
            },
            {
              "label": "Descontar pagos de otras sucursales",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L847-L864"
            }
          ]
        },
        {
          "title": "Entender la ventana antes de AX",
          "text": "El sincronizador puede marcar comprobante_ventas.sincronizado=true al preparar el mensaje, antes del HTTP. Ese pago deja de aparecer en este filtro aunque AX aún no lo confirme. Es una ventana por probar, no evidencia de doble gasto ocurrido.",
          "nodes": [
            "STORES",
            "RESULT"
          ],
          "sources": [
            {
              "label": "Marca de pago preparado antes de HTTP",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/PagoFacturaSyncUploadService.js#L20-L72"
            },
            {
              "label": "JOIN y filtros de pagos con NC",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L78-L140"
            }
          ]
        },
        {
          "title": "Distinguir marcas Mongo de consulta de saldo",
          "text": "En otros recorridos por folio/devoluciones se consulta estadoNC. POST/PUT escriben la marca en uso/disponible y sus llamadores no están identificados aquí. /por-cliente no ejecuta esta secuencia automáticamente.",
          "nodes": [
            "CHECK",
            "ROUTES",
            "CALLER",
            "STATE"
          ],
          "endpoint": "GET /api/pagos/estadoNC; POST /api/pagos/estadoNC; PUT /api/pagos/estadoNC/:folio/:origen",
          "sources": [
            {
              "label": "Consulta de marca en validación de devoluciones",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L428-L500"
            },
            {
              "label": "GET, POST y PUT del estado NC",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L23-L77"
            },
            {
              "label": "Colección explícita y campos estadoNC",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/models/estadoNC.model.js#L4-L28"
            }
          ]
        },
        {
          "title": "Guardar el pago con NC en la venta",
          "text": "Si el payload de venta trae notaDeCreditoExterna, el backend guarda pago, vínculo y NC local por pago_id. Esa escritura no acredita llamada a marcas Mongo ni confirmación AX, y no forma una transacción común con la consulta anterior.",
          "nodes": [
            "SALE",
            "PAYMENT"
          ],
          "endpoint": "POST /punto-de-venta",
          "sources": [
            {
              "label": "Guardar pago recibido",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L59-L100"
            },
            {
              "label": "Persistir NC asociada al pago",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L134-L145"
            },
            {
              "label": "Vincular pago a comprobante",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L117-L131"
            }
          ]
        }
      ],
      "nodes": {
        "REQ": {
          "title": "Consultar NC por cliente",
          "description": "Backend combina servicio NC remoto, consumos locales y consulta de otras sucursales. Este método no llama a estadoNC.",
          "db": "Angular → backend sucursal",
          "operation": "SOLICITA / LEE",
          "sources": [
            {
              "label": "Buscar NC y ajustar saldo por cliente",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L30-L95"
            }
          ]
        },
        "REMOTE": {
          "title": "Servicio NC remoto configurado",
          "description": "POST URL_API_CAJA + buscarNotasCredito. Receptor efectivo y tablas físicas no reconstruidos en este recorrido.",
          "db": "Servicio remoto",
          "operation": "CONSULTA",
          "sources": [
            {
              "label": "Buscar NC y ajustar saldo por cliente",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L30-L95"
            }
          ],
          "evidence": "Consumidor verificado · receptor y tablas pendientes"
        },
        "LOCAL": {
          "title": "Consumo y devoluciones de la sucursal",
          "description": "Dos lecturas locales: nota_de_credito_externas con su pago; devoluciones con detalle_devoluciones. No son un único JOIN. Ajustan por referencias externas según condiciones.",
          "db": "PostgreSQL sucursal",
          "operation": "LEE",
          "sources": [
            {
              "label": "Consumo NC y devoluciones locales",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L795-L833"
            },
            {
              "label": "Relación NC → pago",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Models/NotaDeCreditoExterna.js#L6-L18"
            }
          ],
          "schemaEvidence": "Nombres sin schema calificado; search_path pendiente.",
          "stateFields": "NC externas con sincronizado=0; devoluciones con sincronizacion_confirmada=0."
        },
        "PAYAPI": {
          "title": "api-pagos-caja · consulta de pagos",
          "description": "Resuelve sucursales activas y ejecuta fan-out de consultas pg. Devuelve datos disponibles y errores separados; no garantiza completitud corporativa.",
          "db": "API pagos → Mongo y PostgreSQL de sucursales",
          "operation": "LEE / AGREGA",
          "sources": [
            {
              "label": "Directorio y consultas por sucursal",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L326-L353"
            },
            {
              "label": "JOIN y filtros de pagos con NC",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L78-L140"
            }
          ]
        },
        "DIRECTORY": {
          "title": "cajaSucursales",
          "description": "Colección Mongo con nombre explícito en el tercer argumento de dbCaja.model. Se lee como directorio de sucursales/conexiones; no se publican valores de conexión.",
          "db": "MongoDB / alias lógico dbCaja",
          "operation": "LEE",
          "sources": [
            {
              "label": "Colección explícita cajaSucursales",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/models/cajaSucursales.model.js#L22-L26"
            },
            {
              "label": "Directorio y consultas por sucursal",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L326-L353"
            }
          ],
          "schemaEvidence": "Colección explícita cajaSucursales; dbCaja es alias lógico, no nombre físico publicado."
        },
        "STORES": {
          "title": "JOIN de pagos con NC por sucursal",
          "description": "En la misma consulta participan comprobante_ventas, comprobante_venta_has_documentos, documentos, dtes; pago_comprobante_ventas, pagos, nota_de_credito_externas; empresas, personas, tipo_documentos, estado_pagos, caja_has_forma_pagos y forma_pagos. El cilindro resume este JOIN, no crea una tabla nueva.",
          "db": "PostgreSQL de cada sucursal consultada",
          "operation": "LEE",
          "sources": [
            {
              "label": "JOIN y filtros de pagos con NC",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L78-L140"
            },
            {
              "label": "Directorio y consultas por sucursal",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L326-L353"
            },
            {
              "label": "Marca de pago preparado antes de HTTP",
              "url": "https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/PagoFacturaSyncUploadService.js#L20-L72"
            }
          ],
          "schemaEvidence": "Este SQL no califica el esquema de las tablas. No trasladar public desde otras consultas.",
          "stateFields": "rut/dv; cv.sincronizado=false; cv.venta_finalizada=true; pago aprobado; forma nota-de-credito."
        },
        "RESULT": {
          "title": "Saldo mostrado y completitud",
          "description": "Mountain descuenta pagos de otras sucursales y excluye la propia. Puede usar cero ante ausencia/error y no garantiza interpretar todos los errores parciales. El fallback por endpoint tampoco demuestra aislamiento por cliente.",
          "db": "Respuesta agregada / backend Mountain",
          "operation": "CALCULA PRESENTACIÓN",
          "sources": [
            {
              "label": "Buscar NC y ajustar saldo por cliente",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L30-L95"
            },
            {
              "label": "Descontar pagos de otras sucursales",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L847-L864"
            },
            {
              "label": "Directorio y consultas por sucursal",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/services/pagosService.js#L326-L353"
            },
            {
              "label": "Caché y fallback por endpoint",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/api-fallback-manager.js#L7-L94"
            }
          ]
        },
        "CHECK": {
          "title": "Validación por folio/devoluciones",
          "description": "ValidaPanelDevoluciones consulta marca EstadoNC y filtra origen omni. Se usa en recorridos diferentes de buscar NC por cliente.",
          "db": "Backend Mountain",
          "operation": "CONSULTA",
          "sources": [
            {
              "label": "Consulta de marca en validación de devoluciones",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L428-L500"
            },
            {
              "label": "Recorrido por folio",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/NotaDeCreditoAxController.js#L112-L132"
            }
          ]
        },
        "ROUTES": {
          "title": "api-pagos-caja · GET / POST / PUT estadoNC",
          "description": "GET busca por folio. POST busca folio/origen y marca en uso o crea; PUT marca disponible. No se acredita exclusión atómica de saldo ni comparación de propietario/versión.",
          "db": "API pagos / Mongo",
          "operation": "LEE / ESCRIBE",
          "sources": [
            {
              "label": "GET, POST y PUT del estado NC",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L23-L77"
            },
            {
              "label": "Colección explícita y campos estadoNC",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/models/estadoNC.model.js#L4-L28"
            },
            {
              "label": "Rutas de marca NC",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/routes/pagos.js#L10-L12"
            }
          ]
        },
        "CALLER": {
          "title": "Llamador de POST/PUT por identificar",
          "description": "La API declara receptores de escritura, pero no se identificó inequívocamente quién los invoca en estos recorridos. No unir consulta por cliente, marca y pago como una secuencia comprobada.",
          "db": "Integración por confirmar",
          "operation": "PENDIENTE",
          "sources": [
            {
              "label": "GET, POST y PUT del estado NC",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L23-L77"
            }
          ],
          "evidence": "Receptores verificados · llamadores pendientes"
        },
        "STATE": {
          "title": "estadoNC",
          "description": "Colección explícita en Mongo, conexión lógica dbCaja. GET lee por folio; POST/PUT crean o actualizan estado. El POST existente continúa tras responder y puede intentar creación adicional; el PUT carece de comparación de propietario/intento. No es un ledger de importe disponible.",
          "db": "MongoDB / alias lógico dbCaja",
          "operation": "LEE / ESCRIBE",
          "sources": [
            {
              "label": "Colección explícita y campos estadoNC",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/models/estadoNC.model.js#L4-L28"
            },
            {
              "label": "GET, POST y PUT del estado NC",
              "url": "https://github.com/developer-implementos/api-pagos-caja/blob/33cd625f029aa78798f0baf307c41e17ebee92e1/controllers/pagosController.js#L23-L77"
            }
          ],
          "schemaEvidence": "Colección explícita estadoNC, no nombre inferido por pluralización.",
          "stateFields": "folio, origen, estado. El detalle de concurrencia y unicidad requiere pruebas."
        },
        "SALE": {
          "title": "Venta con pago NC recibido",
          "description": "El guardado de venta procesa notaDeCreditoExterna cuando viene en el payload del pago. Registro local no equivale a reserva corporativa ni autorización bancaria.",
          "db": "Backend Mountain",
          "operation": "PROCESA / ESCRIBE",
          "sources": [
            {
              "label": "Guardar pago recibido",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L59-L100"
            },
            {
              "label": "Persistir NC asociada al pago",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L134-L145"
            }
          ]
        },
        "PAYMENT": {
          "title": "pagos + vínculo + nota_de_credito_externas",
          "description": "Guarda pagos, los vincula en pago_comprobante_ventas y registra NC por pago_id. La firma particular save(NotaDeCreditoEntidad,trx) debe comprobarse con la versión de Lucid para acreditar atomicidad.",
          "db": "PostgreSQL sucursal",
          "operation": "ESCRIBE",
          "sources": [
            {
              "label": "Guardar pago recibido",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L59-L100"
            },
            {
              "label": "Persistir NC asociada al pago",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/PagoService.js#L134-L145"
            },
            {
              "label": "Vincular pago a comprobante",
              "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ComprobanteVentaService.js#L117-L131"
            }
          ],
          "schemaEvidence": "Tablas sin schema explícito en las operaciones citadas.",
          "stateFields": "pago_id; sincronizado local y confirmación posterior tienen momentos distintos."
        }
      }
    }
  ]
};

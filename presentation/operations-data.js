/* Evidence selected for operational comparisons, not execution or production certification. */
window.POS_OPERATIONS = {
  "cases": [
    {
      "id": "O01",
      "chapter": "venta",
      "title": "Abrir, cuadrar y cerrar una sesión",
      "evidenceNote": "PPTX: láminas 3, 7, 11 y 12, con sus notas asociadas. El código revisado describe aperturas y cierres de Chile; no demuestra configuración de permisos, constraints o procedimientos productivos. Sesión de caja y ventana horaria del sincronizador son conceptos diferentes.",
      "sources": [
        {
          "label": "Rutas de apertura y cierre",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L67-L99"
        },
        {
          "label": "Apertura de sesión",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L79-L110"
        },
        {
          "label": "Consultas de ocupación",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L809-L849"
        },
        {
          "label": "Validar cierre e invocar liberación de OV",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L234-L257"
        },
        {
          "label": "OV pausadas y manejo del error remoto",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L1514-L1544"
        },
        {
          "label": "Cierre: cálculo previo, transacción y commit",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L116-L210"
        },
        {
          "label": "Cerrada y bandera de cuadre",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L1227-L1244"
        },
        {
          "label": "Denominaciones: retorno ante cantidad cero",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L1371-L1403"
        },
        {
          "label": "GET de información modifica tipo de cierre",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L610-L647"
        },
        {
          "label": "Validación efectiva en UI",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/modules/pos/pages/cerrar-caja/cerrar-caja.component.ts#L303-L411"
        },
        {
          "label": "Parcial bloqueado en el selector",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/modules/pos/pages/definir-cierre/definir-cierre.component.ts#L43-L84"
        },
        {
          "label": "Custodia: generación y descarga",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ExcelServiceV2.js#L371-L400"
        },
        {
          "label": "Láminas y notas de la presentación original",
          "url": "../docs/antecedentes-presentacion-chile.md"
        }
      ],
      "current": {
        "diagram": "operation-session-current",
        "summary": "Abrir caja crea una sesión con usuario y monto inicial. Al terminar, el sistema compara importes y registra cierre y diferencias; el estado cerrada, el cuadre y la confirmación ERP permanecen separados.",
        "steps": [
          "POST /cajas-usuario consulta ocupación y crea cajas_usuarios. El método usa America/Santiago; no prueba una política corporativa multipaís.",
          "GET informacion-cierre modifica el tipo de cierre. POST validar-cierre también intenta liberar OV pausadas en un servicio remoto y puede absorber ese error.",
          "POST cerrar-caja recalcula diferencias antes de BEGIN; luego guarda sesión, movimiento y detalle con trx, y hace commit. Cerrada puede coexistir con caja_cuadrada=false.",
          "El selector revisado bloquea cierre parcial. La exportación de custodia es otro recorrido: cerrar no confirma archivo descargado, entrega bancaria ni registro AX."
        ],
        "boundary": "El snapshot del arqueo precede a la transacción de cierre. Deben probarse movimientos concurrentes, doble cierre y apertura concurrente; no se han demostrado incidencias productivas."
      },
      "proposed": {
        "diagram": "operation-session-proposed",
        "summary": "El escritor de sucursal debe proteger la identidad de sesión, fijar el punto de corte y validar el conteo. Las tareas externas conservan su seguimiento aunque negocio permita terminar el turno con pendientes.",
        "steps": [
          "Apertura idempotente con exclusión de caja/usuario probada en el escritor local. Identidad de sesión, fecha de negocio, moneda y zona horaria explícitas.",
          "Al pasar a en cierre, fijar el corte y decidir dónde se asignan movimientos concurrentes. Validar importes y denominaciones en backend.",
          "Guardar cierre, diferencias, motivo/aprobación cuando corresponda e intenciones externas en una transacción local. Mantener identidad de cada intención.",
          "Sincronizar y conciliar liberación de OV, arqueo y diferencias con estados propios. El responsable de negocio decide qué pendiente bloquea cerrar."
        ],
        "boundary": "Los nombres de estado y la política son propuesta. No existe un permiso implícito para cerrar offline ni para aceptar cualquier diferencia."
      },
      "challenge": {
        "question": "Se corta WAN al terminar el turno y queda una OV pausada",
        "current": "La validación intenta liberarla por un servicio remoto antes del cierre. Su error puede quedar registrado sin aparecer como error de validación; cerrar localmente no prueba la liberación ni el registro en AX.",
        "proposed": "La UI presenta el pendiente con su identidad. La política acordada decide si deja cerrar; cuando corresponda, el cierre conserva una intención durable y el worker consulta o concilia su resultado.",
        "test": "Perder la respuesta del cierre, repetir la confirmación, crear un movimiento al mismo tiempo y ordenar denominaciones con un cero antes de otra cantidad positiva. Comprobar que no se duplica ni se pierde detalle."
      },
      "notes": [
        "El helper de efectivo retorna al encontrar una cantidad cero y puede omitir denominaciones posteriores. La UI revisada reemplaza la validación de ese detalle por true. Es un comportamiento de código, no evidencia de un arqueo productivo afectado.",
        "La exclusión de apertura observada es SELECT antes de INSERT. Faltan índices/constraints/configuración para demostrar o descartar duplicados bajo concurrencia.",
        "Ciertos cierres se fechan a las 23:59:59 del día de apertura y guardan cierre_desfasado. La propuesta debe conservar fecha de negocio y hora real del evento, con calendario por país.",
        "El archivo de custodia observado se nombra por fecha, se descarga y se programa su eliminación a cinco segundos. En el mismo filesystem, exportaciones concurrentes o lentas requieren prueba. Proponer identidad de exportación, retención y limpieza acorde al ciclo del recurso.",
        "Cierre de sesión, informe Z, cuadre, custodia, mantenimiento y fin de ventana de sincronización requieren contratos separados. La revisión no ha demostrado equivalencia contable o fiscal entre ellos."
      ]
    },
    {
      "id": "O02",
      "chapter": "propuesta",
      "title": "Precio, oferta y reglas locales",
      "evidenceNote": "Mountain prueba el consumo remoto. ApiPrecios .NET contiene un cálculo compatible, pero falta confirmar el binding productivo. El CRUD de ofertas existe en el código y no contradice el uso de solo lectura informado en caja: presencia de código, permisos efectivos y evaluación del precio son preguntas distintas.",
      "sources": [
        {
          "label": "Mountain: camino activo de cálculo",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ProductosService.js#L134-L205"
        },
        {
          "label": "Llamada remota con contexto y timeout",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Precios/PreciosImplementosServices.js#L12-L84"
        },
        {
          "label": "Bloqueo de pago con error de precio",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/modules/pos/components/pos-botones/pos-botones.component.ts#L415-L457"
        },
        {
          "label": "Colecciones de precios, grupos e histórico",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApiPrecios/Controllers/PreciosController.cs#L60-L133"
        },
        {
          "label": "Lote con cantidad y usuario fijados",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApiPrecios/Controllers/PreciosController.cs#L569-L589"
        },
        {
          "label": "Respuesta sin versión de reglas",
          "url": "https://github.com/developer-implementos/apis-implementos/blob/8fbe2f1b4d4e464a403aa3daca63ffe712a9dd70/ApiPrecios/Models/respuestaPrecio.cs#L8-L23"
        },
        {
          "label": "Rutas de administración de ofertas",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L325-L329"
        },
        {
          "label": "Presentación original: precio online y módulos",
          "url": "../docs/antecedentes-presentacion-chile.md"
        },
        {
          "label": "Contrato local de precios y ofertas propuesto",
          "url": "../docs/propuesta-arquitectura.md"
        }
      ],
      "current": {
        "diagram": "operation-price-current",
        "summary": "La venta usa una consulta de precio remota. El cálculo encontrado considera cliente, sucursal, cantidad y vendedor, además de reglas e históricos; una lista de SKU/precio no conserva por sí sola ese comportamiento.",
        "steps": [
          "Mountain envía SKU, cantidad, RUT, sucursal y usuario al servicio de precios configurado. Ante error, el flujo de interfaz revisado impide abrir el pago.",
          "En ApiPrecios candidata se leen clientesGrupos, articulos, historicoPrecios, preciosnew y preciosnewliquidacion, entre otras colecciones. El histórico depende de la fecha del proceso.",
          "La ruta por lote invoca el cálculo con cantidad 1 y usuario 72. No demuestra equivalencia con una consulta individual que use otro contexto.",
          "Administrar ofertas en pantallas y ejecutar reglas de precio son capacidades diferentes. Hay rutas CRUD, pero la caja se informó como solo lectura."
        ],
        "boundary": "Confirmar qué motor y reglas usa producción antes de extraer lógica. La respuesta revisada de ApiPrecios no identifica una versión del conjunto de reglas/datos."
      },
      "proposed": {
        "diagram": "operation-price-proposed",
        "summary": "El módulo local necesita un paquete coherente de datos y reglas, contexto de la venta, vigencia y un resultado explicable. El diseño debe definir qué hacer cuando ese paquete ya no autoriza calcular.",
        "steps": [
          "Publicar una versión aprobada de reglas y datos por entidad/sucursal, con vigencia y compatibilidad del motor local.",
          "Descargar y verificar el paquete completo antes de activarlo. Mantener la última versión válida sin mezclar parcialmente sus tablas.",
          "Evaluar con contexto completo y guardar en la venta versión, entradas relevantes y explicación del precio aplicado.",
          "Con paquete ausente o vencido, aplicar una política acordada: restringir la operación afectada o usar una excepción autorizada y auditable. No inventar un importe."
        ],
        "boundary": "Es una propuesta. Requiere pruebas de paridad con el camino productivo y decisiones comerciales sobre vigencia, promociones y excepciones; un CRUD local no la implementa."
      },
      "challenge": {
        "question": "¿Se puede sustituir el cálculo individual por el precio del lote para cualquier cantidad?",
        "current": "No hay equivalencia general demostrada: la ruta de lote observada fija cantidad y usuario. Cambiar cliente, volumen o vendedor puede seleccionar otra regla.",
        "proposed": "El contrato de cálculo debe recibir el mismo contexto y conservar la versión utilizada. Las pruebas comparan resultados y explicaciones con casos comerciales aprobados.",
        "test": "Comparar cantidad 1 y cantidades mayores, dos clientes y vendedores, acuerdo comercial, oferta vencida y transición de versión. Son casos de prueba por acordar; no se ejecutaron precios reales."
      },
      "notes": [
        "El nombre de una colección Mongo se toma de GetCollection. No identifica servidor, instancia, ubicación física ni productor de datos.",
        "La ventana del histórico usa DateTime.Now con tres meses previos. Reloj/zona horaria y fecha efectiva son parte del contrato a decidir; no basta copiar el comentario que dice retirar el histórico mientras permanece código que lo usa.",
        "El objetivo de estandarizar naming no justifica renombrar estas colecciones sin mapear consumidores ni identificar el motor activo."
      ]
    },
    {
      "id": "O03",
      "chapter": "venta",
      "title": "Documento emitido y trabajo de impresión",
      "evidenceNote": "La representación PDF y los canales de impresión se verificaron en Mountain y la API Windows. El comportamiento descrito no acredita versiones instaladas, papel entregado ni capacidades de todos los dispositivos. La app api-pagos-caja sigue separada de la aplicación de conexión con Transbank y del terminal.",
      "sources": [
        {
          "label": "Documento PDF según proveedor",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DocumentoController.js#L233-L305"
        },
        {
          "label": "Canal y llamada de impresión",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresion.service.ts#L42-L145"
        },
        {
          "label": "HTTP de impresión térmica",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/Controllers/ImpresionController.cs#L49-L71"
        },
        {
          "label": "PrintDocument.Print y error",
          "url": "https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/Biblioteca/Helper/PrinterHelper.cs#L110-L125"
        },
        {
          "label": "Contratos propuestos de proveedores y dispositivos",
          "url": "../docs/extensibilidad-proveedores-dispositivos.md"
        },
        {
          "label": "Persistencia de venta y DTE actual",
          "url": "../docs/recorridos-datos-tablas.md"
        }
      ],
      "current": {
        "diagram": "operation-print-current",
        "summary": "El documento fiscal, su representación y el intento de impresión recorren servicios diferentes. El canal configurado determina si se usa ePOS o la API Windows.",
        "steps": [
          "GET /Documentos/pdf/:id consulta documentos, dtes y configuración del facturador. Ingydev devuelve bytes PDF decodificados; Acepta una referencia/URL en ese método.",
          "Angular elige por slug_tipo_impresora. epson se muestra no configurado; epson-epos usa conexión al dispositivo; apiImpresion envía HTTP a la API Windows.",
          "La API térmica invoca PrintDocument.Print(). Su controlador puede devolver 200/error=false después de registrar una excepción.",
          "La rama apiImpresion inicia una suscripción y no inspecciona el cuerpo de éxito. No hay prueba aquí de un trabajo durable correlacionado ni de entrega física."
        ],
        "boundary": "El diagrama muestra rutas relacionadas de documento e impresión, no que cada impresión térmica consuma GET /Documentos/pdf. Ningún acuse observado acredita papel entregado."
      },
      "proposed": {
        "diagram": "operation-print-proposed",
        "summary": "El POS conserva la identidad fiscal existente y crea un trabajo de impresión independiente. El adaptador informa solo lo que el proveedor o dispositivo permite conocer.",
        "steps": [
          "Identificar el DTE existente y obtener una representación autorizada, sin reemitir por un fallo de papel.",
          "Persistir trabajo, intento, terminal, adaptador y referencia documental antes del envío según el contrato local.",
          "Separar aceptación del trabajo, fallo conocido y resultado incierto. Consultar estado solo si el dispositivo lo soporta.",
          "Cuando no existe acuse físico, mostrar esa limitación y registrar constatación o reimpresión con motivo. Nunca inventar un estado impreso."
        ],
        "boundary": "Persistir un trabajo no vuelve idempotente al spooler. La política de reimpresión debe tratar la copia que quizá ya salió y las capacidades reales del dispositivo."
      },
      "challenge": {
        "question": "El DTE existe, pero se pierde la respuesta después de enviar a imprimir",
        "current": "No se puede deducir que no salió papel. El 200 observado y la finalización de la función no prueban entrega física; los canales tampoco tienen un contrato de confirmación uniforme.",
        "proposed": "Conservar la identidad del trabajo y el documento, consultar cuando sea posible y hacer explícito el resultado incierto. Una reimpresión se registra como nueva copia de ese documento.",
        "test": "Distinguir fallo antes de enviar, dispositivo sin papel y respuesta perdida después de aceptar. Confirmar que ninguna variante emite otro DTE por resolver la impresión."
      },
      "notes": [
        "El bloque PDF documenta la obtención de representación, mientras el canal térmico recibe contenido/configuración de la UI. No se une una dependencia de PDF a cada impresión sin evidencia de su llamador.",
        "No se asume que Windows carezca de spooler ni que todo modelo ofrezca consulta de estado. Deben inventariarse SDK, aplicación, driver, firmware y protocolo reales por sucursal.",
        "La opción epson que muestra no configurado no implica que todas las impresoras Epson estén sin soporte: el código distingue explícitamente epson-epos y apiImpresion."
      ]
    },
    {
      "id": "O04",
      "chapter": "evolucion",
      "title": "Actualizar sin perder operaciones pendientes",
      "evidenceNote": "Se releyeron core y devops-platform en sus snapshots auditados. El despliegue observado de Cloud Run no acredita un instalador de sucursal. Las garantías objetivo son criterios de adopción para POS; no nuevos incidentes ni reapertura de decisiones del repositorio core.",
      "sources": [
        {
          "label": "Nest con adaptador Fastify",
          "url": "https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/apps/core-api/src/bootstrap/factories/nest-application.factory.ts#L25-L38"
        },
        {
          "label": "Límites entre módulos y capas en Nx",
          "url": "https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/eslint.config.mjs#L151-L215"
        },
        {
          "label": "Adaptadores AX y mock; extensión futura",
          "url": "https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/apps/sync-worker/src/erp-adapters/erp-adapters.module.ts#L150-L199"
        },
        {
          "label": "Tráfico del manifiesto Cloud Run",
          "url": "https://github.com/developer-implementos/devops-platform/blob/fd423a6f2f4955bd650ee6aebba154d93c0425b8/.github/actions/deploy-cloud-run/lib/templates.sh#L64-L79"
        },
        {
          "label": "Despliegue y ajuste de tráfico",
          "url": "https://github.com/developer-implementos/devops-platform/blob/fd423a6f2f4955bd650ee6aebba154d93c0425b8/.github/actions/deploy-cloud-run/action.yml#L375-L533"
        },
        {
          "label": "Digest y fallback unknown",
          "url": "https://github.com/developer-implementos/devops-platform/blob/fd423a6f2f4955bd650ee6aebba154d93c0425b8/.github/actions/build-and-push-image/action.yml#L823-L845"
        },
        {
          "label": "Alcance del smoke HTTP",
          "url": "https://github.com/developer-implementos/devops-platform/blob/fd423a6f2f4955bd650ee6aebba154d93c0425b8/.github/actions/cloud-run-smoke-tests/action.yml#L216-L266"
        },
        {
          "label": "Ejemplo transaccional de proyección y outbox",
          "url": "https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/libs/vtex-invoices/application/src/lib/services/ingest-invoice.service.ts#L241-L306"
        },
        {
          "label": "Publicación y marcado posterior",
          "url": "https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/libs/shared/backend/pubsub/src/lib/services/outbox-processor.service.ts#L309-L322"
        },
        {
          "label": "Identidad, versión y nombre del evento",
          "url": "https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/libs/core/src/lib/domain/events/domain-event.ts#L47-L107"
        },
        {
          "label": "Adopción corporativa y límites POS",
          "url": "../docs/analisis-repositorios/aportes-plataforma-corporativa.md"
        },
        {
          "label": "Recuperación, compatibilidad y restauración",
          "url": "../docs/revision-resiliencia-datos-pos.md"
        }
      ],
      "current": {
        "diagram": "operation-delivery-current",
        "summary": "La plataforma ofrece precedentes de estructura modular, integración y entrega central. Esos activos son candidatos a reutilizar; el ciclo de instalación y recuperación de tiendas requiere un contrato adicional.",
        "steps": [
          "core usa Nest/Fastify y Nx para organizar dependencias. Monorepo, módulo y unidad desplegable son niveles distintos; una fachada puede seguir dependiendo de red.",
          "devops-platform contiene build y despliegue Cloud Run. Los caminos revisados no acreditan una candidata inicialmente sin tráfico ni una prueba funcional de venta por el smoke HTTP.",
          "Un flujo de core comparte contexto de transacción entre proyección y outbox. El relay publica antes de marcar procesado, por lo que la reentrega sigue siendo posible.",
          "DomainEvent deriva eventName de constructor.name. Ese helper no demuestra un contrato externo estable frente a renombrados, replay o convivencia de versiones."
        ],
        "boundary": "El inventario revisado no aportó un actualizador Windows/Tauri ni protocolo de instalación offline. Esto no afirma que la empresa carezca de otra herramienta fuera de los repos recibidos."
      },
      "proposed": {
        "diagram": "operation-delivery-proposed",
        "summary": "Centro y sucursales deben tolerar versiones diferentes durante un periodo acordado. Cada activación local conserva operaciones pendientes y prueba cómo recuperarse si falla el cambio de programa o esquema.",
        "steps": [
          "Publicar paquete con autenticidad del origen e integridad verificadas y matriz de compatibilidad entre UI, backend/esquema, sincronizador, aplicación local de periféricos y contratos. No aceptar una identidad de artefacto desconocida.",
          "Descargar de forma reanudable, comprobar recursos y activar por grupos de sucursales. La ventana requiere drenaje, checkpoint y continuidad definidos.",
          "Ensayar migración y corte de energía. Volver al binario anterior solo si el esquema y las operaciones nuevas siguen siendo compatibles; de lo contrario recuperar hacia adelante y revalidar el estado antes de operar.",
          "Conservar identidad y versión de eventos durante replay. El centro reconoce duplicados, admite contratos antiguos dentro del horizonte pactado y conserva versiones desconocidas para tratamiento controlado."
        ],
        "boundary": "Restaurar un backup puede perder ventas posteriores; no es un rollback automático seguro. La compatibilidad debe incluir backlog, referencias ERP, permisos locales y efectos externos inciertos."
      },
      "challenge": {
        "question": "Una tienda con versión anterior reconecta después de actualizar el centro",
        "current": "Los activos corporativos no demuestran compatibilidad universal entre versiones. Compartir una clase de evento o una librería no asegura que el mensaje antiguo mantenga nombre, interpretación e identidad.",
        "proposed": "El receptor valida el contrato y la identidad originales. Si ya lo aplicó, reconoce el duplicado; si no soporta la versión, conserva el mensaje para tratamiento controlado. Un cambio de ERP tampoco redirige automáticamente una operación pendiente.",
        "test": "Enviar dos veces la misma operación, entregar un contrato antiguo soportado y otro desconocido, y simular reinicio tras migración local. Verificar que no se genera otro UUID para evitar la deduplicación ni se borra el backlog."
      },
      "notes": [
        "En el snapshot, el manifiesto Cloud Run dirige 100 % a latest y la acción ajusta tráfico después del reemplazo. El build contempla digest unknown. Son límites de esos caminos, no incidentes probados ni características de todos los workflows consumidores.",
        "Una biblioteca compartida de outbox o un flujo transaccional concreto son reutilizables. No acreditan atomicidad de todos los módulos, exactly-once en ERP ni compatibilidad de todos los eventos.",
        "La matriz de adopción debe separar código, ejecución y entrega: módulos/fachadas para responsabilidades; servidor escritor y PostgreSQL para operación de sucursal; paquetes y protocolos para actualizarla.",
        "Los adaptadores AX y mock revisados no prueban un POS con adaptadores productivos para Gira o Perú. El destino histórico, empresa, referencias y versión de contrato se conservan por operación durante el corte ERP.",
        "La vigencia de permisos locales también cambia entre versiones y desconexiones. La propuesta debe declarar una ventana de revocación aceptada por negocio/seguridad, sin inventar TTL ni prometer revocación central instantánea cuando no hay WAN."
      ]
    }
  ],
  "concepts": [
    {
      "id": "sale",
      "title": "Venta y pago de la venta",
      "text": "La persona compra ahora. El backend registra documentos, comprobante y pagos recibidos; DTE y registro en AX tienen fases separadas. Es el recorrido de venta y D01.",
      "boundary": "Guardar un pago recibido no demuestra autorización bancaria ni confirmación ERP.",
      "sources": [
        {
          "label": "Recorrido D01 de venta y DTE",
          "url": "../docs/recorridos-datos-tablas.md"
        }
      ]
    },
    {
      "id": "collection",
      "title": "Cobranza de una deuda anterior",
      "text": "Se recauda contra documentos, acuerdos o cuotas previas. El controlador guarda cobranza, vínculo con cajas_usuario_id, pagos y detalle, hace commit y luego recalcula deuda no sincronizada. No hay que repetir el flujo de una nueva venta para describirlo.",
      "boundary": "Faltan reglas completas de imputación, concurrencia entre sucursales y autorización offline. El commit no engloba el recálculo posterior ni confirma AX.",
      "sources": [
        {
          "label": "Rutas de cobranza",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L331-L344"
        },
        {
          "label": "Cobranza, sesión y commit",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CobranzaController.js#L73-L157"
        },
        {
          "label": "Pagos asociados a cobranza",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CobranzaController.js#L1981-L1997"
        }
      ]
    },
    {
      "id": "credit",
      "title": "NC y uso como medio de pago",
      "text": "Una nota de crédito y su saldo pueden consultarse y, bajo reglas del negocio, utilizarse como medio de pago. D05 explica consulta, marcas Mongo y consumo local como recorridos relacionados, sin transacción común acreditada.",
      "boundary": "El D05 no cubre toda emisión de NC, entrega/reversa de dinero ni devolución física de productos. Una NC no implica por sí sola un reembolso.",
      "sources": [
        {
          "label": "Rutas de NC",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L396-L407"
        },
        {
          "label": "D05 y sus límites",
          "url": "../docs/recorridos-datos-tablas.md"
        }
      ]
    },
    {
      "id": "refund",
      "title": "Devolución y entrega de dinero",
      "text": "Existen rutas propias de devoluciones. El alta revisada persiste entidad y detalles; ese método no demuestra un cargo reversado en el terminal ni entrega física de efectivo. Deben reconstruirse esas ramas con el equipo.",
      "boundary": "Devolucione.create no recibe la trx que sí reciben los detalles en el fragmento revisado: no dibujar atomicidad total. La devolución física tampoco convierte al POS en dueño del stock.",
      "sources": [
        {
          "label": "Rutas de devoluciones",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L353-L356"
        },
        {
          "label": "Alta de devolución y detalles",
          "url": "https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DevolucioneController.js#L127-L151"
        }
      ]
    }
  ]
};

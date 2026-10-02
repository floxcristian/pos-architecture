/* Application-level view over immutable interaction evidence.
 * No corporate calls, DOM access or mutation of POS_INTERACTIONS_*.
 * Transport/DB calls survive aggregation, including app-to-itself calls.
 */
(() => {
  'use strict';
  const rawFlows = () => [
    ...(window.POS_INTERACTIONS_CURRENT || []),
    ...(window.POS_INTERACTIONS_EXTENSIONS || []),
    ...(window.POS_INTERACTIONS_PROPOSED || [])
  ];

  // Application names are display aliases, not new deployments or repositories.
  const applications = {
    'group-frontend': ['Mountain · interfaz de caja', 'mountain-implementos/frontend'],
    'group-backend': ['Mountain · backend de sucursal', 'mountain-implementos/backend'],
    'g-sync': ['Sincronizador de sucursal', 'mountain-sync-sucursal'],
    'g-esb': ['Concentrador · WSO2', 'mountain-concentrador'],
    'g-broker': ['Broker de mensajes', 'AMQP / JMS · configuración por confirmar'],
    'g-node': ['Consumidor de ingreso', 'mountain-concentrador/procesador-cola-bus'],
    'g-erp': ['apiMountainPosCaja', 'apis-implementos/apiMountainPosCaja'],
    'concentrator-app': ['Concentrador · WSO2', 'mountain-concentrador'],
    'read-api': ['API de lectura de maestros', 'mountain-concentrador/api-lectura'],
    'group-sync-app': ['Sincronizador de sucursal', 'mountain-sync-sucursal'],
    'print-angular': ['Mountain · interfaz de caja', 'mountain-implementos/frontend'],
    'print-backend': ['Mountain · backend de sucursal', 'mountain-implementos/backend'],
    'print-windows': ['Agente Windows de impresión', 'api-impresion-caja'],
    'credit-angular': ['Mountain · interfaz de caja', 'mountain-implementos/frontend'],
    'credit-backend': ['Mountain · backend de sucursal', 'mountain-implementos/backend'],
    'credit-payments': ['API de consulta de pagos', 'api-pagos-caja'],
    'sale-terminal': ['Interfaz de caja', 'Aplicación propuesta · repositorio por definir'],
    'sale-branch': ['Backend de sucursal', 'Monolito modular propuesto'],
    'sale-agent': ['Agente de periféricos', 'Aplicación local propuesta'],
    'erp-branch': ['Publicador de sucursal', 'Proceso local propuesto'],
    'erp-ingress': ['API de recepción central', 'Aplicación propuesta por país / entidad'],
    'erp-worker': ['Integración con el ERP', 'Aplicación propuesta por país / entidad']
  };
  const groupTitles = {
    'g-erp': 'apiMountainPosCaja / AX',
    'g-esb': 'Concentrador · WSO2',
    'g-broker': 'Broker de mensajes',
    'concentrator-app': 'Concentrador · WSO2',
    'read-api': 'API de lectura de maestros',
    'group-pricing': 'API de precios configurada',
    'group-fiscal': 'Facturadores configurados',
    'group-client-api': 'API remota de clientes y saldo',
    'credit-remote': 'API remota y consumidores por confirmar'
  };
  const groupRepos = {
    'g-erp': 'apis-implementos · ERP externo',
    'g-broker': 'Configuración en mountain-concentrador',
    'concentrator-app': 'mountain-concentrador',
    'read-api': 'mountain-concentrador/api-lectura',
    'mpos-sql': 'Lectores en mountain-concentrador',
    'central-pg': 'mountain-concentrador',
    'group-sync-app': 'mountain-sync-sucursal',
    'print-pg': 'mountain-implementos',
    'credit-mongo': 'api-pagos-caja',
    'credit-remote': 'Aplicaciones consumidoras y receptor por confirmar'
  };
  const externalLabels = {
    'price-api': ['API de precios', 'Receptor configurado · ubicación por confirmar'],
    'acepta': ['Facturador Acepta', 'Emisión fiscal mediante HTTP'],
    'ingydev': ['Facturador Ingydev', 'Emisión fiscal mediante SOAP'],
    's-ax': ['Dynamics AX', 'Registro de venta · contrato remoto'],
    'remote-client': ['API de clientes · ficha', 'Consulta por RUT · receptor por confirmar'],
    'remote-saldo': ['API de clientes · saldo', 'Consulta condicionada · receptor por confirmar'],
    'c-remote-nc': ['API remota de notas de crédito', 'Receptor configurado por confirmar'],
    'c-marker-caller': ['Aplicación consumidora de estadoNC', 'Origen de las llamadas por confirmar']
  };
  const applicationDetails = {
    sale: {
      'group-frontend': 'Consulta el producto y solicita guardar la venta. Presenta la respuesta del backend al cajero.',
      'group-backend': 'Consulta el precio remoto, guarda la venta y sus pagos en PostgreSQL y solicita la emisión fiscal cuando corresponde. El resultado fiscal se guarda después del commit de venta.'
    },
    sync: {
      'g-sync': 'Prepara y envía ventas elegibles al concentrador. Recibe las respuestas de AX y actualiza negocio y seguimiento local en etapas distintas.',
      'g-esb': 'Registra la recepción central, coordina el procesamiento de pendientes y llama a la API de AX. Guarda el resultado y prepara su devolución a la sucursal.',
      'g-broker': 'Transporta mensajes de ingreso y respuestas mediante colas. Su acuse técnico no acredita persistencia local ni registro de la venta en AX.',
      'g-node': 'Recibe mensajes del broker y solicita guardarlos en PostgreSQL. El acuse al broker observado no espera a que termine esa escritura.',
      'g-erp': 'Recibe la solicitud central de registro de venta y la adapta al contrato de Dynamics AX. Devuelve el resultado para que el concentrador lo interprete y conserve.'
    },
    masters: {
      'concentrator-app': 'Consulta los cambios de MPOS y construye lotes de maestros en PostgreSQL central. Marcar el origen, generar detalles y preparar salidas son etapas con confirmaciones separadas.',
      'read-api': 'Ofrece lotes pendientes al sincronizador y registra acuses y resultados por sucursal. También permite recuperar lotes enviados que aún no figuran procesados.',
      'group-sync-app': 'Descarga y guarda el lote, aplica cada detalle a las tablas locales e informa su resultado. Cliente y dirección son ramas alternativas con transacciones por detalle.',
      'group-backend': 'Atiende la solicitud local de recálculo de cuenta y guarda sus derivados. Esta tarea posterior puede fallar sin revertir una ficha ya confirmada.'
    },
    customer: {
      'group-frontend': 'Solicita la ficha del cliente y presenta el resultado. En la rama de error observada puede limpiar el borrador de venta.',
      'group-backend': 'Resuelve la identidad, consulta la ficha remota y actualiza cliente, direcciones y cuenta local. La consulta de saldo tiene condiciones propias y puede usar una ficha anterior si falla el refresco.'
    },
    printing: {
      'print-angular': 'Solicita la representación fiscal cuando corresponde y elige el canal de impresión configurado. La API Windows y la conexión ePOS son alternativas distintas.',
      'print-backend': 'Consulta documento, DTE, estado y facturador para devolver un PDF o referencia. Esa consulta no implica que se haya impreso físicamente el documento.',
      'print-windows': 'Recibe contenido y configuración, prepara la impresión y la entrega al sistema operativo. La respuesta HTTP no confirma que el papel haya salido de la impresora.'
    },
    credit: {
      'credit-angular': 'Consulta notas de crédito para el cliente y envía la venta con el medio de pago seleccionado. La consulta no acredita por sí sola una reserva global del importe.',
      'credit-backend': 'Combina consultas de notas de crédito locales y remotas y guarda su uso como pago de la venta. El guardado local no comparte una transacción observada con las marcas remotas.',
      'credit-payments': 'Consulta el directorio de sucursales, sus pendientes PostgreSQL y las marcas de uso en MongoDB. Es una API de consulta y estado; no se presenta como terminal de cobro ni emisor fiscal.'
    },
    'proposed-sale': {
      'sale-terminal': 'Solicitaría la venta y mostraría el estado devuelto por la sucursal. La interfaz no decidiría por sí sola si un pago o una emisión fiscal están aprobados.',
      'sale-branch': 'Validaría la operación y conservaría intenciones, evidencias y estados. Confirmaría el negocio y sus eventos de salida en una misma transacción local.',
      'sale-agent': 'Ejecutaría comandos autorizados para los dispositivos y conservaría evidencia de sus resultados. Una respuesta incierta requeriría recuperación antes de volver a producir el efecto.'
    },
    'proposed-erp': {
      'erp-branch': 'Leería eventos locales confirmados y los entregaría a la recepción central. Guardaría el acuse de custodia para controlar entrega y retención.',
      'erp-ingress': 'Recibiría eventos de sucursal y guardaría mensaje y trabajo en una misma transacción. Acusaría custodia después de persistir, sin afirmar todavía un resultado ERP.',
      'erp-worker': 'Reclamaría trabajo y conservaría el destino asociado a cada operación. Registraría el resultado ERP o mantendría la incertidumbre para una conciliación controlada.'
    }
  };

  // Preserve SQL expressions, table names, HTTP paths and SOAP contracts verbatim.
  // Only implementation/ORM labels are translated into the operation they express.
  const edgeLabels = {
    sync: {
      'se-store': 'PUBLICA mensaje de ingreso en el broker',
      'se-node-ack': 'ACK al broker sin esperar el INSERT',
      'se-net-ax': 'SOLICITA registrar la venta en AX',
      'se-result-store': 'PUBLICA respuesta para la sucursal de origen',
      'se-alternative': 'CONSUME cola de ingreso · variante por confirmar'
    },
    masters: {
      'enqueue-job': 'PUBLICA trabajo de generación de lotes si hay pendientes'
    },
    credit: {
      'c06': 'CONSULTA sucursales activas',
      'c10': 'CONSULTA / GUARDA estadoNC',
      'c13': 'LEE / GUARDA pago, nota de crédito y vínculo'
    }
  };

  // This internal edge describes enqueueing outside the application process.
  // Keep it visible even though its two source nodes share a logical group.
  const retainInternalEffects = new Set(['masters:enqueue-job']);

  const summaries = {
    sale: 'La interfaz consulta el producto y su precio, y envía la venta al backend. Este guarda la operación y confirma su transacción antes de solicitar el DTE cuando corresponde.',
    sync: 'El sincronizador prepara y envía la venta. El concentrador registra el mensaje, coordina su procesamiento en AX y devuelve el resultado para aplicarlo en la sucursal.',
    masters: 'El concentrador lee cambios de MPOS, guarda lotes en PostgreSQL y los ofrece mediante la API de lectura. El sincronizador descarga y aplica cada detalle; cliente y dirección son ramas alternativas.',
    customer: 'La interfaz solicita un cliente al backend. El backend consulta la ficha remota y actualiza sus tablas locales; el saldo posterior tiene condiciones y escrituras propias.',
    printing: 'La interfaz puede consultar la representación fiscal y pedir impresión mediante la API Windows o la conexión ePOS. Las dos alternativas tienen contratos y resultados distintos.',
    credit: 'La interfaz consulta notas de crédito, el backend combina consultas locales y remotas, y la API de pagos consulta sucursales y MongoDB. Guardar el pago local y marcar uso remoto no forman una reserva corporativa atómica.',
    'proposed-sale': 'Propuesta con LAN operativa: el backend valida la venta, guarda intenciones y confirma negocio y eventos de salida juntos. El agente y los proveedores conservan resultados separados de pago y fiscalidad.',
    'proposed-erp': 'Propuesta: el publicador entrega eventos locales a una API central. La recepción guarda mensaje y trabajo juntos; la integración registra el resultado ERP o deja la operación para conciliación. El acuse central confirma custodia.'
  };
  const boundaries = {
    sync: 'Código inspeccionado, no despliegue confirmado. Se muestra el consumidor de ingreso que guarda en PostgreSQL y el procesamiento posterior del concentrador; su conexión y activación deben confirmarse. Existe otra configuración de consumo. Un ACK técnico no confirma DTE ni ERP.',
    customer: 'Se muestra principalmente un refresco exitoso. Si falla, el backend puede leer datos locales e intentar saldo sin una nueva confirmación de ficha. No se escribe el cliente en AX ni se actualizan todos sus contactos en este recorrido.',
    printing: 'Código inspeccionado, sin ejecución ni tráfico productivo. PDF disponible, HTTP 200, entrega al driver y papel entregado no son confirmaciones equivalentes. No se une una descarga PDF a toda impresión térmica.'
  };
  const stepBoundaries = {
    sale: {
      2: 'La participación de todas las escrituras en una misma transacción necesita validación.',
      3: 'La marca de preparación puede fallar sin que ese error interrumpa necesariamente el recorrido.'
    },
    sync: {
      9: 'La configuración efectiva debe identificar qué consumidores están activos.'
    },
    masters: {
      1: 'Contar pendientes, leer MPOS y construir lotes PostgreSQL son operaciones distintas del concentrador.',
      5: 'Son alternativas con transacciones por detalle; no una transacción para todo el lote.'
    },
    customer: {
      3: 'El saldo posterior y la llamada remota previa quedan fuera de esta transacción.',
      4: 'No aplica a toda carga. Puede usar la ficha antigua si falló el refresco; una solicitud sin ID local puede retornar antes.'
    },
    credit: {
      5: 'La participación uniforme en la transacción necesita validación. Este guardado no confirma emisión fiscal, cargo bancario ni aceptación de AX, y no comparte transacción con las marcas MongoDB.'
    }
  };

  // Functional story text; exact former wording remains in implementationSteps.
  const stories = {
    sale: [
      ['Consultar producto y precio', 'La interfaz solicita el producto al backend. La consulta de precio depende de la API remota configurada; un error puede impedir continuar al pago.'],
      ['Enviar y guardar documento', 'La interfaz envía la venta. El backend guarda documento y líneas y calcula los impuestos dentro del procesamiento de la operación.'],
      ['Guardar comprobante y pagos', 'El backend conserva el comprobante, sus vínculos y los pagos recibidos. Registrar esos datos no significa ejecutar un cargo bancario.'],
      ['Confirmar antes de facturar', 'La transacción de venta se confirma antes de solicitar la emisión fiscal. La preparación del DTE y sus estados se guardan después, por separado.'],
      ['Invocar al facturador seleccionado', 'El backend llama al facturador configurado. Las rutas HTTP y SOAP representan alternativas; no indican dos emisiones de una misma venta.'],
      ['Registrar resultado por separado', 'El backend intenta guardar el resultado fiscal y actualiza estados del documento y comprobante. Un fallo posterior no revierte la venta ya persistida.'],
      ['Responder a la interfaz', 'El backend devuelve el resultado de la solicitud. La venta local, la emisión fiscal y el registro posterior en AX conservan estados distintos.']
    ],
    sync: [
      ['Preparar venta', 'El sincronizador selecciona documentos elegibles y crea el mensaje local. La marca de preparación no confirma su registro en AX.'],
      ['Registrar recepción central', 'El sincronizador envía el sobre. El concentrador registra consulta y mensaje en PostgreSQL mediante operaciones consecutivas.'],
      ['Encolar y responder', 'El concentrador publica el mensaje en el broker y responde al envío HTTP. Este acuse representa recepción técnica, no aprobación de AX.'],
      ['Persistir el mensaje recibido', 'El consumidor de ingreso solicita guardar el mensaje en la cola PostgreSQL y acusa al broker sin esperar a que termine ese INSERT.'],
      ['Reclamar trabajo y preparar detalles', 'El concentrador reclama hasta dos pendientes de la cola y prepara identidades centrales y relaciones por destino. La recuperación y concurrencia necesitan validación.'],
      ['Invocar la API de AX', 'El concentrador llama a apiMountainPosCaja para registrar la venta. Esa aplicación adapta la solicitud y llama a AX; una respuesta exitosa ya guardada puede evitar repetir la operación.'],
      ['Guardar resultado', 'El adaptador devuelve el resultado de AX. El concentrador distingue errores generales y resultados por tabla y guarda evidencia de procesamiento.'],
      ['Retornar a sucursal', 'El concentrador publica el resultado para la sucursal de origen. El sincronizador solicita persistir la respuesta en su cola local; el binding efectivo de las colas está pendiente de confirmar.'],
      ['Aplicar negocio y seguimiento', 'El sincronizador interpreta la respuesta y actualiza datos de negocio. Después registra el seguimiento de mensajes; estas escrituras tienen fronteras distintas.'],
      ['Cerrar cola y distinguir la variante', 'El concentrador marca el trabajo procesado. Existe además otra configuración de consumo de la cola; el despliegue activo debe confirmarse antes de combinar ambos recorridos.']
    ],
    masters: [
      ['Detectar cambios centrales', 'El productor de AX hacia MPOS sigue pendiente de identificar. El concentrador consulta cuántos clientes tienen cambios pendientes en MPOS.'],
      ['Encolar y generar detalles', 'Cuando hay cambios, el concentrador publica trabajo de generación, lee MPOS y materializa detalles en PostgreSQL central.'],
      ['Marcar origen y distribuir', 'El origen se marca antes de completar cabeceras y salidas centrales. Los commits separados requieren probar recuperación ante una interrupción.'],
      ['Pedir un lote', 'El sincronizador solicita cambios a la API de lectura. La API selecciona la salida y la marca enviada antes de devolver sus datos.'],
      ['Acusar antes de persistir', 'El sincronizador acusa la recepción del lote y después guarda su sobre local. La recuperación de enviados no procesados es un recorrido independiente.'],
      ['Leer detalles pendientes', 'El sincronizador lee cada detalle pendiente y aplica la rama de cliente o dirección que le corresponde. Cada detalle tiene su propia transacción.'],
      ['Aplicar tablas del maestro', 'El sincronizador actualiza las tablas locales de cliente o dirección. Son ramas alternativas y una dirección requiere la relación con su cliente.'],
      ['Finalizar detalle y guardar seguimiento', 'La aplicación confirma o revierte el detalle y guarda después su resultado de sincronización. El lote completo no se presenta como una única transacción.'],
      ['Recalcular cuenta cuando corresponde', 'El sincronizador completa el plazo cuando aplica y solicita al backend el recálculo del estado de cuenta mediante la red local.'],
      ['Informar y cerrar', 'El sincronizador informa los resultados a la API de lectura. El concentrador actualiza detalles, salida y contadores; el sincronizador cierra su mensaje local.'],
      ['Recuperar enviados pendientes', 'El sincronizador consulta lotes enviados que aún no figuran procesados. La marca de recibido no elimina esta vía de recuperación; relectura y retención deben probarse.']
    ],
    customer: [
      ['Cargar y resolver identidad', 'La interfaz solicita el cliente. Si existe un ID local, el backend consulta empresa y persona para resolver la identidad necesaria.'],
      ['Consultar ficha remota', 'El backend consulta el cliente por RUT en la API configurada. El receptor y su publicación efectivos deben confirmarse.'],
      ['Actualizar cliente y direcciones', 'Con una respuesta válida, el backend guarda persona, empresa y direcciones con la transacción de actualización de ficha.'],
      ['Guardar cupo y confirmar ficha', 'El backend consulta el plazo y guarda cupo y estado de cuenta cuando corresponde. Esta confirmación pertenece a la ficha del cliente.'],
      ['Consultar saldo en la rama aplicable', 'El backend consulta saldo remoto cuando las condiciones del recorrido lo permiten. Un refresco de ficha fallido no elimina necesariamente el camino con datos locales previos.'],
      ['Recalcular cuenta con datos locales', 'El backend lee operaciones, abonos y cuotas locales. Solo una respuesta externa válida actualiza el saldo remoto; los derivados locales tienen su propio cálculo.'],
      ['Devolver ficha o tratar error', 'El backend devuelve la ficha o un error. En la interfaz, el fallo puede limpiar el borrador de venta; no implica borrar una venta persistida.']
    ],
    printing: [
      ['Obtener representación fiscal', 'Si se solicita el PDF o referencia, la interfaz llama al backend, que consulta el documento, sus DTE, estado y facturador.'],
      ['Elegir el canal API Windows', 'La interfaz envía el contenido y configuración al agente Windows de impresión. Esta alternativa es distinta de la conexión ePOS.'],
      ['Preparar la impresión', 'El agente prepara el contenido y solicita la impresión al sistema operativo. La implementación queda disponible al inspeccionar la aplicación.'],
      ['Interpretar respuesta e incertidumbre', 'La API puede responder que está imprimiendo. La entrega al driver y esa respuesta no demuestran que el papel haya salido físicamente.'],
      ['Ver la alternativa ePOS', 'En la variante ePOS, la interfaz se conecta al dispositivo configurado. Esa ruta no pasa por la API Windows del otro canal.'],
      ['Conservar la distinción entre estados', 'Solicitud recibida, trabajo entregado al driver y resultado físico son hechos distintos. Reimprimir una representación no debe confundirse con emitir una factura nueva.']
    ],
    credit: [
      ['Consultar notas de crédito por cliente', 'La interfaz pide notas de crédito al backend. Este combina la consulta remota con pendientes locales; no se deduce una reserva global.'],
      ['Consultar otras sucursales', 'El backend consulta la API de pagos. Esta lee el directorio MongoDB de sucursales activas y consulta pendientes en sus PostgreSQL.'],
      ['Interpretar el desfase de sincronización', 'Las consultas filtran ventas finalizadas y notas de crédito aprobadas con la marca local indicada. Preparación de sincronización y confirmación AX son estados distintos.'],
      ['Leer o cambiar marcas de uso', 'Consultar una marca y solicitar su cambio son ramas diferentes. El consumidor de las escrituras remotas sigue pendiente de identificar.'],
      ['Recibir pago con nota de crédito', 'La interfaz envía la venta al backend. El pago con nota de crédito se guarda en el contexto de esa operación local.'],
      ['Persistir consumo local y conservar límites', 'El backend conserva pago, nota de crédito y vínculo al comprobante. Esto no demuestra atomicidad con las marcas remotas de MongoDB ni con las otras sucursales.']
    ],
    'proposed-sale': [
      ['Validar la operación habilitada', 'La interfaz pide la venta al backend. Este valida permisos, vigencia de datos, reglas y capacidades disponibles antes de producir efectos.'],
      ['Guardar antes de producir efectos', 'El backend guarda una intención con identidad y destino estables. Un nuevo intento no autoriza a cambiar de proveedor si el resultado anterior sigue incierto.'],
      ['Resolver el pago habilitado', 'El backend entrega un comando durable al agente. El agente obtiene y reporta evidencia del medio de pago cuando la operación y su perfil lo permiten.'],
      ['Cumplir la condición fiscal', 'El backend solicita la emisión permitida y conserva su resultado. La viabilidad fiscal offline depende del país, proveedor y perfil autorizados.'],
      ['Conservar evidencia y decidir', 'El backend guarda observaciones y decide según reglas deterministas. Offline y timeout no prueban aprobación de pago ni éxito fiscal.'],
      ['Confirmar negocio y eventos juntos', 'El backend confirma negocio y eventos de salida en la misma transacción PostgreSQL. La respuesta a la interfaz informa el estado local; la entrega al ERP es otro recorrido.']
    ],
    'proposed-erp': [
      ['Entregar operaciones confirmadas', 'El publicador lee los eventos confirmados de sucursal y los entrega por lotes a la API central.'],
      ['Guardar recepción y trabajo juntos', 'La API central guarda mensaje, identidad de operación y trabajo en una misma transacción. La deduplicación forma parte del contrato propuesto.'],
      ['Acusar custodia y conservar recuperación', 'La API devuelve un acuse después de persistir; el publicador lo guarda para entrega y retención. Este acuse no confirma el efecto ERP.'],
      ['Elegir el destino y fijarlo', 'La aplicación de integración reclama trabajo habilitado y fija destino e intento. Los pendientes conservan sus referencias originales durante una migración ERP.'],
      ['Intentar bajo el contrato del destino', 'La integración solicita el efecto al ERP vinculado y recibe su resultado. Un timeout puede dejar resultado incierto y no autoriza repetir ciegamente.'],
      ['Persistir evidencia o conciliar', 'La integración conserva estado y evidencia; consulta al ERP si esa capacidad está disponible. Cuando no lo está, la resolución requiere conciliación controlada.']
    ]
  };

  const uniqueSources = items => {
    const seen = new Set();
    return items.flatMap(item => item.sources || []).filter(source => {
      const key = source.url + '\n' + source.label;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).map(source => ({ ...source }));
  };
  const simpleTitle = title => title.replace(/^\d+\s*[.·]\s*/, '');

  function project(raw) {
    const rawNodeById = new Map(raw.nodes.map(node => [node.id, node]));
    const mappedId = node => node.kind === 'component' ? 'app:' + node.group : node.id;
    const hidden = [];
    const hiddenEdgesReason = {};
    const visibleEdges = raw.edges.filter(edge => {
      const from = rawNodeById.get(edge.from), to = rawNodeById.get(edge.to);
      const internalToApp = edge.protocol === 'Interno' && from.kind === 'component' && to.kind === 'component' && from.group === to.group;
      if (!internalToApp || retainInternalEffects.has(raw.id + ':' + edge.id)) return true;
      hidden.push(edge);
      hiddenEdgesReason[edge.id] = 'Implementación interna de una misma aplicación; disponible al inspeccionarla. No es una llamada de transporte ni una consulta a base de datos.';
      return false;
    });
    const groups = raw.groups.filter(group => raw.nodes.some(node => node.group === group.id)).map(group => {
      const app = applications[group.id];
      let repo = groupRepos[group.id] || group.repo;
      if (group.id === 'group-postgres') repo = raw.id === 'masters' ? 'mountain-sync-sucursal / mountain-implementos' : 'mountain-implementos';
      return {
        ...group,
        title: groupTitles[group.id] || (app ? app[0] : group.title),
        repo,
        implementationGroup: group
      };
    });
    const nodes = [];
    for (const group of groups) {
      const members = raw.nodes.filter(node => node.group === group.id);
      const components = members.filter(node => node.kind === 'component');
      if (components.length) {
        const display = applications[group.id] || [group.title, group.repo];
        nodes.push({
          id: 'app:' + group.id,
          group: group.id,
          title: display[0], kind: 'component', subtitle: display[1],
          detail: applicationDetails[raw.id]?.[group.id] || 'Aplicación que participa en este recorrido. Sus llamadas y escrituras se muestran por separado; el detalle de implementación conserva las fuentes originales.',
          sources: uniqueSources(components),
          application: true,
          implementationNodes: components.slice(),
          implementationEdges: hidden.filter(edge => rawNodeById.get(edge.from).group === group.id),
          implementationGroup: group.implementationGroup
        });
      }
      for (const node of members.filter(node => node.kind !== 'component')) {
        const display = externalLabels[node.id];
        nodes.push({
          ...node,
          ...(display ? { title: display[0], subtitle: display[1] } : {}),
          sources: uniqueSources([node]),
          implementationNodes: [node],
          implementationEdges: []
        });
      }
    }
    const edges = visibleEdges.map(edge => ({
      ...edge,
      from: mappedId(rawNodeById.get(edge.from)),
      to: mappedId(rawNodeById.get(edge.to)),
      label: edgeLabels[raw.id]?.[edge.id] || edge.label,
      sources: uniqueSources([edge]),
      implementationEdges: [edge],
      ...(retainInternalEffects.has(raw.id + ':' + edge.id) ? { retainedInternalEffect: 'Publicación de trabajo en el broker; efecto fuera del proceso aunque el grupo fuente lo agrupe con la aplicación.' } : {})
    }));
    const edgeIds = new Set(edges.map(edge => edge.id));
    const steps = raw.steps.map((step, index) => {
      const display = stories[raw.id]?.[index];
      return {
        ...step,
        title: display?.[0] || simpleTitle(step.title),
        detail: display?.[1] || step.detail,
        boundary: stepBoundaries[raw.id]?.[index] || step.boundary,
        edges: step.edges.filter(id => edgeIds.has(id)),
        implementationSteps: [step],
        implementationBoundary: step.boundary,
        implementationEdges: step.edges.map(id => raw.edges.find(edge => edge.id === id)),
        hiddenEdgesReason: Object.fromEntries(step.edges.filter(id => hiddenEdgesReason[id]).map(id => [id, hiddenEdgesReason[id]]))
      };
    }).filter(step => step.edges.length);
    return {
      ...raw,
      summary: summaries[raw.id] || raw.summary,
      boundary: boundaries[raw.id] || raw.boundary,
      groups, nodes, edges, steps,
      implementationEdges: hidden.slice(),
      hiddenEdgesReason,
      implementationSteps: raw.steps.slice(),
      implementationSummary: raw.summary,
      implementationBoundary: raw.boundary,
      view: 'applications-and-data'
    };
  }

  window.POS_INTERACTIONS_VIEW = { all: () => rawFlows().map(project) };
})();

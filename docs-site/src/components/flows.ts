export type FlowNodeState = 'idle' | 'active' | 'done' | 'waiting';

export interface FlowStep {
  title: string;
  description: string;
  confirmed: string;
  pending: string;
  route?: string;
  code: string;
  nodes: { state: FlowNodeState; status: string }[];
}

export interface FlowScenario {
  title: string;
  description: string;
  boundary: string;
  nodes: { title: string; detail: string }[];
  steps: FlowStep[];
}

/** Examples of the proposed contracts, not an execution trace from production. */
export const flows: Record<'sale' | 'pricing', FlowScenario> = {
  sale: {
    title: 'Una venta, varias confirmaciones',
    description: 'Venta en efectivo autorizada, con LAN y servidor de sucursal disponibles. La WAN falla y una respuesta se pierde: cada participante conserva un estado distinto.',
    boundary: 'La recepción central no acredita pago, aceptación fiscal ni contabilización. Cada resultado conserva su propia evidencia y su propio estado.',
    nodes: [
      { title: 'Caja', detail: 'Cliente y operador' },
      { title: 'Sucursal', detail: 'Backend + PostgreSQL' },
      { title: 'País', detail: 'Recepción durable' },
      { title: 'ERP', detail: 'Sistema externo' },
    ],
    steps: [
      {
        title: 'La sucursal valida la operación',
        description: 'El backend verifica identidad, alcance, turno y versión de precios. El operador registra el efectivo recibido según la política acordada. La continuidad depende de que esta operación esté habilitada sin WAN.',
        confirmed: 'Hay una solicitud identificada y una versión de precios seleccionada.',
        pending: 'La venta aún no está guardada. Los requisitos fiscales se resuelven según el perfil de país.',
        route: 'Caja → backend de sucursal · solicitud autenticada',
        code: 'commandId = "sale-1042"\npricingVersion = "prices-41"',
        nodes: [{ state: 'active', status: 'Solicitud enviada' }, { state: 'active', status: 'Validando reglas' }, { state: 'idle', status: 'Sin recepción' }, { state: 'idle', status: 'Sin registro' }],
      },
      {
        title: 'Venta y outbox quedan en el mismo commit',
        description: 'La unidad de trabajo escribe la venta y el evento pendiente usando la misma transacción PostgreSQL. Si falla el commit, no se confirma la venta. No existe una llamada al ERP dentro de esa transacción.',
        confirmed: 'La venta está persistida en la sucursal y el evento sale-1042 está en su outbox.',
        pending: 'La entrega al país y el registro ERP siguen pendientes.',
        route: 'PostgreSQL de sucursal → caja · confirmación local',
        code: 'BEGIN;\n  guardar_venta(); guardar_outbox("sale-1042");\nCOMMIT;',
        nodes: [{ state: 'done', status: 'Venta guardada' }, { state: 'done', status: 'Venta + outbox durables' }, { state: 'idle', status: 'Sin recepción' }, { state: 'idle', status: 'Sin registro' }],
      },
      {
        title: 'Sin WAN, el pendiente se conserva',
        description: 'El worker de sucursal no consigue entregar el evento por HTTPS. Programa otro intento y mantiene la identidad original. La venta local no se borra ni se convierte en una venta nueva.',
        confirmed: 'La venta y el evento permanecen en PostgreSQL de sucursal.',
        pending: 'No existe confirmación de recepción central. La LAN y el servidor local deben seguir disponibles.',
        code: 'eventId = "sale-1042"\ndeliveryStatus = "pending"',
        nodes: [{ state: 'done', status: 'Venta guardada' }, { state: 'waiting', status: 'Outbox pendiente · sin WAN' }, { state: 'idle', status: 'Sin recepción' }, { state: 'idle', status: 'Sin registro' }],
      },
      {
        title: 'El país confirma su propia transacción',
        description: 'Al volver la conexión, el receptor verifica identidad y contrato. Guarda inbox, efecto local y siguiente outbox en una transacción. Solo después del commit puede emitir un ACK de aplicación.',
        confirmed: 'El evento ya está recibido y persistido en el país.',
        pending: 'La sucursal todavía debe recibir el ACK. La integración ERP aún no ha terminado.',
        route: 'Sucursal → país · evento sale-1042 por HTTPS',
        code: 'BEGIN;\n  guardar_inbox(); aplicar_efecto(); guardar_outbox();\nCOMMIT; // recién ahora: ACK',
        nodes: [{ state: 'done', status: 'Venta guardada' }, { state: 'waiting', status: 'Esperando ACK' }, { state: 'done', status: 'Inbox + efecto + outbox' }, { state: 'idle', status: 'Pendiente de integración' }],
      },
      {
        title: 'La respuesta se pierde; el evento se reintenta',
        description: 'La sucursal no puede saber si el país alcanzó a guardar la solicitud. Reenvía el mismo evento. El receptor reconoce origen, consumidor e ID, comprueba el contenido y responde sin repetir el efecto.',
        confirmed: 'La inbox del país identifica una entrega repetida del mismo evento.',
        pending: 'Falta que el ACK llegue a la sucursal. Un ID reutilizado con otro contenido debe rechazarse.',
        route: 'Sucursal → país · reintento con la misma identidad',
        code: 'dedupKey = [origin, consumer, eventId]\nsi_existe_mismo_contenido → no_repetir_efecto()',
        nodes: [{ state: 'done', status: 'Una sola venta' }, { state: 'active', status: 'Reintenta sale-1042' }, { state: 'done', status: 'Duplicado reconocido' }, { state: 'idle', status: 'Pendiente de integración' }],
      },
      {
        title: 'El ACK resuelve la entrega central',
        description: 'La sucursal marca la recepción confirmada después de validar el ACK. Conserva los registros según una política de retención y recuperación: recibir un ACK no implica borrar inmediatamente la evidencia.',
        confirmed: 'La sucursal sabe que el país persistió el evento.',
        pending: 'El resultado ERP, el fiscal y el de pago se consultan y actualizan por separado.',
        route: 'País → sucursal · ACK después del commit',
        code: 'deliveryStatus = "acknowledged"\nerpStatus = "pending"',
        nodes: [{ state: 'done', status: 'Venta guardada' }, { state: 'done', status: 'Entrega confirmada' }, { state: 'done', status: 'Custodia durable' }, { state: 'waiting', status: 'Aún pendiente' }],
      },
      {
        title: 'Un timeout ERP deja un resultado desconocido',
        description: 'El adaptador envía la operación con una referencia estable. Si el ERP procesa pero su respuesta se pierde, el worker registra incertidumbre y consulta por esa referencia antes de intentar otro efecto monetario.',
        confirmed: 'Existe evidencia de un intento de integración y una referencia de conciliación.',
        pending: 'Un timeout no demuestra rechazo ni éxito ERP. Falta consultar el resultado externo.',
        route: 'Adaptador de país → ERP · solicitud con referencia estable',
        code: 'externalReference = "sale-1042"\nerpStatus = "reconciliation_required"',
        nodes: [{ state: 'done', status: 'Venta guardada' }, { state: 'done', status: 'Entrega confirmada' }, { state: 'waiting', status: 'Conciliando resultado' }, { state: 'waiting', status: 'Respuesta desconocida' }],
      },
      {
        title: 'La conciliación aporta la confirmación ERP',
        description: 'En este ejemplo, la consulta externa encuentra el registro por su referencia. El adaptador conserva la evidencia, actualiza el estado ERP y publica ese cambio para la sucursal. Si no pudiera comprobarlo, continuaría pendiente de revisión.',
        confirmed: 'El ERP confirmó su registro mediante una consulta verificable.',
        pending: 'Esta confirmación no sustituye los estados propios del pago o del documento fiscal.',
        route: 'ERP → país → sucursal · resultado de conciliación',
        code: 'erpStatus = "confirmed"\nevidence = { externalReference, erpDocumentId }',
        nodes: [{ state: 'done', status: 'Consulta estados separados' }, { state: 'done', status: 'Resultado ERP recibido' }, { state: 'done', status: 'Evidencia registrada' }, { state: 'done', status: 'Registro comprobado' }],
      },
    ],
  },
  pricing: {
    title: 'Precios locales con una versión completa',
    description: 'Una carga masiva prepara la base y los eventos incorporan cambios. Las cajas siguen leyendo una versión válida mientras la siguiente se comprueba en segundo plano.',
    boundary: 'Los IDs y cursores son ilustrativos. La fuente autorizada, la vigencia, el orden y los contratos de publicación deben acordarse por dato y país.',
    nodes: [
      { title: 'Fuente', detail: 'Dueño de precios y ofertas' },
      { title: 'País', detail: 'Publica versiones' },
      { title: 'Candidata', detail: 'Staging en sucursal' },
      { title: 'Activa', detail: 'Lectura local del POS' },
    ],
    steps: [
      {
        title: 'La caja consulta la versión local vigente',
        description: 'La versión 41 está completa, validada y activa. El backend calcula precios y promociones con ese espejo autorizado; registra qué versión aplica a cada operación.',
        confirmed: 'La versión 41 es la versión activa de este ejemplo.',
        pending: 'Una versión futura no puede utilizarse hasta validar su integridad y vigencia.',
        code: 'activePricingVersion = 41\nquote.pricingVersion = 41',
        nodes: [{ state: 'idle', status: 'Fuente autorizada' }, { state: 'idle', status: 'Sin nueva publicación' }, { state: 'idle', status: 'Sin candidata' }, { state: 'done', status: 'Versión 41' }],
      },
      {
        title: 'Una carga masiva crea la candidata',
        description: 'El publicador genera un snapshot consistente con versión, alcance y punto de corte. La sucursal lo descarga por partes a staging. La carga no modifica los precios activos fila a fila.',
        confirmed: 'La publicación identifica la candidata 42 y su cursor base 1042.',
        pending: 'La descarga y la validación de la candidata todavía no terminan.',
        route: 'Fuente → país → staging de sucursal · snapshot 42',
        code: 'candidate = { version: 42, watermark: 1042 }\nactivePricingVersion = 41',
        nodes: [{ state: 'done', status: 'Snapshot consistente' }, { state: 'done', status: 'Publicación 42' }, { state: 'active', status: 'Descargando candidata' }, { state: 'done', status: 'Sigue en versión 41' }],
      },
      {
        title: 'Se comprueba integridad y alcance',
        description: 'La sucursal verifica checksum, cantidades, moneda, país, referencias y vigencia. Una carga incompleta o incompatible queda rechazada o pendiente; no se convierte en la versión visible para las ventas.',
        confirmed: 'El snapshot 42 pasó las validaciones del ejemplo.',
        pending: 'Falta completar los cambios posteriores al punto de corte antes de activar.',
        code: 'validateChecksum(); validateReferences();\nvalidateScope(); validateValidity();',
        nodes: [{ state: 'done', status: 'Snapshot identificado' }, { state: 'done', status: 'Contrato publicado' }, { state: 'active', status: 'Validando candidata 42' }, { state: 'done', status: 'Sigue en versión 41' }],
      },
      {
        title: 'Los deltas completan la candidata',
        description: 'Los cambios posteriores al snapshot se aplican con cursor e identidad estables. El evento 1043 se incorpora una sola vez. Los eventos repetidos se reconocen sin duplicar efectos.',
        confirmed: 'La candidata incorpora todos los cambios hasta el cursor 1043.',
        pending: 'La versión 42 permanece oculta hasta completar y validar la secuencia requerida.',
        route: 'País → candidata · delta 1043',
        code: 'expectedCursor = 1043\napplyOnce(eventId, candidateVersion);',
        nodes: [{ state: 'done', status: 'Cambio publicado' }, { state: 'active', status: 'Distribuye delta 1043' }, { state: 'active', status: 'Cursor 1043 aplicado' }, { state: 'done', status: 'Sigue en versión 41' }],
      },
      {
        title: 'Un hueco bloquea la activación',
        description: 'Llega el cambio 1045, pero falta el 1044. La sucursal detecta el hueco, conserva el pendiente y solicita recuperación. No supone que una versión parcialmente actualizada sea válida.',
        confirmed: 'La versión 41 sigue disponible si su política de vigencia lo permite.',
        pending: 'La candidata no puede activarse: falta el delta 1044 y la validación final.',
        code: 'receivedCursor = 1045; expectedCursor = 1044\ncandidateStatus = "gap_detected"',
        nodes: [{ state: 'done', status: 'Cambios disponibles' }, { state: 'waiting', status: 'Debe recuperar 1044' }, { state: 'waiting', status: 'Hueco detectado' }, { state: 'done', status: 'Versión 41 intacta' }],
      },
      {
        title: 'La recuperación completa la secuencia',
        description: 'El publicador reenvía el cambio faltante o entrega una nueva base consistente si el histórico ya no está disponible. En este recorrido se recupera 1044, se aplica 1045 y se vuelve a validar la candidata.',
        confirmed: 'La candidata 42 está completa hasta el punto de activación acordado.',
        pending: 'Todavía falta el cambio atómico de la versión activa.',
        route: 'País → candidata · recuperación de 1044 y 1045',
        code: 'applyInOrder([1044, 1045]);\nvalidateCandidate(42);',
        nodes: [{ state: 'done', status: 'Histórico recuperable' }, { state: 'done', status: 'Secuencia reenviada' }, { state: 'done', status: 'Candidata 42 completa' }, { state: 'done', status: 'Sigue en versión 41' }],
      },
      {
        title: 'La activación cambia la referencia completa',
        description: 'Dentro de una transacción local se cambia la referencia de versión activa. Las lecturas ven la versión anterior o la nueva completa, sin mezclar precios de cargas parciales.',
        confirmed: 'La versión 42 está activa y se conserva la evidencia de la activación.',
        pending: 'Las cestas existentes deben seguir la política explícita de fijación o recálculo.',
        route: 'Candidata validada → versión activa · cambio atómico',
        code: 'BEGIN;\n  setActivePricingVersion(42); recordActivation();\nCOMMIT;',
        nodes: [{ state: 'done', status: 'Versión identificada' }, { state: 'done', status: 'Distribución registrada' }, { state: 'done', status: 'Candidata validada' }, { state: 'active', status: 'Versión 42 activa' }],
      },
      {
        title: 'Cada operación conserva su versión aplicada',
        description: 'Las nuevas cotizaciones usan la versión 42. Una cesta anterior no cambia silenciosamente: se conserva o recalcula según la política acordada, y cualquier nuevo importe requiere la confirmación correspondiente antes del cobro.',
        confirmed: 'La venta conserva versión, precios y reglas efectivamente aplicadas para auditoría.',
        pending: 'Los límites de antigüedad y la política de recálculo requieren aprobación del negocio.',
        code: 'newQuote.pricingVersion = 42\nsale.appliedPricingVersion = confirmedQuote.version',
        nodes: [{ state: 'done', status: 'Autoridad definida' }, { state: 'done', status: 'Versión trazable' }, { state: 'done', status: 'Evidencia conservada' }, { state: 'done', status: 'Nuevas consultas en 42' }],
      },
    ],
  },
};

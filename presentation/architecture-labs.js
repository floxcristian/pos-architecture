/* Deterministic teaching data. No connections, timers, workers or SDKs are executed. */
(() => {
  'use strict';
  const step = (title, detail, active, status, codeLines) => ({ title, detail, active, status, codeLines });
  window.POS_ARCH_LABS = {
    bullmq: {
      title: 'BullMQ · trabajos recuperables en país',
      question: '¿Quién programa una conciliación y qué ocurre cuando falla?',
      intro: 'Opción para ejecutar trabajos centrales; no es requisito de la caja. Este ejemplo usa BullMQ con Redis. PostgreSQL conserva solicitudes, resultados y evidencia para recuperar el trabajo.',
      nodes: [
        { id: 'operator', label: 'Operación', detail: 'Solicita una conciliación o autoriza recuperar un fallo; conserva identidad y auditoría.' },
        { id: 'postgres', label: 'PostgreSQL país', detail: 'Solicitud, outbox y resultado de negocio durables; permite reconstruir trabajo perdido en la cola.' },
        { id: 'scheduler', label: 'Scheduler', detail: 'Programa trabajos con zona horaria explícita. No garantiza una ejecución puntual bajo carga.' },
        { id: 'redis', label: 'BullMQ / Redis', detail: 'Guarda jobs y su estado operativo. Redis requiere persistencia, capacidad y noeviction.' },
        { id: 'worker', label: 'Worker país', detail: 'Reclama trabajo, ejecuta una operación idempotente y comunica éxito o Error.' },
        { id: 'result', label: 'Resultado', detail: 'Conciliación y evidencia persistidas; completar un job no equivale a contabilización ERP.' }
      ],
      scenarios: [
        { id: 'scheduled', label: 'Carga programada', summary: 'Una conciliación diaria entra en la cola y termina con evidencia durable.', steps: [
          step('Calendario explícito', 'Se registra un Job Scheduler a las 03:00 de America/Santiago. Es una hora de planificación; carga y disponibilidad pueden retrasar la ejecución.', ['scheduler'], 'ready', [4, 5, 6]),
          step('Trabajo disponible', 'BullMQ genera el job con su propia identidad. El scheduler produce el siguiente cuando comienza el anterior; no equivale a un cron infalible.', ['scheduler', 'redis'], 'waiting', [4, 6]),
          step('Worker reclama', 'Un worker procesa el job. Concurrencia 2 limita trabajo simultáneo en este proceso; no fija un orden global entre países o sucursales.', ['redis', 'worker'], 'running', [11, 13]),
          step('Conciliación idempotente', 'El helper identifica alcance y versión, consulta estado durable y evita repetir efectos ya confirmados. Las llamadas remotas no mantienen una transacción SQL abierta.', ['worker', 'postgres'], 'running', [12]),
          step('Resultado persistido', 'PostgreSQL conserva la evidencia antes de que el processor termine. El scheduler no se convierte en propietario de los precios.', ['postgres', 'result'], 'success', [12]),
          step('Job completado', 'BullMQ registra completed. Una pérdida de lock podría haber causado otra ejecución: la idempotencia del efecto permanece en la aplicación.', ['redis', 'result'], 'success', [11, 12, 13])
        ] },
        { id: 'manual', label: 'Solicitud manual', summary: 'El operador crea una solicitud durable que un relay transforma en job.', steps: [
          step('Solicitud autorizada', 'Operación solicita reconciliar precios. La aplicación confirma solicitud, auditoría y outbox juntas en PostgreSQL; todavía no depende de Redis.', ['operator', 'postgres'], 'ready', [7]),
          step('Relay lee el pendiente', 'El relay obtiene la solicitud ya confirmada y usa su UUID estable. Un timeout de Redis no borra esa solicitud.', ['postgres', 'worker'], 'running', [8]),
          step('Mismo ID de job', 'Queue.add usa request.id como jobId, sin dos puntos. Mientras ese job exista en la misma cola, otro add con el mismo ID no crea otro job.', ['worker', 'redis'], 'waiting', [9, 10]),
          step('Redis vuelve a estar disponible', 'Si falló el enqueue, el relay reintenta la misma solicitud con límites. El pendiente durable permite reconstruir la cola tras recuperación.', ['postgres', 'redis'], 'running', [8, 9, 10]),
          step('Se comprueba el efecto', 'El worker consulta la solicitud y la versión procesada. Duplicar una ejecución no debe duplicar publicaciones o efectos de negocio.', ['worker', 'postgres'], 'running', [11, 12]),
          step('Retención con límites', 'removeOnComplete conserva el job durante un período, no para siempre. Al eliminarlo termina la protección de jobId; la evidencia PostgreSQL sigue gobernando.', ['postgres', 'redis', 'result'], 'success', [10, 12])
        ] },
        { id: 'retry', label: 'Fallo y recuperación', summary: 'Un fallo transitorio reintenta; al agotar intentos queda pendiente de resolución.', steps: [
          step('Primer intento', 'El worker inicia una conciliación idempotente. Este ejemplo no reintenta cobros ni efectos remotos de resultado incierto.', ['redis', 'worker'], 'running', [3, 11, 12]),
          step('Error transitorio', 'El processor lanza un Error por indisponibilidad temporal. Se conserva evidencia y no se publica una versión parcial.', ['worker', 'postgres'], 'warning', [12]),
          step('Espera creciente', 'Backoff exponential con jitter separa los reintentos. attempts: 3 significa tres intentos totales, incluido el inicial.', ['redis'], 'waiting', [3]),
          step('Intentos agotados', 'Tras el tercer fallo el job queda failed. El trabajo no se considera completado ni se elimina el problema mediante requeue infinito.', ['redis', 'operator'], 'error', [3, 15]),
          step('Recuperación autorizada', 'Operación corrige la causa y autoriza retry del mismo job failed con auditoría. Ese retry no reinicia attemptsMade ni concede otros tres intentos automáticos. Si falta el job, se reconstruye desde la solicitud durable.', ['operator', 'postgres', 'redis'], 'running', [16, 17]),
          step('Efecto conciliado', 'La repetición verifica lo ya aplicado y persiste el resultado faltante. Un reinicio del worker puede repetir procesamiento, pero no autoriza otro efecto financiero.', ['worker', 'postgres', 'result'], 'success', [12, 17])
        ] }
      ],
      code: {
        language: 'typescript', label: 'Fragmentos BullMQ: scheduler, relay, worker y recuperación',
        source: [
          "import { Queue, Worker } from 'bullmq';",
          "const queue = new Queue('price-reconcile', { connection: redis });",
          "const retry = { attempts: 3, backoff: { type: 'exponential', delay: 1000, jitter: 0.5 } };",
          "await queue.upsertJobScheduler('prices-nightly',",
          "  { pattern: '0 0 3 * * *', tz: 'America/Santiago' },",
          "  { name: 'reconcile', data: { country: 'CL' }, opts: retry });",
          '// Relay: solicitud y outbox ya confirmadas en PostgreSQL.',
          'const request = await nextCommittedRequest();',
          "await queue.add('reconcile', { country: 'CL', requestId: request.id },",
          '  { ...retry, jobId: request.id, removeOnComplete: { age: 86400 } });',
          "const worker = new Worker('price-reconcile', async job => {",
          '  await reconcileIdempotently(job.data, job.id);',
          '}, { connection: workerRedis, concurrency: 2 });',
          "worker.on('error', reportWorkerError);",
          "worker.on('failed', reportJobFailure);",
          '// Otro punto de entrada: recuperación manual autorizada.',
          "await failedJob.retry('failed');"
        ].join('\n'),
        note: 'Fragmentos de procesos separados, no una aplicación ejecutable. Los helpers implementan solicitud/outbox, identidad, idempotencia, auditoría y recuperación PostgreSQL. redis/workerRedis requieren configuración de producción; noeviction y persistencia no prueban RPO cero. Redis es el backend predeterminado; BullMQ también documenta un backend PostgreSQL opcional, sin garantizar que Queue.add comparta la transacción de venta.'
      },
      sources: [
        { label: 'BullMQ · Job Schedulers', url: 'https://docs.bullmq.io/guide/job-schedulers/' },
        { label: 'BullMQ · Reintentos', url: 'https://docs.bullmq.io/guide/retrying-failing-jobs' },
        { label: 'BullMQ · Job IDs y retención', url: 'https://docs.bullmq.io/guide/jobs/job-ids' },
        { label: 'BullMQ · Producción', url: 'https://docs.bullmq.io/guide/going-to-production' },
        { label: 'BullMQ · PostgreSQL opcional', url: 'https://docs.bullmq.io/guide/postgresql' }
      ]
    },
    rabbitmq: {
      title: 'RabbitMQ · reparto y custodia de eventos',
      question: '¿Qué confirma el broker y qué debe confirmar cada consumidor?',
      intro: 'Broker central opcional para enrutamiento y consumidores independientes. Un exchange topic distribuye copias a colas durables por consumidor; no reemplaza la outbox, la inbox ni el protocolo HTTPS de sucursal.',
      nodes: [
        { id: 'outbox', label: 'Outbox país', detail: 'Evento confirmado en PostgreSQL. El relay conserva identidad y estado de custodia.' },
        { id: 'exchange', label: 'Exchange topic', detail: 'Enruta sale.* hacia las colas vinculadas; el exchange no almacena una copia independiente del mensaje.' },
        { id: 'erp', label: 'Cola ERP', detail: 'Cola durable independiente. Sus workers compiten por mensajes; no reciben todos una copia.' },
        { id: 'reporting', label: 'Cola reporting', detail: 'Otra cola recibe su propia copia y avanza a su ritmo sin acreditar el estado ERP.' },
        { id: 'postgres', label: 'Commit consumidor', detail: 'Inbox, efecto local y outbox se confirman juntos antes del consumer ACK.' },
        { id: 'dlq', label: 'Cuarentena / DLQ', detail: 'Retiene errores para resolver con evidencia y replay controlado; necesita políticas y custodia verificadas.' }
      ],
      scenarios: [
        { id: 'routing', label: 'Dos consumidores', summary: 'Un evento alimenta ERP y reporting mediante colas independientes.', steps: [
          step('Evento ya confirmado', 'El relay toma un evento de la outbox de país. La venta de sucursal y su ACK de país no dependen de que el broker esté disponible.', ['outbox'], 'ready', [9]),
          step('Rutas declaradas', 'Un exchange topic durable y dos colas quorum durables se vinculan con sale.*. El fan-out resulta de ambas suscripciones; no de varios workers sobre una sola cola.', ['exchange', 'erp', 'reporting'], 'running', [2, 3, 4, 5]),
          step('Publicación comprobable', 'El mensaje persistente lleva messageId y mandatory. Si no existe ruta, basic.return debe detectarse aunque después llegue un publisher confirm positivo.', ['outbox', 'exchange'], 'running', [7, 8, 9, 10, 11]),
          step('Custodia del broker', 'El confirm permite registrar custodia en el tramo configurado. No indica que ERP o reporting hayan aplicado el evento.', ['exchange', 'erp', 'reporting'], 'waiting', [10, 12]),
          step('Cada receptor confirma su efecto', 'El consumidor ERP confirma inbox, efecto/proyección local y outbox. La llamada externa al ERP tiene otra ejecución y resultado; no queda dentro de este commit.', ['erp', 'postgres'], 'running', [15, 17]),
          step('ACK después del commit', 'Solo después del commit se acusa el mensaje. Reporting sigue su propio ciclo. Un consumer ACK no afirma contabilización ni conciliación global.', ['erp', 'reporting', 'postgres'], 'success', [17, 18])
        ] },
        { id: 'redelivery', label: 'Entrega repetida', summary: 'Una caída tras el commit y antes del ACK provoca redelivery seguro.', steps: [
          step('Entrega al consumidor', 'La cola ERP entrega un mensaje sin auto-ACK. Prefetch limita mensajes en vuelo por consumidor; no asegura orden global.', ['erp'], 'running', [14, 15, 20]),
          step('Efecto local confirmado', 'PostgreSQL registra eventId, contenido y resultado junto con el efecto. La deduplicación es propia del consumidor y su contrato.', ['erp', 'postgres'], 'success', [17]),
          step('Caída antes del ACK', 'El proceso o canal cae antes de sub.ack. El broker no conoce el commit SQL y conserva una entrega sin confirmar.', ['erp', 'postgres'], 'warning', [17, 18]),
          step('Redelivery del mismo evento', 'Al recuperar el consumidor, RabbitMQ vuelve a entregar. La identidad de aplicación sigue siendo eventId/messageId; no se usa la bandera redelivered como única deduplicación.', ['erp'], 'running', [15, 17]),
          step('La inbox reconoce el efecto', 'El helper verifica misma identidad y contenido. Devuelve el resultado durable sin repetir la mutación; mismo ID con otro contenido es un conflicto.', ['postgres'], 'success', [17]),
          step('Acuse seguro', 'Ahora se envía consumer ACK. La misma protección se necesita si el relay republica después de perder un publisher confirm.', ['erp', 'postgres'], 'success', [18])
        ] },
        { id: 'dead-letter', label: 'Límite y cuarentena', summary: 'Un mensaje inválido no reintenta indefinidamente ni desaparece sin evidencia.', steps: [
          step('Mensaje rechazado por contrato', 'El consumidor detecta un esquema incompatible. Es un error funcional; repetir inmediatamente no lo corrige.', ['erp', 'postgres'], 'warning', [17, 19]),
          step('Clasificar antes de reintentar', 'handleConsumerFailure distingue fallo temporal, rechazo funcional y efecto externo incierto. Solo el temporal usa reintentos acotados.', ['erp'], 'warning', [19]),
          step('Se alcanza el límite', 'La política configurada detiene el ciclo. Un nack con requeue perpetuo trasladaría carga sin resolver la causa.', ['erp', 'dlq'], 'error', [19]),
          step('Cuarentena con custodia', 'La DLQ requiere exchange, bindings y política válidos. La transferencia segura debe configurarse y probarse; el dead-lettering por defecto no promete ausencia de pérdida.', ['dlq'], 'waiting', [19]),
          step('Operación resuelve la causa', 'Se conserva mensaje, error, responsable e identidad. Si la transferencia a cuarentena no está confirmada, el helper no declara resuelto ni envía un ACK de éxito.', ['dlq', 'outbox'], 'warning', [19]),
          step('Replay controlado', 'Tras corregir la causa se reentrega con la identidad original y se deduplica el efecto. Corregir el contenido exige una nueva operación vinculada, no reutilizar el ID alterado.', ['dlq', 'erp', 'postgres'], 'success', [17, 18, 19])
        ] }
      ],
      code: {
        language: 'typescript', label: 'Fragmentos amqplib: topic, confirm y ACK tras commit',
        source: [
          'const pub = await connection.createConfirmChannel();',
          "await pub.assertExchange('pos-events', 'topic', { durable: true });",
          "for (const q of ['erp', 'reporting']) {",
          "  await pub.assertQueue(q, { durable: true, arguments: { 'x-queue-type': 'quorum' } });",
          "  await pub.bindQueue(q, 'pos-events', 'sale.*');",
          '}',
          'const returned = new Set();',
          "pub.on('return', m => returned.add(m.properties.messageId));",
          "pub.publish('pos-events', 'sale.confirmed', body, { messageId: event.id, persistent: true, mandatory: true });",
          'await pub.waitForConfirms();',
          "if (returned.has(event.id)) throw new Error('Mensaje sin ruta');",
          'await markBrokerCustody(event.id);',
          'const sub = await connection.createChannel();',
          'await sub.prefetch(8);',
          "await sub.consume('erp', msg => {",
          '  if (!msg) return;',
          '  applyInboxEffectOutbox(msg)',
          '    .then(() => sub.ack(msg))',
          '    .catch(error => handleConsumerFailure(sub, msg, error));',
          '}, { noAck: false });'
        ].join('\n'),
        note: 'Fragmentos didácticos de publicador y consumidor, con un envío en vuelo; no app ejecutable. body es Buffer; conexión, canales y supervisión deben manejar errores y reconexión. publish devuelve backpressure, no un confirm. applyInboxEffectOutbox resuelve después del commit idempotente. handleConsumerFailure conserva evidencia, limita reintentos y verifica custodia de cuarentena antes de resolver. DLX, retención y transferencia segura requieren políticas aparte; este fragmento no las configura.'
      },
      sources: [
        { label: 'RabbitMQ · Publisher confirms y consumer ACK', url: 'https://www.rabbitmq.com/docs/confirms' },
        { label: 'RabbitMQ · Fiabilidad', url: 'https://www.rabbitmq.com/docs/reliability' },
        { label: 'RabbitMQ · Dead Letter Exchanges', url: 'https://www.rabbitmq.com/docs/dlx' },
        { label: 'amqplib · API oficial del cliente', url: 'https://amqp-node.github.io/amqplib/channel_api.html' }
      ]
    },
    delivery: {
      title: 'Entrega HTTPS · repetir sin duplicar el efecto',
      question: '¿Qué ocurre si país confirma la venta pero el ACK se pierde?',
      intro: 'Canal base recomendado: outbox PostgreSQL de sucursal → lote HTTPS autenticado → inbox, efecto local y outbox de país. La entrega puede repetirse; la aplicación conserva identidad y resultado durable.',
      nodes: [
        { id: 'branch', label: 'Outbox sucursal', detail: 'Comparte el commit de venta. Retiene pendientes y evidencia de recuperación.' },
        { id: 'sender', label: 'Sincronizador', detail: 'Reclama lotes acotados y reutiliza eventId, contrato y secuencia en cada intento.' },
        { id: 'wan', label: 'HTTPS / WAN', detail: 'Transporta eventos y acuses; no aporta por sí solo durabilidad ni idempotencia.' },
        { id: 'api', label: 'API país', detail: 'Autentica origen y valida contrato antes de aplicar el efecto local requerido.' },
        { id: 'country', label: 'PostgreSQL país', detail: 'Un commit de inbox, efecto y outbox; unicidad y contenido verificados.' },
        { id: 'ack', label: 'ACK aplicación', detail: 'Acredita ese commit de país. No acredita aceptación ERP, fiscalidad o liquidación del pago.' }
      ],
      scenarios: [
        { id: 'normal', label: 'Entrega confirmada', summary: 'País confirma el efecto antes de enviar un acuse por evento.', steps: [
          step('Pendiente durable', 'La venta ya está confirmada en sucursal junto con su outbox. El worker reclama trabajo mediante un mecanismo recuperable.', ['branch', 'sender'], 'ready', [1]),
          step('Lote autenticado', 'Se envía eventId estable, origen, versión de contrato y secuencia. El envío ocurre fuera de la transacción que reclamó las filas.', ['sender', 'wan', 'api'], 'running', [2]),
          step('Inbox y contenido', 'País verifica identidad y contrato. Dentro de SQL bloquea o inserta la inbox única y compara el contenido para ese consumidor y origen.', ['api', 'country'], 'running', [5, 6, 7, 8, 9]),
          step('Efecto y outbox juntos', 'La misma transacción aplica la proyección requerida, registra nueva outbox y marca la inbox aplicada. Guardar solamente recepción sería insuficiente.', ['country'], 'running', [10, 11, 12, 13]),
          step('ACK después del commit', 'La transacción termina y solo entonces se construye el acuse de aplicación. Los trabajos ERP posteriores permanecen independientes.', ['country', 'api', 'ack'], 'success', [13, 14, 15]),
          step('Avance local verificable', 'Sucursal valida que el acuse corresponde al evento y guarda acuse/checkpoint. Retiene evidencia durante el horizonte de replay y restauración.', ['ack', 'sender', 'branch'], 'success', [3, 4])
        ] },
        { id: 'lost-ack', label: 'ACK perdido', summary: 'El reenvío mantiene eventId y recupera el resultado ya aplicado.', steps: [
          step('Commit de país', 'Inbox, proyección y outbox quedan confirmadas. El efecto local ya existe, aunque sucursal todavía no lo sepa.', ['api', 'country'], 'success', [6, 10, 11, 12, 13]),
          step('Se pierde la respuesta', 'El ACK no llega por WAN. Timeout significa resultado de entrega desconocido; no demuestra que país haya rechazado el evento.', ['ack', 'wan'], 'warning', [2, 14, 16]),
          step('Pendiente conservado', 'Sucursal mantiene la outbox y programa otro envío con backoff y límite. No inventa una nueva venta ni un nuevo eventId.', ['branch', 'sender'], 'waiting', [1, 2, 16]),
          step('Misma identidad y contenido', 'La API vuelve a recibir el evento. La clave de inbox identifica origen, consumidor y eventId; el contenido debe coincidir.', ['api', 'country'], 'running', [7, 8]),
          step('Resultado durable reutilizado', 'La inbox ya aplicada devuelve su resultado. No se vuelve a incrementar la proyección ni se crea otra outbox para el mismo efecto.', ['country'], 'success', [9]),
          step('Acuse finalmente recibido', 'El nuevo ACK permite avanzar en sucursal. La entrega ocurrió más de una vez; el efecto local quedó protegido por la transacción y deduplicación.', ['ack', 'sender', 'branch'], 'success', [3, 4, 14])
        ] },
        { id: 'conflict', label: 'Conflicto o hueco', summary: 'Un evento incompatible queda pendiente de resolución sin bloquear a todas las tiendas.', steps: [
          step('Lote con identidad estable', 'El receptor recibe eventos y valida versión, origen y secuencia por agregado. No supone orden global por reloj.', ['sender', 'api'], 'ready', [2, 5]),
          step('ID repetido con otro contenido', 'assertSameContent detecta una identidad reutilizada con payload distinto. No lo presenta como un duplicado exitoso.', ['api', 'country'], 'error', [7, 8]),
          step('Sin efecto parcial', 'La transacción revierte; no emite ACK de aplicación para ese evento. Si falta un antecedente requerido, tampoco se aplica fuera de orden.', ['country'], 'warning', [6, 8, 10, 13]),
          step('Respuesta por evento', 'El contrato devuelve rechazo o pendiente específico; otros eventos independientes pueden avanzar. No se adelanta un checkpoint sobre un hueco requerido.', ['api', 'ack'], 'warning', [3, 4, 5]),
          step('Recuperación con evidencia', 'Operación solicita replay del faltante o resuelve el conflicto. Una corrección de contenido tiene otra identidad vinculada y deja auditoría.', ['branch', 'sender', 'api'], 'waiting', [1, 2, 16]),
          step('Aplicación y retención', 'Una vez resuelto el contrato, el evento válido sigue la misma transacción. Restore y replay se concilian antes de declarar que ambos lados convergieron.', ['country', 'ack', 'branch'], 'success', [10, 11, 12, 13, 14])
        ] }
      ],
      code: {
        language: 'typescript', label: 'Contrato del emisor y del receptor; ACK posterior al commit',
        source: [
          'const e = await claimCommittedOutbox();',
          'const ack = await sendBatchHTTPS([e]);',
          'assertApplicationAckMatches(ack, e);',
          'await persistAckAndCheckpoint(e, ack);',
          '// Receptor: origen, contrato y orden ya validados.',
          'const result = await countryDb.transaction(async tx => {',
          '  const inbox = await tx.insertOrLockInbox(event);',
          '  assertSameContent(inbox, event);',
          '  if (inbox.applied) return inbox.applicationResult;',
          '  const effect = await applyLocalProjection(tx, event);',
          '  await tx.appendOutbox(event, effect);',
          '  return tx.markAppliedInbox(event, effect);',
          '});',
          'return applicationAck(result);',
          '// ACK tras commit; no declara éxito ERP.',
          '// Timeout: reenviar la misma identidad, conservando evidencia.'
        ].join('\n'),
        note: 'Pseudocódigo contractual de dos procesos. transaction usa una conexión SQL y resuelve tras COMMIT; cualquier error revierte. insertOrLockInbox incluye restricción única por origen/consumidor/evento y control concurrente. applyLocalProjection revalida orden y versión dentro de SQL. Los helpers cubren autenticación, contenido, acuses parciales, leases, backoff y retención. No se muestra una librería HTTP ni se afirma exactamente una vez para efectos externos.'
      },
      sources: [
        { label: 'Propuesta · sincronización y consistencia', url: '../docs/propuesta-arquitectura.md#sincronización-y-consistencia' },
        { label: 'Guía C4 · contratos de país y sucursal', url: '../docs/c4-arquitectura-propuesta.md' },
        { label: 'PostgreSQL · transacciones', url: 'https://www.postgresql.org/docs/current/tutorial-transactions.html' },
        { label: 'node-postgres · una conexión por transacción', url: 'https://node-postgres.com/features/transactions' }
      ]
    },
    prices: {
      title: 'Precios · eventos y cargas completas',
      question: '¿Cómo cambia el catálogo sin alterar una venta abierta?',
      intro: 'Una fuente autorizada publica versiones. Los deltas y los snapshots construyen candidatas aisladas y atraviesan el mismo validador. La sucursal consulta un espejo PostgreSQL; no necesita una base de ventas por terminal.',
      nodes: [
        { id: 'source', label: 'Publicación país', detail: 'Manifiesto, cobertura, versión y watermark consistente; dueño por dato y país por confirmar.' },
        { id: 'receiver', label: 'Sincronizador', detail: 'Recibe por HTTPS y conserva inbox recibida, staging y cursor de recepción.' },
        { id: 'candidate', label: 'Candidata aislada', detail: 'Combina snapshot o base conocida con deltas, incluyendo bajas explícitas.' },
        { id: 'validator', label: 'Validación', detail: 'Comprueba integridad, cobertura, referencias, orden, compatibilidad y vigencia antes de publicar.' },
        { id: 'active', label: 'Versión activa', detail: 'Puntero, inbox aplicada y cursor aplicado avanzan en un commit SQL corto.' },
        { id: 'sale', label: 'Cotización / venta', detail: 'Fija una versión; conserva origen y reglas y revalida capacidad al confirmar.' }
      ],
      scenarios: [
        { id: 'delta', label: 'Cambio por eventos', summary: 'La versión v12 sigue en servicio mientras los deltas preparan v13.', steps: [
          step('Versión base conocida', 'La venta A fija v12. País publica cambios autorizados con identidad y secuencia; v12 todavía atiende nuevas lecturas.', ['source', 'active', 'sale'], 'ready', [1, 14]),
          step('Recepción durable', 'El worker guarda deltas e inbox recibida. Altas, cambios y bajas llevan identidad; recibir no avanza el cursor aplicado.', ['source', 'receiver'], 'running', [3]),
          step('Candidata v13', 'Los deltas se aplican sobre una copia aislada basada en v12, con tombstones para bajas. No se parchea el catálogo activo.', ['receiver', 'candidate'], 'running', [2, 4, 17]),
          step('Publicación validada', 'Se revisa el conjunto completo y se inmoviliza la candidata. Ningún camino salta desde deduplicación directamente a activación.', ['candidate', 'validator'], 'running', [5]),
          step('Swap atómico', 'Un commit corto revalida base/checkpoint y activa v13 junto con inbox aplicada y cursor. Las validaciones pesadas ya terminaron.', ['validator', 'active'], 'success', [6, 7, 8, 9, 10, 11, 12, 13]),
          step('Dos ventas, versiones explícitas', 'Una nueva venta B fija v13. A conserva v12 y sus reglas; al confirmar debe seguir cumpliendo vigencia y política. Se retiene toda versión referenciada.', ['active', 'sale'], 'success', [14, 15, 16])
        ] },
        { id: 'snapshot', label: 'Carga programada o manual', summary: 'Un snapshot con corte H se completa con deltas antes de activar.', steps: [
          step('Manifiesto y corte H', 'La carga obtiene cobertura, versión, checksum y watermark del origen. H identifica un corte consistente, no la hora arbitraria del equipo.', ['source', 'receiver'], 'ready', [1]),
          step('Descarga recuperable', 'Chunks y progreso recibido se guardan en staging aislado. La versión activa sigue atendiendo; no se mantiene una transacción SQL durante la descarga.', ['receiver', 'candidate', 'active'], 'running', [2, 3]),
          step('Deltas posteriores a H', 'El worker recupera y ordena los cambios posteriores al corte, incluidas bajas. El origen debe retenerlos durante la ventana de recuperación.', ['source', 'candidate'], 'running', [4, 17]),
          step('Completitud comprobada', 'Cantidad, checksum, cobertura, referencias y compatibilidad deben concordar. Programación y recuperación manual usan este mismo control.', ['candidate', 'validator'], 'running', [5]),
          step('Sin retroceder el puntero', 'Antes del swap se revalida que base y checkpoint sigan correspondiendo. Un snapshot atrasado no sustituye silenciosamente una publicación más nueva.', ['validator', 'active'], 'success', [7, 8, 9, 10, 11, 12]),
          step('Activación y reconciliación', 'Tras el commit, nuevas ventas usan la versión activa; se conserva evidencia de autor, origen y resultado. El cursor recibido sigue siendo distinto del aplicado.', ['active', 'sale'], 'success', [13, 14, 15, 16])
        ] },
        { id: 'invalid', label: 'Hueco o versión vencida', summary: 'Una descarga parcial no renueva la autorización para seguir vendiendo.', steps: [
          step('Cambio incompleto', 'Llega un delta adelantado o falta un chunk. El worker registra lo recibido sin declarar una versión completa.', ['receiver', 'candidate'], 'warning', [3, 4]),
          step('Publicación bloqueada', 'El validador detecta el hueco, cobertura ausente o incompatibilidad. La candidata no llega al swap ni avanza el cursor aplicado.', ['validator'], 'error', [5]),
          step('Recuperación controlada', 'Se solicita replay o snapshot y se conserva staging verificable. Tombstones y evidencia permiten evitar que una restauración resucite una baja.', ['source', 'receiver', 'candidate'], 'waiting', [1, 3, 4]),
          step('Versión anterior limitada', 'La versión previa solo puede servir mientras cumpla la política autorizada. TTL de frescura y vigencia comercial son comprobaciones diferentes.', ['active', 'sale'], 'warning', [15, 16]),
          step('Redescargar no reinicia plazos', 'Recibir la misma versión no prolonga TTL ni promociones. Sin datos válidos se bloquea la operación afectada, aunque exista un archivo local.', ['receiver', 'sale'], 'error', [15, 16]),
          step('Nueva candidata válida', 'Después de resolver el hueco se valida otra candidata completa y se activa por el mismo commit. No se acepta una excepción manual que omita integridad.', ['candidate', 'validator', 'active'], 'success', [5, 6, 7, 8, 9, 10, 11, 12, 13])
        ] }
      ],
      code: {
        language: 'typescript', label: 'Contrato común de snapshot y deltas',
        source: [
          'const manifest = await readAuthorizedManifest();',
          'const candidate = await createIsolatedCandidate(manifest);',
          'await receiveIntoStaging(candidate);',
          'await replayAfterWatermark(candidate, manifest.watermark);',
          'await validateCompleteCandidate(candidate);',
          'await branchDb.transaction(async tx => {',
          '  const current = await tx.lockPublicationScope(candidate.scope);',
          '  assertBaseAndCheckpoint(current, candidate);',
          '  assertNoRegression(current, candidate);',
          '  await tx.markInboxApplied(candidate.eventIds);',
          '  await tx.activateVersion(candidate.id);',
          '  await tx.advanceAppliedCursor(candidate.cursor);',
          '});',
          'const version = await pinActiveVersionForQuote();',
          'assertFreshnessTTL(version, now);',
          'assertCommercialValidity(version, now);',
          '// Deltas, bajas y snapshot producen una candidata inmutable.'
        ].join('\n'),
        note: 'Pseudocódigo de contrato; helpers no implementados aquí. createIsolatedCandidate elige base publicada o snapshot. receiveIntoStaging persiste recepción recuperable, nunca publicación. validateCompleteCandidate verifica integridad y deja la candidata inmutable; transaction usa una conexión y confirma inbox aplicada, puntero y cursor juntos. El contrato define secuencia, bajas, vigencia, TTL, retención y recuperación. Consultar precios no concede al POS autoridad de inventario.'
      },
      sources: [
        { label: 'Guía C4 · sincronización y activación', url: '../docs/c4-arquitectura-propuesta.md#c3-de-sincronización-entrega-y-activación-de-precios' },
        { label: 'Operación · precios y cargas', url: '../docs/operacion-caja-y-evolucion.md' },
        { label: 'Excalidraw · dinámica de precios', url: '../docs/diagramas-excalidraw/06-flujo-precios.svg' },
        { label: 'PostgreSQL · transacciones', url: 'https://www.postgresql.org/docs/current/tutorial-transactions.html' }
      ]
    },
    sale: {
      title: 'Venta local · confirmar con evidencia',
      question: '¿Qué se puede confirmar sin WAN y qué bloquea otro intento de pago?',
      intro: 'El backend de sucursal es la autoridad de la venta. El perfil inicial conserva LAN, servidor y PostgreSQL compartidos. Pago, venta, fiscalidad y entrega a país tienen estados distintos.',
      nodes: [
        { id: 'client', label: 'Cliente de caja', detail: 'Angular + Tauri presenta comandos y resultados; no escribe SQL ni confirma por su cuenta.' },
        { id: 'backend', label: 'Backend sucursal', detail: 'Valida operador, puesto, turno, importes, versión y capacidades antes de operar.' },
        { id: 'postgres', label: 'PostgreSQL sucursal', detail: 'Intención y evidencia; después venta, caja, auditoría y outbox en una transacción.' },
        { id: 'payment', label: 'Medio de pago', detail: 'Efectivo o proveedor con capacidad homologada. Un resultado incierto conserva su identidad.' },
        { id: 'outbox', label: 'Pendiente durable', detail: 'Evento de venta confirmado con el negocio; espera entrega cuando país esté disponible.' },
        { id: 'country', label: 'País / WAN', detail: 'Recibe posteriormente. Su indisponibilidad no borra una venta local permitida y confirmada.' }
      ],
      scenarios: [
        { id: 'commit', label: 'Confirmación local', summary: 'La respuesta de éxito ocurre después del commit de negocio y outbox.', steps: [
          step('Comando e intención', 'Backend autentica y autoriza el comando con identidad estable. Persiste intención antes de cualquier efecto de pago externo.', ['client', 'backend', 'postgres'], 'ready', [1]),
          step('Resultado del pago', 'Se ejecuta solo la capacidad permitida y se conserva su evidencia. Una llamada remota o SDK ocurre sin una transacción SQL abierta.', ['backend', 'payment', 'postgres'], 'running', [2, 3]),
          step('Resultado suficiente', 'El backend distingue aprobado, rechazado y desconocido. Solo un estado compatible con la política permite continuar.', ['backend', 'payment'], 'running', [4, 5, 6, 7, 8]),
          step('Un commit de negocio', 'Se revalidan invariantes y se guardan venta, líneas, referencias, caja, registros fiscales necesarios, auditoría y outbox juntos.', ['backend', 'postgres', 'outbox'], 'running', [9, 10, 11, 12, 13, 14, 15, 16]),
          step('Confirmación al operador', 'La transacción terminó antes de confirmar. Se entrega solo el documento permitido; una reimpresión conserva la misma venta y pago.', ['backend', 'client'], 'success', [16, 17]),
          step('Integración posterior', 'El sincronizador entrega la outbox de forma independiente. ACK de país, aceptación fiscal, contabilización y liquidación tienen su propia evidencia.', ['outbox', 'country'], 'waiting', [14, 18])
        ] },
        { id: 'offline', label: 'WAN caída', summary: 'Ejemplo con efectivo y modalidad fiscal habilitada; LAN y servidor siguen disponibles.', steps: [
          step('País no responde', 'La WAN está caída, pero cliente, LAN, backend y PostgreSQL de sucursal están operativos. No se instala otra base en la terminal.', ['country', 'client', 'backend'], 'warning', [1]),
          step('Capacidad local vigente', 'Se validan autorización offline, turno, versión de precios, TTL, vigencia, reloj, espacio y recursos fiscales. Disponer de disco no basta.', ['backend', 'postgres'], 'running', [1, 10]),
          step('Medio permitido', 'El ejemplo utiliza efectivo y una modalidad fiscal previamente habilitada. Una tarjeta o emisión que necesite conexión no se autoriza por el mero modo offline.', ['backend', 'payment'], 'running', [2, 3, 8]),
          step('Venta y pendiente confirmados', 'La transacción local guarda negocio, auditoría y outbox. Las llamadas a país no forman parte de ese commit.', ['postgres', 'outbox'], 'success', [9, 10, 11, 12, 13, 14, 15, 16]),
          step('Estado visible', 'El operador ve venta confirmada y entrega pendiente. Si cae LAN/backend o vence una capacidad requerida, se detienen los comandos dependientes.', ['client', 'outbox'], 'waiting', [17, 18]),
          step('WAN recuperada', 'El worker reenvía con identidades originales y límites. El atraso se concilia; no se vuelve a cobrar ni a emitir una nueva venta al sincronizar.', ['outbox', 'country'], 'success', [14, 18])
        ] },
        { id: 'unknown-payment', label: 'Pago incierto', summary: 'Timeout no es rechazo; se bloquea otro intento hasta resolver evidencia.', steps: [
          step('Intención durable', 'Se fija intento, importe, moneda y destino. Una repetición del comando recupera esa intención; no crea automáticamente otra.', ['backend', 'postgres'], 'ready', [1]),
          step('Proveedor sin respuesta', 'La solicitud pudo haber producido un cargo. El timeout conserva el resultado desconocido y la referencia original.', ['payment', 'backend'], 'warning', [2, 3]),
          step('Incertidumbre persistida', 'Se registra evidencia y necesidad de conciliación. No se convierte un fallo de comunicación en rechazo financiero.', ['postgres', 'backend'], 'warning', [3, 4, 5]),
          step('Otro cobro bloqueado', 'El backend rechaza un intento incompatible pendiente de resolver. Ni el cliente ni el cambio automático de proveedor pueden saltarse esa regla.', ['client', 'backend', 'payment'], 'error', [1, 6]),
          step('Consulta o intervención', 'Si el proveedor tiene consulta homologada se usa la referencia original; en otro caso hay resolución operativa trazable. No se fabrica un resultado conocido.', ['backend', 'payment', 'postgres'], 'waiting', [3, 5]),
          step('Continuar desde evidencia', 'Tras conocer el resultado se confirma la venta o se resuelve reversa/rechazo según política. Si hubo pago aprobado y falló el commit local, se recupera la intención; no se repite el cargo.', ['backend', 'postgres', 'outbox'], 'success', [8, 9, 10, 11, 12, 13, 14, 15, 16])
        ] }
      ],
      code: {
        language: 'typescript', label: 'Contrato de confirmación y separación del pago externo',
        source: [
          'const intent = await persistAuthorizedIntent(command);',
          'const result = await permittedPayment(intent);',
          'await persistPaymentEvidence(intent, result);',
          "if (result.state === 'unknown') {",
          '  await markNeedsReconciliation(intent);',
          "  throw new Error('Pago incierto: no iniciar otro intento');",
          '}',
          'assertPaymentAllowsConfirmation(result);',
          'const sale = await branchDb.transaction(async tx => {',
          '  await validateCommandAndLocks(tx, command);',
          '  await writeSaleAndLines(tx, intent, result);',
          '  await writeCashAndFiscalRecords(tx, intent);',
          '  await writeAudit(tx, intent);',
          '  await writeOutbox(tx, intent);',
          '  return tx.readSale(intent.saleId);',
          '});',
          'return confirmToOperator(sale);',
          '// Sin I/O externo dentro de SQL; entrega a país posterior.'
        ].join('\n'),
        note: 'Pseudocódigo de contrato, no app ni integración de pago ejecutable. persistAuthorizedIntent verifica identidad, capacidades y bloqueo de otro intento incierto. permittedPayment recupera un resultado existente y solo ejecuta capacidades autorizadas; nunca reintenta un cargo a ciegas. Los helpers SQL comparten conexión y COMMIT; referencias fiscales locales pueden ser simultáneas, llamadas fiscales externas no. El perfil WAN usa PostgreSQL de sucursal; SQLite por terminal sería otro perfil, pendiente de aprobación.'
      },
      sources: [
        { label: 'Propuesta · operación local y consistencia', url: '../docs/propuesta-arquitectura.md' },
        { label: 'Excalidraw · venta y entrega durable', url: '../docs/diagramas-excalidraw/07-flujo-venta.svg' },
        { label: 'Proveedores · capacidades y recuperación', url: '../docs/extensibilidad-proveedores-dispositivos.md' },
        { label: 'PostgreSQL · transacciones', url: 'https://www.postgresql.org/docs/current/tutorial-transactions.html' }
      ]
    }
  };
})();

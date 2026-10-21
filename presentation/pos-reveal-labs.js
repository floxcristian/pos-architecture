/* Declarative, synthetic teaching scenarios. Snippets are displayed, never executed.
 * Authority: docs/propuesta-arquitectura.md and docs/operacion-caja-y-evolucion.md.
 * Amounts, identifiers and counters illustrate the protocol, not production metrics.
 * API references checked: https://docs.bullmq.io/guide/retrying-failing-jobs
 * https://docs.bullmq.io/guide/jobs/job-ids · https://www.rabbitmq.com/docs/confirms
 * https://www.rabbitmq.com/docs/dlx
 */
window.POS_REVEAL_LABS = {
  'prices-events': {
    title: 'Precios por eventos: recibir no es activar',
    nodes: [
      { id: 'source', label: 'Publicador de país', detail: 'Aprueba versiones comerciales' },
      { id: 'inbox', label: 'Worker + inbox', detail: 'Recibe y comprueba identidad' },
      { id: 'candidate', label: 'Candidata aislada', detail: 'Reconstruye y valida el conjunto' },
      { id: 'active', label: 'Versión activa', detail: 'El motor de sucursal lee aquí' }
    ],
    scenarios: [
      {
        id: 'new', label: 'Cambio válido', steps: [
          {
            title: 'Una fuente aprueba el cambio',
            text: 'El publicador de país aprueba v42 para este ámbito. Manifiesto y evento de salida quedan juntos en su transacción.',
            active: ['source'], links: [],
            values: [{ label: 'Ámbito', value: 'CL · entidad A' }, { label: 'Base', value: 'v41' }, { label: 'Nueva', value: 'v42' }],
            log: 'publication.approved version=v42 base=v41 event=price-42'
          },
          {
            title: 'La sucursal recibe con identidad',
            text: 'Por HTTPS recibe ID, época, secuencia y hash. Guarda inbox recibida y progreso durable antes del acuse de recepción.',
            active: ['source', 'inbox'], links: [['source', 'inbox']],
            values: [{ label: 'Recibida', value: '42' }, { label: 'Aplicada', value: '41' }, { label: 'Activa', value: 'v41' }],
            log: 'inbox.received event=price-42 sequence=42 applied=41'
          },
          {
            title: 'Se construye fuera de la versión activa',
            text: 'El delta se aplica sobre una copia aislada de v41. No se modifican las filas que una venta está usando.',
            active: ['inbox', 'candidate'], links: [['inbox', 'candidate']],
            values: [{ label: 'Candidata', value: 'v42' }, { label: 'Activa', value: 'v41' }, { label: 'Precio actual', value: 'CLP 12.000' }],
            log: 'candidate.built base=v41 target=v42 active_unchanged=true'
          },
          {
            title: 'Validar el paquete completo',
            text: 'Comprobar origen, hash, cobertura, referencias, motor, moneda y vigencia. El incremental usa el mismo validador que una carga masiva.',
            active: ['candidate'], links: [],
            values: [{ label: 'Cobertura', value: 'Completa', tone: 'success' }, { label: 'Motor', value: 'Compatible', tone: 'success' }, { label: 'Vigencia', value: 'Autorizada', tone: 'success' }],
            log: 'candidate.validated version=v42 immutable=true'
          },
          {
            title: 'Activación atómica y corta',
            text: 'Revalidar precondiciones. Si la base sigue siendo v41, cambiar puntero, inbox aplicada y cursor en un único commit local.',
            active: ['candidate', 'active'], links: [['candidate', 'active']],
            values: [{ label: 'Activa', value: 'v42', tone: 'success' }, { label: 'Aplicada', value: '42' }, { label: 'Nuevo precio', value: 'CLP 11.400' }],
            log: 'pricing.activated from=v41 to=v42 checkpoint=42',
            code: 'BEGIN;\nassert_active_version("v41");\nassert_candidate_valid("v42");\nset_active_pointer("v42");\nmark_inbox_applied("price-42");\nset_applied_cursor(42);\nCOMMIT;',
            lines: [2, 4, 5, 6]
          },
          {
            title: 'Las ventas conservan su explicación',
            text: 'Una cotización nueva usa v42. Una abierta conserva su referencia y revalida antes de iniciar el pago; un cambio de precio requiere la aceptación prevista.',
            active: ['active'], links: [],
            values: [{ label: 'Cotización abierta', value: 'v41' }, { label: 'Cotización nueva', value: 'v42' }, { label: 'Venta confirmada', value: 'No se reescribe' }],
            log: 'quote.created pricing_version=v42 currency=CLP'
          }
        ]
      },
      {
        id: 'duplicate', label: 'Evento duplicado', steps: [
          {
            title: 'El acuse no llegó al emisor',
            text: 'v42 ya quedó activa. El publicador no vio el acuse y reenvía price-42 con el mismo contenido; es una entrega esperable.',
            active: ['source', 'inbox'], links: [['source', 'inbox']],
            values: [{ label: 'Evento', value: 'price-42' }, { label: 'Activa', value: 'v42' }, { label: 'Entrega', value: 'Repetida', tone: 'warning' }],
            log: 'delivery.retry event=price-42 identity_unchanged=true'
          },
          {
            title: 'Comparar identidad y contenido',
            text: 'La clave de inbox incluye origen, consumidor e ID. También se compara el hash: un ID igual con contenido distinto es un conflicto.',
            active: ['inbox'], links: [],
            values: [{ label: 'ID', value: 'Coincide' }, { label: 'Hash', value: 'Coincide' }, { label: 'Estado previo', value: 'Aplicado' }],
            log: 'inbox.duplicate event=price-42 hash_matches=true'
          },
          {
            title: 'No aplicar otra vez',
            text: 'El receptor devuelve el resultado durable anterior. No reconstruye la candidata ni vuelve a sumar descuentos o avanzar cursores.',
            active: ['inbox', 'active'], links: [],
            values: [{ label: 'Activa', value: 'v42', tone: 'success' }, { label: 'Aplicaciones', value: '1' }, { label: 'Cursor aplicado', value: '42' }],
            log: 'pricing.duplicate_skipped event=price-42 effect_count=1'
          },
          {
            title: 'Cerrar la entrega, conservar evidencia',
            text: 'El emisor recibe el acuse. La retención se rige por recuperación y conciliación; recibir un ACK no autoriza a borrar toda evidencia.',
            active: ['inbox', 'source'], links: [['inbox', 'source']],
            values: [{ label: 'Entrega', value: 'Confirmada', tone: 'success' }, { label: 'Precio', value: 'CLP 11.400' }, { label: 'Efecto', value: 'Único en esta BD' }],
            log: 'delivery.acknowledged event=price-42 duplicate=true'
          }
        ]
      },
      {
        id: 'gap', label: 'Hueco o fuera de orden', steps: [
          {
            title: 'Llega 43 antes que 42',
            text: 'La sucursal tiene v41. Llega el delta de v43, cuya base es v42. El número mayor no demuestra que tengamos todos los cambios anteriores.',
            active: ['source', 'inbox'], links: [['source', 'inbox']],
            values: [{ label: 'Activa', value: 'v41' }, { label: 'Recibida', value: '43' }, { label: 'Falta', value: '42', tone: 'warning' }],
            log: 'sequence.gap expected=42 received=43 base=v42'
          },
          {
            title: 'Guardar lo recibido; no publicarlo',
            text: 'Se conserva 43 en staging como pendiente. El cursor de aplicación permanece en 41 y ninguna venta ve una promoción parcial.',
            active: ['inbox', 'candidate'], links: [['inbox', 'candidate']],
            values: [{ label: '43', value: 'En espera', tone: 'warning' }, { label: 'Aplicada', value: '41' }, { label: 'Activa', value: 'v41' }],
            log: 'candidate.blocked reason=missing_base applied_cursor=41'
          },
          {
            title: 'Recuperar desde el último punto completo',
            text: 'El worker pide replay desde 41. Si la fuente ya no retiene el tramo necesario, solicita un snapshot con un corte consistente nuevo.',
            active: ['inbox', 'source'], links: [['inbox', 'source']],
            values: [{ label: 'Replay', value: 'Desde 41' }, { label: 'Si expiró', value: 'Nuevo snapshot' }, { label: 'Orden', value: 'Por ámbito' }],
            log: 'replay.request from=41 scope=CL-A'
          },
          {
            title: 'Reconstruir una candidata completa',
            text: 'Llegó 42. Se aplican 42 y 43 en orden sobre una candidata aislada, incluyendo bajas; después se valida todo el conjunto.',
            active: ['source', 'inbox', 'candidate'], links: [['source', 'inbox'], ['inbox', 'candidate']],
            values: [{ label: 'Tramo', value: '42 → 43' }, { label: 'Huecos', value: '0', tone: 'success' }, { label: 'Candidata', value: 'v43' }],
            log: 'candidate.validated base=v41 target=v43 complete_through=43'
          },
          {
            title: 'Publicar solo con precondiciones vigentes',
            text: 'El commit conjunto activa v43 y su cursor. Durante la espera v41 sirve solo mientras esté autorizada; vencida, se bloquea el cálculo afectado.',
            active: ['candidate', 'active'], links: [['candidate', 'active']],
            values: [{ label: 'Activa', value: 'v43', tone: 'success' }, { label: 'Aplicada', value: '43' }, { label: 'Promoción parcial', value: 'Nunca visible' }],
            log: 'pricing.activated from=v41 to=v43 no_gap=true'
          }
        ]
      }
    ]
  },
  'prices-snapshot': {
    title: 'Carga masiva: preparar, alcanzar y publicar',
    nodes: [
      { id: 'source', label: 'Fuente de país', detail: 'Paquete aprobado + flujo retenido' },
      { id: 'staging', label: 'Staging local', detail: 'Descarga y avance recuperables' },
      { id: 'validator', label: 'Validador común', detail: 'Conjunto completo y compatible' },
      { id: 'active', label: 'Puntero activo', detail: 'Versión local usada por ventas' }
    ],
    scenarios: [
      {
        id: 'complete', label: 'Carga y cambios concurrentes', steps: [
          {
            title: 'Programar o ejecutar manualmente',
            text: 'Ambas vías crean un trabajo durable autorizado. Se aplican el mismo pipeline, límites de carga y auditoría; la vía manual no omite controles.',
            active: ['source'], links: [],
            values: [{ label: 'Trabajo', value: 'snapshot-CL-A' }, { label: 'Disparo', value: 'Manual / agenda' }, { label: 'Activa', value: 'v41' }],
            log: 'snapshot.requested scope=CL-A actor=authorized_operator'
          },
          {
            title: 'Fijar un corte consistente H',
            text: 'El manifiesto declara H=100: el paquete contiene todos los cambios hasta ese punto para su ámbito, incluidas bajas. H no es la hora del PC.',
            active: ['source', 'staging'], links: [['source', 'staging']],
            values: [{ label: 'Corte', value: 'H = 100' }, { label: 'Cobertura', value: 'Ámbito completo' }, { label: 'Checksum', value: 'Del manifiesto' }],
            log: 'snapshot.manifest watermark=100 scope=CL-A schema=pricing-1'
          },
          {
            title: 'Descargar por partes recuperables',
            text: 'Los bloques van a staging, separado de la versión activa. Se guarda progreso y se retienen los eventos posteriores a H; no se deja una transacción SQL abierta.',
            active: ['source', 'staging'], links: [['source', 'staging']],
            values: [{ label: 'Bloques', value: '3 / 3' }, { label: 'Activo', value: 'v41' }, { label: 'Eventos nuevos', value: '101 · 102' }],
            log: 'snapshot.downloaded chunks=3 received_after_H=101,102'
          },
          {
            title: 'Verificar integridad y alcanzar el flujo',
            text: 'Comprobar el checksum del paquete. Reproducir 101 y 102 sobre la candidata hasta un punto completo conocido: este catch-up evita perder cambios nuevos.',
            active: ['staging', 'validator'], links: [['staging', 'validator']],
            values: [{ label: 'Checksum', value: 'Correcto', tone: 'success' }, { label: 'Aplicar deltas', value: '101 → 102' }, { label: 'Corte final', value: '102' }],
            log: 'candidate.caught_up watermark=100 complete_through=102'
          },
          {
            title: 'Validar la candidata resultante',
            text: 'Comprobar cobertura, referencias, bajas, esquema, motor y vigencia. Congelar la candidata: validar un archivo no basta si el conjunto final quedó incompleto.',
            active: ['validator'], links: [],
            values: [{ label: 'Candidata', value: 'v102' }, { label: 'Vigencia', value: 'Autorizada', tone: 'success' }, { label: 'Conjunto', value: 'Inmutable' }],
            log: 'candidate.validated target=v102 complete=true'
          },
          {
            title: 'Comparar y cambiar en un commit',
            text: 'CAS significa «cambiar solo si sigue siendo la versión esperada». Revalidar y guardar puntero, inbox aplicada y checkpoint juntos; nunca retroceder lo aplicado.',
            active: ['validator', 'active'], links: [['validator', 'active']],
            values: [{ label: 'Esperada', value: 'v41' }, { label: 'Nueva activa', value: 'v102', tone: 'success' }, { label: 'Checkpoint', value: '102' }],
            log: 'snapshot.activated expected=v41 active=v102 checkpoint=102',
            code: 'BEGIN;\nassert_active_version(expected);\nassert_valid_and_not_older(candidate);\nset_active_pointer(candidate.version);\nmark_inbox_applied(candidate.events);\nset_applied_cursor(candidate.checkpoint);\nCOMMIT;',
            lines: [2, 3, 4, 5, 6]
          },
          {
            title: 'Mantener las versiones referenciadas',
            text: 'Las nuevas cotizaciones usan v102. Las abiertas mantienen su referencia y se revalidan antes de iniciar el pago; la retención contempla esas referencias y la recuperación.',
            active: ['active'], links: [],
            values: [{ label: 'Nueva venta', value: 'v102' }, { label: 'Venta abierta', value: 'Versión fijada' }, { label: 'Resultado', value: 'Auditable', tone: 'success' }],
            log: 'snapshot.completed version=v102 previous_retained=true'
          }
        ]
      },
      {
        id: 'invalid', label: 'Descarga incompleta o inválida', steps: [
          {
            title: 'La descarga pierde conexión',
            text: 'Solo llegaron dos de tres bloques. Haber recibido filas no convierte el paquete en una versión publicable.',
            active: ['source', 'staging'], links: [['source', 'staging']],
            values: [{ label: 'Bloques', value: '2 / 3', tone: 'warning' }, { label: 'Activa', value: 'v41' }, { label: 'Aplicada', value: '41' }],
            log: 'snapshot.interrupted chunks=2/3 active_unchanged=true'
          },
          {
            title: 'Reanudar desde progreso durable',
            text: 'Al recuperar conectividad se solicita lo pendiente. El trabajo conserva identidad y verifica el manifiesto; no empieza a vender con lo descargado a medias.',
            active: ['staging', 'source'], links: [['staging', 'source']],
            values: [{ label: 'Trabajo', value: 'Mismo ID' }, { label: 'Falta', value: 'Bloque 3' }, { label: 'Activa', value: 'v41' }],
            log: 'snapshot.resuming missing_chunk=3'
          },
          {
            title: 'El checksum no coincide',
            text: 'La candidata recibida no corresponde al manifiesto. Se retiene el fallo con evidencia y se solicita una copia válida; ningún cursor aplicado avanza.',
            active: ['staging', 'validator'], links: [['staging', 'validator']],
            values: [{ label: 'Checksum', value: 'Inválido', tone: 'danger' }, { label: 'Publicación', value: 'Bloqueada', tone: 'danger' }, { label: 'Activa', value: 'v41' }],
            log: 'candidate.rejected reason=checksum_mismatch'
          },
          {
            title: 'Conservar la anterior con límites',
            text: 'v41 permanece almacenada y solo puede usarse si conserva vigencia y autorización. Un reintento no extiende su vida útil.',
            active: ['active'], links: [],
            values: [{ label: 'Activa', value: 'v41' }, { label: 'Renovar TTL', value: 'No permitido' }, { label: 'Si venció', value: 'Bloquear cálculo', tone: 'warning' }],
            log: 'pricing.policy_checked version=v41 no_silent_extension=true'
          },
          {
            title: 'Resolver y repetir el mismo proceso',
            text: 'El operador ve motivo, versión y trabajo. Una descarga corregida vuelve a validación y activación; una acción manual no fuerza datos inválidos.',
            active: ['source', 'staging', 'validator'], links: [['source', 'staging'], ['staging', 'validator']],
            values: [{ label: 'Responsable', value: 'Operación de precios' }, { label: 'Evidencia', value: 'Trabajo + error' }, { label: 'Bypass', value: 'No' }],
            log: 'snapshot.recovery_requested reason=corrected_source'
          }
        ]
      },
      {
        id: 'race', label: 'La versión activa avanzó', steps: [
          {
            title: 'Una carga lenta partió de v41',
            text: 'La descarga prepara v100, mientras otra publicación válida puede avanzar la versión activa. No se bloquea a todas las ventas durante la descarga.',
            active: ['source', 'staging'], links: [['source', 'staging']],
            values: [{ label: 'Esperada al inicio', value: 'v41' }, { label: 'Candidata', value: 'v100' }, { label: 'Carga', value: 'En curso' }],
            log: 'snapshot.started expected_active=v41 watermark=100'
          },
          {
            title: 'Otro trabajo publica v105',
            text: 'El pipeline incremental completó y validó cambios más nuevos. Su activación quedó confirmada con checkpoint 105.',
            active: ['validator', 'active'], links: [['validator', 'active']],
            values: [{ label: 'Activa real', value: 'v105', tone: 'success' }, { label: 'Aplicada', value: '105' }, { label: 'Carga lenta', value: 'v100' }],
            log: 'pricing.activated version=v105 checkpoint=105'
          },
          {
            title: 'El CAS rechaza la precondición vieja',
            text: 'La activa ya no coincide con v41. La transacción de activación se aborta: v100 no puede sobrescribir v105 ni retroceder el cursor.',
            active: ['validator', 'active'], links: [],
            values: [{ label: 'CAS', value: 'Conflicto', tone: 'warning' }, { label: 'Activa', value: 'v105' }, { label: 'Retroceso', value: 'Impedido', tone: 'success' }],
            log: 'activation.conflict expected=v41 actual=v105 rollback=true'
          },
          {
            title: 'Recuperar una base compatible',
            text: 'Releer el estado y reconstruir con el historial retenido. Si falta el tramo necesario, solicitar un paquete nuevo; no basta cambiar el valor esperado.',
            active: ['active', 'staging', 'source'], links: [['active', 'staging'], ['staging', 'source']],
            values: [{ label: 'Base', value: 'Reevaluar' }, { label: 'Historial ausente', value: 'Nuevo snapshot' }, { label: 'Validación', value: 'Repetir' }],
            log: 'snapshot.rebase_required actual_version=v105'
          },
          {
            title: 'Revalidar también el tiempo',
            text: 'Una candidata pudo vencer mientras esperaba. El commit vuelve a comprobar vigencia con reloj controlado; descargada y válida ayer no significa autorizada hoy.',
            active: ['validator'], links: [],
            values: [{ label: 'Candidata vencida', value: 'No publicar', tone: 'danger' }, { label: 'Activa', value: 'v105' }, { label: 'Uso de activa', value: 'Según política' }],
            log: 'candidate.rejected reason=validity_expired active=v105'
          }
        ]
      }
    ]
  },
  sale: {
    title: 'Venta: confirmar el hecho local y entregar después',
    nodes: [
      { id: 'pos', label: 'Puesto POS', detail: 'Intención del operador por LAN' },
      { id: 'branch', label: 'Backend sucursal', detail: 'Dueño de reglas y transacción' },
      { id: 'payment', label: 'Medio de pago', detail: 'Efectivo o proveedor autorizado' },
      { id: 'country', label: 'País + integración', detail: 'Recepción y ERP posteriores' }
    ],
    scenarios: [
      {
        id: 'cash', label: 'Efectivo, con WAN caída', steps: [
          {
            title: 'Comprobar qué operación está permitida',
            text: 'Sin Internet, la LAN y el servidor siguen disponibles. El backend valida permisos, datos de precios, pago y capacidad fiscal de esta operación.',
            active: ['pos', 'branch'], links: [['pos', 'branch']],
            values: [{ label: 'WAN', value: 'Sin conexión', tone: 'warning' }, { label: 'LAN + servidor', value: 'Disponibles', tone: 'success' }, { label: 'Importe mock', value: 'CLP 11.400' }],
            log: 'sale.preflight permitted=true writer=branch-CL-A'
          },
          {
            title: 'Fijar identidad y cotización',
            text: 'Persistir intención antes de un efecto externo. La venta conserva moneda, versión de precios y contexto; el puesto no inventa el importe final.',
            active: ['branch'], links: [],
            values: [{ label: 'Venta', value: 'sale-901' }, { label: 'Cotización', value: 'v42 · CLP' }, { label: 'Intento', value: 'pay-901' }],
            log: 'sale.intent_saved sale=sale-901 payment=pay-901 pricing=v42'
          },
          {
            title: 'El pago tiene un resultado conocido',
            text: 'En este ejemplo se registra efectivo recibido. Para tarjeta haría falta evidencia del proveedor y una modalidad realmente autorizada.',
            active: ['pos', 'branch', 'payment'], links: [['pos', 'branch'], ['branch', 'payment']],
            values: [{ label: 'Medio', value: 'Efectivo' }, { label: 'Recibido', value: 'CLP 11.400' }, { label: 'Resultado', value: 'Conocido', tone: 'success' }],
            log: 'payment.recorded attempt=pay-901 method=cash amount=11400 currency=CLP'
          },
          {
            title: 'Un único commit en PostgreSQL de sucursal',
            text: 'Guardar venta, líneas, pago, movimiento de caja, auditoría y outbox juntos. Los requisitos fiscales simultáneos dependen de la modalidad homologada.',
            active: ['branch'], links: [],
            values: [{ label: 'Venta', value: 'Confirmada', tone: 'success' }, { label: 'Outbox', value: 'event-901' }, { label: 'ERP', value: 'Pendiente', tone: 'warning' }],
            log: 'sale.committed sale=sale-901 event=event-901',
            code: 'await branchDb.transaction(async tx => {\n  await sales.confirm(tx, sale);\n  await cash.record(tx, movement);\n  await audit.append(tx, evidence);\n  await outbox.append(tx, event);\n});\nreturn localConfirmation;',
            lines: [1, 2, 3, 4, 5, 7]
          },
          {
            title: 'Responder al operador después del commit',
            text: 'El POS muestra confirmación local y entrega el documento permitido. Si falla la impresión, reimprime el mismo documento sin otra venta ni otro cobro.',
            active: ['branch', 'pos'], links: [['branch', 'pos']],
            values: [{ label: 'Confirmación', value: 'Local', tone: 'success' }, { label: 'Recepción país', value: 'Pendiente' }, { label: 'Reimpresión', value: 'Misma referencia' }],
            log: 'sale.confirmation_sent sale=sale-901 after_commit=true'
          },
          {
            title: 'Recuperar WAN y sincronizar',
            text: 'El worker envía event-901. País confirma recepción durable; después su adaptador integra con ERP. Son estados separados de la venta local.',
            active: ['branch', 'country'], links: [['branch', 'country']],
            values: [{ label: 'Venta local', value: 'Confirmada' }, { label: 'País', value: 'Recibida', tone: 'success' }, { label: 'ERP', value: 'En proceso', tone: 'warning' }],
            log: 'delivery.acknowledged event=event-901 erp_status=pending'
          }
        ]
      },
      {
        id: 'uncertain', label: 'Pago con resultado incierto', steps: [
          {
            title: 'Persistir el intento antes de cobrar',
            text: 'La sucursal fija operationId, proveedor, cuenta, dispositivo y perfil. Este intento es la referencia para consultar o recuperar un efecto externo.',
            active: ['branch'], links: [],
            values: [{ label: 'Operación', value: 'pay-902' }, { label: 'Proveedor', value: 'Adaptador A' }, { label: 'Importe', value: 'CLP 11.400' }],
            log: 'payment.intent_saved operation=pay-902 route=adapter-A'
          },
          {
            title: 'Enviar el comando autorizado',
            text: 'El adaptador invoca la ruta homologada para este proveedor. El ejemplo supone conectividad y capacidad de pago disponibles; offline no autoriza por sí solo una tarjeta.',
            active: ['branch', 'payment'], links: [['branch', 'payment']],
            values: [{ label: 'Identidad', value: 'pay-902' }, { label: 'Destino', value: 'Fijado' }, { label: 'Resultado', value: 'Esperando' }],
            log: 'payment.requested operation=pay-902 provider=adapter-A'
          },
          {
            title: 'Timeout no significa rechazado',
            text: 'La respuesta se pierde y el proveedor pudo cobrar. Se persiste «resultado desconocido»; no se marca como éxito ni se crea otro intento para volver a cobrar.',
            active: ['payment', 'branch'], links: [],
            values: [{ label: 'Pago', value: 'Desconocido', tone: 'warning' }, { label: 'Nuevo cobro', value: 'Bloqueado', tone: 'danger' }, { label: 'Identidad', value: 'pay-902' }],
            log: 'payment.unknown operation=pay-902 reason=response_timeout'
          },
          {
            title: 'Consultar la misma operación',
            text: 'Usar la consulta del proveedor, si existe. Si no puede resolverlo, dejar conciliación o intervención trazable; cambiar de dispositivo no borra la incertidumbre.',
            active: ['branch', 'payment'], links: [['branch', 'payment']],
            values: [{ label: 'Acción', value: 'Consultar / conciliar' }, { label: 'Operación', value: 'pay-902' }, { label: 'Destino', value: 'Adaptador original' }],
            log: 'payment.lookup operation=pay-902 original_route=true'
          },
          {
            title: 'Recuperar evidencia del resultado',
            text: 'En este caso la consulta confirma autorización. Guardar la referencia original y completar la venta; si falla, recuperar o resolver sin recargar a ciegas.',
            active: ['payment', 'branch'], links: [['payment', 'branch']],
            values: [{ label: 'Pago', value: 'Autorizado', tone: 'success' }, { label: 'Referencia', value: 'provider-ref-902' }, { label: 'Liquidación', value: 'Estado aparte' }],
            log: 'payment.recovered operation=pay-902 outcome=authorized'
          },
          {
            title: 'Finalizar con evidencia y outbox',
            text: 'El commit local conserva venta, referencia de pago, auditoría y outbox. La confirmación al POS sigue al commit; la contabilización ERP continúa por separado.',
            active: ['branch', 'pos'], links: [['branch', 'pos']],
            values: [{ label: 'Venta', value: 'Confirmada', tone: 'success' }, { label: 'Cobros lógicos', value: '1' }, { label: 'ERP', value: 'Pendiente' }],
            log: 'sale.committed sale=sale-902 recovered_payment=pay-902'
          }
        ]
      }
    ]
  },
  delivery: {
    title: 'Entrega durable: repetir transporte, proteger el efecto',
    nodes: [
      { id: 'outbox', label: 'Outbox sucursal', detail: 'Evento del hecho ya confirmado' },
      { id: 'worker', label: 'Worker emisor', detail: 'Reintenta con identidad estable' },
      { id: 'country', label: 'Inbox + efecto país', detail: 'Una transacción en PostgreSQL' },
      { id: 'next', label: 'Outbox país', detail: 'Trabajo posterior para ERP' }
    ],
    scenarios: [
      {
        id: 'lost-ack', label: 'El ACK se pierde', steps: [
          {
            title: 'Enviar un hecho ya confirmado',
            text: 'El worker reclama event-901 de la outbox local. País recibe una copia del hecho; la sucursal sigue siendo autora de la venta.',
            active: ['outbox', 'worker'], links: [['outbox', 'worker']],
            values: [{ label: 'Evento', value: 'event-901' }, { label: 'Autor', value: 'Sucursal CL-A' }, { label: 'Entrega', value: 'Pendiente' }],
            log: 'outbox.claimed event=event-901 source=branch-CL-A'
          },
          {
            title: 'Validar y abrir una transacción de país',
            text: 'Comprobar autorización, contrato, ámbito y huella. Una clave UNIQUE protege origen + consumidor + eventId; el mismo ID con otro hash es conflicto.',
            active: ['worker', 'country'], links: [['worker', 'country']],
            values: [{ label: 'Inbox', value: 'Nueva identidad' }, { label: 'Contrato', value: 'Válido', tone: 'success' }, { label: 'Hash', value: 'Registrado' }],
            log: 'inbox.accepted source=branch-CL-A consumer=country-sales event=event-901'
          },
          {
            title: 'Commit de inbox, efecto y siguiente outbox',
            text: 'Guardar recepción aplicada, proyección de venta y trabajo para ERP juntos. Solo tras confirmar esa transacción se puede emitir el ACK de aplicación.',
            active: ['country', 'next'], links: [['country', 'next']],
            values: [{ label: 'Efectos país', value: '1' }, { label: 'Trabajo ERP', value: 'Durable', tone: 'success' }, { label: 'ACK', value: 'Aún no enviado' }],
            log: 'country.commit event=event-901 projection=stored erp_outbox=stored',
            code: 'await db.transaction(async tx => {\n  await inbox.insertUnique(tx, identity, hash);\n  await projection.apply(tx, event);\n  await outbox.append(tx, erpWork);\n});\nreturn durableAck(event.id);',
            lines: [2, 3, 4, 6]
          },
          {
            title: 'Se pierde la respuesta, no el commit',
            text: 'La sucursal no puede saber si país confirmó. Conserva el pendiente y reenvía event-901 con espera creciente y aleatoriedad.',
            active: ['country', 'worker'], links: [],
            values: [{ label: 'Commit país', value: 'Confirmado' }, { label: 'ACK recibido', value: 'No', tone: 'warning' }, { label: 'Reintento', value: 'Mismo eventId' }],
            log: 'delivery.timeout event=event-901 retry_identity=event-901'
          },
          {
            title: 'La restricción detecta la repetición',
            text: 'El receptor reconoce identidad y hash ya aplicados. Devuelve el acuse previo sin insertar otra proyección ni otro trabajo ERP.',
            active: ['worker', 'country'], links: [['worker', 'country']],
            values: [{ label: 'Evento', value: 'Duplicado' }, { label: 'Efectos país', value: '1', tone: 'success' }, { label: 'Trabajos ERP', value: '1', tone: 'success' }],
            log: 'inbox.duplicate event=event-901 same_hash=true effect_skipped=true'
          },
          {
            title: 'Confirmar entrega no confirma ERP',
            text: 'La sucursal marca entrega confirmada. La outbox de país aún debe integrar y conciliar; retención y restore necesitan sus propias pruebas.',
            active: ['country', 'worker', 'outbox', 'next'], links: [['country', 'worker'], ['worker', 'outbox']],
            values: [{ label: 'País', value: 'Recibido', tone: 'success' }, { label: 'ERP', value: 'Pendiente', tone: 'warning' }, { label: 'Venta', value: 'Local confirmada' }],
            log: 'delivery.acknowledged event=event-901 erp_status=pending'
          }
        ]
      },
      {
        id: 'quarantine', label: 'Fallo temporal o de negocio', steps: [
          {
            title: 'El destino no está disponible',
            text: 'Una respuesta temporal o un corte de red deja el trabajo pendiente. Conservar identidad, último error, número de intento y próximo momento permitido.',
            active: ['worker', 'country'], links: [['worker', 'country']],
            values: [{ label: 'Error', value: 'Temporal', tone: 'warning' }, { label: 'ID', value: 'event-903' }, { label: 'Pendiente', value: 'Durable' }],
            log: 'delivery.failed event=event-903 class=transient'
          },
          {
            title: 'Esperar y limitar la presión',
            text: 'Aplicar backoff con jitter, límites de concurrencia y una política de intentos. Reintentar sin pausa puede agravar la caída del servicio.',
            active: ['outbox', 'worker'], links: [['outbox', 'worker']],
            values: [{ label: 'Próximo intento', value: 'Programado' }, { label: 'Concurrencia', value: 'Acotada' }, { label: 'ID', value: 'event-903' }],
            log: 'delivery.retry_scheduled event=event-903 policy=bounded_backoff'
          },
          {
            title: 'Separar una incompatibilidad permanente',
            text: 'El destino volvió, pero rechaza el contrato. Repetir los mismos bytes no lo arregla: mover el trabajo a cuarentena con motivo y responsable.',
            active: ['worker', 'country'], links: [['worker', 'country']],
            values: [{ label: 'Error', value: 'Contrato incompatible', tone: 'danger' }, { label: 'Estado', value: 'Cuarentena', tone: 'warning' }, { label: 'Reintento ciego', value: 'Detenido' }],
            log: 'delivery.quarantined event=event-903 reason=unsupported_contract'
          },
          {
            title: 'Mantener trazabilidad y aislamiento',
            text: 'Los ámbitos independientes pueden continuar. Si el siguiente evento depende de este, se conserva el hueco y se bloquea esa aplicación, sin fingir que quedó entregado.',
            active: ['outbox', 'country'], links: [],
            values: [{ label: 'Evento problemático', value: 'Visible' }, { label: 'Ámbito dependiente', value: 'En espera' }, { label: 'Otros ámbitos', value: 'Pueden continuar' }],
            log: 'delivery.isolated blocked_scope=aggregate-903 other_scopes=available'
          },
          {
            title: 'Corregir con autorización y reejecutar',
            text: 'Resolver la incompatibilidad y auditar el replay con el ID original. Si se corrige el hecho de negocio, emitir un evento nuevo que lo referencie; no mutar el original.',
            active: ['outbox', 'worker', 'country'], links: [['outbox', 'worker'], ['worker', 'country']],
            values: [{ label: 'Replay', value: 'Autorizado' }, { label: 'Identidad', value: 'Conservada' }, { label: 'Cambio de hecho', value: 'Evento correctivo' }],
            log: 'delivery.replay_authorized event=event-903 actor=integration_operator'
          }
        ]
      }
    ]
  },
  bullmq: {
    title: 'BullMQ opcional: programar trabajo central',
    nodes: [
      { id: 'scheduler', label: 'Planificador país', detail: 'Intención de trabajo durable' },
      { id: 'queue', label: 'BullMQ + Redis', detail: 'Cola y reintentos del job' },
      { id: 'worker', label: 'Worker país', detail: 'Prepara el paquete' },
      { id: 'database', label: 'PostgreSQL país', detail: 'Identidad, estado y publicación' }
    ],
    scenarios: [
      {
        id: 'scheduled', label: 'Preparar un snapshot', steps: [
          {
            title: 'Un horario crea trabajo recuperable',
            text: 'En país, una agenda o petición autorizada registra snapshot-CL-A-100 y su intención de encolado. BullMQ es una opción; no es requisito de cada venta.',
            active: ['scheduler', 'database'], links: [['scheduler', 'database']],
            values: [{ label: 'Ubicación', value: 'País' }, { label: 'Job', value: 'snapshot-CL-A-100' }, { label: 'Venta local', value: 'Independiente' }],
            log: 'job.intent_saved job=snapshot-CL-A-100 kind=build-snapshot'
          },
          {
            title: 'El publicador encola con identidad estable',
            text: 'Se añade el job con intentos y espera entre reintentos acotados. Los valores simulados ilustran la propuesta; la política se acuerda por trabajo.',
            active: ['scheduler', 'queue'], links: [['scheduler', 'queue']],
            values: [{ label: 'Job ID', value: 'Estable' }, { label: 'Intentos', value: 'Acotados' }, { label: 'Backoff', value: 'Con espera' }],
            log: 'job.enqueued job=snapshot-CL-A-100',
            code: 'await queue.add("build-snapshot", payload, {\n  jobId: "snapshot-CL-A-100",\n  attempts: 3, // solo ejemplo\n  backoff: { type: "exponential", delay: 1000 }\n});',
            lines: [2, 3, 4]
          },
          {
            title: 'Reclamar y comprobar el registro de negocio',
            text: 'El worker consulta la operación durable. Si ya está terminada, devuelve su resultado; si no, reclama el trabajo con exclusión y recuperación.',
            active: ['queue', 'worker', 'database'], links: [['queue', 'worker'], ['worker', 'database']],
            values: [{ label: 'Estado', value: 'En ejecución' }, { label: 'Identidad BD', value: 'Única' }, { label: 'Datos POS', value: 'No viven en Redis' }],
            log: 'job.claimed job=snapshot-CL-A-100 business_key=CL-A-100'
          },
          {
            title: 'Construir una salida inmutable',
            text: 'Preparar el paquete sobre un corte consistente, calcular checksum y validar cobertura. El worker no publica filas incompletas mientras produce el archivo.',
            active: ['worker'], links: [],
            values: [{ label: 'Corte', value: 'H = 100' }, { label: 'Archivo', value: 'Inmutable' }, { label: 'Publicación', value: 'Aún pendiente' }],
            log: 'snapshot.built job=snapshot-CL-A-100 checksum=verified'
          },
          {
            title: 'Persistir publicación y resultado juntos',
            text: 'En PostgreSQL, confirmar manifiesto aprobado, trabajo terminado y outbox de notificación. La clave única impide publicar dos resultados para la misma operación.',
            active: ['worker', 'database'], links: [['worker', 'database']],
            values: [{ label: 'Paquete', value: 'Publicado', tone: 'success' }, { label: 'Trabajo BD', value: 'Terminado' }, { label: 'Notificación', value: 'En outbox' }],
            log: 'snapshot.publication_committed job=snapshot-CL-A-100'
          },
          {
            title: 'Completar el job de transporte',
            text: 'El worker retorna y BullMQ registra completado. Las tiendas aún deben descargar, validar y activar; terminar este job no significa que ya estén actualizadas.',
            active: ['worker', 'queue'], links: [['worker', 'queue']],
            values: [{ label: 'Job', value: 'Completado', tone: 'success' }, { label: 'Paquete', value: 'Disponible' }, { label: 'Tiendas', value: 'Estado separado' }],
            log: 'job.completed job=snapshot-CL-A-100 distribution=pending'
          }
        ]
      },
      {
        id: 'retry', label: 'Caída después del commit', steps: [
          {
            title: 'El negocio ya quedó confirmado',
            text: 'El worker confirmó el manifiesto en PostgreSQL. Cae antes de informar a BullMQ que terminó; base y cola no comparten una transacción.',
            active: ['worker', 'database'], links: [['worker', 'database']],
            values: [{ label: 'Publicación BD', value: 'Confirmada', tone: 'success' }, { label: 'Estado cola', value: 'Sin confirmar', tone: 'warning' }, { label: 'Job', value: 'snapshot-CL-A-100' }],
            log: 'worker.interrupted after_business_commit=true'
          },
          {
            title: 'La cola puede entregar el job otra vez',
            text: 'La recuperación de un trabajo interrumpido puede provocar otra ejecución. jobId ayuda a deduplicar en la cola; no garantiza exactamente una vez para el negocio.',
            active: ['queue', 'worker'], links: [['queue', 'worker']],
            values: [{ label: 'Ejecución', value: 'Repetida', tone: 'warning' }, { label: 'Identidad', value: 'La misma' }, { label: 'Garantía', value: 'No exactly-once' }],
            log: 'job.redelivered job=snapshot-CL-A-100'
          },
          {
            title: 'La base reconoce el trabajo terminado',
            text: 'La clave de operación y su resultado durable permiten devolver el manifiesto anterior. No se genera otra publicación ni otro evento de notificación.',
            active: ['worker', 'database'], links: [['worker', 'database']],
            values: [{ label: 'Operación BD', value: 'Ya terminada' }, { label: 'Publicaciones', value: '1', tone: 'success' }, { label: 'Resultado', value: 'Reutilizado' }],
            log: 'job.business_duplicate job=snapshot-CL-A-100 result=reused',
            code: 'const result = await operations.find(jobKey);\nif (result?.state === "completed") {\n  return result.manifest;\n}\n// Reclamar, ejecutar y persistir con clave única.\n// jobId no reemplaza esta protección en la BD.',
            lines: [1, 2, 3, 6]
          },
          {
            title: 'Completar con el resultado recuperado',
            text: 'El worker devuelve el manifiesto ya registrado y la cola marca el job como completado. La repetición del transporte no creó otra publicación comercial.',
            active: ['worker', 'queue'], links: [['worker', 'queue']],
            values: [{ label: 'Job', value: 'Completado', tone: 'success' }, { label: 'Publicaciones', value: '1' }, { label: 'Protección', value: 'En la BD de negocio' }],
            log: 'job.completed job=snapshot-CL-A-100 result=recovered'
          }
        ]
      },
      {
        id: 'failed', label: 'Intentos agotados', steps: [
          {
            title: 'Una dependencia falla antes del resultado',
            text: 'Este trabajo aún no publicó nada. Si falla temporalmente la fuente, guardar evidencia y reintentar; una entrada inválida requiere corrección, no insistencia automática.',
            active: ['queue', 'worker', 'database'], links: [['queue', 'worker'], ['worker', 'database']],
            values: [{ label: 'Trabajo', value: 'snapshot-CL-A-110' }, { label: 'Fallo', value: 'Temporal', tone: 'warning' }, { label: 'Publicación', value: 'Ninguna' }],
            log: 'job.failed job=snapshot-CL-A-110 class=transient'
          },
          {
            title: 'Reintentar con política acotada',
            text: 'La cola aplica espera creciente y límites de intentos. El worker vuelve a comprobar la operación durable antes de producir un resultado.',
            active: ['worker', 'queue'], links: [['worker', 'queue']],
            values: [{ label: 'Reintento', value: 'Programado' }, { label: 'Espera', value: 'Creciente' }, { label: 'Estado BD', value: 'Conservado' }],
            log: 'job.retry_scheduled job=snapshot-CL-A-110 policy=bounded_backoff'
          },
          {
            title: 'Agotar intentos deja trabajo visible',
            text: 'Al agotarse los intentos, el trabajo queda fallido con error y responsable. La base conserva la evidencia aunque la política de retención elimine después el registro de la cola.',
            active: ['queue', 'database'], links: [],
            values: [{ label: 'Job agotado', value: 'Fallido', tone: 'warning' }, { label: 'Evidencia', value: 'En PostgreSQL' }, { label: 'Replay', value: 'Auditado' }],
            log: 'job.review_required business_key=CL-A-110'
          },
          {
            title: 'Resolver y reejecutar la misma operación',
            text: 'Tras corregir la dependencia, una acción autorizada vuelve a ejecutar el trabajo con la misma identidad de negocio. jobId no sustituye la idempotencia durable.',
            active: ['scheduler', 'queue', 'worker', 'database'], links: [['scheduler', 'queue'], ['queue', 'worker'], ['worker', 'database']],
            values: [{ label: 'Operación', value: 'CL-A-110' }, { label: 'Replay', value: 'Autorizado' }, { label: 'Resultado', value: 'Se comprueba en BD' }],
            log: 'job.replay_authorized business_key=CL-A-110'
          }
        ]
      }
    ]
  },
  rabbitmq: {
    title: 'RabbitMQ opcional: distribuir eventos de país',
    nodes: [
      { id: 'publisher', label: 'Outbox + publicador', detail: 'Evento durable e identidad estable' },
      { id: 'broker', label: 'RabbitMQ país', detail: 'Exchange y rutas configuradas' },
      { id: 'erp', label: 'Cola ERP', detail: 'Consumidor y BD propios' },
      { id: 'analytics', label: 'Cola analítica', detail: 'Consumidor y proyección propios' }
    ],
    scenarios: [
      {
        id: 'fanout', label: 'Dos consumidores independientes', steps: [
          {
            title: 'Un hecho puede interesar a dos destinos',
            text: 'País ya confirmó event-901 y su outbox. Se propone distribuirlo a integración ERP y analítica; RabbitMQ es opcional y permanece fuera del commit de venta.',
            active: ['publisher'], links: [],
            values: [{ label: 'Evento', value: 'event-901' }, { label: 'Autor de venta', value: 'Sucursal' }, { label: 'Ubicación broker', value: 'País' }],
            log: 'publisher.claimed event=event-901 destinations=erp,analytics'
          },
          {
            title: 'Publicar y verificar el enrutamiento',
            text: 'Usar publicación persistente, topología durable, mandatory y publisher confirms según la configuración. Una confirmación del broker no es una confirmación del ERP.',
            active: ['publisher', 'broker'], links: [['publisher', 'broker']],
            values: [{ label: 'messageId', value: 'event-901' }, { label: 'mandatory', value: 'true' }, { label: 'Confirm', value: 'Del broker' }],
            log: 'broker.publish event=event-901 mandatory=true persistent=true',
            code: 'channel.publish("pos.events", "sale.confirmed", body, {\n  messageId: event.id,\n  persistent: true,\n  mandatory: true\n});\n// Tratar returns, nacks y pérdida de conexión.\nawait channel.waitForConfirms();',
            lines: [2, 3, 4, 6, 7]
          },
          {
            title: 'Dos colas, dos copias independientes',
            text: 'El exchange distribuye a las colas vinculadas. Compartir una sola cola entre ERP y analítica repartiría mensajes entre ellos, no enviaría cada evento a ambos.',
            active: ['broker', 'erp', 'analytics'], links: [['broker', 'erp'], ['broker', 'analytics']],
            values: [{ label: 'Cola ERP', value: 'event-901' }, { label: 'Cola analítica', value: 'event-901' }, { label: 'Consumidores', value: 'Independientes' }],
            log: 'broker.routed event=event-901 queues=erp,analytics'
          },
          {
            title: 'Cada consumidor protege su efecto local',
            text: 'Analítica confirma inbox + proyección + outbox posterior, si corresponde, en su BD. Después emite consumer ACK; una repetición se resuelve por identidad y hash.',
            active: ['analytics'], links: [],
            values: [{ label: 'Analítica BD', value: 'Commit', tone: 'success' }, { label: 'Consumer ACK', value: 'Después' }, { label: 'ERP', value: 'Independiente' }],
            log: 'analytics.commit event=event-901 then_ack=true'
          },
          {
            title: 'La cola ERP acepta trabajo durable',
            text: 'Su consumidor guarda inbox y trabajo ERP antes del ACK. La llamada externa ocurre después con su propia idempotencia o conciliación; no es parte de la transacción SQL.',
            active: ['erp'], links: [],
            values: [{ label: 'Trabajo ERP', value: 'Durable', tone: 'success' }, { label: 'Consumer ACK', value: 'Después del commit' }, { label: 'ERP externo', value: 'Aún pendiente' }],
            log: 'erp_work.commit event=event-901 external_result=pending'
          },
          {
            title: 'Los resultados avanzan por separado',
            text: 'Analítica puede estar al día mientras ERP está caído. Aislar colas y recursos evita que ese atraso detenga a los otros destinos; cada uno conserva métricas y responsable.',
            active: ['erp', 'analytics'], links: [],
            values: [{ label: 'Analítica', value: 'Aplicado', tone: 'success' }, { label: 'ERP', value: 'Pendiente', tone: 'warning' }, { label: 'Venta local', value: 'Confirmada' }],
            log: 'delivery.status analytics=applied erp=pending sale=confirmed'
          }
        ]
      },
      {
        id: 'unroutable', label: 'Sin ruta, reintentos y DLQ', steps: [
          {
            title: 'Publicar con una ruta ausente',
            text: 'El mensaje no coincide con ninguna cola vinculada. Sin controlar esta situación, el publicador podría confundir aceptación del broker con entrega al destino.',
            active: ['publisher', 'broker'], links: [['publisher', 'broker']],
            values: [{ label: 'Evento', value: 'event-904' }, { label: 'Colas destino', value: '0', tone: 'danger' }, { label: 'mandatory', value: 'true' }],
            log: 'broker.publish event=event-904 routing_key=sale.confirmed'
          },
          {
            title: 'mandatory devuelve el mensaje sin ruta',
            text: 'Tratar basic.return, nacks y errores de canal. Puede haber publisher confirm para un mensaje devuelto: conservar la outbox y no marcar entrega exitosa.',
            active: ['broker', 'publisher'], links: [['broker', 'publisher']],
            values: [{ label: 'Return', value: 'Sin ruta', tone: 'danger' }, { label: 'Outbox', value: 'Pendiente' }, { label: 'Confirm aislado', value: 'No basta' }],
            log: 'broker.returned event=event-904 reason=NO_ROUTE'
          },
          {
            title: 'Corregir topología y reenviar',
            text: 'La revisión detecta la vinculación faltante y la corrige. Reenviar con event-904; si hubo ambigüedad, la protección del consumidor soporta otra entrega.',
            active: ['publisher', 'broker', 'erp'], links: [['publisher', 'broker'], ['broker', 'erp']],
            values: [{ label: 'Topología', value: 'Corregida', tone: 'success' }, { label: 'messageId', value: 'event-904' }, { label: 'Reintento', value: 'Acotado' }],
            log: 'broker.republished event=event-904 route=erp'
          },
          {
            title: 'Evitar el bucle de reencolar inmediatamente',
            text: 'Un consumidor encuentra un fallo temporal. La topología de retry programada aplica espera y límite; no hace nack con requeue indefinidamente.',
            active: ['erp', 'broker'], links: [['erp', 'broker']],
            values: [{ label: 'Fallo', value: 'Temporal' }, { label: 'Retry', value: 'Con espera' }, { label: 'Bucle inmediato', value: 'Evitado', tone: 'success' }],
            log: 'consumer.retry_scheduled event=event-904 bounded=true'
          },
          {
            title: 'DLQ significa pendiente de resolución',
            text: 'Al agotar política o detectar un error permanente, la ruta de cuarentena conserva mensaje y motivo. Dead-lettering debe configurarse y probarse; no implica éxito ni reparación.',
            active: ['broker', 'erp'], links: [],
            values: [{ label: 'Estado', value: 'DLQ / cuarentena', tone: 'warning' }, { label: 'Negocio', value: 'No confirmado' }, { label: 'Responsable', value: 'Integración' }],
            log: 'consumer.quarantined event=event-904 reason=attempts_exhausted'
          },
          {
            title: 'Replay autorizado y ACK tras persistir',
            text: 'Resolver la causa y reenviar con la identidad original. El consumidor confirma su transacción antes del ACK; si el resultado remoto es incierto, consulta o concilia.',
            active: ['broker', 'erp'], links: [['broker', 'erp']],
            values: [{ label: 'Replay', value: 'Auditado' }, { label: 'Identidad', value: 'event-904' }, { label: 'ACK', value: 'Después del commit' }],
            log: 'consumer.replay_applied event=event-904 inbox=committed'
          }
        ]
      }
    ]
  }
};

// Educational architecture walkthrough; all provider contracts are fictitious.
window.POS_REVEAL_LABS['architecture-patterns'] = {
  "title": "La misma capacidad, dos respuestas del ERP",
  "nodes": [
    {
      "id": "worker",
      "label": "Worker POS",
      "detail": "Procesa una venta pendiente"
    },
    {
      "id": "facade",
      "label": "Fachada",
      "detail": "Ofrece registrar venta"
    },
    {
      "id": "acl",
      "label": "ACL",
      "detail": "Traduce modelos y estados"
    },
    {
      "id": "adapter",
      "label": "Adaptador",
      "detail": "Envía y recibe por HTTP"
    },
    {
      "id": "erp",
      "label": "ERP demo",
      "detail": "Proveedor ficticio"
    }
  ],
  "scenarios": [
    {
      "id": "received",
      "label": "Recibido: seguimiento pendiente",
      "steps": [
        {
          "title": "El worker pide una capacidad",
          "text": "El worker llama registrar venta con el ID V-42 y el cliente C-17. No necesita conocer campos ni códigos internos del ERP.",
          "active": [
            "worker",
            "facade"
          ],
          "links": [
            [
              "worker",
              "facade"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "Sin respuesta"
            },
            {
              "label": "Integración",
              "value": "Pendiente"
            }
          ],
          "log": "POS → registrarVenta(V-42)",
          "code": "integration.registerSale({\n  saleId: \"V-42\", customerId: \"C-17\",\n  amount: { currency: \"CLP\", value: \"12900\" }\n});\n// Valor decimal conceptual en unidades de la moneda."
        },
        {
          "title": "La fachada coordina la traducción",
          "text": "La fachada ofrece una entrada estable. Pide a la ACL preparar la solicitud del proveedor asignado; no reparte sus detalles entre los consumidores.",
          "active": [
            "facade",
            "acl"
          ],
          "links": [
            [
              "facade",
              "acl"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "Sin respuesta"
            },
            {
              "label": "Integración",
              "value": "Pendiente"
            }
          ],
          "log": "Fachada → ACL.toRequest(venta)",
          "code": "const request = acl.toRequest(operation);\n// La implementación concreta queda dentro del módulo."
        },
        {
          "title": "La ACL conoce las equivalencias",
          "text": "El cliente C-17 del POS corresponde a la cuenta A-901 del ERP demo. Es una equivalencia validada, no solo cambiar el nombre de una propiedad.",
          "active": [
            "acl",
            "adapter"
          ],
          "links": [
            [
              "acl",
              "adapter"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "Sin respuesta"
            },
            {
              "label": "Integración",
              "value": "Pendiente"
            }
          ],
          "log": "ACL: cliente C-17 → cuenta A-901",
          "code": "// Contrato ficticio del ERP demo\n{ reference: \"V-42\", account: \"A-901\",\n  amountPesos: 12900, currencyCode: \"CLP\" }"
        },
        {
          "title": "El adaptador realiza la llamada",
          "text": "El adaptador envía la solicitud por HTTP. Un HTTP 200 indica una respuesta HTTP satisfactoria; el contrato y su contenido determinan el resultado de negocio.",
          "active": [
            "adapter",
            "erp"
          ],
          "links": [
            [
              "adapter",
              "erp"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "Sin respuesta"
            },
            {
              "label": "Integración",
              "value": "Esperando evidencia"
            }
          ],
          "log": "Adaptador → HTTP POST /demo/sales",
          "code": "// Petición ilustrativa; no se ejecuta\nconst raw = await erpHttp.post(\"/demo/sales\", request);"
        },
        {
          "title": "Vuelve una respuesta del proveedor",
          "text": "El ERP demo devuelve HTTP 200 y el estado RECEIVED. El adaptador conserva esa evidencia; todavía falta interpretarla según el contrato.",
          "active": [
            "erp",
            "adapter"
          ],
          "links": [
            [
              "erp",
              "adapter"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "RECEIVED"
            },
            {
              "label": "Integración",
              "value": "Por interpretar"
            }
          ],
          "log": "ERP → 200 { status: \"RECEIVED\" }",
          "code": "{ reference: \"V-42\", status: \"RECEIVED\" }"
        },
        {
          "title": "La ACL interpreta el significado",
          "text": "RECEIVED significa recibido para procesar. La ACL devuelve received; el registro sigue pendiente y requiere seguimiento.",
          "active": [
            "adapter",
            "acl"
          ],
          "links": [
            [
              "adapter",
              "acl"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "RECEIVED"
            },
            {
              "label": "Integración",
              "value": "Recibido"
            }
          ],
          "log": "ACL: RECEIVED → received (Recibido)",
          "code": "// Equivalencias del contrato demo\nRECEIVED → status: \"received\"\nBOOKED   → status: \"registered\"\notro     → status: \"unknown\""
        },
        {
          "title": "La fachada devuelve un resultado del POS",
          "text": "El módulo que solicitó la integración recibe un estado del contrato POS. Los códigos del proveedor quedan dentro de la ACL y no condicionan las reglas de venta.",
          "active": [
            "acl",
            "facade"
          ],
          "links": [
            [
              "acl",
              "facade"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "RECEIVED"
            },
            {
              "label": "Integración",
              "value": "Recibido"
            }
          ],
          "log": "Fachada → { status: \"received\" }",
          "code": "{ saleId: \"V-42\", status: \"received\",\n  externalReference: \"V-42\" }"
        },
        {
          "title": "El worker conserva el resultado",
          "text": "El worker guarda received (Recibido) y programa la consulta acordada: todavía falta confirmar el registro. La venta local sigue confirmada; no vuelve a cobrar.",
          "active": [
            "facade",
            "worker"
          ],
          "links": [
            [
              "facade",
              "worker"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "RECEIVED"
            },
            {
              "label": "Integración",
              "value": "Recibido"
            }
          ],
          "log": "Worker: guardar status=received; seguimiento pendiente",
          "code": "await outcomes.persist(operation.id, result);\n// Recuperación e idempotencia requieren implementación."
        }
      ]
    },
    {
      "id": "booked",
      "label": "Registrado: resultado confirmado",
      "steps": [
        {
          "title": "El worker pide una capacidad",
          "text": "El worker llama registrar venta con el ID V-42 y el cliente C-17. No necesita conocer campos ni códigos internos del ERP.",
          "active": [
            "worker",
            "facade"
          ],
          "links": [
            [
              "worker",
              "facade"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "Sin respuesta"
            },
            {
              "label": "Integración",
              "value": "Pendiente"
            }
          ],
          "log": "POS → registrarVenta(V-42)",
          "code": "integration.registerSale({\n  saleId: \"V-42\", customerId: \"C-17\",\n  amount: { currency: \"CLP\", value: \"12900\" }\n});\n// Valor decimal conceptual en unidades de la moneda."
        },
        {
          "title": "La fachada coordina la traducción",
          "text": "La fachada ofrece una entrada estable. Pide a la ACL preparar la solicitud del proveedor asignado; no reparte sus detalles entre los consumidores.",
          "active": [
            "facade",
            "acl"
          ],
          "links": [
            [
              "facade",
              "acl"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "Sin respuesta"
            },
            {
              "label": "Integración",
              "value": "Pendiente"
            }
          ],
          "log": "Fachada → ACL.toRequest(venta)",
          "code": "const request = acl.toRequest(operation);\n// La implementación concreta queda dentro del módulo."
        },
        {
          "title": "La ACL conoce las equivalencias",
          "text": "El cliente C-17 del POS corresponde a la cuenta A-901 del ERP demo. Es una equivalencia validada, no solo cambiar el nombre de una propiedad.",
          "active": [
            "acl",
            "adapter"
          ],
          "links": [
            [
              "acl",
              "adapter"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "Sin respuesta"
            },
            {
              "label": "Integración",
              "value": "Pendiente"
            }
          ],
          "log": "ACL: cliente C-17 → cuenta A-901",
          "code": "// Contrato ficticio del ERP demo\n{ reference: \"V-42\", account: \"A-901\",\n  amountPesos: 12900, currencyCode: \"CLP\" }"
        },
        {
          "title": "El adaptador realiza la llamada",
          "text": "El adaptador envía la solicitud por HTTP. Un HTTP 200 indica una respuesta HTTP satisfactoria; el contrato y su contenido determinan el resultado de negocio.",
          "active": [
            "adapter",
            "erp"
          ],
          "links": [
            [
              "adapter",
              "erp"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "Sin respuesta"
            },
            {
              "label": "Integración",
              "value": "Esperando evidencia"
            }
          ],
          "log": "Adaptador → HTTP POST /demo/sales",
          "code": "// Petición ilustrativa; no se ejecuta\nconst raw = await erpHttp.post(\"/demo/sales\", request);"
        },
        {
          "title": "Vuelve una respuesta del proveedor",
          "text": "El ERP demo devuelve HTTP 200 y el estado BOOKED. El adaptador conserva esa evidencia; todavía falta interpretarla según el contrato.",
          "active": [
            "erp",
            "adapter"
          ],
          "links": [
            [
              "erp",
              "adapter"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "BOOKED"
            },
            {
              "label": "Integración",
              "value": "Por interpretar"
            }
          ],
          "log": "ERP → 200 { status: \"BOOKED\" }",
          "code": "{ reference: \"V-42\", status: \"BOOKED\" }"
        },
        {
          "title": "La ACL interpreta el significado",
          "text": "BOOKED significa registrado en el contrato ficticio. La ACL devuelve registered y conserva la referencia externa como evidencia.",
          "active": [
            "adapter",
            "acl"
          ],
          "links": [
            [
              "adapter",
              "acl"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "BOOKED"
            },
            {
              "label": "Integración",
              "value": "Registrado"
            }
          ],
          "log": "ACL: BOOKED → registered (Registrado)",
          "code": "// Equivalencias del contrato demo\nRECEIVED → status: \"received\"\nBOOKED   → status: \"registered\"\notro     → status: \"unknown\""
        },
        {
          "title": "La fachada devuelve un resultado del POS",
          "text": "El módulo que solicitó la integración recibe un estado del contrato POS. Los códigos del proveedor quedan dentro de la ACL y no condicionan las reglas de venta.",
          "active": [
            "acl",
            "facade"
          ],
          "links": [
            [
              "acl",
              "facade"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "BOOKED"
            },
            {
              "label": "Integración",
              "value": "Registrado"
            }
          ],
          "log": "Fachada → { status: \"registered\" }",
          "code": "{ saleId: \"V-42\", status: \"registered\",\n  externalReference: \"V-42\" }"
        },
        {
          "title": "El worker conserva el resultado",
          "text": "El worker guarda registered (Registrado) con su evidencia. Esto confirma integración bajo el contrato demo, no liquidación del pago ni emisión fiscal.",
          "active": [
            "facade",
            "worker"
          ],
          "links": [
            [
              "facade",
              "worker"
            ]
          ],
          "values": [
            {
              "label": "Venta local",
              "value": "V-42 confirmada"
            },
            {
              "label": "Respuesta ERP",
              "value": "BOOKED"
            },
            {
              "label": "Integración",
              "value": "Registrado"
            }
          ],
          "log": "Worker: guardar status=registered",
          "code": "await outcomes.persist(operation.id, result);\n// Recuperación e idempotencia requieren implementación."
        }
      ]
    }
  ]
};

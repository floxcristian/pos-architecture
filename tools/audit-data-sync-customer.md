# Auditoría de datos para D02, D03 y D04

Revisión estática, 1 de octubre de 2026. Solo lectura de `git show <SHA>:<path>`; no se ejecutaron apps, SQL ni servicios corporativos. Los commits inspeccionados son `mountain-sync-sucursal@540ab9a70e7befbca27a2f7eb88b87b25109e4d1` (**master**, aunque el checkout sea desarrollo) y `mountain-implementos@711f97fd7948c696bf45c992c5b121683bdbacd7`. No acredita despliegue productivo.

## 1. Regla para rotular tablas y schemas

| Referencia | Nombre verificado | Grado y fuente |
| --- | --- | --- |
| Sync `Mensaje` | `sincronizador.mensajes` | `static get table()` explícito. [S01] |
| Sync `MensajeDetalle` | `sincronizador.mensaje_detalles` | `static get table()` explícito. **No** `mensajesdetalles` ni `mensaje_detalle`. [S02] |
| Sync `ColaMensaje` | `sincronizador.cola_mensajes` | `static get table()` explícito. Aviso/respuesta AMQP, distinto de cabecera/detalles. [S03] |
| Sync `TipoMensaje` / `TipoMovimiento` | `sincronizador.tipo_mensajes` / `sincronizador.tipo_movimientos` | Modelos con `table()` explícito; lecturas auxiliares para preparar mensajes. [S04] [S05] |
| Sync `Documento` | `documentos` | El modelo no sobrescribe `table`; la selección usa `documentos.*` y la marca usa `Database.table('documentos')`. Nombre corroborado por SQL; resolución del modelo por convención ORM. **Schema no especificado.** [S06] [S07] |
| Mountain `Empresa` / `Persona` | `empresas` / `personas` | Modelos sin `table()` propio; SQL de búsqueda enlaza ambos. ORM inferido y corroborado, no binding físico ejecutado. [M01] [M02] [M03] |
| Mountain `EstadoCuenta` | `estado_cuentas` | Modelo sin `table()` propio; lecturas SQL y migración nombran la tabla. [M04] [M05] |
| Direcciones en ambos recorridos | `direccion_empresas`, `direcciones` | Operaciones SQL con esos nombres literales; no hace falta inferirlas desde `Direccione`. [S19] [M08] |

Para todas las tablas de negocio anteriores sin prefijo, mostrar **«PostgreSQL sucursal · schema no explícito»**, no `public.<tabla>` como hecho. Los archivos de configuración revisados seleccionan conexión mediante `DB_CONNECTION` y parámetros de entorno, sin fijar un `search_path` en ese bloque; su valor efectivo requiere la configuración/rol/DDL desplegados. [S24] [M15]

Los nombres `CustInvoiceJour`, `SalesTable` y `LedgerJournalTable` que reconoce el consumidor son **etiquetas de la respuesta AX**. No son prueba de un INSERT directo del sincronizador en esas tablas del ERP, ni evidencia del X++/SQL que ejecuta el receptor central. No inventar tablas MPOS o WSO2.

## 2. D02 · Subida de venta, acuses y respuesta AX

### Operaciones verificadas

| Paso | Componente / operación | Tablas, escrituras y frontera real | Evidencia |
| --- | --- | --- | --- |
| Preparar elegibles | `VentasSyncUploadService._obtenerDatos` lee hasta 100 documentos, relaciones y catálogos. | Lee `documentos`, `empresas`; fuera de development une `dtes` y `direccion_empresas`. Exige empresa sincronizada y referencia externa, documento no sincronizado/no creado en otra sucursal, boleta/factura; fuera de development estado vigente y DTE admitido. No es «toda venta guardada». | [S07] |
| Relaciones de lectura | Eager loading del documento para construir DTO AX. | Relaciona empresa/persona/clasificaciones, detalles/productos, pagos, caja/usuario, DTE y referencias. Los auxiliares `tipo_documentos`, `estado_documentos`, `estado_dtes`, `sucursales` también se consultan. El diagrama puede resumirlos; no atribuir una escritura a estas lecturas. | [S07] [S08] |
| Crear mensaje de salida | `_guardarDatos` → `MensajeService.crearMensaje('ventas','salida',…, 'AX')`. | `BEGIN` → INSERT `sincronizador.mensajes` → INSERT varios `sincronizador.mensaje_detalles` con la misma `trx` → `COMMIT`; rollback si falla. Son registros locales del sync, no outbox propuesta ya demostrada con venta. | [S09] [S10] |
| Marcar preparado | Después de que crear mensaje devuelve `error === false`. | UPDATE `documentos.sincronizado=true` por IDs, **fuera de la transacción anterior**. No modifica aquí `sincronizacion_confirmada`. | [S07] |
| Recuperar sobre y enviar | `SincronizadorService` consulta cabecera/detalles y llama bus HTTP. | READ `sincronizador.mensajes` + detalles/tipos; POST `/api/mensajeEntradas/ingresar` según prefijo configurado. La función retorna respuesta HTTP; no demuestra un commit AX ni modifica aquí `documentos` como confirmado. | [S11] [S12] [S17] |
| Recibir AMQP | `queueHooks` decodifica aviso/respuesta. | Invoca `ColaMensajeService.crear` → INSERT `sincronizador.cola_mensajes`, **sin await en el caller**; envía `ch.ack(msg)` inmediatamente después. ACK puede preceder al fin de persistencia. | [S13] [S14] |
| Procesar cola | Worker selecciona hasta 40 y marca `en_proceso=true`. | READ/UPDATE `sincronizador.cola_mensajes`. Para `tipoMovimiento == 'entrada'` llama `actualizarMensajeSincronizadoAX`; al finalizar marca `procesado=true`, incluso en error controlado/excepción con `error=true`. `procesado` no significa éxito. | [S14] |
| Interpretar respuesta de venta | Consulta detalle por `mensajeDetalleId`; parsea `axRespuesta`. | READ `sincronizador.mensaje_detalles` y `documentos`. Dentro de `trx`, puede UPDATE `documentos.ov`; solo si encuentra `CustInvoiceJour` con `error == false` escribe `id_externo=recId`, `sincronizado=true`, `sincronizacion_confirmada=true`. | [S15] |
| Commit negocio y metadata después | Finaliza aplicación de respuesta. | `COMMIT` de cambios de negocio; **después** UPDATE `sincronizador.mensaje_detalles` (`procesado`, `error`, `respuesta_externa`, fechas, tipo de actualización) mediante `actualizarDetalle`, sin `transacting(trx)`. No dibujar ambas escrituras como atómicas. | [S16] [S18] |

**Pago separado:** el caso `pago-factura` reconoce una respuesta satisfactoria `LedgerJournalTable`, actualiza `comprobante_ventas` con referencias/confirmación y, según respuesta, otros registros de pagos/NC. No combinar esta confirmación con la de `documentos` ni llamarla autorización bancaria. [S15]

**Detalle que evita un nodo falso:** `actualizarMensajeSincronizadoAX` construye un objeto `updateMensaje` con contadores, pero no aplica ese objeto a `Mensaje` en el tramo revisado; no representar «UPDATE total_sincronizados de cabecera» como operación observada. [S15] [S16]

### Propuesta de 11 nodos visuales

1. Disparador sync (cron/manual; política aparte).
2. PostgreSQL negocio: **leer documentos elegibles + relaciones**.
3. Sync: construir DTO AX.
4. PostgreSQL `sincronizador`: **INSERT mensajes + mensaje_detalles / COMMIT local**.
5. PostgreSQL negocio: **UPDATE documentos.sincronizado / operación separada**.
6. Bus: **POST ingreso / receptor y tablas centrales pendientes**.
7. Adaptación/AX: **efecto y respuesta no auditados en servidor**.
8. Broker → sync: **respuesta AMQP / ACK temprano**.
9. PostgreSQL `sincronizador.cola_mensajes`: **INSERT asíncrono; después leer/marcar en proceso**.
10. PostgreSQL negocio: **respuesta válida → UPDATE documentos / COMMIT**.
11. PostgreSQL `sincronizador`: **UPDATE mensaje_detalles y cola / pasos posteriores**.

En el paso 8, una flecha de ACK separada debe mostrar que no espera el nodo 9. En el 10, mostrar condición `CustInvoiceJour.error == false`; no animar éxito por mera llegada de respuesta. El estado local preparado aparece en el nodo 5, antes de AX.

IDs del catálogo: `e-sync-upload`; `e-sync-exists` es consulta auxiliar de recuperación, no confirmación normal; `e-sync-manual` es disparador. `e-ax-invoice` declara un wrapper receptor .NET, pero la unión efectiva del bus a ese endpoint no está demostrada: no dibujarla como contrato unido verificado.

## 3. D03 · Bajada de lotes: muestra clientes y direcciones

| Paso | Componente / operación | Tablas, escrituras y frontera real | Evidencia |
| --- | --- | --- | --- |
| Disparo | Polling o aviso AMQP procesado como `tipoMovimiento='salida'`. | La cola de avisos es `sincronizador.cola_mensajes`; no contiene necesariamente los datos completos de maestros. El proceso llama `buscarCambios` por tipo. | [S14] |
| Pedir lote | GET relativo `mensajeSalidas/cambios`; recuperación con `sin-procesar`. | API de lectura configurable; implementación/BD receptora no recibida. Valida destino de sucursal, datos y bloqueo. No demuestra escritura central directa sobre DB sucursal. | [S17] |
| Acusar recibido | `notificarCambioRecibido`. | POST `mensajeSalidas/recibido` con `mensajeSalidaId` en query. **Ocurre antes de persistir cabecera/detalles locales.** Solo continúa si el acuse devuelve sin error. | [S17] |
| Guardar lote local | `crearMensaje(tipo,'entrada',data,…,mensaje_salida_id)`. | INSERT `sincronizador.mensajes` + `sincronizador.mensaje_detalles` en una transacción; commit. Conserva `mensaje_concentrador_id`. Esta es persistencia del sobre, no aplicación atómica de todo el maestro. | [S10] [S17] |
| Aplicar cliente | `procesarMensajeDetalleSync` abre una `trx` **por detalle** y llama `ClientesSyncService.guardar`. | READ/INSERT/UPDATE `personas`, `empresas`; también catálogos/relaciones de clasificación, cartera, segmento, bloqueo y giro. Las escrituras principales usan `trx`, pero muchas lecturas usan `Database` fuera de ella. | [S18] [S20] [S23] |
| Aplicar dirección | Otro tipo de detalle llama `DireccionesSyncService.guardar` con su propia `trx`. | Lee cliente por referencia externa y valida RUT del dato; sin empresa devuelve error. READ/INSERT/UPDATE `direccion_empresas`, `direcciones`, y comuna/tipo de dirección como auxiliares. Respeta condiciones de vigencia/principal. No afirmar que cliente+dirección viajan o se confirman en la misma transacción. | [S19] |
| Commit por detalle | Respuesta sin error → commit; error controlado → rollback. | Después del commit/rollback se UPDATE `sincronizador.mensaje_detalles` (`procesado=true`, `error`, fecha) **sin transacción compartida**. Los errores también son resultados procesados; excepción tiene camino distinto. | [S18] |
| Trabajo posterior de cliente | Luego intenta obtener plazo y pedir recálculo al backend. | `estado_cuenta_plazos`: READ y posible INSERT fuera de la transacción del detalle. GET local `public/cobranzas/actualizar-estado-cuenta` con empresa/cupo/plazo; el backend puede recalcular y guardar `estado_cuentas`. Su fallo no revierte el commit del cliente. | [S21] [S25] [M13] [M16] [M17] |
| Avisar procesados y cerrar cabecera | POST `mensajeSalidas/procesados` con resultados por detalle. | Después, `actualizarMensajeProcesados` hace UPDATE `sincronizador.mensajes.procesado=true` en otra transacción. Notificación «procesados» incluye errores y no prueba lote íntegro exitoso; un fallo del HTTP se captura. | [S17] [S18] |

Catálogos auxiliares observados al aplicar clientes: `tipo_empresas` y `forma_pagos` se leen; `empresa_carteras`, `empresa_segmentos`, `empresa_sub_segmentos`, `empresa_clasificaciones`, `empresa_clasificacion_financieras`, `empresa_bloqueos`, `giros` y `giro_empresas` pueden crearse/actualizarse según existencia. No es un ERD exhaustivo. Al terminar clientes puede reprocesar detalles dependientes fallidos (contactos, direcciones, saldos, facturas pendientes); eso no vuelve atómico el lote. [S20] [S22]

### Propuesta de 10 nodos visuales

1. Origen AX/MPOS central **por confirmar**.
2. API lectura: **GET cambios / lote de un tipo**.
3. Sync → lectura: **POST recibido antes de guardar**.
4. PostgreSQL `sincronizador`: **INSERT mensajes + mensaje_detalles / COMMIT**.
5. Sync: **leer un detalle y abrir transacción**.
6. PostgreSQL negocio: **muestra cliente → personas/empresas + auxiliares**.
7. PostgreSQL negocio: **muestra dirección → direccion_empresas/direcciones**, como alternativa de tipo de detalle, no secuencia obligatoria posterior al nodo 6.
8. PostgreSQL negocio: **COMMIT/ROLLBACK de ese detalle**; metadata en `mensaje_detalles` después.
9. Backend local: **recálculo opcional de cuenta después de cliente**, fuera de ese commit.
10. API lectura: **POST procesados (éxitos/errores)**; cabecera `mensajes.procesado` en escritura posterior.

Visualizar un selector «Ejemplo: cliente / dirección» evita enseñar que ambos corresponden al mismo lote/transacción. La entrada AMQP y su tabla de cola pueden explicarse en ficha del disparador sin convertir toda la bajada en una única cadena AMQP.

IDs del catálogo: `e-master-changes`, `e-master-unprocessed`, `e-master-received`, `e-master-processed`. La llamada auxiliar `GET public/cobranzas/actualizar-estado-cuenta` **no tiene ID entre las 34 rutas seleccionadas**; se puede incluir con su fuente. No reutilizar `e-sync-backend`: identifica otro endpoint de guardado documental/cobranza.

## 4. D04 · Selección/carga de cliente y refresco por RUT

| Paso | Componente / operación | Tablas, escrituras y frontera real | Evidencia |
| --- | --- | --- | --- |
| Solicitud UI | `buscarEmpresa` llama GET `empresas/:id`; otra variante consulta `empresas/null` con RUT. | Carga/selección, no una llamada por cada tecla. Controlador combina params/query e intenta refresco remoto. | [M06] |
| Resolver RUT | `buscarClienteEnLinea`. | Si hay ID local, READ `empresas JOIN personas`; si no, limpia RUT recibido. GET `${URL_API_CLIENTES}cliente`, parámetro `_rutCliente`, timeout 30000 ms del snapshot. Receptor/base remota no identificados inequívocamente. | [M01] |
| Iniciar guardado local | `guardaClienteAX`. | Si la respuesta declara error o no trae `CustTableRecId`, retorna antes de transacción con data nula. En camino válido abre `Database.beginTransaction()`. | [M07] |
| Guardar persona y cliente | `guardarPersona`, lookup empresa por referencia externa. | ORM find/create + merge/save con `trx` para `personas`; consulta de empresa, INSERT o UPDATE vía ORM en `empresas` con `trx`. Catálogos auxiliares se obtienen/guardan; varias lecturas no llevan `trx`. | [M07] [M09] |
| Guardar direcciones del payload | Itera `data.direcciones` → `DireccionesService.getDireccionEmpresa(trx,…)`. | READ/INSERT/UPDATE `direccion_empresas` y `direcciones`; tipo/comuna auxiliares. Enlace nuevo no vigente puede omitirse; enlace local sin sincronizar limita actualización del enlace, pero la rama existente aún llama actualización de la dirección. No resumir como reemplazo de todas las direcciones. | [M08] |
| Guardar cupo/plazo | Lee `estado_cuenta_plazos`; `guardarEstadoDeCuenta`. | ORM find/create + UPDATE `estado_cuentas` con `trx`: empresa, `monto_cupo_credito`, plazo; si es nueva, inicializa `saldo_credito`. **No hay tabla `saldos` en este paso.** | [M10] |
| Cerrar guardado ficha | `COMMIT`; catch `ROLLBACK`. | Transacción explícita de escrituras de persona/empresa/direcciones/cupo y auxiliares participantes. No engloba la llamada remota previa ni el recálculo posterior. Lecturas fuera de `trx` no prueban snapshot serializable. | [M07] [M10] |
| Leer respuesta local | `EmpresaController.view`. | READ empresa/persona, clasificación, giro, bloqueo y `estado_cuentas`; direcciones si query solicita tipo. Caso `id='null'` que recién crea cliente retorna ID antes de este camino de carga completa. | [M11] |
| Saldo adicional condicionado | Con estado de cuenta y cliente distinto de venta público, invoca `estadoDeCuenta(id,true)`. | Fuera de development: GET `${URL_API_CLIENTES}saldo`, timeout 3000 ms. Si respuesta sin error, UPDATE `estado_cuentas.monto_saldo_externo`, fecha y condicionalmente cupo. No comparte transacción con la ficha ya guardada. | [M11] [M12] |
| Recálculo local | `actualizarDeudaNoSincronizadaCuentaCliente`. | Lee ventas/pagos no confirmados, cobranzas, abonos y cuotas/acuerdos; guarda campos derivados en `estado_cuentas`. Usa operaciones posteriores, no reabre la transacción de ficha. | [M13] |
| Devolver o fallo UI | `view` devuelve datos locales y puede combinar `error:true` del refresco. | En el consumidor POS revisado, `data==null`, `error` o error HTTP limpian la venta en preparación. Es comportamiento de interfaz, **no DELETE de una venta persistida** demostrado por este flujo. | [M11] [M14] |

**Contactos:** `guardaClienteAX` no llama a `guardarContactos` en el tramo 130–253. Existe un método separado de contacto de compra y los lotes tienen su propio tipo `contactos`; no rotular el D04 como «actualiza todos los contactos». Tampoco hay escritura a AX acreditada por este GET: el efecto comprobado de la consulta de cliente es sobre la copia local. [M01] [M07] [S18]

Tablas auxiliares del recálculo posterior que pueden ir en ficha, no todas en el mapa: `documentos`, `comprobante_venta_has_documentos`, `comprobante_ventas`, `pago_comprobante_ventas`, `pagos`, `caja_has_forma_pagos`, `forma_pagos`, `cobranzas`, `abonos`, `cobranza_acuerdos`, `cobranza_cuotas` y catálogos de estados. Se revisaron sus consultas; no se asigna schema físico implícito. [M13]

### Propuesta de 11 nodos visuales

1. UI: **GET empresas/:id / selección o carga**.
2. PostgreSQL: **leer empresas + personas para RUT**, si hay ID.
3. Servicio remoto configurado: **GET cliente / receptor por verificar**.
4. Backend: **validar respuesta e iniciar transacción**.
5. PostgreSQL: **INSERT/UPDATE personas + empresas**.
6. PostgreSQL: **INSERT/UPDATE direcciones + direccion_empresas**, según payload/condiciones.
7. PostgreSQL: **INSERT/UPDATE estado_cuentas; leer plazo**.
8. Backend: **COMMIT ficha** y leer relaciones locales.
9. Servicio remoto: **GET saldo condicionado**, después del commit.
10. PostgreSQL: **UPDATE estado_cuentas y recálculo local**, operaciones posteriores.
11. UI: **mostrar ficha o manejar error; puede limpiar borrador**.

La variante `id=null` que retorna el ID y el camino sin actualización de saldo deben ser ramas explícitas o aclararse en fichas. No animar una escritura remota de cliente ni tablas MPOS.

IDs del catálogo: `e-customer-view`, `e-customer-refresh`. La llamada auxiliar `GET ${URL_API_CLIENTES}saldo` no tiene ID en la selección actual; citar [M12], sin atribuirle receptor `ApiCliente` por similitud de nombre.

## 5. Fuentes por commit y rangos

Los enlaces se usan como evidencia de código, no endpoints ejecutables. Se omitieron valores reales de configuración, credenciales y registros de clientes.

[S01]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/Mensaje.js#L6-L21
[S02]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/MensajeDetalle.js#L6-L14
[S03]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/ColaMensaje.js#L6-L10
[S04]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/TipoMensaje.js#L6-L22
[S05]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/TipoMovimiento.js#L6-L14
[S06]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Models/Documento.js#L6-L67
[S07]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/VentasSyncUploadService.js#L20-L150
[S08]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/VentasSyncUploadService.js#L363-L395
[S09]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SyncUpload/VentasSyncUploadService.js#L404-L414
[S10]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L15-L81
[S11]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeService.js#L223-L258
[S12]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/SincronizadorService.js#L87-L101
[S13]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/start/queueHooks.js#L36-L76
[S14]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/ColaMensajeService.js#L17-L140
[S15]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L366-L591
[S16]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L768-L780
[S17]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/CambiosConcentradorService.js#L77-L318
[S18]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L79-L355
[S19]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/DireccionesSyncService.js#L20-L376
[S20]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/ClientesSyncService.js#L14-L407
[S21]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/LlamadaApis/BackendSucursalService.js#L189-L212
[S22]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/MensajeDetalleService.js#L816-L841
[S23]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/PersonaService.js#L13-L61
[S24]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/config/database.js#L71-L85
[S25]: https://github.com/developer-implementos/mountain-sync-sucursal/blob/540ab9a70e7befbca27a2f7eb88b87b25109e4d1/app/Services/Sync/ClientesSyncService.js#L421-L477
[M01]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L30-L88
[M02]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Models/Empresa.js#L6-L71
[M03]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Models/Persona.js#L6-L16
[M04]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Models/EstadoCuenta.js#L7-L17
[M05]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/database/migrations/1640016682001_estado_cuentas_schema.js#L6-L17
[M06]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/empresas.service.ts#L28-L50
[M07]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L130-L253
[M08]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/DireccionesService.js#L9-L280
[M09]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L375-L423
[M10]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/EmpresaService.js#L225-L268
[M11]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/EmpresaController.js#L66-L182
[M12]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L917-L1017
[M13]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/Cobranzas/AcuerdoCobranzaService.js#L811-L1166
[M14]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/modules/pos/pages/punto-de-venta/punto-de-venta.component.ts#L410-L445
[M15]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/config/database.js#L71-L82
[M16]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L527-L535
[M17]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CobranzaController.js#L2058-L2102

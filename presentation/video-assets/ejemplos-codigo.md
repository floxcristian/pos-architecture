# Ejemplos de código del video

Fragmentos didácticos abreviados. Las funciones auxiliares representan contratos que deben implementarse y probarse; no son una aplicación ejecutable.

## 07:57 · Una transacción confirma un conjunto completo

SQL es el lenguaje con que expresamos operaciones en esta base. Una transacción agrupa cambios que se confirman o se deshacen juntos. Aquí, venta, movimiento de caja, auditoría y mensaje pendiente pertenecen a la misma unidad. Las instrucciones abreviadas representan escrituras validadas; no son un programa para copiar. Todas usan la misma conexión. Si una falla, revertimos el conjunto. No mantenemos esta transacción abierta mientras esperamos internet, una impresora o un proveedor de pagos: mezclaríamos demoras externas con bloqueos locales.

```sql
BEGIN;
-- Misma conexión; parámetros ya validados
INSERT INTO sale (...) VALUES (...);
INSERT INTO cash_movement (...) VALUES (...);
INSERT INTO audit (...) VALUES (...);
INSERT INTO outbox (...) VALUES (...);
COMMIT; -- Ante error: ROLLBACK
```

## 10:48 · El contrato de confirmación en ocho líneas

Leamos el ejemplo después de entender el recorrido. Confirmar venta recibe una intención cuya evidencia de pago y política fiscal ya permiten avanzar. La función transacción representa una misma conexión local y revierte todas las escrituras si alguna falla. Dentro guardamos venta, caja, estado fiscal, auditoría y salida pendiente. Fuera queda cualquier llamada al proveedor. Estos nombres describen contratos del diseño; no corresponden a una biblioteca existente. Antes de responder éxito, el servidor debe haber confirmado el conjunto y poder devolver la misma respuesta ante una repetición válida.

```typescript
await transaccion(async tx => {
  await validarConfirmacion(tx, intencion);
  await guardarVenta(tx, intencion);
  await registrarCaja(tx, intencion);
  await registrarEstadoFiscal(tx, intencion);
  await guardarAuditoria(tx, intencion);
  await agregarSalida(tx, evento);
});
```

## 15:59 · Entrada, efecto y nueva salida se confirman juntos

En este pseudocódigo, el país ya autenticó el origen. La entrada tiene una clave única dentro de su alcance y se protege frente a receptores concurrentes. Comparamos el contenido: reutilizar una identidad con otros datos es un conflicto. Si ya fue aplicada, devolvemos la respuesta guardada. Si es nueva, validamos orden y reglas, aplicamos el efecto local, registramos la salida posterior y marcamos la entrada. Todo ocurre en una transacción. El acuse se envía únicamente después de confirmarla.

```typescript
const respuesta = await transaccion(async tx => {
  const entrada = await bloquearEntrada(tx, evento);
  exigirMismoContenido(entrada, evento);
  if (entrada.aplicada) return entrada.respuesta;
  const efecto = await aplicarEfectoLocal(tx, evento);
  await agregarSalida(tx, efecto);
  return marcarAplicada(tx, entrada, efecto);
});
```

## 23:28 · La activación es corta y no permite retroceder

La descarga y validación pesada terminaron fuera de esta transacción. La candidata validada es inmutable. Bloqueamos el alcance y comprobamos que base y avance sigan siendo compatibles. Una copia atrasada no puede reemplazar una versión reciente. Marcamos entradas aplicadas, cambiamos la referencia activa y avanzamos el cursor juntos. Si falla una condición, no publicamos parcialmente. Estos contratos deben probarse frente a concurrencia y reinicios.

```typescript
await transaccion(async tx => {
  const actual = await bloquearAlcance(tx, alcance);
  exigirBaseCompatible(actual, candidata);
  exigirAvanceSinRetroceso(actual, candidata);
  await marcarEntradasAplicadas(tx, candidata);
  await activarVersion(tx, candidata);
  await avanzarCursorAplicado(tx, candidata);
});
```

## 25:02 · Programar una reconciliación con zona horaria

Queremos reconciliar diariamente a las tres de la mañana en Chile. La API, o interfaz de programación, de BullMQ recibe identidad del planificador, horario y plantilla. La conexión ya está configurada. Esto programa intención de ejecución; no garantiza puntualidad bajo carga ni reproduce automáticamente las ventanas perdidas. El trabajo debe detectar qué período o versión necesita reconciliar y registrar su resultado de forma idempotente.

```typescript
import { Queue } from 'bullmq';
const queue = new Queue('prices', { connection });
await queue.upsertJobScheduler(
  'prices-nightly',
  { pattern: '0 0 3 * * *', tz: 'America/Santiago' },
  { name: 'reconcile', data: { country: 'CL' } }
);
```

## 26:04 · Reintentar tiene presupuesto y puede repetirse

Permitimos tres intentos y espera creciente entre fallos. La reconciliación es un contrato del negocio: repetirla debe ser seguro. Un reinicio o pérdida de la reclamación puede provocar otra ejecución. Al agotar el presupuesto, mostramos el fallo y recuperamos con autorización. Un reintento manual no reinicia automáticamente el contador acumulado. Una implementación completa también necesita manejo de errores de conexión, alertas y cierre ordenado.

```typescript
await queue.add('reconcile', { requestId }, {
  jobId: requestId, attempts: 3,
  backoff: { type: 'exponential', delay: 1000 }
});
new Worker('prices', async job => {
  await reconcileIdempotently(job.data);
}, { connection: workerRedis });
```

## 27:40 · La confirmación del intermediario no es aplicación

Este fragmento supone un canal de confirmación y un solo mensaje en vuelo. Esperamos la confirmación del intermediario y observamos devoluciones. La opción mandatory permite detectar que no hubo ninguna cola de destino. No demuestra que todas las suscripciones esperadas existan. Incluso un mensaje sin ruta puede recibir confirmación; por eso comprobamos ambas señales. Registrar custodia del intermediario no afirma que el consumidor aplicó el negocio. El valor booleano de publicar expresa presión de salida, no ese resultado.

```typescript
const returned = new Set();
pub.on('return', m => returned.add(m.properties.messageId));
pub.publish('pos-events', 'sale.confirmed', body,
  { messageId: event.id, persistent: true, mandatory: true });
await pub.waitForConfirms();
if (returned.has(event.id)) throw new Error('Sin ruta');
await markBrokerCustody(event.id);
```

## 28:16 · El consumidor confirma después de su transacción

El consumidor usa acuse manual. Primero confirma entrada, efecto y salida en su base; después reconoce el mensaje. Si cae entre ambos pasos, tolerará una entrega repetida. La política de fallos limita reintentos y deriva casos persistentes a una cola de mensajes problemáticos, conocida como DLQ. Esa transferencia necesita configuración y verificación: no es segura por defecto en cualquier topología. Conservamos referencias y mecanismos de recuperación; reenviar sin límite solo escondería el incidente.

```typescript
await sub.consume('erp', msg => {
  if (!msg) return;
  applyInboxEffectOutbox(msg)
    .then(() => sub.ack(msg))
    .catch(err => handleFailure(sub, msg, err));
}, { noAck: false });
```

## 29:54 · Traducir datos también exige rechazar ambigüedades

Un destino espera importes en unidades mínimas y códigos fiscales propios. La traducción respeta moneda, precisión, redondeo y equivalencias aprobadas. Si falta una equivalencia, detenemos la integración con un motivo visible; no inventamos un valor. El ejemplo usa funciones contractuales, no conversiones universales. Conservamos la identidad original para conciliar respuestas y reintentos. La traducción necesita pruebas con casos reales del país y del destino homologado.

```typescript
const externo = {
  referencia: venta.id,
  importe: convertirImporteExacto(venta, contrato),
  moneda: exigirMonedaAdmitida(venta.moneda),
  impuesto: exigirEquivalencia(venta.impuesto),
  estado: traducirEstado(venta.estado, contrato)
};
```

# Ola operativa: sesiones de caja, cierre, custodia e impresión

Revisión estática: **1 de octubre de 2026**. Mountain `master@711f97fd7948c696bf45c992c5b121683bdbacd7`; impresión `main@2e74b2d64985902f5fdfb52902016a5f65d7b577`. Solo lectura de fuentes: no ejecución de aplicaciones, servicios, bases ni periféricos. El código permite describir rutas y decisiones; **no acredita versión instalada, uso productivo ni capacidad real de hardware**.

Se proponen cinco ampliaciones para la documentación y el tutorial. Los nombres PostgreSQL siguientes no llevan esquema en las operaciones citadas: no añadir `public.` sin DDL/search_path verificados. Una clase Lucid mencionada como modelo no prueba por sí sola un nombre físico diferente. Las fases «propuestas» son requisitos candidatos, no funciones implementadas.

## OP-01 · La apertura crea una sesión operativa; el cierre parcial está dibujado, pero bloqueado

**Recorrido disponible:** `POST /cajas-usuario` recibe caja, usuario y monto de apertura; consulta si el usuario ya tiene caja abierta en la sucursal y si la caja está ocupada; después crea `cajas_usuarios` con estado abierto, fecha de apertura y tipo `cierre-ciego`. Participan `cajas`, `cajas_usuarios` y catálogos de estado/tipo. Es distinto del login del usuario. [Rutas][O01] · [Apertura][O02] · [Validaciones][O03].

**Hueco operativo:** la exclusión visible es SELECT → INSERT, sin una transacción/claim condicional en este método. Dos aperturas concurrentes o reenvío tras respuesta perdida merecen prueba; no afirmar sesiones duplicadas efectivas porque faltan índices/constraints y configuración productiva. La fecha usa `America/Santiago`, apropiada al código chileno pero no un calendario empresarial multipaís configurable. Una sesión necesita identidad propia, moneda, fecha de negocio y zona horaria explícitas.

**Habilitado versus existente:** el selector Angular declara cierre parcial y completo, pero parcial tiene `bloqueado: true` y completo `false`; cuando queda una sola opción, redirige a ella. No presentar cierre parcial, pausa o relevo como capacidad operativa ya habilitada. Esto no demuestra qué interfaz está desplegada ni que sea imposible invocar otro receptor. [Selector UI][O04].

**Aporte a propuesta:** apertura idempotente por identidad de sesión; exclusión de caja/usuario probada en el escritor de sucursal; transiciones explícitas abierto → en cierre → cerrado, y relevo/parcial solo si negocio los valida. Pruebas: apertura concurrente, pérdida de respuesta, apertura sin WAN y cambio de jornada/país.

## OP-02 · «Información» y «validar cierre» ya tienen efectos

**Lectura con escritura:** `GET /cajas-usuario/informacion-cierre/:id` actualiza `cajas_usuarios.tipo_cajas_usuario_id` desde configuración antes de calcular el resumen. En cierre guiado incorpora montos/cantidades del sistema a formas de pago. No debe tratarse como una consulta pura para caché, precarga o reintento automático. [Ruta][O01] · [Implementación][O17].

**Validación con integración externa:** `POST /cajas-usuario/validar-cierre/:id` calcula diferencias y luego llama `_liberarOvs`, antes del endpoint que guarda el cierre. Lee `comprobante_ventas`, `comprobante_venta_has_documentos` y `documentos` para ventas en pausa; por cada OV llama a `NotaDeVentaService.cambiarEstadoOvAx(ov, 0)`. El helper captura errores, los registra y termina con una respuesta inicial sin error. La respuesta de validar informa `caja_cuadrada`, sin incorporar un resultado fallido de liberación. [Validación][O05] · [Liberación de OV][O06].

**Límite:** hay una dependencia remota potencial en la preparación del cierre. No se prueba que esa llamada cambie una tabla AX concreta, ni que todas las OV se liberen, ni que el cierre local espere confirmación ERP. El fallo de la integración puede quedar desacoplado de la respuesta visible. El cliente Angular sí tiene llamadas separadas para información, validación y cierre. [Cliente][O18].

**Aporte a propuesta:** separar consulta de precierre, confirmación de cierre local y comando durable de liberación. Para cada OV, mantener identidad, destino y resultado pendiente/confirmado/incierto. La política de negocio debe decidir qué bloquea cerrar sin WAN; la UI debe mostrar lo pendiente. No resolver esto reenviando todo el cierre o suponiendo éxito por HTTP 200.

## OP-03 · Cerrada, cuadrada y detalle completo son estados diferentes

**Orden y tablas:** `POST /cajas-usuario/cerrar-caja/:id` recalcula diferencias **antes** de `beginTransaction()`; después actualiza `cajas_usuarios`, crea/actualiza un movimiento por sesión mediante el modelo `MovimientosCaja`, guarda formas de pago, detalle de transacciones y, cuando corresponde, denominaciones de efectivo; finalmente hace commit. El método pone estado `cerrada` y conserva por separado `cu_caja_cuadrada`, totales de sistema/usuario y diferencia recaudada. No hay un rechazo general del cierre por `caja_cuadrada=false` en ese handler. [Guardado][O07] · [Campos finales][O08].

Angular primero valida: si no cuadra abre un modal; de lo contrario confirma. La confirmación envía el cierre, limpia la sesión de caja local y navega al resumen tras respuesta satisfactoria. No confundir la limpieza de estado local del navegador con un nuevo commit o con la sincronización del cierre en AX. [Flujo UI][O09] · [Limpieza local][O18].

**Fallo concreto del desglose:** en la UI revisada, la llamada a `validarDetalleEfectivo()` está comentada y se usa `detalleEfectivoCorrecto = true`. En backend, `_guardarDetalleEfectivo` ejecuta **`return` al primer elemento con cantidad cero**; no continúa con las siguientes denominaciones. Con un arreglo como [denominación A=0, denominación B>0], puede cerrar sin persistir B en el detalle, aunque el total declarado se haya guardado. Son condiciones del código, no evidencia de cierres productivos ya afectados. [Validación UI efectiva][O09] · [Guardado de denominaciones][O10].

El detalle usa el modelo `MovimientosCajasHasFormaPagosDetalle`, ligado al movimiento/forma de pago y a `moneda_denominacion_id`; no se introduce un nuevo «ledger» por ese nombre. El snapshot previo al BEGIN y la actualización final por id requieren pruebas frente a ventas concurrentes y doble cierre. El código también retrofecha ciertos cierres a las 23:59:59 de la apertura y marca `cierre_desfasado`: fecha de negocio y hora real de operación deben distinguirse en la propuesta. [Guardado y fecha][O07].

**Aporte a propuesta:** fijar el punto de corte y la versión de sesión; validar total versus denominaciones en el backend; cerrar idempotentemente con motivo/aprobación cuando haya diferencias; conservar conteo original, resultado y correcciones auditables. Pruebas mínimas: cero en primera/mitad de lista, cambio de orden, repetición del cierre, operación concurrente y jornada atravesando medianoche. No cambiar reglas de diferencias aceptables sin negocio.

## OP-04 · El cierre y el archivo de custodia tienen confirmaciones independientes

Hay una descarga de custodia cuyo receptor se declara como `GET /cajas-usuario/descargar-excel-custodia/:id`; el cliente Angular construye la variante `public/cajas-usuario/descargar-excel-custodia/:id` y abre otra ventana. Esta evidencia describe la ruta y llamada; no acredita exposición pública en Internet ni controles desplegados. [Ruta][O01] · [Llamada del cliente][O18].

La extracción lee movimientos de la sesión y `movimientos_cajas_has_forma_pagos`, filtrados por `caja_has_forma_pagos.id_externo_pago='DEC'`; sigue confirmaciones de transacción y pagos/cheques/bancos/plazas/emisor para armar filas de custodia. Es una proyección/exportación posterior, no una confirmación del banco ni una operación de impresión. [Datos de custodia][O11].

**Hueco de archivos:** el servicio arma un nombre a partir de la **fecha de cierre**, escribe bajo `public/excels/`, prepara el descargable, llama `response.download` y programa eliminación a los cinco segundos. El nombre visible no incluye identidad de sesión/solicitud. Dos exportaciones para la misma fecha en el mismo filesystem pueden competir por archivos, y la eliminación está ligada a un temporizador, no a una evidencia explícita de descarga completa. Son riesgos condicionales; no se comprobó colisión, truncado ni exposición de datos reales. [Creación/descarga/limpieza][O12].

**Aporte a propuesta:** usar un identificador único de exportación ligado a sesión y versión del cierre, conservar un manifiesto/hash y estados generado/descargado/entregado cuando el contrato permita distinguirlos. Definir retención y permisos sobre los datos bancarios del archivo; para temporales, ligar limpieza al ciclo real del recurso y probar descargas lentas/concurrentes. Que la caja diga «cerrada» no demuestra que el archivo haya sido generado, descargado o aceptado por un tercero.

## OP-05 · DTE, representación, envío a impresora y papel requieren estados separados

**Tres recorridos observados:** (a) `GET /Documentos/pdf/:id` relee `documentos`, `dtes.mensaje_retorno`, `estado_dtes` y `facturadores`; Ingydev entrega bytes PDF decodificados, mientras Acepta retorna un objeto con referencia/URL de PDF; (b) Angular elige el canal por `slug_tipo_impresora`: `epson` muestra «no configurado», `epson-epos` llama al servicio de conexión del dispositivo y `apiImpresion` envía HTTP; (c) la API Windows recibe configuración/contenido y ejecuta `PrintDocument.Print()`. No todo canal de impresión pasa por el servicio Windows. [Rutas][O01] · [Representación del DTE][O16] · [Selección y llamada][O13] · [PrintDocument][O15].

**Límite del acuse:** `POST /Impresion/ImprimirDTE_Termica` registra excepciones de impresión pero devuelve HTTP 200 con `error=false` y «imprimiendo». En la rama Angular `apiImpresion`, el callback de éxito no inspecciona el cuerpo y la función inicia una suscripción sin esperar confirmación física. Ni ese 200 ni el retorno de `Print()` constituyen en este recorrido una consulta verificable de papel entregado. No se observó aquí un id de trabajo persistido que conecte cada intento de impresión con su resultado; tampoco se afirma que Windows carezca de spooler. [Controlador Windows][O14] · [PrintDocument][O15] · [Cliente][O13].

**Aporte nuevo para el tutorial:** conservar por separado documento fiscal identificado, representación disponible, trabajo aceptado, resultado conocido o incierto y reimpresión. Un fallo de impresora no exige volver a emitir fiscalmente. Un timeout después del envío tampoco permite reimprimir a ciegas sin decidir qué hacer con la posible copia anterior. En dispositivos sin acuse físico fiable, mostrar «enviado; confirmación física no disponible» y registrar la decisión del operador; no inventar una capacidad que el hardware no ofrece.

## Dos escenarios antes / propuesto para un tutorial junior

| Escenario | Actual, reproducible como simulación de código | Propuesta candidata | Criterio de aceptación |
| --- | --- | --- | --- |
| **Terminar turno con WAN caída y una venta pausada** | Validar cuadre intenta liberar OV remota antes del guardado; un error puede registrarse sin reflejarse en la respuesta. El cierre local calcula sus datos antes de abrir trx y conserva una bandera de diferencias separada del estado cerrada. | El operador ve conteo, diferencias, sesión y punto de corte; confirmar persiste el cierre y una intención durable de liberar cada OV. La política acordada decide si puede terminar turno con ese pendiente. Al volver WAN se reconcilia por la identidad original. | Repetir confirmación no duplica movimiento; la venta concurrente tiene asignación inequívoca antes/después del corte; liberar OV mantiene pendiente/confirmado/incierto sin afirmar confirmación AX por cerrar caja. |
| **DTE existente, impresora sin papel o respuesta perdida** | El documento fiscal y su representación ya existen; el envío de impresión puede devolver 200 aunque falle el helper, o perder la respuesta después de alcanzar el spooler. El operador no obtiene aquí prueba de papel entregado. | Consultar la identidad fiscal existente; crear trabajo de impresión identificado; separar aceptación de resultado y permitir reimpresión registrada con motivo, sin reemitir DTE. Si no hay acuse físico, hacer explícito el límite y pedir constatación operativa cuando corresponda. | No se emite un nuevo DTE por falla de papel; respuesta perdida no se traduce automáticamente en «no impreso»; el historial permite explicar qué copia se intentó y por qué se reimprimió. |

Estos escenarios son guiones de simulación, no acciones ejecutadas contra la empresa. Para el primero, agregar una variante local de arqueo [cantidad cero, cantidad positiva] y mostrar total declarado versus detalle guardado. Para el segundo, poder alternar «falló antes de enviar» y «respuesta perdida después de aceptar».

## Fuentes primarias: 18 referencias fijadas

Se reutilizan las siguientes 18 referencias para mantener trazabilidad sin un inventario ilimitado de endpoints. La fuente acredita código, no despliegue:

- **O01** · [Rutas de documento y sesión/cierre][O01] — `mountain-implementos`, `backend/start/routes.js:17–99`.
- **O02** · [Crear apertura y fecha local][O02] — `mountain-implementos`, `backend/app/Controllers/Http/CajasUsuarioController.js:79–110`.
- **O03** · [Validación de usuario/caja ocupada][O03] — `mountain-implementos`, `backend/app/Controllers/Http/CajasUsuarioController.js:809–849`.
- **O04** · [Cierre parcial bloqueado y completo habilitado en UI][O04] — `mountain-implementos`, `frontend/src/app/modules/pos/pages/definir-cierre/definir-cierre.component.ts:43–84`.
- **O05** · [Validar cierre también libera OV][O05] — `mountain-implementos`, `backend/app/Controllers/Http/CajasUsuarioController.js:234–257`.
- **O06** · [OV pausadas y errores absorbidos][O06] — `mountain-implementos`, `backend/app/Controllers/Http/CajasUsuarioController.js:1514–1544`.
- **O07** · [Recalcular, guardar cierre con trx y commit][O07] — `mountain-implementos`, `backend/app/Controllers/Http/CajasUsuarioController.js:116–210`.
- **O08** · [Estado cerrada y campos de cuadre][O08] — `mountain-implementos`, `backend/app/Controllers/Http/CajasUsuarioController.js:1227–1244`.
- **O09** · [Validación efectiva y confirmación Angular][O09] — `mountain-implementos`, `frontend/src/app/modules/pos/pages/cerrar-caja/cerrar-caja.component.ts:303–411`.
- **O10** · [Detalle efectivo: retorno al encontrar cero][O10] — `mountain-implementos`, `backend/app/Controllers/Http/CajasUsuarioController.js:1371–1403`.
- **O11** · [Datos para exportación custodia][O11] — `mountain-implementos`, `backend/app/Controllers/Http/CajasUsuarioController.js:1407–1495`.
- **O12** · [Archivo por fecha, descarga y eliminación diferida][O12] — `mountain-implementos`, `backend/app/Services/ExcelServiceV2.js:371–400`.
- **O13** · [Construcción de llamada y selección del canal de impresión][O13] — `mountain-implementos`, `frontend/src/app/services/impresion.service.ts:42–145`.
- **O14** · [Recepción de impresión térmica y resultado HTTP][O14] — `api-impresion-caja`, `WindowsServiceImpresora/Controllers/ImpresionController.cs:49–71`.
- **O15** · [Entrega a PrintDocument de Windows][O15] — `api-impresion-caja`, `Biblioteca/Helper/PrinterHelper.cs:110–125`.
- **O16** · [Representación PDF según proveedor del DTE][O16] — `mountain-implementos`, `backend/app/Controllers/Http/DocumentoController.js:233–305`.
- **O17** · [GET información de cierre modifica tipo y calcula vista][O17] — `mountain-implementos`, `backend/app/Controllers/Http/CajasUsuarioController.js:610–647`.
- **O18** · [Cliente Angular: validación, cierre, sesión y exportación][O18] — `mountain-implementos`, `frontend/src/app/services/cajas-usuario.service.ts:36–68`.

[O01]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L17-L99 "Rutas de documento y sesión/cierre"
[O02]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L79-L110 "Crear apertura y fecha local"
[O03]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L809-L849 "Validación de usuario/caja ocupada"
[O04]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/modules/pos/pages/definir-cierre/definir-cierre.component.ts#L43-L84 "Cierre parcial bloqueado y completo habilitado en UI"
[O05]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L234-L257 "Validar cierre también libera OV"
[O06]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L1514-L1544 "OV pausadas y errores absorbidos"
[O07]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L116-L210 "Recalcular, guardar cierre con trx y commit"
[O08]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L1227-L1244 "Estado cerrada y campos de cuadre"
[O09]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/modules/pos/pages/cerrar-caja/cerrar-caja.component.ts#L303-L411 "Validación efectiva y confirmación Angular"
[O10]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L1371-L1403 "Detalle efectivo: retorno al encontrar cero"
[O11]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L1407-L1495 "Datos para exportación custodia"
[O12]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Services/ExcelServiceV2.js#L371-L400 "Archivo por fecha, descarga y eliminación diferida"
[O13]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/impresion.service.ts#L42-L145 "Construcción de llamada y selección del canal de impresión"
[O14]: https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/WindowsServiceImpresora/Controllers/ImpresionController.cs#L49-L71 "Recepción de impresión térmica y resultado HTTP"
[O15]: https://github.com/developer-implementos/api-impresion-caja/blob/2e74b2d64985902f5fdfb52902016a5f65d7b577/Biblioteca/Helper/PrinterHelper.cs#L110-L125 "Entrega a PrintDocument de Windows"
[O16]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DocumentoController.js#L233-L305 "Representación PDF según proveedor del DTE"
[O17]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L610-L647 "GET información de cierre modifica tipo y calcula vista"
[O18]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/frontend/src/app/services/cajas-usuario.service.ts#L36-L68 "Cliente Angular: validación, cierre, sesión y exportación"

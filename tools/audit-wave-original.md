# Relectura de la presentación original: operaciones que conviene explicar

Fecha: 2026-10-01. Revisión de contenido; no prueba de producción ni auditoría funcional completa.

## Método y alcance

Se releyeron las 15 láminas de [la PPTX original](<../docs/referencias/Ecosistema de Caja Mountain 4.pptx>) y las notas asociadas mediante las relaciones reales de `ppt/slides/_rels/slideN.xml.rels`. Se extrajo el cuerpo de las notas, sin confundirlo con el número de diapositiva ni con sus placeholders.

- SHA-256 de la PPTX: `4590c267a92f5e1e05b9f0e5c1c0629c61ab5c616f3590ab7ce1b37274f52381`.
- Las láminas 2–14 se vinculan respectivamente con `notesSlide1.xml`–`notesSlide13.xml`; las láminas 1 y 15 no tienen notas. Por ejemplo, la nota de la lámina 3 está en `ppt/notesSlides/notesSlide2.xml`.
- Contraste: [antecedentes](../docs/antecedentes-presentacion-chile.md), [matriz de cobertura](../docs/cobertura-documentacion-presentacion.md), [recorridos de datos](../docs/recorridos-datos-tablas.md), [informe Mountain](../docs/analisis-repositorios/mountain-implementos.md) y la implementación web actual.
- Código: lectura estática de Mountain en `711f97fd7948c696bf45c992c5b121683bdbacd7`, sin ejecutar aplicaciones, llamar servicios ni modificar repositorios.

Los cuatro candidatos siguientes son vacíos de explicación o riesgos de interpretación. Los nombres de los siete módulos **ya están presentes** en Mapa actual → Explorador técnico → Cobertura. No se propone volver a enumerarlos ni presentar esta revisión como cobertura total.

## 1. Apertura, arqueo y cierre de caja tienen un ciclo propio

**Prioridad alta.** El recorrido principal cuenta una venta, pero no explica qué significa abrir o cerrar una caja. Además, en Offline el caso denominado **«Cierre y mantenimiento»** trata del fin de la ventana de sincronización, no del cierre de la caja del operador. El contenido del caso es correcto; su nombre puede confundir a una persona nueva.

**Fuente original exacta:** lámina 3, Punto de venta y Reportes; nota `notesSlide2.xml`, uso diario en tienda. Lámina 7, PostgreSQL conserva sesiones de caja; nota `notesSlide6.xml`. Lámina 11, backend atiende cierre; nota `notesSlide10.xml`. Lámina 12, subida de arqueos, sobrantes y faltantes; nota `notesSlide11.xml`.

**Confirmación en código:**

- [Rutas `cajas-usuario` y cierre, L67–99][caja-rutas]. Se declaran apertura, validación, cierre, resumen e información de cierre.
- [Apertura, L76–110][caja-apertura]. Recibe caja, usuario y monto de apertura; valida, asigna fecha/estado y crea `CajasUsuario`. El snapshot usa `America/Santiago`; no acredita configuración multinacional.
- [Cierre, L116–214][caja-cierre]. Calcula diferencias, inicia una transacción y escribe datos de caja, movimiento, formas de pago y, condicionalmente, detalle de efectivo; hace `commit` antes de responder éxito. Esto no confirma su posterior registro en AX.
- [Comparación de montos, L887–924][caja-diferencias]. Compara lo ingresado con lo calculado y determina diferencias. Es una base concreta para explicar el arqueo, sin inventar reglas de autorización.

**Ya cubierto:** nombres de módulos, PostgreSQL local, mensajes y horarios del sincronizador. La cobertura declara que no se auditaron todas las variantes de caja.

**Explicación interactiva candidata:** tres tarjetas desplegables: **Abrir** («asociar caja, usuario y monto inicial»), **Operar** («se registran movimientos de la sesión»), **Revisar y cerrar** («comparar montos y guardar diferencias/cierre»). Al lado, dos etiquetas independientes: **sesión de caja** y **ventana de sincronización**. Renombrar el caso Offline a «Fin de ventana de sincronización y mantenimiento» elimina la ambigüedad sin cambiar su funcionamiento.

**Límite:** no afirmar que cerrar caja cierra AX, que limpia pendientes, que equivale al informe Z ni que todas las aperturas/cierres pueden hacerse offline. Confirmar variantes de cierre, roles, manejo de diferencias y procedimiento operativo con el equipo.

## 2. Cobrar una deuda previa no es crear una venta nueva

**Prioridad alta.** Cobranzas está nombrado, pero un junior puede interpretar todos los pagos como parte de la venta que acaba de aprender. D04 explica el refresco de ficha/saldo y sus derivados; no explica la operación de recibir un pago contra documentos o cuotas anteriores.

**Fuente original exacta:** lámina 3, Cobranzas: recaudación, documentos pendientes, cuotas y acuerdos; nota `notesSlide2.xml`. Lámina 12 distingue ventas, pagos, anticipos y abonos de cobranza entre los tipos de subida; nota `notesSlide11.xml`.

**Confirmación en código:**

- [Rutas de cobranza, L331–344][cobranza-rutas], distintas de las rutas de venta; [acuerdos, L366–374][acuerdo-rutas]. Una ruta declarada no demuestra su uso productivo.
- [Creación de cobranza, L73–157][cobranza-create]. Distingue abono/acuerdo/cuotas, guarda la cobranza, la vincula con `cajas_usuario_id`, guarda pagos y detalle y hace `commit`. Después invoca el recálculo de deuda no sincronizada y la asignación de número de sucursal.
- [Vinculación de pagos, L1981–1997][cobranza-pagos]. Usa `PagoService` y asocia cada pago a la cobranza. Guardar ese vínculo no prueba autorización bancaria ni registro en AX.

**Ya cubierto:** D04 muestra que saldo remoto, deuda local no confirmada, acuerdos y cuotas participan del estado de cuenta; el módulo Cobranzas figura en Cobertura como revisión incompleta.

**Explicación interactiva candidata:** selector **Comprar ahora / Pagar una deuda anterior**. En la segunda opción mostrar «documento/acuerdo/cuota pendiente → cobranza y pago asociado → efecto en la sesión de caja → integración posterior por verificar». No reproducir todo D04: enlazarlo para explicar de dónde proviene el saldo.

**Límite:** no copiar automáticamente el orden DTE/AX de D01 a todos los casos de cobranza. El método continúa después del `commit`, incluso con consultas/limpieza condicional: no dibujar toda su ejecución como una transacción única. Faltan contratos de saldo, concurrencia entre sucursales, reglas de imputación y autorización offline.

## 3. Nota de crédito, uso de saldo y devolución de dinero son cosas distintas

**Prioridad alta.** La PPTX describe Devoluciones como NC **y** devolución de dinero. El D05 actual sigue consulta/estado/uso de una NC y deja sus límites explícitos; no constituye el recorrido completo de emisión de NC, recepción de artículos y entrega/reversa de dinero. Presentarlo como explicación de «toda devolución» sería excesivo.

**Fuente original exacta:** lámina 3, Devoluciones; nota `notesSlide2.xml`. Lámina 7 asocia el estado de NC con la API de pagos durante devoluciones; nota `notesSlide6.xml`. Lámina 12 enumera NC y devoluciones como categorías distintas; nota `notesSlide11.xml`.

**Comprobación acotada:** existen [rutas propias de devoluciones, L353–356][devolucion-rutas], separadas de [consultas/operaciones de NC, L396–407][nc-rutas]. [El controlador de alta de devolución, L127–151][devolucion-create] escribe una entidad y sus detalles; ese método no demuestra una orden al terminal de pago ni la entrega física de dinero. Tampoco permite afirmar atomicidad total: `Devolucione.create(postData)` no recibe la transacción que sí se pasa al guardado de detalles.

**Ya cubierto:** D05 explica datos y límites de la NC; la ficha de pagos evita confundir la API auxiliar con Transbank; Cobertura reconoce que faltan contratos completos de devolución de dinero y concurrencia.

**Explicación interactiva candidata:** tres preguntas separadas, sin un flujo universal inventado: **¿Existe un documento/saldo a favor?**, **¿Se utiliza ese saldo como medio de pago?**, **¿Se devuelve dinero y por qué medio?** La segunda enlaza D05. La primera y tercera muestran «recorrido completo pendiente de validación» y la evidencia disponible. Añadir que el movimiento físico de artículos corresponde al sistema dueño de inventario, cuya coordinación está pendiente; no convertirlo en stock administrado por caja.

**Límite:** no concluir que una NC implica reembolso, que guardar una devolución devuelve dinero ni que la consulta de saldo evita doble uso entre sucursales. Confirmar causales, emisión fiscal, autorización, medio de devolución, identificación original y resolución de resultados inciertos.

## 4. El impacto de una falla depende de la operación, no solo del componente

**Prioridad media; complemento breve.** Las fichas y el laboratorio ya explican muchos límites, pero su contenido está repartido. Falta una vista pequeña para entender que caída de precios, tarjeta, consulta AX y cola no producen el mismo bloqueo. La tabla original puede inducir una lectura demasiado fuerte si se traslada literalmente.

**Fuente original exacta:** lámina 6 y `notesSlide5.xml`: precios, facturación y crédito tienen dependencias externas. Lámina 10 y `notesSlide9.xml`: AX participa tanto en consultas inmediatas como en registro diferido; guardado local precede al DTE. Lámina 13 y `notesSlide12.xml`: impactos **preliminares**, pendientes de validación con operaciones; ORSAN/Instacheck es una estimación en ese antecedente.

**Ya cubierto:** laboratorio WAN con sucursal disponible; fichas `pricing`, `fiscal`, `devices`, `ax`, `bus`; casos de pago incierto. La web ya corrige la regla simplificada «si llega a AX, fue diferido». Instacheck aparece fuera de uso informado, con estado de ORSAN pendiente por separado.

**Explicación interactiva candidata:** cuatro botones con efectos acotados: **Falla precio remoto** → puede bloquear preparar/pagar; **Falla terminal** → capacidad de tarjeta afectada, otros medios solo si están habilitados y sus propias dependencias lo permiten; **Falla consulta AX** → afecta esa consulta inmediata; **Falla registro diferido** → operación local y aceptación ERP conservan estados distintos. Mostrar siempre «ejemplo de una dependencia», no un semáforo que autorice automáticamente toda la operación.

**Límite:** no prometer que efectivo, crédito o emisión fiscal siguen disponibles porque la base local responde. Tampoco reintroducir Instacheck como integración vigente ni convertir «medio/bajo» de la PPTX en un SLA o riesgo validado.

## Temas revisados que no requieren otro bloque grande

| Tema | Qué ya existe | Matiz que debe conservarse |
| --- | --- | --- |
| Ofertas | Antecedentes, MI-01/MI-06, comparación actual/propuesto y ficha de motor local. | Consultar ofertas, administrarlas y calcular el precio son capacidades distintas. El snapshot tiene CRUD; no prueba uso productivo ni cálculo offline. No es una omisión nueva. |
| Configuraciones | Cobertura enumera clientes, usuarios, perfiles y parámetros. | No hay matriz productiva de permisos. El cierre depende de configuración, por ejemplo `cierre-guiado` en [L635–647][cierre-config]; no tratar parámetros como meros cambios visuales. Puede explicarse dentro del candidato 1. |
| Actores | Interfaz del operador y tablero de soporte distinguidos; nota real de lámina 3 respalda esa distinción. | La PPTX no acredita un rol completo de supervisor, autorizador o administrador con permisos concretos. Para un mapa de actores se necesita la matriz real; no inventarla. |
| Reportes | Cobertura conserva ventas, recaudación, cierre e informe Z. | No hay recorrido completo del informe Z ni contrato de sus totales. Añadir como enlace/pendiente del ciclo de caja, sin atribuirle una garantía fiscal o contable. |
| Tablero vs proceso de sincronización | Ya explicado en Mapa, fichas y catálogo. | La nota de lámina 3 lo orienta a soporte; las láminas 4/11 distinguen procesos. No hace falta repetirlo como nuevo hallazgo. |

## Cierre editorial propuesto

Empezar por los candidatos 1–3 en una sección desplegable de **operaciones diarias**, usando ejemplos sintéticos y enlaces a la evidencia. El candidato 4 puede ser una comparación pequeña junto al laboratorio existente. Así se amplía la comprensión del negocio sin añadir nuevas promesas de arquitectura ni otro inventario de componentes.

Para completar la explicación con el equipo hacen falta ejemplos sanitizados de apertura/cierre y diferencias; una cobranza contra deuda previa; una NC aplicada como pago; una devolución de dinero por cada medio admitido; reglas/permisos de cada paso y su comportamiento real con servicios externos caídos. La falta de estos ejemplos debe seguir visible.

[caja-rutas]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L67-L99
[caja-apertura]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L76-L110
[caja-cierre]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L116-L214
[caja-diferencias]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L887-L924
[cobranza-rutas]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L331-L344
[acuerdo-rutas]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L366-L374
[cobranza-create]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CobranzaController.js#L73-L157
[cobranza-pagos]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CobranzaController.js#L1981-L1997
[devolucion-rutas]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L353-L356
[nc-rutas]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/start/routes.js#L396-L407
[devolucion-create]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/DevolucioneController.js#L127-L151
[cierre-config]: https://github.com/developer-implementos/mountain-implementos/blob/711f97fd7948c696bf45c992c5b121683bdbacd7/backend/app/Controllers/Http/CajasUsuarioController.js#L635-L647

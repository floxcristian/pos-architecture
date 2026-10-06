# Cómo funciona la arquitectura propuesta del POS

Narración sintética en español. Ejemplos didácticos de la propuesta, sin conexión a infraestructura real.

## 00:00:00 · El problema y el mapa

### 00:00:00 · Una venta debe sobrevivir a una mala conexión

Imagina una tienda con tres cajas. Una persona paga, la conexión con la oficina central se corta y el cajero necesita saber si puede entregar el producto. Un punto de venta, o POS por sus siglas en inglés, debe responder esa pregunta con evidencia. No basta con mostrar una pantalla de éxito. Durante este recorrido separaremos lo que ocurrió en la tienda, lo que recibió el país y lo que aceptó el sistema empresarial. Esa separación evita cobrar dos veces y perder operaciones.

### 00:00:32 · Leemos una propuesta, no una promesa de producción

La dirección de producto ya contempla Angular para la interfaz, Tauri para el cliente de escritorio y Nx para organizar el desarrollo. El servidor de sucursal, las bases de datos y los contratos de sincronización son recomendaciones de esta arquitectura. Todavía requieren implementación, pruebas y homologación. Existe una aplicación de demostración separada con datos simulados; verla funcionar no prueba que un pago o una recuperación reales estén resueltos. A lo largo del video distinguiremos decisiones de diseño, ejemplos y garantías que necesitan evidencia.

### 00:01:09 · C4: primero vemos quién se relaciona con quién

Esta vista de contexto pertenece al modelo C4: contexto, contenedores, componentes y código. El cajero vende, cobra y gestiona su turno desde el punto de venta. El supervisor autoriza excepciones y revisa cierres; su responsabilidad es distinta de la del cajero. Operación de plataforma supervisa incidentes, sincronización y recuperación mediante soporte autorizado. La fuente externa de maestros y precios publica datos y reglas comerciales autorizados. El proveedor de pagos autoriza o informa resultados mediante un contrato propio. El proveedor fiscal emite o transmite documentos según el país y la modalidad permitida. El sistema empresarial del país recibe y concilia documentos financieros, conservando su responsabilidad externa. La flecha de maestros al POS expresa una responsabilidad, no una llamada de programación. Recibir datos no transfiere propiedad sobre precios, inventario o contabilidad.

### 00:02:09 · Cinco éxitos distintos en una sola venta

Pensemos en una venta pagada con tarjeta. El proveedor puede autorizar el pago antes de que la venta quede confirmada en la base local. Después, el país puede recibirla y el sistema empresarial puede aceptarla más tarde. El resultado fiscal tiene su propio estado. Por eso una etiqueta única, como sincronizado, sería ambigua. Necesitamos referencias y estados separados para explicar qué pasó, qué falta y quién debe resolverlo. Las flechas ilustran dependencias del ejemplo; no significan que todo ocurra dentro de una sola transacción.

## 00:02:45 · Sucursal, país y conectividad

### 00:02:45 · C2: procesos con responsabilidades concretas

Un contenedor C4 representa una aplicación o un almacén de datos, no necesariamente Docker. La terminal ejecuta Angular dentro de Tauri. Presenta la caja y envía comandos del operador. El backend de sucursal recibe esos comandos, aplica las reglas y confirma la operación compartida. PostgreSQL de sucursal guarda el negocio, la salida pendiente y el espejo comercial autorizado. El sincronizador entrega eventos y actualiza espejos. Intercambia información con la interfaz del país. La API de país recibe lotes y sirve publicaciones. Confirma sus efectos en PostgreSQL de país. La base de país conserva proyecciones, publicaciones y referencias duraderas de entrega e integración. Los workers de país publican versiones e integran los pendientes que ya quedaron confirmados. El adaptador empresarial traduce contratos y concilia resultados. Cambiar esa conexión no reparte reglas de venta entre las cajas.

### 00:03:48 · Sin internet no significa sin red local

WAN significa red de área amplia: aquí conecta la sucursal con el país. LAN significa red de área local: aquí conecta las cajas con su servidor. Si cae la WAN, una venta permitida podría continuar usando datos locales válidos. Si cae la LAN o el servidor, la caja pierde la autoridad compartida que necesita para confirmar. Son fallas diferentes. La propuesta base no convierte cada terminal en un servidor independiente al detectar una desconexión. Esa autonomía adicional exigiría otro diseño y nuevas reglas de coordinación.

### 00:04:25 · Una venta local posible: efectivo y reglas vigentes

Tomemos un ejemplo acotado: pago en efectivo, sesión autorizada, precios vigentes y una modalidad fiscal previamente aprobada para ese escenario. La caja envía el comando por la red local. El servidor valida y registra la venta; la entrega al país queda pendiente. La falta de internet no renueva permisos vencidos ni promociones caducadas. Tampoco habilita tarjetas desconectadas, cupones compartidos o saldos globales por sí sola. Cada capacidad necesita una política y una autoridad disponibles. Continuidad significa conservar estas condiciones, no saltarse las validaciones.

### 00:05:05 · Despliegue: dónde vive cada responsabilidad

El despliegue ubica terminales, servidor de sucursal y plataforma de país en entornos diferentes. En cada terminal se ejecuta el cliente de caja, conectado al servidor compartido de la sucursal. PostgreSQL tiene un primario autorizado por sucursal; los puestos comparten ese almacenamiento de negocio. La relación del backend con PostgreSQL expresa autoridad de escritura, no una sola conexión. El sincronizador funciona como proceso supervisado en la sucursal y dispone de permisos acotados. En la plataforma de país, la API recibe comunicación de las sucursales y sirve publicaciones. El respaldo conserva copias y permite ensayar restauraciones. Tenerlo no demuestra conmutación automática ni alta disponibilidad. Redundancia, energía y recuperación deben responder a objetivos acordados y comprobarse en el entorno real.

## 00:06:00 · Datos y transacciones

### 00:06:00 · Antes de elegir una base, elegimos quién manda

La sucursal es responsable de su historia operativa de ventas. El país conserva las proyecciones y referencias necesarias para recibir e integrar esas operaciones, sin convertirse en otro autor concurrente de la misma venta. Los precios y maestros necesitan una autoridad definida por atributo y país; no asumimos que todo provenga del sistema empresarial. Una copia de lectura permite consultar, pero no otorga derecho a gastar un saldo compartido. Separar propiedad, lectura y escritura reduce conflictos antes de discutir herramientas o formatos de mensajes.

### 00:06:36 · Por qué recomendamos PostgreSQL

Una venta relaciona cabecera, líneas, movimientos de caja, evidencias y mensajes pendientes. PostgreSQL permite expresar relaciones, restricciones y transacciones para mantener coherente ese conjunto. También ofrece JSONB, un formato de documentos que puede alojar cargas variables sin abandonar el modelo relacional. La recomendación responde a estas necesidades, no a que otras bases carezcan de transacciones. MongoDB sí soporta transacciones sobre varios documentos. Su evaluación debe considerar el modelo, la operación y la migración existentes. Tampoco estamos afirmando que las bases actuales ya hayan sido reemplazadas.

### 00:07:19 · SQLite no es la base compartida de todas las cajas

SQLite es una base integrada útil para almacenamiento local de una aplicación. Eso no la transforma en un servidor compartido entre terminales. Por ejemplo, su modo WAL, que registra cambios antes de consolidarlos, requiere que los procesos participantes estén en el mismo equipo y no funciona sobre un sistema de archivos de red. Una futura caja con autonomía propia podría evaluarla, junto con durabilidad, identidad y conflictos. Ese perfil no está aprobado como comportamiento base. Hoy proponemos que las terminales compartan el servidor y PostgreSQL de la sucursal.

### 00:07:57 · Una transacción confirma un conjunto completo

SQL es el lenguaje con que expresamos operaciones en esta base. Una transacción agrupa cambios que se confirman o se deshacen juntos. Aquí, venta, movimiento de caja, auditoría y mensaje pendiente pertenecen a la misma unidad. Las instrucciones abreviadas representan escrituras validadas; no son un programa para copiar. Todas usan la misma conexión. Si una falla, revertimos el conjunto. No mantenemos esta transacción abierta mientras esperamos internet, una impresora o un proveedor de pagos: mezclaríamos demoras externas con bloqueos locales.

## 00:08:35 · Una venta paso a paso

### 00:08:35 · C3: las reglas viven dentro del servidor

El backend recomendado de sucursal es un monolito modular: sus componentes comparten un proceso. Acceso y permisos recibe el contexto del comando y autoriza usuario, perfil y sucursal. Ventas y devoluciones coordina el ciclo de la operación y sus reglas de negocio. Precios y ofertas calcula la cotización desde una versión comercial local que sigue vigente. Turnos y caja controla apertura, movimientos y cierre, manteniendo coherente la operación de caja. El puerto de pagos gestiona intentos y evidencia. Se comunica con el proveedor mediante su contrato. El puerto fiscal aplica la modalidad del país y conversa con su proveedor mediante otro contrato. Persistencia transaccional delimita las escrituras locales: negocio, auditoría y salida pendiente se confirman juntos. La API de comandos recibe las solicitudes del cliente. La interfaz no decide por su cuenta las reglas financieras.

### 00:09:33 · La intención de venta recibe una identidad estable

El cajero confirma una compra de dos productos. El cliente envía una intención identificable, no una orden genérica de cobrar cualquier monto. El servidor valida artículos, versión de precios, permisos y sesión de caja; después conserva una referencia estable para la operación de pago cuando corresponda. Esa referencia nos permite reconocer un reintento después de una caída. Si el mismo identificador llega con un monto distinto, no lo tratamos como repetición válida. La identidad debe acompañar el contenido y el alcance autorizado, no sustituir sus comprobaciones.

### 00:10:11 · Cobrar y confirmar son pasos separados

Con la intención guardada, el sistema solicita el pago por la ruta autorizada y registra la evidencia recibida. Si el resultado permite continuar, ejecuta una transacción corta para confirmar la venta y sus efectos locales. La llamada al proveedor ocurre fuera de esa transacción. Esto deja una situación importante por resolver: el proveedor podría aprobar y la confirmación local podría fallar. La intención y la evidencia deben permitir recuperar el caso, conciliarlo o tramitar una reversa trazable. Lanzar otro cobro para arreglar el error agravaría el problema.

### 00:10:48 · El contrato de confirmación en ocho líneas

Leamos el ejemplo después de entender el recorrido. Confirmar venta recibe una intención cuya evidencia de pago y política fiscal ya permiten avanzar. La función transacción representa una misma conexión local y revierte todas las escrituras si alguna falla. Dentro guardamos venta, caja, estado fiscal, auditoría y salida pendiente. Fuera queda cualquier llamada al proveedor. Estos nombres describen contratos del diseño; no corresponden a una biblioteca existente. Antes de responder éxito, el servidor debe haber confirmado el conjunto y poder devolver la misma respuesta ante una repetición válida.

## 00:11:29 · Pagos y estados inciertos

### 00:11:29 · El proveedor no respondió: resultado desconocido

La terminal envía un cobro y vence el tiempo de espera. Eso describe la comunicación, no el resultado financiero: el proveedor podría haber aprobado. Conservamos la intención y marcamos el pago como desconocido. Si la integración homologada permite consultar por referencia, consultamos; de lo contrario, seguimos el procedimiento de conciliación e intervención. Mientras exista incertidumbre, bloqueamos otro intento incompatible. Cambiar automáticamente de proveedor tampoco elimina el posible primer cargo: podría crear un segundo cobro.

### 00:12:04 · Fiscalidad e impresión también tienen su estado

Supongamos que la venta quedó registrada, pero la impresora dejó de responder. Reimprimir el comprobante no debe crear otra venta. Si el problema es fiscal, debemos mostrar el estado fiscal real y aplicar la modalidad permitida para ese país y operación. Una entrega pendiente al país no autoriza emisión fiscal pendiente por sí sola. Cada paso conserva su referencia y su historial. Así soporte distingue una falla del dispositivo, una respuesta externa pendiente y una operación local todavía no confirmada.

### 00:12:38 · El puente nativo ejecuta una intención autorizada

Algunos equipos de pago requieren un SDK, un kit de desarrollo que entrega el proveedor para controlar el dispositivo. Si ese camino se homologa, Tauri puede alojar un puente nativo. El cliente transmite el comando original autorizado por el servidor: importe, referencia y alcance. El puente no inventa otro monto ni concede permisos. La ruta directa desde el servidor es una alternativa según la integración; no debemos ejecutar ambas para un mismo intento. El resultado vuelve como evidencia verificable.

### 00:13:13 · ¿Y si el pago se aprobó y luego se apagó el servidor?

La respuesta no es volver a cobrar. Primero buscamos la intención duradera y la evidencia disponible. Después consultamos el proveedor si existe esa capacidad homologada, o conciliamos mediante el procedimiento acordado. Debemos determinar si corresponde completar la operación local, revertir el pago o intervenir con trazabilidad. Por eso guardamos la intención antes del efecto externo. La recuperación debe soportar una interrupción entre cualquier par de pasos; suponer que el proceso siempre llegará a la última línea ocultaría este caso.

## 00:13:47 · Entrega sin duplicar efectos

### 00:13:47 · La secuencia completa: venta y entrega al país

La secuencia de venta usa los mismos participantes de ejecución que la vista de contenedores. Primero, el servidor consulta PostgreSQL y valida turno, permisos, precios y capacidad para operar. Después persiste una intención con identidad estable, antes de producir cualquier efecto de pago. El proveedor devuelve un resultado y una referencia. Esta continuación requiere evidencia suficiente para confirmar. El servidor confirma venta, caja, auditoría y salida pendiente dentro de una sola transacción local. El sincronizador envía el lote a la API de país, conservando identidades y secuencia. El país reconoce duplicados y confirma entrada, efecto y salida en una transacción local. Solo después de confirmar, la API devuelve el acuse de aplicación al sincronizador de sucursal. El cliente consulta venta y entrega. La integración empresarial continúa después, fuera de esta secuencia; no existe una transacción distribuida.

### 00:14:49 · La bandeja de salida evita una escritura olvidada

Una bandeja de salida transaccional, llamada outbox, guarda el mensaje pendiente en la misma transacción que la venta. Imagina que guardamos la venta y luego intentamos publicar un mensaje: una caída entre ambas acciones puede dejar la venta sin entrega. Con la bandeja, la intención de envío ya está confirmada localmente. Otro proceso la recoge después. Esto no vuelve infalible a la red ni elimina duplicados; asegura que exista trabajo duradero para reintentar, sujeto a las garantías de almacenamiento y recuperación configuradas.

### 00:15:24 · El país confirmó, pero se perdió el acuse

ACK significa acuse de recibo; aquí hablaremos de un acuse de aplicación. El país aplica el mensaje y confirma su transacción, pero la respuesta se pierde. La sucursal no puede saberlo y reenvía el mismo identificador. El registro de entrada, o inbox, reconoce la repetición y devuelve el resultado anterior sin repetir el efecto. Esta entrega admite más de un intento. Decimos al menos una vez, con aplicación idempotente: repetir la misma solicitud válida conserva el resultado de negocio.

### 00:15:59 · Entrada, efecto y nueva salida se confirman juntos

En este pseudocódigo, el país ya autenticó el origen. La entrada tiene una clave única dentro de su alcance y se protege frente a receptores concurrentes. Comparamos el contenido: reutilizar una identidad con otros datos es un conflicto. Si ya fue aplicada, devolvemos la respuesta guardada. Si es nueva, validamos orden y reglas, aplicamos el efecto local, registramos la salida posterior y marcamos la entrada. Todo ocurre en una transacción. El acuse se envía únicamente después de confirmarla.

## 00:16:34 · El sincronizador

### 00:16:34 · C3: el sincronizador tiene dos direcciones

Un proceso supervisado ejecuta el sincronizador. Su planificador decide cuándo admitir trabajo según ventanas y límites. El emisor entrega operaciones pendientes al país mediante lotes que conservan identidades estables. El receptor consulta deltas y acuses, recibiendo versiones comerciales autorizadas para la sucursal. El módulo de entrada y deduplicación comprueba identidad y orden. Reconocer un mensaje no permite publicar sin validación. La carga completa prepara una versión aislada. Los cambios incrementales también conservan intacta la versión activa. Ambos caminos pasan por el validador, que revisa integridad, cobertura y vigencia antes de publicar. La activación cambia atómicamente la versión y confirma juntos el efecto y su avance aplicado. Los permisos sobre PostgreSQL alcanzan registros técnicos y publicaciones, no la modificación libre de ventas históricas. Separar estas etapas permite observar atrasos, localizar la falla y ejecutar una recuperación concreta.

### 00:17:39 · Reclamar trabajo sin bloquear la base durante la red

Dos ejecutores podrían recoger la misma salida. Necesitamos una reclamación temporal y recuperación del trabajo abandonado. Una transacción corta reclama un lote y termina antes del envío por HTTPS, el protocolo web cifrado. Otra registra resultados, verificando que la reclamación siga vigente y pertenezca al ejecutor. PostgreSQL ofrece bloqueo de filas y omisión de filas ya bloqueadas, pero esto no garantiza orden global. El planificador limita concurrencia, espera entre fallos y busca pendientes después de reiniciarse.

### 00:18:16 · Un duplicado y un hueco son problemas diferentes

Si llega dos veces el evento cuarenta y dos, buscamos su identidad y resultado. Si llega el cuarenta y cuatro sin el cuarenta y tres, puede existir un hueco relevante. El orden se define por entidad o flujo cuando el negocio lo necesita, no por el reloj de todas las máquinas. El receptor debe retener, rechazar o solicitar recuperación según el contrato. Un lote puede contener mensajes aplicados y otros pendientes; responder un éxito global ocultaría errores. Los cursores de recibido y aplicado permanecen separados.

### 00:18:50 · Supervisar también significa saber recuperar

Reiniciar un proceso no basta para declarar recuperado el sistema. Revisamos antigüedad de pendientes, reclamaciones vencidas, errores persistentes y diferencia entre recibido y aplicado. Un reintento manual conserva la identidad original y exige autorización y registro. Los mensajes problemáticos necesitan un estado visible, sin desaparecer del seguimiento. Además, conservamos entradas y salidas durante una ventana compatible con reenvíos y restauraciones. Si un respaldo antiguo elimina el registro de deduplicación, una repetición antes inocua podría volver a producir un efecto.

## 00:19:29 · Precios por eventos

### 00:19:29 · Un precio comienza en una autoridad comercial

Un precio nuevo no se vuelve válido porque apareció en un mensaje. Una autoridad comercial definida por país y atributo aprueba una versión inmutable. El paquete identifica alcance, referencias, compatibilidad y condiciones de vigencia. Su publicación deja una salida transaccional para distribución. La sucursal conserva una copia de lectura que permite cotizar sin consultar al país por cada artículo. Esa copia no admite edición local arbitraria ni convierte al POS en dueño de todos los datos maestros o promociones.

### 00:20:04 · Un delta construye una candidata, no altera la activa

Un delta es un conjunto de cambios desde una base conocida. Por ejemplo, modifica el precio de dos artículos y agrega una promoción. El receptor conserva el mensaje y lo aplica sobre una candidata aislada. Después comprueba cobertura, referencias, orden, esquema y compatibilidad. La versión activa sigue atendiendo ventas mientras esto ocurre. Recibir o deduplicar el mensaje no permite saltarse la validación. Solo una candidata completa y válida puede publicarse mediante un cambio atómico de la referencia activa.

### 00:20:39 · Las bajas también viajan y también se recuerdan

Supongamos que una promoción dejó de existir. Si solo enviamos altas y cambios, una sucursal desconectada podría conservarla para siempre. Por eso el contrato incluye bajas explícitas, a veces llamadas marcas de eliminación. También define cuánto conservarlas para impedir que una repetición antigua resucite contenido retirado. Una carga completa declara su cobertura, de modo que ausencia y eliminación tengan significado claro. El identificador del mensaje evita duplicados; la versión, las bajas y el orden evitan reconstruir un estado comercial incorrecto.

### 00:21:16 · Cada cotización conserva su versión de precios

Mientras el cajero arma una compra, puede activarse una nueva lista. Cambiar silenciosamente una línea del carrito produciría una venta difícil de explicar. La cotización fija una versión y conserva sus referencias. Las nuevas cotizaciones usan la versión recién publicada; las abiertas siguen la política de validez y reconfirmación acordada. Antes de confirmar revisamos que todavía sea admisible. No basta con guardar el número de versión: debemos retener el contenido necesario para justificar precios, descuentos e impuestos aplicados a esa operación.

## 00:21:53 · Precios por lotes y vigencia

### 00:21:53 · La secuencia de precios combina eventos y lotes

La distribución parte de una publicación autorizada en el país y combina eventos con cargas completas. Los eventos acompañan la publicación de versión y manifiesto, reduciendo la demora entre cambios. Las cargas programadas y la recuperación manual solicitan el mismo contrato de deltas o copia completa. La API lee la publicación y su corte consistente, identificando qué cambios quedaron incluidos. El sincronizador recibe el contenido y guarda recepción y área temporal, sin cambiar la versión activa. Después prepara una candidata aislada y reproduce los cambios posteriores al corte de origen. La candidata completa se valida antes de publicarse: integridad, referencias, orden, compatibilidad y vigencia. Solo entonces una transacción activa la versión y confirma entrada aplicada y cursor aplicado juntos. La sucursal conserva una copia autorizada de lectura. Este recorrido distribuye contenido en una dirección; no replica ambas bases bidireccionalmente.

### 00:22:55 · El corte separa lo incluido de lo que llegó después

Una copia completa, llamada snapshot, necesita un corte consistente: incluye, por ejemplo, cambios hasta la posición cien. Mientras se descarga, conservamos los eventos posteriores. En un área temporal reconstruimos la base, aplicamos cambios desde ciento uno y comprobamos manifiesto, integridad y referencias. El corte corresponde al origen, no al reloj del descargador. Si faltan eventos, solicitamos recuperación; no activamos una mezcla sin continuidad demostrada.

### 00:23:28 · La activación es corta y no permite retroceder

La descarga y validación pesada terminaron fuera de esta transacción. La candidata validada es inmutable. Bloqueamos el alcance y comprobamos que base y avance sigan siendo compatibles. Una copia atrasada no puede reemplazar una versión reciente. Marcamos entradas aplicadas, cambiamos la referencia activa y avanzamos el cursor juntos. Si falla una condición, no publicamos parcialmente. Estos contratos deben probarse frente a concurrencia y reinicios.

### 00:24:01 · Antigüedad y vigencia comercial no son lo mismo

TTL significa tiempo de vida; aquí expresa el límite de antigüedad autorizado. La vigencia comercial indica cuándo un precio o promoción tiene efecto. Una promoción puede estar vigente y su copia resultar demasiado antigua. Descargar la misma versión no renueva ninguno de esos plazos. Si falla una actualización, mantenemos la anterior solo mientras siga permitida. Al confirmar una venta comprobamos ambas condiciones por separado.

## 00:24:31 · Trabajos con BullMQ

### 00:24:31 · BullMQ organiza trabajos, no confirma ventas

BullMQ programa y ejecuta trabajos, como reconciliar precios de madrugada. La evaluamos como opción en el país, usando Redis en este ejemplo. Redis coordina la cola y requiere configurar persistencia y memoria. BullMQ también ofrece PostgreSQL como motor alternativo; elegirlo no vuelve atómica cualquier escritura de negocio. La base de la sucursal sigue siendo su bandeja transaccional. No agregamos una cola obligatoria en cada tienda.

### 00:25:02 · Programar una reconciliación con zona horaria

Queremos reconciliar diariamente a las tres de la mañana en Chile. La API, o interfaz de programación, de BullMQ recibe identidad del planificador, horario y plantilla. La conexión ya está configurada. Esto programa intención de ejecución; no garantiza puntualidad bajo carga ni reproduce automáticamente las ventanas perdidas. El trabajo debe detectar qué período o versión necesita reconciliar y registrar su resultado de forma idempotente.

### 00:25:32 · Una solicitud manual también debe sobrevivir

Un supervisor solicita reconciliar una sucursal. Registramos la solicitud autorizada y su salida en PostgreSQL. Un publicador recuperable agrega el trabajo a BullMQ con referencia estable. Si repite el envío, la identidad de la cola ayuda mientras ese trabajo exista. Al eliminarlo, esa protección termina; el dominio conserva su propia idempotencia. La solicitud manual y la programada ejecutan las mismas validaciones y generan evidencia comparable.

### 00:26:04 · Reintentar tiene presupuesto y puede repetirse

Permitimos tres intentos y espera creciente entre fallos. La reconciliación es un contrato del negocio: repetirla debe ser seguro. Un reinicio o pérdida de la reclamación puede provocar otra ejecución. Al agotar el presupuesto, mostramos el fallo y recuperamos con autorización. Un reintento manual no reinicia automáticamente el contador acumulado. Una implementación completa también necesita manejo de errores de conexión, alertas y cierre ordenado.

## 00:26:35 · Mensajes con RabbitMQ

### 00:26:35 · RabbitMQ distribuye mensajes entre consumidores

RabbitMQ es un intermediario de mensajes. Puede servir cuando varios consumidores necesitan eventos: por ejemplo, integración empresarial e informes. BullMQ organiza trabajos; RabbitMQ enruta mensajes hacia colas. Ninguno reemplaza las reglas transaccionales del consumidor. La propuesta base usa PostgreSQL y lotes por HTTPS sin exigir un intermediario. Incorporarlo en el país debe responder a una necesidad medida y contemplar operación, monitoreo y recuperación explícitos.

### 00:27:10 · Una cola por consumidor lógico conserva las copias

Un exchange enruta mensajes hacia colas según sus enlaces. Usamos tipo topic: una clave como venta confirmada coincide con reglas de suscripción. Las colas empresarial y de informes reciben copias independientes si ambas coinciden. Los ejecutores de una misma cola compiten por mensajes; no reciben todos una copia. Configuramos durabilidad y tipo de cola. Difundir a varios consumidores no exige específicamente un exchange de tipo fanout.

### 00:27:40 · La confirmación del intermediario no es aplicación

Este fragmento supone un canal de confirmación y un solo mensaje en vuelo. Esperamos la confirmación del intermediario y observamos devoluciones. La opción mandatory permite detectar que no hubo ninguna cola de destino. No demuestra que todas las suscripciones esperadas existan. Incluso un mensaje sin ruta puede recibir confirmación; por eso comprobamos ambas señales. Registrar custodia del intermediario no afirma que el consumidor aplicó el negocio. El valor booleano de publicar expresa presión de salida, no ese resultado.

### 00:28:16 · El consumidor confirma después de su transacción

El consumidor usa acuse manual. Primero confirma entrada, efecto y salida en su base; después reconoce el mensaje. Si cae entre ambos pasos, tolerará una entrega repetida. La política de fallos limita reintentos y deriva casos persistentes a una cola de mensajes problemáticos, conocida como DLQ. Esa transferencia necesita configuración y verificación: no es segura por defecto en cualquier topología. Conservamos referencias y mecanismos de recuperación; reenviar sin límite solo escondería el incidente.

## 00:28:51 · Fachadas e integración empresarial

### 00:28:51 · Una fachada ofrece una capacidad estable

Una fachada reúne una capacidad y oculta detalles de coordinación. Registrar una operación empresarial puede exigir transformar datos, elegir destino y guardar referencias. El resto del POS solicita esa capacidad mediante un contrato estable, sin conocer cada dirección del proveedor. La fachada no borra pendientes ni convierte operaciones remotas en una transacción. Tampoco exige otro proceso: su ubicación depende de los límites de la integración.

### 00:29:21 · ACL aquí significa capa anticorrupción

ACL viene del inglés Anti-Corruption Layer: capa anticorrupción, no lista de permisos. Impide que el vocabulario externo deforme nuestro modelo. Por ejemplo, emitido puede significar algo distinto en cada sistema empresarial. La capa traduce y valida ese significado. La fachada presenta la capacidad; el adaptador resuelve el acceso técnico; la capa anticorrupción protege la semántica. Pueden colaborar dentro de una integración sin crear tres servicios.

### 00:29:54 · Traducir datos también exige rechazar ambigüedades

Un destino espera importes en unidades mínimas y códigos fiscales propios. La traducción respeta moneda, precisión, redondeo y equivalencias aprobadas. Si falta una equivalencia, detenemos la integración con un motivo visible; no inventamos un valor. El ejemplo usa funciones contractuales, no conversiones universales. Conservamos la identidad original para conciliar respuestas y reintentos. La traducción necesita pruebas con casos reales del país y del destino homologado.

### 00:30:27 · Cambiar de ERP no es cambiar una dirección web

ERP significa planificación de recursos empresariales: aquí, el sistema de procesos administrativos. Una migración puede cambiar identificadores, impuestos, estados y reversas. Cada operación conserva su destino y versión contractual, incluso si llega tarde por desconexión. Debemos resolver referencias históricas y conciliación durante la transición. Publicar la venta a todos los destinos o cambiar una dirección web global no define una estrategia de migración segura.

## 00:30:58 · Construcción y operación

### 00:30:58 · Nx organiza dependencias, no decide la topología

Nx organiza proyectos, dependencias y tareas de construcción. Podemos separar dominio, contratos y adaptadores, y prohibir dependencias indebidas. Una pantalla no debería importar un repositorio SQL del servidor. Esto mejora la estructura del código, pero no autentica solicitudes ni crea aislamiento de ejecución. Un monorepositorio puede producir varios procesos; muchas bibliotecas pueden terminar en uno. La topología de ejecución sigue siendo una decisión arquitectónica distinta.

### 00:31:32 · Tauri entrega escritorio; el servidor conserva autoridad

Tauri empaqueta la interfaz y la conecta con capacidades nativas controladas. Eso no garantiza compatibilidad con impresoras o terminales de pago: debemos validar dispositivos y bibliotecas. El cliente envía comandos al servidor compartido. Las actualizaciones respetan compatibilidad de contratos y procedimientos de instalación y recuperación. Una interfaz nueva no puede asumir capacidades que el servidor todavía no ofrece ni guardar otra historia financiera para compensarlo.

### 00:32:04 · Observar la operación completa con referencias comunes

Observabilidad significa explicar lo que ocurre mediante señales del sistema. Seguimos referencias de venta, pago, evento y destino. Medimos pendientes antiguos, reintentos, huecos, pagos desconocidos y versiones próximas a vencer. Un proceso vivo no demuestra que el negocio esté al día. Los registros necesitan contexto y acceso controlado, sin datos sensibles innecesarios. Soporte debe distinguir un atraso recuperable de una operación que requiere intervención.

### 00:32:36 · Restaurar debe probar datos y entregas pendientes

RPO expresa pérdida tolerable de historial medida en tiempo; RTO expresa tiempo de recuperación aceptable. Acordamos esos objetivos y comprobamos si el diseño los cumple. Una restauración debe revisar ventas, evidencias, entradas, salidas, cursores y versiones. También considera lo que otros sistemas ya recibieron para evitar repetir efectos. Respaldo, conmutación y recuperación operativa están relacionados, pero no quedan demostrados por dibujar una copia adicional.

## 00:33:09 · Preguntas para comprobar el diseño

### 00:33:09 · ¿Puedo vender si no hay internet?

Depende de la falla y de la operación. Con red local, servidor y PostgreSQL disponibles, podrías confirmar una venta permitida usando datos y autorización válidos. El ejemplo en efectivo exige modalidad fiscal aprobada. Si falta la autoridad local o una capacidad externa necesaria, detenemos los comandos afectados. La respuesta enumera condiciones comprobables: decir solamente que funciona sin conexión oculta los límites que el cajero necesita conocer.

### 00:33:40 · ¿Un mensaje confirmado ya quedó aplicado?

Pregunta quién confirmó. RabbitMQ puede confirmar custodia sin aplicación del mensaje. El consumidor reconoce después de confirmar su efecto local. El país, en nuestro contrato HTTPS, responde aplicado después de confirmar entrada, efecto y salida. Si se pierde la respuesta, puede haber repetición. La protección viene de identidades estables y efectos idempotentes en cada límite, no de ejecutar mágicamente una sola vez entre sistemas.

### 00:34:12 · ¿Basta descargar la lista de precios otra vez?

No basta. Necesitamos una candidata completa, compatible y validada. Debe publicarse sin retroceder la versión activa ni separar el efecto de su cursor aplicado. Descargar los mismos datos no extiende antigüedad autorizada ni vigencia comercial. Una venta conserva su versión y comprueba la política al confirmar. La respuesta conecta integridad, orden y reglas comerciales: tener un archivo en disco es solo una etapa del contrato.

### 00:34:42 · El piloto debe demostrar estas cuatro propiedades

Antes de aceptar el piloto, provoquemos cortes después de cobrar, después de confirmar y antes del acuse. Verifiquemos que repetir no duplica efectos, que ninguna lista incompleta se publica y que restaurar conserva trazabilidad. Midamos los objetivos acordados con carga y fallas representativas. Los diagramas y ejemplos ayudan a formular estas pruebas. La evidencia del piloto permitirá ajustar la propuesta y explicar qué puede prometer la operación.

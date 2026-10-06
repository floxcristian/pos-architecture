# Una plataforma POS corporativa para múltiples países

Narración sintética en español. Ejemplos didácticos de la propuesta, sin conexión a infraestructura real.

## 00:00:00 · La plataforma corporativa y su mapa

### 00:00:00 · Una plataforma POS para crecer en varios países

Imagina una empresa que opera tiendas en varios países. Cada país tiene reglas fiscales, medios de pago, dispositivos y sistemas empresariales diferentes. Queremos una plataforma corporativa de punto de venta, o POS, que comparta su núcleo y permita incorporar esas diferencias sin rehacer toda la aplicación. Ese es el objetivo principal. También necesitamos administrar sucursales, controlar permisos, consultar reportes y evolucionar versiones con trazabilidad. Mantener operaciones permitidas cuando falla internet es uno de sus requisitos de continuidad. En este recorrido veremos cómo se conectan la reutilización del producto, las extensiones por país y la confiabilidad de cada operación.

### 00:00:45 · Producto corporativo; arquitectura por validar

El producto abarca venta, caja, devoluciones, maestros, precios, reportes y administración de la operación. La misma plataforma debe poder habilitar capacidades según país, entidad legal y sucursal, conservando reglas y contratos comunes. Angular y Tauri son la dirección elegida para el cliente, y Nx organiza el desarrollo. El servidor de sucursal, PostgreSQL, los perfiles y las integraciones siguen siendo una propuesta por implementar y validar. La aplicación de demostración usa datos simulados. No acredita compatibilidad fiscal, de pagos o de dispositivos en todos los países. Esa cobertura se construye y se homologa de forma explícita.

### 00:01:30 · C1: la plataforma y sus integraciones por país

Esta vista de contexto pertenece al modelo C4: contexto, contenedores, componentes y código. El cajero vende, cobra y gestiona su turno desde el punto de venta. El supervisor autoriza excepciones y revisa cierres; su responsabilidad es distinta de la del cajero. Operación de plataforma supervisa incidentes, sincronización y recuperación mediante soporte autorizado. La fuente externa de maestros y precios publica datos y reglas comerciales autorizados. El proveedor de pagos autoriza o informa resultados mediante un contrato propio. El proveedor fiscal emite o transmite documentos según el país y la modalidad permitida. El sistema empresarial del país recibe y concilia documentos financieros, conservando su responsabilidad externa. La flecha de maestros al POS expresa una responsabilidad, no una llamada de programación. Recibir datos no transfiere propiedad sobre precios, inventario o contabilidad.

### 00:02:30 · Compartir el núcleo, aislar las variaciones

Separaremos tres responsabilidades. El núcleo comparte los casos de uso y las reglas realmente comunes: venta, caja, identidad de operación y auditoría. Un perfil aprobado selecciona políticas y módulos de país, con moneda, impuestos, documentos y capacidades permitidas. Los adaptadores conectan proveedores fiscales, pagos, impresoras y sistemas empresariales mediante contratos tipados. Por ejemplo, otra sucursal puede seleccionar una impresora ya homologada. Un proveedor con protocolo distinto puede requerir un adaptador nuevo. Configurar sirve cuando la capacidad ya existe. Una regla nueva puede exigir un módulo o cambiar un contrato, con desarrollo y pruebas. Buscamos cambios delimitados y verificables, sin copiar el POS por país ni repartir condiciones por todas las pantallas.

## 00:03:24 · Sucursal, país y conectividad

### 00:03:24 · C2: procesos con responsabilidades concretas

Un contenedor C4 representa una aplicación o un almacén de datos, no necesariamente Docker. La terminal ejecuta Angular dentro de Tauri. Presenta la caja y envía comandos del operador. El backend de sucursal recibe esos comandos, aplica las reglas y confirma la operación compartida. PostgreSQL de sucursal guarda el negocio, la salida pendiente y el espejo comercial autorizado. El sincronizador entrega eventos y actualiza espejos. Intercambia información con la interfaz del país. La API de país recibe lotes y sirve publicaciones. Confirma sus efectos en PostgreSQL de país. La base de país conserva proyecciones, publicaciones y referencias duraderas de entrega e integración. Los workers de país publican versiones e integran los pendientes que ya quedaron confirmados. El adaptador empresarial traduce contratos y concilia resultados. Cambiar esa conexión no reparte reglas de venta entre las cajas.

### 00:04:27 · Sin internet no significa sin red local

WAN significa red de área amplia: aquí conecta la sucursal con el país. LAN significa red de área local: aquí conecta las cajas con su servidor. Si cae la WAN, una venta permitida podría continuar usando datos locales válidos. Si cae la LAN o el servidor, la caja pierde la autoridad compartida que necesita para confirmar. Son fallas diferentes. La propuesta base no convierte cada terminal en un servidor independiente al detectar una desconexión. Esa autonomía adicional exigiría otro diseño y nuevas reglas de coordinación.

### 00:05:04 · Una venta local posible: efectivo y reglas vigentes

Tomemos un ejemplo acotado: pago en efectivo, sesión autorizada, precios vigentes y una modalidad fiscal previamente aprobada para ese escenario. La caja envía el comando por la red local. El servidor valida y registra la venta; la entrega al país queda pendiente. La falta de internet no renueva permisos vencidos ni promociones caducadas. Tampoco habilita tarjetas desconectadas, cupones compartidos o saldos globales por sí sola. Cada capacidad necesita una política y una autoridad disponibles. Continuidad significa conservar estas condiciones, no saltarse las validaciones.

### 00:05:44 · Despliegue: dónde vive cada responsabilidad

El despliegue ubica terminales, servidor de sucursal y plataforma de país en entornos diferentes. En cada terminal se ejecuta el cliente de caja, conectado al servidor compartido de la sucursal. PostgreSQL tiene un primario autorizado por sucursal; los puestos comparten ese almacenamiento de negocio. La relación del backend con PostgreSQL expresa autoridad de escritura, no una sola conexión. El sincronizador funciona como proceso supervisado en la sucursal y dispone de permisos acotados. En la plataforma de país, la API recibe comunicación de las sucursales y sirve publicaciones. El respaldo conserva copias y permite ensayar restauraciones. Tenerlo no demuestra conmutación automática ni alta disponibilidad. Redundancia, energía y recuperación deben responder a objetivos acordados y comprobarse en el entorno real.

## 00:06:39 · Datos y transacciones

### 00:06:39 · Antes de elegir una base, elegimos quién manda

La sucursal es responsable de su historia operativa de ventas. El país conserva las proyecciones y referencias necesarias para recibir e integrar esas operaciones, sin convertirse en otro autor concurrente de la misma venta. Los precios y maestros necesitan una autoridad definida por atributo y país; no asumimos que todo provenga del sistema empresarial. Una copia de lectura permite consultar, pero no otorga derecho a gastar un saldo compartido. Separar propiedad, lectura y escritura reduce conflictos antes de discutir herramientas o formatos de mensajes.

### 00:07:15 · Por qué recomendamos PostgreSQL

Una venta relaciona cabecera, líneas, movimientos de caja, evidencias y mensajes pendientes. PostgreSQL permite expresar relaciones, restricciones y transacciones para mantener coherente ese conjunto. También ofrece JSONB, un formato de documentos que puede alojar cargas variables sin abandonar el modelo relacional. La recomendación responde a estas necesidades, no a que otras bases carezcan de transacciones. MongoDB sí soporta transacciones sobre varios documentos. Su evaluación debe considerar el modelo, la operación y la migración existentes. Tampoco estamos afirmando que las bases actuales ya hayan sido reemplazadas.

### 00:07:58 · SQLite no es la base compartida de todas las cajas

SQLite es una base integrada útil para almacenamiento local de una aplicación. Eso no la transforma en un servidor compartido entre terminales. Por ejemplo, su modo WAL, que registra cambios antes de consolidarlos, requiere que los procesos participantes estén en el mismo equipo y no funciona sobre un sistema de archivos de red. Una futura caja con autonomía propia podría evaluarla, junto con durabilidad, identidad y conflictos. Ese perfil no está aprobado como comportamiento base. Hoy proponemos que las terminales compartan el servidor y PostgreSQL de la sucursal.

### 00:08:36 · Una transacción confirma un conjunto completo

SQL es el lenguaje con que expresamos operaciones en esta base. Una transacción agrupa cambios que se confirman o se deshacen juntos. Aquí, venta, movimiento de caja, auditoría y mensaje pendiente pertenecen a la misma unidad. Las instrucciones abreviadas representan escrituras validadas; no son un programa para copiar. Todas usan la misma conexión. Si una falla, revertimos el conjunto. No mantenemos esta transacción abierta mientras esperamos internet, una impresora o un proveedor de pagos: mezclaríamos demoras externas con bloqueos locales.

## 00:09:14 · Una venta paso a paso

### 00:09:14 · C3: núcleo común y puertos de integración

El backend recomendado de sucursal es un monolito modular: sus componentes comparten un proceso. Acceso y permisos recibe el contexto del comando y autoriza usuario, perfil y sucursal. Ventas y devoluciones coordina el ciclo de la operación y sus reglas de negocio. Precios y ofertas calcula la cotización desde una versión comercial local que sigue vigente. Turnos y caja controla apertura, movimientos y cierre, manteniendo coherente la operación de caja. El puerto de pagos gestiona intentos y evidencia. Se comunica con el proveedor mediante su contrato. El puerto fiscal aplica la modalidad del país y conversa con su proveedor mediante otro contrato. Persistencia transaccional delimita las escrituras locales: negocio, auditoría y salida pendiente se confirman juntos. La API de comandos recibe las solicitudes del cliente. La interfaz no decide por su cuenta las reglas financieras.

### 00:10:12 · La intención de venta recibe una identidad estable

El cajero confirma una compra de dos productos. El cliente envía una intención identificable, no una orden genérica de cobrar cualquier monto. El servidor valida artículos, versión de precios, permisos y sesión de caja; después conserva una referencia estable para la operación de pago cuando corresponda. Esa referencia nos permite reconocer un reintento después de una caída. Si el mismo identificador llega con un monto distinto, no lo tratamos como repetición válida. La identidad debe acompañar el contenido y el alcance autorizado, no sustituir sus comprobaciones.

### 00:10:50 · Cobrar y confirmar son pasos separados

Con la intención guardada, el sistema solicita el pago por la ruta autorizada y registra la evidencia recibida. Si el resultado permite continuar, ejecuta una transacción corta para confirmar la venta y sus efectos locales. La llamada al proveedor ocurre fuera de esa transacción. Esto deja una situación importante por resolver: el proveedor podría aprobar y la confirmación local podría fallar. La intención y la evidencia deben permitir recuperar el caso, conciliarlo o tramitar una reversa trazable. Lanzar otro cobro para arreglar el error agravaría el problema.

### 00:11:27 · El contrato de confirmación en ocho líneas

Leamos el ejemplo después de entender el recorrido. Confirmar venta recibe una intención cuya evidencia de pago y política fiscal ya permiten avanzar. La función transacción representa una misma conexión local y revierte todas las escrituras si alguna falla. Dentro guardamos venta, caja, estado fiscal, auditoría y salida pendiente. Fuera queda cualquier llamada al proveedor. Estos nombres describen contratos del diseño; no corresponden a una biblioteca existente. Antes de responder éxito, el servidor debe haber confirmado el conjunto y poder devolver la misma respuesta ante una repetición válida.

## 00:12:07 · Pagos y estados inciertos

### 00:12:07 · El proveedor no respondió: resultado desconocido

La terminal envía un cobro y vence el tiempo de espera. Eso describe la comunicación, no el resultado financiero: el proveedor podría haber aprobado. Conservamos la intención y marcamos el pago como desconocido. Si la integración homologada permite consultar por referencia, consultamos; de lo contrario, seguimos el procedimiento de conciliación e intervención. Mientras exista incertidumbre, bloqueamos otro intento incompatible. Cambiar automáticamente de proveedor tampoco elimina el posible primer cargo: podría crear un segundo cobro.

### 00:12:43 · Fiscalidad e impresión también tienen su estado

Supongamos que la venta quedó registrada, pero la impresora dejó de responder. Reimprimir el comprobante no debe crear otra venta. Si el problema es fiscal, debemos mostrar el estado fiscal real y aplicar la modalidad permitida para ese país y operación. Una entrega pendiente al país no autoriza emisión fiscal pendiente por sí sola. Cada paso conserva su referencia y su historial. Así soporte distingue una falla del dispositivo, una respuesta externa pendiente y una operación local todavía no confirmada.

### 00:13:17 · El puente nativo ejecuta una intención autorizada

Algunos equipos de pago requieren un SDK, un kit de desarrollo que entrega el proveedor para controlar el dispositivo. Si ese camino se homologa, Tauri puede alojar un puente nativo. El cliente transmite el comando original autorizado por el servidor: importe, referencia y alcance. El puente no inventa otro monto ni concede permisos. La ruta directa desde el servidor es una alternativa según la integración; no debemos ejecutar ambas para un mismo intento. El resultado vuelve como evidencia verificable.

### 00:13:51 · ¿Y si el pago se aprobó y luego se apagó el servidor?

La respuesta no es volver a cobrar. Primero buscamos la intención duradera y la evidencia disponible. Después consultamos el proveedor si existe esa capacidad homologada, o conciliamos mediante el procedimiento acordado. Debemos determinar si corresponde completar la operación local, revertir el pago o intervenir con trazabilidad. Por eso guardamos la intención antes del efecto externo. La recuperación debe soportar una interrupción entre cualquier par de pasos; suponer que el proceso siempre llegará a la última línea ocultaría este caso.

## 00:14:26 · Entrega sin duplicar efectos

### 00:14:26 · La secuencia completa: venta y entrega al país

La secuencia de venta usa los mismos participantes de ejecución que la vista de contenedores. Primero, el servidor consulta PostgreSQL y valida turno, permisos, precios y capacidad para operar. Después persiste una intención con identidad estable, antes de producir cualquier efecto de pago. El proveedor devuelve un resultado y una referencia. Esta continuación requiere evidencia suficiente para confirmar. El servidor confirma venta, caja, auditoría y salida pendiente dentro de una sola transacción local. El sincronizador envía el lote a la API de país, conservando identidades y secuencia. El país reconoce duplicados y confirma entrada, efecto y salida en una transacción local. Solo después de confirmar, la API devuelve el acuse de aplicación al sincronizador de sucursal. El cliente consulta venta y entrega. La integración empresarial continúa después, fuera de esta secuencia; no existe una transacción distribuida.

### 00:15:28 · La bandeja de salida evita una escritura olvidada

Una bandeja de salida transaccional, llamada outbox, guarda el mensaje pendiente en la misma transacción que la venta. Imagina que guardamos la venta y luego intentamos publicar un mensaje: una caída entre ambas acciones puede dejar la venta sin entrega. Con la bandeja, la intención de envío ya está confirmada localmente. Otro proceso la recoge después. Esto no vuelve infalible a la red ni elimina duplicados; asegura que exista trabajo duradero para reintentar, sujeto a las garantías de almacenamiento y recuperación configuradas.

### 00:16:03 · El país confirmó, pero se perdió el acuse

ACK significa acuse de recibo; aquí hablaremos de un acuse de aplicación. El país aplica el mensaje y confirma su transacción, pero la respuesta se pierde. La sucursal no puede saberlo y reenvía el mismo identificador. El registro de entrada, o inbox, reconoce la repetición y devuelve el resultado anterior sin repetir el efecto. Esta entrega admite más de un intento. Decimos al menos una vez, con aplicación idempotente: repetir la misma solicitud válida conserva el resultado de negocio.

### 00:16:38 · Entrada, efecto y nueva salida se confirman juntos

En este pseudocódigo, el país ya autenticó el origen. La entrada tiene una clave única dentro de su alcance y se protege frente a receptores concurrentes. Comparamos el contenido: reutilizar una identidad con otros datos es un conflicto. Si ya fue aplicada, devolvemos la respuesta guardada. Si es nueva, validamos orden y reglas, aplicamos el efecto local, registramos la salida posterior y marcamos la entrada. Todo ocurre en una transacción. El acuse se envía únicamente después de confirmarla.

## 00:17:13 · El sincronizador

### 00:17:13 · C3: el sincronizador tiene dos direcciones

Un proceso supervisado ejecuta el sincronizador. Su planificador decide cuándo admitir trabajo según ventanas y límites. El emisor entrega operaciones pendientes al país mediante lotes que conservan identidades estables. El receptor consulta deltas y acuses, recibiendo versiones comerciales autorizadas para la sucursal. El módulo de entrada y deduplicación comprueba identidad y orden. Reconocer un mensaje no permite publicar sin validación. La carga completa prepara una versión aislada. Los cambios incrementales también conservan intacta la versión activa. Ambos caminos pasan por el validador, que revisa integridad, cobertura y vigencia antes de publicar. La activación cambia atómicamente la versión y confirma juntos el efecto y su avance aplicado. Los permisos sobre PostgreSQL alcanzan registros técnicos y publicaciones, no la modificación libre de ventas históricas. Separar estas etapas permite observar atrasos, localizar la falla y ejecutar una recuperación concreta.

### 00:18:18 · Reclamar trabajo sin bloquear la base durante la red

Dos ejecutores podrían recoger la misma salida. Necesitamos una reclamación temporal y recuperación del trabajo abandonado. Una transacción corta reclama un lote y termina antes del envío por HTTPS, el protocolo web cifrado. Otra registra resultados, verificando que la reclamación siga vigente y pertenezca al ejecutor. PostgreSQL ofrece bloqueo de filas y omisión de filas ya bloqueadas, pero esto no garantiza orden global. El planificador limita concurrencia, espera entre fallos y busca pendientes después de reiniciarse.

### 00:18:54 · Un duplicado y un hueco son problemas diferentes

Si llega dos veces el evento cuarenta y dos, buscamos su identidad y resultado. Si llega el cuarenta y cuatro sin el cuarenta y tres, puede existir un hueco relevante. El orden se define por entidad o flujo cuando el negocio lo necesita, no por el reloj de todas las máquinas. El receptor debe retener, rechazar o solicitar recuperación según el contrato. Un lote puede contener mensajes aplicados y otros pendientes; responder un éxito global ocultaría errores. Los cursores de recibido y aplicado permanecen separados.

### 00:19:29 · Supervisar también significa saber recuperar

Reiniciar un proceso no basta para declarar recuperado el sistema. Revisamos antigüedad de pendientes, reclamaciones vencidas, errores persistentes y diferencia entre recibido y aplicado. Un reintento manual conserva la identidad original y exige autorización y registro. Los mensajes problemáticos necesitan un estado visible, sin desaparecer del seguimiento. Además, conservamos entradas y salidas durante una ventana compatible con reenvíos y restauraciones. Si un respaldo antiguo elimina el registro de deduplicación, una repetición antes inocua podría volver a producir un efecto.

## 00:20:08 · Precios por eventos

### 00:20:08 · Un precio comienza en una autoridad comercial

Un precio nuevo no se vuelve válido porque apareció en un mensaje. Una autoridad comercial definida por país y atributo aprueba una versión inmutable. El paquete identifica alcance, referencias, compatibilidad y condiciones de vigencia. Su publicación deja una salida transaccional para distribución. La sucursal conserva una copia de lectura que permite cotizar sin consultar al país por cada artículo. Esa copia no admite edición local arbitraria ni convierte al POS en dueño de todos los datos maestros o promociones.

### 00:20:42 · Un delta construye una candidata, no altera la activa

Un delta es un conjunto de cambios desde una base conocida. Por ejemplo, modifica el precio de dos artículos y agrega una promoción. El receptor conserva el mensaje y lo aplica sobre una candidata aislada. Después comprueba cobertura, referencias, orden, esquema y compatibilidad. La versión activa sigue atendiendo ventas mientras esto ocurre. Recibir o deduplicar el mensaje no permite saltarse la validación. Solo una candidata completa y válida puede publicarse mediante un cambio atómico de la referencia activa.

### 00:21:18 · Las bajas también viajan y también se recuerdan

Supongamos que una promoción dejó de existir. Si solo enviamos altas y cambios, una sucursal desconectada podría conservarla para siempre. Por eso el contrato incluye bajas explícitas, a veces llamadas marcas de eliminación. También define cuánto conservarlas para impedir que una repetición antigua resucite contenido retirado. Una carga completa declara su cobertura, de modo que ausencia y eliminación tengan significado claro. El identificador del mensaje evita duplicados; la versión, las bajas y el orden evitan reconstruir un estado comercial incorrecto.

### 00:21:55 · Cada cotización conserva su versión de precios

Mientras el cajero arma una compra, puede activarse una nueva lista. Cambiar silenciosamente una línea del carrito produciría una venta difícil de explicar. La cotización fija una versión y conserva sus referencias. Las nuevas cotizaciones usan la versión recién publicada; las abiertas siguen la política de validez y reconfirmación acordada. Antes de confirmar revisamos que todavía sea admisible. No basta con guardar el número de versión: debemos retener el contenido necesario para justificar precios, descuentos e impuestos aplicados a esa operación.

## 00:22:32 · Precios por lotes y vigencia

### 00:22:32 · La secuencia de precios combina eventos y lotes

La distribución parte de una publicación autorizada en el país y combina eventos con cargas completas. Los eventos acompañan la publicación de versión y manifiesto, reduciendo la demora entre cambios. Las cargas programadas y la recuperación manual solicitan el mismo contrato de deltas o copia completa. La API lee la publicación y su corte consistente, identificando qué cambios quedaron incluidos. El sincronizador recibe el contenido y guarda recepción y área temporal, sin cambiar la versión activa. Después prepara una candidata aislada y reproduce los cambios posteriores al corte de origen. La candidata completa se valida antes de publicarse: integridad, referencias, orden, compatibilidad y vigencia. Solo entonces una transacción activa la versión y confirma entrada aplicada y cursor aplicado juntos. La sucursal conserva una copia autorizada de lectura. Este recorrido distribuye contenido en una dirección; no replica ambas bases bidireccionalmente.

### 00:23:34 · El corte separa lo incluido de lo que llegó después

Una copia completa, llamada snapshot, necesita un corte consistente: incluye, por ejemplo, cambios hasta la posición cien. Mientras se descarga, conservamos los eventos posteriores. En un área temporal reconstruimos la base, aplicamos cambios desde ciento uno y comprobamos manifiesto, integridad y referencias. El corte corresponde al origen, no al reloj del descargador. Si faltan eventos, solicitamos recuperación; no activamos una mezcla sin continuidad demostrada.

### 00:24:07 · La activación es corta y no permite retroceder

La descarga y validación pesada terminaron fuera de esta transacción. La candidata validada es inmutable. Bloqueamos el alcance y comprobamos que base y avance sigan siendo compatibles. Una copia atrasada no puede reemplazar una versión reciente. Marcamos entradas aplicadas, cambiamos la referencia activa y avanzamos el cursor juntos. Si falla una condición, no publicamos parcialmente. Estos contratos deben probarse frente a concurrencia y reinicios.

### 00:24:39 · Antigüedad y vigencia comercial no son lo mismo

TTL significa tiempo de vida; aquí expresa el límite de antigüedad autorizado. La vigencia comercial indica cuándo un precio o promoción tiene efecto. Una promoción puede estar vigente y su copia resultar demasiado antigua. Descargar la misma versión no renueva ninguno de esos plazos. Si falla una actualización, mantenemos la anterior solo mientras siga permitida. Al confirmar una venta comprobamos ambas condiciones por separado.

## 00:25:10 · Trabajos con BullMQ

### 00:25:10 · BullMQ organiza trabajos, no confirma ventas

BullMQ programa y ejecuta trabajos, como reconciliar precios de madrugada. La evaluamos como opción en el país, usando Redis en este ejemplo. Redis coordina la cola y requiere configurar persistencia y memoria. BullMQ también ofrece PostgreSQL como motor alternativo; elegirlo no vuelve atómica cualquier escritura de negocio. La base de la sucursal sigue siendo su bandeja transaccional. No agregamos una cola obligatoria en cada tienda.

### 00:25:41 · Programar una reconciliación con zona horaria

Queremos reconciliar diariamente a las tres de la mañana en Chile. La API, o interfaz de programación, de BullMQ recibe identidad del planificador, horario y plantilla. La conexión ya está configurada. Esto programa intención de ejecución; no garantiza puntualidad bajo carga ni reproduce automáticamente las ventanas perdidas. El trabajo debe detectar qué período o versión necesita reconciliar y registrar su resultado de forma idempotente.

### 00:26:11 · Una solicitud manual también debe sobrevivir

Un supervisor solicita reconciliar una sucursal. Registramos la solicitud autorizada y su salida en PostgreSQL. Un publicador recuperable agrega el trabajo a BullMQ con referencia estable. Si repite el envío, la identidad de la cola ayuda mientras ese trabajo exista. Al eliminarlo, esa protección termina; el dominio conserva su propia idempotencia. La solicitud manual y la programada ejecutan las mismas validaciones y generan evidencia comparable.

### 00:26:43 · Reintentar tiene presupuesto y puede repetirse

Permitimos tres intentos y espera creciente entre fallos. La reconciliación es un contrato del negocio: repetirla debe ser seguro. Un reinicio o pérdida de la reclamación puede provocar otra ejecución. Al agotar el presupuesto, mostramos el fallo y recuperamos con autorización. Un reintento manual no reinicia automáticamente el contador acumulado. Una implementación completa también necesita manejo de errores de conexión, alertas y cierre ordenado.

## 00:27:14 · Mensajes con RabbitMQ

### 00:27:14 · RabbitMQ distribuye mensajes entre consumidores

RabbitMQ es un intermediario de mensajes. Puede servir cuando varios consumidores necesitan eventos: por ejemplo, integración empresarial e informes. BullMQ organiza trabajos; RabbitMQ enruta mensajes hacia colas. Ninguno reemplaza las reglas transaccionales del consumidor. La propuesta base usa PostgreSQL y lotes por HTTPS sin exigir un intermediario. Incorporarlo en el país debe responder a una necesidad medida y contemplar operación, monitoreo y recuperación explícitos.

### 00:27:48 · Una cola por consumidor lógico conserva las copias

Un exchange enruta mensajes hacia colas según sus enlaces. Usamos tipo topic: una clave como venta confirmada coincide con reglas de suscripción. Las colas empresarial y de informes reciben copias independientes si ambas coinciden. Los ejecutores de una misma cola compiten por mensajes; no reciben todos una copia. Configuramos durabilidad y tipo de cola. Difundir a varios consumidores no exige específicamente un exchange de tipo fanout.

### 00:28:19 · La confirmación del intermediario no es aplicación

Este fragmento supone un canal de confirmación y un solo mensaje en vuelo. Esperamos la confirmación del intermediario y observamos devoluciones. La opción mandatory permite detectar que no hubo ninguna cola de destino. No demuestra que todas las suscripciones esperadas existan. Incluso un mensaje sin ruta puede recibir confirmación; por eso comprobamos ambas señales. Registrar custodia del intermediario no afirma que el consumidor aplicó el negocio. El valor booleano de publicar expresa presión de salida, no ese resultado.

### 00:28:55 · El consumidor confirma después de su transacción

El consumidor usa acuse manual. Primero confirma entrada, efecto y salida en su base; después reconoce el mensaje. Si cae entre ambos pasos, tolerará una entrega repetida. La política de fallos limita reintentos y deriva casos persistentes a una cola de mensajes problemáticos, conocida como DLQ. Esa transferencia necesita configuración y verificación: no es segura por defecto en cualquier topología. Conservamos referencias y mecanismos de recuperación; reenviar sin límite solo escondería el incidente.

## 00:29:30 · Fachadas e integración empresarial

### 00:29:30 · La fachada conserva una capacidad común

Una fachada ofrece una capacidad estable al núcleo POS. Imagina dos países que usan sistemas empresariales diferentes. Ambos solicitan registrar una operación mediante el mismo contrato de negocio, y la integración selecciona el destino aprobado. La fachada coordina esa capacidad; los adaptadores resuelven los detalles externos. Esto permite cambiar una integración sin reescribir las pantallas y los casos de uso comunes. El resultado sigue siendo explícito: recibido, pendiente o aceptado tienen significados distintos. La fachada no convierte llamadas remotas en una transacción ni exige crear otro servicio. Su ubicación responde al límite operativo de la integración.

### 00:30:15 · ACL aquí significa capa anticorrupción

ACL viene del inglés Anti-Corruption Layer: capa anticorrupción, no lista de permisos. Protege el modelo común frente al vocabulario de cada país y proveedor. Por ejemplo, emitido puede significar algo distinto en dos sistemas empresariales. Traducimos y validamos esa equivalencia sin convertir todos los resultados externos en éxito. La fachada presenta una capacidad; el adaptador resuelve protocolo y conexión; la capa anticorrupción protege el significado. Pueden colaborar dentro del mismo módulo. Las reglas fiscales propias del país necesitan políticas explícitas: la capa de traducción no sustituye ese negocio ni vuelve equivalentes operaciones que son diferentes.

### 00:31:00 · El contrato conserva moneda y significado

Para reutilizar el POS entre países, un importe conserva moneda y precisión explícitas. No asumimos que todas las monedas, reglas de redondeo o clasificaciones fiscales sean iguales. Este destino de ejemplo espera unidades mínimas y códigos propios. La traducción usa las equivalencias aprobadas para su contrato. Si falta una equivalencia, dejamos un pendiente visible; no inventamos un impuesto ni redondeamos por conveniencia. Conservamos la identidad original para conciliar respuestas y reintentos. Estas funciones son ilustrativas. Una nueva combinación de país y destino requiere pruebas de contrato y regresión de las combinaciones que ya soportamos.

### 00:31:44 · Incorporar un país: configurar o extender

Agregar un país empieza por identificar sus diferencias. Si la combinación ya está soportada, resolvemos un perfil aprobado: base corporativa, país, entidad legal, sucursal y caja, con excepciones limitadas a campos permitidos. Una caja puede seleccionar una impresora compatible; no ampliar su permiso fiscal. Si aparecen reglas, proveedores o capacidades nuevas, desarrollamos la extensión o el contrato necesario y lo homologamos. No todo se resuelve cambiando configuración. Al migrar un ERP, el sistema empresarial administrativo, también conservamos destino y versión contractual de las operaciones históricas. Publicamos el perfil nuevo con compatibilidad y conciliación comprobadas.

## 00:32:30 · Construcción y operación

### 00:32:30 · Nx protege el núcleo y sus extensiones

Nx organiza proyectos, dependencias y tareas. Podemos separar el núcleo POS compartido, los contratos por capacidad y las extensiones de país o proveedor. El núcleo depende de esos contratos; los adaptadores implementan las conexiones particulares. Las reglas de importación evitan que una pantalla o una biblioteca de negocio incorpore directamente el SDK de un proveedor. Al cambiar una extensión, comprobamos su contrato y la regresión del producto común. Nx ayuda a aplicar esos límites, pero no autentica solicitudes ni decide cuántos procesos existen. Mantener una plataforma exige también responsables de módulos, versiones y pruebas de compatibilidad.

### 00:33:14 · Gobernar módulos, dispositivos y versiones

Tauri empaqueta la interfaz y permite capacidades nativas controladas. La plataforma mantiene un catálogo de combinaciones homologadas: cliente, servidor, contrato, adaptador, sistema operativo y dispositivo. Un perfil aprobado habilita los módulos que corresponden a cada alcance. Ocultar un botón no revoca un permiso: el servidor también autoriza la operación y comprueba su disponibilidad. Una actualización se prueba y se despliega gradualmente, con recuperación compatible y trazabilidad de versiones. Retirar un adaptador exige resolver o conservar el acceso a sus operaciones pendientes. Esa gestión permite evolucionar la flota corporativa sin instalar una aplicación distinta para cada país.

### 00:34:01 · Operar varios países con contexto y trazabilidad

Una plataforma corporativa necesita localizar una operación por país, entidad legal, sucursal y caja, además de sus referencias de venta, pago y evento. Los reportes y el soporte respetan el alcance de cada rol. No sumamos importes de monedas distintas como si fueran equivalentes: una consolidación requiere reglas explícitas. Para operar, medimos pendientes, reintentos, pagos desconocidos y versiones próximas a vencer. Un proceso vivo no demuestra que el negocio esté al día. Los registros conservan contexto y acceso controlado, sin datos sensibles innecesarios. Así podemos administrar varios países y explicar sus diferencias desde una plataforma común.

### 00:34:45 · Restaurar debe probar datos y entregas pendientes

RPO expresa pérdida tolerable de historial medida en tiempo; RTO expresa tiempo de recuperación aceptable. Acordamos esos objetivos y comprobamos si el diseño los cumple. Una restauración debe revisar ventas, evidencias, entradas, salidas, cursores y versiones. También considera lo que otros sistemas ya recibieron para evitar repetir efectos. Respaldo, conmutación y recuperación operativa están relacionados, pero no quedan demostrados por dibujar una copia adicional.

## 00:35:18 · Preguntas para comprobar el diseño

### 00:35:18 · ¿Un nuevo país exige rehacer el POS?

La propuesta busca conservar el núcleo POS y delimitar el cambio. Primero identificamos moneda, reglas fiscales, documentos, proveedores y dispositivos del nuevo país. Si existe una combinación homologada, la seleccionamos mediante un perfil aprobado. Si falta una capacidad, implementamos y probamos su política, módulo o adaptador; podemos necesitar evolucionar un contrato. Luego verificamos que los países ya soportados sigan funcionando. No prometemos incorporar cualquier país sin desarrollo. El éxito consiste en reutilizar el producto y controlar sus variaciones. La continuidad sin internet sigue siendo un requisito adicional, condicionado por las capacidades permitidas en cada operación.

### 00:36:05 · ¿Un mensaje confirmado ya quedó aplicado?

Pregunta quién confirmó. RabbitMQ puede confirmar custodia sin aplicación del mensaje. El consumidor reconoce después de confirmar su efecto local. El país, en nuestro contrato HTTPS, responde aplicado después de confirmar entrada, efecto y salida. Si se pierde la respuesta, puede haber repetición. La protección viene de identidades estables y efectos idempotentes en cada límite, no de ejecutar mágicamente una sola vez entre sistemas.

### 00:36:37 · ¿Basta descargar la lista de precios otra vez?

No basta. Necesitamos una candidata completa, compatible y validada. Debe publicarse sin retroceder la versión activa ni separar el efecto de su cursor aplicado. Descargar los mismos datos no extiende antigüedad autorizada ni vigencia comercial. Una venta conserva su versión y comprueba la política al confirmar. La respuesta conecta integridad, orden y reglas comerciales: tener un archivo en disco es solo una etapa del contrato.

### 00:37:07 · El piloto debe demostrar una plataforma reutilizable

El piloto debe demostrar el objetivo corporativo: incorporar una segunda variante de país aprobada sin duplicar el POS. Usaremos configuración para soporte existente y extensiones delimitadas cuando haga falta, verificando que la primera variante conserve su comportamiento. También probaremos permisos, reportes, contratos y compatibilidad de proveedores y dispositivos. Una actualización debe poder desplegarse gradualmente y conservar trazabilidad. Y mantendremos las pruebas de confiabilidad: cortes después del pago, reenvíos, precios incompletos y restauraciones. Operar sin internet es parte de esta evidencia. El resultado esperado es una plataforma reutilizable, gobernable y confiable para crecer entre países.

---
title: Glosario del POS
description: Significado de los términos de la propuesta POS Platform y enlaces a su diseño concreto.
editUrl: false
---

Estas definiciones precisan el uso de los términos **en esta propuesta**. Los enlaces llevan al contrato, comportamiento o decisión correspondiente.

| Término | Significado en POS Platform | Detalle |
| --- | --- | --- |
| Módulos de negocio compartidos | Casos de uso y reglas reutilizables de venta, caja, precios y otras capacidades; conservan límites de responsabilidad y datos. | [Producto](/guide/proposal/product/) |
| Backend de sucursal | Servicio local que recibe operaciones de las cajas por LAN y confirma transacciones en PostgreSQL de la tienda. Es lo que material anterior llamaba «núcleo local». | [Aplicaciones y datos](/guide/proposal/architecture/) |
| Plataforma de país | Aplicaciones y datos que reciben operaciones, distribuyen maestros e integran los sistemas de una jurisdicción y entidad legal. | [Arquitectura](/guide/proposal/architecture/) |
| Perfil de país | Configuración aprobada que selecciona capacidades, reglas y adaptadores compatibles. No sustituye el código de un proveedor nuevo. | [Producto y variantes](/guide/proposal/product/#objetivo-de-producto-y-criterios-de-evolución) |
| Perfil de usuario | Agrupación de accesos de una persona. Mountain ya tiene perfiles y accesos a módulos; la autorización detallada propuesta necesita acordarse. | [Acceso y permisos](/guide/proposal/access-operations/) |
| Capacidad efectiva | Operación permitida por configuración, identidad, conectividad, vigencia de datos y disponibilidad real de sus dependencias. | [Proveedores](/guide/architecture/providers/#4-configuración-tipada-y-capacidades-efectivas) |
| Perfil WAN | Continuidad ante pérdida de Internet mientras LAN, backend y base de sucursal siguen disponibles. | [Continuidad](/guide/proposal/continuity/) |
| Autoridad de un dato | Sistema responsable de aceptar y conservar sus cambios válidos; una copia de consulta no adquiere esa autoridad. | [Propiedad de datos](/guide/proposal/synchronization/#propiedad-de-datos-y-conflictos) |
| Commit | Confirmación de una transacción en la base responsable. El commit de venta local no equivale a contabilización ERP ni liquidación del pago. | [Confirmación de venta](/guide/proposal/continuity/#confirmación-local-de-una-venta) |
| Outbox | Registro de eventos pendientes, persistido en la misma transacción que el cambio de negocio. | [Sincronización](/guide/proposal/synchronization/) |
| Inbox | Registro durable de mensajes recibidos que permite detectar duplicados y recuperar su procesamiento. | [Sincronización](/guide/proposal/synchronization/) |
| ACK o acuse | Confirmación cuyo alcance debe nombrarse: recibir transporte, persistir en central y aplicar en ERP son hechos distintos. | [Entrega durable](/guide/proposal/synchronization/) |
| Idempotencia | Repetir la misma operación identificada no debe crear otro efecto de negocio. Requiere contratos y persistencia; no la garantiza por sí solo un broker. | [Sincronización](/guide/proposal/synchronization/) |
| Snapshot y delta | Paquete completo y cambio incremental de una versión de datos. Deben validarse antes de activar la nueva versión. | [Precios](/guide/proposal/pricing-promotions/) |
| Fachada | Entrada estable que coordina un caso de uso o simplifica el acceso a una capacidad sin exponer todas sus dependencias. | [Contratos y fronteras](/guide/proposal/contracts/#acl-fachada-y-adaptador) |
| ACL | Capa anticorrupción que traduce significado entre el modelo del POS y un sistema externo. En este contexto no significa una lista de permisos. | [ACL](/guide/proposal/contracts/#acl-fachada-y-adaptador) |
| Adaptador | Implementación de un contrato para un ERP, proveedor o dispositivo concreto. | [Proveedores](/guide/architecture/providers/) |
| Conciliación | Comparación de evidencias para resolver diferencias o resultados inciertos entre POS, pagos, fiscalidad y ERP. | [Integración](/guide/proposal/integration/#contrato-común-y-conciliación) |
| Contenedor C4 | Aplicación o almacén de datos en el modelo arquitectónico; no implica que se despliegue con Docker. | [Modelo C4](/guide/architecture/c4-model/) |
| Monorepo | Organización del código de varios proyectos relacionados. Sus aplicaciones pueden ejecutarse y desplegarse de manera independiente. | [Estructura y límites](/guide/architecture/monorepo/) |
| BullMQ / RabbitMQ | Alternativas de coordinación de trabajos y distribución de mensajes que requieren un caso de uso y operación justificados. | [Evaluación de mensajería](/guide/architecture/messaging/) |
| Homologación | Evidencia de compatibilidad de una combinación de país, reglas, versiones, proveedor y dispositivo para las operaciones admitidas. | [Validación](/guide/operations/validation/) |

# Plataforma corporativa: qué hacer visible en el nuevo POS

Revisión acotada, **1 de octubre de 2026**. Source: `automated-audit`. Son cinco observaciones de **adopción para el POS**, no nuevos incidentes ni una reapertura del registro de auditoría de `core`.

Snapshots contrastados por lectura de Git: `core@f43688abeda81d9935744c74994691df28dd6b1a`, `devops-platform@fd423a6f2f4955bd650ee6aebba154d93c0425b8` e `integration-presentations@f96fd2d810b528517af75acea048b339beb2c284`. No acreditan producción. Se revisaron los informes existentes, `repos/core/AGENTS.md`, las reglas aplicables de auditoría y los registros de baseline/pospuestos/activos para no presentar decisiones aceptadas como defectos nuevos. No se ejecutaron aplicaciones, pruebas corporativas, pipelines ni conexiones externas. No se leyeron archivos de credenciales o secretos.

## WPL-01 · El monolito modular delimita responsabilidades; la autonomía exige otro dibujo

**Actual comprobado.** `core` compone Nest con el adaptador Fastify [S01]. Nx controla dependencias por tags, pero permite infraestructura desde application para composición; eso no es por sí mismo una infracción [S02]. Una regla específica evita ciertas reexportaciones de infraestructura a consumidores del módulo y declara sus límites de análisis [S03]. Es una base reutilizable de organización y controles, no una prueba de que cualquier módulo pueda correr desconectado.

**Actual → objetivo.** Mostrar dos niveles distintos: **código** —módulos y fachadas— y **ejecución** —escritor de sucursal, PostgreSQL local, sincronizador y servicios centrales—. La fachada ofrece una capacidad de otro módulo; la ACL traduce un sistema externo. Ninguna introduce una llamada de red por definición. Un monorepo tampoco obliga a desplegar todo junto ni a copiar todos los módulos de ecommerce.

**Propuesta concreta.** En sucursal, ventas/caja/pagos recibidos/precios-ofertas/fiscalidad/sincronización exponen contratos explícitos. El módulo dueño conserva sus escrituras. Reutilizar controles y convenciones corporativas por versiones; revisar dependencias transitivas antes de adoptar una biblioteca. Usar dominio rico donde existan invariantes monetarias; no imponer cinco capas a cada pantalla de consulta.

**Escenario para juniors.** «Desconectamos WAN. Dos módulos siguen llamándose dentro del runtime local, pero una fachada cuyo adaptador consulta una API central falla». Botón sugerido: revelar la dependencia remota. Enseña que el nombre “facade” no acredita offline.

**Criterio de cierre.** Grafo de dependencias y composición del artefacto POS identifican qué requiere red; una venta permitida conserva sus reglas con WAN caída. La pérdida de LAN/escritor se trata aparte. No se crea un segundo escritor implícito en el PC.

## WPL-02 · La ACL reduce el impacto del cambio ERP; el destino histórico pertenece a la operación

**Actual comprobado.** El módulo ERP del `sync-worker` registra AX y mock; el HTTP custom figura como trabajo futuro comentado [S04]. Las presentaciones declaran una migración con cambios nulos en varios componentes [S05], pero otra vista enseña al worker leyendo SQL de AX sin ACL [S06]. Las láminas explican intención y no demuestran cobertura implementada de Perú/España.

**Actual → objetivo.** Mostrar un **contrato POS por capacidad** —registrar venta, consultar resultado, consultar histórico, aplicar reversa cuando exista— y adaptadores con su evidencia. País no equivale a ERP, y “tres países” no acredita tres implementaciones completas. Gira es el sistema informado para España; sus capacidades deben verificarse.

**Propuesta concreta.** Persistir origen/destino, empresa, versión de contrato/mapeo y referencias externas con la operación. Durante el corte, las operaciones nuevas independientes pueden usar el perfil nuevo; consultas, pendientes y reversas conservan el vínculo original. Inventariar también lecturas SQL y mapeos fuera de la ACL. No prometer consulta recuperable si el proveedor carece de ella.

**Escenario para juniors.** «Chile cambia de ERP mientras una sucursal está desconectada. Llega una venta antigua después del corte». Dos botones: “enrutar por configuración actual” versus “resolver por vínculo persistido”. La opción correcta preserva el destino histórico y aplica el protocolo de migración; no usa la hora de llegada ni reenvía un resultado incierto a otro ERP.

**Criterio de cierre.** Matriz país × capacidad × adaptador × pruebas; ensayo con pendientes anteriores al corte, respuesta tardía y consulta/reversa histórica. El contrato estable tiene prueba de compatibilidad, no solo una interfaz TypeScript.

## WPL-03 · Reutilizar AuthN/AuthZ exige definir qué autoridad puede operar offline

**Actual comprobado.** `UnifiedAuthModule` registra primero autenticación y luego autorización [S07]. Un camino JWT valida firma/expiración y después consulta blacklist y, si fue configurado, el puerto de revocación por identidad [S08]. La ausencia de blacklist en la ruta protegida deniega; el enriquecimiento opcional de rutas públicas tiene otro tratamiento [S09]. Esa diferencia deliberada no debe trasladarse a permisos de caja.

**Actual → objetivo.** Mostrar por separado **persona**, **terminal/sucursal**, **permiso de operación** y **vigencia de la política local**. Un JWT válido no prueba por sí solo permiso para devolver dinero, usar crédito, consumir una NC o emitir un documento offline. Tener copia de la política tampoco permite conocer una revocación central recién ocurrida.

**Propuesta concreta.** Evaluar un paquete/grant local verificable y limitado por identidad, sucursal, capacidades y vigencia, con aprovisionamiento/rotación del dispositivo, control de reloj y política explícita al vencer. Sin acceso al centro, la revocación inmediata no puede prometerse: negocio debe aceptar un límite de exposición o restringir esa capacidad. El centro vuelve a autenticar el emisor y valida su ámbito; no confía en un país/sucursal recibido como texto libre del cliente. Credenciales y permisos humanos no se reutilizan como identidad del sincronizador.

**Escenario para juniors.** «Una persona fue revocada en el centro cuando la tienda perdió WAN». Mostrar el momento de la última política, su vencimiento y las capacidades permitidas/restringidas. No presentar “desactivar guard” o `@Public()` como modo offline.

**Criterio de cierre.** Ensayo de vencimiento, reloj alterado, terminal revocado, reinicio sin WAN y reconexión. Decisión del responsable de seguridad/operación sobre continuidad, custodia local y ventana de revocación; sin TTL inventado ni autorización ilimitada.

## WPL-04 · Desplegar cloud y actualizar una sucursal son dos ciclos de entrega

**Actual comprobado.** Las acciones examinadas despliegan servicios Cloud Run. El manifiesto dirige 100 % a la revisión latest [S10]; la acción sustituye el servicio y después ajusta tráfico, por lo que no demuestra aislamiento inicial sin tráfico para una candidata [S11]. El build puede producir `image-digest=unknown` [S12]. El smoke HTTP descarta el body y comprueba respuesta de endpoints; no acredita una venta ni compatibilidad de esquema [S13]. Son límites de esas rutas, no evidencia de un incidente ni de todos los workflows consumidores.

**Reutilizable.** Composición de CI, construcción de artefactos, metadatos y despliegues centrales después de verificar su contrato. El inventario acotado de nombres de archivo de este snapshot no aportó un actualizador Windows/Tauri ni un protocolo de entrega offline; no se afirma que la empresa carezca de otro producto de distribución.

**Actual → objetivo.** Mostrar un release central y un release de sucursal que pueden coexistir. El segundo necesita descarga reanudable, verificación de autenticidad/integridad, preflight local, ventana de activación, drenaje/checkpoint, migración recuperable, inventario real instalado y estado de cada anillo. La matriz debe incluir UI, runtime/esquema, sincronizador, adaptadores/agente y protocolos soportados.

**Escenario para juniors.** «Se corta la energía al actualizar la sucursal después de migrar su base». Volver al ejecutable anterior no revierte automáticamente el esquema; restaurar un backup podría perder ventas nuevas. La demo debe mostrar “volver solo si es compatible” o “recuperación hacia adelante”, conservando operaciones, deduplicación y efectos inciertos.

**Criterio de cierre.** Paquete identificable por hash/firma, instalación interrumpida ensayada, activación atómica, migración expand/contract cuando aplique, compatibilidad de downgrade demostrada o rollback bloqueado con recuperación documentada. No cambiar el writer ni borrar backlog durante el rollback. El despliegue central también prueba la candidata antes de promover tráfico y prueba compatibilidad con tiendas atrasadas.

## WPL-05 · Compartir contratos de eventos no basta: hay que conservar identidad entre versiones

**Actual comprobado.** Existe un camino de ingesta de factura que comparte `txCtx` entre proyección y outbox [S14]. El relay publica y luego marca procesado [S15]: una caída entre ambos permite reentrega. `DomainEvent` aporta identidad, versión, correlación/causalidad y `commandId` opcional; su `eventName` por defecto proviene del nombre de la clase [S16]. Es evidencia reutilizable de primitivas y un flujo concreto, no de compatibilidad universal ni exactamente una vez.

**Actual → objetivo.** El tutorial debe distinguir **versión del programa**, **versión del contrato**, **identidad de operación** y **estado de entrega**. Un release nuevo puede recibir eventos antiguos. Reconstruir un evento con un UUID nuevo durante replay o cambiar su nombre externo al renombrar una clase puede alterar el contrato; por eso no se adopta el helper de dominio como contrato externo sin definición expresa.

**Propuesta concreta.** En PostgreSQL de sucursal, negocio/outbox comparten la transacción local correspondiente; el receptor persiste inbox/efecto local cuando comparten su base. Conservar IDs y payload/versiones necesarios durante replay y restauración. Publicar nombres de evento estables, negociar capacidades/versiones, definir transformaciones y cuarentena para versiones no soportadas. No sobrescribir el significado de un evento histórico con reglas nuevas, ni regenerar su identidad para que “pase”.

**Escenario para juniors.** «La sucursal con versión N entrega una venta dos veces al centro N+1, y después llega un evento con versión desconocida». Mostrar: duplicado reconocido por la misma identidad; evento desconocido conservado para tratamiento controlado; ACK de transporte distinto de aplicación durable y resultado ERP.

**Criterio de cierre.** Pruebas entre versiones admitidas y tras restore, pérdida de ACK y replay. El horizonte de compatibilidad/retención se dimensiona con desconexión, rollback y recuperación reales. El fin del soporte de una versión no puede convertir mensajes monetarios pendientes en descarte silencioso.

## Cómo integrarlo sin otra colección de diapositivas

En Propuesta, un selector «Código / Ejecución / Entrega» puede revelar las mismas piezas con fronteras distintas. Las fichas de monolito, ACL, outbox y plataforma corporativa enlazan WPL-01/02/05. En Evolución, un escenario «Sucursal atrasada durante actualización» reúne WPL-03/04 y conserva un desplegable de evidencia. Presentar **actual comprobado**, **límite de la evidencia** y **objetivo por validar** en cada caso. No enseñar todo `core`, porcentajes de madurez ni promesas de “cero cambios”.

## Fuentes puntuales — 16 referencias por SHA y rango

- **S01:** [NestFactory con Fastify](https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/apps/core-api/src/bootstrap/factories/nest-application.factory.ts#L25-L38).
- **S02:** [Límites Nx entre capas](https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/eslint.config.mjs#L151-L215).
- **S03:** [Regla de reexportación: objetivo y alcance](https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/tools/eslint-rules/no-infrastructure-reexport-from-application.mjs#L1-L42).
- **S04:** [Registro real de AX/mock y extensión futura](https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/apps/sync-worker/src/erp-adapters/erp-adapters.module.ts#L150-L199).
- **S05:** [Migración ERP declarada en láminas](https://github.com/developer-implementos/integration-presentations/blob/f96fd2d810b528517af75acea048b339beb2c284/presentations/architecture/enterprise-integration-platform-detailed.md#L846-L876).
- **S06:** [Otra lámina: worker lee SQL sin ACL](https://github.com/developer-implementos/integration-presentations/blob/f96fd2d810b528517af75acea048b339beb2c284/presentations/architecture/enterprise-integration-platform-detailed.md#L1248-L1267).
- **S07:** [Orden AuthN/AuthZ](https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/libs/shared/backend/auth/src/lib/auth.module.ts#L104-L145).
- **S08:** [JWT, blacklist y revocación por identidad](https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/libs/shared/backend/auth/src/lib/guards/unified-auth.guard.ts#L1042-L1099).
- **S09:** [Ruta protegida y enriquecimiento público](https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/libs/shared/backend/auth/src/lib/guards/unified-auth.guard.ts#L1360-L1408).
- **S10:** [Tráfico inicial del manifiesto](https://github.com/developer-implementos/devops-platform/blob/fd423a6f2f4955bd650ee6aebba154d93c0425b8/.github/actions/deploy-cloud-run/lib/templates.sh#L64-L79).
- **S11:** [Reemplazo, consulta y ajuste posterior de tráfico](https://github.com/developer-implementos/devops-platform/blob/fd423a6f2f4955bd650ee6aebba154d93c0425b8/.github/actions/deploy-cloud-run/action.yml#L375-L533).
- **S12:** [Digest con fallback unknown](https://github.com/developer-implementos/devops-platform/blob/fd423a6f2f4955bd650ee6aebba154d93c0425b8/.github/actions/build-and-push-image/action.yml#L823-L845).
- **S13:** [Qué comprueba el smoke HTTP](https://github.com/developer-implementos/devops-platform/blob/fd423a6f2f4955bd650ee6aebba154d93c0425b8/.github/actions/cloud-run-smoke-tests/action.yml#L216-L266).
- **S14:** [Proyección y outbox con contexto transaccional común](https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/libs/vtex-invoices/application/src/lib/services/ingest-invoice.service.ts#L241-L306).
- **S15:** [Publicar antes de marcar procesado](https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/libs/shared/backend/pubsub/src/lib/services/outbox-processor.service.ts#L309-L322).
- **S16:** [Identidad, versión, nombre y serialización del evento](https://github.com/developer-implementos/core/blob/f43688abeda81d9935744c74994691df28dd6b1a/libs/core/src/lib/domain/events/domain-event.ts#L47-L107).

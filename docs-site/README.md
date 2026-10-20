# Documentación POS Platform

Starlight es la entrada de consulta en `/guide/`. La presentación, el explorador, el narrador y los archivos editables conservan sus rutas. El sitio se compila como HTML estático y se entrega en el mismo proyecto Vercel, sin un servidor Astro ni claves nuevas.

## Fuente de cada contenido

- `content-map.mjs` define temas, rutas, agrupación y vínculos entre la propuesta y sus evidencias.
- `../docs/propuesta-arquitectura.md` sigue siendo la fuente editorial de las decisiones propuestas. El generador la divide por secciones y conserva las referencias.
- Los informes en `../docs/` y `../docs/analisis-repositorios/` aparecen como diseño, referencia o evidencia, con su alcance identificado. Un hallazgo de código no se convierte en confirmación de producción.
- `src/content/docs/index.mdx`, la galería y las rutas de consulta son páginas de entrada mantenidas a mano. Enlazan al detalle en lugar de repetirlo.
- Las cinco carpetas generadas de contenido no se editan ni se versionan. Cada build las reconstruye de forma determinista.
- `src/data/legacy-endpoints.json` conserva el catálogo revisado de rutas de Mountain, con descripciones y referencias al commit analizado. Las páginas `src/content/docs/api/` usan `EndpointCatalog.astro` para mostrarlo y filtrarlo. Actualizar la descripción después de revisar el controlador y sus servicios; la presencia de un método no acredita funcionamiento productivo.

## Comandos

Usa Node 22.19 o posterior dentro de la rama 22; `.nvmrc` fija la versión utilizada para verificar el sitio. Vercel debe usar Node 22.

```sh
npm ci
npm run build
npm run preview
```

La previsualización del sitio completo usa `http://127.0.0.1:4199/guide/`. La búsqueda Pagefind se valida sobre el build. `docs:build` compila solo Starlight en `docs-site/dist/`; `docs:dev` sirve su desarrollo. El preview completo permite verificar además los activos compartidos de presentación y medios.

La comprobación del navegador reutiliza Playwright del proyecto de video. Tras ensamblar el sitio con `npm run build`, prepara esa dependencia y ejecuta:

```sh
npm --prefix video ci
npm exec --prefix video -- playwright install chromium
npm run docs:check
```

## Diagramas e interacción

`Diagram.astro` presenta imágenes locales con descripción, ampliación accesible y descarga del editable. Se reutilizan los SVG recortados de `presentation/architecture-diagrams/` y los originales de `docs/diagramas-excalidraw/`.

Los bloques Mermaid conservan su definición como alternativa de lectura. Su renderizador se carga localmente solo en páginas que contienen diagramas. `FlowPlayer.astro` muestra secuencias de venta y precios con estado confirmado, pendientes y pseudocódigo; no se ejecutan integraciones reales. La reproducción requiere una acción del lector y respeta movimiento reducido.

## Publicación y controles

`scripts/build.mjs` genera contenidos, compila Astro y transforma los scripts inline en archivos locales con hash. Así conserva la política `script-src 'self'`. Solo `/guide/` permite además WebAssembly para Pagefind; no se permite evaluación JavaScript arbitraria ni recursos de CDN.

`presentation/tools/build-vercel.cjs` ensambla el resultado en `public/guide/` junto con la presentación y los medios verificados. `public/` es salida desechable, nunca una fuente de Astro. Los documentos originales y las rutas existentes se conservan para compatibilidad y trazabilidad.

Antes de publicar, `docs:check` comprueba rutas, anclas, búsqueda real, diagramas, controles y diseño móvil con la política de seguridad activa. Cambiar texto del narrador sigue requiriendo su propia regeneración; organizar documentación no cambia su guion ni sus tiempos.

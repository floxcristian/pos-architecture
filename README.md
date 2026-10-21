# POS Platform · Presentación de arquitectura

Este repositorio publica la [propuesta interactiva en Reveal.js](https://presentation-gamma-rust.vercel.app/reveal), su narrador en español, el explorador de antecedentes y el [video de la propuesta](https://presentation-gamma-rust.vercel.app/video). La entrada pública `/` abre `/reveal`.

La **[documentación técnica en Starlight](https://pos-platform-tau.vercel.app/guide/)** pertenece al monorepo [pos-platform](https://github.com/floxcristian/pos-platform). Allí se mantienen las decisiones de arquitectura, los contratos, la evidencia del legacy, los diagramas editables y las guías de implementación junto al código. Este repositorio conserva sus síntesis para presentar la propuesta; no mantiene otra copia editable de esas fuentes.

## Material disponible

| Material | Entrada |
| --- | --- |
| Propuesta, simulaciones y narrador | [Reveal.js](https://presentation-gamma-rust.vercel.app/reveal) · [Manual de presentación](presentation/README.md) |
| Antecedentes y recorridos del sistema | [Explorador](https://presentation-gamma-rust.vercel.app/presentation/index.html) |
| Video de la propuesta | [Reproductor público](https://presentation-gamma-rust.vercel.app/video) · [Producción y publicación](video/README.md) |
| Decisiones y alcance | [Documentación de la propuesta](https://pos-platform-tau.vercel.app/guide/proposal/product/) · [Decisiones](https://pos-platform-tau.vercel.app/guide/proposal/decisions/) |
| Diagramas C4 y descargas editables | [Galería de Starlight](https://pos-platform-tau.vercel.app/guide/diagrams/) |
| Desarrollo del producto | [Monorepo](https://pos-platform-tau.vercel.app/guide/implementation/monorepo/) · [Base de API](https://pos-platform-tau.vercel.app/guide/implementation/api/) |
| Evidencia y snapshots del legacy | [Método y alcance de la revisión](https://pos-platform-tau.vercel.app/guide/evidence/audit/) |

Las simulaciones utilizan datos sintéticos y código conceptual. Explican una plataforma POS corporativa multipaís; no ejecutan ventas, pagos, fiscalidad ni integraciones productivas. La continuidad offline es uno de sus requisitos, junto con integridad, seguridad, extensibilidad y recuperación.

## Propiedad de las fuentes

- **pos-platform:** documentación Starlight en `apps/pos-docs/`, fuentes técnicas en `docs/` y modelos/generadores de diagramas en `tools/diagrams/`.
- **Este repositorio:** diapositivas, exploradores, laboratorios, guiones, controles del narrador, video y asistente de la presentación.
- **Snapshot derivado:** `presentation/documentation.snapshot.json` fija una revisión limpia del producto, con SHA de commit y hashes de sus entradas. Aporta al build las referencias públicas seleccionadas, los modelos, los diagramas y el catálogo; no se edita a mano ni constituye una fuente editorial alternativa.

Los enlaces públicos anteriores `/guide/…` y `/docs/…` redirigen a sus equivalentes en el producto. La [guía de mantenimiento de Starlight](https://pos-platform-tau.vercel.app/guide/reference/maintenance/) se mantiene allí. Los [antecedentes originales de este repositorio](https://github.com/floxcristian/pos-architecture/blob/7ff835f440fece2f2d8f32efff9c08ad93e50308/README.md) permanecen consultables en su revisión histórica.

## Compilar y verificar

Usar la versión de Node indicada en `.nvmrc` y ejecutar desde la raíz:

```sh
npm ci
npm run documentation:check
npm run check:assistant-api
npm run build
npm run preview
```

El preview sirve el artefacto `public/` en `http://127.0.0.1:4199/reveal`, con redirecciones y cabeceras equivalentes a Vercel. El build consume el snapshot versionado: no requiere otro checkout, instalar Astro ni compilar Starlight. Descarga y comprueba el video y el audio publicados conforme a sus manifiestos; esa recuperación de medios sí requiere conexión o las copias locales previstas por sus herramientas.

La función `/api/assistant` usa el corpus generado en el servidor. Para activarla, consultar [Configuración del asistente](presentation/tools/assistant-setup.md); la presentación y la narración estáticas no necesitan claves.

El workflow **Presentation quality** comprueba el snapshot, las pruebas del asistente y el build. Las comprobaciones visuales y de interacción se documentan en el [manual de presentación](presentation/README.md#verificar). Los controles de Starlight se ejecutan en el repositorio del producto.

## Actualizar la referencia técnica

1. Cambiar y revisar las fuentes canónicas en `pos-platform`, incluyendo sus diagramas y guías. La revisión debe estar comprometida y el árbol de trabajo limpio.
2. Compilar la documentación del producto. El build exporta `dist/apps/pos-docs/documentation.snapshot.json`, con revisión, hashes y mapa de enlaces.
3. En este repositorio, importar ese artefacto:

   ```sh
   npm run documentation:sync -- --artifact /ruta/al/documentation.snapshot.json
   npm run documentation:check
   ```

4. Revisar el diff de los derivados y actualizar las diapositivas, escenarios y textos que sintetizan la decisión. El asistente recompone su corpus en el build. Cambiar el snapshot no reescribe automáticamente el guion ni regenera la voz o el video.
5. Ejecutar las comprobaciones afectadas y el build antes de publicar. Conservar el snapshot y sus derivados en el mismo cambio.

La importación rechaza un snapshot con cambios locales o hashes inválidos. El build valida la copia fijada, sin consultar `main` mutable ni depender del acceso a un repositorio corporativo.

## Publicación

Vercel usa la raíz del repositorio, `npm ci`, el build definido en `vercel.json` y la salida `public/`. Conserva `/reveal`, `/arquitectura`, `/presentation`, `/video` y `/api/assistant`. El detalle de medios, límites y actualización de las versiones está en los manuales de [presentación](presentation/README.md#desplegar-en-vercel), [narración](presentation/tools/narration-pipeline.md) y [video](video/README.md#publicación-en-vercel).

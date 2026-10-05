# Herramientas para los archivos Excalidraw

Este paquete se utiliza exclusivamente al generar o verificar los artefactos. La presentación y la galería publicadas no cargan React, Excalidraw ni dependencias externas.

Desde la raíz del repositorio:

```powershell
npm ci --prefix presentation/tools/excalidraw-runtime
# Playwright y Chromium deben estar instalados. Si no se resuelve el paquete:
$env:PLAYWRIGHT_MODULE_PATH = 'ruta/al/paquete/playwright'
node presentation/tools/generate-excalidraw.cjs
node presentation/tools/check-excalidraw.cjs
python presentation/tools/package-excalidraw.py
```

`EXCALIDRAW_RUNTIME` permite usar otro directorio con el mismo lockfile. La generación se verificó con Node 22 en Windows; las fuentes del sistema deben proporcionar Arial para medir Helvetica. El SVG exportado conserva alternativas tipográficas estándar.

Entradas:

- `presentation/c4-data.js`: identidades, contratos y relaciones estructurales.
- `presentation/diagrams.js`: geometría del SVG C4 previamente renderizado y revisado. El generador reconstruye cada forma, texto y flecha como un elemento nativo; no incrusta imágenes.
- `presentation/excalidraw/dynamic-data.cjs`: participantes, orden, interacciones y notas de los dos flujos.
- `presentation/tools/excalidraw-browser.js`: composición y exportación con las API oficiales de Excalidraw.

Salidas en `docs/diagramas-excalidraw/`: siete escenas, un atlas con siete marcos, siete SVG y el ZIP. La galería y su README se mantienen como documentos de entrada, no se sobrescriben al generar. Capturas y resultados de verificación permanecen en `presentation/qa/excalidraw/`.

La regeneración reemplaza las escenas y SVG generados. Antes de regenerar, conserva las ediciones manuales de Excalidraw y traslada las decisiones al modelo. Los rótulos de las flechas estructurales están agrupados con sus conectores para conservar la posición de lectura; sus extremos están ligados a los nodos. Los flujos dinámicos usan líneas de vida y flechas numeradas editables.

La verificación comprueba IDs, contratos, ausencia de imágenes, referencias y bindings, fronteras de proceso, solapamientos entre nodos/rótulos y rutas que atraviesen nodos ajenos. Reimporta las ocho escenas con `loadFromBlob` en el editor real y prueba arrastrar un nodo con su flecha. No valida capacidades productivas del POS.

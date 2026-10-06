# Propuesta POS narrada en español

Producción reproducible del video educativo: 56 escenas y 14 capítulos, voz sintética en español de Chile, diagramas C4/Excalidraw, animación de mensajes y código breve. El objetivo es un producto corporativo reutilizable entre países. La explicación conecta núcleo común, perfiles, adaptadores y gobierno con integridad, continuidad y recuperación.

El video explica una propuesta. Los ejemplos de BullMQ y RabbitMQ son extensiones centrales opcionales; no ejecutan colas, pagos ni infraestructura real. Las fuentes del modelo siguen en `docs/`; `content/sources.json` registra la documentación utilizada. El renderer reutiliza los SVG del repositorio y acerca regiones reales, sin cambiar sus relaciones.

## Entrega

`output/index.html` es el reproductor local con capítulos. El archivo principal es `output/pos-propuesta-explicada-es-v3.mp4`, H.264/AAC, 1920 × 1080 a 24 fps. Incluye subtítulos visibles y capítulos MP4. También se generan SRT, WebVTT, guion, índice con tiempos y un manifiesto SHA-256. Se puede compartir toda la carpeta `output/` para conservar la navegación sin conexión.

`output/pos-atlas-video-completo-v3.zip` reúne la entrega y el manifiesto en una carpeta. Al extraerlo, abre `pos-atlas-video/index.html` para navegar por capítulos o reproduce directamente el MP4.

`output/ejemplos-codigo.md` conserva los nueve fragmentos mostrados en pantalla, junto con la explicación y el tiempo de aparición.

`output/muestra-plataforma-corporativa-v3.mp4` permite revisar la apertura: una plataforma POS reutilizable en múltiples países, con continuidad offline como uno de sus requisitos.

La carpeta de salida, las voces, los cuadros intermedios y las dependencias instaladas se excluyen de Git. La publicación web utiliza el MP4 final y los materiales indicados abajo.

## Publicación en Vercel

Enlace público: **https://presentation-gamma-rust.vercel.app/video**. El reproductor conserva los 14 capítulos y permite copiar un enlace al instante actual (`?t=segundos`). La página y sus materiales están versionados en `presentation/video.html`, `video.css`, `video.js` y `video-assets/`.

El MP4 supera el límite de un archivo Git ordinario. Se conserva íntegro como asset de la release `pos-video-v3` del mismo repositorio. `publication.json` fija su URL, tamaño y SHA-256; el build de Vercel lo descarga, verifica y publica en `/media/pos-propuesta-explicada-es-v3.mp4`. La reproducción se sirve desde Vercel, con el mismo origen que la página y sin cuentas ni credenciales para el visitante. Si falla la descarga o la integridad, el build falla y no publica un video parcial.

El build usa Node.js 22 o posterior y no necesita Python, FFmpeg, síntesis de voz ni tokens. Para verificar localmente sin descargar de nuevo, puede apuntarse `POS_VIDEO_SOURCE` al MP4 original; se aplica la misma verificación. `node presentation/tools/build-vercel.cjs` genera `public/`.

Para publicar otra revisión: generar y validar el video y su paquete, ejecutar `python video/tools/sync-publication.py` para actualizar el hash, capítulos y materiales públicos, subir el MP4 con un nombre y tag nuevos a GitHub Releases, comprobar el build y subir los cambios a `main`. Evitar reemplazar silenciosamente un asset ya publicado: el hash fijado detectaría el cambio. El paquete descargable de la entrega local permanece independiente del reproductor público.

## Herramientas

- Python 3.13 y un entorno virtual propio.
- `edge-tts` 7.2.8: síntesis de la narración revisada; necesita conexión durante la generación. Solo se envía el texto educativo público. Voz predeterminada `es-CL-LorenzoNeural`, velocidad `-5%`.
- FFmpeg 7.1, distribuido por `imageio-ffmpeg`: codificación, subtítulos, audio y capítulos.
- Playwright 1.59.1 / Chromium: cuadros deterministas de HTML y SVG, sin solicitudes externas.
- Pillow y Mutagen: control de imágenes y duraciones de audio.

No hace falta un MCP, una cuenta nueva ni un renderizador de pago. Las dependencias se instalan dentro de `video/`; no se reemplazan los programas globales del equipo.

## Reproducir la producción en PowerShell

Desde la raíz del repositorio:

```powershell
python -m venv video/.venv
video/.venv/Scripts/python.exe -m pip install -r video/requirements.txt
Push-Location video
npm ci
npx playwright install chromium
Pop-Location

video/.venv/Scripts/python.exe video/tools/narrate.py
video/.venv/Scripts/python.exe video/tools/timeline.py
node video/tools/render.cjs --qa
node video/tools/check-tours.cjs
node video/tools/render.cjs --workers 2
video/.venv/Scripts/python.exe video/tools/check-encoded-tours.py
video/.venv/Scripts/python.exe video/tools/finalize.py
video/.venv/Scripts/python.exe video/tools/package_video.py
video/.venv/Scripts/python.exe video/tools/check-video.py
node video/tools/check-player.cjs
```

La voz se reutiliza únicamente si coinciden texto, voz, velocidad y versión del sintetizador. Las escenas renderizadas se reutilizan por hash del contenido y del renderer. Un cambio de encuadre no obliga a sintetizar otra vez una narración idéntica. La línea de tiempo se redondea a cuadros; el audio final se arma con cantidades exactas de muestras para evitar deriva acumulada.

`render.cjs --qa` comprueba las áreas seguras, las imágenes, los errores de JavaScript y la ausencia de conexiones externas. Guarda cuadros finales e intermedios en `work/qa/` para inspección visual. La exportación final normaliza la voz en dos pasadas a −16 LUFS y limita el pico verdadero a −1,5 dBTP. Los valores se verifican sobre la entrega codificada.

Los recorridos de los diagramas se definen en `content/diagram-tours.json`. Cada encuadre se ancla a una frase exacta y única de la voz sintetizada, con IDs de los elementos Excalidraw originales. `timeline.py` resuelve los tiempos por palabra; la cámara llega al destino al empezar la frase, mantiene el foco para leer y se mueve durante toda la narración. Un minimapa conserva la ubicación y el rótulo identifica lo explicado. `check-tours.cjs` revisa cada ancla, transición y salto inverso, y genera el storyboard en `work/qa/guided/` para revisar la correspondencia visual y semántica.

`content/delivery.json` identifica la revisión y sus nombres de archivo. Para regenerar únicamente los siete diagramas después de actualizar voces y timeline: `node video/tools/render.cjs --scenes s03,s05,s08,s13,s21,s25,s33 --workers 2`. Las demás escenas conservan sus clips; el montaje final vuelve a calcular capítulos y subtítulos con la duración actual.

`check-video.py` decodifica la entrega completa, comprueba cuadros, duración, idiomas, capítulos, subtítulos, sonoridad y hashes. `check-player.cjs` verifica la carga y reproducción del MP4, los saltos de capítulo y el diseño del reproductor en escritorio y móvil. Sus informes se guardan en `work/qa/`.

## Editar

- `content/scenes.json`: narración, capítulos, código, textos y diagramas por escena.
- `renderer.html`, `renderer.css`, `renderer.js`: diseño y animación controlada por progreso; ninguna transición depende del reloj del navegador.
- `tools/narrate.py`: voz y metadatos de palabras.
- `tools/timeline.py`: silencios, duraciones, subtítulos y capítulos.
- `tools/render.cjs`: captura y codificación por escena.
- `tools/finalize.py`: unión y mezcla final.
- `tools/package_video.py`: reproductor y archivos de entrega.
- `tools/sync-publication.py`: archivo fijado por hash, capítulos, portada y materiales del reproductor público.

Los ejemplos de código omiten infraestructura auxiliar para ser legibles y deben interpretarse con la narración. Los ayudantes didácticos representan contratos que habría que implementar y probar; no constituyen código listo para producción.

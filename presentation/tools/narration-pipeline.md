# Audio del modo narrador

La presentación reproduce MP3 precalculados, con una pista por lámina. El usuario no necesita una cuenta, voz instalada ni servicio de síntesis en su navegador. Los MP3 se sirven desde el mismo origen de Vercel y se descargan al reproducirlos, no todos al abrir la presentación.

## Fuente y sincronización

`../pos-reveal-narration-content.js` contiene el guion público, dividido en intervenciones con una identidad estable. Cada intervención puede señalar una parte visible de la lámina o un paso del laboratorio. Primero se revisa y congela ese guion; después se genera voz. La voz sintetizada se identifica en la interfaz como tal.

El generador envía únicamente el texto educativo público a Edge TTS, con la voz `es-CL-LorenzoNeural`. No envía documentos de la empresa, credenciales ni datos de usuarios. La dependencia está fijada en `narration-requirements.txt`. Es una herramienta de generación: la presentación publicada no se comunica con el proveedor de voz.

Cada intervención se sintetiza por separado y se decodifica a PCM mono de 24 kHz. El generador mide sus muestras, intercala 350 ms de silencio y concatena las intervenciones antes de codificar el MP3 de la lámina. Los tiempos de las intervenciones se calculan a partir de muestras, no del número de palabras. El runtime sigue `audio.currentTime`; pausar, cambiar velocidad o buscar conserva la relación con el elemento visual.

El manifiesto `../pos-reveal-narration-audio.js` expone:

```js
window.POS_REVEAL_NARRATION_AUDIO = {
  'id-de-lamina': {
    src: '/media/narration/<contentHash>/id-de-lamina.mp3',
    duration: 85.2,
    cues: [{id: 'introduccion', start: 0, end: 14.6}],
    bytes: 681600,
    sha256: '<sha256-del-mp3>'
  }
};
```

Los tiempos son segundos. `end` delimita el audio de esa intervención; puede haber silencio hasta `start` de la siguiente. Cada intervención también incluye `textSha256`, que permite detectar que alguien cambió el texto sin regenerar su voz. El manifiesto de metadatos separado informa voz, duración total, número de láminas y versión del guion de audio. Los elementos visuales se resuelven por la identidad de intervención del guion, sin duplicarlos en el manifiesto de audio.

## Regenerar

Desde la raíz del repositorio, con Python y Node disponibles:

```powershell
video/.venv/Scripts/python.exe -m pip install -r presentation/tools/narration-requirements.txt
video/.venv/Scripts/python.exe presentation/tools/generate-narration.py --limit 1
video/.venv/Scripts/python.exe presentation/tools/generate-narration.py
```

`--limit` crea una prueba local y no sobrescribe manifiestos publicados. `--cache-only` prepara únicamente la caché de intervenciones, sin combinar pistas ni escribir manifiestos; se puede combinar con `--limit` para adelantar guiones ya revisados. La ejecución completa reutiliza intervenciones idénticas desde `video/work/narration/cues`, con SHA-256 verificado, y limita la síntesis concurrente a dos peticiones. Si falla una intervención, reintenta cuatro veces y aborta sin publicar un manifiesto incompleto. La generación completa exige cubrir todas las láminas y reemplaza los manifiestos solo después de terminar todas las pistas y comprobar que el texto no cambió durante la síntesis.

El resultado queda en `video/output/narration/<contentHash>/`, junto al ZIP determinista que contiene únicamente MP3. Este directorio está excluido de Git. Se versionan el guion, los manifiestos pequeños y las herramientas. La generación no crea releases, commits ni despliegues por sí sola.

## Publicación reproducible

El ZIP se publica como un asset de release del repositorio público `floxcristian/pos-architecture`. `../narration-publication.json` fija URL, tamaño y SHA-256 del ZIP, además del tamaño y SHA-256 de cada MP3. El nombre de release y la ruta pública incluyen el hash del guion y la configuración de voz: una revisión no reutiliza una URL de audio anterior.

El build llama a `publishNarration(root, output)` de `narration-publication.cjs`. Primero comprueba que todas las láminas tengan guion y audio, que cada texto coincida con la voz generada y que los tiempos sean válidos. Luego descarga el asset fijado, comprueba su integridad y lo materializa en `public/media/narration/<contentHash>/`. Para un build local se puede indicar `POS_NARRATION_SOURCE` con la ruta absoluta del ZIP ya generado. Esa opción aplica las mismas verificaciones.

El extractor admite exclusivamente el ZIP sin compresión emitido por esta herramienta: nombres planos `.mp3` de la lista permitida, sin enlaces simbólicos, rutas, cifrado, archivos repetidos o payloads superpuestos. Verifica todo antes de escribir y falla ante discrepancias. No ejecuta comandos del archivo ni interpreta contenido descargado como código.

La presentación puede desplegarse como sitio estático: no requiere un backend de TTS, claves ni cómputo de audio en Vercel. Para una nueva edición se revisa el guion, se regenera, se verifica el audio, se publica el asset y se despliegan sus nuevos manifiestos conjuntamente.

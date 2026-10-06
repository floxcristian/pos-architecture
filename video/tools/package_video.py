"""Make a local, shareable chapter player alongside the final film and its transcript."""
from __future__ import annotations
import hashlib
import html
import json
import subprocess
import zipfile
from pathlib import Path
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]

def main():
    output = ROOT / 'output'
    timeline = json.loads((ROOT / 'work/timeline.json').read_text(encoding='utf-8'))
    delivery = json.loads((ROOT / 'content/delivery.json').read_text(encoding='utf-8'))
    video = output / delivery['video']
    assert video.exists()
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', '7', '-i', str(video), '-frames:v', '1', str(output / 'portada.jpg')], check=True)
    sample = next(scene for scene in timeline['scenes'] if scene['id'] == 's13')
    preview = output / delivery['preview']
    # Re-encode the excerpt so its first frame is exact, rather than the preceding keyframe.
    subprocess.run([
        imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error', '-y',
        '-ss', str(sample['start']), '-i', str(video), '-t', str(sample['duration']),
        '-map', '0:v:0', '-map', '0:a:0', '-c:v', 'libx264', '-preset', 'veryfast',
        '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k',
        '-map_metadata', '-1', '-map_chapters', '-1', '-movflags', '+faststart', str(preview)
    ], check=True)
    (output / 'fuentes.json').write_text((ROOT / 'content/sources.json').read_text(encoding='utf-8-sig'), encoding='utf-8')
    def clock(value):
        m, s = divmod(int(value), 60)
        return f'{m:02}:{s:02}'
    examples = ['# Ejemplos de código del video', '', 'Fragmentos didácticos abreviados. Las funciones auxiliares representan contratos que deben implementarse y probarse; no son una aplicación ejecutable.', '']
    for scene in timeline['scenes']:
        if scene.get('code'):
            language = 'sql' if scene['code'].lstrip().startswith('BEGIN;') else 'typescript'
            examples.extend([f"## {clock(scene['start'])} · {scene['title']}", '', scene['narration'], '', '```' + language, scene['code'], '```', ''])
    (output / 'ejemplos-codigo.md').write_text('\n'.join(examples), encoding='utf-8')
    chapters = ''.join(f'<li><button type="button" data-time="{chapter["start"]:.3f}" aria-label="Ir a {html.escape(chapter["title"])}"><span>{clock(chapter["start"])}</span><strong>{html.escape(chapter["title"])}</strong></button></li>' for chapter in timeline['chapters'])
    template = '''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>POS Atlas · Propuesta en video</title>
<style>
:root{color-scheme:dark;font:16px/1.55 'Segoe UI',sans-serif;background:#0b1220;color:#f5f7fc}*{box-sizing:border-box}body{margin:0}header,main,footer{width:min(1480px,100%);margin:auto;padding:28px clamp(20px,4vw,56px)}header{display:flex;align-items:center;justify-content:space-between;gap:24px;border-bottom:1px solid #2c3e58}a{color:#a7c7ff;text-underline-offset:4px}a:hover{color:white}a:focus-visible,button:focus-visible,video:focus-visible{outline:3px solid #c6daff;outline-offset:4px}h1{font-size:clamp(28px,4vw,44px);line-height:1.15;letter-spacing:-.035em;margin:0 0 20px}h2{font-size:22px;margin:0 0 15px}p{color:#b4c2d8;max-width:85ch}.brand{font-size:23px;font-weight:700}.badge{font-size:13px;padding:5px 10px;background:#16345f;border:1px solid #5476aa;border-radius:6px}.grid{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:32px;align-items:start}video{display:block;width:100%;aspect-ratio:16/9;border:1px solid #536c91;border-radius:12px;background:#070c15}.download{display:flex;gap:10px 24px;flex-wrap:wrap;margin-top:20px}.download a{min-height:44px;display:inline-flex;align-items:center;font-weight:600}ol{list-style:none;padding:0;margin:0}li+li{margin-top:8px}button{font:inherit;width:100%;display:grid;grid-template-columns:50px 1fr;gap:12px;text-align:left;align-items:start;padding:12px;border:1px solid #2c3e58;border-radius:8px;background:#111d30;color:#f5f7fc;cursor:pointer;min-height:48px}button span{color:#a7c7ff;font:14px/1.8 Consolas,monospace}button strong{font-size:15px;font-weight:600}button:hover{background:#203653;border-color:#91b8ff}button[aria-current=true]{background:#183e76;border-color:#a7c7ff}footer{border-top:1px solid #2c3e58;font-size:13px;color:#b4c2d8}.description{margin-bottom:28px}.hint{font-size:14px}@media(max-width:900px){.grid{grid-template-columns:1fr}header{flex-wrap:wrap}.badge{font-size:12px}aside ol{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}li+li{margin:0}}@media(max-width:540px){aside ol{grid-template-columns:1fr}}
</style></head><body>
<header><span class="brand">POS Atlas</span><span class="badge">VIDEO EDUCATIVO · ESPAÑOL · 1080p</span><a href="https://presentation-gamma-rust.vercel.app/arquitectura" target="_blank" rel="noopener">Abrir presentación interactiva</a></header>
<main><h1>La propuesta del POS, explicada paso a paso</h1><p class="description">__DURATION__ de narración en español de Chile, __CHAPTERS__ capítulos y __SCENES__ escenas. Diagramas C4, casos de uso, código breve y animaciones de mensajes: desde la venta hasta la recuperación.</p>
<div class="grid"><section aria-label="Video de la propuesta"><video id="film" controls preload="metadata" poster="portada.jpg"><source src="__VIDEO_FILE__" type="video/mp4">Tu navegador no reproduce este formato. <a href="__VIDEO_FILE__">Descargar el video</a>.</video><p class="hint">Subtítulos integrados. Puedes ajustar la velocidad con los controles del reproductor y saltar a cualquier capítulo.</p><div class="download"><a href="__VIDEO_FILE__" download>Descargar MP4</a><a href="pos-propuesta-es.srt" download>Subtítulos SRT</a><a href="guion-es.md" download>Guion completo</a><a href="ejemplos-codigo.md" download>Ejemplos de código</a><a href="capitulos.txt" download>Índice con tiempos</a></div><p class="hint" id="now" role="status"></p></section><aside aria-label="Capítulos"><h2>El recorrido</h2><ol>__CHAPTER_LIST__</ol></aside></div></main>
<footer>Narración sintética. Ejemplos didácticos de una propuesta: no ejecutan infraestructura ni acreditan garantías de producción. BullMQ y RabbitMQ se muestran como opciones de integración central. No se necesita conexión para reproducir este paquete completo.</footer>
<script>
const video=document.getElementById('film');const buttons=[...document.querySelectorAll('[data-time]')];buttons.forEach(button=>button.addEventListener('click',()=>{video.currentTime=Number(button.dataset.time);video.play().catch(()=>{});video.focus({preventScroll:true});}));let active=-1;video.addEventListener('timeupdate',()=>{let next=0;buttons.forEach((button,index)=>{if(video.currentTime>=Number(button.dataset.time))next=index;});if(next!==active){active=next;buttons.forEach((button,index)=>button.setAttribute('aria-current',index===active?'true':'false'));document.getElementById('now').textContent='Capítulo actual: '+buttons[active].querySelector('strong').textContent;}});
</script></body></html>'''
    template = template.replace('__DURATION__', clock(timeline['duration'])).replace('__CHAPTERS__', str(len(timeline['chapters']))).replace('__SCENES__', str(len(timeline['scenes']))).replace('__CHAPTER_LIST__', chapters)
    template = template.replace('__VIDEO_FILE__', html.escape(video.name))
    (output / 'index.html').write_text(template, encoding='utf-8')
    files = [video.name, preview.name, 'pos-propuesta-es.srt', 'pos-propuesta-es.vtt', 'guion-es.md', 'ejemplos-codigo.md', 'capitulos.txt', 'capitulos.json', 'index.html', 'portada.jpg', 'fuentes.json']
    manifest = {'title': timeline['title'], 'language': 'es-CL', 'narration': 'synthetic', 'voice': timeline['voice'], 'durationSeconds': timeline['duration'], 'width':1920, 'height':1080, 'fps':24, 'scenes':len(timeline['scenes']), 'chapters':len(timeline['chapters']), 'files':[]}
    manifest['revision'] = delivery['revision']
    manifest['change'] = delivery['change']
    for name in files:
        file = output / name
        digest = hashlib.sha256()
        with file.open('rb') as handle:
            while chunk := handle.read(1024 * 1024):
                digest.update(chunk)
        manifest['files'].append({'name': name, 'bytes': file.stat().st_size, 'sha256': digest.hexdigest()})
    (output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    bundle = output / delivery['bundle']
    with zipfile.ZipFile(bundle, 'w', compression=zipfile.ZIP_STORED) as archive:
        for name in files + ['manifest.json']:
            archive.write(output / name, 'pos-atlas-video/' + name)
    print(json.dumps({'player': str(output / 'index.html'), 'bundle': str(bundle), 'duration': clock(timeline['duration']), 'files': len(files)}, ensure_ascii=False))

if __name__ == '__main__':
    main()

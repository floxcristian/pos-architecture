"""Sync the public player and pinned release from the validated local delivery."""
from __future__ import annotations
import hashlib
import html
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent


def replace_once(pattern, replacement, value):
    result, count = re.subn(pattern, replacement, value, flags=re.S)
    if count != 1:
        raise ValueError(f'Expected one public-player field for {pattern!r}, got {count}')
    return result


def main():
    delivery = json.loads((ROOT / 'content/delivery.json').read_text(encoding='utf-8'))
    timeline = json.loads((ROOT / 'work/timeline.json').read_text(encoding='utf-8'))
    manifest = json.loads((ROOT / 'output/manifest.json').read_text(encoding='utf-8'))
    assert manifest['revision'] == delivery['revision']
    movie = ROOT / 'output' / delivery['video']
    expected = next(item for item in manifest['files'] if item['name'] == movie.name)
    with movie.open('rb') as handle:
        digest = hashlib.file_digest(handle, 'sha256').hexdigest()
    assert movie.stat().st_size == expected['bytes'] and digest == expected['sha256']
    publication = {
        'revision': delivery['revision'], 'file': movie.name,
        'url': f"https://github.com/floxcristian/pos-architecture/releases/download/pos-video-v{delivery['revision']}/{movie.name}",
        'bytes': expected['bytes'], 'sha256': digest, 'durationSeconds': timeline['duration'],
        'width': timeline['width'], 'height': timeline['height'],
    }
    player_path = REPO / 'presentation/video.html'
    page = player_path.read_text(encoding='utf-8')
    page = re.sub(r'/media/pos-propuesta-explicada-es-v\d+\.mp4', '/media/' + movie.name, page)
    minute, second = divmod(round(timeline['duration']), 60)
    duration = f'{minute} min {second:02} s'
    page = replace_once(r'(<ul class="metadata"[^>]*><li>).*?(</li>)', rf'\g<1>{duration}\2', page)
    page = replace_once(r'(<div class="player-meta"><p id="current-chapter">).*?(</p><span>).*?(</span>)',
                        rf"\g<1>{html.escape(timeline['chapters'][0]['title'])}\2Versión {delivery['revision']}\3", page)
    page = replace_once(r'Descargar video · [\d.,]+ MB', f"Descargar video · {expected['bytes'] / 1_000_000:.0f} MB", page)
    buttons = []
    for chapter in timeline['chapters']:
        mm, ss = divmod(int(chapter['start']), 60)
        buttons.append(f'          <li><button type="button" data-time="{chapter["start"]}" disabled><span>{mm:02}:{ss:02}</span><strong>{html.escape(chapter["title"])}</strong></button></li>')
    page = replace_once(r'(<aside class="chapters".*?<ol>).*?(</ol>)',
                        lambda match: match[1] + '\n' + '\n'.join(buttons) + '\n        ' + match[2], page)
    assets = REPO / 'presentation/video-assets'
    assets.mkdir(exist_ok=True)
    for name in ['portada.jpg', 'pos-propuesta-es.srt', 'pos-propuesta-es.vtt', 'guion-es.md', 'ejemplos-codigo.md', 'capitulos.txt']:
        source = ROOT / 'output' / name
        if source.suffix == '.jpg':
            shutil.copy2(source, assets / name)
        else:
            (assets / name).write_text(source.read_text(encoding='utf-8').rstrip() + '\n', encoding='utf-8', newline='\n')
    player_path.write_text(page, encoding='utf-8', newline='\n')
    (ROOT / 'publication.json').write_text(json.dumps(publication, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'revision': delivery['revision'], 'video': movie.name, 'duration': duration, 'chapters': len(buttons), 'sha256': digest}, ensure_ascii=False))


if __name__ == '__main__':
    main()

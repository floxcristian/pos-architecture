"""Create frame-aligned narration, subtitles and chapter metadata from synthesized speech."""
from __future__ import annotations
import argparse
import html
import json
import math
import re
import textwrap
from pathlib import Path
from diagram_tours import bind_tour, load_tours

ROOT = Path(__file__).resolve().parents[1]
FPS = 24
LEAD = .65
TAIL = 1.0

def timestamp(seconds, vtt=False):
    ms = round(seconds * 1000)
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02}{'.' if vtt else ','}{ms:03}"

def ass_time(seconds):
    cs = round(seconds * 100)
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f'{h}:{m:02}:{s:02}.{cs:02}'

def caption_groups(words):
    group = []
    for word in words:
        value = html.unescape(word['text'])
        candidate = ' '.join([*(w['text'] for w in group), value])
        too_many_lines = len(textwrap.wrap(candidate, width=48, break_long_words=False)) > 2
        if group and (len(candidate) > 90 or too_many_lines or len(group) >= 13 or word['end'] - group[0]['start'] > 5.6):
            yield group
            group = []
        group.append({**word, 'text': value})
        if len(group) >= 5 and value.endswith(('.', '?', '!', ';')):
            yield group
            group = []
    if group:
        yield group

def with_script_punctuation(words, narration):
    """WordBoundary omits punctuation; restore only literal, ordered script matches."""
    cursor = 0
    result = []
    for word in words:
        value = html.unescape(word['text'])
        match = re.search(re.escape(value), narration[cursor:], re.IGNORECASE)
        if match and match.start() <= 40:
            start = cursor + match.start()
            end = cursor + match.end()
            suffix = re.match(r'[.,;:!?…)\]»”]*', narration[end:]).group()
            prefix = narration[start-1:start] if start and narration[start-1] in '¿¡' else ''
            value = prefix + narration[start:end] + suffix
            cursor = end + len(suffix)
        result.append({**word, 'text': value})
    return result

def run(limit=None):
    script = json.loads((ROOT / 'content/scenes.json').read_text(encoding='utf-8-sig'))
    tours = load_tours(ROOT / 'content/diagram-tours.json', script)
    target = ROOT / 'output'
    target.mkdir(exist_ok=True)
    ass_dir = ROOT / 'work/subtitles'
    ass_dir.mkdir(exist_ok=True, parents=True)
    chapter_map = {chapter['id']: chapter for chapter in script['chapters']}
    scenes, captions, chapters = [], [], []
    cursor = 0
    ass_header = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Narration,Segoe UI,32,&H00F7F5F2,&H00F7F5F2,&H00170D06,&H00170D06,0,0,0,0,100,100,0,0,1,1.5,0,2,145,145,52,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
    transcript = [f"# {script['title']}", '', 'Narración sintética en español. Ejemplos didácticos de la propuesta, sin conexión a infraestructura real.', '']
    selected = script['scenes'][:limit] if limit else script['scenes']
    for i, scene in enumerate(selected):
        audio = json.loads((ROOT / f"work/audio/{scene['id']}.json").read_text(encoding='utf-8'))
        duration = math.ceil((audio['duration'] + LEAD + TAIL) * FPS) / FPS
        if not chapters or chapters[-1]['id'] != scene['chapter']:
            chapter = chapter_map[scene['chapter']]
            chapters.append({'id': chapter['id'], 'title': chapter['title'], 'start': cursor, 'scene': i})
            transcript.extend([f"## {timestamp(cursor, True)[:-4]} · {chapter['title']}", ''])
        record = {**scene, 'start': cursor, 'duration': duration, 'audio': audio['path'], 'audioSha256': audio['sha256'], 'lead': LEAD, 'frames': round(duration * FPS), 'chapterTitle': chapter_map[scene['chapter']]['title'], 'chapterNumber': len(chapters), 'sceneNumber': i + 1}
        if scene['kind'] == 'diagram':
            record['diagramTour'] = bind_tour(tours[scene['id']], scene, audio, LEAD, duration)
        scene_captions = []
        groups = list(caption_groups(with_script_punctuation(audio['words'], scene['narration'])))
        for n, group in enumerate(groups):
            start = group[0]['start'] + LEAD
            next_start = groups[n+1][0]['start'] + LEAD if n+1 < len(groups) else duration - .3
            end = min(next_start, group[-1]['end'] + LEAD + .2)
            value = ' '.join(w['text'] for w in group)
            lines = textwrap.wrap(value, width=48, break_long_words=False)
            assert len(lines) <= 2, (scene['id'], lines)
            cue = {'start': start, 'end': end, 'text': '\n'.join(lines)}
            scene_captions.append(cue)
            captions.append({**cue, 'start': cursor + start, 'end': cursor + end})
        ass = ass_header + ''.join(f"Dialogue: 0,{ass_time(c['start'])},{ass_time(c['end'])},Narration,,0,0,0,," + c['text'].replace('\\', '\\\\').replace('{', '(').replace('}', ')').replace('\n', r'\N') + '\n' for c in scene_captions)
        (ass_dir / f"{scene['id']}.ass").write_text(ass, encoding='utf-8-sig')
        record['subtitles'] = f"work/subtitles/{scene['id']}.ass"
        record['captions'] = scene_captions
        scenes.append(record)
        transcript.extend([f"### {timestamp(cursor, True)[:-4]} · {scene['title']}", '', scene['narration'], ''])
        cursor += duration
    for index, chapter in enumerate(chapters):
        chapter['end'] = chapters[index+1]['start'] if index+1 < len(chapters) else cursor
    result = {'title': script['title'], 'fps': FPS, 'width': 1920, 'height': 1080, 'duration': cursor, 'voice': audio['voice'], 'voiceRate': audio['rate'], 'chapters': chapters, 'scenes': scenes}
    (ROOT / 'work/timeline.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    for vtt in [False, True]:
        value = 'WEBVTT\n\n' if vtt else ''
        for index, cue in enumerate(captions):
            value += f"{index+1}\n{timestamp(cue['start'], vtt)} --> {timestamp(cue['end'], vtt)}\n{cue['text']}\n\n"
        (target / ('pos-propuesta-es.' + ('vtt' if vtt else 'srt'))).write_text(value, encoding='utf-8')
    (target / 'guion-es.md').write_text('\n'.join(transcript), encoding='utf-8')
    (target / 'capitulos.json').write_text(json.dumps(chapters, ensure_ascii=False, indent=2), encoding='utf-8')
    (target / 'capitulos.txt').write_text('\n'.join(f"{timestamp(c['start'], True)[:-4]} {c['title']}" for c in chapters), encoding='utf-8')
    metadata = ';FFMETADATA1\ntitle=POS corporativo - propuesta explicada\nartist=POS Atlas\ncomment=Narracion sintetica en espanol; ejemplos didacticos.\n'
    for c in chapters:
        title = c['title'].replace('=', '\\=').replace(';', '\\;').replace('#', '\\#')
        metadata += f"[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(c['start']*1000)}\nEND={round(c['end']*1000)}\ntitle={title}\n"
    (ROOT / 'work/chapters.ffmeta').write_text(metadata, encoding='utf-8')
    print(json.dumps({'scenes': len(scenes), 'chapters': len(chapters), 'durationSeconds': round(cursor, 2), 'captions': len(captions)}, ensure_ascii=False))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int)
    run(parser.parse_args().limit)

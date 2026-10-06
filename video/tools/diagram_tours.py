"""Bind authored diagram shots to the exact synthesized narration word boundaries."""
from __future__ import annotations
import html
import json
import re
import unicodedata
from pathlib import Path


def tokens(value):
    return re.findall(r'[^\W_]+', unicodedata.normalize('NFKC', html.unescape(value)).casefold())


def matches(sequence, phrase):
    return [index for index in range(len(sequence) - len(phrase) + 1)
            if sequence[index:index + len(phrase)] == phrase]


def rectangle(value, name):
    assert set(value) >= {'x', 'y', 'w', 'h'}, f'{name}: incomplete rectangle'
    x, y, w, h = (value[key] for key in ('x', 'y', 'w', 'h'))
    assert all(isinstance(n, (int, float)) for n in (x, y, w, h)), name
    assert 0 <= x < 1 and 0 <= y < 1 and w > 0 and h > 0, f'{name}: invalid rectangle'
    assert x + w <= 1.000001 and y + h <= 1.000001, f'{name}: outside SVG'


def load_tours(path: Path, script):
    data = json.loads(path.read_text(encoding='utf-8-sig'))
    assert data['version'] == 1, 'Unsupported diagram tour version'
    tours = {tour['sceneId']: tour for tour in data['tours']}
    assert len(tours) == len(data['tours']), 'Duplicate diagram tour'
    expected = {scene['id'] for scene in script['scenes'] if scene['kind'] == 'diagram'}
    assert set(tours) == expected, f'Diagram tour coverage: {set(tours) ^ expected}'
    return tours


def bind_tour(tour, scene, audio, lead, duration):
    assert tour['diagram'] == scene['diagram'], f'{scene["id"]}: wrong source diagram'
    script_tokens = tokens(scene['narration'])
    spoken_tokens, word_indices = [], []
    for index, word in enumerate(audio['words']):
        current = tokens(word['text'])
        spoken_tokens.extend(current)
        word_indices.extend([index] * len(current))
    result, identifiers = [], set()
    for cue in tour['cues']:
        identifier = f'{scene["id"]}/{cue["id"]}'
        assert cue['id'] not in identifiers, f'{identifier}: duplicate cue'
        identifiers.add(cue['id'])
        phrase = tokens(cue['phrase'])
        assert phrase and len(matches(script_tokens, phrase)) == 1, f'{identifier}: anchor must match script uniquely'
        found = matches(spoken_tokens, phrase)
        assert len(found) == 1, f'{identifier}: anchor must match spoken words uniquely'
        first = word_indices[found[0]]
        last = word_indices[found[0] + len(phrase) - 1]
        start = audio['words'][first]['start'] + lead
        anchor_end = audio['words'][last]['end'] + lead
        assert not result or start > result[-1]['start'], f'{identifier}: narration anchors out of order'
        rectangle(cue['focus'], identifier)
        if cue.get('highlight'):
            rectangle(cue['highlight'], identifier + '/highlight')
        assert cue['label'].strip() and cue['description'].strip(), f'{identifier}: missing narration context'
        result.append({**cue, 'start': start, 'anchorEnd': anchor_end, 'anchorWordIndex': first})
    assert len(result) >= 4, f'{scene["id"]}: insufficient guided steps'
    assert result[0]['start'] < 2, f'{scene["id"]}: opening narration not covered'
    for index, cue in enumerate(result):
        cue['end'] = result[index + 1]['start'] if index + 1 < len(result) else duration
        assert cue['end'] - cue['start'] >= .4, f'{scene["id"]}/{cue["id"]}: unreadably short shot'
        assert cue['anchorEnd'] <= cue['end'] + .025, f'{scene["id"]}/{cue["id"]}: anchor overlaps next shot'
    return {'version': 1, 'audioSha256': audio['sha256'], 'cues': result}

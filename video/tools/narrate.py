"""Synthesize only the reviewed, public educational script. Cache each scene by hash."""
from __future__ import annotations
import argparse
import asyncio
import hashlib
import json
import math
from pathlib import Path

import edge_tts
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parents[1]

async def run(args):
    script = json.loads((ROOT / 'content/scenes.json').read_text(encoding='utf-8-sig'))
    output = ROOT / 'work/audio'
    output.mkdir(parents=True, exist_ok=True)
    gate = asyncio.Semaphore(2)
    async def scene_audio(scene):
        identity = {'narration': scene['narration'], 'voice': args.voice, 'rate': args.rate, 'engine': edge_tts.__version__}
        digest = hashlib.sha256(json.dumps(identity, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
        audio = output / (scene['id'] + '.mp3')
        meta = audio.with_suffix('.json')
        if audio.exists() and meta.exists():
            cached = json.loads(meta.read_text(encoding='utf-8'))
            if cached.get('sha256') == digest and audio.stat().st_size > 1024:
                print(f"CACHE {scene['id']} {cached['duration']:.1f}s", flush=True)
                return cached
        async with gate:
            last_error = None
            for attempt in range(3):
                partial = audio.with_suffix('.partial.mp3')
                words = []
                try:
                    speech = edge_tts.Communicate(scene['narration'], args.voice, rate=args.rate, boundary='WordBoundary')
                    with partial.open('wb') as stream:
                        async for chunk in speech.stream():
                            if chunk['type'] == 'audio':
                                stream.write(chunk['data'])
                            elif chunk['type'] == 'WordBoundary':
                                words.append({'start': chunk['offset'] / 10_000_000, 'end': (chunk['offset'] + chunk['duration']) / 10_000_000, 'text': chunk['text']})
                    duration = MP3(partial).info.length
                    assert duration > 5 and len(words) > 10, f"Incomplete speech: {scene['id']}"
                    assert words[-1]['end'] < duration + .5, f"Metadata exceeds audio: {scene['id']}"
                    partial.replace(audio)
                    result = {'id': scene['id'], 'sha256': digest, **identity, 'duration': duration, 'words': words, 'path': f'work/audio/{audio.name}'}
                    meta.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
                    print(f"VOICE {scene['id']} {duration:.1f}s / {len(words)} words", flush=True)
                    return result
                except Exception as error:
                    last_error = error
                    print(f"RETRY {scene['id']} ({attempt + 1}/3): {type(error).__name__}: {error}", flush=True)
                    await asyncio.sleep(min(2 ** attempt, 4))
            raise RuntimeError(f"Speech failed for {scene['id']}") from last_error
    selected = script['scenes'][:args.limit] if args.limit else script['scenes']
    results = await asyncio.gather(*(scene_audio(scene) for scene in selected))
    print(json.dumps({'scenes': len(results), 'spokenSeconds': round(sum(r['duration'] for r in results), 2), 'voice': args.voice, 'rate': args.rate}, ensure_ascii=False), flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--voice', default='es-CL-LorenzoNeural')
    parser.add_argument('--rate', default='-5%')
    parser.add_argument('--limit', type=int)
    asyncio.run(run(parser.parse_args()))

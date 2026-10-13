"""Compile reviewed Spanish narration to immutable, cue-aligned MP3 assets.

The speech provider receives only the public educational cue text. This tool
does not publish anything. Individual cue audio is cached by text and settings;
the browser needs one audio file per slide, not a live speech service.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
import subprocess
import wave
from pathlib import Path
from zipfile import ZIP_STORED, ZipFile, ZipInfo

import edge_tts
import imageio_ffmpeg
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parents[2]
PRESENTATION = ROOT / 'presentation'
WORK = ROOT / 'video/work/narration'
OUTPUT = ROOT / 'video/output/narration'
SAMPLE_RATE = 24_000
BYTES_PER_SAMPLE = 2
IDENTIFIER = re.compile(r'^[a-z0-9][a-z0-9-]{0,100}$')


def digest(value):
    data = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
    return hashlib.sha256(data).hexdigest()


def file_hash(file):
    with file.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def read_script(source):
    # Execute only the repository-authored data file in an isolated JS context.
    program = "const fs=require('node:fs'),vm=require('node:vm'); const c={window:{}};vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),c,{timeout:3000});process.stdout.write(JSON.stringify(c.window.POS_REVEAL_NARRATION_CONTENT));"
    result = subprocess.run(['node', '-e', program, str(source)], capture_output=True, check=True)
    content = json.loads(result.stdout)
    if not isinstance(content, dict) or not content:
        raise ValueError('Narration must be a non-empty slide map')
    for slide_id, cues in content.items():
        if not IDENTIFIER.fullmatch(slide_id) or not isinstance(cues, list) or not cues:
            raise ValueError(f'Invalid slide: {slide_id}')
        ids = set()
        for cue in cues:
            if not IDENTIFIER.fullmatch(cue['id']) or cue['id'] in ids:
                raise ValueError(f'Invalid or repeated cue: {slide_id}')
            if not isinstance(cue['text'], str) or not cue['text'].strip():
                raise ValueError(f'Empty cue: {slide_id}/{cue["id"]}')
            ids.add(cue['id'])
    return content


def ffmpeg(args):
    return subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error', *args], capture_output=True, check=True)


async def compile_audio(args):
    content = read_script(args.source)
    if not args.limit:
        program = "const fs=require('node:fs'),vm=require('node:vm'); const c={window:{}};vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),c,{timeout:3000});process.stdout.write(JSON.stringify(c.window.POS_REVEAL_CONTENT.slides.map(s=>s.id)));"
        result = subprocess.run(['node', '-e', program, str(PRESENTATION / 'pos-reveal-content.js')], capture_output=True, check=True)
        expected = set(json.loads(result.stdout))
        if set(content) != expected:
            raise ValueError(f'Incomplete narration coverage. Missing: {sorted(expected - set(content))}; extra: {sorted(set(content) - expected)}')
    settings = {'voice': args.voice, 'rate': args.rate, 'engine': edge_tts.__version__, 'sampleRate': SAMPLE_RATE, 'gapMs': args.gap_ms, 'bitrate': '64k', 'pipeline': 1}
    # Visual targets do not alter the spoken recording or cue timing.
    spoken = {slide: [{'id': cue['id'], 'text': cue['text']} for cue in cues] for slide, cues in content.items()}
    content_hash = digest({'content': spoken, 'settings': settings})
    cache = WORK / 'cues'
    directory = OUTPUT / content_hash
    cache.mkdir(parents=True, exist_ok=True)
    directory.mkdir(parents=True, exist_ok=True)
    gate = asyncio.Semaphore(args.concurrency)

    async def synthesize(slide_id, cue):
        key = digest({'text': cue['text'], 'voice': args.voice, 'rate': args.rate, 'engine': edge_tts.__version__})
        audio = cache / f'{key}.mp3'
        meta = audio.with_suffix('.json')
        async with gate:
            if audio.is_file() and meta.is_file():
                try:
                    stored = json.loads(meta.read_text(encoding='utf8'))
                    if stored.get('sha256') == file_hash(audio) and MP3(audio).info.length > 0:
                        return audio
                except Exception:
                    # A damaged disposable cache is regenerated, never published.
                    print(f'INVALID CACHE {slide_id}/{cue["id"]}: regenerating', flush=True)
            for attempt in range(4):
                partial = audio.with_suffix('.partial.mp3')
                try:
                    words = []
                    speech = edge_tts.Communicate(cue['text'], args.voice, rate=args.rate, boundary='WordBoundary')
                    with partial.open('wb') as stream:
                        async for chunk in speech.stream():
                            if chunk['type'] == 'audio':
                                stream.write(chunk['data'])
                            elif chunk['type'] == 'WordBoundary':
                                words.append({'start': chunk['offset'] / 10_000_000, 'end': (chunk['offset'] + chunk['duration']) / 10_000_000, 'text': chunk['text']})
                    duration = MP3(partial).info.length
                    if not words or duration <= 0 or words[-1]['end'] > duration + .5:
                        raise ValueError('Incomplete or invalid speech metadata')
                    partial.replace(audio)
                    meta.write_text(json.dumps({'key': key, 'sha256': file_hash(audio), 'duration': duration, 'words': words}, ensure_ascii=False, indent=2), encoding='utf8')
                    print(f'CUE {slide_id}/{cue["id"]} {duration:.1f}s', flush=True)
                    return audio
                except Exception as error:
                    partial.unlink(missing_ok=True)
                    if attempt == 3:
                        raise RuntimeError(f'Speech failed for {slide_id}/{cue["id"]}') from error
                    print(f'RETRY {slide_id}/{cue["id"]} {attempt + 1}/4: {type(error).__name__}', flush=True)
                    await asyncio.sleep(min(2 ** attempt, 8))

    selected = list(content.items())[:args.limit] if args.limit else list(content.items())
    cue_jobs = [(slide, cue) for slide, cues in selected for cue in cues]
    # Share an in-flight request when repeated educational phrases are identical.
    # This also prevents two tasks from writing the same cache file concurrently.
    jobs_by_text = {}
    for slide, cue in cue_jobs:
        if cue['text'] not in jobs_by_text:
            jobs_by_text[cue['text']] = asyncio.create_task(synthesize(slide, cue))
    generated = await asyncio.gather(*(jobs_by_text[cue['text']] for slide, cue in cue_jobs))
    paths = {(slide, cue['id']): audio for (slide, cue), audio in zip(cue_jobs, generated)}
    if args.cache_only:
        print(json.dumps({'cacheOnly': True, 'slides': len(selected), 'cues': len(paths)}, ensure_ascii=False), flush=True)
        return
    manifest = {}
    gap = bytes(round(SAMPLE_RATE * args.gap_ms / 1000) * BYTES_PER_SAMPLE)
    for slide, cues in selected:
        chunks, timestamps = [], []
        samples = 0
        for index, cue in enumerate(cues):
            pcm = ffmpeg(['-i', str(paths[(slide, cue['id'])]), '-f', 's16le', '-acodec', 'pcm_s16le', '-ac', '1', '-ar', str(SAMPLE_RATE), '-']).stdout
            start = samples / SAMPLE_RATE
            samples += len(pcm) // BYTES_PER_SAMPLE
            timestamps.append({'id': cue['id'], 'start': round(start, 4), 'end': round(samples / SAMPLE_RATE, 4), 'textSha256': hashlib.sha256(cue['text'].encode('utf8')).hexdigest()})
            chunks.append(pcm)
            if index < len(cues) - 1:
                chunks.append(gap)
                samples += len(gap) // BYTES_PER_SAMPLE
        wav_path = directory / f'{slide}.wav'
        with wave.open(str(wav_path), 'wb') as stream:
            stream.setnchannels(1)
            stream.setsampwidth(BYTES_PER_SAMPLE)
            stream.setframerate(SAMPLE_RATE)
            for chunk in chunks:
                stream.writeframes(chunk)
        audio = directory / f'{slide}.mp3'
        ffmpeg(['-y', '-i', str(wav_path), '-map_metadata', '-1', '-ac', '1', '-ar', str(SAMPLE_RATE), '-codec:a', 'libmp3lame', '-b:a', '64k', '-write_xing', '1', str(audio)])
        wav_path.unlink()
        duration = MP3(audio).info.length
        if abs(duration - samples / SAMPLE_RATE) > .15:
            raise ValueError(f'Unexpected encoded duration: {slide}')
        manifest[slide] = {'src': f'/media/narration/{content_hash}/{slide}.mp3', 'duration': round(duration, 4), 'cues': timestamps, 'sha256': file_hash(audio), 'bytes': audio.stat().st_size}
        print(f'SLIDE {slide}: {duration:.1f}s / {len(cues)} cues', flush=True)
    total = sum(item['duration'] for item in manifest.values())
    metadata = {'schemaVersion': 1, 'contentHash': content_hash, 'voice': args.voice, 'language': 'es-CL', 'rate': args.rate, 'slides': len(manifest), 'cues': sum(len(item['cues']) for item in manifest.values()), 'duration': round(total, 4)}
    if args.limit:
        (directory / 'preview-manifest.json').write_text(json.dumps({'metadata': metadata, 'audio': manifest}, ensure_ascii=False, indent=2), encoding='utf8')
        print(json.dumps({'previewOnly': True, **metadata}, ensure_ascii=False), flush=True)
        return
    current = {slide: [{'id': cue['id'], 'text': cue['text']} for cue in cues] for slide, cues in read_script(args.source).items()}
    if current != spoken:
        raise ValueError('Narration text changed during generation. Re-run to reuse cached audio and compile the reviewed final script.')
    # Include the actual encoded audio in the public revision identity. A future
    # provider/model change cannot replace an existing immutable audio URL even
    # when the source text and package version happen to be unchanged.
    script_hash = content_hash
    content_hash = digest({'scriptHash': script_hash, 'audio': {slide: item['sha256'] for slide, item in manifest.items()}})
    final_directory = OUTPUT / content_hash
    final_directory.mkdir(parents=True, exist_ok=True)
    for slide, item in manifest.items():
        (directory / f'{slide}.mp3').replace(final_directory / f'{slide}.mp3')
        item['src'] = f'/media/narration/{content_hash}/{slide}.mp3'
    directory = final_directory
    metadata['scriptHash'] = script_hash
    metadata['contentHash'] = content_hash
    # ZIP_STORED keeps already-compressed MP3 bytes unchanged and permits a tiny,
    # strict Node build extractor with no third-party archive dependency.
    archive_file = f'pos-narration-{content_hash[:16]}.zip'
    archive_path = OUTPUT / archive_file
    with ZipFile(archive_path, 'w', compression=ZIP_STORED, allowZip64=False) as archive:
        for slide in sorted(manifest):
            entry = ZipInfo(f'{slide}.mp3', date_time=(1980, 1, 1, 0, 0, 0))
            entry.compress_type = ZIP_STORED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, (directory / entry.filename).read_bytes())
    release = f'pos-narration-{content_hash[:16]}'
    publication = {'schemaVersion': 1, **metadata, 'file': archive_file, 'url': f'https://github.com/floxcristian/pos-architecture/releases/download/{release}/{archive_file}', 'bytes': archive_path.stat().st_size, 'sha256': file_hash(archive_path), 'files': [{'file': f'{slide}.mp3', 'bytes': item['bytes'], 'sha256': item['sha256']} for slide, item in sorted(manifest.items())]}
    js = '/* Generated by tools/generate-narration.py; do not edit cue times manually. */\n'
    js += 'window.POS_REVEAL_NARRATION_AUDIO_META = ' + json.dumps(metadata, ensure_ascii=False, indent=2) + ';\n'
    js += 'window.POS_REVEAL_NARRATION_AUDIO = ' + json.dumps(manifest, ensure_ascii=False, indent=2) + ';\n'
    (PRESENTATION / 'pos-reveal-narration-audio.js').write_text(js, encoding='utf8')
    (PRESENTATION / 'narration-publication.json').write_text(json.dumps(publication, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(json.dumps({'archive': str(archive_path), 'release': release, **metadata}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=PRESENTATION / 'pos-reveal-narration-content.js')
    parser.add_argument('--voice', default='es-CL-LorenzoNeural')
    parser.add_argument('--rate', default='-5%')
    parser.add_argument('--gap-ms', type=int, default=350)
    parser.add_argument('--concurrency', type=int, choices=range(1, 5), default=2)
    parser.add_argument('--limit', type=int, help='Generate a local preview only; never overwrite published manifests')
    parser.add_argument('--cache-only', action='store_true', help='Synthesize cue cache only; do not combine, package or publish manifests')
    args = parser.parse_args()
    if not 0 <= args.gap_ms <= 2000 or (args.limit is not None and args.limit < 1):
        parser.error('Invalid gap or limit')
    asyncio.run(compile_audio(args))

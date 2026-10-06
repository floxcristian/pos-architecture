"""Objective delivery QA. Uses bundled FFmpeg; never downloads tools or edits media.

Run with video/.venv/Scripts/python.exe video/tools/check-video.py [--quick].
Quick mode checks available inputs and metadata, but does not certify full decoding
or loudness. The complete mode requires a finished MP4 and its matching manifest.
Exit codes: 0 passed requested checks; 1 failed; 2 required artifacts unavailable.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from fractions import Fraction
import hashlib
import html
import json
import math
import os
from pathlib import Path
import re
import statistics
import subprocess
import tempfile

import imageio_ffmpeg
from diagram_tours import bind_tour, load_tours


ROOT = Path(__file__).resolve().parents[1]
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
HIDDEN = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0


def require(condition, message):
    if not condition:
        raise ValueError(message)


def load(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def run_ffmpeg(arguments):
    return subprocess.run(
        [FFMPEG, '-hide_banner', '-nostdin', *arguments],
        capture_output=True, text=True, encoding='utf-8', errors='replace',
        creationflags=HIDDEN, check=True,
    )


def seconds(value):
    hours, minutes, secs = value.replace(',', '.').split(':')
    return int(hours) * 3600 + int(minutes) * 60 + float(secs)


def checked_path(base, relative):
    candidate = (base / relative).resolve()
    require(candidate.is_relative_to(base.resolve()), f'Path outside expected directory: {relative}')
    return candidate


def check_timeline(timeline, script, expected_duration):
    require((timeline['width'], timeline['height'], timeline['fps']) == (1920, 1080, 24), 'Unexpected timeline format')
    require(len(timeline['scenes']) == len(script['scenes']) == 56, 'Expected 56 scenes')
    require(len(timeline['chapters']) == len(script['chapters']) == 14, 'Expected 14 chapters')
    if expected_duration is not None:
        require(abs(timeline['duration'] - expected_duration) <= 1, 'Timeline differs from expected film duration')
    cursor = 0.0
    frames = 0
    for scene, source in zip(timeline['scenes'], script['scenes']):
        require(scene['id'] == source['id'] and scene['narration'] == source['narration'], f"Stale timeline narration: {scene['id']}")
        require(abs(scene['start'] - cursor) < .001, f"Scene gap or overlap: {scene['id']}")
        require(scene['frames'] > 0 and abs(scene['frames'] / 24 - scene['duration']) < .0001, f"Scene is not frame-aligned: {scene['id']}")
        cursor += scene['duration']
        frames += scene['frames']
    require(abs(cursor - timeline['duration']) < .001, 'Timeline total differs from scene durations')
    cursor = 0.0
    for chapter, source in zip(timeline['chapters'], script['chapters']):
        require(chapter['id'] == source['id'] and chapter['title'] == source['title'], 'Chapter order/title differs from script')
        require(abs(chapter['start'] - cursor) < .001 and chapter['end'] > chapter['start'], 'Chapter gap, overlap or empty chapter')
        require(abs(timeline['scenes'][chapter['scene']]['start'] - chapter['start']) < .001, 'Chapter does not start at its first scene')
        cursor = chapter['end']
    require(abs(cursor - timeline['duration']) < .001, 'Final chapter does not cover the film')
    return {'durationSeconds': cursor, 'frames': frames, 'scenes': 56, 'chapters': 14}


def check_audio_cache(timeline):
    rows = []
    for scene in timeline['scenes']:
        meta = load(ROOT / 'work/audio' / f"{scene['id']}.json")
        identity = {key: meta[key] for key in ('narration', 'voice', 'rate', 'engine')}
        digest = hashlib.sha256(json.dumps(identity, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
        require(meta['narration'] == scene['narration'], f"Audio narration mismatch: {scene['id']}")
        require(meta['voice'] == timeline['voice'] and meta['rate'] == timeline['voiceRate'], f"Audio voice/rate mismatch: {scene['id']}")
        require(digest == meta['sha256'] == scene['audioSha256'], f"Audio cache identity mismatch: {scene['id']}")
        require(meta['path'] == scene['audio'], f"Audio path mismatch: {scene['id']}")
        audio = checked_path(ROOT, scene['audio'])
        require(audio.is_file() and audio.stat().st_size > 1024, f"Audio absent or too small: {scene['id']}")
        require(meta['duration'] > 0 and scene['lead'] + meta['duration'] < scene['duration'], f"Narration does not fit scene: {scene['id']}")
        rows.append({'scene': scene['id'], 'cacheIdentitySha256': digest, 'observedFileSha256': sha256(audio)})
    return {'checkedScenes': len(rows), 'note': 'Cache SHA is an input-identity hash. File hashes are observed fingerprints, not proof of spoken content.', 'files': rows}


def check_diagram_tours(timeline, script):
    tours = load_tours(ROOT / 'content/diagram-tours.json', script)
    count, shortest = 0, math.inf
    for scene in timeline['scenes']:
        if scene['kind'] != 'diagram':
            continue
        audio = load(ROOT / 'work/audio' / f"{scene['id']}.json")
        expected = bind_tour(tours[scene['id']], scene, audio, scene['lead'], scene['duration'])
        require(scene.get('diagramTour') == expected, f"Stale camera timeline: {scene['id']}")
        native = load(ROOT.parent / 'docs/diagramas-excalidraw' / (scene['diagram'] + '.excalidraw'))
        ids = {element['id'] for element in native['elements']}
        require(any(cue['start'] > 9 for cue in expected['cues']), 'Camera stops before narration ends')
        for cue in expected['cues']:
            require(cue['targets'] and set(cue['targets']) <= ids, f"Missing original diagram targets: {scene['id']}/{cue['id']}")
            shortest = min(shortest, cue['end'] - cue['start'])
            count += 1
    require(shortest >= 2.3, f'Diagram shot too short to read: {shortest:.2f}s')
    return {'diagrams': len(tours), 'spokenAnchors': count, 'minimumShotSeconds': round(shortest, 3), 'timingSource': 'Exact synthesized WordBoundary anchors', 'originalTargetIdsVerified': True}


def check_subtitles(path, timeline, max_cps):
    text = path.read_text(encoding='utf-8-sig').replace('\r\n', '\n').strip()
    blocks = re.split(r'\n\s*\n', text)
    expected = [dict(cue, start=scene['start'] + cue['start'], end=scene['start'] + cue['end'])
                for scene in timeline['scenes'] for cue in scene['captions']]
    require(len(blocks) == len(expected) > 0, 'SRT cue count differs from timeline')
    previous_end = 0.0
    rates, word_rates, long_lines, fast = [], [], [], []
    for index, (block, cue) in enumerate(zip(blocks, expected), 1):
        lines = block.splitlines()
        require(len(lines) >= 3 and lines[0] == str(index), f'Invalid SRT cue number: {index}')
        match = re.fullmatch(r'(\d{2,}:\d{2}:\d{2},\d{3}) --> (\d{2,}:\d{2}:\d{2},\d{3})', lines[1])
        require(match, f'Invalid SRT timestamp: {index}')
        start, end = map(seconds, match.groups())
        payload = lines[2:]
        require(1 <= len(payload) <= 2, f'SRT exceeds two lines: {index}')
        require(start >= 0 and end > start and end <= timeline['duration'] + .001, f'SRT outside film bounds: {index}')
        require(start >= previous_end - .0001, f'Overlapping SRT cue: {index}')
        require(abs(start - cue['start']) <= .00051 and abs(end - cue['end']) <= .00051, f'SRT timing differs from timeline: {index}')
        require('\n'.join(payload) == cue['text'], f'SRT text differs from timeline: {index}')
        plain = html.unescape(re.sub(r'<[^>]*>', '', ' '.join(payload)))
        rate = len(plain) / (end - start)
        rates.append(rate)
        word_rates.append(len(plain.split()) * 60 / (end - start))
        if rate > max_cps:
            fast.append({'cue': index, 'start': start, 'charactersPerSecond': round(rate, 2)})
        if any(len(line) > 48 for line in payload):
            long_lines.append(index)
        previous_end = end
    ordered = sorted(rates)
    return {'cues': len(blocks), 'overlaps': 0, 'outOfBounds': 0, 'maximumLines': max(len(b.splitlines()) - 2 for b in blocks),
            'charactersPerSecond': {'median': round(statistics.median(rates), 2), 'p95': round(ordered[math.ceil(.95 * len(ordered)) - 1], 2), 'maximum': round(max(rates), 2)},
            'wordsPerMinute': {'median': round(statistics.median(word_rates), 1), 'maximum': round(max(word_rates), 1)},
            'reviewThresholdCps': max_cps, 'aboveReviewThreshold': fast, 'linesAbove48Characters': long_lines,
            'note': 'Reading-speed thresholds flag review cases; they are not a human comprehension assessment.'}


def check_manifest(path, timeline):
    manifest = load(path)
    for key, expected in {'language': 'es-CL', 'width': 1920, 'height': 1080, 'fps': 24, 'scenes': 56, 'chapters': 14, 'voice': timeline['voice']}.items():
        require(manifest.get(key) == expected, f'Manifest metadata mismatch: {key}')
    require(abs(manifest['durationSeconds'] - timeline['duration']) < .001, 'Manifest duration differs from timeline')
    names = [entry['name'] for entry in manifest['files']]
    require(len(names) == len(set(names)), 'Duplicate manifest file entries')
    delivery = load(ROOT / 'content/delivery.json')
    require(manifest.get('revision') == delivery['revision'], 'Delivery revision mismatch')
    required = {delivery['video'], 'pos-propuesta-es.srt', 'pos-propuesta-es.vtt', 'guion-es.md', 'capitulos.txt', 'capitulos.json', 'index.html', 'portada.jpg', 'fuentes.json'}
    require(required <= set(names), 'Manifest omits required delivery files')
    for entry in manifest['files']:
        file = checked_path(path.parent, entry['name'])
        require(file.is_file(), f"Missing manifest file: {entry['name']}")
        before = file.stat()
        require(before.st_size == entry['bytes'], f"Manifest size mismatch: {entry['name']}")
        require(re.fullmatch(r'[0-9a-f]{64}', entry['sha256']), 'Malformed manifest SHA-256')
        require(sha256(file) == entry['sha256'], f"Manifest SHA-256 mismatch: {entry['name']}")
        after = file.stat()
        require((before.st_size, before.st_mtime_ns) == (after.st_size, after.st_mtime_ns), f"File changed during verification: {entry['name']}")
    require(load(path.parent / 'capitulos.json') == timeline['chapters'], 'Packaged chapters differ from timeline')
    require(load(path.parent / 'fuentes.json') == load(ROOT / 'content/sources.json'), 'Packaged sources are stale')
    return {'filesChecked': len(names), 'sha256': sha256(path), 'metadata': {key: value for key, value in manifest.items() if key != 'files'}}


def check_video_metadata(movie, timeline):
    # Exporting ffmetadata reads the container; it does not decode the whole film.
    result = run_ffmpeg(['-i', str(movie), '-map_metadata', '0', '-map_chapters', '0', '-f', 'ffmetadata', 'pipe:1'])
    header = result.stderr.split('Output #0', 1)[0]
    duration = re.search(r'Duration:\s*(\d+:\d+:\d+\.\d+)', header)
    require(duration, 'FFmpeg did not report a duration')
    duration = seconds(duration.group(1))
    require(abs(duration - timeline['duration']) <= .15, 'Container duration differs from timeline')
    video = re.search(r'^\s*Stream .*?Video: (.+)$', header, re.MULTILINE)
    audio = re.search(r'^\s*Stream .*?\(([^)]+)\): Audio: (.+)$', header, re.MULTILINE)
    subtitles = re.search(r'^\s*Stream .*?\(([^)]+)\): Subtitle: (.+)$', header, re.MULTILINE)
    require(video and re.match(r'h264\b', video.group(1)), 'Expected H.264 video')
    require(re.search(r'\b1920x1080\b', video.group(1)), 'Expected 1920x1080 video')
    fps = re.search(r'\b([\d.]+) fps\b', video.group(1))
    require(fps and abs(float(fps.group(1)) - 24) < .02, 'Expected 24 fps video')
    require(audio and audio.group(1) == 'spa' and re.match(r'aac\b', audio.group(2)), 'Expected Spanish AAC audio')
    require(subtitles and subtitles.group(1) == 'spa' and subtitles.group(2).startswith('mov_text'), 'Expected Spanish MP4 subtitle track')
    chapters = []
    for section in result.stdout.split('[CHAPTER]')[1:]:
        values = dict(line.split('=', 1) for line in section.splitlines() if '=' in line and not line.startswith(';'))
        scale = Fraction(values['TIMEBASE'])
        title = re.sub(r'\\(.)', r'\1', values.get('title', ''))
        chapters.append({'start': float(int(values['START']) * scale), 'end': float(int(values['END']) * scale), 'title': title})
    require(len(chapters) == 14, f'Expected 14 embedded chapters, got {len(chapters)}')
    for actual, expected in zip(chapters, timeline['chapters']):
        require(actual['title'] == expected['title'], 'Embedded chapter title mismatch')
        require(abs(actual['start'] - expected['start']) <= .002 and abs(actual['end'] - expected['end']) <= .002, 'Embedded chapter timing mismatch')
    return {'width': 1920, 'height': 1080, 'fps': float(fps.group(1)), 'videoCodec': 'h264', 'audioCodec': 'aac', 'audioLanguage': 'spa', 'subtitleLanguage': 'spa', 'durationSeconds': duration, 'chapters': chapters}


def check_full_decode(movie, timeline, target_lufs, lufs_tolerance, max_true_peak):
    arguments = [FFMPEG, '-hide_banner', '-nostdin', '-y', '-nostats', '-loglevel', 'info', '-xerror',
                 '-err_detect', 'explode', '-threads', '2', '-i', str(movie), '-map', '0:v:0', '-map', '0:a:0',
                 '-map_metadata', '-1', '-map_chapters', '-1', '-filter_threads', '1',
                 '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json', '-fps_mode', 'passthrough',
                 '-progress', 'pipe:1', '-stats_period', '15', '-f', 'null', os.devnull]
    progress = {}
    next_percent = 25
    print('Full decode and final AAC loudness: starting', flush=True)
    with tempfile.TemporaryFile(mode='w+b') as errors:
        with subprocess.Popen(arguments, stdout=subprocess.PIPE, stderr=errors, text=True, encoding='utf-8', errors='replace', creationflags=HIDDEN) as process:
            for line in process.stdout:
                key, separator, value = line.strip().partition('=')
                if not separator:
                    continue
                progress[key] = value
                if key == 'out_time_us' and value.isdigit():
                    percent = min(100, float(value) / 1_000_000 / timeline['duration'] * 100)
                    if percent >= next_percent:
                        print(f'Full decode: {percent:.0f}%', flush=True)
                        next_percent = min(125, (int(percent) // 25 + 1) * 25)
            code = process.wait()
        errors.seek(0)
        log = errors.read().decode('utf-8', errors='replace')
    require(code == 0, f'FFmpeg full decode failed ({code}): {log[-3500:]}')
    require(progress.get('progress') == 'end', 'FFmpeg did not reach the end of the film')
    expected_frames = sum(scene['frames'] for scene in timeline['scenes'])
    decoded_frames = int(progress.get('frame', '-1'))
    require(decoded_frames == expected_frames, f'Decoded frames {decoded_frames} != expected {expected_frames}')
    decoded_duration = float(progress['out_time_us']) / 1_000_000
    require(abs(decoded_duration - timeline['duration']) <= .15, 'Decoded duration differs from timeline')
    measurements = re.findall(r'\{\s*"input_i"[\s\S]*?\}', log)
    require(measurements, 'FFmpeg did not emit loudness measurements')
    measured = json.loads(measurements[-1])
    integrated, peak = float(measured['input_i']), float(measured['input_tp'])
    require(math.isfinite(integrated) and math.isfinite(peak), 'No finite audio loudness measured')
    result = {'decodedFrames': decoded_frames, 'expectedFrames': expected_frames, 'decodedDurationSeconds': decoded_duration,
              'integratedLufs': integrated, 'truePeakDbtp': peak, 'loudnessRangeLu': float(measured['input_lra']),
              'targetLufs': target_lufs, 'toleranceLu': lufs_tolerance, 'maximumTruePeakDbtp': max_true_peak,
              'inputMeasurement': measured, 'strictDecode': True, 'note': 'Measured the delivered AAC track. This is objective analysis, not human listening.'}
    result['loudnessPassed'] = abs(integrated - target_lufs) <= lufs_tolerance and peak <= max_true_peak
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--quick', action='store_true', help='Skip complete decode and loudness measurement')
    parser.add_argument('--expected-duration', type=float, help='Optional editorial duration reference in seconds')
    parser.add_argument('--target-lufs', type=float, default=-16)
    parser.add_argument('--lufs-tolerance', type=float, default=1)
    parser.add_argument('--max-true-peak', type=float, default=-1)
    parser.add_argument('--review-cps', type=float, default=25, help='Reading-speed review threshold; reported, not a conformance claim')
    args = parser.parse_args()
    report = {'generatedAt': datetime.now(timezone.utc).isoformat(), 'mode': 'quick' if args.quick else 'full',
              'scope': 'Objective artifact validation; no claim of human listening or visual review.', 'ffmpeg': FFMPEG, 'checks': {}, 'warnings': []}
    failures, missing = [], []

    def check(name, action):
        try:
            result = action()
            report['checks'][name] = {'status': 'PASS', 'result': result}
            print(f'PASS {name}', flush=True)
            return result
        except FileNotFoundError as error:
            missing.append(name)
            report['checks'][name] = {'status': 'MISSING', 'error': str(error)}
        except Exception as error:
            failures.append(name)
            message = error.stderr[-3500:] if isinstance(error, subprocess.CalledProcessError) and error.stderr else str(error)
            report['checks'][name] = {'status': 'FAIL', 'error': message}
            print(f'FAIL {name}: {message}', flush=True)
        return None

    timeline = check('timelineInput', lambda: load(ROOT / 'work/timeline.json'))
    script = check('scriptInput', lambda: load(ROOT / 'content/scenes.json'))
    # Avoid duplicating the entire script in the QA report.
    for name in ('timelineInput', 'scriptInput'):
        if report['checks'][name]['status'] == 'PASS':
            report['checks'][name]['result'] = {'loaded': True}
    movie = ROOT / 'output' / load(ROOT / 'content/delivery.json')['video']
    if timeline and script:
        check('timeline', lambda: check_timeline(timeline, script, args.expected_duration))
        check('audioCache', lambda: check_audio_cache(timeline))
        check('narratedDiagramTours', lambda: check_diagram_tours(timeline, script))
        captions = check('subtitles', lambda: check_subtitles(ROOT / 'output/pos-propuesta-es.srt', timeline, args.review_cps))
        if captions and (captions['aboveReviewThreshold'] or captions['linesAbove48Characters']):
            report['warnings'].append('Subtitles contain reading-speed or line-length review cases; see subtitle metrics.')
        manifest = check('deliveryManifest', lambda: check_manifest(ROOT / 'output/manifest.json', timeline))
        metadata = check('videoMetadata', lambda: check_video_metadata(movie, timeline)) if movie.is_file() else None
        if not movie.is_file():
            missing.append('videoMetadata')
            report['checks']['videoMetadata'] = {'status': 'MISSING', 'error': str(movie)}
        if not args.quick and manifest and metadata and not failures and not missing:
            full = check('fullDecodeAndLoudness', lambda: check_full_decode(movie, timeline, args.target_lufs, args.lufs_tolerance, args.max_true_peak))
            if full and not full['loudnessPassed']:
                failures.append('fullDecodeAndLoudness')
                report['checks']['fullDecodeAndLoudness']['status'] = 'FAIL'
                report['checks']['fullDecodeAndLoudness']['error'] = 'Delivered audio is outside the requested loudness or true-peak target.'
        else:
            report['checks']['fullDecodeAndLoudness'] = {'status': 'SKIPPED', 'reason': 'Quick mode or incomplete/unverified delivery artifacts.'}
    report['status'] = 'FAIL' if failures else 'INCOMPLETE' if missing else 'QUICK_PASS' if args.quick else 'PASS'
    report['failedChecks'], report['missingChecks'] = failures, missing
    destination = ROOT / 'work/qa/final-video-report.json'
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"{report['status']}: {destination}", flush=True)
    return 1 if failures else 2 if missing else 0


if __name__ == '__main__':
    raise SystemExit(main())

"""Assemble exact-length audio/video, normalize voice, and retain navigable MP4 chapters."""
from __future__ import annotations
import json
import re
import subprocess
import wave
from pathlib import Path
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
RATE = 48000

def command(args, **kwargs):
    return subprocess.run([FFMPEG, '-hide_banner', '-y', *args], cwd=ROOT, check=True, **kwargs)

def main():
    timeline = json.loads((ROOT / 'work/timeline.json').read_text(encoding='utf-8'))
    delivery = json.loads((ROOT / 'content/delivery.json').read_text(encoding='utf-8'))
    output = ROOT / 'output'
    output.mkdir(exist_ok=True)
    master = ROOT / 'work/narration-master.wav'
    concat = ['ffconcat version 1.0']
    with wave.open(str(master), 'wb') as result:
        result.setnchannels(1)
        result.setsampwidth(2)
        result.setframerate(RATE)
        for scene in timeline['scenes']:
            segment = ROOT / 'work/segments' / (scene['id'] + '.mp4')
            assert segment.is_file(), f'Missing scene: {scene["id"]}'
            pcm = command(['-loglevel', 'error', '-i', str(ROOT / scene['audio']), '-f', 's16le', '-ac', '1', '-ar', str(RATE), 'pipe:1'], capture_output=True).stdout
            leading = bytes(round(scene['lead'] * RATE) * 2)
            required = round(scene['duration'] * RATE) * 2
            assert len(leading) + len(pcm) < required, f'Voice clipped: {scene["id"]}'
            result.writeframes(leading + pcm + bytes(required - len(leading) - len(pcm)))
            escaped = segment.as_posix().replace("'", "'\\''")
            concat.extend([f"file '{escaped}'", f"duration {scene['duration']:.9f}"])
    (ROOT / 'work/segments.ffconcat').write_text('\n'.join(concat) + '\n', encoding='utf-8')
    print('Exact narration assembled. Measuring voice loudness…', flush=True)
    measured = command(['-i', str(master), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    matches = re.findall(r'\{\s*"input_i"[\s\S]*?\}', measured)
    assert matches, 'Missing loudness measurement'
    loudness = json.loads(matches[-1])
    (ROOT / 'work/loudness.json').write_text(json.dumps(loudness, indent=2), encoding='utf-8')
    normalizer = f"loudnorm=I=-16:TP=-1.5:LRA=9:measured_I={loudness['input_i']}:measured_TP={loudness['input_tp']}:measured_LRA={loudness['input_lra']}:measured_thresh={loudness['input_thresh']}:offset={loudness['target_offset']}:linear=true:print_format=summary"
    destination = output / delivery['video']
    print('Muxing the final film, chapters and optional subtitle track…', flush=True)
    command(['-f', 'concat', '-safe', '0', '-i', str(ROOT / 'work/segments.ffconcat'), '-i', str(master), '-i', str(ROOT / 'work/chapters.ffmeta'), '-i', str(output / 'pos-propuesta-es.srt'), '-map', '0:v:0', '-map', '1:a:0', '-map', '3:0', '-map_metadata', '2', '-map_chapters', '2', '-c:v', 'copy', '-af', normalizer, '-ar', str(RATE), '-ac', '2', '-c:a', 'aac', '-b:a', '128k', '-c:s', 'mov_text', '-metadata:s:a:0', 'language=spa', '-metadata:s:s:0', 'language=spa', '-disposition:s:0', '0', '-t', f"{timeline['duration']:.9f}", '-movflags', '+faststart', str(destination)])
    print(json.dumps({'video': str(destination), 'bytes': destination.stat().st_size, 'durationSeconds': timeline['duration'], 'scenes': len(timeline['scenes']), 'chapters': len(timeline['chapters']), 'voice': timeline['voice']}, ensure_ascii=False), flush=True)

if __name__ == '__main__':
    main()

"""Check that encoded diagram clips actually contain every narration-timed camera pose."""
from __future__ import annotations
import argparse
import json
import math
import subprocess
from pathlib import Path
import imageio_ffmpeg
from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--scenes', help='Comma-separated completed scene IDs for an intermediate check')
    args = parser.parse_args()
    source = ROOT / 'work/qa/guided'
    storyboard = json.loads((source / 'tour-report.json').read_text(encoding='utf-8'))
    assert storyboard['status'] == 'PASS', 'Source storyboard must pass first'
    target = source / 'encoded'
    target.mkdir(exist_ok=True)
    report = {'status': 'RUNNING', 'checks': [], 'failures': [], 'scope': 'Encoded camera matching against all inspected narration poses; excludes the separately burned subtitle band.'}
    selected = set(args.scenes.split(',')) if args.scenes else None
    scenes = [scene for scene in storyboard['scenes'] if not selected or scene['id'] in selected]
    assert not selected or selected == {scene['id'] for scene in scenes}, 'Unknown scene selection'
    report['subset'] = sorted(selected) if selected else None
    for scene in scenes:
        clip = ROOT / 'work/segments' / (scene['id'] + '.mp4')
        assert clip.exists() and not clip.with_suffix('.partial.mp4').exists(), f'Clip not ready: {clip}'
        for cue in scene['cues']:
            destination = target / cue['image']
            subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(cue['sample']), '-i', str(clip), '-frames:v', '1', str(destination)], check=True)
            reference = Image.open(source / cue['image']).convert('RGB')
            actual = Image.open(destination).convert('RGB')
            checks = {}
            # Separate camera and guide so a static crop cannot hide behind unchanged surroundings.
            for name, bounds in {'diagram': (88,343,1360,774), 'guide': (1392,343,1832,774)}.items():
                difference = ImageChops.difference(reference.crop(bounds), actual.crop(bounds))
                values = ImageStat.Stat(difference).rms
                checks[name] = round(math.sqrt(sum(n*n for n in values)/3), 3)
            entry = {'scene': scene['id'], 'cue': cue['id'], 'time': cue['sample'], 'phrase': cue['phrase'], 'pixelRms': checks, 'image': str(destination.relative_to(ROOT))}
            report['checks'].append(entry)
            if max(checks.values()) > 9:
                report['failures'].append(entry)
        print(f"CHECK {scene['id']}: {len(scene['cues'])} encoded camera poses", flush=True)
    report['status'] = 'FAIL' if report['failures'] else 'PASS'
    report_name = 'encoded-tour-report-partial.json' if selected else 'encoded-tour-report.json'
    (source / report_name).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'status': report['status'], 'poses': len(report['checks']), 'failures': len(report['failures'])}))
    return bool(report['failures'])


if __name__ == '__main__':
    raise SystemExit(main())

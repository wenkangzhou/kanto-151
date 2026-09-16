"""Generate the offline voice catalog. Explicit --generate required; no automatic paid retries.

Completed clips are reused. Requests interrupted after submission are marked uncertain:
inspect those separately before explicitly removing their ledger entry to retry.
"""
import argparse
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import subprocess
import threading
import time
import urllib.request

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--generate', action='store_true')
parser.add_argument('--workers', type=int, default=3)
parser.add_argument('--retry-rate-limited', action='store_true', help='Retry only explicit 1002 rejections; never uncertain submissions')
args = parser.parse_args()
catalog = json.loads(Path('data/voice/catalog.json').read_text())
output = Path('public/audio/voices')
ledger_dir = Path('data/voice/results')
output.mkdir(parents=True, exist_ok=True)
ledger_dir.mkdir(parents=True, exist_ok=True)
lock = threading.Lock()
rate_lock = threading.Lock()
next_request = 0.0
halt = threading.Event()

def save(path, value):
    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    tmp.replace(path)

def paths(clip):
    return output / (clip['id'] + '.mp3'), ledger_dir / (clip['id'] + '.json')

# Reuse the already-paid test when all synthesis settings and text match.
preview_meta = Path('public/audio/voice-preview/minimax-pikachu.json')
if preview_meta.exists():
    preview = json.loads(preview_meta.read_text())
    for clip in catalog['clips']:
        request = preview['request']
        if clip['text'] == request['text'] and all(request[k] == v for k, v in catalog['settings'].items()):
            audio, meta = paths(clip)
            if not meta.exists():
                data = preview_meta.with_suffix('.mp3').read_bytes()
                audio.write_bytes(data)
                save(meta, {'status': 'complete', 'id': clip['id'], 'extra_info': preview['extra_info'], 'sha256': hashlib.sha256(data).hexdigest(), 'reusedPreview': True})

pending = []
for clip in catalog['clips']:
    audio, meta = paths(clip)
    if meta.exists():
        result = json.loads(meta.read_text())
        if args.retry_rate_limited and result['status'] == 'rejected' and result.get('code') == 1002:
            pending.append(clip)
            continue
        if result['status'] != 'complete' or not audio.exists() or hashlib.sha256(audio.read_bytes()).hexdigest() != result['sha256']:
            raise SystemExit('Review incomplete/uncertain/corrupt clip before resuming: ' + clip['id'])
    else:
        pending.append(clip)
print(json.dumps({'total': len(catalog['clips']), 'cached': len(catalog['clips'])-len(pending), 'pending': len(pending), 'pendingTextCharacters': sum(len(c['text']) for c in pending)}), flush=True)
if not args.generate:
    raise SystemExit(0)

key = os.environ.get('MINIMAX_AUDIO_TTS_API_KEY')
for filename in ['.env.local', 'env.local']:
    if key or not Path(filename).exists():
        continue
    for line in Path(filename).read_text().splitlines():
        name, sep, value = line.strip().removeprefix('export ').partition('=')
        if sep and name.strip() == 'MINIMAX_AUDIO_TTS_API_KEY':
            key = value.strip().strip('\"\x27')
if not key:
    raise SystemExit('Missing MINIMAX_AUDIO_TTS_API_KEY')

completed = 0
usage = 0
def generate(clip):
    global completed, usage, next_request
    if halt.is_set():
        return
    # Paid accounts default to 20 RPM. Space starts with a small safety margin.
    with rate_lock:
        time.sleep(max(0, next_request - time.monotonic()))
        next_request = time.monotonic() + 3.2
    if halt.is_set():
        return
    audio, meta = paths(clip)
    save(meta, {'id': clip['id'], 'status': 'submitted'})
    try:
        body = {**catalog['settings'], 'text': clip['text'], 'stream': False, 'subtitle_enable': False}
        request = urllib.request.Request('https://api.minimax.cn/v1/t2a_v2', data=json.dumps(body).encode(), headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=90) as response:
            result = json.load(response)
        code = result.get('base_resp', {}).get('status_code')
        if code != 0:
            save(meta, {'id': clip['id'], 'status': 'rejected', 'code': code})
            raise ValueError('API rejected request')
        data = bytes.fromhex(result['data']['audio'])
        tmp = audio.with_suffix('.tmp.mp3')
        tmp.write_bytes(data)
        # Verify actual decode, not only HTTP success. Preserve failures for inspection.
        subprocess.run(['ffmpeg', '-v', 'error', '-i', str(tmp), '-f', 'null', '-'], check=True, capture_output=True)
        tmp.replace(audio)
        info = result.get('extra_info', {})
        save(meta, {'id': clip['id'], 'status': 'complete', 'extra_info': info, 'sha256': hashlib.sha256(data).hexdigest(), 'trace_id': result.get('trace_id')})
        with lock:
            completed += 1
            usage += info.get('usage_characters', 0)
            if completed % 10 == 0 or completed == len(pending):
                print(json.dumps({'generated': completed, 'pendingAtStart': len(pending), 'usageCharactersThisRun': usage}), flush=True)
    except Exception as error:
        halt.set()
        # Never log headers, environment values, or raw responses.
        print(json.dumps({'stoppedAt': clip['id'], 'errorType': type(error).__name__, 'automaticRetry': False}), flush=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, min(args.workers, 5))) as pool:
    list(pool.map(generate, pending))
if halt.is_set():
    raise SystemExit('Stopped; inspect ledger before retrying any submitted request.')
print('All clips generated and decoded successfully.', flush=True)

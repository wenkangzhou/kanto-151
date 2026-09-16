"""Audit cached speech without any API requests and build a local audition page."""
import hashlib
import html
import json
from pathlib import Path

catalog = json.loads(Path('data/voice/catalog.json').read_text())
entries = []
missing = []
usage = duration = size = 0
for clip in catalog['clips']:
    audio = Path('public/audio/voices') / (clip['id'] + '.mp3')
    meta = Path('data/voice/results') / (clip['id'] + '.json')
    if not meta.exists() or not audio.exists():
        missing.append(clip['id'])
        continue
    result = json.loads(meta.read_text())
    if result['status'] != 'complete' or hashlib.sha256(audio.read_bytes()).hexdigest() != result['sha256']:
        missing.append(clip['id'])
        continue
    info = result['extra_info']
    usage += info.get('usage_characters', 0)
    duration += info.get('audio_length', 0)
    size += audio.stat().st_size
    entries.append({**clip, 'url': '/audio/voices/' + audio.name, 'durationMs': info.get('audio_length', 0)})

report = {'expected': len(catalog['clips']), 'complete': len(entries), 'missing': missing,
          'usageCharacters': usage, 'durationSeconds': round(duration / 1000, 2), 'bytes': size,
          'includesPreviouslyGeneratedPreview': True}
Path('data/voice/summary.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
# Only expose a runtime manifest after the entire inventory has passed validation.
if not missing:
    Path('public/audio/voices/manifest.json').write_text(json.dumps({'settings': catalog['settings'], 'clips': entries}, ensure_ascii=False, indent=2) + '\n')
    Path('src/data/voice-index.json').write_text(json.dumps({c['text']: [c['id'], c['durationMs']] for c in entries}, ensure_ascii=False, separators=(',', ':')) + '\n')

rows = '\n'.join('<li data-category="' + html.escape(c['category'], quote=True) + '"><small>' + html.escape(c['category']) + '</small><p>' + html.escape(c['text']) + '</p><audio controls preload="none" src="' + c['id'] + '.mp3"></audio></li>' for c in entries)
page = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>冒险语音试听</title>
<style>body{font:18px/1.6 system-ui,sans-serif;max-width:850px;margin:32px auto;padding:0 20px;background:#f7f8f5;color:#28343b}h1{font-size:28px}input{font:inherit;padding:12px;width:100%;box-sizing:border-box;border:1px solid #ccc;border-radius:12px}ul{padding:0}li{list-style:none;background:white;border-radius:16px;padding:20px;margin:16px 0}small{color:#66776a}p{margin:8px 0}audio{width:100%;max-width:400px}</style>
<h1>冒险语音试听</h1><p>MiniMax speech-2.8-hd · hunyin_6 · happy</p><p>生成进度：COUNT。此页只播放已有音频，不会调用生成接口。</p><input id="search" type="search" placeholder="搜索皮卡丘、属性、招式…" aria-label="搜索语音"><ul>ROWS</ul>
<script>const rows=[...document.querySelectorAll('li')];document.querySelector('#search').addEventListener('input',e=>{const q=e.target.value.trim();rows.forEach(row=>row.hidden=!row.textContent.includes(q))});document.addEventListener('play',e=>{if(e.target.tagName==='AUDIO')document.querySelectorAll('audio').forEach(a=>{if(a!==e.target)a.pause()})},true);</script></html>'''
Path('public/audio/voices/preview.html').write_text(page.replace('COUNT', f"{len(entries)} / {len(catalog['clips'])}").replace('ROWS', rows))
print(json.dumps({**report, 'missing': len(missing)}, ensure_ascii=False))
raise SystemExit(1 if missing else 0)

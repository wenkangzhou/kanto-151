"""Generate short original type cues; deterministic, no external audio or APIs."""
import math
import random
import struct
import wave
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'public/audio/battle/types'
OUT.mkdir(parents=True, exist_ok=True)
TYPES = 'normal fire water electric grass ice fighting poison ground flying psychic bug rock ghost dragon dark steel fairy'.split()
RATE = 24000
for index, kind in enumerate(TYPES):
    rng = random.Random(index)
    samples = []
    low = 0.0
    duration = .48
    for i in range(int(RATE * duration)):
        t = i / RATE
        u = t / duration
        noise = rng.uniform(-1, 1)
        low = .84 * low + .16 * noise
        envelope = min(1, t / .008) * (1 - u) ** 1.8
        if kind == 'electric':
            value = .42 * math.sin(2 * math.pi * (650 * t + 160 * t*t)) * math.sin(2 * math.pi * 45 * t) + .22 * noise
        elif kind in ('water', 'poison'):
            freq = 1050 if kind == 'water' else 480
            value = .35 * low + .4 * math.sin(2 * math.pi * (freq * t - 500 * t*t)) * max(0, math.sin(2 * math.pi * 11 * t))
        elif kind in ('rock', 'ground', 'fighting', 'normal'):
            pulse = math.exp(-35 * (t % .12))
            value = pulse * (.55 * low + .45 * math.sin(2 * math.pi * (135 if kind == 'rock' else 85) * t))
        elif kind in ('fire', 'dragon'):
            value = .8 * low + .18 * noise * max(0, math.sin(2 * math.pi * 28 * t))
        elif kind in ('grass', 'flying', 'bug'):
            value = .5 * (noise - low) * math.sin(math.pi * u) + .15 * math.sin(2 * math.pi * (350 * t + 650 * t*t))
        elif kind in ('ice', 'steel', 'fairy'):
            freq = {'ice':1300,'steel':780,'fairy':1047}[kind]
            value = .24 * math.sin(2 * math.pi * freq * t) + .15 * math.sin(2 * math.pi * freq * 1.5 * t) * math.exp(-5*t)
        else:
            value = .4 * math.sin(2 * math.pi * (250 * t + 450 * t*t)) * (.6 + .4 * math.sin(2 * math.pi * 8 * t))
        samples.append(value * envelope)
    peak = max(abs(v) for v in samples)
    with wave.open(str(OUT / f'{kind}.wav'), 'wb') as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(RATE)
        audio.writeframes(b''.join(struct.pack('<h', round(v / peak * .65 * 32767)) for v in samples))

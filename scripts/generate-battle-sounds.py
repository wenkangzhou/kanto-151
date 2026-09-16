"""Generate short original battle cues (not extracted game sound effects)."""
import math, wave, struct
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'public/audio/battle'
root.mkdir(parents=True,exist_ok=True)
for name,duration in [('throw',.38),('hit',.22)]:
    rate=22050
    with wave.open(str(root/(name+'.wav')),'wb') as out:
        out.setparams((1,2,rate,0,'NONE','not compressed'))
        samples=[]
        for i in range(int(rate*duration)):
            t=i/rate;u=t/duration
            envelope=math.sin(math.pi*u)**2*(1-u)
            phase=2*math.pi*((480*t+1800*t*t) if name=='throw' else (180*t-180*t*t))
            value=math.sin(phase)+.25*math.sin(phase*2.7)
            samples.append(struct.pack('<h',int(15000*value*envelope)))
        out.writeframes(b''.join(samples))

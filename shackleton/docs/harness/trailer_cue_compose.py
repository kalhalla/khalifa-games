# Shackleton — original score, organ-led ambient. Not based on any existing melody.
import numpy as np, sys
from scipy.signal import fftconvolve, butter, sosfilt
SR = 44100
rng = np.random.default_rng(7)
def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
NOTE = {'C':0,'Db':1,'D':2,'Eb':3,'E':4,'F':5,'Gb':6,'G':7,'Ab':8,'A':9,'Bb':10,'B':11}
def nm(s):
    name, octv = s[:-1], int(s[-1]); return 12 * (octv + 1) + NOTE[name]
def organ(freq, dur, amp, attack=1.6, release=2.6, bright=0.0, detune=0.0):
    n = int((dur + release) * SR); t = np.arange(n) / SR
    parts = [(1, 1.0), (2, 0.55), (3, 0.28), (4, 0.30), (6, 0.12), (8, 0.10)]
    if bright > 0: parts += [(5, 0.10 * bright), (10, 0.07 * bright), (12, 0.06 * bright), (16, 0.04 * bright)]
    sig = np.zeros(n)
    for k, a in parts:
        f = freq * k * (1 + detune * 1e-3)
        if f > SR / 2.2: continue
        sig += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28))
    sig *= 1 + 0.015 * np.sin(2 * np.pi * 0.23 * t + rng.uniform(0, 6.28))
    env = np.ones(n)
    a = int(attack * SR); d = int(dur * SR)
    env[:a] = (np.linspace(0, 1, a)) ** 1.6
    env[d:] = np.linspace(1, 0, n - d) ** 2
    return sig * env * amp / 2.5
def pluck(freq, amp, decay=0.9):
    n = int((decay * 4) * SR); t = np.arange(n) / SR
    sig = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t) + 0.12 * np.sin(2 * np.pi * freq * 3 * t)
    return sig * np.exp(-t / decay) * np.minimum(1, t / 0.006) * amp
def tick(amp):
    n = int(0.03 * SR); noise = rng.standard_normal(n)
    sos = butter(2, [1800, 5200], btype='band', fs=SR, output='sos')
    return sosfilt(sos, noise) * np.exp(-np.arange(n) / (0.004 * SR)) * amp
def place(buf, sig, at, pan=0.0):
    i = int(at * SR); j = min(len(buf), i + len(sig)); s = sig[:j - i]
    buf[i:j, 0] += s * np.sqrt(0.5 * (1 - pan)); buf[i:j, 1] += s * np.sqrt(0.5 * (1 + pan))
def reverb(buf, secs=5.5, wet=0.42):
    n = int(secs * SR); t = np.arange(n) / SR
    out = np.zeros_like(buf)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t / (secs / 6.0))
        ir = sosfilt(butter(1, 5500, btype='low', fs=SR, output='sos'), ir)
        ir[:int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, ch] = fftconvolve(buf[:, ch], ir)[:len(buf)]
    return buf * (1 - wet) + out * wet * 1.6
CHORDS = [['D2','A2','D3','F3','A3','E4'], ['Bb1','F2','D3','F3','A3','C4'], ['G1','D2','Bb2','D3','F3','A3'], ['A1','E2','A2','D3','E3','G3']]
OST = [['A4','D5'], ['F4','D5'], ['D4','Bb4'], ['E4','A4']]
def render(total, plan, path):
    buf = np.zeros((int((total + 8) * SR), 2))
    for ev in plan(): ev(buf)
    buf = reverb(buf)[:int(total * SR)]
    peak = np.max(np.abs(buf)); buf = np.tanh(buf / peak * 1.1) / np.tanh(1.1) * 0.89
    import wave
    w = wave.open(path, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((buf * 32767).astype(np.int16).tobytes()); w.close(); print('wrote', path)
def trailer_plan():
    evs = []
    for n in CHORDS[0][:3]:
        evs.append(lambda b, f=midi(nm(n)): place(b, organ(f, 9.0, 0.45, attack=3.5), 0.0))
    for q in range(26): evs.append(lambda b, t=2.0 + q * 0.94: place(b, tick(0.06 + q * 0.002), t, pan=0.1))
    seq = [(6.0,0,4.0,0.6,0.2),(10.0,1,4.0,0.7,0.4),(14.0,2,3.0,0.8,0.7),(17.0,3,3.0,0.9,0.9),(20.0,0,2.5,1.0,1.2),(22.5,1,2.5,1.1,1.5),(25.0,3,2.6,1.25,1.9)]
    for (t0, ci, dur, amp, br) in seq:
        for k, n in enumerate(CHORDS[ci]):
            evs.append(lambda b, f=midi(nm(n)), t0=t0, d=dur, a=amp, br=br, k=k: place(b, organ(f, d + 0.3, a * (1.1 if k < 2 else 0.85), attack=0.5 if t0 > 14 else 1.2, release=1.8, bright=br, detune=(k % 2) * 0.6), t0, pan=(k - 2.5) * 0.12))
        evs.append(lambda b, f=midi(nm(CHORDS[ci][0]) - 12), t0=t0, d=dur, a=amp: place(b, organ(f, d + 0.3, 0.5 * a, attack=0.8), t0))
    t = 8.0; e = 0
    while t < 27.4:
        ci = 0 if t < 10 else 1 if t < 14 else 2 if t < 17 else 3 if t < 20 else 0 if t < 22.5 else 1 if t < 25 else 3
        step = 0.5 if t < 20 else 0.25
        note = OST[ci][e % 2]; a = 0.08 + (t - 8) * 0.012
        evs.append(lambda b, f=midi(nm(note)), t=t, a=a, e=e: place(b, pluck(f, a, decay=0.5 if t > 20 else 0.8), t, pan=0.25 if e % 2 else -0.25))
        t += step; e += 1
    for k, n in enumerate(['D1','D2','A2','D3','F3','A3','D4','E4','A4']):
        evs.append(lambda b, f=midi(nm(n)), k=k: place(b, organ(f, 0.45, 2.6 if k < 3 else 1.9, attack=0.03, release=0.5, bright=2.4), 27.4, pan=(k - 4) * 0.08))
    return evs
render(30.0, trailer_plan, '/home/claude/h/music/shackleton_trailer_cue.wav')

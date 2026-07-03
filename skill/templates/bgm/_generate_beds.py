#!/usr/bin/env python
"""Generate the bundled BGM beds — ORIGINAL procedural music, claim-proof by construction.

WHY original: platform Content-ID (Facebook Rights Manager / YouTube) fingerprints audio
and false-claims even legally-licensed music (Kevin MacLeod etc. get registered by
aggregators). Music WE synthesise has no external recording to match, so it is never
auto-muted / claimed on FB, IG, YT or TikTok. No attribution required.

Three DISTINCT styles (not one loop with swapped chords) so `--bgm random` gives variety:
  - amber-drift : lo-fi hip-hop  · 72 BPM · boom-bap · warm Rhodes · sparse
  - slate-focus : synthwave      · 100 BPM · four-on-floor · pulsing saw bass + arp
  - mint-lift   : uplifting pluck · 88 BPM · half-time · bright bell arpeggio
Each = numpy DSP (drums / bass / keys / lead) + scipy filters; ffmpeg only encodes mp3.

Run:  python _generate_beds.py       # writes the 3 pool beds next to this file
The `_` prefix keeps THIS file out of the BGM pool (see lib/audio/bgm.py:bgm_pool).
"""
from __future__ import annotations

import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
HERE = Path(__file__).resolve().parent
np.random.seed(7)  # deterministic — regenerating yields identical beds


# ---- helpers -------------------------------------------------------------
def note_hz(name: str) -> float:
    semis = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5,
             "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    m = re.match(r"([A-G]#?)(-?\d+)", name)
    midi = 12 * (int(m.group(2)) + 1) + semis[m.group(1)]
    return 440.0 * 2 ** ((midi - 69) / 12)


def decay_env(n, tau, attack=0.004):
    t = np.arange(n) / SR
    e = np.exp(-t / tau)
    a = int(attack * SR)
    if 0 < a < n:
        e[:a] *= np.linspace(0, 1, a)
    return e


def hp(x, f):
    return sosfilt(butter(2, f / (SR / 2), btype="high", output="sos"), x)


def lp(x, f):
    return sosfilt(butter(2, f / (SR / 2), btype="low", output="sos"), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x)


def osc(freq, n, kind="sine"):
    t = np.arange(n) / SR
    ph = t * freq
    if kind == "saw":
        return 2 * (ph - np.floor(0.5 + ph))
    if kind == "square":
        return np.sign(np.sin(2 * np.pi * ph))
    if kind == "tri":
        return 2 * np.abs(2 * (ph - np.floor(0.5 + ph))) - 1
    return np.sin(2 * np.pi * ph)


# ---- drum voices ---------------------------------------------------------
def kick(dur=0.34):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 48 + 120 * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * decay_env(n, 0.16)
    click = np.random.randn(n) * decay_env(n, 0.004) * 0.25
    return (body + click) * 0.95


def snare(dur=0.22):
    n = int(dur * SR)
    noise = bp(np.random.randn(n), 900, 6500) * decay_env(n, 0.085)
    tone = np.sin(2 * np.pi * 190 * np.arange(n) / SR) * decay_env(n, 0.06) * 0.35
    return (noise * 0.8 + tone) * 0.6


def hat(dur=0.06, open_=False):
    n = int(dur * SR)
    return hp(np.random.randn(n), 7000) * decay_env(n, 0.11 if open_ else 0.022) * 0.30


# ---- pitched voices ------------------------------------------------------
def bass(freq, dur, amp=0.34, kind="sub"):
    n = int(dur * SR)
    if kind == "saw":                                   # synthwave pulse bass
        w = lp(osc(freq, n, "saw"), 1400)
        return w * decay_env(n, dur * 0.6, attack=0.006) * amp
    if kind == "pluck":
        w = lp(osc(freq, n, "tri"), 900)
        return w * decay_env(n, 0.22, attack=0.006) * amp
    tri = osc(freq, n, "tri")                            # warm sub
    sub = osc(freq, n, "sine") * 0.6
    return lp(tri * 0.5 + sub, 700) * decay_env(n, 0.5, attack=0.012) * amp


def keys(freqs, dur, amp=0.16, timbre="rhodes"):
    n = int(dur * SR)
    out = np.zeros(n)
    for f in freqs:
        if timbre == "saw":
            out += lp(osc(f, n, "saw"), 3600)
        elif timbre == "bell":
            out += osc(f, n, "sine") + 0.4 * osc(f * 3.01, n, "sine")
        else:  # rhodes
            out += osc(f, n, "sine") + 0.3 * osc(f * 2.001, n, "sine")
    out /= max(len(freqs), 1)
    tau = 0.18 if timbre == "bell" else dur * 0.7
    return lp(out, 3400) * decay_env(n, tau, attack=0.02) * amp


def lead(freq, dur, amp=0.17, wave="pluck"):
    n = int(dur * SR)
    if wave == "square":
        w = lp(osc(freq, n, "square"), 4500)
        return w * decay_env(n, dur * 0.5, attack=0.006) * amp
    if wave == "bell":
        w = osc(freq, n, "sine") + 0.5 * osc(freq * 2.0, n, "sine") + 0.25 * osc(freq * 3.01, n, "sine")
        return w * decay_env(n, 0.3, attack=0.003) * amp
    w = lp(osc(freq, n, "tri"), 3000)                   # pluck
    return w * decay_env(n, 0.28, attack=0.004) * amp


# ---- sequencer -----------------------------------------------------------
def place(buf, sample, at_sec):
    i = int(at_sec * SR)
    end = min(i + len(sample), len(buf))
    if i < len(buf):
        buf[i:end] += sample[:end - i]


def build(preset):
    bpm = preset["bpm"]; prog = preset["prog"]; bars = len(prog)
    beat = 60 / bpm; step = beat / 4; bar = 4 * beat
    L = int(bars * bar * SR) + SR
    buf = np.zeros(L)
    swing = step * preset.get("swing", 0.30)

    for b, chord in enumerate(prog):
        t0 = b * bar
        d = preset["drums"]
        for s in d["kick"]:
            place(buf, kick(), t0 + s * step)
        for s in d["snare"]:
            place(buf, snare(), t0 + s * step)
        for j in range(8):                              # 8th-note hats, offbeats swung
            if d["hat"] == "sparse" and j % 2 == 1:
                continue
            place(buf, hat(open_=(j == 7 and d["hat"] != "sparse")),
                  t0 + j * 2 * step + (swing if j % 2 == 1 else 0))
        if d["hat"] == "16ths":                          # extra offbeat 16th hats (driving)
            for s in (2, 6, 10, 14):
                place(buf, hat(), t0 + s * step)

        kf = [note_hz(x) for x in chord["keys"]]
        # bass
        bk = preset["bass"]
        if bk == "saw":                                  # pulsing 8th-note synth bass
            for s in range(0, 16, 2):
                place(buf, bass(note_hz(chord["bass"]), step * 1.8, kind="saw"), t0 + s * step)
        elif bk == "pluck":
            place(buf, bass(note_hz(chord["bass"]), beat, kind="pluck"), t0)
            place(buf, bass(note_hz(chord["bass"]) * 2, beat, kind="pluck", amp=0.24), t0 + 1.5 * beat)
        else:                                            # sub boom-bap
            place(buf, bass(note_hz(chord["bass"]), beat * 1.6), t0)
            place(buf, bass(note_hz(chord["bass"]), beat * 1.4), t0 + 2 * beat)
        # keys
        place(buf, keys(kf, beat * 2.2, timbre=preset["keys"]), t0 + 0.02)
        if preset["keys"] != "saw":
            place(buf, keys(kf, beat * 1.4, amp=0.09, timbre=preset["keys"]), t0 + 2.5 * beat)
        # lead melody (arpeggio over chord tones, +1 octave)
        lp_ = preset.get("lead")
        if lp_:
            tones = [f * lp_.get("oct", 2) for f in kf]
            for (s, deg) in lp_["pat"]:
                place(buf, lead(tones[deg % len(tones)], step * lp_.get("len", 2),
                                amp=lp_.get("amp", 0.16), wave=lp_["wave"]), t0 + s * step)

    end = int(bars * bar * SR)
    buf = buf[:end]
    buf += hp(np.random.randn(end), 2000) * preset.get("hiss", 0.006)
    buf = lp(buf, preset.get("tone", 9000))
    buf /= (np.max(np.abs(buf)) + 1e-9)
    return buf * 0.9


# up-down / up arps as (step, chord-tone-index)
ARP_UPDOWN = [(0, 0), (2, 1), (4, 2), (6, 3), (8, 2), (10, 1), (12, 2), (14, 3)]
ARP_UP8 = [(0, 0), (2, 1), (4, 2), (6, 3), (8, 0), (10, 1), (12, 2), (14, 0)]
MOTIF = [(4, 2), (10, 1), (14, 0)]   # sparse, few notes


PRESETS = {
    "amber-drift": {   # lo-fi hip-hop, chill
        "bpm": 72, "tone": 8000, "swing": 0.32, "hiss": 0.009,
        "drums": {"kick": [0, 8, 11], "snare": [4, 12], "hat": "8ths"},
        "bass": "sub", "keys": "rhodes",
        "lead": {"wave": "bell", "pat": MOTIF, "amp": 0.11, "oct": 2, "len": 3},
        "prog": [
            {"bass": "C2", "keys": ["C4", "E4", "G4", "B4"]},
            {"bass": "A1", "keys": ["A3", "C4", "E4", "G4"]},
            {"bass": "D2", "keys": ["D4", "F4", "A4", "C5"]},
            {"bass": "G2", "keys": ["G3", "B3", "D4", "F4"]},
        ],
    },
    "slate-focus": {   # synthwave, driving
        "bpm": 100, "tone": 10500, "swing": 0.0, "hiss": 0.004,
        "drums": {"kick": [0, 4, 8, 12], "snare": [4, 12], "hat": "16ths"},
        "bass": "saw", "keys": "saw",
        "lead": {"wave": "square", "pat": ARP_UPDOWN, "amp": 0.15, "oct": 2, "len": 2},
        "prog": [
            {"bass": "A1", "keys": ["A3", "C4", "E4", "G4"]},
            {"bass": "F1", "keys": ["F3", "A3", "C4", "E4"]},
            {"bass": "D2", "keys": ["D4", "F4", "A4", "C5"]},
            {"bass": "E2", "keys": ["E3", "G#3", "B3", "D4"]},
        ],
    },
    "mint-lift": {     # uplifting pluck, half-time
        "bpm": 88, "tone": 11000, "swing": 0.18, "hiss": 0.005,
        "drums": {"kick": [0, 10], "snare": [8], "hat": "sparse"},
        "bass": "pluck", "keys": "bell",
        "lead": {"wave": "pluck", "pat": ARP_UP8, "amp": 0.16, "oct": 2, "len": 2},
        "prog": [
            {"bass": "C2", "keys": ["C4", "E4", "G4"]},
            {"bass": "G2", "keys": ["G3", "B3", "D4"]},
            {"bass": "A1", "keys": ["A3", "C4", "E4"]},
            {"bass": "F2", "keys": ["F3", "A3", "C4"]},
        ],
    },
}


def write_wav(buf, path):
    pcm = (np.clip(buf, -1, 1) * 32767).astype("<i2")
    stereo = np.repeat(pcm[:, None], 2, axis=1).tobytes()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(stereo)


def generate(stem, preset):
    buf = build(preset)
    wav = HERE / f"_{stem}.wav"
    mp3 = HERE / f"{stem}.mp3"
    write_wav(buf, wav)
    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
         "-af", "loudnorm=I=-20:TP=-2.0:LRA=11",
         "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "48000", str(mp3)],
        capture_output=True, text=True,
    )
    wav.unlink(missing_ok=True)
    if cp.returncode != 0:
        print(f"FAIL {stem}: {cp.stderr[-400:]}", file=sys.stderr)
        return None
    print(f"ok  {mp3.name}  ({len(buf)/SR:.1f}s loop, {preset['bpm']} BPM, {preset['bass']}/{preset['keys']})")
    return mp3


if __name__ == "__main__":
    made = [generate(s, p) for s, p in PRESETS.items()]
    if not all(made):
        sys.exit(1)
    print(f"\nGenerated {len(made)} distinct original beds in {HERE}")

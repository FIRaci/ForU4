/**
 * sound-manager.js
 * Web Audio API synthesizer — zero external audio files needed.
 * All sounds are procedurally generated at runtime.
 */

let ctx = null

/** Initialize (or resume) the AudioContext. Must be called from a user gesture. */
export const initAudio = async () => {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  return ctx
}

const getCtx = () => ctx

// ── Synthesis helpers ──────────────────────────────────────────

/**
 * Create a simple oscillator with envelope
 */
const osc = (type, freq, startT, dur, gainPeak = 0.3, pan = 0) => {
  const c = getCtx(); if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  const p = c.createStereoPanner()
  o.type = type
  o.frequency.setValueAtTime(freq, startT)
  g.gain.setValueAtTime(0, startT)
  g.gain.linearRampToValueAtTime(gainPeak, startT + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, startT + dur)
  p.pan.value = pan
  o.connect(g); g.connect(p); p.connect(c.destination)
  o.start(startT); o.stop(startT + dur + 0.05)
}

/**
 * White noise burst
 */
const noise = (startT, dur, gainPeak = 0.3, lowFreq = 100, highFreq = 6000) => {
  const c = getCtx(); if (!c) return
  const sr = c.sampleRate
  const buf = c.createBuffer(1, Math.ceil(sr * dur), sr)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const filt = c.createBiquadFilter()
  filt.type = 'bandpass'
  filt.frequency.value = (lowFreq + highFreq) / 2
  filt.Q.value = 0.5
  const g = c.createGain()
  g.gain.setValueAtTime(gainPeak, startT)
  g.gain.exponentialRampToValueAtTime(0.001, startT + dur)
  src.connect(filt); filt.connect(g); g.connect(c.destination)
  src.start(startT); src.stop(startT + dur + 0.05)
}

// ── Sound Definitions ──────────────────────────────────────────

/** Card sliding from deck (deal) */
const synthDeal = () => {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  noise(t, 0.12, 0.35, 1500, 5000)
  noise(t + 0.06, 0.08, 0.15, 3000, 8000)
}

/** Card flip — sharp tap */
const synthFlip = () => {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  osc('triangle', 900, t, 0.06, 0.25)
  osc('sine',     400, t + 0.03, 0.07, 0.12)
}

/** Magic shimmer — ascending glass tones */
const synthShimmer = () => {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  const freqs = [1047, 1319, 1568, 2093, 2637, 3136]
  freqs.forEach((f, i) => osc('sine', f, t + i * 0.065, 0.5, 0.1 - i * 0.01))
}

/** Crack — for number splits */
const synthCrack = () => {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  // Low thud
  osc('sine', 70, t, 0.18, 0.55)
  osc('sine', 100, t, 0.12, 0.3)
  // Crack pop
  noise(t + 0.05, 0.04, 0.9, 200, 12000)
  noise(t + 0.09, 0.06, 0.5, 500, 8000)
}

/** Whoosh — pack opening */
const synthWhoosh = () => {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  noise(t, 0.4, 0.45, 300, 6000)
  // Quick high sparkles
  for (let i = 0; i < 6; i++) {
    osc('sine', 2000 + Math.random() * 2000, t + i * 0.06, 0.1, 0.08)
  }
}

/** Soft magnet click */
const synthMagnet = () => {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  osc('sine', 180, t, 0.12, 0.4)
  osc('sine',  90, t + 0.04, 0.1, 0.3)
  // Impact
  noise(t, 0.03, 0.4, 100, 600)
}

/** Heartbeat — two low thuds */
const synthHeartbeat = () => {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  // Lub
  osc('sine', 60, t,       0.18, 0.65)
  osc('sine', 45, t + 0.02, 0.15, 0.5)
  // Dub
  osc('sine', 55, t + 0.32, 0.15, 0.55)
  osc('sine', 40, t + 0.34, 0.12, 0.4)
}

/** Evolve — shimmer + bass power chord */
const synthEvolve = () => {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  // Bass swell
  osc('sawtooth', 55,  t, 1.0, 0.3)
  osc('sawtooth', 110, t, 1.0, 0.2)
  osc('sawtooth', 165, t, 0.8, 0.12)
  // Shimmer overlay (delayed)
  const freqs = [1047, 1319, 1568, 2093]
  freqs.forEach((f, i) => osc('sine', f, t + 0.1 + i * 0.07, 0.6, 0.09))
}

/** Final piano note (Ace of Hearts) */
const synthPiano = () => {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  // A4 piano approximation
  osc('sine',     440,  t, 2.0, 0.28)
  osc('triangle', 880,  t, 1.6, 0.10)
  osc('sine',     1320, t, 1.0, 0.05)
}

// ── Public API ─────────────────────────────────────────────────

const SOUNDS = {
  deal:      synthDeal,
  flip:      synthFlip,
  shimmer:   synthShimmer,
  crack:     synthCrack,
  whoosh:    synthWhoosh,
  magnet:    synthMagnet,
  heartbeat: synthHeartbeat,
  evolve:    synthEvolve,
  piano:     synthPiano,
}

/**
 * Play a named sound effect.
 * Fails silently if audio not initialized or sound name unknown.
 */
export const play = (name) => {
  try {
    SOUNDS[name]?.()
  } catch (e) {
    // Audio is optional — never crash the app
    console.warn('[SoundManager] Error:', name, e.message)
  }
}

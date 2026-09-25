/* ==========================================================================
 * Subtext Surfers – audio.js
 * Background music: the team's 8-bit track, looped, with playback-rate tied
 * to the caffeine level (more caffeine → faster music).
 * Collect sounds: simple synthesized "pling" effects (Web Audio).
 * ========================================================================== */
'use strict';

const AudioSys = (() => {
  let ctx = null;
  let musicSource = null;
  let musicBuffer = null;
  let musicGain = null;
  let muted = false;
  let currentRate = 1;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  async function init() {
    if (!ensureCtx()) return false;
    if (musicBuffer) return true;
    try {
      const res = await fetch('assets/audio/background.wav');
      const arr = await res.arrayBuffer();
      musicBuffer = await ctx.decodeAudioData(arr);
      return true;
    } catch (e) {
      console.warn('Could not load background track:', e);
      return false;
    }
  }

  function startMusic() {
    if (!ensureCtx() || !musicBuffer) return;
    stopMusic();
    musicSource = ctx.createBufferSource();
    musicSource.buffer = musicBuffer;
    musicSource.loop = true;
    musicGain = ctx.createGain();
    musicGain.gain.value = muted ? 0 : 0.55;
    musicSource.playbackRate.value = currentRate;
    musicSource.connect(musicGain).connect(ctx.destination);
    musicSource.start();
  }

  function stopMusic() {
    if (musicSource) {
      try { musicSource.stop(); } catch (e) { /* already stopped */ }
      musicSource.disconnect();
      musicSource = null;
    }
  }

  /* caffeine 0..100 → rate 1.0 .. ~1.5 */
  function setMusicRate(rate) {
    currentRate = Math.max(0.5, Math.min(1.6, rate));
    if (musicSource) musicSource.playbackRate.value = currentRate;
  }

  function setMuted(m) {
    muted = m;
    if (musicGain) musicGain.gain.value = m ? 0 : 0.55;
  }

  /* ------------------------- pling sounds ------------------------- */
  function pling(freq, dur, type, vol) {
    if (!ensureCtx()) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    // little upward sparkle
    osc.frequency.exponentialRampToValueAtTime(freq * 1.35, t0 + (dur || 0.18));
    gain.gain.setValueAtTime(vol || 0.25, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.18));
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + (dur || 0.18) + 0.02);
  }

  const SFX = {
    letter()   { pling(880, 0.16, 'sine', 0.22); },
    word()     { pling(660, 0.12, 'triangle', 0.25); setTimeout(() => pling(880, 0.12, 'triangle', 0.25), 90); setTimeout(() => pling(1320, 0.22, 'triangle', 0.25), 180); },
    coffee()   { pling(520, 0.14, 'square', 0.12); },
    mate()     { pling(440, 0.16, 'square', 0.13); setTimeout(() => pling(660, 0.14, 'square', 0.12), 70); },
    croissant(){ pling(392, 0.3, 'sine', 0.22); setTimeout(() => pling(587, 0.3, 'sine', 0.2), 120); },
    trick()    { pling(740, 0.1, 'sawtooth', 0.12); setTimeout(() => pling(1110, 0.16, 'sawtooth', 0.12), 80); },
    hit()      { pling(160, 0.25, 'sawtooth', 0.3); setTimeout(() => pling(110, 0.3, 'sawtooth', 0.25), 60); },
    overcharge(){ pling(220, 0.4, 'square', 0.2); setTimeout(() => pling(233, 0.4, 'square', 0.2), 150); },
    unlock()   { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => pling(f, 0.18, 'triangle', 0.22), i * 110)); },
    gameover() { [523, 415, 330, 262].forEach((f, i) => setTimeout(() => pling(f, 0.3, 'triangle', 0.25), i * 180)); },
    ui()       { pling(1046, 0.08, 'sine', 0.15); },
  };

  return { init, startMusic, stopMusic, setMusicRate, setMuted, SFX, isMuted: () => muted };
})();

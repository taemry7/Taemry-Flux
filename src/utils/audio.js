// Web Audio API Synthesizer for Authentic "Truth" Frequency & Mining Ignition Sound
let audioCtx = null;

/**
 * Plays an authentic, uplifting "Truth" harmonic tone (528 Hz Solfeggio frequency + resonant chord)
 * triggered when user taps the mining button or claims rewards.
 */
export const playMiningTruthSound = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;

    // 528 Hz Solfeggio harmonic chime (528Hz, 660Hz, 792Hz, 1056Hz)
    const harmonicFrequencies = [528, 660, 792, 1056];

    // Master Gain
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.exponentialRampToValueAtTime(0.3, now + 0.04);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    masterGain.connect(audioCtx.destination);

    // Filter
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(4500, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 1.5);
    filter.connect(masterGain);

    harmonicFrequencies.forEach((freq, idx) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.015, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.3);

      oscGain.gain.setValueAtTime(0.01, now);
      oscGain.gain.linearRampToValueAtTime(0.22 / (idx + 1), now + 0.03 * (idx + 1));
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + idx * 0.15);
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(now);
      osc.stop(now + 1.8);
    });

    // Sub-bass pulse
    const subOsc = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(55, now + 0.3);
    subGain.gain.setValueAtTime(0.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    subOsc.connect(subGain);
    subGain.connect(audioCtx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.45);
  } catch (err) {
    console.warn('Audio synthesis notice:', err);
  }
};

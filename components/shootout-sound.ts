// The gallery's noises, made on the spot rather than fetched: nothing here is loaded or
// heard unless someone turns the sound on, and it stays quiet when they do.
export function shootoutSound() {
  let audio: AudioContext | null = null;

  // The browser lets sound start only from a press or a key, and every call here comes
  // from one, or follows one.
  function wake() {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }

  function tone(from: number, to: number, lasts: number, level: number, after = 0) {
    const context = wake();
    const start = context.currentTime + after;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + lasts);
    gain.gain.setValueAtTime(level, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + lasts);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + lasts);
  }

  return {
    wake,
    shot: () => tone(320, 60, 0.09, 0.05),
    hit: () => tone(660, 990, 0.08, 0.04),
    run: () => {
      tone(660, 660, 0.07, 0.04);
      tone(990, 990, 0.1, 0.04, 0.07);
    },
    empty: () => tone(1400, 1200, 0.02, 0.02),
    reload: () => {
      tone(500, 500, 0.03, 0.03, 0.15);
      tone(700, 700, 0.03, 0.03, 0.5);
    },
    best: () => {
      for (const [step, pitch] of [523, 659, 784, 1047].entries()) {
        tone(pitch, pitch, 0.11, 0.04, step * 0.1);
      }
    },
    close: () => {
      audio?.close();
      audio = null;
    },
  };
}

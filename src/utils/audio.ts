import { AlarmSoundType } from '../types';

/**
 * Generate a valid 16-bit PCM Mono WAV Blob from a sample generator function.
 * This produces genuine audio files directly in the browser with zero external dependencies,
 * allowing HTML5 <audio> playback which is far more resilient on mobile devices (iOS/Android).
 */
function createWavBlob(
  durationSec: number,
  sampleRate: number,
  sampleFn: (t: number) => number
): Blob {
  const numSamples = Math.floor(durationSec * sampleRate);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true); // ChunkSize
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true); // Subchunk2Size

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = sampleFn(t);
    // Clamp to [-1, 1]
    sample = Math.max(-1, Math.min(1, sample));
    // Convert float to 16-bit signed integer
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// High quality synthesized audio feedback & continuous alarm ringing engine optimized for smartphones
class SoundManager {
  private ctx: AudioContext | null = null;
  private isAlarmPlaying: boolean = false;
  private previewSoundType: AlarmSoundType | null = null;
  private previewTimeoutId: number | null = null;
  private stateListeners: Set<() => void> = new Set();

  private alarmIntervalId: number | null = null;
  private vibrationIntervalId: number | null = null;
  private currentAlarmSound: AlarmSoundType = 'digital';
  private userUnlocked: boolean = false;
  private wakeLockSentinel: any = null;

  // HTML5 audio elements backed by synthesized WAV audio for bulletproof mobile playback
  private audioElement: HTMLAudioElement | null = null;
  private audioUrls: Map<AlarmSoundType, string> = new Map();
  private unlockListenersAttached: boolean = false;

  constructor() {
    this.setupUnlockListeners();
    this.preloadWavAudio();
  }

  public subscribe(listener: () => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notify() {
    this.stateListeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {}
    });
  }

  public get isPlaying(): boolean {
    return this.isAlarmPlaying || this.previewSoundType !== null;
  }

  public get previewingSound(): AlarmSoundType | null {
    return this.previewSoundType;
  }

  /**
   * Pre-generates WAV audio blobs for HTML5 audio tags so that sound playback
   * routes through the smartphone's dedicated media hardware pipeline.
   */
  private preloadWavAudio() {
    if (typeof window === 'undefined') return;

    try {
      const sampleRate = 22050;

      // 1. Digital Watch Beep: 4 sharp piercing high-pitch pulses
      const digitalBlob = createWavBlob(1.2, sampleRate, (t) => {
        // 4 beeps at 0.0s, 0.12s, 0.24s, 0.36s, then silence until 1.2s
        const beeps = [0, 0.12, 0.24, 0.36];
        for (const start of beeps) {
          if (t >= start && t < start + 0.065) {
            const dt = t - start;
            const env = Math.sin((dt / 0.065) * Math.PI);
            // High pitch 2048Hz square-ish tone
            const osc = Math.sin(2 * Math.PI * 2048 * t) > 0 ? 0.7 : -0.7;
            return osc * env * 0.85;
          }
        }
        return 0;
      });
      this.audioUrls.set('digital', URL.createObjectURL(digitalBlob));

      // 2. Siren: Emergency alternating 880Hz / 1320Hz tone
      const sirenBlob = createWavBlob(1.1, sampleRate, (t) => {
        const cycle = t % 1.1;
        const freq = cycle < 0.275 ? 880 : cycle < 0.55 ? 1320 : cycle < 0.825 ? 880 : 1320;
        const env = Math.min(1, Math.max(0, Math.sin((cycle / 1.1) * Math.PI) * 1.5));
        const osc = Math.sin(2 * Math.PI * freq * t);
        return osc * env * 0.8;
      });
      this.audioUrls.set('siren', URL.createObjectURL(sirenBlob));

      // 3. Melodic: Upbeat ascending multi-frequency chime
      const melodicBlob = createWavBlob(1.4, sampleRate, (t) => {
        const notes = [
          { f: 587.33, s: 0.0 },  // D5
          { f: 739.99, s: 0.12 }, // F#5
          { f: 880.0, s: 0.24 },  // A5
          { f: 1174.66, s: 0.36 },// D6
          { f: 1479.98, s: 0.5 }, // F#6
        ];
        let sample = 0;
        for (const n of notes) {
          if (t >= n.s && t < n.s + 0.45) {
            const dt = t - n.s;
            const env = Math.exp(-dt * 6.5);
            sample += Math.sin(2 * Math.PI * n.f * dt) * env * 0.45;
          }
        }
        return sample;
      });
      this.audioUrls.set('melodic', URL.createObjectURL(melodicBlob));

      // 4. Gentle: Soothing bell resonant chime
      const gentleBlob = createWavBlob(1.6, sampleRate, (t) => {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        let sample = 0;
        notes.forEach((f, idx) => {
          const s = idx * 0.14;
          if (t >= s && t < s + 0.8) {
            const dt = t - s;
            const env = Math.exp(-dt * 4.0);
            sample += Math.sin(2 * Math.PI * f * dt) * env * 0.25;
          }
        });
        return sample;
      });
      this.audioUrls.set('gentle', URL.createObjectURL(gentleBlob));
    } catch (e) {
      console.warn('WAV preloading skipped', e);
    }
  }

  // Pre-unlock AudioContext & HTML5 audio on the first user interaction anywhere in the window
  public setupUnlockListeners() {
    if (typeof window === 'undefined' || this.unlockListenersAttached) return;
    this.unlockListenersAttached = true;

    const unlock = () => {
      this.unlockAudioNow();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('touchend', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  /**
   * Explicitly unlocks audio capabilities on mobile devices.
   * Can be called directly from UI buttons like "Activer le son mobile" or "Tester l'alarme".
   */
  public async unlockAudioNow(): Promise<boolean> {
    try {
      // 1. Unlock Web Audio API context
      const ctx = this.getContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      // 2. Play a brief silent sound through the HTML5 audio element
      // This is crucial for iOS Safari and Android Chrome to permit media playback later
      if (!this.audioElement && typeof Audio !== 'undefined') {
        this.audioElement = new Audio();
        this.audioElement.setAttribute('playsinline', 'true');
        this.audioElement.preload = 'auto';
      }

      if (this.audioElement) {
        const digitalUrl = this.audioUrls.get('digital');
        if (digitalUrl) {
          this.audioElement.src = digitalUrl;
          this.audioElement.volume = 0.01;
          const playPromise = this.audioElement.play();
          if (playPromise !== undefined) {
            await playPromise
              .then(() => {
                if (this.audioElement) {
                  this.audioElement.pause();
                  this.audioElement.currentTime = 0;
                  this.audioElement.volume = 1.0;
                }
              })
              .catch(() => {});
          }
        }
      }

      this.userUnlocked = true;
      return true;
    } catch (e) {
      console.warn('Audio unlock warning:', e);
      return false;
    }
  }

  public get isUnlocked(): boolean {
    return this.userUnlocked;
  }

  public get isVibrationSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  public get isWakeLockSupported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // --- SHORT EVENT CHIMES ---

  // Play a gentle uplifting chime when creating a task
  playCreationChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5

      osc2.frequency.setValueAtTime(659.25, now); // E5
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // C6

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // Play a pleasant, noticeable 3-note melodic reminder sequence
  playReminderChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [659.25, 783.99, 1046.5, 1318.51]; // E5, G5, C6, E6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.5);
      });
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // Play an attention-grabbing dual-bell alarm when task is due
  playDueChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const pulse1Notes = [880, 1174.66]; // A5 -> D6
      const pulse2Notes = [880, 1318.51]; // A5 -> E6

      const playTone = (freq: number, start: number, duration = 0.25) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration + 0.05);
      };

      playTone(pulse1Notes[0], now, 0.2);
      playTone(pulse1Notes[1], now + 0.15, 0.35);
      playTone(pulse2Notes[0], now + 0.45, 0.2);
      playTone(pulse2Notes[1], now + 0.6, 0.45);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // Play a rewarding chord when completing a task
  playCompletionChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (C Major Chord)

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.55);
      });
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // --- CONTINUOUS ALARM RINGING SYSTEM ---

  /**
   * Starts a persistent, loud alarm that continues to ring every 1-2 seconds
   * until explicitly stopped with stopAlarm().
   * Utilizes DUAL playback: HTML5 Media Player + Web Audio API oscillators,
   * plus repeating mobile vibrations and screen wake lock.
   */
  startAlarm(soundType: AlarmSoundType = 'digital', enableVibration: boolean = true) {
    this.stopAlarm(); // clear any previous ringing
    this.isAlarmPlaying = true;
    this.currentAlarmSound = soundType;
    this.notify();

    // 1. Request Screen Wake Lock so mobile display stays on while alarm is ringing
    this.acquireWakeLock();

    // 2. Play via HTML5 Audio element (native media pipeline)
    this.startHtml5AudioLoop(soundType);

    // 3. Simultaneously trigger Web Audio API oscillators (dual audio redundancy)
    this.playAlarmPulse(soundType);

    const intervalMs = soundType === 'digital' ? 1200 : soundType === 'siren' ? 1100 : 1600;
    this.alarmIntervalId = window.setInterval(() => {
      if (!this.isAlarmPlaying) return;
      this.playAlarmPulse(this.currentAlarmSound);
    }, intervalMs);

    // 4. Start high-intensity repeating vibration pattern for mobile phones
    if (enableVibration && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([600, 200, 600, 200, 800]);
        this.vibrationIntervalId = window.setInterval(() => {
          if (!this.isAlarmPlaying) return;
          try {
            navigator.vibrate([600, 200, 600, 200, 800]);
          } catch (e) {}
        }, 2200);
      } catch (e) {}
    }
  }

  startContinuousAlarm(soundType: AlarmSoundType = 'digital', enableVibration: boolean = true) {
    this.startAlarm(soundType, enableVibration);
  }

  /**
   * Starts looping HTML5 audio with max volume
   */
  private startHtml5AudioLoop(soundType: AlarmSoundType) {
    if (typeof window === 'undefined') return;

    try {
      const wavUrl = this.audioUrls.get(soundType) || this.audioUrls.get('digital');
      if (!wavUrl) return;

      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.setAttribute('playsinline', 'true');
      }

      this.audioElement.src = wavUrl;
      this.audioElement.loop = true;
      this.audioElement.volume = 1.0;

      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('HTML5 Audio autoplay restricted or pending user touch:', err);
        });
      }
    } catch (e) {
      console.warn('HTML5 audio loop error:', e);
    }
  }

  /**
   * Stops the continuous alarm ringing, phone vibrations, preview audio, and releases screen wake lock
   */
  stopAlarm() {
    this.isAlarmPlaying = false;
    this.stopPreview();

    // Stop HTML5 Audio
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {}
    }

    // Stop Web Audio intervals
    if (this.alarmIntervalId !== null) {
      clearInterval(this.alarmIntervalId);
      this.alarmIntervalId = null;
    }

    // Stop Mobile Vibrations
    if (this.vibrationIntervalId !== null) {
      clearInterval(this.vibrationIntervalId);
      this.vibrationIntervalId = null;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0); // Cancel ongoing vibration
      } catch (e) {}
    }

    // Release Screen Wake Lock
    this.releaseWakeLock();

    // Notify state listeners so UI buttons update immediately
    this.notify();
  }

  /**
   * Universal stop method to silence any ringing alarm or audio preview instantly
   */
  stopAllSounds() {
    this.stopAlarm();
    this.stopPreview();
  }

  /**
   * Stop only preview sound
   */
  stopPreview() {
    if (this.previewTimeoutId) {
      clearTimeout(this.previewTimeoutId);
      this.previewTimeoutId = null;
    }
    if (this.previewSoundType !== null) {
      this.previewSoundType = null;
      this.notify();
    }
  }

  /**
   * Acquire Screen Wake Lock on mobile devices
   */
  private async acquireWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      } catch (e) {
        // WakeLock may fail if device is low battery or document not active
      }
    }
  }

  /**
   * Release Screen Wake Lock
   */
  private releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch (e) {}
      this.wakeLockSentinel = null;
    }
  }

  /**
   * Check if the alarm is currently ringing
   */
  get isRinging(): boolean {
    return this.isAlarmPlaying;
  }

  /**
   * Plays a single pulse of the specified alarm sound via Web Audio API
   */
  public playAlarmPulse(soundType: AlarmSoundType) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (soundType === 'digital') {
        // Classic high-pitch digital watch/alarm beep: Bip-Bip-Bip-Bip
        const beeps = [0, 0.12, 0.28, 0.4];
        beeps.forEach((startOffset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(2048, now + startOffset); // High pitch alarm tone

          gain.gain.setValueAtTime(0.001, now + startOffset);
          gain.gain.linearRampToValueAtTime(0.35, now + startOffset + 0.01);
          gain.gain.setValueAtTime(0.35, now + startOffset + 0.07);
          gain.gain.linearRampToValueAtTime(0.001, now + startOffset + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + startOffset);
          osc.stop(now + startOffset + 0.09);
        });
      } else if (soundType === 'siren') {
        // High urgency alternating two-tone siren
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';

        osc.frequency.setValueAtTime(880, now);
        osc.frequency.linearRampToValueAtTime(1320, now + 0.25);
        osc.frequency.linearRampToValueAtTime(880, now + 0.5);
        osc.frequency.linearRampToValueAtTime(1320, now + 0.75);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.setValueAtTime(0.3, now + 0.85);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.95);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.0);
      } else if (soundType === 'melodic') {
        // Energetic 4-note ascending chord arpeggio
        const notes = [587.33, 739.99, 880.0, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);

          gain.gain.setValueAtTime(0.001, now + idx * 0.09);
          gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.09 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.45);
        });
      } else {
        // Gentle warm bell chime
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);

          gain.gain.setValueAtTime(0.001, now + idx * 0.14);
          gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.14 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.7);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.75);
        });
      }
    } catch (e) {
      console.warn('Alarm pulse error', e);
    }
  }

  // Preview / test an alarm sound directly with instant toggle & stop
  testAlarmSound(soundType: AlarmSoundType) {
    // If currently previewing this sound, toggle it off immediately
    if (this.previewSoundType === soundType) {
      this.stopPreview();
      return;
    }

    this.stopAlarm();
    this.unlockAudioNow();
    this.previewSoundType = soundType;
    this.notify();

    this.playAlarmPulse(soundType);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (e) {}
    }

    if (this.previewTimeoutId) {
      clearTimeout(this.previewTimeoutId);
    }
    this.previewTimeoutId = window.setTimeout(() => {
      this.previewSoundType = null;
      this.notify();
    }, 2800);
  }
}

export const soundManager = new SoundManager();



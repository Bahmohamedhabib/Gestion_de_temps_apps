import { AlarmSoundType } from '../types';

// High quality synthesized audio feedback & continuous alarm ringing engine
class SoundManager {
  private ctx: AudioContext | null = null;
  private isAlarmPlaying: boolean = false;
  private alarmIntervalId: number | null = null;
  private vibrationIntervalId: number | null = null;
  private currentAlarmSound: AlarmSoundType = 'digital';
  private userUnlocked: boolean = false;

  constructor() {
    this.setupUnlockListeners();
  }

  // Pre-unlock AudioContext on the first user interaction anywhere in the window
  private setupUnlockListeners() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.getContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.userUnlocked = true;
        });
      } else {
        this.userUnlocked = true;
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
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
   * until explicitly stopped with stopAlarm()
   */
  startAlarm(soundType: AlarmSoundType = 'digital', enableVibration: boolean = true) {
    this.stopAlarm(); // clear any previous ringing
    this.isAlarmPlaying = true;
    this.currentAlarmSound = soundType;

    // Start audio cycle immediately
    this.playAlarmPulse(soundType);

    // Loop interval based on sound profile
    const intervalMs = soundType === 'digital' ? 1200 : soundType === 'siren' ? 1100 : 1600;

    this.alarmIntervalId = window.setInterval(() => {
      if (!this.isAlarmPlaying) return;
      this.playAlarmPulse(this.currentAlarmSound);
    }, intervalMs);

    // Start repeating vibration pattern on supported mobile devices
    if (enableVibration && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([600, 200, 600, 200, 600]);
        this.vibrationIntervalId = window.setInterval(() => {
          if (!this.isAlarmPlaying) return;
          try {
            navigator.vibrate([600, 200, 600, 200, 600]);
          } catch (e) {}
        }, 2200);
      } catch (e) {}
    }
  }

  startContinuousAlarm(soundType: AlarmSoundType = 'digital', enableVibration: boolean = true) {
    this.startAlarm(soundType, enableVibration);
  }

  /**
   * Stops the continuous alarm ringing and phone vibrations
   */
  stopAlarm() {
    this.isAlarmPlaying = false;
    if (this.alarmIntervalId !== null) {
      clearInterval(this.alarmIntervalId);
      this.alarmIntervalId = null;
    }
    if (this.vibrationIntervalId !== null) {
      clearInterval(this.vibrationIntervalId);
      this.vibrationIntervalId = null;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0); // Cancel ongoing vibration
      } catch (e) {}
    }
  }

  /**
   * Check if the alarm is currently ringing
   */
  get isRinging(): boolean {
    return this.isAlarmPlaying;
  }

  /**
   * Plays a single pulse of the specified alarm sound
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

  // Preview / test an alarm sound directly
  testAlarmSound(soundType: AlarmSoundType) {
    this.playAlarmPulse(soundType);
  }
}

export const soundManager = new SoundManager();


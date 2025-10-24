// Sound notification utilities
class SoundManager {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private createBeep(frequency: number, duration: number, volume: number = 0.3): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Notification sound for captcha (5 seconds)
  playCaptchaNotification(): void {
    // Play a pleasant melody
    const melody = [
      { freq: 523.25, time: 0 },    // C5
      { freq: 659.25, time: 0.2 },  // E5
      { freq: 783.99, time: 0.4 },  // G5
    ];

    melody.forEach(note => {
      setTimeout(() => {
        this.createBeep(note.freq, 0.15, 0.2);
      }, note.time * 1000);
    });
  }

  // Notification sound for face verification (before 5 minutes)
  playFaceVerifyNotification(): void {
    // Play a two-tone alert
    setTimeout(() => this.createBeep(800, 0.2, 0.25), 0);
    setTimeout(() => this.createBeep(600, 0.2, 0.25), 200);
    setTimeout(() => this.createBeep(800, 0.3, 0.25), 400);
  }

  // Success sound
  playSuccess(): void {
    const notes = [
      { freq: 523.25, time: 0 },
      { freq: 659.25, time: 0.1 },
      { freq: 783.99, time: 0.2 },
    ];

    notes.forEach(note => {
      setTimeout(() => {
        this.createBeep(note.freq, 0.1, 0.15);
      }, note.time * 1000);
    });
  }

  // Error sound
  playError(): void {
    setTimeout(() => this.createBeep(300, 0.2, 0.2), 0);
    setTimeout(() => this.createBeep(250, 0.3, 0.2), 150);
  }

  // Warning sound
  playWarning(): void {
    setTimeout(() => this.createBeep(440, 0.15, 0.2), 0);
    setTimeout(() => this.createBeep(440, 0.15, 0.2), 200);
  }
}

export const soundManager = new SoundManager();


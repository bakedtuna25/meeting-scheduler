/**
 * Sound synthesizer using Web Audio API
 */
export function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // First note (E5 - 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Second harmonic note (B5 - 987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.15);
    gain2.gain.setValueAtTime(0.2, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.9);
  } catch (err) {
    console.warn('Audio playback not allowed or not supported yet', err);
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

/**
 * Trigger system notification
 */
export function sendDesktopNotification(title: string, body: string, iconUrl?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  try {
    const notif = new Notification(title, {
      body,
      icon: iconUrl || '/favicon.ico',
      badge: iconUrl || '/favicon.ico',
      tag: `teamsync-${Date.now()}`,
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (err) {
    console.error('Failed to trigger notification', err);
  }
}

/**
 * Format minutes left into human-readable text
 */
export function formatMinutesUntil(targetIsoDate: string, startTime: string): { minutesLeft: number; isPast: boolean; label: string } {
  try {
    const target = new Date(`${targetIsoDate}T${startTime}:00`);
    const diffMs = target.getTime() - Date.now();
    const minutesLeft = Math.round(diffMs / 60000);

    if (diffMs <= 0) {
      const pastMins = Math.abs(minutesLeft);
      if (pastMins < 60) {
        return { minutesLeft, isPast: true, label: `${pastMins} menit lalu` };
      }
      return { minutesLeft, isPast: true, label: 'Sudah selesai/lewat' };
    }

    if (minutesLeft < 60) {
      return { minutesLeft, isPast: false, label: `${minutesLeft} menit lagi` };
    }
    const hoursLeft = Math.floor(minutesLeft / 60);
    const remainingMins = minutesLeft % 60;
    return {
      minutesLeft,
      isPast: false,
      label: remainingMins > 0 ? `${hoursLeft} jam ${remainingMins} menit lagi` : `${hoursLeft} jam lagi`,
    };
  } catch (e) {
    return { minutesLeft: 0, isPast: false, label: '' };
  }
}

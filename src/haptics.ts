/**
 * Haptics abstraction layer.
 *
 * On native (iOS / Android via Capacitor) → uses @capacitor/haptics
 * which gives true native vibration, including on iPhone where the
 * Web Vibration API is blocked entirely.
 *
 * On web → falls back to navigator.vibrate (works on Android Chrome,
 * not on iOS Safari).
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const isNative = Capacitor.isNativePlatform();

/**
 * Play a vibration pattern.
 * Pattern is an array of [vibrate, pause, vibrate, pause, ...] durations in ms,
 * matching the Web Vibration API spec.
 *
 * On native, we simulate the pattern by firing ImpactStyle pulses with
 * setTimeout delays — Capacitor's haptics API doesn't accept raw patterns,
 * but it gives us much richer feedback than the web API.
 */
export async function vibratePattern(pattern: number[]): Promise<() => void> {
  if (isNative) {
    return vibratePatternNative(pattern);
  } else {
    return vibratePatternWeb(pattern);
  }
}

/**
 * Single short tap — used for telegraph key press feedback.
 */
export async function vibrateTap(): Promise<void> {
  if (isNative) {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } else {
    navigator.vibrate?.(50);
  }
}

/**
 * Stop all vibration immediately.
 */
export async function vibrateStop(): Promise<void> {
  if (isNative) {
    // Capacitor has no explicit cancel — we just stop scheduling new pulses
    // (handled by the cancel fn returned from vibratePattern)
  } else {
    navigator.vibrate?.(0);
  }
}

/**
 * Check if haptics are available on this device.
 */
export function hapticsSupported(): boolean {
  if (isNative) return true;
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

// ── Internal helpers ──────────────────────────────────────────────────────

function vibratePatternNative(pattern: number[]): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let elapsed = 0;

  pattern.forEach((duration, index) => {
    const isVibration = index % 2 === 0;
    if (isVibration && duration > 0) {
      // Map duration to haptic style:
      // short (<= 100ms) → Light, medium (<= 250ms) → Medium, long → Heavy
      const style =
        duration <= 100 ? ImpactStyle.Light :
        duration <= 250 ? ImpactStyle.Medium :
        ImpactStyle.Heavy;

      const t = setTimeout(() => {
        Haptics.impact({ style }).catch(() => {});
      }, elapsed);
      timers.push(t);

      // For long pulses (dashes), fire multiple pulses to simulate sustained vibration
      if (duration > 150) {
        const extra = Math.floor(duration / 80) - 1;
        for (let i = 1; i <= extra; i++) {
          const t2 = setTimeout(() => {
            Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
          }, elapsed + i * 80);
          timers.push(t2);
        }
      }
    }
    elapsed += duration;
  });

  return () => timers.forEach(clearTimeout);
}

function vibratePatternWeb(pattern: number[]): () => void {
  if (pattern.length > 99) {
    navigator.vibrate?.(pattern.slice(0, 99));
  } else {
    navigator.vibrate?.(pattern);
  }
  return () => navigator.vibrate?.(0);
}

/**
 * Success notification — used when transmission completes.
 */
export async function vibrateSuccess(): Promise<void> {
  if (isNative) {
    await Haptics.notification({ type: NotificationType.Success });
  } else {
    navigator.vibrate?.([30, 30, 60]);
  }
}

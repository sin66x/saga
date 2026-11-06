/**
 * Browser (PWA) text-to-speech using the Web Speech API directly.
 *
 * iOS Safari only lets speech start from a *direct* user tap: any `await` between the tap
 * and `speechSynthesis.speak()` makes it silently drop the speech. So everything here is
 * synchronous, and a silent "unlock" utterance is spoken on the first touch anywhere so that
 * later, programmatic speech (the next paragraph of a page being read) is allowed too.
 */
import { isInstalledPwa } from './standalone';

export interface WebSpeechHandlers {
  onEnd?: () => void;
  onError?: (message: string) => void;
  /** Nothing started within a few seconds (silent switch, no voice, blocked by the browser). */
  onSilent?: () => void;
}

export const webSpeechSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

/** "sv", "sv-SE", "sv_SE" … */
export const isSwedishLang = (lang: string): boolean => lang.toLowerCase().replace('_', '-').startsWith('sv');
const isSwedish = (v: SpeechSynthesisVoice) => isSwedishLang(v.lang);

function webVoices(): SpeechSynthesisVoice[] {
  return webSpeechSupported() ? window.speechSynthesis.getVoices() : [];
}

let chosenVoice: SpeechSynthesisVoice | undefined;
/** Best Swedish voice, preferring enhanced/premium ones. Undefined while the list is still loading. */
function swedishWebVoice(): SpeechSynthesisVoice | undefined {
  if (chosenVoice) return chosenVoice;
  const sv = webVoices().filter(isSwedish);
  chosenVoice = sv.find((v) => /enhanced|premium/i.test(v.name)) ?? sv.find((v) => v.localService) ?? sv[0];
  return chosenVoice;
}

/** True when voices are listed but none is Swedish (so speaking would use a wrong-language voice). */
export function noSwedishVoiceInstalled(): boolean {
  const all = webVoices();
  return all.length > 0 && !all.some(isSwedish);
}

const UNLOCK_EVENTS = ['touchend', 'pointerup', 'click', 'keydown'];
let unlocked = false;
/** Speaks a silent utterance on the first touch so later programmatic speech is allowed. */
export function installSpeechUnlock(): void {
  if (!webSpeechSupported() || unlocked) return;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    enablePlaybackAudio();
    try {
      const u = new SpeechSynthesisUtterance('.');
      u.volume = 0;
      u.lang = 'sv-SE';
      window.speechSynthesis.speak(u);
    } catch {
      // ignore
    }
    for (const t of UNLOCK_EVENTS) window.removeEventListener(t, unlock, true);
  };
  for (const t of UNLOCK_EVENTS) window.addEventListener(t, unlock, true);
  // Some engines load the voice list late; asking once warms it up.
  window.speechSynthesis.getVoices();
}

interface AudioSessionLike {
  type: string;
}
const audioSession = (): AudioSessionLike | undefined => (typeof navigator === 'undefined' ? undefined : (navigator as unknown as { audioSession?: AudioSessionLike }).audioSession);

/**
 * iOS mutes web audio while the ringer switch is on silent, unless the page asks for the
 * "playback" audio session (Safari 16.4+). Without it speech can "run" but stay inaudible.
 */
function enablePlaybackAudio(): void {
  try {
    const session = audioSession();
    if (session && session.type !== 'playback') session.type = 'playback';
  } catch {
    // not supported
  }
}

interface Attempt {
  at: number;
  voice: string;
  startedAfterMs?: number;
  endedAfterMs?: number;
  error?: string;
}
let lastAttempt: Attempt | null = null;

/** A short beep made with Web Audio, to tell "speech is muted" apart from "all web audio is muted". */
export function playTestTone(): boolean {
  try {
    enablePlaybackAudio();
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return false;
    const ctx = new Ctx();
    void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 523;
    gain.gain.value = 0.25;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    osc.onended = () => void ctx.close();
    return true;
  } catch {
    return false;
  }
}

/** Must be called synchronously from a tap handler. */
export function speakWeb(text: string, rate: number, handlers: WebSpeechHandlers = {}): void {
  if (!webSpeechSupported()) {
    handlers.onError?.('unsupported');
    return;
  }
  enablePlaybackAudio();
  const synth = window.speechSynthesis;
  // cancel() right before speak() is flaky in some engines, so only do it when really needed.
  if (synth.speaking || synth.pending) synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'sv-SE';
  const voice = swedishWebVoice();
  if (voice) u.voice = voice;
  u.rate = rate;
  let started = false;
  let silentTimer: ReturnType<typeof setTimeout> | undefined;
  const t0 = Date.now();
  const attempt: Attempt = { at: t0, voice: voice ? `${voice.name} (${voice.lang})` : '(browser default)' };
  lastAttempt = attempt;
  u.onstart = () => {
    started = true;
    clearTimeout(silentTimer);
    attempt.startedAfterMs = Date.now() - t0;
  };
  u.onend = () => {
    attempt.endedAfterMs = Date.now() - t0;
    handlers.onEnd?.();
  };
  u.onerror = (e) => {
    // "canceled"/"interrupted" are what we cause ourselves when stopping.
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      attempt.error = e.error || 'speech-error';
      handlers.onError?.(attempt.error);
    }
  };
  synth.speak(u);
  // Some engines start paused after an earlier cancel.
  if (synth.paused) synth.resume();
  if (handlers.onSilent) {
    silentTimer = setTimeout(() => {
      if (!started && !synth.speaking) handlers.onSilent?.();
    }, 3500);
  }
}

export function stopWeb(): void {
  if (webSpeechSupported()) window.speechSynthesis.cancel();
}

/** A human-readable report for the "Voice check" button. */
export function describeWebSpeech(): string {
  if (!webSpeechSupported()) return 'This browser does not support reading aloud (speechSynthesis is missing).';
  const all = webVoices();
  const sv = all.filter(isSwedish);
  const voice = swedishWebVoice();
  const a = lastAttempt;
  const attemptLine = !a
    ? 'Last attempt: none yet (tap a speaker or Play first, then run this check again)'
    : `Last attempt: voice ${a.voice}; started ${a.startedAfterMs === undefined ? 'NO' : `yes after ${a.startedAfterMs} ms`}; finished ${a.endedAfterMs === undefined ? 'NO' : `yes after ${a.endedAfterMs} ms`}${a.error ? `; error ${a.error}` : ''}`;
  const diagnosis =
    a && a.startedAfterMs !== undefined && a.endedAfterMs !== undefined && !a.error
      ? '\nThe phone ran the speech normally. If you heard nothing, the sound is being muted: check the silent switch, the volume, and that no Bluetooth device is connected. Try “Play test tone”.'
      : '';
  return [
    `Voices found: ${all.length}`,
    `Voice used: ${voice ? `${voice.name} (${voice.lang}${voice.localService ? ', on this phone' : ', online'})` : 'none chosen yet'}`,
    `Audio mode: ${audioSession()?.type ?? 'not supported by this iOS version'}`,
    attemptLine,
    `Swedish voices: ${sv.length ? sv.map((v) => `${v.name}${v.localService ? '' : ' (online)'}`).join(', ') : 'none'}`,
    `Installed on Home Screen: ${isInstalledPwa() ? 'yes' : 'no'}`,
    all.length === 0 ? '\nThe voice list is empty. Close the app completely, open it again, tap the Play button once and run this check again.' : '',
    all.length > 0 && sv.length === 0 ? '\nInstall a Swedish voice: Settings › Accessibility › Spoken Content › Voices › Swedish.' : '',
    diagnosis,
  ]
    .filter(Boolean)
    .join('\n');
}

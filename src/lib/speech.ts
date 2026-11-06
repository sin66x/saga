/**
 * Reading Swedish aloud with the phone's own voice (the browser's Web Speech API, see speechWeb.ts).
 * Everything that starts speech must run synchronously inside the tap: iOS Safari drops speech that
 * starts after an `await`.
 */
import { showAlert } from './dialog';
import { type SpeechChunk, speechText } from './speechText';
import { describeWebSpeech, noSwedishVoiceInstalled, speakWeb, stopWeb, webSpeechSupported } from './speechWeb';

export { pageSpeechChunks, type SpeechChunk, speechText } from './speechText';

export type SpeechSpeed = 'slow' | 'normal' | 'fast';
export const SPEECH_RATES: Record<SpeechSpeed, number> = { slow: 0.65, normal: 0.85, fast: 1.0 };

let currentSpeed: SpeechSpeed = 'normal';
/** Called by the settings provider so every spoken word or page uses the chosen speed. */
export function setSpeechSpeed(speed: SpeechSpeed): void {
  currentSpeed = speed;
}
export const currentSpeechRate = (): number => SPEECH_RATES[currentSpeed];

/** Turns a speech problem code ('no-swedish-voice', 'silent', 'unsupported') into an explanation for the user. */
export function reportSpeechProblem(code: string): void {
  if (code === 'no-swedish-voice') {
    showAlert(
      'No Swedish voice installed',
      'Your iPhone needs a Swedish voice to read aloud.\n\nGo to Settings › Accessibility › Spoken Content › Voices › Swedish, download a voice (for example “Alva”), then try again.\n\nAlso check that the silent switch on the side of the iPhone is not on.',
    );
  } else if (code === 'silent') {
    showAlert(
      'No sound came out',
      'Things to check:\n\n• The silent switch on the side of the iPhone (flip it so no orange shows) and the volume.\n• A Swedish voice: Settings › Accessibility › Spoken Content › Voices › Swedish.\n• Close Saga completely, open it again and tap the speaker once more (iPhone only allows speech that starts from a tap).\n\nThen use Settings › Voice check to see what the phone reports.',
    );
  } else if (code === 'unsupported') {
    showAlert('Reading aloud is not available', 'This browser cannot read text aloud.');
  } else {
    console.warn('[speech]', code);
  }
}

/** Shows what the phone reports about speech (voices, Swedish voices, …). */
export function showVoiceCheck(): void {
  showAlert('Voice check', describeWebSpeech());
}

/** Why speech cannot work right now (null = fine). */
function preflight(): 'unsupported' | 'no-swedish-voice' | null {
  if (!webSpeechSupported()) return 'unsupported';
  return noSwedishVoiceInstalled() ? 'no-swedish-voice' : null;
}

let sequenceId = 0;

export function stopSpeaking(): void {
  sequenceId += 1;
  stopWeb();
}

/** Speaks a short text (a word or a sentence). Explains the problem if speech is not possible. */
export function speakSwedish(text: string, rate = currentSpeechRate()): boolean {
  const problem = preflight();
  if (problem) {
    reportSpeechProblem(problem);
    return false;
  }
  speakWeb(speechText(text), rate, { onSilent: () => reportSpeechProblem('silent'), onError: (m) => console.warn('[speech]', m) });
  return true;
}

export interface ReadAloudHandlers {
  onChunk?: (chunk: SpeechChunk, index: number) => void;
  onDone?: () => void;
  /** A problem code for `reportSpeechProblem` (or an engine error message). */
  onError?: (code: string) => void;
}

/** Reads chunks one after another. Starting a new reading (or calling `stopSpeaking`) cancels the previous one. */
export function readAloud(chunks: SpeechChunk[], rate: number, handlers: ReadAloudHandlers = {}): void {
  const id = ++sequenceId;
  const problem = preflight();
  if (problem) return handlers.onError?.(problem);

  const next = (i: number) => {
    if (id !== sequenceId) return;
    if (i >= chunks.length) return handlers.onDone?.();
    handlers.onChunk?.(chunks[i], i);
    const fail = (code: string) => {
      if (id === sequenceId) handlers.onError?.(code);
    };
    speakWeb(chunks[i].text, rate, { onEnd: () => next(i + 1), onError: fail, onSilent: i === 0 ? () => fail('silent') : undefined });
  };
  next(0);
}

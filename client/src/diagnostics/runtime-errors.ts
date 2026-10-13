/** Opt-in-to-read, bounded local diagnostics for hard-to-reproduce game bugs.
 * No persistence, telemetry, stack capture or network delivery. Values are
 * sanitized before being exposed to a user who opens browser developer tools.
 */
export interface RuntimeErrorRecord {
  kind: 'error' | 'unhandledrejection';
  message: string;
  recordedAt: number;
}

declare global {
  interface Window {
    /** Browser QA hook. Returns a copy; it never exposes the mutable buffer. */
    __DREAM_RUNTIME_ERRORS__?: () => RuntimeErrorRecord[];
  }
}

export const MAX_RUNTIME_ERRORS = 12;
const MAX_ERROR_LENGTH = 240;

export function sanitizeRuntimeErrorMessage(input: unknown): string {
  let message = '';
  if (input instanceof Error) message = input.message;
  else if (typeof input === 'string') message = input;
  else if (typeof input === 'number' || typeof input === 'boolean') message = String(input);
  else message = 'Non-Error exception (details intentionally omitted)';

  // Never retain arbitrary error stack text, URL tokens or credentials.
  message = message
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[url]')
    .replace(/(?:token|api[_-]?key|secret|password|authorization)\s*[:=]\s*[^\s,;]+/gi, '[redacted]');
  return message.slice(0, MAX_ERROR_LENGTH) || 'Unspecified browser error';
}

export function installRuntimeErrorRecorder(host: Window = window): () => void {
  if (host.__DREAM_RUNTIME_ERRORS__) return () => undefined;
  const records: RuntimeErrorRecord[] = [];
  const append = (kind: RuntimeErrorRecord['kind'], details: unknown) => {
    records.push({ kind, message: sanitizeRuntimeErrorMessage(details), recordedAt: Date.now() });
    if (records.length > MAX_RUNTIME_ERRORS) records.shift();
  };
  const onError = (event: ErrorEvent) => append('error', event.error ?? event.message);
  const onRejection = (event: PromiseRejectionEvent) => append('unhandledrejection', event.reason);
  host.addEventListener('error', onError);
  host.addEventListener('unhandledrejection', onRejection);
  const reader = () => records.map(record => ({ ...record }));
  host.__DREAM_RUNTIME_ERRORS__ = reader;

  return () => {
    host.removeEventListener('error', onError);
    host.removeEventListener('unhandledrejection', onRejection);
    if (host.__DREAM_RUNTIME_ERRORS__ === reader) delete host.__DREAM_RUNTIME_ERRORS__;
  };
}

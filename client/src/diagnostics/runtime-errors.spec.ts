import { afterEach, describe, expect, it } from 'vitest';
import { installRuntimeErrorRecorder, MAX_RUNTIME_ERRORS, sanitizeRuntimeErrorMessage } from './runtime-errors';

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; });

describe('privacy-safe runtime error diagnostics', () => {
  it('captures error and rejected promise without preventing normal browser reporting', () => {
    dispose = installRuntimeErrorRecorder(window);
    window.dispatchEvent(new ErrorEvent('error', { message: 'Rig initialization failed' }));
    const rejection = new Event('unhandledrejection', {cancelable:true});
    Object.defineProperty(rejection, 'reason', {value: new Error('bad GLB')});
    window.dispatchEvent(rejection);
    expect(window.__DREAM_RUNTIME_ERRORS__?.().map(r => [r.kind, r.message])).toEqual([
      ['error', 'Rig initialization failed'],
      ['unhandledrejection', 'bad GLB'],
    ]);
    expect(rejection.defaultPrevented).toBe(false);
  });

  it('caps memory and returns a safe snapshot rather than the mutable ring', () => {
    dispose = installRuntimeErrorRecorder(window);
    for (let i = 0; i < MAX_RUNTIME_ERRORS + 5; i++)
      window.dispatchEvent(new ErrorEvent('error', {message: 'error-' + i}));
    const list = window.__DREAM_RUNTIME_ERRORS__?.() ?? [];
    expect(list).toHaveLength(MAX_RUNTIME_ERRORS);
    expect(list[0]?.message).toBe('error-5');
    list[0]!.message = 'modified';
    expect(window.__DREAM_RUNTIME_ERRORS__?.()[0]?.message).toBe('error-5');
  });

  it('strips URLs, tokens, non-error objects and excessive strings', () => {
    expect(sanitizeRuntimeErrorMessage('Load https://example.org/model.glb?token=abc failed'))
      .toBe('Load [url] failed');
    expect(sanitizeRuntimeErrorMessage('password=hunter2')).toBe('[redacted]');
    expect(sanitizeRuntimeErrorMessage({ privateKey: 'abc' }))
      .toBe('Non-Error exception (details intentionally omitted)');
    expect(sanitizeRuntimeErrorMessage('x'.repeat(300))).toHaveLength(240);
  });

  it('detaches listeners and its browser hook on teardown', () => {
    dispose = installRuntimeErrorRecorder(window);
    dispose();
    dispose = undefined;
    window.dispatchEvent(new ErrorEvent('error', {message:'outside'}));
    expect(window.__DREAM_RUNTIME_ERRORS__).toBeUndefined();
  });
});

/** Serial writes with one replaceable trailing snapshot. All callers settle only
 * after the latest requested state is committed; errors reject every waiter. */
export function createLatestSaveQueue<T>(write: (snapshot: T) => Promise<void>) {
  let pending: T | undefined;
  let hasPending = false;
  let running = false;
  let waiters: { resolve: () => void; reject: (error: unknown) => void }[] = [];
  async function drain() {
    try {
      while (hasPending) {
        const snapshot = pending as T;
        pending = undefined;
        hasPending = false;
        await write(snapshot);
      }
      running = false;
      const done = waiters;
      waiters = [];
      for (const waiter of done) waiter.resolve();
    } catch (error) {
      running = false;
      pending = undefined;
      hasPending = false;
      const failed = waiters;
      waiters = [];
      for (const waiter of failed) waiter.reject(error);
    }
  }
  return {
    request(snapshot: T): Promise<void> {
      const copy = structuredClone(snapshot);
      pending = copy;
      hasPending = true;
      const completion = new Promise<void>((resolve, reject) => waiters.push({ resolve, reject }));
      if (!running) { running = true; void drain(); }
      return completion;
    },
  };
}

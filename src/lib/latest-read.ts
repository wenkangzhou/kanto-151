/** Coalesce reads within one generation; invalidation prevents stale responses from committing. */
export class LatestRead {
  private generation = 0;
  private controller: AbortController | null = null;
  private pending: Promise<void> | null = null;

  invalidate() {
    this.generation++;
    this.controller?.abort();
    this.controller = null;
    this.pending = null;
  }

  token() { return this.generation; }
  isCurrent(token: number) { return token === this.generation; }

  run<T>(load: (signal: AbortSignal) => Promise<T>, accept: (value: T) => void, reject: (error: unknown) => void): Promise<void> {
    if (this.pending) return this.pending;
    const token = this.generation;
    const controller = new AbortController();
    this.controller = controller;
    const pending = Promise.resolve().then(() => load(controller.signal)).then(
      value => { if (this.isCurrent(token)) accept(value); },
      error => { if (this.isCurrent(token)) reject(error); },
    ).finally(() => {
      if (this.pending === pending) { this.pending = null; this.controller = null; }
    });
    this.pending = pending;
    return pending;
  }
}

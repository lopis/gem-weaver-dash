export class CountSet<T> {
  private counts = new Map<T, number>();

  add(value: T): this {
    const count = this.counts.get(value) ?? 0;
    this.counts.set(value, count + 1);
    return this;
  }

  remove(value: T): boolean {
    const count = this.counts.get(value) ?? 0;
    if (count === 0) {
      return false;
    }

    const next = count - 1;
    if (next) {
      this.counts.set(value, next);
    } else {
      this.counts.delete(value);
    }
    return true;
  }

  count(value: T): number {
    return this.counts.get(value) ?? 0;
  }
}

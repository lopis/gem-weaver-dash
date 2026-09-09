export class CountSet<T extends string> {
  private counts: Record<string, number> = {};

  add(value: T): this {
    this.counts[value] = (this.counts[value] ?? 0) + 1;
    return this;
  }

  remove(value: T): boolean {
    const count = this.counts[value] ?? 0;
    if (count === 0) {
      return false;
    }

    const next = count - 1;
    if (next) {
      this.counts[value] = next;
    } else {
      delete this.counts[value];
    }
    return true;
  }

  count(value: T): number {
    return this.counts[value] ?? 0;
  }
}

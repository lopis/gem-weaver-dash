export class CountSet<T> extends Set<T> {
  private counts = new Map<T, number>();

  override add(value: T): this {
    const count = this.counts.get(value) ?? 0;
    this.counts.set(value, count + 1);
    // if (count === 0) {
    super.add(value);
    // }
    return this;
  }

  remove(value: T): boolean {
    const count = this.counts.get(value) ?? 0;
    if (count === 0) {
      return false;
    }

    // if (count === 1) {
    //   this.counts.delete(value);
    //   super.delete(value);
    //   return true;
    // }

    this.counts.set(value, count - 1);
    return true;
  }

  // override delete(value: T): boolean {
  //   return this.remove(value);
  // }

  count(value: T): number {
    return this.counts.get(value) ?? 0;
  }

  // override clear(): void {
  //   this.counts.clear();
  //   super.clear();
  // }
}

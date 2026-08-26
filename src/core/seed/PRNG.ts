export class PRNG {
  private _state: number;

  constructor(public readonly seed: number = 12345) {
    this._state = seed | 0;
  }

  /**
   * Mulberry32 32-bit generator
   */
  next(): number {
    let t = (this._state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextFloat(min: number = 0, max: number = 1): number {
    return min + this.next() * (max - min);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat(min, max + 1));
  }

  nextChoice<T>(items: T[]): T {
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }

  nextBoolean(chance: number = 0.5): boolean {
    return this.next() < chance;
  }

  reset(): void {
    this._state = this.seed | 0;
  }
}

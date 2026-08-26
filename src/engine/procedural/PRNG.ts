/**
 * Générateur Pseudo-Aléatoire Déterministe 32-bit (Mulberry32)
 * Garantit une reproductibilité mathématique à 100% de la génération d'une ville selon la graine (seed).
 */
export class PRNG {
  private s: number;

  constructor(seed: number = 1337) {
    this.s = seed | 0;
  }

  /**
   * Retourne un nombre flottant dans [0, 1)
   */
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Retourne un flottant entre min et max
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Retourne un entier entre min et max (inclus)
   */
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Choisit un élément aléatoire dans un tableau
   */
  choice<T>(array: T[]): T {
    const idx = Math.floor(this.next() * array.length);
    return array[idx];
  }

  /**
   * Retourne true avec une probabilité donnée (entre 0 et 1)
   */
  chance(probability: number = 0.5): boolean {
    return this.next() < probability;
  }
}

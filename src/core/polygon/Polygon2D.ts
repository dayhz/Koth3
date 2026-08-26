import earcut from 'earcut';
import { IVector2D, Vector2D } from '../math/Vector2D';
import { BoundingBox2D } from '../math/BoundingBox2D';

export class Polygon2D {
  public vertices: Vector2D[];

  constructor(vertices: IVector2D[] = []) {
    this.vertices = vertices.map((v) => Vector2D.from(v));
  }

  static fromPoints(points: IVector2D[]): Polygon2D {
    return new Polygon2D(points);
  }

  get length(): number {
    return this.vertices.length;
  }

  getArea(): number {
    let area = 0;
    const n = this.vertices.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += this.vertices[i].x * this.vertices[j].y;
      area -= this.vertices[j].x * this.vertices[i].y;
    }
    return area / 2;
  }

  isClockwise(): boolean {
    return this.getArea() < 0;
  }

  ensureCounterClockwise(): this {
    if (this.isClockwise()) {
      this.vertices.reverse();
    }
    return this;
  }

  getCentroid(): Vector2D {
    let cx = 0;
    let cy = 0;
    const n = this.vertices.length;
    let factor = 0;
    const area6 = 6 * this.getArea();

    if (Math.abs(area6) < 1e-9) {
      for (const v of this.vertices) {
        cx += v.x;
        cy += v.y;
      }
      return new Vector2D(cx / n, cy / n);
    }

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      factor = this.vertices[i].x * this.vertices[j].y - this.vertices[j].x * this.vertices[i].y;
      cx += (this.vertices[i].x + this.vertices[j].x) * factor;
      cy += (this.vertices[i].y + this.vertices[j].y) * factor;
    }

    return new Vector2D(cx / area6, cy / area6);
  }

  getBoundingBox(): BoundingBox2D {
    const bbox = new BoundingBox2D();
    bbox.expandByPoints(this.vertices);
    return bbox;
  }

  containsPoint(p: IVector2D): boolean {
    let inside = false;
    const n = this.vertices.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = this.vertices[i].x;
      const yi = this.vertices[i].y;
      const xj = this.vertices[j].x;
      const yj = this.vertices[j].y;

      const intersect =
        yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Triangule le polygone en utilisant Earcut.
   * Retourne un tableau d'indices de sommets (par triplets pour former des triangles).
   */
  triangulate(holes: Polygon2D[] = []): { positions: number[]; indices: number[] } {
    const flatCoords: number[] = [];
    const holeIndices: number[] = [];

    // Polygone extérieur
    for (const v of this.vertices) {
      flatCoords.push(v.x, v.y);
    }

    // Trous éventuels
    for (const hole of holes) {
      holeIndices.push(flatCoords.length / 2);
      for (const v of hole.vertices) {
        flatCoords.push(v.x, v.y);
      }
    }

    const indices = earcut(flatCoords, holeIndices.length > 0 ? holeIndices : undefined, 2);

    return {
      positions: flatCoords,
      indices,
    };
  }

  toJSON(): IVector2D[] {
    return this.vertices.map((v) => v.toJSON());
  }
}

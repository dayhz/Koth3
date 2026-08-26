import { IVector2D, Vector2D } from './Vector2D';

export class BoundingBox2D {
  min: Vector2D;
  max: Vector2D;

  constructor(min?: IVector2D, max?: IVector2D) {
    this.min = min ? Vector2D.from(min) : new Vector2D(Infinity, Infinity);
    this.max = max ? Vector2D.from(max) : new Vector2D(-Infinity, -Infinity);
  }

  expandByPoint(p: IVector2D): this {
    this.min.x = Math.min(this.min.x, p.x);
    this.min.y = Math.min(this.min.y, p.y);
    this.max.x = Math.max(this.max.x, p.x);
    this.max.y = Math.max(this.max.y, p.y);
    return this;
  }

  expandByPoints(pts: IVector2D[]): this {
    for (const p of pts) {
      this.expandByPoint(p);
    }
    return this;
  }

  intersects(other: BoundingBox2D): boolean {
    return !(
      this.max.x < other.min.x ||
      this.min.x > other.max.x ||
      this.max.y < other.min.y ||
      this.min.y > other.max.y
    );
  }

  contains(p: IVector2D): boolean {
    return (
      p.x >= this.min.x &&
      p.x <= this.max.x &&
      p.y >= this.min.y &&
      p.y <= this.max.y
    );
  }
}

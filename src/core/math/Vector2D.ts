export interface IVector2D {
  x: number;
  y: number;
}

export class Vector2D implements IVector2D {
  constructor(public x: number = 0, public y: number = 0) {}

  static from(v: IVector2D): Vector2D {
    return new Vector2D(v.x, v.y);
  }

  clone(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  add(v: IVector2D): Vector2D {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  addScaled(v: IVector2D, scale: number): Vector2D {
    return new Vector2D(this.x + v.x * scale, this.y + v.y * scale);
  }

  sub(v: IVector2D): Vector2D {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  multiplyScalar(s: number): Vector2D {
    return new Vector2D(this.x * s, this.y * s);
  }

  divideScalar(s: number): Vector2D {
    if (s === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / s, this.y / s);
  }

  dot(v: IVector2D): number {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: IVector2D): number {
    return this.x * v.y - this.y * v.x;
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  length(): number {
    return Math.hypot(this.x, this.y);
  }

  distanceTo(v: IVector2D): number {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }

  distanceToSq(v: IVector2D): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  normalize(): Vector2D {
    const len = this.length();
    if (len === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / len, this.y / len);
  }

  // Vecteur normal unitaire perpendiculaire à gauche (rotation 90 deg anti-horaire)
  normalLeft(): Vector2D {
    const len = this.length();
    if (len === 0) return new Vector2D(0, 0);
    return new Vector2D(-this.y / len, this.x / len);
  }

  // Vecteur normal unitaire perpendiculaire à droite (rotation 90 deg horaire)
  normalRight(): Vector2D {
    const len = this.length();
    if (len === 0) return new Vector2D(0, 0);
    return new Vector2D(this.y / len, -this.x / len);
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  angleTo(v: IVector2D): number {
    const theta = Math.atan2(v.y, v.x) - Math.atan2(this.y, this.x);
    return Math.atan2(Math.sin(theta), Math.cos(theta));
  }

  rotate(angleRadians: number): Vector2D {
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);
    return new Vector2D(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
  }

  lerp(v: IVector2D, t: number): Vector2D {
    return new Vector2D(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t);
  }

  equals(v: IVector2D, epsilon: number = 1e-6): boolean {
    return Math.abs(this.x - v.x) <= epsilon && Math.abs(this.y - v.y) <= epsilon;
  }

  toJSON(): IVector2D {
    return { x: this.x, y: this.y };
  }
}

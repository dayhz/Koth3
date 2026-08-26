import { IVector2D, Vector2D } from '../math/Vector2D';

export interface CurveFrame {
  point: Vector2D;
  tangent: Vector2D;
  normal: Vector2D;
  t: number;
  distance: number;
}

export interface ICurve {
  type: 'linear' | 'bezier_cubic' | 'arc';
  getPoint(t: number): Vector2D;
  getTangent(t: number): Vector2D;
  getNormal(t: number): Vector2D;
  getLength(): number;
  samplePoints(numSamples?: number): Vector2D[];
  sampleFrames(numSamples?: number): CurveFrame[];
  clone(): ICurve;
}

// ----------------------------------------------------
// 1. LIGNE DROITE
// ----------------------------------------------------
export class LinearCurve implements ICurve {
  readonly type = 'linear' as const;
  public start: Vector2D;
  public end: Vector2D;

  constructor(start: IVector2D, end: IVector2D) {
    this.start = Vector2D.from(start);
    this.end = Vector2D.from(end);
  }

  getPoint(t: number): Vector2D {
    return this.start.lerp(this.end, t);
  }

  getTangent(_t: number): Vector2D {
    return this.end.sub(this.start).normalize();
  }

  getNormal(_t: number): Vector2D {
    return this.getTangent(_t).normalLeft();
  }

  getLength(): number {
    return this.start.distanceTo(this.end);
  }

  samplePoints(numSamples: number = 10): Vector2D[] {
    const pts: Vector2D[] = [];
    const count = Math.max(2, numSamples);
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      pts.push(this.getPoint(t));
    }
    return pts;
  }

  sampleFrames(numSamples: number = 10): CurveFrame[] {
    const frames: CurveFrame[] = [];
    const count = Math.max(2, numSamples);
    const len = this.getLength();
    const tangent = this.getTangent(0);
    const normal = this.getNormal(0);

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      frames.push({
        point: this.getPoint(t),
        tangent,
        normal,
        t,
        distance: t * len,
      });
    }
    return frames;
  }

  clone(): LinearCurve {
    return new LinearCurve(this.start, this.end);
  }
}

// ----------------------------------------------------
// 2. BÉZIER CUBIQUE
// ----------------------------------------------------
export class CubicBezierCurve implements ICurve {
  readonly type = 'bezier_cubic' as const;
  public p0: Vector2D;
  public p1: Vector2D;
  public p2: Vector2D;
  public p3: Vector2D;

  private _cachedLength: number | null = null;

  constructor(p0: IVector2D, p1: IVector2D, p2: IVector2D, p3: IVector2D) {
    this.p0 = Vector2D.from(p0);
    this.p1 = Vector2D.from(p1);
    this.p2 = Vector2D.from(p2);
    this.p3 = Vector2D.from(p3);
  }

  getPoint(t: number): Vector2D {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return new Vector2D(
      mt3 * this.p0.x + 3 * mt2 * t * this.p1.x + 3 * mt * t2 * this.p2.x + t3 * this.p3.x,
      mt3 * this.p0.y + 3 * mt2 * t * this.p1.y + 3 * mt * t2 * this.p2.y + t3 * this.p3.y
    );
  }

  getDerivative(t: number): Vector2D {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;

    // B'(t) = 3(1-t)^2 (P1 - P0) + 6(1-t)t (P2 - P1) + 3t^2 (P3 - P2)
    return new Vector2D(
      3 * mt2 * (this.p1.x - this.p0.x) + 6 * mt * t * (this.p2.x - this.p1.x) + 3 * t2 * (this.p3.x - this.p2.x),
      3 * mt2 * (this.p1.y - this.p0.y) + 6 * mt * t * (this.p2.y - this.p1.y) + 3 * t2 * (this.p3.y - this.p2.y)
    );
  }

  getTangent(t: number): Vector2D {
    const d = this.getDerivative(t);
    const len = d.length();
    if (len < 1e-6) {
      if (t <= 0.5) return this.p1.sub(this.p0).normalize();
      return this.p3.sub(this.p2).normalize();
    }
    return d.normalize();
  }

  getNormal(t: number): Vector2D {
    return this.getTangent(t).normalLeft();
  }

  getLength(samples: number = 30): number {
    if (this._cachedLength !== null) return this._cachedLength;

    let length = 0;
    let prev = this.getPoint(0);
    for (let i = 1; i <= samples; i++) {
      const curr = this.getPoint(i / samples);
      length += prev.distanceTo(curr);
      prev = curr;
    }
    this._cachedLength = length;
    return length;
  }

  samplePoints(numSamples: number = 24): Vector2D[] {
    const pts: Vector2D[] = [];
    const count = Math.max(2, numSamples);
    for (let i = 0; i < count; i++) {
      pts.push(this.getPoint(i / (count - 1)));
    }
    return pts;
  }

  sampleFrames(numSamples: number = 24): CurveFrame[] {
    const frames: CurveFrame[] = [];
    const count = Math.max(2, numSamples);
    let totalDist = 0;
    let prevPt: Vector2D | null = null;

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const point = this.getPoint(t);
      if (prevPt) {
        totalDist += prevPt.distanceTo(point);
      }
      prevPt = point;

      frames.push({
        point,
        tangent: this.getTangent(t),
        normal: this.getNormal(t),
        t,
        distance: totalDist,
      });
    }
    return frames;
  }

  clone(): CubicBezierCurve {
    return new CubicBezierCurve(this.p0, this.p1, this.p2, this.p3);
  }
}

// ----------------------------------------------------
// 3. ARC DE CERCLE
// ----------------------------------------------------
export class ArcCurve implements ICurve {
  readonly type = 'arc' as const;
  public center: Vector2D;
  public radius: number;
  public startAngle: number;
  public endAngle: number;
  public clockwise: boolean;

  constructor(
    center: IVector2D,
    radius: number,
    startAngle: number,
    endAngle: number,
    clockwise: boolean = false
  ) {
    this.center = Vector2D.from(center);
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.clockwise = clockwise;
  }

  private getAngleAt(t: number): number {
    let delta = this.endAngle - this.startAngle;
    if (this.clockwise && delta > 0) delta -= 2 * Math.PI;
    if (!this.clockwise && delta < 0) delta += 2 * Math.PI;
    return this.startAngle + delta * t;
  }

  getPoint(t: number): Vector2D {
    const angle = this.getAngleAt(t);
    return new Vector2D(
      this.center.x + this.radius * Math.cos(angle),
      this.center.y + this.radius * Math.sin(angle)
    );
  }

  getTangent(t: number): Vector2D {
    const angle = this.getAngleAt(t);
    const sign = this.clockwise ? -1 : 1;
    return new Vector2D(-Math.sin(angle) * sign, Math.cos(angle) * sign).normalize();
  }

  getNormal(t: number): Vector2D {
    return this.getTangent(t).normalLeft();
  }

  getLength(): number {
    let delta = Math.abs(this.endAngle - this.startAngle);
    if (delta > 2 * Math.PI) delta %= 2 * Math.PI;
    return this.radius * delta;
  }

  samplePoints(numSamples: number = 24): Vector2D[] {
    const pts: Vector2D[] = [];
    const count = Math.max(2, numSamples);
    for (let i = 0; i < count; i++) {
      pts.push(this.getPoint(i / (count - 1)));
    }
    return pts;
  }

  sampleFrames(numSamples: number = 24): CurveFrame[] {
    const frames: CurveFrame[] = [];
    const count = Math.max(2, numSamples);
    const len = this.getLength();

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      frames.push({
        point: this.getPoint(t),
        tangent: this.getTangent(t),
        normal: this.getNormal(t),
        t,
        distance: t * len,
      });
    }
    return frames;
  }

  clone(): ArcCurve {
    return new ArcCurve(this.center, this.radius, this.startAngle, this.endAngle, this.clockwise);
  }
}

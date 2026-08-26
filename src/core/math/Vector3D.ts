export interface IVector3D {
  x: number;
  y: number;
  z: number;
}

export class Vector3D implements IVector3D {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0
  ) {}

  static from(v: IVector3D): Vector3D {
    return new Vector3D(v.x, v.y, v.z);
  }

  clone(): Vector3D {
    return new Vector3D(this.x, this.y, this.z);
  }

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  add(v: IVector3D): Vector3D {
    return new Vector3D(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  addScaled(v: IVector3D, scale: number): Vector3D {
    return new Vector3D(this.x + v.x * scale, this.y + v.y * scale, this.z + v.z * scale);
  }

  sub(v: IVector3D): Vector3D {
    return new Vector3D(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  multiplyScalar(s: number): Vector3D {
    return new Vector3D(this.x * s, this.y * s, this.z * s);
  }

  divideScalar(s: number): Vector3D {
    if (s === 0) return new Vector3D(0, 0, 0);
    return new Vector3D(this.x / s, this.y / s, this.z / s);
  }

  dot(v: IVector3D): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: IVector3D): Vector3D {
    return new Vector3D(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length(): number {
    return Math.hypot(this.x, this.y, this.z);
  }

  distanceTo(v: IVector3D): number {
    return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  normalize(): Vector3D {
    const len = this.length();
    if (len === 0) return new Vector3D(0, 0, 0);
    return new Vector3D(this.x / len, this.y / len, this.z / len);
  }

  lerp(v: IVector3D, t: number): Vector3D {
    return new Vector3D(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t,
      this.z + (v.z - this.z) * t
    );
  }

  toJSON(): IVector3D {
    return { x: this.x, y: this.y, z: this.z };
  }
}

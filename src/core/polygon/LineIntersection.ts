import { IVector2D, Vector2D } from '../math/Vector2D';

export interface IntersectionResult {
  intersects: boolean;
  point?: Vector2D;
  tA?: number;
  tB?: number;
}

export class LineIntersection {
  /**
   * Intersection entre deux segments finis [p1, p2] et [p3, p4]
   */
  static segmentSegment(
    p1: IVector2D,
    p2: IVector2D,
    p3: IVector2D,
    p4: IVector2D
  ): IntersectionResult {
    const d1x = p2.x - p1.x;
    const d1y = p2.y - p1.y;
    const d2x = p4.x - p3.x;
    const d2y = p4.y - p3.y;

    const denominator = d1x * d2y - d1y * d2x;
    if (Math.abs(denominator) < 1e-9) {
      return { intersects: false }; // Parallèles ou colinéaires
    }

    const tA = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denominator;
    const tB = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denominator;

    if (tA >= 0 && tA <= 1 && tB >= 0 && tB <= 1) {
      return {
        intersects: true,
        point: new Vector2D(p1.x + tA * d1x, p1.y + tA * d1y),
        tA,
        tB,
      };
    }

    return { intersects: false, tA, tB };
  }

  /**
   * Intersection entre deux droites infinies passant par [p1, p2] et [p3, p4]
   */
  static lineLine(
    p1: IVector2D,
    p2: IVector2D,
    p3: IVector2D,
    p4: IVector2D
  ): IntersectionResult {
    const d1x = p2.x - p1.x;
    const d1y = p2.y - p1.y;
    const d2x = p4.x - p3.x;
    const d2y = p4.y - p3.y;

    const denominator = d1x * d2y - d1y * d2x;
    if (Math.abs(denominator) < 1e-9) {
      return { intersects: false };
    }

    const tA = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denominator;
    const tB = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denominator;

    return {
      intersects: true,
      point: new Vector2D(p1.x + tA * d1x, p1.y + tA * d1y),
      tA,
      tB,
    };
  }

  /**
   * Intersection entre deux rayons (demi-droites)
   */
  static rayRay(
    origin1: IVector2D,
    dir1: IVector2D,
    origin2: IVector2D,
    dir2: IVector2D
  ): IntersectionResult {
    const denominator = dir1.x * dir2.y - dir1.y * dir2.x;
    if (Math.abs(denominator) < 1e-9) {
      return { intersects: false };
    }

    const tA = ((origin2.x - origin1.x) * dir2.y - (origin2.y - origin1.y) * dir2.x) / denominator;
    const tB = ((origin2.x - origin1.x) * dir1.y - (origin2.y - origin1.y) * dir1.x) / denominator;

    if (tA >= 0 && tB >= 0) {
      return {
        intersects: true,
        point: new Vector2D(origin1.x + tA * dir1.x, origin1.y + tA * dir1.y),
        tA,
        tB,
      };
    }

    return { intersects: false, tA, tB };
  }
}

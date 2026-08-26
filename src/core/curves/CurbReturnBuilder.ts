import { IVector2D, Vector2D } from '../math/Vector2D';
import { ArcCurve } from './Curve';

export interface CurbReturnResult {
  tangentPoint1: Vector2D; // Point de contact sur la première ligne
  tangentPoint2: Vector2D; // Point de contact sur la deuxième ligne
  center: Vector2D;        // Centre du cercle de raccordement
  radius: number;
  arc: ArcCurve;
  points: Vector2D[];      // Échantillon de points le long du congé arrondi
}

export class CurbReturnBuilder {
  /**
   * Calcule le raccordement tangentiel arrondi (congé de trottoir / curb return)
   * entre une ligne incidente p1->p2 et une ligne sortante q1->q2 avec un rayon R.
   */
  static computeFillet(
    p1: IVector2D,
    p2: IVector2D,
    q1: IVector2D,
    q2: IVector2D,
    radius: number = 5.0,
    samples: number = 16
  ): CurbReturnResult | null {
    const v1 = Vector2D.from(p2).sub(p1);
    const v2 = Vector2D.from(q2).sub(q1);

    const len1 = v1.length();
    const len2 = v2.length();
    if (len1 < 1e-5 || len2 < 1e-5) return null;

    const u1 = v1.normalize();
    const u2 = v2.normalize();

    // Intersection des deux droites directrices
    const cross = u1.cross(u2);
    if (Math.abs(cross) < 1e-4) {
      // Parallèles ou colinéaires -> pas de virage d'intersection
      return null;
    }

    // Calcul de l'angle entre les deux droites
    const dot = Math.max(-1, Math.min(1, u1.dot(u2)));
    const alpha = Math.acos(dot); // Angle de déviation
    const halfAlpha = alpha / 2;

    // Distance du sommet d'intersection aux points de tangence : d = R / tan(alpha / 2)
    const tanHalf = Math.tan(halfAlpha);
    if (Math.abs(tanHalf) < 1e-4) return null;

    const distToTangent = radius / tanHalf;

    // Intersection des droites (sommet du coin)
    const d1x = u1.x, d1y = u1.y;
    const d2x = u2.x, d2y = u2.y;
    const denominator = d1x * d2y - d1y * d2x;
    const tA = ((q1.x - p1.x) * d2y - (q1.y - p1.y) * d2x) / denominator;
    const vertex = Vector2D.from(p1).addScaled(u1, tA);

    // Points de tangence
    const t1 = vertex.sub(u1.multiplyScalar(distToTangent));
    const t2 = vertex.add(u2.multiplyScalar(distToTangent));

    // Normales pour trouver le centre du cercle
    const n1 = u1.normalLeft();

    // Le centre est décalé de R perpendiculairement aux tangentes
    const sign = cross > 0 ? 1 : -1;
    const center = t1.addScaled(n1, sign * radius);

    // Calcul des angles de départ et fin de l'arc
    const startAngle = Math.atan2(t1.y - center.y, t1.x - center.x);
    const endAngle = Math.atan2(t2.y - center.y, t2.x - center.x);
    const clockwise = cross > 0;

    const arc = new ArcCurve(center, radius, startAngle, endAngle, clockwise);
    const points = arc.samplePoints(samples);

    return {
      tangentPoint1: t1,
      tangentPoint2: t2,
      center,
      radius,
      arc,
      points,
    };
  }
}

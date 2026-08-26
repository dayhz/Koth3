import { Vector2D } from '../math/Vector2D';
import { ICurve, LinearCurve, CubicBezierCurve, ArcCurve } from './Curve';

export class CurveOffset {
  /**
   * Calcule une série de points échantillonnés décalés d'une distance 'offset'
   * (offset > 0 : vers la gauche de la courbe, offset < 0 : vers la droite).
   */
  static sampleOffsetPoints(curve: ICurve, offset: number, numSamples: number = 24): Vector2D[] {
    const frames = curve.sampleFrames(numSamples);
    return frames.map((f) => f.point.addScaled(f.normal, offset));
  }

  /**
   * Crée une courbe décalée si la courbe est analytiquement décalable (Linear, Arc).
   * Pour Bézier cubique, approxime les points de contrôle ou retourne un nouveau Bézier.
   */
  static offsetCurve(curve: ICurve, offset: number): ICurve {
    if (curve instanceof LinearCurve) {
      const normal = curve.getNormal(0);
      return new LinearCurve(
        curve.start.addScaled(normal, offset),
        curve.end.addScaled(normal, offset)
      );
    }

    if (curve instanceof ArcCurve) {
      const newRadius = curve.radius + (curve.clockwise ? -offset : offset);
      return new ArcCurve(
        curve.center,
        Math.max(0.01, newRadius),
        curve.startAngle,
        curve.endAngle,
        curve.clockwise
      );
    }

    if (curve instanceof CubicBezierCurve) {
      const n0 = curve.getNormal(0);
      const n3 = curve.getNormal(1);
      const n1 = curve.getNormal(0.333);
      const n2 = curve.getNormal(0.666);

      return new CubicBezierCurve(
        curve.p0.addScaled(n0, offset),
        curve.p1.addScaled(n1, offset),
        curve.p2.addScaled(n2, offset),
        curve.p3.addScaled(n3, offset)
      );
    }

    return curve.clone();
  }
}

import { Vector2D } from '../core/math/Vector2D';
import { Polygon2D } from '../core/polygon/Polygon2D';
import { CurveOffset } from '../core/curves/CurveOffset';
import { RoadNetwork } from './RoadNetwork';

export class RoadGeometryBuilder {
  /**
   * Calcule les bords gauche/droite et le polygone d'emprise de chaque route.
   */
  static buildRoadGeometries(network: RoadNetwork, samplesPerRoad: number = 24): void {
    for (const road of network.roads.values()) {
      const halfWidth = road.halfWidth;
      
      // Bords gauche et droite (gauche = +halfWidth, droite = -halfWidth)
      const leftBoundary = CurveOffset.sampleOffsetPoints(road.centerline, halfWidth, samplesPerRoad);
      const rightBoundary = CurveOffset.sampleOffsetPoints(road.centerline, -halfWidth, samplesPerRoad);

      road.leftBoundary = leftBoundary;
      road.rightBoundary = rightBoundary;

      // Polygone d'emprise fermé (gauche 0->N, droite N->0)
      const polygonVertices: Vector2D[] = [
        ...leftBoundary,
        ...rightBoundary.slice().reverse(),
      ];

      road.surfacePolygon = new Polygon2D(polygonVertices);
    }
  }
}

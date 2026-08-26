import { Vector2D } from '../core/math/Vector2D';
import { Polygon2D } from '../core/polygon/Polygon2D';
import { CurveOffset } from '../core/curves/CurveOffset';
import { RoadNetwork } from './RoadNetwork';

export class RoadGeometryBuilder {
  /**
   * Calcule les reculs (setbacks) et génère les rubans de routes sur [tStart, tEnd]
   */
  static buildRoadGeometries(network: RoadNetwork, samplesPerRoad: number = 24): void {
    // 1. Calculer les setbacks pour chaque route à partir des carrefours
    for (const road of network.roads.values()) {
      const startNode = network.nodes.get(road.startNodeId);
      const endNode = network.nodes.get(road.endNodeId);

      let startSetback = 0;
      let endSetback = 0;

      if (startNode) {
        if (startNode.type === 'roundabout' && startNode.roundaboutConfig) {
          startSetback = startNode.roundaboutConfig.radius;
        } else if (startNode.arms.length >= 2) {
          // Trouver la plus grande largeur des autres routes connectées
          let maxCrossHalfWidth = road.halfWidth;
          for (const arm of startNode.arms) {
            if (arm.roadId !== road.id) {
              maxCrossHalfWidth = Math.max(maxCrossHalfWidth, arm.roadWidth / 2);
            }
          }
          startSetback = maxCrossHalfWidth + (startNode.curbRadius || 5.0) * 0.8;
        }
      }

      if (endNode) {
        if (endNode.type === 'roundabout' && endNode.roundaboutConfig) {
          endSetback = endNode.roundaboutConfig.radius;
        } else if (endNode.arms.length >= 2) {
          let maxCrossHalfWidth = road.halfWidth;
          for (const arm of endNode.arms) {
            if (arm.roadId !== road.id) {
              maxCrossHalfWidth = Math.max(maxCrossHalfWidth, arm.roadWidth / 2);
            }
          }
          endSetback = maxCrossHalfWidth + (endNode.curbRadius || 5.0) * 0.8;
        }
      }

      road.updateSetbacks(startSetback, endSetback);
    }

    // 2. Générer les rubans géométriques sur [tStart, tEnd]
    for (const road of network.roads.values()) {
      const halfWidth = road.halfWidth;
      const tStart = road.tStart;
      const tEnd = road.tEnd;

      const leftBoundary = CurveOffset.sampleOffsetPoints(road.centerline, halfWidth, samplesPerRoad, tStart, tEnd);
      const rightBoundary = CurveOffset.sampleOffsetPoints(road.centerline, -halfWidth, samplesPerRoad, tStart, tEnd);

      road.leftBoundary = leftBoundary;
      road.rightBoundary = rightBoundary;

      const polygonVertices: Vector2D[] = [
        ...leftBoundary,
        ...rightBoundary.slice().reverse(),
      ];

      road.surfacePolygon = new Polygon2D(polygonVertices);
    }
  }
}

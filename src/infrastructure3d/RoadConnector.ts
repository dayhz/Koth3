import { RoadSegment } from '../engine/RoadSegment';
import { IntersectionNode } from '../engine/IntersectionNode';
import { ConnectionInterfaceData } from './types';
import { Vector2D } from '../core/math/Vector2D';

export class RoadConnector {
  /**
   * Calcule les données géométriques d'interface de raccordement entre une route et un carrefour
   */
  static computeConnectionInterface(
    road: RoadSegment,
    node: IntersectionNode,
    isStartOfRoad: boolean
  ): ConnectionInterfaceData {
    const t = isStartOfRoad ? road.tStart : road.tEnd;
    const centerPoint = road.centerline.getPoint(t);
    const tangent = road.centerline.getTangent(t);
    const halfW = road.totalWidth / 2;

    const normal = new Vector2D(-tangent.y, tangent.x).normalize();
    const leftBoundaryPoint = centerPoint.addScaled(normal, halfW);
    const rightBoundaryPoint = centerPoint.addScaled(normal, -halfW);
    const elevation = road.centerline.getElevation(t);

    return {
      roadId: road.id,
      nodeId: node.id,
      isStartOfRoad,
      setbackPoint: centerPoint,
      leftBoundaryPoint,
      rightBoundaryPoint,
      elevation,
      laneCount: road.profile.laneCount,
    };
  }

  /**
   * Vérifie la cohérence géométrique d'un raccordement
   */
  static validateConnection(
    conn: ConnectionInterfaceData,
    road: RoadSegment,
    node: IntersectionNode,
    toleranceMeters: number = 0.05
  ): boolean {
    // Vérifier que la route atteint l'altitude du nœud à son extrémité
    const extremityT = conn.isStartOfRoad ? 0 : 1;
    const extremityElevation = road.centerline.getElevation(extremityT);
    const deltaZ = Math.abs(extremityElevation - node.elevation);
    return deltaZ <= toleranceMeters;
  }
}

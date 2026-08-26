import { Vector2D } from '../core/math/Vector2D';
import { Polygon2D } from '../core/polygon/Polygon2D';
import { RoadNetwork } from './RoadNetwork';
import { IntersectionNode } from './IntersectionNode';

export class IntersectionBuilder {
  static buildIntersections(network: RoadNetwork): void {
    for (const node of network.nodes.values()) {
      if (node.type === 'roundabout' && node.roundaboutConfig) {
        this.buildRoundaboutPolygon(node);
      } else {
        this.buildStandardIntersectionPolygon(node, network);
      }
    }
  }

  private static buildStandardIntersectionPolygon(node: IntersectionNode, network: RoadNetwork): void {
    if (node.arms.length === 0) {
      node.surfacePolygon = new Polygon2D();
      return;
    }

    if (node.arms.length === 1) {
      // Cul-de-sac / extrémité libre : pas de carrefour étendu
      const arm = node.arms[0];
      const road = network.roads.get(arm.roadId);
      if (!road) return;

      const pLeft = arm.isStartOfRoad ? road.leftBoundary[0] : road.leftBoundary[road.leftBoundary.length - 1];
      const pRight = arm.isStartOfRoad ? road.rightBoundary[0] : road.rightBoundary[road.rightBoundary.length - 1];
      node.surfacePolygon = new Polygon2D([pLeft, pRight]);
      return;
    }

    // Carrefour multi-branches (T, X, etc.)
    // Les bras sont déjà triés par angle croissant dans node.arms
    const polygonPoints: Vector2D[] = [];

    for (let i = 0; i < node.arms.length; i++) {
      const arm1 = node.arms[i];
      const arm2 = node.arms[(i + 1) % node.arms.length];

      const road1 = network.roads.get(arm1.roadId);
      const road2 = network.roads.get(arm2.roadId);
      if (!road1 || !road2) continue;

      // Déterminer les points de contact sur chaque route
      // Pour arm1 : bord droit sortant du carrefour
      const pt1 = arm1.isStartOfRoad
        ? road1.rightBoundary[0]
        : road1.leftBoundary[road1.leftBoundary.length - 1];

      // Pour arm2 : bord gauche entrant dans le carrefour
      const pt2 = arm2.isStartOfRoad
        ? road2.leftBoundary[0]
        : road2.rightBoundary[road2.rightBoundary.length - 1];

      polygonPoints.push(pt1);
      
      // Si la distance entre pt1 et pt2 est significative, on peut ajouter le point médian ou un point de raccord
      polygonPoints.push(pt2);
    }

    // Filtrer les doublons trop proches
    const cleanPoints: Vector2D[] = [];
    for (let i = 0; i < polygonPoints.length; i++) {
      const p = polygonPoints[i];
      const next = polygonPoints[(i + 1) % polygonPoints.length];
      if (p.distanceTo(next) > 0.05) {
        cleanPoints.push(p);
      }
    }

    node.surfacePolygon = new Polygon2D(cleanPoints);
  }

  private static buildRoundaboutPolygon(node: IntersectionNode): void {
    const config = node.roundaboutConfig!;
    const center = Vector2D.from(config.center);
    const radius = config.radius;
    const segments = 32;

    const outerVertices: Vector2D[] = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      outerVertices.push(
        new Vector2D(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle))
      );
    }

    node.surfacePolygon = new Polygon2D(outerVertices);
  }
}

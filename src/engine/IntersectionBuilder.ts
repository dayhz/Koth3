import { Vector2D } from '../core/math/Vector2D';
import { Polygon2D } from '../core/polygon/Polygon2D';
import { CurbReturnBuilder } from '../core/curves/CurbReturnBuilder';
import { RoadNetwork } from './RoadNetwork';
import { IntersectionNode } from './IntersectionNode';
import { SplitterIsland } from './types';

export class IntersectionBuilder {
  static buildIntersections(network: RoadNetwork): void {
    for (const node of network.nodes.values()) {
      node.curbReturns = [];
      node.splitterIslands = [];

      if (node.type === 'roundabout' && node.roundaboutConfig) {
        this.buildRoundaboutIntersection(node, network);
      } else {
        this.buildStandardIntersectionWithCurbReturns(node, network);
      }
    }
  }

  private static buildStandardIntersectionWithCurbReturns(node: IntersectionNode, network: RoadNetwork): void {
    if (node.arms.length <= 1) {
      this.buildDeadEndIntersection(node, network);
      return;
    }

    // Carrefour multi-branches avec congés de trottoir arrondis
    const polygonPoints: Vector2D[] = [];
    const curbRadius = node.curbRadius || 5.0;

    for (let i = 0; i < node.arms.length; i++) {
      const arm1 = node.arms[i];
      const arm2 = node.arms[(i + 1) % node.arms.length];

      const road1 = network.roads.get(arm1.roadId);
      const road2 = network.roads.get(arm2.roadId);
      if (!road1 || !road2) continue;

      // Ligne de bordure de road1 sortant vers l'intersection
      const p1Start = arm1.isStartOfRoad
        ? road1.rightBoundary[Math.min(3, road1.rightBoundary.length - 1)]
        : road1.leftBoundary[Math.max(0, road1.leftBoundary.length - 4)];
      
      const p1End = arm1.isStartOfRoad
        ? road1.rightBoundary[0]
        : road1.leftBoundary[road1.leftBoundary.length - 1];

      // Ligne de bordure de road2 entrant depuis l'intersection
      const p2Start = arm2.isStartOfRoad
        ? road2.leftBoundary[0]
        : road2.rightBoundary[road2.rightBoundary.length - 1];

      const p2End = arm2.isStartOfRoad
        ? road2.leftBoundary[Math.min(3, road2.leftBoundary.length - 1)]
        : road2.rightBoundary[Math.max(0, road2.rightBoundary.length - 4)];

      // Calculer le congé de raccordement
      const fillet = CurbReturnBuilder.computeFillet(
        p1Start,
        p1End,
        p2Start,
        p2End,
        curbRadius,
        12
      );

      if (fillet && fillet.points.length > 0) {
        // Enregistrer les données du congé
        node.curbReturns.push({
          id: `CR_${node.id}_${i}`,
          fromRoadId: arm1.roadId,
          toRoadId: arm2.roadId,
          radius: curbRadius,
          arcPoints: fillet.points.map((p) => p.toJSON()),
        });

        // Ajouter l'arc au polygone d'intersection
        for (const pt of fillet.points) {
          polygonPoints.push(pt);
        }
      } else {
        // Raccordement direct si le congé ne peut être calculé
        polygonPoints.push(p1End);
        polygonPoints.push(p2Start);
      }
    }

    // Nettoyer les doublons
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

  private static buildDeadEndIntersection(node: IntersectionNode, network: RoadNetwork): void {
    if (node.arms.length === 0) {
      node.surfacePolygon = new Polygon2D();
      return;
    }
    const arm = node.arms[0];
    const road = network.roads.get(arm.roadId);
    if (!road) return;

    const pLeft = arm.isStartOfRoad ? road.leftBoundary[0] : road.leftBoundary[road.leftBoundary.length - 1];
    const pRight = arm.isStartOfRoad ? road.rightBoundary[0] : road.rightBoundary[road.rightBoundary.length - 1];
    node.surfacePolygon = new Polygon2D([pLeft, pRight]);
  }

  private static buildRoundaboutIntersection(node: IntersectionNode, network: RoadNetwork): void {
    const config = node.roundaboutConfig!;
    const center = Vector2D.from(config.center);
    const radius = config.radius;
    const segments = 48;

    // 1. Anneau extérieur
    const outerVertices: Vector2D[] = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      outerVertices.push(
        new Vector2D(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle))
      );
    }
    node.surfacePolygon = new Polygon2D(outerVertices);

    // 2. Générer les îlots séparateurs (Splitter Islands) aux branches si activé
    if (config.hasSplitterIslands !== false && node.arms.length > 0) {
      let islandCounter = 1;

      for (const arm of node.arms) {
        const road = network.roads.get(arm.roadId);
        if (!road) continue;

        // Position de l'extrémité de la route devant le giratoire
        const roadEndPt = arm.isStartOfRoad ? road.centerline.getPoint(0) : road.centerline.getPoint(1);
        const roadDir = arm.isStartOfRoad
          ? road.centerline.getTangent(0).multiplyScalar(-1)
          : road.centerline.getTangent(1);

        const normal = roadDir.normalLeft();
        const halfW = 1.6; // Largeur de l'îlot à la base
        const islandLength = 8.0;

        // Triangle d'îlot séparateur
        const pApex = roadEndPt.addScaled(roadDir, islandLength); // Pointe vers la route
        const pBaseLeft = roadEndPt.addScaled(normal, halfW);      // Base gauche vers l'anneau
        const pBaseRight = roadEndPt.addScaled(normal, -halfW);    // Base droite vers l'anneau

        const island: SplitterIsland = {
          id: `SI_${node.id}_${islandCounter++}`,
          intersectionId: node.id,
          armRoadId: arm.roadId,
          polygon: [pApex.toJSON(), pBaseLeft.toJSON(), pBaseRight.toJSON()],
          height: 0.15,
        };

        node.splitterIslands.push(island);
      }
    }
  }
}

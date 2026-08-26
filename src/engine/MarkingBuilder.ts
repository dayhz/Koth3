import { Vector2D } from '../core/math/Vector2D';
import { CurveOffset } from '../core/curves/CurveOffset';
import { RoadNetwork } from './RoadNetwork';
import { RoadMarking } from './RoadMarking';
import { CrosswalkData, LaneAllowedMovement } from './types';

export class MarkingBuilder {
  static buildMarkings(network: RoadNetwork): void {
    network.markings.clear();
    network.crosswalks.clear();
    network.directionalArrows.clear();
    network.stopLines.clear();

    let markingCounter = 1;
    let crosswalkCounter = 1;
    let arrowCounter = 1;
    let stopLineCounter = 1;

    for (const road of network.roads.values()) {
      road.markingIds = [];
      const laneCount = road.profile.laneCount;
      const laneWidth = road.profile.laneWidth;
      const halfWidth = road.halfWidth;
      const tStart = road.tStart;
      const tEnd = road.tEnd;
      const startNode = network.nodes.get(road.startNodeId);
      const endNode = network.nodes.get(road.endNodeId);

      // 1. Ligne centrale axiale
      if (laneCount >= 2) {
        const id = `M_${markingCounter++}`;
        const marking = new RoadMarking(
          id,
          'center_dashed',
          road.centerline.clone(),
          0.15,
          road.id,
          undefined,
          [3.0, 3.0],
          tStart,
          tEnd
        );
        network.markings.set(id, marking);
        road.markingIds.push(id);
      }

      // 2. Lignes de séparation supplémentaires pour 4 voies
      if (laneCount === 4) {
        const idLeft = `M_${markingCounter++}`;
        const leftCurve = CurveOffset.offsetCurve(road.centerline, laneWidth);
        const markLeft = new RoadMarking(idLeft, 'lane_dashed', leftCurve, 0.12, road.id, undefined, [2.0, 4.0], tStart, tEnd);
        network.markings.set(idLeft, markLeft);
        road.markingIds.push(idLeft);

        const idRight = `M_${markingCounter++}`;
        const rightCurve = CurveOffset.offsetCurve(road.centerline, -laneWidth);
        const markRight = new RoadMarking(idRight, 'lane_dashed', rightCurve, 0.12, road.id, undefined, [2.0, 4.0], tStart, tEnd);
        network.markings.set(idRight, markRight);
        road.markingIds.push(idRight);
      }

      // 3. Lignes de rive (Edge lines) le long des bordures de chaussée
      const idEdgeL = `M_${markingCounter++}`;
      const curveEdgeL = CurveOffset.offsetCurve(road.centerline, halfWidth - 0.15);
      const markEdgeL = new RoadMarking(idEdgeL, 'edge_solid', curveEdgeL, 0.15, road.id, undefined, undefined, tStart, tEnd);
      network.markings.set(idEdgeL, markEdgeL);
      road.markingIds.push(idEdgeL);

      const idEdgeR = `M_${markingCounter++}`;
      const curveEdgeR = CurveOffset.offsetCurve(road.centerline, -(halfWidth - 0.15));
      const markEdgeR = new RoadMarking(idEdgeR, 'edge_solid', curveEdgeR, 0.15, road.id, undefined, undefined, tStart, tEnd);
      network.markings.set(idEdgeR, markEdgeR);
      road.markingIds.push(idEdgeR);

      // 4. Passages piétons (Crosswalks) en approche de carrefours
      if (endNode && endNode.arms.length >= 2 && road.length > 20) {
        this.createCrosswalk(network, road, tEnd, `CW_${crosswalkCounter++}`);
      }
      if (startNode && startNode.arms.length >= 2 && road.length > 20) {
        this.createCrosswalk(network, road, tStart, `CW_${crosswalkCounter++}`);
      }
    }

    // 5. Lignes d'arrêt (Stop / Yield Lines) et Flèches directionnelles par carrefour
    for (const node of network.nodes.values()) {
      if (node.arms.length < 2) continue;

      for (const arm of node.arms) {
        const road = network.roads.get(arm.roadId);
        if (!road) continue;

        const roadLanes = network.getLanesForRoad(road.id);
        for (const lane of roadLanes) {
          // Identifier si la voie entre dans le carrefour
          const isIncoming = arm.isStartOfRoad
            ? lane.direction === 'backward'
            : lane.direction === 'forward';

          if (isIncoming) {
            const tEntry = arm.isStartOfRoad ? road.tStart : road.tEnd;
            const entryPt = lane.centerline.getPoint(tEntry);
            const tangent = lane.centerline.getTangent(tEntry);
            const normal = tangent.normalLeft();
            const halfLaneW = lane.width / 2;

            // A. Ligne d'arrêt transversale
            const p1 = entryPt.addScaled(normal, halfLaneW * 0.9);
            const p2 = entryPt.addScaled(normal, -halfLaneW * 0.9);

            const isRoundabout = node.type === 'roundabout';
            const stopLineId = `SL_${stopLineCounter++}`;
            const stopLineElevation = road.centerline.getElevation(tEntry);
            network.stopLines.set(stopLineId, {
              id: stopLineId,
              laneId: lane.id,
              intersectionId: node.id,
              p1: p1.toJSON(),
              p2: p2.toJSON(),
              elevation: stopLineElevation,
              width: isRoundabout ? 0.30 : 0.50,
              isDashed: isRoundabout,
            });

            // B. Flèche directionnelle (positionnée ~8m avant la ligne d'arrêt)
            const arrowDistMeters = 8.0;
            const deltaT = road.length > 0 ? (arrowDistMeters / road.length) * (arm.isStartOfRoad ? 1 : -1) : 0;
            const tArrow = Math.max(0.05, Math.min(0.95, tEntry + deltaT));
            const arrowPos = lane.centerline.getPoint(tArrow);
            const arrowElevation = road.centerline.getElevation(tArrow);
            const arrowDir = lane.direction === 'forward' ? tangent : tangent.multiplyScalar(-1);

            // Déduire le mouvement à partir des connexions de voie de ce carrefour
            let movement: LaneAllowedMovement = 'straight';
            const conns = Array.from(network.laneConnections.values()).filter(
              (c) => c.fromLaneId === lane.id && c.intersectionId === node.id
            );
            if (conns.length > 0) {
              movement = conns[0].movement;
            }

            const arrowId = `AR_${arrowCounter++}`;
            network.directionalArrows.set(arrowId, {
              id: arrowId,
              laneId: lane.id,
              position: arrowPos.toJSON(),
              elevation: arrowElevation,
              direction: arrowDir.toJSON(),
              movement,
            });
          }
        }
      }
    }
  }

  private static createCrosswalk(
    network: RoadNetwork,
    road: any,
    tBoundary: number,
    id: string
  ): void {
    const isAtEnd = tBoundary > 0.5;
    // Décalage de 4m avant la ligne de recul pour laisser place à la ligne d'arrêt
    const crosswalkOffsetDist = 4.0;
    const deltaT = road.length > 0 ? (crosswalkOffsetDist / road.length) * (isAtEnd ? -1 : 1) : 0;
    const tCenter = Math.max(0.05, Math.min(0.95, tBoundary + deltaT));

    const center = road.centerline.getPoint(tCenter);
    const centerElevation = road.centerline.getElevation(tCenter);
    const tangent = road.centerline.getTangent(tCenter);
    const normal = tangent.normalLeft();
    const halfWidth = road.halfWidth;

    const crosswalkWidth = road.totalWidth;
    const crosswalkLength = 3.0; // 3 mètres de long (sens de marche de la route)
    const stripeWidth = 0.50;    // Bande de 50cm
    const stripeGap = 0.50;      // Espace de 50cm
    const period = stripeWidth + stripeGap;

    const stripes: { p1: Vector2D; p2: Vector2D }[] = [];
    const numStripes = Math.floor(crosswalkWidth / period);
    const startOffset = -halfWidth + stripeWidth / 2;

    for (let i = 0; i < numStripes; i++) {
      const lateralDist = startOffset + i * period;
      const stripeCenter = center.addScaled(normal, lateralDist);

      const p1 = stripeCenter.addScaled(tangent, -crosswalkLength / 2);
      const p2 = stripeCenter.addScaled(tangent, crosswalkLength / 2);

      stripes.push({ p1, p2 });
    }

    const crosswalk: CrosswalkData = {
      id,
      parentRoadId: road.id,
      center: center.toJSON(),
      elevation: centerElevation,
      direction: tangent.toJSON(),
      width: crosswalkWidth,
      length: crosswalkLength,
      stripes: stripes.map((s) => ({ p1: s.p1.toJSON(), p2: s.p2.toJSON() })),
    };

    network.crosswalks.set(id, crosswalk);
  }
}

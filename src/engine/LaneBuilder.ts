import { CubicBezierCurve } from '../core/curves/Curve';
import { CurveOffset } from '../core/curves/CurveOffset';
import { RoadNetwork } from './RoadNetwork';
import { Lane } from './Lane';
import { LaneConnection, LaneDirection } from './types';

export class LaneBuilder {
  static buildLanes(network: RoadNetwork): void {
    network.lanes.clear();
    network.laneConnections.clear();

    let laneCounter = 1;
    let connCounter = 1;

    // 1. Générer les voies le long des routes
    for (const road of network.roads.values()) {
      road.laneIds = [];
      const laneCount = road.profile.laneCount;
      const laneWidth = road.profile.laneWidth;

      if (laneCount === 1) {
        // 1 voie simple sens direct
        const id = `L_${laneCounter++}`;
        const lane = new Lane(id, road.id, 1, 'forward', laneWidth, road.centerline.clone(), road.profile.speedLimitKmH);
        network.lanes.set(id, lane);
        road.laneIds.push(id);
      } else if (laneCount === 2) {
        // 2 voies : 1 sens direct (droite de l'axe), 1 sens inverse (gauche de l'axe)
        // Voie retour (backward) : à gauche de l'axe (+laneWidth/2)
        const idBack = `L_${laneCounter++}`;
        const backCurve = CurveOffset.offsetCurve(road.centerline, laneWidth / 2);
        const laneBack = new Lane(idBack, road.id, -1, 'backward', laneWidth, backCurve, road.profile.speedLimitKmH);
        network.lanes.set(idBack, laneBack);
        road.laneIds.push(idBack);

        // Voie aller (forward) : à droite de l'axe (-laneWidth/2)
        const idFwd = `L_${laneCounter++}`;
        const fwdCurve = CurveOffset.offsetCurve(road.centerline, -laneWidth / 2);
        const laneFwd = new Lane(idFwd, road.id, 1, 'forward', laneWidth, fwdCurve, road.profile.speedLimitKmH);
        network.lanes.set(idFwd, laneFwd);
        road.laneIds.push(idFwd);
      } else if (laneCount === 4) {
        // 4 voies : 2 voies retour (+1.5w, +0.5w), 2 voies aller (-0.5w, -1.5w)
        const offsets: { index: number; dir: LaneDirection; offset: number }[] = [
          { index: -2, dir: 'backward', offset: 1.5 * laneWidth },
          { index: -1, dir: 'backward', offset: 0.5 * laneWidth },
          { index: 1, dir: 'forward', offset: -0.5 * laneWidth },
          { index: 2, dir: 'forward', offset: -1.5 * laneWidth },
        ];

        for (const item of offsets) {
          const id = `L_${laneCounter++}`;
          const curve = CurveOffset.offsetCurve(road.centerline, item.offset);
          const lane = new Lane(id, road.id, item.index, item.dir, laneWidth, curve, road.profile.speedLimitKmH);
          network.lanes.set(id, lane);
          road.laneIds.push(id);
        }
      }
    }

    // 2. Générer les connexions de voies à travers les intersections
    for (const node of network.nodes.values()) {
      node.laneConnectionIds = [];
      const { incoming, outgoing } = network.getLanesConnectedToIntersection(node.id);

      for (const inLane of incoming) {
        for (const outLane of outgoing) {
          // Éviter le demi-tour immédiat sur la même route si d'autres options existent
          if (inLane.parentRoadId === outLane.parentRoadId && outgoing.length > 1) {
            continue;
          }

          const inRoad = network.roads.get(inLane.parentRoadId);
          const outRoad = network.roads.get(outLane.parentRoadId);
          if (!inRoad || !outRoad) continue;

          // Point d'arrivée de inLane au carrefour
          const pStart = inLane.direction === 'forward'
            ? inLane.centerline.getPoint(1)
            : inLane.centerline.getPoint(0);
          
          const tStart = inLane.direction === 'forward'
            ? inLane.centerline.getTangent(1)
            : inLane.centerline.getTangent(0).multiplyScalar(-1);

          // Point de départ de outLane depuis le carrefour
          const pEnd = outLane.direction === 'forward'
            ? outLane.centerline.getPoint(0)
            : outLane.centerline.getPoint(1);

          const tEnd = outLane.direction === 'forward'
            ? outLane.centerline.getTangent(0)
            : outLane.centerline.getTangent(1).multiplyScalar(-1);

          // Créer une trajectoire cubique Bézier fluide entre l'entrée et la sortie du carrefour
          const dist = pStart.distanceTo(pEnd);
          const handleLen = Math.max(1.0, dist * 0.4);

          const cp1 = pStart.addScaled(tStart, handleLen);
          const cp2 = pEnd.addScaled(tEnd, -handleLen);

          const trajectory = new CubicBezierCurve(pStart, cp1, cp2, pEnd);

          const connId = `LC_${connCounter++}`;
          const connection: LaneConnection = {
            id: connId,
            intersectionId: node.id,
            fromLaneId: inLane.id,
            toLaneId: outLane.id,
            movement: 'straight', // ou calcul d'angle
            trajectory,
          };

          network.laneConnections.set(connId, connection);
          node.laneConnectionIds.push(connId);

          inLane.outgoingLaneIds.push(outLane.id);
          outLane.incomingLaneIds.push(inLane.id);
        }
      }
    }
  }
}

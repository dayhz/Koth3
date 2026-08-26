import { CubicBezierCurve } from '../core/curves/Curve';
import { CurveOffset } from '../core/curves/CurveOffset';
import { RoadNetwork } from './RoadNetwork';
import { Lane } from './Lane';
import { LaneAllowedMovement, LaneConnection, LaneDirection } from './types';

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
        // 2 voies : 1 sens inverse (+width/2), 1 sens direct (-width/2)
        const idBack = `L_${laneCounter++}`;
        const backCurve = CurveOffset.offsetCurve(road.centerline, laneWidth / 2);
        const laneBack = new Lane(idBack, road.id, -1, 'backward', laneWidth, backCurve, road.profile.speedLimitKmH);
        network.lanes.set(idBack, laneBack);
        road.laneIds.push(idBack);

        const idFwd = `L_${laneCounter++}`;
        const fwdCurve = CurveOffset.offsetCurve(road.centerline, -laneWidth / 2);
        const laneFwd = new Lane(idFwd, road.id, 1, 'forward', laneWidth, fwdCurve, road.profile.speedLimitKmH);
        network.lanes.set(idFwd, laneFwd);
        road.laneIds.push(idFwd);
      } else if (laneCount === 4) {
        // 4 voies
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

    // 2. Générer les trajectoires de carrefour avec classification du mouvement
    for (const node of network.nodes.values()) {
      node.laneConnectionIds = [];
      const { incoming, outgoing } = network.getLanesConnectedToIntersection(node.id);

      for (const inLane of incoming) {
        for (const outLane of outgoing) {
          if (inLane.parentRoadId === outLane.parentRoadId && outgoing.length > 1) {
            continue;
          }

          const inRoad = network.roads.get(inLane.parentRoadId);
          const outRoad = network.roads.get(outLane.parentRoadId);
          if (!inRoad || !outRoad) continue;

          // Point et tangente d'arrivée de inLane au carrefour
          const pStart = inLane.direction === 'forward'
            ? inLane.centerline.getPoint(1)
            : inLane.centerline.getPoint(0);

          const tStart = inLane.direction === 'forward'
            ? inLane.centerline.getTangent(1)
            : inLane.centerline.getTangent(0).multiplyScalar(-1);

          // Point et tangente de départ de outLane depuis le carrefour
          const pEnd = outLane.direction === 'forward'
            ? outLane.centerline.getPoint(0)
            : outLane.centerline.getPoint(1);

          const tEnd = outLane.direction === 'forward'
            ? outLane.centerline.getTangent(0)
            : outLane.centerline.getTangent(1).multiplyScalar(-1);

          // Classification du mouvement selon la variation d'angle (inTangent vs outTangent)
          const angleIn = Math.atan2(tStart.y, tStart.x);
          const angleOut = Math.atan2(tEnd.y, tEnd.x);
          let deltaAngle = angleOut - angleIn;
          while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
          while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

          let movement: LaneAllowedMovement = 'straight';
          if (deltaAngle > 0.4) {
            movement = 'turn_left';
          } else if (deltaAngle < -0.4) {
            movement = 'turn_right';
          }

          // Trajectoire Bézier cubique avec poignées tangentielles adaptées au rayon de virage
          const dist = pStart.distanceTo(pEnd);
          const handleFactor = movement === 'straight' ? 0.35 : 0.45;
          const handleLen = Math.max(1.5, dist * handleFactor);

          const cp1 = pStart.addScaled(tStart, handleLen);
          const cp2 = pEnd.addScaled(tEnd, -handleLen);

          const trajectory = new CubicBezierCurve(pStart, cp1, cp2, pEnd);

          const connId = `LC_${connCounter++}`;
          const connection: LaneConnection = {
            id: connId,
            intersectionId: node.id,
            fromLaneId: inLane.id,
            toLaneId: outLane.id,
            movement,
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

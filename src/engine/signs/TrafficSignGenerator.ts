import { RoadNetwork } from '../RoadNetwork';
import { TrafficRegulationEngine } from '../regulation/TrafficRegulationEngine';
import { TrafficSign, TrafficSignType } from './TrafficSignTypes';
import { Vector2D } from '../../core/math/Vector2D';

export class TrafficSignGenerator {
  /**
   * Génère l'ensemble des panneaux de signalisation routière verticaux pour le réseau
   */
  static generate(network: RoadNetwork, regulation: TrafficRegulationEngine): Map<string, TrafficSign> {
    const signs = new Map<string, TrafficSign>();
    let signCounter = 1;

    const addSign = (
      type: TrafficSignType,
      pos: Vector2D,
      elevation: number,
      heading: number,
      roadId?: string,
      intersectionId?: string
    ) => {
      const id = `sign_${signCounter++}_${type}`;
      signs.set(id, {
        id,
        type,
        position: pos,
        elevation,
        heading,
        height: 2.2,
        roadId,
        intersectionId,
      });
    };

    // 1. Panneaux de Limitation de Vitesse en début de route
    for (const road of network.roads.values()) {
      const pStart = road.centerline.getPoint(0.05);
      const tStart = road.centerline.getTangent(0.05);
      const nStart = new Vector2D(-tStart.y, tStart.x);
      const elev = road.centerline.getElevation(0.05);

      // Panneau sur le trottoir de droite
      const offsetRight = road.totalWidth / 2 + 0.8;
      const signPos = pStart.addScaled(nStart, -offsetRight);
      const heading = Math.atan2(-tStart.y, -tStart.x); // Face aux véhicules arrivants

      let speedType: TrafficSignType = 'speed_50';
      if (road.profile.speedLimitKmH <= 30) speedType = 'speed_30';
      else if (road.profile.speedLimitKmH <= 50) speedType = 'speed_50';
      else if (road.profile.speedLimitKmH <= 70) speedType = 'speed_70';
      else speedType = 'speed_90';

      addSign(speedType, signPos, elev, heading, road.id);
    }

    // 2. Panneaux de Priorité aux Carrefours (STOP, Cédez-le-Passage, Giratoire)
    for (const [nodeId, rule] of regulation.priorityRules.entries()) {
      const node = network.nodes.get(nodeId);
      if (!node) continue;

      if (rule.regime === 'roundabout') {
        // Panneau Rond-Point B21-1 sur chaque branche arrivant au giratoire
        for (const arm of node.arms) {
          const road = network.roads.get(arm.roadId);
          if (!road) continue;

          const isStartNode = road.startNodeId === nodeId;
          const s = isStartNode ? 0.08 : 0.92;
          const point = road.centerline.getPoint(s);
          const tangent = road.centerline.getTangent(s);
          const normal = new Vector2D(-tangent.y, tangent.x);
          const heading = isStartNode
            ? Math.atan2(tangent.y, tangent.x)
            : Math.atan2(-tangent.y, -tangent.x);

          const signPos = point.addScaled(normal, -(road.totalWidth / 2 + 0.8));
          addSign('roundabout', signPos, node.elevation, heading, road.id, nodeId);
        }
      } else if (rule.regime === 'stop') {
        // Panneau STOP AB4 sur les voies secondaires
        for (const minorRoadId of rule.minorRoadIds) {
          const road = network.roads.get(minorRoadId);
          if (!road) continue;

          const isStartNode = road.startNodeId === nodeId;
          const s = isStartNode ? 0.08 : 0.92;
          const point = road.centerline.getPoint(s);
          const tangent = road.centerline.getTangent(s);
          const normal = new Vector2D(-tangent.y, tangent.x);
          const heading = isStartNode
            ? Math.atan2(tangent.y, tangent.x)
            : Math.atan2(-tangent.y, -tangent.x);

          const signPos = point.addScaled(normal, -(road.totalWidth / 2 + 0.8));
          addSign('stop', signPos, node.elevation, heading, road.id, nodeId);
        }
      } else if (rule.regime === 'yield' || rule.regime === 'priority_road' || rule.regime === 'priority_to_right') {
        // Panneau Cédez-le-Passage AB3a sur les voies secondaires
        for (const minorRoadId of rule.minorRoadIds) {
          const road = network.roads.get(minorRoadId);
          if (!road) continue;

          const isStartNode = road.startNodeId === nodeId;
          const s = isStartNode ? 0.08 : 0.92;
          const point = road.centerline.getPoint(s);
          const tangent = road.centerline.getTangent(s);
          const normal = new Vector2D(-tangent.y, tangent.x);
          const heading = isStartNode
            ? Math.atan2(tangent.y, tangent.x)
            : Math.atan2(-tangent.y, -tangent.x);

          const signPos = point.addScaled(normal, -(road.totalWidth / 2 + 0.8));
          addSign('yield', signPos, node.elevation, heading, road.id, nodeId);
        }
      }
    }

    // 3. Panneaux de Passages Piétons (C20a)
    for (const cw of network.crosswalks.values()) {
      const road = network.roads.get(cw.parentRoadId);
      if (!road) continue;

      const center = new Vector2D(cw.center.x, cw.center.y);
      const dir = new Vector2D(cw.direction.x, cw.direction.y);
      const normal = new Vector2D(-dir.y, dir.x);
      const signPos = center.addScaled(normal, cw.width / 2 + 0.8);

      addSign('pedestrian_crossing', signPos, cw.elevation, Math.atan2(-dir.y, -dir.x), cw.parentRoadId);
    }

    return signs;
  }
}

import { Vector2D } from '../../core/math/Vector2D';
import { ArcCurve, LinearCurve } from '../../core/curves/Curve';
import { RoadNetwork } from '../RoadNetwork';
import { defaultResidentialProfile, fourLaneAvenueProfile } from './GridCityGenerator';
import { RadialCityConfig } from './types';

export class RadialCityGenerator {
  static generate(network: RoadNetwork, config: RadialCityConfig): void {
    const center = new Vector2D(0, 0);
    const spokes = config.spokesCount;
    const rings = config.ringRadii;

    const majorProfile = config.majorProfile || fourLaneAvenueProfile;
    const minorProfile = config.minorProfile || defaultResidentialProfile;

    // 1. Giratoire central
    network.createRoundaboutNode(center, config.centerRadius, config.centerRadius * 0.55, 2, 'CENTER_RND');

    // Matrice de nœuds d'intersection [anneau][branche]
    const ringNodes: string[][] = [];

    for (let r = 0; r < rings.length; r++) {
      const radius = rings[r];
      ringNodes[r] = [];

      for (let s = 0; s < spokes; s++) {
        const angle = (s / spokes) * 2 * Math.PI;
        const pos = new Vector2D(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle));
        const nodeId = `N_RING_${r}_${s}`;
        network.createNode(pos, 'four_way', nodeId);
        ringNodes[r][s] = nodeId;
      }
    }

    // 2. Créer les segments d'anneaux concentriques (Arcs)
    for (let r = 0; r < rings.length; r++) {
      const radius = rings[r];
      const profile = r === rings.length - 1 ? majorProfile : minorProfile; // Le grand périphérique est majeur

      for (let s = 0; s < spokes; s++) {
        const nextS = (s + 1) % spokes;
        const id1 = ringNodes[r][s];
        const id2 = ringNodes[r][nextS];

        const startAngle = (s / spokes) * 2 * Math.PI;
        const endAngle = ((s + 1) / spokes) * 2 * Math.PI;

        const arc = new ArcCurve(center, radius, startAngle, endAngle, false);
        network.createRoad(id1, id2, arc, profile, `R_RING_${r}_${s}`);
      }
    }

    // 3. Créer les branches radiales depuis le giratoire central vers la périphérie
    for (let s = 0; s < spokes; s++) {
      const angle = (s / spokes) * 2 * Math.PI;
      const innerPos = new Vector2D(
        center.x + config.centerRadius * Math.cos(angle),
        center.y + config.centerRadius * Math.sin(angle)
      );
      const innerNodeId = `N_CENT_EXIT_${s}`;
      network.createNode(innerPos, 't_junction', innerNodeId);

      // Branche radiale tronçon 0 : centre -> anneau 0
      const firstRingNodeId = ringNodes[0][s];
      const nFirst = network.nodes.get(firstRingNodeId)!;
      network.createRoad(innerNodeId, firstRingNodeId, new LinearCurve(innerPos, nFirst.position), majorProfile, `R_SPOKE_0_${s}`);

      // Branches radiales entre les anneaux suivants
      for (let r = 0; r < rings.length - 1; r++) {
        const idFrom = ringNodes[r][s];
        const idTo = ringNodes[r + 1][s];
        const nFrom = network.nodes.get(idFrom)!;
        const nTo = network.nodes.get(idTo)!;

        network.createRoad(idFrom, idTo, new LinearCurve(nFrom.position, nTo.position), majorProfile, `R_SPOKE_${r + 1}_${s}`);
      }
    }
  }
}

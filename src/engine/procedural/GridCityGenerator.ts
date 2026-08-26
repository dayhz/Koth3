import { Vector2D } from '../../core/math/Vector2D';
import { LinearCurve } from '../../core/curves/Curve';
import { RoadNetwork } from '../RoadNetwork';
import { RoadProfile } from '../types';
import { PRNG } from './PRNG';
import { GridCityConfig } from './types';

export const fourLaneAvenueProfile: RoadProfile = {
  roadType: 'avenue',
  laneCount: 4,
  laneWidth: 3.5,
  sidewalkWidthLeft: 2.5,
  sidewalkWidthRight: 2.5,
  curbHeight: 0.15,
  speedLimitKmH: 70,
};

export const defaultResidentialProfile: RoadProfile = {
  roadType: 'residential',
  laneCount: 2,
  laneWidth: 3.25,
  sidewalkWidthLeft: 2.0,
  sidewalkWidthRight: 2.0,
  curbHeight: 0.15,
  speedLimitKmH: 50,
};

export class GridCityGenerator {
  static generate(network: RoadNetwork, config: GridCityConfig, seed: number = 1234): void {
    const prng = new PRNG(seed);
    const rows = config.rows;
    const cols = config.cols;
    const stepX = config.blockSizeX;
    const stepY = config.blockSizeY;

    const majorProfile = config.majorProfile || fourLaneAvenueProfile;
    const minorProfile = config.minorProfile || defaultResidentialProfile;

    const startX = -((cols - 1) * stepX) / 2;
    const startY = -((rows - 1) * stepY) / 2;

    const nodeMatrix: string[][] = [];

    // 1. Créer la grille de nœuds
    for (let r = 0; r < rows; r++) {
      nodeMatrix[r] = [];
      for (let c = 0; c < cols; c++) {
        // Légère variation aléatoire déterministe pour le réalisme (jitter)
        const jitterX = prng.range(-2, 2);
        const jitterY = prng.range(-2, 2);

        const x = startX + c * stepX + jitterX;
        const y = startY + r * stepY + jitterY;

        const isBorder = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
        const type = isBorder ? 't_junction' : 'four_way';
        const nodeId = `N_G_${r}_${c}`;

        network.createNode(new Vector2D(x, y), type, nodeId);
        nodeMatrix[r][c] = nodeId;
      }
    }

    // 2. Créer les routes horizontales (East-West)
    for (let r = 0; r < rows; r++) {
      const isMajor = config.avenueFrequencyY ? r % config.avenueFrequencyY === 0 : r % 2 === 0;
      const profile = isMajor ? majorProfile : minorProfile;

      for (let c = 0; c < cols - 1; c++) {
        const id1 = nodeMatrix[r][c];
        const id2 = nodeMatrix[r][c + 1];
        const n1 = network.nodes.get(id1)!;
        const n2 = network.nodes.get(id2)!;

        const roadId = `R_H_${r}_${c}`;
        network.createRoad(id1, id2, new LinearCurve(n1.position, n2.position), profile, roadId);
      }
    }

    // 3. Créer les routes verticales (North-South)
    for (let c = 0; c < cols; c++) {
      const isMajor = config.avenueFrequencyX ? c % config.avenueFrequencyX === 0 : c % 2 === 0;
      const profile = isMajor ? majorProfile : minorProfile;

      for (let r = 0; r < rows - 1; r++) {
        const id1 = nodeMatrix[r][c];
        const id2 = nodeMatrix[r + 1][c];
        const n1 = network.nodes.get(id1)!;
        const n2 = network.nodes.get(id2)!;

        const roadId = `R_V_${r}_${c}`;
        network.createRoad(id1, id2, new LinearCurve(n1.position, n2.position), profile, roadId);
      }
    }
  }
}

import { Vector2D } from '../../core/math/Vector2D';
import { CubicBezierCurve } from '../../core/curves/Curve';
import { RoadNetwork } from '../RoadNetwork';
import { PRNG } from './PRNG';
import { defaultResidentialProfile, fourLaneAvenueProfile } from './GridCityGenerator';
import { OrganicCityConfig } from './types';

export class OrganicCityGenerator {
  static generate(network: RoadNetwork, config: OrganicCityConfig, seed: number = 5432): void {
    const prng = new PRNG(seed);
    const halfW = config.boundsWidth / 2;
    const halfH = config.boundsHeight / 2;

    const majorProfile = config.majorProfile || fourLaneAvenueProfile;
    const minorProfile = config.minorProfile || defaultResidentialProfile;

    let nodeIndex = 1;
    let roadIndex = 1;

    const existingNodes: { id: string; pos: Vector2D }[] = [];

    const getOrCreateSnappedNode = (pos: Vector2D): string => {
      for (const en of existingNodes) {
        if (en.pos.distanceTo(pos) <= config.snapDistance) {
          return en.id;
        }
      }
      const id = `N_ORG_${nodeIndex++}`;
      network.createNode(pos, 'dead_end', id);
      existingNodes.push({ id, pos });
      return id;
    };

    // 1. Générer les artères principales sinueuses
    for (let a = 0; a < config.mainArteriesCount; a++) {
      const pStart = new Vector2D(
        prng.range(-halfW * 0.9, -halfW * 0.4),
        prng.range(-halfH * 0.8, halfH * 0.8)
      );
      const pEnd = new Vector2D(
        prng.range(halfW * 0.4, halfW * 0.9),
        prng.range(-halfH * 0.8, halfH * 0.8)
      );

      const pMid1 = new Vector2D(
        prng.range(-halfW * 0.2, 0),
        prng.range(-halfH * 0.6, halfH * 0.6)
      );
      const pMid2 = new Vector2D(
        prng.range(0, halfW * 0.2),
        prng.range(-halfH * 0.6, halfH * 0.6)
      );

      const idStart = getOrCreateSnappedNode(pStart);
      const idEnd = getOrCreateSnappedNode(pEnd);
      const nStart = network.nodes.get(idStart)!;
      const nEnd = network.nodes.get(idEnd)!;

      const curve = new CubicBezierCurve(nStart.position, pMid1, pMid2, nEnd.position);
      network.createRoad(idStart, idEnd, curve, majorProfile, `R_ORG_ART_${roadIndex++}`);

      // 2. Branches secondaires le long de l'artère
      for (let b = 1; b <= config.branchesPerArtery; b++) {
        const t = b / (config.branchesPerArtery + 1);
        const branchStart = curve.getPoint(t);
        const branchDir = curve.getTangent(t).normalLeft();
        const side = prng.chance(0.5) ? 1 : -1;

        const branchLength = prng.range(25, 50);
        const branchEnd = branchStart.addScaled(branchDir, side * branchLength);

        const idBranchStart = getOrCreateSnappedNode(branchStart);
        const idBranchEnd = getOrCreateSnappedNode(branchEnd);
        const nbStart = network.nodes.get(idBranchStart)!;
        const nbEnd = network.nodes.get(idBranchEnd)!;

        const midCtrl1 = nbStart.position.lerp(nbEnd.position, 0.33).add(new Vector2D(prng.range(-5, 5), prng.range(-5, 5)));
        const midCtrl2 = nbStart.position.lerp(nbEnd.position, 0.66).add(new Vector2D(prng.range(-5, 5), prng.range(-5, 5)));

        const branchCurve = new CubicBezierCurve(nbStart.position, midCtrl1, midCtrl2, nbEnd.position);
        network.createRoad(idBranchStart, idBranchEnd, branchCurve, minorProfile, `R_ORG_SEC_${roadIndex++}`);
      }
    }
  }
}

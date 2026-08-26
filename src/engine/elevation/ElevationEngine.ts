import { ICurve } from '../../core/curves/Curve';
import { RoadNetwork } from '../RoadNetwork';

export interface ElevationProfileConfig {
  camberPercent: number;        // ex: -2.5 (pente en toit pour évacuation d'eau)
  maxSuperelevationPercent: number; // ex: +7.0 (dévers max en virage)
}

export class ElevationEngine {
  public config: ElevationProfileConfig = {
    camberPercent: -2.5,
    maxSuperelevationPercent: 7.0,
  };

  constructor(public network: RoadNetwork) {}

  build(): void {
    // Synchroniser l'altitude des extrémités de routes avec l'altitude des nœuds
    for (const road of this.network.roads.values()) {
      const startNode = this.network.nodes.get(road.startNodeId);
      const endNode = this.network.nodes.get(road.endNodeId);

      const zStart = startNode ? startNode.elevation : 0;
      const zEnd = endNode ? endNode.elevation : 0;

      road.centerline.startElevation = zStart;
      road.centerline.endElevation = zEnd;
    }
  }

  /**
   * Calcule le dévers de sécurité en virage à un point t (en pourcentage, ex: +5%)
   */
  calculateSuperelevation(curve: ICurve, t: number, speedLimitKmH: number = 50): number {
    // Calcul de courbure locale approchée
    const dt = 0.02;
    const tPrev = Math.max(0, t - dt);
    const tNext = Math.min(1, t + dt);

    const dirPrev = curve.getTangent(tPrev);
    const dirNext = curve.getTangent(tNext);

    const dAngle = dirPrev.angleTo(dirNext);
    const ds = curve.getLength() * (tNext - tPrev);

    if (ds < 1e-4) return 0;

    const curvature = Math.abs(dAngle) / ds; // rad / m
    if (curvature < 0.001) return 0; // Ligne droite

    const radius = 1 / curvature; // Rayon de courbure en mètres

    // Formule réglementaire d'équilibre dynamique : q = V² / (127 * R)
    const rawQ = (speedLimitKmH * speedLimitKmH) / (127 * radius);
    const clampedQ = Math.min(this.config.maxSuperelevationPercent, rawQ * 100);

    // Signe du virage (positif si virage à gauche, négatif si virage à droite)
    const sign = dAngle >= 0 ? 1 : -1;
    return sign * clampedQ;
  }

  /**
   * Calcule la variation altimétrique transversale pour un décalage d (offset latéral en mètres)
   */
  getTransverseElevationDelta(
    curve: ICurve,
    t: number,
    lateralOffsetMeters: number,
    speedLimitKmH: number = 50
  ): number {
    const superelevationPct = this.calculateSuperelevation(curve, t, speedLimitKmH);
    const camberPct = this.config.camberPercent;

    // Dévers de virage (linéaire selon le signe de lateralOffset)
    const dzSuper = lateralOffsetMeters * (superelevationPct / 100);

    // Bombement en toit de chaussée (symétrique négatif vers les bas-côtés)
    const dzCamber = Math.abs(lateralOffsetMeters) * (camberPct / 100);

    return dzSuper + dzCamber;
  }
}

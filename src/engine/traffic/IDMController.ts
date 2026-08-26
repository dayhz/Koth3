import { IDMParameters } from './types';

export class IDMController {
  /**
   * Calcule l'accélération longitudinale selon le modèle IDM (Intelligent Driver Model)
   * @param currentSpeed Vitesse actuelle du véhicule (m/s)
   * @param targetSpeed Vitesse désirée v0 (m/s)
   * @param distanceToLeader Distance nette pare-chocs à pare-chocs avec le véhicule leader (m) (Infinity si voie libre)
   * @param deltaVelocity Différence de vitesse (v_current - v_leader) en m/s
   * @param params Paramètres IDM du conducteur
   */
  static calculateAcceleration(
    currentSpeed: number,
    targetSpeed: number,
    distanceToLeader: number,
    deltaVelocity: number,
    params: IDMParameters
  ): number {
    const v = Math.max(0, currentSpeed);
    const v0 = Math.max(0.1, targetSpeed);
    const aMax = params.freeAcceleration;
    const b = params.comfortableDecel;
    const s0 = params.minimumGap;
    const T = params.safeTimeHeadway;
    const delta = params.accelerationExponent;

    // 1. Terme d'accélération en voie libre : a_free = a_max * (1 - (v / v0)^delta)
    const freeTerm = 1 - Math.pow(v / v0, delta);

    // 2. Terme d'interaction avec le leader
    let interactionTerm = 0;
    if (Number.isFinite(distanceToLeader) && distanceToLeader > 0.01) {
      // Distance désirée dynamique s*(v, deltaV)
      const dynamicTerm = (v * deltaVelocity) / (2 * Math.sqrt(aMax * b));
      const sStar = s0 + Math.max(0, v * T + dynamicTerm);

      interactionTerm = Math.pow(sStar / Math.max(0.1, distanceToLeader), 2);
    }

    // 3. Accélération totale IDM
    const accel = aMax * (freeTerm - interactionTerm);

    // Limiter la décélération maximale d'urgence à -8.0 m/s²
    return Math.max(-8.0, Math.min(aMax, accel));
  }
}

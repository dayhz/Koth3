import { Vector2D } from '../../core/math/Vector2D';
import { RoadNetwork } from '../RoadNetwork';
import { LaneConnection } from '../types';
import { ConflictArbitrationResult, PriorityRule } from './types';

export class ConflictResolver {
  /**
   * Détecte si deux trajectoires de carrefour se croisent et détermine qui est prioritaire
   */
  static arbitrate(
    connA: LaneConnection,
    connB: LaneConnection,
    rule: PriorityRule,
    network: RoadNetwork
  ): ConflictArbitrationResult {
    if (connA.id === connB.id || connA.fromLaneId === connB.fromLaneId) {
      return {
        hasConflict: false,
        intersectionId: rule.intersectionId,
        reason: 'Même voie de départ (pas de croisement)',
      };
    }

    // 1. Échantillonner les deux trajectoires pour trouver un point d'intersection
    const ptsA = connA.trajectory.samplePoints(16);
    const ptsB = connB.trajectory.samplePoints(16);
    const conflict = this.findTrajectoryIntersection(ptsA, ptsB);

    if (!conflict) {
      return {
        hasConflict: false,
        intersectionId: rule.intersectionId,
        reason: 'Trajectoires non sécantes (flux compatibles)',
      };
    }

    // Récupérer les routes de départ
    const laneA = network.lanes.get(connA.fromLaneId);
    const laneB = network.lanes.get(connB.fromLaneId);
    const roadIdA = laneA?.parentRoadId;
    const roadIdB = laneB?.parentRoadId;

    // 2. Règle de signalisation (Route prioritaire / STOP / Cédez-le-passage)
    if (roadIdA && roadIdB && roadIdA !== roadIdB) {
      const isAMajor = rule.majorRoadIds.includes(roadIdA);
      const isBMajor = rule.majorRoadIds.includes(roadIdB);
      const isAMinor = rule.minorRoadIds.includes(roadIdA);
      const isBMinor = rule.minorRoadIds.includes(roadIdB);

      if (isAMajor && isBMinor) {
        return {
          hasConflict: true,
          intersectionId: rule.intersectionId,
          priorityLaneConnectionId: connA.id,
          yieldLaneConnectionId: connB.id,
          conflictPoint: conflict.toJSON(),
          reason: `Signalisation : ${rule.regime.toUpperCase()} sur route secondaire`,
        };
      }

      if (isBMajor && isAMinor) {
        return {
          hasConflict: true,
          intersectionId: rule.intersectionId,
          priorityLaneConnectionId: connB.id,
          yieldLaneConnectionId: connA.id,
          conflictPoint: conflict.toJSON(),
          reason: `Signalisation : ${rule.regime.toUpperCase()} sur route secondaire`,
        };
      }
    }

    // 3. Règle du giratoire
    if (rule.regime === 'roundabout') {
      if (connA.movement === 'roundabout_circulate') {
        return {
          hasConflict: true,
          intersectionId: rule.intersectionId,
          priorityLaneConnectionId: connA.id,
          yieldLaneConnectionId: connB.id,
          conflictPoint: conflict.toJSON(),
          reason: "Priorité à l'anneau du giratoire sur les véhicules entrants",
        };
      }
      if (connB.movement === 'roundabout_circulate') {
        return {
          hasConflict: true,
          intersectionId: rule.intersectionId,
          priorityLaneConnectionId: connB.id,
          yieldLaneConnectionId: connA.id,
          conflictPoint: conflict.toJSON(),
          reason: "Priorité à l'anneau du giratoire sur les véhicules entrants",
        };
      }
    }

    // 4. Règle du tourne-à-gauche face à face
    // Si l'un va tout droit et l'autre tourne à gauche
    if (connA.movement === 'straight' && connB.movement === 'turn_left') {
      return {
        hasConflict: true,
        intersectionId: rule.intersectionId,
        priorityLaneConnectionId: connA.id,
        yieldLaneConnectionId: connB.id,
        conflictPoint: conflict.toJSON(),
        reason: 'Règle du tourne-à-gauche : priorité aux véhicules venant en face en ligne droite',
      };
    }

    if (connB.movement === 'straight' && connA.movement === 'turn_left') {
      return {
        hasConflict: true,
        intersectionId: rule.intersectionId,
        priorityLaneConnectionId: connB.id,
        yieldLaneConnectionId: connA.id,
        conflictPoint: conflict.toJSON(),
        reason: 'Règle du tourne-à-gauche : priorité aux véhicules venant en face en ligne droite',
      };
    }

    // 5. Règle de la Priorité à Droite géométrique (par défaut)
    const dirA = connA.trajectory.getTangent(0);
    const dirB = connB.trajectory.getTangent(0);

    // Produit vectoriel 2D pour savoir si B arrive de la droite de A
    const cross = dirA.cross(dirB);

    if (cross > 0.05) {
      // B arrive de la droite de A -> B est prioritaire
      return {
        hasConflict: true,
        intersectionId: rule.intersectionId,
        priorityLaneConnectionId: connB.id,
        yieldLaneConnectionId: connA.id,
        conflictPoint: conflict.toJSON(),
        reason: 'Priorité à droite : le véhicule arrivant par la droite a la priorité',
      };
    } else {
      // A arrive de la droite de B -> A est prioritaire
      return {
        hasConflict: true,
        intersectionId: rule.intersectionId,
        priorityLaneConnectionId: connA.id,
        yieldLaneConnectionId: connB.id,
        conflictPoint: conflict.toJSON(),
        reason: 'Priorité à droite : le véhicule arrivant par la droite a la priorité',
      };
    }
  }

  /**
   * Trouve le point d'intersection géométrique entre deux polylignes
   */
  private static findTrajectoryIntersection(ptsA: Vector2D[], ptsB: Vector2D[]): Vector2D | null {
    for (let i = 0; i < ptsA.length - 1; i++) {
      const a1 = ptsA[i];
      const a2 = ptsA[i + 1];

      for (let j = 0; j < ptsB.length - 1; j++) {
        const b1 = ptsB[j];
        const b2 = ptsB[j + 1];

        const inter = this.segmentIntersection(a1, a2, b1, b2);
        if (inter) return inter;
      }
    }
    return null;
  }

  private static segmentIntersection(
    p1: Vector2D,
    p2: Vector2D,
    p3: Vector2D,
    p4: Vector2D
  ): Vector2D | null {
    const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
    if (Math.abs(d) < 1e-6) return null;

    const u = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
    const v = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;

    if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
      return new Vector2D(p1.x + u * (p2.x - p1.x), p1.y + u * (p2.y - p1.y));
    }

    return null;
  }
}

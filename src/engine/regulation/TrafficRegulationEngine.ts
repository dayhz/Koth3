import { RoadNetwork } from '../RoadNetwork';
import { ConflictResolver } from './ConflictResolver';
import { ConflictArbitrationResult, PriorityRegime, PriorityRule, SpeedZone } from './types';

export class TrafficRegulationEngine {
  public priorityRules: Map<string, PriorityRule> = new Map();
  public speedZones: Map<string, SpeedZone> = new Map();

  constructor(public network: RoadNetwork) {}

  /**
   * Analyse le réseau et attribue automatiquement les régimes de priorité
   */
  build(): void {
    this.priorityRules.clear();

    for (const node of this.network.nodes.values()) {
      if (node.arms.length <= 1) continue;

      if (node.type === 'roundabout') {
        this.setPriorityRule(node.id, 'roundabout', [], node.connectedRoadIds, 'Priorité à l’anneau du rond-point');
        continue;
      }

      // Détecter si une route est hiérarchiquement supérieure (Avenue / Main vs Residential)
      const majorRoads: string[] = [];
      const minorRoads: string[] = [];

      for (const roadId of node.connectedRoadIds) {
        const road = this.network.roads.get(roadId);
        if (!road) continue;

        if (road.profile.roadType === 'avenue' || road.profile.roadType === 'main') {
          majorRoads.push(roadId);
        } else {
          minorRoads.push(roadId);
        }
      }

      if (majorRoads.length > 0 && minorRoads.length > 0) {
        this.setPriorityRule(
          node.id,
          'priority_road',
          majorRoads,
          minorRoads,
          'Axe prioritaire avec perte de priorité pour les voies affluentes'
        );
      } else {
        // Priorité à droite par défaut
        this.setPriorityRule(
          node.id,
          'priority_to_right',
          [],
          [],
          'Régime général de priorité à droite'
        );
      }
    }
  }

  setPriorityRule(
    intersectionId: string,
    regime: PriorityRegime,
    majorRoadIds: string[] = [],
    minorRoadIds: string[] = [],
    description?: string
  ): PriorityRule {
    const desc = description || `Régime ${regime.toUpperCase()}`;
    const rule: PriorityRule = {
      id: `PR_${intersectionId}`,
      intersectionId,
      regime,
      majorRoadIds,
      minorRoadIds,
      description: desc,
    };
    this.priorityRules.set(intersectionId, rule);
    return rule;
  }

  getPriorityRule(intersectionId: string): PriorityRule | undefined {
    return this.priorityRules.get(intersectionId);
  }

  /**
   * Arbitre la priorité entre deux trajectoires de carrefour concurrentes
   */
  arbitrate(connectionAId: string, connectionBId: string): ConflictArbitrationResult {
    const connA = this.network.laneConnections.get(connectionAId);
    const connB = this.network.laneConnections.get(connectionBId);

    if (!connA || !connB) {
      return {
        hasConflict: false,
        intersectionId: 'UNKNOWN',
        reason: 'Une ou plusieurs trajectoires introuvables',
      };
    }

    if (connA.intersectionId !== connB.intersectionId) {
      return {
        hasConflict: false,
        intersectionId: connA.intersectionId,
        reason: 'Trajectoires situées dans deux carrefours différents',
      };
    }

    const rule = this.getPriorityRule(connA.intersectionId) || {
      id: 'DEFAULT',
      intersectionId: connA.intersectionId,
      regime: 'priority_to_right',
      majorRoadIds: [],
      minorRoadIds: [],
      description: 'Priorité à droite',
    };

    return ConflictResolver.arbitrate(connA, connB, rule, this.network);
  }

  /**
   * Retourne la vitesse maximale autorisée pour une route (tenant compte des zones de vitesse)
   */
  getSpeedLimitForRoad(roadId: string): number {
    // 1. Vérifier si la route fait partie d'une SpeedZone explicite
    for (const zone of this.speedZones.values()) {
      if (zone.roadIds.includes(roadId)) {
        return zone.speedLimitKmH;
      }
    }

    // 2. Vitesse par défaut du profil de la route
    const road = this.network.roads.get(roadId);
    if (road) {
      return road.profile.speedLimitKmH;
    }

    return 50; // Vitesse agglomération standard 50 km/h
  }

  addSpeedZone(zone: SpeedZone): void {
    this.speedZones.set(zone.id, zone);
  }
}

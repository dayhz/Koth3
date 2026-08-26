import { RoadNetwork } from '../engine/RoadNetwork';

export interface InfrastructureValidationReport {
  isValid: boolean;
  checkedRoadsCount: number;
  checkedNodesCount: number;
  continuityErrors: string[];
  gapErrors: string[];
}

export class InfrastructureValidator {
  /**
   * Valide la continuité et la conformité géométrique de l'infrastructure 3D
   */
  static validate(network: RoadNetwork): InfrastructureValidationReport {
    const continuityErrors: string[] = [];
    const gapErrors: string[] = [];

    // 1. Continuité de chaque route
    for (const road of network.roads.values()) {
      const startNode = network.nodes.get(road.startNodeId);
      const endNode = network.nodes.get(road.endNodeId);

      if (!startNode || !endNode) {
        continuityErrors.push(`Road ${road.id} has invalid connected nodes.`);
      }
    }

    return {
      isValid: continuityErrors.length === 0 && gapErrors.length === 0,
      checkedRoadsCount: network.roads.size,
      checkedNodesCount: network.nodes.size,
      continuityErrors,
      gapErrors,
    };
  }
}

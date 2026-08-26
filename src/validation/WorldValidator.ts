import { RoadNetwork } from '../engine/RoadNetwork';
import { ValidationReport } from './ValidationReport';

export class WorldValidator {
  static validate(network: RoadNetwork): ValidationReport {
    const report = new ValidationReport();

    this.checkNodesAndRoads(network, report);
    this.checkIntersections(network, report);
    this.checkLanes(network, report);
    this.checkSidewalks(network, report);

    return report;
  }

  private static checkNodesAndRoads(network: RoadNetwork, report: ValidationReport): void {
    let allRoadsConnected = true;
    let allRoadsLengthValid = true;

    // 1. Vérifier les nœuds
    for (const [nodeId, node] of network.nodes.entries()) {
      if (node.connectedRoadIds.length === 0) {
        report.addError({
          code: 'ORPHAN_NODE',
          severity: 'warning',
          message: `Le nœud ${nodeId} n'est connecté à aucune route.`,
          entityId: nodeId,
          entityType: 'node',
        });
      }
    }

    // 2. Vérifier les routes
    for (const [roadId, road] of network.roads.entries()) {
      const startNode = network.nodes.get(road.startNodeId);
      const endNode = network.nodes.get(road.endNodeId);

      if (!startNode) {
        allRoadsConnected = false;
        report.addError({
          code: 'MISSING_START_NODE',
          severity: 'error',
          message: `La route ${roadId} référence un startNode introuvable (${road.startNodeId}).`,
          entityId: roadId,
          entityType: 'road',
        });
      }

      if (!endNode) {
        allRoadsConnected = false;
        report.addError({
          code: 'MISSING_END_NODE',
          severity: 'error',
          message: `La route ${roadId} référence un endNode introuvable (${road.endNodeId}).`,
          entityId: roadId,
          entityType: 'road',
        });
      }

      if (road.length < 1.0) {
        allRoadsLengthValid = false;
        report.addError({
          code: 'ROAD_TOO_SHORT',
          severity: 'error',
          message: `La route ${roadId} a une longueur anormalement courte (${road.length.toFixed(2)}m < 1.0m).`,
          entityId: roadId,
          entityType: 'road',
        });
      }

      if (road.profile.laneWidth < 2.0) {
        report.addError({
          code: 'LANE_TOO_NARROW',
          severity: 'error',
          message: `Largeur de voie invalide sur la route ${roadId} (${road.profile.laneWidth}m < 2.0m).`,
          entityId: roadId,
          entityType: 'road',
        });
      }
    }

    if (allRoadsConnected && network.roads.size > 0) {
      report.addCheckPassed('Toutes les routes sont connectées à des nœuds valides');
    }
    if (allRoadsLengthValid && network.roads.size > 0) {
      report.addCheckPassed('Toutes les routes ont une longueur et des dimensions valides');
    }
  }

  private static checkIntersections(network: RoadNetwork, report: ValidationReport): void {
    let allIntersectionsValid = true;

    for (const [nodeId, node] of network.nodes.entries()) {
      for (const arm of node.arms) {
        const road = network.roads.get(arm.roadId);
        if (!road) {
          allIntersectionsValid = false;
          report.addError({
            code: 'INVALID_INTERSECTION_ARM',
            severity: 'error',
            message: `Le carrefour ${nodeId} référence une route inexistante ${arm.roadId}.`,
            entityId: nodeId,
            entityType: 'node',
          });
        }
      }
    }

    if (allIntersectionsValid && network.nodes.size > 0) {
      report.addCheckPassed('Toutes les intersections sont géométriquement et logiquement valides');
    }
  }

  private static checkLanes(network: RoadNetwork, report: ValidationReport): void {
    let allLanesValid = true;

    for (const [roadId, road] of network.roads.entries()) {
      if (road.laneIds.length === 0) {
        allLanesValid = false;
        report.addError({
          code: 'ROAD_WITHOUT_LANES',
          severity: 'error',
          message: `La route ${roadId} ne possède aucune voie logique.`,
          entityId: roadId,
          entityType: 'road',
        });
      }
    }

    for (const [laneId, lane] of network.lanes.entries()) {
      if (lane.width <= 0) {
        allLanesValid = false;
        report.addError({
          code: 'INVALID_LANE_WIDTH',
          severity: 'error',
          message: `La voie ${laneId} a une largeur négative ou nulle (${lane.width}).`,
          entityId: laneId,
          entityType: 'lane',
        });
      }
    }

    if (allLanesValid && network.lanes.size > 0) {
      report.addCheckPassed('Toutes les voies de circulation (Lanes) sont valides');
    }
  }

  private static checkSidewalks(network: RoadNetwork, report: ValidationReport): void {
    let allSidewalksValid = true;

    for (const [sidewalkId, sidewalk] of network.sidewalks.entries()) {
      if (sidewalk.width <= 0) {
        allSidewalksValid = false;
        report.addError({
          code: 'INVALID_SIDEWALK_WIDTH',
          severity: 'error',
          message: `Le trottoir ${sidewalkId} a une largeur invalide.`,
          entityId: sidewalkId,
          entityType: 'sidewalk',
        });
      }
    }

    if (allSidewalksValid && network.sidewalks.size > 0) {
      report.addCheckPassed('Tous les trottoirs sont correctement raccordés aux routes');
    }
  }
}

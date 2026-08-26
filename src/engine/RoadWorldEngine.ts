import { RoadNetwork } from './RoadNetwork';
import { RoadGeometryBuilder } from './RoadGeometryBuilder';
import { IntersectionBuilder } from './IntersectionBuilder';
import { LaneBuilder } from './LaneBuilder';
import { SidewalkBuilder } from './SidewalkBuilder';
import { MarkingBuilder } from './MarkingBuilder';
import { TrafficRegulationEngine } from './regulation/TrafficRegulationEngine';
import { TrafficLightEngine } from './traffic-lights/TrafficLightEngine';
import { ElevationEngine } from './elevation/ElevationEngine';
import { TrafficSimulation } from './traffic/TrafficSimulation';
import { ExportHub } from './export/ExportHub';
import { TrafficSign } from './signs/TrafficSignTypes';
import { TrafficSignGenerator } from './signs/TrafficSignGenerator';

export class RoadWorldEngine {
  public network: RoadNetwork;
  public elevation: ElevationEngine;
  public regulation: TrafficRegulationEngine;
  public trafficLights: TrafficLightEngine;
  public traffic: TrafficSimulation;
  public signs: Map<string, TrafficSign> = new Map();
  public seed: number;

  constructor(seed: number = 482915) {
    this.seed = seed;
    this.network = new RoadNetwork();
    this.elevation = new ElevationEngine(this.network);
    this.regulation = new TrafficRegulationEngine(this.network);
    this.trafficLights = new TrafficLightEngine(this.network);
    this.traffic = new TrafficSimulation(this.network, this.trafficLights, this.regulation);
  }

  /**
   * Construit l'ensemble des systèmes géométriques, altimétriques, topologiques, réglementaires et lumineux
   */
  build(): void {
    // 0. Synchronisation altimétrique (Profil en long, pentes et dévers)
    this.elevation.build();

    // 1. Géométrie des routes (rubans & polygones d'emprise)
    RoadGeometryBuilder.buildRoadGeometries(this.network);

    // 2. Géométrie des carrefours & giratoires
    IntersectionBuilder.buildIntersections(this.network);

    // 3. Voies logiques et navigation carrefours
    LaneBuilder.buildLanes(this.network);

    // 4. Trottoirs et bordures
    SidewalkBuilder.buildSidewalks(this.network);

    // 5. Marquages au sol
    MarkingBuilder.buildMarkings(this.network);

    // 6. Moteur de réglementation & attribution des priorités
    this.regulation.build();

    // 7. Feux tricolores dynamiques
    this.trafficLights.build();

    // 8. Génération des panneaux de signalisation routière 3D
    this.signs = TrafficSignGenerator.generate(this.network, this.regulation);

    // 9. Réinitialiser la simulation de trafic
    this.traffic.clear();
  }

  update(deltaSeconds: number): void {
    this.trafficLights.update(deltaSeconds);
    this.traffic.update(deltaSeconds);
  }

  getStats() {
    return {
      nodesCount: this.network.nodes.size,
      roadsCount: this.network.roads.size,
      lanesCount: this.network.lanes.size,
      connectionsCount: this.network.laneConnections.size,
      sidewalksCount: this.network.sidewalks.size,
      markingsCount: this.network.markings.size,
      crosswalksCount: this.network.crosswalks.size,
      stopLinesCount: this.network.stopLines.size,
      arrowsCount: this.network.directionalArrows.size,
      rulesCount: this.regulation.priorityRules.size,
      trafficLightsCount: this.trafficLights.poles.size,
      vehiclesCount: this.traffic.vehicles.size,
    };
  }

  // --- Exportateurs V0.9 ---
  exportOpenDrive(): string {
    return ExportHub.exportToOpenDrive(this);
  }

  exportSumo(): string {
    return ExportHub.exportToSumo(this);
  }

  exportGeoJson(): string {
    return ExportHub.exportToGeoJson(this);
  }

  exportObj() {
    return ExportHub.exportToObj(this);
  }
}


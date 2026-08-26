import { RoadNetwork } from './RoadNetwork';
import { RoadGeometryBuilder } from './RoadGeometryBuilder';
import { IntersectionBuilder } from './IntersectionBuilder';
import { LaneBuilder } from './LaneBuilder';
import { SidewalkBuilder } from './SidewalkBuilder';
import { MarkingBuilder } from './MarkingBuilder';

export class RoadWorldEngine {
  public network: RoadNetwork;
  public seed: number;

  constructor(seed: number = 482915) {
    this.seed = seed;
    this.network = new RoadNetwork();
  }

  /**
   * Construit l'ensemble des systèmes géométriques et topologiques du réseau routier
   */
  build(): void {
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
    };
  }
}

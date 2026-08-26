import { CurveOffset } from '../core/curves/CurveOffset';
import { RoadNetwork } from './RoadNetwork';
import { RoadMarking } from './RoadMarking';

export class MarkingBuilder {
  static buildMarkings(network: RoadNetwork): void {
    network.markings.clear();
    let markingCounter = 1;

    for (const road of network.roads.values()) {
      road.markingIds = [];
      const laneCount = road.profile.laneCount;
      const laneWidth = road.profile.laneWidth;

      // 1. Ligne centrale
      if (laneCount >= 2) {
        const id = `M_${markingCounter++}`;
        const marking = new RoadMarking(
          id,
          'center_dashed',
          road.centerline.clone(),
          0.15,
          road.id,
          undefined,
          [3.0, 3.0] // 3m trait, 3m espace
        );
        network.markings.set(id, marking);
        road.markingIds.push(id);
      }

      // 2. Lignes de séparation supplémentaires pour 4 voies
      if (laneCount === 4) {
        // Ligne entre voie -2 et voie -1 (offset +1.0 * laneWidth)
        const idLeft = `M_${markingCounter++}`;
        const leftCurve = CurveOffset.offsetCurve(road.centerline, laneWidth);
        const markLeft = new RoadMarking(idLeft, 'lane_dashed', leftCurve, 0.12, road.id, undefined, [2.0, 4.0]);
        network.markings.set(idLeft, markLeft);
        road.markingIds.push(idLeft);

        // Ligne entre voie 1 et voie 2 (offset -1.0 * laneWidth)
        const idRight = `M_${markingCounter++}`;
        const rightCurve = CurveOffset.offsetCurve(road.centerline, -laneWidth);
        const markRight = new RoadMarking(idRight, 'lane_dashed', rightCurve, 0.12, road.id, undefined, [2.0, 4.0]);
        network.markings.set(idRight, markRight);
        road.markingIds.push(idRight);
      }
    }
  }
}

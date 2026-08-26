import * as THREE from 'three';
import { RoadSegment } from '../engine/RoadSegment';
import { SegmentSliceData } from './types';

export class RoadSegmenter {
  /**
   * Découpe une route en sous-segments géométriques de longueur cible L_target
   * @param road La route logique à découper
   * @param targetSegmentLength Longueur cible de chaque segment en mètres (défaut: 25m)
   */
  static segmentRoad(road: RoadSegment, targetSegmentLength: number = 25.0): SegmentSliceData[] {
    const totalLength = road.length;
    const numSegments = Math.max(1, Math.ceil(totalLength / targetSegmentLength));
    const dt = (road.tEnd - road.tStart) / numSegments;
    const ds = totalLength / numSegments;

    const slices: SegmentSliceData[] = [];

    for (let i = 0; i < numSegments; i++) {
      const tStart = road.tStart + i * dt;
      const tEnd = road.tStart + (i + 1) * dt;
      const sStart = i * ds;
      const sEnd = (i + 1) * ds;

      // Calcul de la boîte englobante 3D (AABB) pour ce sous-segment
      const bounds = new THREE.Box3();
      const samples = 8;
      const halfW = road.totalWidth / 2;

      for (let j = 0; j <= samples; j++) {
        const t = tStart + (j / samples) * (tEnd - tStart);
        const pt = road.centerline.getPoint(t);
        const tg = road.centerline.getTangent(t);
        const elev = road.centerline.getElevation(t);
        const nx = -tg.y * halfW;
        const ny = tg.x * halfW;

        bounds.expandByPoint(new THREE.Vector3(pt.x + nx, elev - 0.2, pt.y + ny));
        bounds.expandByPoint(new THREE.Vector3(pt.x - nx, elev + 0.5, pt.y - ny));
      }

      slices.push({
        index: i,
        roadId: road.id,
        tStart,
        tEnd,
        sStart,
        sEnd,
        length: ds,
        bounds,
      });
    }

    return slices;
  }
}

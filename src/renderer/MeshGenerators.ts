import * as THREE from 'three';
import earcut from 'earcut';
import { CurveOffset } from '../core/curves/CurveOffset';
import { RoadSegment } from '../engine/RoadSegment';
import { IntersectionNode } from '../engine/IntersectionNode';
import { Sidewalk } from '../engine/Sidewalk';
import { RoadMarking } from '../engine/RoadMarking';
import { SplitterIsland } from '../engine/types';

export class MeshGenerators {
  /**
   * Crée la géométrie 3D d'un ruban de route d'asphalte
   */
  static createRoadMesh(road: RoadSegment, samples: number = 32): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const halfWidth = road.halfWidth;

    const leftPts = CurveOffset.sampleOffsetPoints(road.centerline, halfWidth, samples);
    const rightPts = CurveOffset.sampleOffsetPoints(road.centerline, -halfWidth, samples);

    const positions: number[] = [];
    const uvs: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    let totalDist = 0;
    let prevLeft = leftPts[0];

    for (let i = 0; i < samples; i++) {
      const l = leftPts[i];
      const r = rightPts[i];

      if (i > 0) {
        totalDist += prevLeft.distanceTo(l);
      }
      prevLeft = l;

      positions.push(l.x, 0.0, l.y);
      normals.push(0, 1, 0);
      uvs.push(0, totalDist * 0.2);

      positions.push(r.x, 0.0, r.y);
      normals.push(0, 1, 0);
      uvs.push(1, totalDist * 0.2);

      if (i < samples - 1) {
        const i0 = 2 * i;
        const i1 = 2 * i + 1;
        const i2 = 2 * (i + 1);
        const i3 = 2 * (i + 1) + 1;

        indices.push(i0, i2, i1);
        indices.push(i1, i2, i3);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    return geometry;
  }

  /**
   * Crée la surface 3D d'une intersection
   */
  static createIntersectionMesh(node: IntersectionNode): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const poly = node.surfacePolygon;

    if (poly.length < 3) {
      return geometry;
    }

    const flatCoords: number[] = [];
    for (const v of poly.vertices) {
      flatCoords.push(v.x, v.y);
    }

    const indices = earcut(flatCoords, undefined, 2);
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    for (const v of poly.vertices) {
      positions.push(v.x, 0.0, v.y);
      normals.push(0, 1, 0);
      uvs.push(v.x * 0.1, v.y * 0.1);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    return geometry;
  }

  /**
   * Crée un trottoir 3D surélevé avec surface supérieure et bordure verticale (curb)
   */
  static createSidewalkMesh(sidewalk: Sidewalk): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const height = sidewalk.height;

    const inner = sidewalk.innerBoundary;
    const outer = sidewalk.outerBoundary;
    if (inner.length < 2 || outer.length < 2) return geometry;

    const count = Math.min(inner.length, outer.length);
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // 1. Surface supérieure du trottoir (y = height)
    let totalDist = 0;
    for (let i = 0; i < count; i++) {
      const inPt = inner[i];
      const outPt = outer[i];
      if (i > 0) totalDist += inner[i - 1].distanceTo(inPt);

      positions.push(inPt.x, height, inPt.y);
      normals.push(0, 1, 0);
      uvs.push(0, totalDist * 0.5);

      positions.push(outPt.x, height, outPt.y);
      normals.push(0, 1, 0);
      uvs.push(1, totalDist * 0.5);

      if (i < count - 1) {
        const i0 = 2 * i;
        const i1 = 2 * i + 1;
        const i2 = 2 * (i + 1);
        const i3 = 2 * (i + 1) + 1;
        indices.push(i0, i2, i1);
        indices.push(i1, i2, i3);
      }
    }

    // 2. Bordure verticale côté route (curb face : y=0 to y=height)
    const curbOffset = positions.length / 3;
    for (let i = 0; i < count; i++) {
      const inPt = inner[i];
      positions.push(inPt.x, 0.0, inPt.y);
      normals.push(0, 0, 1);
      uvs.push(0, i);

      positions.push(inPt.x, height, inPt.y);
      normals.push(0, 0, 1);
      uvs.push(1, i);

      if (i < count - 1) {
        const i0 = curbOffset + 2 * i;
        const i1 = curbOffset + 2 * i + 1;
        const i2 = curbOffset + 2 * (i + 1);
        const i3 = curbOffset + 2 * (i + 1) + 1;
        indices.push(i0, i1, i2);
        indices.push(i2, i1, i3);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    return geometry;
  }

  /**
   * Crée la géométrie 3D d'un îlot séparateur triangulaire (Splitter Island)
   */
  static createSplitterIslandMesh(island: SplitterIsland): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const pts = island.polygon;
    const height = island.height || 0.15;
    if (pts.length < 3) return geometry;

    const flatCoords: number[] = [];
    for (const p of pts) {
      flatCoords.push(p.x, p.y);
    }
    const topIndices = earcut(flatCoords, undefined, 2);

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // 1. Surface supérieure
    for (const p of pts) {
      positions.push(p.x, height, p.y);
      normals.push(0, 1, 0);
      uvs.push(p.x * 0.2, p.y * 0.2);
    }
    indices.push(...topIndices);

    // 2. Bordures latérales verticales
    const sideOffset = positions.length / 3;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      // Bas
      positions.push(p.x, 0.0, p.y);
      normals.push(0, 0, 1);
      uvs.push(0, i);
      // Haut
      positions.push(p.x, height, p.y);
      normals.push(0, 0, 1);
      uvs.push(1, i);

      const i0 = sideOffset + 2 * i;
      const i1 = sideOffset + 2 * i + 1;
      const i2 = sideOffset + 2 * ((i + 1) % n);
      const i3 = sideOffset + 2 * ((i + 1) % n) + 1;

      indices.push(i0, i1, i2);
      indices.push(i2, i1, i3);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    return geometry;
  }

  /**
   * Crée la bande de marquage au sol
   */
  static createMarkingMesh(marking: RoadMarking, samples: number = 32): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const halfWidth = marking.width / 2;
    const yElevation = 0.004;

    const tStart = marking.tStart ?? 0;
    const tEnd = marking.tEnd ?? 1;

    const leftPts = CurveOffset.sampleOffsetPoints(marking.centerline, halfWidth, samples, tStart, tEnd);
    const rightPts = CurveOffset.sampleOffsetPoints(marking.centerline, -halfWidth, samples, tStart, tEnd);

    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    const isDashed = marking.type.includes('dashed') && marking.dashPattern;
    const dashLen = marking.dashPattern ? marking.dashPattern[0] : 3.0;
    const gapLen = marking.dashPattern ? marking.dashPattern[1] : 3.0;
    const period = dashLen + gapLen;

    let dist = 0;
    for (let i = 0; i < samples; i++) {
      const l = leftPts[i];
      const r = rightPts[i];
      if (i > 0) dist += leftPts[i - 1].distanceTo(l);

      positions.push(l.x, yElevation, l.y);
      normals.push(0, 1, 0);

      positions.push(r.x, yElevation, r.y);
      normals.push(0, 1, 0);

      if (i < samples - 1) {
        if (!isDashed || (dist % period) < dashLen) {
          const i0 = 2 * i;
          const i1 = 2 * i + 1;
          const i2 = 2 * (i + 1);
          const i3 = 2 * (i + 1) + 1;
          indices.push(i0, i2, i1);
          indices.push(i1, i2, i3);
        }
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);

    return geometry;
  }
}

import * as THREE from 'three';
import earcut from 'earcut';
import { Vector2D } from '../core/math/Vector2D';
import { CurveOffset } from '../core/curves/CurveOffset';
import { RoadSegment } from '../engine/RoadSegment';
import { IntersectionNode } from '../engine/IntersectionNode';
import { Sidewalk } from '../engine/Sidewalk';
import { RoadMarking } from '../engine/RoadMarking';
import { CrosswalkData, DirectionalArrowData, SplitterIsland, StopLineData } from '../engine/types';

export class MeshGenerators {
  /**
   * Crée la géométrie 3D d'un ruban de route d'asphalte avec élévation 3D continue et profil en long
   */
  static createRoadMesh(road: RoadSegment, samples: number = 32): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const halfWidth = road.halfWidth;
    const tStart = road.tStart;
    const tEnd = road.tEnd;

    const leftPts = CurveOffset.sampleOffsetPoints(road.centerline, halfWidth, samples, tStart, tEnd);
    const rightPts = CurveOffset.sampleOffsetPoints(road.centerline, -halfWidth, samples, tStart, tEnd);

    const positions: number[] = [];
    const uvs: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    let totalDist = 0;
    let prevLeft = leftPts[0];

    for (let i = 0; i < samples; i++) {
      const alpha = i / (samples - 1);
      const t = tStart + alpha * (tEnd - tStart);
      const l = leftPts[i];
      const r = rightPts[i];

      if (i > 0) {
        totalDist += prevLeft.distanceTo(l);
      }
      prevLeft = l;

      // Altitude du profil en long à t
      const baseElev = road.centerline.getElevation(t);

      // Dévers transversal (bombement -2.5% sur les bords)
      const camberOffset = -halfWidth * 0.025;
      const zLeft = baseElev + camberOffset;
      const zRight = baseElev + camberOffset;

      positions.push(l.x, zLeft, l.y);
      normals.push(0, 1, 0);
      uvs.push(0, totalDist * 0.2);

      positions.push(r.x, zRight, r.y);
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
   * Crée la surface 3D d'une intersection ou d'un anneau de giratoire avec altitude Z
   */
  static createIntersectionMesh(node: IntersectionNode): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const nodeZ = node.elevation;

    if (node.type === 'roundabout' && node.roundaboutConfig) {
      const config = node.roundaboutConfig;
      const center = Vector2D.from(config.center);
      const outerR = config.radius;
      const innerR = config.innerRadius;
      const segments = 48;

      const flatCoords: number[] = [];

      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        flatCoords.push(center.x + outerR * Math.cos(angle), center.y + outerR * Math.sin(angle));
      }

      const holeIndex = flatCoords.length / 2;
      for (let i = 0; i < segments; i++) {
        const angle = -(i / segments) * 2 * Math.PI;
        flatCoords.push(center.x + innerR * Math.cos(angle), center.y + innerR * Math.sin(angle));
      }

      const indices = earcut(flatCoords, [holeIndex], 2);
      const positions: number[] = [];
      const normals: number[] = [];
      const uvs: number[] = [];

      for (let i = 0; i < flatCoords.length; i += 2) {
        const x = flatCoords[i];
        const y = flatCoords[i + 1];
        positions.push(x, nodeZ, y);
        normals.push(0, 1, 0);
        uvs.push(x * 0.1, y * 0.1);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);

      return geometry;
    }

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
      positions.push(v.x, nodeZ, v.y);
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
   * Crée l'îlot central surélevé d'un giratoire à l'altitude Z
   */
  static createRoundaboutCentralIslandMesh(node: IntersectionNode): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    if (node.type !== 'roundabout' || !node.roundaboutConfig) return geometry;

    const config = node.roundaboutConfig;
    const center = Vector2D.from(config.center);
    const radius = config.innerRadius;
    const baseZ = node.elevation;
    const height = 0.20;
    const topZ = baseZ + height;
    const segments = 48;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Disque supérieur
    positions.push(center.x, topZ, center.y);
    normals.push(0, 1, 0);
    uvs.push(0.5, 0.5);

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      positions.push(x, topZ, y);
      normals.push(0, 1, 0);
      uvs.push(0.5 + 0.5 * Math.cos(angle), 0.5 + 0.5 * Math.sin(angle));

      if (i < segments) {
        indices.push(0, i + 1, i + 2);
      }
    }

    // Bordure latérale
    const sideOffset = positions.length / 3;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);

      positions.push(x, baseZ, y);
      normals.push(Math.cos(angle), 0, Math.sin(angle));
      uvs.push(i / segments, 0);

      positions.push(x, topZ, y);
      normals.push(Math.cos(angle), 0, Math.sin(angle));
      uvs.push(i / segments, 1);

      if (i < segments) {
        const i0 = sideOffset + 2 * i;
        const i1 = sideOffset + 2 * i + 1;
        const i2 = sideOffset + 2 * (i + 1);
        const i3 = sideOffset + 2 * (i + 1) + 1;
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
   * Crée un trottoir 3D surélevé avec surface supérieure et bordure verticale
   */
  static createSidewalkMesh(sidewalk: Sidewalk, parentRoad?: RoadSegment): THREE.BufferGeometry {
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

    let totalDist = 0;
    for (let i = 0; i < count; i++) {
      const alpha = i / (count - 1);
      const t = parentRoad ? parentRoad.tStart + alpha * (parentRoad.tEnd - parentRoad.tStart) : alpha;
      const roadZ = parentRoad ? parentRoad.centerline.getElevation(t) : 0;
      const topZ = roadZ + height;

      const inPt = inner[i];
      const outPt = outer[i];
      if (i > 0) totalDist += inner[i - 1].distanceTo(inPt);

      // Surface supérieure (topZ)
      positions.push(inPt.x, topZ, inPt.y);
      normals.push(0, 1, 0);
      uvs.push(0, totalDist * 0.5);

      positions.push(outPt.x, topZ, outPt.y);
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

    // Bordure verticale
    const curbOffset = positions.length / 3;
    for (let i = 0; i < count; i++) {
      const alpha = i / (count - 1);
      const t = parentRoad ? parentRoad.tStart + alpha * (parentRoad.tEnd - parentRoad.tStart) : alpha;
      const roadZ = parentRoad ? parentRoad.centerline.getElevation(t) : 0;
      const topZ = roadZ + height;
      const inPt = inner[i];

      positions.push(inPt.x, roadZ, inPt.y);
      normals.push(0, 0, 1);
      uvs.push(0, i);

      positions.push(inPt.x, topZ, inPt.y);
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
  static createSplitterIslandMesh(island: SplitterIsland, baseElevation: number = 0): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const pts = island.polygon;
    const height = island.height || 0.15;
    const topZ = baseElevation + height;
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

    // Surface supérieure
    for (const p of pts) {
      positions.push(p.x, topZ, p.y);
      normals.push(0, 1, 0);
      uvs.push(p.x * 0.2, p.y * 0.2);
    }
    indices.push(...topIndices);

    // Bordures latérales
    const sideOffset = positions.length / 3;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      positions.push(p.x, baseElevation, p.y);
      normals.push(0, 0, 1);
      uvs.push(0, i);

      positions.push(p.x, topZ, p.y);
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
   * Crée la bande de marquage longitudinal au sol avec altitude 3D
   */
  static createMarkingMesh(marking: RoadMarking, samples: number = 32): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const halfWidth = marking.width / 2;
    const yDelta = 0.005;
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
      const alpha = i / (samples - 1);
      const t = tStart + alpha * (tEnd - tStart);
      const z = marking.centerline.getElevation(t) + yDelta;

      const l = leftPts[i];
      const r = rightPts[i];
      if (i > 0) dist += leftPts[i - 1].distanceTo(l);

      positions.push(l.x, z, l.y);
      normals.push(0, 1, 0);

      positions.push(r.x, z, r.y);
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

  /**
   * Crée un passage piéton 3D (Zèbres) avec altitude exacte
   */
  static createCrosswalkMesh(crosswalk: CrosswalkData): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const stripeHalfWidth = 0.25;
    const baseZ = (crosswalk.elevation ?? 0) + 0.005;

    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    for (let sIdx = 0; sIdx < crosswalk.stripes.length; sIdx++) {
      const stripe = crosswalk.stripes[sIdx];
      const p1 = Vector2D.from(stripe.p1);
      const p2 = Vector2D.from(stripe.p2);
      const dir = p2.sub(p1).normalize();
      const normal = dir.normalLeft();

      const v1 = p1.addScaled(normal, stripeHalfWidth);
      const v2 = p1.addScaled(normal, -stripeHalfWidth);
      const v3 = p2.addScaled(normal, stripeHalfWidth);
      const v4 = p2.addScaled(normal, -stripeHalfWidth);

      const baseIdx = positions.length / 3;

      positions.push(v1.x, baseZ, v1.y);
      positions.push(v2.x, baseZ, v2.y);
      positions.push(v3.x, baseZ, v3.y);
      positions.push(v4.x, baseZ, v4.y);

      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);

      indices.push(baseIdx, baseIdx + 2, baseIdx + 1);
      indices.push(baseIdx + 1, baseIdx + 2, baseIdx + 3);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);

    return geometry;
  }

  /**
   * Crée une ligne d'arrêt transversale avec altitude exacte
   */
  static createStopLineMesh(stopLine: StopLineData): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const yZ = (stopLine.elevation ?? 0) + 0.005;
    const p1 = Vector2D.from(stopLine.p1);
    const p2 = Vector2D.from(stopLine.p2);
    const dir = p2.sub(p1).normalize();
    const normal = dir.normalLeft();
    const halfThick = stopLine.width / 2;

    const v1 = p1.addScaled(normal, halfThick);
    const v2 = p1.addScaled(normal, -halfThick);
    const v3 = p2.addScaled(normal, halfThick);
    const v4 = p2.addScaled(normal, -halfThick);

    const positions = [
      v1.x, yZ, v1.y,
      v2.x, yZ, v2.y,
      v3.x, yZ, v3.y,
      v4.x, yZ, v4.y,
    ];

    const normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
    const indices = [0, 2, 1, 1, 2, 3];

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);

    return geometry;
  }

  /**
   * Crée une flèche directionnelle au sol avec altitude exacte
   */
  static createDirectionalArrowMesh(arrow: DirectionalArrowData): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const yZ = (arrow.elevation ?? 0) + 0.005;
    const pos = Vector2D.from(arrow.position);
    const dir = Vector2D.from(arrow.direction).normalize();
    const norm = dir.normalLeft();

    const stemLength = 2.5;
    const stemWidth = 0.3;
    const headLength = 1.5;
    const headWidth = 1.2;

    const basePt = pos.addScaled(dir, -stemLength / 2);
    const neckPt = basePt.addScaled(dir, stemLength);
    const tipPt = neckPt.addScaled(dir, headLength);

    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    // Corps de la flèche (Tige)
    const s1 = basePt.addScaled(norm, stemWidth / 2);
    const s2 = basePt.addScaled(norm, -stemWidth / 2);
    const s3 = neckPt.addScaled(norm, stemWidth / 2);
    const s4 = neckPt.addScaled(norm, -stemWidth / 2);

    positions.push(
      s1.x, yZ, s1.y,
      s2.x, yZ, s2.y,
      s3.x, yZ, s3.y,
      s4.x, yZ, s4.y
    );
    normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
    indices.push(0, 2, 1, 1, 2, 3);

    // Pointe de la flèche (Triangle)
    const h1 = neckPt.addScaled(norm, headWidth / 2);
    const h2 = neckPt.addScaled(norm, -headWidth / 2);
    const h3 = tipPt;

    const baseHeadIdx = positions.length / 3;
    positions.push(
      h1.x, yZ, h1.y,
      h2.x, yZ, h2.y,
      h3.x, yZ, h3.y
    );
    normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
    indices.push(baseHeadIdx, baseHeadIdx + 2, baseHeadIdx + 1);

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);

    return geometry;
  }
}

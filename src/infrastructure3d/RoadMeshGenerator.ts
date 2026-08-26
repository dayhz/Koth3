import * as THREE from 'three';
import { RoadSegment } from '../engine/RoadSegment';
import { UVManager } from './UVManager';
import { LODLevel, MeshMetadata } from './types';

export interface RoadMeshOptions {
  lod?: LODLevel;
  segmentLengthMeters?: number;
}

export class RoadMeshGenerator {
  /**
   * Transforme une route logique en maillage 3D de chaussée continue et segmentée
   */
  static generate(road: RoadSegment, options: RoadMeshOptions = {}): THREE.Mesh[] {
    const lod = options.lod || 'LOD0';
    const segmentLength = options.segmentLengthMeters || 20.0; // Découpage tous les 20m

    const roadLength = road.length;
    const numSegments = Math.max(1, Math.ceil(roadLength / segmentLength));
    const dt = (road.tEnd - road.tStart) / numSegments;

    const samplesPerSegment = lod === 'LOD0' ? 16 : lod === 'LOD1' ? 8 : 4;
    const halfWidth = road.totalWidth / 2;

    const meshes: THREE.Mesh[] = [];

    for (let seg = 0; seg < numSegments; seg++) {
      const tStart = road.tStart + seg * dt;
      const tEnd = road.tStart + (seg + 1) * dt;

      const positions: number[] = [];
      const arcLengths: number[] = [];
      const indices: number[] = [];

      let currentArc = seg * segmentLength;

      for (let i = 0; i <= samplesPerSegment; i++) {
        const localT = i / samplesPerSegment;
        const globalT = tStart + localT * (tEnd - tStart);

        const point = road.centerline.getPoint(globalT);
        const tangent = road.centerline.getTangent(globalT);
        const normal2D = new THREE.Vector2(-tangent.y, tangent.x).normalize();
        const elevation = road.centerline.getElevation(globalT);

        // Profil en travers (Dévers de -2.5% ou banking en virage)
        const leftPoint = new THREE.Vector3(
          point.x + normal2D.x * halfWidth,
          elevation - halfWidth * 0.025,
          point.y + normal2D.y * halfWidth
        );
        const centerPoint = new THREE.Vector3(point.x, elevation, point.y);
        const rightPoint = new THREE.Vector3(
          point.x - normal2D.x * halfWidth,
          elevation - halfWidth * 0.025,
          point.y - normal2D.y * halfWidth
        );

        positions.push(leftPoint.x, leftPoint.y, leftPoint.z);
        positions.push(centerPoint.x, centerPoint.y, centerPoint.z);
        positions.push(rightPoint.x, rightPoint.y, rightPoint.z);

        const stepDist = (roadLength / numSegments) / samplesPerSegment;
        arcLengths.push(currentArc + i * stepDist);

        if (i > 0) {
          const row0 = (i - 1) * 3;
          const row1 = i * 3;

          // Quad gauche
          indices.push(row0, row1, row0 + 1);
          indices.push(row0 + 1, row1, row1 + 1);

          // Quad droit
          indices.push(row0 + 1, row1 + 1, row0 + 2);
          indices.push(row0 + 2, row1 + 1, row1 + 2);
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);

      // Génération des UVs réguliers
      const uvs = UVManager.generateRibbonUVs(arcLengths, [0, 0.5, 1.0], 4.0);
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

      geometry.computeVertexNormals();

      const mesh = new THREE.Mesh(geometry);
      mesh.name = `RoadMesh_${road.id}_seg_${seg}`;
      mesh.receiveShadow = true;

      const metadata: MeshMetadata = {
        id: mesh.name,
        type: 'road',
        sourceId: road.id,
        lod,
        chunk: { cx: Math.floor(positions[0] / 100), cz: Math.floor(positions[2] / 100) },
      };
      mesh.userData = metadata;

      meshes.push(mesh);
    }

    return meshes;
  }
}

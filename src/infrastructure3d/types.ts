import * as THREE from 'three';
import { IVector2D } from '../core/math/Vector2D';

export type LODLevel = 'LOD0' | 'LOD1' | 'LOD2';

export interface ChunkCoord {
  cx: number;
  cz: number;
}

export interface MeshMetadata {
  id: string;
  type: 'road' | 'intersection' | 'roundabout' | 'sidewalk' | 'curb' | 'median' | 'marking' | 'central_island' | 'lane_connection';
  sourceId: string; // ID logique (roadId, nodeId, etc.)
  lod: LODLevel;
  chunk: ChunkCoord;
}

export interface SegmentSliceData {
  index: number;
  roadId: string;
  tStart: number;
  tEnd: number;
  sStart: number;
  sEnd: number;
  length: number;
  bounds: THREE.Box3;
}

export interface ConnectionInterfaceData {
  roadId: string;
  nodeId: string;
  isStartOfRoad: boolean;
  setbackPoint: IVector2D;
  leftBoundaryPoint: IVector2D;
  rightBoundaryPoint: IVector2D;
  elevation: number;
  laneCount: number;
}

export interface InfrastructureAttachmentPoint {
  id: string;
  type: 'sign' | 'traffic_light' | 'street_lamp' | 'tree' | 'building_access';
  position: THREE.Vector3;
  direction: THREE.Vector3;
  parentRoadId?: string;
  parentIntersectionId?: string;
}

export interface CollisionHull {
  id: string;
  type: 'drivable_surface' | 'curb_barrier' | 'sidewalk_surface';
  geometry: THREE.BufferGeometry;
  boundingSphere: THREE.Sphere;
}

export interface InfrastructureMetrics {
  totalMeshes: number;
  totalTriangles: number;
  totalVertices: number;
  drawCalls: number;
  generationTimeMs: number;
}

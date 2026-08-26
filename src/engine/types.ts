import { IVector2D } from '../core/math/Vector2D';
import { ICurve } from '../core/curves/Curve';

export type RoadType = 'residential' | 'secondary' | 'main' | 'avenue' | 'narrow';

export interface RoadProfile {
  roadType: RoadType;
  laneCount: number; // 1, 2, 4
  laneWidth: number; // en mètres (ex: 3.25m)
  sidewalkWidthLeft: number; // en mètres (ex: 2.0m, 0 si pas de trottoir)
  sidewalkWidthRight: number; // en mètres
  curbHeight: number; // hauteur bordure (ex: 0.15m)
  speedLimitKmH: number; // ex: 30, 50, 70
}

export type IntersectionType = 'dead_end' | 't_junction' | 'four_way' | 'multi_branch' | 'roundabout';

export interface IntersectionArm {
  roadId: string;
  isStartOfRoad: boolean;
  angleRadians: number;
  roadWidth: number;
}

export interface RoundaboutConfig {
  center: IVector2D;
  radius: number; // Rayon extérieur de l'anneau (ex: 18m)
  innerRadius: number; // Rayon de l'îlot central (ex: 10m)
  laneCount: number; // ex: 1 ou 2
}

export type LaneDirection = 'forward' | 'backward';
export type LaneAllowedMovement = 'straight' | 'turn_left' | 'turn_right' | 'u_turn';

export interface LaneConnection {
  id: string;
  intersectionId: string;
  fromLaneId: string;
  toLaneId: string;
  movement: LaneAllowedMovement;
  trajectory: ICurve;
}

export type MarkingType = 'center_dashed' | 'center_solid' | 'lane_dashed' | 'edge_solid' | 'stop_line';

export interface MeshBufferData {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

export interface WorldDataV01 {
  version: '0.1.0';
  seed: number;
  dimensions: { width: number; height: number };
  nodes: Record<string, any>;
  roads: Record<string, any>;
  lanes: Record<string, any>;
  laneConnections: Record<string, any>;
  sidewalks: Record<string, any>;
  markings: Record<string, any>;
}

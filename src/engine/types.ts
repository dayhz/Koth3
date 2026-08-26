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

export interface SplitterIsland {
  id: string;
  intersectionId: string;
  armRoadId: string;
  polygon: IVector2D[];
  height: number;
}

export interface CurbReturnData {
  id: string;
  fromRoadId: string;
  toRoadId: string;
  radius: number;
  arcPoints: IVector2D[];
}

export interface RoundaboutConfig {
  center: IVector2D;
  radius: number; // Rayon extérieur de l'anneau (ex: 18m)
  innerRadius: number; // Rayon de l'îlot central (ex: 10m)
  laneCount: number; // 1 ou 2 voies annulaires
  hasSplitterIslands?: boolean; // Îlots triangulaires d'entrée
}

export type LaneDirection = 'forward' | 'backward';
export type LaneAllowedMovement = 'straight' | 'turn_left' | 'turn_right' | 'u_turn' | 'roundabout_circulate';

export interface LaneConnection {
  id: string;
  intersectionId: string;
  fromLaneId: string;
  toLaneId: string;
  movement: LaneAllowedMovement;
  trajectory: ICurve;
}

export type MarkingType = 'center_dashed' | 'center_solid' | 'lane_dashed' | 'edge_solid' | 'stop_line' | 'roundabout_yield';

export interface MeshBufferData {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

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
  hasEdgeLines?: boolean;
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
  radius: number;
  innerRadius: number;
  laneCount: number;
  hasSplitterIslands?: boolean;
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

export type MarkingType =
  | 'center_dashed'
  | 'center_solid'
  | 'lane_dashed'
  | 'edge_solid'
  | 'stop_line'
  | 'yield_line'
  | 'crosswalk'
  | 'arrow_straight'
  | 'arrow_left'
  | 'arrow_right'
  | 'arrow_straight_left'
  | 'arrow_straight_right';

export interface CrosswalkData {
  id: string;
  parentRoadId: string;
  center: IVector2D;
  elevation: number;    // Altitude Z au sol du passage piéton
  direction: IVector2D; // Tangente de la route
  width: number;        // Largeur de la route (couverte par le passage)
  length: number;       // Largeur de traversée (ex: 3.0m)
  stripes: { p1: IVector2D; p2: IVector2D }[];
}

export interface DirectionalArrowData {
  id: string;
  laneId: string;
  position: IVector2D;
  elevation: number;    // Altitude Z au sol de la flèche
  direction: IVector2D;
  movement: LaneAllowedMovement;
}

export interface StopLineData {
  id: string;
  laneId: string;
  intersectionId: string;
  p1: IVector2D;
  p2: IVector2D;
  elevation: number;    // Altitude Z au sol de la ligne d'arrêt
  width: number; // 0.50m pour STOP, 0.20m pour Cédez-le-passage
  isDashed: boolean;
}

export interface MeshBufferData {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

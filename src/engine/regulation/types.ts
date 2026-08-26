import { IVector2D } from '../../core/math/Vector2D';

export type PriorityRegime =
  | 'priority_to_right'
  | 'stop'
  | 'yield'
  | 'priority_road'
  | 'roundabout'
  | 'traffic_light';

export interface PriorityRule {
  id: string;
  intersectionId: string;
  regime: PriorityRegime;
  majorRoadIds: string[]; // Routes ayant la priorité
  minorRoadIds: string[]; // Routes devant marquer l'arrêt ou céder
  description: string;
}

export interface SpeedZone {
  id: string;
  name: string;
  speedLimitKmH: number;
  roadIds: string[];
}

export interface ConflictArbitrationResult {
  hasConflict: boolean;
  intersectionId: string;
  priorityLaneConnectionId?: string;
  yieldLaneConnectionId?: string;
  conflictPoint?: IVector2D;
  reason: string;
}

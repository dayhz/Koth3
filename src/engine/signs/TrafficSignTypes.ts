import { IVector2D } from '../../core/math/Vector2D';

export type TrafficSignType =
  | 'stop'
  | 'yield'
  | 'roundabout'
  | 'speed_30'
  | 'speed_50'
  | 'speed_70'
  | 'speed_90'
  | 'pedestrian_crossing'
  | 'no_entry'
  | 'priority_road';

export interface TrafficSign {
  id: string;
  type: TrafficSignType;
  position: IVector2D;
  elevation: number;
  heading: number; // Angle vers lequel la face du panneau est tournée
  height: number;  // Hauteur du mât (standard 2.2m)
  roadId?: string;
  intersectionId?: string;
}

import { IVector2D } from '../../core/math/Vector2D';

export type TrafficLightState = 'red' | 'yellow' | 'green' | 'flashing_yellow' | 'off';
export type TrafficLightHeadType = 'standard_3' | 'arrow_left' | 'arrow_right' | 'pedestrian_2';

export interface TrafficLightPole {
  id: string;
  intersectionId: string;
  roadId: string;
  position: IVector2D;
  elevation: number; // Altitude altimétrique au sol du mât (ex: 10m sur un viaduc)
  heading: number;   // Angle en radians vers lequel le feu fait face
  height: number;    // Hauteur du mât (ex: 5.5m)
  armLength: number; // Longueur de la potence surplombant la chaussée (ex: 3.5m)
  controlledLaneIds: string[];
  currentState: TrafficLightState;
}

export interface TrafficLightPhase {
  id: string;
  name: string;
  durationSeconds: number;
  greenRoadIds: string[];
  greenLaneIds: string[];
}

export interface TrafficLightControllerConfig {
  intersectionId: string;
  phases: TrafficLightPhase[];
  yellowDurationSeconds: number;
  allRedDurationSeconds: number;
}

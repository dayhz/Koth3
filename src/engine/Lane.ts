import { ICurve } from '../core/curves/Curve';
import { LaneAllowedMovement, LaneDirection } from './types';

export class Lane {
  public incomingLaneIds: string[] = [];
  public outgoingLaneIds: string[] = [];
  public allowedMovements: LaneAllowedMovement[] = ['straight', 'turn_left', 'turn_right'];

  constructor(
    public readonly id: string,
    public parentRoadId: string,
    public indexFromCenter: number, // -2, -1 (sens inverse) ou +1, +2 (sens direct)
    public direction: LaneDirection,
    public width: number,
    public centerline: ICurve,
    public speedLimitKmH: number = 50
  ) {}

  toJSON() {
    return {
      id: this.id,
      parentRoadId: this.parentRoadId,
      indexFromCenter: this.indexFromCenter,
      direction: this.direction,
      width: this.width,
      speedLimitKmH: this.speedLimitKmH,
      incomingLaneIds: this.incomingLaneIds,
      outgoingLaneIds: this.outgoingLaneIds,
      allowedMovements: this.allowedMovements,
    };
  }
}

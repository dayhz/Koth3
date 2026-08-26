import { ICurve } from '../../core/curves/Curve';
import { Vector3D } from '../../core/math/Vector3D';
import { IDMController } from './IDMController';
import { IDMParameters, VehicleDimensions, VehiclePose, VehicleType } from './types';

export class Vehicle {
  public velocity: number = 0;      // m/s
  public acceleration: number = 0;  // m/s²
  public isBraking: boolean = false;
  public isCrashed: boolean = false;
  public isCautious: boolean = true; // 80% prudent, 20% risqué
  public crashTimer: number = 0;

  public currentLaneId: string | null = null;
  public currentConnectionId: string | null = null;
  public currentCurve: ICurve;
  public sDistance: number = 0;     // Position courante en mètres sur la courbe
  public tProgress: number = 0;     // Position paramétrique [0, 1]

  public dimensions: VehicleDimensions;
  public idmParams: IDMParameters;
  public color: number;

  constructor(
    public readonly id: string,
    public readonly type: VehicleType,
    curve: ICurve,
    laneId: string | null = null,
    sInitial: number = 0,
    color: number = 0x3388ff,
    isCautious: boolean = true
  ) {
    this.currentCurve = curve;
    this.currentLaneId = laneId;
    this.sDistance = sInitial;
    this.tProgress = curve.getLength() > 0 ? sInitial / curve.getLength() : 0;
    this.color = color;
    this.isCautious = isCautious;

    // Dimensions et paramètres selon le type
    if (type === 'bus') {
      this.dimensions = { length: 12.0, width: 2.5, height: 3.2, wheelBase: 6.0 };
      this.idmParams = { desiredSpeed: 11.1, freeAcceleration: 1.2, comfortableDecel: 1.5, minimumGap: 3.0, safeTimeHeadway: 2.0, accelerationExponent: 4 };
    } else if (type === 'truck') {
      this.dimensions = { length: 8.5, width: 2.4, height: 2.8, wheelBase: 4.5 };
      this.idmParams = { desiredSpeed: 12.5, freeAcceleration: 1.5, comfortableDecel: 1.8, minimumGap: 3.0, safeTimeHeadway: 1.8, accelerationExponent: 4 };
    } else if (type === 'suv') {
      this.dimensions = { length: 4.8, width: 2.0, height: 1.7, wheelBase: 2.9 };
      this.idmParams = { desiredSpeed: 14.5, freeAcceleration: 2.2, comfortableDecel: 2.0, minimumGap: 2.0, safeTimeHeadway: 1.4, accelerationExponent: 4 };
    } else if (type === 'compact') {
      this.dimensions = { length: 3.8, width: 1.7, height: 1.4, wheelBase: 2.4 };
      this.idmParams = { desiredSpeed: 13.8, freeAcceleration: 2.5, comfortableDecel: 2.2, minimumGap: 1.8, safeTimeHeadway: 1.3, accelerationExponent: 4 };
    } else {
      // sedan standard
      this.dimensions = { length: 4.5, width: 1.85, height: 1.45, wheelBase: 2.7 };
      this.idmParams = { desiredSpeed: 13.8, freeAcceleration: 2.0, comfortableDecel: 2.0, minimumGap: 2.0, safeTimeHeadway: 1.5, accelerationExponent: 4 };
    }

    this.velocity = this.idmParams.desiredSpeed * 0.7;
  }

  /**
   * Met à jour la cinématique longitudinale selon le modèle IDM et l'état d'accident
   */
  updatePhysics(
    dt: number,
    distanceToLeader: number,
    deltaVelocity: number,
    speedLimitMps: number
  ): void {
    if (this.isCrashed) {
      this.crashTimer += dt;
      this.velocity = 0;
      this.acceleration = -4.0;
      this.isBraking = true;
      return;
    }

    const targetSpeed = Math.min(this.idmParams.desiredSpeed, speedLimitMps);
    this.acceleration = IDMController.calculateAcceleration(
      this.velocity,
      targetSpeed,
      distanceToLeader,
      deltaVelocity,
      this.idmParams
    );

    // Intégration d'Euler
    this.velocity = Math.max(0, this.velocity + this.acceleration * dt);
    this.sDistance += this.velocity * dt;

    const curveLen = this.currentCurve.getLength();
    this.tProgress = curveLen > 0 ? this.sDistance / curveLen : 1;

    // Détection de freinage pour feux stop
    this.isBraking = this.acceleration < -0.3;
  }

  /**
   * Calcule la pose 3D complète (Position X,Y,Z, Lacet, Tangage, Roulis)
   */
  getPose(): VehiclePose {
    const t = Math.max(0, Math.min(1, this.tProgress));
    const pt2D = this.currentCurve.getPoint(t);
    const elev = this.currentCurve.getElevation(t);
    const tangent2D = this.currentCurve.getTangent(t);

    const heading = Math.atan2(tangent2D.y, tangent2D.x);
    const slopePct = this.currentCurve.getSlopePercent(t);
    const pitch = -Math.atan(slopePct / 100);

    return {
      position: new Vector3D(pt2D.x, elev, pt2D.y),
      heading,
      pitch,
      roll: 0,
      velocity: this.velocity,
      acceleration: this.acceleration,
      isBraking: this.isBraking,
      isCrashed: this.isCrashed,
    };
  }
}

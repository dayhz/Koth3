import { Vector3D } from '../../core/math/Vector3D';

export type VehicleType = 'sedan' | 'compact' | 'suv' | 'truck' | 'bus';

export interface VehicleDimensions {
  length: number; // Longueur en mètres (ex: 4.5m)
  width: number;  // Largeur en mètres (ex: 1.9m)
  height: number; // Hauteur en mètres (ex: 1.5m)
  wheelBase: number;
}

export interface IDMParameters {
  desiredSpeed: number;        // v0 (m/s) ex: 13.8 m/s (50 km/h)
  freeAcceleration: number;    // a_max (m/s²) ex: 2.5 m/s²
  comfortableDecel: number;    // b (m/s²) ex: 2.0 m/s²
  minimumGap: number;          // s0 (m) ex: 2.0 m
  safeTimeHeadway: number;     // T (s) ex: 1.5 s
  accelerationExponent: number;// delta (habituellement 4)
}

export interface VehiclePose {
  position: Vector3D;
  heading: number;     // Yaw (lacet) en radians
  pitch: number;       // Tangage en radians (pente)
  roll: number;        // Roulis en radians (dévers)
  velocity: number;    // Vitesse scalaire (m/s)
  acceleration: number;// Accélération (m/s²)
  isBraking: boolean;  // Feux stop allumés
  isCrashed: boolean;  // En situation d'accident / arrêt d'urgence
}

export interface TrafficConfig {
  maxVehicles: number;
  spawnIntervalSeconds: number;
  defaultSpeedLimitKmH: number;
  accidentProbability: number; // 0.20 = 20% de conducteurs plus risqués
}

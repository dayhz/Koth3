import { TrafficLightControllerConfig, TrafficLightPhase, TrafficLightState } from './types';

export class TrafficLightController {
  public intersectionId: string;
  public phases: TrafficLightPhase[];
  public yellowDuration: number;
  public allRedDuration: number;

  public currentPhaseIndex: number = 0;
  public subPhase: 'green' | 'yellow' | 'all_red' = 'green';
  public timer: number = 0;
  public isPaused: boolean = false;
  public timeScale: number = 1.0;

  constructor(config: TrafficLightControllerConfig) {
    this.intersectionId = config.intersectionId;
    this.phases = config.phases;
    this.yellowDuration = config.yellowDurationSeconds || 3.0;
    this.allRedDuration = config.allRedDurationSeconds || 1.5;
  }

  update(deltaSeconds: number): void {
    if (this.isPaused || this.phases.length === 0) return;

    this.timer += deltaSeconds * this.timeScale;
    const currentPhase = this.phases[this.currentPhaseIndex];

    if (this.subPhase === 'green') {
      if (this.timer >= currentPhase.durationSeconds) {
        this.subPhase = 'yellow';
        this.timer = 0;
      }
    } else if (this.subPhase === 'yellow') {
      if (this.timer >= this.yellowDuration) {
        this.subPhase = 'all_red';
        this.timer = 0;
      }
    } else if (this.subPhase === 'all_red') {
      if (this.timer >= this.allRedDuration) {
        this.subPhase = 'green';
        this.timer = 0;
        this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phases.length;
      }
    }
  }

  getLaneState(laneId: string): TrafficLightState {
    if (this.phases.length === 0) return 'off';

    if (this.subPhase === 'all_red') {
      return 'red';
    }

    const currentPhase = this.phases[this.currentPhaseIndex];
    const isGreenInPhase = currentPhase.greenLaneIds.includes(laneId);

    if (isGreenInPhase) {
      return this.subPhase === 'green' ? 'green' : 'yellow';
    }

    return 'red';
  }

  getRoadState(roadId: string): TrafficLightState {
    if (this.phases.length === 0) return 'off';

    if (this.subPhase === 'all_red') {
      return 'red';
    }

    const currentPhase = this.phases[this.currentPhaseIndex];
    const isGreenInPhase = currentPhase.greenRoadIds.includes(roadId);

    if (isGreenInPhase) {
      return this.subPhase === 'green' ? 'green' : 'yellow';
    }

    return 'red';
  }

  canProceed(laneId: string): { allowed: boolean; state: TrafficLightState } {
    const state = this.getLaneState(laneId);
    return {
      allowed: state === 'green',
      state,
    };
  }

  setPhase(index: number): void {
    if (index >= 0 && index < this.phases.length) {
      this.currentPhaseIndex = index;
      this.subPhase = 'green';
      this.timer = 0;
    }
  }
}

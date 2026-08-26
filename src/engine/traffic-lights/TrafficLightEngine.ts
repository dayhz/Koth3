import { RoadNetwork } from '../RoadNetwork';
import { TrafficLightController } from './TrafficLightController';
import { TrafficLightPhase, TrafficLightPole, TrafficLightState } from './types';

export class TrafficLightEngine {
  public poles: Map<string, TrafficLightPole> = new Map();
  public controllers: Map<string, TrafficLightController> = new Map();

  constructor(public network: RoadNetwork) {}

  build(): void {
    this.poles.clear();
    this.controllers.clear();

    let poleCounter = 1;

    for (const node of this.network.nodes.values()) {
      if (node.arms.length <= 1 || node.type === 'roundabout') continue;

      const armRoadIds: string[] = [];

      for (const arm of node.arms) {
        const road = this.network.roads.get(arm.roadId);
        if (!road) continue;
        armRoadIds.push(road.id);

        // 1. Point d'arrêt et direction de circulation vers le carrefour
        const tBoundary = arm.isStartOfRoad ? road.tStart : road.tEnd;
        const stopPoint = road.centerline.getPoint(tBoundary);
        const baseElevation = road.centerline.getElevation(tBoundary);
        const tangent = road.centerline.getTangent(tBoundary);

        // Vecteur unitaire du trafic approchant vers le carrefour
        const approachDir = arm.isStartOfRoad ? tangent.multiplyScalar(-1) : tangent;
        const rightNormal = approachDir.normalRight();

        // 2. Position du mât sur le trottoir droit
        const polePos = stopPoint.addScaled(rightNormal, road.halfWidth + 1.2);
        const heading = Math.atan2(approachDir.y, approachDir.x);

        const poleId = `TLP_${poleCounter++}`;
        const controlledLanes = this.network.getLanesForRoad(road.id)
          .filter((l) => (arm.isStartOfRoad ? l.direction === 'backward' : l.direction === 'forward'))
          .map((l) => l.id);

        const pole: TrafficLightPole = {
          id: poleId,
          intersectionId: node.id,
          roadId: road.id,
          position: polePos.toJSON(),
          elevation: baseElevation,
          heading,
          height: 5.5,
          armLength: road.halfWidth * 0.85 + 0.5,
          controlledLaneIds: controlledLanes,
          currentState: 'red',
        };

        this.poles.set(poleId, pole);
      }

      // Contrôleur de phases pour le carrefour
      if (armRoadIds.length >= 2) {
        const phases: TrafficLightPhase[] = [];

        const group1 = armRoadIds.slice(0, Math.ceil(armRoadIds.length / 2));
        const group2 = armRoadIds.slice(Math.ceil(armRoadIds.length / 2));

        const greenLanes1 = group1.flatMap((rId) =>
          this.network.getLanesForRoad(rId).map((l) => l.id)
        );
        const greenLanes2 = group2.flatMap((rId) =>
          this.network.getLanesForRoad(rId).map((l) => l.id)
        );

        phases.push({
          id: `PHASE_1_${node.id}`,
          name: 'Axe 1 Vert',
          durationSeconds: 12.0,
          greenRoadIds: group1,
          greenLaneIds: greenLanes1,
        });

        phases.push({
          id: `PHASE_2_${node.id}`,
          name: 'Axe 2 Vert',
          durationSeconds: 10.0,
          greenRoadIds: group2,
          greenLaneIds: greenLanes2,
        });

        const controller = new TrafficLightController({
          intersectionId: node.id,
          phases,
          yellowDurationSeconds: 3.0,
          allRedDurationSeconds: 1.5,
        });

        this.controllers.set(node.id, controller);
      }
    }

    this.update(0);
  }

  update(deltaSeconds: number): void {
    for (const controller of this.controllers.values()) {
      controller.update(deltaSeconds);
    }

    for (const pole of this.poles.values()) {
      const controller = this.controllers.get(pole.intersectionId);
      if (controller) {
        pole.currentState = controller.getRoadState(pole.roadId);
      }
    }
  }

  getLightStateForLane(laneId: string, intersectionId: string): TrafficLightState {
    const controller = this.controllers.get(intersectionId);
    if (!controller) return 'off';
    return controller.getLaneState(laneId);
  }

  canVehicleProceed(laneId: string, intersectionId: string): boolean {
    const controller = this.controllers.get(intersectionId);
    if (!controller) return true;
    return controller.canProceed(laneId).allowed;
  }
}

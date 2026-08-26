import { RoadNetwork } from '../RoadNetwork';
import { TrafficLightEngine } from '../traffic-lights/TrafficLightEngine';
import { TrafficRegulationEngine } from '../regulation/TrafficRegulationEngine';
import { Vehicle } from './Vehicle';
import { TrafficConfig, VehicleType } from './types';
import { PRNG } from '../procedural/PRNG';
import { Lane } from '../Lane';

const VEHICLE_PALETTE = [
  0x1e88e5, // Bleu roi
  0xe53935, // Rouge vif
  0x43a047, // Vert émeraude
  0xfb8c00, // Orange
  0x8e24aa, // Violet
  0x37474f, // Gris anthracite
  0xffffff, // Blanc
  0xfdd835, // Jaune
];

export class TrafficSimulation {
  public vehicles: Map<string, Vehicle> = new Map();
  public config: TrafficConfig = {
    maxVehicles: 35,
    spawnIntervalSeconds: 1.5,
    defaultSpeedLimitKmH: 50,
    accidentProbability: 0.20, // 20% de conducteurs téméraires
  };

  private prng = new PRNG(88219);
  private timeSinceLastSpawn: number = 0;
  private vehicleCounter: number = 1;

  constructor(
    public network: RoadNetwork,
    public trafficLights?: TrafficLightEngine,
    public regulation?: TrafficRegulationEngine
  ) {}

  /**
   * Réinitialise ou vide le trafic
   */
  clear(): void {
    this.vehicles.clear();
    this.timeSinceLastSpawn = 0;
  }

  /**
   * Boucle de mise à jour microscopique du trafic avec anti-collision physique et arbitrage
   */
  update(dt: number): void {
    // 1. Spawner de nouveaux véhicules
    this.timeSinceLastSpawn += dt;
    if (this.vehicles.size < this.config.maxVehicles && this.timeSinceLastSpawn >= this.config.spawnIntervalSeconds) {
      this.spawnVehicle();
      this.timeSinceLastSpawn = 0;
    }

    // 2. Indexation spatiale par voie pour détecter les leaders
    const vehiclesByLane = new Map<string, Vehicle[]>();
    for (const v of this.vehicles.values()) {
      const key = v.currentLaneId || v.currentConnectionId || 'unknown';
      if (!vehiclesByLane.has(key)) {
        vehiclesByLane.set(key, []);
      }
      vehiclesByLane.get(key)!.push(v);
    }

    // Trier les véhicules sur chaque voie par ordre décroissant de position sDistance
    for (const list of vehiclesByLane.values()) {
      list.sort((a, b) => b.sDistance - a.sDistance);
    }

    // 3. Calcul de la dynamique IDM pour chaque véhicule
    const vehiclesToRemove: string[] = [];

    for (const vehicle of this.vehicles.values()) {
      if (vehicle.isCrashed) {
        vehicle.updatePhysics(dt, 0, 0, 0);
        if (vehicle.crashTimer > 6.0) {
          vehiclesToRemove.push(vehicle.id); // Dégagement de l'accident après 6s
        }
        continue;
      }

      const laneKey = vehicle.currentLaneId || vehicle.currentConnectionId || 'unknown';
      const laneVehicles = vehiclesByLane.get(laneKey) || [];
      const myIndex = laneVehicles.indexOf(vehicle);

      let distToLeader = Infinity;
      let deltaV = 0;

      // A. Leader physique direct sur la même voie
      if (myIndex > 0) {
        const leader = laneVehicles[myIndex - 1];
        const gap = (leader.sDistance - leader.dimensions.length / 2) - (vehicle.sDistance + vehicle.dimensions.length / 2);
        if (gap > 0) {
          distToLeader = gap;
          deltaV = vehicle.velocity - leader.velocity;
        }
      }

      // B. Obstacle réglementaire (Feu rouge, STOP et Cédez-le-passage)
      if (vehicle.currentLaneId) {
        const lane = this.network.lanes.get(vehicle.currentLaneId);
        if (lane) {
          const parentRoad = this.network.roads.get(lane.parentRoadId);
          if (parentRoad) {
            const nextNodeId = lane.direction === 'forward' ? parentRoad.endNodeId : parentRoad.startNodeId;
            const curveLen = vehicle.currentCurve.getLength();
            const setbackDist = Math.min(curveLen * 0.4, parentRoad.halfWidth + 4.0);
            const stopLineDistance = curveLen - setbackDist;
            const distToStopLine = stopLineDistance - vehicle.sDistance - vehicle.dimensions.length / 2;

            // 1. Détection de feux tricolores (si carrefour régulé par feux)
            let isSignalControlled = false;
            if (this.trafficLights && this.trafficLights.controllers.has(nextNodeId)) {
              isSignalControlled = true;
              if (distToStopLine > 0 && distToStopLine < 50.0) {
                const lightState = this.trafficLights.getLightStateForLane(lane.id, nextNodeId);
                if (lightState === 'red' || lightState === 'yellow') {
                  if (distToStopLine < distToLeader) {
                    distToLeader = Math.max(0.1, distToStopLine);
                    deltaV = vehicle.velocity;
                  }
                }
              }
            }

            // 2. Cédez-le-passage (Giratoires & carrefours non régulés) : céder uniquement si un véhicule traverse
            if (!isSignalControlled && vehicle.isCautious && distToStopLine > 0 && distToStopLine < 20.0) {
              const hasConflict = this.isIntersectionBusyForNode(nextNodeId, vehicle);
              if (hasConflict) {
                if (distToStopLine < distToLeader) {
                  distToLeader = Math.max(0.1, distToStopLine);
                  deltaV = vehicle.velocity;
                }
              }
            }
          }
        }
      }

      // Vitesse limite de la route en m/s
      let speedLimitMps = (this.config.defaultSpeedLimitKmH / 3.6);
      if (vehicle.currentLaneId) {
        const lane = this.network.lanes.get(vehicle.currentLaneId);
        const road = lane ? this.network.roads.get(lane.parentRoadId) : undefined;
        if (road && road.profile && road.profile.speedLimitKmH) {
          speedLimitMps = road.profile.speedLimitKmH / 3.6;
        }
      }

      // Mise à jour de la physique IDM
      vehicle.updatePhysics(dt, distToLeader, deltaV, speedLimitMps);

      // C. Transition de fin de courbe
      if (vehicle.tProgress >= 1.0) {
        const success = this.advanceVehicleToNextPath(vehicle);
        if (!success) {
          vehiclesToRemove.push(vehicle.id);
        }
      }
    }

    // 4. Détection de collision physique spatiale 3D (Anti-Ghosting Absolu)
    const allVehicles = Array.from(this.vehicles.values());
    for (let i = 0; i < allVehicles.length; i++) {
      const v1 = allVehicles[i];
      if (v1.isCrashed) continue;
      const p1 = v1.getPose().position;

      for (let j = i + 1; j < allVehicles.length; j++) {
        const v2 = allVehicles[j];
        if (v2.isCrashed) continue;

        // Si les deux véhicules circulent sur des voies séparées de la même route -> croisement latéral normal
        if (v1.currentLaneId && v2.currentLaneId && v1.currentLaneId !== v2.currentLaneId) {
          const l1 = this.network.lanes.get(v1.currentLaneId);
          const l2 = this.network.lanes.get(v2.currentLaneId);
          if (l1 && l2 && l1.parentRoadId === l2.parentRoadId) {
            continue; // Croisement normal sur route à double sens ou voies parallèles
          }
        }

        const p2 = v2.getPose().position;
        const dist = Math.hypot(p1.x - p2.x, p1.z - p2.z);
        // Seuil d'empiètement réel (largeur de caisse ~1.8m)
        const minDist = (v1.dimensions.width + v2.dimensions.width) * 0.48; // ~1.8m

        if (dist < minDist) {
          // Impact physique réel : arrêt immédiat sans traversée
          v1.velocity = 0;
          v2.velocity = 0;
          v1.isCrashed = true;
          v2.isCrashed = true;
        }
      }
    }

    // Supprimer les véhicules arrivés en bout de réseau ou dégagés
    for (const vId of vehiclesToRemove) {
      this.vehicles.delete(vId);
    }
  }

  /**
   * Vérifie si un carrefour ou un giratoire est actuellement traversé par un véhicule
   */
  private isIntersectionBusyForNode(nodeId: string, myVehicle: Vehicle): boolean {
    // Seuls les véhicules RÉELLEMENT engagés sur une trajectoire de traversée (currentConnectionId)
    // à l'intérieur de ce carrefour précis sont considérés comme occupant l'intersection !
    for (const other of this.vehicles.values()) {
      if (other.id === myVehicle.id) continue;
      if (other.currentConnectionId) {
        const conn = this.network.laneConnections.get(other.currentConnectionId);
        if (conn && conn.intersectionId === nodeId) {
          return true; // Intersection occupée par un véhicule en train de tourner / traverser
        }
      }
    }
    return false;
  }

  /**
   * Fait avancer le véhicule vers la prochaine voie ou connexion de carrefour
   */
  private advanceVehicleToNextPath(vehicle: Vehicle): boolean {
    if (vehicle.currentLaneId) {
      const connections = Array.from(this.network.laneConnections.values()).filter(
        (c) => c.fromLaneId === vehicle.currentLaneId
      );

      if (connections.length > 0) {
        const conn = this.prng.choice(connections);
        vehicle.currentLaneId = null;
        vehicle.currentConnectionId = conn.id;
        vehicle.currentCurve = conn.trajectory;
        vehicle.sDistance = 0;
        vehicle.tProgress = 0;
        return true;
      }
      return false; // Cul-de-sac
    }

    if (vehicle.currentConnectionId) {
      const conn = this.network.laneConnections.get(vehicle.currentConnectionId);
      if (conn) {
        const nextLane = this.network.lanes.get(conn.toLaneId);
        if (nextLane) {
          vehicle.currentConnectionId = null;
          vehicle.currentLaneId = nextLane.id;
          vehicle.currentCurve = nextLane.centerline;
          vehicle.sDistance = 0;
          vehicle.tProgress = 0;
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Retourne les voies d'entrée périphériques du réseau
   */
  private getCandidateEntryLanes(): Lane[] {
    const allLanes = Array.from(this.network.lanes.values());
    const entryLanes = allLanes.filter((lane) => {
      const road = this.network.roads.get(lane.parentRoadId);
      if (!road) return false;
      const startNodeId = lane.direction === 'forward' ? road.startNodeId : road.endNodeId;
      const startNode = this.network.nodes.get(startNodeId);
      return startNode && (startNode.type === 'dead_end' || startNode.connectedRoadIds.length <= 1);
    });

    return entryLanes.length > 0 ? entryLanes : allLanes;
  }

  /**
   * Fait apparaître un véhicule sur une voie d'entrée disponible
   */
  public spawnVehicle(): boolean {
    const candidateLanes = this.getCandidateEntryLanes();
    if (candidateLanes.length === 0) return false;

    const lane = this.prng.choice(candidateLanes);

    // Vérifier si le début de la voie est libre (> 12m)
    for (const v of this.vehicles.values()) {
      if (v.currentLaneId === lane.id && v.sDistance < 12.0) {
        return false;
      }
    }

    const types: VehicleType[] = ['sedan', 'sedan', 'compact', 'suv', 'truck', 'bus'];
    const type = this.prng.choice(types);
    const color = this.prng.choice(VEHICLE_PALETTE);
    const id = `VEH_${this.vehicleCounter++}`;
    const isCautious = this.prng.next() >= this.config.accidentProbability; // 80% prudents, 20% risqués

    const vehicle = new Vehicle(id, type, lane.centerline, lane.id, 0, color, isCautious);
    this.vehicles.set(id, vehicle);
    return true;
  }
}

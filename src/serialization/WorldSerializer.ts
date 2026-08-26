import { Vector2D } from '../core/math/Vector2D';
import { LinearCurve, CubicBezierCurve, ArcCurve, ICurve } from '../core/curves/Curve';
import { RoadWorldEngine } from '../engine/RoadWorldEngine';
import { RoadProfile } from '../engine/types';

export interface SerializedCurve {
  type: 'linear' | 'bezier_cubic' | 'arc';
  data: any;
}

export interface SerializedWorld {
  version: '0.1.0';
  seed: number;
  nodes: {
    id: string;
    position: { x: number; y: number };
    type: string;
    roundaboutConfig?: any;
  }[];
  roads: {
    id: string;
    startNodeId: string;
    endNodeId: string;
    name?: string;
    profile: RoadProfile;
    centerline: SerializedCurve;
  }[];
}

export class WorldSerializer {
  static serialize(engine: RoadWorldEngine): string {
    const world: SerializedWorld = {
      version: '0.1.0',
      seed: engine.seed,
      nodes: [],
      roads: [],
    };

    for (const node of engine.network.nodes.values()) {
      world.nodes.push({
        id: node.id,
        position: node.position.toJSON(),
        type: node.type,
        roundaboutConfig: node.roundaboutConfig,
      });
    }

    for (const road of engine.network.roads.values()) {
      world.roads.push({
        id: road.id,
        startNodeId: road.startNodeId,
        endNodeId: road.endNodeId,
        name: road.name,
        profile: road.profile,
        centerline: this.serializeCurve(road.centerline),
      });
    }

    return JSON.stringify(world, null, 2);
  }

  static deserialize(jsonString: string): RoadWorldEngine {
    const data: SerializedWorld = JSON.parse(jsonString);
    const engine = new RoadWorldEngine(data.seed || 12345);

    // 1. Reconstruire les nœuds
    for (const n of data.nodes) {
      if (n.type === 'roundabout' && n.roundaboutConfig) {
        engine.network.createRoundaboutNode(
          Vector2D.from(n.position),
          n.roundaboutConfig.radius,
          n.roundaboutConfig.innerRadius,
          n.roundaboutConfig.laneCount,
          n.id
        );
      } else {
        engine.network.createNode(Vector2D.from(n.position), n.type as any, n.id);
      }
    }

    // 2. Reconstruire les routes
    for (const r of data.roads) {
      const curve = this.deserializeCurve(r.centerline);
      engine.network.createRoad(
        r.startNodeId,
        r.endNodeId,
        curve,
        r.profile,
        r.id,
        r.name
      );
    }

    // 3. Reconstruire l'ensemble des systèmes
    engine.build();

    return engine;
  }

  private static serializeCurve(curve: ICurve): SerializedCurve {
    if (curve instanceof LinearCurve) {
      return {
        type: 'linear',
        data: {
          start: curve.start.toJSON(),
          end: curve.end.toJSON(),
        },
      };
    }
    if (curve instanceof CubicBezierCurve) {
      return {
        type: 'bezier_cubic',
        data: {
          p0: curve.p0.toJSON(),
          p1: curve.p1.toJSON(),
          p2: curve.p2.toJSON(),
          p3: curve.p3.toJSON(),
        },
      };
    }
    if (curve instanceof ArcCurve) {
      return {
        type: 'arc',
        data: {
          center: curve.center.toJSON(),
          radius: curve.radius,
          startAngle: curve.startAngle,
          endAngle: curve.endAngle,
          clockwise: curve.clockwise,
        },
      };
    }
    throw new Error(`Type de courbe inconnu pour la sérialisation.`);
  }

  private static deserializeCurve(serialized: SerializedCurve): ICurve {
    if (serialized.type === 'linear') {
      return new LinearCurve(serialized.data.start, serialized.data.end);
    }
    if (serialized.type === 'bezier_cubic') {
      return new CubicBezierCurve(
        serialized.data.p0,
        serialized.data.p1,
        serialized.data.p2,
        serialized.data.p3
      );
    }
    if (serialized.type === 'arc') {
      return new ArcCurve(
        serialized.data.center,
        serialized.data.radius,
        serialized.data.startAngle,
        serialized.data.endAngle,
        serialized.data.clockwise
      );
    }
    throw new Error(`Type de courbe inconnu : ${serialized.type}`);
  }
}

import { Vector2D } from '../core/math/Vector2D';
import { ICurve } from '../core/curves/Curve';
import { RoadSegment } from './RoadSegment';
import { IntersectionNode } from './IntersectionNode';
import { Lane } from './Lane';
import { Sidewalk } from './Sidewalk';
import { RoadMarking } from './RoadMarking';
import { CrosswalkData, DirectionalArrowData, IntersectionType, LaneConnection, RoadProfile, StopLineData } from './types';

export class RoadNetwork {
  public nodes: Map<string, IntersectionNode> = new Map();
  public roads: Map<string, RoadSegment> = new Map();
  public lanes: Map<string, Lane> = new Map();
  public laneConnections: Map<string, LaneConnection> = new Map();
  public sidewalks: Map<string, Sidewalk> = new Map();
  public markings: Map<string, RoadMarking> = new Map();
  
  // Marquages avancés V0.3
  public crosswalks: Map<string, CrosswalkData> = new Map();
  public directionalArrows: Map<string, DirectionalArrowData> = new Map();
  public stopLines: Map<string, StopLineData> = new Map();

  private _nodeCounter = 1;
  private _roadCounter = 1;

  clear(): void {
    this.nodes.clear();
    this.roads.clear();
    this.lanes.clear();
    this.laneConnections.clear();
    this.sidewalks.clear();
    this.markings.clear();
    this.crosswalks.clear();
    this.directionalArrows.clear();
    this.stopLines.clear();
    this._nodeCounter = 1;
    this._roadCounter = 1;
  }

  createNode(position: Vector2D, type: IntersectionType = 'dead_end', customId?: string): IntersectionNode {
    const id = customId || `N_${this._nodeCounter++}`;
    const node = new IntersectionNode(id, position, type);
    this.nodes.set(id, node);
    return node;
  }

  createRoundaboutNode(
    center: Vector2D,
    radius: number = 18,
    innerRadius: number = 10,
    laneCount: number = 1,
    customId?: string
  ): IntersectionNode {
    const node = this.createNode(center, 'roundabout', customId);
    node.roundaboutConfig = {
      center: center.toJSON(),
      radius,
      innerRadius,
      laneCount,
      hasSplitterIslands: true,
    };
    return node;
  }

  createRoad(
    startNodeId: string,
    endNodeId: string,
    centerline: ICurve,
    profile: RoadProfile,
    customId?: string,
    name?: string
  ): RoadSegment {
    const startNode = this.nodes.get(startNodeId);
    const endNode = this.nodes.get(endNodeId);

    if (!startNode || !endNode) {
      throw new Error(`Impossible de créer la route : nœud ${!startNode ? startNodeId : endNodeId} introuvable.`);
    }

    const id = customId || `R_${this._roadCounter++}`;
    const road = new RoadSegment(id, startNodeId, endNodeId, centerline, profile, name);
    this.roads.set(id, road);

    const startTangent = centerline.getTangent(0);
    const startAngle = Math.atan2(startTangent.y, startTangent.x);
    startNode.addConnectedRoad(id, true, startAngle, road.totalWidth);

    const endTangent = centerline.getTangent(1);
    const endAngle = Math.atan2(-endTangent.y, -endTangent.x);
    endNode.addConnectedRoad(id, false, endAngle, road.totalWidth);

    return road;
  }

  getConnectedRoads(roadId: string): RoadSegment[] {
    const road = this.roads.get(roadId);
    if (!road) return [];

    const connected: Set<RoadSegment> = new Set();
    const startNode = this.nodes.get(road.startNodeId);
    const endNode = this.nodes.get(road.endNodeId);

    if (startNode) {
      for (const rId of startNode.connectedRoadIds) {
        if (rId !== roadId) {
          const r = this.roads.get(rId);
          if (r) connected.add(r);
        }
      }
    }

    if (endNode) {
      for (const rId of endNode.connectedRoadIds) {
        if (rId !== roadId) {
          const r = this.roads.get(rId);
          if (r) connected.add(r);
        }
      }
    }

    return Array.from(connected);
  }

  getLanesForRoad(roadId: string): Lane[] {
    const road = this.roads.get(roadId);
    if (!road) return [];
    return road.laneIds.map((lId) => this.lanes.get(lId)!).filter(Boolean);
  }

  getLanesConnectedToIntersection(nodeId: string): { incoming: Lane[]; outgoing: Lane[] } {
    const node = this.nodes.get(nodeId);
    if (!node) return { incoming: [], outgoing: [] };

    const incoming: Lane[] = [];
    const outgoing: Lane[] = [];

    for (const arm of node.arms) {
      const road = this.roads.get(arm.roadId);
      if (!road) continue;

      const roadLanes = this.getLanesForRoad(road.id);
      for (const lane of roadLanes) {
        if (arm.isStartOfRoad) {
          if (lane.direction === 'forward') outgoing.push(lane);
          else incoming.push(lane);
        } else {
          if (lane.direction === 'forward') incoming.push(lane);
          else outgoing.push(lane);
        }
      }
    }

    return { incoming, outgoing };
  }

  whereDoesLaneStartAndEnd(laneId: string): { startPoint: Vector2D; endPoint: Vector2D } | null {
    const lane = this.lanes.get(laneId);
    if (!lane) return null;
    return {
      startPoint: lane.centerline.getPoint(0),
      endPoint: lane.centerline.getPoint(1),
    };
  }
}

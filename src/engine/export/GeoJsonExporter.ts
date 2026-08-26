import { RoadWorldEngine } from '../RoadWorldEngine';
import { IVector2D } from '../../core/math/Vector2D';

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export class GeoJsonExporter {
  /**
   * Exporte l'ensemble du réseau routier et ses couches au format GeoJSON RFC 7946
   */
  static export(engine: RoadWorldEngine): string {
    const net = engine.network;
    const features: GeoJsonFeature[] = [];

    // 1. Couche des axes routiers (Road Centerlines)
    for (const road of net.roads.values()) {
      const coords = road.centerline.sampleFrames(20).map((f) => [
        Number(f.point.x.toFixed(3)),
        Number(f.point.y.toFixed(3)),
        Number(f.elevation.toFixed(3)),
      ]);

      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
        properties: {
          layer: 'road_centerlines',
          id: road.id,
          name: road.name,
          laneCount: road.profile.laneCount,
          laneWidth: road.profile.laneWidth,
          totalWidth: road.totalWidth,
          speedLimitKmH: road.profile.speedLimitKmH,
          lengthMeters: Number(road.length.toFixed(2)),
          startNodeId: road.startNodeId,
          endNodeId: road.endNodeId,
        },
      });
    }

    // 2. Couche des voies de circulation (Lanes)
    for (const lane of net.lanes.values()) {
      const coords = lane.centerline.sampleFrames(20).map((f) => [
        Number(f.point.x.toFixed(3)),
        Number(f.point.y.toFixed(3)),
        Number(f.elevation.toFixed(3)),
      ]);

      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
        properties: {
          layer: 'lanes',
          id: lane.id,
          parentRoadId: lane.parentRoadId,
          direction: lane.direction,
          indexFromCenter: lane.indexFromCenter,
          width: lane.width,
          speedLimitKmH: lane.speedLimitKmH,
        },
      });
    }

    // 3. Couche des polygones d'intersection (Carrefours)
    for (const node of net.nodes.values()) {
      if (node.surfacePolygon.vertices.length >= 3) {
        const ring = node.surfacePolygon.vertices.map((v) => [
          Number(v.x.toFixed(3)),
          Number(v.y.toFixed(3)),
          Number(node.elevation.toFixed(3)),
        ]);
        ring.push(ring[0]); // Fermer le polygone

        features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [ring],
          },
          properties: {
            layer: 'intersections',
            id: node.id,
            name: node.name,
            type: node.type,
            elevation: node.elevation,
            armsCount: node.arms.length,
          },
        });
      }
    }

    // 4. Couche des trottoirs (Sidewalks)
    for (const sw of net.sidewalks.values()) {
      if (sw.surfacePolygon.vertices.length >= 3) {
        const parentRoad = net.roads.get(sw.parentRoadId);
        const z = parentRoad ? parentRoad.centerline.getElevation(0.5) : 0;
        const ring = sw.surfacePolygon.vertices.map((v) => [
          Number(v.x.toFixed(3)),
          Number(v.y.toFixed(3)),
          Number((z + 0.15).toFixed(3)),
        ]);
        ring.push(ring[0]);

        features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [ring],
          },
          properties: {
            layer: 'sidewalks',
            id: sw.id,
            parentRoadId: sw.parentRoadId,
            side: sw.side,
            width: sw.width,
          },
        });
      }
    }

    // 5. Couche des îlots séparateurs (Splitter Islands)
    for (const node of net.nodes.values()) {
      for (const island of node.splitterIslands) {
        if (island.polygon && island.polygon.length >= 3) {
          const ring = island.polygon.map((v: IVector2D) => [
            Number(v.x.toFixed(3)),
            Number(v.y.toFixed(3)),
            Number((node.elevation + 0.15).toFixed(3)),
          ]);
          ring.push(ring[0]);

          features.push({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [ring],
            },
            properties: {
              layer: 'splitter_islands',
              id: island.id,
              nodeId: node.id,
              elevation: node.elevation,
            },
          });
        }
      }
    }

    // 6. Couche des feux tricolores (Traffic Lights Points)
    if (engine.trafficLights) {
      for (const [id, pole] of engine.trafficLights.poles.entries()) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [
              Number(pole.position.x.toFixed(3)),
              Number(pole.position.y.toFixed(3)),
              Number((pole.elevation || 0).toFixed(3)),
            ],
          },
          properties: {
            layer: 'traffic_lights',
            id,
            roadId: pole.roadId,
            controlledLanes: pole.controlledLaneIds,
            state: pole.currentState,
          },
        });
      }
    }

    // 7. Lignes d'arrêt (Stop Lines)
    for (const sl of net.stopLines.values()) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [Number(sl.p1.x.toFixed(3)), Number(sl.p1.y.toFixed(3)), Number((sl.elevation || 0).toFixed(3))],
            [Number(sl.p2.x.toFixed(3)), Number(sl.p2.y.toFixed(3)), Number((sl.elevation || 0).toFixed(3))],
          ],
        },
        properties: {
          layer: 'stop_lines',
          id: sl.id,
          laneId: sl.laneId,
          intersectionId: sl.intersectionId,
          isDashed: sl.isDashed,
        },
      });
    }

    const collection: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    return JSON.stringify(collection, null, 2);
  }
}

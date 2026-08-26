import { Vector2D } from '../core/math/Vector2D';
import { Polygon2D } from '../core/polygon/Polygon2D';
import { CurveOffset } from '../core/curves/CurveOffset';
import { RoadNetwork } from './RoadNetwork';
import { Sidewalk } from './Sidewalk';

export class SidewalkBuilder {
  static buildSidewalks(network: RoadNetwork, samplesPerRoad: number = 24): void {
    network.sidewalks.clear();
    let sidewalkCounter = 1;

    for (const road of network.roads.values()) {
      const halfWidth = road.halfWidth;
      const wLeft = road.profile.sidewalkWidthLeft;
      const wRight = road.profile.sidewalkWidthRight;
      const curbHeight = road.profile.curbHeight;
      const tStart = road.tStart;
      const tEnd = road.tEnd;

      // Trottoir gauche sur [tStart, tEnd]
      if (wLeft > 0) {
        const idLeft = `SW_${sidewalkCounter++}`;
        const sidewalkLeft = new Sidewalk(idLeft, road.id, 'left', wLeft, curbHeight);

        // Bord intérieur (au contact de la route à +halfWidth)
        const innerBorder = CurveOffset.sampleOffsetPoints(road.centerline, halfWidth, samplesPerRoad, tStart, tEnd);
        // Bord extérieur (à +halfWidth + wLeft)
        const outerBorder = CurveOffset.sampleOffsetPoints(road.centerline, halfWidth + wLeft, samplesPerRoad, tStart, tEnd);

        sidewalkLeft.innerBoundary = innerBorder;
        sidewalkLeft.outerBoundary = outerBorder;

        // Polygone fermé
        const polyVertices: Vector2D[] = [
          ...outerBorder,
          ...innerBorder.slice().reverse(),
        ];
        sidewalkLeft.surfacePolygon = new Polygon2D(polyVertices);

        network.sidewalks.set(idLeft, sidewalkLeft);
        road.leftSidewalkId = idLeft;
      }

      // Trottoir droit sur [tStart, tEnd]
      if (wRight > 0) {
        const idRight = `SW_${sidewalkCounter++}`;
        const sidewalkRight = new Sidewalk(idRight, road.id, 'right', wRight, curbHeight);

        // Bord intérieur (au contact de la route à -halfWidth)
        const innerBorder = CurveOffset.sampleOffsetPoints(road.centerline, -halfWidth, samplesPerRoad, tStart, tEnd);
        // Bord extérieur (à -halfWidth - wRight)
        const outerBorder = CurveOffset.sampleOffsetPoints(road.centerline, -halfWidth - wRight, samplesPerRoad, tStart, tEnd);

        sidewalkRight.innerBoundary = innerBorder;
        sidewalkRight.outerBoundary = outerBorder;

        // Polygone fermé
        const polyVertices: Vector2D[] = [
          ...innerBorder,
          ...outerBorder.slice().reverse(),
        ];
        sidewalkRight.surfacePolygon = new Polygon2D(polyVertices);

        network.sidewalks.set(idRight, sidewalkRight);
        road.rightSidewalkId = idRight;
      }
    }
  }
}

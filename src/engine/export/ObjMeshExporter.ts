import { RoadWorldEngine } from '../RoadWorldEngine';
import { Polygon2D } from '../../core/polygon/Polygon2D';
import { IVector2D } from '../../core/math/Vector2D';

export interface ObjExportResult {
  obj: string;
  mtl: string;
}

export class ObjMeshExporter {
  /**
   * Exporte le maillage 3D complet de la voirie au format Wavefront OBJ & MTL
   */
  static export(engine: RoadWorldEngine): ObjExportResult {
    const net = engine.network;

    let obj = `# Road World Engine V0.9 - Wavefront 3D Mesh Export\n`;
    obj += `mtllib road_world.mtl\n\n`;

    let vertexOffset = 1;

    // Helper pour écrire un maillage triangulé
    const writeTriangles = (
      name: string,
      matName: string,
      vertices: { x: number; y: number; z: number }[],
      indices: number[]
    ): void => {
      if (vertices.length === 0 || indices.length === 0) return;

      obj += `o ${name}\n`;
      obj += `usemtl ${matName}\n`;

      for (const v of vertices) {
        // Dans Three / OBJ : Y est l'altitude, Z est la profondeur
        obj += `v ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}\n`;
      }
      obj += `vn 0.0000 1.0000 0.0000\n`;

      for (let i = 0; i < indices.length; i += 3) {
        const i1 = vertexOffset + indices[i];
        const i2 = vertexOffset + indices[i + 1];
        const i3 = vertexOffset + indices[i + 2];
        obj += `f ${i1}//1 ${i2}//1 ${i3}//1\n`;
      }
      obj += `\n`;

      vertexOffset += vertices.length;
    };

    // 1. Asphalte des tronçons de route
    for (const road of net.roads.values()) {
      if (road.surfacePolygon.vertices.length >= 3) {
        const { indices } = road.surfacePolygon.triangulate();
        const vertices = road.surfacePolygon.vertices.map((v) => ({
          x: v.x,
          y: road.centerline.getElevation(0.5) + 0.01,
          z: v.y,
        }));
        writeTriangles(`Road_${road.id}`, 'mat_asphalt', vertices, indices);
      }
    }

    // 2. Asphalte des carrefours
    for (const node of net.nodes.values()) {
      if (node.surfacePolygon.vertices.length >= 3) {
        const { indices } = node.surfacePolygon.triangulate();
        const vertices = node.surfacePolygon.vertices.map((v) => ({
          x: v.x,
          y: node.elevation + 0.01,
          z: v.y,
        }));
        writeTriangles(`Intersection_${node.id}`, 'mat_asphalt', vertices, indices);
      }
    }

    // 3. Trottoirs (Surface supérieure)
    for (const sw of net.sidewalks.values()) {
      if (sw.surfacePolygon.vertices.length >= 3) {
        const parentRoad = net.roads.get(sw.parentRoadId);
        const z = parentRoad ? parentRoad.centerline.getElevation(0.5) : 0;
        const { indices } = sw.surfacePolygon.triangulate();
        const vertices = sw.surfacePolygon.vertices.map((v) => ({
          x: v.x,
          y: z + 0.15,
          z: v.y,
        }));
        writeTriangles(`Sidewalk_${sw.id}`, 'mat_sidewalk', vertices, indices);
      }
    }

    // 4. Îlots séparateurs (Splitter Islands)
    for (const node of net.nodes.values()) {
      for (const island of node.splitterIslands) {
        if (island.polygon && island.polygon.length >= 3) {
          const poly = Polygon2D.fromPoints(island.polygon);
          const { indices } = poly.triangulate();
          const vertices = poly.vertices.map((v: IVector2D) => ({
            x: v.x,
            y: node.elevation + 0.15,
            z: v.y,
          }));
          writeTriangles(`SplitterIsland_${island.id}`, 'mat_island', vertices, indices);
        }
      }
    }

    // 5. Marquages au sol (Lignes d'axe et de rive)
    for (const marking of net.markings.values()) {
      const road = marking.parentRoadId ? net.roads.get(marking.parentRoadId) : undefined;
      const elev = road ? road.centerline.getElevation(0.5) : 0;
      const frames = marking.centerline.sampleFrames(16);
      const halfW = marking.width / 2;

      const vertices: { x: number; y: number; z: number }[] = [];
      const indices: number[] = [];

      for (let i = 0; i < frames.length; i++) {
        const f = frames[i];
        const pLeft = f.point.addScaled(f.normal, halfW);
        const pRight = f.point.addScaled(f.normal, -halfW);

        vertices.push({ x: pLeft.x, y: elev + 0.03, z: pLeft.y });
        vertices.push({ x: pRight.x, y: elev + 0.03, z: pRight.y });

        if (i > 0) {
          const base = (i - 1) * 2;
          indices.push(base, base + 1, base + 2);
          indices.push(base + 1, base + 3, base + 2);
        }
      }

      writeTriangles(`Marking_${marking.id}`, 'mat_marking_white', vertices, indices);
    }

    // Génération du fichier de matériaux MTL
    let mtl = `# Road World Engine V0.9 - Wavefront Material Library\n\n`;

    mtl += `newmtl mat_asphalt\n`;
    mtl += `Kd 0.18 0.18 0.20\n`;
    mtl += `Ks 0.05 0.05 0.05\n`;
    mtl += `Ns 10.0\n\n`;

    mtl += `newmtl mat_sidewalk\n`;
    mtl += `Kd 0.65 0.65 0.68\n`;
    mtl += `Ks 0.10 0.10 0.10\n`;
    mtl += `Ns 20.0\n\n`;

    mtl += `newmtl mat_island\n`;
    mtl += `Kd 0.50 0.52 0.54\n`;
    mtl += `Ks 0.08 0.08 0.08\n`;
    mtl += `Ns 15.0\n\n`;

    mtl += `newmtl mat_marking_white\n`;
    mtl += `Kd 0.95 0.95 0.95\n`;
    mtl += `Ks 0.20 0.20 0.20\n`;
    mtl += `Ns 30.0\n\n`;

    mtl += `newmtl mat_marking_yellow\n`;
    mtl += `Kd 0.95 0.80 0.10\n`;
    mtl += `Ks 0.20 0.20 0.20\n`;
    mtl += `Ns 30.0\n\n`;

    return { obj, mtl };
  }
}

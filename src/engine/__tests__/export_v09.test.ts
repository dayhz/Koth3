import { describe, it, expect } from 'vitest';
import { RoadWorldEngine } from '../RoadWorldEngine';
import { CityBuilder } from '../procedural/CityBuilder';
import { ExportHub } from '../export/ExportHub';
import { OpenDriveExporter } from '../export/OpenDriveExporter';
import { SumoExporter } from '../export/SumoExporter';
import { GeoJsonExporter } from '../export/GeoJsonExporter';
import { ObjMeshExporter } from '../export/ObjMeshExporter';

describe('Standardized Exporters V0.9', () => {
  const createTestCity = (): RoadWorldEngine => {
    const engine = new RoadWorldEngine(901);
    CityBuilder.createGridCity(engine, { rows: 3, cols: 3, blockSizeX: 60, blockSizeY: 50 }, 901);
    return engine;
  };

  it('exports valid ASAM OpenDRIVE XML with header, roads, lanes and signals', () => {
    const engine = createTestCity();
    const xodr = OpenDriveExporter.export(engine);

    expect(xodr).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xodr).toContain('<OpenDRIVE>');
    expect(xodr).toContain('<header');
    expect(xodr).toContain('<road');
    expect(xodr).toContain('<planView>');
    expect(xodr).toContain('<elevationProfile>');
    expect(xodr).toContain('<lanes>');
    expect(xodr).toContain('</OpenDRIVE>');
  });

  it('exports valid Eclipse SUMO .net.xml with edges, lanes, junctions and tlLogic', () => {
    const engine = createTestCity();
    const sumoXml = SumoExporter.export(engine);

    expect(sumoXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sumoXml).toContain('<net');
    expect(sumoXml).toContain('<location');
    expect(sumoXml).toContain('<edge id=');
    expect(sumoXml).toContain('<lane id=');
    expect(sumoXml).toContain('<junction id=');
    expect(sumoXml).toContain('<connection from=');
    expect(sumoXml).toContain('<tlLogic');
    expect(sumoXml).toContain('</net>');
  });

  it('exports valid GeoJSON RFC 7946 FeatureCollection with multiple layers', () => {
    const engine = createTestCity();
    const geojsonStr = GeoJsonExporter.export(engine);
    const parsed = JSON.parse(geojsonStr);

    expect(parsed.type).toBe('FeatureCollection');
    expect(Array.isArray(parsed.features)).toBe(true);
    expect(parsed.features.length).toBeGreaterThan(0);

    const layers = new Set(parsed.features.map((f: any) => f.properties.layer));
    expect(layers.has('road_centerlines')).toBe(true);
    expect(layers.has('lanes')).toBe(true);
    expect(layers.has('intersections')).toBe(true);
    expect(layers.has('sidewalks')).toBe(true);
  });

  it('exports valid Wavefront OBJ 3D mesh and MTL material library', () => {
    const engine = createTestCity();
    const { obj, mtl } = ObjMeshExporter.export(engine);

    expect(obj).toContain('mtllib road_world.mtl');
    expect(obj).toContain('v ');
    expect(obj).toContain('f ');
    expect(obj).toContain('usemtl mat_asphalt');
    expect(obj).toContain('usemtl mat_sidewalk');

    expect(mtl).toContain('newmtl mat_asphalt');
    expect(mtl).toContain('newmtl mat_sidewalk');
    expect(mtl).toContain('newmtl mat_marking_white');
  });

  it('provides unified access via ExportHub and RoadWorldEngine methods', () => {
    const engine = createTestCity();

    expect(typeof engine.exportOpenDrive()).toBe('string');
    expect(typeof engine.exportSumo()).toBe('string');
    expect(typeof engine.exportGeoJson()).toBe('string');
    expect(engine.exportObj().obj).toBeDefined();
    expect(typeof ExportHub.exportToJson(engine)).toBe('string');
  });
});

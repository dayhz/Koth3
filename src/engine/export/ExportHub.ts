import { RoadWorldEngine } from '../RoadWorldEngine';
import { OpenDriveExporter } from './OpenDriveExporter';
import { SumoExporter } from './SumoExporter';
import { GeoJsonExporter } from './GeoJsonExporter';
import { ObjMeshExporter, ObjExportResult } from './ObjMeshExporter';
import { WorldSerializer } from '../../serialization/WorldSerializer';

export type ExportFormat = 'opendrive' | 'sumo' | 'geojson' | 'obj' | 'json';

export class ExportHub {
  static exportToOpenDrive(engine: RoadWorldEngine): string {
    return OpenDriveExporter.export(engine);
  }

  static exportToSumo(engine: RoadWorldEngine): string {
    return SumoExporter.export(engine);
  }

  static exportToGeoJson(engine: RoadWorldEngine): string {
    return GeoJsonExporter.export(engine);
  }

  static exportToObj(engine: RoadWorldEngine): ObjExportResult {
    return ObjMeshExporter.export(engine);
  }

  static exportToJson(engine: RoadWorldEngine): string {
    return WorldSerializer.serialize(engine);
  }
}

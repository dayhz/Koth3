import { RoadWorldEngine } from '../RoadWorldEngine';
import { GridCityGenerator } from './GridCityGenerator';
import { OrganicCityGenerator } from './OrganicCityGenerator';
import { RadialCityGenerator } from './RadialCityGenerator';
import { GridCityConfig, OrganicCityConfig, RadialCityConfig } from './types';

export class CityBuilder {
  static createGridCity(
    engine: RoadWorldEngine,
    config: Partial<GridCityConfig> = {},
    seed: number = 1234
  ): void {
    const fullConfig: GridCityConfig = {
      rows: config.rows ?? 4,
      cols: config.cols ?? 4,
      blockSizeX: config.blockSizeX ?? 70,
      blockSizeY: config.blockSizeY ?? 50,
      avenueFrequencyX: config.avenueFrequencyX ?? 2,
      avenueFrequencyY: config.avenueFrequencyY ?? 2,
      majorProfile: config.majorProfile,
      minorProfile: config.minorProfile,
    };

    GridCityGenerator.generate(engine.network, fullConfig, seed);
    engine.build();
  }

  static createOrganicCity(
    engine: RoadWorldEngine,
    config: Partial<OrganicCityConfig> = {},
    seed: number = 5432
  ): void {
    const fullConfig: OrganicCityConfig = {
      boundsWidth: config.boundsWidth ?? 220,
      boundsHeight: config.boundsHeight ?? 220,
      mainArteriesCount: config.mainArteriesCount ?? 3,
      branchesPerArtery: config.branchesPerArtery ?? 3,
      curviness: config.curviness ?? 0.6,
      snapDistance: config.snapDistance ?? 10,
      majorProfile: config.majorProfile,
      minorProfile: config.minorProfile,
    };

    OrganicCityGenerator.generate(engine.network, fullConfig, seed);
    engine.build();
  }

  static createRadialCity(
    engine: RoadWorldEngine,
    config: Partial<RadialCityConfig> = {}
  ): void {
    const fullConfig: RadialCityConfig = {
      centerRadius: config.centerRadius ?? 18,
      ringRadii: config.ringRadii ?? [55, 95],
      spokesCount: config.spokesCount ?? 6,
      majorProfile: config.majorProfile,
      minorProfile: config.minorProfile,
    };

    RadialCityGenerator.generate(engine.network, fullConfig);
    engine.build();
  }
}

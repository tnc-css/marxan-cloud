import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { mkdir, rm } from 'fs/promises';
import * as path from 'path';
import * as uuid from 'uuid';
import { runCommandsXL } from 'mapshaper';
import { ScenarioCostSurfaceRepository } from '@marxan/scenario-cost-surface';
import { geoprocessingConnections } from '@marxan-geoprocessing/ormconfig';
import { AppConfig } from '@marxan-geoprocessing/utils/config.utils';
import { assertDefined } from '@marxan/utils';
import { CostTemplateDumper } from './cost-template-dumper';
import { Storage } from './storage';

@Injectable()
export class CostTemplateGenerator {
  constructor(
    @InjectEntityManager(geoprocessingConnections.default)
    private readonly entityManager: EntityManager,
    private readonly scenarioFilesRepository: ScenarioCostSurfaceRepository,
    private readonly scenarioGeoJsonCostTemplateDumper: CostTemplateDumper,
    private readonly storage: Storage,
  ) {}

  async createTemplateShapefile(scenarioId: string) {
    const storagePath = AppConfig.get<string>(
      'storage.sharedFileStorage.localPath',
    );
    assertDefined(storagePath);
    const transformationDirectory = path.join(
      storagePath,
      'cost-templates',
      uuid.v4(),
    );
    await mkdir(transformationDirectory, { recursive: true });

    /**
     * To help users identify shapefile components when dealing with multiple
     * projects/scenarios/cost surface templates, we include scenarioId and a
     * ISO8601-ish timestamp (YYYYMMDDTHHMMSS) in the prefix of each component
     * file.
     */
    const resultFilePrefix = `cost-surface-template_${scenarioId}_${new Date()
      .toISOString()
      .replace(/\..+?Z$/, '')
      .replace(/[:\-.]/g, '')}`;

    try {
      await this.scenarioGeoJsonCostTemplateDumper.dumpGeoJson(
        scenarioId,
        path.join(transformationDirectory, resultFilePrefix + '.json'),
      );

      const shapefileDirectory = path.join(transformationDirectory, `shp`);
      await runCommandsXL(
        [
          `'${path.join(transformationDirectory, resultFilePrefix + `.json`)}'`,
          '-o',
          `'${path.join(shapefileDirectory, resultFilePrefix + `.shp`)}'`,
        ].join(' '),
      );
      await this.storage.save(scenarioId, path.join(shapefileDirectory));
    } finally {
      /**
       * Leave temporary folder on filesystem according to feature flag.
       */
      if (
        AppConfig.getBoolean(
          'storage.sharedFileStorage.cleanupTemporaryFolders',
          true,
        )
      ) {
        await rm(transformationDirectory, {
          recursive: true,
          force: true,
        });
      }
    }
  }
}

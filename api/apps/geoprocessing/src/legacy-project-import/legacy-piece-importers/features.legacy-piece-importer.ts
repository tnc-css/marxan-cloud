import { geoprocessingConnections } from '@marxan-geoprocessing/ormconfig';
import {
  LegacyProjectImportFilesRepository,
  LegacyProjectImportFileType,
  LegacyProjectImportJobInput,
  LegacyProjectImportJobOutput,
  LegacyProjectImportPiece,
} from '@marxan/legacy-project-import';
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { isLeft } from 'fp-ts/lib/Either';
import { DeepPartial, EntityManager } from 'typeorm';
import { v4 } from 'uuid';
import {
  LegacyProjectImportPieceProcessor,
  LegacyProjectImportPieceProcessorProvider,
} from '../pieces/legacy-project-import-piece-processor';
import { ProjectsPuEntity } from '@marxan-jobs/planning-unit-geometry';
import { GeoFeatureGeometry } from '@marxan/geofeatures';
import { chunk } from 'lodash';
import { SpecDatReader } from './file-readers/spec-dat.reader';
import { PuvsprDatReader } from './file-readers/puvspr-dat.reader';

@Injectable()
@LegacyProjectImportPieceProcessorProvider()
export class FeaturesLegacyProjectPieceImporter
  implements LegacyProjectImportPieceProcessor {
  constructor(
    private readonly filesRepo: LegacyProjectImportFilesRepository,
    private readonly specDatReader: SpecDatReader,
    private readonly puvsprDatReader: PuvsprDatReader,
    @InjectEntityManager(geoprocessingConnections.apiDB)
    private readonly apiEntityManager: EntityManager,
    @InjectEntityManager(geoprocessingConnections.default)
    private readonly geoprocessingEntityManager: EntityManager,
    private readonly logger: Logger,
  ) {
    this.logger.setContext(FeaturesLegacyProjectPieceImporter.name);
  }

  isSupported(piece: LegacyProjectImportPiece): boolean {
    return piece === LegacyProjectImportPiece.Features;
  }

  async run(
    input: LegacyProjectImportJobInput,
  ): Promise<LegacyProjectImportJobOutput> {
    const { files, projectId } = input;

    const specFeaturesFileOrError = files.find(
      (file) => file.type === LegacyProjectImportFileType.SpecDat,
    );

    if (!specFeaturesFileOrError) {
      throw new Error('spec.dat not found inside input file array');
    }

    const specFileReadableOrError = await this.filesRepo.get(
      specFeaturesFileOrError.location,
    );

    if (isLeft(specFileReadableOrError)) {
      throw new Error('The spec.dat file provided is malformed or missing.');
    }

    const specDatRowsOrError = await this.specDatReader.readFile(
      specFileReadableOrError.right,
    );

    if (isLeft(specDatRowsOrError)) throw new Error(specDatRowsOrError.left);

    const specDatRows = specDatRowsOrError.right;

    const puvsprFeaturesFileOrError = files.find(
      (file) => file.type === LegacyProjectImportFileType.SpecDat,
    );

    if (!puvsprFeaturesFileOrError) {
      throw new Error('puvspr.dat not found inside input file array');
    }

    const puvsprFileReadableOrError = await this.filesRepo.get(
      puvsprFeaturesFileOrError.location,
    );

    if (isLeft(puvsprFileReadableOrError)) {
      throw new Error('The puvspr.dat file provided is malformed or missing.');
    }
    const puvsprDatRowsOrError = await this.puvsprDatReader.readFile(
      puvsprFileReadableOrError.right,
    );

    if (isLeft(puvsprDatRowsOrError))
      throw new Error(puvsprDatRowsOrError.left);

    const puvsprDatRows = puvsprDatRowsOrError.right;

    await this.apiEntityManager.transaction(async (apiEm) => {
      const insertValues = specDatRows.map((feature) => {
        const featureId = v4();

        return {
          ...feature,
          project_id: projectId,
          featureIntegerId: feature.id,
          id: featureId,
          feature_class_name: feature.name,
          is_custom: true,
        };
      });

      await Promise.all(
        insertValues.map((values) =>
          apiEm
            .createQueryBuilder()
            .insert()
            .into('features')
            .values(values)
            .execute(),
        ),
      );

      const puRepo = this.geoprocessingEntityManager.getRepository(
        ProjectsPuEntity,
      );

      const featuresDataInsertValues: DeepPartial<GeoFeatureGeometry>[] = [];

      await Promise.all(
        insertValues.map(async (feature) => {
          const filteredPuvspr = puvsprDatRows.filter(
            (row) => row.species === feature.featureIntegerId,
          );

          await Promise.all(
            filteredPuvspr.map(async (filteredRow) => {
              const puUnit = await puRepo.findOneOrFail({
                puid: +filteredRow.pu,
                projectId,
              });
              featuresDataInsertValues.push({
                id: v4(),
                featureId: feature.id,
                theGeom: puUnit.puGeom.theGeom,
                properties: {
                  name: feature.feature_class_name,
                  id: feature.featureIntegerId,
                },
              });
            }),
          );
        }),
      );

      const chunkSize = 1000;
      await Promise.all(
        chunk(featuresDataInsertValues, chunkSize).map((values) =>
          this.geoprocessingEntityManager
            .createQueryBuilder()
            .insert()
            .into(GeoFeatureGeometry)
            .values(values)
            .execute(),
        ),
      );
    });

    return input;
  }
}

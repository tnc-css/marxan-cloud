import { ProjectsPuEntity } from '@marxan-jobs/planning-unit-geometry';
import {
  LegacyProjectImportFilesRepository,
  LegacyProjectImportFileType,
  LegacyProjectImportJobInput,
  LegacyProjectImportJobOutput,
  LegacyProjectImportPiece,
} from '@marxan/legacy-project-import';
import {
  ScenariosPuCostDataGeo,
  ScenariosPuPaDataGeo,
  toLockEnum,
} from '@marxan/scenarios-planning-unit';
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { isLeft } from 'fp-ts/lib/These';
import { chunk } from 'lodash';
import { EntityManager, In, Repository } from 'typeorm';
import { v4 } from 'uuid';
import { geoprocessingConnections } from '../../ormconfig';
import {
  LegacyProjectImportPieceProcessor,
  LegacyProjectImportPieceProcessorProvider,
} from '../pieces/legacy-project-import-piece-processor';
import { PuDatReader, PuDatRow } from './file-readers/pu-dat.reader';

@Injectable()
@LegacyProjectImportPieceProcessorProvider()
export class ScenarioPusDataLegacyProjectPieceImporter
  implements LegacyProjectImportPieceProcessor {
  constructor(
    private readonly filesRepo: LegacyProjectImportFilesRepository,
    private readonly puDatReader: PuDatReader,
    @InjectEntityManager(geoprocessingConnections.default.name)
    private readonly geoEntityManager: EntityManager,
    private readonly logger: Logger,
  ) {
    this.logger.setContext(ScenarioPusDataLegacyProjectPieceImporter.name);
  }

  isSupported(piece: LegacyProjectImportPiece): boolean {
    return piece === LegacyProjectImportPiece.ScenarioPusData;
  }

  private logAndThrow(message: string): never {
    this.logger.error(message);
    throw new Error(message);
  }

  private getNotFoundPuids(
    rows: PuDatRow[],
    projectPuIdByPuid: Record<number, string>,
  ) {
    return rows
      .filter((row) => projectPuIdByPuid[row.id] === undefined)
      .map((row) => row.id);
  }

  private async getProjectPusMap(
    repo: Repository<ProjectsPuEntity>,
    projectId: string,
  ): Promise<Record<number, string>> {
    const projectPus = await repo.find({
      where: { projectId },
    });
    const projectPuIdByPuid: Record<number, string> = {};
    projectPus.forEach((pu) => {
      projectPuIdByPuid[pu.puid] = pu.id;
    });

    return projectPuIdByPuid;
  }

  private async insertScenarioPuData(
    repo: Repository<ScenariosPuPaDataGeo>,
    rows: PuDatRow[],
    projectPuIdByPuid: Record<number, string>,
    scenarioId: string,
  ): Promise<Record<number, string>> {
    const scenarioPuDataIdByPuid: Record<number, string> = {};
    const insertValues = rows
      .filter((row) => Boolean(projectPuIdByPuid[row.id]))
      .map((row) => {
        const id = v4();
        scenarioPuDataIdByPuid[row.id] = id;
        const projectPuId = projectPuIdByPuid[row.id];

        return {
          id,
          projectPuId,
          scenarioId,
          lockStatus:
            row.status !== undefined ? toLockEnum[row.status] : undefined,
          xloc: row.xloc,
          yloc: row.yloc,
        };
      });

    await repo.save(insertValues);

    return scenarioPuDataIdByPuid;
  }

  private async insertScenarioPuCostData(
    repo: Repository<ScenariosPuCostDataGeo>,
    rows: PuDatRow[],
    scenarioPuDataIdByPuid: Record<number, string>,
  ): Promise<Record<number, string>> {
    const insertValues = rows
      .filter((row) => Boolean(scenarioPuDataIdByPuid[row.id]))
      .map((row) => {
        const scenariosPuDataId = scenarioPuDataIdByPuid[row.id];

        return {
          cost: row.cost,
          scenariosPuDataId,
        };
      });

    await repo.save(insertValues);

    return scenarioPuDataIdByPuid;
  }

  private checkPuidsUniqueness(rows: PuDatRow[]): number[] {
    const duplicatePuids = new Set<number>();
    const knownPuids: Record<number, true> = {};

    rows.forEach((row) => {
      const { id } = row;

      const knownPuid = knownPuids[id];

      if (knownPuid) duplicatePuids.add(id);
      else knownPuids[id] = true;
    });

    return Array.from(duplicatePuids);
  }

  private checkThatEveryProjectPuIsInPuDatRows(
    projectPuIdByPuid: Record<number, string>,
    rows: PuDatRow[],
  ): number[] {
    const projectPusPuids = new Set<number>(
      Object.keys(projectPuIdByPuid).map((id) => parseInt(id)),
    );

    rows.forEach((row) => projectPusPuids.delete(row.id));

    return Array.from(projectPusPuids);
  }

  async run(
    input: LegacyProjectImportJobInput,
  ): Promise<LegacyProjectImportJobOutput> {
    const puDatFile = input.files.find(
      (file) => file.type === LegacyProjectImportFileType.PuDat,
    );

    if (!puDatFile)
      this.logAndThrow('pu.dat file not found inside input files array');

    const readable = await this.filesRepo.get(puDatFile.location);
    if (isLeft(readable))
      this.logAndThrow('pu.dat file not found in files repo');

    const rowsOrError = await this.puDatReader.readFile(readable.right);
    if (isLeft(rowsOrError)) this.logAndThrow(rowsOrError.left);

    const duplicatePuids = this.checkPuidsUniqueness(rowsOrError.right);
    if (duplicatePuids.length)
      this.logAndThrow(
        `pu.dat file contains rows with the same puid. Duplicate puids: ${duplicatePuids.join(
          ', ',
        )}`,
      );

    const notFoundPuids: number[] = [];

    await this.geoEntityManager.transaction(async (em) => {
      const chunkSize = 2500;
      const projectsPuRepo = em.getRepository(ProjectsPuEntity);
      const scenariosPuDataRepo = em.getRepository(ScenariosPuPaDataGeo);
      const scenariosPuCostDataRepo = em.getRepository(ScenariosPuCostDataGeo);
      const projectPuIdByPuid = await this.getProjectPusMap(
        projectsPuRepo,
        input.projectId,
      );

      const puidsNotPresentInPuDat = this.checkThatEveryProjectPuIsInPuDatRows(
        projectPuIdByPuid,
        rowsOrError.right,
      );
      if (puidsNotPresentInPuDat.length)
        this.logAndThrow(
          `pu.dat file is missing planning units data. Missing puids: ${puidsNotPresentInPuDat.join(
            ', ',
          )}`,
        );

      await Promise.all(
        chunk(rowsOrError.right, chunkSize).map(async (chunk) => {
          const notFound = this.getNotFoundPuids(chunk, projectPuIdByPuid);
          notFoundPuids.push(...notFound);

          const scenarioPuDataIdByPuid = await this.insertScenarioPuData(
            scenariosPuDataRepo,
            chunk,
            projectPuIdByPuid,
            input.scenarioId,
          );

          await this.insertScenarioPuCostData(
            scenariosPuCostDataRepo,
            chunk,
            scenarioPuDataIdByPuid,
          );
        }),
      );
    });
    return {
      ...input,
      warnings: notFoundPuids.length
        ? [`Some planning units were not found: ${notFoundPuids.join(', ')}`]
        : [],
    };
  }
}
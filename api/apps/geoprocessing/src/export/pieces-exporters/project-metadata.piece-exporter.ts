import { geoprocessingConnections } from '@marxan-geoprocessing/ormconfig';
import { ClonePiece, ExportJobInput, ExportJobOutput } from '@marxan/cloning';
import { ComponentLocation, ResourceKind } from '@marxan/cloning/domain';
import { ClonePieceRelativePathResolver } from '@marxan/cloning/infrastructure/clone-piece-data';
import { ProjectMetadataContent } from '@marxan/cloning/infrastructure/clone-piece-data/project-metadata';
import { CloningFilesRepository } from '@marxan/cloning-files-repository';
import { PlanningUnitGridShape } from '@marxan/scenarios-planning-unit';
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { isLeft } from 'fp-ts/Either';
import { Readable } from 'stream';
import { EntityManager } from 'typeorm';
import {
  ExportPieceProcessor,
  PieceExportProvider,
} from '../pieces/export-piece-processor';

type SelectProjectBlmResult = {
  defaults: number[];
  values: number[];
  range: number[];
};

@Injectable()
@PieceExportProvider()
export class ProjectMetadataPieceExporter implements ExportPieceProcessor {
  constructor(
    private readonly fileRepository: CloningFilesRepository,
    @InjectEntityManager(geoprocessingConnections.apiDB)
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
  ) {
    this.logger.setContext(ProjectMetadataPieceExporter.name);
  }

  isSupported(piece: ClonePiece, kind: ResourceKind): boolean {
    return (
      piece === ClonePiece.ProjectMetadata && kind === ResourceKind.Project
    );
  }

  async run(input: ExportJobInput): Promise<ExportJobOutput> {
    const projectId = input.resourceId;
    const [projectData]: {
      name: string;
      description: string;
      planning_unit_grid_shape: PlanningUnitGridShape;
    }[] = await this.entityManager
      .createQueryBuilder()
      .select(['name', 'description', 'planning_unit_grid_shape'])
      .from('projects', 'p')
      .where('id = :projectId', { projectId })
      .execute();

    if (!projectData) {
      const errorMessage = `${ProjectMetadataPieceExporter.name} - Project ${projectId} does not exist.`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    const [blmRange]: [
      SelectProjectBlmResult,
    ] = await this.entityManager
      .createQueryBuilder()
      .select(['values', 'defaults', 'range'])
      .from('project_blms', 'pblms')
      .where('id = :projectId', { projectId })
      .execute();

    if (!blmRange) {
      const errorMessage = `${ProjectMetadataPieceExporter.name} - Blm for project with id ${projectId} does not exist.`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    const fileContent: ProjectMetadataContent = {
      name: projectData.name,
      description: projectData.description,
      planningUnitGridShape: projectData.planning_unit_grid_shape,
      blmRange,
    };

    const relativePath = ClonePieceRelativePathResolver.resolveFor(
      ClonePiece.ProjectMetadata,
    );

    const outputFile = await this.fileRepository.saveCloningFile(
      input.exportId,
      Readable.from(JSON.stringify(fileContent)),
      relativePath,
    );

    if (isLeft(outputFile)) {
      const errorMessage = `${ProjectMetadataPieceExporter.name} - Project - couldn't save file - ${outputFile.left.description}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    return {
      ...input,
      uris: [new ComponentLocation(outputFile.right, relativePath)],
    };
  }
}

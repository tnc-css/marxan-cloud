import { ResourceId, ResourceKind } from '@marxan/cloning/domain';
import { ProjectExportConfigContent } from '@marxan/cloning/infrastructure/clone-piece-data/export-config';
import {
  CommandHandler,
  EventPublisher,
  IInferredCommandHandler,
} from '@nestjs/cqrs';
import { Either, isLeft, right } from 'fp-ts/Either';
import { Import } from '../domain/import/import';
import { ExportConfigReader } from './export-config-reader';
import { ImportProject, ImportProjectError } from './import-project.command';
import { ImportResourcePieces } from './import-resource-pieces.port';
import { ImportRepository } from './import.repository.port';

@CommandHandler(ImportProject)
export class ImportProjectHandler
  implements IInferredCommandHandler<ImportProject> {
  constructor(
    private readonly exportConfigReader: ExportConfigReader,
    private readonly importRepo: ImportRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly importResourcePieces: ImportResourcePieces,
  ) {}

  async execute({
    archiveLocation,
  }: ImportProject): Promise<Either<ImportProjectError, string>> {
    const exportConfigOrError = await this.exportConfigReader.read(
      archiveLocation,
    );
    if (isLeft(exportConfigOrError)) return exportConfigOrError;

    const exportConfig = exportConfigOrError.right as ProjectExportConfigContent;
    const resourceId = ResourceId.create();

    const pieces = this.importResourcePieces.resolveForProject(
      resourceId,
      archiveLocation,
      exportConfig.scenarios,
    );

    const importRequest = this.eventPublisher.mergeObjectContext(
      Import.newOne(resourceId, ResourceKind.Project, archiveLocation, pieces),
    );

    importRequest.run();

    const result = await this.importRepo.save(importRequest);

    if (isLeft(result)) return result;

    importRequest.commit();

    return right(importRequest.importId.value);
  }
}
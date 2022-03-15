import { geoprocessingConnections } from '@marxan-geoprocessing/ormconfig';
import { ClonePiece, ImportJobInput, ImportJobOutput } from '@marxan/cloning';
import { ResourceKind } from '@marxan/cloning/domain';
import { ProjectCustomProtectedAreasContent } from '@marxan/cloning/infrastructure/clone-piece-data/project-custom-protected-areas';
import { FileRepository } from '@marxan/files-repository';
import { extractFile } from '@marxan/utils';
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { isLeft } from 'fp-ts/lib/Either';
import { EntityManager } from 'typeorm';
import {
  ImportPieceProcessor,
  PieceImportProvider,
} from '../pieces/import-piece-processor';

@Injectable()
@PieceImportProvider()
export class ProjectCustomProtectedAreasPieceImporter
  implements ImportPieceProcessor {
  constructor(
    private readonly fileRepository: FileRepository,
    @InjectEntityManager(geoprocessingConnections.default)
    private readonly geoprocessingEntityManager: EntityManager,
    private readonly logger: Logger,
  ) {
    this.logger.setContext(ProjectCustomProtectedAreasPieceImporter.name);
  }

  isSupported(piece: ClonePiece, kind: ResourceKind): boolean {
    return (
      piece === ClonePiece.ProjectCustomProtectedAreas &&
      kind === ResourceKind.Project
    );
  }

  async run(input: ImportJobInput): Promise<ImportJobOutput> {
    const { uris, importResourceId, piece } = input;

    if (uris.length !== 1) {
      const errorMessage = `uris array has an unexpected amount of elements: ${uris.length}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    const [customProjectProtectedAreasLocation] = uris;

    const readableOrError = await this.fileRepository.get(
      customProjectProtectedAreasLocation.uri,
    );
    if (isLeft(readableOrError)) {
      const errorMessage = `File with piece data for ${piece}/${importResourceId} is not available at ${customProjectProtectedAreasLocation.uri}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    const customProjectProtectedAreasrError = await extractFile(
      readableOrError.right,
      customProjectProtectedAreasLocation.relativePath,
    );
    if (isLeft(customProjectProtectedAreasrError)) {
      const errorMessage = `Custom planning area file extraction failed: ${customProjectProtectedAreasLocation.relativePath}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    const customProjectProtectedAreas: ProjectCustomProtectedAreasContent[] = JSON.parse(
      customProjectProtectedAreasrError.right,
    );

    if (customProjectProtectedAreas.length) {
      await this.geoprocessingEntityManager.transaction(async (em) => {
        const fullNameGeomtriesValues = customProjectProtectedAreas.map(
          this.parseCustomProjectProtectedAreas,
        );
        await em.query(
          `
        INSERT INTO wdpa(project_id,full_name,the_geom)
            SELECT '${importResourceId}' as project_id,
            (protectedArea ->> 'fullName')::text as full_name,
            ST_GeomFromEwkb((protectedArea ->> 'geom')::bytea) as the_geom
            FROM json_array_elements($1) as protectedArea
      `,
          [JSON.stringify(fullNameGeomtriesValues)],
        );
      });
    }

    return {
      importId: input.importId,
      componentId: input.componentId,
      importResourceId,
      componentResourceId: input.componentResourceId,
      piece: input.piece,
    };
  }

  private parseCustomProjectProtectedAreas(
    customProtecteArea: ProjectCustomProtectedAreasContent,
  ) {
    return {
      fullName: customProtecteArea.fullName,
      geom: '\\x' + Buffer.from(customProtecteArea.ewkb).toString('hex'),
    };
  }
}

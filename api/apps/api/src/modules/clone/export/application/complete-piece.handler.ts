import {
  CommandHandler,
  EventBus,
  EventPublisher,
  IInferredCommandHandler,
} from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { CompletePiece } from './complete-piece.command';
import { ExportRepository } from './export-repository.port';
import { isLeft } from 'fp-ts/Either';
import { ExportPieceFailed } from '@marxan-api/modules/clone/export/application/export-piece-failed.event';
import { Export } from '../domain';

@CommandHandler(CompletePiece)
export class CompletePieceHandler
  implements IInferredCommandHandler<CompletePiece> {
  constructor(
    private readonly exportRepository: ExportRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
  ) {
    this.logger.setContext(CompletePieceHandler.name);
  }

  async execute({
    exportId,
    componentLocation,
    componentId,
  }: CompletePiece): Promise<void> {
    let exportInstance: Export | undefined;
    await this.exportRepository
      .transaction(async (repo) => {
        exportInstance = await repo.find(exportId);

        if (!exportInstance) {
          const errorMessage = `${CompletePieceHandler.name} could not find export ${exportId.value} to complete piece: ${componentId.value}`;
          this.logger.error(errorMessage);
          throw new Error(errorMessage);
        }

        const exportAggregate = this.eventPublisher.mergeObjectContext(
          exportInstance,
        );

        const result = exportAggregate.completeComponent(
          componentId,
          componentLocation,
        );
        if (isLeft(result)) {
          throw new Error(
            `Could not find piece with ID: ${componentId} for export with ID: ${exportId}`,
          );
        }

        await repo.save(exportAggregate);

        exportAggregate.commit();
      })
      .catch(() => {
        if (exportInstance) {
          this.eventBus.publish(
            new ExportPieceFailed(
              exportId,
              componentId,
              exportInstance.resourceId,
              exportInstance.resourceKind,
              componentLocation,
            ),
          );
        }
      });
  }
}
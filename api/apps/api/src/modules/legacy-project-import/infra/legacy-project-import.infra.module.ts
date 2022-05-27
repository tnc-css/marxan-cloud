import { ApiEventsModule } from '@marxan-api/modules/api-events';
import { QueueApiEventsModule } from '@marxan-api/modules/queue-api-events';
import { Logger, Module, Scope } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { failedLegacyProjectImportDbCleanupQueueProvider } from './failed-legacy-project-import-db-cleanup-queue.provider';
import { LegacyProjectImportBatchFailedSaga } from './legacy-project-import-batch-failed.saga';
import { LegacyProjectImportPieceRequestedSaga } from './legacy-project-import-piece-requested.saga';
import {
  importLegacyProjectPieceEventsFactoryProvider,
  importLegacyProjectPiecenQueueEventsProvider,
  importLegacyProjectPieceQueueProvider,
} from './legacy-project-import-queue.provider';
import { ScheduleDbCleanupForFailedLegacyProjectImportHandler } from './schedule-db-cleanup-for-failed-legacy-project-import.handler';
import { LegacyProjectImportRepositoryModule } from './legacy-project-import.repository.module';
import { ScheduleLegacyProjectImportPieceHandler } from './schedule-legacy-project-import-piece.handler';

@Module({
  imports: [
    ApiEventsModule,
    QueueApiEventsModule,
    CqrsModule,
    LegacyProjectImportRepositoryModule,
  ],
  providers: [
    importLegacyProjectPieceQueueProvider,
    importLegacyProjectPiecenQueueEventsProvider,
    importLegacyProjectPieceEventsFactoryProvider,
    failedLegacyProjectImportDbCleanupQueueProvider,
    LegacyProjectImportBatchFailedSaga,
    ScheduleDbCleanupForFailedLegacyProjectImportHandler,
    LegacyProjectImportPieceRequestedSaga,
    ScheduleLegacyProjectImportPieceHandler,
    {
      provide: Logger,
      useClass: Logger,
      scope: Scope.TRANSIENT,
    },
  ],
})
export class LegacyProjectImportInfraModule {}
import {
  DynamicModule,
  ConsoleLogger,
  Module,
  ModuleMetadata,
  Scope,
} from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AllPiecesReadySaga } from './all-pieces-ready.saga';
import { CompleteExportPieceHandler } from './complete-export-piece.handler';
import { ExportProjectHandler } from './export-project.handler';
import { ExportScenarioHandler } from './export-scenario.handler';
import { FinalizeArchiveHandler } from './finalize-archive.handler';
import { GetArchiveHandler } from './get-archive.handler';

@Module({})
export class ExportApplicationModule {
  static for(adapters: ModuleMetadata['imports']): DynamicModule {
    return {
      module: ExportApplicationModule,
      imports: [CqrsModule, ...(adapters ?? [])],
      providers: [
        // internal event flow
        AllPiecesReadySaga,
        // use cases
        ExportProjectHandler,
        ExportScenarioHandler,
        CompleteExportPieceHandler,
        FinalizeArchiveHandler,
        GetArchiveHandler,
        {
          provide: ConsoleLogger,
          useClass: ConsoleLogger,
          scope: Scope.TRANSIENT,
        },
      ],
      exports: [],
    };
  }
}

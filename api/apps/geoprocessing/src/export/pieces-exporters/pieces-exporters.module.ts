import { geoprocessingConnections } from '@marxan-geoprocessing/ormconfig';
import { FileRepositoryModule } from '@marxan/files-repository';
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportConfigProjectPieceExporter } from './export-config.project-piece-exporter';
import { ExportConfigScenarioPieceExporter } from './export-config.scenario-piece-exporter';
import { PlanningAreaCustomGeojsonPieceExporter } from './planning-area-custom-geojson.piece-exporter';
import { PlanningAreaCustomPieceExporter } from './planning-area-custom.piece-exporter';
import { PlanningAreaGadmPieceExporter } from './planning-area-gadm.piece-exporter';
import { PlanningUnitsGridGeojsonPieceExporter } from './planning-units-grid-geojson.piece-exporter';
import { PlanningUnitsGridPieceExporter } from './planning-units-grid.piece-exporter';
import { ProjectCustomFeaturesPieceExporter } from './project-custom-features.piece-exporter';
import { ProjectCustomProtectedAreasPieceExporter } from './project-custom-protected-areas.piece-exporter';
import { ProjectMetadataPieceExporter } from './project-metadata.piece-exporter';
import { ScenarioMetadataPieceExporter } from './scenario-metadata.piece-exporter';
import { ScenarioPlanningUnitsDataPieceExporter } from './scenario-planning-units-data.piece-exporter';
import { ScenarioProtectedAreasPieceExporter } from './scenario-protected-areas.piece-exporter';
import { ScenarioRunResultsPieceExporter } from './scenario-run-results.piece-exporter';

@Module({
  imports: [
    FileRepositoryModule,
    TypeOrmModule.forFeature([], geoprocessingConnections.apiDB),
    TypeOrmModule.forFeature([], geoprocessingConnections.default),
  ],
  providers: [
    ProjectMetadataPieceExporter,
    ExportConfigProjectPieceExporter,
    ExportConfigScenarioPieceExporter,
    ProjectCustomFeaturesPieceExporter,
    PlanningAreaGadmPieceExporter,
    PlanningAreaCustomPieceExporter,
    PlanningAreaCustomGeojsonPieceExporter,
    PlanningUnitsGridPieceExporter,
    PlanningUnitsGridGeojsonPieceExporter,
    ProjectCustomProtectedAreasPieceExporter,
    ScenarioMetadataPieceExporter,
    ScenarioProtectedAreasPieceExporter,
    ScenarioRunResultsPieceExporter,
    ScenarioPlanningUnitsDataPieceExporter,
    Logger,
  ],
})
export class PiecesExportersModule {}

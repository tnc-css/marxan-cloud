import { v4 } from 'uuid';
import { AggregateRoot } from '@nestjs/cqrs';
import { Either, left, right } from 'fp-ts/Either';

import { ResourceKind } from '../../../shared-kernel/resource.kind';
import { ExportId } from './export.id';
import { ResourceId } from '../../../shared-kernel/resource.id';
import { ArchiveLocation } from '../../../shared-kernel/archive-location';

import { ExportComponentRequested } from '../events/export-component-requested.event';
import { ExportComponentFinished } from '../events/export-component-finished.event';
import { ArchiveReady } from '../events/archive-ready.event';

import { ComponentLocation } from '../../../shared-kernel/component-location';
import { ExportComponent } from './export-component/export-component';
import { ComponentId } from '../../../shared-kernel/component.id';
import { ExportSnapshot } from './export.snapshot';
import { ExportComponentSnapshot } from '@marxan-api/modules/clone/export/domain';

export const pieceNotFound = Symbol('export piece not found');
export const notReady = Symbol('some pieces of export are not yet ready');

export class Export extends AggregateRoot {
  #pieces: ExportComponent[] = [];

  private constructor(
    public readonly id: ExportId,
    public readonly resourceId: ResourceId,
    public readonly resourceKind: ResourceKind,
    pieces: ExportComponentSnapshot[],
    private archiveLocation?: ArchiveLocation,
  ) {
    super();
    this.#pieces = pieces.map((snapshot) =>
      ExportComponent.fromSnapshot(snapshot),
    );
  }

  static newOne(
    id: ResourceId,
    kind: ResourceKind,
    parts: ExportComponentSnapshot[],
  ): Export {
    const exportRequest = new Export(new ExportId(v4()), id, kind, parts);

    parts
      .filter((part) => !part.finished)
      .map(
        (part) =>
          new ExportComponentRequested(
            exportRequest.id,
            part.id,
            new ResourceId(part.resourceId),
            part.piece,
          ),
      )
      .forEach((event) => exportRequest.apply(event));

    return exportRequest;
  }

  completeComponent(
    id: ComponentId,
    pieceLocation: ComponentLocation,
  ): Either<typeof pieceNotFound, true> {
    const piece = this.#pieces.find((piece) => piece.id.equals(id));
    if (!piece) {
      return left(pieceNotFound);
    }
    piece.finish(pieceLocation);

    if (this.#allPiecesReady()) {
      this.apply(new ExportComponentFinished(this.id));
    }

    return right(true);
  }

  complete(archiveLocation: ArchiveLocation): Either<typeof notReady, true> {
    if (!this.#allPiecesReady()) {
      return left(notReady);
    }
    this.archiveLocation = archiveLocation;
    this.apply(new ArchiveReady(this.id, this.archiveLocation));
    return right(true);
  }

  toSnapshot(): ExportSnapshot {
    return {
      id: this.id.value,
      resourceId: this.resourceId.value,
      resourceKind: this.resourceKind,
      exportPieces: this.#pieces.map((piece) => piece.toSnapshot()),
      archiveLocation: this.archiveLocation?.value,
    };
  }

  static fromSnapshot(snapshot: ExportSnapshot): Export {
    return new Export(
      new ExportId(snapshot.id),
      new ResourceId(snapshot.resourceId),
      snapshot.resourceKind,
      snapshot.exportPieces,
      snapshot.archiveLocation
        ? new ArchiveLocation(snapshot.archiveLocation)
        : undefined,
    );
  }

  #allPiecesReady = () => this.#pieces.every((piece) => piece.isReady());
}

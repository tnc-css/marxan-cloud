import {
  ClonePiece,
  ComponentId,
  ComponentLocation,
  ResourceId,
} from '@marxan/cloning/domain';
import { ImportComponentSnapshot } from '../import/import-component.snapshot';

export class ImportComponent {
  private constructor(
    readonly id: ComponentId,
    readonly piece: ClonePiece,
    readonly resourceId: ResourceId,
    readonly order: number,
    readonly uris: ComponentLocation[],
    private finished: boolean = false,
  ) {}

  static fromSnapshot(snapshot: ImportComponentSnapshot) {
    return new ImportComponent(
      new ComponentId(snapshot.id),
      snapshot.piece,
      new ResourceId(snapshot.resourceId),
      snapshot.order,
      snapshot.uris.map(ComponentLocation.fromSnapshot),
      snapshot.finished,
    );
  }

  static newOne(
    resourceId: ResourceId,
    piece: ClonePiece,
    order: number,
    uris: ComponentLocation[],
  ): ImportComponent {
    return new ImportComponent(
      ComponentId.create(),
      piece,
      resourceId,
      order,
      uris,
    );
  }

  isReady() {
    return this.finished;
  }

  complete() {
    this.finished = true;
  }

  toSnapshot(): ImportComponentSnapshot {
    return {
      id: this.id.value,
      order: this.order,
      finished: this.finished,
      piece: this.piece,
      resourceId: this.resourceId.value,
      uris: this.uris,
    };
  }
}

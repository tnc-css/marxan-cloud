import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Worker } from 'bullmq';

import { JobInput, costSurfaceQueueName } from '@marxan/artifact-cache';
import { WorkerBuilder } from '@marxan-geoprocessing/modules/worker';

import { SurfaceCostProcessor } from './surface-cost-processor';

@Injectable()
export class SurfaceCostWorker {
  #worker: Worker;

  constructor(
    private readonly wrapper: WorkerBuilder,
    private readonly processor: SurfaceCostProcessor,
    private readonly eventBus: EventBus,
  ) {
    this.#worker = wrapper.build(costSurfaceQueueName, processor);
  }
}

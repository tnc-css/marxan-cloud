import { Injectable, OnModuleDestroy, Scope } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { Config } from './config';
import { WorkerProcessor } from './worker-processor';

@Injectable({
  scope: Scope.TRANSIENT,
})
export class WorkerResolver implements OnModuleDestroy {
  private _worker?: Worker;

  constructor(private readonly config: Config) {}

  wrap<Input, Output>(
    queueName: string,
    processor: WorkerProcessor<Input, Output>,
  ): Worker<Input, Output> {
    if (this._worker) {
      throw new Error('Worker is already created!');
    }
    this._worker = new Worker<Input, Output>(
      queueName,
      (job: Job) => processor.process(job),
      this.config.redis,
    );
    return this._worker as Worker<Input, Output>;
  }

  async onModuleDestroy(): Promise<void> {
    if (this._worker) {
      await this._worker.close();
      await this._worker.disconnect();
    }
  }
}

import { FactoryProvider } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';
import { JobData, queueName } from '@marxan/scenario-run-queue';
import { MarxanParametersDefaults } from '@marxan/marxan-input';
import { QueueBuilder, QueueEventsBuilder } from '@marxan-api/modules/queue';
import { blmDefaultToken, runEventsToken, runQueueToken } from './tokens';

export const runQueueProvider: FactoryProvider<Queue<JobData>> = {
  provide: runQueueToken,
  useFactory: (queueBuilder: QueueBuilder<JobData>) => {
    return queueBuilder.buildQueue(queueName);
  },
  inject: [QueueBuilder],
};
export const runQueueEventsProvider: FactoryProvider<QueueEvents> = {
  provide: runEventsToken,
  useFactory: (eventsBuilder: QueueEventsBuilder) => {
    return eventsBuilder.buildQueueEvents(queueName);
  },
  inject: [QueueEventsBuilder],
};
export const blmDefaultProvider: FactoryProvider<number> = {
  provide: blmDefaultToken,
  useFactory: () => {
    const defaults = new MarxanParametersDefaults();
    return defaults.BLM;
  },
};
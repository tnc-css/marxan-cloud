import { Injectable } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';
import { ApiEventsService } from '@marxan-api/modules/api-events/api-events.service';
import { EventFactory, QueueEventsAdapter } from './adapter';

export type CreateWithEventFactory<JobData, Result = unknown> = (
  eventFactory: EventFactory<JobData, Result>,
) => QueueEventsAdapter<JobData, Result>;

@Injectable()
export class AdapterFactory {
  constructor(private readonly apiEvents: ApiEventsService) {}

  create<JobData>(
    queue: Queue<JobData>,
    queueEvents: QueueEvents,
  ): CreateWithEventFactory<JobData> {
    return (eventFactory) => {
      return new QueueEventsAdapter<JobData>(
        queue,
        queueEvents,
        this.apiEvents,
        eventFactory,
      );
    };
  }
}

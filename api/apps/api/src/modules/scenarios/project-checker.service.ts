import { Injectable, NotFoundException } from '@nestjs/common';
import { In, Repository } from 'typeorm';

import { API_EVENT_KINDS } from '@marxan/api-events';
import { ApiEventsService } from '@marxan-api/modules/api-events';
import { Either, left, right } from 'fp-ts/Either';
import { Project } from '@marxan-api/modules/projects/project.api.entity';
import { InjectRepository } from '@nestjs/typeorm';

export const doesntExist = Symbol(`doesn't exist`);
export type DoesntExist = typeof doesntExist;

@Injectable()
export class ProjectChecker {
  constructor(
    private readonly apiEvents: ApiEventsService,
    @InjectRepository(Project)
    protected readonly repository: Repository<Project>,
  ) {}

  async isProjectReady(
    projectId: string,
  ): Promise<Either<DoesntExist, boolean>> {
    const project = await this.repository.findOne(projectId);
    if (project === undefined) {
      return left(doesntExist);
    }
    const planningUnitEvent = await this.apiEvents
      .getLatestEventForTopic({
        topic: projectId,
        kind: In([
          API_EVENT_KINDS.project__planningUnits__failed__v1__alpha,
          API_EVENT_KINDS.project__planningUnits__finished__v1__alpha,
          API_EVENT_KINDS.project__planningUnits__submitted__v1__alpha,
        ]),
      })
      .catch(this.createNotFoundHandler());
    const gridEvent = await this.apiEvents
      .getLatestEventForTopic({
        topic: projectId,
        kind: In([
          API_EVENT_KINDS.project__grid__failed__v1__alpha,
          API_EVENT_KINDS.project__grid__finished__v1__alpha,
          API_EVENT_KINDS.project__grid__submitted__v1__alpha,
        ]),
      })
      .catch(this.createNotFoundHandler());
    return right(
      ProjectChecker.hasRequiredStudyArea(project) &&
        planningUnitEvent?.kind ===
          API_EVENT_KINDS.project__planningUnits__finished__v1__alpha &&
        (gridEvent === undefined ||
          gridEvent.kind ===
            API_EVENT_KINDS.project__grid__finished__v1__alpha),
    );
  }

  private createNotFoundHandler() {
    return (error: unknown) => {
      if (!(error instanceof NotFoundException)) throw error;
      return undefined;
    };
  }

  private static hasRequiredStudyArea({
    countryId,
    planningAreaId,
  }: Project): boolean {
    return !!(countryId || planningAreaId);
  }
}
import { Injectable } from '@nestjs/common';
import { Either, left, right } from 'fp-ts/Either';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectBlm } from './project-blm.api.entity';
import {
  alreadyCreated,
  CreateFailure,
  GetProjectFailure,
  ProjectBlmRepo,
  projectNotFound,
  SaveFailure,
} from '../../blm-repos';

@Injectable()
export class TypeormProjectBlmRepository extends ProjectBlmRepo {
  constructor(
    @InjectRepository(ProjectBlm)
    private readonly repository: Repository<ProjectBlm>,
  ) {
    super();
  }
  async get(projectId: string): Promise<Either<GetProjectFailure, ProjectBlm>> {
    const projectBlm = await this.repository.findOne(projectId);

    return projectBlm ? right(projectBlm) : left(projectNotFound);
  }

  async create(
    projectId: string,
    defaults: ProjectBlm['defaults'],
  ): Promise<Either<CreateFailure, true>> {
    if (await this.repository.findOne(projectId)) return left(alreadyCreated);

    const projectBlm = await this.repository.create();
    projectBlm.id = projectId;
    projectBlm.defaults = defaults;
    projectBlm.values = [];
    projectBlm.range = [0.001, 100];
    await this.repository.save(projectBlm);

    return right(true);
  }

  async update(
    projectId: string,
    range: ProjectBlm['range'],
    values: ProjectBlm['values'],
  ): Promise<Either<SaveFailure, true>> {
    const result = await this.repository.update(
      { id: projectId },
      { range, values },
    );

    return Boolean(result.affected) ? right(true) : left(projectNotFound);
  }
}

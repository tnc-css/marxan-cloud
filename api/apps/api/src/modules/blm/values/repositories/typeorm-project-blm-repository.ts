import { Injectable } from '@nestjs/common';
import { Either, left, right } from 'fp-ts/Either';

import {
  ProjectBlmRepository,
  GetFailure,
  SaveFailure,
  CreateFailure,
  alreadyCreated,
} from './project-blm-repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectBlm } from './project-blm.api.entity';

@Injectable()
export class TypeormProjectBlmRepository extends ProjectBlmRepository {
  constructor(
    @InjectRepository(ProjectBlm)
    private readonly repository: Repository<ProjectBlm>,
  ) {
    super();
  }
  async get(projectId: string): Promise<Either<GetFailure, ProjectBlm>> {
    return right({
      id: projectId,
      range: [0, 0],
      values: [0, 0, 0, 0, 0, 0],
      defaults: [0, 0, 0, 0, 0, 0],
    });
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
    projectBlm.range = [0, 0];
    await this.repository.insert(projectBlm);

    return right(true);
  }

  async update(
    projectId: string,
    range: ProjectBlm['range'],
    values: ProjectBlm['values'],
  ): Promise<Either<SaveFailure, true>> {
    return right(true);
  }
}

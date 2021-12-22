import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { intersection } from 'lodash';
import { Not, Repository } from 'typeorm';
import { Permit } from '@marxan-api/modules/access-control/access-control.types';
import { UsersScenariosApiEntity } from '@marxan-api/modules/access-control/scenarios-acl/entity/users-scenarios.api.entity';
import { ScenarioAccessControl } from '@marxan-api/modules/access-control/scenarios-acl/scenario-access-control';
import { ScenarioRoles } from '@marxan-api/modules/access-control/scenarios-acl/dto/user-role-scenario.dto';
import { Either, left, right } from 'fp-ts/lib/Either';

@Injectable()
export class ScenarioAclService implements ScenarioAccessControl {
  private readonly canEditScenarioRoles = [
    ScenarioRoles.scenario_contributor,
    ScenarioRoles.scenario_owner,
  ];
  private readonly canViewScenarioRoles = [
    ScenarioRoles.scenario_viewer,
    ScenarioRoles.scenario_contributor,
    ScenarioRoles.scenario_owner,
  ];
  private readonly canDeleteScenarioRoles = [ScenarioRoles.scenario_owner];
  private readonly canCreateSolutionRoles = [
    ScenarioRoles.scenario_owner,
    ScenarioRoles.scenario_contributor,
  ];

  private async getRolesWithinScenarioForUser(
    userId: string,
    scenarioId: string,
  ): Promise<Array<ScenarioRoles>> {
    const rolesToCheck = (
      await this.roles.find({
        where: {
          scenarioId,
          userId,
        },
        select: ['roleName'],
      })
    ).flatMap((role) => role.roleName);
    return rolesToCheck;
  }

  private async doesUserHaveRole(
    roles: ScenarioRoles[],
    rolesToCheck: ScenarioRoles[],
  ): Promise<Permit> {
    return intersection(roles, rolesToCheck).length > 0;
  }

  constructor(
    @InjectRepository(UsersScenariosApiEntity)
    private readonly roles: Repository<UsersScenariosApiEntity>,
  ) {}

  async canCreateSolution(userId: string, scenarioId: string): Promise<Permit> {
    return this.doesUserHaveRole(
      await this.getRolesWithinScenarioForUser(userId, scenarioId),
      this.canCreateSolutionRoles,
    );
  }

  async canEditScenario(userId: string, scenarioId: string): Promise<Permit> {
    return this.doesUserHaveRole(
      await this.getRolesWithinScenarioForUser(userId, scenarioId),
      this.canEditScenarioRoles,
    );
  }

  async canDeleteScenario(userId: string, scenarioId: string): Promise<Permit> {
    return this.doesUserHaveRole(
      await this.getRolesWithinScenarioForUser(userId, scenarioId),
      this.canDeleteScenarioRoles,
    );
  }

  async canViewScenario(userId: string, scenarioId: string): Promise<Permit> {
    return this.doesUserHaveRole(
      await this.getRolesWithinScenarioForUser(userId, scenarioId),
      this.canViewScenarioRoles,
    );
  }

  async isOwner(userId: string, scenarioId: string): Promise<Permit> {
    const userIsScenarioOwner = await this.roles.findOne({
      where: {
        scenarioId,
        userId,
        roleName: ScenarioRoles.scenario_owner,
      },
    });
    if (!userIsScenarioOwner) {
      return false;
    }
    return true;
  }

  async hasOtherOwner(userId: string, scenarioId: string): Promise<Permit> {
    const otherOwnersInScenario = await this.roles.count({
      where: {
        scenarioId,
        roleName: ScenarioRoles.scenario_owner,
        userId: Not(userId),
      },
    });
    return otherOwnersInScenario >= 1;
  }

  async revokeAccess(
    scenarioId: string,
    userId: string,
    loggedUserId: string,
  ): Promise<Either<Permit, void>> {
    if (!(await this.isOwner(loggedUserId, scenarioId))) {
      return left(false);
    }

    if (!(await this.hasOtherOwner(userId, scenarioId))) {
      return left(false);
    }

    await this.roles.delete({ scenarioId, userId });
    return right(void 0);
  }
}

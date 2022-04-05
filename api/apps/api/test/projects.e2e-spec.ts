import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { E2E_CONFIG } from './e2e.config';
import { CreateProjectDTO } from '@marxan-api/modules/projects/dto/create.project.dto';
import * as JSONAPISerializer from 'jsonapi-serializer';
import {
  Project,
  ProjectResultPlural,
  ProjectResultSingular,
} from '@marxan-api/modules/projects/project.api.entity';
import {
  Organization,
  OrganizationResultSingular,
} from '@marxan-api/modules/organizations/organization.api.entity';
import { tearDown } from './utils/tear-down';
import { bootstrapApplication } from './utils/api-application';
import { GivenUserIsLoggedIn } from './steps/given-user-is-logged-in';
import { Scenario } from '@marxan-api/modules/scenarios/scenario.api.entity';
import { CreateScenarioDTO } from '@marxan-api/modules/scenarios/dto/create.scenario.dto';
import { ProjectsTestUtils } from './utils/projects.test.utils';
import { OrganizationsTestUtils } from './utils/organizations.test.utils';
import { PlanningUnitGridShape } from '@marxan/scenarios-planning-unit';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

afterAll(async () => {
  await tearDown();
});

describe('ProjectsModule (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let contributorToken: string;
  let viewerToken: string;
  const Deserializer = new JSONAPISerializer.Deserializer({
    keyForAttribute: 'camelCase',
  });

  let anOrganization: Organization;
  let minimalProject: Project;
  let completeProject: Project;
  let aScenarioInACompleteProject: Scenario;
  const projectsToDelete: string[] = [];

  beforeAll(async () => {
    app = await bootstrapApplication();
    jwtToken = await GivenUserIsLoggedIn(app);
    contributorToken = await GivenUserIsLoggedIn(app, 'bb');
    viewerToken = await GivenUserIsLoggedIn(app, 'cc');
  });

  afterAll(async () => {
    const projectRepository = await app.get<Repository<Project>>(
      getRepositoryToken(Project),
    );
    await projectRepository.delete(projectsToDelete);
    await Promise.all([app.close()]);
  });

  describe('Projects', () => {
    test('Creates an organization', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(E2E_CONFIG.organizations.valid.minimal())
        .expect(201);

      const jsonAPIResponse: OrganizationResultSingular = response.body;
      anOrganization = await Deserializer.deserialize(response.body);
      expect(jsonAPIResponse.data.type).toBe('organizations');
    });

    test('Creating a project with incomplete data should fail', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(E2E_CONFIG.projects.invalid.incomplete())
        .expect(400);
    });

    test('Creating a project with minimum required data should succeed', async () => {
      const organizationResponse = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(E2E_CONFIG.organizations.valid.minimal())
        .expect(201);

      const createProjectDTO: Partial<CreateProjectDTO> = {
        ...E2E_CONFIG.projects.valid.minimal(),
        organizationId: organizationResponse.body.data.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(createProjectDTO)
        .expect(201);

      const jsonAPIResponse: ProjectResultSingular = response.body;
      minimalProject = await Deserializer.deserialize(response.body);
      expect(jsonAPIResponse.data.type).toBe('projects');
      projectsToDelete.push(response.body.data.id);
    });

    test('Creating a project with regular PU shape but no PA id or GADM id should be rejected', async () => {
      const organization = await OrganizationsTestUtils.createOrganization(
        app,
        jwtToken,
        E2E_CONFIG.organizations.valid.minimal(),
      );

      const minimalValidProjectDTO: Partial<CreateProjectDTO> = {
        ...E2E_CONFIG.projects.valid.minimal(),
        organizationId: organization.data.id,
      };
      const invalidProjectDTO: Partial<CreateProjectDTO> = {
        ...minimalValidProjectDTO,
        planningUnitGridShape: PlanningUnitGridShape.Hexagon,
        planningAreaId: undefined,
        adminAreaLevel1Id: undefined,
        adminAreaLevel2Id: undefined,
        countryId: undefined,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(invalidProjectDTO);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.errors[0].status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.errors[0].title).toBe(
        'When a regular planning grid is requested (hexagon or square) either a custom planning area or a GADM area gid must be provided',
      );
    });

    test('Creating a project with complete data should succeed', async () => {
      const response1 = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(E2E_CONFIG.organizations.valid.minimal())
        .expect(201);

      const jsonAPIResponse1: OrganizationResultSingular = response1.body;
      anOrganization = await Deserializer.deserialize(response1.body);
      expect(jsonAPIResponse1.data.type).toBe('organizations');

      const createProjectDTO: Partial<CreateProjectDTO> = {
        ...E2E_CONFIG.projects.valid.complete({ countryCode: 'NAM' }),
        organizationId: anOrganization.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(createProjectDTO)
        .expect(201);
      const jsonAPIResponse: ProjectResultSingular = response.body;

      completeProject = await Deserializer.deserialize(response.body);
      await ProjectsTestUtils.generateBlmValues(app, completeProject.id);

      expect(jsonAPIResponse.data.type).toBe('projects');
      expect(jsonAPIResponse.meta.started).toBeTruthy();

      const createScenarioDTO: Partial<CreateScenarioDTO> = {
        ...E2E_CONFIG.scenarios.valid.minimal(),
        projectId: completeProject.id,
      };

      const scenarioResponse = await request(app.getHttpServer())
        .post('/api/v1/scenarios')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(createScenarioDTO)
        .expect(201);

      aScenarioInACompleteProject = await Deserializer.deserialize(
        scenarioResponse.body,
      );
    });

    test('A user with owner role on some projects should be able to get a list of the projects they have a role in', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      const jsonAPIResponse: ProjectResultPlural = response.body;

      expect(jsonAPIResponse.data[0].type).toBe('projects');
      expect(jsonAPIResponse.data).toHaveLength(4);

      const projectNames: string[] = jsonAPIResponse.data.map(
        (p) => p.attributes.name,
      );

      expect(projectNames.sort()).toEqual(
        [
          'Example Project 1 Org 1',
          'Example Project 2 Org 2',
          completeProject.name,
          minimalProject.name,
        ].sort(),
      );
    });

    test('A user with contributor role on some projects should be able to get a list of the projects they have a role in', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${contributorToken}`)
        .expect(200);

      const jsonAPIResponse: ProjectResultPlural = response.body;

      expect(jsonAPIResponse.data[0].type).toBe('projects');
      expect(jsonAPIResponse.data).toHaveLength(2);
      const projectsNames: string[] = jsonAPIResponse.data.map(
        (p) => p.attributes.name,
      );
      expect(projectsNames.sort()).toEqual([
        'Example Project 1 Org 1',
        'Example Project 2 Org 2',
      ]);
    });

    test('A user with viewer role on some projects should be able to get a list of the projects they have a role in', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      const jsonAPIResponse: ProjectResultPlural = response.body;

      expect(jsonAPIResponse.data[0].type).toBe('projects');
      expect(jsonAPIResponse.data).toHaveLength(2);
      const projectsNames: string[] = jsonAPIResponse.data.map(
        (p) => p.attributes.name,
      );
      expect(projectsNames.sort()).toEqual([
        'Example Project 1 Org 1',
        'Example Project 2 Org 2',
      ]);
    });

    test('A user with owner role should be able to get a list of the projects with q param where they have a role in', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects?q=User')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      const jsonAPIResponse: ProjectResultPlural = response.body;

      expect(jsonAPIResponse.data[0].type).toBe('projects');
      expect(jsonAPIResponse.data).toHaveLength(4);

      const projectNames: string[] = jsonAPIResponse.data.map(
        (p) => p.attributes.name,
      );

      expect(projectNames.sort()).toEqual(
        [
          'Example Project 1 Org 1',
          'Example Project 2 Org 2',
          completeProject.name,
          minimalProject.name,
        ].sort(),
      );
    });

    test('A user should be get a list of projects without any included relationships if these have not been requested', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      const jsonAPIResponse: ProjectResultPlural = response.body;

      expect(jsonAPIResponse.data[0].type).toBe('projects');

      const projectsWhichIncludeRelationships = jsonAPIResponse.data.filter(
        (i) => i.relationships,
      );
      expect(projectsWhichIncludeRelationships).toHaveLength(0);
    });

    test('Deleting existing projects should succeed', async () => {
      const response1 = await request(app.getHttpServer())
        .delete(`/api/v1/projects/${minimalProject.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response1.body.data).toBeUndefined();

      const response2 = await request(app.getHttpServer())
        .delete(`/api/v1/projects/${completeProject.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response2.body.data).toBeUndefined();

      /**
       * Finally, we delete the organization we had created for these projects
       */
      await request(app.getHttpServer())
        .delete(`/api/v1/organizations/${anOrganization.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });
  });

  test.skip('A user should be able to get a list of projects and related scenarios', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/projects?disablePagination=true&include=scenarios')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    const jsonAPIResponse: ProjectResultPlural = response.body;
    const allProjects: Project[] = await Deserializer.deserialize(
      response.body,
    );

    expect(jsonAPIResponse.data[0].type).toBe('projects');

    const aKnownProject: Project | undefined = allProjects.find(
      (i) => (i.id = completeProject.id),
    );
    expect(aKnownProject?.scenarios).toBeDefined();
    expect(
      aKnownProject?.scenarios?.find(
        (i) => i.id === aScenarioInACompleteProject.id,
      ),
    ).toBeDefined();
  });
});

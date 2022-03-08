import { Server } from 'http';
import { E2E_CONFIG } from '../e2e.config';
import * as request from 'supertest';

export class OrganizationRequests {
  constructor(private readonly app: Server) {}

  public createOrganization(
    jwt: string,
    data = E2E_CONFIG.organizations.valid.minimal(),
  ) {
    return request(this.app)
      .post('/api/v1/organizations')
      .auth(jwt, { type: 'bearer' })
      .send(data);
  }
}

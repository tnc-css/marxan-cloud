import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { E2E_CONFIG } from '../e2e.config';

export enum userObj {
  owner = 'aa',
  contributor = 'bb',
  viewer = 'cc',
  otherOwner = 'dd',
}

export const GivenUserIsLoggedIn = async (
  app: INestApplication,
  type: `aa` | `bb` | `cc` | `dd` = `aa`,
): Promise<string> =>
  (
    await request(app.getHttpServer()).post('/auth/sign-in').send({
      username: E2E_CONFIG.users.basic[type].username,
      password: E2E_CONFIG.users.basic[type].password,
    })
  ).body.accessToken;

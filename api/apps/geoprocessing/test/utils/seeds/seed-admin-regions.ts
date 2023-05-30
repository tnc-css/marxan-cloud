import { DataSource } from 'typeorm';
import { geoprocessingConnections } from '@marxan-geoprocessing/ormconfig';
import { INestApplication, INestApplicationContext } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DbConnections } from '@marxan-api/ormconfig.connections';

export const seedAdminRegions = async (app: INestApplicationContext) => {
  const dataSource: DataSource = await app.get<DataSource>(
    getDataSourceToken(geoprocessingConnections.default.name),
  );
  await dataSource.manager.query(
    '\n' +
      'INSERT INTO admin_regions \n' +
      '(the_geom, name_0, name_1, name_2, iso3, gid_0, gid_1, gid_2, level, created_by)\n' +
      'VALUES\n' +
  );
};
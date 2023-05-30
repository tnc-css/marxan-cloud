import { DataSource } from 'typeorm';
import { geoprocessingConnections } from '@marxan-geoprocessing/ormconfig';
import { getDataSourceToken } from '@nestjs/typeorm';
import { INestApplication } from '@nestjs/common';

export const seedWdpa = async (app: INestApplication) => {
  const dataSource: DataSource = await app.get<DataSource>(
    getDataSourceToken(geoprocessingConnections.default.name),
  );
  await dataSource.manager.query(
    '\n' +
      `

INSERT INTO wdpa
(wdpaid, the_geom, full_name, iucn_cat, shape_leng, shape_area, iso3, status, desig, created_by)
VALUES


      `,
  );
};
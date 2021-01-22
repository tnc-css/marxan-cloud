import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBasicEntities1611270057222 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE users
ADD COLUMN display_name varchar,
ADD COLUMN metadata jsonb,
ADD COLUMN is_active boolean default false,
ADD COLUMN is_deleted boolean default false;

-- keep existing users active/non-deleted
UPDATE users set is_active = true, is_deleted = false;

CREATE TYPE scenario_types AS ENUM (
  'marxan',
  'marxan-with-zones'
);

CREATE TABLE scenarios (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar not null,
  description text,
  type scenario_types not null default 'marxan',
  project_id uuid references projects(id) not null,
  metadata jsonb
);

CREATE TABLE users_scenarios (
  user_id uuid not null references users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  scenario_id uuid not null references scenarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
  is_editing boolean not null default false,
  PRIMARY KEY(user_id, scenario_id)
);

CREATE UNIQUE INDEX at_most_one_actively_editing_user_per_scenario ON users_scenarios(scenario_id, is_editing) where is_editing is true;

CREATE TABLE countries (
  iso_3166_1_alpha2 varchar(2) not null primary key,
  iso_3166_1_alpha3 varchar(3) not null,
  name varchar not null,
  local_names jsonb
);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DROP TABLE countries;

DROP TABLE users_scenarios;

DROP TABLE scenarios;

DROP TYPE scenario_types;

ALTER TABLE users
DROP COLUMN display_name,
DROP COLUMN metadata,
DROP COLUMN is_active,
DROP COLUMN is_deleted;
    `);
  }
}

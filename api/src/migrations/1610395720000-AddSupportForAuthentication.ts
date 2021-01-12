import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupportForAuthentication1610395720000
  implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
CREATE EXTENSION IF NOT EXISTS pgcrypto;
    `);

    await queryRunner.query(`
ALTER TABLE users ADD COLUMN password_hash varchar(64) NOT NULL DEFAULT uuid_generate_v4();
ALTER TABLE users ALTER COLUMN password_hash DROP DEFAULT;
    `);

    await queryRunner.query(`
CREATE TABLE issued_authn_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL references users(id),
  exp timestamp without time zone NOT NULL,
  created_at timestamp NOT NULL default now()
);

CREATE INDEX issued_authn_tokens_user_id_idx ON issued_authn_tokens(user_id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
DROP TABLE issued_authn_tokens;
    `);

    await queryRunner.query(`
ALTER TABLE users DROP COLUMN password_hash;
    `);

    await queryRunner.query(`
DROP EXTENSION pgcrypto;
    `);
  }
}

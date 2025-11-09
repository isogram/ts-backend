import { MigrationInterface, QueryRunner } from "typeorm";

export class UserMigration1757907522376 implements MigrationInterface {
    name = 'UserMigration1757907522376'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin', 'super_admin')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'banned', 'pending')`);
        await queryRunner.query(`CREATE TYPE "public"."users_provider_enum" AS ENUM('local', 'google', 'github', 'facebook')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "avatar" character varying(255), "email" character varying(255) NOT NULL, "password" character varying(255), "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "status" "public"."users_status_enum" NOT NULL DEFAULT 'pending', "provider" "public"."users_provider_enum" NOT NULL DEFAULT 'local', "providerId" character varying, "providerData" json, "emailVerified" boolean NOT NULL DEFAULT false, "emailVerificationToken" character varying, "passwordResetToken" character varying, "passwordResetExpires" TIMESTAMP, "twoFactorSecret" character varying, "twoFactorEnabled" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "user_refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "token" character varying(255) NOT NULL, "userAgent" character varying(255), "ipAddress" character varying(45), "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4aec15e69c57250cc23fe186b1e" UNIQUE ("token"), CONSTRAINT "PK_c5f5cf35bd8aabd1ebe9bb13409" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7ff254300bfb672252038936ba" ON "user_refresh_tokens" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."files_accesslevel_enum" AS ENUM('public', 'private')`);
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "originalName" character varying NOT NULL, "size" integer NOT NULL, "mimeType" character varying NOT NULL, "key" character varying NOT NULL, "bucket" character varying, "path" character varying, "url" character varying, "accessLevel" "public"."files_accesslevel_enum" NOT NULL DEFAULT 'private', "userId" uuid, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7e7425b17f9e707331e9a6c733" ON "files" ("userId") `);
        await queryRunner.query(`ALTER TABLE "user_refresh_tokens" ADD CONSTRAINT "FK_7ff254300bfb672252038936bae" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_7e7425b17f9e707331e9a6c7335" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_7e7425b17f9e707331e9a6c7335"`);
        await queryRunner.query(`ALTER TABLE "user_refresh_tokens" DROP CONSTRAINT "FK_7ff254300bfb672252038936bae"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e7425b17f9e707331e9a6c733"`);
        await queryRunner.query(`DROP TABLE "files"`);
        await queryRunner.query(`DROP TYPE "public"."files_accesslevel_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ff254300bfb672252038936ba"`);
        await queryRunner.query(`DROP TABLE "user_refresh_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}

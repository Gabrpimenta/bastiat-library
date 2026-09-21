import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('student', 'editor');
  CREATE TYPE "public"."enum_courses_cover" AS ENUM('window', 'law', 'trade', 'choice');
  CREATE TYPE "public"."enum_courses_level" AS ENUM('Beginner', 'Intermediate');
  CREATE TYPE "public"."enum_courses_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__courses_v_version_cover" AS ENUM('window', 'law', 'trade', 'choice');
  CREATE TYPE "public"."enum__courses_v_version_level" AS ENUM('Beginner', 'Intermediate');
  CREATE TYPE "public"."enum__courses_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_lessons_cover" AS ENUM('window', 'law', 'trade', 'choice');
  CREATE TYPE "public"."enum_lessons_format" AS ENUM('audio', 'video');
  CREATE TYPE "public"."enum_lessons_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lessons_v_version_cover" AS ENUM('window', 'law', 'trade', 'choice');
  CREATE TYPE "public"."enum__lessons_v_version_format" AS ENUM('audio', 'video');
  CREATE TYPE "public"."enum__lessons_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_articles_cover" AS ENUM('window', 'law', 'trade', 'choice');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_cover" AS ENUM('window', 'law', 'trade', 'choice');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "users_sessions" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "created_at" timestamp(3) with time zone,
    "expires_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "role" "enum_users_role" DEFAULT 'student' NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "email" varchar NOT NULL,
    "reset_password_token" varchar,
    "reset_password_expiration" timestamp(3) with time zone,
    "salt" varchar,
    "hash" varchar,
    "reset_password_requested_at" timestamp(3) with time zone,
    "login_attempts" numeric DEFAULT 0,
    "lock_until" timestamp(3) with time zone
  );

  CREATE TABLE "authors" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "bio" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "topics" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "media" (
    "id" serial PRIMARY KEY NOT NULL,
    "alt" varchar NOT NULL,
    "sha256" varchar NOT NULL,
    "asset_version" varchar DEFAULT '1' NOT NULL,
    "duration_seconds" numeric NOT NULL,
    "license" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "url" varchar,
    "thumbnail_u_r_l" varchar,
    "filename" varchar,
    "mime_type" varchar,
    "filesize" numeric,
    "width" numeric,
    "height" numeric,
    "focal_x" numeric,
    "focal_y" numeric
  );

  CREATE TABLE "courses" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "slug" varchar,
    "description" varchar,
    "author_id" integer,
    "topic_id" integer,
    "cover" "enum_courses_cover" DEFAULT 'window',
    "introduction" varchar,
    "level" "enum_courses_level" DEFAULT 'Beginner',
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_courses_status" DEFAULT 'draft'
  );

  CREATE TABLE "_courses_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_title" varchar,
    "version_slug" varchar,
    "version_description" varchar,
    "version_author_id" integer,
    "version_topic_id" integer,
    "version_cover" "enum__courses_v_version_cover" DEFAULT 'window',
    "version_introduction" varchar,
    "version_level" "enum__courses_v_version_level" DEFAULT 'Beginner',
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__courses_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "lessons_sources" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "url" varchar
  );

  CREATE TABLE "lessons" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "slug" varchar,
    "description" varchar,
    "author_id" integer,
    "topic_id" integer,
    "cover" "enum_lessons_cover" DEFAULT 'window',
    "course_id" integer,
    "order" numeric,
    "format" "enum_lessons_format",
    "asset_id" integer,
    "transcript" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_lessons_status" DEFAULT 'draft'
  );

  CREATE TABLE "_lessons_v_version_sources" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "url" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_lessons_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_title" varchar,
    "version_slug" varchar,
    "version_description" varchar,
    "version_author_id" integer,
    "version_topic_id" integer,
    "version_cover" "enum__lessons_v_version_cover" DEFAULT 'window',
    "version_course_id" integer,
    "version_order" numeric,
    "version_format" "enum__lessons_v_version_format",
    "version_asset_id" integer,
    "version_transcript" varchar,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__lessons_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "articles_sources" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "url" varchar
  );

  CREATE TABLE "articles" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "slug" varchar,
    "description" varchar,
    "author_id" integer,
    "topic_id" integer,
    "cover" "enum_articles_cover" DEFAULT 'window',
    "body" varchar,
    "reading_minutes" numeric,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_articles_status" DEFAULT 'draft'
  );

  CREATE TABLE "_articles_v_version_sources" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "url" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_articles_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_title" varchar,
    "version_slug" varchar,
    "version_description" varchar,
    "version_author_id" integer,
    "version_topic_id" integer,
    "version_cover" "enum__articles_v_version_cover" DEFAULT 'window',
    "version_body" varchar,
    "version_reading_minutes" numeric,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__articles_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "progress" (
    "id" serial PRIMARY KEY NOT NULL,
    "owner_id" integer NOT NULL,
    "lesson_slug" varchar NOT NULL,
    "position_seconds" numeric NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "asset_version" varchar NOT NULL,
    "revision" numeric DEFAULT 0 NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "bookmarks" (
    "id" serial PRIMARY KEY NOT NULL,
    "owner_id" integer NOT NULL,
    "target_slug" varchar NOT NULL,
    "target_kind" varchar NOT NULL,
    "saved" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "sync_operations" (
    "id" serial PRIMARY KEY NOT NULL,
    "owner_id" integer NOT NULL,
    "operation_id" varchar NOT NULL,
    "fingerprint" varchar NOT NULL,
    "result" jsonb NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_kv" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "data" jsonb NOT NULL
  );

  CREATE TABLE "payload_locked_documents" (
    "id" serial PRIMARY KEY NOT NULL,
    "global_slug" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_locked_documents_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer,
    "authors_id" integer,
    "topics_id" integer,
    "media_id" integer,
    "courses_id" integer,
    "lessons_id" integer,
    "articles_id" integer,
    "progress_id" integer,
    "bookmarks_id" integer,
    "sync_operations_id" integer
  );

  CREATE TABLE "payload_preferences" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "value" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_preferences_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload_migrations" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "batch" numeric,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "home_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "description" varchar NOT NULL
  );

  CREATE TABLE "home" (
    "id" serial PRIMARY KEY NOT NULL,
    "featured_course_id" integer,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  CREATE TABLE "home_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "courses_id" integer,
    "lessons_id" integer,
    "articles_id" integer
  );

  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_parent_id_courses_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_topic_id_topics_id_fk" FOREIGN KEY ("version_topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons_sources" ADD CONSTRAINT "lessons_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v_version_sources" ADD CONSTRAINT "_lessons_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_parent_id_lessons_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_topic_id_topics_id_fk" FOREIGN KEY ("version_topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_course_id_courses_id_fk" FOREIGN KEY ("version_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_asset_id_media_id_fk" FOREIGN KEY ("version_asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_sources" ADD CONSTRAINT "articles_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_version_sources" ADD CONSTRAINT "_articles_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_topic_id_topics_id_fk" FOREIGN KEY ("version_topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "progress" ADD CONSTRAINT "progress_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sync_operations" ADD CONSTRAINT "sync_operations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lessons_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_progress_fk" FOREIGN KEY ("progress_id") REFERENCES "public"."progress"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookmarks_fk" FOREIGN KEY ("bookmarks_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sync_operations_fk" FOREIGN KEY ("sync_operations_id") REFERENCES "public"."sync_operations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_sections" ADD CONSTRAINT "home_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_featured_course_id_courses_id_fk" FOREIGN KEY ("featured_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_lessons_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "authors_slug_idx" ON "authors" USING btree ("slug");
  CREATE INDEX "authors_updated_at_idx" ON "authors" USING btree ("updated_at");
  CREATE INDEX "authors_created_at_idx" ON "authors" USING btree ("created_at");
  CREATE UNIQUE INDEX "topics_slug_idx" ON "topics" USING btree ("slug");
  CREATE INDEX "topics_updated_at_idx" ON "topics" USING btree ("updated_at");
  CREATE INDEX "topics_created_at_idx" ON "topics" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");
  CREATE INDEX "courses_author_idx" ON "courses" USING btree ("author_id");
  CREATE INDEX "courses_topic_idx" ON "courses" USING btree ("topic_id");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
  CREATE INDEX "courses__status_idx" ON "courses" USING btree ("_status");
  CREATE INDEX "_courses_v_parent_idx" ON "_courses_v" USING btree ("parent_id");
  CREATE INDEX "_courses_v_version_version_slug_idx" ON "_courses_v" USING btree ("version_slug");
  CREATE INDEX "_courses_v_version_version_author_idx" ON "_courses_v" USING btree ("version_author_id");
  CREATE INDEX "_courses_v_version_version_topic_idx" ON "_courses_v" USING btree ("version_topic_id");
  CREATE INDEX "_courses_v_version_version_updated_at_idx" ON "_courses_v" USING btree ("version_updated_at");
  CREATE INDEX "_courses_v_version_version_created_at_idx" ON "_courses_v" USING btree ("version_created_at");
  CREATE INDEX "_courses_v_version_version__status_idx" ON "_courses_v" USING btree ("version__status");
  CREATE INDEX "_courses_v_created_at_idx" ON "_courses_v" USING btree ("created_at");
  CREATE INDEX "_courses_v_updated_at_idx" ON "_courses_v" USING btree ("updated_at");
  CREATE INDEX "_courses_v_latest_idx" ON "_courses_v" USING btree ("latest");
  CREATE INDEX "lessons_sources_order_idx" ON "lessons_sources" USING btree ("_order");
  CREATE INDEX "lessons_sources_parent_id_idx" ON "lessons_sources" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "lessons_slug_idx" ON "lessons" USING btree ("slug");
  CREATE INDEX "lessons_author_idx" ON "lessons" USING btree ("author_id");
  CREATE INDEX "lessons_topic_idx" ON "lessons" USING btree ("topic_id");
  CREATE INDEX "lessons_course_idx" ON "lessons" USING btree ("course_id");
  CREATE INDEX "lessons_asset_idx" ON "lessons" USING btree ("asset_id");
  CREATE INDEX "lessons_updated_at_idx" ON "lessons" USING btree ("updated_at");
  CREATE INDEX "lessons_created_at_idx" ON "lessons" USING btree ("created_at");
  CREATE INDEX "lessons__status_idx" ON "lessons" USING btree ("_status");
  CREATE INDEX "_lessons_v_version_sources_order_idx" ON "_lessons_v_version_sources" USING btree ("_order");
  CREATE INDEX "_lessons_v_version_sources_parent_id_idx" ON "_lessons_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_parent_idx" ON "_lessons_v" USING btree ("parent_id");
  CREATE INDEX "_lessons_v_version_version_slug_idx" ON "_lessons_v" USING btree ("version_slug");
  CREATE INDEX "_lessons_v_version_version_author_idx" ON "_lessons_v" USING btree ("version_author_id");
  CREATE INDEX "_lessons_v_version_version_topic_idx" ON "_lessons_v" USING btree ("version_topic_id");
  CREATE INDEX "_lessons_v_version_version_course_idx" ON "_lessons_v" USING btree ("version_course_id");
  CREATE INDEX "_lessons_v_version_version_asset_idx" ON "_lessons_v" USING btree ("version_asset_id");
  CREATE INDEX "_lessons_v_version_version_updated_at_idx" ON "_lessons_v" USING btree ("version_updated_at");
  CREATE INDEX "_lessons_v_version_version_created_at_idx" ON "_lessons_v" USING btree ("version_created_at");
  CREATE INDEX "_lessons_v_version_version__status_idx" ON "_lessons_v" USING btree ("version__status");
  CREATE INDEX "_lessons_v_created_at_idx" ON "_lessons_v" USING btree ("created_at");
  CREATE INDEX "_lessons_v_updated_at_idx" ON "_lessons_v" USING btree ("updated_at");
  CREATE INDEX "_lessons_v_latest_idx" ON "_lessons_v" USING btree ("latest");
  CREATE INDEX "articles_sources_order_idx" ON "articles_sources" USING btree ("_order");
  CREATE INDEX "articles_sources_parent_id_idx" ON "articles_sources" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_author_idx" ON "articles" USING btree ("author_id");
  CREATE INDEX "articles_topic_idx" ON "articles" USING btree ("topic_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX "_articles_v_version_sources_order_idx" ON "_articles_v_version_sources" USING btree ("_order");
  CREATE INDEX "_articles_v_version_sources_parent_id_idx" ON "_articles_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_author_idx" ON "_articles_v" USING btree ("version_author_id");
  CREATE INDEX "_articles_v_version_version_topic_idx" ON "_articles_v" USING btree ("version_topic_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "progress_owner_idx" ON "progress" USING btree ("owner_id");
  CREATE INDEX "progress_updated_at_idx" ON "progress" USING btree ("updated_at");
  CREATE INDEX "progress_created_at_idx" ON "progress" USING btree ("created_at");
  CREATE UNIQUE INDEX "owner_lessonSlug_idx" ON "progress" USING btree ("owner_id","lesson_slug");
  CREATE INDEX "bookmarks_owner_idx" ON "bookmarks" USING btree ("owner_id");
  CREATE INDEX "bookmarks_updated_at_idx" ON "bookmarks" USING btree ("updated_at");
  CREATE INDEX "bookmarks_created_at_idx" ON "bookmarks" USING btree ("created_at");
  CREATE UNIQUE INDEX "owner_targetKind_targetSlug_idx" ON "bookmarks" USING btree ("owner_id","target_kind","target_slug");
  CREATE INDEX "sync_operations_owner_idx" ON "sync_operations" USING btree ("owner_id");
  CREATE INDEX "sync_operations_updated_at_idx" ON "sync_operations" USING btree ("updated_at");
  CREATE INDEX "sync_operations_created_at_idx" ON "sync_operations" USING btree ("created_at");
  CREATE UNIQUE INDEX "owner_operationId_idx" ON "sync_operations" USING btree ("owner_id","operation_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_authors_id_idx" ON "payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX "payload_locked_documents_rels_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("topics_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_lessons_id_idx" ON "payload_locked_documents_rels" USING btree ("lessons_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_progress_id_idx" ON "payload_locked_documents_rels" USING btree ("progress_id");
  CREATE INDEX "payload_locked_documents_rels_bookmarks_id_idx" ON "payload_locked_documents_rels" USING btree ("bookmarks_id");
  CREATE INDEX "payload_locked_documents_rels_sync_operations_id_idx" ON "payload_locked_documents_rels" USING btree ("sync_operations_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "home_sections_order_idx" ON "home_sections" USING btree ("_order");
  CREATE INDEX "home_sections_parent_id_idx" ON "home_sections" USING btree ("_parent_id");
  CREATE INDEX "home_featured_course_idx" ON "home" USING btree ("featured_course_id");
  CREATE INDEX "home_rels_order_idx" ON "home_rels" USING btree ("order");
  CREATE INDEX "home_rels_parent_idx" ON "home_rels" USING btree ("parent_id");
  CREATE INDEX "home_rels_path_idx" ON "home_rels" USING btree ("path");
  CREATE INDEX "home_rels_courses_id_idx" ON "home_rels" USING btree ("courses_id");
  CREATE INDEX "home_rels_lessons_id_idx" ON "home_rels" USING btree ("lessons_id");
  CREATE INDEX "home_rels_articles_id_idx" ON "home_rels" USING btree ("articles_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "authors" CASCADE;
  DROP TABLE "topics" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "courses" CASCADE;
  DROP TABLE "_courses_v" CASCADE;
  DROP TABLE "lessons_sources" CASCADE;
  DROP TABLE "lessons" CASCADE;
  DROP TABLE "_lessons_v_version_sources" CASCADE;
  DROP TABLE "_lessons_v" CASCADE;
  DROP TABLE "articles_sources" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "_articles_v_version_sources" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "progress" CASCADE;
  DROP TABLE "bookmarks" CASCADE;
  DROP TABLE "sync_operations" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "home_sections" CASCADE;
  DROP TABLE "home" CASCADE;
  DROP TABLE "home_rels" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_courses_cover";
  DROP TYPE "public"."enum_courses_level";
  DROP TYPE "public"."enum_courses_status";
  DROP TYPE "public"."enum__courses_v_version_cover";
  DROP TYPE "public"."enum__courses_v_version_level";
  DROP TYPE "public"."enum__courses_v_version_status";
  DROP TYPE "public"."enum_lessons_cover";
  DROP TYPE "public"."enum_lessons_format";
  DROP TYPE "public"."enum_lessons_status";
  DROP TYPE "public"."enum__lessons_v_version_cover";
  DROP TYPE "public"."enum__lessons_v_version_format";
  DROP TYPE "public"."enum__lessons_v_version_status";
  DROP TYPE "public"."enum_articles_cover";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_cover";
  DROP TYPE "public"."enum__articles_v_version_status";`);
}

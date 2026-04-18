-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "CropStage" AS ENUM ('PLANTED', 'GROWING', 'READY', 'HARVESTED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AGENT',
    "full_name" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "county" TEXT NOT NULL,
    "sub_county" TEXT,
    "ward" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "crop_type" TEXT NOT NULL,
    "planting_date" TIMESTAMP(3) NOT NULL,
    "current_stage" "CropStage" NOT NULL DEFAULT 'PLANTED',
    "description" TEXT,
    "area_size" DOUBLE PRECISION,
    "agent_id" UUID,
    "location_id" UUID NOT NULL,
    "cover_image_url" TEXT,
    "last_updated_at" TIMESTAMP(3),
    "updated_by_id" UUID,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_updates" (
    "id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "stage" "CropStage" NOT NULL,
    "notes" TEXT,
    "image_url" TEXT,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_images" (
    "id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "locations_county_idx" ON "locations"("county");

-- CreateIndex
CREATE INDEX "fields_agent_id_idx" ON "fields"("agent_id");

-- CreateIndex
CREATE INDEX "fields_agent_id_is_archived_idx" ON "fields"("agent_id", "is_archived");

-- CreateIndex
CREATE INDEX "fields_current_stage_idx" ON "fields"("current_stage");

-- CreateIndex
CREATE INDEX "fields_is_archived_idx" ON "fields"("is_archived");

-- CreateIndex
CREATE INDEX "fields_planting_date_idx" ON "fields"("planting_date");

-- CreateIndex
CREATE INDEX "fields_last_updated_at_idx" ON "fields"("last_updated_at");

-- CreateIndex
CREATE INDEX "field_updates_field_id_observed_at_idx" ON "field_updates"("field_id", "observed_at" DESC);

-- CreateIndex
CREATE INDEX "field_updates_agent_id_idx" ON "field_updates"("agent_id");

-- CreateIndex
CREATE INDEX "field_updates_observed_at_idx" ON "field_updates"("observed_at");

-- CreateIndex
CREATE INDEX "field_images_field_id_idx" ON "field_images"("field_id");

-- CreateIndex
CREATE INDEX "field_images_uploaded_by_id_idx" ON "field_images"("uploaded_by_id");

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_updates" ADD CONSTRAINT "field_updates_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_updates" ADD CONSTRAINT "field_updates_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_images" ADD CONSTRAINT "field_images_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_images" ADD CONSTRAINT "field_images_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

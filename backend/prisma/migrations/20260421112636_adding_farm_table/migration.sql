/*
  Warnings:

  - Added the required column `farm_id` to the `fields` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "fields" ADD COLUMN     "farm_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "farm_id" UUID;

-- CreateTable
CREATE TABLE "farms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "invite_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "farms_slug_key" ON "farms"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "farms_invite_code_key" ON "farms"("invite_code");

-- CreateIndex
CREATE INDEX "farms_slug_idx" ON "farms"("slug");

-- CreateIndex
CREATE INDEX "idx_fields_agent_active" ON "fields"("agent_id") WHERE (is_archived = false);

-- CreateIndex
CREATE INDEX "idx_fields_stage_active" ON "fields"("current_stage") WHERE (is_archived = false);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

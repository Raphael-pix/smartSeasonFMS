/*
  Warnings:

  - A unique constraint covering the columns `[location_id]` on the table `fields` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "fields_location_id_key" ON "fields"("location_id");

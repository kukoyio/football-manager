/*
  Warnings:

  - A unique constraint covering the columns `[playerId,clubId,startDate]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Contract_playerId_clubId_startDate_key" ON "Contract"("playerId", "clubId", "startDate");

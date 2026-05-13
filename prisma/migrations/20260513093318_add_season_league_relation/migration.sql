/*
  Warnings:

  - Added the required column `leagueId` to the `Season` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "leagueId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

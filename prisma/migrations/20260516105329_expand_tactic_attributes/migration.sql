/*
  Warnings:

  - You are about to drop the column `passing_directness` on the `Tactic` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clubId,active]` on the table `Tactic` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `counter` to the `Tactic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `counterPress` to the `Tactic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `defensiveLine` to the `Tactic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `finalThirdApproach` to the `Tactic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passingDirectness` to the `Tactic` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `width` on the `Tactic` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tempo` on the `Tactic` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `pressing` on the `Tactic` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PassingDirectness" AS ENUM ('SHORTER', 'STANDARD', 'DIRECT', 'ROUTEONE');

-- CreateEnum
CREATE TYPE "Width" AS ENUM ('NARROW', 'STANDARD', 'WIDE');

-- CreateEnum
CREATE TYPE "Tempo" AS ENUM ('LOW', 'STANDARD', 'HIGH');

-- CreateEnum
CREATE TYPE "Pressing" AS ENUM ('LOW', 'STANDARD', 'HIGH', 'EXTREME');

-- CreateEnum
CREATE TYPE "DefensiveLine" AS ENUM ('LOWER', 'STANDARD', 'HIGHER');

-- CreateEnum
CREATE TYPE "FinalThirdApproach" AS ENUM ('WORKBALLINTOBOX', 'STANDARD', 'SHOOTONSIGHT');

-- AlterTable
ALTER TABLE "Tactic" DROP COLUMN "passing_directness",
ADD COLUMN     "counter" BOOLEAN NOT NULL,
ADD COLUMN     "counterPress" BOOLEAN NOT NULL,
ADD COLUMN     "defensiveLine" "DefensiveLine" NOT NULL,
ADD COLUMN     "finalThirdApproach" "FinalThirdApproach" NOT NULL,
ADD COLUMN     "passingDirectness" "PassingDirectness" NOT NULL,
DROP COLUMN "width",
ADD COLUMN     "width" "Width" NOT NULL,
DROP COLUMN "tempo",
ADD COLUMN     "tempo" "Tempo" NOT NULL,
DROP COLUMN "pressing",
ADD COLUMN     "pressing" "Pressing" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tactic_clubId_active_key" ON "Tactic"("clubId", "active");

/*
  Warnings:

  - Added the required column `transferBudget` to the `Club` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wageBudget` to the `Club` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "transferBudget" INTEGER NOT NULL,
ADD COLUMN     "wageBudget" INTEGER NOT NULL;

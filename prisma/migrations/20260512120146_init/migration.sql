-- CreateEnum
CREATE TYPE "Position" AS ENUM ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'ST', 'RW', 'LW');

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "age" INTEGER NOT NULL,
    "pace" INTEGER NOT NULL,
    "shooting" INTEGER NOT NULL,
    "passing" INTEGER NOT NULL,
    "dribbling" INTEGER NOT NULL,
    "defending" INTEGER NOT NULL,
    "physicality" INTEGER NOT NULL,
    "diving" INTEGER NOT NULL,
    "handling" INTEGER NOT NULL,
    "kicking" INTEGER NOT NULL,
    "reflexes" INTEGER NOT NULL,
    "positioning" INTEGER NOT NULL,
    "position" "Position" NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(300) NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "leagueId" INTEGER NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "clubId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "wage" INTEGER NOT NULL,
    "releaseClause" INTEGER,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tactic" (
    "id" SERIAL NOT NULL,
    "clubId" INTEGER NOT NULL,
    "formation" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL,
    "passing_directness" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "tempo" INTEGER NOT NULL,
    "pressing" INTEGER NOT NULL,

    CONSTRAINT "Tactic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "homeClubId" INTEGER NOT NULL,
    "awayClubId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "matchId" SERIAL NOT NULL,
    "homeGoals" INTEGER NOT NULL,
    "awayGoals" INTEGER NOT NULL,
    "homeShots" INTEGER NOT NULL,
    "awayShots" INTEGER NOT NULL,
    "homePossession" INTEGER NOT NULL,
    "awayPossession" INTEGER NOT NULL,
    "homeCorner" INTEGER NOT NULL,
    "awayCorners" INTEGER NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("matchId")
);

-- CreateTable
CREATE TABLE "Signing" (
    "fromClubId" INTEGER NOT NULL,
    "toClubId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "transferFee" INTEGER NOT NULL,
    "contractId" INTEGER NOT NULL,

    CONSTRAINT "Signing_pkey" PRIMARY KEY ("fromClubId","toClubId","playerId","transferDate")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "year" VARCHAR(300) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tactic" ADD CONSTRAINT "Tactic_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeClubId_fkey" FOREIGN KEY ("homeClubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayClubId_fkey" FOREIGN KEY ("awayClubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signing" ADD CONSTRAINT "Signing_fromClubId_fkey" FOREIGN KEY ("fromClubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signing" ADD CONSTRAINT "Signing_toClubId_fkey" FOREIGN KEY ("toClubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signing" ADD CONSTRAINT "Signing_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signing" ADD CONSTRAINT "Signing_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

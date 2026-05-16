// prisma/seed.ts
import { PrismaClient, Position, PassingDirectness, Width, Tempo, Pressing, DefensiveLine, FinalThirdApproach } from "../src/generated/client.js";
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg
const connectionString = `${process.env.DATABASE_URL}`

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const league = await prisma.league.upsert({
        where: { name: "Premier League", },
        update: {},
        create: {
            name: "Premier League",
        },
    });
    const manUtd = await prisma.club.upsert({
        where: { name: "Manchester United Football Club" },
        update: {},
        create: {
            name: "Manchester United Football Club",
            leagueId: league.id,
            transferBudget: 125000000,
            wageBudget: 3500000,
        }
    });
    const liverpool = await prisma.club.upsert({
        where: { name: "Liverpool Football Club" },
        update: {},
        create: {
            name: "Liverpool Football Club",
            leagueId: league.id,
            transferBudget: 150000000,
            wageBudget: 4500000,
        }
    });

    const manUtdPlayers = [
        { name: "Bruno Fernandes", age: 31, position: Position.CAM, pace: 67, shooting: 83, passing: 89, dribbling: 83, defending: 65, physicality: 75, diving: 12, handling: 14, kicking: 15, reflexes: 14, positioning: 13 },
        { name: "Bryan Mbeumo", age: 26, position: Position.RW, pace: 88, shooting: 84, passing: 79, dribbling: 84, defending: 49, physicality: 76, diving: 10, handling: 10, kicking: 11, reflexes: 11, positioning: 10 },
        { name: "Matheus Cunha", age: 26, position: Position.CAM, pace: 77, shooting: 85, passing: 79, dribbling: 84, defending: 44, physicality: 75, diving: 12, handling: 14, kicking: 10, reflexes: 11, positioning: 11 },
        { name: "Matthijs de Ligt", age: 26, position: Position.CB, pace: 62, shooting: 61, passing: 62, dribbling: 67, defending: 82, physicality: 83, diving: 12, handling: 11, kicking: 10, reflexes: 11, positioning: 10 },
        { name: "Lisandro Martínez", age: 28, position: Position.CB, pace: 67, shooting: 59, passing: 75, dribbling: 75, defending: 81, physicality: 80, diving: 10, handling: 11, kicking: 12, reflexes: 11, positioning: 10 },
        { name: "André Onana", age: 30, position: Position.GK, pace: 50, shooting: 20, passing: 50, dribbling: 50, defending: 20, physicality: 60, diving: 81, handling: 75, kicking: 85, reflexes: 83, positioning: 77 },
        { name: "Noussair Mazraoui", age: 28, position: Position.RB, pace: 75, shooting: 66, passing: 76, dribbling: 80, defending: 77, physicality: 72, diving: 10, handling: 12, kicking: 10, reflexes: 13, positioning: 11 },
        { name: "Benjamin Šeško", age: 22, position: Position.ST, pace: 83, shooting: 80, passing: 65, dribbling: 78, defending: 46, physicality: 80, diving: 11, handling: 11, kicking: 12, reflexes: 10, positioning: 12 },
        { name: "Casemiro", age: 34, position: Position.CDM, pace: 36, shooting: 74, passing: 76, dribbling: 69, defending: 80, physicality: 76, diving: 13, handling: 14, kicking: 16, reflexes: 12, positioning: 12 },
        { name: "Harry Maguire", age: 33, position: Position.CB, pace: 35, shooting: 57, passing: 70, dribbling: 65, defending: 80, physicality: 82, diving: 10, handling: 10, kicking: 11, reflexes: 14, positioning: 11 },
        { name: "Diogo Dalot", age: 27, position: Position.RB, pace: 85, shooting: 63, passing: 74, dribbling: 77, defending: 76, physicality: 78, diving: 10, handling: 12, kicking: 12, reflexes: 10, positioning: 10 },
        { name: "Luke Shaw", age: 30, position: Position.CB, pace: 69, shooting: 57, passing: 78, dribbling: 75, defending: 79, physicality: 72, diving: 10, handling: 12, kicking: 11, reflexes: 10, positioning: 11 },
        { name: "Manuel Ugarte", age: 25, position: Position.CDM, pace: 62, shooting: 65, passing: 72, dribbling: 76, defending: 77, physicality: 75, diving: 11, handling: 13, kicking: 12, reflexes: 11, positioning: 12 },
        { name: "Amad", age: 23, position: Position.CAM, pace: 85, shooting: 74, passing: 75, dribbling: 83, defending: 54, physicality: 52, diving: 10, handling: 10, kicking: 11, reflexes: 10, positioning: 10 },
        { name: "Senne Lammens", age: 23, position: Position.GK, pace: 50, shooting: 20, passing: 50, dribbling: 50, defending: 20, physicality: 60, diving: 79, handling: 77, kicking: 71, reflexes: 77, positioning: 79 },
        { name: "Leny Yoro", age: 20, position: Position.CB, pace: 69, shooting: 41, passing: 60, dribbling: 64, defending: 79, physicality: 73, diving: 10, handling: 11, kicking: 10, reflexes: 10, positioning: 10 },
        { name: "Kobbie Mainoo", age: 21, position: Position.CM, pace: 68, shooting: 69, passing: 74, dribbling: 81, defending: 73, physicality: 74, diving: 9, handling: 11, kicking: 10, reflexes: 12, positioning: 10 },
        { name: "Mason Mount", age: 27, position: Position.CAM, pace: 74, shooting: 78, passing: 81, dribbling: 79, defending: 52, physicality: 63, diving: 12, handling: 10, kicking: 14, reflexes: 11, positioning: 11 },
        { name: "Joshua Zirkzee", age: 25, position: Position.ST, pace: 72, shooting: 78, passing: 74, dribbling: 81, defending: 35, physicality: 78, diving: 10, handling: 12, kicking: 11, reflexes: 10, positioning: 10 },
        { name: "Tyrell Malacia", age: 26, position: Position.LB, pace: 83, shooting: 54, passing: 68, dribbling: 76, defending: 73, physicality: 72, diving: 11, handling: 10, kicking: 12, reflexes: 14, positioning: 12 },
        { name: "Altay Bayundir", age: 28, position: Position.GK, pace: 50, shooting: 20, passing: 50, dribbling: 50, defending: 20, physicality: 60, diving: 78, handling: 72, kicking: 75, reflexes: 81, positioning: 74 },
        { name: "Patrick Dorgu", age: 21, position: Position.LB, pace: 87, shooting: 62, passing: 66, dribbling: 75, defending: 70, physicality: 72, diving: 10, handling: 11, kicking: 13, reflexes: 10, positioning: 10 },
        { name: "Ayden Heaven", age: 19, position: Position.CB, pace: 70, shooting: 35, passing: 55, dribbling: 58, defending: 68, physicality: 68, diving: 10, handling: 10, kicking: 10, reflexes: 10, positioning: 10 },
        { name: "Tom Heaton", age: 40, position: Position.GK, pace: 35, shooting: 20, passing: 40, dribbling: 40, defending: 20, physicality: 55, diving: 68, handling: 66, kicking: 64, reflexes: 68, positioning: 69 },
        { name: "Chido Obi", age: 18, position: Position.ST, pace: 78, shooting: 66, passing: 52, dribbling: 65, defending: 28, physicality: 62, diving: 10, handling: 10, kicking: 10, reflexes: 10, positioning: 10 },
        { name: "Tyler Fredricson", age: 21, position: Position.CB, pace: 62, shooting: 33, passing: 48, dribbling: 50, defending: 66, physicality: 65, diving: 10, handling: 10, kicking: 10, reflexes: 10, positioning: 10 },
        { name: "Diego León", age: 19, position: Position.LB, pace: 80, shooting: 52, passing: 60, dribbling: 68, defending: 62, physicality: 58, diving: 10, handling: 10, kicking: 10, reflexes: 10, positioning: 10 },
    ];

    const liverpoolPlayers = [
        { name: "Mohamed Salah", age: 33, position: Position.RW, pace: 89, shooting: 88, passing: 86, dribbling: 90, defending: 45, physicality: 76, diving: 14, handling: 14, kicking: 9, reflexes: 11, positioning: 11 },
        { name: "Virgil van Dijk", age: 34, position: Position.CB, pace: 73, shooting: 60, passing: 72, dribbling: 72, defending: 90, physicality: 87, diving: 13, handling: 10, kicking: 13, reflexes: 11, positioning: 11 },
        { name: "Alisson", age: 33, position: Position.GK, pace: 54, shooting: 24, passing: 48, dribbling: 38, defending: 17, physicality: 57, diving: 86, handling: 87, kicking: 83, reflexes: 87, positioning: 88 },
        { name: "Florian Wirtz", age: 23, position: Position.CAM, pace: 80, shooting: 82, passing: 88, dribbling: 90, defending: 54, physicality: 67, diving: 10, handling: 11, kicking: 10, reflexes: 11, positioning: 10 },
        { name: "Alexander Isak", age: 26, position: Position.ST, pace: 83, shooting: 89, passing: 73, dribbling: 85, defending: 39, physicality: 76, diving: 10, handling: 12, kicking: 10, reflexes: 11, positioning: 11 },
        { name: "Alexis Mac Allister", age: 27, position: Position.CM, pace: 66, shooting: 82, passing: 85, dribbling: 85, defending: 78, physicality: 76, diving: 11, handling: 12, kicking: 11, reflexes: 12, positioning: 11 },
        { name: "Ibrahima Konaté", age: 26, position: Position.CB, pace: 77, shooting: 34, passing: 63, dribbling: 69, defending: 86, physicality: 85, diving: 10, handling: 11, kicking: 12, reflexes: 11, positioning: 10 },
        { name: "Ryan Gravenberch", age: 23, position: Position.CDM, pace: 76, shooting: 76, passing: 81, dribbling: 85, defending: 81, physicality: 81, diving: 11, handling: 13, kicking: 12, reflexes: 11, positioning: 12 },
        { name: "Giorgi Mamardashvili", age: 25, position: Position.GK, pace: 50, shooting: 20, passing: 50, dribbling: 50, defending: 20, physicality: 60, diving: 83, handling: 81, kicking: 75, reflexes: 85, positioning: 82 },
        { name: "Cody Gakpo", age: 27, position: Position.LW, pace: 84, shooting: 81, passing: 78, dribbling: 83, defending: 45, physicality: 73, diving: 11, handling: 10, kicking: 12, reflexes: 14, positioning: 12 },
        { name: "Dominik Szoboszlai", age: 25, position: Position.CAM, pace: 82, shooting: 83, passing: 86, dribbling: 82, defending: 42, physicality: 71, diving: 12, handling: 10, kicking: 14, reflexes: 11, positioning: 11 },
        { name: "Jeremie Frimpong", age: 25, position: Position.RB, pace: 94, shooting: 72, passing: 78, dribbling: 85, defending: 76, physicality: 70, diving: 10, handling: 11, kicking: 13, reflexes: 10, positioning: 10 },
        { name: "Hugo Ekitike", age: 23, position: Position.ST, pace: 84, shooting: 80, passing: 68, dribbling: 82, defending: 35, physicality: 68, diving: 10, handling: 10, kicking: 10, reflexes: 10, positioning: 10 },
        { name: "Milos Kerkez", age: 22, position: Position.LB, pace: 85, shooting: 54, passing: 66, dribbling: 76, defending: 72, physicality: 74, diving: 10, handling: 12, kicking: 11, reflexes: 10, positioning: 10 },
        { name: "Andrew Robertson", age: 32, position: Position.LB, pace: 78, shooting: 61, passing: 81, dribbling: 80, defending: 81, physicality: 74, diving: 11, handling: 10, kicking: 12, reflexes: 14, positioning: 12 },
        { name: "Federico Chiesa", age: 28, position: Position.RW, pace: 87, shooting: 81, passing: 75, dribbling: 85, defending: 45, physicality: 64, diving: 12, handling: 14, kicking: 10, reflexes: 11, positioning: 11 },
        { name: "Curtis Jones", age: 25, position: Position.CM, pace: 75, shooting: 74, passing: 78, dribbling: 81, defending: 70, physicality: 72, diving: 10, handling: 11, kicking: 10, reflexes: 10, positioning: 10 },
        { name: "Wataru Endo", age: 33, position: Position.CDM, pace: 50, shooting: 65, passing: 73, dribbling: 74, defending: 81, physicality: 78, diving: 11, handling: 14, kicking: 9, reflexes: 11, positioning: 11 },
        { name: "Joe Gomez", age: 28, position: Position.CB, pace: 74, shooting: 29, passing: 70, dribbling: 71, defending: 79, physicality: 73, diving: 10, handling: 10, kicking: 11, reflexes: 11, positioning: 10 },
        { name: "Conor Bradley", age: 22, position: Position.RB, pace: 80, shooting: 62, passing: 70, dribbling: 75, defending: 75, physicality: 74, diving: 10, handling: 11, kicking: 11, reflexes: 10, positioning: 10 },
        { name: "Stefan Bajcetic", age: 21, position: Position.CDM, pace: 74, shooting: 52, passing: 67, dribbling: 73, defending: 71, physicality: 71, diving: 10, handling: 11, kicking: 12, reflexes: 10, positioning: 11 },
        { name: "Freddie Woodman", age: 29, position: Position.GK, pace: 72, shooting: 69, passing: 62, dribbling: 71, defending: 26, physicality: 68, diving: 72, handling: 69, kicking: 62, reflexes: 71, positioning: 68 },
        { name: "Giovanni Leoni", age: 19, position: Position.CB, pace: 53, shooting: 27, passing: 40, dribbling: 45, defending: 71, physicality: 68, diving: 10, handling: 11, kicking: 10, reflexes: 10, positioning: 10 },
        { name: "Rio Ngumoha", age: 17, position: Position.LW, pace: 90, shooting: 64, passing: 59, dribbling: 72, defending: 35, physicality: 53, diving: 10, handling: 11, kicking: 10, reflexes: 11, positioning: 11 },
        { name: "Calvin Ramsay", age: 22, position: Position.RB, pace: 75, shooting: 55, passing: 70, dribbling: 70, defending: 68, physicality: 62, diving: 10, handling: 10, kicking: 11, reflexes: 10, positioning: 11 },
        { name: "Ármin Pécsi", age: 21, position: Position.GK, pace: 45, shooting: 20, passing: 48, dribbling: 48, defending: 20, physicality: 55, diving: 71, handling: 68, kicking: 66, reflexes: 74, positioning: 70 },
        { name: "Trey Nyoni", age: 18, position: Position.CM, pace: 76, shooting: 65, passing: 72, dribbling: 78, defending: 55, physicality: 58, diving: 10, handling: 10, kicking: 10, reflexes: 10, positioning: 10 },
        { name: "Rhys Williams", age: 25, position: Position.CB, pace: 42, shooting: 30, passing: 54, dribbling: 52, defending: 70, physicality: 73, diving: 10, handling: 10, kicking: 10, reflexes: 11, positioning: 10 }
    ];

    for (const playerData of manUtdPlayers) {
        const player = await prisma.player.upsert({
            where: { name: playerData.name },
            update: {},
            create: {
                ...playerData,
            },
        });
        const existingManUtdContract = await prisma.contract.findFirst({
            where: {
                playerId: player.id,
                clubId: manUtd.id,
                startDate: new Date("2025-08-01"),
            },
        });
        if (!existingManUtdContract) {
            await prisma.contract.create({
                data: {
                    playerId: player.id,
                    clubId: manUtd.id,
                    startDate: new Date("2025-08-01"),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)),
                    wage: 100000, // placeholder wage, to be updated
                    releaseClause: null,
                },
            });
        }
    }

    for (const playerData of liverpoolPlayers) {
        const player = await prisma.player.upsert({
            where: { name: playerData.name },
            update: {},
            create: {
                ...playerData,
            },
        });
        const existingLiverpoolContract = await prisma.contract.findFirst({
            where: {
                playerId: player.id,
                clubId: liverpool.id,
                startDate: new Date("2025-08-01"),
            },
        });
        if (!existingLiverpoolContract) {
            await prisma.contract.create({
                data: {
                    playerId: player.id,
                    clubId: liverpool.id,
                    startDate: new Date("2025-08-01"),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)),
                    wage: 100000, // placeholder wage, to be updated
                    releaseClause: null
                },
            });
        }
    }
    await prisma.tactic.upsert({
        where: {
            clubId_active: {
                clubId: manUtd.id,
                active: true
            },
        },
        update:{},
        create: {
            clubId: manUtd.id,
            formation: "4-2-3-1",
            active: true,
            passingDirectness: PassingDirectness.SHORTER,
            width: Width.NARROW,
            tempo: Tempo.LOW,
            pressing: Pressing.STANDARD,
            defensiveLine: DefensiveLine.LOWER,
            counter: false,
            counterPress: false,
            finalThirdApproach: FinalThirdApproach.WORKBALLINTOBOX
        }
    })

    await prisma.tactic.upsert({
        where: {
            clubId_active: {
                clubId: liverpool.id,
                active: true
            }
        },
        update: {},
        create: {
            clubId: liverpool.id,
            formation: "4-3-3",
            active: true,
            passingDirectness: PassingDirectness.DIRECT,
            width: Width.WIDE,
            tempo: Tempo.HIGH,
            pressing: Pressing.EXTREME,
            defensiveLine: DefensiveLine.HIGHER,
            counter: true,
            counterPress: true,
            finalThirdApproach: FinalThirdApproach.SHOOTONSIGHT
        }
    })
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

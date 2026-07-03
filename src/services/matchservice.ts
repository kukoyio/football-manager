// Fetch both clubs with their players and active tactic from the database
// set date
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { Prisma, PrismaClient } from '../generated/client.js'
import { generateNextEvent, type ClubWithDetails, type MatchState, initializeMatchState } from './simulationEngine.js'
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const { Pool } = pg
const connectionString = `${process.env.DATABASE_URL}`

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

type ClubWithPrismaRelations = Prisma.ClubGetPayload<{  
    include: {
    contracts: { include: { player: true } },
    tactics: { where: { active: true } }
}
}>

async function fetchClubWithDetails(clubId: number): Promise<ClubWithDetails> {
    const club = await prisma.club.findUnique({
        where: { id: clubId },
        include: {
            tactics: {
                where: {
                    active: true,
                }
            }, 
            contracts: {
                include: {
                    player: true
                }
            }
        }
    })
    if(!club) {
        throw new Error(`Club with id ${clubId} not found!`);
    }
    let prismaClub = club as ClubWithPrismaRelations

    if (!prismaClub.tactics || prismaClub.tactics.length === 0) {
        throw new Error(`Club ${prismaClub.id} has no active tactic!`);
    }

    return {
        id: prismaClub.id,
        name: prismaClub.name,
        players: prismaClub.contracts.map(contract => contract.player).filter(Boolean),
        tactic: prismaClub.tactics[0] 
    };
}

async function runMatch(homeClub: ClubWithDetails, awayClub: ClubWithDetails) {
    const matchState = initializeMatchState(homeClub, awayClub);

    const rl = readline.createInterface({ input, output });
    console.log(`\n⚽ KICKOFF: ${homeClub.name} vs ${awayClub.name}\n`);

    while (matchState.currentMinute < 90) {
        const event = generateNextEvent(matchState);

        if (event.type === 'GOAL') {
            if (event.team === 'HOME'){ 
                matchState.result.homeShots++;
                matchState.result.homeGoals++;
            }
            if (event.team === 'AWAY') {
                matchState.result.awayShots++;
                matchState.result.awayGoals++;
            }
        }

        if (event.type === 'SHOT') {
            if (event.team === 'HOME') matchState.result.homeShots++;
            if (event.team === 'AWAY') matchState.result.awayShots++;
        }

        if (event.type === 'CORNER') {
            if (event.team === 'HOME') matchState.result.homeCorners++;
            if (event.team === 'AWAY') matchState.result.awayCorners++;
        }

        console.log(`[${event.minute}'] ${event.type} - ${event.team}`);
        let playerInvolved = event.playerInvolved ? ` | Player: ${event.playerInvolved.name}` : '';
        console.log(`Main: ${playerInvolved} | Score: ${matchState.result.homeGoals} - ${matchState.result.awayGoals}`);

        const answer = await rl.question('\nPress Enter to continue, or type "s" to make a substitution... ');

        if (answer.trim().toLowerCase() === 's') {
            await handleSubstitutions(rl, matchState);
        }
    }

    rl.close();
    console.log(`\n🏁 FULL TIME: ${homeClub.name} ${matchState.result.homeGoals} - ${matchState.result.awayGoals} ${awayClub.name}\n`);

    await saveMatchResult(homeClub.id, awayClub.id, matchState.result.homeGoals, matchState.result.awayGoals);
}

async function handleSubstitutions(rl: readline.Interface, matchState: MatchState) {
    
}

async function saveMatchResult(homeId: number, awayId: number, homeGoals: number, awayGoals: number) {

}
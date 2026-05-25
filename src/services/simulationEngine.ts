import { Position, PassingDirectness, Width, Tempo, Pressing, DefensiveLine, FinalThirdApproach } from "../generated/client.js";
import type { Player, Tactic } from "../generated/client.js";

type ClubWithDetails​ = {
    id: number;
    tactic: Tactic;
    players : Player[];
}


type SimulationResult = {
    homeGoals: number;
    awayGoals: number;
    homeShots: number;
    awayShots: number;
    homePossession: number;
    awayPossession: number;
    homeCorner: number;
    awayCorners: number;

}

type PlayerMatchState = {
    player: Player;
    effectiveAttributes: {
        pace: number;
        shooting: number;
        passing: number;
        dribbling: number;
        defending: number;
        physicality: number;
    };
}

type MatchState = {
    homePlayers: PlayerMatchState[];
    awayPlayers: PlayerMatchState[];
    homeTactic: Tactic;
    awayTactic: Tactic;
    interval: number;
    result:  SimulationResult;
}

function initializeMatchState(homeClub: ClubWithDetails, awayClub: ClubWithDetails): MatchState {
    const homePlayers = homeClub.players.map(player => ({
        player,
        effectiveAttributes: {
            pace: player.pace,
            shooting: player.shooting,
            passing: player.passing,
            dribbling: player.dribbling,
            defending: player.defending,
            physicality: player.physicality
        }
    }));

    const awayPlayers = awayClub.players.map(player => ({
        player,
        effectiveAttributes: {
            pace: player.pace,
            shooting: player.shooting,
            passing: player.passing,
            dribbling: player.dribbling,
            defending: player.defending,
            physicality: player.physicality
        }
    }));

    return {
        homePlayers,
        awayPlayers,
        homeTactic: homeClub.tactic,
        awayTactic: awayClub.tactic,
        interval: 0,
        result: {
            homeGoals: 0,
            awayGoals: 0,
            homeShots: 0,
            awayShots: 0,
            homePossession: 50,
            awayPossession: 50,
            homeCorner: 0,
            awayCorners: 0
        }
    };
}

function calculatePossession(homePlayers: PlayerMatchState[], awayPlayers: PlayerMatchState[], homeTactic: Tactic, awayTactic: Tactic): { homePossession: number; awayPossession: number } {
    let homeAvgPassing = 0;
    for (const playerState of homePlayers) {
        homeAvgPassing += playerState.effectiveAttributes.passing;
    }
    homeAvgPassing /= homePlayers.length;

    let awayAvgPassing = 0;
    for (const playerState of awayPlayers) {
        awayAvgPassing += playerState.effectiveAttributes.passing;
    }
    awayAvgPassing /= awayPlayers.length;

    let homePassingBonus = (homeAvgPassing / 100) * 20
    let awayPassingBonus = (awayAvgPassing / 100) * 20;
    let homeDirectnessAdjustment = 0;
    let awayDirectnessAdjustment = 0;
    switch (homeTactic.passingDirectness) {
        case PassingDirectness.SHORTER:
            homeDirectnessAdjustment += 10;
            break;
        case PassingDirectness.STANDARD:
            homeDirectnessAdjustment += 5;
            break;
        case PassingDirectness.DIRECT:
            homeDirectnessAdjustment -= 5;
            break;
        case PassingDirectness.ROUTEONE:
            homeDirectnessAdjustment -= 10;
            break;
    }

    switch (awayTactic.passingDirectness) {
        case PassingDirectness.SHORTER:
            awayDirectnessAdjustment += 10;
            break;
        case PassingDirectness.STANDARD:
            awayDirectnessAdjustment += 5;
            break;
        case PassingDirectness.DIRECT:
            awayDirectnessAdjustment -= 5;
            break;
        case PassingDirectness.ROUTEONE:
            awayDirectnessAdjustment -= 10;
            break;
    }
    let homeTempoAdjustment = 0;
    let awayTempoAdjustment = 0;
    switch(homeTactic.tempo){
        case Tempo.LOW:
            homeTempoAdjustment += 5;
            break;
        case Tempo.STANDARD:
            break;
        case Tempo.HIGH:
            homeTempoAdjustment -= 5;
            break;
    }

    switch(awayTactic.tempo){
        case Tempo.LOW:
            awayTempoAdjustment += 5;
            break;
        case Tempo.STANDARD:
            break;
        case Tempo.HIGH:
            awayTempoAdjustment -= 5;
            break;
    }
    let homePressingEffect = 0;  
    let awayPressingEffect = 0;  
    switch(homeTactic.pressing){
        case Pressing.LOW:
            break;
        case Pressing.STANDARD:
            homePressingEffect -= 3;
            break;
        case Pressing.HIGH:
            homePressingEffect -= 8;
            break;
        case Pressing.EXTREME:
            homePressingEffect -= 15;
            break;
    }

    switch(awayTactic.pressing){
        case Pressing.LOW:
            break;
        case Pressing.STANDARD:
            awayPressingEffect -= 3;
            break;
        case Pressing.HIGH:
            awayPressingEffect -= 8;
            break;
        case Pressing.EXTREME:
            awayPressingEffect -= 15;
            break;
    }
    let homeWideAdjustment = 0;
    let awayWideAdjustment = 0;
    switch(homeTactic.width){
        case Width.NARROW:
            homeWideAdjustment += 5;
            break;
        case Width.STANDARD:
            break;
        case Width.WIDE:
            homeWideAdjustment -= 5;
            break;
    }

    switch(awayTactic.width){
        case Width.NARROW:
            awayWideAdjustment += 5;
            break;
        case Width.STANDARD:
            break;
        case Width.WIDE:
            awayWideAdjustment -= 5;
            break;
    }
    let homeScore = 50 + homePassingBonus + homeDirectnessAdjustment + homeTempoAdjustment + homeWideAdjustment + awayPressingEffect 
    let awayScore = 50 + awayPassingBonus + awayDirectnessAdjustment + awayTempoAdjustment + awayWideAdjustment + homePressingEffect

    let homePossession = (homeScore / (homeScore + awayScore)) * 100
    let awayPossession = 100 - homePossession

    return { homePossession, awayPossession };
}

export type { ClubWithDetails, SimulationResult, PlayerMatchState, MatchState };
export { initializeMatchState };

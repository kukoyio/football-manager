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

export type { ClubWithDetails, SimulationResult, PlayerMatchState, MatchState };
export { initializeMatchState };

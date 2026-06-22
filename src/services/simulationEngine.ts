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

type EffectiveAttributes = {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physicality: number;
}

type PlayerMatchState = {
    player: Player;
    effectiveAttributes: EffectiveAttributes;
}

type MatchState = {
    homePlayers: PlayerMatchState[];
    awayPlayers: PlayerMatchState[];
    homeTactic: Tactic;
    awayTactic: Tactic;
    interval: number;
    result:  SimulationResult;
    currentMinute: number;
}

enum EventType {
    SHOT = 'SHOT',
    GOAL = 'GOAL',
    FOUL = 'FOUL',
    CORNER = 'CORNER',
    CROSS = 'CROSS',
    YELLOW_CARD = 'YELLOW_CARD',
    RED_CARD = 'RED_CARD',
    HALF_TIME = 'HALF_TIME',
    FULL_TIME = 'FULL_TIME',
    SUBSTITUTION = 'SUBSTITUTION',
    OFFSIDE = 'OFFSIDE',
    INJURY = 'INJURY',
    PENALTY = 'PENALTY',
    FREE_KICK = 'FREE_KICK',
    BIG_CHANCE_MISSED = 'BIG_CHANCE_MISSED',
    SAVE = 'SAVE',
    HIT_POST = 'HIT_POST',
    PENALTY_MISS = 'PENALTY_MISS',
    OWN_GOAL = 'OWN_GOAL'
}

type MatchEvent = {
    type: EventType;
    minute: number;
    team: 'HOME' | 'AWAY';
    playerInvolved?: Player;
    secondaryPlayer?: Player;
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
        },
        currentMinute: 0
    };
}

type PositionWeights = Record<Position, number>;
const POSSESSION_WEIGHTS : PositionWeights = {
    [Position.GK]: 0.2,
    [Position.ST]: 0.7,
    [Position.RW]: 0.7,
    [Position.LW]: 0.7,
    [Position.CAM]: 1.0,
    [Position.RM]: 1.0,
    [Position.LM]: 1.0,
    [Position.CM]: 1.0,
    [Position.CDM]: 1.0,
    [Position.CB]: 0.7,
    [Position.RB]: 0.7,
    [Position.LB]: 0.7
};

const SHOT_WEIGHTS : PositionWeights = {
    [Position.GK]: 0.0,
    [Position.ST]: 1.0,
    [Position.RW]: 1.0,
    [Position.LW]: 1.0,
    [Position.CAM]: 0.8,
    [Position.RM]: 0.8,
    [Position.LM]: 0.8,
    [Position.CM]: 0.5,
    [Position.CDM]: 0.5,
    [Position.CB]: 0.2,
    [Position.RB]: 0.2,
    [Position.LB]: 0.2
};

const ATTACKING_EVENT_WEIGHTS: Record<string, number> = {
    SHOT: 130,
    CROSS: 180,
    OFFSIDE: 15
}

const DEFENSIVE_EVENT_WEIGHTS: Record<string, number> = {
    FOUL: 110
}

function applyTacticModifiers( base_attacking: Record<string, number>, base_defensive: Record<string, number>, team1: Tactic, team2: Tactic   ): { attackingWeights: Record<string, number>, defensiveWeights: Record<string, number> } {
    const copyAttackingWeights = { ...base_attacking };
    const copyDefensiveWeights = { ...base_defensive };

    switch(team1.passingDirectness){
        case PassingDirectness.SHORTER:
            copyAttackingWeights['CROSS'] *= 0.6;
            copyAttackingWeights['OFFSIDE'] *= 0.5;
            break;
        case PassingDirectness.DIRECT:
            copyAttackingWeights['CROSS'] *= 1.3;
            copyAttackingWeights['OFFSIDE'] *= 1.5;
            break;
        case PassingDirectness.ROUTEONE:
            copyAttackingWeights['CROSS'] *= 1.6;
            copyAttackingWeights['OFFSIDE'] *= 2.2;
            break;
    }
   switch(team1.finalThirdApproach){
        case FinalThirdApproach.WORKBALLINTOBOX:
            copyAttackingWeights['SHOT'] *= 0.7;
            copyAttackingWeights['CROSS'] *= 1.3;
            break;
        case FinalThirdApproach.SHOOTONSIGHT:
            copyAttackingWeights['SHOT'] *= 1.6;
            copyAttackingWeights['CROSS'] *= 0.6;
            break;
    }

   switch(team1.width){
        case Width.NARROW:
            copyAttackingWeights['CROSS'] *= 0.4;
            break;
        case Width.WIDE:
            copyAttackingWeights['CROSS'] *= 1.4;
            break;
    }

    switch(team1.tempo){
        case Tempo.LOW:
            copyAttackingWeights['SHOT'] *= 0.7;
            copyAttackingWeights['OFFSIDE'] *= 0.6;
            break;
        case Tempo.HIGH:
            copyAttackingWeights['SHOT'] *= 1.3;
            copyAttackingWeights['OFFSIDE'] *= 1.4;
            break;
    }
    
    switch(team1.pressing){
        case Pressing.LOW:
            copyDefensiveWeights['FOUL'] *= 0.6;
            break;
        case Pressing.HIGH:
            copyDefensiveWeights['FOUL'] *= 1.35;
            break;
        case Pressing.EXTREME:
            copyDefensiveWeights['FOUL'] *= 1.7;
            break;
    }

    switch(team2.defensiveLine){
        case DefensiveLine.LOWER:
            copyAttackingWeights['OFFSIDE'] *= 0.4;
            break;
        case DefensiveLine.HIGHER:
            copyAttackingWeights['OFFSIDE'] *= 1.8;
            break;
    }

    if(team1.counter == true){
        copyAttackingWeights['SHOT'] *= 1.4;
        copyAttackingWeights['OFFSIDE'] *= 1.3;
    }

    if(team1.counterPress == true){
        copyDefensiveWeights['FOUL'] *= 1.6;
    }

    return { attackingWeights: copyAttackingWeights, defensiveWeights: copyDefensiveWeights };
}

//generateNextEvent — orchestrates everything, returns a single MatchEvent
function generateNextEvent(matchState: MatchState): MatchEvent {
    // Advance the minute by 1-8 minutes per event
    const minuteAdvance = Math.floor(Math.random() * 8) + 1;
    matchState.currentMinute += minuteAdvance;
    
    // Cap at 90 minutes
    if (matchState.currentMinute > 90) {
        matchState.currentMinute = 90;
    }

    const homeWeights = applyTacticModifiers(ATTACKING_EVENT_WEIGHTS, DEFENSIVE_EVENT_WEIGHTS, matchState.homeTactic, matchState.awayTactic);
    const awayWeights = applyTacticModifiers(ATTACKING_EVENT_WEIGHTS, DEFENSIVE_EVENT_WEIGHTS, matchState.awayTactic, matchState.homeTactic);

    //calulate possession to determine attacking team
    const homePossession = calculatePossession(matchState.homePlayers, matchState.awayPlayers, matchState.homeTactic, matchState.awayTactic).homePossession;
    const awayPossession = calculatePossession(matchState.homePlayers, matchState.awayPlayers, matchState.homeTactic, matchState.awayTactic).awayPossession;

    const ATTACKING_EVENTS = new Set(['SHOT', 'CROSS', 'OFFSIDE']);
    const DEFENSIVE_EVENTS = new Set(['FOUL']);

    const attackingTeam = Math.random() * 100 < homePossession ? 'HOME' : 'AWAY';

    const attackingWeights = attackingTeam === 'HOME' ? homeWeights.attackingWeights : awayWeights.attackingWeights;
    const defensiveWeights = attackingTeam === 'HOME' ? awayWeights.defensiveWeights : homeWeights.defensiveWeights;

    const combinedWeights = { ...attackingWeights, ...defensiveWeights };
    const eventType = weightedRandom(combinedWeights);

    const eventTeam = ATTACKING_EVENTS.has(eventType) ? attackingTeam : (attackingTeam === 'HOME' ? 'AWAY' : 'HOME');

    switch (eventType) {
        case 'SHOT':
            return resolveShot(matchState, eventTeam);
        case 'CROSS':
            return resolveCross(matchState, eventTeam);
        case 'FOUL':
            return resolveFoul(matchState, eventTeam);
        case 'OFFSIDE':
            return resolveOffside(matchState, eventTeam);
    }

}

function resolveCross(matchState: MatchState, team: 'HOME' | 'AWAY'): MatchEvent {

}

function resolveShot(matchState: MatchState, team: 'HOME' | 'AWAY'): MatchEvent {
    
}

function resolveFoul(matchState: MatchState, team: 'HOME' | 'AWAY'): MatchEvent {

}

function resolveOffside(matchState: MatchState, offsideTeam: 'HOME' | 'AWAY'): MatchEvent {
    const players = offsideTeam === 'HOME' ? matchState.homePlayers : matchState.awayPlayers;
    
    // Create weights for each player: pace is primary, forward positions are more likely to be caught offside
    const weights: Record<number, number> = {};
    for (let i = 0; i < players.length; i++) {
        const playerState = players[i];
        const paceWeight = playerState.effectiveAttributes.pace;
        
        // Forward positions (ST, RW, LW) are more likely to be caught offside
        const isForwardPosition = [
            Position.ST,
            Position.RW,
            Position.LW,
            Position.CAM
        ].includes(playerState.player.position);
        
        const positionMultiplier = isForwardPosition ? 1.5 : 1.0;
        weights[i] = paceWeight * positionMultiplier;
    }
    
    // Select player weighted by pace and position
    const playerIndex = weightedRandomIndex(weights);
    const playerInvolved = players[playerIndex].player;
    
    return {
        type: EventType.OFFSIDE,
        minute: matchState.currentMinute,
        team: offsideTeam,
        playerInvolved
    };
}

function weightedRandomIndex(weights: Record<number, number>): number {
    let totalWeight = 0;
    for (const key in weights) {
        totalWeight += weights[key];
    }
    
    const random = Math.random() * totalWeight;
    let cursor = 0;
    
    for (const [key, value] of Object.entries(weights)) {
        cursor += value;
        if (cursor >= random) {
            return parseInt(key);
        }
    }
    
    const keys = Object.keys(weights).map(k => parseInt(k));
    return keys[keys.length - 1];
}



function calculatePossession(homePlayers: PlayerMatchState[], awayPlayers: PlayerMatchState[], homeTactic: Tactic, awayTactic: Tactic ): { homePossession: number; awayPossession: number } {
    let homeAvgPassing = calculateWeightedAverage(homePlayers, 'passing', POSSESSION_WEIGHTS);
    let awayAvgPassing = calculateWeightedAverage(awayPlayers, 'passing', POSSESSION_WEIGHTS);

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

function calculateWeightedAverage(players: PlayerMatchState[], attribute: keyof EffectiveAttributes, weights: Partial<Record<Position, number>>): number {
    //Loop through players
    let totalWeightedValue = 0;
    let totalWeight = 0;

    for (const playerState of players) {
        //Look up the weight for each player's position
        const positionWeight = weights[playerState.player.position] || 0; // Default weight is 0 if not specified
        //Multiply their attribute value by their weight
        const weightedValue = playerState.effectiveAttributes[attribute] * positionWeight;
        //Sum these weighted values     
        totalWeightedValue += weightedValue;
        totalWeight += positionWeight;
    }

    //Return the weighted average
    return totalWeight > 0 ? totalWeightedValue / totalWeight : 0;
}

function weightedRandom(weights: Record<string, number>): string {
    let totalWeight = 0;
    for(const key in weights){
        totalWeight += weights[key];
    }
    const random = Math.random() * totalWeight;
    let cursor = 0
    for (const [key, value] of Object.entries(weights)) {
        cursor += value;
        if (cursor >= random) {
            return key;
        }
    }
    const keys = Object.keys(weights);
    return keys[keys.length - 1];
}

export type { ClubWithDetails, SimulationResult, PlayerMatchState, MatchState, EventType , MatchEvent };
export { initializeMatchState, calculatePossession, calculateWeightedAverage, weightedRandom };
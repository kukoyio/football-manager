import { Position, PassingDirectness, Width, Tempo, Pressing, DefensiveLine, FinalThirdApproach } from "../generated/client.js";
import type { Player, Tactic } from "../generated/client.js";

type ClubWithDetails = {
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
    diving?: number;
    handling?: number;
    reflexes?: number;
    positioning?: number;
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

// Initialize the full simulation state for the match.
// This includes each club's players with their current effective attributes,
// the chosen tactics, and zeroed match result counters.
function initializeMatchState(homeClub: ClubWithDetails, awayClub: ClubWithDetails): MatchState {
    const homePlayers = homeClub.players.map(player => ({
        player,
        effectiveAttributes: {
            pace: player.pace,
            shooting: player.shooting,
            passing: player.passing,
            dribbling: player.dribbling,
            defending: player.defending,
            physicality: player.physicality,
            diving: player.diving,
            handling: player.handling,
            reflexes: player.reflexes,
            positioning: player.positioning
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
            physicality: player.physicality,
            diving: player.diving,
            handling: player.handling,
            reflexes: player.reflexes,
            positioning: player.positioning
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

// Position-based role weights used to bias certain phases of play.
// For example, midfielders contribute more to possession, while strikers have
// the highest shot-weight contribution.
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

const FOUL_POSITION_WEIGHTS: Record<string, number> = {
    CB: 2.0, CDM: 2.0,
    LB: 1.5, RB: 1.5, CM: 1.5,
    ST: 1.0,
    LW: 0.8, RW: 0.8, LM: 0.8, RM: 0.8, CAM: 0.8,
    GK: 0.1
};

const FOULED_POSITION_WEIGHTS: Record<string, number> = {
    LW: 1.5, RW: 1.5, CAM: 1.5, ST: 1.2, 
    LM: 1.0, RM: 1.0, CM: 1.0,           
    CDM: 0.5, LB: 0.5, RB: 0.5,          
    CB: 0.2, GK: 0.05                    
};

const ATTACKING_EVENT_WEIGHTS: Record<string, number> = {
    SHOT: 130,
    CROSS: 180,
    OFFSIDE: 15
}

const DEFENSIVE_EVENT_WEIGHTS: Record<string, number> = {
    FOUL: 110
}

// Apply tactic modifiers to the base event weights.
// The attacking team's tactic changes shot/cross/offside chances,
// while the opponent's defensive line and pressing affect defensive pressure.
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
            copyAttackingWeights['CROSS'] *= 0.7;
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

// Generate the next match event, advance the clock, and choose which team
// is attacking based on calculated possession.
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
    const { homePossession, awayPossession } = calculatePossession(matchState.homePlayers, matchState.awayPlayers, matchState.homeTactic, matchState.awayTactic);


    const ATTACKING_EVENTS = new Set(['SHOT', 'CROSS', 'OFFSIDE']);

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
        default:
            throw new Error(`Unhandled event type: ${eventType}`);
    }

}

function resolveCross(matchState: MatchState, team: 'HOME' | 'AWAY'): MatchEvent {
    const attackingPlayers = team === 'HOME' ? matchState.homePlayers : matchState.awayPlayers;
    const defendingPlayers = team === 'HOME' ? matchState.awayPlayers : matchState.homePlayers;
    // Select the crosser weighted towards wide positions — LW, RW, LM, RM heavily, LB, RB moderately
    const weights: Record<string, number> = {};
    for(let i = 0; i < attackingPlayers.length; i++) {
        const playerState = attackingPlayers[i];
        const positionWeight = [Position.LW, Position.RW, Position.LM, Position.RM].includes(playerState.player.position) ? 1.5 :
            [Position.LB, Position.RB].includes(playerState.player.position) ? 1.0 : 0.2;
        weights[i.toString()] = positionWeight;
    }
    const playerIndex = parseInt(weightedRandom(weights), 10);
    const crosser = attackingPlayers[playerIndex].player;
    // Find the opposing fullback to run the pace + dribbling vs pace + defending duel
    // 2. Find the opposing wide defender (with a safe crash-prevention fallback)
    const isLeftFlank = crosser.position === Position.LW || crosser.position === Position.LM || crosser.position === Position.LB;
    const targetDefPositions: Position[] = isLeftFlank ? [Position.RB, Position.RM] : [Position.LB, Position.LM];

    let opposingDefender = defendingPlayers.find(p => targetDefPositions.includes(p.player.position))?.player;
    if (!opposingDefender) {
        // Fallback to the first available Center Back if opponent plays narrow
        opposingDefender = defendingPlayers.find(p => p.player.position === Position.CB)?.player || defendingPlayers[0]?.player;
    }

    if (!opposingDefender) {
        return {
            type: EventType.CORNER,
            minute: matchState.currentMinute,
            team,
            playerInvolved: crosser
        };
    }

    // 3. Flank Duel: Winger (Pace + Dribbling) vs Defender (Pace + Defending)
    const crosserFlankScore = crosser.pace + crosser.dribbling;
    const defenderFlankScore = opposingDefender.pace + opposingDefender.defending;
    const deliveryQuality = crosserFlankScore / (crosserFlankScore + defenderFlankScore); // Returns ~0.3 to ~0.7

    // 4. Box Duel: Incorporate Physicality Advantage
    const targetAttacker = attackingPlayers.find(p => [Position.ST].includes(p.player.position))?.player || crosser;
    const centerBacks = defendingPlayers.filter(p => p.player.position === Position.CB).map(p => p.player);
    
    const avgCbDefending = centerBacks.length > 0 
        ? centerBacks.reduce((sum, cb) => sum + cb.defending + cb.physicality, 0) / (centerBacks.length * 2)
        : 50; // Default fallback

    const attackingBoxPower = (crosser.passing + targetAttacker.physicality) / 2;
    const boxSuccessRatio = attackingBoxPower / (attackingBoxPower + avgCbDefending);

    // 5. Master Success Modifier (Combines Flank Beat + Box Dominance)
    const successModifier = (deliveryQuality + boxSuccessRatio) / 2; // Ratio between 0.0 and 1.0

    // 6. Dynamic Outcome Weights
    // Higher success modifier drastically spikes SHOT chance and slashes TURNOVER chance
    const outcomeWeights: Record<string, number> = {
        SHOT: Math.round(successModifier * 100),
        CORNER: Math.round((1 - successModifier) * 35),
        SAVE: Math.round((1 - successModifier) * 25)
    };

    const outcome = weightedRandom(outcomeWeights);

    // 7. Route to final event
    if (outcome === 'SHOT') {
        return resolveShot(matchState, team, crosser); 
    }

    const gk = defendingPlayers.find(p => p.player.position === 'GK')?.player;

    return {
        type: outcome === 'SAVE' ? EventType.SAVE : EventType.CORNER,
        minute: matchState.currentMinute,
        team,
        playerInvolved: outcome === 'SAVE' ? gk : crosser,
        secondaryPlayer: outcome === 'SAVE' ? crosser : opposingDefender
    };

}

// Resolve a shot event. Selects the shooter using shooting and positional weights,
// then compares the shot against the defending goalkeeper's rating.
function resolveShot(matchState: MatchState, team: 'HOME' | 'AWAY', assistCandidate?: Player): MatchEvent {
    const attackingPlayers = team === 'HOME' ? matchState.homePlayers : matchState.awayPlayers;
    const defendingPlayers = team === 'HOME' ? matchState.awayPlayers : matchState.homePlayers;

    // Build a weighted pool of shooters based on their shooting ability
    // and the positional likelihood of taking a shot.
    const shotWeights: Record<string, number> = {};
    for (let i = 0; i < attackingPlayers.length; i++) {
        const playerState = attackingPlayers[i];
        const positionWeight = SHOT_WEIGHTS[playerState.player.position] || 0;
        shotWeights[i.toString()] = playerState.effectiveAttributes.shooting * positionWeight;
    }

    const shooterIndex = parseInt(weightedRandom(shotWeights), 10);
    const shooter = attackingPlayers[shooterIndex].player;

    // Keeper rating is the average of the goalkeeper's diving, reflexes,
    // and positioning attributes.
    const keeperState = defendingPlayers.find(playerState => playerState.player.position === Position.GK);
    const keeperRating = keeperState
        ? ((keeperState.effectiveAttributes.diving ?? 50)
            + (keeperState.effectiveAttributes.reflexes ?? 50)
            + (keeperState.effectiveAttributes.positioning ?? 50)) / 3
        : 50;

    let rawxG = (0.12 + (shooter.shooting / 100) * 0.15);
    
    const approach = team === 'HOME' ? matchState.homeTactic.finalThirdApproach : matchState.awayTactic.finalThirdApproach;
    switch(approach) {
        case FinalThirdApproach.WORKBALLINTOBOX:
            rawxG *= 1.4;
            break;
        case FinalThirdApproach.SHOOTONSIGHT:
            rawxG *= 0.7;
            break;
    }
    
    const keeperReduction = (keeperRating / 100) * 0.08;
    const xG = Math.max(0.05, Math.min(0.85, rawxG - keeperReduction));

    const goalCutoff = xG;
    const postCutoff = xG + 0.05;
    const remainingSpace = 0.95 - xG;
    const saveCutoff = postCutoff + (remainingSpace * (keeperRating / 100));

    const roll = Math.random();

    if (roll < goalCutoff) {
        let assistPlayer: Player | undefined = assistCandidate?.id !== shooter.id ? assistCandidate : undefined;

        if (!assistPlayer) {
            const assistRoll = Math.random();
            if (assistRoll < 0.68) {
                const assistWeights: Record<string, number> = {};
                for (let i = 0; i < attackingPlayers.length; i++) {
                    const playerState = attackingPlayers[i];
                    if (playerState.player.id === shooter.id) {
                        continue;
                    }
                    assistWeights[i.toString()] = playerState.effectiveAttributes.passing;
                }

                const assistIndex = parseInt(weightedRandom(assistWeights), 10);
                assistPlayer = attackingPlayers[assistIndex]?.player;
            }
        }

        return {
            type: EventType.GOAL,
            minute: matchState.currentMinute,
            team,
            playerInvolved: shooter,
            secondaryPlayer: assistPlayer
        };
    } 
    else if (roll < postCutoff) {
        return {
            type: EventType.HIT_POST,
            minute: matchState.currentMinute,
            team,
            playerInvolved: shooter
        };
    } 
    else if (roll < saveCutoff) {
        const savingTeam = team === 'HOME' ? 'AWAY' : 'HOME';
        return {
            type: EventType.SAVE,
            minute: matchState.currentMinute,
            savingTeam,
            playerInvolved: keeperState?.player,
            secondaryPlayer: shooter
        };
    } 
    else {
        return {
            type: EventType.BIG_CHANCE_MISSED,
            minute: matchState.currentMinute,
            team,
            playerInvolved: shooter
        };
    }
}

// Resolve a foul event. This can be expanded later to track yellow/red cards,
// free kicks, or discipline consequences.
function resolveFoul(matchState: MatchState, team: 'HOME' | 'AWAY'): MatchEvent {
    // Pick fouler (defending team, weighted toward CB/CDM/CM)
    const defendingPlayers = team === 'HOME' ? matchState.homePlayers : matchState.awayPlayers;
    const fouledTeam = team === 'HOME' ? 'AWAY' : 'HOME';
    const attackingTeamPlayers = team === 'HOME' ? matchState.awayPlayers : matchState.homePlayers;


    const foulWeights: Record<string, number> = {};
    for (let i = 0; i < defendingPlayers.length; i++) {
        const player = defendingPlayers[i].player;
        const positionWeight = FOUL_POSITION_WEIGHTS[player.position] || 0.5;
        
        // Calculate the clumsiness factor
        const clumsinessScore = player.physicality + (100 - player.defending);
        
        // Multiply them together to get the final likelihood of this player fouling
        foulWeights[i.toString()] = positionWeight * clumsinessScore;
    }

    const foulerIndex = parseInt(weightedRandom(foulWeights), 10);
    const foulingPlayer = defendingPlayers[foulerIndex].player;

    const targetWeights: Record<string, number> = {};
    for(let i = 0; i < attackingTeamPlayers.length; i++) {
        const player = attackingTeamPlayers[i].player;
        const positionWeight = FOULED_POSITION_WEIGHTS[player.position] || 0.5;
        
        // Calculate the vulnerability factor
        const foulMagnetScore = (player.dribbling * 1.5) + player.pace;
        
        // Multiply them together to get the final likelihood of this player being fouled
        targetWeights[i.toString()] = positionWeight * foulMagnetScore;
    }

    const fouledIndex = parseInt(weightedRandom(targetWeights), 10);
    const fouledPlayer = attackingTeamPlayers[fouledIndex].player;

    return {
        type: EventType.FOUL,
        minute: matchState.currentMinute,
        team: fouledTeam, // The team that *won* the foul
        playerInvolved: foulingPlayer,
        secondaryPlayer: fouledPlayer
    };
}

// Resolve an offside event by choosing a forward player weighted by pace and
// offside-prone positions.
function resolveOffside(matchState: MatchState, offsideTeam: 'HOME' | 'AWAY'): MatchEvent {
    const players = offsideTeam === 'HOME' ? matchState.homePlayers : matchState.awayPlayers;
    
    // Create weights for each player, except goalkeepers: pace is primary, forward positions are more likely to be caught offside
    const weights: Record<string, number> = {};
    for (let i = 0; i < players.length; i++) {
        const playerState = players[i];
        if (playerState.player.position === Position.GK) {
            weights[i.toString()] = 0;
            continue;
        }
        const paceWeight = playerState.effectiveAttributes.pace;
        
        // Forward positions (ST, RW, LW) are more likely to be caught offside
        const isForwardPosition = [
            Position.ST,
            Position.RW,
            Position.LW,
            Position.CAM
        ].includes(playerState.player.position);
        
        const positionMultiplier = isForwardPosition ? 1.5 : 1.0;
        weights[i.toString()] = paceWeight * positionMultiplier;
    }
    
    // Select player weighted by pace and position
    const playerIndex = parseInt(weightedRandom(weights), 10);
    const playerInvolved = players[playerIndex].player;
    
    return {
        type: EventType.OFFSIDE,
        minute: matchState.currentMinute,
        team: offsideTeam,
        playerInvolved
    };
}



// Calculate possession share using passing ability and tactical modifiers.
// This determines which team is more likely to attack on the next event.
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

// Compute a weighted average across players for the requested attribute.
// The weight table lets stronger positions contribute more to the final value.
function calculateWeightedAverage(players: PlayerMatchState[], attribute: keyof EffectiveAttributes, weights: Partial<Record<Position, number>>): number {
    // Loop through players
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

// Select a random event key based on supplied weights.
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
export { initializeMatchState, calculatePossession, calculateWeightedAverage, weightedRandom, generateNextEvent };
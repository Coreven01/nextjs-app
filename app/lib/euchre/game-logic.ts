import { BidResult, Card, CardValue, EuchreCard, EuchreGameInstance, EuchrePlayer, EuchreTrick, Suit } from "./data";

export const offsuitValues: Map<CardValue, number> = new Map([
    ["9", 10],
    ["10", 15],
    ["J", 20],
    ["Q", 25],
    ["K", 30],
    ["A", 90],
]);

export const trumpValues: Map<CardValue, number> = new Map([
    ["9", 100],
    ["10", 110],
    ["Q", 120],
    ["K", 130],
    ["A", 150],
    ["J", 300],
]);

const LEFT_BOWER_VALUE = 250;

interface GameLogicInfo {
    currentUserIsMaker: boolean,
    isCurrentTeamMaker: boolean,
    isFirstPlayer: boolean,
    cardsPlayed: number,
    teamTricksWon: number,
    trumpCardCount: number,
    offSuitAceCount: number,
    leadCard: Card | undefined,
    teammateLeadAce: boolean,
    playerHasRight: boolean,
    playerHasLeft: boolean,
    playerWillPickUp: boolean,
    teamWillPickup: boolean,
    handScore: number,
    suitToCall: Suit | undefined,
    suitsInHand: number,
}

/** Return a object of important values when making a decision.  */
function getGameLogic(game: EuchreGameInstance, flipCard: Card, canNameSuit: boolean): GameLogicInfo {

    if (!game?.currentPlayer)
        throw Error("Invalid player to determine card to play.");

    const currentPlayer = game.currentPlayer;
    let playerHasRight: boolean = false;
    let playerHasLeft: boolean = false;
    let playerWillPickup: boolean = game.dealer === currentPlayer;
    let leadCard: Card | undefined = undefined;

    if (game.currentTrick.cardsPlayed.length === 1) {
        leadCard = game.currentTrick.cardsPlayed[0].card;
    }

    if (!canNameSuit) {
        playerHasRight = currentPlayer.hand.filter(c => c.suit === flipCard.suit && c.value === "J").length > 0;
        playerHasLeft = currentPlayer.hand.filter(c => c.color === flipCard.color && c.value === "J" && c.suit != flipCard.suit).length > 0;

        if (playerWillPickup) {
            playerHasRight = flipCard.value === "J";
        }
    }

    const info: GameLogicInfo = {
        currentUserIsMaker: game.maker === currentPlayer,
        isCurrentTeamMaker: game.maker?.team === currentPlayer.team,
        isFirstPlayer: game.gamePlayers.map(p => p.playedCards).flat().length === 0,
        cardsPlayed: currentPlayer.playedCards.length,
        teamTricksWon: game.gameTricks.filter(t => t.playerWon && t.playerWon.team === currentPlayer?.team).length,
        trumpCardCount: currentPlayer.hand.filter(c => c.suit === game.trump?.suit).length,
        leadCard: leadCard,
        teammateLeadAce: false,
        offSuitAceCount: currentPlayer.hand.filter(c => c.suit != flipCard.suit && c.value === "A").length,
        playerHasRight: playerHasRight,
        playerHasLeft: playerHasLeft,
        playerWillPickUp: playerWillPickup,
        teamWillPickup: game.dealer?.team === currentPlayer.team,
        handScore: 0,
        suitToCall: undefined,
        suitsInHand: new Set(game.currentPlayer.hand.map(c => c.suit)).entries.length,
    }

    return info;
}

/** Determine how an AI player should play during the bidding round.
 *  Uses heuristic evaluation to create a score. If the score exceeds a value, then the player will name trump.
 */
export function determineBidLogic(game: EuchreGameInstance, flipCard: Card, canNameSuit: boolean): BidResult {

    if (!game?.currentPlayer)
        throw Error("Invalid player to determine card to play.");

    const gameLogicResult = getGameLogic(game, flipCard, canNameSuit);
    let modifiedResult: GameLogicInfo;

    if (canNameSuit)
        modifiedResult = getBidResultForSecondRound(game, flipCard, gameLogicResult);
    else
        modifiedResult = getBidResultForFirstRound(game, flipCard, gameLogicResult);

    const retval: BidResult = { orderTrump: false, loner: false, calledSuit: undefined, };

    if (modifiedResult.handScore >= getQualifyingScore()) {
        retval.orderTrump = true;
        retval.loner = modifiedResult.handScore >= getQualifyingLonerScore();
        retval.calledSuit = canNameSuit ? modifiedResult.suitToCall : undefined;

        return retval;
    }

    return retval;
}

function getBidResultForFirstRound(game: EuchreGameInstance, flipCard: Card, gameLogic: GameLogicInfo): GameLogicInfo {

    if (!game?.currentPlayer)
        throw Error("Invalid player to determine card to play.");

    let score = 0;
    const retval = { ...gameLogic };

    for (const card of game.currentPlayer.hand)
        score += getCardValue(card, flipCard);

    retval.handScore = score;

    retval.handScore += getPositiveModifierForBid(game, flipCard, gameLogic);
    retval.handScore -= getNegativeModifierForBid(game, flipCard, gameLogic);
    retval.handScore += getRiskScoreForBid(game, gameLogic);

    return retval;
}

function getBidResultForSecondRound(game: EuchreGameInstance, flipCard: Card, gameLogic: GameLogicInfo): GameLogicInfo {

    if (!game?.currentPlayer)
        throw Error("Invalid player to determine card to play.");

    let highScore = 0;
    let bestSuit: Suit | undefined;
    let score = 0;
    const retval = { ...gameLogic };
    const suits: Suit[] = ["♠", "♥", "♦", "♣"];
    
    for (const suit of suits.filter(s => s !== flipCard.suit)) {
        const tempCard = new Card(suit, "2");
        for (const card of game.currentPlayer.hand)
            score += getCardValue(card, tempCard);

        if (score > highScore)
        {
            highScore = score;
            bestSuit = suit;
        }
    }

    retval.handScore = highScore;
    retval.suitToCall = bestSuit;

    return retval;
}

function determineTrickWon(trump: Card | undefined, trick: EuchreTrick): EuchrePlayer | undefined {

    // if (trick.cardsPlayed.length < 4 || !trump)
    //     return undefined;

    // let winningCard: EuchreCard | undefined;
    // let cardValue: number = 0;

    // for (let i = 0; i < 4; i++) {
    //     const card = trick.cardsPlayed[i];
    //     const temp = getCardValue(card, trump);
    //     if (temp > cardValue)
    //         winningCard = card;
    // }

    // return winningCard?.player;

    return undefined;
}

function getCardValue(card: Card, trump: Card): number {
    return getCardValueBySuit(card, trump.suit, trump.color);
}

function getCardValueBySuit(card: Card, trumpSuit: Suit, trumpColor: "R" | "B") {

    let retval = 0;

    if (card.suit === trumpSuit) {
        retval = trumpValues.get(card.value) ?? 0;
    } else if (card.value === "J" && card.color === trumpColor) {
        retval = LEFT_BOWER_VALUE;
    } else {
        retval = (offsuitValues.get(card.value) ?? 0);
    }

    return retval;
}


function getQualifyingScore() {
    return 600;
}

function getQualifyingLonerScore() {
    return 800;
}

function getPositiveModifierForBid(game: EuchreGameInstance, flipCard: Card, gameLogic: GameLogicInfo) {
    return 0;
}

function getNegativeModifierForBid(game: EuchreGameInstance, flipCard: Card, gameLogic: GameLogicInfo) {
    return 0;
}

function getRiskScoreForBid(game: EuchreGameInstance, gameLogic: GameLogicInfo): number {

    return 0;
}

export function determineCardToPlayLogic(game: EuchreGameInstance): Card {

    if (!game.currentPlayer)
        throw Error("Invalid player to determine card to play.");

    const card = game.currentPlayer.hand.filter(c => !game.currentPlayer?.playedCards.find(p => p === c))[0];
    game.currentPlayer.playedCards.push(card);

    return card;
}


// function determinCardFromScore(game: EuchreGameInstance): Card {

//     return
// }
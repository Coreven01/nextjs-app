import { Card, EuchreCard, EuchreGameInstance, EuchreTrick, Suit } from "./data";
import { cardIsLeftBower, determineCurrentWinnerForTrick, getCardValue, getSuitCount } from "./game";

interface GamePlayLogic {
    currentUserIsMaker: boolean,
    isCurrentTeamMaker: boolean,
    isFirstPlayer: boolean,
    cardsPlayed: number,
    teamTricksWon: number,
    opponentTricksWon: number,
    trumpCardCount: number,
    offSuitAceCount: number,
    leadCard: EuchreCard | undefined,
    teammateLeadAce: boolean,
    playerHasRight: boolean,
    playerHasLeft: boolean,
    handScore: number,
    suitsInHand: number,
    canPlayOffsuit: boolean,
    isLeading: boolean,
    currentTrick: EuchreTrick,
    teammateYetToPlay:boolean,
}

/** Return a object of important values when making a decision during regular game play.  */
function getGamePlayLogic(game: EuchreGameInstance, trumpSuit: Suit): GamePlayLogic {

    if (!game?.currentPlayer)
        throw Error("Invalid player to determine card to play.");

    if (!game.currentTrick)
        throw Error();

    const currentPlayer = game.currentPlayer;
    let playerHasRight: boolean = false;
    let playerHasLeft: boolean = false;
    let leadCard: EuchreCard | undefined = game.currentTrick.cardsPlayed.at(0);

    const tempCard = new Card(trumpSuit, "2");

    // teammate lead an offsuit ace:
    const leadAce = leadCard?.player !== currentPlayer &&
        leadCard?.player.team === currentPlayer.team &&
        leadCard.card.value === "A" &&
        leadCard.card.suit !== game.trump?.suit;

    const leadCardIsLeftBower = leadCard ? cardIsLeftBower(leadCard.card, tempCard) : false;
    const suitToFollow = leadCardIsLeftBower ? trumpSuit : leadCard?.card.suit;
    const canPlayOffSuit: boolean = (suitToFollow && leadCard && currentPlayer.hand.filter(c => c.suit === suitToFollow).length === 0) ?? true;

    playerHasRight = currentPlayer.hand.filter(c => c.suit === tempCard.suit && c.value === "J").length > 0;
    playerHasLeft = currentPlayer.hand.filter(c => c.color === tempCard.color && c.value === "J" && c.suit != tempCard.suit).length > 0;

    const info: GamePlayLogic = {
        currentUserIsMaker: game.maker === currentPlayer,
        isCurrentTeamMaker: game.maker?.team === currentPlayer.team,
        isFirstPlayer: game.gamePlayers.map(p => p.playedCards).flat().length === 0,
        cardsPlayed: currentPlayer.playedCards.length,
        teamTricksWon: game.gameTricks.filter(t => t.playerWon && t.playerWon.team === currentPlayer?.team).length,
        opponentTricksWon: game.gameTricks.filter(t => t.playerWon && t.playerWon.team !== currentPlayer?.team).length,
        trumpCardCount: currentPlayer.hand.filter(c => c.suit === game.trump?.suit).length,
        leadCard: leadCard,
        teammateLeadAce: leadAce,
        offSuitAceCount: currentPlayer.hand.filter(c => c.suit !== tempCard.suit && c.value === "A").length,
        playerHasRight: playerHasRight,
        playerHasLeft: playerHasLeft,
        handScore: 0,
        suitsInHand: new Set(game.currentPlayer.hand.map(c => c.suit)).entries.length,
        canPlayOffsuit: canPlayOffSuit,
        isLeading: leadCard === undefined,
        currentTrick: game.gameTricks.at(-1) ?? new EuchreTrick(),
        teammateYetToPlay: game.currentRoundTricks.length < 2,
    }

    return info;
}

export function determineCardToPlayLogic(game: EuchreGameInstance): Card {

    if (!game.currentPlayer)
        throw Error("Invalid player to determine card to play.");

    if (!game.trump)
        throw Error();

    const gamePlayLogicResult = getGamePlayLogic(game, game.trump.suit);
    let cardToPlay: Card | undefined;
    const playerHand = game.currentPlayer?.hand ?? [];

    if (gamePlayLogicResult.isLeading) {
        cardToPlay = getBestCardForLead(playerHand, game, gamePlayLogicResult);
    } else if (!gamePlayLogicResult.canPlayOffsuit) {
        cardToPlay = getBestCardForFollowSuit(playerHand, game, gamePlayLogicResult);
    } else if (gamePlayLogicResult.teammateLeadAce) {
        cardToPlay = getBestCardWhenTeammateLeadAce(playerHand, game, gamePlayLogicResult);
    } else if (gamePlayLogicResult.isCurrentTeamMaker) {
        cardToPlay = getBestCardWhenTeamIsMaker(playerHand, game, gamePlayLogicResult);
    } else
        cardToPlay = getBestCardWhenDefender(playerHand, game, gamePlayLogicResult)

    if (!cardToPlay)
        throw Error("Error determining card to play");

    return cardToPlay;
}

function getBestCardForLead(playerHand: Card[], game: EuchreGameInstance, gameLogic: GamePlayLogic): Card {

    let cardToPlay: Card | undefined;

    if (!game.trump)
        throw Error();

    if (gameLogic.offSuitAceCount > 0) {
        cardToPlay = playerHand.find(c => c.value === "A" && c.suit !== game.trump?.suit);
    } else if (!gameLogic.currentUserIsMaker) {
        if (gameLogic.opponentTricksWon > gameLogic.teamTricksWon && gameLogic.playerHasRight)
            cardToPlay = playerHand.find(c => c.suit === game.trump?.suit && c.value === "J");
        else {
            cardToPlay = getBestCardWhenTeammateLeadAce(playerHand, game, gameLogic);
        }
    }

    if (!cardToPlay)
        throw Error("Error determining card to play");

    return cardToPlay;
}

function getBestCardForFollowSuit(playerHand: Card[], game: EuchreGameInstance, gameLogic: GamePlayLogic): Card {
    let cardToPlay: Card | undefined;

    if (!gameLogic.leadCard)
        throw Error("Lead card not found");

    if (!game.trump)
        throw Error();

    if (!game.currentPlayer)
        throw Error();

    const currentPlayer = game.currentPlayer;
    const leadCardIsLeftBower = cardIsLeftBower(gameLogic.leadCard.card, game.trump);
    const suitToFollow = leadCardIsLeftBower ? game.trump.suit : gameLogic.leadCard.card.suit;
    const currentWinner = determineCurrentWinnerForTrick(game.trump, gameLogic.currentTrick);

    let bestCardForSuit: Card | undefined;
    let worstCardForSuit: Card | undefined;
    let lowScore = 1000;
    let highScore = 0;

    for (const card of playerHand.filter(c => c.suit === suitToFollow)) {
        const cardVal = getCardValue(card, game.trump);
        if (cardVal > highScore) {
            highScore = cardVal;
            bestCardForSuit = card;
        }

        if (cardVal < lowScore) {
            lowScore = cardVal;
            worstCardForSuit = card;
        }
    }

    if (!bestCardForSuit || !worstCardForSuit)
        throw Error("Error determining card to play");

    if (bestCardForSuit.value === "A") {
        cardToPlay = bestCardForSuit;
    } else if (currentWinner && currentWinner.team === currentPlayer.team) {
        cardToPlay = worstCardForSuit;
    } else {
        cardToPlay = bestCardForSuit;
    }

    if (!cardToPlay)
        throw Error("Error determining card to play");

    return cardToPlay;
}

function getBestCardWhenTeammateLeadAce(playerHand: Card[], game: EuchreGameInstance, gameLogic: GamePlayLogic): Card {

    if (!game.trump)
        throw Error();

    if (!game.currentPlayer)
        throw Error();

    let cardToPlay: Card | undefined;

    const suitCount = getSuitCount(playerHand, game.trump);
    let count = 5;
    let lowestCountSuit: Suit;

    if (suitCount.length > 1) {
        for (const value of suitCount) {
            const tempSuit = value[0] as Suit;
            const tempCount = value[1] as number;

            if (tempSuit === game.trump.suit)
                continue;

            if (tempCount < count) {
                count = tempCount;
                lowestCountSuit = tempSuit;
            }
        }
    } else
        lowestCountSuit = suitCount[0][0] as Suit;

    let lowValue = 1000;
    let lowCard: Card | undefined;
    for (const card of playerHand.filter(c => c.suit === lowestCountSuit && c.suit !== game.trump?.suit)) {
        if (cardIsLeftBower(card, game.trump))
            continue;

        const cardVal = getCardValue(card, game.trump);
        if (cardVal < lowValue) {
            lowValue = cardVal;
            lowCard = card;
        }
    }

    cardToPlay = lowCard;

    if (!cardToPlay)
        throw Error("Error determining card to play");

    return cardToPlay;
}

function getBestCardWhenTeamIsMaker(playerHand: Card[], game: EuchreGameInstance, gameLogic: GamePlayLogic): Card {
    let cardToPlay: Card | undefined;

    const isLowRisk = playerHand.length >= 4;
    const playerIsMaker = game.currentPlayer === game.maker;

    if (gameLogic.isFirstPlayer){
        
    }

    if (!cardToPlay)
        throw Error("Error determining card to play");

    return cardToPlay;
}

function getBestCardWhenDefender(playerHand: Card[], game: EuchreGameInstance, gameLogic: GamePlayLogic): Card {
    let cardToPlay: Card | undefined;

    if (gameLogic.offSuitAceCount > 0) {

    }

    if (!cardToPlay)
        throw Error("Error determining card to play");

    return cardToPlay;
}
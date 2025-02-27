import { Card, EuchreCard, EuchreGameInstance, EuchrePlayer, EuchreTrick, Suit } from "./data";
import { cardIsLeftBower, getCardValue, getHighAndLow, getHighAndLowForSuit, getHighAndLowNotSuit, getSuitCount } from "./game";

interface GamePlayLogic {
    currentUserIsMaker: boolean,
    isCurrentTeamMaker: boolean,

    /** True if no cards have yet to be played for the current hand.  */
    isFirstPlayer: boolean,

    /** Number of cards played for the current player in the current round. */
    cardsPlayed: number,
    teamTricksWon: number,
    opponentTricksWon: number,
    trumpCardCount: number,
    offSuitAceCount: number,

    /** The card the was lead for the current trick. */
    leadCard: EuchreCard | undefined,
    teammateLeadAce: boolean,
    playerHasRight: boolean,
    playerHasLeft: boolean,
    handScore: number,
    suitCount: { suit: Suit, count: number }[],
    canPlayOffsuit: boolean,

    /** True if the current player leads the current trick. */
    isLeading: boolean,
    isLast: boolean,
    currentTrick: EuchreTrick,
    teammateYetToPlay: boolean,
    currentlyLosing: boolean,
    cardValues: { card: Card, value: number }[],
    highLowOffSuit: { high: Card | null, low: Card | null }
    highLowAll: { high: Card | null, low: Card | null }
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
    const leadCard: EuchreCard | undefined = game.currentTrick.cardsPlayed.at(0);

    const tempTrumpCard = new Card(trumpSuit, "2");

    // teammate lead an offsuit ace:
    const leadAce = leadCard?.player !== currentPlayer &&
        leadCard?.player.team === currentPlayer.team &&
        leadCard.card.value === "A" &&
        leadCard.card.suit !== game.trump?.suit;

    const leadCardIsLeftBower = leadCard ? cardIsLeftBower(leadCard.card, tempTrumpCard) : false;
    const suitToFollow = leadCardIsLeftBower ? trumpSuit : leadCard?.card.suit;
    const canPlayOffSuit: boolean = (suitToFollow && leadCard && currentPlayer.hand.filter(c => c.suit === suitToFollow).length === 0) ?? true;
    const suitCount = getSuitCount(currentPlayer.hand, tempTrumpCard);
    const currentWinner = determineCurrentWinnerForTrick(tempTrumpCard, game.currentTrick);
    const cardValues: { card: Card, value: number }[] = [];
    const highLowOffSuit = getHighAndLowNotSuit(currentPlayer.hand, tempTrumpCard, tempTrumpCard.suit);
    const highLow = getHighAndLow(currentPlayer.hand, tempTrumpCard);

    for (const card of currentPlayer.hand) {
        cardValues.push({ card: card, value: getCardValue(card, tempTrumpCard) });
    }

    playerHasRight = currentPlayer.hand.filter(c => c.suit === tempTrumpCard.suit && c.value === "J").length > 0;
    playerHasLeft = currentPlayer.hand.filter(c => c.color === tempTrumpCard.color && c.value === "J" && c.suit != tempTrumpCard.suit).length > 0;

    const info: GamePlayLogic = {
        currentUserIsMaker: game.maker === currentPlayer,
        isCurrentTeamMaker: game.maker?.team === currentPlayer.team,
        isFirstPlayer: game.gamePlayers.map(p => p.playedCards).flat().length === 0,
        cardsPlayed: currentPlayer.playedCards.length,
        teamTricksWon: game.gameTricks.filter(t => t.playerWon && t.playerWon.team === currentPlayer?.team).length,
        opponentTricksWon: game.gameTricks.filter(t => t.playerWon && t.playerWon.team !== currentPlayer?.team).length,
        trumpCardCount: suitCount.find(c => c.suit === tempTrumpCard.suit)?.count ?? 0,
        leadCard: leadCard,
        teammateLeadAce: leadAce,
        offSuitAceCount: currentPlayer.hand.filter(c => c.suit !== tempTrumpCard.suit && c.value === "A").length,
        playerHasRight: playerHasRight,
        playerHasLeft: playerHasLeft,
        handScore: 0,
        suitCount: suitCount,
        canPlayOffsuit: canPlayOffSuit,
        isLeading: leadCard === undefined,
        isLast: game.currentRoundTricks.length === 3,
        currentTrick: game.currentTrick,
        teammateYetToPlay: game.currentRoundTricks.length < 2,
        currentlyLosing: currentWinner ? currentWinner.team === currentPlayer.team : false,
        cardValues: cardValues,
        highLowOffSuit: highLowOffSuit,
        highLowAll: highLow
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

    if (gameLogic.currentUserIsMaker && gameLogic.trumpCardCount < 3 && gameLogic.teamTricksWon < 2 && gameLogic.offSuitAceCount === 0) {
        // low number of trump and team has yet to win a trick. play a low card hoping your partner will take the trick.
        if (gameLogic.highLowOffSuit.low)
            cardToPlay = gameLogic.highLowOffSuit.low;
    } else if (gameLogic.currentUserIsMaker && gameLogic.trumpCardCount > 3 && game.loner) {
        // high number of trump and current user is maker and went alone. standard strategy is to play cards from highest to lowest.
        if (gameLogic.highLowAll.high)
            cardToPlay = gameLogic.highLowAll.high;
    } else if (gameLogic.currentUserIsMaker) {

    } else if (gameLogic.offSuitAceCount > 0) {
        cardToPlay = playerHand.find(c => c.value === "A" && c.suit !== game.trump?.suit);
    } else if (!gameLogic.isCurrentTeamMaker) {
        if (gameLogic.opponentTricksWon > gameLogic.teamTricksWon && gameLogic.playerHasRight)
            cardToPlay = playerHand.find(c => c.suit === game.trump?.suit && c.value === "J");
        else {
            cardToPlay = getBestCardWhenTeammateLeadAce(playerHand, game, gameLogic);
        }
    } else if (gameLogic.isCurrentTeamMaker) {

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

    const highAndLowCards = getHighAndLowForSuit(playerHand, game.trump, suitToFollow);
    const bestCardForSuit: Card | null = highAndLowCards.high;
    const worstCardForSuit: Card | null = highAndLowCards.low;

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

    let count = 5;
    let lowestCountSuit: Suit;

    if (gameLogic.suitCount.length > 1) {
        for (const value of gameLogic.suitCount) {

            if (value.suit === game.trump.suit)
                continue;

            if (value.count < count) {
                count = value.count;
                lowestCountSuit = value.suit;
            }
        }
    } else
        lowestCountSuit = gameLogic.suitCount[0].suit;

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

    const cardToPlay = lowCard;

    if (!cardToPlay)
        throw Error("Error determining card to play");

    return cardToPlay;
}

function getBestCardWhenTeamIsMaker(playerHand: Card[], game: EuchreGameInstance, gameLogic: GamePlayLogic): Card {
    let cardToPlay: Card | undefined;

    const isLowRisk = playerHand.length >= 4;
    const playerIsMaker = game.currentPlayer === game.maker;

    if (gameLogic.isFirstPlayer) {

    }

    if (!cardToPlay)
        throw Error("Error determining card to play");

    return cardToPlay;
}

function getBestCardWhenDefender(playerHand: Card[], game: EuchreGameInstance, gameLogic: GamePlayLogic): Card {
    let cardToPlay: Card | undefined;

    if (gameLogic.isLast && gameLogic.currentlyLosing) {
        if (gameLogic.trumpCardCount > 0) {

        } else {

        }
    } else if (!gameLogic.isLast && !gameLogic.currentlyLosing) {

    } else if (gameLogic.teammateYetToPlay) {

    } else if (gameLogic.opponentTricksWon > 1) {

    } else {

    }

    if (!cardToPlay)
        throw Error("Error determining card to play");

    return cardToPlay;
}

export function playGameCard(player: EuchrePlayer, card: Card, game: EuchreGameInstance): EuchreGameInstance {

    const newGame = game.shallowCopy();

    if (!game.currentTrick)
        throw Error();

    const euchreCard = new EuchreCard(player, card);
    player.hand = player.hand.filter(c => c !== card);
    player.playedCards.push(card);

    game.currentTrick.cardsPlayed.push(euchreCard);

    return newGame;
}

export function determineCurrentWinnerForTrick(trump: Card, trick: EuchreTrick): EuchrePlayer | undefined {

    let winningCard: EuchreCard | undefined;
    let cardValue: number = 0;

    for (let i = 0; i < trick.cardsPlayed.length; i++) {
        const card = trick.cardsPlayed[i];
        const temp = getCardValue(card.card, trump);
        if (temp > cardValue)
            winningCard = card;
    }

    return winningCard?.player;
}
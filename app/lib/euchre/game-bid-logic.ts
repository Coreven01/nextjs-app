import { BidResult, Card, EuchreGameInstance, EuchrePlayer, Suit } from './definitions';
import { getCardValue } from './game';

interface GameBidLogic {
  trumpCardCount: number;
  offSuitAceCount: number;
  playerHasRight: boolean;
  playerHasLeft: boolean;
  playerWillPickUp: boolean;
  teamWillPickup: boolean;
  handScore: number;
  suitToCall: Suit | null;
  suitsInHand: number;
}

/** Return a object of important values when making a decision during the bidding process.  */
function getGameBidLogic(
  game: EuchreGameInstance,
  flipCard: Card,
  canNameSuit: boolean
): GameBidLogic {
  if (!game?.currentPlayer) throw Error('Invalid player to determine card to play.');

  const currentPlayer = game.currentPlayer;
  const playerCards = currentPlayer.availableCards;

  let playerHasRight: boolean = false;
  let playerHasLeft: boolean = false;
  const playerWillPickup: boolean = game.dealer === currentPlayer;

  if (!canNameSuit) {
    playerHasRight =
      playerCards.filter((c) => c.suit === flipCard.suit && c.value === 'J').length > 0;
    playerHasLeft =
      playerCards.filter(
        (c) => c.color === flipCard.color && c.value === 'J' && c.suit != flipCard.suit
      ).length > 0;

    if (!playerHasRight && playerWillPickup) {
      playerHasRight = flipCard.value === 'J';
    }
  }

  const info: GameBidLogic = {
    trumpCardCount: playerCards.filter((c) => c.suit === game.trump?.suit).length,
    offSuitAceCount: playerCards.filter((c) => c.suit != flipCard.suit && c.value === 'A').length,
    playerHasRight: playerHasRight,
    playerHasLeft: playerHasLeft,
    playerWillPickUp: playerWillPickup,
    teamWillPickup: game.dealer?.team === currentPlayer.team,
    handScore: 0,
    suitToCall: null,
    suitsInHand: 0
  };

  return info;
}

/** Determine how an AI player should play during the bidding round.
 *  Uses heuristic evaluation to create a score. If the score exceeds a value, then the player will name trump.
 */
function determineBidLogic(
  game: EuchreGameInstance,
  flipCard: Card,
  canNameSuit: boolean
): BidResult {
  if (!game?.currentPlayer) throw Error('Invalid player to determine card to play.');

  const gameLogicResult = getGameBidLogic(game, flipCard, canNameSuit);
  let modifiedResult: GameBidLogic;

  if (canNameSuit) modifiedResult = getBidResultForSecondRound(game, flipCard, gameLogicResult);
  else modifiedResult = getBidResultForFirstRound(game, flipCard, gameLogicResult);

  const retval: BidResult = { orderTrump: false, loner: false, calledSuit: null };

  if (modifiedResult.handScore >= getQualifyingScore()) {
    retval.orderTrump = true;
    retval.loner = modifiedResult.handScore >= getQualifyingLonerScore();
    retval.calledSuit = canNameSuit ? modifiedResult.suitToCall : null;

    return retval;
  }

  return retval;
}

/** */
function getBidResultForFirstRound(
  game: EuchreGameInstance,
  flipCard: Card,
  gameLogic: GameBidLogic
): GameBidLogic {
  if (!game?.currentPlayer) throw Error('Invalid player to determine card to play.');

  let highScore = 0;
  const playerCards: Card[] = game.currentPlayer.availableCards;
  const retval = { ...gameLogic };
  const getHandScore = (hand: Card[]) => {
    let score = 0;
    for (const card of hand) score += getCardValue(card, flipCard);

    return score;
  };

  highScore = getHandScore(playerCards);

  // if current user is dealer, then check each hand with/without trump card.
  if (gameLogic.playerWillPickUp) {
    for (const card of playerCards) {
      const newHand = [...playerCards.filter((c) => c !== card), flipCard];
      const tempScore = getHandScore(newHand);
      if (tempScore > highScore) highScore = tempScore;
    }
  }

  retval.handScore = highScore;
  retval.handScore += getPositiveModifierForBid(game, flipCard, gameLogic);
  retval.handScore -= getNegativeModifierForBid(game, flipCard, gameLogic);
  retval.handScore += getRiskScoreForBid(game, gameLogic);

  return retval;
}

function getBidResultForSecondRound(
  game: EuchreGameInstance,
  flipCard: Card,
  gameLogic: GameBidLogic
): GameBidLogic {
  if (!game?.currentPlayer) throw Error('Invalid player to determine card to play.');

  let highScore = 0;
  let bestSuit: Suit | null = null;
  let score = 0;
  const retval = { ...gameLogic };
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];
  const playerCards: Card[] = game.currentPlayer.availableCards;

  for (const suit of suits.filter((s) => s !== flipCard.suit)) {
    const tempCard = new Card(suit, '2');
    for (const card of playerCards) score += getCardValue(card, tempCard);

    if (score > highScore) {
      highScore = score;
      bestSuit = suit;
    }

    score = 0;
  }

  retval.handScore = highScore;
  retval.suitToCall = bestSuit;

  return retval;
}

function getQualifyingScore() {
  return 600;
}

function getQualifyingLonerScore() {
  return 800;
}

function getPositiveModifierForBid(
  game: EuchreGameInstance,
  flipCard: Card,
  gameLogic: GameBidLogic
) {
  return 0;
}

function getNegativeModifierForBid(
  game: EuchreGameInstance,
  flipCard: Card,
  gameLogic: GameBidLogic
) {
  return 0;
}

function getRiskScoreForBid(game: EuchreGameInstance, gameLogic: GameBidLogic): number {
  return 0;
}

function determineDiscard(game: EuchreGameInstance, player: EuchrePlayer): Card {
  if (!game.trump) throw Error('Unable to determine discard. Trump card not found.');

  //const gameLogicResult = getGameLogic(game, game.trump, false);

  let lowestScore = 10000;
  let lowCard: Card | undefined;
  const playerCards: Card[] = player.availableCards;

  for (const card of [...playerCards, game.trump]) {
    const tempScore = getCardValue(card, game.trump);
    if (tempScore < lowestScore) {
      lowestScore = tempScore;
      lowCard = card;
    }
  }

  if (!lowCard) throw Error('Unable to determine discard.');

  return lowCard;
}

export { determineBidLogic, determineDiscard };

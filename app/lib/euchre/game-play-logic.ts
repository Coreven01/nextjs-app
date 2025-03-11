import { CardTransformation } from '@/app/hooks/euchre/useMoveCard';
import {
  Card,
  CardValue,
  EuchreCard,
  EuchreGameInstance,
  EuchrePlayer,
  EuchreSettings,
  EuchreTrick,
  Suit
} from './definitions';
import {
  cardIsLeftBower,
  getCardValue,
  getCardValuesForSuit,
  getHighAndLow,
  getHighAndLowForSuit,
  getHighAndLowExcludeSuit,
  getSuitCount,
  getCardValuesExcludeSuit,
  getPlayerRotation
} from './game';
import { EuchreGameFlow, GameFlowState } from '@/app/hooks/euchre/gameFlowReducer';

interface PlayCardResult {
  transformations: CardTransformation[][];
  card: Card;
}

//#region Logic information used to decide which card to play.
interface TeamLogic {
  currentUserIsMaker: boolean;
  teammateIsMaker: boolean;

  /** True if no cards have yet to be played for the current hand.  */
  isFirstPlayer: boolean;

  /** Number of cards played for the current player in the current round. */
  cardsPlayed: number;

  /** True if the current player leads the current trick. */
  isLeading: boolean;

  /** True if the current player plays the last card for the trick */
  isLast: boolean;
  teammateYetToPlay: boolean;
}

interface TrumpLogic {
  /** Total trump count for the players entire hand. */
  trumpCardCount: number;

  /** True if the player has right bower */
  playerHasRight: boolean;

  /** True if the player has the left bower */
  playerHasLeft: boolean;

  /** Current cards available to play that are trump. High is the highest value, low is the lowest value. */
  trumpHighLow: { high: Card | null; low: Card | null };

  /** Dealer picked up the right bower. */
  knownPlayerWithRight: EuchrePlayer | null;

  /** Saw the right bower was played by any player */
  rightWasSeen: boolean;

  /** Saw the left bower was played by any player */
  leftWasSeen: boolean;
}

interface OffsuitLogic {
  /** Number of aces currently available to play. */
  offSuitAceCount: number;

  /** Cards that don't follow trump suit. High is the highest value, low is the lowest value. */
  offsuitHighLow: { high: Card | null; low: Card | null };

  /** True if teammate lead an offsuit ace. */
  teammateLeadAce: boolean;
}

interface TrickLogic {
  /** True if any player lead trump for the current trick. */
  trumpWasLead: boolean;

  /** All the card values in the players hand available to play. */
  cardValues: { card: Card; value: number }[];

  /** The card the was lead for the current trick. */
  leadCard: EuchreCard | null;

  /** Number of tricks won by the team for the current hand */
  teamTricksWon: number;

  /** Number of tricks won by the team for the current hand */
  opponentTricksWon: number;

  /** Cards available to play that beat the current winning card for the trick. */
  winningHighLow: { high: Card | null; low: Card | null };

  /** All other cards available to player that won't beat the current winning card. */
  losingHighLow: { high: Card | null; low: Card | null };

  /** Card and user that is currently winning the trick. */
  currentWinningCard: { card: EuchreCard | null; value: number };

  /** Cards that are available to play if the user must follow suit. */
  cardsAvailableToFollowSuit: { card: Card; value: number }[];

  /** Map of suit to the count of those suits in the players hand. */
  suitCount: { suit: Suit; count: number }[];

  /** True if the player must follow suit. */
  mustFollowSuit: boolean;

  /** Suit that must be followed */
  suitToFollow: Suit | null;

  /** Reference to the cards that have been played in the current trick. */
  currentTrick: EuchreTrick;

  /** True if the player's team is currently losing the hand. */
  currentlyLosing: boolean;

  /** Array of suits that were lead for the current hand. General strategy is to avoid leading the same suit more than once
   * becuase changes are the opposing team will not have any left to follow suit.
   */
  suitsLeadForHand: Set<Suit>;

  leadCardIsRight: boolean;

  leadCardIsLeft: boolean;
}

interface GamePlayLogic {
  teamInfo: TeamLogic;
  trumpInfo: TrumpLogic;
  offsuitInfo: OffsuitLogic;
  trickInfo: TrickLogic;
}

/** Return a object of important values when making a decision during regular game play.  */
function getGamePlayLogic(game: EuchreGameInstance): GamePlayLogic {
  const retval: GamePlayLogic = {
    teamInfo: getTeamLogic(game),
    trumpInfo: getTrumpLogic(game),
    offsuitInfo: getOffsuitLogic(game),
    trickInfo: getTrickLogic(game)
  };

  return retval;
}

function getTrickLogic(game: EuchreGameInstance): TrickLogic {
  if (!game?.currentPlayer) throw Error('Invalid player to determine card to play.');

  if (!game.currentTrick) throw Error();

  if (!game.trump) throw Error();

  if (!game.dealer) throw Error();

  const suitsThatHaveBeenLead: Suit[] = [];
  const currentPlayer = game.currentPlayer;
  const playerCards: Card[] = currentPlayer.availableCards;
  const leadCard: EuchreCard | null = game.currentTrick.cardsPlayed.at(0) ?? null;
  const leadCardIsRightBower = leadCard
    ? leadCard.card.suit === game.trump.suit && leadCard.card.value === 'J'
    : false;
  const leadCardIsLeftBower = leadCard ? cardIsLeftBower(leadCard.card, game.trump) : false;
  const trumpWasLead: boolean = leadCard
    ? leadCard.card.suit === game.trump.suit || leadCardIsLeftBower
    : false;

  const suitToFollow = leadCardIsLeftBower ? game.trump.suit : leadCard?.card.suit;
  const suitCount = getSuitCount(playerCards, game.trump);

  const mustFollowSuit: boolean =
    suitCount.filter((s) => s.suit === suitToFollow && s.count > 0).length > 0;
  const currentWinningCard = determineCurrentWinnerForTrick(game.trump, game.currentTrick);
  const winningCardVal = currentWinningCard.value;

  // if must follow suit, then only return cards that match the lead card.
  const cardsAvailableToPlay = getCardValuesForSuit(
    playerCards,
    game.trump,
    mustFollowSuit ? (suitToFollow ?? null) : null
  );

  //let winningCards: { card: Card; value: number }[];
  //let losingCards: { card: Card; value: number }[];

  const winningCards = cardsAvailableToPlay.filter((c) => {
    return (
      // winning cards are all available cards if no lead card
      leadCard === null ||
      // winning cards are trump cards with higher value than the current winning card.
      (c.value > winningCardVal &&
        game.trump &&
        (c.card.suit === game.trump?.suit || cardIsLeftBower(c.card, game.trump))) ||
      // winning cards are also cards that follow lead and higher value than current winning card.
      (c.value > winningCardVal && c.card.suit === suitToFollow)
    );
  });
  const losingCards = cardsAvailableToPlay.filter((c) => !winningCards.includes(c));

  const cardValues: { card: Card; value: number }[] = getCardValuesForSuit(
    playerCards,
    game.trump,
    null
  );

  const winningHighLow = getHighAndLow(
    winningCards.map((c) => c.card),
    game.trump
  );
  const losingHighLow = getHighAndLow(
    losingCards.map((c) => c.card),
    game.trump
  );

  for (const trick of game.currentTricks) {
    if (trick.cardsPlayed.length) suitsThatHaveBeenLead.push(trick.cardsPlayed[0].card.suit);
  }

  const retval: TrickLogic = {
    trumpWasLead: leadCard
      ? leadCard.card.suit === game.trump.suit || cardIsLeftBower(leadCard.card, game.trump)
      : false,
    cardValues: cardValues,
    leadCard: leadCard,
    teamTricksWon: game.currentTricks.filter((t) => t.taker && t.taker.team === currentPlayer?.team)
      .length,
    opponentTricksWon: game.currentTricks.filter(
      (t) => t.taker && t.taker.team !== currentPlayer?.team
    ).length,
    winningHighLow: winningHighLow,
    losingHighLow: losingHighLow,
    currentWinningCard: currentWinningCard,
    cardsAvailableToFollowSuit: cardsAvailableToPlay,
    suitCount: suitCount,
    mustFollowSuit: mustFollowSuit,
    suitToFollow: suitToFollow ?? null,
    currentTrick: game.currentTrick,
    currentlyLosing: currentWinningCard.card?.player
      ? currentWinningCard.card.player.team !== currentPlayer.team
      : false,
    suitsLeadForHand: new Set<Suit>(suitsThatHaveBeenLead),
    leadCardIsLeft: leadCardIsLeftBower,
    leadCardIsRight: leadCardIsRightBower
  };

  return retval;
}

function getTeamLogic(game: EuchreGameInstance): TeamLogic {
  if (!game?.currentPlayer) throw Error('Invalid player to determine card to play.');

  if (!game.currentTrick) throw Error();

  const currentPlayer = game.currentPlayer;
  const leadCard: EuchreCard | null = game.currentTrick.cardsPlayed.at(0) ?? null;

  const teamLogic: TeamLogic = {
    currentUserIsMaker: game.maker === currentPlayer,
    teammateIsMaker: game.maker?.team === currentPlayer.team,
    isFirstPlayer: game.gamePlayers.map((p) => p.playedCards).flat().length === 0,
    cardsPlayed: currentPlayer.playedCards.length,
    isLeading: leadCard === null,
    isLast: game.currentTrick.cardsPlayed.length === 3,
    teammateYetToPlay: game.currentTrick.cardsPlayed.length < 2
  };

  return teamLogic;
}

function getTrumpLogic(game: EuchreGameInstance): TrumpLogic {
  if (!game?.currentPlayer) throw Error('Invalid player to determine card to play.');

  if (!game.trump) throw Error();

  if (!game.dealer) throw Error();

  const currentPlayer = game.currentPlayer;
  const playerCards: Card[] = currentPlayer.availableCards;
  const trumpCards = getCardValuesForSuit(
    [...playerCards, ...currentPlayer.playedCards],
    game.trump,
    game.trump.suit
  );

  const retval: TrumpLogic = {
    trumpCardCount: trumpCards.length,
    playerHasRight:
      playerCards.find((c) => c.suit === game?.trump?.suit && c.value === 'J') !== undefined,
    playerHasLeft:
      playerCards.find((c) => cardIsLeftBower(c, game.trump ?? new Card('♠', '2'))) !== undefined,
    trumpHighLow: getHighAndLowForSuit(playerCards, game.trump, game.trump.suit),
    rightWasSeen:
      game.currentTricks
        .flat()
        .map((t) => t.cardsPlayed)
        .flat()
        .find((c) => c.card.suit === game.trump?.suit && c.card.value === 'J') !== undefined,
    leftWasSeen:
      game.currentTricks
        .flat()
        .map((t) => t.cardsPlayed)
        .flat()
        .find((c) => cardIsLeftBower(c.card, game?.trump ?? new Card('♠', '2'))) !== undefined,
    knownPlayerWithRight: game.trump.value === 'J' ? game.dealer : null
  };

  return retval;
}

function getOffsuitLogic(game: EuchreGameInstance): OffsuitLogic {
  if (!game?.currentPlayer) throw Error('Invalid player to determine card to play.');

  if (!game.currentTrick) throw Error();

  if (!game.trump) throw Error();

  if (!game.dealer) throw Error();

  const currentPlayer = game.currentPlayer;
  const playerCards: Card[] = currentPlayer.availableCards;
  const leadCard: EuchreCard | null = game.currentTrick.cardsPlayed.at(0) ?? null;
  const offSuitCards = getCardValuesExcludeSuit(playerCards, game.trump, game.trump.suit);

  // teammate lead an offsuit ace:
  const leadAce =
    leadCard?.player !== currentPlayer &&
    leadCard?.player.team === currentPlayer.team &&
    leadCard.card.value === 'A' &&
    leadCard.card.suit !== game.trump?.suit;

  const retval: OffsuitLogic = {
    offSuitAceCount: offSuitCards.filter((c) => c.card.value === 'A').length,
    offsuitHighLow: getHighAndLowExcludeSuit(playerCards, game.trump, game.trump.suit),
    teammateLeadAce: leadAce
  };

  return retval;
}

function validateGamePlayLogic(logic: GamePlayLogic) {
  if (logic.trickInfo.cardValues.length === 0) throw new Error('Invalid card values');

  if (
    logic.trickInfo.winningHighLow.high === null &&
    logic.trickInfo.winningHighLow.low === null &&
    logic.trickInfo.losingHighLow.high === null &&
    logic.trickInfo.losingHighLow.low === null
  )
    throw new Error('Invalid winning and losing cards');
}

//#endregion

/** Main entry point to determine which card to play for a computer player.  */
export function determineCardToPlayLogic(game: EuchreGameInstance): Card {
  if (!game.currentPlayer) throw Error('Invalid player to determine card to play.');

  const playerHand = game.currentPlayer.availableCards;

  if (playerHand.length === 1) return playerHand[0];

  const logic: GamePlayLogic = getGamePlayLogic(game);
  validateGamePlayLogic(logic);
  let cardToPlay: Card;

  if (logic.teamInfo.isLeading) {
    cardToPlay = getBestCardForLead(playerHand, game, logic);
  } else if (logic.trickInfo.mustFollowSuit) {
    cardToPlay = getBestCardForFollowSuit(playerHand, game, logic);
  } else if (logic.offsuitInfo.teammateLeadAce) {
    cardToPlay = getBestCardWhenTeammateLeadAce(playerHand, game, logic);
  } else if (logic.teamInfo.currentUserIsMaker || logic.teamInfo.teammateIsMaker) {
    cardToPlay = getBestCardWhenTeamIsMaker(playerHand, game, logic);
  } else cardToPlay = getBestCardWhenDefender(playerHand, game, logic);

  return cardToPlay;
}

/** Choose best card to play when leading the current trick. */
function getBestCardForLead(hand: Card[], game: EuchreGameInstance, logic: GamePlayLogic): Card {
  let cardToPlay: Card | undefined;

  if (!game.trump) throw Error();

  if (
    logic.teamInfo.currentUserIsMaker &&
    logic.trumpInfo.trumpCardCount < 3 &&
    logic.trickInfo.teamTricksWon < 2 &&
    logic.offsuitInfo.offSuitAceCount === 0
  ) {
    // low number of trump and team has yet to win a trick. play an offsuit card hoping it will win, or your partner will win.
    if (logic.offsuitInfo.offsuitHighLow.high) cardToPlay = logic.offsuitInfo.offsuitHighLow.high;
  } else if (
    logic.teamInfo.currentUserIsMaker &&
    logic.trumpInfo.trumpCardCount > 3 &&
    game.loner
  ) {
    // high number of trump and current user is maker and went alone. standard strategy is to play cards from highest to lowest.
    if (logic.trumpInfo.trumpHighLow.high) cardToPlay = logic.trumpInfo.trumpHighLow.high;
    else if (logic.offsuitInfo.offsuitHighLow.high)
      cardToPlay = logic.offsuitInfo.offsuitHighLow.high;
  } else if (
    logic.teamInfo.currentUserIsMaker &&
    logic.offsuitInfo.offSuitAceCount > 0 &&
    logic.trickInfo.teamTricksWon < 2
  ) {
    // play an offsuit ace if available.
    if (logic.offsuitInfo.offsuitHighLow.high) cardToPlay = logic.offsuitInfo.offsuitHighLow.high;
  } else if (!logic.teamInfo.currentUserIsMaker && !logic.teamInfo.teammateIsMaker) {
    // if opponent called trump, but player has right bower, play that card.
    if (
      logic.trickInfo.opponentTricksWon > logic.trickInfo.teamTricksWon &&
      logic.trumpInfo.playerHasRight
    )
      cardToPlay = hand.find((c) => c.suit === game.trump?.suit && c.value === 'J');
    else if (logic.offsuitInfo.offsuitHighLow.high) {
      cardToPlay = logic.offsuitInfo.offsuitHighLow.high;
    } else if (logic.trickInfo.winningHighLow.low) {
      cardToPlay = logic.trickInfo.winningHighLow.low;
    }
  } else if (
    logic.teamInfo.currentUserIsMaker &&
    (logic.trumpInfo.playerHasRight || logic.trumpInfo.rightWasSeen) &&
    (logic.trumpInfo.playerHasLeft || logic.trumpInfo.leftWasSeen) &&
    logic.trickInfo.teamTricksWon >= 2
  ) {
    // if current user is maker, then attempt to pull the rest of the trump by
    // playing high trump cards
    if (logic.trickInfo.winningHighLow.high) cardToPlay = logic.trickInfo.winningHighLow.high;
  } else if (
    logic.teamInfo.currentUserIsMaker &&
    logic.trickInfo.teamTricksWon > 0 &&
    logic.trumpInfo.trumpCardCount > 3 &&
    logic.trickInfo.winningHighLow.high
  ) {
    cardToPlay = logic.trickInfo.winningHighLow.high;
  } else if (
    logic.teamInfo.teammateIsMaker &&
    !logic.trumpInfo.rightWasSeen &&
    !logic.trumpInfo.leftWasSeen &&
    logic.trickInfo.teamTricksWon >= 2 &&
    !logic.trumpInfo.playerHasLeft &&
    !logic.trumpInfo.playerHasRight &&
    logic.trumpInfo.trumpHighLow.low
  ) {
    // logic here is to assume if your partner called trump, and the left and right have not been seen, then
    // partner has both. if already won 2 tricks from playing offsuit, the lead with a low trump so that
    // partner can with the trump from the opposing team and hopefully win the last trick fron an offsuit ace.
    cardToPlay = logic.trumpInfo.trumpHighLow.low;
  } else if (logic.teamInfo.currentUserIsMaker) {
    if (logic.trickInfo.winningHighLow.high) cardToPlay = logic.trickInfo.winningHighLow.high;
    else if (logic.trickInfo.losingHighLow.high) cardToPlay = logic.trickInfo.losingHighLow.high;
  } else if (logic.trickInfo.winningHighLow.high) {
    cardToPlay = logic.trickInfo.winningHighLow.high;
  }

  if (!cardToPlay) throw Error('Error determining card to play - Best card for lead.');

  return cardToPlay;
}

/** Choose best card when the player must follow suit.  */
function getBestCardForFollowSuit(
  hand: Card[],
  game: EuchreGameInstance,
  gameLogic: GamePlayLogic
): Card {
  let cardToPlay: Card | undefined;

  if (!gameLogic.trickInfo.leadCard) throw Error('Lead card not found');

  if (!game.trump) throw Error();

  if (gameLogic.trickInfo.cardsAvailableToFollowSuit.length === 0)
    throw new Error('Invalid card for follow suit. No cards found.');

  // if only one card, then this card must be played.
  if (gameLogic.trickInfo.cardsAvailableToFollowSuit.length === 1)
    return gameLogic.trickInfo.cardsAvailableToFollowSuit[0].card;

  if (gameLogic.trickInfo.currentlyLosing && gameLogic.teamInfo.isLast) {
    // if playing last and a winning card is available, play that card, otherwise play a weak losing card.
    if (gameLogic.trickInfo.winningHighLow.low) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    } else if (gameLogic.trickInfo.losingHighLow.low) {
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    }
  } else if (
    gameLogic.trickInfo.trumpWasLead &&
    gameLogic.trickInfo.currentlyLosing &&
    gameLogic.teamInfo.teammateYetToPlay &&
    gameLogic.teamInfo.currentUserIsMaker
  ) {
    // this usually doesn't happen. nobody typically leads trump if they don't know where the right bower is at.
    if (gameLogic.trickInfo.winningHighLow.high) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.high;
    } else if (gameLogic.trickInfo.losingHighLow.low) {
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    }
  } else if (
    gameLogic.trumpInfo.playerHasRight &&
    gameLogic.trickInfo.leadCard.player.team === game.currentPlayer?.team &&
    gameLogic.trickInfo.leadCardIsLeft
  ) {
    // teammate led left bower and current player has right. play lowest card possible.
    if (gameLogic.trickInfo.losingHighLow.low) cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    else if (gameLogic.trickInfo.winningHighLow.low)
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
  } else if (
    gameLogic.trickInfo.trumpWasLead &&
    gameLogic.teamInfo.currentUserIsMaker &&
    gameLogic.trumpInfo.playerHasRight &&
    gameLogic.trickInfo.winningHighLow.high
  ) {
    // player led trump but wasn't the maker. if current player has right bower then play it now.
    cardToPlay = gameLogic.trickInfo.winningHighLow.high;
  } else if (!gameLogic.trickInfo.trumpWasLead) {
    // if playing trump offsuit,
    if (
      gameLogic.trickInfo.winningHighLow.high &&
      gameLogic.trickInfo.winningHighLow.high.value === 'A'
    ) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.high;
    } else if (
      gameLogic.trickInfo.winningHighLow.high &&
      gameLogic.trickInfo.currentlyLosing &&
      !gameLogic.teamInfo.isLast
    ) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.high;
    } else if (
      gameLogic.trickInfo.winningHighLow.low &&
      gameLogic.trickInfo.currentlyLosing &&
      gameLogic.teamInfo.isLast
    ) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    } else if (gameLogic.trickInfo.losingHighLow.low) {
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    }
  } else if (
    !gameLogic.teamInfo.teammateYetToPlay &&
    gameLogic.trickInfo.currentlyLosing &&
    gameLogic.trickInfo.winningHighLow.low
  ) {
    // play lowest card if possible to win if currently losing and teammate already played.
    cardToPlay = gameLogic.trickInfo.winningHighLow.low;
  } else {
    if (gameLogic.trickInfo.winningHighLow.low) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    } else if (gameLogic.trickInfo.losingHighLow.low) {
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    }
  }

  if (!cardToPlay) throw Error('Error determining card to play - Best card for follow suit.');

  return cardToPlay;
}

/** */
function getBestCardWhenTeammateLeadAce(
  playerHand: Card[],
  game: EuchreGameInstance,
  gameLogic: GamePlayLogic
): Card {
  if (!game.trump) throw Error();

  if (!game.currentPlayer) throw Error();

  let cardToPlay: Card | undefined;

  if (gameLogic.trickInfo.currentlyLosing) {
    if (gameLogic.trickInfo.winningHighLow.low) cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    else if (gameLogic.trickInfo.losingHighLow.low) {
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    }
  } else if (gameLogic.trickInfo.currentlyLosing && gameLogic.trickInfo.winningHighLow.low) {
    cardToPlay = gameLogic.trickInfo.winningHighLow.low;
  } else if (gameLogic.trickInfo.losingHighLow.low) {
    cardToPlay = gameLogic.trickInfo.losingHighLow.low;
  } else if (gameLogic.trickInfo.winningHighLow.low) {
    cardToPlay = gameLogic.trickInfo.winningHighLow.low;
  }

  if (!cardToPlay)
    throw Error('Error determining card to play - Best card when teammate leads ace.');

  return cardToPlay;
}

function getBestCardWhenTeamIsMaker(
  playerHand: Card[],
  game: EuchreGameInstance,
  gameLogic: GamePlayLogic
): Card {
  let cardToPlay: Card | undefined;

  if (gameLogic.teamInfo.isLast && !gameLogic.trickInfo.currentlyLosing) {
    // if already winning and playing last, then play weak losing card if available. otherwise play a low winning card if necessary.
    if (gameLogic.trickInfo.losingHighLow.low) cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    else if (gameLogic.trickInfo.winningHighLow.low)
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
  } else if (
    gameLogic.teamInfo.currentUserIsMaker &&
    !gameLogic.teamInfo.teammateYetToPlay &&
    gameLogic.trickInfo.currentlyLosing
  ) {
    //
    if (gameLogic.trickInfo.winningHighLow.low) cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    else if (gameLogic.trickInfo.losingHighLow.low)
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
  } else {
    //
    if (gameLogic.trickInfo.winningHighLow.low) cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    else if (gameLogic.trickInfo.losingHighLow.low)
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
  }

  if (!cardToPlay) throw Error('Error determining card to play');

  return cardToPlay;
}

/** Team is defending when opposing team makes trump. Play a little bit more aggressively when attempting to defend. */
function getBestCardWhenDefender(
  playerHand: Card[],
  game: EuchreGameInstance,
  gameLogic: GamePlayLogic
): Card {
  let cardToPlay: Card | undefined;

  if (gameLogic.teamInfo.isLast && gameLogic.trickInfo.currentlyLosing) {
    // if playing the last card and losing, then play the weakest winning card if available.
    if (gameLogic.trickInfo.winningHighLow.low) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    } else if (gameLogic.trickInfo.losingHighLow.low) {
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    }
  } else if (!gameLogic.teamInfo.isLast && gameLogic.trumpInfo.trumpCardCount > 1) {
    //
    const trumpLow = gameLogic.trickInfo.winningHighLow.low;
    const lowValues: CardValue[] = ['9', '10', 'Q', 'K', 'A'];

    if (trumpLow && lowValues.indexOf(trumpLow.value) >= 0) cardToPlay = trumpLow;
    else if (gameLogic.trickInfo.losingHighLow.low)
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
  } else if (
    !gameLogic.teamInfo.isLast &&
    gameLogic.trickInfo.winningHighLow.low &&
    !gameLogic.teamInfo.teammateYetToPlay
  ) {
    cardToPlay = gameLogic.trickInfo.winningHighLow.low;
  } else if (!gameLogic.trickInfo.currentlyLosing) {
    if (gameLogic.trickInfo.losingHighLow.low) cardToPlay = gameLogic.trickInfo.losingHighLow.low;
  } else if (gameLogic.trickInfo.opponentTricksWon > 1) {
    if (gameLogic.trickInfo.winningHighLow.low) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    } else if (gameLogic.trickInfo.losingHighLow.low) {
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    }
  } else {
    if (gameLogic.trickInfo.winningHighLow.low) cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    else if (gameLogic.trickInfo.losingHighLow.low)
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
  }

  if (!cardToPlay) throw Error('Error determining card to play');

  return cardToPlay;
}

function handleGameCardPlayed(
  player: EuchrePlayer,
  card: Card,
  game: EuchreGameInstance
): EuchreGameInstance {
  const newGame: EuchreGameInstance = playGameCard(player, card, game);

  if (!newGame?.currentPlayer) throw Error('Player not found in game card played.');

  if (!newGame?.trump) throw Error('Trump card not found in game card played.');

  return newGame;
}

function playGameCard(
  player: EuchrePlayer,
  card: Card,
  game: EuchreGameInstance
): EuchreGameInstance {
  const newGame = game.shallowCopy();

  if (!newGame.currentTrick) throw Error();
  if (!newGame.currentPlayer) throw Error();
  if (!newGame.trump) throw Error();

  const euchreCard = new EuchreCard(player, card);
  const tempCards = player.availableCards.filter((c) => c !== card);
  player.assignCards = tempCards;
  player.orderHand(game.trump);
  player.playedCards.push(card);

  newGame.currentTrick.cardsPlayed.push(euchreCard);
  const rotation = getPlayerRotation(
    newGame.gamePlayers,
    newGame.currentPlayer,
    newGame.playerSittingOut
  );
  const currentRound = newGame.currentRound;

  // if round is finished, determine who the winner of the trick.
  if (newGame.currentTrick && newGame.currentTrick.cardsPlayed.length === rotation.length) {
    const trickWinner = determineCurrentWinnerForTrick(newGame.trump, newGame.currentTrick);
    newGame.currentTrick.taker = trickWinner.card?.player;

    if (newGame.currentTricks.length < 5) {
      newGame.currentTricks.push(new EuchreTrick(currentRound));
      newGame.currentPlayer = trickWinner.card?.player ?? null;
    }
  } else {
    newGame.currentPlayer = rotation[0];
  }

  // if hand is over update the tricks with the result.
  if (
    newGame.currentTricks.length === 5 &&
    newGame.currentTricks.filter((t) => t.taker !== undefined).length === 5
  ) {
    newGame.gameResults.push(newGame.getHandResult());
    newGame.currentRound += 1;
    newGame.currentTricks = [];
  }

  return newGame;
}

function determineCurrentWinnerForTrick(
  trump: Card,
  trick: EuchreTrick
): { card: EuchreCard | null; value: number } {
  if (trick.cardsPlayed.length < 1) return { card: null, value: 0 };

  const leadCard: EuchreCard = trick.cardsPlayed[0];

  const winningCard: { card: EuchreCard | null; value: number } = {
    card: leadCard,
    value: getCardValue(leadCard.card, trump)
  };

  for (let i = 1; i < trick.cardsPlayed.length; i++) {
    const card = trick.cardsPlayed[i];

    if (
      card.card.suit !== leadCard.card.suit &&
      card.card.suit !== trump.suit &&
      !cardIsLeftBower(card.card, trump)
    )
      continue;

    const cardValue = getCardValue(card.card, trump);
    if (cardValue > winningCard.value) {
      winningCard.card = card;
      winningCard.value = cardValue;
    }
  }

  return winningCard;
}

function isGameOver(game: EuchreGameInstance): boolean {
  const teamOnePoints = game.gameResults
    .filter((r) => r.teamWon === 1)
    .map((r) => r.points)
    .reduce((acc, curr) => acc + curr, 0);
  const teamTwoPoints = game.gameResults
    .filter((r) => r.teamWon === 2)
    .map((r) => r.points)
    .reduce((acc, curr) => acc + curr, 0);

  return teamOnePoints >= 10 || teamTwoPoints >= 10;
}

const getGameStateForNextHand = (
  gameState: GameFlowState,
  settings: EuchreSettings,
  game: EuchreGameInstance
): GameFlowState => {
  const showAllCards = game.gamePlayers.filter((p) => !p.human).length === 4;
  const showCardValues = showAllCards
    ? game.gamePlayers.map((p) => {
        return { player: p, value: true };
      })
    : game.gamePlayers
        .filter((p) => p.human)
        .map((p) => {
          return { player: p, value: true };
        });

  const newGameState: GameFlowState = {
    ...gameState,
    hasGameStarted: true,
    shouldShowDeckImages: settings.shouldAnimate ? [{ player: game.player1, value: true }] : [],
    shouldShowHandImages: !settings.shouldAnimate
      ? game.gamePlayers.map((p) => {
          return { player: p, value: true };
        })
      : [],
    shouldShowHandValues: showCardValues,
    hasFirstBiddingPassed: false,
    hasSecondBiddingPassed: false,
    gameFlow: EuchreGameFlow.BEGIN_SHUFFLE_CARDS
  };

  return newGameState;
};

/** Returns false if the player must follow suit and the played card did not follow suit.
 * Returns true in all other cases.
 */
const didPlayerFollowSuit = (game: EuchreGameInstance, playedCard: Card): boolean => {
  if (!game.currentPlayer) throw new Error();
  if (!game.trump) throw new Error();

  const leadCard: EuchreCard | null = game.currentTrick?.cardsPlayed.at(0) ?? null;

  // player does not need to follow suit if no card has yet been lead.
  if (!leadCard) return true;

  const leadCardIsLeftBower = leadCard ? cardIsLeftBower(leadCard.card, game.trump) : false;
  const suitToFollow = leadCardIsLeftBower ? game.trump.suit : leadCard?.card.suit;
  const suitCount = getSuitCount(game.currentPlayer.availableCards, game.trump);

  const mustFollowSuit: boolean =
    suitCount.filter((s) => s.suit === suitToFollow && s.count > 0).length > 0;

  if (mustFollowSuit) {
    const cardsAvailableToFollowSuit = getCardValuesForSuit(
      game.currentPlayer.availableCards,
      game.trump,
      suitToFollow
    );

    const cardFound = cardsAvailableToFollowSuit.find((c) => c.card === playedCard);

    if (!cardFound) return false;
  }

  return true;
};

const reverseLastHandPlayed = (game: EuchreGameInstance): EuchreGameInstance => {
  const newGame = game.shallowCopy();
  const lastGameResult = newGame.gameResults.at(-1);

  if (!lastGameResult) throw new Error('Game result not found.');

  if (!newGame.dealer) throw new Error('Game dealer not found.');

  newGame.gameResults = [...newGame.gameResults.slice(0, newGame.gameResults.length - 1)];
  const player1Hand = lastGameResult.tricks
    .map((t) => t.cardsPlayed.filter((c) => c.player === newGame.player1).map((c) => c.card))
    .flat();
  const player2Hand = lastGameResult.tricks
    .map((t) => t.cardsPlayed.filter((c) => c.player === newGame.player2).map((c) => c.card))
    .flat();
  const player3Hand = lastGameResult.tricks
    .map((t) => t.cardsPlayed.filter((c) => c.player === newGame.player3).map((c) => c.card))
    .flat();
  const player4Hand = lastGameResult.tricks
    .map((t) => t.cardsPlayed.filter((c) => c.player === newGame.player4).map((c) => c.card))
    .flat();

  newGame.player1.assignCards = player1Hand;
  newGame.player2.assignCards = player2Hand;
  newGame.player3.assignCards = player3Hand;
  newGame.player4.assignCards = player4Hand;
  newGame.maker = null;
  newGame.loner = false;
  newGame.currentPlayer = getPlayerRotation(newGame.gamePlayers, newGame.dealer)[0];

  if (newGame.discard && !lastGameResult.trumpWasNamed && newGame.trump) {
    newGame.dealer.assignCards = [
      ...newGame.dealer.availableCards.filter((c) => c !== newGame.trump),
      newGame.discard
    ];
  } else if (newGame.turnedDown) {
    newGame.trump = newGame.turnedDown;
  }

  newGame.player1.orderHand(newGame.trump);
  newGame.player2.orderHand(newGame.trump);
  newGame.player3.orderHand(newGame.trump);
  newGame.player4.orderHand(newGame.trump);

  return newGame;
};

export {
  determineCurrentWinnerForTrick,
  getGameStateForNextHand,
  isGameOver,
  handleGameCardPlayed,
  playGameCard,
  didPlayerFollowSuit,
  reverseLastHandPlayed
};

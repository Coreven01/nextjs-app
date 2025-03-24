import {
  Card,
  CardValue,
  EuchreCard,
  EuchreGameInstance,
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
  cardIsRightBower
} from './game';
import { EuchreGameFlow, EuchreGameFlowState } from '@/app/hooks/euchre/gameFlowReducer';
import { GamePlayLogic, OffsuitLogic, TeamLogic, TrickLogic, TrumpLogic } from './logic-definitions';

/** Return a object of important values when making a decision during regular game play.
 *
 */
function getGamePlayLogic(game: EuchreGameInstance): GamePlayLogic {
  const retval: GamePlayLogic = {
    teamInfo: getTeamLogic(game),
    trumpInfo: getTrumpLogic(game),
    offsuitInfo: getOffsuitLogic(game),
    trickInfo: getTrickLogic(game)
  };

  return retval;
}

/** Get information related to the number of tricks taken and what cards are available to play.
 *  Also retrieve information regarding which cards have been played, which cards will win/lose, and
 *  if the player must follow suit.
 */
function getTrickLogic(game: EuchreGameInstance): TrickLogic {
  if (!game?.currentPlayer) throw Error('Invalid player gathering trick logic.');
  if (!game.currentTrick) throw Error('Invalid current trick gathering trick logic.');
  if (!game.trump) throw Error('Invalid trump card gathering trick logic.');
  if (!game.dealer) throw Error('Invalid dealer gathering trick logic.');

  //#region Gather information for trick information
  const trumpCard: Card = game.trump;
  const suitsThatHaveBeenLead: Suit[] = [];
  const currentPlayer = game.currentPlayer;
  const playerCards: Card[] = currentPlayer.availableCards;
  const leadCard: EuchreCard | null = game.currentTrick.cardsPlayed.at(0) ?? null;
  const leadCardIsRightBower = leadCard
    ? leadCard.card.suit === trumpCard.suit && leadCard.card.value === 'J'
    : false;
  const leadCardIsLeftBower = leadCard ? cardIsLeftBower(leadCard.card, trumpCard) : false;
  const trumpWasLead: boolean = leadCard
    ? leadCard.card.suit === trumpCard.suit || leadCardIsLeftBower
    : false;

  const suitToFollow = leadCardIsLeftBower ? trumpCard.suit : leadCard?.card.suit;
  const suitCount = getSuitCount(playerCards, trumpCard);
  const mustFollowSuit: boolean = suitCount.filter((s) => s.suit === suitToFollow && s.count > 0).length > 0;
  const currentWinningCard = determineCurrentWinnerForTrick(trumpCard, game.currentTrick);
  const winningCardVal = currentWinningCard.value;

  // if must follow suit, then only return cards that match the lead card.
  const cardsAvailableToPlay = getCardValuesForSuit(
    playerCards,
    trumpCard,
    mustFollowSuit ? (suitToFollow ?? null) : null
  );

  const winningCards = cardsAvailableToPlay.filter((c) => {
    return (
      // winning cards are all available cards if no lead card
      leadCard === null ||
      // winning cards are trump cards with higher value than the current winning card.
      (c.value > winningCardVal && (c.card.suit === trumpCard.suit || cardIsLeftBower(c.card, trumpCard))) ||
      // winning cards are also cards that follow lead and higher value than current winning card.
      (c.value > winningCardVal && c.card.suit === suitToFollow)
    );
  });
  const losingCards = cardsAvailableToPlay.filter((c) => !winningCards.includes(c));
  const cardValues: { card: Card; value: number }[] = getCardValuesForSuit(playerCards, trumpCard, null);
  const winningHighLow = getHighAndLow(
    winningCards.map((c) => c.card),
    trumpCard
  );
  const losingHighLow = getHighAndLow(
    losingCards.map((c) => c.card),
    trumpCard
  );

  for (const trick of game.handTricks) {
    if (trick.cardsPlayed.length) suitsThatHaveBeenLead.push(trick.cardsPlayed[0].card.suit);
  }

  //#endregion

  const retval: TrickLogic = {
    trumpWasLead: trumpWasLead,
    cardValues: cardValues,
    leadCard: leadCard,
    teamTricksWon: game.handTricks.filter((t) => t.taker && t.taker.team === currentPlayer.team).length,
    opponentTricksWon: game.handTricks.filter((t) => t.taker && t.taker.team !== currentPlayer.team).length,
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

/** Get information related to who is the maker and other team information
 *
 */
function getTeamLogic(game: EuchreGameInstance): TeamLogic {
  if (!game?.currentPlayer) throw Error('Invalid player gathering team logic.');
  if (!game.maker) throw Error('Invalid maker gathering team logic.');
  if (!game.currentTrick) throw Error('Invalid current trick gathering team logic.');

  const currentPlayer = game.currentPlayer;
  const leadCard: EuchreCard | null = game.currentTrick.cardsPlayed.at(0) ?? null;
  const currentUserIsMaker = game.maker.equal(currentPlayer);
  const lastCardCount = game.loner ? 2 : 3;

  const teamLogic: TeamLogic = {
    currentUserIsMaker: currentUserIsMaker,
    teammateIsMaker: !currentUserIsMaker && game.maker.team === currentPlayer.team,
    isFirstPlayer: game.gamePlayers.map((p) => p.playedCards).flat().length === 0,
    cardsPlayed: currentPlayer.playedCards.length,
    isLeading: leadCard === null,
    isLast: game.currentTrick.cardsPlayed.length === lastCardCount,
    teammateYetToPlay: game.currentTrick.cardsPlayed.length < 2,
    playerTeam: currentPlayer.team
  };

  return teamLogic;
}

/**
 *
 */
function getTrumpLogic(game: EuchreGameInstance): TrumpLogic {
  if (!game?.currentPlayer) throw Error('Invalid player gathering trump logic.');
  if (!game.trump) throw Error('Invalid trump gathering trump logic.');
  if (!game.dealer) throw Error('Invalid dealer gathering trump logic.');

  const trumpCard: Card = game.trump;
  const currentPlayer = game.currentPlayer;
  const playerCards: Card[] = currentPlayer.availableCards;
  const trumpCards = getCardValuesForSuit(playerCards, trumpCard, trumpCard.suit);
  const allTrumpCards = getCardValuesForSuit(
    [...playerCards, ...currentPlayer.playedCards],
    trumpCard,
    trumpCard.suit
  );

  const playerHasRight = allTrumpCards.find((c) => cardIsRightBower(c.card, trumpCard)) !== undefined;
  const playerWithRight = playerHasRight
    ? currentPlayer
    : game.discard !== null && game.trump.value === 'J'
      ? game.dealer
      : null;

  const retval: TrumpLogic = {
    totalHandTrumpCardCount: allTrumpCards.length,
    currentTrumpCardCount: trumpCards.length,
    playerHasRight: playerCards.find((c) => cardIsRightBower(c, trumpCard)) !== undefined,
    playerHasLeft: playerCards.find((c) => cardIsLeftBower(c, trumpCard)) !== undefined,
    trumpHighLow: getHighAndLowForSuit(playerCards, trumpCard, trumpCard.suit),
    rightWasSeen:
      game.handTricks
        .flat()
        .map((t) => t.cardsPlayed)
        .flat()
        .find((c) => cardIsRightBower(c.card, trumpCard)) !== undefined,
    leftWasSeen:
      game.handTricks
        .flat()
        .map((t) => t.cardsPlayed)
        .flat()
        .find((c) => cardIsLeftBower(c.card, trumpCard)) !== undefined,
    knownPlayerWithRight: playerWithRight
  };

  return retval;
}

/**
 *
 */
function getOffsuitLogic(game: EuchreGameInstance): OffsuitLogic {
  if (!game?.currentPlayer) throw Error('Invalid player gathering offsuit logic.');
  if (!game.currentTrick) throw Error('Invalid player gathering offsuit logic.');
  if (!game.trump) throw Error('Invalid trump gathering offsuit logic.');
  if (!game.dealer) throw Error('Invalid dealer gathering offsuit logic.');

  const trumpCard: Card = game.trump;
  const currentPlayer = game.currentPlayer;
  const playerCards: Card[] = currentPlayer.availableCards;
  const leadCard: EuchreCard | null = game.currentTrick.cardsPlayed.at(0) ?? null;
  const offSuitCards = getCardValuesExcludeSuit(playerCards, trumpCard, trumpCard.suit);
  const leadCards = game.handTricks.filter((t) => t.cardsPlayed.length > 0).map((t) => t.cardsPlayed[0]);
  const leadOffsuitCards = leadCards
    .filter((c) => c.card.suit !== trumpCard.suit && !cardIsLeftBower(c.card, trumpCard))
    .map((c) => c.card.suit);

  // teammate lead an offsuit ace:
  const leadAce =
    (leadCard &&
      leadCard.player !== currentPlayer &&
      leadCard.player.team === currentPlayer.team &&
      leadCard.card.value === 'A' &&
      leadCard.card.suit !== trumpCard.suit) ??
    false;

  const retval: OffsuitLogic = {
    offSuitAceCount: offSuitCards.filter((c) => c.card.value === 'A').length,
    offSuitAceCountNotYetLead: offSuitCards.filter(
      (c) => !leadOffsuitCards.includes(c.card.suit) && c.card.value === 'A'
    ).length,
    offsuitHighLow: getHighAndLowExcludeSuit(playerCards, trumpCard, [trumpCard.suit]),
    offsuitNotYetLeadHighLow: getHighAndLowExcludeSuit(playerCards, trumpCard, [
      trumpCard.suit,
      ...leadOffsuitCards
    ]),
    teammateLeadAce: leadAce
  };

  return retval;
}

/** Validate the information gathered from the logic functions is returning correct data.
 *
 */
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

/** Main entry point to determine which card to play for a computer player.
 *
 */
export function determineCardToPlayLogic(game: EuchreGameInstance): Card {
  if (!game.currentPlayer) throw Error('Invalid player to determine card to play.');

  const playerHand = game.currentPlayer.availableCards;

  if (playerHand.length === 1) return playerHand[0];

  const logic: GamePlayLogic = getGamePlayLogic(game);
  validateGamePlayLogic(logic);
  let cardToPlay: Card;

  if (logic.teamInfo.isLeading) {
    cardToPlay = getBestCardForLead(game, logic);
  } else if (logic.trickInfo.mustFollowSuit) {
    cardToPlay = getBestCardForFollowSuit(game, logic);
  } else if (logic.offsuitInfo.teammateLeadAce) {
    cardToPlay = getBestCardWhenTeammateLeadAce(game, logic);
  } else if (logic.teamInfo.currentUserIsMaker || logic.teamInfo.teammateIsMaker) {
    cardToPlay = getBestCardWhenTeamIsMaker(game, logic);
  } else cardToPlay = getBestCardWhenDefender(game, logic);

  return cardToPlay;
}

/** Choose best card to play when leading the current trick.
 *
 */
function getBestCardForLead(game: EuchreGameInstance, logic: GamePlayLogic): Card {
  if (!game.currentPlayer) throw Error('Invalid player to determine card to play.');

  let cardToPlay: Card | undefined;

  if (
    logic.teamInfo.currentUserIsMaker &&
    logic.trickInfo.teamTricksWon === 0 &&
    logic.trumpInfo.knownPlayerWithRight &&
    logic.trumpInfo.knownPlayerWithRight.team !== game.currentPlayer?.team &&
    !logic.trumpInfo.rightWasSeen
  ) {
    // player named trump, but saw the opposing team pick up the right bower. play ace if available, otherwise play high offsuit.
    if (logic.offsuitInfo.offsuitNotYetLeadHighLow.high) {
      cardToPlay = logic.offsuitInfo.offsuitNotYetLeadHighLow.high;
    } else if (logic.offsuitInfo.offsuitHighLow.high) {
      cardToPlay = logic.offsuitInfo.offsuitHighLow.high;
    } else if (logic.trickInfo.winningHighLow.low) {
      cardToPlay = logic.trickInfo.winningHighLow.low;
    }
  } else if (
    logic.teamInfo.currentUserIsMaker &&
    logic.trumpInfo.totalHandTrumpCardCount < 3 &&
    logic.trickInfo.teamTricksWon < 2 &&
    logic.offsuitInfo.offSuitAceCount === 0
  ) {
    // low number of trump and team has yet to win a trick. play an offsuit card hoping it will win, or your partner will win.
    if (logic.offsuitInfo.offsuitNotYetLeadHighLow.high) {
      cardToPlay = logic.offsuitInfo.offsuitNotYetLeadHighLow.high;
    } else if (logic.offsuitInfo.offsuitHighLow.high) {
      cardToPlay = logic.offsuitInfo.offsuitHighLow.high;
    } else if (logic.trickInfo.winningHighLow.high) {
      cardToPlay = logic.trickInfo.winningHighLow.high;
    }
  } else if (
    logic.teamInfo.currentUserIsMaker &&
    logic.trumpInfo.totalHandTrumpCardCount >= 3 &&
    game.loner
  ) {
    // high number of trump and current user is maker and went alone. standard strategy is to play cards from highest to lowest.
    if (logic.trumpInfo.trumpHighLow.high) {
      cardToPlay = logic.trumpInfo.trumpHighLow.high;
    } else if (logic.offsuitInfo.offsuitHighLow.high) {
      cardToPlay = logic.offsuitInfo.offsuitHighLow.high;
    }
  } else if (
    logic.teamInfo.currentUserIsMaker &&
    logic.offsuitInfo.offSuitAceCountNotYetLead > 0 &&
    logic.trickInfo.teamTricksWon < 2
  ) {
    // play an offsuit ace if available.
    if (logic.offsuitInfo.offsuitNotYetLeadHighLow.high) {
      cardToPlay = logic.offsuitInfo.offsuitNotYetLeadHighLow.high;
    }
  } else if (!logic.teamInfo.currentUserIsMaker && !logic.teamInfo.teammateIsMaker) {
    // play high offsuit cards if available.
    if (logic.offsuitInfo.offsuitNotYetLeadHighLow.high) {
      cardToPlay = logic.offsuitInfo.offsuitNotYetLeadHighLow.high;
    } else if (logic.offsuitInfo.offsuitHighLow.high) {
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
    if (logic.trickInfo.winningHighLow.high) {
      cardToPlay = logic.trickInfo.winningHighLow.high;
    }
  } else if (
    logic.teamInfo.currentUserIsMaker &&
    logic.trickInfo.teamTricksWon > 0 &&
    logic.trumpInfo.totalHandTrumpCardCount > 3 &&
    logic.trickInfo.winningHighLow.high
  ) {
    // player is maker and high trump count, but not necessarily has left/right.
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
    // current user is maker
    if (logic.trickInfo.winningHighLow.high) {
      cardToPlay = logic.trickInfo.winningHighLow.high;
    } else if (logic.trickInfo.losingHighLow.high) {
      cardToPlay = logic.trickInfo.losingHighLow.high;
    }
  } else if (logic.offsuitInfo.offsuitNotYetLeadHighLow.high) {
    // play offsuit high card if available
    cardToPlay = logic.offsuitInfo.offsuitNotYetLeadHighLow.high;
  } else if (logic.trickInfo.winningHighLow.high) {
    // default to best card if other logic fails
    cardToPlay = logic.trickInfo.winningHighLow.high;
  }

  if (!cardToPlay) throw Error('Error determining card to play - Best card for lead.');

  return cardToPlay;
}

/** Choose best card when the player must follow suit.
 *
 */
function getBestCardForFollowSuit(game: EuchreGameInstance, gameLogic: GamePlayLogic): Card {
  let cardToPlay: Card | undefined;

  if (!gameLogic.trickInfo.leadCard) throw Error('Lead card not found');
  if (!game.trump) throw Error('Trump card not found');

  if (gameLogic.trickInfo.cardsAvailableToFollowSuit.length === 0)
    throw new Error('Invalid card for follow suit. No cards found.');

  // if only one card available, then this card must be played.
  if (gameLogic.trickInfo.cardsAvailableToFollowSuit.length === 1)
    return gameLogic.trickInfo.cardsAvailableToFollowSuit[0].card;

  if (gameLogic.teamInfo.isLast) {
    // if playing last and a winning card is available, play that card, otherwise play a weak losing card.
    if (gameLogic.trickInfo.currentlyLosing && gameLogic.trickInfo.winningHighLow.low) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    } else if (gameLogic.trickInfo.losingHighLow.low) {
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    } else if (gameLogic.trickInfo.winningHighLow.low) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
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
    if (gameLogic.trickInfo.losingHighLow.low) {
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    } else if (gameLogic.trickInfo.winningHighLow.low) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    }
  } else if (
    gameLogic.trickInfo.trumpWasLead &&
    gameLogic.teamInfo.currentUserIsMaker &&
    gameLogic.trumpInfo.playerHasRight &&
    gameLogic.trickInfo.winningHighLow.high
  ) {
    // player led trump but wasn't the maker. if current player has right bower then play it now.
    cardToPlay = gameLogic.trickInfo.winningHighLow.high;
  } else if (!gameLogic.trickInfo.trumpWasLead) {
    // playing offsuit logic
    if (gameLogic.trickInfo.winningHighLow.high && !gameLogic.teamInfo.isLast) {
      // if not playing last, play best offsuit card.
      cardToPlay = gameLogic.trickInfo.winningHighLow.high;
    } else if (gameLogic.trickInfo.winningHighLow.low && gameLogic.trickInfo.currentlyLosing) {
      // if playing last, currently losing, and winning card available, then play that card.
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    } else if (gameLogic.trickInfo.losingHighLow.low) {
      // all else, play lowest card available.
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    }
  } else if (
    !gameLogic.teamInfo.teammateYetToPlay &&
    gameLogic.trickInfo.currentlyLosing &&
    gameLogic.trickInfo.winningHighLow.high
  ) {
    cardToPlay = gameLogic.trickInfo.winningHighLow.high;
  } else if (
    gameLogic.trickInfo.trumpWasLead &&
    gameLogic.trickInfo.leadCard.player.team === gameLogic.teamInfo.playerTeam &&
    (gameLogic.trumpInfo.playerHasLeft || gameLogic.trumpInfo.playerHasRight) &&
    (gameLogic.teamInfo.teammateIsMaker || gameLogic.teamInfo.currentUserIsMaker) &&
    ['9', '10', 'Q', 'K'].includes(gameLogic.trickInfo.leadCard.card.suit)
  ) {
    // partner leads low trump when team is the maker
    // rare circumstance where partner is indicating that the current player should play their best card.
    if (gameLogic.trickInfo.winningHighLow.high) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.high;
    }
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
function getBestCardWhenTeammateLeadAce(game: EuchreGameInstance, gameLogic: GamePlayLogic): Card {
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

  if (!cardToPlay) throw Error('Error determining card to play - Best card when teammate leads ace.');

  return cardToPlay;
}

function getBestCardWhenTeamIsMaker(game: EuchreGameInstance, gameLogic: GamePlayLogic): Card {
  let cardToPlay: Card | undefined;

  if (gameLogic.teamInfo.isLast && !gameLogic.trickInfo.currentlyLosing) {
    // if already winning and playing last, then play weak losing card if available. otherwise play a low winning card if necessary.
    if (gameLogic.trickInfo.losingHighLow.low) cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    else if (gameLogic.trickInfo.winningHighLow.low) cardToPlay = gameLogic.trickInfo.winningHighLow.low;
  } else if (
    gameLogic.teamInfo.currentUserIsMaker &&
    !gameLogic.teamInfo.teammateYetToPlay &&
    gameLogic.trickInfo.currentlyLosing
  ) {
    //
    if (gameLogic.trickInfo.winningHighLow.low) cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    else if (gameLogic.trickInfo.losingHighLow.low) cardToPlay = gameLogic.trickInfo.losingHighLow.low;
  } else if (
    gameLogic.teamInfo.teammateYetToPlay &&
    gameLogic.trumpInfo.playerHasLeft &&
    gameLogic.trumpInfo.playerHasRight &&
    gameLogic.trumpInfo.totalHandTrumpCardCount === 2 &&
    gameLogic.trickInfo.losingHighLow.low
  ) {
    // if only holding left and right and those are the only trump left, then hope your partner can take it.
    cardToPlay = gameLogic.trickInfo.losingHighLow.low;
  } else {
    //
    if (gameLogic.trickInfo.winningHighLow.low) cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    else if (gameLogic.trickInfo.losingHighLow.low) cardToPlay = gameLogic.trickInfo.losingHighLow.low;
  }

  if (!cardToPlay) throw Error('Error determining card to play - Best card when team is maker');

  return cardToPlay;
}

/** Team is defending when opposing team makes trump. Play a little bit more aggressively when attempting to defend. */
function getBestCardWhenDefender(game: EuchreGameInstance, gameLogic: GamePlayLogic): Card {
  let cardToPlay: Card | undefined;

  if (gameLogic.teamInfo.isLast) {
    // if playing the last card, then play the weakest winning card if available.
    if (gameLogic.trickInfo.currentlyLosing && gameLogic.trickInfo.winningHighLow.low) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    } else if (gameLogic.trickInfo.losingHighLow.low) {
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    } else if (gameLogic.trickInfo.winningHighLow.low) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    }
  } else if (gameLogic.trumpInfo.totalHandTrumpCardCount > 1) {
    // if player has a low trump card that will win, then play that card.
    // else play low offsuit card.
    const trumpLow = gameLogic.trickInfo.winningHighLow.low;
    const lowValues: CardValue[] = ['9', '10', 'Q', 'K', 'A'];

    if (trumpLow && lowValues.includes(trumpLow.value)) {
      cardToPlay = trumpLow;
    } else if (gameLogic.trickInfo.losingHighLow.low) {
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    }
  } else if (gameLogic.trickInfo.winningHighLow.low && !gameLogic.teamInfo.teammateYetToPlay) {
    // play weak winning card if available if teammate already played.
    cardToPlay = gameLogic.trickInfo.winningHighLow.low;
  } else if (!gameLogic.trickInfo.currentlyLosing && gameLogic.trickInfo.losingHighLow.low) {
    // if not losing, then play weakest card.
    cardToPlay = gameLogic.trickInfo.losingHighLow.low;
  } else if (gameLogic.trickInfo.opponentTricksWon > 1) {
    // if oppoents have taken more than one trick, then play best winning card if available
    if (gameLogic.trickInfo.winningHighLow.high) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.high;
    } else if (gameLogic.trickInfo.losingHighLow.low) {
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    }
  } else {
    if (gameLogic.trickInfo.winningHighLow.low) {
      cardToPlay = gameLogic.trickInfo.winningHighLow.low;
    } else if (gameLogic.trickInfo.losingHighLow.low) {
      cardToPlay = gameLogic.trickInfo.losingHighLow.low;
    }
  }

  if (!cardToPlay) throw Error('Error determining card to play - Best card when team is defender.');

  return cardToPlay;
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

const getGameStateForNextHand = (
  gameState: EuchreGameFlowState,
  settings: EuchreSettings,
  game: EuchreGameInstance
): EuchreGameFlowState => {
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

  const newGameState: EuchreGameFlowState = {
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

  const mustFollowSuit: boolean = suitCount.filter((s) => s.suit === suitToFollow && s.count > 0).length > 0;

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

const getCardsAvailableToPlay = (trump: Card, leadCard: Card | null, playerCards: Card[]) => {
  const leadCardIsLeftBower = leadCard ? cardIsLeftBower(leadCard, trump) : false;
  const suitToFollow = leadCardIsLeftBower ? trump.suit : leadCard?.suit;
  const suitCount = getSuitCount(playerCards, trump);
  const mustFollowSuit: boolean = suitCount.filter((s) => s.suit === suitToFollow && s.count > 0).length > 0;

  // if must follow suit, then only return cards that match the lead card.
  const cardsAvailableToPlay = getCardValuesForSuit(
    playerCards,
    trump,
    mustFollowSuit ? (suitToFollow ?? null) : null
  );

  return cardsAvailableToPlay;
};

export {
  determineCurrentWinnerForTrick,
  getGameStateForNextHand,
  didPlayerFollowSuit,
  getCardsAvailableToPlay
};

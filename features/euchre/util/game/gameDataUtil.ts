import {
  EuchreHandResult,
  Card,
  EuchreTeamOverview,
  GameDifficulty,
  RANDOM_FOR_DIFFICULTY,
  GameSpeed,
  AVAILABLE_GAME_SPEED
} from '../../definitions/definitions';
import {
  EuchreTrick,
  EuchreGameInstance,
  EuchrePlayer,
  EuchreCard,
  EuchreSettings
} from '../../definitions/game-state-definitions';
import {
  createPlaceholderCards,
  cardEqual,
  getCardValue,
  cardIsLeftBower,
  getSuitCount,
  getCardValuesForSuit
} from './cardDataUtil';
import { getPlayerRotation, availableCardsToPlay, playerEqual } from './playerDataUtil';
import { v4 as uuidv4 } from 'uuid';

const createTrick = (round: number): EuchreTrick => {
  return {
    trickId: uuidv4(),
    taker: null,
    cardsPlayed: [],
    playerSittingOut: null,
    playerRenege: null,
    round: round
  };
};
/** If the maker went alone, return reference to the player the player who's sitting out. */
const playerSittingOut = (game: EuchreGameInstance): EuchrePlayer | null => {
  if (game.maker && game.loner)
    return (
      game.gamePlayers.find(
        (p) => p.team === game.maker?.team && p.playerNumber !== game.maker.playerNumber
      ) ?? null
    );

  return null;
};

/** Returns true if all tricks are complete and winner has been determined. Also returns true if a player reneged. */
const isHandFinished = (game: EuchreGameInstance): boolean => {
  const playerReneged: boolean = game.currentTrick.playerRenege !== null;
  const allCardsPlayed: boolean = game.currentTricks.filter((t) => t.taker !== null).length === 5;

  return playerReneged || allCardsPlayed;
};

/** Returns true if all players have played a card for the current trick. Returns true if a player reneges */
const isTrickFinished = (game: EuchreGameInstance): boolean => {
  const playerReneged: boolean = game.currentTrick && game.currentTrick.playerRenege !== null;
  const allPlayersPlayed: boolean = game.currentTrick.cardsPlayed.length === (game.loner ? 3 : 4);

  return playerReneged || allPlayersPlayed;
};

/** Returns true if a team reaches the passed points value or more. */
const isGameOver = (game: EuchreGameInstance, maxPoint: number): boolean => {
  return teamPoints(game, 1) >= maxPoint || teamPoints(game, 2) >= maxPoint;
};

/** Total points for the given team for the current game. */
const teamPoints = (game: EuchreGameInstance, teamNumber: 1 | 2): number => {
  return game.handResults
    .filter((t) => t.teamWon === teamNumber)
    .map((t) => t.points)
    .reduce((acc, curr) => acc + curr, 0);
};

/** Reset game state for the current game for a new hand to be dealt. Sets a new hand ID. */
const resetForNewDeal = (game: EuchreGameInstance): EuchreGameInstance => {
  const newGame: EuchreGameInstance = { ...game };
  newGame.kitty = [];
  newGame.deck = createPlaceholderCards(24);
  newGame.maker = null;
  newGame.loner = false;
  newGame.trump = { suit: '♠', value: 'P', index: -1 };
  newGame.discard = null;
  newGame.turnedDown = null;
  newGame.cardDealCount = [];
  newGame.currentTricks = [];
  newGame.handId = uuidv4();

  for (const player of newGame.gamePlayers) {
    player.hand = [];
    player.playedCards = [];
  }

  return newGame;
};

/** Deal cards to players for the current hand and sets the remaining cards as the kitty. */
const dealCards = (game: EuchreGameInstance): EuchreGameInstance => {
  const newGame: EuchreGameInstance = { ...game };
  const playerRotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
  const randomNum: number = Math.floor(Math.random() * 3) + 1;
  let counter: number = 0;

  newGame.cardDealCount = [randomNum, 5 - randomNum];

  for (let i = 0; i < 8; i++) {
    let numberOfCards = 0;
    const currentPlayer: EuchrePlayer = playerRotation[i % 4];
    const firstRound: boolean = i < 4;

    if (firstRound) {
      numberOfCards = i % 2 ? 5 - randomNum : randomNum;
    } else {
      numberOfCards = i % 2 ? randomNum : 5 - randomNum;
    }

    for (let j = 0; j < numberOfCards; j++) {
      currentPlayer.hand.push({ ...newGame.deck[counter] });
      counter++;
    }
  }

  while (counter < newGame.deck.length) {
    newGame.kitty.push({ ...newGame.deck[counter] });
    counter++;
  }

  return newGame;
};

/** Create a hand result for the current round of play. Determines and sets the winning team and points. */
const getHandResult = (game: EuchreGameInstance): EuchreHandResult => {
  if (!game.maker) throw new Error('Maker not found for hand result.');

  const makerTricksWon: number = game.currentTricks.filter((t) => t.taker?.team === game.maker?.team).length;
  const renegePlayer: EuchrePlayer | null =
    game.currentTricks.find((t) => t.playerRenege !== null)?.playerRenege ?? null;

  let points: number = 0;
  let teamWon: 1 | 2 = game.maker.team;

  if (renegePlayer && game.maker.team === renegePlayer.team) {
    points = game.loner ? 4 : 2;
    teamWon = teamWon === 1 ? 2 : 1;
  } else if (renegePlayer && game.maker.team !== renegePlayer.team) {
    points = game.loner ? 4 : 2;
  } else if (game.loner && makerTricksWon === 5) {
    points = 4;
  } else if (makerTricksWon === 5) {
    points = 2;
  } else if (makerTricksWon >= 3) {
    points = 1;
  } else {
    points = 2;
    teamWon = teamWon === 1 ? 2 : 1;
  }

  const allPlayerCards: EuchreCard[] = game.gamePlayers
    .map((p) => [
      ...p.hand.map((c) => {
        return { card: { ...c }, player: p };
      })
    ])
    .flat();

  const retval: EuchreHandResult = {
    tricks: [...game.currentTricks],
    points: points,
    teamWon: teamWon,
    dealerPlayerNumber: game.dealer.playerNumber,
    makerPlayerNumber: game.maker.playerNumber,
    roundNumber: game.currentRound,
    loner: game.loner,
    trump: { ...game.trump },
    turnedDown: game.turnedDown ? { ...game.turnedDown } : null,
    discard: game.discard ? { ...game.discard } : null,
    allPlayerCards: allPlayerCards,
    kitty: [...game.kitty]
  };

  validateHandResult(retval);

  return retval;
};

/** Validates the hand result was created correctly. */
const validateHandResult = (result: EuchreHandResult): void => {
  const msg: string = 'Hand result validation failed.';
  const allCards: Card[] = [...result.allPlayerCards.map((c) => c.card), ...result.kitty];
  const gameCards = new Set<string>();

  const player1Cards: EuchreCard[] = result.allPlayerCards.filter((c) => c.player.playerNumber === 1);
  const player2Cards: EuchreCard[] = result.allPlayerCards.filter((c) => c.player.playerNumber === 2);
  const player3Cards: EuchreCard[] = result.allPlayerCards.filter((c) => c.player.playerNumber === 3);
  const player4Cards: EuchreCard[] = result.allPlayerCards.filter((c) => c.player.playerNumber === 4);
  const playerCards: EuchreCard[][] = [player1Cards, player2Cards, player3Cards, player4Cards];

  for (const cards of playerCards) {
    if (cards.length !== 5) throw new Error(msg + ' Invalid player card count.');
  }

  if (allCards.length !== 24) throw new Error(msg + ' Invalid total card count.');

  for (const card of allCards) {
    if (card.value === 'P') throw new Error(msg + ' Invalid card (Pending).');

    gameCards.add(`${card.value + card.suit}`);
  }

  if (result.discard) gameCards.add(`${result.discard.value + result.discard.suit}`);

  if (gameCards.size !== 24) throw new Error(msg + ' Invalid unique total card count.');
};

/** Update game state if trick is finished.
 * Determines if the trick ended early due to player renege.
 * If trick is over, updated the current trick with player that won.
 * Sets the new current player in the rotation if the trick is not finished.
 *
 */
const updateIfTrickOver = (game: EuchreGameInstance): EuchreGameInstance => {
  const newGame: EuchreGameInstance = { ...game };
  let playerFollowedSuit = true;
  const lastCardPlayed = newGame.currentTrick.cardsPlayed.at(-1);
  const sittingOut = playerSittingOut(newGame);
  const playerRotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer, sittingOut);

  // determine if the player followed suit when possible. if not, then the hand/trick is over and the
  // other team wins the hand.
  if (lastCardPlayed) {
    playerFollowedSuit = didPlayerFollowSuit(newGame, lastCardPlayed.card);
  }

  if (!playerFollowedSuit || newGame.currentTrick.cardsPlayed.length === playerRotation.length) {
    // enter this block when the trick is finished.
    const trickWinner = determineCurrentWinnerForTrick(newGame.trump, newGame.currentTrick);

    if (!trickWinner.card?.player) throw new Error('Trick winner not found.');
    newGame.currentTrick.taker = trickWinner.card.player;

    if (newGame.loner && sittingOut) {
      // push game card from the player sitting out when trick is over.
      const availableCards = availableCardsToPlay(sittingOut);
      const cardToPlay = { ...availableCards[0] };

      sittingOut.playedCards.push(cardToPlay);
      newGame.currentTrick.playerSittingOut = { card: cardToPlay, player: sittingOut };
    }

    if (!playerFollowedSuit) {
      // set the player who reneged for the trick.
      newGame.currentTrick.playerRenege = newGame.currentPlayer;
    } else if (newGame.currentTricks.length < 5) {
      // if trick is complete, the new current player will be the trick winner.
      newGame.currentPlayer = trickWinner.card.player;
    }

    // add to current tricks when trick is complete.
    newGame.currentTricks.push(newGame.currentTrick);
  } else if (newGame.currentTrick.cardsPlayed.length < playerRotation.length) {
    newGame.currentPlayer = playerRotation[0];
  } else {
    throw new Error('An error occurred while determining if trick was over. Too many cards played.');
  }

  return newGame;
};

/**
 * Get the current winner for the trick, even if the trick has not yet been complete.
 * @param trump
 * @param trick
 * @returns
 */
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
      winningCard.card = { ...card };
      winningCard.value = cardValue;
    }
  }

  return winningCard;
}

/**
 * Update game state with hand result if hand is over.
 */
const updateIfHandOver = (game: EuchreGameInstance): EuchreGameInstance => {
  const newGame: EuchreGameInstance = { ...game };
  const handOver: boolean =
    newGame.currentTrick.playerRenege !== null ||
    (newGame.currentTricks.length === 5 &&
      newGame.currentTricks.filter((t) => t.taker !== null).length === 5);

  if (handOver) {
    // if hand is over update the game results.
    newGame.handResults.push(getHandResult(newGame));
  }

  return newGame;
};

const getTeamOverviewStats = (game: EuchreGameInstance, team: 1 | 2): EuchreTeamOverview => {
  const players = game.gamePlayers;
  const handResults = game.handResults;
  const teamScore = Math.min(teamPoints(game, team), 10);

  const teamLoners = handResults.filter(
    (r) =>
      players.find((p) => p.playerNumber === r.makerPlayerNumber)?.team === team &&
      r.loner &&
      r.teamWon === team &&
      r.points === 4
  ).length;

  const teamEuchred = handResults.filter(
    (r) => players.find((p) => p.playerNumber === r.makerPlayerNumber)?.team === team && r.teamWon !== team
  ).length;

  const teamTotalTricks = handResults
    .map((r) => r.tricks)
    .flat()
    .filter((t) => t.taker?.team === team).length;

  return {
    score: teamScore,
    lonerCount: teamLoners,
    euchredCount: teamEuchred,
    tricksWonCount: teamTotalTricks
  };
};

const getPlayerOverviewStats = (game: EuchreGameInstance, player: EuchrePlayer) => {
  const gameResults = game.handResults;
  const trumpOrdered = gameResults.filter((r) => r.makerPlayerNumber === player.playerNumber).length;
  const tricksWon = gameResults
    .map((r) => r.tricks)
    .flat()
    .filter((t) => t.taker !== null && playerEqual(t.taker, player)).length;
  const acesLead = gameResults
    .map((r) => r.tricks)
    .flat()
    .map((t) => t.cardsPlayed[0])
    .filter((c) => playerEqual(c.player, player) && c.card.value === 'A').length;
  const lonerCount = gameResults.filter((r) => r.makerPlayerNumber === player.playerNumber && r.loner).length;

  const gameHandsForPlayer = gameResults.map((r) => {
    return {
      trump: r.trump,
      cards: r.tricks
        .map((t) => t.cardsPlayed)
        .flat()
        .filter((c) => playerEqual(c.player, player))
    };
  });

  const suitsForPlayerHands = gameHandsForPlayer.map((h) =>
    getSuitCount(
      h.cards.map((c) => c.card),
      h.trump
    )
  );
  const fourSuited = suitsForPlayerHands.filter((h) => h.length === 4).length;
  const threeSuited = suitsForPlayerHands.filter((h) => h.length === 3).length;
  const twoSuited = suitsForPlayerHands.filter((h) => h.length === 2).length;
  const singleSuited = suitsForPlayerHands.filter((h) => h.length === 1).length;

  return {
    trumpOrderedCount: trumpOrdered,
    tricksWonCount: tricksWon,
    acesLeadCount: acesLead,
    lonerCount: lonerCount,
    fourSuitedCount: fourSuited,
    threeSuitedCount: threeSuited,
    twoSuitedCount: twoSuited,
    singleSuitedCount: singleSuited
  };
};

/** Returns false if the player must follow suit and the played card did not follow suit.
 * Returns true in all other cases.
 */
const didPlayerFollowSuit = (game: EuchreGameInstance, playedCard: Card): boolean => {
  const leadCard: EuchreCard | null = game.currentTrick.cardsPlayed.at(0) ?? null;
  if (!leadCard) return true;

  // if the card has already been pushed to the played cards array, then make sure it's not for the current player.
  if (playerEqual(leadCard.player, game.currentPlayer)) return true;

  const cardsAvailableToBePlayed = availableCardsToPlay(game.currentPlayer);

  // make sure the played card is in the original array of cards available to be played
  if (cardsAvailableToBePlayed.find((c) => cardEqual(c, playedCard)) === undefined) {
    cardsAvailableToBePlayed.push(playedCard);
  }

  const cardsThatCanBePlayed = getCardsAvailableToPlay(game.trump, leadCard.card, cardsAvailableToBePlayed);
  const cardFound = cardsThatCanBePlayed.find((c) => cardEqual(c.card, playedCard));

  if (!cardFound) return false;

  return true;
};

/**
 * Return the cards that are available to be played for the given lead card, trump card, and player cards.
 * If the player has cards that are the same suit as the lead card, then only return those cards available to follow suit.
 * @param trump
 * @param leadCard
 * @param playerCards
 * @returns
 */
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

/**
 * Logic to have less difficulty is to have more randomness in AI decisions.
 *
 * @param team
 * @param difficulty
 * @param minScore
 * @param maxScore
 * @returns
 */
const getRandomScoreForDifficulty = (
  team: 1 | 2,
  difficulty: GameDifficulty,
  minScore: number,
  maxScore: number
): number => {
  if (team === 1) return 0;

  const randomChance = RANDOM_FOR_DIFFICULTY.get(difficulty);

  if (randomChance) {
    const randomNum = Math.random();

    if (randomNum < randomChance) {
      const scoreRange = maxScore - minScore;
      let randomScore = Math.floor(Math.random() * scoreRange);
      if (randomScore < minScore) randomScore += minScore;
      if (randomScore > maxScore) randomScore -= maxScore;

      return randomScore;
    }
  }

  return 0;
};

/** Returns the next speed value based on the offset. */
const incrementSpeed = (gameSpeed: GameSpeed, offset: number): GameSpeed => {
  if (AVAILABLE_GAME_SPEED.includes(gameSpeed)) {
    const retval =
      AVAILABLE_GAME_SPEED.at(AVAILABLE_GAME_SPEED.indexOf(gameSpeed) + offset) ?? AVAILABLE_GAME_SPEED[0];

    if (retval < gameSpeed) {
      return gameSpeed;
    } else {
      return retval;
    }
  }

  return gameSpeed;
};

const decrementSpeed = (gameSpeed: GameSpeed, offset: number): GameSpeed => {
  if (AVAILABLE_GAME_SPEED.includes(gameSpeed)) {
    const retval =
      AVAILABLE_GAME_SPEED.at(AVAILABLE_GAME_SPEED.indexOf(gameSpeed) - offset) ??
      AVAILABLE_GAME_SPEED[AVAILABLE_GAME_SPEED.length - 1];

    if (retval > gameSpeed) return gameSpeed;
    else return retval;
  }

  return gameSpeed;
};

const gameDelay = async (gameSettings: EuchreSettings, increment?: number) => {
  await new Promise((resolve) =>
    setTimeout(
      resolve,
      increment ? incrementSpeed(gameSettings.gameSpeed, increment) : gameSettings.gameSpeed
    )
  );
};

const notificationDelay = async (gameSettings: EuchreSettings, increment?: number) => {
  await new Promise((resolve) =>
    setTimeout(
      resolve,
      increment ? incrementSpeed(gameSettings.notificationSpeed, increment) : gameSettings.notificationSpeed
    )
  );
};

const minNotificationDelay = async (gameSettings: EuchreSettings, minDelay: GameSpeed) => {
  const delay = gameSettings.notificationSpeed < minDelay ? minDelay : gameSettings.notificationSpeed;

  await new Promise((resolve) => setTimeout(resolve, delay));
};

export {
  teamPoints,
  determineCurrentWinnerForTrick,
  resetForNewDeal,
  dealCards,
  playerSittingOut,
  getRandomScoreForDifficulty,
  incrementSpeed,
  decrementSpeed,
  isHandFinished,
  isTrickFinished,
  updateIfHandOver,
  updateIfTrickOver,
  getCardsAvailableToPlay,
  isGameOver,
  gameDelay,
  notificationDelay,
  minNotificationDelay,
  createTrick,
  getTeamOverviewStats,
  getPlayerOverviewStats
};

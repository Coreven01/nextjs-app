import {
  AVAILABLE_GAME_SPEED,
  Card,
  EuchreHandResult,
  GameDifficulty,
  GameSpeed,
  RANDOM_FOR_DIFFICULTY
} from '@/app/lib/euchre/definitions/definitions';
import useCardData from './useCardData';
import usePlayerData from './usePlayerData';
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  EuchreCard,
  EuchreGameInstance,
  EuchrePlayer,
  EuchreSettings,
  EuchreTrick
} from '../../../lib/euchre/definitions/game-state-definitions';

const useGameData = () => {
  const {
    cardEqual,
    createPlaceholderCards,
    getCardValuesForSuit,
    getCardValue,
    cardIsLeftBower,
    getSuitCount,
    indexCards
  } = useCardData();
  const { availableCardsToPlay, playerEqual, getPlayerRotation } = usePlayerData();

  const createTrick = useCallback((round: number): EuchreTrick => {
    return {
      trickId: uuidv4(),
      taker: null,
      cardsPlayed: [],
      playerSittingOut: null,
      playerRenege: null,
      round: round
    };
  }, []);

  /** If the maker went alone, return the player who's sitting out. */
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

  const isTrickFinished = (game: EuchreGameInstance): boolean => {
    const playerReneged: boolean = game.currentTrick && game.currentTrick.playerRenege !== null;
    const allPlayersPlayed: boolean = game.currentTrick.cardsPlayed.length === (game.loner ? 3 : 4);
    return playerReneged || allPlayersPlayed;
  };

  const isGameOver = (game: EuchreGameInstance): boolean => {
    return teamPoints(game, 1) >= 10 || teamPoints(game, 2) >= 10;
  };

  const teamPoints = (game: EuchreGameInstance, teamNumber: 1 | 2): number => {
    return game.handResults
      .filter((t) => t.teamWon === teamNumber)
      .map((t) => t.points)
      .reduce((acc, curr) => acc + curr, 0);
  };

  const resetForNewGame = (game: EuchreGameInstance): EuchreGameInstance => {
    const newGame: EuchreGameInstance = resetForNewDeal(game);

    newGame.handResults = [];
    newGame.dealer = newGame.player1;
    newGame.dealPassedCount = 0;

    return newGame;
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

  /** Copy cards that were dealt from the passed game instance. */
  const copyCardsFromReplay = (
    game: EuchreGameInstance,
    replayHand: EuchreHandResult
  ): EuchreGameInstance => {
    const newGame: EuchreGameInstance = { ...game };
    const players: EuchrePlayer[] = newGame.gamePlayers;

    for (const player of players) {
      player.hand = replayHand.allPlayerCards
        .filter((p) => p.player.playerNumber === player.playerNumber)
        .map((p) => {
          return { ...p.card };
        });

      if (player.hand.length < 5) {
        throw new Error('Invalid card count for player after copy from replay.');
      }

      if (player.hand.find((c) => c.value === 'P')) {
        throw new Error('Invalid card found for player after copy from replay.');
      }
    }

    newGame.kitty = replayHand.kitty.map((c) => {
      return { ...c };
    });

    if (replayHand.turnedDown) {
      newGame.trump = { ...replayHand.turnedDown };
    } else {
      newGame.trump = { ...replayHand.trump };
    }

    const tempTrump = newGame.trump;
    if (replayHand.discard && !newGame.turnedDown && newGame.dealer) {
      newGame.dealer.hand = [
        ...newGame.dealer.hand.filter((c) => !cardEqual(c, tempTrump)),
        { ...replayHand.discard }
      ];

      if (newGame.dealer.hand.length < 5) {
        throw new Error('Invalid card count for dealer after copy from replay.');
      }
    }

    return newGame;
  };

  /** Verify cards were dealt correctly. */
  const verifyDealtCards = (game: EuchreGameInstance): void => {
    const msg: string = 'Card dealt verification failed.';

    if (game.kitty.length !== 4) {
      throw new Error('');
    }
    const allCardsDealt: Card[] = [game.kitty].flat();

    for (const player of game.gamePlayers) {
      const playerHand: Card[] = player.hand;
      if (playerHand.length !== 5) throw new Error(msg + ' Invalid card count for player: ' + player.name);

      if (playerHand.find((c) => c.value === 'P'))
        throw Error(msg + ' Invalid cards found in player hand. (Value === P) Player: ' + player.name);

      allCardsDealt.push(...playerHand);
    }

    const tempSet = new Set<string>([...allCardsDealt.map((c) => `${c.value}${c.suit}`)]);

    if (tempSet.size !== 24) {
      const missingCards = allCardsDealt.filter((c) => !tempSet.has(`${c.value}${c.suit}`));
      throw Error(msg + '  Missing Cards: ' + missingCards.map((c) => `${c.value}${c.suit}`).join(','));
    }
  };

  /** */
  const getHandResult = (game: EuchreGameInstance): EuchreHandResult => {
    if (!game.maker) throw new Error('Maker not found for hand result.');

    const makerTricksWon: number = game.currentTricks.filter(
      (t) => t.taker?.team === game.maker?.team
    ).length;
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
          return { card: c, player: p };
        })
      ])
      .flat();

    const retval: EuchreHandResult = {
      tricks: [...game.currentTricks],
      points: points,
      teamWon: teamWon,
      dealer: game.dealer,
      maker: game.maker,
      roundNumber: game.currentRound,
      loner: game.loner,
      trump: game.trump,
      turnedDown: game.turnedDown,
      discard: game.discard,
      defenders: game.gamePlayers.filter((p) => p.team !== game.maker?.team),
      allPlayerCards: allPlayerCards,
      kitty: [...game.kitty]
    };

    validateHandResult(retval);

    return retval;
  };

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
  const updateIfTrickOver = (
    game: EuchreGameInstance,
    playerRotation: EuchrePlayer[]
  ): EuchreGameInstance => {
    const newGame: EuchreGameInstance = { ...game };
    let playerFollowedSuit = true;
    const lastCardPlayed = newGame.currentTrick.cardsPlayed.at(-1);

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

      const player = playerSittingOut(newGame);
      if (newGame.loner && player) {
        const availableCards = availableCardsToPlay(player);
        const cardToPlay = availableCards[0];
        player.playedCards.push(cardToPlay);
        newGame.currentTrick.playerSittingOut = { card: cardToPlay, player: player };
      }

      if (!playerFollowedSuit) {
        newGame.currentTrick.playerRenege = newGame.currentPlayer;
      } else if (newGame.currentTricks.length < 5) {
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
        winningCard.card = card;
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
      (newGame.currentTrick && newGame.currentTrick.playerRenege !== null) ||
      (newGame.currentTricks.length === 5 &&
        newGame.currentTricks.filter((t) => t.taker !== null).length === 5);

    if (handOver) {
      // if hand is over update the game results.
      newGame.handResults.push(getHandResult(newGame));
    }
    return newGame;
  };

  /**
   * Undo the result of the last hand and deal the same cards again as if the hand started over.
   */
  const reverseLastHandPlayed = (game: EuchreGameInstance): EuchreGameInstance => {
    let newGame: EuchreGameInstance = { ...game };
    const lastHandResult: EuchreHandResult | undefined = newGame.handResults.pop();

    if (!lastHandResult) throw new Error('Hand result not found for replay.');

    const discard: Card | null = newGame.discard ? { ...newGame.discard } : null;
    const allCards: EuchreCard[] = lastHandResult.allPlayerCards;
    const currentKitty: Card[] = [
      ...newGame.kitty.map((c) => {
        return { ...c };
      })
    ];
    const dealCount: number[] = [...newGame.cardDealCount];
    const player1Hand: Card[] = allCards
      .filter((c) => playerEqual(c.player, newGame.player1))
      .map((c) => {
        return { ...c.card };
      });
    const player2Hand: Card[] = allCards
      .filter((c) => playerEqual(c.player, newGame.player2))
      .map((c) => {
        return { ...c.card };
      });
    const player3Hand: Card[] = allCards
      .filter((c) => playerEqual(c.player, newGame.player3))
      .map((c) => {
        return { ...c.card };
      });
    const player4Hand: Card[] = allCards
      .filter((c) => playerEqual(c.player, newGame.player4))
      .map((c) => {
        return { ...c.card };
      });

    newGame = resetForNewDeal(newGame);
    newGame.cardDealCount = dealCount;
    newGame.kitty = currentKitty;
    newGame.trump = newGame.kitty[0];
    newGame.player1.hand = player1Hand;
    newGame.player2.hand = player2Hand;
    newGame.player3.hand = player3Hand;
    newGame.player4.hand = player4Hand;
    newGame.currentPlayer = getPlayerRotation(newGame.gamePlayers, newGame.dealer)[0];
    newGame.handId = uuidv4();
    newGame.currentTrick = createTrick(lastHandResult.roundNumber);
    const tempTrump = newGame.trump;

    if (discard && newGame.trump) {
      newGame.dealer.hand = [...newGame.dealer.hand.filter((c) => !cardEqual(c, tempTrump)), discard];
    }

    newGame.deck = [...newGame.gamePlayers.map((p) => p.hand).flat(), ...currentKitty];
    newGame.currentRound = lastHandResult.roundNumber;
    for (const player of newGame.gamePlayers) player.hand = indexCards(player.hand);

    verifyDealtCards(newGame);

    return newGame;
  };

  /** Returns false if the player must follow suit and the played card did not follow suit.
   * Returns true in all other cases.
   */
  const didPlayerFollowSuit = (game: EuchreGameInstance, playedCard: Card): boolean => {
    const cardsAvailableToBePlayed = availableCardsToPlay(game.currentPlayer);

    // make sure the played card is in the original array of cards available to be played
    if (cardsAvailableToBePlayed.find((c) => cardEqual(c, playedCard)) === undefined) {
      cardsAvailableToBePlayed.push(playedCard);
    }

    const leadCard: EuchreCard | null = game.currentTrick.cardsPlayed.at(0) ?? null;

    // player does not need to follow suit if no card has yet been lead.
    if (!leadCard || playerEqual(leadCard.player, game.currentPlayer)) return true;

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
    const mustFollowSuit: boolean =
      suitCount.filter((s) => s.suit === suitToFollow && s.count > 0).length > 0;

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
  function getRandomScoreForDifficulty(
    team: 1 | 2,
    difficulty: GameDifficulty,
    minScore: number,
    maxScore: number
  ): number {
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
  }

  const incrementSpeed = useCallback((gameSpeed: GameSpeed, offset: number): GameSpeed => {
    if (AVAILABLE_GAME_SPEED.includes(gameSpeed)) {
      const retval = AVAILABLE_GAME_SPEED.at(AVAILABLE_GAME_SPEED.indexOf(gameSpeed) + offset) ?? 150;

      if (retval < gameSpeed) return gameSpeed;
      else return retval;
    }

    return gameSpeed;
  }, []);

  const decrementSpeed = (gameSpeed: GameSpeed, offset: number): GameSpeed => {
    if (AVAILABLE_GAME_SPEED.includes(gameSpeed)) {
      const retval = AVAILABLE_GAME_SPEED.at(AVAILABLE_GAME_SPEED.indexOf(gameSpeed) - offset) ?? 4000;

      if (retval > gameSpeed) return gameSpeed;
      else return retval;
    }

    return gameSpeed;
  };

  const gameDelay = useCallback(
    async (gameSettings: EuchreSettings, increment?: number) => {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          increment ? incrementSpeed(gameSettings.gameSpeed, increment) : gameSettings.gameSpeed
        )
      );
    },
    [incrementSpeed]
  );

  const notificationDelay = useCallback(
    async (gameSettings: EuchreSettings, increment?: number) => {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          increment
            ? incrementSpeed(gameSettings.notificationSpeed, increment)
            : gameSettings.notificationSpeed
        )
      );
    },
    [incrementSpeed]
  );

  return {
    teamPoints,
    determineCurrentWinnerForTrick,
    resetForNewDeal,
    dealCards,
    copyCardsFromReplay,
    verifyDealtCards,
    playerSittingOut,
    getRandomScoreForDifficulty,
    reverseLastHandPlayed,
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
    createTrick
  };
};

export default useGameData;

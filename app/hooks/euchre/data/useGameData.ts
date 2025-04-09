import {
  AVAILABLE_GAME_SPEED,
  Card,
  EuchreCard,
  EuchreGameInstance,
  EuchreHandResult,
  EuchrePlayer,
  EuchreTrick,
  GameDifficulty,
  GameSpeed,
  RANDOM_FOR_DIFFICULTY
} from '@/app/lib/euchre/definitions';
import useCardData from './useCardData';
import usePlayerData from './usePlayerData';
import { useCallback } from 'react';

const useGameData = () => {
  const {
    cardEqual,
    createPlaceholderCards,
    getCardValuesForSuit,
    getCardValue,
    cardIsLeftBower,
    getSuitCount
  } = useCardData();
  const { availableCardsToPlay, playerEqual, sortCards, getPlayerRotation } = usePlayerData();

  const playerSittingOut = (game: EuchreGameInstance): EuchrePlayer | null => {
    if (game.maker && game.loner)
      return (
        game.gamePlayers.find(
          (p) => p.team === game.maker?.team && p.playerNumber !== game.maker.playerNumber
        ) ?? null
      );

    return null;
  };

  const handFinished = (game: EuchreGameInstance): boolean => {
    const playerReneged: boolean = game.currentTrick && game.currentTrick.playerRenege !== null;
    const allCardsPlayed: boolean = game.currentTricks.filter((t) => t.taker !== null).length === 5;
    return playerReneged || allCardsPlayed;
  };

  const trickFinished = (game: EuchreGameInstance): boolean => {
    const playerReneged: boolean = game.currentTrick && game.currentTrick.playerRenege !== null;
    const allPlayersPlayed: boolean =
      (game.currentTrick && game.currentTrick.cardsPlayed.length === (game.loner ? 3 : 4)) ?? false;
    return playerReneged || allPlayersPlayed;
  };

  const isGameOver = (game: EuchreGameInstance): boolean => {
    const teamOnePoints: number = teamPoints(game, 1);
    const teamTwoPoints: number = teamPoints(game, 2);

    return teamOnePoints >= 10 || teamTwoPoints >= 10;
  };

  const teamPoints = (game: EuchreGameInstance, teamNumber: 1 | 2): number => {
    return game.gameResults
      .filter((t) => t.teamWon === teamNumber)
      .map((t) => t.points)
      .reduce((acc, curr) => acc + curr, 0);
  };

  const resetForNewGame = (game: EuchreGameInstance): EuchreGameInstance => {
    const newGame: EuchreGameInstance = resetForNewDeal(game);

    newGame.gameResults = [];
    newGame.dealer = newGame.player1;

    return newGame;
  };

  const resetForNewDeal = (game: EuchreGameInstance): EuchreGameInstance => {
    const newGame: EuchreGameInstance = { ...game };
    newGame.kitty = [];
    newGame.deck = createPlaceholderCards(24);
    newGame.currentPlayer = game.player1;
    newGame.maker = null;
    newGame.loner = false;
    newGame.trump = { suit: '♠', value: 'P', index: -1 };
    newGame.discard = null;
    newGame.turnedDown = null;
    newGame.cardDealCount = [];
    newGame.currentTricks = [];

    newGame.player1 = resetPlayerCard(newGame.player1);
    newGame.player2 = resetPlayerCard(newGame.player2);
    newGame.player3 = resetPlayerCard(newGame.player3);
    newGame.player4 = resetPlayerCard(newGame.player4);

    return newGame;
  };

  const resetPlayerCard = (player: EuchrePlayer): EuchrePlayer => {
    const newPlayer: EuchrePlayer = { ...player };
    newPlayer.hand = [];
    newPlayer.playedCards = [];
    newPlayer.placeholder = createPlaceholderCards(5);
    return newPlayer;
  };

  const dealCards = (game: EuchreGameInstance): EuchreGameInstance => {
    if (!game.dealer) throw Error('Unable to deal cards. Dealer not found.');

    const newGame: EuchreGameInstance = { ...game };
    const players: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
    const randomNum: number = Math.floor(Math.random() * 3) + 1;
    let counter: number = 0;

    newGame.cardDealCount = [randomNum, 5 - randomNum];

    for (let i = 0; i < 8; i++) {
      let numberOfCards = 0;
      const currentPlayer: EuchrePlayer = players[i % 4];
      const firstRound: boolean = i < 4;

      if (firstRound) numberOfCards = i % 2 ? randomNum : 5 - randomNum;
      else numberOfCards = i % 2 ? 5 - randomNum : randomNum;

      for (let j = 0; j < numberOfCards; j++) {
        currentPlayer.hand.push(newGame.deck[counter]);
        counter++;
      }
    }

    while (counter < newGame.deck.length) {
      newGame.kitty.push(newGame.deck[counter]);
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
    if (!game.dealer || !game.maker) throw new Error('Dealer and maker not found for hand result.');

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
        }),
        ...p.playedCards.map((c) => {
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
   *
   */
  const updateIfTrickOver = (
    game: EuchreGameInstance,
    playerRotation: EuchrePlayer[]
  ): EuchreGameInstance => {
    const newGame: EuchreGameInstance = { ...game };

    if (!newGame.currentPlayer) throw new Error('Game player not found.');
    if (!newGame.trump) throw new Error('Trump not found.');

    newGame.currentTricks = [...newGame.currentTricks];
    const lastTrick: EuchreTrick | undefined = newGame.currentTricks.pop();
    if (!lastTrick) throw new Error('Trick not found for playthrough');

    const newLastTrick = { ...lastTrick };
    let playerFollowedSuit = true;
    const lastCardPlayed = newLastTrick.cardsPlayed.at(-1);

    // determine if the player followed suit when possible. if not, then the hand/trick is over and the
    // other team wins the hand.
    if (lastCardPlayed) {
      playerFollowedSuit = didPlayerFollowSuit(newGame, lastCardPlayed.card);
    }

    if (!playerFollowedSuit || newLastTrick.cardsPlayed.length === playerRotation.length) {
      const trickWinner = determineCurrentWinnerForTrick(newGame.trump, newLastTrick);

      if (!trickWinner.card?.player) throw new Error('Trick winner not found.');

      newLastTrick.taker = trickWinner.card.player;

      const player = playerSittingOut(newGame);
      if (newGame.loner && player) {
        const availableCards = availableCardsToPlay(player);
        const cardToPlay = availableCards[0];
        player.playedCards.push(cardToPlay);
        newLastTrick.playerSittingOut = { card: cardToPlay, player: player };
      }

      if (!playerFollowedSuit) {
        newLastTrick.playerRenege = newGame.currentPlayer;
      } else if (newGame.currentTricks.length < 5) {
        newGame.currentPlayer = trickWinner.card?.player ?? null;
      }
    } else {
      newGame.currentPlayer = playerRotation[0];
    }

    newGame.currentTricks.push(newLastTrick);
    return newGame;
  };

  /**
   *
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
   * Update game state if hand is over.
   */
  const updateIfHandOver = (game: EuchreGameInstance): EuchreGameInstance => {
    const newGame: EuchreGameInstance = { ...game };
    const handOver: boolean =
      (newGame.currentTrick && newGame.currentTrick.playerRenege !== null) ||
      (newGame.currentTricks.length === 5 &&
        newGame.currentTricks.filter((t) => t.taker !== null).length === 5);

    if (handOver) {
      // if hand is over update the game results.
      newGame.gameResults.push(getHandResult(newGame));
      newGame.currentRound += 1;
    }
    return newGame;
  };

  /**
   * Undo the result of the last hand and deal the same cards again as if the hand started over.
   */
  const reverseLastHandPlayed = (game: EuchreGameInstance): EuchreGameInstance => {
    let newGame: EuchreGameInstance = { ...game };
    const lastGameResult: EuchreHandResult | undefined = newGame.gameResults.pop();

    if (!lastGameResult) throw new Error('Game result not found.');
    if (!newGame.dealer) throw new Error('Game dealer not found.');
    if (!newGame.trump) throw new Error('Trump card not found.');

    const discard: Card | null = newGame.discard ? { ...newGame.discard } : null;
    const allCards: EuchreCard[] = lastGameResult.allPlayerCards;
    const currentKitty: Card[] = [
      ...newGame.kitty.map((c) => {
        return { ...c };
      })
    ];
    const dealCount: number[] = [...newGame.cardDealCount];
    newGame.gameResults = [...newGame.gameResults];

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
    const tempTrump = newGame.trump;

    if (discard && newGame.trump) {
      newGame.dealer.hand = [...newGame.dealer.hand.filter((c) => !cardEqual(c, tempTrump)), discard];
    }

    newGame.deck = [...newGame.gamePlayers.map((p) => p.hand).flat(), ...currentKitty];
    newGame.currentRound = lastGameResult.roundNumber;
    for (const player of newGame.gamePlayers) player.hand = sortCards(player, null);

    verifyDealtCards(newGame);

    return newGame;
  };

  /** Returns false if the player must follow suit and the played card did not follow suit.
   * Returns true in all other cases.
   */
  const didPlayerFollowSuit = (game: EuchreGameInstance, playedCard: Card): boolean => {
    if (!game.currentPlayer) throw new Error();
    if (!game.trump) throw new Error();

    const cardsAvailableToBePlayed = availableCardsToPlay(game.currentPlayer);

    // make sure the played card is in the original array of cards available to be played
    if (cardsAvailableToBePlayed.find((c) => cardEqual(c, playedCard)) === undefined) {
      cardsAvailableToBePlayed.push(playedCard);
    }

    const leadCard: EuchreCard | null = game.currentTrick?.cardsPlayed.at(0) ?? null;

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
   * Logic to have less difficulty is to have more randomness is AI decisions.
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
        let randomScore = Math.floor(Math.random() * maxScore);
        if (randomScore < minScore) randomScore = minScore;

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
    handFinished,
    trickFinished,
    updateIfHandOver,
    updateIfTrickOver,
    getCardsAvailableToPlay,
    isGameOver
  };
};

export default useGameData;

// class EuchreGameInstance {
//     readonly player1: EuchrePlayer;
//     readonly player2: EuchrePlayer;
//     readonly player3: EuchrePlayer;
//     readonly player4: EuchrePlayer;

//     deck: Card[] = [];
//     kitty: Card[] = [];
//     dealer: EuchrePlayer | null = null;
//     maker: EuchrePlayer | null = null;
//     loner: boolean = false;
//     trump: Card | null = null;
//     discard: Card | null = null;
//     turnedDown: Card | null = null;
//     cardDealCount: number[] = [];
//     currentRound: number = 1;

//     currentTricks: EuchreTrick[] = [];
//     gameResults: EuchreHandResult[] = [];
//     currentPlayer: EuchrePlayer | null = null;

//     constructor(player1: EuchrePlayer, player2: EuchrePlayer, player3: EuchrePlayer, player4: EuchrePlayer) {
//       this.player1 = player1;
//       this.player2 = player2;
//       this.player3 = player3;
//       this.player4 = player4;
//     }

//     get gamePlayers(): EuchrePlayer[] {
//       return [this.player1, this.player2, this.player3, this.player4];
//     }

//     get playerSittingOut(): EuchrePlayer | null {
//       if (this.maker && this.loner)
//         return (
//           this.gamePlayers.find(
//             (p) => p.team === this.maker?.team && p.playerNumber !== this.maker.playerNumber
//           ) ?? null
//         );

//       return null;
//     }

//     get currentTrick(): EuchreTrick | null {
//       const lastTrick = this.currentTricks.at(-1);

//       if (!lastTrick) return null;

//       return { ...lastTrick };
//     }

//     get handTricks(): EuchreTrick[] {
//       return [...this.currentTricks];
//     }

//     get handFinished(): boolean {
//       const playerReneged = this.currentTrick && this.currentTrick.playerRenege !== null;
//       const allCardsPlayed = this.currentTricks.filter((t) => t.taker !== null).length === 5;
//       return playerReneged || allCardsPlayed;
//     }

//     get allGameResults(): EuchreHandResult[] {
//       return [...this.gameResults];
//     }
//     get trickFinished(): boolean {
//       const playerReneged = this.currentTrick && this.currentTrick.playerRenege !== null;
//       const allPlayersPlayed =
//         (this.currentTrick && this.currentTrick.cardsPlayed.length === (this.loner ? 3 : 4)) ?? false;
//       return playerReneged || allPlayersPlayed;
//     }

//     get isGameOver(): boolean {
//       const teamOnePoints = this.teamPoints(1);
//       const teamTwoPoints = this.teamPoints(2);

//       return teamOnePoints >= 10 || teamTwoPoints >= 10;
//     }

//     // get currentPlayer(): EuchrePlayer | null {
//     //   return this._currentPlayer;
//     // }

//     assignDealerAndPlayer(player: EuchrePlayer): void {
//       this.dealer = player;
//       this._currentPlayer = player;
//     }

//     /** Set the current player */
//     assignPlayer(player: EuchrePlayer): void {
//       this._currentPlayer = player;
//     }

//     teamPoints(teamNumber: 1 | 2): number {
//       return this.gameResults
//         .filter((t) => t.teamWon === teamNumber)
//         .map((t) => t.points)
//         .reduce((acc, curr) => acc + curr, 0);
//     }

//     addTrickForNewHand(): void {
//       this.currentTricks.push(new EuchreTrick(this.currentRound));
//     }

//     resetForNewGame(): void {
//       this.gameResults = [];
//       this.dealer = null;
//       this.deck = createPlaceholderCards(24);
//       this.resetForNewDeal();
//     }

//     resetForNewDeal(): void {
//       this.kitty = [];
//       this.deck = createPlaceholderCards(24);
//       this._currentPlayer = null;
//       this.maker = null;
//       this.loner = false;
//       this.trump = null;
//       this.discard = null;
//       this.turnedDown = null;
//       this.cardDealCount = [];
//       this.currentTricks = [];

//       this.resetPlayerCards();
//     }

//     resetPlayerCards(): void {
//       const players = [this.player1, this.player2, this.player3, this.player4];

//       for (const player of players) {
//         player.assignCards = [];
//         player.playedCards = [];
//         player.placeholder = createPlaceholderCards(5);
//       }
//     }

//     shallowCopy(): EuchreGameInstance {
//       const game = new EuchreGameInstance(this.player1, this.player2, this.player3, this.player4);
//       game.deck = this.deck;
//       game.kitty = this.kitty;
//       game.dealer = this.dealer;
//       game._currentPlayer = this.currentPlayer;
//       game.loner = this.loner;
//       game.trump = this.trump;
//       game.maker = this.maker;
//       game.cardDealCount = this.cardDealCount;
//       game.currentTricks = this.currentTricks;
//       game.gameResults = this.gameResults;
//       game.currentRound = this.currentRound;
//       game.discard = this.discard;
//       game.turnedDown = this.turnedDown;

//       return game;
//     }

//     dealCards(): void {
//       if (!this.dealer) throw Error('Unable to deal cards. Dealer not found.');

//       const players: EuchrePlayer[] = getPlayerRotation(this.gamePlayers, this.dealer);
//       const randomNum = Math.floor(Math.random() * 3) + 1;
//       let counter = 0;

//       this.cardDealCount = [randomNum, 5 - randomNum];

//       for (let i = 0; i < 8; i++) {
//         let numberOfCards = 0;
//         const currentPlayer = players[i % 4];
//         const firstRound = i < 4;
//         const tempHand: Card[] = [];

//         if (firstRound) numberOfCards = i % 2 ? randomNum : 5 - randomNum;
//         else numberOfCards = i % 2 ? 5 - randomNum : randomNum;

//         for (let j = 0; j < numberOfCards; j++) {
//           tempHand.push(this.deck[counter]);
//           counter++;
//         }
//         currentPlayer.addToHand(tempHand);
//       }

//       while (counter < this.deck.length) {
//         this.kitty.push(this.deck[counter]);
//         counter++;
//       }
//     }

//     /** Copy cards that were dealt from the passed game instance. */
//     copyCardsFromReplay(replayHand: EuchreHandResult): void {
//       const players = this.gamePlayers;

//       for (const player of players) {
//         player.assignCards = replayHand.allPlayerCards
//           .filter((p) => p.player.playerNumber === player.playerNumber)
//           .map((p) => new Card(p.card.suit, p.card.value));

//         if (player.availableCards.length < 5) {
//           throw new Error('Invalid card count for player after copy from replay.');
//         }

//         if (player.availableCards.find((c) => c.value === 'P')) {
//           throw new Error('Invalid card found for player after copy from replay.');
//         }
//       }

//       this.kitty = replayHand.kitty.map((c) => new Card(c.suit, c.value));

//       if (replayHand.turnedDown) {
//         this.trump = new Card(replayHand.turnedDown.suit, replayHand.turnedDown.value);
//       } else {
//         this.trump = new Card(replayHand.trump.suit, replayHand.trump.value);
//       }

//       const tempTrump = this.trump;
//       if (replayHand.discard && !this.turnedDown && this.dealer) {
//         this.dealer.assignCards = [
//           ...this.dealer.availableCards.filter((c) => !c.equal(tempTrump)),
//           new Card(replayHand.discard.suit, replayHand.discard.value)
//         ];

//         if (this.dealer.availableCards.length < 5) {
//           throw new Error('Invalid card count for dealer after copy from replay.');
//         }
//       }
//     }

//     /** Verify cards were dealt correctly. */
//     verifyDealtCards(): void {
//       const msg = 'Card dealt verification failed.';

//       if (this.kitty.length !== 4) {
//         throw new Error('');
//       }
//       const allCardsDealt = [this.kitty].flat();

//       for (const player of this.gamePlayers) {
//         const playerHand = player.availableCards;
//         if (playerHand.length !== 5) throw new Error(msg + ' Invalid card count for player: ' + player.name);

//         if (playerHand.find((c) => c.value === 'P'))
//           throw Error(msg + ' Invalid cards found in player hand. (Value === P) Player: ' + player.name);

//         allCardsDealt.push(...playerHand);
//       }

//       const tempSet = new Set<string>([...allCardsDealt.map((c) => `${c.value}${c.suit}`)]);

//       if (tempSet.size !== 24) {
//         const missingCards = allCardsDealt.filter((c) => !tempSet.has(`${c.value}${c.suit}`));
//         throw Error(msg + '  Missing Cards: ' + missingCards.map((c) => `${c.value}${c.suit}`).join(','));
//       }
//     }

//     /** */
//     private getHandResult(): EuchreHandResult {
//       if (!this.dealer || !this.maker) throw new Error('Dealer and maker not found for hand result.');

//       const makerTricksWon = this.currentTricks.filter((t) => t.taker?.team === this.maker?.team).length;
//       const renegePlayer = this.currentTricks.find((t) => t.playerRenege !== null)?.playerRenege ?? null;

//       let points = 0;
//       let teamWon = this.maker.team;

//       if (renegePlayer && this.maker.team === renegePlayer.team) {
//         points = this.loner ? 4 : 2;
//         teamWon = teamWon === 1 ? 2 : 1;
//       } else if (renegePlayer && this.maker.team !== renegePlayer.team) {
//         points = this.loner ? 4 : 2;
//       } else if (this.loner && makerTricksWon === 5) {
//         points = 4;
//       } else if (makerTricksWon === 5) {
//         points = 2;
//       } else if (makerTricksWon >= 3) {
//         points = 1;
//       } else {
//         points = 2;
//         teamWon = teamWon === 1 ? 2 : 1;
//       }

//       const allPlayerCards = this.gamePlayers
//         .map((p) => [
//           ...p.availableCards.map((c) => new EuchreCard(p, c)),
//           ...p.playedCards.map((c) => new EuchreCard(p, c))
//         ])
//         .flat();

//       const retval: EuchreHandResult = {
//         tricks: [...this.currentTricks],
//         points: points,
//         teamWon: teamWon,
//         dealer: this.dealer,
//         maker: this.maker,
//         roundNumber: this.currentRound,
//         loner: this.loner,
//         trump: this.trump ?? new Card('♠', 'P'),
//         turnedDown: this.turnedDown,
//         discard: this.discard,
//         defenders: this.gamePlayers.filter((p) => p.team !== this.maker?.team),
//         allPlayerCards: allPlayerCards,
//         kitty: [...this.kitty]
//       };

//       this.validateHandResult(retval);

//       return retval;
//     }

//     private validateHandResult(result: EuchreHandResult): void {
//       const msg = 'Hand result validation failed.';
//       const allCards = [...result.allPlayerCards.map((c) => c.card), ...result.kitty];
//       const gameCards = new Set<string>();

//       const player1Cards = result.allPlayerCards.filter((c) => c.player.playerNumber === 1);
//       const player2Cards = result.allPlayerCards.filter((c) => c.player.playerNumber === 2);
//       const player3Cards = result.allPlayerCards.filter((c) => c.player.playerNumber === 3);
//       const player4Cards = result.allPlayerCards.filter((c) => c.player.playerNumber === 4);
//       const playerCards = [player1Cards, player2Cards, player3Cards, player4Cards];

//       for (const cards of playerCards) {
//         if (cards.length !== 5) throw new Error(msg + ' Invalid player card count.');
//       }

//       if (allCards.length !== 24) throw new Error(msg + ' Invalid total card count.');

//       for (const card of allCards) {
//         if (card.value === 'P') throw new Error(msg + ' Invalid card (Pending).');

//         gameCards.add(`${card.value + card.suit}`);
//       }

//       if (result.discard) gameCards.add(`${result.discard.value + result.discard.suit}`);

//       if (gameCards.size !== 24) throw new Error(msg + ' Invalid unique total card count.');
//     }

//     /** Update game state if trick is finished.
//      *
//   1` */
//     updateIfTrickOver(playerRotation: EuchrePlayer[]): void {
//       if (!this.currentPlayer) throw new Error('Game player not found.');
//       if (!this.trump) throw new Error('Trump not found.');

//       const lastTrick = this.currentTricks.at(-1);
//       let playerFollowedSuit = true;

//       if (!lastTrick) throw new Error('Trick not found for playthrough');
//       const lastCardPlayed = lastTrick.cardsPlayed.at(-1);

//       // determine if the player followed suit when possible. if not, then the hand/trick is over and the
//       // other team wins the hand.
//       if (lastCardPlayed) {
//         playerFollowedSuit = didPlayerFollowSuit(this, lastCardPlayed.card);
//       }

//       if (!playerFollowedSuit || lastTrick.cardsPlayed.length === playerRotation.length) {
//         const trickWinner = determineCurrentWinnerForTrick(this.trump, lastTrick);

//         if (!trickWinner.card?.player) throw new Error('Trick winner not found.');

//         lastTrick.taker = trickWinner.card.player;

//         if (this.loner && this.playerSittingOut) {
//           const playerSittingOut = this.playerSittingOut;
//           lastTrick.playerSittingOut = playerSittingOut.playGameCard(playerSittingOut.availableCards[0]);
//           playerSittingOut.sortCards(this.trump);
//         }

//         if (!playerFollowedSuit) {
//           lastTrick.playerRenege = this._currentPlayer;
//         } else if (this.currentTricks.length < 5) {
//           this._currentPlayer = trickWinner.card?.player ?? null;
//         }
//       } else {
//         this._currentPlayer = playerRotation[0];
//       }
//     }

//     /**
//      * Update game state if hand is over.
//      */
//     updateIfHandOver(): void {
//       const handOver =
//         (this.currentTrick && this.currentTrick.playerRenege !== null) ||
//         (this.currentTricks.length === 5 && this.currentTricks.filter((t) => t.taker !== null).length === 5);

//       if (handOver) {
//         // if hand is over update the game results.
//         this.gameResults.push(this.getHandResult());
//         this.currentRound += 1;
//       }
//     }

//     /**
//      * Undo the result of the last hand and deal the same cards again as if the hand started over.
//      */
//     reverseLastHandPlayed(): void {
//       const lastGameResult: EuchreHandResult | undefined = this.gameResults.at(-1);

//       if (!lastGameResult) throw new Error('Game result not found.');
//       if (!this.dealer) throw new Error('Game dealer not found.');
//       if (!this.trump) throw new Error('Trump card not found.');

//       const discard = this.discard;
//       const allCards: EuchreCard[] = lastGameResult.allPlayerCards;
//       const currentKitty = [...this.kitty];
//       const dealCount = [...this.cardDealCount];
//       this.gameResults = [...this.gameResults.slice(0, this.gameResults.length - 1)];

//       const player1Hand = allCards.filter((c) => c.player.equal(this.player1)).map((c) => c.card);
//       const player2Hand = allCards.filter((c) => c.player.equal(this.player2)).map((c) => c.card);
//       const player3Hand = allCards.filter((c) => c.player.equal(this.player3)).map((c) => c.card);
//       const player4Hand = allCards.filter((c) => c.player.equal(this.player4)).map((c) => c.card);

//       this.resetForNewDeal();
//       this.cardDealCount = dealCount;
//       this.kitty = currentKitty;
//       this.trump = this.kitty[0];
//       this.player1.assignCards = player1Hand;
//       this.player2.assignCards = player2Hand;
//       this.player3.assignCards = player3Hand;
//       this.player4.assignCards = player4Hand;
//       this._currentPlayer = getPlayerRotation(this.gamePlayers, this.dealer)[0];
//       const tempTrump = this.trump;

//       if (discard && this.trump) {
//         this.dealer.assignCards = [...this.dealer.availableCards.filter((c) => !c.equal(tempTrump)), discard];
//       }

//       this.deck = [...this.gamePlayers.map((p) => p.availableCards).flat(), ...currentKitty];
//       this.currentRound = lastGameResult.roundNumber;
//       for (const player of this.gamePlayers) player.sortCards(null);

//       this.verifyDealtCards();
//     }
//   }

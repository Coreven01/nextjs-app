import {
  Card,
  EuchreGameInstance,
  EuchrePlayer,
  EuchreSettings,
  GameDifficulty
} from '@/app/lib/euchre/definitions';
import { EuchreGameFlow, EuchreGameFlowState } from '@/app/hooks/euchre/reducers/gameFlowReducer';
import { InitDealResult, ShuffleResult } from '@/app/lib/euchre/logic-definitions';
import useGameData from '../data/useGameData';
import usePlayerData from '../data/usePlayerData';
import useCardData from '../data/useCardData';
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const useGameSetupLogic = () => {
  const { resetForNewDeal, dealCards, copyCardsFromReplay, verifyDealtCards, createTrick } = useGameData();
  const { indexCards, getPlayerRotation } = usePlayerData();
  const { createPlaceholderCards, getSuitCount, createShuffledDeck } = useCardData();

  const createPlayer = (name: string, team: 1 | 2, playerNumber: 1 | 2 | 3 | 4): EuchrePlayer => {
    return {
      name: name,
      team: team,
      playerNumber: playerNumber,
      hand: [],
      playedCards: [],
      human: false
    };
  };

  const createBaseGame = useCallback(
    (
      player1: EuchrePlayer,
      player2: EuchrePlayer,
      player3: EuchrePlayer,
      player4: EuchrePlayer
    ): EuchreGameInstance => {
      return {
        gameId: uuidv4(),
        handId: '',
        player1: player1,
        player2: player2,
        player3: player3,
        player4: player4,
        deck: [],
        kitty: [],
        dealer: player1,
        maker: null,
        loner: false,
        trump: { suit: '♠', value: 'P', index: 0 },
        discard: null,
        turnedDown: null,
        cardDealCount: [],
        gameResults: [],
        gamePlayers: [player1, player2, player3, player4],
        dealPassedCount: 0,

        currentRound: 1,
        currentTrick: createTrick(1),
        currentTricks: [],
        currentPlayer: player1
      };
    },
    [createTrick]
  );

  const createDefaultEuchreGame = () => {
    const player1: EuchrePlayer = createPlayer('Player 1', 1, 1);
    const player2: EuchrePlayer = createPlayer('Player 2', 1, 2);
    const player3: EuchrePlayer = createPlayer('Player 3', 2, 3);
    const player4: EuchrePlayer = createPlayer('Player 4', 2, 4);

    const newGame: EuchreGameInstance = createBaseGame(player1, player2, player3, player4);

    return newGame;
  };

  /** Create default euchre game with default players and dummy cards.
   *
   */
  const createEuchreGame = useCallback(
    (gameSettings: EuchreSettings): EuchreGameInstance => {
      const player1: EuchrePlayer = createPlayer(gameSettings.playerName, 1, 1);
      const player2: EuchrePlayer = createPlayer('Jerry', 1, 2);
      const player3: EuchrePlayer = createPlayer('George', 2, 3);
      const player4: EuchrePlayer = createPlayer('Elaine', 2, 4);

      player1.human = !gameSettings.debugAllComputerPlayers;

      const newGame: EuchreGameInstance = createBaseGame(player1, player2, player3, player4);
      newGame.deck = createPlaceholderCards(24);
      newGame.dealer = player1;

      return newGame;
    },
    [createBaseGame, createPlaceholderCards]
  );

  /** Get the initial game state when the game begins. */
  const getGameStateForInitialDeal = (
    gameState: EuchreGameFlowState,
    settings: EuchreSettings,
    game: EuchreGameInstance
  ) => {
    const newGameFlow: EuchreGameFlowState = {
      ...gameState,
      hasGameStarted: true,
      shouldShowDeckImages: settings.shouldAnimate ? [{ player: game.player1, value: true }] : [],
      shouldShowCardImagesForHand: !settings.shouldAnimate
        ? game.gamePlayers.map((p) => {
            return { player: p, value: true };
          })
        : [],
      shouldShowCardValuesForHand: [],
      hasFirstBiddingPassed: false,
      hasSecondBiddingPassed: false,
      gameFlow: EuchreGameFlow.BEGIN_INIT_DEAL
    };

    return newGameFlow;
  };

  /** Initialize the game with shuffled deck and set player 1 for deal. */
  const initDeckForInitialDeal = useCallback(
    (gameSettings: EuchreSettings, cancel: boolean): EuchreGameInstance => {
      const gameInstance: EuchreGameInstance = createEuchreGame(gameSettings);

      if (cancel) return gameInstance;

      gameInstance.currentPlayer = gameInstance.player1;
      gameInstance.dealer = gameInstance.player1;
      gameInstance.deck = createShuffledDeck(5);

      return gameInstance;
    },
    [createEuchreGame, createShuffledDeck]
  );

  /** Deal cards to players until first Jack is dealt. The player that is dealt the Jack will be the initial dealer for the game.
   * Animates using a transform to show a card being dealt to the user, if enabled by the settings.
   */
  const dealCardsForNewDealer = useCallback(
    (game: EuchreGameInstance): InitDealResult => {
      let counter: number = 0;
      const gameDeck: Card[] = game.deck;
      const rotation: EuchrePlayer[] = getPlayerRotation(game.gamePlayers, game.dealer);
      const retval: InitDealResult = {
        newDealer: game.dealer
      };

      // Deal until the first jack is dealt
      for (const card of gameDeck) {
        // exit loop once a jack is dealt.
        if (card.value === 'J') {
          retval.newDealer = rotation[counter % 4];
          break;
        }

        counter++;
      }

      return retval;
    },
    [getPlayerRotation]
  );

  /**
   * Deal cards to determine who the initial dealer is for a new game.
   * First Jack dealt will be the dealer of the game.
   */
  const dealCardsForDealer = useCallback(
    (
      gameInstance: EuchreGameInstance,
      gameState: EuchreGameFlowState,
      replayGameInstance: EuchreGameInstance | null
    ): InitDealResult | null => {
      if (!gameState.hasGameStarted) return null;

      const newGame: EuchreGameInstance = { ...gameInstance };
      let newDealerResult: InitDealResult;

      if (replayGameInstance === null) {
        // deal the cards until first Jack is dealt.
        newDealerResult = dealCardsForNewDealer(newGame);
      } else {
        const originalDealer = newGame.gamePlayers.find(
          (p) => p.playerNumber === replayGameInstance.gameResults[0].dealer.playerNumber
        );

        if (originalDealer) {
          newDealerResult = {
            newDealer: originalDealer
          };
        } else throw new Error();
      }

      return newDealerResult;
    },
    [dealCardsForNewDealer]
  );

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. */
  const shuffleAndDealHand = (
    gameInstance: EuchreGameInstance,
    gameSettings: EuchreSettings,
    replayGameInstance: EuchreGameInstance | null,
    cancel: boolean
  ): ShuffleResult => {
    let newGame: EuchreGameInstance = { ...gameInstance };
    const retval: ShuffleResult = { game: newGame };

    if (cancel) return retval;

    const rotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
    const difficulty: GameDifficulty = gameSettings.difficulty;
    const redealLimit: number = 10;
    let counter: number = 0;
    let shouldReDeal: boolean = true;
    const replayHand = replayGameInstance?.gameResults.find((r) => r.roundNumber === newGame.currentRound);

    while (shouldReDeal) {
      newGame = resetForNewDeal(newGame);

      if (replayHand === undefined) {
        newGame.deck = createShuffledDeck(5);
        newGame = dealCards(newGame);
        newGame.trump = newGame.kitty[0];
      } else {
        newGame = copyCardsFromReplay(newGame, replayHand);
      }

      if (difficulty === 'novice' && replayHand === undefined) {
        // if AI players have a strong start for 'novice' difficulty, then re-deal until limit is reached.
        const computerIsDealer = newGame.dealer.team === 2;
        const player3SuitCount = getSuitCount(newGame.player3.hand, newGame.trump);
        const player4SuitCount = getSuitCount(newGame.player4.hand, newGame.trump);
        const trumpCardFlipped = newGame.trump?.value === 'J' && computerIsDealer;

        shouldReDeal =
          counter < redealLimit &&
          (trumpCardFlipped || player3SuitCount.length === 2 || player4SuitCount.length === 2);
        counter++;
      } else {
        shouldReDeal = false;
      }
    }

    for (const player of newGame.gamePlayers) {
      player.hand = indexCards(player.hand);
    }

    try {
      verifyDealtCards(newGame);
    } catch (e) {
      const cardsForPlayers = newGame.gamePlayers.map((p) => p.hand);
      console.error(cardsForPlayers, replayHand);
      throw e;
    }

    newGame.handId = uuidv4();
    retval.game = newGame;
    retval.game.currentPlayer = rotation[0];

    return retval;
  };

  return {
    shuffleAndDealHand,
    getGameStateForInitialDeal,
    initDeckForInitialDeal,
    dealCardsForDealer,
    createPlayer,
    createDefaultEuchreGame,
    createTrick
  };
};

export default useGameSetupLogic;

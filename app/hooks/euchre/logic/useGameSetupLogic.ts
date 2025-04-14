import { CardTransformation } from '@/app/hooks/euchre/useMoveCard';
import {
  Card,
  EuchreGameInstance,
  EuchrePlayer,
  EuchreSettings,
  EuchreTrick
} from '@/app/lib/euchre/definitions';
import { EuchreGameFlow, EuchreGameFlowState } from '@/app/hooks/euchre/gameFlowReducer';
import { InitDealResult, ShuffleResult } from '@/app/lib/euchre/logic-definitions';
import { logDebugError } from '@/app/lib/euchre/util';
import useGameData from '../data/useGameData';
import usePlayerData from '../data/usePlayerData';
import useCardData from '../data/useCardData';
import { useCallback } from 'react';

const useGameSetupLogic = () => {
  const { resetForNewDeal, dealCards, copyCardsFromReplay, verifyDealtCards } = useGameData();
  const { sortCards, getPlayerRotation } = usePlayerData();
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

  const createTrick = (round: number): EuchreTrick => {
    return {
      taker: null,
      cardsPlayed: [],
      playerSittingOut: null,
      playerRenege: null,
      round: round
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

        currentRound: 1,
        currentTrick: createTrick(1),
        currentTricks: [],
        currentPlayer: player1
      };
    },
    []
  );

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

      const newGame = createBaseGame(player1, player2, player3, player4);
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
      logDebugError('Init deck for init deal');

      const gameInstance = createEuchreGame(gameSettings);

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
    (game: EuchreGameInstance, gameSetting: EuchreSettings): InitDealResult => {
      if (!game) throw Error('Game not found.');

      let counter = 0;
      const gameDeck = game.deck;
      const rotation = getPlayerRotation(game.gamePlayers, game.dealer);
      const orgDealerNumber = game.dealer.playerNumber;
      const transformations: CardTransformation[][] = [];
      const retval: InitDealResult = {
        newDealer: game.dealer,
        transformations: transformations
      };

      // Deal until the first jack is dealt
      for (const card of gameDeck) {
        // only create transformation if it's enabled by the settings.
        const cardToMoveTransformation = getCardTransformationForInitialDeal(
          card,
          gameSetting,
          rotation,
          orgDealerNumber,
          counter
        );

        if (cardToMoveTransformation) retval.transformations.push(cardToMoveTransformation);

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
      gameSettings: EuchreSettings,
      replayGameInstance: EuchreGameInstance | null
    ): InitDealResult | null => {
      if (!gameState.hasGameStarted) return null;

      const newGame = { ...gameInstance };

      if (!newGame?.deck) throw Error('Game deck not found.');
      let newDealerResult: InitDealResult;

      if (replayGameInstance === null) {
        // deal the cards until first Jack is dealt.
        newDealerResult = dealCardsForNewDealer(newGame, gameSettings);
      } else {
        const originalDealer = newGame.gamePlayers.find(
          (p) => p.playerNumber === replayGameInstance.gameResults[0].dealer.playerNumber
        );

        if (originalDealer) {
          newDealerResult = {
            newDealer: originalDealer,
            transformations: []
          };
        } else throw new Error();
      }

      return newDealerResult;
    },
    [dealCardsForNewDealer]
  );

  /** */
  const getCardTransformationForInitialDeal = (
    card: Card,
    gameSetting: EuchreSettings,
    rotation: EuchrePlayer[],
    originalDealerNumber: number,
    rotationCounter: number
  ) => {
    // only create transformation if it's enabled by the settings.
    if (gameSetting.shouldAnimate) {
      const player = rotation[rotationCounter % 4];
      const sourceId = ''; //card.generateElementId();
      const destinationId = ''; // player.innerPlayerBaseId;
      const cardToMoveTransformation: CardTransformation[] = [
        {
          sourceId: sourceId,
          destinationId: destinationId,
          sourcePlayerNumber: originalDealerNumber,
          destinationPlayerNumber: player.playerNumber,
          location: 'inner',
          options: {
            msDelay: 500 * gameSetting.gameSpeed,
            displayCardValue: true,
            card: card,
            cardOffsetHorizontal: 0,
            cardOffsetVertical: 0
          }
        }
      ];

      return cardToMoveTransformation;
    }

    return null;
  };

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. */
  const shuffleAndDealHand = (
    gameInstance: EuchreGameInstance,
    gameSettings: EuchreSettings,
    replayGameInstance: EuchreGameInstance | null,
    cancel: boolean
  ): ShuffleResult => {
    let newGame = { ...gameInstance };
    const retval: ShuffleResult = { transformations: [], game: newGame };

    if (cancel) return retval;

    const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
    const difficulty = gameSettings.difficulty;
    const redealLimit = 10;
    let counter = 0;
    let shouldReDeal = true;
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
      player.hand = sortCards(player, null);
    }

    try {
      verifyDealtCards(newGame);
    } catch (e) {
      const cardsForPlayers = newGame.gamePlayers.map((p) => p.hand);
      console.error(cardsForPlayers, replayHand);
      throw e;
    }

    retval.game = newGame;
    retval.game.currentPlayer = rotation[0];
    retval.transformations.push(getTransformationsForDealCardsForHand(retval.game, gameSettings));

    return retval;
  };

  const getTransformationsForDealCardsForHand = (
    game: EuchreGameInstance,
    gameSettings: EuchreSettings
  ): CardTransformation[] => {
    if (!game) throw Error('Game not found.');
    if (!game?.dealer) throw Error('Game dealer not found for card animation.');

    const rotation = getPlayerRotation(game.gamePlayers, game.dealer);
    const transformations: CardTransformation[] = [];

    if (!gameSettings.shouldAnimate) return transformations;

    const trumpCard = game.kitty[0];
    const dealerNumber = game.dealer.playerNumber;

    //#region Animation deal cards to users.
    for (let i = 0; i < 8; i++) {
      const player = rotation[i % 4];
      const playerNumber = player.playerNumber;
      const destinationId = ''; // player.innerPlayerBaseId;
      const firstRound = i < 4;
      const availableCards = player.hand;

      let cardCount: number = 0;
      cardCount = firstRound ? game.cardDealCount[i % 2] : game.cardDealCount[(i + 1) % 2];

      for (let cardIndex = 0; cardIndex < cardCount; cardIndex++) {
        const card = availableCards[firstRound ? cardIndex : 5 - cardCount + cardIndex];
        const cardSrcId = ''; //card.generateElementId();

        transformations.push({
          sourceId: cardSrcId,
          destinationId: destinationId,
          sourcePlayerNumber: dealerNumber,
          destinationPlayerNumber: playerNumber,
          location: 'inner',
          options: {
            msDelay: 75 * gameSettings.gameSpeed,
            displayCardValue: false,
            card: card,
            cardOffsetHorizontal: 0,
            cardOffsetVertical: 0
          }
        });
      }
    }

    transformations.push({
      sourceId: '', //trumpCard.generateElementId(),
      destinationId: 'game-center',
      sourcePlayerNumber: dealerNumber,
      destinationPlayerNumber: 0,
      location: 'outer',
      options: {
        card: trumpCard,
        displayCardValue: false,
        msDelay: 75 * gameSettings.gameSpeed,
        cardOffsetVertical: 0,
        cardOffsetHorizontal: 0
      }
    });

    return transformations;
  };

  return {
    shuffleAndDealHand,
    getGameStateForInitialDeal,
    initDeckForInitialDeal,
    dealCardsForDealer,
    createTrick,
    createPlayer
  };
};

export default useGameSetupLogic;

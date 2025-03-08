'use client';

import CenterInfo from '@/app/ui/euchre/center-info';
import UserInfo from '@/app/ui/euchre/user-info';
import Image from 'next/image';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { CardTransformation, FadeOutOptions } from './useMoveCard';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/16/solid';
import {
  getPlayerNotificationType,
  initialPlayerNotification,
  PlayerNotificationAction,
  PlayerNotificationActionType,
  playerNotificationReducer
} from './playerNotificationReducer';
import {
  EuchreGameFlow,
  GameFlowActionType,
  GameFlowState,
  gameFlowStateReducer,
  initialGameFlowState
} from './gameFlowReducer';
import {
  EuchreAnimateType,
  EuchreAnimationAnimationType,
  gameAnimationFlowReducer,
  initialGameAnimationState
} from './gameAnimationFlowReducer';
import useAnimation from '@/app/hooks/euchre/animation/useAnimation';
import {
  BidResult,
  Card,
  EuchreGameInstance,
  EuchreHandResult,
  EuchrePlayer,
  EuchreSettings,
  EuchreTrick,
  initialGameSettings,
  Suit
} from '@/app/lib/euchre/data';
import {
  dealCardsForDealer,
  getGameStateForInitialDeal,
  initDeckForInitialDeal,
  orderTrump,
  shuffleAndDealHand
} from '@/app/lib/euchre/game-setup-logic';
import { logDebugEvent } from '@/app/lib/euchre/util';
import { getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import { getPlayerRotation } from '@/app/lib/euchre/game';
import {
  determineCurrentWinnerForTrick,
  getGameStateForNextHand,
  isGameOver,
  playGameCard
} from '@/app/lib/euchre/game-play-logic';
import isGameStateValidToContinue from '@/app/lib/euchre/game-state-logic';

const FLIPPED_CARD_ID = 'flipped-card';

export function useEuchreGame() {
  //#region Hooks to control game flow *************************************************************************
  const [shouldPromptBid, setShouldPromptBid] = useState(false);
  const [shouldPromptDiscard, setShouldPromptDiscard] = useState(false);
  const [shouldCancelGame, setCancelGame] = useState(false);
  const [shouldShowHandResults, setShouldShowHandResults] = useState(false);
  const [shouldShowGameResults, setShouldShowGameResults] = useState(false);

  const playerCard = useRef<Card | null>(null);
  const bidResult = useRef<BidResult | null>(null);
  const gameInstance = useRef<EuchreGameInstance | null>(null);
  const gameSettings = useRef<EuchreSettings>(initialGameSettings);

  const [playerNotification, dispatchPlayerNotification] = useReducer(
    playerNotificationReducer,
    initialPlayerNotification
  );
  const [gameFlow, dispatchGameFlow] = useReducer(gameFlowStateReducer, initialGameFlowState);
  const [gameAnimationFlow, dispatchGameAnimationFlow] = useReducer(
    gameAnimationFlowReducer,
    initialGameAnimationState
  );
  const [animationTransformation, setAnimationTransformation] = useState<CardTransformation[][]>(
    []
  );
  const fadeOutElements = useRef<FadeOutOptions[]>([]);
  const tempFadeOutElements = useRef<FadeOutOptions[]>([]);

  const {
    animateForInitialDeal,
    animateDealCardsForHand,
    animateForPlayCard,
    setFadeOutForPlayers
  } = useAnimation(gameSettings.current);

  //#endregion

  //#region Game Initiallization *************************************************************************

  const addFadeOutElements = useCallback(
    async (elements: FadeOutOptions[]): Promise<void> => {
      const maxDuration: number = elements
        .map((e) => e.fadeOutDuration)
        .reduce((acc, curr) => (curr > acc ? curr : acc), 0);
      const maxDelay: number = elements
        .map((e) => e.fadeOutDelay)
        .reduce((acc, curr) => (curr > acc ? curr : acc), 0);
      setFadeOutForPlayers(elements);

      await new Promise((resolve) =>
        setTimeout(resolve, (maxDelay + maxDuration) * 1000 * gameSettings.current.gameSpeed)
      );
    },
    [setFadeOutForPlayers]
  );

  const clearFadeOutElements = useCallback(() => {
    addFadeOutElements([
      { playerNumber: 1, fadeOutId: '', fadeOutDelay: 1, fadeOutDuration: 1 },
      { playerNumber: 2, fadeOutId: '', fadeOutDelay: 1, fadeOutDuration: 1 },
      { playerNumber: 3, fadeOutId: '', fadeOutDelay: 1, fadeOutDuration: 1 },
      { playerNumber: 4, fadeOutId: '', fadeOutDelay: 1, fadeOutDuration: 1 },
      { playerNumber: 'o', fadeOutId: '', fadeOutDelay: 1, fadeOutDuration: 1 }
    ]);
  }, [addFadeOutElements]);

  /** */
  const handleCancelGame = useCallback(() => {
    if (shouldCancelGame) return;

    dispatchGameFlow({ type: GameFlowActionType.SET_INIT_DEAL });
    dispatchGameAnimationFlow({
      type: EuchreAnimationAnimationType.SET_ANIMATE_NONE
    });
    dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    setCancelGame(true);
  }, [shouldCancelGame]);

  /**
   * Reset game and state to defaults.
   * */
  const reset = (resetForBeginGame: boolean) => {
    if (resetForBeginGame) {
      dispatchGameFlow({
        type: GameFlowActionType.UPDATE_ALL,
        payload: {
          ...initialGameFlowState,
          shouldShowDeckImages: [],
          shouldShowHandImages: [],
          shouldShowHandValues: []
        }
      });

      dispatchGameAnimationFlow({
        type: EuchreAnimationAnimationType.SET_ANIMATE_NONE
      });
    } else {
      dispatchGameAnimationFlow({
        type: EuchreAnimationAnimationType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY
      });
    }

    dispatchPlayerNotification({
      type: PlayerNotificationActionType.RESET,
      payload: undefined
    });

    setShouldPromptBid(false);
    setShouldPromptDiscard(false);
    setShouldShowHandResults(false);
    setShouldShowGameResults(false);
    setCancelGame(false);

    playerCard.current = null;
  };

  /**
   * Reset state and begin cards being dealt to determine new dealer.
   * */
  const beginNewGame = () => {
    reset(true);
    setCancelGame(false);
    createGame();
  };

  /**
   * Update the state for a new game.
   * */
  const createGame = () => {
    const newGame = initDeckForInitialDeal(shouldCancelGame);
    const newGameFlowState: GameFlowState = getGameStateForInitialDeal(
      gameFlow,
      gameSettings.current,
      newGame
    );

    newGameFlowState.gameFlow = EuchreGameFlow.BEGIN_DEAL_FOR_JACK;
    dispatchGameFlow({
      type: GameFlowActionType.UPDATE_ALL,
      payload: newGameFlowState
    });

    gameInstance.current = newGame;
  };

  /** Deal cards to determine who the initial dealer will be for the game. First jack dealt to a user will become the initial dealer.
   *  After logic is run to determine dealer, animate the cards being dealt if turned on from the settings.
   */
  const beginDealCardsForDealer = useCallback(() => {
    const game = gameInstance.current;

    if (
      game &&
      gameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_FOR_JACK &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      logDebugEvent('Game Init - Begin deal cards for dealer');

      if (shouldCancelGame) {
        handleCancelGame();
        return;
      }

      const dealResult = dealCardsForDealer(game, gameFlow, gameSettings.current);

      if (!dealResult) throw Error('Unable to determine dealer for initial dealer.');

      game.dealer = dealResult.newDealer;
      game.currentPlayer = dealResult.newDealer;

      dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_DEAL_FOR_JACK });
      setAnimationTransformation([...animationTransformation, ...dealResult.transformations]);
    }
  }, [
    gameFlow,
    gameAnimationFlow.animationType,
    shouldCancelGame,
    animationTransformation,
    handleCancelGame
  ]);

  useEffect(() => {
    beginDealCardsForDealer();
  }, [beginDealCardsForDealer]);

  /** Animate dealing cards for initial dealer. When finished with animation, begin shuffle and deal for regular play. */
  useEffect(() => {
    const beginAnimationForInitDeal = async () => {
      const game = gameInstance.current;

      if (
        game &&
        gameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_FOR_JACK &&
        gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_DEAL_FOR_JACK
      ) {
        if (shouldCancelGame) {
          handleCancelGame();
          return;
        }

        if (!game.dealer) throw new Error('Unable to find dealer for initial deal animation.');

        await animateForInitialDeal(animationTransformation, game, game.dealer);

        dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });
        dispatchGameFlow({ type: GameFlowActionType.SET_SHUFFLE_CARDS });
      }
    };

    beginAnimationForInitDeal();
  }, [
    shouldCancelGame,
    gameInstance,
    animationTransformation,
    animateForInitialDeal,
    gameAnimationFlow.animationType,
    gameFlow.gameFlow,
    handleCancelGame
  ]);

  //#endregion

  //#region Shuffle and Deal for regular playthrough *************************************************************************

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. After deal logic is run, begin animation for dealing cards to players. */
  const beginShuffleAndDealHand = useCallback(() => {
    let game = gameInstance.current;

    if (
      game &&
      gameFlow.gameFlow === EuchreGameFlow.SHUFFLE_CARDS &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      logDebugEvent('Begin shuffle and deal for regular play');

      if (shouldCancelGame) {
        handleCancelGame();
        return;
      }

      const shuffleResult = shuffleAndDealHand(game, gameSettings.current, shouldCancelGame);

      game = shuffleResult.game;

      if (!game?.trump) throw Error('Trump not found after shuffle and deal for regular play.');

      // used for debugging
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
        ...gameFlow,
        hasFirstBiddingPassed: false,
        hasSecondBiddingPassed: false,
        shouldShowHandValues: showCardValues,
        gameFlow: EuchreGameFlow.DEAL_CARDS
      };

      dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });

      // display trump card for bidding in the center of the table.
      dispatchPlayerNotification({
        type: PlayerNotificationActionType.UPDATE_CENTER,
        payload: getFaceUpCard(FLIPPED_CARD_ID, game.trump)
      });

      dispatchGameFlow({
        type: GameFlowActionType.UPDATE_ALL,
        payload: newGameState
      });

      dispatchGameAnimationFlow({
        type: EuchreAnimationAnimationType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY
      });

      setAnimationTransformation([...animationTransformation, ...shuffleResult.transformations]);
      gameInstance.current = game;
    }
  }, [
    gameFlow,
    gameAnimationFlow.animationType,
    shouldCancelGame,
    animationTransformation,
    handleCancelGame
  ]);

  useEffect(() => {
    beginShuffleAndDealHand();
  }, [beginShuffleAndDealHand]);

  /**  */
  useEffect(() => {
    const beginAnimationForDealCards = async () => {
      if (
        gameInstance.current &&
        gameFlow.gameFlow === EuchreGameFlow.DEAL_CARDS &&
        gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY
      ) {
        if (shouldCancelGame) {
          handleCancelGame();
          return;
        }

        await animateDealCardsForHand(gameInstance.current);

        dispatchGameAnimationFlow({
          type: EuchreAnimationAnimationType.SET_ANIMATE_NONE
        });

        dispatchGameFlow({
          type: GameFlowActionType.SET_BID_FOR_TRUMP
        });
      }
    };

    beginAnimationForDealCards();
  }, [
    shouldCancelGame,
    gameInstance,
    animateDealCardsForHand,
    gameFlow.gameFlow,
    gameAnimationFlow.animationType,
    handleCancelGame
  ]);

  //#endregion

  /** Modify the game state depending on if the user named trump or passed based on player bid choice. */
  const handleBidResult = useCallback(async () => {
    const game = gameInstance.current;
    if (
      game &&
      gameFlow.gameFlow === EuchreGameFlow.HANDLE_BID &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      if (shouldCancelGame) {
        handleCancelGame();
        return;
      }

      if (!game) throw Error('Game not found for handle bid result.');
      if (!game.currentPlayer) throw Error('Current player not found for handle bid result.');

      const roundFinished = game.dealer === game.currentPlayer;
      const firstRound = !gameFlow.hasFirstBiddingPassed;

      if (
        bidResult.current &&
        (bidResult.current.orderTrump || bidResult.current.calledSuit) &&
        !gameSettings.current.debugAlwaysPass
      ) {
        // player called trump, either by suit or telling the deal er to pick up the card.
        dispatchGameFlow({ type: GameFlowActionType.SET_ORDER_TRUMP });
        dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });
      } else {
        // player passed
        const newGameFlow: GameFlowState = { ...gameFlow };

        if (roundFinished) {
          newGameFlow.hasFirstBiddingPassed = firstRound || newGameFlow.hasFirstBiddingPassed;
          newGameFlow.hasSecondBiddingPassed = !firstRound;
        }

        const playerElementId = game.currentPlayer.generateElementId();
        const newPlayerInfoState = getPlayerStateForBidding(
          playerElementId,
          game.currentPlayer,
          game.currentPlayer,
          'p',
          false,
          null
        );

        const rotation = getPlayerRotation(game.gamePlayers, game.currentPlayer);
        game.currentPlayer = rotation[0];

        dispatchPlayerNotification(newPlayerInfoState);
        dispatchGameFlow({
          type: GameFlowActionType.UPDATE_ALL,
          payload: newGameFlow
        });
        dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_HANDLE_BID });

        tempFadeOutElements.current.push({
          playerNumber: game.currentPlayer.playerNumber,
          fadeOutId: playerElementId,
          fadeOutDelay: 1,
          fadeOutDuration: 1
        });

        // simulate flipping over the trump card.
        if (roundFinished && !newGameFlow.hasSecondBiddingPassed) {
          tempFadeOutElements.current.push({
            playerNumber: 'o',
            fadeOutId: FLIPPED_CARD_ID,
            fadeOutDelay: 1,
            fadeOutDuration: 1
          });
        }
      }
    }
  }, [gameAnimationFlow.animationType, gameFlow, handleCancelGame, shouldCancelGame]);

  useEffect(() => {
    handleBidResult();
  }, [handleBidResult]);

  useEffect(() => {
    const beginAnimationForHandleBid = async () => {
      if (
        gameInstance.current &&
        gameFlow.gameFlow === EuchreGameFlow.HANDLE_BID &&
        gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_HANDLE_BID
      ) {
        logDebugEvent('Begin Animation for Handle Bid');

        if (shouldCancelGame) {
          handleCancelGame();
          return;
        }

        await addFadeOutElements(tempFadeOutElements.current);
        tempFadeOutElements.current = [];

        dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });
        dispatchGameFlow({ type: GameFlowActionType.SET_BID_FOR_TRUMP });
      }
    };

    beginAnimationForHandleBid();
  }, [
    addFadeOutElements,
    gameAnimationFlow.animationType,
    gameFlow.gameFlow,
    handleCancelGame,
    shouldCancelGame
  ]);

  //   /** All players passed during the bidding process. Re-initialize for deal for the next user in the rotation.  */
  const handlePassDeal = useCallback(async () => {
    logDebugEvent(
      'All players passed first and second round. Update state to pass the deal to the next user.'
    );

    if (shouldCancelGame) {
      handleCancelGame();
      return;
    }

    const game = gameInstance.current;

    if (!game?.dealer) throw Error('Game dealer not found - Pass deal.');

    const rotation = getPlayerRotation(game.gamePlayers, game.dealer);
    game.resetForNewDeal();
    game.dealer = rotation[0];

    dispatchPlayerNotification(getPlayerStateForAllPassed(game.dealer));

    await new Promise((resolve) => setTimeout(resolve, 2000 * gameSettings.current.gameSpeed));

    reset(false);
    const newGameFlow = getGameStateForInitialDeal(gameFlow, gameSettings.current, game);
    newGameFlow.gameFlow = EuchreGameFlow.SHUFFLE_CARDS;

    dispatchGameFlow({
      type: GameFlowActionType.UPDATE_ALL,
      payload: newGameFlow
    });

    dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });

    clearFadeOutElements();
  }, [clearFadeOutElements, gameFlow, handleCancelGame, shouldCancelGame]);

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. */
  const beginBidForTrump = useCallback(async () => {
    const game = gameInstance.current;

    if (
      game &&
      gameFlow.gameFlow === EuchreGameFlow.BID_FOR_TRUMP &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      logDebugEvent('Begin bid For trump - Player: ', game.currentPlayer?.name);

      if (shouldCancelGame) {
        handleCancelGame();
        return;
      }

      if (!game.trump) throw Error('Trump not found for bid for trump.');
      if (!game.currentPlayer) throw Error('Player not found for bid for trump.');

      if (gameFlow.hasSecondBiddingPassed) {
        // all users have passed. pass the deal to the next user and begin to re-deal.
        await handlePassDeal();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500 * gameSettings.current.gameSpeed));

      if (game.currentPlayer?.human) {
        dispatchGameFlow({ type: GameFlowActionType.SET_AWAIT_USER_INPUT });
        setShouldPromptBid(true); // Show prompt window for choosing trump or passing for human player.
      } else {
        dispatchGameFlow({ type: GameFlowActionType.SET_HANDLE_BID });
        const computerChoice = game.currentPlayer.determineBid(
          game,
          game.trump,
          gameFlow.hasFirstBiddingPassed
        );
        bidResult.current = computerChoice;
      }
    }
  }, [
    gameAnimationFlow.animationType,
    gameFlow.gameFlow,
    gameFlow.hasFirstBiddingPassed,
    gameFlow.hasSecondBiddingPassed,
    handleCancelGame,
    handlePassDeal,
    shouldCancelGame
  ]);

  useEffect(() => {
    const beginBidForTrumpLocal = async () => {
      await beginBidForTrump();
    };
    beginBidForTrumpLocal();
  }, [beginBidForTrump]);

  //   /** Submit the resulting bid from user input. */
  const handleBidSubmit = (result: BidResult) => {
    if (gameInstance.current && gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT) {
      bidResult.current = result;
      dispatchGameFlow({ type: GameFlowActionType.SET_HANDLE_BID });
      setShouldPromptBid(false);
    }
  };

  //   /** Player has ordered trump either by naming suit or telling the dealer to pick up the flipped card. */
  const beginOrderTrump = useCallback(async () => {
    let game = gameInstance.current;

    if (
      game &&
      gameFlow.gameFlow === EuchreGameFlow.ORDER_TRUMP &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      logDebugEvent('Trump ordered up. Player: ', game?.currentPlayer?.name, bidResult.current);

      if (shouldCancelGame) {
        handleCancelGame();
        return;
      }

      if (!game) throw new Error('Game not found for trump ordered');
      if (!bidResult.current) throw new Error('Bid result not found');

      game = orderTrump(game, bidResult.current);

      if (!game.dealer) throw Error('Dealer not found - Order Trump.');
      if (!game.maker) throw Error('Maker not found - Order Trump.');

      const orderType = bidResult.current.calledSuit ? 'n' : 'o';
      const playerElementId: string = game.maker.generateElementId();
      const newPlayerInfoState: PlayerNotificationAction = getPlayerStateForBidding(
        playerElementId,
        game.dealer,
        game.maker,
        orderType,
        bidResult.current.loner,
        bidResult.current.calledSuit
      );

      dispatchPlayerNotification(newPlayerInfoState);
      const option: FadeOutOptions = {
        playerNumber: game.maker.playerNumber,
        fadeOutId: playerElementId,
        fadeOutDelay: 1,
        fadeOutDuration: 1
      };
      tempFadeOutElements.current.push(option);

      dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_ORDER_TRUMP });
      gameInstance.current = game;
    }
  }, [gameAnimationFlow.animationType, gameFlow.gameFlow, handleCancelGame, shouldCancelGame]);

  useEffect(() => {
    beginOrderTrump();
  }, [beginOrderTrump]);

  useEffect(() => {
    const beginAnimationOrderTrump = async () => {
      const game = gameInstance.current;

      if (
        game &&
        gameFlow.gameFlow === EuchreGameFlow.ORDER_TRUMP &&
        gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_ORDER_TRUMP
      ) {
        logDebugEvent('Begin Animation for Order Trump');

        if (shouldCancelGame) {
          handleCancelGame();
          return;
        }

        if (!game?.dealer) throw new Error('Game dealer not found for animation trump ordered.');

        await addFadeOutElements(tempFadeOutElements.current);
        tempFadeOutElements.current = [];

        // additional delay to notify users which suit is trump
        await new Promise((resolve) => setTimeout(resolve, 1000 * gameSettings.current.gameSpeed));

        const shouldDiscard =
          bidResult.current?.calledSuit === null || bidResult.current?.calledSuit === undefined;

        if (game.dealer.human && shouldDiscard) {
          dispatchGameFlow({ type: GameFlowActionType.SET_AWAIT_USER_INPUT });
          setShouldPromptDiscard(true);
          return;
        } else {
          if (shouldDiscard) game.dealer.chooseDiscard(game);

          dispatchGameFlow({ type: GameFlowActionType.SET_PLAY_HAND });
          clearFadeOutElements();
          dispatchPlayerNotification({ type: PlayerNotificationActionType.UPDATE_CENTER });
          dispatchGameFlow({ type: GameFlowActionType.SET_PLAY_HAND });
          dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });
        }
      }
    };

    beginAnimationOrderTrump();
  }, [
    addFadeOutElements,
    clearFadeOutElements,
    gameAnimationFlow.animationType,
    gameFlow.gameFlow,
    handleCancelGame,
    shouldCancelGame
  ]);

  //   /** Proxy handler to animate playing the card for the player's choice before updating the state with the choice and result. */
  useEffect(() => {
    const animatePlayCards = async () => {
      if (
        gameInstance.current &&
        gameFlow.gameFlow === EuchreGameFlow.PLAY_HAND &&
        gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_PLAY_CARDS
      ) {
        if (shouldCancelGame) {
          handleCancelGame();
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000 * gameSettings.current.gameSpeed));

        if (!playerCard.current)
          throw new Error('Unable to animate play card - player card not found.');
        if (!gameInstance.current?.currentPlayer)
          throw new Error('Unable to animate play card - current player not found.');

        dispatchPlayerNotification(
          getPlayerStateForPlayedCard(playerCard.current, gameInstance.current.currentPlayer)
        );
        dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });
        dispatchGameFlow({ type: GameFlowActionType.SET_HANDLE_PLAY_CARD });
      }
    };

    animatePlayCards();
  }, [gameAnimationFlow.animationType, gameFlow.gameFlow, handleCancelGame, shouldCancelGame]);

  //   /** Regualr play for the game for winning tricks. Each player will play a card to determine the winner of the trick. If human player,
  //    * wait for user to select a card, otherwise select a card for AI player.
  //    */
  const beginPlayCard = useCallback(() => {
    const game = gameInstance.current;

    if (
      game &&
      gameFlow.gameFlow === EuchreGameFlow.PLAY_HAND &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      logDebugEvent('Begin Play Card - Player: ', game?.currentPlayer);

      if (shouldCancelGame) {
        handleCancelGame();
        return;
      }

      if (!game?.currentPlayer) throw Error('Player not found for play card.');
      if (!game?.currentTrick) throw Error('Game Trick not found for play card.');

      if (game.currentTrick.cardsPlayed.length === 4) {
        throw Error('Invalid trick in play card.');
      }

      if (game.currentTrick.cardsPlayed.length === 0) {
        dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
      }

      if (game.currentPlayer?.human) {
        dispatchGameFlow({ type: GameFlowActionType.SET_AWAIT_USER_INPUT });
      } else {
        const computerChoice = game.currentPlayer.determineCardToPlay(game);
        playerCard.current = computerChoice;
        dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_PLAY_CARDS });
      }
    }
  }, [gameFlow.gameFlow, gameAnimationFlow.animationType, shouldCancelGame, handleCancelGame]);

  useEffect(() => {
    beginPlayCard();
  }, [beginPlayCard]);

  const handleCloseHandResults = useCallback(() => {
    if (!gameInstance.current) throw new Error();

    const gameOver = isGameOver(gameInstance.current);

    if (gameOver) {
      setShouldShowHandResults(false);
      setShouldShowGameResults(true);
    } else {
      setShouldShowHandResults(false);
      dispatchGameFlow({
        type: GameFlowActionType.UPDATE_ALL,
        payload: getGameStateForNextHand(gameFlow, gameSettings.current, gameInstance.current)
      });
    }
  }, [gameFlow]);

  const handleCloseGameResults = useCallback(() => {
    setShouldShowGameResults(false);
  }, []);

  const handlePlayCard = useCallback(() => {
    let game = gameInstance.current;

    if (
      game &&
      gameFlow.gameFlow === EuchreGameFlow.HANDLE_PLAY_CARD &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      logDebugEvent('Handle Play Card - Card: ', playerCard);

      if (shouldCancelGame) {
        handleCancelGame();
        return;
      }

      if (!game?.currentPlayer) throw Error('Current player not found - Play card.');
      if (!playerCard.current) throw Error('Played card not found for handle play card.');

      game = playGameCard(game.currentPlayer, playerCard.current, game);

      if (!game?.currentPlayer) throw Error('Current player not found - Play card.');
      if (!game?.trump) throw Error('Trump not found for handle play card.');

      const rotation = getPlayerRotation(
        game.gamePlayers,
        game.currentPlayer,
        game.playerSittingOut
      );
      const currentRound = game.currentRound;

      // if round is finished, determine who the winner of the trick.
      if (game.currentTrick && game.currentTrick.cardsPlayed.length === rotation.length) {
        const trickWinner = determineCurrentWinnerForTrick(game.trump, game.currentTrick);
        game.currentTrick.taker = trickWinner.card?.player;

        if (game.currentTricks.length < 5) {
          game.currentTricks.push(new EuchreTrick(currentRound));
          game.currentPlayer = trickWinner.card?.player;
        }
      } else {
        game.currentPlayer = rotation[0];
      }

      // if hand is over update the tricks with the result.
      if (
        game.currentTricks.length === 5 &&
        game.currentTricks.filter((t) => t.taker !== undefined).length === 5
      ) {
        game.gameResults.push(game.getHandResult());
        game.currentRound += 1;
        game.currentTricks = [];
      }

      gameInstance.current = game;

      dispatchGameFlow({ type: GameFlowActionType.SET_HANDLE_PLAY_CARD_RESULT });
      dispatchGameAnimationFlow({
        type: EuchreAnimationAnimationType.SET_ANIMATE_HANDLE_PLAY_CARD_RESULT
      });
    }
  }, [gameFlow.gameFlow, gameAnimationFlow.animationType, shouldCancelGame, handleCancelGame]);

  useEffect(() => {
    handlePlayCard();
  }, [handlePlayCard]);

  /** Handle UI and animation updates after a player plays a card. */
  useEffect(() => {
    const animateCardPlayed = async () => {
      const game: EuchreGameInstance | null = gameInstance.current;

      if (
        !game ||
        !isGameStateValidToContinue(
          game,
          gameFlow,
          gameAnimationFlow,
          EuchreGameFlow.HANDLE_PLAY_CARD_RESULT,
          EuchreAnimateType.ANIMATE_HANDLE_PLAY_CARD_RESULT,
          shouldCancelGame,
          handleCancelGame
        )
      )
        return;

      logDebugEvent('Animate for handling play card result.');

      const handFinished: boolean = game.currentTricks.length === 0;
      const trickResult: EuchreTrick | undefined = game.currentTrick;
      const trickFinished: boolean = (trickResult && trickResult.cardsPlayed.length === 0) ?? false;

      if (handFinished || trickFinished) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * gameSettings.current.gameSpeed));

        const lastWonTrick: EuchreTrick | undefined = game.currentTricks.at(-2);
        const handFinishedResult: EuchreTrick | undefined = game.gameResults.at(-1)?.tricks.at(-1);

        if (!lastWonTrick && !handFinishedResult)
          throw new Error('Invalid state for handling play card result. Winning trick not found.');

        dispatchPlayerNotification(
          getPlayerStateForTrickWon(lastWonTrick ?? handFinishedResult ?? EuchreTrick.defaultVal)
        );
      }

      if (handFinished) {
        await new Promise((resolve) => setTimeout(resolve, 4000 * gameSettings.current.gameSpeed));

        if (gameSettings.current.showHandResult) setShouldShowHandResults(true);
        else handleCloseHandResults();
      } else if (trickFinished) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * gameSettings.current.gameSpeed));
      }

      if (!handFinished) dispatchGameFlow({ type: GameFlowActionType.SET_PLAY_HAND });
      dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });
    };

    animateCardPlayed();
  }, [
    gameAnimationFlow,
    gameAnimationFlow.animationType,
    gameFlow,
    handleCancelGame,
    handleCloseHandResults,
    shouldCancelGame
  ]);

  const handlePlayerChoice = (cardPlayed: Card) => {
    if (gameInstance.current && gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT) {
      playerCard.current = cardPlayed;
      dispatchGameFlow({ type: GameFlowActionType.SET_PLAY_HAND });
      dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_PLAY_CARDS });
    }
  };
  //   useEffect(() => {
  //     const beginAnimationPlayCard = async () => {
  //       if (
  //         !shouldCancelGame &&
  //         gameInstance &&
  //         gameState.animationType === EuchreAnimateType.ANIMATE_PLAY_CARDS
  //       ) {
  //         await animateForPlayCard(gameInstance);
  //         await handlePlayCard();
  //       }
  //     };

  //     beginAnimationPlayCard();
  //   }, [gameState, shouldCancelGame, gameInstance, handlePlayCard]);

  //   /** Used for debugging. Attempt to save the state again to restart effects. */
  const resaveGameState = () => {
    setCancelGame(false);
  };

  //   /** Prompt each player if they choose to order trump/pick suit after initial deal. */
  //   const bidForTrump = async () => {
  //     logDebugEvent("Begin bidForTrump - Player: ", gameInstance?.currentPlayer);

  //     if (shouldCancelGame) return;

  //     if (!gameInstance) throw Error("Game not found - Bid for Trump.");

  //     if (!gameInstance?.trump) throw Error("Trump not found.");

  //     if (!gameInstance?.currentPlayer) throw Error("Player not found.");

  //     if (gameState.hasSecondBiddingPassed) {
  //       // all users have passed. pass the deal to the next user.
  //       handlePassDeal();
  //       return;
  //     }

  //     if (gameInstance.currentPlayer?.human) {
  //       setShouldPromptBid(true); // Show prompt window for choosing trump or passing for human player.
  //     } else {
  //       const computerChoice = gameInstance.currentPlayer.determineBid(
  //         gameInstance,
  //         gameInstance.trump,
  //         gameState.hasFirstBiddingPassed,
  //       );
  //       //logBidResult(game, computerChoice);

  //       // short delay to simulate that the computer is making a decision.
  //       if (!shouldCancelGame)
  //         await new Promise((resolve) =>
  //           setTimeout(resolve, 1000 * TIMEOUT_MODIFIER),
  //         );

  //       handleBidResult(computerChoice);
  //     }
  //   };

  //   /** Submit the resulting discard from user input. */
  const handleDiscardSubmit = (card: Card) => {
    if (gameInstance.current?.trump && gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT) {
      gameInstance.current.dealer?.discard(card, gameInstance.current.trump);

      dispatchGameFlow({ type: GameFlowActionType.SET_PLAY_HAND });

      clearFadeOutElements();

      dispatchPlayerNotification({ type: PlayerNotificationActionType.UPDATE_CENTER });
      dispatchGameFlow({ type: GameFlowActionType.SET_PLAY_HAND });
      dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });

      setShouldPromptDiscard(false);
    }
  };

  //   /** Regualr play for the game for winning tricks. Each player will play a card to determine the winner of the trick. */
  //   const playCard = async () => {
  //     logDebugEvent("Begin playGame - Player: ", gameInstance?.currentPlayer);

  //     const newGame = gameInstance?.shallowCopy();

  //     if (shouldCancelGame) return;

  //     if (!newGame) throw Error("Game not found - Bid for Trump.");

  //     if (!newGame?.trump) throw Error("Trump not found.");

  //     if (!newGame?.currentPlayer) throw Error("Player not found.");

  //     if (!newGame?.currentTrick) throw Error("Game Trick not found");

  //     if (newGame.currentTrick.cardsPlayed.length === 4) {
  //       return;
  //     }

  //     if (newGame.currentRoundTricks.length === 5) {
  //       return;
  //     }

  //     if (newGame.currentPlayer?.human) {
  //     } else {
  //       const computerChoice = newGame.currentPlayer.determineCardToPlay(newGame);
  //       //handlePlayCard(newGame.currentPlayer, computerChoice);
  //       //await new Promise((resolve) => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));
  //       //newGame.currentTrick.cardsPlayed
  //     }
  //   };

  //#region Animation - can be enabled/disabled by game settings.

  //#endregion

  const handleSettingsChange = (settings: EuchreSettings) => {
    gameSettings.current = settings;
  };

  /** Reset to view settings */
  const handleResetGame = () => {
    setCancelGame(true);
    reset(true);
    gameInstance.current = null;
  };

  return {
    gameInstance,
    gameFlow,
    gameAnimationFlow,
    playerNotification,
    shouldPromptBid,
    shouldPromptDiscard,
    shouldShowHandResults,
    shouldShowGameResults,
    gameSettings,
    beginNewGame,
    handleBidSubmit,
    handleResetGame,
    handleSettingsChange,
    handleCancelGame,
    handleDiscardSubmit,
    resaveGameState,
    handleCloseHandResults,
    handleCloseGameResults,
    handlePlayerChoice
  };
}

const getFaceUpCard = (id: string, card: Card) => {
  return (
    <CenterInfo id={id} className="flex items-center justify-center">
      <Image
        className={`contain`}
        quality={100}
        width={75}
        height={112.5}
        src={getEncodedCardSvg(card, 'center')}
        alt="Game Card"
      />
    </CenterInfo>
  );
};

// /** Return a new state to provide a visual element that the user either passed or ordered trump. */
const getPlayerStateForBidding = (
  id: string,
  dealer: EuchrePlayer,
  player: EuchrePlayer,
  info: 'p' | 'o' | 'n',
  loner: boolean,
  namedSuit: Suit | null
): PlayerNotificationAction => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_PLAYER1,
    payload: undefined
  };
  const icon: React.ReactNode =
    info === 'p' ? (
      <XCircleIcon className="min-h-[18px] max-h-[20px]" />
    ) : (
      <CheckCircleIcon className="min-h-[18px] max-h-[20px]" />
    );
  let messageLocation = '';

  switch (player.playerNumber) {
    case 1:
      messageLocation = 'top-5';
      break;
    case 2:
      messageLocation = 'bottom-5';
      break;
    case 3:
      messageLocation = 'right-5';
      break;
    case 4:
      messageLocation = 'left-5';
      break;
  }

  let messageDetail: string;

  switch (info) {
    case 'p':
      messageDetail = 'Pass';
      break;
    case 'o':
      messageDetail = dealer === player ? 'Picking Up' : 'Pick it up';
      break;
    case 'n':
      messageDetail = 'Calling ' + namedSuit;
      break;
  }

  const infoDetail = (
    <UserInfo
      className={`p-2 text-sm w-auto absolute whitespace-nowrap ${messageLocation}`}
      id={id}
      key={`${id}-${Math.floor(Math.random() * 1000)}`}
    >
      <div className="flex gap-2 items-center">
        {icon}
        <div>{messageDetail}</div>
        {loner ? <div>Going Alone!</div> : <></>}
      </div>
    </UserInfo>
  );

  switch (player.playerNumber) {
    case 1:
      newAction.type = PlayerNotificationActionType.UPDATE_PLAYER1;
      newAction.payload = infoDetail;
      break;
    case 2:
      newAction.type = PlayerNotificationActionType.UPDATE_PLAYER2;
      newAction.payload = infoDetail;
      break;
    case 3:
      newAction.type = PlayerNotificationActionType.UPDATE_PLAYER3;
      newAction.payload = infoDetail;
      break;
    case 4:
      newAction.type = PlayerNotificationActionType.UPDATE_PLAYER4;
      newAction.payload = infoDetail;
      break;
  }

  return newAction;
};

const getPlayerStateForPlayedCard = (card: Card, player: EuchrePlayer) => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_PLAYER1,
    payload: undefined
  };

  let cardLocation = '';
  switch (player.playerNumber) {
    case 1:
      cardLocation = 'top-2';
      break;
    case 2:
      cardLocation = 'bottom-2';
      break;
    case 3:
      cardLocation = 'right-2';
      break;
    case 4:
      cardLocation = 'left-2';
      break;
  }

  const infoDetail = (
    <UserInfo
      className={`absolute ${cardLocation}`}
      id={card.generateElementId()}
      key={`${card.generateElementId()}-${Math.floor(Math.random() * 1000)}`}
    >
      <div className={`flex gap-2`}>
        <Image
          className={`contain`}
          quality={100}
          width={card.getDisplayWidth(player.location)}
          height={card.getDisplayHeight(player.location)}
          src={getEncodedCardSvg(card, player.location)}
          alt="Game Card"
        />
      </div>
    </UserInfo>
  );

  newAction.type = getPlayerNotificationType(player.playerNumber);
  newAction.payload = infoDetail;
  return newAction;
};

const getPlayerStateForAllPassed = (player: EuchrePlayer) => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_CENTER,
    payload: undefined
  };
  const id = player.generateElementId();
  const infoDetail = (
    <UserInfo className="p-2 text-sm w-auto whitespace-nowrap" id={id} key={id}>
      <div className="flex gap-2 items-center">All Players Passed</div>
    </UserInfo>
  );
  newAction.payload = infoDetail;

  return newAction;
};

const getPlayerStateForTrickWon = (result: EuchreTrick) => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_CENTER,
    payload: undefined
  };
  const icon: React.ReactNode = <CheckCircleIcon className="min-h-[18px] max-h-[20px]" />;
  let messageLocation = '';

  switch (result.taker?.playerNumber) {
    case 1:
      messageLocation = 'bottom-2';
      break;
    case 2:
      messageLocation = 'top-2';
      break;
    case 3:
      messageLocation = 'left-2';
      break;
    case 4:
      messageLocation = 'right-2';
      break;
  }

  const id = result.taker?.generateElementId();
  const infoDetail = (
    <UserInfo
      className={`p-2 text-sm w-auto absolute whitespace-nowrap ${messageLocation}`}
      id={id}
      key={`${id}-${Math.floor(Math.random() * 1000)}`}
    >
      <div className="flex gap-2 items-center">{icon}</div>
    </UserInfo>
  );

  newAction.payload = infoDetail;

  return newAction;
};

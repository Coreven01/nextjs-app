'use client';

import UserInfo from '@/app/ui/euchre/player/user-info';
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
  EuchreFlowActionType,
  GameFlowState,
  gameFlowStateReducer,
  initialGameFlowState
} from './gameFlowReducer';
import {
  EuchreAnimateType,
  EuchreActionType,
  gameAnimationFlowReducer,
  initialGameAnimationState
} from './gameAnimationFlowReducer';
import useAnimation from '@/app/hooks/euchre/animation/useAnimation';
import {
  BidResult,
  Card,
  EuchreGameInstance,
  EuchrePlayer,
  EuchreSettings,
  EuchreTrick,
  GameSpeed,
  Suit
} from '@/app/lib/euchre/definitions';
import {
  dealCardsForDealer,
  decrementSpeed,
  getGameStateForInitialDeal,
  incrementSpeed,
  INIT_GAME_SETTINGS,
  initDeckForInitialDeal,
  orderTrump,
  shuffleAndDealHand
} from '@/app/lib/euchre/game-setup-logic';
import { createEvent, logDebugEvent } from '@/app/lib/euchre/util';
import { getCardFullName, getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import { getPlayerRotation } from '@/app/lib/euchre/game';
import { didPlayerFollowSuit, getGameStateForNextHand } from '@/app/lib/euchre/game-play-logic';
import isGameStateValidToContinue from '@/app/lib/euchre/game-state-logic';
import EphemeralModal from '@/app/ui/euchre/ephemeral-modal';
import { useEventLog } from './useEventLog';
import PlayerColor from '@/app/ui/euchre/player/player-team-color';

const FLIPPED_CARD_ID = 'flipped-card';

export default function useEuchreGame() {
  //#region Hooks to control game flow *************************************************************************
  const [shouldPromptBid, setShouldPromptBid] = useState(false);
  const [shouldPromptDiscard, setShouldPromptDiscard] = useState(false);
  const [shouldCancelGame, setCancelGame] = useState(false);
  const [shouldShowHandResults, setShouldShowHandResults] = useState(false);
  const [shouldShowGameResults, setShouldShowGameResults] = useState(false);

  const playerCard = useRef<Card | null>(null);
  const bidResult = useRef<BidResult | null>(null);
  const gameInstance = useRef<EuchreGameInstance | null>(null);
  const gameSettings = useRef<EuchreSettings>(INIT_GAME_SETTINGS);

  const [playerNotification, dispatchPlayerNotification] = useReducer(
    playerNotificationReducer,
    initialPlayerNotification
  );
  const [gameFlow, dispatchGameFlow] = useReducer(gameFlowStateReducer, initialGameFlowState);
  const [gameAnimationFlow, dispatchGameAnimationFlow] = useReducer(
    gameAnimationFlowReducer,
    initialGameAnimationState
  );
  const [animationTransformation, setAnimationTransformation] = useState<CardTransformation[][]>([]);
  const { animateForInitialDeal, animateDealCardsForHand, animateForPlayCard, setFadeOutForPlayers } =
    useAnimation(gameSettings.current);

  const { events, addEvent, clearEvents } = useEventLog();

  //#endregion

  //#region Game Initiallization *************************************************************************

  /** */
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
        setTimeout(resolve, maxDelay + maxDuration + gameSettings.current.gameSpeed)
      );
    },
    [setFadeOutForPlayers]
  );

  const clearFadeOutElements = useCallback(() => {
    addFadeOutElements([
      { playerNumber: 1, fadeOutId: '', fadeOutDelay: 150, fadeOutDuration: 150 },
      { playerNumber: 2, fadeOutId: '', fadeOutDelay: 150, fadeOutDuration: 150 },
      { playerNumber: 3, fadeOutId: '', fadeOutDelay: 150, fadeOutDuration: 150 },
      { playerNumber: 4, fadeOutId: '', fadeOutDelay: 150, fadeOutDuration: 150 },
      { playerNumber: 'o', fadeOutId: '', fadeOutDelay: 150, fadeOutDuration: 150 }
    ]);
  }, [addFadeOutElements]);

  /** */
  const handleCancelGame = useCallback(() => {
    if (shouldCancelGame) return;

    dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_INIT_DEAL });
    dispatchGameAnimationFlow({
      type: EuchreActionType.SET_ANIMATE_NONE
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
        type: EuchreFlowActionType.UPDATE_ALL,
        payload: {
          ...initialGameFlowState,
          shouldShowDeckImages: [],
          shouldShowHandImages: [],
          shouldShowHandValues: []
        }
      });

      dispatchGameAnimationFlow({
        type: EuchreActionType.SET_ANIMATE_NONE
      });
    } else {
      dispatchGameAnimationFlow({
        type: EuchreActionType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY
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

    newGameFlowState.gameFlow = EuchreGameFlow.BEGIN_DEAL_FOR_DEALER;
    dispatchGameFlow({
      type: EuchreFlowActionType.UPDATE_ALL,
      payload: newGameFlowState
    });

    gameInstance.current = newGame;
  };

  //#endregion

  //#region Deal Cards For Initial Dealer *************************************************************************

  /** Deal cards to determine who the initial dealer will be for the game. First jack dealt to a user will become the initial dealer.
   *  After logic is run to determine dealer, animate the cards being dealt if turned on from the settings.
   */
  const beginDealCardsForDealer = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        gameInstance.current,
        gameFlow,
        gameAnimationFlow,
        EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
        EuchreAnimateType.ANIMATE_NONE,
        shouldCancelGame,
        handleCancelGame
      )
    )
      return;

    const game = gameInstance.current;
    if (!game) throw new Error();

    addEvent(createEvent('i', gameSettings.current, undefined, 'Begin deal cards for dealer.'));

    const dealResult = dealCardsForDealer(game, gameFlow, gameSettings.current);

    if (!dealResult) throw Error('Unable to determine dealer for initial dealer.');

    game.assignDealerAndPlayer(dealResult.newDealer);

    dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_DEAL_FOR_DEALER });
    //setAnimationTransformation([...animationTransformation, ...dealResult.transformations]);
  }, [gameFlow, gameAnimationFlow, shouldCancelGame, handleCancelGame, addEvent]);

  /** */
  const endDealCardsForDealer = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        gameInstance.current,
        gameFlow,
        gameAnimationFlow,
        EuchreGameFlow.END_DEAL_FOR_DEALER,
        EuchreAnimateType.ANIMATE_NONE,
        shouldCancelGame,
        handleCancelGame
      )
    )
      return;

    // stub to run logic after cards are dealt for initial dealer.

    dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_SHUFFLE_CARDS });
  }, [gameAnimationFlow, gameFlow, handleCancelGame, shouldCancelGame]);

  /** Animate dealing cards for initial dealer. When finished with animation, begin shuffle and deal for regular play. */
  useEffect(() => {
    const beginAnimationForInitDeal = async () => {
      if (
        !isGameStateValidToContinue(
          gameInstance.current,
          gameFlow,
          gameAnimationFlow,
          EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
          EuchreAnimateType.ANIMATE_DEAL_FOR_DEALER,
          shouldCancelGame,
          handleCancelGame
        )
      )
        return;

      const game = gameInstance.current;
      if (!game) throw new Error();

      if (!game.dealer) throw new Error('Unable to find dealer for initial deal animation.');

      //await animateForInitialDeal(animationTransformation, game, game.dealer);

      dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
      dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_SHUFFLE_CARDS });
    };

    beginAnimationForInitDeal();
  }, [
    shouldCancelGame,
    gameInstance,
    animationTransformation,
    animateForInitialDeal,
    gameAnimationFlow.animationType,
    gameFlow.gameFlow,
    handleCancelGame,
    gameFlow,
    gameAnimationFlow
  ]);

  useEffect(() => {
    beginDealCardsForDealer();
  }, [beginDealCardsForDealer]);

  useEffect(() => {
    endDealCardsForDealer();
  }, [endDealCardsForDealer]);

  //#endregion

  //#region Shuffle and Deal for regular playthrough *************************************************************************

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. After deal logic is run, begin animation for dealing cards to players. */
  const beginShuffleAndDealHand = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        gameInstance.current,
        gameFlow,
        gameAnimationFlow,
        EuchreGameFlow.BEGIN_SHUFFLE_CARDS,
        EuchreAnimateType.ANIMATE_NONE,
        shouldCancelGame,
        handleCancelGame
      )
    )
      return;

    addEvent(createEvent('i', gameSettings.current, undefined, 'Begin shuffle and deal for regular play'));

    let game = gameInstance.current;
    if (!game) throw new Error();

    const shuffleResult = shuffleAndDealHand(game, gameSettings.current, shouldCancelGame);

    game = shuffleResult.game;

    if (!game?.trump) throw Error('Trump not found after shuffle and deal for regular play.');

    dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });

    // display trump card for bidding in the center of the table.
    dispatchPlayerNotification({
      type: PlayerNotificationActionType.UPDATE_CENTER,
      payload: getFaceUpCard(FLIPPED_CARD_ID, game.trump, false)
    });

    const newGameState: GameFlowState = getGameStateForNextHand(gameFlow, gameSettings.current, game);
    newGameState.gameFlow = EuchreGameFlow.BEGIN_DEAL_CARDS;

    dispatchGameFlow({ type: EuchreFlowActionType.UPDATE_ALL, payload: newGameState });
    dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY });
    setAnimationTransformation([...animationTransformation, ...shuffleResult.transformations]);
    gameInstance.current = game;
  }, [gameFlow, gameAnimationFlow, shouldCancelGame, handleCancelGame, addEvent, animationTransformation]);

  useEffect(() => {
    beginShuffleAndDealHand();
  }, [beginShuffleAndDealHand]);

  /**  */
  useEffect(() => {
    const beginAnimationForDealCards = async () => {
      if (
        !isGameStateValidToContinue(
          gameInstance.current,
          gameFlow,
          gameAnimationFlow,
          EuchreGameFlow.BEGIN_DEAL_CARDS,
          EuchreAnimateType.ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY,
          shouldCancelGame,
          handleCancelGame
        )
      )
        return;

      const game = gameInstance.current;
      if (!game) throw new Error();

      await animateDealCardsForHand(game);

      dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
      dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_BID_FOR_TRUMP });
    };

    beginAnimationForDealCards();
  }, [
    shouldCancelGame,
    gameInstance,
    animateDealCardsForHand,
    gameFlow.gameFlow,
    gameAnimationFlow.animationType,
    handleCancelGame,
    gameFlow,
    gameAnimationFlow
  ]);

  //#endregion

  //#region Bid for Trump *************************************************************************

  /** Handle passing the bid to the next player.*/
  const handlePassForBid = useCallback(() => {
    const game = gameInstance.current;
    if (!game?.currentPlayer) throw new Error();
    if (!game?.trump) throw new Error();

    addEvent(
      createEvent(
        'd',
        gameSettings.current,
        game.currentPlayer,
        'Handle Pass for bid. Score: ' + bidResult.current?.handScore
      )
    );

    const biddingRoundFinished = game.dealer === game.currentPlayer;
    // simulate flipping over the trump card.
    if (biddingRoundFinished && !gameFlow.hasSecondBiddingPassed) {
      game.turnedDown = game.trump;

      // remove the card from the DOM
      setTimeout(
        () =>
          dispatchPlayerNotification({
            type: PlayerNotificationActionType.UPDATE_CENTER,
            payload: undefined
          }),
        150
      );
    }

    const newPlayerNotification = getPlayerNotificationForBidding(
      game.currentPlayer,
      game.currentPlayer,
      gameSettings.current,
      'p',
      false,
      null
    );
    dispatchPlayerNotification(newPlayerNotification);
    dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_BEGIN_BID_FOR_TRUMP });
    dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_BID_FOR_TRUMP });
  }, [addEvent, gameFlow.hasSecondBiddingPassed]);

  /** Side effect to animate events after the initial bid for trump. */
  useEffect(() => {
    const beginAnimationForBidForTrump = async () => {
      if (
        !isGameStateValidToContinue(
          gameInstance.current,
          gameFlow,
          gameAnimationFlow,
          EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
          EuchreAnimateType.ANIMATE_BEGIN_BID_FOR_TRUMP,
          shouldCancelGame,
          handleCancelGame
        )
      )
        return;

      await new Promise((resolve) => setTimeout(resolve, gameSettings.current.gameSpeed));

      addEvent(createEvent('i', gameSettings.current, undefined, 'End Animation for bid for trump'));
      dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
      dispatchGameFlow({ type: EuchreFlowActionType.SET_END_BID_FOR_TRUMP });
    };

    beginAnimationForBidForTrump();
  }, [
    addEvent,
    addFadeOutElements,
    gameAnimationFlow,
    gameAnimationFlow.animationType,
    gameFlow,
    gameFlow.gameFlow,
    handleCancelGame,
    shouldCancelGame
  ]);

  /** Update game flow when player orders trump. */
  const handlePlayerOrderTrumpFromBid = () => {
    // player called trump, either by suit or telling the deal er to pick up the card.
    dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_ORDER_TRUMP });
    dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
  };

  /** Either order trump or pass bid from user selection. */
  const handlePlayerSelectionForBid = useCallback(
    (result: BidResult) => {
      bidResult.current = result;

      if (bidResult.current.orderTrump && !gameSettings.current.debugAlwaysPass) {
        handlePlayerOrderTrumpFromBid();
      } else {
        handlePassForBid();
      }
    },
    [handlePassForBid]
  );

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. */
  const beginBidForTrump = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        gameInstance.current,
        gameFlow,
        gameAnimationFlow,
        EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
        EuchreAnimateType.ANIMATE_NONE,
        shouldCancelGame,
        handleCancelGame
      )
    )
      return;

    const game = gameInstance.current;
    if (!game?.trump) throw Error('Trump not found for bid for trump.');
    if (!game?.currentPlayer) throw Error('Player not found for bid for trump.');

    //addEvent(createEvent(game, gameSettings.current, game.currentPlayer, 'Begin bid For trump'));

    if (gameFlow.hasSecondBiddingPassed) {
      // all users have passed. pass the deal to the next user and begin to re-deal.
      dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PASS_DEAL });
      dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
      return;
    }

    if (game.currentPlayer?.human) {
      dispatchGameFlow({ type: EuchreFlowActionType.SET_AWAIT_USER_INPUT });
      setShouldPromptBid(true); // Show prompt window for choosing trump or passing for human player.
    } else {
      const computerChoice: BidResult = game.currentPlayer.determineBid(
        game,
        game.trump,
        !gameFlow.hasFirstBiddingPassed
      );
      handlePlayerSelectionForBid(computerChoice);
    }
  }, [gameAnimationFlow, gameFlow, handleCancelGame, handlePlayerSelectionForBid, shouldCancelGame]);

  /** Begin bid for trump game flow. */
  useEffect(() => {
    beginBidForTrump();
  }, [beginBidForTrump]);

  /** Modify the game state depending on if the user named trump or passed based on player bid choice. */
  const endBidForTrump = useCallback(async () => {
    if (
      !isGameStateValidToContinue(
        gameInstance.current,
        gameFlow,
        gameAnimationFlow,
        EuchreGameFlow.END_BID_FOR_TRUMP,
        EuchreAnimateType.ANIMATE_NONE,
        shouldCancelGame,
        handleCancelGame
      )
    )
      return;

    const game = gameInstance.current;
    if (!game?.currentPlayer) throw Error('Current player not found for end bid for trump.');

    const biddingRoundFinished = game.dealer === game.currentPlayer;
    const firstRound = !gameFlow.hasFirstBiddingPassed;
    const newGameFlow: GameFlowState = { ...gameFlow };

    newGameFlow.gameFlow = EuchreGameFlow.BEGIN_BID_FOR_TRUMP;
    if (biddingRoundFinished) {
      newGameFlow.hasFirstBiddingPassed = firstRound || newGameFlow.hasFirstBiddingPassed;
      newGameFlow.hasSecondBiddingPassed = !firstRound;
    }

    const rotation = getPlayerRotation(game.gamePlayers, game.currentPlayer);
    game.assignPlayer(rotation[0]);

    dispatchGameFlow({ type: EuchreFlowActionType.UPDATE_ALL, payload: newGameFlow });
  }, [gameAnimationFlow, gameFlow, handleCancelGame, shouldCancelGame]);

  /** */
  useEffect(() => {
    endBidForTrump();
  }, [endBidForTrump]);

  /** Submit the resulting bid from user input. */
  const handleBidSubmit = (result: BidResult) => {
    if (gameInstance.current && gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT) {
      setShouldPromptBid(false);
      handlePlayerSelectionForBid(result);
    }
  };

  //#endregion

  //#region Pass Deal *************************************************************************
  /** All players passed during the bidding process. Re-initialize for deal for the next user in the rotation.  */
  const beginPassDeal = useCallback(async () => {
    if (
      !isGameStateValidToContinue(
        gameInstance.current,
        gameFlow,
        gameAnimationFlow,
        EuchreGameFlow.BEGIN_PASS_DEAL,
        EuchreAnimateType.ANIMATE_NONE,
        shouldCancelGame,
        handleCancelGame
      )
    )
      return;

    logDebugEvent(
      'All players passed first and second round. Update state to pass the deal to the next user.'
    );

    const game = gameInstance.current;
    if (!game?.currentPlayer) throw Error('Current player not found for end bid for trump.');
    if (!game?.dealer) throw Error('Game dealer not found - Pass deal.');

    const rotation = getPlayerRotation(game.gamePlayers, game.dealer);
    game.dealer = rotation[0];

    dispatchPlayerNotification(getPlayerNotificationForAllPassed(game.dealer));

    await new Promise((resolve) => setTimeout(resolve, 2 * gameSettings.current.gameSpeed));

    reset(false);
    const newGameFlow = getGameStateForInitialDeal(gameFlow, gameSettings.current, game);
    newGameFlow.gameFlow = EuchreGameFlow.BEGIN_SHUFFLE_CARDS;

    dispatchGameFlow({
      type: EuchreFlowActionType.UPDATE_ALL,
      payload: newGameFlow
    });

    dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });

    clearFadeOutElements();
  }, [clearFadeOutElements, gameAnimationFlow, gameFlow, handleCancelGame, shouldCancelGame]);

  useEffect(() => {
    const executePassDeal = async () => {
      await beginPassDeal();
    };
    executePassDeal();
  }, [beginPassDeal]);
  //#endregion

  //#region Order Trump *************************************************************************

  //   /** Player has ordered trump either by naming suit or telling the dealer to pick up the flipped card. */
  const beginOrderTrump = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        gameInstance.current,
        gameFlow,
        gameAnimationFlow,
        EuchreGameFlow.BEGIN_ORDER_TRUMP,
        EuchreAnimateType.ANIMATE_NONE,
        shouldCancelGame,
        handleCancelGame
      )
    )
      return;

    let game = gameInstance.current;
    logDebugEvent('Trump ordered up. Player: ', game?.currentPlayer?.name, bidResult.current);

    if (!game) throw new Error('Game not found for trump ordered');
    if (!bidResult.current) throw new Error('Bid result not found');

    game = orderTrump(game, bidResult.current);

    if (!game.dealer) throw Error('Dealer not found - Order Trump.');
    if (!game.maker) throw Error('Maker not found - Order Trump.');

    if (bidResult.current.loner) {
      const partnerSittingOut = game.gamePlayers.find((p) => p.team === game.maker?.team && p !== game.maker);
      if (partnerSittingOut) {
        const playerSetting = gameFlow.shouldShowHandImages.find((i) => i.player === partnerSittingOut);
        if (playerSetting) playerSetting.value = false;

        dispatchGameFlow({
          type: EuchreFlowActionType.UPDATE_ALL,
          payload: { ...gameFlow }
        });
      }
    }

    dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_ORDER_TRUMP });
    gameInstance.current = game;
  }, [gameAnimationFlow, gameFlow, handleCancelGame, shouldCancelGame]);

  /** */
  useEffect(() => {
    beginOrderTrump();
  }, [beginOrderTrump]);

  /** */
  useEffect(() => {
    const beginAnimationOrderTrump = async () => {
      if (
        !isGameStateValidToContinue(
          gameInstance.current,
          gameFlow,
          gameAnimationFlow,
          EuchreGameFlow.BEGIN_ORDER_TRUMP,
          EuchreAnimateType.ANIMATE_ORDER_TRUMP,
          shouldCancelGame,
          handleCancelGame
        )
      )
        return;

      logDebugEvent('Begin Animation for Order Trump');
      const game = gameInstance.current;
      if (!game?.dealer) throw new Error('Game dealer not found for animation trump ordered.');
      if (!bidResult.current) throw new Error('Bid result not found');
      if (!game.maker) throw Error('Maker not found - Order Trump.');

      const orderType = bidResult.current.calledSuit ? 'n' : 'o';
      const newPlayerNotification: PlayerNotificationAction = getPlayerNotificationForBidding(
        game.dealer,
        game.maker,
        gameSettings.current,
        orderType,
        bidResult.current.loner,
        bidResult.current.calledSuit
      );
      dispatchPlayerNotification(newPlayerNotification);

      // additional delay to notify users which suit is trump
      await new Promise((resolve) => setTimeout(resolve, incrementSpeed(gameSettings.current.gameSpeed, 2)));

      const shouldDiscard = bidResult.current.calledSuit === null;

      if (game.dealer.human && shouldDiscard) {
        dispatchGameFlow({ type: EuchreFlowActionType.SET_AWAIT_USER_INPUT });
        setShouldPromptDiscard(true);
      } else {
        if (shouldDiscard) {
          game.discard = game.dealer.chooseDiscard(game);
        }

        dispatchPlayerNotification({ type: PlayerNotificationActionType.UPDATE_CENTER, payload: undefined });
        dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD });
        dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
      }
    };

    beginAnimationOrderTrump();
  }, [
    addFadeOutElements,
    clearFadeOutElements,
    gameAnimationFlow,
    gameAnimationFlow.animationType,
    gameFlow,
    gameFlow.gameFlow,
    handleCancelGame,
    shouldCancelGame
  ]);

  //   /** Submit the resulting discard from user input after flip card has been picked up. */
  const handleDiscardSubmit = (card: Card) => {
    if (gameInstance.current?.trump && gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT) {
      gameInstance.current.dealer?.discard(card, gameInstance.current.trump);
      gameInstance.current.dealer?.sortCards(gameInstance.current.trump);
      gameInstance.current.discard = card;

      dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD });

      clearFadeOutElements();

      dispatchPlayerNotification({ type: PlayerNotificationActionType.UPDATE_CENTER });
      dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD });
      dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });

      setShouldPromptDiscard(false);
    }
  };

  //#endregion

  //#region Play Card *************************************************************************

  /** Regualr play for the game for winning tricks. Each player will play a card to determine the winner of the trick. If human player,
   * wait for user to select a card, otherwise select a card for AI player.
   */
  const beginPlayCard = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        gameInstance.current,
        gameFlow,
        gameAnimationFlow,
        EuchreGameFlow.BEGIN_PLAY_CARD,
        EuchreAnimateType.ANIMATE_NONE,
        shouldCancelGame,
        handleCancelGame
      )
    )
      return;

    const game = gameInstance.current;

    if (!game?.currentPlayer) throw Error('Player not found for play card.');
    if (!game?.currentTrick) throw Error('Game Trick not found for play card.');

    if (game.trickFinished) {
      game.addTrickForNewHand();
    }

    if (game.currentTrick.cardsPlayed.length === 0) {
      dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    }

    let promptForInput = game.currentPlayer.human;
    if (
      promptForInput &&
      game.currentPlayer.availableCards.length === 1 &&
      gameSettings.current.autoPlayLastCard
    )
      promptForInput = false;

    if (promptForInput) {
      dispatchGameFlow({ type: EuchreFlowActionType.SET_AWAIT_USER_INPUT });
    } else {
      const selectedCard: Card = game.currentPlayer.determineCardToPlay(game);
      playerCard.current = selectedCard;
      dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_BEGIN_PLAY_CARD });
    }
  }, [gameFlow, gameAnimationFlow, shouldCancelGame, handleCancelGame]);

  /** */
  useEffect(() => {
    beginPlayCard();
  }, [beginPlayCard]);

  /** Proxy handler to animate playing the card for the player's choice before updating the state with the choice and result. */
  useEffect(() => {
    const animateBeginPlayCards = async () => {
      if (
        !isGameStateValidToContinue(
          gameInstance.current,
          gameFlow,
          gameAnimationFlow,
          EuchreGameFlow.BEGIN_PLAY_CARD,
          EuchreAnimateType.ANIMATE_BEGIN_PLAY_CARD,
          shouldCancelGame,
          handleCancelGame
        )
      )
        return;

      const game = gameInstance.current;

      if (!game?.currentPlayer) throw Error('Player not found for play card.');

      const lastCardForAutoPlay =
        game.currentPlayer.human &&
        game.currentPlayer.availableCards.length === 1 &&
        gameSettings.current.autoPlayLastCard;

      if (!game.currentPlayer.human || lastCardForAutoPlay)
        await new Promise((resolve) => setTimeout(resolve, gameSettings.current.gameSpeed, 1));

      if (!playerCard.current) throw new Error('Unable to animate play card - player card not found.');
      if (!game.currentPlayer) throw new Error('Unable to animate play card - current player not found.');

      dispatchPlayerNotification(getPlayerNotificationForPlayedCard(playerCard.current, game.currentPlayer));

      dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
      dispatchGameFlow({ type: EuchreFlowActionType.SET_END_PLAY_CARD });
    };

    animateBeginPlayCards();
  }, [
    gameAnimationFlow,
    gameAnimationFlow.animationType,
    gameFlow,
    gameFlow.gameFlow,
    handleCancelGame,
    shouldCancelGame
  ]);

  /** */
  const endPlayCard = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        gameInstance.current,
        gameFlow,
        gameAnimationFlow,
        EuchreGameFlow.END_PLAY_CARD,
        EuchreAnimateType.ANIMATE_NONE,
        shouldCancelGame,
        handleCancelGame
      )
    )
      return;

    if (!gameInstance.current?.currentPlayer) throw Error('Current player not found - Play card.');
    if (!gameInstance.current?.trump) throw Error('Trump card not found - Play card.');
    if (!playerCard.current) throw Error('Played card not found for handle play card.');
    if (!gameInstance.current.currentTrick) throw Error('Game trick not found for handle play card.');

    const playerFollowedSuit = didPlayerFollowSuit(gameInstance.current, playerCard.current);

    if (!playerFollowedSuit) alert('Player did not follow suit');

    const cardPlayed = gameInstance.current.currentPlayer.playGameCard(playerCard.current);
    gameInstance.current.currentPlayer.sortCards(gameInstance.current.trump);
    gameInstance.current.currentTrick.cardsPlayed.push(cardPlayed);

    dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD_RESULT });
    dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_BEGIN_PLAY_CARD_RESULT });
  }, [gameFlow, gameAnimationFlow, shouldCancelGame, handleCancelGame]);

  /** */
  useEffect(() => {
    endPlayCard();
  }, [endPlayCard]);

  /** */
  const handleCloseHandResults = useCallback(() => {
    if (!gameInstance.current) throw new Error();
    if (!gameInstance.current.dealer) throw new Error();

    const gameOver = gameInstance.current.isGameOver;

    if (gameOver) {
      setShouldShowHandResults(false);
      setShouldShowGameResults(true);
    } else {
      const rotation = getPlayerRotation(gameInstance.current.gamePlayers, gameInstance.current.dealer);
      gameInstance.current.dealer = rotation[0];

      setShouldShowHandResults(false);
      dispatchGameFlow({
        type: EuchreFlowActionType.UPDATE_ALL,
        payload: getGameStateForNextHand(gameFlow, gameSettings.current, gameInstance.current)
      });
    }
  }, [gameFlow]);

  /** */
  const handleCloseGameResults = useCallback(() => {
    setShouldShowGameResults(false);
  }, []);

  /** */
  const handleCardPlayed = (cardPlayed: Card) => {
    if (gameInstance.current && gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT) {
      playerCard.current = cardPlayed;
      dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD });
      dispatchGameAnimationFlow({
        type: EuchreActionType.SET_ANIMATE_BEGIN_PLAY_CARD
      });
    }
  };

  /** Handle UI and animation updates after a player plays a card. */
  useEffect(() => {
    const animateResultOfCardPlayed = async () => {
      const game: EuchreGameInstance | null = gameInstance.current;

      if (
        !game ||
        !isGameStateValidToContinue(
          game,
          gameFlow,
          gameAnimationFlow,
          EuchreGameFlow.BEGIN_PLAY_CARD_RESULT,
          EuchreAnimateType.ANIMATE_BEGIN_PLAY_CARD_RESULT,
          shouldCancelGame,
          handleCancelGame
        )
      )
        return;

      if (game.handFinished || game.trickFinished) {
        await new Promise((resolve) =>
          setTimeout(resolve, incrementSpeed(gameSettings.current.gameSpeed, 1))
        );
      }

      dispatchGameFlow({ type: EuchreFlowActionType.SET_END_PLAY_CARD_RESULT });
      dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
    };

    animateResultOfCardPlayed();
  }, [
    gameAnimationFlow,
    gameAnimationFlow.animationType,
    gameFlow,
    handleCancelGame,
    handleCloseHandResults,
    shouldCancelGame
  ]);

  const endPlayCardResult = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        gameInstance.current,
        gameFlow,
        gameAnimationFlow,
        EuchreGameFlow.END_PLAY_CARD_RESULT,
        EuchreAnimateType.ANIMATE_NONE,
        shouldCancelGame,
        handleCancelGame
      )
    )
      return;

    const game: EuchreGameInstance | null = gameInstance.current;
    if (!game?.currentPlayer) throw Error('Player not found for play card.');

    const playerRotation = getPlayerRotation(game.gamePlayers, game.currentPlayer, game.playerSittingOut);
    game.updateIfTrickOver(playerRotation);
    game.updateIfHandOver();

    dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_END_PLAY_CARD_RESULT });
  }, [gameAnimationFlow, gameFlow, handleCancelGame, shouldCancelGame]);

  /** */
  useEffect(() => {
    endPlayCardResult();
  }, [endPlayCardResult]);

  /** Handle UI and animation updates after a player plays a card. */
  useEffect(() => {
    const animateEndResultOfCardPlayed = async () => {
      const game: EuchreGameInstance | null = gameInstance.current;

      if (
        !game ||
        !isGameStateValidToContinue(
          game,
          gameFlow,
          gameAnimationFlow,
          EuchreGameFlow.END_PLAY_CARD_RESULT,
          EuchreAnimateType.ANIMATE_END_PLAY_CARD_RESULT,
          shouldCancelGame,
          handleCancelGame
        )
      )
        return;

      if (game.trickFinished) {
        const lastWonTrick: EuchreTrick | null = game.currentTrick;

        if (!lastWonTrick)
          throw new Error('Invalid state for handling play card result. Winning trick not found.');

        dispatchPlayerNotification(getPlayerNotificationForTrickWon(lastWonTrick));

        await new Promise((resolve) =>
          setTimeout(resolve, incrementSpeed(gameSettings.current.gameSpeed, 1))
        );
      }

      if (game.handFinished) {
        await new Promise((resolve) =>
          setTimeout(resolve, incrementSpeed(gameSettings.current.gameSpeed, 1))
        );

        dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
        dispatchGameFlow({ type: EuchreFlowActionType.SET_AWAIT_USER_INPUT });

        if (gameSettings.current.showHandResult) {
          setShouldShowHandResults(true);
        } else {
          handleCloseHandResults();
        }
      } else if (game.trickFinished) {
        await new Promise((resolve) => setTimeout(resolve, gameSettings.current.gameSpeed));
      }

      if (!game.handFinished) {
        dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PLAY_CARD });
      }

      dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
    };

    animateEndResultOfCardPlayed();
  }, [
    gameAnimationFlow,
    gameAnimationFlow.animationType,
    gameFlow,
    handleCancelGame,
    handleCloseHandResults,
    shouldCancelGame
  ]);

  //#endregion

  //#region Other Handlers *************************************************************************
  const resaveGameState = () => {
    setCancelGame(false);
  };

  /** */
  const handleSettingsChange = (settings: EuchreSettings) => {
    gameSettings.current = settings;
  };

  /** Reset to view settings */
  const handleResetGame = () => {
    setCancelGame(true);
    reset(true);
    gameInstance.current = null;
  };

  /** Reverse game state to play the hand again. Used for testing/debugging */
  const handleReplayHand = () => {
    if (!gameInstance.current) throw Error('Game not found for replay hand.');

    setShouldShowHandResults(false);
    gameInstance.current.reverseLastHandPlayed();

    const newGameFlow = getGameStateForNextHand(gameFlow, gameSettings.current, gameInstance.current);
    newGameFlow.gameFlow = EuchreGameFlow.BEGIN_BID_FOR_TRUMP;

    dispatchGameFlow({ type: EuchreFlowActionType.UPDATE_ALL, payload: newGameFlow });
    dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
  };
  //#endregion

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
    events,
    clearEvents,
    beginNewGame,
    handleBidSubmit,
    handleResetGame,
    handleSettingsChange,
    handleCancelGame,
    handleDiscardSubmit,
    resaveGameState,
    handleCloseHandResults,
    handleCloseGameResults,
    handleCardPlayed,
    handleReplayHand
  };
}

/** */
const getFaceUpCard = (id: string, card: Card, fadeOut: boolean) => {
  return (
    <EphemeralModal
      key={`${card.generateElementId()}-${Math.floor(Math.random() * 1000)}`}
      durationMs={150}
      delayMs={150}
      fadeType={fadeOut ? 'out' : 'in'}
      className={fadeOut ? 'opacity-100' : 'opacity-0'}
    >
      <Image
        id={id}
        className={`contain`}
        quality={100}
        width={card.getDisplayWidth('center')}
        height={card.getDisplayHeight('center')}
        src={getEncodedCardSvg(card, 'center')}
        alt={getCardFullName(card)}
        title={getCardFullName(card)}
      />
    </EphemeralModal>
  );
};

/** Return a new state to provide a visual element that the user either passed or ordered trump. */
const getPlayerNotificationForBidding = (
  dealer: EuchrePlayer,
  player: EuchrePlayer,
  settings: EuchreSettings,
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
      <XCircleIcon className="min-h-[18px] max-h-[20px] text-red-300" />
    ) : (
      <CheckCircleIcon className="min-h-[18px] max-h-[20px] text-green-300" />
    );
  let messageLocation = '';
  let delay = settings.gameSpeed;

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
      delay = incrementSpeed(delay, 1);
      break;
    case 'n':
      messageDetail = 'Calling ' + namedSuit;
      delay = incrementSpeed(delay, 1);
      break;
  }

  const infoDetail = (
    <EphemeralModal
      className={`w-auto absolute whitespace-nowrap shadow-lg shadow-black ${messageLocation}`}
      durationMs={settings.gameSpeed}
      delayMs={delay}
      fadeType="both"
    >
      <UserInfo className="text-sm">
        <div className="bg-stone-900 p-2">
          <div className="flex gap-2 items-center">
            {icon}
            <div>{messageDetail}</div>
          </div>
          {loner ? <div className="w-full text-center text-yellow-200">Going Alone!</div> : <></>}
        </div>
      </UserInfo>
    </EphemeralModal>
  );

  newAction.type = getPlayerNotificationType(player.playerNumber);
  newAction.payload = infoDetail;

  return newAction;
};

/** */
const getPlayerNotificationForPlayedCard = (card: Card, player: EuchrePlayer) => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_PLAYER1,
    payload: undefined
  };

  let cardLocation = '';
  switch (player.playerNumber) {
    case 1:
      cardLocation = '-top-5';
      break;
    case 2:
      cardLocation = '-bottom-5';
      break;
    case 3:
      cardLocation = '-right-5';
      break;
    case 4:
      cardLocation = '-left-5';
      break;
  }

  const rotateValues = [
    'rotate-[-8deg]',
    'rotate-[-4deg]',
    'rotate-[-1deg]',
    'rotate-[1deg]',
    'rotate-[4deg]',
    'rotate-[8deg]'
  ];

  const infoDetail = (
    <div
      className={`absolute ${rotateValues[Math.round(Math.random() * 5)]} ${cardLocation}`}
      id={card.generateElementId()}
      key={`${card.generateElementId()}-${Math.floor(Math.random() * 1000)}`}
    >
      <Image
        className={`contain`}
        quality={100}
        src={getEncodedCardSvg(card, player.location)}
        width={card.getDisplayWidth(player.location)}
        height={card.getDisplayHeight(player.location)}
        alt={getCardFullName(card)}
        unoptimized={true}
      />
    </div>
  );

  newAction.type = getPlayerNotificationType(player.playerNumber);
  newAction.payload = infoDetail;
  return newAction;
};

const getPlayerNotificationForAllPassed = (player: EuchrePlayer) => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_CENTER,
    payload: undefined
  };
  const id = player.generateElementId();
  const infoDetail = (
    <UserInfo className="p-2 text-sm w-auto whitespace-nowrap shadow-lg shadow-black" id={id} key={id}>
      <div className="flex gap-2 items-center">All Players Passed</div>
    </UserInfo>
  );
  newAction.payload = infoDetail;

  return newAction;
};

/** */
const getPlayerNotificationForTrickWon = (result: EuchreTrick) => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_CENTER,
    payload: undefined
  };
  const icon: React.ReactNode = <CheckCircleIcon className="min-h-[18px] max-h-[20px] text-green-300" />;
  let messageLocation = '';

  switch (result.taker?.playerNumber) {
    case 1:
      messageLocation = 'bottom-3';
      break;
    case 2:
      messageLocation = 'top-3';
      break;
    case 3:
      messageLocation = 'left-3';
      break;
    case 4:
      messageLocation = 'right-3';
      break;
  }

  const id = result.taker?.generateElementId();
  const infoDetail = (
    <UserInfo
      className={`p-2 text-md w-auto absolute whitespace-nowrap z-40 shadow-lg shadow-black ${messageLocation}`}
      id={id}
      key={`${id}-${Math.floor(Math.random() * 1000)}`}
    >
      <div className="flex gap-2 items-center">{icon}</div>
    </UserInfo>
  );

  newAction.payload = infoDetail;

  return newAction;
};

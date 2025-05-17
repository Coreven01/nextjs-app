import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Card, TableLocation } from '../../../lib/euchre/definitions/definitions';
import {
  CardBaseState,
  ErrorHandlers,
  EuchreGameState,
  EuchrePlayer,
  GamePlayContext,
  PlayerHandState
} from '../../../lib/euchre/definitions/game-state-definitions';
import useCardRefs from '../useCardRefs';
import { GameEventHandlers } from '../useEventLog';
import {
  gameDelay,
  getCardsAvailableToPlay,
  isHandFinished,
  notificationDelay
} from '../../../lib/euchre/util/gameDataUtil';
import { availableCardsToPlay, playerEqual } from '../../../lib/euchre/util/playerDataUtil';
import { logConsole } from '../../../lib/euchre/util/util';
import {
  cardEqual,
  getDisplayHeight,
  getDisplayWidth,
  sortCardsIndices
} from '../../../lib/euchre/util/cardDataUtil';
import {
  getCalculatedWidthOffset,
  getSpringsForBeginNewHand,
  getSpringsPlayerHandInitDeal,
  groupHand
} from '../../../lib/euchre/util/cardTransformUtil';
import { getCardFullName, getEncodedCardSvg } from '../../../lib/euchre/util/cardSvgDataUtil';
import {
  addInitializeCardRegroupEvent,
  addInitializeCardStateEvent,
  addInitializeHandStateEvent
} from '../../../lib/euchre/util/cardStateEventsUtil';
import {
  CardPosition,
  CardSpringProps,
  CardSpringTarget,
  DEFAULT_SPRING_VAL
} from '../../../lib/euchre/definitions/transform-definitions';
import { v4 as uuidv4 } from 'uuid';
import useCardState from './useCardState';
import useCardStateEffect, { InitCardsHandlers } from '../effects/play/useCardStateEffect';
import { createCardBaseState, runCardAnimations } from '../../../lib/euchre/util/cardStateUtil';

const useCardAnimation = (
  gameContext: GamePlayContext,
  player: EuchrePlayer,

  directCenterHRef: RefObject<HTMLDivElement | null>,
  directCenterVRef: RefObject<HTMLDivElement | null>,

  /** map of location to the player's card deck area element. */
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  onTrickComplete?: (card: Card) => void,
  onPassDeal?: (card: Card) => void,
  onCardPlayed?: (card: Card) => void,
  onDealComplete?: (playerNumber: number) => void
) => {
  /** ************************************************************************************************************************************* */

  /** map of card index to reference to the card elements, used to calc spacing between cards when the screen is resized. */
  const cardRefs = useCardRefs(5);
  const {
    cardsAnimationControls,
    setCardsAnimationControls,
    cardStates,
    setCardStates,
    cardsAnimationStates,
    setCardsAnimationStates,
    createStates,
    recreateAnimationControls
  } = useCardState();

  /** Map of trick id to card played for that trick. Used when rendering cards to be displayed. */
  const cardPlayedForTrickRef = useRef<Map<string, Card>>(new Map<string, Card>());
  const onAnimationComplete = useRef<undefined | ((card: Card) => void)>(undefined);
  const trickAnimationHandled = useRef<string[]>([]);
  const [handState, setHandState] = useState<PlayerHandState | undefined>(undefined);

  const [refsReady, setRefsReady] = useState(false);

  /** Ordered card indices after the cards have been sorted/grouped */
  const initSortOrder = useRef<CardPosition[]>([]);
  //const initCalculatedWidth = useRef(0);
  const { state, eventHandlers, errorHandlers } = gameContext;
  const { euchreGame, euchreGameFlow, euchreSettings } = state;
  const playerCardsVisible = handState !== undefined && cardStates.length > 0;

  /** ************************************************************************************************************************************* */

  /** Get the element that's relative to the player's location that's used as an offset. */
  const getRelativeCenter = useCallback(
    (location: TableLocation) => {
      if (location === 'top' || location === 'bottom') {
        return directCenterHRef.current;
      } else {
        return directCenterVRef.current;
      }
    },
    [directCenterHRef, directCenterVRef]
  );

  /** ************************************************************************************************************************************* */

  //#region Card Init Effect Hook

  /** Returns the current card state for cards that are available to be played.
   *
   */
  const getAvailableCardsAndState = useCallback(
    (useInitSortOrder: boolean) => {
      const availableCards: Card[] = availableCardsToPlay(player);
      const availableCardIndices = availableCards.map((c) => c.index);
      const orderedIndices: CardPosition[] = !useInitSortOrder
        ? sortCardsIndices(availableCards, euchreGame.maker ? euchreGame.trump : null)
        : initSortOrder.current
            .filter((s) => availableCardIndices.includes(s.cardIndex))
            .map((card, index) => {
              return { cardIndex: card.cardIndex, ordinalIndex: index };
            });
      const currentProps: CardSpringProps[] = [];

      for (const indexPosition of orderedIndices) {
        const cardState = cardStates.find((s) => s.cardIndex === indexPosition.cardIndex);
        const animationControl = cardsAnimationControls.find((s) => s.cardIndex === indexPosition.cardIndex);

        if (!cardState)
          throw new Error('[CARD STATE] - Card state not found when getting available cards/state.');

        if (!animationControl)
          throw new Error('[CARD STATE] - Animation control not found when getting available cards/state.');

        currentProps.push({
          ordinalIndex: indexPosition.ordinalIndex,
          cardIndex: indexPosition.cardIndex,
          animateValues: animationControl.animateValues,
          initialValue: animationControl.initSpringValue
        });
      }

      return currentProps;
    },
    [cardStates, cardsAnimationControls, euchreGame.maker, euchreGame.trump, player]
  );

  /** Create and set the initial hand state for the player's hand for regular play. */
  const setInitialHandState = useCallback(() => {
    const location = player.location;
    const width: number = getDisplayWidth(location);
    const height: number = getDisplayHeight(location);
    const showCardValue = euchreGameFlow.shouldShowCardValuesForHand.find((c) =>
      playerEqual(c.player, player)
    )?.value;

    const handState: PlayerHandState = {
      handId: euchreGame.handId,
      width: width,
      height: height,
      location: location,
      shouldShowCardValue: showCardValue,
      player: player,
      responsive: true
    };

    setHandState(handState);
  }, [euchreGame.handId, euchreGameFlow.shouldShowCardValuesForHand, player]);

  /** */
  const initCardStatesForNewHand = useCallback(() => {
    if (!handState) throw new Error('[CARD STATE] Invalid hand state for initialization for card state');

    const initStates = createStates(
      player.hand,
      handState.location,
      !!handState.shouldShowCardValue,
      getSpringsPlayerHandInitDeal(player.hand, handState.location)
    );

    setCardStates(initStates.cardStates);
    setCardsAnimationControls(initStates.animationControls);
    setCardsAnimationStates(initStates.animationCardStates);
  }, [
    createStates,
    handState,
    player.hand,
    setCardStates,
    setCardsAnimationControls,
    setCardsAnimationStates
  ]);

  /** */
  const initCardStatesForExistingHand = useCallback(async () => {
    if (!handState) throw new Error('[CARD STATE] Invalid hand state for initialization for card state');

    const newCardState = euchreGame.deck.map((card) => {
      return createCardBaseState(card, handState.location, false);
    });

    setCardStates(newCardState);

    const centerLocation: boolean = handState.location === 'top' || handState.location === 'bottom';
    const initSpringValue: CardSpringTarget | undefined = {
      ...DEFAULT_SPRING_VAL,
      rotateY: centerLocation ? 180 : 0,
      rotateX: centerLocation ? 0 : 180
    };
    const resetSpring: CardSpringTarget = { ...initSpringValue, transition: { duration: 0 } };
    for (const animationControl of cardsAnimationControls) {
      await animationControl.controls?.start(resetSpring);
    }
  }, [cardsAnimationControls, euchreGame.deck, handState, setCardStates]);

  /** Set initial card state used when animation of cards being played. */
  const initCardStates = useCallback(async (): Promise<void> => {
    if (!handState) throw new Error('[CARD STATE] Invalid hand state for initialization for card state');

    const cardStatesExist = cardStates.length > 0;

    if (!cardStatesExist) {
      initCardStatesForNewHand();
    } else {
      await initCardStatesForExistingHand();
    }
  }, [cardStates.length, handState, initCardStatesForExistingHand, initCardStatesForNewHand]);

  /** Set the sort order for the player's hand. Used to display the suits grouped together and trump first. */
  const initializeSortOrder = useCallback(() => {
    const availableCards: Card[] = availableCardsToPlay(player);
    const orderedIndices: CardPosition[] = sortCardsIndices(
      availableCards,
      euchreGame.maker ? euchreGame.trump : null
    );
    initSortOrder.current = orderedIndices;
  }, [euchreGame.maker, euchreGame.trump, player]);

  /** Animates flipping a player's hand so the card values are visible. */
  const animateFlipPlayerHand = useCallback(() => {
    const newCardStates: CardBaseState[] = [...cardStates];
    const location = player.location;

    for (const cardState of newCardStates) {
      const card = player.hand[cardState.cardIndex];

      cardState.cardFullName = getCardFullName(card);
      cardState.src = getEncodedCardSvg(card, location);
      cardState.renderKey = uuidv4();

      // if (cardState.springValue) {
      //   cardState.springValue = {
      //     ...cardState.springValue,
      //     rotateX: 0,
      //     rotateY: 0
      //   };
      //   //cardState.transition = { transition: { rotateY: { duration: 0.3 }, rotateX: { duration: 0.3 } } };
      // }
    }

    setCardStates(newCardStates);
  }, [cardStates, player.hand, player.location, setCardStates]);

  /** Re-adjusts the player's hand that are displayed. Used after a player plays a card and to group the cards together. */
  const regroupCards = useCallback(
    (useInitSortOrder: boolean, cardRef: HTMLDivElement) => {
      const newCardStates: CardBaseState[] = [...cardStates];
      const currentProps: CardSpringProps[] = getAvailableCardsAndState(useInitSortOrder);

      const newProps: CardSpringProps[] = groupHand(
        player.location,
        getCalculatedWidthOffset(cardRef),
        currentProps
      );

      for (const cardState of newCardStates) {
        const tempVal = newProps.find((p) => p.cardIndex === cardState.cardIndex)?.animateValues;

        if (!tempVal)
          throw new Error('[CARD STATE] - Logic error in regroup cards. New card state not found.');
        // cardState.springValue = tempVal;
        cardState.renderKey = uuidv4();
      }

      setCardStates(newCardStates);
    },
    [cardStates, getAvailableCardsAndState, player.location, setCardStates]
  );

  const resetForNewHand = useCallback(() => {
    setHandState(undefined);
    setCardStates([]);
    trickAnimationHandled.current = [];
  }, [setCardStates]);

  const beginFlipCards = useCallback(async () => {
    // flip cards over to see their values if enabled for the current player.
    if (handState?.shouldShowCardValue) {
      await gameDelay(euchreSettings);
      animateFlipPlayerHand();
    }
  }, [animateFlipPlayerHand, euchreSettings, handState?.shouldShowCardValue]);

  const handleDealComplete = useCallback(
    (playerNumber: number) => {
      if (onDealComplete) {
        onDealComplete(playerNumber);
      } else {
        throw new Error('[CARD STATE] - Invalid event handler for deal complete.');
      }
    },
    [onDealComplete]
  );

  const handleResetHandState = useCallback(async () => {
    resetForNewHand();
  }, [resetForNewHand]);

  /** */
  const handleCreateHandState = useCallback(async () => {
    addInitializeHandStateEvent(state, eventHandlers, player);
    setInitialHandState();
  }, [eventHandlers, player, setInitialHandState, state]);

  /** */
  const handleCreateCardState = useCallback(async () => {
    addInitializeCardStateEvent(state, eventHandlers, player);
    initializeSortOrder();
    await initCardStates();

    // set card states for initial movement.
  }, [eventHandlers, initializeSortOrder, player, initCardStates, state]);

  /** */
  const handleBeginRegroupCards = useCallback(async () => {
    if (!handState) throw new Error('[CARD STATE] Invalid hand state for regroup player cards.');

    addInitializeCardRegroupEvent(state, eventHandlers, player);

    const cardRefElements: HTMLElement[] = [];
    cardRefs
      .values()
      .toArray()
      .forEach((c) => {
        if (c.current) cardRefElements.push(c.current);
      });

    const destElement = playerDeckRefs.get(handState.location)?.current;
    const relativeElement = getRelativeCenter(handState.location);

    if (cardRefElements.length === 0)
      throw new Error('[CARD STATE] Invalid card elements for initialize card state.');
    if (!destElement) throw new Error('[CARD STATE] Invalid destination element for initialize card state.');
    if (!relativeElement) throw new Error('[CARD STATE] Invalid relative element for initialize card state.');

    // const currentProps: CardSpringProps[] = getAvailableCardsAndState(true);
    // const newSprings = getSpringsForBeginNewHand(
    //   player.hand,
    //   handState.location,
    //   euchreSettings.gameSpeed,
    //   cardRefElements,
    //   destElement,
    //   relativeElement,
    //   getCalculatedWidthOffset(cardRefElements[0]),
    //   currentProps
    // );
    // const newAnimationControls = [...cardsAnimationControls];

    // for (const springVal of newSprings) {
    //   const control = newAnimationControls[springVal.cardIndex];
    //   control.animateValues = springVal.animateValues;
    // }

    // setCardsAnimationControls(newAnimationControls);

    //throw new Error('not implemented');
    // const cardRef = cardRefs.values().find((c) => c?.current)?.current;
    // if (!cardRef) {
    //   throw new Error(
    //     '[CARD STATE] [handleBeginRegroupCards] Invalid card ref when setting initial animation.'
    //   );
    // }

    // const delay = (euchreSettings.gameSpeed * (Math.random() + 1)) / 2;
    // await new Promise((resolve) => setTimeout(resolve, delay));

    // logConsole('[CARD STATE] [handleBeginRegroupCards]', ' player: ', player.name);

    // regroupCards(false, cardRef);

    // await beginFlipCards();
    // await notificationDelay(euchreSettings);

    // handleDealComplete(player.playerNumber);
  }, [
    cardRefs,
    cardsAnimationControls,
    euchreSettings.gameSpeed,
    eventHandlers,
    getAvailableCardsAndState,
    getRelativeCenter,
    handState,
    player,
    playerDeckRefs,
    setCardsAnimationControls,
    state
  ]);

  /** */
  const handleAnimateRegroupCards = useCallback(async () => {
    await runCardAnimations(cardsAnimationControls);

    //throw new Error('not implemented');
    // const cardRef = cardRefs.values().find((c) => c?.current)?.current;
    // if (!cardRef) {
    //   throw new Error(
    //     '[CARD STATE] [handleBeginRegroupCards] Invalid card ref when setting initial animation.'
    //   );
    // }

    // const delay = (euchreSettings.gameSpeed * (Math.random() + 1)) / 2;
    // await new Promise((resolve) => setTimeout(resolve, delay));

    // logConsole('[CARD STATE] [handleBeginRegroupCards]', ' player: ', player.name);

    // regroupCards(false, cardRef);

    // await beginFlipCards();
    // await notificationDelay(euchreSettings);

    // handleDealComplete(player.playerNumber);
  }, [cardsAnimationControls]);

  const initCardHandlers: InitCardsHandlers = {
    onResetHandState: handleResetHandState,
    onCreateHandState: handleCreateHandState,
    onCreateCardState: handleCreateCardState,
    onRegroupCards: handleBeginRegroupCards,
    onAnimateRegroupCards: handleAnimateRegroupCards
  };

  //   const { initCardStateCreated } = useCardInitEffect(
  //     state,
  //     errorHandlers,
  //     handState,
  //     handleResetHandState,
  //     handleCreateHandState,
  //     handleInitializeCardState,
  //     handleBeginRegroupCards
  //   );

  //#endregion

  /** ************************************************************************************************************************************* */

  //#region Card Play Effect Hook

  /** */
  //   const animateTakeTrick = useCallback(() => {
  //     if (!onTrickComplete) throw new Error('[CARD STATE] - Invalid handler');

  //     const currentTrick = euchreGame.currentTrick;
  //     trickAnimationHandled.current.push(currentTrick.trickId);
  //     const lastCardPlayed: Card | undefined = cardPlayedForTrickRef.current.get(currentTrick.trickId);

  //     logConsole('[CARD STATE] [animateTrickFinished]', ' player: ', player.name);

  //     if (lastCardPlayed && handState && currentTrick.playerRenege) {
  //       // if player reneged, then don't animate taking the trick, and just call the event handler as if the animation was complete.
  //       onAnimationComplete.current = undefined;
  //       onTrickComplete(lastCardPlayed);
  //     } else if (lastCardPlayed && handState && !currentTrick.playerRenege) {
  //       // animate trick being taken by the winner.
  //       const trickWonLocation = currentTrick.taker?.location;
  //       const cardRef = cardRefs.entries().find((r) => r[0] === lastCardPlayed.index)?.[1]?.current;
  //       const destinationDeckRef = playerDeckRefs
  //         .entries()
  //         .find((r) => r[0] === trickWonLocation)?.[1]?.current;

  //       // if (cardRef && destinationDeckRef && trickWonLocation) {
  //       //   const newCardState = getCardStatesForTrickTaken(
  //       //     lastCardPlayed,
  //       //     cardStates,
  //       //     trickWonLocation,
  //       //     destinationDeckRef,
  //       //     cardRef,
  //       //     euchreSettings.gameSpeed
  //       //   );
  //       //   setHandState({
  //       //     ...handState,
  //       //     stateEffect: EuchreGameFlow.TRICK_FINISHED
  //       //   });

  //       //   onAnimationComplete.current = onTrickComplete;
  //       //   setCardStates(newCardState);
  //       // }
  //     }
  //   }, [
  //     cardRefs,
  //     cardStates,
  //     euchreGame.currentTrick,
  //     euchreSettings.gameSpeed,
  //     handState,
  //     onTrickComplete,
  //     player.name,
  //     playerDeckRefs
  //   ]);

  /** Gets the cards that are available to be played for the current trick. If enforce follow suit setting is enabled, then only
   * return those cards. If not enabled, then return all cards currently in the player's hand.
   */
  const getCardsAvailableIfFollowSuit = useCallback(() => {
    const playerCurrentHand: Card[] = availableCardsToPlay(player);
    const cardsAvailableForFollowSuit: Card[] = [];

    if (euchreSettings.enforceFollowSuit) {
      // only enable cards that are available for follow suit, if enabled by settings.
      const leadCard = euchreGame.currentTrick.cardsPlayed.at(0)?.card ?? null;
      cardsAvailableForFollowSuit.push(
        ...getCardsAvailableToPlay(euchreGame.trump, leadCard, playerCurrentHand).map((c) => c.card)
      );
    } else {
      // enable all cards to be played that have yet to be played for the current hand.
      cardsAvailableForFollowSuit.push(...playerCurrentHand);
    }

    return cardsAvailableForFollowSuit;
  }, [euchreGame.currentTrick.cardsPlayed, euchreGame.trump, euchreSettings.enforceFollowSuit, player]);

  /**
   * At the beginning of a player's turn, update the card state to enable/disable cards and overlay
   * depending on settings.
   */
  const updateCardStateForTurn = useCallback((awaitingPlayerInput: boolean) => {
    //       if (!handState) throw new Error('[CARD STATE] - Hand state not found.');
    //       const newCardStates: CardBaseState[] = [...cardStates];
    //       const availableCards = getCardsAvailableIfFollowSuit().map((c) => c.index);
    //       for (const cardState of newCardStates) {
    //         const isAvailable: boolean = availableCards.includes(cardState.cardIndex);
    //         const cardEnabled = awaitingPlayerInput && isAvailable;
    //         const addOverlay = awaitingPlayerInput ? awaitingPlayerInput && !isAvailable : false;
    //         if (handState.shouldShowCardValue) {
    //           cardState.enabled = cardEnabled;
    //           cardState.cardFullName = getCardFullName(player.hand[cardState.cardIndex]);
    //           cardState.src = getEncodedCardSvg(player.hand[cardState.cardIndex], handState.location, addOverlay);
    //           cardState.renderKey = uuidv4();
    //         }
    //       }
    //       setCardStates(newCardStates);
  }, []);

  /** */
  //   const handlePassDealComplete = useCallback(
  //     (card: Card) => {
  //       if (onPassDeal) {
  //         onPassDeal(card);
  //       } else {
  //         throw new Error('[CARD STATE] - Invalid event handler for pass deal complete.');
  //       }
  //     },
  //     [onPassDeal]
  //   );

  /** Animate cards going to a player side of the game board after cards have been dealt.
   *
   */
  //   const moveCardsToPlayer = useCallback(
  //     (destinationPlayer: EuchrePlayer) => {
  //       // setCardStates((prev) => {
  //       //   const newState = [...prev];
  //       //   const destRef = playerDeckRefs.get(destinationPlayer.location);
  //       //   if (!destRef?.current)
  //       //     throw new Error('[CARD STATE] - Invalid destination ref to move cards to dealer');
  //       //   const springsToMove = getSpringsToMoveToPlayer(
  //       //     cardRefs,
  //       //     destRef.current,
  //       //     destinationPlayer.location,
  //       //     cardStates,
  //       //     true,
  //       //     euchreSettings.gameSpeed
  //       //   );
  //       //   for (const cardState of newState) {
  //       //     const spring = springsToMove.at(cardState.cardIndex);
  //       //     if (spring) {
  //       //       //cardState.runEffectForState = EuchreGameFlow.BEGIN_PASS_DEAL;
  //       //       // cardState.springValue = spring.springValue;
  //       //       cardState.renderKey = uuidv4();
  //       //     }
  //       //     cardState.location = destinationPlayer.location;
  //       //   }
  //       //   return newState;
  //       // });
  //     },
  //     [cardRefs, cardStates, euchreSettings.gameSpeed, playerDeckRefs]
  //   );

  /**
   * Update the game deck state to handle animation complete for game flow end deal for dealer.
   */
  //   const setHandStateForPassDeal = useCallback(() => {
  //     onAnimationComplete.current = handlePassDealComplete;
  //   }, [handlePassDealComplete]);

  //   const handlePassDeal = useCallback(() => {
  //     logConsole('[CARD STATE] - animatePassDeal', ' player: ', player.name);

  //     setHandStateForPassDeal();
  //     moveCardsToPlayer(euchreGame.dealer);
  //   }, [euchreGame.dealer, moveCardsToPlayer, player.name, setHandStateForPassDeal]);

  //   const handleReorderHand = useCallback(() => {
  //     const cardRef = cardRefs.values().find((c) => c?.current)?.current;
  //     if (!cardRef) throw new Error('[CARD STATE] - Invalid card ref when reorder hand after trump named.');

  //     logConsole('[CARD STATE] - reorderHand', ' player: ', player.name);

  //     initializeSortOrder();
  //     regroupCards(true, cardRef);
  //     updateCardStateForTurn(false);
  //   }, [cardRefs, initializeSortOrder, player.name, regroupCards, updateCardStateForTurn]);

  //   const handlePlayerSittingOut = useCallback(async () => {
  //     logConsole('[CARD STATE] - beginSittingOut', ' player: ', player.name);

  //     const baseTransition = getBaseTransitionForCardMoved(euchreSettings.gameSpeed);
  //     cardStates.forEach((s) => {
  //       // s.springValue = s.springValue ? { ...s.springValue, x: 0, y: 0, rotate: 0 } : { ...DEFAULT_SPRING_VAL };
  //       // s.transition = baseTransition;
  //     });

  //     await gameDelay(euchreSettings);

  //     cardStates.forEach((s) => {
  //       // s.springValue = { ...getSpringsForCardInit(player.location), opacity: 0 };
  //       // s.renderKey = uuidv4();
  //     });
  //   }, [cardStates, euchreSettings, player.location, player.name]);

  //   const handleTrickFinished = useCallback(() => {
  //     animateTakeTrick();
  //   }, [animateTakeTrick]);

  //   const handleBeginPlayerTurn = useCallback(() => {
  //     logConsole('[CARD STATE] - shouldRunBeginUpdate - updateCardStateForTurn', ' player: ', player.name);

  //     updateCardStateForTurn(true);
  //   }, [player.name, updateCardStateForTurn]);

  //   const handleEndPlayerTurn = useCallback(() => {
  //     logConsole('[CARD STATE] - runEndUpdateCardState - updateCardStateForTurn', ' player: ', player.name);

  //     updateCardStateForTurn(false);
  //   }, [player.name, updateCardStateForTurn]);

  //   useCardPlayEffect(
  //     state,
  //     player,
  //     errorHandlers,
  //     handState,
  //     cardRefs,
  //     handlePassDeal,
  //     handleReorderHand,
  //     handlePlayerSittingOut,
  //     handleTrickFinished,
  //     handleBeginPlayerTurn,
  //     handleEndPlayerTurn
  //   );

  //#endregion

  /** ************************************************************************************************************************************* */

  //#region Functions/Methods

  /** Returns the cards should be displayed on the game table. Ensures the played cards stays center table until the trick is finished.
   *
   */
  const getCardsToDisplay = () => {
    const playerCurrentHand: Card[] = availableCardsToPlay(player);

    // get the last trick played, then get the last card that was played from that trick.
    const lastCardPlayed = cardPlayedForTrickRef.current.get(euchreGame.currentTrick.trickId);
    if (
      lastCardPlayed &&
      euchreGame.currentTrick.cardsPlayed.find((c) => cardEqual(c.card, lastCardPlayed))
    ) {
      playerCurrentHand.push(lastCardPlayed); // make sure the card is still visible until trick finished.
    } else if (lastCardPlayed && isHandFinished(euchreGame)) {
      playerCurrentHand.push(lastCardPlayed);
    }
    return playerCurrentHand;
  };

  /** Sets the animation for the card to be played. On the callback when the animation is finished is when the state is updated with
   * the card that was played.
   */
  const handlePlayCardAnimation = (cardIndex: number, playerTableRef: HTMLElement) => {
    logConsole('[CARD STATE] [handlePlayCardAnimation] - useCardState.ts');
    const currentState = cardStates.find((c) => c.cardIndex === cardIndex);
    const cardRef = cardRefs.get(cardIndex);

    if (!currentState || !cardRef?.current)
      throw new Error('[CARD STATE] [handlePlayCardAnimation] - Invalid card state');
    if (!handState) throw new Error('[CARD STATE] [handlePlayCardAnimation] - Invalid hand state');

    //playCard(cardIndex, cardRef.current, playerTableRef, currentState.rotation ?? 0);
  };

  /** Updates the card state to animate the card being played to the center of the table. Regroups the remaining cards together in the player's hand. */
  //   const playCard = (
  //     cardIndex: number,
  //     cardRef: HTMLElement,
  //     tableRef: HTMLElement | undefined,
  //     rotation: number
  //   ) => {
  //     logConsole('[CARD STATE] [playCard] - card index: ', cardIndex);

  //     const newCardStates: CardBaseState[] = [...cardStates];
  //     const card = player.hand[cardIndex];
  //     const location = player.location;
  //     const currentProps: CardSpringProps[] = getAvailableCardsAndState(true);
  //     const cardWidthOffset = initCalculatedWidth.current;

  //     const newSpringValues = getSpringsForCardPlayed(
  //       cardIndex,
  //       player,
  //       cardRef,
  //       tableRef,
  //       rotation,
  //       currentProps,
  //       cardWidthOffset
  //     );

  //     for (const val of newSpringValues) {
  //       const cardState = newCardStates.find((c) => c.cardIndex === val.cardIndex);

  //       if (!cardState) throw new Error('[CARD STATE] - Invalid card state');

  //       // cardState.springValue = val.springValue;
  //       cardState.renderKey = uuidv4();

  //       if (val.cardIndex === cardIndex) {
  //         // cardState.transition = getTransitionForCardMoved(cardState, euchreSettings.gameSpeed);
  //         cardState.cardFullName = getCardFullName(card);
  //         cardState.src = getEncodedCardSvg(card, location);
  //         //cardState.runEffectForState = EuchreGameFlow.BEGIN_PLAY_CARD;
  //       } else {
  //         // cardState.transition = undefined;
  //         //cardState.runEffectForState = undefined;
  //       }
  //     }

  //     const trickId: string = euchreGame.currentTrick.trickId;
  //     cardPlayedForTrickRef.current.set(trickId, card);

  //     onAnimationComplete.current = onCardPlayed;
  //     setCardStates(newCardStates);
  //     if (handState) {
  //       setHandState({
  //         ...handState,
  //         stateEffect: EuchreGameFlow.BEGIN_PLAY_CARD
  //       });
  //     }
  //   };

  //#endregion

  /** ************************************************************************************************************************************* */

  const { initCardStateCreated, getEffectForCardState } = useCardStateEffect(
    state,
    handState,
    refsReady,
    initCardHandlers
  );

  //#region  UseEffect hooks

  useEffect(() => {
    const runCardStateEffect = async () => {
      const effectToRun = getEffectForCardState();

      if (effectToRun.func) {
        // logConsole(
        //   `[CARD STATE] [${effectToRun.stateHandlerName}] - Run Effect For Condition: ${effectToRun.stateConditionName} - Phase: ${effectToRun.statePhase}`
        // );
        // await errorHandlers.catchAsync(
        //   effectToRun.func,
        //   errorHandlers.onError,
        //   effectToRun.stateHandlerName ?? 'runCardStateEffect'
        // );
      } else {
        logConsole('[CARD STATE] - NO EFFECT WAS RUN');
      }
    };

    runCardStateEffect();
  }, [errorHandlers, getEffectForCardState]);

  //#endregion

  return {
    playerCardsVisible,
    initCardStateCreated,
    cardPlayedForTrickRef,
    cardRefs,
    handState,
    cardStates,
    cardsAnimationControls,
    onAnimationComplete,
    getCardsAvailableIfFollowSuit,
    getCardsToDisplay,
    handlePlayCardAnimation,
    updateCardStateForTurn,
    setRefsReady
  };
};

export default useCardAnimation;

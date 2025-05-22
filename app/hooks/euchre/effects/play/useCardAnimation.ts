import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  CardBaseState,
  EuchrePlayer,
  GamePlayContext,
  HandState,
  InitHandHandlers,
  PlayHandHandlers
} from '../../../../lib/euchre/definitions/game-state-definitions';
import { Card, TableLocation } from '../../../../lib/euchre/definitions/definitions';
import useCardRefs from '../../useCardRefs';
import useCardState from '../../state/useCardState';
import {
  CardAnimationControls,
  CardPosition,
  CardSpringProps,
  CardSpringTarget,
  DEFAULT_SPRING_VAL,
  FlipSpringProps,
  SpringContext
} from '../../../../lib/euchre/definitions/transform-definitions';
import { availableCardsToPlay, playerEqual } from '../../../../lib/euchre/util/playerDataUtil';
import {
  cardEqual,
  getDisplayHeight,
  getDisplayWidth,
  sortCardsIndices
} from '../../../../lib/euchre/util/cardDataUtil';
import {
  getCalculatedWidthOffset,
  getDurationSeconds,
  getSpringsForBeginNewHand,
  getSpringsForCardPlayed,
  getSpringsGroupHand,
  getSpringsPlayerHandInitDeal,
  getSpringToMoveToPlayer,
  groupHand
} from '../../../../lib/euchre/util/play/cardTransformUtil';
import { gameDelay, getCardsAvailableToPlay, isHandFinished } from '../../../../lib/euchre/util/gameDataUtil';
import {
  addInitializeCardRegroupEvent,
  addInitializeCardStateEvent,
  addInitializeHandStateEvent
} from '../../../../lib/euchre/util/play/cardStateEventsUtil';
import { createCardBaseState, runCardAnimations } from '../../../../lib/euchre/util/cardStateUtil';
import { logConsole } from '../../../../lib/euchre/util/util';
import useCardStateEffect from './useCardStateEffect';
import { v4 as uuidv4 } from 'uuid';
import { getCardFullName, getEncodedCardSvg } from '../../../../lib/euchre/util/cardSvgDataUtil';

const ERR_ID: string = '[CARD ANIMATION]';

const useCardAnimation = (
  gameContext: GamePlayContext,
  player: EuchrePlayer,

  horizontalElement: HTMLElement | null,
  verticalElement: HTMLElement | null,
  playerTableCenterElement: HTMLElement | null,

  /** map of location to the player's card deck area element. */
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  onDealComplete: (playerNumber: number) => void,
  onTrickComplete: (card: Card) => void
) => {
  /** ************************************************************************************************************************************* */

  /** map of card index to reference to the card elements, used to calc spacing between cards when the screen is resized. */
  const cardRefs = useCardRefs(5);
  const { stateContext, setCardsAnimationControls, setCardStates, setCardsAnimationStates, createStates } =
    useCardState();

  const { cardStates, animationControls, animationStates } = stateContext;

  /** Map of trick id to card played for that trick. Used when rendering cards to be displayed. */
  const cardPlayedForTrickRef = useRef<Map<string, Card>>(new Map<string, Card>());
  const playedCardIndex = useRef(-1);
  const [handState, setHandState] = useState<HandState | undefined>(undefined);
  const [refsReady, setRefsReady] = useState(false);

  /** Ordered card indices after the cards have been sorted/grouped */
  const initSortOrder = useRef<CardPosition[]>([]);
  const initCalculatedWidth = useRef(0);

  const { state, eventHandlers, errorHandlers, animationHandlers } = gameContext;
  const { euchreGame, euchreGameFlow, euchreSettings } = state;

  const playerCardsVisible = handState !== undefined && cardStates.length > 0;
  const currentTrick = euchreGame.currentTrick;

  /** ************************************************************************************************************************************* */

  /** Get the element that's relative to the player's location that's used as an offset. */
  const getRelativeCenter = useCallback(
    (location: TableLocation) => {
      if (location === 'top' || location === 'bottom') {
        return horizontalElement;
      } else {
        return verticalElement;
      }
    },
    [horizontalElement, verticalElement]
  );

  const getWidth = useCallback((element: HTMLElement, reset: boolean) => {
    if (initCalculatedWidth.current === 0 || reset) {
      initCalculatedWidth.current = getCalculatedWidthOffset(element);
    }

    return initCalculatedWidth.current;
  }, []);

  /* Update state values to the new values passed as parameters. */
  const updateCardAnimationSprings = useCallback(
    (
      controls: CardAnimationControls[],
      updatedSprings: CardSpringProps[],
      flipSprings: FlipSpringProps[]
    ) => {
      const newAnimationControls = [...controls];

      for (const control of newAnimationControls) {
        const updatedSpring = updatedSprings.find((c) => c.cardIndex === control.cardIndex);
        const updatedFlipSpring = flipSprings.find((c) => c.cardIndex === control.cardIndex);

        control.animateSprings = updatedSpring?.animateSprings ?? [];
        control.animateFlipSprings = updatedFlipSpring?.animateSprings;
      }

      setCardsAnimationControls(newAnimationControls);
    },
    [setCardsAnimationControls]
  );

  /** ************************************************************************************************************************************* */

  //#region Card Init Functions/Handlers Hook

  /** Returns the current card state for cards that are available to be played.
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
        const animationControl = animationControls.find((s) => s.cardIndex === indexPosition.cardIndex);

        if (!cardState)
          throw new Error(`${ERR_ID} - Card state not found when getting available cards/state.`);

        if (!animationControl)
          throw new Error(`${ERR_ID} - Animation control not found when getting available cards/state.`);

        currentProps.push({
          ordinalIndex: indexPosition.ordinalIndex,
          cardIndex: indexPosition.cardIndex,
          animateSprings: animationControl.animateSprings,
          initialSpring: animationControl.initSpring
        });
      }

      return currentProps;
    },
    [cardStates, animationControls, euchreGame.maker, euchreGame.trump, player]
  );

  /** Create and set the initial hand state for the player's hand for regular play. */
  const setInitialHandState = useCallback(() => {
    const location = player.location;
    const width: number = getDisplayWidth(location);
    const height: number = getDisplayHeight(location);
    const showCardValue = euchreGameFlow.shouldShowCardValuesForHand.find((c) =>
      playerEqual(c.player, player)
    )?.value;

    const handState: HandState = {
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
    if (!handState) throw new Error(`${ERR_ID} - Invalid hand state for initialization for card state`);

    const intialValues = getSpringsPlayerHandInitDeal(player.hand, handState.location);
    const initStates = createStates(
      player.hand,
      handState.location,
      !!handState.shouldShowCardValue,
      intialValues.cardSprings,
      intialValues.flipSprings,
      false
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
    if (!handState) throw new Error(`${ERR_ID} - Invalid hand state for initialization for card state`);

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
    for (const animationControl of animationControls) {
      await animationControl.controls?.start(resetSpring);
    }
  }, [animationControls, euchreGame.deck, handState, setCardStates]);

  /** Set initial card state used when animation of cards being played. */
  const initCardStates = useCallback(async (): Promise<void> => {
    if (!handState) throw new Error(`${ERR_ID} - Invalid hand state for initialization for card state`);

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

  /** Create and set card states to move cards into position after being dealt for regular play. Cards moved into view, fanned, and flipped
   * if cards should be shown.
   */
  const setCardStateForRegroupHand = useCallback(() => {
    if (!handState) throw new Error(`${ERR_ID} - Invalid hand state for regroup player hand.`);

    const cardElements: HTMLElement[] = [];
    cardRefs
      .values()
      .toArray()
      .forEach((c) => {
        if (c.current) cardElements.push(c.current);
      });

    const destElement = playerDeckRefs.get(handState.location)?.current;
    const relativeElement = getRelativeCenter(handState.location);

    if (cardElements.length === 0)
      throw new Error(`${ERR_ID} - Invalid card elements for initialize card state.`);
    if (!destElement) throw new Error(`${ERR_ID} - Invalid destination element for initialize card state.`);
    if (!relativeElement) throw new Error(`${ERR_ID} - Invalid relative element for initialize card state.`);

    const duration = getDurationSeconds(euchreSettings.gameSpeed);
    const currentProps: CardSpringProps[] = getAvailableCardsAndState(true);
    const newSprings = getSpringsForBeginNewHand(
      player.hand,
      handState.location,
      euchreSettings.gameSpeed,
      cardElements,
      destElement,
      relativeElement,
      getWidth(cardElements[0], false),
      currentProps
    );

    let flipSprings: FlipSpringProps[] = [];
    if (handState.shouldShowCardValue) {
      flipSprings = player.hand.map((card, index) => {
        const flipProp: FlipSpringProps = {
          cardIndex: card.index,
          initialSpring: undefined,
          ordinalIndex: index,
          animateSprings: [
            {
              rotateX: 0,
              rotateY: 0,
              transition: {
                rotateX: { delay: duration * 3, duration: 0.3 },
                rotateY: { delay: duration * 3, duration: 0.3 }
              }
            }
          ]
        };

        return flipProp;
      });
    }

    updateCardAnimationSprings(animationControls, newSprings, flipSprings);
  }, [
    animationControls,
    cardRefs,
    euchreSettings.gameSpeed,
    getAvailableCardsAndState,
    getRelativeCenter,
    getWidth,
    handState,
    player.hand,
    playerDeckRefs,
    updateCardAnimationSprings
  ]);

  /** Animates flipping a player's hand so the card values are visible. */
  //const animateFlipPlayerHand = useCallback(() => {
  // const newCardStates: CardBaseState[] = [...cardStates];
  // const location = player.location;
  // for (const cardState of newCardStates) {
  //   const card = player.hand[cardState.cardIndex];
  //   cardState.cardFullName = getCardFullName(card);
  //   cardState.src = getEncodedCardSvg(card, location);
  //   cardState.renderKey = uuidv4();
  //   // if (cardState.springValue) {
  //   //   cardState.springValue = {
  //   //     ...cardState.springValue,
  //   //     rotateX: 0,
  //   //     rotateY: 0
  //   //   };
  //   //   //cardState.transition = { transition: { rotateY: { duration: 0.3 }, rotateX: { duration: 0.3 } } };
  //   // }
  // }
  // setCardStates(newCardStates);
  //}, []);

  /** Re-adjusts the player's hand that are displayed. Used after a player plays a card and to group the cards together. */
  const regroupCards = useCallback(
    async (useInitSortOrder: boolean, cardElement: HTMLElement) => {
      //const newCardStates: CardBaseState[] = [...cardStates];
      const currentProps: CardSpringProps[] = getAvailableCardsAndState(useInitSortOrder);
      const newAnimationControls = [...animationControls];

      const newProps: CardSpringProps[] = groupHand(
        player.location,
        getWidth(cardElement, false),
        currentProps,
        animationStates,
        euchreSettings.gameSpeed
      );

      for (const control of newAnimationControls) {
        control.animateFlipSprings = [];
        control.animateSprings = [];
        control.initFlipSpring = undefined;
        control.initSpring = undefined;

        const animateValue = newProps.find((p) => p.cardIndex === control.cardIndex)?.animateSprings;

        if (!animateValue)
          throw new Error(`${ERR_ID} - Logic error in regroup cards. New card state not found.`);

        control.animateSprings = animateValue;
        //cardState.springValue = animateValue;
        //cardState.renderKey = uuidv4();
      }

      await runCardAnimations(newAnimationControls);
      setCardsAnimationControls(newAnimationControls);
      //setCardStates(newCardStates);
    },
    [
      animationControls,
      animationStates,
      euchreSettings.gameSpeed,
      getAvailableCardsAndState,
      getWidth,
      player.location,
      setCardsAnimationControls
    ]
  );

  const resetForNewHand = useCallback(() => {
    setHandState(undefined);
    setCardStates([]);
  }, [setCardStates]);

  // const beginFlipCards = useCallback(async () => {
  //   // flip cards over to see their values if enabled for the current player.
  //   if (handState?.shouldShowCardValue) {
  //     await gameDelay(euchreSettings);
  //     animateFlipPlayerHand();
  //   }
  // }, [animateFlipPlayerHand, euchreSettings, handState?.shouldShowCardValue]);

  // const handleDealComplete = useCallback(
  //   (playerNumber: number) => {
  //     if (onDealComplete) {
  //       onDealComplete(playerNumber);
  //     } else {
  //       throw new Error(`${ERR_ID} - Invalid event handler for deal complete.`);
  //     }
  //   },
  //   [onDealComplete]
  // );

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
  }, [eventHandlers, initCardStates, initializeSortOrder, player, state]);

  /** Set cards states for animation to move player cards into position for the beginning of a new hand. */
  const handleBeginRegroupCards = useCallback(async () => {
    if (!handState) throw new Error(`${ERR_ID} - Invalid hand state for regroup player cards.`);

    addInitializeCardRegroupEvent(state, eventHandlers, player);
    setCardStateForRegroupHand();

    // const cardRefElements: HTMLElement[] = [];
    // cardRefs
    //   .values()
    //   .toArray()
    //   .forEach((c) => {
    //     if (c.current) cardRefElements.push(c.current);
    //   });

    // const destElement = playerDeckRefs.get(handState.location)?.current;
    // const relativeElement = getRelativeCenter(handState.location);

    // if (cardRefElements.length === 0)
    //   throw new Error('[CARD STATE] Invalid card elements for initialize card state.');
    // if (!destElement) throw new Error('[CARD STATE] Invalid destination element for initialize card state.');
    // if (!relativeElement) throw new Error('[CARD STATE] Invalid relative element for initialize card state.');

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
  }, [eventHandlers, handState, player, setCardStateForRegroupHand, state]);

  /** Run the animation states that were saved to regroup player hand for the beginning of a new hand. */
  const handleAnimateRegroupCards = useCallback(async () => {
    await runCardAnimations(animationControls);

    // slight delay to
    await gameDelay(euchreSettings);

    onDealComplete(player.playerNumber);

    //await runCardAnimations(animationControls);
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
  }, [animationControls, euchreSettings, onDealComplete, player.playerNumber]);

  const initCardHandlers: InitHandHandlers = {
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

  //#region Card Play Functions/Handlers Hook

  /** */
  const animateTakeTrick = useCallback(async () => {
    const lastCardPlayed: Card | undefined = cardPlayedForTrickRef.current.get(currentTrick.trickId);

    logConsole('[CARD STATE] [animateTrickFinished]', ' player: ', player.name);

    if (lastCardPlayed && handState && currentTrick.playerRenege) {
      // if player reneged, then don't animate taking the trick, and just call the event handler as if the animation was complete.
      onTrickComplete(lastCardPlayed);
    } else if (lastCardPlayed && handState && !currentTrick.playerRenege) {
      // animate trick being taken by the winner.

      const newAnimationControls = [...animationControls];
      const trickWonLocation = currentTrick.taker?.location;
      const cardElement = cardRefs.entries().find((r) => r[0] === lastCardPlayed.index)?.[1]?.current;
      const destinationDeckElement = playerDeckRefs
        .entries()
        .find((r) => r[0] === trickWonLocation)?.[1]?.current;

      if (!cardElement) throw new Error(`${ERR_ID} - Card element not found for animate trick.`);
      if (!destinationDeckElement)
        throw new Error(`${ERR_ID} - Destination element not found for animate trick.`);

      const animationState = animationStates.find((s) => s.cardIndex === lastCardPlayed.index);
      const animationControl = newAnimationControls.find((s) => s.cardIndex === lastCardPlayed.index);

      if (!animationState) throw new Error(`${ERR_ID} - Animation state not found for animate trick.`);
      if (!animationControl) throw new Error(`${ERR_ID} - Animation control not found for animate trick.`);

      const springContext: SpringContext = {
        sourceElement: cardElement,
        destinationElement: destinationDeckElement,
        currentSpring: animationControl.animateSprings.at(-1),
        gameSpeed: euchreSettings.gameSpeed
      };

      if (cardElement && destinationDeckElement && trickWonLocation) {
        const moveSpring = getSpringToMoveToPlayer(
          springContext,
          lastCardPlayed.index,
          animationState,
          animationControl,
          true
        );

        animationControl.animateSprings = moveSpring.animateSprings;

        await runCardAnimations([animationControl]);
      }

      setCardsAnimationControls(newAnimationControls);
      onTrickComplete(lastCardPlayed);
    }
  }, [
    animationControls,
    animationStates,
    cardRefs,
    currentTrick.playerRenege,
    currentTrick.taker?.location,
    currentTrick.trickId,
    euchreSettings,
    handState,
    onTrickComplete,
    player.name,
    playerDeckRefs,
    setCardsAnimationControls
  ]);

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
  const updateCardStateForTurn = useCallback(
    async (awaitingPlayerInput: boolean) => {
      if (!handState) throw new Error(`${ERR_ID} - Hand state not found for player turn.`);

      const newCardStates: CardBaseState[] = [...cardStates];
      const availableCards = getCardsAvailableIfFollowSuit().map((c) => c.index);

      for (const cardState of newCardStates) {
        const isAvailable: boolean = availableCards.includes(cardState.cardIndex);
        const cardEnabled = awaitingPlayerInput && isAvailable;
        const addOverlay = awaitingPlayerInput ? awaitingPlayerInput && !isAvailable : false;

        if (handState.shouldShowCardValue) {
          cardState.enabled = cardEnabled;
          cardState.cardFullName = getCardFullName(player.hand[cardState.cardIndex]);
          cardState.src = getEncodedCardSvg(player.hand[cardState.cardIndex], handState.location, addOverlay);
          cardState.renderKey = uuidv4();
        }
      }

      setCardStates(newCardStates);
    },
    [cardStates, getCardsAvailableIfFollowSuit, handState, player.hand, setCardStates]
  );

  /** Updates the card state to animate the card being played to the center of the table. Regroups the remaining cards together in the player's hand. */
  const setStatesForPlayCard = (cardIndex: number, cardElement: HTMLElement, tableElement: HTMLElement) => {
    logConsole(`${ERR_ID} - [setStatesForPlayCard] - card index: `, cardIndex);

    const newCardStates: CardBaseState[] = [...cardStates];
    const card = player.hand.find((c) => c.index === cardIndex);
    const currentProps: CardSpringProps[] = getAvailableCardsAndState(true);
    const cardWidthOffset = getWidth(cardElement, false);
    const newAnimationControls = [...animationControls];
    const animationState = animationStates.find((s) => s.cardIndex === cardIndex);

    if (!card) throw new Error();
    if (!animationState) throw new Error();

    const newSpringValues = getSpringsForCardPlayed(
      cardIndex,
      player,
      cardElement,
      tableElement,
      currentProps,
      animationState,
      euchreSettings.gameSpeed
    );

    const regroupHandValues = getSpringsGroupHand(
      player.location,
      cardWidthOffset,
      currentProps.filter((c) => c.cardIndex !== cardIndex)
    );

    for (const ctrl of newAnimationControls) {
      const newSpringVal = newSpringValues.cardSprings.find((c) => c.cardIndex === ctrl.cardIndex);
      const newFlipSpringVal = newSpringValues.flipSprings.find((c) => c.cardIndex === ctrl.cardIndex);
      const regroupVal = regroupHandValues.find((c) => c.cardIndex === ctrl.cardIndex);

      ctrl.animateSprings = [];
      ctrl.animateFlipSprings = [];

      if (newSpringVal) ctrl.animateSprings = newSpringVal.animateSprings;
      if (newFlipSpringVal) ctrl.animateFlipSprings = newFlipSpringVal.animateSprings;
      if (regroupVal) ctrl.animateSprings = regroupVal.animateSprings;
    }

    const cardState = newCardStates.find((s) => s.cardIndex === cardIndex);

    if (!cardState) throw new Error();
    cardState.renderKey = uuidv4();
    cardState.cardFullName = getCardFullName(card);
    cardState.src = getEncodedCardSvg(card, player.location);
    //await runCardAnimations(newAnimationControls);
    // group remaining cards.
    // retval.cardSprings.push(
    //   ...groupHand(
    //     player.location,
    //     cardWidthOffset,
    //     currentValues.filter((c) => c.cardIndex !== cardIndex)
    //   )
    // );

    // for (const val of newSpringValues) {
    //   const cardState = newCardStates.find((c) => c.cardIndex === val.cardIndex);

    //   if (!cardState) throw new Error('[CARD STATE] - Invalid card state');

    //   // cardState.springValue = val.springValue;
    //   cardState.renderKey = uuidv4();

    //   if (val.cardIndex === cardIndex) {
    //     // cardState.transition = getTransitionForCardMoved(cardState, euchreSettings.gameSpeed);
    //     cardState.cardFullName = getCardFullName(card);
    //     cardState.src = getEncodedCardSvg(card, location);
    //     //cardState.runEffectForState = EuchreGameFlow.BEGIN_PLAY_CARD;
    //   } else {
    //     // cardState.transition = undefined;
    //     //cardState.runEffectForState = undefined;
    //   }
    // }

    const trickId: string = euchreGame.currentTrick.trickId;
    cardPlayedForTrickRef.current.set(trickId, card);

    //onAnimationComplete.current = onCardPlayed;
    setCardStates(newCardStates);
    setCardsAnimationControls(newAnimationControls);
    // if (handState) {
    //   setHandState({
    //     ...handState,
    //     stateEffect: EuchreGameFlow.BEGIN_PLAY_CARD
    //   });
    // }

    //gameContext.animationHandlers.onCardPlayed(card);
  };

  /** */
  const handleDiscard = async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const handleReorderHand = useCallback(async () => {
    const cardElement = cardRefs.values().find((c) => c?.current)?.current;
    if (!cardElement)
      throw new Error(`${ERR_ID} - Invalid card element when reorder hand after trump named.`);

    logConsole(`${ERR_ID} - reorderHand for player: `, player.name);

    initializeSortOrder();
    await regroupCards(true, cardElement);
    updateCardStateForTurn(false);
  }, [cardRefs, initializeSortOrder, player.name, regroupCards, updateCardStateForTurn]);

  /** Update game state that a card was played, either auto played or selected by the user. */
  const handlePlayCard = (cardIndex: number) => {
    playedCardIndex.current = cardIndex;
    const card = player.hand[cardIndex];
    animationHandlers.onCardPlayed(card);
  };

  /** Sets the animation for the card to be played. On the callback when the animation is finished is when the state is updated with
   * the card that was played.
   */
  const handleBeginPlayCard = async () => {
    logConsole(`${ERR_ID} [handleBeginPlayCard] - useCardState.ts`);
    const currentState = cardStates.find((c) => c.cardIndex === playedCardIndex.current);
    const cardElement = cardRefs.get(playedCardIndex.current)?.current;

    if (!currentState || !cardElement)
      throw new Error(`${ERR_ID} [handleBeginPlayCard] - Invalid card state`);
    if (!handState) throw new Error(`${ERR_ID} [handlePlayCardAnimation] - Invalid hand state`);

    if (!playerTableCenterElement)
      throw new Error(`${ERR_ID} [handleBeginPlayCard] - Invalid player table center element.`);

    setStatesForPlayCard(playedCardIndex.current, cardElement, playerTableCenterElement);
  };

  /** */
  const handleAnimatePlayCard = async () => {
    await runCardAnimations(animationControls);
    animationHandlers.onCardPlayedComplete();
  };

  /** */
  const handleBeginPlayerTurn = useCallback(async () => {
    await updateCardStateForTurn(true);
  }, [updateCardStateForTurn]);

  /** */
  const handleEndPlayerTurn = useCallback(async () => {
    await updateCardStateForTurn(false);
  }, [updateCardStateForTurn]);

  /** */
  const handleTrickFinished = useCallback(async () => {
    await animateTakeTrick();
  }, [animateTakeTrick]);

  /** */
  const handlePassDeal = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, []);

  /** */
  const handleSittingOut = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
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

  const playHandHandler: PlayHandHandlers = {
    onPlayCard: handleBeginPlayCard,
    onDiscard: handleDiscard,
    onAnimatePlayCard: handleAnimatePlayCard,
    onPassDeal: handlePassDeal,
    onReorderHand: handleReorderHand,
    onPlayerSittingOut: handleSittingOut,
    onTrickFinished: handleTrickFinished,
    onBeginPlayerTurn: handleBeginPlayerTurn,
    onEndPlayerTurn: handleEndPlayerTurn
  };
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

  //#endregion

  /** ************************************************************************************************************************************* */

  const { getEffectForHandState } = useCardStateEffect(
    state,
    handState,
    currentTrick.trickId,
    refsReady,
    initCardHandlers,
    playHandHandler
  );

  //#region  UseEffect hooks

  useEffect(() => {
    const runCardStateEffect = async () => {
      const effectToRun = getEffectForHandState();

      if (effectToRun.func) {
        logConsole(
          `${ERR_ID} - Run Effect For Phase: ${effectToRun.statePhase} - Action: ${effectToRun.stateAction}`
        );
        await errorHandlers.catchAsync(effectToRun.func, errorHandlers.onError, 'runCardStateEffect');
      } else {
        logConsole(`${ERR_ID} - NO EFFECT WAS RUN`);
      }
    };

    runCardStateEffect();
  }, [errorHandlers, getEffectForHandState]);

  //#endregion

  return {
    playerCardsVisible,
    cardPlayedForTrickRef,
    cardRefs,
    handState,
    cardStates,
    animationControls,
    getCardsAvailableIfFollowSuit,
    getCardsToDisplay,
    handlePlayCard,
    updateCardStateForTurn,
    setRefsReady
  };
};

export default useCardAnimation;

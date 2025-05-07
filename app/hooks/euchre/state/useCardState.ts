import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Card, TableLocation } from '../../../lib/euchre/definitions/definitions';
import { CardState, PlayerHandState } from '../reducers/cardStateReducer';
import { EuchreGameFlow } from '../reducers/gameFlowReducer';
import useCardData from '../data/useCardData';
import useCardSvgData from '../data/useCardSvgData';
import useCardTransform, {
  CardPosition,
  CardSpringProps,
  CardSpringTarget,
  DEFAULT_SPRING_VAL
} from '../data/useCardTransform';
import useGameData from '../data/useGameData';
import usePlayerData from '../data/usePlayerData';
import { logConsole } from '../../../lib/euchre/util';
import {
  ErrorHandlers,
  EuchreGameState,
  EuchrePlayer
} from '../../../lib/euchre/definitions/game-state-definitions';
import useCardRefs from '../useCardRefs';
import { EuchrePauseType } from '../reducers/gamePauseReducer';
import { GameEventHandlers } from '../useEventLog';
import useGameCardStateEvents from '../events/useGameCardStateEvents';
import useAnimationCardState from '../phases/useAnimationCardState';

const useCardState = (
  state: EuchreGameState,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers,
  player: EuchrePlayer,

  directCenterHRef: RefObject<HTMLDivElement | null>,
  directCenterVRef: RefObject<HTMLDivElement | null>,

  /** map of player number to the player's card deck area element. */
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  onTrickComplete?: (card: Card) => void,
  onPassDeal?: (card: Card) => void,
  onCardPlayed?: (card: Card) => void,
  onDealComplete?: (playerNumber: number) => void
) => {
  //#region Hooks/Variables

  /** map of card index to reference to the card elements, used to calc spacing between cards when the screen is resized. */
  const cardRefs = useCardRefs(5);

  /** Map of trick id to card played for that trick. Used when rendering cards to be displayed. */
  const cardPlayedForTrickRef = useRef<Map<string, Card>>(new Map<string, Card>());

  const onAnimationComplete = useRef<undefined | ((card: Card) => void)>(undefined);

  /** Trick id where the the player's hand was re-grouped at the beginning of the player's turn. */
  const cardsRegroupedPlayerTurn = useRef<string[]>([]);

  /** Trick id where the the player's hand was re-grouped at the end of the player's turn. */
  const cardsRegroupedPlayerTurnEnd = useRef<string[]>([]);

  // trick ids where the animation was complete
  const trickAnimationHandled = useRef<string[]>([]);

  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [handState, setHandState] = useState<PlayerHandState | undefined>(undefined);

  /** Ordered card indices after the cards have been sorted/grouped */
  const initSortOrder = useRef<CardPosition[]>([]);
  const initCalculatedWidth = useRef(0);

  //#region Values used to prevent the same effect from triggering more than once.

  /** If the value is false, then the effect should be executed. Set to true to prevent from being executed again. */
  const [initForNewHandEffect, setInitForNewHandEffect] = useState(false);
  const [initCardStateCreated, setInitCardStateCreated] = useState(false);
  const [initForCardsRegroup, setInitForCardsRegroup] = useState(false);
  const initForCardsReorder = useRef(false);
  const initForSittingOut = useRef(false);
  const initAnimatePassDeal = useRef(false);
  //#endregion

  const {
    groupHand,
    getSpringsForCardPlayed,
    getRandomDamping,
    getRandomStiffness,
    getRandomRotation,
    getSpringsForCardInit,
    getCalculatedWidthOffset,
    getTransitionForCardMoved,
    getSpringsToMoveToPlayer,
    getSpringToMoveToPlayer,
    getBaseTransitionForCardMoved
  } = useCardTransform();

  const { getDisplayWidth, getDisplayHeight, cardEqual, sortCardsIndices, getCardBackSrc } = useCardData();
  const { playerEqual, availableCardsToPlay } = usePlayerData();
  const { getCardsAvailableToPlay, isHandFinished, playerSittingOut, gameDelay } = useGameData();
  const { getCardFullName, getEncodedCardSvg } = useCardSvgData();

  const { euchreGame, euchreGameFlow, euchreSettings, euchrePauseState } = state;
  const sittingOutPlayer = playerSittingOut(euchreGame);
  const playerIsSittingOut = sittingOutPlayer && playerEqual(player, sittingOutPlayer);
  const { addInitializeHandStateEvent, addInitializeCardStateEvent, addInitializeCardRegroupEvent } =
    useGameCardStateEvents(state, eventHandlers, player);
  const {
    shouldCreateHandState,
    shouldCreateCardState,
    shouldAnimateBeginPassDeal,
    shouldReorderHand,
    shouldAnimateTrickFinished,
    shouldRunEndUpdate,
    shoudUpdateCardStateForTurn
  } = useAnimationCardState(state);
  //#endregion

  /** ************************************************************************************************************************************* */

  //#region Functions/Methods

  const resetForNewHand = () => {
    setHandState(undefined);
    setCardStates([]);
    setInitForNewHandEffect(false);
    setInitCardStateCreated(false);
    setInitForCardsRegroup(false);
    initForCardsReorder.current = false;
    initAnimatePassDeal.current = false;
    initForSittingOut.current = false;
  };

  /** Get the element that's relative to the player's location that's used as an offset. */
  // const getRelativeCenter = useCallback(
  //   (location: TableLocation) => {
  //     if (location === 'top' || location === 'bottom') {
  //       return directCenterHRef.current;
  //     } else {
  //       return directCenterVRef.current;
  //     }
  //   },
  //   [directCenterHRef, directCenterVRef]
  // );

  const handleDealComplete = useCallback(
    (playerNumber: number) => {
      if (onDealComplete) {
        onDealComplete(playerNumber);
      } else {
        throw new Error('Invalid event handler for deal complete.');
      }
    },
    [onDealComplete]
  );

  const handlePassDealComplete = useCallback(
    (card: Card) => {
      if (onPassDeal) {
        onPassDeal(card);
      } else {
        throw new Error('Invalid event handler for pass deal complete.');
      }
    },
    [onPassDeal]
  );

  /** Create and set the initial hand state for the player's hand. */
  const setInitialPlayerHandState = useCallback(() => {
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
  }, [
    euchreGame.handId,
    euchreGameFlow.shouldShowCardValuesForHand,
    getDisplayHeight,
    getDisplayWidth,
    player,
    playerEqual
  ]);

  /** Set initial card state used when animation of cards being played. */
  const setInitialCardStates = useCallback((): void => {
    const retval: CardState[] = [];
    const cardBackSvgSrc: string = getCardBackSrc(player.location);

    for (const card of player.hand) {
      retval.push({
        cardIndex: card.index,
        src: cardBackSvgSrc,
        cardFullName: `Player ${player.playerNumber} Card`,
        initSpringValue: getSpringsForCardInit(player),
        xDamping: getRandomDamping(),
        xStiffness: getRandomStiffness(),
        yDamping: getRandomDamping(),
        yStiffness: getRandomStiffness(),
        rotation: getRandomRotation(),
        enabled: false
      });
    }

    setCardStates(retval);
  }, [
    getCardBackSrc,
    getRandomDamping,
    getRandomRotation,
    getRandomStiffness,
    getSpringsForCardInit,
    player
  ]);

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
        const state = cardStates.find((s) => s.cardIndex === indexPosition.cardIndex);
        if (!state) throw new Error('Card state not found when getting available cards/state.');

        currentProps.push({
          ordinalIndex: indexPosition.ordinalIndex,
          cardIndex: indexPosition.cardIndex,
          springValue:
            state.springValue ??
            (state.initSpringValue ? { ...state.initSpringValue } : { ...DEFAULT_SPRING_VAL })
        });
      }

      return currentProps;
    },
    [availableCardsToPlay, cardStates, euchreGame.maker, euchreGame.trump, player, sortCardsIndices]
  );

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
  }, [
    availableCardsToPlay,
    euchreGame.currentTrick.cardsPlayed,
    euchreGame.trump,
    euchreSettings.enforceFollowSuit,
    getCardsAvailableToPlay,
    player
  ]);

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

  /** Set the sort order for the player's hand. Used to display the suits grouped together and trump first. */
  const initializeSortOrder = useCallback(() => {
    const availableCards: Card[] = availableCardsToPlay(player);
    const orderedIndices: CardPosition[] = sortCardsIndices(
      availableCards,
      euchreGame.maker ? euchreGame.trump : null
    );
    initSortOrder.current = orderedIndices;
  }, [availableCardsToPlay, player, sortCardsIndices, euchreGame.maker, euchreGame.trump]);

  /** Re-adjusts the player's hand that are displayed. Used after a player plays a card and to group the cards together. */
  const regroupCards = useCallback(
    (useInitSortOrder: boolean, cardRef: HTMLDivElement) => {
      const newCardStates: CardState[] = [...cardStates];
      const currentProps: CardSpringProps[] = getAvailableCardsAndState(useInitSortOrder);

      if (initCalculatedWidth.current === 0) {
        initCalculatedWidth.current = getCalculatedWidthOffset(cardRef);
      }

      const newProps: CardSpringProps[] = groupHand(
        player.location,
        initCalculatedWidth.current,
        currentProps
      );

      for (const cardState of newCardStates) {
        const tempVal = newProps.find((p) => p.cardIndex === cardState.cardIndex)?.springValue;

        if (!tempVal) throw new Error('Logic error in regroup cards. New card state not found.');
        cardState.springValue = tempVal;
      }

      setCardStates(newCardStates);
    },
    [cardStates, getAvailableCardsAndState, getCalculatedWidthOffset, groupHand, player]
  );

  /**
   * Update the game deck state to handle animation complete for game flow end deal for dealer.
   */
  const setHandStateForPassDeal = useCallback(() => {
    onAnimationComplete.current = handlePassDealComplete;
  }, [handlePassDealComplete]);

  /** Animate cards going to a player side of the game board after cards have been dealt.
   *
   */
  const moveCardsToPlayer = useCallback(
    (destinationPlayer: EuchrePlayer) => {
      setCardStates((prev) => {
        const newState = [...prev];
        const destRef = playerDeckRefs.get(destinationPlayer.location);

        if (!destRef?.current) throw new Error('Invalid destination ref to move cards to dealer');

        const springsToMove = getSpringsToMoveToPlayer(
          cardRefs,
          destRef.current,
          destinationPlayer.location,
          cardStates,
          true,
          euchreSettings.gameSpeed
        );

        for (const cardState of newState) {
          const spring = springsToMove.at(cardState.cardIndex);

          if (spring) {
            cardState.runEffectForState = EuchreGameFlow.BEGIN_PASS_DEAL;
            cardState.springValue = spring.springValue;
          }

          cardState.location = destinationPlayer.location;
        }

        return newState;
      });
    },
    [cardRefs, cardStates, getSpringsToMoveToPlayer, playerDeckRefs, euchreSettings.gameSpeed]
  );

  /**
   * At the beginning of a player's turn, update the card state to enable/disable cards and overlay
   * depending on settings.
   */
  const updateCardStateForTurn = useCallback(() => {
    if (!handState) throw new Error('Hand state not found - [updateCardStateForTurn]');

    const newCardStates: CardState[] = [...cardStates];
    const awaitingPlayer = playerEqual(euchreGame.currentPlayer, player) && shoudUpdateCardStateForTurn;
    const availableCards = getCardsAvailableIfFollowSuit().map((c) => c.index);

    for (const cardState of newCardStates) {
      const isAvailable: boolean = availableCards.includes(cardState.cardIndex);
      const cardEnabled = awaitingPlayer && isAvailable;
      const addOverlay = awaitingPlayer ? awaitingPlayer && !isAvailable : false;

      if (handState.shouldShowCardValue) {
        cardState.enabled = cardEnabled;
        cardState.cardFullName = getCardFullName(player.hand[cardState.cardIndex]);
        cardState.src = getEncodedCardSvg(player.hand[cardState.cardIndex], handState.location, addOverlay);
      }
    }

    setCardStates(newCardStates);
  }, [
    cardStates,
    euchreGame.currentPlayer,
    getCardFullName,
    getCardsAvailableIfFollowSuit,
    getEncodedCardSvg,
    handState,
    player,
    playerEqual,
    shoudUpdateCardStateForTurn
  ]);

  /** Sets the animation for the card to be played. On the callback when the animation is finished is when the state is updated with
   * the card that was played.
   */
  const handlePlayCardAnimation = (cardIndex: number, playerTableRef: HTMLDivElement) => {
    logConsole('[handlePlayCardAnimation] - useCardState.ts');
    const currentState = cardStates.find((c) => c.cardIndex === cardIndex);
    const cardRef = cardRefs.get(cardIndex);

    if (!currentState || !cardRef?.current) throw new Error('Invalid card state - [handlePlayCardAnimation]');
    if (!handState) throw new Error('Invalid hand state - [handlePlayCardAnimation]');

    playCard(cardIndex, cardRef.current, playerTableRef, currentState.rotation ?? 0);
  };

  /** Updates the card state to animate the card being played to the center of the table. Regroups the remaining cards together in the player's hand. */
  const playCard = (
    cardIndex: number,
    cardRef: HTMLDivElement,
    tableRef: HTMLDivElement | undefined,
    rotation: number
  ) => {
    logConsole('[CARD STATE] [playCard] - useCardState.ts ');

    const newCardStates: CardState[] = [...cardStates];
    const card = player.hand[cardIndex];
    const location = player.location;
    const currentProps: CardSpringProps[] = getAvailableCardsAndState(true);
    const cardWidthOffset = initCalculatedWidth.current;

    const newSprungValues = getSpringsForCardPlayed(
      cardIndex,
      player,
      cardRef,
      tableRef,
      rotation,
      currentProps,
      cardWidthOffset
    );

    for (const val of newSprungValues) {
      const cardState = newCardStates.find((c) => c.cardIndex === val.cardIndex);

      if (!cardState) throw new Error('Invalid card state');

      cardState.springValue = val.springValue;

      if (val.cardIndex === cardIndex) {
        cardState.springValue.transition = getTransitionForCardMoved(cardState, euchreSettings.gameSpeed);
        cardState.cardFullName = getCardFullName(card);
        cardState.src = getEncodedCardSvg(card, location);
        cardState.runEffectForState = EuchreGameFlow.BEGIN_PLAY_CARD;
      } else {
        cardState.springValue.transition = undefined;
        cardState.runEffectForState = undefined;
      }
    }

    const trickId: string = euchreGame.currentTrick.trickId;
    cardPlayedForTrickRef.current.set(trickId, card);

    onAnimationComplete.current = onCardPlayed;
    setCardStates(newCardStates);
    if (handState) {
      setHandState({
        ...handState,
        stateEffect: EuchreGameFlow.BEGIN_PLAY_CARD
      });
    }
  };

  /** Animates flipping a player's hand so the card values are visible. */
  const animateFlipPlayerHand = useCallback(() => {
    const newCardStates: CardState[] = [...cardStates];
    const location = player.location;

    for (const cardState of newCardStates) {
      const card = player.hand[cardState.cardIndex];

      cardState.cardFullName = getCardFullName(card);
      cardState.src = getEncodedCardSvg(card, location);

      if (cardState.springValue) {
        cardState.springValue = {
          ...cardState.springValue,
          rotateX: 0,
          rotateY: 0,
          transition: { rotateY: { duration: 0.3 }, rotateX: { duration: 0.3 } }
        };
      }
    }

    setCardStates(newCardStates);
  }, [cardStates, getCardFullName, getEncodedCardSvg, player.hand, player.location]);

  //#endregion

  /** ************************************************************************************************************************************* */

  //#region  UseEffect hooks

  useEffect(() => {
    const shouldRecreateHandState = handState !== undefined && handState.handId !== euchreGame.handId;

    if (shouldRecreateHandState) {
      resetForNewHand();
    }
  }, [handState, euchreGame.handId]);

  /** Set initial hand state after cards have been dealt. */
  useEffect(() => {
    const createHandState = shouldCreateHandState && !initForNewHandEffect;

    if (createHandState) {
      setInitForNewHandEffect(true);
      addInitializeHandStateEvent();
      setInitialPlayerHandState();
    }
  }, [
    addInitializeHandStateEvent,
    initForNewHandEffect,
    player,
    setInitialPlayerHandState,
    shouldCreateHandState
  ]);

  /** Create initial card state once cards have been dealt.
   *
   */
  useEffect(() => {
    const createCardState = handState !== undefined && !initCardStateCreated && shouldCreateCardState;

    if (createCardState) {
      setInitCardStateCreated(true);
      addInitializeCardStateEvent();
      initializeSortOrder();
      setInitialCardStates();
    }
  }, [
    addInitializeCardStateEvent,
    handState,
    initCardStateCreated,
    initializeSortOrder,
    setInitialCardStates,
    shouldCreateCardState
  ]);

  /** Re-groups/adjusts the player's hand so it displayed fanned as if the player was holding them. Once the
   * animation completes, executes the function to proceed to the next game state.
   */
  useEffect(() => {
    const beginRegroupCards = async () => {
      const beginRegroup = initCardStateCreated && !initForCardsRegroup;

      if (beginRegroup) {
        setInitForCardsRegroup(true);
        addInitializeCardRegroupEvent();

        const cardRef = cardRefs.values().find((c) => c?.current)?.current;
        if (!cardRef) throw new Error('Invalid card ref when setting initial animation.');

        const delay = (euchreSettings.gameSpeed * player.team) / 2;
        await new Promise((resolve) => setTimeout(resolve, delay));
        regroupCards(false, cardRef);
        await beginFlipCards();
        handleDealComplete(player.playerNumber);
        await gameDelay(euchreSettings);
      }
    };

    const beginFlipCards = async () => {
      // flip cards over to see their values if enabled for the current player.
      if (handState?.shouldShowCardValue) {
        await gameDelay(euchreSettings);
        animateFlipPlayerHand();
      }
    };

    beginRegroupCards();
  }, [
    addInitializeCardRegroupEvent,
    animateFlipPlayerHand,
    cardRefs,
    gameDelay,
    handState?.shouldShowCardValue,
    handleDealComplete,
    initCardStateCreated,
    initForCardsRegroup,
    player.playerNumber,
    player.team,
    regroupCards,
    euchreSettings
  ]);

  /** If deal is passed then send cards to next player. */
  useEffect(() => {
    const animatePassDeal = !initAnimatePassDeal.current && shouldAnimateBeginPassDeal;

    if (animatePassDeal) {
      initAnimatePassDeal.current = true;
      setHandStateForPassDeal();
      moveCardsToPlayer(euchreGame.dealer);
    }
  }, [moveCardsToPlayer, setHandStateForPassDeal, shouldAnimateBeginPassDeal, euchreGame.dealer]);

  /** Re-order player's hand once trump has been set. */
  useEffect(() => {
    const reorderHand = !initForCardsReorder.current && shouldReorderHand;

    if (reorderHand) {
      initForCardsReorder.current = true;

      const cardRef = cardRefs.values().find((c) => c?.current)?.current;
      if (!cardRef) throw new Error('Invalid card ref when reorder hand after trump named.');

      if (handState?.shouldShowCardValue && !playerIsSittingOut) {
        initializeSortOrder();
        regroupCards(true, cardRef);
        updateCardStateForTurn();
      }
    }
  });

  /** If the player is sitting out, set the animation to set the cards back to their initial state, then fade out.
   *
   */
  useEffect(() => {
    const beginSittingOut = async () => {
      if (!initForSittingOut.current && playerIsSittingOut) {
        initForSittingOut.current = true;

        const baseTransition = getBaseTransitionForCardMoved(euchreSettings.gameSpeed);
        cardStates.forEach(
          (s) =>
            (s.springValue = s.springValue
              ? { ...s.springValue, x: 0, y: 0, rotate: 0, transition: baseTransition }
              : { ...DEFAULT_SPRING_VAL })
        );
        await gameDelay(euchreSettings);
        cardStates.forEach((s) => (s.springValue = { ...getSpringsForCardInit(player), opacity: 0 }));
      }
    };

    beginSittingOut();
  }, [
    cardStates,
    gameDelay,
    getBaseTransitionForCardMoved,
    getSpringsForCardInit,
    player,
    playerIsSittingOut,
    euchreSettings
  ]);

  /** Animate the cards going to the trick winner's card area after the trick is complete.
   *
   */
  useEffect(() => {
    const currentTrick = euchreGame.currentTrick;

    const animateTrickFinished =
      onTrickComplete &&
      !trickAnimationHandled.current.find((s) => s === currentTrick.trickId) &&
      shouldAnimateTrickFinished;

    if (animateTrickFinished) {
      trickAnimationHandled.current.push(currentTrick.trickId);
      const lastCardPlayed: Card | undefined = cardPlayedForTrickRef.current.get(currentTrick.trickId);

      logConsole('[useEffect] - useCardState.ts - onTrickComplete handler run for card: ');

      if (lastCardPlayed && handState && currentTrick.playerRenege) {
        // if player renged, then don't animate taking the trick, and just call the event handler as if the animation was complete.
        onAnimationComplete.current = undefined;
        onTrickComplete(lastCardPlayed);
      } else if (lastCardPlayed && handState && !currentTrick.playerRenege) {
        // animate trick being taken by the winner.

        const cardIndex = lastCardPlayed.index;
        const trickWonLocation = currentTrick.taker?.location;
        const newCardState = [...cardStates];

        // reset effect state for each card.
        newCardState.forEach((s) => (s.runEffectForState = undefined));

        const cardState = newCardState.find((c) => c.cardIndex === cardIndex);
        const currentSpring = cardState?.springValue;
        const cardRef = cardRefs.entries().find((r) => r[0] === cardIndex)?.[1]?.current;
        const destinationDeckRef = playerDeckRefs
          .entries()
          .find((r) => r[0] === trickWonLocation)?.[1]?.current;
        let newSpring: CardSpringTarget;

        if (currentSpring && cardRef && destinationDeckRef && trickWonLocation) {
          newSpring = getSpringToMoveToPlayer(
            cardRef,
            destinationDeckRef,
            trickWonLocation,
            cardState,
            true,
            euchreSettings.gameSpeed
          ).springValue;

          cardState.springValue = newSpring;
          cardState.runEffectForState = EuchreGameFlow.TRICK_FINISHED;

          setHandState({
            ...handState,
            stateEffect: EuchreGameFlow.TRICK_FINISHED
          });

          onAnimationComplete.current = (card: Card) => onTrickComplete(card);
          setCardStates(newCardState);
        }
      }
    }
  }, [
    cardRefs,
    cardStates,
    euchreGame.currentTrick,
    euchreSettings.gameSpeed,
    getSpringToMoveToPlayer,
    handState,
    onTrickComplete,
    playerDeckRefs,
    shouldAnimateTrickFinished
  ]);

  /** Update the player's hand at beginning of the player's turn during regular game play. */
  useEffect(() => {
    const shouldRunBeginUpdate =
      !cardsRegroupedPlayerTurn.current.includes(euchreGame.currentTrick.trickId) &&
      euchrePauseState.pauseType === EuchrePauseType.USER_INPUT &&
      playerEqual(player, euchreGame.currentPlayer) &&
      handState &&
      cardRefs;

    if (shouldRunBeginUpdate) {
      logConsole("[useEffect] - useCardState.ts - beginning hand update player's hand - Player: ");
      cardsRegroupedPlayerTurn.current.push(euchreGame.currentTrick.trickId);
      const cardRef = cardRefs.get(0);

      if (cardRef) updateCardStateForTurn();
    }
  }, [
    cardRefs,
    handState,
    player,
    playerEqual,
    euchreGame.currentPlayer,
    euchreGame.currentTrick.trickId,
    euchrePauseState.pauseType,
    updateCardStateForTurn
  ]);

  /** Update the player's hand at end of the player's turn during regular game play.
   *
   */
  useEffect(() => {
    const runEndUpdate =
      !cardsRegroupedPlayerTurnEnd.current.includes(euchreGame.currentTrick.trickId) &&
      shouldRunEndUpdate &&
      playerEqual(player, euchreGame.currentPlayer) &&
      handState &&
      cardRefs;

    if (runEndUpdate) {
      logConsole('[useEffect] - [runEndUpdate] useCardState.ts');
      cardsRegroupedPlayerTurnEnd.current.push(euchreGame.currentTrick.trickId);
      const cardRef = cardRefs.get(0);

      if (cardRef) updateCardStateForTurn();
    }
  }, [
    cardRefs,
    euchreGame.currentPlayer,
    euchreGame.currentTrick.trickId,
    handState,
    player,
    playerEqual,
    shouldRunEndUpdate,
    updateCardStateForTurn
  ]);

  //#endregion

  return {
    initCardStateCreated,
    cardPlayedForTrickRef,
    cardRefs,
    handState,
    cardStates,
    onAnimationComplete,
    getCardsAvailableIfFollowSuit,
    getCardsToDisplay,
    handlePlayCardAnimation,
    cardEqual,
    playerEqual,
    getDisplayWidth,
    getDisplayHeight
  };
};

export default useCardState;

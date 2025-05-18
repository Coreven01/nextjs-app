import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  EuchrePlayer,
  CardAnimationControls,
  CardBaseState,
  InitDealHandlers,
  DealForDealerHandlers,
  RegularDealHandlers,
  DeckState,
  GamePlayContext
} from '../../../../lib/euchre/definitions/game-state-definitions';
import useCardRefs from '../../useCardRefs';
import { TableLocation } from '../../../../lib/euchre/definitions/definitions';
import useTableRef from '../../useTableRefs';
import { GAME_STATES_FOR_DEAL, GAME_STATES_FOR_PLAY } from '../../../../lib/euchre/util/gameStateLogicUtil';
import { logConsole } from '../../../../lib/euchre/util/util';
import { getDisplayHeight, getDisplayWidth } from '../../../../lib/euchre/util/cardDataUtil';
import {
  addAnimateForBeginDealForDealerEvent,
  addAnimateForDealForRegularPlayEvent,
  addResetForDealerEvent
} from '../../../../lib/euchre/util/deck/deckStateEventsUtil';
import { gameDelay, notificationDelay } from '../../../../lib/euchre/util/gameDataUtil';
import {
  CardSpringProps,
  CardSpringTarget,
  DEFAULT_SPRING_VAL,
  FlipSpringProps,
  FlipSpringTarget
} from '../../../../lib/euchre/definitions/transform-definitions';
import { v4 as uuidv4 } from 'uuid';
import {
  getCardsStatesRegularDeal,
  getCardStatesMoveToPlayer,
  getSpringInitialMoveForDeal,
  getStatesAnimateDealForDealer,
  getStatesMoveAllCardsToPlayer
} from '../../../../lib/euchre/util/deck/deckTransformUtil';
import useDeckState from '../../state/useDeckState';
import useDeckStateEffect from './useDeckStateEffect';
import { useAnimation } from 'framer-motion';
import { createCardBaseState, runCardAnimations } from '../../../../lib/euchre/util/cardStateUtil';
import { InitDealResult } from '../../../../lib/euchre/definitions/logic-definitions';

/** Hook to handle animation dealing cards from a player's point of view.
 *  If animation is disabled from settings, then this hook shouldn't be doing anything. */
const useDeckAnimation = (
  gameContext: GamePlayContext,
  initDealer: InitDealResult | null,
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  directCenterHRef: RefObject<HTMLDivElement | null>,
  directCenterVRef: RefObject<HTMLDivElement | null>
) => {
  const { state, eventHandlers, errorHandlers, animationHandlers } = gameContext;
  const { euchreGame, euchreSettings, euchreGameFlow } = state;
  const [renderKey, setRenderKey] = useState<string>('');

  /** Game deck state of values used when rendering the game deck and for animation. */
  const [deckState, setDeckState] = useState<DeckState | undefined>();
  const deckAnimationControls = useAnimation();

  const {
    stateContext,
    setDeckCardsAnimationControls,
    setDeckCardStates,
    setDeckCardsAnimationStates,
    createStates
  } = useDeckState();

  const { cardStates, animationControls, animationStates } = stateContext;

  /** Elements associated with a player's area, outside of the table. */
  const playerDeckRefs = useTableRef();

  /** Elements associated with a player's area, closer to the center of the table. */
  const playerInnerDeckRefs = useTableRef();

  /** map of card index to reference to the card elements, used to calc transitions between elements */
  const deckCardRefs = useCardRefs(24);

  /** game deck cards are conditionally rendered. used to prevent animation of cards before they have been rendered. */
  const [refsReady, setRefsReady] = useState(false);
  const dealAnimationEnabled = euchreSettings.shouldAnimateDeal;

  /** Reference to the element containing the deck of cards to be dealt. */
  const gameDeckRef = useRef<HTMLDivElement>(null);
  const gameDeckVisible = dealAnimationEnabled && GAME_STATES_FOR_DEAL.includes(euchreGameFlow.gameFlow);
  const gameHandVisible =
    euchreGameFlow.hasGameStarted && GAME_STATES_FOR_PLAY.includes(euchreGameFlow.gameFlow);

  /** ************************************************************************************************************************************* */

  /** */
  const handleRefChange = useCallback(
    (ready: boolean) => {
      logConsole('********** REF CHANGE: ', ready);
      setRefsReady(ready);
    },
    [setRefsReady]
  );

  /** Get the element that's relative to the player's location that's used as an offset. This is either a vertical or horizontal
   * element that bisects the game table.
   */
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

  /** Update state values to the new values passed as parameters. */
  const updateCardBaseAndAnimationSprings = useCallback(
    (controls: CardAnimationControls[], cardStates: CardBaseState[], updatedSprings: CardSpringProps[]) => {
      const newAnimationControls = [...controls];

      for (const newAnimation of updatedSprings) {
        const current = newAnimationControls.find((c) => c.cardIndex === newAnimation.cardIndex);
        if (current) {
          current.animateValues = newAnimation.animateValues;
        }
      }

      setDeckCardStates(cardStates);
      setDeckCardsAnimationControls(newAnimationControls);
    },
    [setDeckCardStates, setDeckCardsAnimationControls]
  );

  //#region Deck State Reset Effect Hook

  const createInitDeckState = useCallback(() => {
    const location: TableLocation = euchreGame.dealer.location;

    const newGameDeckState: DeckState = {
      deck: euchreGame.deck,
      cardRefs: deckCardRefs,
      location: location,
      playerNumber: euchreGame.dealer.playerNumber,
      initSpringValue: { x: 0, y: 0, opacity: 0, rotate: 0 },
      handId: euchreGame.handId,
      gameId: euchreGame.gameId,
      width: getDisplayWidth(location),
      height: getDisplayHeight(location)
    };

    return newGameDeckState;
  }, [
    deckCardRefs,
    euchreGame.dealer.location,
    euchreGame.dealer.playerNumber,
    euchreGame.deck,
    euchreGame.gameId,
    euchreGame.handId
  ]);

  /**
   * Initialize game deck state for beginning a new deal.
   */
  const initDeckStateForNewDealer = useCallback(async () => {
    const deckStateExists = deckState !== undefined;

    if (deckStateExists) {
      await deckAnimationControls.start({
        x: 0,
        y: 0,
        rotate: 0,
        opacity: 0,
        transition: { duration: 0.01 }
      });
    }

    setDeckState(createInitDeckState());
    setRenderKey(uuidv4());
  }, [createInitDeckState, deckAnimationControls, deckState]);

  /** */
  const initCardStatesForNewCardState = useCallback(
    (includeCardValue: boolean) => {
      const location: TableLocation = euchreGame.dealer.location;
      const centerLocation: boolean = location === 'top' || location === 'bottom';
      const initSpringValue: CardSpringTarget = {
        ...DEFAULT_SPRING_VAL
      };

      const initFlipSpringValue: FlipSpringTarget = {
        rotateY: centerLocation ? 180 : 0,
        rotateX: centerLocation ? 0 : 180
      };

      const initSpringValues: CardSpringProps[] = euchreGame.deck.map((c) => {
        return {
          cardIndex: c.index,
          ordinalIndex: c.index,
          animateValues: [],
          initialValue: initSpringValue
        };
      });

      const initFlipSpringValues: FlipSpringProps[] = euchreGame.deck.map((c) => {
        return {
          cardIndex: c.index,
          ordinalIndex: c.index,
          animateValues: [],
          initialValue: initFlipSpringValue
        };
      });

      const initStates = createStates(
        euchreGame.deck,
        location,
        includeCardValue,
        initSpringValues,
        initFlipSpringValues,
        true
      );
      setDeckCardStates(initStates.cardStates);
      setDeckCardsAnimationControls(initStates.animationControls);
      setDeckCardsAnimationStates(initStates.animationCardStates);
    },
    [
      createStates,
      euchreGame.dealer.location,
      euchreGame.deck,
      setDeckCardStates,
      setDeckCardsAnimationControls,
      setDeckCardsAnimationStates
    ]
  );

  /**
   * Initialize game deck state and card state for beginning a new deal.
   */
  const initCardStatesForNewDealer = useCallback(
    async (includeCardValue: boolean) => {
      const location: TableLocation = euchreGame.dealer.location;
      const cardStatesExist = cardStates.length > 0;
      const initSpringValue: CardSpringTarget = {
        ...DEFAULT_SPRING_VAL
      };

      if (!cardStatesExist) {
        initCardStatesForNewCardState(includeCardValue);
      } else {
        const newCardState = euchreGame.deck.map((card) => {
          return createCardBaseState(card, location, includeCardValue);
        });

        setDeckCardStates(newCardState);

        const resetSpring: CardSpringTarget = { ...initSpringValue, transition: { duration: 0.01 } };
        for (const animationControl of animationControls) {
          await animationControl.controls?.start(resetSpring);
        }
      }
    },
    [
      animationControls,
      cardStates.length,
      euchreGame.dealer.location,
      euchreGame.deck,
      initCardStatesForNewCardState,
      setDeckCardStates
    ]
  );

  /**
   * Create the animation values for the cards being dealt for initial deal.
   * */
  const setCardStatesForAnimateDealForDealer = useCallback(() => {
    if (!deckState) throw new Error('[DECK STATE] - Invalid deck state for dealing cards.');

    const directCenterH = directCenterHRef.current;
    const directCenterV = directCenterVRef.current;

    if (!directCenterH) throw new Error('[DECK STATE] - Invalid direct center ref for initializing deal.');
    if (!directCenterV) throw new Error('[DECK STATE] - Invalid direct center ref for initializing deal.');
    if (!initDealer) throw new Error('[DECK STATE] - Invalid deal result for dealing cards.');

    const newStates = getStatesAnimateDealForDealer(
      cardStates,
      animationStates,
      euchreGame,
      euchreSettings.gameSpeed,
      directCenterH,
      directCenterV,
      outerTableRefs,
      deckCardRefs,
      initDealer
    );

    updateCardBaseAndAnimationSprings(animationControls, newStates.newState, newStates.springsForDeal);
  }, [
    deckCardRefs,
    cardStates,
    animationControls,
    animationStates,
    directCenterHRef,
    directCenterVRef,
    euchreGame,
    euchreSettings.gameSpeed,
    deckState,
    initDealer,
    outerTableRefs,
    updateCardBaseAndAnimationSprings
  ]);

  /** Move the deck element from its absolute postion to the dealer card area. Then animate the deck into a visible area
   * to prepare the deck cards for being dealt.
   */
  const animateMoveCardsIntoPosition = useCallback(async () => {
    if (!deckState) throw new Error('[DECK STATE] - Invalid game deck state for initializing deal.');

    const destRef = playerDeckRefs.get(deckState.location);
    const directCenterRef = getRelativeCenter(deckState.location);

    if (!destRef?.current) throw new Error('[DECK STATE] - Invalid destination ref for initializing deal.');
    if (!gameDeckRef.current) throw new Error('[DECK STATE] - Invalid game deck ref for initializing deal.');
    if (!directCenterRef) throw new Error('[DECK STATE] - Invalid direct center ref for initializing deal.');

    const initialMoves = getSpringInitialMoveForDeal(
      destRef.current,
      directCenterRef,
      gameDeckRef.current,
      euchreSettings.gameSpeed
    );

    setRenderKey(uuidv4());

    await deckAnimationControls.start(initialMoves.initMoveToDealer);
    await deckAnimationControls.start(initialMoves.moveIntoView);
  }, [deckAnimationControls, euchreSettings.gameSpeed, deckState, getRelativeCenter, playerDeckRefs]);

  /** Reset the deck state to deal a new set of cards. */
  const handleCreateDealStates = useCallback(async () => {
    addResetForDealerEvent(state, eventHandlers);
    await initDeckStateForNewDealer();
    await initCardStatesForNewDealer(false);
  }, [eventHandlers, initCardStatesForNewDealer, initDeckStateForNewDealer, state]);

  const initDealHandlers: InitDealHandlers = {
    onDealerChanged: () => new Promise<void>((resolve) => setTimeout(resolve, 25)),
    onStateCreating: handleCreateDealStates
  };

  //#endregion

  /** ************************************************************************************************************************************* */

  //#region Deck State Deal For Dealer Effect Hook

  /** Handler to move cards into position for initial deal and set state to animate cards being dealt for initial dealer. */
  const handleMoveCardsIntoPositionDealForDealer = useCallback(async () => {
    addAnimateForBeginDealForDealerEvent(true, !dealAnimationEnabled, state, eventHandlers);

    await animateMoveCardsIntoPosition();

    // set the card states for animation for the next state phase. This is set here so the next phase will have the latest
    // animations values already saved.
    setCardStatesForAnimateDealForDealer();
  }, [
    dealAnimationEnabled,
    setCardStatesForAnimateDealForDealer,
    eventHandlers,
    animateMoveCardsIntoPosition,
    state
  ]);

  /** Set card states to animate cards going to a player side of the game board after cards have been dealt.
   */
  const setCardStateMoveCardsToPlayer = useCallback(
    (destinationPlayer: EuchrePlayer) => {
      const destRef = playerDeckRefs.get(destinationPlayer.location);
      if (!destRef?.current)
        throw new Error('[DECK STATE] - Invalid destination ref to move cards to dealer');

      const newStates = getStatesMoveAllCardsToPlayer(
        stateContext,
        destinationPlayer.location,
        destRef.current,
        deckCardRefs,
        euchreSettings.gameSpeed
      );

      updateCardBaseAndAnimationSprings(animationControls, newStates.newCardStates, newStates.springsToMove);
    },
    [
      animationControls,
      deckCardRefs,
      euchreSettings.gameSpeed,
      playerDeckRefs,
      stateContext,
      updateCardBaseAndAnimationSprings
    ]
  );

  /** Animate cards being dealt for initial dealer. */
  const handleBeginAnimationBeginDealForDealer = useCallback(async () => {
    if (!initDealer?.newDealer)
      throw new Error('[DECK STATE] - Invalid deal result for animation deal for dealer.');

    await runCardAnimations(animationControls);
    setCardStateMoveCardsToPlayer(initDealer.newDealer);
    animationHandlers.onBeginDealForDealerComplete();
  }, [animationHandlers, animationControls, initDealer?.newDealer, setCardStateMoveCardsToPlayer]);

  /** Updates state that the animation for cards being dealt is complete. This event is separated
   * because the number of cards to be dealt during intial deal is dynamic.
   */
  const handleEndAnimationBeginDealForDealer = useCallback(async () => {
    addAnimateForBeginDealForDealerEvent(false, !dealAnimationEnabled, state, eventHandlers);

    // delay for an on-screen indicator of who the next dealer will be.
    await notificationDelay(euchreSettings);
    await runCardAnimations(animationControls);

    animationHandlers.onEndDealForDealerComplete();
  }, [animationHandlers, dealAnimationEnabled, animationControls, euchreSettings, eventHandlers, state]);

  const dealForDealerHandlers: DealForDealerHandlers = {
    onMoveCardsIntoPosition: handleMoveCardsIntoPositionDealForDealer,
    onStartDealCards: handleBeginAnimationBeginDealForDealer,
    onEndDealCards: handleEndAnimationBeginDealForDealer,
    onMoveCardsToPlayer: () => new Promise<void>((resolve) => setTimeout(resolve, 25))
  };
  //#endregion

  /** ************************************************************************************************************************************* */

  //#region Deck State Deal For Regular Play Effect Hook

  /** Create the animation values for the cards being dealt for regular play.
   */
  const setCardStateForDealCardsForRegularPlay = useCallback(() => {
    const directCenterH = directCenterHRef.current;
    const directCenterV = directCenterVRef.current;

    if (!directCenterH)
      throw new Error('[DECK STATE] - Invalid direct center ref for dealing cards for regular play.');
    if (!directCenterV)
      throw new Error('[DECK STATE] - Invalid direct center ref for dealing cards for regular play.');

    const newStates = getCardsStatesRegularDeal(
      stateContext,
      euchreGame,
      euchreSettings.gameSpeed,
      directCenterH,
      directCenterV,
      outerTableRefs,
      deckCardRefs
    );

    updateCardBaseAndAnimationSprings(animationControls, newStates.newStates, newStates.springsForDeal);
  }, [
    animationControls,
    deckCardRefs,
    directCenterHRef,
    directCenterVRef,
    euchreGame,
    euchreSettings.gameSpeed,
    outerTableRefs,
    stateContext,
    updateCardBaseAndAnimationSprings
  ]);

  /** After cards have been dealt to the player's table area, move cards to outside the bound of the game area, as if the
   * player picked them up.
   */
  const setCardStateMoveCardsForPickup = useCallback(() => {
    const newStates = getCardStatesMoveToPlayer(
      stateContext,
      playerDeckRefs,
      deckCardRefs,
      euchreSettings.gameSpeed
    );

    updateCardBaseAndAnimationSprings(animationControls, newStates.newCardStates, newStates.springsToMove);
  }, [
    animationControls,
    deckCardRefs,
    euchreSettings.gameSpeed,
    playerDeckRefs,
    stateContext,
    updateCardBaseAndAnimationSprings
  ]);

  /** Handler to move cards into position for initial deal and set state to animate cards being dealt for initial dealer. */
  const handleMoveCardsIntoPositionRegularDeal = useCallback(async () => {
    addAnimateForDealForRegularPlayEvent(true, !dealAnimationEnabled, state, eventHandlers);

    await gameDelay(euchreSettings);
    await animateMoveCardsIntoPosition();

    setCardStateForDealCardsForRegularPlay();
  }, [
    animateMoveCardsIntoPosition,
    dealAnimationEnabled,
    euchreSettings,
    eventHandlers,
    setCardStateForDealCardsForRegularPlay,
    state
  ]);

  /** Animate cards being dealt for regular play. Typical deal pattern is cards are dealt in sets, usually 2 or 3 cards, instead
   * of dealing one card to a player at a time.
   */
  const handleBeginAnimationForRegularPlay = useCallback(async () => {
    if (!deckState)
      throw new Error(
        '[DECK STATE] [handleBeginAnimationForRegularPlay] - Invalid deck state for dealing cards for regular play.'
      );

    await runCardAnimations(animationControls);
    setCardStateMoveCardsForPickup();
  }, [animationControls, deckState, setCardStateMoveCardsForPickup]);

  /** After dealing cards to players for regular play, move cards to the player's area as if they were picked up. */
  const handleEndAnimationForRegularPlay = useCallback(async () => {
    addAnimateForDealForRegularPlayEvent(false, !dealAnimationEnabled, state, eventHandlers);

    await runCardAnimations(animationControls);
    animationHandlers.onBeginRegularDealComplete();
  }, [animationHandlers, dealAnimationEnabled, animationControls, eventHandlers, state]);

  /** */
  const regularDealHandlers: RegularDealHandlers = {
    onMoveCardsIntoPosition: handleMoveCardsIntoPositionRegularDeal,
    onStartDealCards: handleBeginAnimationForRegularPlay,
    onEndDealCards: handleEndAnimationForRegularPlay
  };

  /** */
  const { getEffectForDeckState } = useDeckStateEffect(
    state,
    deckState,
    refsReady,
    initDealHandlers,
    dealForDealerHandlers,
    regularDealHandlers
  );
  //#endregion

  /** ************************************************************************************************************************************* */

  //#region Effect Reset State

  useEffect(() => {
    if (!dealAnimationEnabled) return;

    /** Effect to run for the current state for game phases. Runs cards animations for dealing cards. */
    const runDeckStateEffect = async () => {
      const effectToRun = getEffectForDeckState();

      if (effectToRun.func) {
        logConsole(
          `[DECK STATE] - Run Effect For Phase: ${effectToRun.statePhase} - Action: ${effectToRun.stateAction}`
        );

        await errorHandlers.catchAsync(effectToRun.func, errorHandlers.onError, 'runDeckStateEffect');
      } else {
        logConsole('[DECK STATE] - NO EFFECT TO RUN');
      }
    };
    runDeckStateEffect();
  }, [dealAnimationEnabled, errorHandlers, getEffectForDeckState]);

  //#endregion

  return {
    handleRefChange,
    gameHandVisible,
    gameDeckVisible,
    gameDeckRef,
    playerInnerDeckRefs,
    playerDeckRefs,
    deckCardRefs,
    deckState,
    cardStates,
    animationControls,
    deckAnimationControls,
    renderKey
  };
};

export default useDeckAnimation;

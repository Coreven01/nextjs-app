import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  EuchreAnimationHandlers,
  EuchreGameValues,
  EuchrePlayer,
  ErrorHandlers,
  CardAnimationControls,
  CardBaseState
} from '../../../lib/euchre/definitions/game-state-definitions';
import useCardRefs from '../useCardRefs';
import { Card, TableLocation } from '../../../lib/euchre/definitions/definitions';
import useTableRef from '../useTableRefs';
import { GameEventHandlers } from '../useEventLog';
import { GAME_STATES_FOR_DEAL, GAME_STATES_FOR_PLAY } from '../../../lib/euchre/util/gameStateLogicUtil';
import { logConsole } from '../../../lib/euchre/util/util';
import { getDisplayHeight, getDisplayWidth } from '../../../lib/euchre/util/cardDataUtil';
import {
  addAnimateForBeginDealForDealerEvent,
  addAnimateForDealForRegularPlayEvent,
  addResetForDealerEvent
} from '../../../lib/euchre/util/deckStateEventsUtil';
import { gameDelay, notificationDelay } from '../../../lib/euchre/util/gameDataUtil';
import {
  CardSpringProps,
  CardSpringTarget,
  DEFAULT_SPRING_VAL
} from '../../../lib/euchre/definitions/transform-definitions';
import { v4 as uuidv4 } from 'uuid';
import {
  getCardsStatesRegularDeal,
  getCardStatesMoveToPlayer,
  getSpringInitialMoveForDealForDealer,
  getStatesAnimateDealForDealer,
  getStatesMoveAllCardsToPlayer
} from '../../../lib/euchre/util/deckAnimationUtil';
import useDeckState from './useDeckState';
import useDeckStateEffect, {
  DealForDealerHandlers,
  InitDealHandlers,
  RegularDealHandlers
} from '../effects/deal/useDeckStateEffect';
import { useAnimation } from 'framer-motion';
import { createCardBaseState } from '../../../lib/euchre/util/cardStateUtil';

export interface GameDeckState {
  deck: Card[];
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>;
  initSpringValue?: CardSpringTarget;

  /** Dealer location */
  location: TableLocation;
  playerNumber: number;
  handId: string;
  gameId: string;
  width: number;
  height: number;
}

/** Hook to handle animation dealing cards from a player's point of view.
 *  If animation is disabled from settings, then this hook shouldn't be doing anything. */
const useDeckAnimation = (
  state: EuchreGameValues,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers,
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  directCenterHRef: RefObject<HTMLDivElement | null>,
  directCenterVRef: RefObject<HTMLDivElement | null>,
  animationHandlers: EuchreAnimationHandlers
) => {
  const { euchreGame, euchreSettings, euchreGameFlow, initDealer } = state;
  const [renderKey, setRenderKey] = useState<string>('');

  /** Game deck state of values used when rendering the game deck and for animation. */
  const [gameDeckState, setGameDeckState] = useState<GameDeckState | undefined>();
  const deckAnimationControls = useAnimation();

  const {
    deckCardsAnimationControls,
    setDeckCardsAnimationControls,
    deckCardStates,
    setDeckCardStates,
    deckCardsAnimationStates,
    setDeckCardsAnimationStates,
    createStates
  } = useDeckState();

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

  /** */
  const updateCardBaseAndAnimationSprings = useCallback(
    (controls: CardAnimationControls[], cardStates: CardBaseState[], updatedSprings: CardSpringProps[]) => {
      const newAnimationControls = [...controls];

      for (const newAnimation of updatedSprings) {
        const current = newAnimationControls.at(newAnimation.cardIndex);
        if (current) {
          current.animateValues = newAnimation.animateValues;
        }
      }

      setDeckCardStates(cardStates);
      setDeckCardsAnimationControls(newAnimationControls);
    },
    [setDeckCardStates, setDeckCardsAnimationControls]
  );

  /** */
  const runCardAnimations = useCallback(async (animationControls: CardAnimationControls[]) => {
    const animations: Promise<void>[] = [];

    for (const cardAnimation of animationControls) {
      if (cardAnimation.animateValues.length > 0) {
        const temp = async (): Promise<void> => {
          for (const animateValue of cardAnimation.animateValues) {
            await cardAnimation.controls?.start(animateValue);
          }
        };

        animations.push(temp());
      }
    }

    await Promise.all(animations);
  }, []);

  //#region Deck State Reset Effect Hook

  const createInitDeckState = useCallback(() => {
    const location: TableLocation = euchreGame.dealer.location;

    const newGameDeckState: GameDeckState = {
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
    const deckStateExists = gameDeckState !== undefined;

    if (deckStateExists) {
      await deckAnimationControls.start({
        x: 0,
        y: 0,
        rotate: 0,
        opacity: 0,
        transition: { duration: 0 }
      });
    }

    setGameDeckState(createInitDeckState());
    setRenderKey(uuidv4());
  }, [createInitDeckState, deckAnimationControls, gameDeckState]);

  /**
   * Initialize game deck state and card state for beginning a new deal.
   */
  const initCardStatesForNewDealer = useCallback(
    async (includeCardValue: boolean) => {
      const location: TableLocation = euchreGame.dealer.location;
      const centerLocation: boolean = location === 'top' || location === 'bottom';
      const cardStatesExist = deckCardStates.length > 0;
      const initSpringValue: CardSpringTarget | undefined = {
        ...DEFAULT_SPRING_VAL,
        rotateY: centerLocation ? 180 : 0,
        rotateX: centerLocation ? 0 : 180
      };

      if (!cardStatesExist) {
        const initStates = createStates(euchreGame.deck, location, includeCardValue, initSpringValue);
        setDeckCardStates(initStates.cardStates);
        setDeckCardsAnimationControls(initStates.animationControls);
        setDeckCardsAnimationStates(initStates.animationCardStates);
      } else {
        const newCardState = euchreGame.deck.map((card) => {
          return createCardBaseState(card, location, includeCardValue);
        });

        setDeckCardStates(newCardState);

        const resetSpring: CardSpringTarget = { ...initSpringValue, transition: { duration: 0 } };
        for (const animationControl of deckCardsAnimationControls) {
          await animationControl.controls?.start(resetSpring);
        }
      }
    },
    [
      createStates,
      deckCardStates.length,
      deckCardsAnimationControls,
      euchreGame.dealer.location,
      euchreGame.deck,
      setDeckCardStates,
      setDeckCardsAnimationControls,
      setDeckCardsAnimationStates
    ]
  );

  /**
   * Create the animation values for the cards being dealt for initial deal.
   * */
  const setCardStatesForAnimateDealForDealer = useCallback(async () => {
    if (!gameDeckState) throw new Error('[DECK STATE] - Invalid deck state for dealing cards.');

    const directCenterH = directCenterHRef.current;
    const directCenterV = directCenterVRef.current;

    if (!directCenterH) throw new Error('[DECK STATE] - Invalid direct center ref for initializing deal.');
    if (!directCenterV) throw new Error('[DECK STATE] - Invalid direct center ref for initializing deal.');
    if (!initDealer) throw new Error('[DECK STATE] - Invalid deal result for dealing cards.');

    const newStates = getStatesAnimateDealForDealer(
      deckCardStates,
      deckCardsAnimationStates,
      euchreGame,
      euchreSettings.gameSpeed,
      directCenterH,
      directCenterV,
      outerTableRefs,
      deckCardRefs,
      initDealer
    );
    updateCardBaseAndAnimationSprings(
      deckCardsAnimationControls,
      newStates.newState,
      newStates.springsForDeal
    );
  }, [
    deckCardRefs,
    deckCardStates,
    deckCardsAnimationControls,
    deckCardsAnimationStates,
    directCenterHRef,
    directCenterVRef,
    euchreGame,
    euchreSettings.gameSpeed,
    gameDeckState,
    initDealer,
    outerTableRefs,
    updateCardBaseAndAnimationSprings
  ]);

  /** Move cards from its absolute postion to the dealer card area. Then animate the cards into a visible area
   * to prepare them for being dealt.
   */
  const animateMoveCardsIntoPosition = useCallback(async () => {
    if (!gameDeckState) throw new Error('[DECK STATE] - Invalid game deck state for initializing deal.');

    const destRef = playerDeckRefs.get(gameDeckState.location);
    const directCenterRef = getRelativeCenter(gameDeckState.location);

    if (!destRef?.current) throw new Error('[DECK STATE] - Invalid destination ref for initializing deal.');
    if (!gameDeckRef.current) throw new Error('[DECK STATE] - Invalid game deck ref for initializing deal.');
    if (!directCenterRef) throw new Error('[DECK STATE] - Invalid direct center ref for initializing deal.');

    const initialMoves = getSpringInitialMoveForDealForDealer(
      destRef.current,
      directCenterRef,
      gameDeckRef.current,
      euchreSettings.gameSpeed
    );

    setRenderKey(uuidv4());

    await deckAnimationControls.start(initialMoves.initMoveToDealer);
    await deckAnimationControls.start(initialMoves.moveIntoView);
  }, [deckAnimationControls, euchreSettings.gameSpeed, gameDeckState, getRelativeCenter, playerDeckRefs]);

  /** Reset the deck state to deal a new set of cards. */
  const handleDeckStateReset = useCallback(async () => {
    addResetForDealerEvent(state, eventHandlers);
    await initDeckStateForNewDealer();
    await initCardStatesForNewDealer(false);
  }, [eventHandlers, initCardStatesForNewDealer, initDeckStateForNewDealer, state]);

  const initDealHandlers: InitDealHandlers = {
    onReinitializeState: () => new Promise((resolve) => setTimeout(resolve, 25)),
    onDeckReset: handleDeckStateReset,
    onNewDeal: () => new Promise<void>((resolve) => setTimeout(resolve, 25))
  };

  //#endregion

  /** ************************************************************************************************************************************* */

  //#region Deck State Deal For Dealer Effect Hook

  /** Handler to move cards into position for initial deal and set state to animate cards being dealt for initial dealer. */
  const handleMoveCardsIntoPositionDealForDealer = useCallback(async () => {
    addAnimateForBeginDealForDealerEvent(true, !dealAnimationEnabled, state, eventHandlers);

    await gameDelay(euchreSettings);
    await animateMoveCardsIntoPosition();

    // set the card states for animation for the next state phase. This is set here so the next phase will have the latest
    // animations values already saved.
    setCardStatesForAnimateDealForDealer();
  }, [
    dealAnimationEnabled,
    setCardStatesForAnimateDealForDealer,
    euchreSettings,
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
        deckCardStates,
        deckCardsAnimationStates,
        deckCardsAnimationControls,
        destinationPlayer.location,
        destRef.current,
        deckCardRefs,
        euchreSettings.gameSpeed
      );
      updateCardBaseAndAnimationSprings(
        deckCardsAnimationControls,
        newStates.newCardStates,
        newStates.springsToMove
      );
    },
    [
      deckCardRefs,
      deckCardStates,
      deckCardsAnimationControls,
      deckCardsAnimationStates,
      euchreSettings.gameSpeed,
      playerDeckRefs,
      updateCardBaseAndAnimationSprings
    ]
  );

  /** Animate cards being dealt for initial dealer. */
  const handleBeginAnimationBeginDealForDealer = useCallback(async () => {
    if (!initDealer?.newDealer) throw new Error('Invalid deal result for animation deal for dealer.');

    await runCardAnimations(deckCardsAnimationControls);
    setCardStateMoveCardsToPlayer(initDealer.newDealer);
    animationHandlers.onBeginDealForDealerComplete();
  }, [
    animationHandlers,
    deckCardsAnimationControls,
    initDealer?.newDealer,
    runCardAnimations,
    setCardStateMoveCardsToPlayer
  ]);

  /** Updates state that the animation for cards being dealt is complete. This event is separated
   * because the number of cards to be dealt during intial deal is dynamic.
   */
  const handleEndAnimationBeginDealForDealer = useCallback(async () => {
    addAnimateForBeginDealForDealerEvent(false, !dealAnimationEnabled, state, eventHandlers);

    await notificationDelay(euchreSettings);
    await runCardAnimations(deckCardsAnimationControls);

    animationHandlers.onEndDealForDealerComplete();
  }, [
    animationHandlers,
    dealAnimationEnabled,
    deckCardsAnimationControls,
    euchreSettings,
    eventHandlers,
    runCardAnimations,
    state
  ]);

  const dealForDealerHandlers: DealForDealerHandlers = {
    onMoveCardsIntoPosition: handleMoveCardsIntoPositionDealForDealer,
    onStartAnimateBegin: handleBeginAnimationBeginDealForDealer,
    onEndAnimateBegin: handleEndAnimationBeginDealForDealer,
    onStartAnimateEnd: () => new Promise<void>((resolve) => setTimeout(resolve, 25))
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
      deckCardStates,
      deckCardsAnimationStates,
      euchreGame,
      euchreSettings.gameSpeed,
      directCenterH,
      directCenterV,
      outerTableRefs,
      deckCardRefs
    );
    updateCardBaseAndAnimationSprings(
      deckCardsAnimationControls,
      newStates.newStates,
      newStates.springsForDeal
    );
  }, [
    deckCardRefs,
    deckCardStates,
    deckCardsAnimationControls,
    deckCardsAnimationStates,
    directCenterHRef,
    directCenterVRef,
    euchreGame,
    euchreSettings.gameSpeed,
    outerTableRefs,
    updateCardBaseAndAnimationSprings
  ]);

  /** After cards have been dealt to the player's table area, move cards to outside the bound of the game area, as if the
   * player picked them up.
   */
  const setCardStateMoveCardsForPickup = useCallback(() => {
    const newStates = getCardStatesMoveToPlayer(
      deckCardStates,
      deckCardsAnimationStates,
      deckCardsAnimationControls,
      playerDeckRefs,
      deckCardRefs,
      euchreSettings.gameSpeed
    );

    updateCardBaseAndAnimationSprings(
      deckCardsAnimationControls,
      newStates.newCardStates,
      newStates.springsToMove
    );
  }, [
    deckCardRefs,
    deckCardStates,
    deckCardsAnimationControls,
    deckCardsAnimationStates,
    euchreSettings.gameSpeed,
    playerDeckRefs,
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
    if (!gameDeckState)
      throw new Error(
        '[DECK STATE] [handleBeginAnimationForRegularPlay] - Invalid deck state for dealing cards for regular play.'
      );

    await runCardAnimations(deckCardsAnimationControls);
    setCardStateMoveCardsForPickup();
  }, [deckCardsAnimationControls, gameDeckState, runCardAnimations, setCardStateMoveCardsForPickup]);

  /** After dealing cards to players for regular play, move cards to the player's area as if they were picked up. */
  const handleEndAnimationForRegularPlay = useCallback(async () => {
    addAnimateForDealForRegularPlayEvent(false, !dealAnimationEnabled, state, eventHandlers);

    await runCardAnimations(deckCardsAnimationControls);
    animationHandlers.onEndRegularDealComplete();
  }, [
    animationHandlers,
    dealAnimationEnabled,
    deckCardsAnimationControls,
    eventHandlers,
    runCardAnimations,
    state
  ]);

  const regularDealHandlers: RegularDealHandlers = {
    onMoveCardsIntoPosition: handleMoveCardsIntoPositionRegularDeal,
    onStartAnimateBegin: handleBeginAnimationForRegularPlay,
    onEndAnimateBegin: handleEndAnimationForRegularPlay
  };

  const { getEffectForDeckState } = useDeckStateEffect(
    state,
    gameDeckState,
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

    const runDeckStateEffect = async () => {
      const effectToRun = getEffectForDeckState();

      if (effectToRun.func) {
        logConsole(
          `[DECK STATE] [${effectToRun.stateHandlerName}] - Run Effect For Condition: ${effectToRun.stateConditionName} - Phase: ${effectToRun.statePhase}`
        );

        await errorHandlers.catchAsync(
          effectToRun.func,
          errorHandlers.onError,
          effectToRun.stateHandlerName ?? 'runDeckStateEffect'
        );
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
    gameDeckState,
    deckCardStates,
    deckCardsAnimationControls,
    deckAnimationControls,
    renderKey
  };
};

export default useDeckAnimation;

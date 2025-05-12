import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  EuchreAnimationHandlers,
  EuchreGameValues,
  EuchrePlayer,
  ErrorHandlers
} from '../../../lib/euchre/definitions/game-state-definitions';
import { EuchreGameFlow } from '../reducers/gameFlowReducer';
import { CardState } from '../reducers/cardStateReducer';
import useCardRefs from '../useCardRefs';
import { Card, TableLocation } from '../../../lib/euchre/definitions/definitions';
import useTableRef from '../useTableRefs';
import { useAnimation } from 'framer-motion';
import useAnimationDeckState from '../phases/useAnimationDeckState';
import { GameEventHandlers } from '../useEventLog';
import { GAME_STATES_FOR_DEAL, GAME_STATES_FOR_PLAY } from '../../../lib/euchre/util/gameStateLogicUtil';
import { logConsole } from '../../../lib/euchre/util/util';
import { getCardFullName, getEncodedCardSvg } from '../../../lib/euchre/util/cardSvgDataUtil';
import { getRandomDamping, getRandomStiffness } from '../../../lib/euchre/util/cardTransformUtil';
import { getDisplayHeight, getDisplayWidth } from '../../../lib/euchre/util/cardDataUtil';
import {
  addAnimateForBeginDealForDealerEvent,
  addAnimateForDealForRegularPlayEvent,
  addAnimateForEndDealForDealerEvent,
  addResetForDealerEvent
} from '../../../lib/euchre/util/deckStateEventsUtil';
import { gameDelay } from '../../../lib/euchre/util/gameDataUtil';
import { CardSpringTarget, DEFAULT_SPRING_VAL } from '../../../lib/euchre/definitions/transform-definitions';
import { v4 as uuidv4 } from 'uuid';
import useDeckResetEffect from './useDeckResetEffect';
import useDeckInitDealEffect from './useDeckInitDealEffect';
import useDeckRegularDealEffect from './useDeckRegularDealEffect';
import {
  getCardsStatesRegularDeal,
  getCardStatesDealForDealer,
  getCardStatesInitialDealForDealer,
  getCardStatesMoveAllCardsToPlayer
} from '../../../lib/euchre/util/deckAnimationUtil';

export interface GameDeckState {
  deck: Card[];
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>;
  handleAnimationComplete: () => void;
  dealType: EuchreGameFlow;
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
const useDeckState = (
  state: EuchreGameValues,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers,
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  directCenterHRef: RefObject<HTMLDivElement | null>,
  directCenterVRef: RefObject<HTMLDivElement | null>,
  animationHandlers: EuchreAnimationHandlers
) => {
  const { shouldResetDealState } = useAnimationDeckState(state);
  const { euchreGame, euchreSettings, euchreGameFlow, initDealer } = state;
  const [renderKey, setRenderKey] = useState<string>('');

  /** Used to position the deck near the player when dealing and animation to bring the deck into view. */
  const deckAnimationControls = useAnimation();

  /** Game deck state of values used when rendering the game deck and for animation. */
  const [gameDeckState, setGameDeckState] = useState<GameDeckState | undefined>();

  /** Card states used for animation of cards in the game deck. */
  const [cardStates, setCardStates] = useState<CardState[]>([]);

  /** Set to true to trigger an effect that the deal for initial dealer is finished and should proceed to the next state in the game flow. */
  const [initialDealComplete, setInitialDealComplete] = useState(false);

  /** Set to true to trigger an effect that the regular deal is finished and should proceed to the next state in the game flow. */
  const [endRegularDeal, setEndRegularDeal] = useState(false);

  /** Used to prevent the same effect from triggering more than once. Set to true when the handler is triggered during the initial
   * deal phase, during begin deal for dealer game flow.
   */
  const endBeginDealForDealerEffect = useRef(false);
  const initEndDealForDealerEffect = useRef(false);
  const cardsDealtCount = useRef(0);

  /** Elements associated with a player's area, outside of the table. */
  const playerDeckRefs = useTableRef();

  /** Elements associated with a player's area, closer to the center of the table. */
  const playerInnerDeckRefs = useTableRef();

  /** map of card index to reference to the card elements, used to calc transitions between elements */
  const deckCardRefs = useCardRefs(24);

  const dealAnimationEnabled = euchreSettings.shouldAnimateDeal;

  /** Reference to the element containing the deck of cards to be dealt. */
  const gameDeckRef = useRef<HTMLDivElement>(null);
  const gameDeckVisible = dealAnimationEnabled && GAME_STATES_FOR_DEAL.includes(euchreGameFlow.gameFlow);
  const gameHandVisible =
    euchreGameFlow.hasGameStarted && GAME_STATES_FOR_PLAY.includes(euchreGameFlow.gameFlow);

  /** */
  const handleDeckStateReset = () => {
    addResetForDealerEvent(state, eventHandlers);
    initDeckStateForNewDealer(false);
  };

  /** */
  const { isDealStateInitialized } = useDeckResetEffect(
    state,
    errorHandlers,
    gameDeckState,
    handleDeckStateReset
  );

  /** */
  const handleBeginAnimationBeginDealForDealer = async () => {
    addAnimateForBeginDealForDealerEvent(true, !dealAnimationEnabled, state, eventHandlers);

    await gameDelay(euchreSettings);
    await initAnimationForInitialDeal();

    dealCardsForInitialDeal();
  };

  /** */
  const handleEndAnimationBeginDealForDealer = () => {
    endBeginDealForDealerEffect.current = true;

    addAnimateForBeginDealForDealerEvent(false, !dealAnimationEnabled, state, eventHandlers);
    animationHandlers.onBeginDealForDealerComplete();
  };

  /** */
  const handleBeginAnimationEndDealForDealer = () => {
    initEndDealForDealerEffect.current = true;

    addAnimateForEndDealForDealerEvent(true, !dealAnimationEnabled, state, eventHandlers);

    if (!initDealer) throw new Error('[DECK STATE] - Invalid deal result for moving cards.');

    setGameDeckStateForEndDealForDealer();
    moveCardsToPlayer(initDealer.newDealer);
  };

  /** */
  const { setRefsReady } = useDeckInitDealEffect(
    state,
    errorHandlers,
    isDealStateInitialized,
    initialDealComplete,
    handleBeginAnimationBeginDealForDealer,
    handleEndAnimationBeginDealForDealer,
    handleBeginAnimationEndDealForDealer
  );

  /** */
  const handleBeginAnimationForRegularPlay = async () => {
    if (!gameDeckState)
      throw new Error('[DECK STATE] - Invalid deck state for dealing cards for regular play.');

    addAnimateForDealForRegularPlayEvent(true, !dealAnimationEnabled, state, eventHandlers);

    await initAnimationForInitialDeal();
    setCardStateForDealCardsForRegularPlay();
    setGameDeckState({
      ...gameDeckState,
      dealType: EuchreGameFlow.BEGIN_DEAL_CARDS,
      handleAnimationComplete: handleBeginDealForRegularPlayComplete
    });
  };

  /** */
  const handleEndAnimationForRegularPlay = async () => {
    addAnimateForDealForRegularPlayEvent(false, !dealAnimationEnabled, state, eventHandlers);

    moveCardsToPlayersForRegularPlay();
    await gameDelay(euchreSettings);

    logConsole('[DECK STATE] [endAnimationForRegularPlay]');
    animationHandlers.onBeginRegularDealComplete();
  };

  /** */
  useDeckRegularDealEffect(
    state,
    errorHandlers,
    endRegularDeal,
    handleBeginAnimationForRegularPlay,
    handleEndAnimationForRegularPlay
  );

  /** ************************************************************************************************************************************* */

  /** Reset state for new deal. */
  const resetStateDeal = () => {
    cardsDealtCount.current = 0;
    //initBeginDealForRegularPlayEffect.current = false;
    //ndBeginDealForRegularPlayEffect.current = false;
    setEndRegularDeal(false);
  };

  /** */
  const handleRefChange = useCallback(
    (ready: boolean) => {
      logConsole('********** REF CHANGE: ', ready);
      setRefsReady(ready);
    },
    [setRefsReady]
  );

  // const resetForNewDealer = useCallback(() => {
  //   if (!dealAnimationEnabled) return;

  //   if (gameDeckState !== undefined && gameDeckState.handId !== euchreGame.handId && initForNewDealerEffect) {
  //     setInitForNewDealerEffect(false);
  //   }
  // }, [dealAnimationEnabled, euchreGame.handId, gameDeckState, initForNewDealerEffect]);

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

  /** Increment the card count when dealing cards for initial deal. Once the cards have been dealt,
   * this should then trigger an effect for the next animation state.
   */
  const handleBeginDealForDealerComplete = useCallback(() => {
    if (cardsDealtCount.current === initDealer?.cardIndex) {
      setInitialDealComplete(true);
      cardsDealtCount.current = 0;
    } else {
      cardsDealtCount.current += 1;
    }
  }, [initDealer?.cardIndex]);

  /** Increment card count when moving all cards to the new dealer. Once all cards are moved, then
   * call handler that the game should proceed to the next state.
   */
  const handleEndDealForDealerComplete = useCallback(() => {
    if (cardsDealtCount.current === 23) {
      cardsDealtCount.current = 0;
      animationHandlers.onEndDealForDealerComplete();
    } else {
      cardsDealtCount.current += 1;
    }
  }, [animationHandlers]);

  /** */
  const handleBeginDealForRegularPlayComplete = useCallback(() => {
    logConsole('[DECK STATE] [handleBeginDealForRegularPlayComplete] card count: ', cardsDealtCount.current);
    if (cardsDealtCount.current === 20) {
      setEndRegularDeal(true);
      cardsDealtCount.current = 0;
    } else {
      cardsDealtCount.current += 1;
    }
  }, []);

  /** Create the intial card state values for beginning deal.
   */
  const createCardStatesFromGameDeck = useCallback(
    (location: TableLocation, includeCardValue: boolean) => {
      const newCardStates: CardState[] = [];
      const initZIndex: number = DEFAULT_SPRING_VAL.zIndex ?? 30;
      const centerLocation: boolean = location === 'top' || location === 'bottom';

      const initSpringValue: CardSpringTarget = {
        ...DEFAULT_SPRING_VAL,
        rotateY: centerLocation ? 180 : 0,
        rotateX: centerLocation ? 0 : 180
      };

      for (const card of euchreGame.deck) {
        const cardState: CardState = {
          renderKey: uuidv4(),
          cardIndex: card.index,
          src: includeCardValue ? getEncodedCardSvg(card, location) : undefined,
          cardFullName: includeCardValue ? getCardFullName(card) : 'Player Card',
          initSpringValue: { ...initSpringValue, zIndex: initZIndex + card.index },
          springValue: {
            ...initSpringValue,
            zIndex: initZIndex + card.index
          },
          xDamping: getRandomDamping(),
          xStiffness: getRandomStiffness(),
          yDamping: getRandomDamping(),
          yStiffness: getRandomDamping(),
          rotation: 0,
          enabled: false,
          location: location
        };

        newCardStates.push(cardState);
      }

      return newCardStates;
    },
    [euchreGame.deck]
  );

  const createInitDeckState = useCallback(() => {
    const location: TableLocation = euchreGame.dealer.location;

    const newGameDeckState: GameDeckState = {
      deck: euchreGame.deck,
      cardRefs: deckCardRefs,
      dealType: EuchreGameFlow.BEGIN_INTRO,
      location: location,
      playerNumber: euchreGame.dealer.playerNumber,
      initSpringValue: { ...DEFAULT_SPRING_VAL, opacity: 0 },
      handId: euchreGame.handId,
      gameId: euchreGame.gameId,
      width: getDisplayWidth(location),
      height: getDisplayHeight(location),
      handleAnimationComplete: () => null
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
   * Initialize game deck state and card state for beginning a new deal.
   */
  const initDeckStateForNewDealer = useCallback(
    (includeCardValue: boolean) => {
      const location: TableLocation = euchreGame.dealer.location;
      const newGameDeckState: GameDeckState = createInitDeckState();
      const gameStateExists = gameDeckState !== undefined;

      if (gameStateExists) {
        // if game state already exists, then make sure the position is return back to its original location.
        deckAnimationControls.start({
          x: 0,
          y: 0,
          opacity: 0,
          transition: { duration: 0 }
        });
      }

      resetStateDeal();
      setGameDeckState(newGameDeckState);
      setRenderKey(uuidv4());
      setCardStates(createCardStatesFromGameDeck(location, includeCardValue));
    },
    [
      createCardStatesFromGameDeck,
      createInitDeckState,
      deckAnimationControls,
      euchreGame.dealer.location,
      gameDeckState
    ]
  );

  /** Function that's called from an effect to initialize the game deck state for a new deal.
   * Only executes if the game deck has yet to be created, or the hand ID has changed.
   */
  // const initStateForNewDealerEffect = useCallback(() => {
  //   if (!dealAnimationEnabled) return;

  //   const handChanged = gameDeckState === undefined || gameDeckState.handId !== euchreGame.handId;
  //   const validDeck = euchreGame.deck.length === 24 && !euchreGame.deck.find((c) => c.value === 'P');

  //   if (!initForNewDealerEffect && handChanged && validDeck && euchreGameFlow.hasGameStarted) {
  //     addResetForDealerEvent(state, eventHandlers);
  //     initDeckStateForNewDealer(false);
  //     setInitForNewDealerEffect(true);
  //   }
  // }, [
  //   dealAnimationEnabled,
  //   euchreGame.deck,
  //   euchreGame.handId,
  //   euchreGameFlow.hasGameStarted,
  //   eventHandlers,
  //   gameDeckState,
  //   initDeckStateForNewDealer,
  //   initForNewDealerEffect,
  //   state
  // ]);

  /** Move cards from its absolute postion to the dealer card area. Then animate the cards into a visible area
   * to prepare them for being dealt.
   */
  const initAnimationForInitialDeal = useCallback(async () => {
    if (!gameDeckState) throw new Error('[DECK STATE] - Invalid game deck state for initializing deal.');

    const destRef = playerDeckRefs.get(gameDeckState.location);
    const directCenterRef = getRelativeCenter(gameDeckState.location);

    if (!destRef?.current) throw new Error('[DECK STATE] - Invalid destination ref for initializing deal.');
    if (!gameDeckRef.current) throw new Error('[DECK STATE] - Invalid game deck ref for initializing deal.');
    if (!directCenterRef) throw new Error('[DECK STATE] - Invalid direct center ref for initializing deal.');

    const initialMoves = getCardStatesInitialDealForDealer(
      destRef.current,
      directCenterRef,
      gameDeckRef.current,
      euchreSettings.gameSpeed
    );
    setRenderKey(uuidv4());

    await deckAnimationControls.start(initialMoves.initMoveToDealer);
    await deckAnimationControls.start(initialMoves.moveIntoView);
  }, [deckAnimationControls, euchreSettings.gameSpeed, gameDeckState, getRelativeCenter, playerDeckRefs]);

  /**
   * Create the animation values for the cards being dealt for initial deal.
   * */
  const dealCardsForInitialDeal = useCallback(() => {
    if (!gameDeckState) throw new Error('[DECK STATE] - Invalid deck state for dealing cards.');

    const directCenterH = directCenterHRef.current;
    const directCenterV = directCenterVRef.current;

    if (!directCenterH) throw new Error('[DECK STATE] - Invalid direct center ref for initializing deal.');
    if (!directCenterV) throw new Error('[DECK STATE] - Invalid direct center ref for initializing deal.');
    if (!initDealer) throw new Error('[DECK STATE] - Invalid deal result for dealing cards.');

    setCardStates((prev) => {
      const newState = getCardStatesDealForDealer(
        prev,
        euchreGame,
        euchreSettings,
        directCenterH,
        directCenterV,
        outerTableRefs,
        deckCardRefs,
        initDealer
      );
      return newState;
    });

    setGameDeckState({
      ...gameDeckState,
      dealType: EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
      handleAnimationComplete: handleBeginDealForDealerComplete
    });
  }, [
    deckCardRefs,
    directCenterHRef,
    directCenterVRef,
    euchreGame,
    euchreSettings,
    gameDeckState,
    handleBeginDealForDealerComplete,
    initDealer,
    outerTableRefs
  ]);

  /** Animate cards going to a player side of the game board after cards have been dealt.
   */
  const moveCardsToPlayer = useCallback(
    (destinationPlayer: EuchrePlayer) => {
      setCardStates((prev) => {
        const destRef = playerDeckRefs.get(destinationPlayer.location);
        if (!destRef?.current)
          throw new Error('[DECK STATE] - Invalid destination ref to move cards to dealer');

        const newState = getCardStatesMoveAllCardsToPlayer(
          prev,
          destinationPlayer.location,
          destRef.current,
          deckCardRefs,
          euchreSettings.gameSpeed
        );
        return newState;
      });
    },
    [deckCardRefs, euchreSettings.gameSpeed, playerDeckRefs]
  );

  /**
   * Update the game deck state to handle animation complete for game flow end deal for dealer.
   */
  const setGameDeckStateForEndDealForDealer = useCallback(() => {
    if (!gameDeckState) throw new Error('[DECK STATE] - Invalid deck state for moving cards.');

    setGameDeckState({
      ...gameDeckState,
      dealType: EuchreGameFlow.END_DEAL_FOR_DEALER,
      handleAnimationComplete: handleEndDealForDealerComplete
    });
  }, [gameDeckState, handleEndDealForDealerComplete]);

  /** Create the animation values for the cards being dealt for regular play.
   */
  const setCardStateForDealCardsForRegularPlay = useCallback(() => {
    const directCenterH = directCenterHRef.current;
    const directCenterV = directCenterVRef.current;

    if (!directCenterH)
      throw new Error('[DECK STATE] - Invalid direct center ref for dealing cards for regular play.');
    if (!directCenterV)
      throw new Error('[DECK STATE] - Invalid direct center ref for dealing cards for regular play.');

    setCardStates((prev) => {
      const newState = getCardsStatesRegularDeal(
        prev,
        euchreGame,
        euchreSettings,
        directCenterH,
        directCenterV,
        outerTableRefs,
        deckCardRefs
      );
      return newState;
    });
  }, [deckCardRefs, directCenterHRef, directCenterVRef, euchreGame, euchreSettings, outerTableRefs]);

  /** After cards have been dealt to the player's table area, move cards to outside the bound of the game area, as if the
   * player picked them up.
   */
  const moveCardsToPlayersForRegularPlay = useCallback(() => {
    // setCardStates((prev) => {
    //   const newState = [...prev];
    //   for (const cardState of newState) {
    //     if (cardState.location) {
    //       const destRef = playerDeckRefs.get(cardState.location);
    //       const cardRef = deckCardRefs.get(cardState.cardIndex);
    //       const offsets = getDestinationOffset(cardState.location);
    //       if (destRef?.current && cardRef?.current) {
    //         const spring = getSpringMoveElement(
    //           cardRef.current,
    //           destRef.current,
    //           undefined,
    //           cardState.springValue
    //         );
    //         spring.x += offsets.x;
    //         spring.y += offsets.y;
    //         spring.transition = getTransitionForCardMoved(cardState, euchreSettings.gameSpeed);
    //         cardState.springValue = spring;
    //         cardState.renderKey = uuidv4();
    //       }
    //     }
    //   }
    //   return newState;
    // });
  }, []);

  /** ************************************************************************************************************************************* */

  //#region Effects to control deal animation.

  useEffect(() => {
    if (shouldResetDealState && endRegularDeal) {
      setEndRegularDeal(false);
    }
  }, [endRegularDeal, shouldResetDealState]);

  // useEffect(() => {
  //   try {
  //     resetForNewDealer();
  //   } catch (e) {
  //     const error = e as Error;
  //     errorHandlers.onError(error, 'resetForNewDealer');
  //   }
  // }, [errorHandlers, resetForNewDealer]);

  // /** Initial game deck state for dealer */
  // useEffect(() => {
  //   try {
  //     initStateForNewDealerEffect();
  //   } catch (e) {
  //     const error = e as Error;
  //     errorHandlers.onError(error, 'initStateForNewDealerEffect');
  //   }
  // }, [errorHandlers, initStateForNewDealerEffect]);

  /** Begin animation for dealing to determine the game's initial dealer. First jack dealt will
   * become the game dealer. This should be only run once at the beginning of the game.
   */
  // useEffect(() => {
  //   const beginAnimationForBeginDealForDealer = async () => {
  //     if (!dealAnimationEnabled) return;

  //     const shouldDealCards =
  //       !initBeginDealForDealerEffect.current &&
  //       shouldBeginDealForDealer &&
  //       initForNewDealerEffect &&
  //       refsReady;

  //     if (shouldDealCards) {
  //       initBeginDealForDealerEffect.current = true;

  //       addAnimateForBeginDealForDealerEvent(true, !dealAnimationEnabled, state, eventHandlers);

  //       await gameDelay(euchreSettings);
  //       await initAnimationForInitialDeal();

  //       dealCardsForInitialDeal();
  //     }
  //   };

  //   errorHandlers.catchAsync(
  //     beginAnimationForBeginDealForDealer,
  //     errorHandlers.onError,
  //     'beginAnimationForBeginDealForDealer'
  //   );
  // }, [
  //   dealAnimationEnabled,
  //   dealCardsForInitialDeal,
  //   errorHandlers,
  //   euchreSettings,
  //   eventHandlers,
  //   initAnimationForInitialDeal,
  //   initForNewDealerEffect,
  //   refsReady,
  //   shouldBeginDealForDealer,
  //   state
  // ]);

  /** Pause game after dealing to finish animation. After the delay, move cards to the new dealer.*/
  // useEffect(() => {
  //   const endAnimationForBeginDealForDealer = async () => {
  //     if (!dealAnimationEnabled) return;

  //     const endAnimate = initialDealComplete && !endBeginDealForDealerEffect.current;

  //     if (endAnimate) {
  //       endBeginDealForDealerEffect.current = true;

  //       addAnimateForBeginDealForDealerEvent(false, !dealAnimationEnabled, state, eventHandlers);
  //       animationHandlers.onBeginDealForDealerComplete();
  //     }
  //   };

  //   errorHandlers.catchAsync(
  //     endAnimationForBeginDealForDealer,
  //     errorHandlers.onError,
  //     'endAnimationForBeginDealForDealer'
  //   );
  // }, [animationHandlers, dealAnimationEnabled, initialDealComplete, errorHandlers, eventHandlers, state]);

  // /**
  //  * After completing animation for initial dealer, animate moving cards to the new dealer.
  //  */
  // useEffect(() => {
  //   const beginAnimationForEndDealForDealer = async () => {
  //     if (!dealAnimationEnabled) return;

  //     const shouldAnimate = !initEndDealForDealerEffect.current && shouldEndDealForDealer;

  //     if (shouldAnimate) {
  //       initEndDealForDealerEffect.current = true;

  //       addAnimateForEndDealForDealerEvent(true, !dealAnimationEnabled, state, eventHandlers);

  //       if (!initDealer) throw new Error('[DECK STATE] - Invalid deal result for moving cards.');

  //       setGameDeckStateForEndDealForDealer();
  //       moveCardsToPlayer(initDealer.newDealer);
  //     }
  //   };

  //   errorHandlers.catchAsync(
  //     beginAnimationForEndDealForDealer,
  //     errorHandlers.onError,
  //     'beginAnimationForEndDealForDealer'
  //   );
  // }, [
  //   dealAnimationEnabled,
  //   errorHandlers,
  //   eventHandlers,
  //   initDealer,
  //   moveCardsToPlayer,
  //   setGameDeckStateForEndDealForDealer,
  //   shouldEndDealForDealer,
  //   state
  // ]);

  /** Animate dealing cards for regular play. This should be run at the beginning of each hand during regular play. */
  // useEffect(() => {
  //   const beginAnimationForRegularPlay = async () => {
  //     if (!dealAnimationEnabled) return;

  //     const shouldAnimate = !initBeginDealForRegularPlayEffect.current && shouldBeginDealCards;

  //     if (shouldAnimate) {
  //       initBeginDealForRegularPlayEffect.current = true;

  //       addAnimateForDealForRegularPlayEvent(true, !dealAnimationEnabled, state, eventHandlers);

  //       await initAnimationForInitialDeal();
  //       dealCardsForRegularPlay();
  //     }
  //   };

  //   errorHandlers.catchAsync(
  //     beginAnimationForRegularPlay,
  //     errorHandlers.onError,
  //     'beginAnimationForRegularPlay'
  //   );
  // }, [
  //   dealAnimationEnabled,
  //   dealCardsForRegularPlay,
  //   errorHandlers,
  //   eventHandlers,
  //   initAnimationForInitialDeal,
  //   shouldBeginDealCards,
  //   state
  // ]);

  // /** After cards have been dealt for regular play, animate moving cards to player's hand area. After animation is complete,
  //  * move to the next state to show player's cards. This is the last state to be run in this hook.
  //  * Player card animation is handled is useCardState.ts
  //  */
  // useEffect(() => {
  //   const endAnimationForRegularPlay = async () => {
  //     if (!dealAnimationEnabled) return;

  //     const shouldAnimate =
  //       endRegularDeal && !endBeginDealForRegularPlayEffect.current && shouldBeginDealCards;

  //     if (shouldAnimate) {
  //       endBeginDealForRegularPlayEffect.current = true;

  //       addAnimateForDealForRegularPlayEvent(false, !dealAnimationEnabled, state, eventHandlers);

  //       moveCardsToPlayersForRegularPlay();
  //       await gameDelay(euchreSettings);

  //       logConsole('[DECK STATE] [endAnimationForRegularPlay]');
  //       animationHandlers.onBeginRegularDealComplete();
  //     }
  //   };

  //   errorHandlers.catchAsync(endAnimationForRegularPlay, errorHandlers.onError, 'endAnimationForRegularPlay');
  // }, [
  //   animationHandlers,
  //   dealAnimationEnabled,
  //   endRegularDeal,
  //   errorHandlers,
  //   euchreSettings,
  //   eventHandlers,
  //   moveCardsToPlayersForRegularPlay,
  //   shouldBeginDealCards,
  //   state
  // ]);

  //#endregion

  return {
    handleRefChange,
    gameHandVisible,
    gameDeckVisible,
    deckAnimationControls,
    gameDeckRef,
    playerInnerDeckRefs,
    playerDeckRefs,
    deckCardRefs,
    gameDeckState,
    cardStates,
    renderKey
  };
};

export default useDeckState;

import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import useCardRefs from '../common/useCardRefs';
import useTableRef from '../common/useTableRefs';
import { GAME_STATES_FOR_DEAL, GAME_STATES_FOR_PLAY } from '../../util/game/gameStateLogicUtil';
import { logConsole } from '../../util/util';
import { getDisplayHeight, getDisplayWidth } from '../../util/game/cardDataUtil';
import {
  addAnimateForBeginDealForDealerEvent,
  addAnimateForDealForRegularPlayEvent,
  addResetForDealerEvent
} from '../../util/deck/deckStateEventsUtil';
import { notificationDelay } from '../../util/game/gameDataUtil';
import { v4 as uuidv4 } from 'uuid';
import {
  getCardsStatesRegularDeal,
  getCardStatesMoveToPlayer,
  getSpringInitialMoveForDeal,
  getStatesAnimateDealForDealer,
  getStatesMoveAllCardsToPlayer
} from '../../util/deck/deckTransformUtil';
import useDeckState from '../../../../app/hooks/euchre/state/useDeckState';
import { useAnimation } from 'framer-motion';
import { createCardBaseState, runCardAnimations } from '../../util/game/cardStateUtil';
import {
  DealForDealerHandlers,
  DeckState,
  EuchrePlayer,
  GamePlayContext,
  InitDealHandlers,
  RegularDealHandlers
} from '../../definitions/game-state-definitions';
import { InitDealResult } from '../../definitions/logic-definitions';
import { TableLocation } from '../../definitions/definitions';
import {
  CardAnimationStateContext,
  CardSpringProps,
  CardSpringTarget,
  DEFAULT_SPRING_VAL,
  FlipSpringProps,
  FlipSpringTarget
} from '../../definitions/transform-definitions';
import useDeckStateEffect from './useDeckStateEffect';

const ERR_ID: string = '[DECK ANIMATION]';

/** Hook to handle animation dealing cards from a player's point of view.
 *  If animation is disabled from settings, then this hook shouldn't be doing anything. */
const useDeckAnimation = (
  gameContext: GamePlayContext,
  initDealer: InitDealResult | null,
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  centerHorizontalElement: HTMLElement | null,
  centerVerticalElement: HTMLElement | null
) => {
  const { state, eventHandlers, errorHandlers, animationHandlers } = gameContext;
  const { euchreGame, euchreSettings, euchreGameFlow } = state;
  const [renderKey, setRenderKey] = useState<string>('');

  /** Values associated with the deck state used when rendering the deck and for animation. */
  const [deckState, setDeckState] = useState<DeckState | undefined>();

  /** Used to move the entire deck element to the player's position for deal. */
  const deckAnimationControls = useAnimation();

  /** Values for the cards in the deck associated with animation individual cards. */
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

  /** game deck cards are conditionally rendered. this value is used to prevent animation of cards before they have been rendered. */
  const [refsReady, setRefsReady] = useState(false);
  const dealAnimationEnabled = euchreSettings.shouldAnimateDeal;

  /** Reference to the element containing the deck of cards to be dealt. */
  const gameDeckRef = useRef<HTMLDivElement>(null);
  const gameDeckVisible = dealAnimationEnabled && GAME_STATES_FOR_DEAL.includes(euchreGameFlow.gameFlow);
  const gameHandVisible =
    euchreGameFlow.hasGameStarted && GAME_STATES_FOR_PLAY.includes(euchreGameFlow.gameFlow);

  /** ************************************************************************************************************************************* */

  /** Used to determine when the game deck element has been first rendered. Ref elements that have been passed to the game deck
   * should now have a value set to a card in the deck.
   */
  const handleRefChange = useCallback(
    (ready: boolean) => {
      setRefsReady(ready);
    },
    [setRefsReady]
  );

  /** Get the element that's relative to the player's location that's used as an offset. This is either a vertical or horizontal
   * element that bisects the game table.
   */
  const getRelativeCenter = useCallback(
    (location: TableLocation): HTMLElement | null => {
      if (location === 'top' || location === 'bottom') {
        return centerHorizontalElement;
      } else {
        return centerVerticalElement;
      }
    },
    [centerHorizontalElement, centerVerticalElement]
  );

  /** Update card state values to the new values passed as parameters. */
  const updateCardBaseAndAnimationSprings = useCallback(
    (
      stateContext: CardAnimationStateContext,
      cardSprings: CardSpringProps[],
      flipSprings: FlipSpringProps[]
    ) => {
      const newAnimationControls = [...stateContext.animationControls];
      const newCardStates = [...stateContext.cardStates];

      for (const control of newAnimationControls) {
        const updatedSpring = cardSprings.find((s) => s.cardIndex === control.cardIndex);
        const updatedFlipSpring = flipSprings.find((s) => s.cardIndex === control.cardIndex);

        control.animateSprings = updatedSpring?.animateSprings ?? [];
        control.animateFlipSprings = updatedFlipSpring?.animateSprings;
      }

      setDeckCardStates(newCardStates);
      setDeckCardsAnimationControls(newAnimationControls);
    },
    [setDeckCardStates, setDeckCardsAnimationControls]
  );

  //#region Deck State Reset

  /** Create deck state values from game values. */
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

  /** Set the initial values for card states for a new render of the game deck. */
  const initCardStatesForNewCardState = useCallback(
    (includeCardValue: boolean) => {
      const location: TableLocation = euchreGame.dealer.location;
      const centerLocation: boolean = location === 'top' || location === 'bottom';
      const initSpringValue: CardSpringTarget = {
        ...DEFAULT_SPRING_VAL
      };

      // rotate value is set to 180 if card is flipped face down.
      const initFlipSpringValue: FlipSpringTarget = {
        rotateY: centerLocation ? 180 : 0,
        rotateX: centerLocation ? 0 : 180
      };

      const initSpringValues: CardSpringProps[] = euchreGame.deck.map((c) => {
        return {
          cardIndex: c.index,
          ordinalIndex: c.index,
          animateSprings: [],
          initialSpring: initSpringValue
        };
      });

      const initFlipSpringValues: FlipSpringProps[] = euchreGame.deck.map((c) => {
        return {
          cardIndex: c.index,
          ordinalIndex: c.index,
          animateSprings: [],
          initialSpring: initFlipSpringValue
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
      setDeckCardsAnimationStates(initStates.animationStates);
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
    if (!deckState) throw new Error(`${ERR_ID} - Invalid deck state for dealing cards.`);
    if (!centerHorizontalElement)
      throw new Error(`${ERR_ID} - Invalid direct center ref for initializing deal.`);
    if (!centerVerticalElement)
      throw new Error(`${ERR_ID} - Invalid direct center ref for initializing deal.`);
    if (!initDealer) throw new Error(`${ERR_ID} - Invalid deal result for dealing cards.`);

    const newStates = getStatesAnimateDealForDealer(
      cardStates,
      animationStates,
      euchreGame,
      euchreSettings.gameSpeed,
      centerHorizontalElement,
      centerVerticalElement,
      outerTableRefs,
      deckCardRefs,
      initDealer
    );

    updateCardBaseAndAnimationSprings(
      {
        cardStates: newStates.newState,
        animationStates: animationStates,
        animationControls: animationControls
      },
      newStates.springsForDeal.cardSprings,
      newStates.springsForDeal.flipSprings
    );
  }, [
    deckCardRefs,
    cardStates,
    animationControls,
    animationStates,
    centerHorizontalElement,
    centerVerticalElement,
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
    if (!deckState) throw new Error(`${ERR_ID} - Invalid game deck state for initializing deal.`);

    const destinationElement = playerDeckRefs.get(deckState.location)?.current;
    const directCenterElement = getRelativeCenter(deckState.location);

    if (!destinationElement)
      throw new Error(`${ERR_ID} - Invalid destination element for initializing deal.`);

    if (!gameDeckRef.current) throw new Error(`${ERR_ID} - Invalid game deck element for initializing deal.`);

    if (!directCenterElement)
      throw new Error(`${ERR_ID} - Invalid direct center element for initializing deal.`);

    const initialMoves = getSpringInitialMoveForDeal(
      destinationElement,
      directCenterElement,
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

  /**  */
  const initDealHandlers: InitDealHandlers = {
    onDealerChanged: () => new Promise<void>((resolve) => setTimeout(resolve, 25)),
    onStateCreating: handleCreateDealStates
  };

  //#endregion

  /** ************************************************************************************************************************************* */

  //#region Deck State Deal For Dealer Effect Hook

  /** Handler to move cards into position for initial deal, and set card states to animate cards being dealt for initial dealer. */
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
      const destinationElement = playerDeckRefs.get(destinationPlayer.location)?.current;
      if (!destinationElement)
        throw new Error(`${ERR_ID} - Invalid destination element to move cards to dealer`);

      const newStates = getStatesMoveAllCardsToPlayer(
        stateContext,
        destinationPlayer.location,
        destinationElement,
        deckCardRefs,
        euchreSettings.gameSpeed,
        'med'
      );

      updateCardBaseAndAnimationSprings(
        {
          cardStates: newStates.newCardStates,
          animationStates: animationStates,
          animationControls: animationControls
        },
        newStates.springsToMove,
        []
      );
    },
    [
      animationControls,
      animationStates,
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
      throw new Error(`${ERR_ID} - Invalid deal result for animation deal for dealer.`);

    await runCardAnimations(animationControls);
    setCardStateMoveCardsToPlayer(initDealer.newDealer);

    // update game state that card animation for deal for dealer is complete.
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

  /** */
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
    if (!centerHorizontalElement)
      throw new Error(`${ERR_ID} - Invalid direct center element for dealing cards for regular play.`);
    if (!centerVerticalElement)
      throw new Error(`${ERR_ID} - Invalid direct center element for dealing cards for regular play.`);

    const newStates = getCardsStatesRegularDeal(
      stateContext,
      euchreGame,
      euchreSettings.gameSpeed,
      centerHorizontalElement,
      centerVerticalElement,
      outerTableRefs,
      deckCardRefs
    );

    updateCardBaseAndAnimationSprings(
      {
        cardStates: newStates.newStates,
        animationStates: animationStates,
        animationControls: animationControls
      },
      newStates.springsForDeal,
      []
    );
  }, [
    animationControls,
    animationStates,
    deckCardRefs,
    centerHorizontalElement,
    centerVerticalElement,
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
      euchreSettings.gameSpeed,
      true,
      'med'
    );

    updateCardBaseAndAnimationSprings(
      {
        cardStates: newStates.newCardStates,
        animationStates: animationStates,
        animationControls: animationControls
      },
      newStates.springsToMove,
      []
    );
  }, [
    animationControls,
    animationStates,
    deckCardRefs,
    euchreSettings.gameSpeed,
    playerDeckRefs,
    stateContext,
    updateCardBaseAndAnimationSprings
  ]);

  /** Handler to move cards into position for initial deal and set state to animate cards being dealt for initial dealer. */
  const handleMoveCardsIntoPositionRegularDeal = useCallback(async () => {
    addAnimateForDealForRegularPlayEvent(true, !dealAnimationEnabled, state, eventHandlers);
    await animateMoveCardsIntoPosition();
    setCardStateForDealCardsForRegularPlay();
  }, [
    animateMoveCardsIntoPosition,
    dealAnimationEnabled,
    eventHandlers,
    setCardStateForDealCardsForRegularPlay,
    state
  ]);

  /** Animate cards being dealt for regular play. Typical deal pattern is cards are dealt in sets, usually 2 or 3 cards, instead
   * of dealing one card to a player at a time.
   */
  const handleBeginAnimationForRegularPlay = useCallback(async () => {
    if (!deckState) throw new Error(`${ERR_ID} - Invalid deck state for dealing cards for regular play.`);

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
    if (!gameDeckVisible) {
      logConsole(`${ERR_ID} - NO EFFECT - Game Deck not visible.`);
      return;
    }

    /** Effect to run for the current state for game phases. Runs cards animations for dealing cards. */
    const runDeckStateEffect = async () => {
      const effectToRun = getEffectForDeckState();

      if (effectToRun.func) {
        logConsole(
          `${ERR_ID} - Run Effect For Phase: ${effectToRun.statePhase} - Action: ${effectToRun.stateAction}`
        );

        await errorHandlers.catchAsync(effectToRun.func, errorHandlers.onError, 'runDeckStateEffect');
      } else {
        logConsole(`${ERR_ID} - NO EFFECT - No effect for phase.`);
      }
    };
    runDeckStateEffect();
  }, [errorHandlers, gameDeckVisible, getEffectForDeckState]);

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

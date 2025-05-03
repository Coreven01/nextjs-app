import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  EuchreAnimationHandlers,
  EuchreGameInstance,
  EuchreGameValues,
  EuchrePlayer,
  ErrorHandlers
} from '../../lib/euchre/definitions/game-state-definitions';
import { EuchreGameFlow } from './reducers/gameFlowReducer';
import { CardState } from './reducers/cardStateReducer';
import useGameData from './data/useGameData';
import useCardTransform, {
  CardSpringProps,
  CardSpringTarget,
  DEFAULT_SPRING_VAL
} from './data/useCardTransform';
import useCardSvgData from './data/useCardSvgData';
import usePlayerData from './data/usePlayerData';
import useCardRefs from './useCardRefs';
import { Card, TableLocation } from '../../lib/euchre/definitions/definitions';
import useTableRef from './useTableRefs';
import { useAnimation } from 'framer-motion';
import useCardData from './data/useCardData';
import useGameStateLogic from './logic/useGameStateLogic';
import useAnimationDeckState from './phases/useAnimationDeckState';
import { GameEventHandlers } from './useEventLog';

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

/** */
const useDeckState = (
  state: EuchreGameValues,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers,
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  directCenterHRef: RefObject<HTMLDivElement | null>,
  directCenterVRef: RefObject<HTMLDivElement | null>,
  animationHandlers: EuchreAnimationHandlers
) => {
  const {
    getRandomDamping,
    getRandomStiffness,
    getTransitionForCardMoved,
    getSpringsForDealForDealer,
    getSpringsToMoveToPlayer,
    getSpringMoveElement,
    getElementOffsetForLocation,
    getSpringsForDealForRegularPlay,
    getElementOriginalPosition,
    getDestinationOffset
  } = useCardTransform();
  const { getPlayerRotation } = usePlayerData();
  const { getCardFullName, getEncodedCardSvg } = useCardSvgData();
  const { gameDelay } = useGameData();
  const { getDisplayWidth, getDisplayHeight } = useCardData();
  const { getGameStatesForDeal, getGameStatesForPlay } = useGameStateLogic();
  const { shouldBeginDealForDealer, shouldEndDealForDealer, shouldBeginDealCards } =
    useAnimationDeckState(state);
  /** Used to position the deck near the player when dealing and animation to bring the deck into view. */
  const deckAnimationControls = useAnimation();

  /** Game deck state of values used when rendering the game deck and for animation. */
  const [gameDeckState, setGameDeckState] = useState<GameDeckState | undefined>();

  /** Card states used for animation of cards in the game deck. */
  const [cardStates, setCardStates] = useState<CardState[]>([]);

  /** Set to true to trigger an effect that the deal for initial dealer is finished and should proceed to the next state in the game flow. */
  const [endInitialDeal, setEndInitialDeal] = useState(false);

  /** Set to true to trigger an effect that the regular deal is finished and should proceed to the next state in the game flow. */
  const [endRegularDeal, setEndRegularDeal] = useState(false);

  /** Used to prevent the same effect from triggering more than once. Set to true when the handler is triggered during the initial
   * deal phase, during begin deal for dealer game flow.
   */
  const [initForNewDealerEffect, setInitForNewDealerEffect] = useState(false);
  const initBeginDealForDealerEffect = useRef(false);
  const endBeginDealForDealerEffect = useRef(false);
  const initEndDealForDealerEffect = useRef(false);
  const initBeginDealForRegularPlayEffect = useRef(false);
  const endBeginDealForRegularPlayEffect = useRef(false);
  const cardsDealtCount = useRef(0);

  /** Elements associated with a player's area, outside of the table. */
  const playerDeckRefs = useTableRef();

  /** Elements associated with a player's area, closer to the center of the table. */
  const playerInnerDeckRefs = useTableRef();

  /** map of card index to reference to the card elements, used to calc transitions between elements */
  const deckCardRefs = useCardRefs(24);
  const [refsReady, setRefsReady] = useState(false);

  /** Reference to the element containing the deck of cards to be dealt. */
  const gameDeckRef = useRef<HTMLDivElement>(null);
  const gameDeckVisible = getGameStatesForDeal().includes(state.euchreGameFlow.gameFlow);
  const gameHandVisible = getGameStatesForPlay().includes(state.euchreGameFlow.gameFlow);
  /** ************************************************************************************************************************************* */

  /**
   * Reset game state for a new game.
   */
  const resetStateFull = () => {
    setGameDeckState(undefined);
    setCardStates([]);
    setEndInitialDeal(false);
    initBeginDealForDealerEffect.current = false;
    endBeginDealForDealerEffect.current = false;
    initEndDealForDealerEffect.current = false;
    cardsDealtCount.current = 0;
    initBeginDealForRegularPlayEffect.current = false;
    endBeginDealForRegularPlayEffect.current = false;
  };

  const resetStateDeal = () => {
    cardsDealtCount.current = 0;
    initBeginDealForRegularPlayEffect.current = false;
    endBeginDealForRegularPlayEffect.current = false;
  };

  const handleRefChange = (ready: boolean) => {
    setRefsReady(ready);
  };

  const resetForNewDealer = useCallback(() => {
    if (
      gameDeckState !== undefined &&
      gameDeckState.handId !== state.euchreGame.handId &&
      initForNewDealerEffect
    ) {
      setInitForNewDealerEffect(false);
    }
  }, [gameDeckState, initForNewDealerEffect, state.euchreGame.handId]);

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
    if (cardsDealtCount.current === state.initDealer?.cardIndex) {
      setEndInitialDeal(true);
      cardsDealtCount.current = 0;
    } else {
      cardsDealtCount.current += 1;
    }
  }, [state.initDealer?.cardIndex]);

  /** Increment card count when moving all cards to the new dealer. Once all cards are moved, then
   * call handler that the game should proceed to the next state.
   */
  const handleEndDealForDealerComplete = useCallback(() => {
    if (cardsDealtCount.current === 23) {
      cardsDealtCount.current = 0;
      animationHandlers.handleEndDealForDealerComplete();
    } else {
      cardsDealtCount.current += 1;
    }
  }, [animationHandlers]);

  /** */
  const handleBeginDealForRegularPlayComplete = useCallback(() => {
    if (cardsDealtCount.current === 20) {
      setEndRegularDeal(true);
      cardsDealtCount.current = 0;
    } else {
      cardsDealtCount.current += 1;
    }
  }, []);

  /** Create the intial card state values for beginning deal.
   *
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

      for (const card of state.euchreGame.deck) {
        const cardState: CardState = {
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
    [getCardFullName, getEncodedCardSvg, getRandomDamping, getRandomStiffness, state.euchreGame.deck]
  );

  /**
   * Initialize game deck state and card state for beginning a new deal.
   */
  const initDeckStateForNewDealer = useCallback(
    async (includeCardValue: boolean) => {
      const game: EuchreGameInstance = state.euchreGame;
      const location: TableLocation = game.dealer.location;

      const newGameDeckState: GameDeckState = {
        deck: game.deck,
        cardRefs: deckCardRefs,
        handleAnimationComplete: () => null,
        dealType: EuchreGameFlow.BEGIN_INTRO,
        location: location,
        playerNumber: game.dealer.playerNumber,
        initSpringValue: { ...DEFAULT_SPRING_VAL, opacity: 0 },
        handId: game.handId,
        gameId: game.gameId,
        width: getDisplayWidth(location),
        height: getDisplayHeight(location)
      };

      const gameStateExists = gameDeckState !== undefined;

      if (gameStateExists) {
        // if game state already exists, then make sure the position is return back to its original location.
        await deckAnimationControls.start({
          x: 0,
          y: 0,
          opacity: 0,
          transition: { duration: 0 }
        });
      }

      resetStateDeal();
      setGameDeckState(newGameDeckState);
      setCardStates(createCardStatesFromGameDeck(location, includeCardValue));
    },
    [
      createCardStatesFromGameDeck,
      deckAnimationControls,
      deckCardRefs,
      gameDeckState,
      getDisplayHeight,
      getDisplayWidth,
      state.euchreGame
    ]
  );

  /** Function that's called from an effect to initialize the game deck state for a new deal.
   * Only executes if the game deck has yet to be created, or the hand ID has changed.
   */
  const initDealerForNewDealerEffect = useCallback(async () => {
    const handChanged = gameDeckState === undefined || gameDeckState.handId !== state.euchreGame.handId;
    const validDeck =
      state.euchreGame.deck.length === 24 && !state.euchreGame.deck.find((c) => c.value === 'P');

    console.log('checkin card ref for init dealer state: ');

    if (!initForNewDealerEffect && handChanged && validDeck) {
      setInitForNewDealerEffect(true);
      await initDeckStateForNewDealer(false);
    }
  }, [
    gameDeckState,
    initDeckStateForNewDealer,
    initForNewDealerEffect,
    state.euchreGame.deck,
    state.euchreGame.handId
  ]);

  /** Move cards from its absolute postion to the dealer card area. Then animate the cards into a visible area
   * to prepare them for being dealt.
   */
  const initAnimationForInitialDeal = useCallback(async () => {
    if (!gameDeckState) throw new Error('Invalid game deck state for initializing deal.');

    const validRefsSet =
      deckCardRefs
        .values()
        .filter((r) => r.current !== null)
        .toArray().length === 24;

    const destRef = playerDeckRefs.get(gameDeckState.location);
    const directCenterRef = getRelativeCenter(gameDeckState.location);

    if (!destRef?.current) throw new Error('Invalid destination ref for initializing deal.');
    if (!gameDeckRef.current) throw new Error('Invalid game deck ref for initializing deal.');
    if (!directCenterRef) throw new Error('Invalid direct center ref for initializing deal.');

    const duration = state.euchreSettings.gameSpeed / 1000;
    const srcRect = getElementOriginalPosition(gameDeckRef.current);
    const destRect = getElementOriginalPosition(destRef.current);
    const relativeRect = getElementOriginalPosition(directCenterRef);

    const moveToElementSpring = getSpringMoveElement(gameDeckRef.current, destRef.current);
    const offsets = getElementOffsetForLocation(srcRect, destRect, relativeRect, 'out');

    // initial move from its absolute postion to the dealer's player location.
    const initMoveToDealer = {
      ...moveToElementSpring,
      opacity: 0,
      x: moveToElementSpring.x + offsets.x,
      y: moveToElementSpring.y + offsets.y,
      transition: { opacity: { duration: 0 }, x: { duration: 0 }, y: { duration: 0 } }
    };

    // slide the cards into view after moving the deck.
    const moveIntoView = {
      ...initMoveToDealer,
      opacity: 1,
      x: initMoveToDealer.x - offsets.x,
      y: initMoveToDealer.y - offsets.y,
      transition: { opacity: { duration: duration }, x: { duration: duration }, y: { duration: duration } }
    };

    await deckAnimationControls.start(initMoveToDealer);
    await deckAnimationControls.start(moveIntoView);
  }, [
    deckAnimationControls,
    deckCardRefs,
    gameDeckState,
    getElementOffsetForLocation,
    getElementOriginalPosition,
    getRelativeCenter,
    getSpringMoveElement,
    playerDeckRefs,
    state.euchreSettings.gameSpeed
  ]);

  /**
   * Create the animation values for the cards being dealt for initial deal.
   * */
  const dealCardsForInitialDeal = useCallback(() => {
    if (!gameDeckState) throw new Error('Invalid deck state for dealing cards.');

    const game: EuchreGameInstance = state.euchreGame;
    const rotation: EuchrePlayer[] = getPlayerRotation(game.gamePlayers, game.dealer);
    const duration: number = state.euchreSettings.gameSpeed / 1000;
    const delayBetweenDeal: number = duration / 3;
    const directCenterH = directCenterHRef.current;
    const directCenterV = directCenterVRef.current;

    if (!directCenterH) throw new Error('Invalid direct center ref for initializing deal.');
    if (!directCenterV) throw new Error('Invalid direct center ref for initializing deal.');

    setCardStates((prev) => {
      if (!state.initDealer) throw new Error('Invalid deal result for dealing cards.');

      const newState = [...prev];

      const springsForDeal: CardSpringProps[] = getSpringsForDealForDealer(
        outerTableRefs,
        deckCardRefs,
        directCenterH,
        directCenterV,
        rotation,
        game.deck,
        state.initDealer
      );

      for (const updatedSpring of springsForDeal) {
        const cardState = newState.at(updatedSpring.cardIndex);
        const card = game.deck.at(updatedSpring.cardIndex);

        if (cardState?.location && card) {
          updatedSpring.springValue.transition = getTransitionForCardMoved(
            cardState,
            state.euchreSettings.gameSpeed,
            delayBetweenDeal * cardState.cardIndex
          );
          cardState.runEffectForState = EuchreGameFlow.BEGIN_DEAL_FOR_DEALER;
          cardState.springValue = updatedSpring.springValue;
          cardState.src = getEncodedCardSvg(card, cardState.location);
          cardState.cardFullName = getCardFullName(card);
        }
      }

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
    gameDeckState,
    getCardFullName,
    getEncodedCardSvg,
    getPlayerRotation,
    getSpringsForDealForDealer,
    getTransitionForCardMoved,
    handleBeginDealForDealerComplete,
    outerTableRefs,
    state.euchreGame,
    state.euchreSettings.gameSpeed,
    state.initDealer
  ]);

  /** Animate cards going to a player side of the game board after cards have been dealt.
   *
   */
  const moveCardsToPlayer = useCallback(
    (destinationPlayer: EuchrePlayer) => {
      const duration = state.euchreSettings.gameSpeed / 1000;
      const delayBetweenDeal = duration / 5;

      setCardStates((prev) => {
        const newState = [...prev];
        const destRef = playerDeckRefs.get(destinationPlayer.location);

        if (!destRef?.current) throw new Error('Invalid destination ref to move cards to dealer');

        const springsToMove = getSpringsToMoveToPlayer(
          deckCardRefs,
          destRef.current,
          destinationPlayer.location,
          cardStates
        );

        for (const cardState of newState) {
          const spring = springsToMove.at(cardState.cardIndex);

          if (spring) {
            spring.springValue.transition = getTransitionForCardMoved(
              cardState,
              state.euchreSettings.gameSpeed,
              delayBetweenDeal * Math.floor(Math.random() * 3)
            );
            cardState.runEffectForState = EuchreGameFlow.END_DEAL_FOR_DEALER;
            cardState.springValue = spring.springValue;
          }

          cardState.location = destinationPlayer.location;
        }

        return newState;
      });
    },
    [
      cardStates,
      deckCardRefs,
      getSpringsToMoveToPlayer,
      getTransitionForCardMoved,
      playerDeckRefs,
      state.euchreSettings.gameSpeed
    ]
  );

  /**
   * Update the game deck state to handle animation complete for game flow end deal for dealer.
   */
  const setGameDeckStateForEndDealForDealer = useCallback(() => {
    if (!gameDeckState) throw new Error('Invalid deck state for moving cards.');

    setGameDeckState({
      ...gameDeckState,
      dealType: EuchreGameFlow.END_DEAL_FOR_DEALER,
      handleAnimationComplete: handleEndDealForDealerComplete
    });
  }, [gameDeckState, handleEndDealForDealerComplete]);

  /** Create the animation values for the cards being dealt for regular play.
   *
   */
  const dealCardsForRegularPlay = useCallback(() => {
    if (!gameDeckState) throw new Error('Invalid deck state for dealing cards for regular play.');

    const rotation: EuchrePlayer[] = getPlayerRotation(state.euchreGame.gamePlayers, state.euchreGame.dealer);
    const duration: number = state.euchreSettings.gameSpeed / 1000;
    const delayBetweenDeal: number = duration / 5;
    const game: EuchreGameInstance = state.euchreGame;
    const directCenterH = directCenterHRef.current;
    const directCenterV = directCenterVRef.current;

    if (!directCenterH) throw new Error('Invalid direct center ref for dealing cards for regular play.');
    if (!directCenterV) throw new Error('Invalid direct center ref for dealing cards for regular play.');

    setCardStates((prev) => {
      const newState = [...prev];
      const springsForDeal: CardSpringProps[] = getSpringsForDealForRegularPlay(
        outerTableRefs,
        deckCardRefs,
        directCenterH,
        directCenterV,
        rotation,
        game.cardDealCount,
        game.deck,
        game.dealer.location,
        game.trump
      );

      for (const cardState of newState) {
        const spring = springsForDeal.at(cardState.cardIndex);
        const card = game.deck.at(cardState.cardIndex);
        const cardIsTrump = cardState.cardIndex === game.trump.index;
        if (spring && card) {
          const newSrc = cardIsTrump ? getEncodedCardSvg(card, game.dealer.location) : undefined;
          const cardName = cardIsTrump ? getCardFullName(game.trump) : 'Player Card';

          spring.springValue.transition = getTransitionForCardMoved(
            cardState,
            state.euchreSettings.gameSpeed,
            delayBetweenDeal * cardState.cardIndex
          );
          cardState.src = newSrc;
          cardState.cardFullName = cardName;
          cardState.runEffectForState = EuchreGameFlow.BEGIN_DEAL_CARDS;
          cardState.springValue = spring.springValue;
          cardState.location = spring.location;
        } else if (!cardIsTrump) {
          cardState.location = game.dealer.location;
        }
      }

      return newState;
    });

    setGameDeckState({
      ...gameDeckState,
      dealType: EuchreGameFlow.BEGIN_DEAL_CARDS,
      handleAnimationComplete: handleBeginDealForRegularPlayComplete
    });
  }, [
    deckCardRefs,
    directCenterHRef,
    directCenterVRef,
    gameDeckState,
    getCardFullName,
    getEncodedCardSvg,
    getPlayerRotation,
    getSpringsForDealForRegularPlay,
    getTransitionForCardMoved,
    handleBeginDealForRegularPlayComplete,
    outerTableRefs,
    state.euchreGame,
    state.euchreSettings.gameSpeed
  ]);

  /** After cards have been dealt to the player's table area, move cards to outside the bound of the game area, as if the
   * player picked them up.
   */
  const moveCardsToPlayersForRegularPlay = useCallback(() => {
    setCardStates((prev) => {
      const newState = [...prev];
      for (const cardState of newState) {
        if (cardState.location) {
          const destRef = playerDeckRefs.get(cardState.location);
          const cardRef = deckCardRefs.get(cardState.cardIndex);
          const offsets = getDestinationOffset(cardState.location);

          if (destRef?.current && cardRef?.current) {
            const spring = getSpringMoveElement(
              cardRef.current,
              destRef.current,
              undefined,
              cardState.springValue
            );

            spring.x += offsets.x;
            spring.y += offsets.y;

            spring.transition = getTransitionForCardMoved(cardState, state.euchreSettings.gameSpeed);
            cardState.springValue = spring;
          }
        }
      }

      return newState;
    });
  }, [
    deckCardRefs,
    getDestinationOffset,
    getSpringMoveElement,
    getTransitionForCardMoved,
    playerDeckRefs,
    state.euchreSettings.gameSpeed
  ]);

  /** ************************************************************************************************************************************* */
  //#region Effects to control deal animation.

  useEffect(() => {
    try {
      resetForNewDealer();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'resetForNewDealer');
    }
  }, [errorHandlers, resetForNewDealer]);

  /** Initial game deck state for dealer */
  useEffect(() => {
    const beginInitDealerForNewDealerEffect = async () => {
      console.log('[useEffect] - beginInitDealerForNewDealerEffect');
      await initDealerForNewDealerEffect();
    };

    errorHandlers.catchAsync(
      beginInitDealerForNewDealerEffect,
      errorHandlers.onError,
      'beginInitDealerForNewDealerEffect'
    );
  }, [errorHandlers, initDealerForNewDealerEffect]);

  /** */
  useEffect(() => {});

  /** Begin animation for dealing to determine the game's initial dealer. First jack dealt will
   * become the game dealer. This should be only run once at the beginning of the game.
   */
  useEffect(() => {
    const beginAnimationForBeginDealForDealer = async () => {
      const shouldDealCards =
        !initBeginDealForDealerEffect.current &&
        shouldBeginDealForDealer &&
        initForNewDealerEffect &&
        refsReady;

      if (shouldDealCards) {
        console.log('[useEffect] - beginAnimationForBeginDealForDealer');
        initBeginDealForDealerEffect.current = true;
        await gameDelay(state.euchreSettings);

        errorHandlers.catchAsync(
          initAnimationForInitialDeal,
          errorHandlers.onError,
          'initAnimationForInitialDeal'
        );

        await gameDelay(state.euchreSettings);

        dealCardsForInitialDeal();
      }
    };

    errorHandlers.catchAsync(
      beginAnimationForBeginDealForDealer,
      errorHandlers.onError,
      'beginAnimationForBeginDealForDealer'
    );
  }, [
    dealCardsForInitialDeal,
    errorHandlers,
    gameDelay,
    initAnimationForInitialDeal,
    initForNewDealerEffect,
    refsReady,
    shouldBeginDealForDealer,
    state.euchreSettings
  ]);

  /** Pause game after dealing to finish animation. After the delay, move cards to the new dealer.*/
  useEffect(() => {
    const endAnimationForBeginDealForDealer = async () => {
      const endAnimate = endInitialDeal && !endBeginDealForDealerEffect.current;

      if (endAnimate) {
        console.log('[useEffect] - endAnimationForBeginDealForDealer');
        endBeginDealForDealerEffect.current = true;
        animationHandlers.handleBeginDealForDealerComplete();
      }
    };

    errorHandlers.catchAsync(
      endAnimationForBeginDealForDealer,
      errorHandlers.onError,
      'endAnimationForBeginDealForDealer'
    );
  }, [animationHandlers, endInitialDeal, errorHandlers]);

  /**
   * After completing animation for initial dealer, animate moving cards to the new dealer.
   */
  useEffect(() => {
    const beginAnimationForEndDealForDealer = async () => {
      const shouldAnimate = !initEndDealForDealerEffect.current && shouldEndDealForDealer;

      if (shouldAnimate) {
        console.log('[useEffect] - beginAnimationForEndDealForDealer');
        initEndDealForDealerEffect.current = true;

        if (!state.initDealer) throw new Error('Invalid deal result for moving cards.');

        setGameDeckStateForEndDealForDealer();
        moveCardsToPlayer(state.initDealer.newDealer);
      }
    };

    errorHandlers.catchAsync(
      beginAnimationForEndDealForDealer,
      errorHandlers.onError,
      'beginAnimationForEndDealForDealer'
    );
  }, [
    errorHandlers,
    moveCardsToPlayer,
    setGameDeckStateForEndDealForDealer,
    shouldEndDealForDealer,
    state.initDealer
  ]);

  /** Animate dealing cards for regular play. This should be run at the beginning of each hand during regular play. */
  useEffect(() => {
    const beginAnimationForRegularPlay = async () => {
      const shouldAnimate = !initBeginDealForRegularPlayEffect.current && shouldBeginDealCards;

      if (shouldAnimate) {
        console.log('[useEffect] - beginAnimationForRegularPlay');
        initBeginDealForRegularPlayEffect.current = true;
        await initAnimationForInitialDeal();
        dealCardsForRegularPlay();
      }
    };

    errorHandlers.catchAsync(
      beginAnimationForRegularPlay,
      errorHandlers.onError,
      'beginAnimationForRegularPlay'
    );
  }, [dealCardsForRegularPlay, errorHandlers, initAnimationForInitialDeal, shouldBeginDealCards]);

  /** After cards have been dealt for regular play, animate moving cards to player's hand area. After animation is complete,
   * move to the next state to show player's cards. This is the last state to be run in this hook.
   * Player card animation is handled is useCardState.ts
   */
  useEffect(() => {
    const endAnimationForRegularPlay = async () => {
      const shouldAnimate = endRegularDeal && !endBeginDealForRegularPlayEffect.current;

      if (shouldAnimate) {
        console.log('[useEffect] - endAnimationForRegularPlay');
        endBeginDealForRegularPlayEffect.current = true;
        moveCardsToPlayersForRegularPlay();
        await gameDelay(state.euchreSettings);
        animationHandlers.handleBeginRegularDealComplete();
      }
    };

    errorHandlers.catchAsync(endAnimationForRegularPlay, errorHandlers.onError, 'endAnimationForRegularPlay');
  }, [
    animationHandlers,
    endRegularDeal,
    errorHandlers,
    gameDelay,
    moveCardsToPlayersForRegularPlay,
    state.euchreSettings
  ]);

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
    cardStates
  };
};

export default useDeckState;

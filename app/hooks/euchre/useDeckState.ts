import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  EuchreAnimationHandlers,
  EuchreGameValues,
  EuchrePlayer
} from '../../lib/euchre/definitions/game-state-definitions';
import { EuchreGameFlow } from './reducers/gameFlowReducer';
import { EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { EuchrePauseType } from './reducers/gamePauseReducer';
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

export interface GameDeckState {
  deck: Card[];
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>;
  handleAnimationComplete: () => void;
  dealType: EuchreGameFlow;
  initSpringValue?: CardSpringTarget;
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
  outerTableRefs: Map<number, RefObject<HTMLDivElement | null>>,
  directCenterRef: RefObject<HTMLDivElement | null>,
  animationHandlers: EuchreAnimationHandlers
) => {
  const {
    getRandomDamping,
    getRandomStiffness,
    getTransitionForCardMoved,
    getSpringsForDealForDealer,
    getSpringsToMoveToPlayer,
    getSpringMoveElement,
    getCardOffsetForLocation,
    getSpringsForDealForRegularPlay,
    getElementOriginalPosition
  } = useCardTransform();
  const { getPlayerRotation } = usePlayerData();
  const { getCardFullName, getEncodedCardSvg } = useCardSvgData();
  const { gameDelay } = useGameData();
  const { getDisplayWidth, getDisplayHeight, getCardBackSrc } = useCardData();
  const { getGameStatesForDeal } = useGameStateLogic();

  /** Used to position the deck near the player when dealing and animation to bring the deck into view. */
  const deckAnimationControls = useAnimation();

  /** Game deck state of values used when rendering the game deck and for animation. */
  const [gameDeckState, setGameDeckState] = useState<GameDeckState | undefined>();

  /** Card states used for animation of cards in the game deck. */
  const [cardStates, setCardStates] = useState<CardState[]>([]);

  /** Set to true to trigger an effect that the deal for initial dealer is finished and should proceed to the next state in the game flow. */
  const [endInitialDeal, setEndInitialDeal] = useState(false);

  const [endMoveCardsToDealer, setEndMoveCardsToDealer] = useState(false);
  const initDealerState = useRef(false);
  const initBeginDealForDealer = useRef(false);

  /** Used to prevent the same effect from triggering more than once. Set to true when the handler is triggered during the initial
   * deal phase, during begin deal for dealer game flow.
   */
  const endBeginDealForDealer = useRef(false);
  const initEndDealForDealer = useRef(false);
  const cardsDealtCount = useRef(0);
  const initBeginDealForRegularPlay = useRef(false);
  const endBeginDealForRegularPlay = useRef(false);

  /** Elements associated with a player's area, outside of the table. */
  const playerDeckRefs = useTableRef(4);

  /** Elements associated with a player's area, closer to the center of the table. */
  const playerInnerDeckRefs = useTableRef(4);

  /** map of card index to reference to the card elements, used to calc transitions between elements */
  const deckCardRefs = useCardRefs(24);

  /** Reference to the element containing the deck of cards to be dealt. */
  const gameDeckRef = useRef<HTMLDivElement>(null);
  const gameDeckVisible = getGameStatesForDeal().includes(state.euchreGameFlow.gameFlow);
  /** ************************************************************************************************************************************* */

  /**
   * Reset game state for a new game.
   */
  const resetState = () => {
    setGameDeckState(undefined);
    setCardStates([]);
    setEndInitialDeal(false);
    initDealerState.current = false;
    initBeginDealForDealer.current = false;
    endBeginDealForDealer.current = false;
    initEndDealForDealer.current = false;
    cardsDealtCount.current = 0;
    initBeginDealForRegularPlay.current = false;
    endBeginDealForRegularPlay.current = false;
  };

  /** Increment the card count when dealing cards for initial deal. Once the cards have been dealt,
   * this should then trigger an effect for the next animation state.
   */
  const handleBeginDealForDealerComplete = useCallback(() => {
    //console.log('[handleBeginDealForDealerComplete] - ', cardsDealtCount.current);
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
    //console.log('[handleEndDealForDealerComplete] - ', cardsDealtCount.current);
    if (cardsDealtCount.current === 23) {
      setEndMoveCardsToDealer(true);
      cardsDealtCount.current = 0;
      animationHandlers.handleEndDealForDealerComplete();
    } else {
      cardsDealtCount.current += 1;
    }
  }, [animationHandlers]);

  /** Create the intial card state values for beginning deal.
   *
   */
  const createCardStatesFromGameDeck = useCallback(
    (location: TableLocation, includeCardValue: boolean) => {
      const newCardStates: CardState[] = [];
      const initZIndex = DEFAULT_SPRING_VAL.zIndex ?? 30;
      const centerLocation = location === 'top' || location === 'bottom';

      const initSpringValue: CardSpringTarget = {
        ...DEFAULT_SPRING_VAL,
        rotateY: centerLocation ? 180 : 0,
        rotateX: centerLocation ? 0 : 180
      };

      for (const card of state.euchreGame.deck) {
        const cardState: CardState = {
          cardIndex: card.index,
          src: includeCardValue ? getEncodedCardSvg(card, location) : getCardBackSrc(location),
          cardFullName: getCardFullName(card),
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
          enabled: false
        };

        newCardStates.push(cardState);
      }

      return newCardStates;
    },
    [
      getCardBackSrc,
      getCardFullName,
      getEncodedCardSvg,
      getRandomDamping,
      getRandomStiffness,
      state.euchreGame.deck
    ]
  );

  /**
   * Initialize game deck state and card state for beginning a new deal.
   */
  const initDeckStateForNewDealer = useCallback(async () => {
    const location = state.euchreGame.dealer.location;

    const newGameDeckState: GameDeckState = {
      deck: state.euchreGame.deck,
      cardRefs: deckCardRefs,
      handleAnimationComplete: () => null,
      dealType: EuchreGameFlow.BEGIN_INTRO,
      location: location,
      playerNumber: state.euchreGame.dealer.playerNumber,
      initSpringValue: { ...DEFAULT_SPRING_VAL, opacity: 0 },
      handId: state.euchreGame.handId,
      gameId: state.euchreGame.gameId,
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

    setGameDeckState(newGameDeckState);
    setCardStates(createCardStatesFromGameDeck(location, true));
  }, [
    createCardStatesFromGameDeck,
    deckAnimationControls,
    deckCardRefs,
    gameDeckState,
    getDisplayHeight,
    getDisplayWidth,
    state.euchreGame.dealer.location,
    state.euchreGame.dealer.playerNumber,
    state.euchreGame.deck,
    state.euchreGame.gameId,
    state.euchreGame.handId
  ]);

  /** Function that's called from an effect to initialize the game deck state for a new deal.
   * Only executes if the game deck has yet to be created, or the hand ID has changed.
   */
  const initDealerForNewDealerEffect = useCallback(async () => {
    const handChanged = gameDeckState === undefined || gameDeckState.handId !== state.euchreGame.handId;
    const validDeck =
      state.euchreGame.deck.length === 24 && !state.euchreGame.deck.find((c) => c.value === 'P');

    if (handChanged && validDeck) {
      console.log('[initDealerForNewDealer] - running init dealer change. game state: ', state);
      await initDeckStateForNewDealer();
    }
  }, [gameDeckState, initDeckStateForNewDealer, state]);

  /** Move cards from its absolute postion to the dealer card area. Then animate the cards into a visible area
   * to prepare them for being dealt.
   */
  const initAnimationForInitialDeal = useCallback(async () => {
    if (!gameDeckState) throw new Error('Invalid game deck state for initializing deal.');

    const destRef = playerDeckRefs.get(gameDeckState.playerNumber);

    if (!destRef?.current) throw new Error('Invalid destination ref for initializing deal.');
    if (!gameDeckRef.current) throw new Error('Invalid game deck ref for initializing deal.');
    if (!directCenterRef.current) throw new Error('Invalid direct center ref for initializing deal.');

    const duration = state.euchreSettings.gameSpeed / 1000;
    const srcRect = getElementOriginalPosition(gameDeckRef.current);
    const destRect = getElementOriginalPosition(destRef.current);
    const relativeRect = getElementOriginalPosition(directCenterRef.current);

    const moveToElementSpring = getSpringMoveElement(gameDeckRef.current, destRef.current);
    const offsets = getCardOffsetForLocation(srcRect, destRect, relativeRect, 'out');

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

    //console.log('[initGameDeckStateForInitialDeal] - begin deck animation: ', initMoveToDealer);
    await deckAnimationControls.start(initMoveToDealer);
    await deckAnimationControls.start(moveIntoView);
  }, [
    deckAnimationControls,
    directCenterRef,
    gameDeckState,
    getCardOffsetForLocation,
    getElementOriginalPosition,
    getSpringMoveElement,
    playerDeckRefs,
    state.euchreSettings.gameSpeed
  ]);

  /**
   * Create the animation values for the cards being dealt for initial deal.
   * */
  const dealCardsForInitialDeal = useCallback(() => {
    const rotation: EuchrePlayer[] = getPlayerRotation(state.euchreGame.gamePlayers, state.euchreGame.dealer);
    const duration: number = state.euchreSettings.gameSpeed / 1000;
    const delayBetweenDeal: number = duration / 2;

    if (!gameDeckState) throw new Error('Invalid deck state for dealing cards.');
    if (!directCenterRef.current) throw new Error('Invalid direct center ref for initializing deal.');

    setCardStates((prev) => {
      if (!state.initDealer) throw new Error('Invalid deal result for dealing cards.');

      const springsForDeal: CardSpringProps[] = getSpringsForDealForDealer(
        outerTableRefs,
        deckCardRefs,
        directCenterRef,
        rotation,
        state.euchreGame.deck,
        state.initDealer
      );

      for (const updatedSpring of springsForDeal) {
        const cardState = prev.at(updatedSpring.cardIndex);

        if (cardState) {
          updatedSpring.springValue.transition = getTransitionForCardMoved(
            cardState,
            state.euchreSettings.gameSpeed,
            delayBetweenDeal * cardState.cardIndex
          );
          cardState.runEffectForState = EuchreGameFlow.BEGIN_DEAL_FOR_DEALER;
          cardState.springValue = updatedSpring.springValue;
        }
      }

      return [...prev];
    });

    setGameDeckState({
      ...gameDeckState,
      dealType: EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
      handleAnimationComplete: handleBeginDealForDealerComplete
    });
  }, [
    deckCardRefs,
    directCenterRef,
    gameDeckState,
    getPlayerRotation,
    getSpringsForDealForDealer,
    getTransitionForCardMoved,
    handleBeginDealForDealerComplete,
    outerTableRefs,
    state.euchreGame.dealer,
    state.euchreGame.deck,
    state.euchreGame.gamePlayers,
    state.euchreSettings.gameSpeed,
    state.initDealer
  ]);

  /** Animate cards going to a player side of the game board. */
  const moveCardsToPlayer = useCallback(
    (destinationPlayer: EuchrePlayer) => {
      const duration = state.euchreSettings.gameSpeed / 1000;
      const delayBetweenDeal = duration / 5;

      setCardStates((prev) => {
        const destRef = playerDeckRefs.get(destinationPlayer.playerNumber);

        if (!destRef?.current) throw new Error('Invalid destination ref to move cards to dealer');

        const springsToMove = getSpringsToMoveToPlayer(
          deckCardRefs,
          destRef.current,
          destinationPlayer.location,
          cardStates
        );

        for (const updatedSpring of springsToMove) {
          const cardState = prev.at(updatedSpring.cardIndex);

          if (cardState) {
            updatedSpring.springValue.transition = getTransitionForCardMoved(
              cardState,
              state.euchreSettings.gameSpeed,
              delayBetweenDeal * Math.floor(Math.random() * 3)
            );
            cardState.runEffectForState = EuchreGameFlow.END_DEAL_FOR_DEALER;
            cardState.springValue = updatedSpring.springValue;
          }
        }

        return [...prev];
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

  /** */
  const setGameStateForEndDealForDealer = useCallback(() => {
    if (!gameDeckState) throw new Error('Invalid deck state for moving cards.');

    setGameDeckState({
      ...gameDeckState,
      dealType: EuchreGameFlow.END_DEAL_FOR_DEALER,
      handleAnimationComplete: handleEndDealForDealerComplete
    });
  }, [gameDeckState, handleEndDealForDealerComplete]);

  /** Create the animation values for the cards being dealt for regular play. */
  const dealCardsForRegularPlay = useCallback(() => {
    const rotation: EuchrePlayer[] = getPlayerRotation(state.euchreGame.gamePlayers, state.euchreGame.dealer);
    const duration: number = state.euchreSettings.gameSpeed / 1000;
    const delayBetweenDeal: number = duration / 3;

    if (!gameDeckState) throw new Error('Invalid deck state for dealing cards for regular play.');
    if (!directCenterRef) throw new Error('Invalid direct center ref for initializing deal.');

    const longSide = Math.max(gameDeckState.width, gameDeckState.height);

    setCardStates((prev) => {
      const springsForDeal: CardSpringProps[] = getSpringsForDealForRegularPlay(
        outerTableRefs,
        deckCardRefs,
        directCenterRef,
        rotation,
        state.euchreGame.cardDealCount,
        state.euchreGame.deck,
        state.euchreGame.dealer.location,
        state.euchreGame.trump
      );

      for (const updatedSpring of springsForDeal) {
        const cardState = prev.at(updatedSpring.cardIndex);

        if (cardState) {
          const newSrc = updatedSpring.cardIndex !== cardState.cardIndex ? undefined : cardState.src;

          updatedSpring.springValue.transition = getTransitionForCardMoved(
            cardState,
            state.euchreSettings.gameSpeed,
            delayBetweenDeal * cardState.cardIndex
          );
          cardState.src = newSrc;
          cardState.runEffectForState = EuchreGameFlow.BEGIN_DEAL_CARDS;
          cardState.springValue = updatedSpring.springValue;
        }
      }

      return [...prev];
    });

    setGameDeckState({
      ...gameDeckState,
      dealType: EuchreGameFlow.BEGIN_DEAL_CARDS,
      handleAnimationComplete: () => null
    });
  }, [
    deckCardRefs,
    directCenterRef,
    gameDeckState,
    getPlayerRotation,
    getSpringsForDealForRegularPlay,
    getTransitionForCardMoved,
    outerTableRefs,
    state.euchreGame.cardDealCount,
    state.euchreGame.dealer,
    state.euchreGame.deck,
    state.euchreGame.gamePlayers,
    state.euchreGame.trump,
    state.euchreSettings.gameSpeed
  ]);

  const getDealCompleteEvent = (): (() => void) => {
    return handleBeginDealForDealerComplete;
  };

  /** ************************************************************************************************************************************* */
  //#region Effects to control deal animation.

  /** Initial game deck state for dealer */
  useEffect(() => {
    const beginInitDealerForNewDealerEffect = async () => {
      await initDealerForNewDealerEffect();
    };
    beginInitDealerForNewDealerEffect();
  }, [initDealerForNewDealerEffect]);

  /** Begin animation for dealing to determine the game's initial dealer. First jack dealt will
   * become the game dealer.
   */
  useEffect(() => {
    const beginAnimationForBeginDealForDealer = async () => {
      const shouldDealCards =
        !initBeginDealForDealer.current &&
        state.euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_FOR_DEALER &&
        state.euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
        state.euchrePauseState.pauseType === EuchrePauseType.ANIMATE;

      if (shouldDealCards) {
        console.log('[beginAnimationForBeginDealForDealer]');
        initBeginDealForDealer.current = true;
        await gameDelay(state.euchreSettings);
        await initAnimationForInitialDeal();
        await gameDelay(state.euchreSettings);
        dealCardsForInitialDeal();
      }
    };

    beginAnimationForBeginDealForDealer();
  }, [
    dealCardsForInitialDeal,
    gameDelay,
    initAnimationForInitialDeal,
    initDealerForNewDealerEffect,
    state.euchreAnimationFlow.animationType,
    state.euchreGameFlow.gameFlow,
    state.euchrePauseState.pauseType,
    state.euchreSettings
  ]);

  /** Pause game after dealing to finish animation. After the delay, move cards to the new dealer.*/
  useEffect(() => {
    const endAnimationForBeginDealForDealer = async () => {
      const endAnimate = endInitialDeal && !endBeginDealForDealer.current;

      if (endAnimate) {
        endBeginDealForDealer.current = true;
        console.log('[endAnimationForBeginDealForDealer]');
        animationHandlers.handleBeginDealForDealerComplete();
      }
    };

    endAnimationForBeginDealForDealer();
  }, [animationHandlers, endInitialDeal]);

  /**
   * After completing animation for initial dealer, animate moving cards to the new dealer.
   */
  useEffect(() => {
    const beginAnimationForEndDealForDealer = async () => {
      const shouldAnimate =
        !initEndDealForDealer.current &&
        state.euchreGameFlow.gameFlow === EuchreGameFlow.END_DEAL_FOR_DEALER &&
        state.euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
        state.euchrePauseState.pauseType === EuchrePauseType.ANIMATE;

      if (shouldAnimate) {
        initEndDealForDealer.current = true;
        console.log('[beginAnimationForEndDealForDealer] move cards to new dealer');

        if (!state.initDealer) throw new Error('Invalid deal result for moving cards.');

        setGameStateForEndDealForDealer();
        moveCardsToPlayer(state.initDealer.newDealer);
      }
    };

    beginAnimationForEndDealForDealer();
  }, [
    animationHandlers,
    gameDelay,
    moveCardsToPlayer,
    setGameStateForEndDealForDealer,
    state.euchreAnimationFlow.animationType,
    state.euchreGameFlow.gameFlow,
    state.euchrePauseState.pauseType,
    state.euchreSettings,
    state.initDealer
  ]);

  useEffect(() => {
    const beginAnimationForRegularPlay = async () => {
      const shouldDealCards =
        !initBeginDealForRegularPlay.current &&
        state.euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_CARDS &&
        state.euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
        state.euchrePauseState.pauseType === EuchrePauseType.ANIMATE;

      if (shouldDealCards) {
        initBeginDealForRegularPlay.current = true;
        console.log('[beginAnimationForRegularPlay]');
        await initAnimationForInitialDeal();
        dealCardsForRegularPlay();
        //dealerPlayerNumber.current = state.euchreGame.dealer.playerNumber;

        //await gameDelay(state.euchreSettings);
        //dealCardsForInitialDeal();
      }
    };

    beginAnimationForRegularPlay();
  }, [
    dealCardsForRegularPlay,
    gameDelay,
    initAnimationForInitialDeal,
    state.euchreAnimationFlow.animationType,
    state.euchreGameFlow.gameFlow,
    state.euchrePauseState.pauseType,
    state.euchreSettings
  ]);
  //#endregion

  return {
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

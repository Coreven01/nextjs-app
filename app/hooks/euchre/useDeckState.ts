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
import { Card } from '../../lib/euchre/definitions/definitions';
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
  location: 'center' | 'side';
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
  animationHandlers: EuchreAnimationHandlers
) => {
  const {
    getRandomDamping,
    getRandomStiffness,
    getTransitionForCardPlayed,
    getSpringsForDealForDealer,
    getSpringsToMoveToDealer,
    getSpringMoveElement,
    getCardOffsetForPlayer
  } = useCardTransform();
  const { playerLocation, getPlayerRotation } = usePlayerData();
  const { getCardFullName, getEncodedCardSvg } = useCardSvgData();
  const { gameDelay } = useGameData();
  const { getDisplayWidth, getDisplayHeight } = useCardData();
  const { getGameStatesForDeal } = useGameStateLogic();

  const deckAnimationControls = useAnimation();

  /** Game deck state of values used when rendering the game deck and for animation. */
  const [gameDeckState, setGameDeckState] = useState<GameDeckState | undefined>();

  /** Card states used for animation of cards in the game deck. */
  const [cardStates, setCardStates] = useState<CardState[]>([]);

  /** Set to true to trigger an effect that the deal for initial dealer is finished and should proceed to the next state in the game flow. */
  const [endInitialDeal, setEndInitialDeal] = useState(false);
  const initDealerState = useRef(false);
  const initBeginDealForDealer = useRef(false);

  /** Used to prevent the same effect from triggering more than once. Set to true when the handler is triggered during the initial
   * deal phase, during begin deal for dealer game flow.
   */
  const endBeginDealForDealer = useRef(false);
  const initEndDealForDealer = useRef(false);
  const dealForDealerCardCount = useRef(0);
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
    dealForDealerCardCount.current = 0;
    initBeginDealForRegularPlay.current = false;
    endBeginDealForRegularPlay.current = false;
  };

  /** Increment the card count when dealing cards for initial deal. Once the cards have been dealt,
   * this should then trigger an effect for the next animation state.
   */
  const handleBeginDealForDealerComplete = useCallback(() => {
    console.log('[handleBeginDealForDealerComplete] - ', dealForDealerCardCount.current);
    if (dealForDealerCardCount.current === state.initDealer?.cardIndex) {
      setEndInitialDeal(true);
    }

    dealForDealerCardCount.current += 1;
  }, [state.initDealer?.cardIndex]);

  /** Create the intial card state values for beginning deal. */
  const createCardStatesFromGameDeck = useCallback(
    (location: 'center' | 'side') => {
      const newCardStates: CardState[] = [];

      for (const card of state.euchreGame.deck) {
        const cardState: CardState = {
          cardIndex: card.index,
          src: getEncodedCardSvg(card, location),
          cardFullName: getCardFullName(card),
          initSpringValue: { ...DEFAULT_SPRING_VAL, opacity: 1, y: 0, rotateY: 180 },
          xDamping: getRandomDamping(),
          xStiffness: getRandomStiffness(),
          yDamping: getRandomDamping(),
          yStiffness: getRandomDamping(),
          rotation: 45,
          enabled: false
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
  const initStateForNewDealer = useCallback(async () => {
    const location = playerLocation(state.euchreGame.dealer);
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
      deckAnimationControls.start({
        ...DEFAULT_SPRING_VAL,
        opacity: 0,
        transition: { x: { duration: 0, y: { duration: 0 }, opacity: { duration: 0 } } }
      });
    }

    setCardStates(createCardStatesFromGameDeck(location));
    setGameDeckState(newGameDeckState);
  }, [
    createCardStatesFromGameDeck,
    deckAnimationControls,
    deckCardRefs,
    gameDeckState,
    getDisplayHeight,
    getDisplayWidth,
    playerLocation,
    state.euchreGame.dealer,
    state.euchreGame.deck,
    state.euchreGame.gameId,
    state.euchreGame.handId
  ]);

  const initDealerForNewDealerEffect = useCallback(async () => {
    const handChanged = gameDeckState === undefined || gameDeckState.handId !== state.euchreGame.handId;
    const validDeck =
      state.euchreGame.deck.length === 24 && !state.euchreGame.deck.find((c) => c.value === 'P');

    if (handChanged && validDeck) {
      console.log('[initDealerForNewDealer] - running init dealer change. game state: ', state);
      await initStateForNewDealer();
    }
  }, [gameDeckState, initStateForNewDealer, state]);

  /** */
  const initAnimationForInitialDeal = useCallback(async () => {
    if (!gameDeckState) throw new Error('Invalid game deck state for initializing deal.');
    const destRef = playerDeckRefs.get(gameDeckState.playerNumber);

    if (!destRef?.current) throw new Error('Invalid destination ref for initializing deal.');
    if (!gameDeckRef.current) throw new Error('Invalid game deck ref for initializing deal.');

    const renderedDeckRect = gameDeckRef.current.getBoundingClientRect();
    const width = renderedDeckRect.width;
    const height = renderedDeckRect.height;
    const duration = state.euchreSettings.gameSpeed / 1000;
    const moveToElementSpring = getSpringMoveElement(gameDeckRef.current, destRef.current);
    const offsets = getCardOffsetForPlayer(gameDeckState.playerNumber, Math.max(width, height));
    const initMoveToDealer = {
      ...moveToElementSpring,
      opacity: 0,
      x: moveToElementSpring.x - offsets.x,
      y: moveToElementSpring.y - offsets.y,
      transition: { opacity: { duration: 0 }, x: { duration: 0 }, y: { duration: 0 } }
    };

    const moveIntoView = {
      ...initMoveToDealer,
      opacity: 1,
      x: initMoveToDealer.x + offsets.x,
      y: initMoveToDealer.y + offsets.y,
      transition: { opacity: { duration: duration }, x: { duration: duration }, y: { duration: duration } }
    };

    console.log('[initGameDeckStateForInitialDeal] - begin deck animation: ', initMoveToDealer);
    await deckAnimationControls.start(initMoveToDealer);
    await deckAnimationControls.start(moveIntoView);
  }, [
    deckAnimationControls,
    gameDeckState,
    getCardOffsetForPlayer,
    getSpringMoveElement,
    playerDeckRefs,
    state.euchreSettings.gameSpeed
  ]);

  /** Create the animation values for the cards being dealt for initial deal. */
  const dealCardsForInitialDeal = useCallback(() => {
    const rotation: EuchrePlayer[] = getPlayerRotation(state.euchreGame.gamePlayers, state.euchreGame.dealer);
    const duration: number = state.euchreSettings.gameSpeed / 1000;
    const delayBetweenDeal: number = duration / 2;

    if (!gameDeckState) throw new Error('Invalid deck state for dealing cards.');

    setCardStates((prev) => {
      if (!state.initDealer) throw new Error('Invalid deal result for dealing cards.');

      const springsForDeal: CardSpringProps[] = getSpringsForDealForDealer(
        outerTableRefs,
        deckCardRefs,
        rotation,
        state.euchreGame.deck,
        state.initDealer
      );

      for (const updatedSpring of springsForDeal) {
        const cardState = prev.at(updatedSpring.cardIndex);

        if (cardState) {
          updatedSpring.springValue.transition = getTransitionForCardPlayed(
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
    gameDeckState,
    getPlayerRotation,
    getSpringsForDealForDealer,
    getTransitionForCardPlayed,
    handleBeginDealForDealerComplete,
    outerTableRefs,
    state.euchreGame.dealer,
    state.euchreGame.deck,
    state.euchreGame.gamePlayers,
    state.euchreSettings.gameSpeed,
    state.initDealer
  ]);

  const moveCardsToDealer = useCallback(() => {
    const duration = state.euchreSettings.gameSpeed / 1000;
    const delayBetweenDeal = duration / 5;

    setCardStates((prev) => {
      if (!state.initDealer) throw new Error('Invalid deal result for dealing cards.');

      const destRef = playerDeckRefs.get(state.initDealer.newDealer.playerNumber);

      if (!destRef?.current) throw new Error('Invalid destination ref to move cards to dealer');

      const springsToMove = getSpringsToMoveToDealer(
        state.initDealer.newDealer.playerNumber,
        deckCardRefs,
        destRef.current,
        cardStates
      );

      for (const updatedSpring of springsToMove) {
        const cardState = prev.at(updatedSpring.cardIndex);

        if (cardState) {
          updatedSpring.springValue.transition = getTransitionForCardPlayed(
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
  }, [
    deckCardRefs,
    cardStates,
    getSpringsToMoveToDealer,
    getTransitionForCardPlayed,
    playerDeckRefs,
    state.euchreSettings.gameSpeed,
    state.initDealer
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
    state.euchreAnimationFlow.animationType,
    state.euchreGameFlow.gameFlow,
    state.euchrePauseState.pauseType,
    state.euchreSettings
  ]);

  /** Pause game after dealing to finish animation. After the delay, move cards to the new dealer.*/
  useEffect(() => {
    const endAnimationForDealForDealer = async () => {
      const endAnimate = endInitialDeal && !endBeginDealForDealer.current;

      if (endAnimate) {
        endBeginDealForDealer.current = true;
        console.log('[endAnimationForDealForDealer]');
        animationHandlers.handleBeginDealForDealerComplete();
      }
    };

    endAnimationForDealForDealer();
  }, [animationHandlers, endInitialDeal]);

  /**
   * After completing animation for initial dealer, animate cards to the new dealer.
   */
  useEffect(() => {
    const endAnimationForDealForDealer = async () => {
      const shouldAnimate =
        !initEndDealForDealer.current &&
        state.euchreGameFlow.gameFlow === EuchreGameFlow.END_DEAL_FOR_DEALER &&
        state.euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
        state.euchrePauseState.pauseType === EuchrePauseType.ANIMATE;

      if (shouldAnimate) {
        initEndDealForDealer.current = true;
        console.log('[endAnimationForDealForDealer] move cards to new dealer');
        moveCardsToDealer();
        await gameDelay(state.euchreSettings);
        animationHandlers.handleEndDealForDealerComplete();
      }
    };

    endAnimationForDealForDealer();
  }, [
    animationHandlers,
    gameDelay,
    moveCardsToDealer,
    state.euchreAnimationFlow.animationType,
    state.euchreGameFlow.gameFlow,
    state.euchrePauseState.pauseType,
    state.euchreSettings
  ]);

  useEffect(() => {
    const beginAnimationForRegularPlay = async () => {
      const shouldDealCards =
        !initBeginDealForRegularPlay.current &&
        state.euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_CARDS &&
        state.euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
        state.euchrePauseState.pauseType === EuchrePauseType.ANIMATE;

      if (shouldDealCards) {
        console.log('[beginAnimationForRegularPlay]');
        //dealerPlayerNumber.current = state.euchreGame.dealer.playerNumber;
        initBeginDealForRegularPlay.current = true;
        await gameDelay(state.euchreSettings);
        //dealCardsForInitialDeal();
      }
    };

    //beginAnimationForRegularPlay();
  }, [
    dealCardsForInitialDeal,
    gameDelay,
    state.euchreAnimationFlow.animationType,
    state.euchreGame.dealer.playerNumber,
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

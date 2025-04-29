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
import useCardTransform, { CardSpringProps, DEFAULT_SPRING_VAL } from './data/useCardTransform';
import useCardSvgData from './data/useCardSvgData';
import usePlayerData from './data/usePlayerData';
import useCardRefs from './useCardRefs';

/** */
const useHandState = (
  state: EuchreGameValues,
  /** map of player number to the player's card deck area element. */
  playerDeckRefs: Map<number, RefObject<HTMLDivElement | null>>,
  outerTableRefs: Map<number, RefObject<HTMLDivElement | null>>,
  animationHandlers: EuchreAnimationHandlers
) => {
  const {
    groupHand,
    getSpringsForCardPlayed,
    getRandomDamping,
    getRandomStiffness,
    getRandomRotation,
    getSpringsForCardInit,
    getCalculatedWidthOffset,
    getSpringForTrickTaken,
    getTransitionForCardPlayed,
    getSpringsForDealForDealer,
    getSpringsToMoveToDealer
  } = useCardTransform();
  const { playerLocation, playerEqual, availableCardsToPlay, getPlayerRotation } = usePlayerData();
  const { getCardFullName, getEncodedCardSvg } = useCardSvgData();
  const { gameDelay } = useGameData();
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [endInitialDeal, setEndInitialDeal] = useState(false);

  /** Dealer number used for positioning and transformations. Separate reference here because the game state player number may change
   * before completing the animation state.
   */
  const dealerPlayerNumber = useRef(0);
  const initBeginDealForDealer = useRef(false);
  const endBeginDealForDealer = useRef(false);
  const initEndDealForDealer = useRef(false);
  const dealForDealerCardCount = useRef(0);
  const initBeginDealForRegularPlay = useRef(false);
  const endBeginDealForRegularPlay = useRef(false);

  /** map of card index to reference to the card elements, used to calc transitions between elements */
  const cardRefs = useCardRefs(24);

  const showDeckForInitDeal: boolean =
    cardStates.length === 24 &&
    (state.euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_FOR_DEALER ||
      state.euchreGameFlow.gameFlow === EuchreGameFlow.END_DEAL_FOR_DEALER);

  const showDeckForRegularDeal: boolean =
    cardStates.length === 24 &&
    (state.euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_CARDS ||
      state.euchreGameFlow.gameFlow === EuchreGameFlow.END_DEAL_CARDS);

  const getShouldShowDeck = (currentPlayer: EuchrePlayer): boolean => {
    if (showDeckForInitDeal && currentPlayer.playerNumber === dealerPlayerNumber.current) {
      return true;
    } else if (showDeckForRegularDeal && currentPlayer.playerNumber === dealerPlayerNumber.current) {
      return true;
    }
    return false;
  };

  /** Create the intial card state values for beginning deal. */
  const createCardStatesFromGameDeck = useCallback(() => {
    const location = playerLocation(state.euchreGame.dealer);
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

    setCardStates(newCardStates);
  }, [
    getCardFullName,
    getEncodedCardSvg,
    getRandomDamping,
    getRandomStiffness,
    playerLocation,
    state.euchreGame.dealer,
    state.euchreGame.deck
  ]);

  /** Create the animation values for the cards being dealt for initial deal. */
  const dealCardsForInitialDeal = useCallback(() => {
    const rotation: EuchrePlayer[] = getPlayerRotation(state.euchreGame.gamePlayers, state.euchreGame.dealer);
    const duration: number = state.euchreSettings.gameSpeed / 1000;
    const delayBetweenDeal: number = duration / 2;

    setCardStates((prev) => {
      if (!state.initDealer) throw new Error('Invalid deal result for dealing cards.');

      const springsForDeal: CardSpringProps[] = getSpringsForDealForDealer(
        outerTableRefs,
        cardRefs,
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
  }, [
    cardRefs,
    getPlayerRotation,
    getSpringsForDealForDealer,
    getTransitionForCardPlayed,
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
        cardRefs,
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
    cardRefs,
    cardStates,
    getSpringsToMoveToDealer,
    getTransitionForCardPlayed,
    playerDeckRefs,
    state.euchreSettings.gameSpeed,
    state.initDealer
  ]);

  /** Increment the card count when dealing cards for initial deal. Once the cards have been dealt,
   * this should then trigger an effect for the next animation state.
   */
  const handleBeginDealForDealerComplete = () => {
    if (dealForDealerCardCount.current === state.initDealer?.cardIndex) setEndInitialDeal(true);
    dealForDealerCardCount.current += 1;
  };

  const getDealCompleteEvent = (): (() => void) => {
    return handleBeginDealForDealerComplete;
  };
  //#region Effects to control deal animation.

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
        dealerPlayerNumber.current = state.euchreGame.dealer.playerNumber;
        initBeginDealForDealer.current = true;
        createCardStatesFromGameDeck();
        await gameDelay(state.euchreSettings);
        //dealCardsForInitialDeal();
      }
    };

    beginAnimationForBeginDealForDealer();
  }, [
    createCardStatesFromGameDeck,
    dealCardsForInitialDeal,
    gameDelay,
    state.euchreAnimationFlow.animationType,
    state.euchreGame.dealer.playerNumber,
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

  /** */
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
        dealerPlayerNumber.current = state.euchreGame.dealer.playerNumber;
        initBeginDealForRegularPlay.current = true;
        createCardStatesFromGameDeck();
        await gameDelay(state.euchreSettings);
        //dealCardsForInitialDeal();
      }
    };

    beginAnimationForRegularPlay();
  }, [
    createCardStatesFromGameDeck,
    dealCardsForInitialDeal,
    gameDelay,
    state.euchreAnimationFlow.animationType,
    state.euchreGame.dealer.playerNumber,
    state.euchreGameFlow.gameFlow,
    state.euchrePauseState.pauseType,
    state.euchreSettings
  ]);
  //#endregion

  return { cardRefs, cardStates, getShouldShowDeck, getDealCompleteEvent };
};

export default useHandState;

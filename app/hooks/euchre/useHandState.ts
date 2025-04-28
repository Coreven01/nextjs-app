import { RefObject, useEffect, useRef, useState } from 'react';
import { EuchreGameValues } from '../../lib/euchre/definitions/game-state-definitions';
import { EuchreGameFlow } from './reducers/gameFlowReducer';
import { EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { EuchrePauseType } from './reducers/gamePauseReducer';
import { CardState } from './reducers/cardStateReducer';
import useGameData from './data/useGameData';
import useCardTransform, { DEFAULT_SPRING_VAL } from './data/useCardTransform';
import useCardSvgData from './data/useCardSvgData';
import usePlayerData from './data/usePlayerData';
import useCardRefs from './useCardRefs';

const useHandState = (
  state: EuchreGameValues,
  /** map of player number to the player's card deck area element. */
  playerDeckRefs: Map<number, RefObject<HTMLDivElement | null>>,
  outerTableRefs: Map<number, RefObject<HTMLDivElement | null>>,
  onDealForDealerComplete: () => void,
  onDealForRegularPlayComplete: () => void
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
    getSpringsForDealForDealer
  } = useCardTransform();
  const { playerLocation, playerEqual, availableCardsToPlay, getPlayerRotation } = usePlayerData();
  const { getCardFullName, getEncodedCardSvg } = useCardSvgData();
  const { gameDelay } = useGameData();
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [initDealCardCount, setInitDealCardCount] = useState<number | undefined>();
  const initDealForDealer = useRef(false);

  /** map of card index to reference to the card elements, used to calc transitions between elements */
  const cardRefs = useCardRefs(24);

  const showDealForDealerDeck: boolean =
    cardStates.length === 24 &&
    state.euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_FOR_DEALER &&
    state.euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
    state.euchrePauseState.pauseType === EuchrePauseType.ANIMATE;

  const createCardStatesFromGameDeck = () => {
    const location = playerLocation(state.euchreGame.dealer);
    const newCardStates: CardState[] = [];
    const duration = state.euchreSettings.gameSpeed / 1000;

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
  };

  const handleDealCardAnimation = () => {
    dealCards();
  };

  const dealCards = () => {
    const rotation = getPlayerRotation(state.euchreGame.gamePlayers, state.euchreGame.dealer);
    const duration = state.euchreSettings.gameSpeed / 1000;
    const delayBetweenDeal = duration / 2;

    setCardStates((prev) => {
      if (!state.initDealer) throw new Error('Invalid deal result for dealing cards.');

      const springForDeal = getSpringsForDealForDealer(
        outerTableRefs,
        cardRefs,
        rotation,
        state.euchreGame.deck,
        state.initDealer
      );

      for (const updatedSpring of springForDeal) {
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
  };

  const handleAnimationComplete = () => {
    //onDealForRegularPlayComplete();
  };

  useEffect(() => {
    const beginAnimationForDealForDealer = async () => {
      const shouldDealCards =
        !initDealForDealer.current &&
        state.euchreGameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_FOR_DEALER &&
        state.euchreAnimationFlow.animationType === EuchreAnimateType.ANIMATE &&
        state.euchrePauseState.pauseType === EuchrePauseType.ANIMATE;

      if (shouldDealCards) {
        initDealForDealer.current = true;
        createCardStatesFromGameDeck();
        await gameDelay(state.euchreSettings, 1);
        handleDealCardAnimation();
      }
    };

    beginAnimationForDealForDealer();
  });

  return { cardRefs, cardStates, showDealForDealerDeck, handleAnimationComplete };
};

export default useHandState;

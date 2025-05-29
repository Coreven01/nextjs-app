import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import useCardRefs from '../common/useCardRefs';
import useCardState from '../../../../app/hooks/euchre/state/useCardState';
import { availableCardsToPlay } from '../../util/game/playerDataUtil';
import { sortCardsIndices } from '../../util/game/cardDataUtil';
import { getCalculatedWidthOffset } from '../../util/play/cardTransformUtil';
import { logConsole } from '../../util/util';
import useCardStateEffect from './useCardStateEffect';
import { EuchrePlayer, GamePlayContext } from '../../definitions/game-state-definitions';
import { Card, TableLocation } from '../../definitions/definitions';
import {
  CardAnimationControls,
  CardInitAnimationState,
  CardPlayAnimationState,
  CardPosition,
  CardSpringProps,
  FlipSpringProps
} from '../../definitions/transform-definitions';
import useCardInitAnimation from './useCardInitAnimation';
import useCardPlayAnimation from './useCardPlayAnimation';

const ERR_ID: string = '[CARD ANIMATION]';

const useCardAnimation = (
  gameContext: GamePlayContext,
  player: EuchrePlayer,
  horizontalElement: HTMLElement | null,
  verticalElement: HTMLElement | null,
  playerTableCenterElement: HTMLElement | null,

  /** map of location to the player's card deck area element. */
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  onDealComplete: (playerNumber: number) => void,
  onTrickComplete: (card: Card) => void,
  onTrumpOrderedComplete: (playerNumber: number) => void,
  onDealPassed: (playerNumber: number) => void
) => {
  /** ************************************************************************************************************************************* */

  /** map of card index to reference to the card elements, used to calc spacing between cards when the screen is resized. */
  const cardRefs = useCardRefs(5);
  const { stateContext, dispatchAnimationState, createStates } = useCardState();
  /** Map of trick id to card played for that trick. Used when rendering cards to be displayed. */
  //const cardPlayedForTrickRef = useRef<Map<string, Card>>(new Map<string, Card>());
  const [refsReady, setRefsReady] = useState(false);

  /** Ordered card indices after the cards have been sorted/grouped */
  const initSortOrder = useRef<CardPosition[]>([]);
  const initCalculatedWidth = useRef(0);

  const { cardStates, animationControls } = stateContext;
  const { state, errorHandlers } = gameContext;
  const { euchreGame } = state;

  /** ************************************************************************************************************************************* */

  /** Get the element that's relative to the player's location that's used as an offset. */
  const getRelativeCenter = useCallback(
    (location: TableLocation) => {
      if (location === 'top' || location === 'bottom') {
        return horizontalElement;
      } else {
        return verticalElement;
      }
    },
    [horizontalElement, verticalElement]
  );

  const getWidth = useCallback((element: HTMLElement, reset: boolean) => {
    if (initCalculatedWidth.current === 0 || reset) {
      initCalculatedWidth.current = getCalculatedWidthOffset(element);
    }

    return initCalculatedWidth.current;
  }, []);

  /** Returns the current card state for cards that are available to be played.
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
        const cardState = cardStates.find((s) => s.cardIndex === indexPosition.cardIndex);
        const animationControl = animationControls.find((s) => s.cardIndex === indexPosition.cardIndex);

        if (!cardState)
          throw new Error(`${ERR_ID} - Card state not found when getting available cards/state.`);

        if (!animationControl)
          throw new Error(`${ERR_ID} - Animation control not found when getting available cards/state.`);

        currentProps.push({
          ordinalIndex: indexPosition.ordinalIndex,
          cardIndex: indexPosition.cardIndex,
          animateSprings: animationControl.animateSprings,
          initialSpring: animationControl.initSpring
        });
      }

      return currentProps;
    },
    [cardStates, animationControls, euchreGame.maker, euchreGame.trump, player]
  );

  const setSortOrder = (orderedIndices: CardPosition[]) => {
    initSortOrder.current = orderedIndices;
  };

  /* Update state values to the new values passed as parameters. */
  const getUpdatedCardAnimationSprings = useCallback(
    (
      controls: CardAnimationControls[],
      updatedSprings: CardSpringProps[],
      flipSprings: FlipSpringProps[]
    ) => {
      const newAnimationControls = [...controls];

      for (const control of newAnimationControls) {
        const updatedSpring = updatedSprings.find((c) => c.cardIndex === control.cardIndex);
        const updatedFlipSpring = flipSprings.find((c) => c.cardIndex === control.cardIndex);

        control.animateSprings = updatedSpring?.animateSprings ?? [];
        control.animateFlipSprings = updatedFlipSpring?.animateSprings;
      }

      return newAnimationControls;
    },
    []
  );

  const cardInitAnimationState: CardInitAnimationState = {
    gameContext,
    stateContext,
    player,
    dispatchAnimationState,
    cardRefs,
    playerDeckRefs,
    getUpdatedCardAnimationSprings,
    setSortOrder,
    createStates,
    getRelativeCenter,
    getWidth,
    getAvailableCardsAndState,
    onDealComplete
  };

  const { handState, initializeSortOrder, initCardHandlers } = useCardInitAnimation(cardInitAnimationState);

  const cardPlayAnimationState: CardPlayAnimationState = {
    handState: handState,
    gameContext: gameContext,
    stateContext: stateContext,
    player: player,
    dispatchAnimationState: dispatchAnimationState,
    playerTableCenterElement: playerTableCenterElement,
    cardRefs: cardRefs,
    playerDeckRefs: playerDeckRefs,
    initializeSortOrder,
    getRelativeCenter: getRelativeCenter,
    getWidth: getWidth,
    getAvailableCardsAndState: getAvailableCardsAndState,
    onTrickComplete: onTrickComplete,
    onTrumpOrderedComplete: onTrumpOrderedComplete,
    onDealPassed: onDealPassed
  };

  const {
    cardPlayedForTrick,
    getCardsToDisplay,
    updateCardStateForTurn,
    getCardsAvailableIfFollowSuit,
    handlePlayCard,
    playHandHandler
  } = useCardPlayAnimation(cardPlayAnimationState);

  const playerCardsVisible = handState !== undefined && cardStates.length > 0;
  const currentTrick = euchreGame.currentTrick;

  /** ************************************************************************************************************************************* */

  const { getEffectForHandState } = useCardStateEffect(
    state,
    handState,
    currentTrick.trickId,
    refsReady,
    initCardHandlers,
    playHandHandler
  );

  //#region  UseEffect hooks

  useEffect(() => {
    const runCardStateEffect = async () => {
      const effectToRun = getEffectForHandState();

      if (effectToRun.func) {
        logConsole(
          `${ERR_ID} - Run Effect For Phase: ${effectToRun.statePhase} - Action: ${effectToRun.stateAction}`
        );
        await errorHandlers.catchAsync(effectToRun.func, errorHandlers.onError, 'runCardStateEffect');
      } else {
        logConsole(`${ERR_ID} - NO EFFECT WAS RUN`);
      }
    };

    runCardStateEffect();
  }, [errorHandlers, getEffectForHandState]);

  //#endregion

  return {
    playerCardsVisible,
    cardPlayedForTrick,
    cardRefs,
    handState,
    cardStates,
    animationControls,
    getCardsAvailableIfFollowSuit,
    getCardsToDisplay,
    handlePlayCard,
    updateCardStateForTurn,
    setRefsReady
  };
};

export default useCardAnimation;

import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import useCardRefs from '../common/useCardRefs';
import useTableRef from '../common/useTableRefs';
import { GAME_STATES_FOR_DEAL, GAME_STATES_FOR_PLAY } from '../../util/game/gameStateLogicUtil';
import { logConsole } from '../../util/util';
import { getSpringInitialMoveForDeal } from '../../util/deck/deckTransformUtil';
import { useAnimation } from 'framer-motion';
import { GamePlayContext } from '../../definitions/game-state-definitions';
import { InitDealResult } from '../../definitions/logic-definitions';
import { TableLocation } from '../../definitions/definitions';
import {
  CardAnimationStateContext,
  CardSpringProps,
  CardSpringTarget,
  DealForDealerAnimationState,
  DeckInitAnimationState,
  FlipSpringProps,
  RegularDealAnimationState
} from '../../definitions/transform-definitions';
import useDeckStateEffect from './useDeckStateEffect';
import useDeckInitAnimation from './useDeckInitAnimation';
import useDeckState from '../../state/useDeckState';
import useDeckDealForDealerAnimation from './useDeckDealForDealerAnimation';
import useDeckRegularDealAnimation from './useDeckRegularDealAnimation';

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
  const { state, errorHandlers } = gameContext;
  const { euchreSettings, euchreGameFlow } = state;

  /** Used to move the entire deck element to the player's position for deal. */
  const deckAnimationControls = useAnimation();

  /** Values for the cards in the deck associated with animation individual cards. */
  const { stateContext, dispatchAnimationState, createStates } = useDeckState();

  const { setCardStates, setCardAnimationControls } = dispatchAnimationState;
  const { cardStates, animationControls } = stateContext;

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

  const deckInitAnimationState: DeckInitAnimationState = {
    gameContext,
    stateContext,
    dispatchAnimationState,
    deckAnimationControls,
    cardRefs: deckCardRefs,
    createStates
  };

  const { deckState, initDealHandlers } = useDeckInitAnimation(deckInitAnimationState);

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

      setCardStates(newCardStates);
      setCardAnimationControls(newAnimationControls);
    },
    [setCardAnimationControls, setCardStates]
  );

  /** Move the deck element from its absolute postion to the dealer card area. Then animate the deck into a visible area
   * to prepare the deck cards for being dealt.
   */
  const getMoveCardsIntoPositionState = useCallback((): {
    initMoveToDealer: CardSpringTarget;
    moveIntoView: CardSpringTarget;
  } => {
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

    return initialMoves;
  }, [deckState, euchreSettings.gameSpeed, getRelativeCenter, playerDeckRefs]);

  const dealerForDealerAnimationState: DealForDealerAnimationState = {
    gameContext,
    stateContext,
    deckAnimationControls,
    centerHorizontalElement,
    centerVerticalElement,
    outerTableRefs,
    playerDeckRefs,
    initDealer,
    cardRefs: deckCardRefs,
    getMoveCardsIntoPositionState,
    updateCardBaseAndAnimationSprings
  };

  const { dealForDealerHandlers } = useDeckDealForDealerAnimation(dealerForDealerAnimationState);

  const regularDealAnimationState: RegularDealAnimationState = {
    deckState,
    gameContext,
    stateContext,
    deckAnimationControls,
    centerHorizontalElement,
    centerVerticalElement,
    outerTableRefs,
    playerDeckRefs,
    cardRefs: deckCardRefs,
    getMoveCardsIntoPositionState,
    updateCardBaseAndAnimationSprings
  };

  const { regularDealHandlers } = useDeckRegularDealAnimation(regularDealAnimationState);

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

  //#region Run Effects

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
    deckAnimationControls
  };
};

export default useDeckAnimation;

import { useCallback, useState } from 'react';
import { Card } from '../../definitions/definitions';
import {
  CardInitAnimationState,
  CardPosition,
  CardSpringProps,
  CardSpringTarget,
  DEFAULT_SPRING_VAL,
  FlipSpringProps
} from '../../definitions/transform-definitions';
import { availableCardsToPlay, playerEqual } from '../../util/game/playerDataUtil';
import { getDisplayHeight, getDisplayWidth, sortCardsIndices } from '../../util/game/cardDataUtil';
import {
  getDurationSeconds,
  getSpringsForBeginNewHand,
  getSpringsPlayerHandInitDeal
} from '../../util/play/cardTransformUtil';
import { createCardBaseState, runCardAnimations } from '../../util/game/cardStateUtil';
import {
  addInitializeCardRegroupEvent,
  addInitializeCardStateEvent,
  addInitializeHandStateEvent
} from '../../util/play/cardStateEventsUtil';
import { gameDelay } from '../../util/game/gameDataUtil';
import { HandState, InitHandHandlers } from '../../definitions/game-state-definitions';

const ERR_ID: string = '[CARD INIT ANIMATION]';

const useCardInitAnimation = (cardPlayState: CardInitAnimationState) => {
  const {
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
  } = cardPlayState;

  const [handState, setHandState] = useState<HandState | undefined>(undefined);
  const { setCardStates, setCardAnimationControls, setCardAnimationStates } = dispatchAnimationState;
  const { cardStates, animationControls } = stateContext;
  const { state, eventHandlers } = gameContext;
  const { euchreGame, euchreGameFlow, euchreSettings } = state;

  //#region Card Init Functions/Handlers Hook

  /** Create and set the initial hand state for the player's hand for regular play. */
  const setInitialHandState = useCallback(() => {
    const location = player.location;
    const width: number = getDisplayWidth(location);
    const height: number = getDisplayHeight(location);
    const showCardValue = euchreGameFlow.shouldShowCardValuesForHand.find((c) =>
      playerEqual(c.player, player)
    )?.value;

    const handState: HandState = {
      handId: euchreGame.handId,
      width: width,
      height: height,
      location: location,
      shouldShowCardValue: showCardValue,
      player: player,
      responsive: true
    };

    setHandState(handState);
  }, [euchreGame.handId, euchreGameFlow.shouldShowCardValuesForHand, player]);

  /** Set initial card states for the start of a new hand. */
  const initCardStatesForNewHand = useCallback(() => {
    if (!handState) throw new Error(`${ERR_ID} - Invalid hand state for initialization for card state`);

    const intialValues = getSpringsPlayerHandInitDeal(player.hand, handState.location);
    const initStates = createStates(
      player.hand,
      handState.location,
      !!handState.shouldShowCardValue,
      intialValues.cardSprings,
      intialValues.flipSprings,
      false
    );

    setCardStates(initStates.cardStates);
    setCardAnimationControls(initStates.animationControls);
    setCardAnimationStates(initStates.animationStates);
  }, [createStates, handState, player.hand, setCardAnimationControls, setCardAnimationStates, setCardStates]);

  /** Re-create card states where hand states already exist. */
  const initCardStatesForExistingHand = useCallback(async () => {
    if (!handState) throw new Error(`${ERR_ID} - Invalid hand state for initialization for card state`);

    const newCardState = euchreGame.deck.map((card) => {
      return createCardBaseState(card, handState.location, false);
    });

    setCardStates(newCardState);

    const centerLocation: boolean = handState.location === 'top' || handState.location === 'bottom';
    const initSpringValue: CardSpringTarget | undefined = {
      ...DEFAULT_SPRING_VAL,
      rotateY: centerLocation ? 180 : 0,
      rotateX: centerLocation ? 0 : 180
    };
    const resetSpring: CardSpringTarget = { ...initSpringValue, transition: { duration: 0 } };
    for (const animationControl of animationControls) {
      await animationControl.controls?.start(resetSpring);
    }
  }, [animationControls, euchreGame.deck, handState, setCardStates]);

  /** Set initial card state used when animation of cards being played. */
  const initCardStates = useCallback(async (): Promise<void> => {
    if (!handState) throw new Error(`${ERR_ID} - Invalid hand state for initialization for card state`);

    const cardStatesExist = cardStates.length > 0;

    if (!cardStatesExist) {
      initCardStatesForNewHand();
    } else {
      await initCardStatesForExistingHand();
    }
  }, [cardStates.length, handState, initCardStatesForExistingHand, initCardStatesForNewHand]);

  /** Set the sort order for the player's hand. Used to display the suits grouped together and trump first. */
  const initializeSortOrder = useCallback(() => {
    const availableCards: Card[] = availableCardsToPlay(player);
    const orderedIndices: CardPosition[] = sortCardsIndices(
      availableCards,
      euchreGame.maker ? euchreGame.trump : null
    );
    setSortOrder(orderedIndices);
  }, [euchreGame.maker, euchreGame.trump, player, setSortOrder]);

  /** Create and return states to move cards into position after being dealt for regular play. Cards moved into view, fanned, and flipped
   * if cards should be shown.
   */
  const getCardStateForRegroupHand = useCallback(() => {
    if (!handState) throw new Error(`${ERR_ID} - Invalid hand state for regroup player hand.`);

    const cardElements: HTMLElement[] = [];
    cardRefs
      .values()
      .toArray()
      .forEach((c) => {
        if (c.current) cardElements.push(c.current);
      });

    const destElement = playerDeckRefs.get(handState.location)?.current;
    const relativeElement = getRelativeCenter(handState.location);

    if (cardElements.length === 0)
      throw new Error(`${ERR_ID} - Invalid card elements for initialize card state.`);
    if (!destElement) throw new Error(`${ERR_ID} - Invalid destination element for initialize card state.`);
    if (!relativeElement) throw new Error(`${ERR_ID} - Invalid relative element for initialize card state.`);

    const duration = getDurationSeconds(euchreSettings.gameSpeed);
    const currentProps: CardSpringProps[] = getAvailableCardsAndState(true);
    const springs = getSpringsForBeginNewHand(
      player.hand,
      handState.location,
      euchreSettings.gameSpeed,
      cardElements,
      destElement,
      relativeElement,
      getWidth(cardElements[0], false),
      currentProps
    );

    let flipSprings: FlipSpringProps[] = [];
    if (handState.shouldShowCardValue) {
      flipSprings = player.hand.map((card, index) => {
        const flipProp: FlipSpringProps = {
          cardIndex: card.index,
          initialSpring: undefined,
          ordinalIndex: index,
          animateSprings: [
            {
              rotateX: 0,
              rotateY: 0,
              transition: {
                rotateX: { delay: duration * 3, duration: 0.3 },
                rotateY: { delay: duration * 3, duration: 0.3 }
              }
            }
          ]
        };

        return flipProp;
      });
    }

    return { springs, flipSprings };
  }, [
    cardRefs,
    euchreSettings.gameSpeed,
    getAvailableCardsAndState,
    getRelativeCenter,
    getWidth,
    handState,
    player.hand,
    playerDeckRefs
  ]);

  /** Reset hand state and card state to empty values. */
  const resetForNewHand = useCallback(() => {
    setHandState(undefined);
    setCardStates([]);
  }, [setCardStates]);

  /** */
  const handleResetHandState = useCallback(async () => {
    resetForNewHand();
  }, [resetForNewHand]);

  /** */
  const handleCreateHandState = useCallback(async () => {
    addInitializeHandStateEvent(state, eventHandlers, player);
    setInitialHandState();
  }, [eventHandlers, player, setInitialHandState, state]);

  /** */
  const handleCreateCardState = useCallback(async () => {
    addInitializeCardStateEvent(state, eventHandlers, player);

    initializeSortOrder();
    await initCardStates();

    // set card states for initial movement.
  }, [eventHandlers, initCardStates, initializeSortOrder, player, state]);

  /** Set cards states for animation to move player cards into position for the beginning of a new hand. */
  const handleBeginRegroupCards = useCallback(async () => {
    if (!handState) throw new Error(`${ERR_ID} - Invalid hand state for regroup player cards.`);

    addInitializeCardRegroupEvent(state, eventHandlers, player);
    const newStates = getCardStateForRegroupHand();
    const newAnimationControls = getUpdatedCardAnimationSprings(
      animationControls,
      newStates.springs,
      newStates.flipSprings
    );

    setCardAnimationControls(newAnimationControls);
  }, [
    animationControls,
    eventHandlers,
    getCardStateForRegroupHand,
    getUpdatedCardAnimationSprings,
    handState,
    player,
    setCardAnimationControls,
    state
  ]);

  /** Run the animation states that were saved to regroup player hand for the beginning of a new hand. */
  const handleAnimateRegroupCards = useCallback(async () => {
    await runCardAnimations(animationControls);
    await gameDelay(euchreSettings);

    onDealComplete(player.playerNumber);
  }, [animationControls, euchreSettings, onDealComplete, player.playerNumber]);

  const initCardHandlers: InitHandHandlers = {
    onResetHandState: handleResetHandState,
    onCreateHandState: handleCreateHandState,
    onCreateCardState: handleCreateCardState,
    onRegroupCards: handleBeginRegroupCards,
    onAnimateRegroupCards: handleAnimateRegroupCards
  };

  return { handState, initializeSortOrder, initCardHandlers };

  //#endregion
};

export default useCardInitAnimation;

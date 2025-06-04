import { useCallback, useState } from 'react';
import { DeckState, InitDealHandlers } from '../../definitions/game-state-definitions';
import {
  CardSpringProps,
  CardSpringTarget,
  DeckInitAnimationState,
  DEFAULT_SPRING_VAL,
  FlipSpringProps,
  FlipSpringTarget
} from '../../definitions/transform-definitions';
import { TableLocation } from '../../definitions/definitions';
import { getDisplayHeight, getDisplayWidth } from '../../util/game/cardDataUtil';
import { createCardBaseState } from '../../util/game/cardStateUtil';
import { addResetForDealerEvent } from '../../util/deck/deckStateEventsUtil';

//const ERR_ID: string = '[DECK ANIMATION]';

const useDeckInitAnimation = (deckAnimationState: DeckInitAnimationState) => {
  const { gameContext, stateContext, deckAnimationControls, dispatchAnimationState, cardRefs, createStates } =
    deckAnimationState;

  /** Values associated with the deck state used when rendering the deck and for animation. */
  const [deckState, setDeckState] = useState<DeckState | undefined>();
  const { setCardStates, setCardAnimationControls, setCardAnimationStates } = dispatchAnimationState;
  const { cardStates, animationControls } = stateContext;
  const { state, eventHandlers } = gameContext;
  const { euchreGame } = gameContext.state;
  //#region Deck State Reset

  /** Create deck state values from game values. */
  const createInitDeckState = useCallback(() => {
    const location: TableLocation = euchreGame.dealer.location;

    const newGameDeckState: DeckState = {
      deck: euchreGame.deck,
      cardRefs: cardRefs,
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
    cardRefs,
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
    //setRenderKey(uuidv4());
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

      setCardStates(initStates.cardStates);
      setCardAnimationControls(initStates.animationControls);
      setCardAnimationStates(initStates.animationStates);
    },
    [
      createStates,
      euchreGame.dealer.location,
      euchreGame.deck,
      setCardAnimationControls,
      setCardAnimationStates,
      setCardStates
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

        setCardStates(newCardState);

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
      setCardStates
    ]
  );

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
  return { deckState, setDeckState, initDealHandlers };
};

export default useDeckInitAnimation;

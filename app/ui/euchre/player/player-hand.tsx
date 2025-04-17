import { EuchreGameFlow, EuchreGameFlowState } from '@/app/hooks/euchre/reducers/gameFlowReducer';
import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import { RefObject, useEffect, useRef } from 'react';
import GameCard from '../game/game-card';
import clsx from 'clsx';
import DummyCard from '../dummy-card';
import useCardState from '../../../hooks/useCardState';
import useGameData from '../../../hooks/euchre/data/useGameData';
import {
  EuchreAnimateType,
  EuchreAnimationState
} from '../../../hooks/euchre/reducers/gameAnimationFlowReducer';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';

type Props = {
  game: EuchreGameInstance;
  gameFlow: EuchreGameFlowState;
  gameSettings: EuchreSettings;
  gameAnimation: EuchreAnimationState;
  player: EuchrePlayer;
  playedCard: Card | null;
  deckRef: RefObject<HTMLDivElement>;
  playerTableRef: RefObject<HTMLDivElement>;
  onCardClick: (card: Card) => void;
  onBeginComplete: () => void;
};

const PlayerHand = ({
  game,
  gameFlow,
  gameSettings,
  gameAnimation,
  player,
  playedCard,
  deckRef,
  playerTableRef,
  onCardClick,
  onBeginComplete
}: Props) => {
  //#region Hooks
  // used to keep the card visible after it's been played for the current trick.
  const cardsDealtRef = useRef(false);
  const cardsPlayedRef = useRef<Card[]>([]);
  const cardRefSet = useRef(false);
  const cardRefBeginSet = useRef(false);

  const { playerSittingOut } = useGameData();
  const {
    handState,
    cardStates,
    getCardsAvailableIfFollowSuit,
    setInitialPlayerHandState,
    setInitialCardStates,
    getCardsToDisplay,
    playCard,
    regroupCards,
    getDisplayWidth,
    getDisplayHeight,
    cardEqual,
    playerEqual,
    playerLocation,
    getCardFullName,
    getEncodedCardSvg
  } = useCardState(game, gameFlow, gameSettings, player);

  const cardRefs = useRef<Map<number, RefObject<HTMLDivElement> | undefined>>(
    new Map<number, RefObject<HTMLDivElement> | undefined>([
      [0, useRef<HTMLDivElement>(null as unknown as HTMLDivElement)],
      [1, useRef<HTMLDivElement>(null as unknown as HTMLDivElement)],
      [2, useRef<HTMLDivElement>(null as unknown as HTMLDivElement)],
      [3, useRef<HTMLDivElement>(null as unknown as HTMLDivElement)],
      [4, useRef<HTMLDivElement>(null as unknown as HTMLDivElement)]
    ])
  );

  useEffect(() => {
    // create hand state after cards have been shuffled/dealt

    const shouldCreateHandState =
      handState === undefined &&
      gameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_CARDS &&
      gameAnimation.animationType === EuchreAnimateType.ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY;

    if (shouldCreateHandState) {
      setInitialPlayerHandState();
    }
  });

  useEffect(() => {
    // if card state has not been initialized, then initialize after cards have been dealt.

    const shouldCreateCardState =
      handState !== undefined &&
      !cardsDealtRef.current &&
      player.hand.length === 5 &&
      player.playedCards.length === 0 &&
      cardStates.length === 0;

    if (shouldCreateCardState) {
      setInitialCardStates();
      cardsDealtRef.current = true;
    }
  }, [
    cardStates.length,
    handState,
    handState?.shouldShowCardValue,
    player.hand.length,
    player.playedCards.length,
    setInitialCardStates
  ]);

  useEffect(() => {
    // if initial animation is not set, then begin animation to fan player cards.

    const beginRegroupCards = async () => {
      if (!cardRefBeginSet.current && cardStates.length == 5) {
        cardRefBeginSet.current = true;
        const cardRef = cardRefs.current.values().find((c) => c?.current)?.current;

        if (!cardRef) throw new Error('Invalid card ref when setting initial animation.');

        const delay = gameSettings.gameSpeed * player.team;
        await new Promise((resolve) => setTimeout(resolve, delay));

        cardRefSet.current = true;
        regroupCards(cardRef);
        onBeginComplete();
      }
    };

    beginRegroupCards();
  }, [cardRefSet, cardStates.length, gameSettings.gameSpeed, onBeginComplete, player.team, regroupCards]);
  //#endregion

  const gameCards: React.ReactNode[] = [];
  const cardsAvailableForFollowSuit: Card[] = getCardsAvailableIfFollowSuit();
  const playerCurrentHand: Card[] = getCardsToDisplay();
  const sittingOutPlayer = playerSittingOut(game);
  const playerIsSittingOut = sittingOutPlayer && playerEqual(player, sittingOutPlayer);
  const location = playerLocation(player);
  const width = getDisplayWidth(location);
  const height = getDisplayHeight(location);
  const showCardValues: boolean =
    gameFlow.shouldShowCardValuesForHand.find((s) => playerEqual(s.player, player))?.value ?? false;

  for (let i = 0; i < 5; i++) {
    // used to make sure the player area always has 5 cards placed to make sure elements flow correctly.
    gameCards.push(
      <DummyCard
        className={getCardClassForPlayerLocation(player, false)}
        key={`dummy-${i}`}
        width={handState?.width ?? width}
        height={handState?.height ?? height}
      ></DummyCard>
    );
  }

  /** Sets the animation for the card to be played. On the callback when the animation is finished is when the state is updated with
   * the card that was played.
   */
  const handleCardClick = (cardIndex: number) => {
    const currentState = cardStates.find((c) => c.cardIndex === cardIndex);
    const cardRef = cardRefs.current.get(cardIndex);

    if (!currentState || !cardRef?.current) throw new Error('Invalid card state - handle card click');

    playCard(cardIndex, cardRef.current, playerTableRef.current, currentState.rotation ?? 0);
  };

  const setUpdatedCardState = (cardState: CardState, card: Card, playCard: boolean): CardState => {
    const updatedCardState = { ...cardState };

    if (playCard && updatedCardState.sprungValue) {
      // updatedCardState.cardFullName = getCardFullName(card);
      // updatedCardState.src = getEncodedCardSvg(card, location);
      // updatedCardState.sprungValue.rotateX = 0;
      // updatedCardState.sprungValue.rotateY = 0;
    }
    return updatedCardState;
  };

  return (
    <>
      {gameCards}
      {cardsDealtRef.current &&
        handState &&
        playerCurrentHand.map((card) => {
          const keyval = `${game.currentRound}-${player.playerNumber}-${card.index}`;
          const isAvailableToBePlayedForFollowSuit: boolean = cardsAvailableForFollowSuit.includes(card);
          const shouldAutoPlayCard: boolean =
            (playedCard !== null && cardEqual(card, playedCard)) ||
            cardsPlayedRef.current.find((c) => cardEqual(c, card)) !== undefined;
          const cardState = cardStates.find((s) => s.cardIndex === card.index);
          const cardRef = cardRefs.current.get(card.index);

          if (!cardState) throw new Error('Invalid card state - render player hand');
          if (!cardRef) throw new Error('Invalid card ref - render player hand');

          return (
            <GameCard
              key={keyval}
              className={clsx(
                'absolute z-30',
                { hidden: playerIsSittingOut },
                getCardClassForPlayerLocation(player, true)
              )}
              card={card}
              cardState={setUpdatedCardState(cardState, card, shouldAutoPlayCard)}
              player={player}
              playCard={shouldAutoPlayCard}
              onCardClick={isAvailableToBePlayedForFollowSuit ? handleCardClick : undefined}
              onCardPlayed={onCardClick}
              ref={cardRef}
              deckRef={deckRef}
              playerTableRef={playerTableRef}
              width={handState.width}
              height={handState.height}
              responsive={true}
            />
          );
        })}
    </>
  );
};

export default PlayerHand;

const getCardClassForPlayerLocation = (player: EuchrePlayer, includePosition: boolean): string => {
  let retval = '';

  switch (player.playerNumber) {
    case 1:
      retval = `${includePosition ? 'left-[35%]' : ''}`;
      break;
    case 2:
      retval = `${includePosition ? 'left-[30%]' : ''}`;
      break;
    case 3:
      retval = ``;
      break;
    case 4:
      retval = ``;
      break;
  }

  return retval;
};

import { RefObject, useEffect, useRef } from 'react';
import GameCard from '../game/game-card';
import clsx from 'clsx';
import useCardState from '../../../hooks/euchre/state/useCardState';
import {
  ErrorHandlers,
  EuchreGameState,
  EuchrePlayer
} from '../../../lib/euchre/definitions/game-state-definitions';
import { Card, TableLocation } from '../../../lib/euchre/definitions/definitions';
import { GameEventHandlers } from '../../../hooks/euchre/useEventLog';
import { getCardClassForPlayerLocation } from '../../../lib/euchre/util/cardDataUtil';
import { logConsole, logError } from '../../../lib/euchre/util/util';

type Props = {
  state: EuchreGameState;
  eventHandlers: GameEventHandlers;
  errorHandlers: ErrorHandlers;
  player: EuchrePlayer;

  /** Card to played without user interaction. Used for auto play. */
  playedCard: Card | null;
  playerCenterTableRef: RefObject<HTMLDivElement | null> | undefined;
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  directCenterHRef: RefObject<HTMLDivElement | null>;
  directCenterVRef: RefObject<HTMLDivElement | null>;

  onCardPlayed: (card: Card) => void;
  onTrickComplete: (card: Card) => void;
  onPassDeal: (card: Card) => void;
  onDealComplete: (playerNumber: number) => void;
};

const PlayerHand = ({
  state,
  eventHandlers,
  errorHandlers,
  player,
  playedCard,
  playerCenterTableRef,
  playerDeckRefs,
  directCenterHRef,
  directCenterVRef,
  onCardPlayed,
  onTrickComplete,
  onPassDeal,
  onDealComplete
}: Props) => {
  //#region Hooks

  const {
    initCardStateCreated,
    cardRefs,
    handState,
    cardStates,
    onAnimationComplete,
    getCardsToDisplay,
    handlePlayCardAnimation
  } = useCardState(
    state,
    eventHandlers,
    errorHandlers,
    player,
    directCenterHRef,
    directCenterVRef,
    playerDeckRefs,
    onTrickComplete,
    onPassDeal,
    onCardPlayed,
    onDealComplete
  );
  /** Map of trick ID to the associated card (index) that was played for that trick.*/
  const cardIndicesPlayed = useRef<Map<string, number>>(new Map<string, number>());
  /** Used to prevent clicking cards in rapid succession */
  const isCardClickHandled = useRef(false);

  /** Animate the card being played. Once animation for the card is complete, the state should be updated that the player
   * played a card.
   */
  useEffect(() => {
    if (playedCard && !cardIndicesPlayed.current.has(state.euchreGame.currentTrick.trickId)) {
      cardIndicesPlayed.current.set(state.euchreGame.currentTrick.trickId, playedCard.index);
      logConsole('[PLAYERHAND] [useEffect] [handlePlayCardAnimation], auto played card: ', playedCard);

      const tableRef = playerCenterTableRef?.current;

      if (!tableRef)
        logError(
          '[PLAYERHAND] [useEffect] [handlePlayCardAnimation] - Invalid table ref. Card animation was not handled.'
        );
      else {
        handlePlayCardAnimation(playedCard.index, tableRef);
      }
    }
  }, [handlePlayCardAnimation, playedCard, playerCenterTableRef, state.euchreGame.currentTrick.trickId]);
  //#endregion

  const gameCards: React.ReactNode[] = [];
  const playerCurrentHand: Card[] = getCardsToDisplay();
  const location = player.location;

  const handleCardClick = (cardIndex: number) => {
    logConsole(
      '[PLAYERHAND] [handleCardClick] - player: ',
      player.name,
      ' trick ids played: ',
      cardIndicesPlayed.current
    );

    if (
      !isCardClickHandled.current &&
      !cardIndicesPlayed.current.has(state.euchreGame.currentTrick.trickId)
    ) {
      isCardClickHandled.current = true;
      cardIndicesPlayed.current.set(state.euchreGame.currentTrick.trickId, cardIndex);

      const delay = state.euchreSettings.gameSpeed;
      const tableRef = playerCenterTableRef?.current;

      if (!tableRef) {
        logError(
          '[PLAYERHAND] [useEffect] [handleCardClick] - Invalid table ref. Card animation was not handled.'
        );
        return;
      }

      // release lock so the next card can be handled.
      setTimeout(() => {
        isCardClickHandled.current = false;
      }, delay);

      handlePlayCardAnimation(cardIndex, tableRef);
    }
  };

  if (player.human)
    logConsole('*** [PLAYERHAND] [RENDER] player: ', player.name, ' player hand: ', playerCurrentHand);

  return (
    <>
      {gameCards}
      {initCardStateCreated &&
        handState &&
        playerCurrentHand.map((card) => {
          const keyval = `${player.playerNumber}-${card.index}`;
          const cardState = cardStates.find((s) => s.cardIndex === card.index);
          const cardRef = cardRefs.get(card.index);

          return cardState && cardRef ? (
            <GameCard
              renderKey={cardState.renderKey}
              key={keyval}
              className={clsx('absolute', getCardClassForPlayerLocation(player.location))}
              location={location}
              card={card}
              cardState={cardState}
              runAnimationCompleteEffect={cardState.runEffectForState}
              ref={cardRef}
              width={handState.width}
              height={handState.height}
              responsive={true}
              onCardClick={cardState.enabled ? handleCardClick : undefined}
              onAnimationComplete={onAnimationComplete.current}
            />
          ) : (
            <div>Invalid card state or card ref.</div>
          );
        })}
    </>
  );
};

export default PlayerHand;

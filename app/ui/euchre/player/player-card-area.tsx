import clsx from 'clsx';
import React, { RefObject, useCallback, useEffect, useRef } from 'react';
import {
  EuchreAnimationHandlers,
  EuchreGameValues,
  EuchrePlayer,
  ErrorHandlers,
  EuchreTrick
} from '../../../lib/euchre/definitions/game-state-definitions';
import { Card, TableLocation } from '../../../lib/euchre/definitions/definitions';
import useDeckAnimation from '../../../hooks/euchre/state/useDeckAnimation';
import GameGrid from '../game/game-grid';
import GameDeck from '../game/game-deck';
import PlayerHand from './player-hand';
import { GameEventHandlers } from '../../../hooks/euchre/useEventLog';
import { getPlayerGridLayoutInfo, playerEqual } from '../../../lib/euchre/util/playerDataUtil';
import { playerSittingOut } from '../../../lib/euchre/util/gameDataUtil';
import { logConsole } from '../../../lib/euchre/util/util';
import { getCardClassForPlayerLocation } from '../../../lib/euchre/util/cardDataUtil';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  state: EuchreGameValues;
  eventHandlers: GameEventHandlers;
  errorHandlers: ErrorHandlers;
  playedCard: Card | null;
  playerCenterTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  playerOuterTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  directCenterHRef: RefObject<HTMLDivElement | null>;
  directCenterVRef: RefObject<HTMLDivElement | null>;
  animationHandlers: EuchreAnimationHandlers;
  className: string;
}

/** Area for card animation for dealing and player's cards. */
const PlayerCardArea = ({
  state,
  eventHandlers,
  errorHandlers,
  playedCard,
  playerCenterTableRefs,
  playerOuterTableRefs,
  directCenterHRef,
  directCenterVRef,
  animationHandlers,
  className,
  ...rest
}: DivProps) => {
  const {
    handleRefChange,
    gameHandVisible,
    gameDeckVisible,
    gameDeckRef,
    playerDeckRefs,
    playerInnerDeckRefs,
    deckCardRefs,
    gameDeckState,
    deckAnimationControls,
    deckCardStates,
    deckCardsAnimationControls
  } = useDeckAnimation(
    state,
    eventHandlers,
    errorHandlers,
    playerOuterTableRefs,
    directCenterHRef,
    directCenterVRef,
    animationHandlers
  );
  const playerLayoutForGrid = getPlayerGridLayoutInfo();
  const sittingOutPlayer: EuchrePlayer | null = playerSittingOut(state.euchreGame);
  const currentHandId = useRef(state.euchreGame.handId);

  const cardCountDuringPlay: number = sittingOutPlayer ? 3 : 4;
  const playersInitDealFinished = useRef<Set<number>>(new Set<number>());
  const cardsPassedDeal = useRef<Set<string>>(new Set<string>());

  /** Map of trick id to the card values that were played for that trick. */
  const cardsPlayedForTrick = useRef<Map<string, Set<string>>>(new Map<string, Set<string>>());

  /** Set of trick id's where the event handler was executed to finish the trick. */
  const tricksFinished = useRef<Set<string>>(new Set<string>());

  useEffect(() => {
    if (currentHandId.current !== state.euchreGame.handId) {
      playersInitDealFinished.current.clear();
      cardsPassedDeal.current.clear();
    }
  }, [state.euchreGame.handId]);

  const handleDealAnimationComplete = (playerNumber: number) => {
    logConsole('*** [PLAYERCARDAREA] [handleDealAnimationComplete]');
    if (playersInitDealFinished.current.values().toArray().length === 4) return;

    playersInitDealFinished.current.add(playerNumber);

    if (playersInitDealFinished.current.values().toArray().length === 4) {
      animationHandlers.onEndRegularDealComplete();
    }
  };

  const handlePassDealAnimationComplete = (card: Card) => {
    logConsole('*** [PLAYERCARDAREA] [handlePassDealAnimationComplete]');
    if (cardsPassedDeal.current.values().toArray().length === 20) return;

    cardsPassedDeal.current.add(`${card.value}${card.suit}`);

    if (cardsPassedDeal.current.values().toArray().length === 20) {
      animationHandlers.onPassDealComplete();
    }
  };

  const handleCardPlayed = (card: Card) => {
    animationHandlers.onCardPlayed(card);
  };

  const handleTrickFinished = useCallback(
    (card: Card) => {
      logConsole('*** [PLAYERCARDAREA] [handleTrickFinished]');

      const trick: EuchreTrick | undefined = state.euchreGame.currentTrick;
      const trickFinished = tricksFinished.current.has(trick.trickId);

      if (trickFinished) return;

      const cardVals = cardsPlayedForTrick.current.get(trick.trickId) ?? new Set<string>();

      cardVals.add(`${card.value}-${card.suit}`);
      cardsPlayedForTrick.current.set(trick.trickId, cardVals);

      if (trick.playerRenege || cardVals.values().toArray().length === cardCountDuringPlay) {
        tricksFinished.current.add(trick.trickId);
        animationHandlers.onTrickFinished();
      }
    },
    [animationHandlers, cardCountDuringPlay, state.euchreGame.currentTrick]
  );

  logConsole(
    '*** [PLAYERCARDAREA] [RENDER]',
    ' deck visible: ',
    gameDeckVisible,
    ' hand visible: ',
    gameHandVisible
  );

  return (
    <GameGrid className={className} {...rest}>
      {playerLayoutForGrid.map((info, index) => {
        const player = state.euchreGame.gamePlayers.find((p) => p.location === info.location);

        if (!player) {
          return (
            <div key={index} className={clsx('relative', info.locationClass)}>
              Player not found for location: {info.location}
            </div>
          );
        }

        const deckRef = playerDeckRefs.get(player.location);
        const innerDeckRef = playerInnerDeckRefs.get(player.location);
        const centerTableRef = playerCenterTableRefs.get(player.location);
        const gameCard = playerEqual(player, state.euchreGame.currentPlayer) ? playedCard : null;
        const hidePosition = { invisible: !state.euchreSettings.debugShowPositionElements };

        return (
          <div
            className={clsx('relative', info.locationClass)}
            key={`player${player.playerNumber}-game-deck`}
            id={`player${player.playerNumber}-game-deck`}
          >
            {!centerTableRef && <div>Invalid center table ref for player card area.</div>}
            {gameHandVisible && centerTableRef && (
              <PlayerHand
                state={state}
                eventHandlers={eventHandlers}
                errorHandlers={errorHandlers}
                player={player}
                playedCard={gameCard}
                playerCenterTableRef={centerTableRef}
                playerDeckRefs={playerDeckRefs}
                directCenterHRef={directCenterHRef}
                directCenterVRef={directCenterVRef}
                onCardPlayed={handleCardPlayed}
                onTrickComplete={handleTrickFinished}
                onPassDeal={handlePassDealAnimationComplete}
                onDealComplete={handleDealAnimationComplete}
              />
            )}
            <div
              ref={deckRef}
              id={`player-deck-${player.playerNumber}`}
              className={clsx('absolute', getCardClassForPlayerLocation(player.location), hidePosition)}
            >
              {`D-${player.playerNumber}`}
            </div>
            <div
              ref={innerDeckRef}
              id={`player-inner-deck-${player.playerNumber}`}
              className={clsx('absolute', info.playerInnerDeckOffsetClass, hidePosition)}
            >
              {`I-${player.playerNumber}`}
            </div>
          </div>
        );
      })}
      {gameDeckState && gameDeckVisible && (
        <GameDeck
          ref={gameDeckRef}
          deck={gameDeckState.deck}
          deckCardRefs={deckCardRefs}
          location={gameDeckState.location}
          playerNumber={gameDeckState.playerNumber}
          cardStates={deckCardStates}
          animationControls={deckCardsAnimationControls}
          initDeckState={gameDeckState.initSpringValue}
          controls={deckAnimationControls}
          width={gameDeckState.width}
          height={gameDeckState.height}
          handId={gameDeckState.handId}
          showPosition={state.euchreSettings.debugShowPositionElements}
          onFirstRender={handleRefChange}
        />
      )}
    </GameGrid>
  );
};

export default PlayerCardArea;

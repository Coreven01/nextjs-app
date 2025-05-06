import clsx from 'clsx';
import React, { RefObject, useCallback, useEffect, useRef } from 'react';
import usePlayerData from '../../../hooks/euchre/data/usePlayerData';
import useGameData from '../../../hooks/euchre/data/useGameData';
import {
  EuchreAnimationHandlers,
  EuchreGameValues,
  EuchrePlayer,
  ErrorHandlers,
  EuchreTrick
} from '../../../lib/euchre/definitions/game-state-definitions';
import { Card, TableLocation } from '../../../lib/euchre/definitions/definitions';
import useDeckState from '../../../hooks/euchre/state/useDeckState';
import GameGrid from '../game/game-grid';
import GameDeck from '../game/game-deck';
import PlayerHand from './player-hand';
import useCardData from '../../../hooks/euchre/data/useCardData';
import { GameEventHandlers } from '../../../hooks/euchre/useEventLog';

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
    cardStates
  } = useDeckState(
    state,
    eventHandlers,
    errorHandlers,
    playerOuterTableRefs,
    directCenterHRef,
    directCenterVRef,
    animationHandlers
  );

  const { getPlayerGridLayoutInfo, playerEqual } = usePlayerData();
  const { playerSittingOut } = useGameData();
  const { getCardClassForPlayerLocation } = useCardData();
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
    console.log('*** [PLAYERCARDAREA] [handleInitComplete] - player-card-area.tsx');
    if (playersInitDealFinished.current.values().toArray().length === 4) return;

    playersInitDealFinished.current.add(playerNumber);

    if (playersInitDealFinished.current.values().toArray().length === 4) {
      animationHandlers.handleEndRegularDealComplete();
    }
  };

  const handlePassDealAnimationComplete = (card: Card) => {
    console.log('*** [PLAYERCARDAREA] [handlePassDealComplete] - player-card-area.tsx');
    if (cardsPassedDeal.current.values().toArray().length === 20) return;

    cardsPassedDeal.current.add(`${card.value}${card.suit}`);

    if (cardsPassedDeal.current.values().toArray().length === 20) {
      animationHandlers.handlePassDealComplete();
    }
  };

  const handleCardPlayed = (card: Card) => {
    animationHandlers.handleCardPlayed(card);
  };

  const handleTrickFinished = useCallback(
    (card: Card) => {
      console.log('*** [PLAYERCARDAREA] [handleTrickFinished] - player-area.tsx');

      const trick: EuchreTrick | undefined = state.euchreGame.currentTrick;
      const trickFinished = tricksFinished.current.has(trick.trickId);

      if (trickFinished) return;

      const cardVals = cardsPlayedForTrick.current.get(trick.trickId) ?? new Set<string>();

      cardVals.add(`${card.value}-${card.suit}`);
      cardsPlayedForTrick.current.set(trick.trickId, cardVals);

      if (trick.playerRenege || cardVals.values().toArray().length === cardCountDuringPlay) {
        tricksFinished.current.add(trick.trickId);
        animationHandlers.handleTrickFinished(); //  onTrickComplete();
      }
    },
    [animationHandlers, cardCountDuringPlay, state.euchreGame.currentTrick]
  );

  console.log(
    '*** [PLAYERCARDAREA] [RENDER]',
    ' deck visible: ',
    gameDeckVisible,
    ' hand visible: ',
    gameHandVisible
  );

  return (
    <GameGrid className={className} {...rest}>
      {playerLayoutForGrid.map((info) => {
        const player = state.euchreGame.gamePlayers.find((p) => p.location === info.location);

        if (!player) throw new Error('Player not found for location: ' + info.location);

        const deckRef = playerDeckRefs.get(player.location);
        const innerDeckRef = playerInnerDeckRefs.get(player.location);
        const centerTableRef = playerCenterTableRefs.get(player.location);
        const gameCard = playerEqual(player, state.euchreGame.currentPlayer) ? playedCard : null;
        const hidePosition = { invisible: !state.euchreSettings.debugShowPositionElements };

        if (!centerTableRef) throw new Error('Invalid center table ref in player card area.');

        return (
          <div
            className={clsx('relative', info.locationClass)}
            key={`player${player.playerNumber}-game-deck`}
            id={`player${player.playerNumber}-game-deck`}
          >
            {gameHandVisible && (
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
          cardStates={cardStates}
          onAnimationComplete={gameDeckState.handleAnimationComplete}
          dealType={gameDeckState.dealType}
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

{
  /* <PlayerGameDeck
                id={''}
                playerTableRef={undefined}
                playerDeckRefs={playerDeckRefs}
                player={info.player}
                state={state}
                cardStates={cardStates}
                onDealComplete={() => null}
                onCardPlayed={animationHandlers.handleCardPlayed}
                onTrickComplete={() => null}
                onPassDeal={() => null}
                playedCard={
                  playedCard && playerEqual(state.euchreGame.currentPlayer, info.player) ? playedCard : null
                }
              /> */
}

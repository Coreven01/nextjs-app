import clsx from 'clsx';
import React, { RefObject, useRef } from 'react';
import usePlayerData from '../../../hooks/euchre/data/usePlayerData';
import useGameData from '../../../hooks/euchre/data/useGameData';
import {
  EuchreAnimationHandlers,
  EuchreGameValues,
  EuchrePlayer
} from '../../../lib/euchre/definitions/game-state-definitions';
import { Card } from '../../../lib/euchre/definitions/definitions';
import useDeckState from '../../../hooks/euchre/useDeckState';
import GameGrid from '../game/game-grid';
import GameDeck from '../game/game-deck';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  state: EuchreGameValues;
  playedCard: Card | null;
  playerCenterTableRefs: Map<number, RefObject<HTMLDivElement | null>>;
  playerOuterTableRefs: Map<number, RefObject<HTMLDivElement | null>>;
  directCenterRef: RefObject<HTMLDivElement | null>;
  animationHandlers: EuchreAnimationHandlers;
  className: string;
}

/** Area for card animation for dealing and player's cards. */
const PlayerCardArea = ({
  state,
  playedCard,
  playerCenterTableRefs,
  playerOuterTableRefs,
  directCenterRef,
  animationHandlers,
  className,
  ...rest
}: DivProps) => {
  const {
    gameDeckVisible,
    gameDeckRef,
    playerDeckRefs,
    playerInnerDeckRefs,
    deckCardRefs,
    gameDeckState,
    deckAnimationControls,
    cardStates
  } = useDeckState(state, playerOuterTableRefs, directCenterRef, animationHandlers);

  const { getPlayerGridLayoutInfo } = usePlayerData();
  const { playerSittingOut } = useGameData();

  const players = state.euchreGame.gamePlayers;
  const playerLayoutForGrid = getPlayerGridLayoutInfo(players);
  const sittingOutPlayer: EuchrePlayer | null = playerSittingOut(state.euchreGame);
  const cardCountDuringPlay: number = sittingOutPlayer ? 3 : 4;

  const playersInitDealFinished = useRef<Set<number>>(new Set<number>());
  /** Map of trick id to the card values that were played for that trick. */
  const cardsPlayedForTrick = useRef<Map<string, Set<string>>>(new Map<string, Set<string>>());

  /** Set of trick id's where the event handler was executed to finish the trick. */
  const tricksFinished = useRef<Set<string>>(new Set<string>());

  // const handleInitComplete = (playerNumber: number) => {
  //   console.log('[handleInitComplete] - player-area.tsx');
  //   if (playersInitDealFinished.current.values().toArray().length === 4) return;

  //   playersInitDealFinished.current.add(playerNumber);

  //   if (playersInitDealFinished.current.values().toArray().length === 4) {
  //   }
  // };

  // const handleTrickFinished = useCallback(
  //   (card: Card) => {
  //     console.log('[handleTrickFinished] - player-area.tsx');

  //     const trick: EuchreTrick | undefined = state.euchreGame.currentTrick;
  //     const trickFinished = tricksFinished.current.has(trick.trickId);

  //     if (trickFinished) return;

  //     const cardVals = cardsPlayedForTrick.current.get(trick.trickId) ?? new Set<string>();

  //     cardVals.add(`${card.value}-${card.suit}`);
  //     cardsPlayedForTrick.current.set(trick.trickId, cardVals);

  //     if (trick.playerRenege || cardVals.values().toArray().length === cardCountDuringPlay) {
  //       tricksFinished.current.add(trick.trickId);
  //       animationHandlers.handleTrickFinished(); //  onTrickComplete();
  //     }
  //   },
  //   [animationHandlers, cardCountDuringPlay, state.euchreGame.currentTrick]
  // );

  console.log(
    '**** [PlayerCardArea] render. gameDeckState: ',
    gameDeckState,
    ' deck visible: ',
    gameDeckVisible,
    ' game state: ',
    state
  );

  return (
    <GameGrid className={className} {...rest}>
      {playerLayoutForGrid.map((info) => {
        const deckRef = playerDeckRefs.get(info.player.playerNumber);
        const innerDeckRef = playerInnerDeckRefs.get(info.player.playerNumber);
        const playerBottom = info.player.location === 'bottom';
        const playerTop = info.player.location === 'top';
        const playerLeft = info.player.location === 'left';
        const playerRight = info.player.location === 'right';

        return (
          <div
            className={clsx('relative', info.locationClass)}
            key={`player${info.player.playerNumber}-game-deck`}
          >
            {/* <PlayerGameDeck
              id={info.id}
              playerTableRef={info.tableRef}
              playerDeckRefs={playerDeckRefs}
              cardRefs={cardRefs}
              player={info.player}
              state={state}
              cardStates={cardStates}
              onDealComplete={getDealCompleteEvent()}
              onCardPlayed={animationHandlers.handleCardPlayed}
              onTrickComplete={handleTrickFinished}
              onPassDeal={() => null}
              playedCard={
                playedCard && playerEqual(state.euchreGame.currentPlayer, info.player) ? playedCard : null
              }
            /> */}
            <div
              ref={deckRef}
              id={`player-deck-${info.player.playerNumber}`}
              className={clsx(
                'absolute',
                { 'lg:left-1/2 left-[40%] bottom-0': playerBottom },
                { 'lg:left-1/2 left-[45%] top-0': playerTop },
                { 'lg:top-1/2 top-[35%] left-0': playerLeft },
                { 'lg:top-1/2 top-[35%] right-0': playerRight }
              )}
            >
              {`D-${info.player.playerNumber}`}
            </div>
            <div
              ref={innerDeckRef}
              id={`player-inner-deck-${info.player.playerNumber}`}
              className={clsx(
                'absolute',
                { 'left-1/2 top-0': playerBottom },
                { 'left-1/2 bottom-0': playerTop },
                { 'top-1/2 right-0': playerLeft },
                { 'top-1/2 left-0': playerRight }
              )}
            >
              {`I-${info.player.playerNumber}`}
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
        />
      )}
    </GameGrid>
  );
};

export default PlayerCardArea;

import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import PlayerHand from './player-hand';
import PlayerInfo from './player-info';
import GameDeck from '../game/game-deck';
import { EuchreGameFlowState } from '@/app/hooks/euchre/gameFlowReducer';
import clsx from 'clsx';
import usePlayerData from '@/app/hooks/euchre/data/usePlayerData';
import { RefObject, useRef } from 'react';
//import { env } from 'node:process';

type Props = {
  player: EuchrePlayer;
  game: EuchreGameInstance;
  settings: EuchreSettings;
  gameFlow: EuchreGameFlowState;
  dealDeck: Card[];
  playedCard: Card | null;
  playerTableRef: RefObject<HTMLDivElement>;
  onCardClick: (card: Card) => void;
};

export default function PlayerGameDeck({
  player,
  game,
  gameFlow,
  settings,
  dealDeck,
  playedCard,
  playerTableRef,
  onCardClick
}: Props) {
  const deckRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  const { playerLocation } = usePlayerData();
  const isDebugMode = false; //env.REACT_APP_DEBUG === 'true';
  const playerNumber = player.playerNumber;
  const positionCenter = `absolute ${playerNumber === 1 ? 'top-0' : 'bottom-0'}`;
  const positionSide = `absolute ${playerNumber === 3 ? 'right-0' : 'left-0'}`;
  const location = playerLocation(player);
  const position = location === 'center' ? positionCenter : positionSide;
  const shouldShowDeckImages = gameFlow.shouldShowDeckImages.find((c) => c.player === player)?.value;
  const shouldShowHandImages = gameFlow.shouldShowCardImagesForHand.find((c) => c.player === player)?.value;
  const gameDeck = shouldShowDeckImages && (
    <div id={`game-deck-${playerNumber}`} className={position}>
      <GameDeck deck={dealDeck} location={location} />
    </div>
  );

  let playerInfoOuterClass = '';
  let playerInfoInnerClass = '';
  let classForLocation = '';
  let playerHandClassOuter = '';
  let playerHandClassInner = '';

  switch (player.playerNumber) {
    case 1:
      playerInfoOuterClass = 'md:w-auto md:right-8';
      playerInfoInnerClass = 'md:relative md:-right-4 md:left-0 md:bottom-0 right-16 bottom-4 md:min-w-32';
      classForLocation = 'flex md:items-end justify-center items-center h-full';
      playerHandClassOuter =
        'md:relative md:left-0 md:top-0 md:h-full left-4 bottom-0 absolute md:overflow-visible overflow-hidden pointer-events-none';
      playerHandClassInner = 'grow flex relative justify-center';
      break;
    case 2:
      playerInfoOuterClass = 'md:w-auto md:right-48';
      playerInfoInnerClass = 'md:relative md:-right-4 md:left-0 md:bottom-0 right-16 -bottom-8 md:min-w-32';
      classForLocation =
        'flex md:items-end justify-center items-center h-full md:overflow-visible overflow-hidden';
      playerHandClassOuter = 'md:relative md:left-0 md:top-0 md:h-full absolute -top-24';
      playerHandClassInner = 'flex relative top-8 md:top-0';
      break;
    case 3:
      playerInfoOuterClass = 'w-full';
      playerInfoInnerClass = 'md:-right-4 md:left-auto md:-top-48 -left-2 top-inherit bottom-0 md:min-w-32';
      classForLocation =
        'md:top-0 md:flex md:overflow-visible overflow-hidden flex-col items-end justify-center h-full -top-8';
      playerHandClassOuter = 'md:relative md:left-0 absolute -left-16';
      playerHandClassInner = '';
      break;
    case 4:
      playerInfoOuterClass = 'w-full';
      playerInfoInnerClass = 'md:-left-4 md:right-auto md:-top-48 -right-2 top-inherit bottom-0 md:min-w-32';
      classForLocation =
        'md:top-0 md:flex md:overflow-visible overflow-hidden flex-col items-start justify-center h-full -top-8';
      playerHandClassOuter = 'md:relative md:left-0 absolute -left-16';
      playerHandClassInner = 'relative left-20 md:left-0';
      break;
  }

  const playerInfo = gameFlow.hasGameStarted && (
    <div className={clsx('absolute md:text-sm text-xs whitespace-nowrap z-20', playerInfoOuterClass)}>
      <div className={clsx('absolute', playerInfoInnerClass)}>
        <PlayerInfo
          id={`player-info-${player.playerNumber}`}
          game={game}
          player={player}
          settings={settings}
        />
      </div>
    </div>
  );

  return (
    <>
      <div id={`player-hand-inner-${player.playerNumber}`} className={playerHandClassInner}>
        <PlayerHand
          key={`${game.currentRound}-${player.playerNumber}`}
          game={game}
          gameSettings={settings}
          gameFlow={gameFlow}
          player={player}
          playedCard={playedCard}
          onCardClick={onCardClick}
          deckRef={deckRef}
          playerTableRef={playerTableRef}
        />
        <div
          id={`player-base-${playerNumber}`}
          className={clsx(position, { 'text-transparent': !isDebugMode })}
        >
          X
        </div>
        {gameDeck}
        {playerInfo}
      </div>
    </>
  );
}

{
  /* <>
      <div id={`player-deck-${player.playerNumber}`} className={`${classForLocation} relative`} ref={deckRef}>
        <div id={`player-hand-outer-${player.playerNumber}`} className={playerHandClassOuter}>
          <div id={`player-hand-inner-${player.playerNumber}`} className={playerHandClassInner}>
            <PlayerHand
              key={`${game.currentRound}-${player.playerNumber}`}
              game={game}
              gameSettings={settings}
              gameFlow={gameFlow}
              player={player}
              playedCard={playedCard}
              onCardClick={onCardClick}
              deckRef={deckRef}
              playerTableRef={playerTableRef}
            />
          </div>
        </div>
        <div
          id={`player-base-${playerNumber}`}
          className={clsx(position, { 'text-transparent': !isDebugMode })}
        >
          X
        </div>
        {gameDeck}
      </div>
      {playerInfo}
    </> */
}

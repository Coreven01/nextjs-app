import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import PlayerHand from './player-hand';
import PlayerInfo from './player-info';
import GameDeck from '../game/game-deck';
import { EuchreGameFlowState } from '@/app/hooks/euchre/gameFlowReducer';
import clsx from 'clsx';
//import { env } from 'node:process';

type Props = {
  player: EuchrePlayer;
  game: EuchreGameInstance;
  settings: EuchreSettings;
  gameFlow: EuchreGameFlowState;
  dealDeck: Card[];
  onCardClick: (card: Card) => void;
};

export default function PlayerGameDeck({ player, game, gameFlow, settings, dealDeck, onCardClick }: Props) {
  const isDebugMode = true; //env.REACT_APP_DEBUG === 'true';
  const playerNumber = player.playerNumber;
  const positionCenter = `absolute ${playerNumber === 1 ? 'top-0' : 'bottom-0'}`;
  const positionSide = `absolute ${playerNumber === 3 ? 'right-0' : 'left-0'}`;
  const position = player.location === 'center' ? positionCenter : positionSide;
  const shouldShowDeckImages = gameFlow.shouldShowDeckImages.find((c) => c.player === player)?.value;
  const shouldShowHandImages = gameFlow.shouldShowCardImagesForHand.find((c) => c.player === player)?.value;
  const gameDeck = shouldShowDeckImages && (
    <div id={`game-deck-${playerNumber}`} className={position}>
      <GameDeck deck={dealDeck} location={player.location} />
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
        'md:relative md:left-0 md:top-0 md:h-full left-4 bottom-0 absolute md:overflow-visible overflow-hidden';
      playerHandClassInner = 'flex relative md:-top-8 top-4';
      break;
    case 2:
      playerInfoOuterClass = 'md:w-auto md:right-8';
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
    <div className={clsx('relative md:text-sm text-xs whitespace-nowrap z-20', playerInfoOuterClass)}>
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
      <div id={`player-deck-${player.playerNumber}`} className={`${classForLocation} relative`}>
        <div id={`player-hand-outer-${player.playerNumber}`} className={playerHandClassOuter}>
          <div id={`player-hand-inner-${player.playerNumber}`} className={playerHandClassInner}>
            <PlayerHand
              game={game}
              gameSettings={settings}
              gameFlow={gameFlow}
              player={player}
              onCardClick={onCardClick}
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
    </>
  );
}

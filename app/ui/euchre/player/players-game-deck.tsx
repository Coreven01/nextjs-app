import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import PlayerHand from './player-hand';
import PlayerInfo from './player-info';
import GameDeck from '../game/game-deck';
import { EuchreGameFlowState } from '@/app/hooks/euchre/gameFlowReducer';

type Props = {
  player: EuchrePlayer;
  game: EuchreGameInstance;
  settings: EuchreSettings;
  gameFlow: EuchreGameFlowState;
  dealDeck: Card[];
  onCardClick: (card: Card) => void;
};

export default function PlayerGameDeck({ player, game, gameFlow, settings, dealDeck, onCardClick }: Props) {
  const playerNumber = player.playerNumber;
  const positionCenter = `absolute ${playerNumber === 1 ? 'top-0' : 'bottom-0'}`;
  const positionSide = `absolute ${playerNumber === 3 ? 'right-0' : 'left-0'}`;
  const position = player.location === 'center' ? positionCenter : positionSide;
  const shouldShowDeckImages = gameFlow.shouldShowDeckImages.find((c) => c.player === player)?.value;
  const shouldShowHandImages = gameFlow.shouldShowHandImages.find((c) => c.player === player)?.value;
  const gameDeck = shouldShowDeckImages ? (
    <div id={`game-deck-${playerNumber}`} className={position}>
      <GameDeck deck={dealDeck} location={player.location} />
    </div>
  ) : (
    <></>
  );

  let playerInfoClass = '';
  let playerInfoSize = '';
  let classForLocation = '';
  let playerHandClassOuter = '';
  let playerHandClassInner = '';

  switch (player.playerNumber) {
    case 1:
      playerInfoClass = 'absolute -left-10';
      playerInfoSize = 'h-full min-w-8';
      classForLocation = 'flex md:items-end md:justify-start justify-center items-center';
      playerHandClassOuter = 'md:relative md:left-0 md:top:0 md:overflow-visible md:h-full absolute -top-16';
      playerHandClassInner = 'flex relative top-16';
      break;
    case 2:
      playerInfoClass = 'absolute -left-10 bottom-0';
      playerInfoSize = 'h-full min-w-8';
      playerHandClassOuter = 'justify-start';
      break;
    case 3:
      playerInfoClass = 'absolute -top-8 right-0';
      playerInfoSize = 'w-full min-h-8';
      classForLocation = 'md:flex flex-col items-end justify-center h-full';
      playerHandClassOuter = 'md:relative md:left-0 absolute -left-16';
      playerHandClassInner = '';
      break;
    case 4:
      playerInfoClass = 'absolute -top-8 left-0';
      playerInfoSize = 'w-full min-h-8';
      classForLocation = 'md:flex flex-col items-start justify-center h-full';
      playerHandClassOuter = 'relative left-20';
      playerHandClassInner = 'md:relative md:left-0 absolute -left-16';
      break;
  }

  const playerInfo = gameFlow.hasGameStarted ? (
    <div className={`relative hidden ${playerInfoSize}`}>
      <div className={playerInfoClass}>
        <PlayerInfo game={game} player={player} settings={settings} />
      </div>
    </div>
  ) : (
    <></>
  );

  return (
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
      <div id={`player-base-${playerNumber}`} className={position}>
        X
      </div>
      {gameDeck}
      {playerInfo}
    </div>
  );
}

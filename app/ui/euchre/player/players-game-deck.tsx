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

  switch (player.playerNumber) {
    case 1:
      playerInfoClass = 'absolute -left-10';
      playerInfoSize = 'h-full min-w-8';
      classForLocation = 'items-end justify-start';
      break;
    case 2:
      playerInfoClass = 'absolute -left-10 bottom-0';
      playerInfoSize = 'h-full min-w-8';
      classForLocation = 'justify-start';
      break;
    case 3:
      playerInfoClass = 'absolute -top-8 right-0';
      playerInfoSize = 'w-full min-h-8';
      classForLocation = 'flex-col items-end justify-center';
      break;
    case 4:
      playerInfoClass = 'absolute -top-8 left-0';
      playerInfoSize = 'w-full min-h-8';
      classForLocation = 'flex-col items-start justify-center';
      break;
  }

  const playerInfo = gameFlow.hasGameStarted ? (
    <div className={`relative ${playerInfoSize}`}>
      <div className={playerInfoClass}>
        <PlayerInfo game={game} player={player} settings={settings} />
      </div>
    </div>
  ) : (
    <></>
  );

  return (
    <div className={`flex ${classForLocation} h-full relative`}>
      <PlayerHand
        game={game}
        gameSettings={settings}
        gameFlow={gameFlow}
        player={player}
        onCardClick={onCardClick}
      />
      <div></div>
      <div id={`player-base-${playerNumber}`} className={position}>
        X
      </div>
      {gameDeck}
      {playerInfo}
    </div>
  );
}

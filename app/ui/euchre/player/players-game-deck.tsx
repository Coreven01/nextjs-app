import { Card, EuchreGameInstance, EuchrePlayer } from '@/app/lib/euchre/definitions';
import PlayerHand from './player-hand';
import PlayerInfo from './player-info';
import GameDeck from '../game-deck';
import { GameFlowState } from '@/app/hooks/euchre/gameFlowReducer';

type Props = {
  player: EuchrePlayer;
  game: EuchreGameInstance;
  gameState: GameFlowState;
  dealDeck: Card[];
  onCardClick: (card: Card) => void;
};

export default function PlayerGameDeck({ player, game, gameState, dealDeck, onCardClick }: Props) {
  const playerNumber = player.playerNumber;
  const positionCenter = `absolute ${playerNumber === 1 ? 'top-0' : 'bottom-0'}`;
  const positionSide = `absolute ${playerNumber === 3 ? 'right-0' : 'left-0'}`;
  const position = player.location === 'center' ? positionCenter : positionSide;
  const shouldShowDeckImages = gameState.shouldShowDeckImages.find(
    (c) => c.player === player
  )?.value;

  const gameDeck = shouldShowDeckImages ? (
    <div id={`game-deck-${playerNumber}`} className={position}>
      <GameDeck deck={dealDeck} location={player.location} />
    </div>
  ) : (
    <></>
  );

  let classForLocation = '';

  switch (playerNumber) {
    case 1:
      classForLocation = 'items-end';
      break;
    case 2:
      classForLocation = '';
      break;
    case 3:
      classForLocation = 'flex-col items-end';
      break;
    case 4:
      classForLocation = 'flex-col items-start';
      break;
  }
  const playerInfoClass = `${player.location === 'side' ? '' : ''}`;

  return (
    <>
      <div className={`flex ${classForLocation} h-full justify-center relative`}>
        <PlayerHand gameFlow={gameState} player={player} onCardClick={onCardClick} />
        <div id={`player-base-${playerNumber}`} className={position}>
          X
        </div>
        {gameDeck}
        <div className={playerInfoClass}>
          <PlayerInfo game={game} player={player} />
        </div>
      </div>
    </>
  );
}

import { Card, EuchreGameInstance, EuchreSettings } from '@/app/lib/euchre/definitions';
import PlayerGameDeck from '../player/players-game-deck';
import GameMenu from './game-menu';
import { EuchreGameFlowState } from '@/app/hooks/euchre/gameFlowReducer';
import GameTable from './game-table';
import { PlayerNotificationState } from '@/app/hooks/euchre/playerNotificationReducer';

interface Props {
  gameInstance: EuchreGameInstance;
  gameFlow: EuchreGameFlowState;
  gameSettings: EuchreSettings;
  isFullScreen: boolean;
  showEvents: boolean;
  showSettings: boolean;
  playerNotification: PlayerNotificationState;
  onToggleFullscreeen: (value: boolean) => void;
  onToggleEvents: (value: boolean) => void;
  onSettingsToggle: (e: boolean) => void;
  onCardPlayed: (card: Card) => void;
}

export default function GameArea({
  gameInstance,
  gameFlow,
  gameSettings,
  isFullScreen,
  showEvents,
  showSettings,
  playerNotification,
  onToggleFullscreeen,
  onToggleEvents,
  onSettingsToggle,
  onCardPlayed
}: Props) {
  return (
    <div className="grid grid-flow-col grid-rows-[150px,1fr,1fr,150px] grid-cols-[1fr,600px,1fr] gap-4 h-full">
      <GameMenu
        isFullScreen={isFullScreen}
        showEvents={showEvents}
        showSettings={showSettings}
        onFullScreenToggle={onToggleFullscreeen}
        onEventsToggle={onToggleEvents}
        onSettingsToggle={onSettingsToggle}
      />
      <div className="row-span-4 min-w-[175px]">
        <PlayerGameDeck
          player={gameInstance.player3}
          game={gameInstance}
          gameFlow={gameFlow}
          settings={gameSettings}
          onCardClick={onCardPlayed}
          dealDeck={gameInstance.deck}
        />
      </div>
      <div className="col-span-1">
        <PlayerGameDeck
          player={gameInstance.player2}
          game={gameInstance}
          gameFlow={gameFlow}
          settings={gameSettings}
          onCardClick={onCardPlayed}
          dealDeck={gameInstance.deck}
        />
      </div>
      <div className="col-span-1 row-span-2">
        <GameTable playerNotification={playerNotification} />
      </div>
      <div className="col-span-1 ">
        <PlayerGameDeck
          player={gameInstance.player1}
          game={gameInstance}
          gameFlow={gameFlow}
          settings={gameSettings}
          onCardClick={onCardPlayed}
          dealDeck={gameInstance.deck}
        />
      </div>
      <div className="row-span-4 min-w-[175px]">
        <PlayerGameDeck
          player={gameInstance.player4}
          game={gameInstance}
          gameFlow={gameFlow}
          settings={gameSettings}
          onCardClick={onCardPlayed}
          dealDeck={gameInstance.deck}
        />
      </div>
    </div>
  );
}

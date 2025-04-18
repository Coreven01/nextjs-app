import { Card, EuchreGameInstance, EuchreSettings } from '@/app/lib/euchre/definitions';
import GameMenu from './game-menu';
import { EuchreGameFlowState } from '@/app/hooks/euchre/reducers/gameFlowReducer';
import GameTable from './game-table';
import { PlayerNotificationState } from '@/app/hooks/euchre/reducers/playerNotificationReducer';
import PlayerArea from '../player/player-area';
import { useRef } from 'react';
import { EuchreAnimationState } from '../../../hooks/euchre/reducers/gameAnimationFlowReducer';
import clsx from 'clsx';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  game: EuchreGameInstance;
  gameFlow: EuchreGameFlowState;
  gameSettings: EuchreSettings;
  gameAnimation: EuchreAnimationState;
  isFullScreen: boolean;
  showEvents: boolean;
  showSettings: boolean;
  showScore: boolean;
  playerNotification: PlayerNotificationState;
  playedCard: Card | null;
  onToggleFullscreen: (value: boolean) => void;
  onToggleEvents: (value: boolean) => void;
  onSettingsToggle: (e: boolean) => void;
  onScoreToggle: (e: boolean) => void;
  onCardPlayed: (card: Card) => void;
  onCancel: () => void;
  onBeginComplete: () => void;
}

const GameArea = ({
  game,
  gameFlow,
  gameSettings,
  gameAnimation,
  isFullScreen,
  showEvents,
  showSettings,
  showScore,
  playerNotification,
  playedCard,
  className,
  onToggleFullscreen,
  onToggleEvents,
  onSettingsToggle,
  onScoreToggle,
  onCardPlayed,
  onCancel,
  onBeginComplete
}: Props) => {
  const player1TableRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  const player2TableRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  const player3TableRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  const player4TableRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);

  return (
    <div
      className={clsx(
        `grid grid-flow-col grid-rows-[minmax(50px,auto)_minmax(50px,auto)_minmax(50px,75px)] grid-cols-[minmax(50px,auto)_minmax(60%,600px)_minmax(50px,auto)] md:grid-rows-[120px,1fr,120px] md:grid-cols-[120px_minmax(60%,600px)_120px]`,
        className
      )}
    >
      <GameMenu
        isFullScreen={isFullScreen}
        showEvents={showEvents}
        showSettings={showSettings}
        showScore={showScore}
        onFullScreenToggle={onToggleFullscreen}
        onEventsToggle={onToggleEvents}
        onSettingsToggle={onSettingsToggle}
        onCancelAndReset={onCancel}
        onScoreToggle={onScoreToggle}
      />
      <div className="col-start-2 row-start-2 col-span-1 row-span-1">
        <GameTable
          game={game}
          gameFlow={gameFlow}
          playerNotification={playerNotification}
          player1TableRef={player1TableRef}
          player2TableRef={player2TableRef}
          player3TableRef={player3TableRef}
          player4TableRef={player4TableRef}
        />
      </div>
      <PlayerArea
        key={`${game.dealPassedCount}-${game.currentRound}`}
        game={game}
        gameFlow={gameFlow}
        gameSettings={gameSettings}
        gameAnimation={gameAnimation}
        playedCard={playedCard}
        player1TableRef={player1TableRef}
        player2TableRef={player2TableRef}
        player3TableRef={player3TableRef}
        player4TableRef={player4TableRef}
        onCardPlayed={onCardPlayed}
        onBeginComplete={onBeginComplete}
        className="col-start-1 row-start-1 col-span-3 row-span-3"
      ></PlayerArea>
    </div>
  );
};

export default GameArea;

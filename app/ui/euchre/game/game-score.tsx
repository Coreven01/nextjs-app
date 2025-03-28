import Draggable, { DraggableEvent } from 'react-draggable';
import { RefObject, useRef } from 'react';
import GameBorder from './game-border';
import { EuchreGameInstance, EuchreSettings } from '@/app/lib/euchre/definitions';
import PlayerColor from '../player/player-team-color';
import { getSuitName } from '@/app/lib/euchre/card-data';
import GameBorderBare from './game-border-bare';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  game: EuchreGameInstance;
  settings: EuchreSettings;
}

export default function GameScore({ children, className, game, settings, ...rest }: DivProps) {
  const teamOnePoints = game.teamPoints(1);
  const teamTwoPoints = game.teamPoints(2);
  const draggableRef: RefObject<HTMLDivElement> = useRef(null) as unknown as React.RefObject<HTMLDivElement>;

  const handleDrag = (e: DraggableEvent, data: object) => {
    console.log('dragging:', data);
  };

  return (
    <Draggable
      grid={[15, 15]}
      defaultClassName={`absolute z-10 ${className}`}
      nodeRef={draggableRef}
      onDrag={handleDrag}
    >
      <div ref={draggableRef} className="cursor-move flex max-h-64">
        <GameBorderBare className="shadow-md shadow-black md:min-w-32">
          <h3 className="text-yellow-200 font-bold text-center md:text-base text-sm">Score</h3>
          <div className="flex md:flex-col gap-1 md:text-base text-xs md:mx-1 whitespace-nowrap">
            <PlayerColor player={game.player1} settings={settings}>
              <div className="bg-stone-800 w-full text-center">{Math.min(teamOnePoints, 10)} / 10</div>
            </PlayerColor>
            <PlayerColor player={game.player3} settings={settings}>
              <div className="bg-stone-800 w-full text-center">{Math.min(teamTwoPoints, 10)} / 10</div>
            </PlayerColor>
          </div>
          {game.maker && game.trump && (
            <div className="mx-1 md:text-base text-xs text-center">
              Trump: {getSuitName(game.trump.suit)}s
            </div>
          )}
        </GameBorderBare>
      </div>
    </Draggable>
  );
}

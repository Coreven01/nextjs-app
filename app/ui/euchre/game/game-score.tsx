import Draggable, { DraggableEvent, DraggableEventHandler } from 'react-draggable';
import { RefObject, useRef } from 'react';
import GameBorder from './game-border';
import { EuchreGameInstance } from '@/app/lib/euchre/definitions';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  game: EuchreGameInstance;
}

export default function GameScore({ children, className, game, ...rest }: DivProps) {
  const teamOnePoints = game.gameResults
    .filter((t) => t.teamWon === 1)
    .map((t) => t.points)
    .reduce((acc, curr) => acc + curr, 0);

  const teamTwoPoints = game.gameResults
    .filter((t) => t.teamWon === 2)
    .map((t) => t.points)
    .reduce((acc, curr) => acc + curr, 0);

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
        <GameBorder>
          <div className="p-1">
            <div>Team One: {Math.min(teamOnePoints, 10)} / 10</div>
            <div>Team Two: {Math.min(teamTwoPoints, 10)} / 10</div>
          </div>
        </GameBorder>
      </div>
    </Draggable>
  );
}

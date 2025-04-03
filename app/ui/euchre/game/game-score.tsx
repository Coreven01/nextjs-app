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
  const tricksOneCount = game.handTricks.filter((t) => t.taker?.team === 1).length;
  const tricksTwoCount = game.handTricks.filter((t) => t.taker?.team === 2).length;

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
          <table className="w-auto m-1 md:text-sm text-xs bg-stone-800 ">
            <thead>
              <tr>
                <th className="w-6"></th>
                <th>Pts</th>
                <th>Tricks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <PlayerColor
                    className="border border-white text-transparent h-4 w-4"
                    player={game.player1}
                    settings={settings}
                  >
                    X
                  </PlayerColor>
                </td>
                <td>
                  <div className="w-full text-center">{Math.min(teamOnePoints, 10)} / 10</div>
                </td>
                <td>
                  <div className="w-full text-center">{tricksOneCount} / 5</div>
                </td>
              </tr>
              <tr>
                <td>
                  <PlayerColor
                    className="border border-white text-transparent h-4 w-4"
                    player={game.player3}
                    settings={settings}
                  >
                    X
                  </PlayerColor>
                </td>
                <td>
                  <div className="w-full text-center">{Math.min(teamTwoPoints, 10)} / 10</div>
                </td>
                <td>
                  <div className="w-full text-center">{tricksTwoCount} / 5</div>
                </td>
              </tr>
            </tbody>
          </table>
          {game.maker && game.trump && (
            <div className="mx-1 md:text-sm text-xs text-center">Trump: {getSuitName(game.trump.suit)}s</div>
          )}
        </GameBorderBare>
      </div>
    </Draggable>
  );
}

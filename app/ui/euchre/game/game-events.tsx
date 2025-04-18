import clsx from 'clsx';
import { RefObject, useEffect, useRef } from 'react';
import Draggable, { DraggableEvent } from 'react-draggable';
import GameBorder from './game-border';
import { GameEvent } from '@/app/hooks/euchre/useEventLog';

interface Props {
  className?: string;
  events: GameEvent[];
  onClear: () => void;
  onClose: () => void;
}

const GameEvents = ({ className, events, onClear, onClose }: Props) => {
  const draggableRef: RefObject<HTMLDivElement> = useRef(null) as unknown as React.RefObject<HTMLDivElement>;
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current) {
      divRef.current.scrollTop = divRef.current.scrollHeight;
    }
  }, [events]);

  const handleClear = () => {
    onClear();
  };

  const handleClose = () => {
    onClose();
  };

  const handleDrag = (e: DraggableEvent, data: object) => {};

  return (
    <Draggable
      grid={[15, 15]}
      defaultPosition={{ x: 25, y: 25 }}
      defaultClassName={clsx('absolute', className)}
      nodeRef={draggableRef}
    >
      <div ref={draggableRef} className="cursor-move flex w-[600px]" style={{ zIndex: 1000 }}>
        <GameBorder className="w-full relative">
          <h2 className="text-yellow-200 font-bold text-center">Events</h2>
          <div ref={divRef} className="p-2 border border-white m-1 h-[300px] overflow-y-auto text-sm">
            <ul>
              {events.map((e) => {
                return (
                  <li key={e.id}>
                    {e.time} {`(${e.type})`}: {e.message} {e.player ? `(${e.player})` : ''}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex gap-2 items-center justify-center mb-1">
            <button className="text-white border border-white md:p-2 p-1" onClick={handleClear}>
              Clear
            </button>
            <button className="text-white border border-white md:p-2 p-1" onClick={handleClose}>
              Close
            </button>
          </div>
        </GameBorder>
      </div>
    </Draggable>
  );
};

export default GameEvents;

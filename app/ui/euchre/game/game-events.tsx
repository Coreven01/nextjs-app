'use client';

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
export default function GameEvents({ className, events, onClear, onClose }: Props) {
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

  const handleDrag = (e: DraggableEvent, data: object) => {
    //console.log('dragging:', data);
  };

  return (
    <Draggable
      grid={[15, 15]}
      defaultPosition={{ x: 25, y: 25 }}
      defaultClassName={clsx('absolute z-20', className)}
      nodeRef={draggableRef}
      onDrag={handleDrag}
    >
      <div ref={draggableRef} className="cursor-move flex w-[500px]">
        <GameBorder className="w-full relative">
          <h2 className="text-yellow-200 font-bold text-center">Events</h2>
          <div ref={divRef} className="p-2 border border-white m-1 h-[200px] overflow-y-auto text-sm">
            <ul>
              {events.map((e) => {
                return (
                  <li key={e.id}>
                    {e.time}: {e.message}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex gap-2 items-center justify-center">
            <button className="" onClick={handleClear}>
              Clear
            </button>
            <button className="" onClick={handleClose}>
              Close
            </button>
          </div>
        </GameBorder>
      </div>
    </Draggable>
  );
}

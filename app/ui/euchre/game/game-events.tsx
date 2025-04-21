import clsx from 'clsx';
import { RefObject, useEffect, useRef } from 'react';
import Draggable, { DraggableEvent } from 'react-draggable';
import GameBorder from './game-border';
import { GameEvent } from '@/app/hooks/euchre/useEventLog';
import PromptHeader from '../prompt/prompt-header';

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
      <div ref={draggableRef} className="cursor-move flex" style={{ zIndex: 1000 }}>
        <GameBorder className="relative" innerClass=" lg:w-[600px] w-[500px] bg-stone-900">
          <PromptHeader>Events</PromptHeader>
          <div
            ref={divRef}
            className="p-2 border border-white m-1 overflow-y-auto lg:text-base text-xs h-[200px] lg:h-[400px]"
          >
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
          <div className="flex gap-2 items-center justify-center m-1 mt-2 lg:text-base text-xs">
            <button className="text-white border border-white lg:p-2 p-1 grow" onClick={handleClear}>
              Clear
            </button>
            <button className="text-white border border-white lg:p-2 p-1 grow" onClick={handleClose}>
              Close
            </button>
          </div>
        </GameBorder>
      </div>
    </Draggable>
  );
};

export default GameEvents;

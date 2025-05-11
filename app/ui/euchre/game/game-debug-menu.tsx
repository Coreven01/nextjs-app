import clsx from 'clsx';
import { RefObject, useRef } from 'react';
import Draggable from 'react-draggable';
import GameBorder from './game-border';
import PromptHeader from '../prompt/prompt-header';
import GameButton from './game-button';
import { EuchreDebugHandlers } from '../../../lib/euchre/definitions/game-state-definitions';

interface Props {
  className?: string;
  handlers: EuchreDebugHandlers;
  onClose: () => void;
}

const GameDebugMenu = ({ className, handlers, onClose }: Props) => {
  const draggableRef: RefObject<HTMLDivElement> = useRef(null) as unknown as React.RefObject<HTMLDivElement>;

  const handleClose = () => {
    onClose();
  };

  return (
    <Draggable
      grid={[15, 15]}
      defaultPosition={{ x: 25, y: 25 }}
      defaultClassName={clsx('absolute', className)}
      handle="h2"
      nodeRef={draggableRef}
    >
      <div ref={draggableRef} className="flex" style={{ zIndex: 1000 }}>
        <GameBorder className="relative" innerClass=" lg:w-[300px] w-[200px] bg-stone-900">
          <PromptHeader className="cursor-move ">Debug Menu</PromptHeader>
          <div className="flex flex-col gap-2 min-h-32 items-start p-1">
            <GameButton className="w-full" type="success" onClick={handlers.onRunInitGame}>
              Run Init Game
            </GameButton>
            <GameButton className="w-full" type="success" onClick={handlers.onRunInitGame}>
              Run Init and Shuffle
            </GameButton>
            <GameButton className="w-full" type="success" onClick={handlers.onRunTrickNotification}>
              Run Trick Notification
            </GameButton>
            <GameButton className="w-full" type="success" onClick={handlers.onRunFullGame}>
              Run Test Game
            </GameButton>
          </div>
          <div className="flex gap-2 items-center justify-center m-1 mt-2">
            <GameButton type="danger" onClick={handleClose}>
              Close
            </GameButton>
          </div>
        </GameBorder>
      </div>
    </Draggable>
  );
};

export default GameDebugMenu;

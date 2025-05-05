import clsx from 'clsx';
import { RefObject, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import GameBorder from './game-border';
import { GameEvent, GameEventType } from '@/app/hooks/euchre/useEventLog';
import PromptHeader from '../prompt/prompt-header';
import Switch from '@mui/material/Switch';
import { ChangeEvent, useState } from 'react';
import GameEventLine from './game-event-line';
import useCardSvgData from '../../../hooks/euchre/data/useCardSvgData';

interface Props {
  className?: string;
  events: GameEvent[];
  onClear: () => void;
  onClose: () => void;
}

const GameEvents = ({ className, events, onClear, onClose }: Props) => {
  const draggableRef: RefObject<HTMLDivElement> = useRef(null) as unknown as React.RefObject<HTMLDivElement>;
  const divRef = useRef<HTMLDivElement>(null);
  const [showDebugEvents, setShowDebugEvents] = useState(false);
  const [showVerboseEvents, setShowVerboseEvents] = useState(false);
  const [showInformationEvents, setShowInformationEvents] = useState(true);
  const [showTimeStamp, setShowTimeStamp] = useState(false);
  const { getCardFullName } = useCardSvgData();

  const getFilteredEvents = (): GameEvent[] => {
    const eventTypes: GameEventType[] = [];
    if (showDebugEvents) eventTypes.push('d');
    if (showVerboseEvents) eventTypes.push('v');
    if (showInformationEvents) eventTypes.push('i');

    return events.filter((e) => eventTypes.includes(e.type));
  };

  const filteredEvents: GameEvent[] = getFilteredEvents();

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

  //const handleDrag = (e: DraggableEvent, data: object) => {};
  const handleToggleDebug = (e: ChangeEvent<HTMLInputElement>) => setShowDebugEvents(e.target.checked);
  const handleToggleInfomation = (e: ChangeEvent<HTMLInputElement>) =>
    setShowInformationEvents(e.target.checked);
  const handleToggleVerbose = (e: ChangeEvent<HTMLInputElement>) => setShowVerboseEvents(e.target.checked);
  const handleToggleTimeStamp = (e: ChangeEvent<HTMLInputElement>) => setShowTimeStamp(e.target.checked);

  return (
    <Draggable
      grid={[15, 15]}
      defaultPosition={{ x: 25, y: 25 }}
      defaultClassName={clsx('absolute', className)}
      handle="h2"
      nodeRef={draggableRef}
    >
      <div ref={draggableRef} className="flex" style={{ zIndex: 1000 }}>
        <GameBorder className="relative" innerClass=" lg:w-[550px] w-[500px] bg-stone-900">
          <PromptHeader className="cursor-move ">Events</PromptHeader>
          <div className="flex mx-1 justify-center gap-2 lg:text-sm">
            <div>
              <label htmlFor="showInformationEvents">Information: </label>
              <Switch
                id="showInformationEvents"
                size="small"
                checked={showInformationEvents}
                name="showInformationEvents"
                color="success"
                onChange={(e) => handleToggleInfomation(e)}
              />
              {' | '}
            </div>
            <div>
              <label htmlFor="showVerboseEvents">Verbose: </label>
              <Switch
                id="showVerboseEvents"
                size="small"
                checked={showVerboseEvents}
                name="showVerboseEvents"
                color="success"
                onChange={(e) => handleToggleVerbose(e)}
              />
              {' | '}
            </div>
            <div>
              <label htmlFor="showDebugEvents">Debug: </label>
              <Switch
                id="showDebugEvents"
                size="small"
                checked={showDebugEvents}
                name="showDebugEvents"
                color="success"
                onChange={(e) => handleToggleDebug(e)}
              />
              {' | '}
            </div>
            <div>
              <label htmlFor="showTimeStamp">Show Timestamp: </label>
              <Switch
                id="showTimeStamp"
                size="small"
                checked={showTimeStamp}
                name="showTimeStamp"
                color="success"
                onChange={(e) => handleToggleTimeStamp(e)}
              />
            </div>
          </div>
          <div
            ref={divRef}
            className="border border-white m-1 overflow-y-auto lg:text-sm text-xs h-[200px] lg:h-[400px]"
          >
            <ul>
              {filteredEvents.map((e) => {
                return (
                  <GameEventLine
                    key={e.id}
                    event={e}
                    showTimeStamp={showTimeStamp}
                    getCardFullName={getCardFullName}
                  />
                );
              })}
            </ul>
          </div>
          <div className="h-8 flex gap-2 items-center justify-center m-1 mt-2 lg:text-base text-xs">
            <button className="text-white border border-white grow" onClick={handleClear}>
              Clear
            </button>
            <button className="text-white border border-white grow" onClick={handleClose}>
              Close
            </button>
          </div>
        </GameBorder>
      </div>
    </Draggable>
  );
};

export default GameEvents;

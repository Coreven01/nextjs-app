import clsx from 'clsx';
import { RefObject, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import GameBorder from './game-border';
import { GameEvent, GameEventType } from '@/app/hooks/euchre/useEventLog';
import PromptHeader from '../prompt/prompt-header';
import Switch from '@mui/material/Switch';
import { useState } from 'react';
import GameEventLine from './game-event-line';
import GameButton from './game-button';

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

  //#region Handlers
  const handleClear = () => {
    onClear();
  };

  const handleClose = () => {
    onClose();
  };

  const handleToggleDebug = (value: boolean) => setShowDebugEvents(value);
  const handleToggleInfomation = (value: boolean) => setShowInformationEvents(value);
  const handleToggleVerbose = (value: boolean) => setShowVerboseEvents(value);
  const handleToggleTimeStamp = (value: boolean) => setShowTimeStamp(value);
  //#endregion

  return (
    <Draggable
      grid={[15, 15]}
      defaultPosition={{ x: 5, y: 5 }}
      defaultClassName={clsx('absolute', className)}
      handle="h2"
      nodeRef={draggableRef}
    >
      <div ref={draggableRef} className="flex" style={{ zIndex: 1000 }}>
        <GameBorder className="relative" innerClass=" lg:w-[600px] w-[550px] bg-stone-800">
          <PromptHeader className="cursor-move ">Events</PromptHeader>
          <GameEventOptions
            showDebugEvents={showDebugEvents}
            showVerboseEvents={showVerboseEvents}
            showInformationEvents={showInformationEvents}
            showTimeStamp={showTimeStamp}
            onToggleInformation={handleToggleInfomation}
            onToggleDebug={handleToggleDebug}
            onToggleVerbose={handleToggleVerbose}
            onToggleTimestamp={handleToggleTimeStamp}
          />
          <div
            ref={divRef}
            className="border border-white m-1 overflow-y-auto lg:text-sm text-xs h-[200px] lg:h-[400px]"
          >
            <ul>
              {filteredEvents.map((e) => {
                return <GameEventLine key={e.id} event={e} showTimeStamp={showTimeStamp} />;
              })}
            </ul>
          </div>
          <div className="flex gap-2 items-center justify-center m-1 mt-2 lg:text-base text-xs">
            <GameButton onClick={handleClear} className="w-full" type="danger">
              Clear
            </GameButton>
            <GameButton onClick={handleClose} className="w-full" type="primary">
              Close
            </GameButton>
          </div>
        </GameBorder>
      </div>
    </Draggable>
  );
};

interface OptionProps {
  showDebugEvents: boolean;
  showVerboseEvents: boolean;
  showInformationEvents: boolean;
  showTimeStamp: boolean;
  onToggleInformation: (value: boolean) => void;
  onToggleDebug: (value: boolean) => void;
  onToggleVerbose: (value: boolean) => void;
  onToggleTimestamp: (value: boolean) => void;
}
const GameEventOptions = ({
  showDebugEvents,
  showVerboseEvents,
  showInformationEvents,
  showTimeStamp,
  onToggleInformation,
  onToggleDebug,
  onToggleVerbose,
  onToggleTimestamp
}: OptionProps) => {
  return (
    <div className="flex mx-1 justify-center gap-2 text-sm">
      <div>
        <label htmlFor="showInformationEvents">Information: </label>
        <Switch
          id="showInformationEvents"
          size="small"
          checked={showInformationEvents}
          name="showInformationEvents"
          color="success"
          onChange={(e) => onToggleInformation(e.target.checked)}
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
          onChange={(e) => onToggleVerbose(e.target.checked)}
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
          onChange={(e) => onToggleDebug(e.target.checked)}
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
          onChange={(e) => onToggleTimestamp(e.target.checked)}
        />
      </div>
    </div>
  );
};
export default GameEvents;

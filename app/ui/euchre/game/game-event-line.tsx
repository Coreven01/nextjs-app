import clsx from 'clsx';
import { GameEvent, GameEventType } from '../../../hooks/euchre/useEventLog';

interface Props {
  event: GameEvent;
}
const GameEventLine = ({ event }: Props) => {
  return (
    <li className="p-1 border-slate-700 border-b m-1">
      <div className="flex">
        <div className="w-6 mr-1">
          <GameEventIcon type={event.type} />
        </div>
        <div>
          {event.time} : {event.message} {event.player ? `(${event.player})` : ''}
        </div>
      </div>
    </li>
  );
};

export default GameEventLine;

interface IconProps {
  type: GameEventType;
}
const GameEventIcon = ({ type }: IconProps) => {
  let iconColor = 'bg-white';

  switch (type) {
    case 'i':
      iconColor = 'bg-blue-200';
      break;
    case 'd':
      iconColor = 'bg-red-200';
      break;
    case 'v':
      iconColor = 'bg-orange-200';
  }
  return (
    <div className={clsx(' border border-black rounded-xl text-center text-black', iconColor)}>{type}</div>
  );
};

import clsx from 'clsx';
import { GameEvent, GameEventType, SUB_SUIT } from '../../../hooks/euchre/useEventLog';
import PlayerColor from '../player/player-team-color';
import { Card } from '../../../lib/euchre/definitions';

interface Props {
  event: GameEvent;
  showTimeStamp: boolean;
  getCardFullName: (card: Card) => string;
}
const GameEventLine = ({ event, showTimeStamp, getCardFullName }: Props) => {
  return (
    <li className="p-1 border-slate-700 border-b m-1">
      <div className="flex">
        <div className="w-6 mr-1">
          <GameEventIcon type={event.type} />
        </div>
        <div>
          {showTimeStamp && `${event.time} : `}
          {(event.player || event.teamColor) && (
            <span className="bg-white p-1 pr-2 mx-1 border-black border text-black rounded-xl">
              <PlayerColor
                className="text-transparent inline !p-0 ml-1"
                teamColor={event.teamColor ?? 'blue'}
              >
                xx
              </PlayerColor>{' '}
              {event.player}
            </span>
          )}
          <GameEventMessage
            eventId={event.id}
            message={event.message}
            cards={event.cards}
            getCardFullName={getCardFullName}
          />
        </div>
      </div>
    </li>
  );
};

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
    <div className={clsx('border border-black rounded-xl text-center text-black', iconColor)}>{type}</div>
  );
};

interface MessageProps {
  eventId: string;
  message?: string;
  cards?: Card[];
  getCardFullName: (card: Card) => string;
}
const GameEventMessage = ({ eventId, message, cards, getCardFullName }: MessageProps) => {
  const messageSegments: string[] = (message ?? '').split(SUB_SUIT);
  const messageElements: React.ReactNode[] = [];

  let msgCounter = 0;
  let counter = 0;

  for (const msg of messageSegments) {
    if (msg) {
      messageElements.push(<span key={`${eventId}-${msgCounter++}-${counter}`}>{msg}</span>);
      const card = cards?.at(counter++);

      if (card) {
        const cardName = getCardFullName(card);
        messageElements.push(
          <span
            className="bg-white border border-black rounded-xl text-center text-black p-1"
            key={`${eventId}-${msgCounter++}-${counter}`}
          >
            {cardName}-{card.suit}
          </span>
        );
      }
    }
  }
  return <div className="inline">{messageElements}</div>;
};

export default GameEventLine;

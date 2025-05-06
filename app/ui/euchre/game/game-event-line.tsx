import clsx from 'clsx';
import { GameEvent, GameEventType, SUB_CARD, SUB_SUIT } from '../../../hooks/euchre/useEventLog';
import PlayerColor from '../player/player-team-color';
import { Card, Suit } from '../../../lib/euchre/definitions/definitions';

interface Props {
  event: GameEvent;
  showTimeStamp: boolean;
  getCardFullName: (card: Card) => string;
  getCardClassColorFromSuit: (suit: Suit) => string;
  getSuitName: (suit: Suit) => string;
}
const GameEventLine = ({
  event,
  showTimeStamp,
  getCardFullName,
  getCardClassColorFromSuit,
  getSuitName
}: Props) => {
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
            getCardClassColorFromSuit={getCardClassColorFromSuit}
            getSuitName={getSuitName}
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
  getCardClassColorFromSuit: (suit: Suit) => string;
  getSuitName: (suit: Suit) => string;
}
const GameEventMessage = ({
  eventId,
  message,
  cards,
  getCardFullName,
  getCardClassColorFromSuit,
  getSuitName
}: MessageProps) => {
  const messageSegments: string[] = (message ?? '').split(/\[\[C\]\]|\[\[S\]\]/);
  const messageElements: React.ReactNode[] = [];

  let msgCounter = 0;
  let counter = 0;

  for (const msg of messageSegments) {
    if (msg) {
      messageElements.push(<span key={`${eventId}-${msgCounter++}-${counter}`}>{msg}</span>);
      const card = cards?.at(counter++);

      if (card) {
        const cardName =
          (message ?? '').indexOf(SUB_CARD) >= 0 ? getCardFullName(card) : getSuitName(card.suit) + 's';
        const cardColorCss = getCardClassColorFromSuit(card.suit);
        messageElements.push(
          <span
            className={clsx('bg-white border border-black rounded-xl text-center p-1', cardColorCss)}
            key={`${eventId}-${msgCounter++}-${counter}`}
          >
            {cardName} - {card.suit}
          </span>
        );
      }
    }
  }
  return <div className="inline">{messageElements}</div>;
};

export default GameEventLine;

import { getCardClassColorFromSuit, getCardFullName } from '@/app/lib/euchre/card-data';
import { EuchreCard, EuchrePlayer } from '@/app/lib/euchre/definitions';

interface Props {
  cardsPlayed: EuchreCard[];
  playerWon: EuchrePlayer | undefined;
}

export default function HandResultDetail({ cardsPlayed, playerWon }: Props) {
  return (
    <>
      {cardsPlayed.map((c) => {
        return (
          <div
            title={`${c.player.name} played ${getCardFullName(c.card)}`}
            className={`flex flex-col min-w-16 text-black border rounded mx-1 ${c.player === playerWon ? 'bg-amber-200 border-orange-300 shadow-lg' : 'bg-white'}`}
            key={`${c.player.playerNumber}-${c.card.value}-${c.card.suit}`}
          >
            <CardDetail card={c} />
          </div>
        );
      })}
    </>
  );
}

interface DetailProps {
  card: EuchreCard;
}
function CardDetail({ card }: DetailProps) {
  return (
    <>
      <div className="text-md">
        <span>{card.card.value}</span>-
        <span className={getCardClassColorFromSuit(card.card.suit)}>{card.card.suit}</span>
      </div>
      <div className="text-sm">{card.player.name}</div>
    </>
  );
}

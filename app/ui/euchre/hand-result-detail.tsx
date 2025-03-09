import { getCardClassColorFromSuit } from '@/app/lib/euchre/card-data';
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
            title={``}
            className={`flex flex-col min-w-16 text-black border rounded mx-1 ${c.player === playerWon ? 'bg-yellow-300 border-orange-300' : 'bg-white'}`}
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
      <div>
        <span>{card.card.value}</span>-
        <span className={getCardClassColorFromSuit(card.card.suit)}>{card.card.suit}</span>
      </div>
      <div className="text-sm">{card.player.name}</div>
    </>
  );
}

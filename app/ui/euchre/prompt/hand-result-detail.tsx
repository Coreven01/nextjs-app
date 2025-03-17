import { getCardClassColorFromSuit, getCardFullName } from '@/app/lib/euchre/card-data';
import { EuchreCard, EuchrePlayer } from '@/app/lib/euchre/definitions';
import clsx from 'clsx';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  cardsPlayed: EuchreCard[];
  playerWon: EuchrePlayer | null;
}

export default function HandResultDetail({ cardsPlayed, playerWon, className, ...rest }: Props) {
  return (
    <>
      {cardsPlayed.map((c) => {
        return (
          <div
            {...rest}
            className={clsx(
              `flex flex-col min-w-16 text-black border mx-1`,
              className,
              { 'bg-amber-200 border-orange-300 shadow-lg': c.player === playerWon },
              { 'bg-white': c.player !== playerWon }
            )}
            title={`${c.player.name} played ${getCardFullName(c.card)}`}
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

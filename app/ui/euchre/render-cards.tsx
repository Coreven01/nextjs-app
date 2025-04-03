import { Card, CardBackColor, CardValue, EuchrePlayer, Suit } from '@/app/lib/euchre/definitions';
import GameCard from './game/game-card';
import { getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import clsx from 'clsx';

interface Props {
  color: CardBackColor;
  size: string;
  rotate: boolean;
}
export default function RenderCards({ color, size, rotate }: Props) {
  const cardValues: CardValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];
  const tempCard = new Card('♠', '2');
  const tempPlayer = new EuchrePlayer('temp', 1, 1);

  return (
    <div className="bg-white p-2 overflow-auto">
      <div className={clsx('flex justify-center mb-2 gap-2')}>
        <GameCard
          id="back-card-1"
          card={tempCard}
          width={tempCard.getDisplayWidth('center')}
          height={tempCard.getDisplayHeight('center')}
          player={tempPlayer}
          src={'/card-back.svg'}
          enableShadow={true}
        ></GameCard>
        <GameCard
          id="back-card-2"
          card={tempCard}
          width={tempCard.getDisplayWidth('side')}
          height={tempCard.getDisplayHeight('side')}
          player={tempPlayer}
          src={'/card-back-side.svg'}
          enableShadow={true}
        ></GameCard>
      </div>
      {suits.map((s) => {
        return (
          <div
            className={clsx(
              'flex justify-center mb-2',
              { 'gap-[75px] h-[150px]': rotate },
              { 'gap-1': !rotate }
            )}
            key={s}
          >
            {cardValues.map((c) => {
              const card = new Card(s, c);
              const h = card.getDisplayHeight('center');
              const w = card.getDisplayWidth('center');

              return (
                <div key={`${s}${c}`}>
                  <GameCard
                    className={clsx({ 'rotate-90': rotate })}
                    id={`${s}${c}`}
                    card={card}
                    width={w}
                    height={h}
                    player={tempPlayer}
                    src={getEncodedCardSvg(card, 'center')}
                    enableShadow={true}
                  ></GameCard>
                </div>
              );
            })}
          </div>
        );
      })}

      {suits.map((s) => {
        return (
          <div
            className={clsx(
              'flex justify-center mb-2',
              { 'gap-[25px] h-[150px]': rotate },
              { 'gap-1': !rotate }
            )}
            key={s}
          >
            {cardValues.map((c) => {
              const card = new Card(s, c);
              const h = card.getDisplayHeight('side');
              const w = card.getDisplayWidth('side');
              const p = new EuchrePlayer('temp', 2, 3);
              return (
                <GameCard
                  className={clsx({ '-rotate-90': rotate })}
                  key={`${s}${c}`}
                  id={`${s}${c}`}
                  card={card}
                  width={w}
                  height={h}
                  player={p}
                  src={getEncodedCardSvg(card, 'side')}
                  enableShadow={true}
                  responsive={false}
                ></GameCard>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

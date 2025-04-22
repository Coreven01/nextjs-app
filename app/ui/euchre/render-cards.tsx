import { Card, CardBackColor, CardValue, EuchrePlayer, Suit } from '@/app/lib/euchre/definitions';
import GameCard from './game/game-card';
import clsx from 'clsx';
import useCardSvgData from '@/app/hooks/euchre/data/useCardSvgData';
import useCardData from '@/app/hooks/euchre/data/useCardData';
import useGameSetupLogic from '@/app/hooks/euchre/logic/useGameSetupLogic';

interface Props {
  color: CardBackColor;
  size: string;
  rotate: boolean;
}
export default function RenderCards({ color, size, rotate }: Props) {
  const { getEncodedCardSvg, getCardFullName } = useCardSvgData();
  const { getDisplayHeight, getDisplayWidth } = useCardData();
  const { createPlayer } = useGameSetupLogic();

  const cardValues: CardValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];
  const tempCard: Card = { suit: '♠', value: '2', index: 0 };

  return (
    <div className="bg-white p-2 overflow-auto">
      <div className={clsx('flex justify-center mb-2 gap-2')}>
        <GameCard
          id="back-card-1"
          cardState={{
            src: '/card-back.svg',
            cardFullName: getCardFullName(tempCard),
            cardIndex: 1,
            enabled: false
          }}
          card={tempCard}
          width={getDisplayWidth('center')}
          height={getDisplayHeight('center')}
        ></GameCard>
        <GameCard
          id="back-card-2"
          cardState={{
            src: '/card-back-side.svg',
            cardFullName: getCardFullName(tempCard),
            cardIndex: 0,
            enabled: false
          }}
          card={tempCard}
          width={getDisplayWidth('side')}
          height={getDisplayHeight('side')}
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
              const card: Card = { suit: s, value: c, index: 0 };
              const h = getDisplayHeight('center');
              const w = getDisplayWidth('center');

              return (
                <div key={`${s}${c}`}>
                  <GameCard
                    className={clsx({ 'rotate-90': rotate })}
                    id={`${s}${c}`}
                    cardState={{
                      src: getEncodedCardSvg(card, 'center'),
                      cardFullName: getCardFullName(tempCard),
                      cardIndex: 0,
                      enabled: false
                    }}
                    card={tempCard}
                    width={w}
                    height={h}
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
              const card: Card = { suit: s, value: c, index: 0 };
              const h = getDisplayHeight('side');
              const w = getDisplayWidth('side');
              const p = createPlayer('temp', 2, 3);
              return (
                <GameCard
                  className={clsx({ '-rotate-90': rotate })}
                  key={`${s}${c}`}
                  id={`${s}${c}`}
                  cardState={{
                    src: getEncodedCardSvg(card, 'side'),
                    cardFullName: getCardFullName(tempCard),
                    cardIndex: 0,
                    enabled: false
                  }}
                  card={tempCard}
                  width={w}
                  height={h}
                ></GameCard>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

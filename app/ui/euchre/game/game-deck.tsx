import useCardData from '@/app/hooks/euchre/data/useCardData';
import { Card } from '@/app/lib/euchre/definitions';
import Image from 'next/image';
import React from 'react';

type Props = {
  deck: Card[];
  location: 'center' | 'side';
};

const GameDeck = ({ deck, location }: Props) => {
  const { getDisplayWidth, getDisplayHeight } = useCardData();
  const images: React.ReactNode[] = [];
  const dummyCard: Card = { suit: '♠', value: 'P', index: 0 };
  const width = getDisplayWidth(location);
  const height = getDisplayHeight(location);
  const cardBackSvg = location === 'center' ? '/card-back.svg' : '/card-back-side.svg';

  const dummyCardImg = (
    <Image
      key={`deal-dummy`}
      id={`deal-dummy`}
      className={`contain`}
      quality={100}
      width={width}
      height={height}
      src={cardBackSvg}
      alt="Game Card"
    />
  );

  images.push(dummyCardImg);
  let index = 0;

  for (const card of deck) {
    images.push(
      <Image
        key={index}
        className={`contain absolute top-0 left-0 transition duration-500 ease-in-out h-full`}
        quality={100}
        width={width}
        height={height}
        src={cardBackSvg}
        alt="Game Card"
        unoptimized={true}
      />
    );
    index++;
  }

  return <>{images}</>;
};

export default GameDeck;

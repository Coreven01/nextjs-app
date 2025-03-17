import { Card } from '@/app/lib/euchre/definitions';
import Image from 'next/image';

type Props = {
  deck: Card[];
  location: 'center' | 'side';
};

export default function GameDeck({ deck, location }: Props) {
  const images: React.ReactNode[] = [];
  const dummyCard: Card = new Card('♠', 'P');
  const width = dummyCard.getDisplayWidth(location);
  const height = dummyCard.getDisplayHeight(location);
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
        id={card.cardId}
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
}

import { getCardFullName } from '@/app/lib/euchre/card-data';
import { Card, EuchrePlayer } from '@/app/lib/euchre/definitions';
import clsx from 'clsx';
import Image from 'next/image';

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  card: Card;
  src: string;
  width: number;
  height: number;
  id: string;
  enableShadow: boolean;
  player: EuchrePlayer;
}
export default function GameCard({
  id,
  card,
  src,
  width,
  height,
  className,
  enableShadow,
  player,
  onClick,
  ...rest
}: Props) {
  const handleCardClick = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    if (onClick) onClick(e);
  };
  return (
    <div className={clsx('relative', className)} id={id}>
      <Image
        className={'invisible'}
        quality={50}
        width={width}
        height={height}
        src={src}
        alt={'base card'}
        style={{
          width: '100%',
          height: 'auto'
        }}
      />
      <Image
        className={clsx(`absolute contain ${getOffsetForPlayer(player.playerNumber)}`)}
        quality={50}
        width={width}
        height={height}
        src={'/card-shadow.png'}
        alt={'card shadow'}
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: `100px`
        }}
      />
      <Image
        {...rest}
        className={clsx('absolute top-0 left-0')}
        quality={100}
        width={width}
        height={height}
        src={src}
        alt={getCardFullName(card)}
        unoptimized={true}
        onClick={(e) => handleCardClick(e)}
        style={{
          width: '100%',
          height: 'auto'
        }}
      ></Image>
    </div>
  );
}

function getOffsetForPlayer(playerNumber: number): string {
  switch (playerNumber) {
    case 1:
      return 'top-3 left-3';
    case 2:
      return '-top-3 left-3';
    case 3:
      return '-top-2 left-3 rotate-90';
    case 4:
      return '-top-2 right-3 rotate-90';
  }

  return 'top-3 left-2';
}

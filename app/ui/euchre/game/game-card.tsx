import useCardSvgData from '@/app/hooks/euchre/data/useCardSvgData';
import { Card, EuchrePlayer } from '@/app/lib/euchre/definitions';
import clsx from 'clsx';
import Image from 'next/image';
import React, { CSSProperties } from 'react';

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  card: Card;
  src: string;
  width: number;
  height: number;
  enableShadow: boolean;
  player: EuchrePlayer;
  responsive?: boolean;
}
const GameCard = ({
  id,
  card,
  src,
  width,
  height,
  className,
  enableShadow,
  player,
  responsive,
  onClick,
  ...rest
}: Props) => {
  const { getCardFullName } = useCardSvgData();
  const sidePlayer = player.team === 2;
  const handleCardClick = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    if (onClick) onClick(e);
  };

  const cssValues: CSSProperties = {};
  if (responsive) {
    cssValues.width = '100%';
    cssValues.height = '100%';
  } else {
    cssValues.width = width;
    cssValues.height = height;
    cssValues.maxHeight = height;
    cssValues.maxWidth = width;
  }

  return (
    <div className={clsx('relative', className)} id={id}>
      <Image
        className={'invisible'}
        quality={50}
        width={width}
        height={height}
        src={src}
        alt={'base card'}
        style={cssValues}
      />

      <Image
        className={clsx(`absolute ${getOffsetForPlayer(player.playerNumber)}`)}
        quality={50}
        width={width}
        height={height}
        src={sidePlayer ? '/card-shadow-side.png' : '/card-shadow.png'}
        alt={'card shadow'}
        style={cssValues}
      />
      <Image
        {...rest}
        className={clsx('absolute top-0 left-0')}
        quality={100}
        width={width}
        height={height}
        src={src}
        alt={player.human ? getCardFullName(card) : 'Player Card'}
        unoptimized={true}
        onClick={(e) => handleCardClick(e)}
        style={cssValues}
      ></Image>
    </div>
  );
};

function getOffsetForPlayer(playerNumber: number): string {
  switch (playerNumber) {
    case 1:
      return 'top-3 left-3';
    case 2:
      return '-top-3 left-3';
    case 3:
      return 'top-2 -left-3';
    case 4:
      return 'top-2 -right-3';
  }

  return 'top-3 left-2';
}

export default GameCard;

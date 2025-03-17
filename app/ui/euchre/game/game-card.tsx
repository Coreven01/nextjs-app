import { getCardFullName } from '@/app/lib/euchre/card-data';
import { Card } from '@/app/lib/euchre/definitions';
import clsx from 'clsx';
import Image from 'next/image';

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  card: Card;
  src: string;
  width: number;
  height: number;
  id: string;
  enableShadow: boolean;
}
export default function GameCard({
  id,
  card,
  src,
  width,
  height,
  className,
  enableShadow,
  onClick,
  ...rest
}: Props) {
  const handleCardClick = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    if (onClick) onClick(e);
  };
  return (
    <div className="relative" id={id}>
      <Image
        {...rest}
        className={clsx('absolute top-0 left-0', className)}
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
      />
      <Image
        {...rest}
        className={clsx('absolute left-2 top-2', className)}
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

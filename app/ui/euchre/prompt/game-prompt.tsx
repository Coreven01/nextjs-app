'use client';

import GameBorder from '../game/game-border';
import GameModal from '../game-modal';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  innerClass?: string;
  zIndex: number;
}

export default function GamePrompt({ children, className, innerClass, zIndex, ...rest }: DivProps) {
  return (
    <div
      className="absolute left-0 top-0 h-full w-full bg-neutral-800 bg-opacity-20 flex md:items-center items-start justify-center"
      style={{ zIndex: zIndex }}
    >
      <GameModal className="opacity-0">
        <GameBorder {...rest} className={className} innerClass={innerClass}>
          {children}
        </GameBorder>
      </GameModal>
    </div>
  );
}

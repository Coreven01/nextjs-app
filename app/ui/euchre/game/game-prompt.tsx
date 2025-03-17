'use client';

import GameBorder from './game-border';
import GameModal from '../game-modal';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export default function GamePrompt({ children, className, ...rest }: DivProps) {
  return (
    <div className="absolute left-0 top-0 h-full w-full bg-neutral-800 bg-opacity-20 flex items-center justify-center">
      <GameModal className="opacity-0">
        <GameBorder {...rest} innerClass={className}>
          {children}
        </GameBorder>
      </GameModal>
    </div>
  );
}

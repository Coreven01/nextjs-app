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
      className="absolute left-0 top-0 h-full w-full bg-neutral-800 bg-opacity-40 flex lg:items-center items-start justify-center"
      style={{ zIndex: zIndex }}
    >
      <GameModal>
        <GameBorder className={className} innerClass={innerClass} size="small" {...rest}>
          {children}
        </GameBorder>
      </GameModal>
    </div>
  );
}

import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/** Layout grid used for different layers of the game. */
const GameGrid = ({ children, className, ...rest }: DivProps) => {
  return (
    <div
      className={clsx(
        'w-full h-full grid lg:grid-rows-[1fr,150px,1fr] lg:grid-cols-[1fr,150px,1fr] grid-rows-[75px_minmax(50px,100%)_100px] pointer-events-none',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default GameGrid;

import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  enablePulse?: boolean;
  enableHighlight?: boolean;
  highlightColorCss: string;
}

const GameHighlight = ({
  children,
  className,
  enablePulse,
  enableHighlight,
  highlightColorCss,
  ...rest
}: DivProps) => {
  return (
    <div className={clsx('relative', className)} {...rest}>
      {enableHighlight && (
        <div
          className={clsx(
            'w-full h-full absolute',
            className,
            {
              'animate-pulse': enablePulse
            },
            highlightColorCss
          )}
        ></div>
      )}
      {children}
    </div>
  );
};

export default GameHighlight;

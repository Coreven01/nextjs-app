import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GameWarning = ({ children, className, ...rest }: DivProps) => {
  return (
    <div {...rest} className={clsx('text-center', className)}>
      {children}
    </div>
  );
};

export default GameWarning;

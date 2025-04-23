import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function CenterInfo({ children, className, ...rest }: DivProps) {
  if (children) {
    return (
      <div
        {...rest}
        className={clsx(
          'grow h-full w-full border rounded border-white dark:text-white text-center bg-neutral-800',
          className
        )}
      >
        {children}
      </div>
    );
  }

  return <></>;
}

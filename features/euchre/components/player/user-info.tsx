import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/** Basic component used as an informational pop-up during game play. */
export default function UserInfo({ children, className, ...rest }: DivProps) {
  if (children) {
    return (
      <div
        className={clsx(
          'z-30 text-center lg:text-base text-xs bg-white dark:bg-stone-900 p-2 border border-black dark:border-white text-black dark:text-white',
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return <></>;
}

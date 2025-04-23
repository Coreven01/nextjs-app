import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function UserInfo({ children, className, ...rest }: DivProps) {
  if (children) {
    return (
      <div
        {...rest}
        className={clsx(
          'text-center lg:text-base text-xs bg-white dark:bg-stone-800 p-2 border border-black dark:border-white text-black dark:text-white',
          className
        )}
      >
        {children}
      </div>
    );
  }

  return <></>;
}

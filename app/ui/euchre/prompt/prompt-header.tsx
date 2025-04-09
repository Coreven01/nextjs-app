import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export default function PromptHeader({ children, className, ...rest }: DivProps) {
  return (
    <h2
      {...rest}
      className={clsx('text-black dark:text-yellow-200 font-bold text-center md:text-lg text-sm', className)}
    >
      {children}
    </h2>
  );
}

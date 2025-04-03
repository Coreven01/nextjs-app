import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function UserInfo({ children, className, ...rest }: DivProps) {
  if (children) {
    return (
      <div {...rest} className={clsx('text-center', className)}>
        {children}
      </div>
    );
  }

  return <></>;
}

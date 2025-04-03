interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function GameInfoDetail({ children, className, ...rest }: DivProps) {
  return (
    <div {...rest} className={className}>
      {children}
    </div>
  );

  return <></>;
}

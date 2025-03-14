interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  enablePulse?: boolean;
  enableHighlight?: boolean;
}

export default function GameHighlight({
  children,
  className,
  enablePulse,
  enableHighlight,
  ...rest
}: DivProps) {
  return (
    <div className="relative">
      {enableHighlight ? (
        <div
          className={`shadow-xl shadow-yellow-400 ${enablePulse ? 'animate-pulse' : ''} w-full h-full absolute`}
        ></div>
      ) : (
        <></>
      )}
      {children}
    </div>
  );
}

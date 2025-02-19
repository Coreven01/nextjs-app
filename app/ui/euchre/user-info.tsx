import clsx from "clsx";

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
  }

export default function UserInfo({children, className, ...rest } : DivProps) {

    if (children) {
        return (
        
            <div
            {...rest}
            className={clsx(
              'flex-grow border rounded border-white dark:text-white text-center bg-neutral-800 absolute min-w-16 p-2',
              className,
            )}
          >
            {children}
          </div>
        );
    }
    
    return <></>;
}
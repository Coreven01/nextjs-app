import { useFadeOut } from "@/app/lib/euchre/useFadeOut";
import clsx from "clsx";

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export default function GameInfoDetail({ children, className, ...rest }: DivProps) {

    if (children) {

        return (

            <div
                {...rest}
                className={clsx('', className,)} >
                {children}
            </div>
        );
    }

    return <></>;
}
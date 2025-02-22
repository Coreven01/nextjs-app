import { useFadeOut } from "@/app/lib/euchre/useFadeOut";
import clsx from "clsx";

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    fadeOutId: string | undefined,
    fadeOutDelay: 0 | 1 | 2 |3 | 4 | 5,
    fadeOutDuration: 0 | 1 | 2 |3 | 4 | 5
}

export default function GameInfoDetail({ children, fadeOutId, fadeOutDelay, fadeOutDuration, className, ...rest }: DivProps) {
    const { setElementForFadeOut } = useFadeOut();

    if (children) {

        if (fadeOutId)
            setElementForFadeOut(fadeOutId, fadeOutDelay, fadeOutDuration);

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
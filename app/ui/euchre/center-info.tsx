
type Props = {
    content: React.ReactNode,
}

export default function CenterInfo({content} : Props) {

    if (content) {
        return (
        
            <div style={{opacity: 1}} className="flex-grow transition-opacity delay-2000 opacity-0 h-full w-full p-2 m-3 border rounded border-white dark:text-white text-center bg-neutral-800">
                {content}
            </div>
        );
    }
    
    return <></>;
}
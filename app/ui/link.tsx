
type Props = {
    link: string,
    text: string,
}

export default function AppLink({link, text} : Props) {
    return (
        <a className="underline text-black hover:text-blue-500 dark:text-yellow-200 dark:hover:text-red-200" href={link}>{text}</a>
    );
}
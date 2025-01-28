import { sectionStyle } from "../ui/home/home-description";

export default function Page() {
    return (
        <div className={`${sectionStyle} m-4 p-2`}>
            This dashboard is the result of going through the Next.js tutorial, with some of my own modifications. Most of the compnents were already
            written as part of the tutorial. I've made some changes to fit what information I'm trying to display along with changes with the theme.
        </div>
    );
}
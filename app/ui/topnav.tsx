import ThemeToggle from "./theme-toggle";
import { Chakra_Petch } from "next/font/google";
import Image from "next/image";

const chakraPetch = Chakra_Petch({
  weight: "400"
});

export default function TopNav() {
    return (
      <div className="flex flex-row p-2 border-b bg-zinc-300 dark:bg-neutral-900 bg-opacity-100 sticky top-0">
        <div>
        <a>
          <Image src="/guitar_corner1.png"
              width={100}
              height={100}
              className="hidden md:block"
              alt="Screenshots of the dashboard project showing desktop version"/>
        </a>
        </div>
        <div className={`text-xl text-black dark:text-white md:text-3xl md:pl-5 flex-grow ${chakraPetch.className}`}>
          Nolan Appel - .NET Developer
        </div>
        <div className="hidden flex-none md:block">
          <ThemeToggle />
        </div>
      </div>);
}
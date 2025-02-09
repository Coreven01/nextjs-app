import type { Metadata, Viewport } from "next";
import '@/app/ui/global.css'
import SideNav from "./ui/sidenav";
import TopNav from "./ui/topnav";
import AppLink from "./ui/link";

export const viewport: Viewport = {
  //themeColor: 'black',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className={`$antialiased`}>
        <div className="fixed top-0 left-0 h-full w-full pl-bg dark:dk-bg">
          {/* <div className="bg-[url('/bitmap.png')] bg-no-repeat bg-cover bg-center h-full w-full filter opacity-20">
        </div> */}
        </div>

        <TopNav className="flex md:hidden sticky top-0 flex-row" />
        <SideNav />
        <TopNav className="hidden md:flex md:sticky md:top-0 flex-row" />

        <div className="flex min-h-[93vh] bg-transparent flex-row md:pl-[192px]">
          <div className="flex-grow">
            <main className="min-h-[85vh]">
              {children}
            </main>
            <footer className="flex justify-center border-t border-b text-black dark:text-white bg-green-100 dark:bg-neutral-900">
              <div className="m-1"><AppLink link="https://www.linkedin.com/in/nolanappel/" text="LinkedIn"/></div>
              <div>|</div>
              <div className="m-1"><AppLink link="https://github.com/Coreven01" text="Github"/></div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
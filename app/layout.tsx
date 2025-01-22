import type { Metadata } from "next";
import '@/app/ui/global.css'
import SideNav from "./ui/sidenav";
import TopNav from "./ui/topnav";

export const metadata: Metadata = {
  title: "Nolan Appel | .NET Developer",
  description: "Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  //const t = useTranslation('common');
  return (
    <html lang="en">
      <body className={`$antialiased`}>
      <div className="fixed h-full w-full pl-bg dark:dk-bg">
        {/* <div className="bg-[url('/bitmap.png')] bg-no-repeat bg-cover bg-center h-full w-full filter opacity-20">
        </div> */}
      </div>

      <TopNav />
      <div className="flex min-h-[94vh] bg-transparent flex-row">
        <SideNav />
        <div className="flex-grow">
          <main>
            {children}
          </main>
          <footer className="flex justify-center border-t border-b text-black dark:text-white bg-green-100 dark:bg-neutral-900">
            Footer info
          </footer>
        </div>
      </div>
      </body>
    </html>
  );
}

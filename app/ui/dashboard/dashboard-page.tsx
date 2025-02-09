import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { RevenueChartSkeleton, LatestInvoicesSkeleton, CardsSkeleton } from '@/app/ui/skeletons';
import CardWrapper from '@/app/ui/dashboard/cards';
import { sectionStyle } from '@/app/ui/home/home-description';

export default async function DashboardPage() {

    return (
        <div>
            <h1 className={`${lusitana.className} m-4 p-2 text-xl md:text-2xl ${sectionStyle}`}>
                Dashboard
            </h1>
            <div className={`${sectionStyle} m-4 p-2`}>
                This dashboard is the result of going through the Next.js tutorial. Most of the components were already
                written as part of the tutorial but with some minor changes to fit the theme.
            </div>

            <div className={`${sectionStyle} m-4 p-2 flex`}>
                <div className="min-w-32">
                    <label
                        htmlFor="delay"
                        className={``}
                    >Delay before render</label>
                    <div className='flex flex-row max-h-[32px]'>
                        <select className={``}
                            id='delay'
                            required>
                                <option value="0">No Delay</option>
                                <option value="2000">2 sec</option>
                                <option value="5000">5 sec</option>
                                <option value="10000">10 sec</option>
                            </select>
                    </div>
                </div>
                <div className='my-2 p-2'>
                    <button
                        className={`border border-black dark:border-white rounded block m-auto justify-center dark:border-white font-medium dark:text-white p-2 dark:bg-neutral-800 bg-zinc-200`}
                        >New Game</button>
                </div>
            </div>

            <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-4 m-4 p-2 ${sectionStyle}`}>
                <Suspense fallback={<CardsSkeleton />}>
                    <CardWrapper msDelay={1000} />
                </Suspense>
            </div>

            <div className={`mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8 m-4 p-2 ${sectionStyle}`}>
                <Suspense fallback={<RevenueChartSkeleton />}>
                    <RevenueChart msDelay={1000} />
                </Suspense>
                <Suspense fallback={<LatestInvoicesSkeleton />}>
                    <LatestInvoices msDelay={1000} />
                </Suspense>
            </div>
        </div>
    );
}
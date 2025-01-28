//import { Card } from '@/app/ui/dashboard/cards';
import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { RevenueChartSkeleton, LatestInvoicesSkeleton, CardsSkeleton } from '@/app/ui/skeletons';
import CardWrapper from '@/app/ui/dashboard/cards';
import { Metadata } from 'next';
import { sectionStyle } from '@/app/ui/home/home-description';

export const metadata: Metadata = {
  title: 'Home',
};

export default async function Page() {

  return (
    <div>
      <h1 className={`${lusitana.className} m-4 p-2 text-xl md:text-2xl ${sectionStyle}`}>
        Dashboard
      </h1>
      <div className={`${sectionStyle} m-4 p-2`}>
        This dashboard is the result of going through the Next.js tutorial. Most of the components were already
        written as part of the tutorial but with some minor changes to fit the theme.
      </div>

      <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-4 m-4 p-2 ${sectionStyle}`}>
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper msDelay={5000} />
        </Suspense>
      </div>

      <div className={`mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8 m-4 p-2 ${sectionStyle}`}>
        <Suspense fallback={<RevenueChartSkeleton />}>
          <RevenueChart msDelay={6000} />
        </Suspense>
        <Suspense fallback={<LatestInvoicesSkeleton />}>
          <LatestInvoices msDelay={7000} />
        </Suspense>
      </div>
    </div>
  );
}
// src/pages/HomePage.tsx

import type { AppData } from '../lib/types';
import { useHomeDashboard, type StoreHealth} from '../hooks/useHomeDashboard';
import SalesTrendWidget from '../components/dashboard/SalesTrendWidget'; // <-- NEW IMPORT
import {
  ArchiveBoxIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  ArchiveBoxArrowDownIcon,
  CreditCardIcon// Added this icon just in case
} from '@heroicons/react/24/outline';


// --- Reusable Utility ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

// --- Page Prop ---
interface HomeProps {
  appData: AppData;
}

export default function HomePage({ appData }: HomeProps) {
  const dashboardData = useHomeDashboard(appData);

  if (!dashboardData) {
    return <div>Loading Dashboard...</div>;
  }

  const { storeHealthCards, kpis } = dashboardData;

  return (
    <div className="space-y-8">
      {/* 1. Capital Allocation KPI Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Capital Allocation</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <KpiCard
            title="Total Inventory Value"
            value={formatCurrency(kpis.totalInventoryValue)}
            subtitle="Total cost of stock you are sitting on."
            icon={BuildingStorefrontIcon}
            color="indigo"
          />
          <KpiCard
            title="At-Risk (Liquidable) Stock"
            value={formatCurrency(kpis.liquidatableValue)}
            subtitle="Cash you can recover from urgent returns."
            icon={ArchiveBoxArrowDownIcon}
            color="green"
          />
          <KpiCard
            title="Upcoming Payables (30 Days)"
            value={formatCurrency(kpis.payablesDue30Days)}
            subtitle="Cash you owe to suppliers."
            icon={CreditCardIcon}
            color="amber"
          />
        </div>
      </div>

      {/* 2. NEW: Sales Trend Widget Integration */}
      <SalesTrendWidget appData={appData} />
      
      {/* 3. Store Health Cards Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Store Health</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {storeHealthCards.map((store) => (
            <StoreCard key={store.storeId} store={store} />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Reusable KPI Card Component (Unchanged) ---
function KpiCard({ title, value, subtitle, icon: Icon, color }: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'indigo' | 'green' | 'amber';
}) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="flex items-start gap-x-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${colorClasses[color]}`}>
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}


// --- Sub-Component for the Store Cards (Unchanged) ---
function StoreCard({ store }: { store: StoreHealth }) {
  const tierColor = {
    A: 'text-green-700 bg-green-100 border-green-300',
    B: 'text-blue-700 bg-blue-100 border-blue-300',
    C: 'text-red-700 bg-red-100 border-red-300',
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">{store.storeName}</h3>
        <span 
          className={`rounded-full border px-3 py-0.5 text-sm font-bold ${tierColor[store.healthTier]}`}
        >
          {store.healthTier} Tier
        </span>
      </div>
      <p className="text-sm text-gray-500">{store.storeId}</p>

      {/* Card Body - Stats (Styled flex layout) */}
      <div className="mt-6 space-y-5">
        
        {/* Stat 1: Avg. Stock Age */}
        <div className="flex items-start gap-x-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <ArchiveBoxIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{store.problemStat}</p>
            <p className={`text-3xl font-bold ${store.healthTier === 'C' ? 'text-red-600' : 'text-gray-900'}`}>
              {store.problemValue}
            </p>
          </div>
        </div>
        
        <hr className="border-gray-100" />

        {/* Stat 2: 8-Month Revenue */}
        <div className="flex items-start gap-x-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <BanknotesIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">8-Month Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(store.totalRevenue)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
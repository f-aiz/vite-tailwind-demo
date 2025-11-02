// src/components/dashboard/InventoryBreakdown.tsx

import type { StoreValueBreakdown } from '../../hooks/useHomeDashboard';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';

// --- Reusable Utility ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

interface BreakdownProps {
  breakdownData: StoreValueBreakdown[];
  totalValue: number;
}

export default function InventoryBreakdown({ breakdownData, totalValue }: BreakdownProps) {
  // Add percentage to our data for the progress bars
  const dataWithPercent = breakdownData.map(item => ({
    ...item,
    percent: (item.value / totalValue * 100),
  }));

  return (
    <div className="rounded-lg bg-white shadow-md">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-x-2">
          <BuildingStorefrontIcon className="h-6 w-6 text-indigo-500" />
          Inventory Value by Store
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Distribution of your total {formatCurrency(totalValue)} in held stock.
        </p>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        {dataWithPercent.map((store, index) => (
          <div key={store.id} className="p-6">
            {/* Store Name & Tier */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">{store.name}</span>
              <span className="text-sm font-medium text-gray-500">{store.id}</span>
            </div>
            
            {/* Value */}
            <p className="mt-2 text-3xl font-bold tracking-tight text-indigo-600">
              {formatCurrency(store.value)}
            </p>
            
            {/* Progress Bar & Percent */}
            <div className="mt-4">
              <div className="flex justify-between text-sm font-medium text-gray-500">
                <span>% of Total Inventory</span>
                <span>{store.percent.toFixed(1)}%</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ width: `${store.percent}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
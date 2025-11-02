// src/components/dashboard/InventoryBreakdownModal.tsx

import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { StoreValueBreakdown, StoreHealth } from '../../hooks/useHomeDashboard';

// --- Reusable Utility ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

// --- Define props for the modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdownData: StoreValueBreakdown[];
  storeHealthData: StoreHealth[];
  totalValue: number;
}

export default function InventoryBreakdownModal({ 
  isOpen, 
  onClose, 
  breakdownData, 
  storeHealthData,
  totalValue 
}: ModalProps) {
  if (!isOpen) return null;

  // --- Merge Health data with Value data ---
  const mergedData = breakdownData.map(store => {
    const health = storeHealthData.find(h => h.storeId === store.id);
    return {
      ...store,
      percent: (store.value / totalValue * 100),
      tier: health?.healthTier || 'B',
      problemStat: health?.problemStat || '',
      problemValue: health?.problemValue || '',
    };
  });

  return (
    // 1. Full-screen dark overlay
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity"
      onClick={onClose} 
    >
      {/* 2. Modal Content Box */}
      <div 
        className="relative w-full max-w-5xl rounded-lg bg-white shadow-xl" // Made wider: max-w-5xl
        onClick={(e) => e.stopPropagation()} 
      >
        {/* 3. Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* 4. Modal Header */}
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">Total Inventory Value Breakdown</h2>
          <p className="mt-1 text-4xl font-bold tracking-tight text-indigo-600">
            {formatCurrency(totalValue)}
          </p>
        </div>

        {/* 5. Modal Body (Spaced 3-Column Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {mergedData.map((store) => (
            <div key={store.id} className="p-8 space-y-5"> {/* Increased spacing */}
              
              {/* --- THIS IS THE FIX --- */}
              {/* Store Name & Tier are now in a clean flex row */}
              <div className="flex items-center gap-x-3">
                <span className="text-xl font-semibold text-gray-900 truncate">{store.name}</span>
                <span className={`rounded-full px-3 py-0.5 text-sm font-bold flex-shrink-0 ${
                  store.tier === 'A' ? 'bg-green-100 text-green-700' :
                  store.tier === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                }`}>
                  {store.tier} Tier
                </span>
              </div>
              
              {/* Value */}
              <p className="mt-2 text-4xl font-bold tracking-tight text-indigo-600">
                {formatCurrency(store.value)}
              </p>
              
              {/* Progress Bar & Percent */}
              <div className="pt-2">
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>% of Total Inventory</span>
                  <span>{store.percent.toFixed(1)}%</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      store.tier === 'C' ? 'bg-red-600' : 'bg-indigo-600'
                    }`} 
                    style={{ width: `${store.percent}%` }}
                  ></div>
                </div>
              </div>

              {/* Critical Action Warning */}
              {store.tier === 'C' && (
                <div className="mt-4 rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
                  <div className="flex items-start gap-x-3">
                    <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 text-red-500" />
                    <div>
                      <h4 className="font-semibold text-red-800">Critical Action Required</h4>
                      <p className="text-sm text-red-700 mt-1">
                        This store's core problem is: <strong className="font-bold">{store.problemStat} ({store.problemValue})</strong>.
                        This is inflating its inventory value and indicates high markdown risk.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
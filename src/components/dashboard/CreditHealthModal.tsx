// src/components/dashboard/CreditHealthModal.tsx

import { XMarkIcon, BanknotesIcon, CreditCardIcon, ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import type { CapitalAllocationKPIs } from '../../hooks/useHomeDashboard';

// --- Reusable Utility ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

// Define props for the modal
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpis: CapitalAllocationKPIs;
}

export default function CreditHealthModal({ isOpen, onClose, kpis }: ModalProps) {
  if (!isOpen) return null;

  // --- The Core Fintech Logic ---
  const cashOut = kpis.payablesDue30Days;
  const cashIn = kpis.projected30DaySales;
  const liquidAssets = kpis.liquidatableValue;
  const totalBuffer = cashIn + liquidAssets;
  const netPosition = totalBuffer - cashOut;

  const isSafe = netPosition > 0;
  // ---

  return (
    // Full-screen dark overlay
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity"
      onClick={onClose} 
    >
      {/* Modal Content Box */}
      <div 
        className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">30-Day Working Capital Risk</h2>
          <p className="mt-1 text-sm text-gray-500">
            Analysis of upcoming payables vs. projected cash & liquid assets.
          </p>
        </div>

        {/* Modal Body (Cash Out vs. Cash In) */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-200">
          
          {/* Cash Out (Risk) */}
          <div className="p-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <CreditCardIcon className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-gray-500">CASH OUTFLOW (30 Days)</p>
            <p className="text-4xl font-bold text-red-600">
              {formatCurrency(cashOut)}
            </p>
            <p className="text-sm text-gray-500">Total payables due to suppliers.</p>
          </div>

          {/* Cash In (Buffer) */}
          <div className="p-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <BanknotesIcon className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-gray-500">CASH BUFFER (30 Days)</p>
            <p className="text-4xl font-bold text-green-600">
              {formatCurrency(totalBuffer)}
            </p>
            <div className="text-sm text-gray-500">
              <p>Projected Sales: {formatCurrency(cashIn)}</p>
              <p>Liquidable Stock: {formatCurrency(liquidAssets)}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer (The Verdict) */}
        <div className={`p-6 rounded-b-lg ${isSafe ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-start gap-x-3">
            {isSafe ? 
              <ShieldCheckIcon className="h-8 w-8 flex-shrink-0 text-green-600" /> :
              <ShieldExclamationIcon className="h-8 w-8 flex-shrink-0 text-red-600" />
            }
            <div>
              <h3 className={`text-lg font-semibold ${isSafe ? 'text-green-800' : 'text-red-800'}`}>
                Credit Health: {isSafe ? 'SAFE' : 'AT RISK'}
              </h3>
              <p className={`text-sm ${isSafe ? 'text-green-700' : 'text-red-700'}`}>
                {isSafe ? 
                  `You have a projected working capital surplus of ${formatCurrency(netPosition)}.` :
                  `You have a projected working capital deficit of ${formatCurrency(netPosition)}. Action is required.`
                }
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
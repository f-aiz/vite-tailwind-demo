// src/pages/ActionCenter.tsx

import type { AppData } from '../lib/types';
import { useActionCenter, type UrgentReturnAlert, type UpcomingPayable, type ReorderAlert } from '../hooks/useActionCenter';

// --- Reusable Utility ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

// --- Page Prop ---
interface ActionCenterProps {
  appData: AppData;
}

export default function ActionCenterPage({ appData }: ActionCenterProps) {
  const actionData = useActionCenter(appData);

  if (!actionData) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-700">
        Processing 150k+ Records...
      </div>
    );
  }
  
  // New "Cash Flow" story
  const totalCashToRecover = actionData.totalReturnValue;
  const totalCashDue = actionData.totalPayableValue;

  return (
    <div className="space-y-8">
      {/* Header for this page */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Financial Action Center
        </h1>
        <p className="text-lg text-gray-600">
          Cash to Recover: <span className="font-bold text-green-700 ml-1">{formatCurrency(totalCashToRecover)}</span>
          <span className="mx-3">|</span>
          Cash Due (30 Days): <span className="font-bold text-amber-600 ml-1">{formatCurrency(totalCashDue)}</span>
        </p>
      </header>
      
      {/* Section 1: Urgent Returns */}
      <UrgentReturnsSection 
        alerts={actionData.urgentReturns} 
        totalValue={actionData.totalReturnValue} 
      />

      {/* Section 2: Upcoming Payables (NEW) */}
      <UpcomingPayablesSection 
        alerts={actionData.upcomingPayables} 
        totalValue={actionData.totalPayableValue}
      />

      {/* Section 3: Critical Re-orders */}
      <CriticalReordersSection alerts={actionData.criticalReorders} />
    </div>
  );
}

// --- Sub-Component for Section 1: Urgent Returns (Unchanged) ---
function UrgentReturnsSection({ alerts, totalValue }: { alerts: UrgentReturnAlert[], totalValue: number }) {
  return (
    <div className="rounded-lg bg-white shadow-md">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800">
          🚨 Urgent Return Opportunities (<span className="text-red-600">{alerts.length}</span>)
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Total value to recover (liquidate): <span className="font-bold text-red-600">{formatCurrency(totalValue)}</span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Time Left</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Product (SKU)</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">At-Risk Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Store / Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {alerts.slice(0, 5).map((alert) => (
              <tr key={alert.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`text-sm font-semibold ${alert.daysRemaining <= 10 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {alert.daysRemaining} days
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{alert.productName}</div>
                  <div className="text-sm text-gray-500">{alert.skuId}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-bold text-red-700">{formatCurrency(alert.atRiskValue)}</div>
                  <div className="text-sm text-gray-500">{alert.atRiskQuantity} units</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-900">{alert.storeId}</div>
                  <div className="text-sm text-gray-500">{alert.supplierName} (by {alert.deadline})</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-white shadow-sm hover:bg-indigo-700">
                    Initiate Return
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- NEW Sub-Component for Section 2: Payables ---
function UpcomingPayablesSection({ alerts, totalValue }: { alerts: UpcomingPayable[], totalValue: number }) {
  return (
    <div className="rounded-lg bg-white shadow-md">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800">
          💳 Upcoming Payables (<span className="text-amber-600">{alerts.length}</span>)
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Total cash due in next 30 days: <span className="font-bold text-amber-600">{formatCurrency(totalValue)}</span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Days Until Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">PO ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {alerts.slice(0, 5).map((alert) => (
              <tr key={alert.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`text-sm font-semibold ${alert.daysUntilDue <= 10 ? 'text-red-600' : 'text-amber-600'}`}>
                    {alert.daysUntilDue} days
                  </span>
                  <div className="text-sm text-gray-500">(Due: {alert.dueDate})</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{alert.supplierName}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">{formatCurrency(alert.amountDue)}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{alert.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// --- Sub-Component for Section 3: Re-orders (Unchanged) ---
function CriticalReordersSection({ alerts }: { alerts: ReorderAlert[] }) {
  return (
    <div className="rounded-lg bg-white shadow-md">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800">
          📈 Critical Re-order Alerts (<span className="text-green-600">{alerts.length}</span>)
        </h2>
        {/* FIX #1: This was a <f> tag, now it's a <p> tag */}
        <p className="mt-1 text-sm text-gray-600">
          Prevent stockouts on your core, high-velocity items.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Days of Stock Left</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Product (SKU)</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Store / Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Supplier (Rating)</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {alerts.slice(0, 5).map((alert) => (
              <tr key={alert.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="text-sm font-semibold text-orange-600">{alert.daysOfStockLeft} days</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{alert.productName}</div>
                  <div className="text-sm text-gray-500">{alert.skuId}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-900">{alert.storeId}</div>
                  <div className="text-sm text-gray-500">{alert.currentStock} units on hand</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-900">{alert.supplierName}</div>
                  {/* FIX #2: This was className_Name, now it's className */}
                  <div className="text-sm text-gray-500">{alert.supplierRating.toFixed(0)}% On-Time</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <button className="rounded-md bg-green-600 px-3 py-1.5 text-white shadow-sm hover:bg-green-700">
                    Approve PO ({alert.recommendedPOQty} units)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
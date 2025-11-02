// src/pages/ActionCenter.tsx

import { useState } from 'react';
import type { AppData } from '../lib/types';
import { useActionCenter, type UrgentReturnAlert, type UpcomingPayable, type ReorderAlert, type InventoryStatusAlert } from '../hooks/useActionCenter';
import { ArchiveBoxIcon, CreditCardIcon, ExclamationTriangleIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState<'financial' | 'inventory'>('financial');

  if (!actionData) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-700">
        Processing 150k+ Records...
      </div>
    );
  }
  
  const totalCashToRecover = actionData.totalReturnValue;
  const totalCashDue = actionData.totalPayableValue;

  // Tab Definitions
  const tabs = [
    { id: 'financial', name: 'Financial Alerts', icon: CreditCardIcon, value: formatCurrency(totalCashToRecover) },
    { id: 'inventory', name: 'Inventory Status Dashboard', icon: ArchiveBoxIcon, value: `${actionData.inventoryStatus.length} Issues` },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
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

      {/* --- TAB NAVIGATION --- */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'financial' | 'inventory')}
              className={`
                ${tab.id === activeTab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
                group inline-flex items-center gap-x-2 border-b-2 py-3 px-1 text-sm font-medium transition
              `}
            >
              <tab.icon className='h-5 w-5' />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* --- TAB CONTENT --- */}

      {activeTab === 'financial' && (
        <div className="space-y-8">
          <UrgentReturnsSection alerts={actionData.urgentReturns} totalValue={actionData.totalReturnValue} />
          <UpcomingPayablesSection alerts={actionData.upcomingPayables} totalValue={actionData.totalPayableValue} />
          <CriticalReordersSection alerts={actionData.criticalReorders} />
        </div>
      )}

      {activeTab === 'inventory' && (
        <InventoryStatusSection alerts={actionData.inventoryStatus} />
      )}
      
    </div>
  );
}

// --- Sub-Component for Section 1: Urgent Returns (LIGHT MODE) ---
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
                  <Link to={`/details?search=${alert.skuId}`} className="rounded-md bg-indigo-600 px-3 py-1.5 text-white shadow-sm hover:bg-indigo-700">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Sub-Component for Section 2: Upcoming Payables (LIGHT MODE) ---
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
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <Link to={`/details?search=${alert.supplierName.split(' ')[0]}`} className="text-indigo-600 hover:text-indigo-900">
                    {alert.id}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// --- Sub-Component for Section 3: Critical Re-orders (LIGHT MODE) ---
function CriticalReordersSection({ alerts }: { alerts: ReorderAlert[] }) {
  return (
    <div className="rounded-lg bg-white shadow-md">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800">
          📈 Critical Re-order Alerts (<span className="text-green-600">{alerts.length}</span>)
        </h2>
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
                  <div className="text-sm font-medium text-gray-900">{alert.supplierName}</div>
                  <div className="text-sm text-gray-500">{alert.supplierRating.toFixed(0)}% On-Time</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <Link to={`/details?search=${alert.skuId}`} className="rounded-md bg-green-600 px-3 py-1.5 text-white shadow-sm hover:bg-green-700">
                    Approve PO ({alert.recommendedPOQty} units)
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Sub-Component for Inventory Status Dashboard (LIGHT MODE) ---
function InventoryStatusSection({ alerts }: { alerts: InventoryStatusAlert[] }) {
    const overstocked = alerts.filter(a => a.status === 'Overstocked');
    const understocked = alerts.filter(a => a.status === 'Understocked');

    const totalOverstockValue = overstocked.reduce((sum, a) => sum + a.value, 0);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Inventory Status Dashboard</h2>
            
            {/* KPI Cards for the Dashboard */}
            <div className="grid grid-cols-2 gap-6">
                {/* Overstock Risk KPI */}
                <div className="rounded-lg bg-red-50 p-6 shadow-md border border-red-200">
                    <div className='flex items-center justify-between'>
                        <p className="text-lg font-medium text-red-700 flex items-center gap-x-2">
                            <ExclamationTriangleIcon className='h-6 w-6' />
                            Overstock Risk
                        </p>
                        <p className="text-2xl font-bold text-red-700">{overstocked.length} SKUs</p>
                    </div>
                    <p className="text-sm text-red-500 mt-2">
                        Total Cost Value at Risk: <span className='font-bold'>{formatCurrency(totalOverstockValue)}</span>
                    </p>
                </div>

                {/* Understock Opportunity KPI */}
                 <div className="rounded-lg bg-yellow-50 p-6 shadow-md border border-yellow-200">
                    <div className='flex items-center justify-between'>
                        <p className="text-lg font-medium text-yellow-700 flex items-center gap-x-2">
                            <ChartBarIcon className='h-6 w-6' />
                            Understock Opportunity
                        </p>
                        <p className="text-2xl font-bold text-yellow-700">{understocked.length} SKUs</p>
                    </div>
                    <p className="text-sm text-yellow-500 mt-2">
                        SKUs running low where forecast is high.
                    </p>
                </div>
            </div>

            {/* Detailed Alert Table */}
            <div className="rounded-lg bg-white shadow-md">
                <div className="border-b border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-800">Top {alerts.length} Prioritized Inventory Alerts</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Product (SKU)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Store / Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Age (Days)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cost Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {alerts.map((alert) => (
                                <tr key={alert.id}>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                                            alert.status === 'Overstocked' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {alert.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{alert.productName}</div>
                                        <div className="text-sm text-gray-500">{alert.skuId}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="text-sm text-gray-900">{alert.storeId}</div>
                                        <div className="text-sm text-gray-500">{alert.currentStock} units</div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{alert.daysOfStock}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(alert.value)}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                        <Link 
                                            to={`/details?search=${alert.skuId}&alertType=${alert.status}&reasonDelta=${alert.reasonDelta}`} 
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Investigate
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
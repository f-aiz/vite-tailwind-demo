// src/pages/Details.tsx

import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import type { AppData } from '../lib/types';
import { useDetails, type SkuDetails, type SupplierDetails } from '../hooks/useDetails';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ExclamationTriangleIcon, ChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'; 

// --- Page Prop Definition FIX ---
interface DetailsProps {
  appData: AppData;
}
// ---

// --- Reusable Utility ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

// --- NEW HELPER FUNCTION to parse URL query ---
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function DetailsPage({ appData }: DetailsProps) {
  const { findSku, findSupplier, skuList, supplierList } = useDetails(appData);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'sku' | 'supplier'>('sku');

  const [skuResult, setSkuResult] = useState<SkuDetails | null>(null);
  const [supplierResult, setSupplierResult] = useState<SupplierDetails | null>(null);
  
  // Get initial search query from URL (e.g., when clicking "Investigate" link)
  const query = useQuery();
  const urlSearch = query.get('search');
  const urlType = query.get('alertType');

  // Load data immediately if coming from a link
  useState(() => {
    if (urlSearch) {
        setSearchQuery(urlSearch);
        const initialType = urlSearch.startsWith('SUP') ? 'supplier' : 'sku';
        setSearchType(initialType);
        
        if (initialType === 'supplier') {
             setSupplierResult(findSupplier(urlSearch));
        } else {
             setSkuResult(findSku(urlSearch));
        }
    }
  });


  // --- Unified Search Handler (Supports Enter Key) ---
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSkuResult(null);
    setSupplierResult(null);
    const query = searchQuery.trim();

    if (searchType === 'sku') {
      setSkuResult(findSku(query));
    } else {
      setSupplierResult(findSupplier(query));
    }
  };


  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Deep Dive Details</h1>
        <p className="mt-1 text-lg text-gray-600">
          Search for any SKU or Supplier to get a full report.
        </p>
      </header>

      {/* --- 1. Search Bar (Wrapped in Form for 'Enter' Submission) --- */}
      <form onSubmit={handleSearch} className="flex space-x-2 rounded-lg bg-white p-4 shadow-sm">
        
        {/* Search Type Selector */}
        <select
          className="rounded-md border-gray-300 shadow-sm"
          value={searchType}
          onChange={(e) => {
            setSearchType(e.target.value as 'sku' | 'supplier');
            setSearchQuery(''); 
          }}
        >
          <option value="sku">SKU</option>
          <option value="supplier">Supplier</option>
        </select>
        
        {/* Search Input (Responsive Flex) */}
        <div className='relative flex-1'>
            <input
              type="search"
              list={searchType === 'sku' ? 'sku-list' : 'supplier-list'}
              className="w-full rounded-md border-gray-300 py-2 pl-10 pr-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder={searchType === 'sku' ? 'Enter SKU ID (e.g., SKU-00045)' : 'Enter Supplier ID (e.g., SUP-023)'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <MagnifyingGlassIcon className='pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
        </div>
        
        {/* Datalists for autocompletion (Unchanged) */}
        <datalist id="sku-list">
          {skuList.map(s => <option key={s.sku_id} value={s.sku_id}>{s.product_name}</option>)}
        </datalist>
        <datalist id="supplier-list">
          {supplierList.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
        </datalist>
        
        {/* Search Button */}
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      {/* --- 2. Results Area --- */}
      <div>
        {!skuResult && !supplierResult && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center text-gray-500">
            Search for an SKU or Supplier to see details.
            <br />
            Try SKU: <code className="text-indigo-600">SKU-00045</code> (Amul Milk)
            <br />
            Try Supplier: <code className="text-indigo-600">SUP-023</code> (Samsung India)
          </div>
        )}
        
        {skuResult && <SkuDetailsReport result={skuResult} alertType={urlType} reasonDelta={query.get('reasonDelta')} />}
        {supplierResult && <SupplierDetailsReport result={supplierResult} />}
      </div>
    </div>
  );
}

// --- Sub-Component for SKU Report (Reverted to simple Line Chart) ---
function SkuDetailsReport({ result, alertType, reasonDelta }: { result: SkuDetails, alertType: string | null, reasonDelta: string | null }) {
  const { sku, supplier, inventory, forecast } = result;

  // --- Logic to construct the narrative reason (Unchanged) ---
  let reasonMessage = null;
  let reasonIcon = null;

  if (alertType === 'Overstocked' && reasonDelta) {
    reasonIcon = <ExclamationTriangleIcon className='h-5 w-5 text-red-600 flex-shrink-0' />;
    reasonMessage = `This SKU is flagged as **OVERSTOCKED** because current stock is 
      **${reasonDelta} units** over the 90-day forecast threshold, indicating severe future markdown risk. 
      Immediate action (markdown or disposal) is required to free up capital.`;
  } else if (alertType === 'Understocked' && reasonDelta) {
    reasonIcon = <ChartBarIcon className='h-5 w-5 text-yellow-600 flex-shrink-0' />;
    reasonMessage = `This SKU is flagged as **UNDERSTOCKED** because you are currently running **${reasonDelta} units** below the minimal safety stock requirement, and 90-day forecast is high. 
      Prioritize immediate re-order to prevent lost sales.`;
  }

  // --- CHART DATA FIX: Simple Data Structure for Line Chart ---
  // The forecast data needs to be restructured from: 
  // [{forecast_period: 30, STR-001: 50, STR-002: 10}] 
  // TO: 
  // [{name: 30 Day, Flagship: 50, Neighborhood: 10}]
  const forecastData = [
    { name: '30-Day', 
      Flagship: forecast.find(f => f.store_id === 'STR-001' && f.forecast_period === 30)?.predicted_demand || 0,
      Neighborhood: forecast.find(f => f.store_id === 'STR-002' && f.forecast_period === 30)?.predicted_demand || 0,
      Mall: forecast.find(f => f.store_id === 'STR-003' && f.forecast_period === 30)?.predicted_demand || 0,
    },
    { name: '90-Day', 
      Flagship: forecast.find(f => f.store_id === 'STR-001' && f.forecast_period === 90)?.predicted_demand || 0,
      Neighborhood: forecast.find(f => f.store_id === 'STR-002' && f.forecast_period === 90)?.predicted_demand || 0,
      Mall: forecast.find(f => f.store_id === 'STR-003' && f.forecast_period === 90)?.predicted_demand || 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900">{sku.product_name}</h2>
        <p className="text-lg text-gray-500">{sku.sku_id} | {sku.category}</p>
        <p className="text-md text-gray-600">Supplied by: <span className="font-semibold">{supplier?.supplier_name || 'N/A'}</span></p>
        
        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Cost Price</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(sku.cost_price)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Selling Price</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(sku.selling_price)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Profit Margin</p>
            <p className="text-xl font-semibold text-green-600">{(sku.margin * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* --- REASONING BLOCK --- */}
      {reasonMessage && (
        <div className={`rounded-lg p-4 border-l-4 shadow-sm ${alertType === 'Overstocked' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'}`}>
            <div className="flex items-start gap-x-3">
                {reasonIcon}
                <div>
                    <p className="text-sm font-semibold text-gray-800">System Analysis & Action Required</p>
                    <p className="text-sm text-gray-700 mt-1" dangerouslySetInnerHTML={{ __html: reasonMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
            </div>
        </div>
      )}
      {/* --- END REASONING BLOCK --- */}

      {/* Inventory & Forecast */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Inventory */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="text-xl font-semibold text-gray-900">Current Inventory</h3>
          <ul className="mt-4 space-y-3">
            {inventory.map(inv => (
              <li key={inv.store_id} className="flex justify-between border-b pb-2">
                <span className="text-gray-700">{inv.store_id}</span>
                <span className={`font-semibold ${inv.quantity_on_hand < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                  {inv.quantity_on_hand} units
                </span>
                <span className="text-sm text-gray-500">({inv.days_in_stock} days in stock)</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Forecast (Line Chart Re-instated) */}
        <div className="rounded-lg bg-white p-6 shadow-md" style={{ height: '300px' }}>
          <h3 className="text-xl font-semibold text-gray-900">Demand Forecast (Units)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value} units`} />
              <Legend />
              {/* Lines mapped to store names */}
              <Line type="monotone" dataKey="Flagship" name="STR-001 (Flagship)" stroke="#8884d8" />
              <Line type="monotone" dataKey="Neighborhood" name="STR-002 (Neighborhood)" stroke="#82ca9d" />
              <Line type="monotone" dataKey="Mall" name="STR-003 (Mall)" stroke="#ffc658" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Component for Supplier Report (Unchanged) ---
function SupplierDetailsReport({ result }: { result: SupplierDetails }) {
    // ... (Supplier details report content remains the same)
    const { supplier, skus, poCount, totalPoValue, avgDeliveryTime } = result;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="text-2xl font-bold text-gray-900">{supplier.supplier_name}</h2>
                <p className="text-lg text-gray-500">{supplier.supplier_id}</p>
                
                <div className="mt-4 grid grid-cols-3 gap-6 border-t pt-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">On-Time %</p>
                        <p className="text-xl font-semibold text-green-600">{(supplier.on_time_delivery_pct * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Avg. Delivery</p>
                        <p className="text-xl font-semibold text-gray-900">{avgDeliveryTime} days</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Return Window</p>
                        <p className="text-xl font-semibold text-gray-900">{supplier.return_window_days} days</p>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-gray-500">Total POs (8mo)</p>
                        <p className="text-xl font-semibold text-gray-900">{poCount}</p>
                    </div>
                    <div className="mt-4 col-span-2">
                        <p className="text-sm font-medium text-gray-500">Total PO Value</p>
                        <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalPoValue)}</p>
                    </div>
                </div>
            </div>
            
            {/* Products from this supplier */}
            <div className="rounded-lg bg-white shadow-md">
                <h3 className="border-b p-6 text-xl font-semibold text-gray-900">
                    Products from this Supplier ({skus.length})
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {skus.slice(0, 10).map(sku => (
                                <tr key={sku.sku_id}>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-gray-900">{sku.product_name}</p>
                                        <p className="text-sm text-gray-500">{sku.sku_id}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-500">Margin</p>
                                        <p className="text-sm font-semibold text-green-600">{(sku.margin * 100).toFixed(1)}%</p>
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
// src/pages/Details.tsx

import { useState } from 'react';
import type { AppData } from '../lib/types';
import { useDetails, type SkuDetails, type SupplierDetails } from '../hooks/useDetails';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// --- Page Prop ---
interface DetailsProps {
  appData: AppData;
}

// --- Reusable Utility ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function DetailsPage({ appData }: DetailsProps) {
  const { findSku, findSupplier, skuList, supplierList } = useDetails(appData);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'sku' | 'supplier'>('sku');

  const [skuResult, setSkuResult] = useState<SkuDetails | null>(null);
  const [supplierResult, setSupplierResult] = useState<SupplierDetails | null>(null);

  const handleSearch = () => {
    setSkuResult(null);
    setSupplierResult(null);

    if (searchType === 'sku') {
      const result = findSku(searchQuery);
      setSkuResult(result);
    } else {
      const result = findSupplier(searchQuery);
      setSupplierResult(result);
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

      {/* --- 1. Search Bar --- */}
      <div className="flex space-x-2 rounded-lg bg-white p-4 shadow-sm">
        <select
          className="rounded-md border-gray-300 shadow-sm"
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as 'sku' | 'supplier')}
        >
          <option value="sku">SKU</option>
          <option value="supplier">Supplier</option>
        </select>
        
        <input
          type="search"
          list={searchType === 'sku' ? 'sku-list' : 'supplier-list'}
          className="flex-1 rounded-md border-gray-300 shadow-sm"
          placeholder={searchType === 'sku' ? 'Search SKU-00045...' : 'Search SUP-023...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {/* Datalists for autocompletion */}
        <datalist id="sku-list">
          {skuList.map(s => <option key={s.sku_id} value={s.sku_id}>{s.product_name}</option>)}
        </datalist>
        <datalist id="supplier-list">
          {supplierList.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
        </datalist>
        
        <button
          type="button"
          onClick={handleSearch}
          className="rounded-md bg-indigo-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Search
        </button>
      </div>

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
        
        {skuResult && <SkuDetailsReport result={skuResult} />}
        {supplierResult && <SupplierDetailsReport result={supplierResult} />}
      </div>
    </div>
  );
}

// --- Sub-Component for SKU Report ---
function SkuDetailsReport({ result }: { result: SkuDetails }) {
  const { sku, supplier, inventory, forecast } = result;

  // Format data for the forecast chart
  const forecastData = [
    { name: '30-Day', ...forecast.reduce((obj, f) => (f.forecast_period === 30 ? {...obj, [f.store_id]: f.predicted_demand} : obj), {})},
    { name: '90-Day', ...forecast.reduce((obj, f) => (f.forecast_period === 90 ? {...obj, [f.store_id]: f.predicted_demand} : obj), {})},
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
        
        {/* Forecast */}
        <div className="rounded-lg bg-white p-6 shadow-md" style={{ height: '300px' }}>
          <h3 className="text-xl font-semibold text-gray-900">Demand Forecast (by Store)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value} units`} />
              <Legend />
              <Line type="monotone" dataKey="STR-001" name="Flagship" stroke="#8884d8" />
              <Line type="monotone" dataKey="STR-002" name="Neighborhood" stroke="#82ca9d" />
              <Line type="monotone" dataKey="STR-003" name="Mall" stroke="#ffc658" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Component for Supplier Report ---
function SupplierDetailsReport({ result }: { result: SupplierDetails }) {
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
              {skus.slice(0, 10).map(sku => ( // Show top 10 products
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
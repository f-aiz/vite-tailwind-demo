// src/pages/Details.tsx

import { useState, Fragment, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { AppData, SKU, Supplier, PurchasePlan, PurchaseOrder } from '../lib/types'; // PurchasePlan is now imported
import { useDetails, type SkuDetails, type SupplierDetails } from '../hooks/useDetails';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { 
  ExclamationTriangleIcon, ChartBarIcon, TruckIcon, ShoppingCartIcon // CubeIcon removed
} from '@heroicons/react/24/outline';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

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

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// --- Helper function to parse URL query ---
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function DetailsPage({ appData }: DetailsProps) {
  const { findSku, findSupplier, skuList, supplierList } = useDetails(appData);
  const location = useLocation();

  const [searchType, setSearchType] = useState<'sku' | 'supplier'>('sku');
  const [selectedItem, setSelectedItem] = useState<SKU | Supplier | null>(null);
  const [query, setQuery] = useState('');

  const [skuResult, setSkuResult] = useState<SkuDetails | null>(null);
  const [supplierResult, setSupplierResult] = useState<SupplierDetails | null>(null);
  
  const urlQuery = useQuery();
  const urlSearch = urlQuery.get('search');
  
  useEffect(() => {
    if (urlSearch) {
      const initialType = urlSearch.startsWith('SUP') ? 'supplier' : 'sku';
      setSearchType(initialType);
      if (initialType === 'supplier') {
        const supplier = findSupplier(urlSearch);
        setSupplierResult(supplier);
        if(supplier) setSelectedItem(supplier.supplier);
      } else {
        const sku = findSku(urlSearch);
        setSkuResult(sku);
        if(sku) setSelectedItem(sku.sku);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, location.search]);

  const searchList = (searchType === 'sku' ? skuList : supplierList);
  const filteredList =
    query === ''
      ? searchList
      : searchList.filter((item) => {
          const name = 'product_name' in item ? item.product_name : item.supplier_name;
          const id = 'sku_id' in item ? item.sku_id : item.supplier_id;
          return (
            name.toLowerCase().includes(query.toLowerCase()) ||
            id.toLowerCase().includes(query.toLowerCase())
          );
        });
  
  const handleSelect = (item: SKU | Supplier) => {
    if (!item) return;
    setSelectedItem(item);
    setSkuResult(null);
    setSupplierResult(null);
    window.history.pushState({}, '', '/details');
    if ('sku_id' in item) {
      setSearchType('sku');
      setSkuResult(findSku(item.sku_id));
    } else {
      setSearchType('supplier');
      setSupplierResult(findSupplier(item.supplier_id));
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

      {/* --- Search Bar --- */}
      <div className="flex space-x-2 rounded-lg bg-white p-4 shadow-sm">
        <select
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={searchType}
          onChange={(e) => {
            setSearchType(e.target.value as 'sku' | 'supplier');
            setSelectedItem(null); setQuery('');
            setSkuResult(null); setSupplierResult(null);
          }}
        >
          <option value="sku">SKU</option>
          <option value="supplier">Supplier</option>
        </select>
        
        <Combobox as="div" className="flex-1" value={selectedItem as any} onChange={handleSelect as any}>
          <div className="relative">
            <Combobox.Input
              className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              onChange={(event) => setQuery(event.target.value)}
              displayValue={(item: SKU | Supplier) =>
                item ? ('sku_id' in item ? `${item.sku_id} - ${item.product_name}` : `${item.supplier_id} - ${item.supplier_name}`) : query
              }
              placeholder={searchType === 'sku' ? 'Search by SKU or Product Name...' : 'Search by Supplier ID or Name...'}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
            </Combobox.Button>
            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setQuery('')}>
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {filteredList.slice(0, 100).map((item) => {
                  const id = 'sku_id' in item ? item.sku_id : item.supplier_id;
                  const name = 'product_name' in item ? item.product_name : item.supplier_name;
                  return (
                    <Combobox.Option
                      key={id}
                      className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`}
                      value={item}
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{name}</span>
                          <span className={`block truncate text-sm ${active ? 'text-indigo-200' : 'text-gray-500'}`}>{id}</span>
                          {selected ? (
                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}>
                              <CheckIcon className="h-5 w-5" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Combobox.Option>
                  );
                })}
              </Combobox.Options>
            </Transition>
          </div>
        </Combobox>
      </div>

      {/* --- Results Area --- */}
      <div>
        {!skuResult && !supplierResult && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center text-gray-500">
            Search for an SKU or Supplier to see details.
            <br /> Try searching for: <code className="text-indigo-600">Amul Milk</code>
            <br /> Or: <code className="text-indigo-600">Samsung India</code>
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
  const { 
    sku, supplier, inventory, forecast, salesTrend, 
    salesVelocityByStore, recentTransactions,
    openPurchaseOrders, purchasePlan
  } = result;
  
  const urlQuery = useQuery();
  const alertType = urlQuery.get('alertType');
  const reasonDelta = urlQuery.get('reasonDelta');

  let reasonMessage = null;
  let reasonIcon = null;

  if (alertType === 'Overstocked' && reasonDelta) {
    reasonIcon = <ExclamationTriangleIcon className='h-5 w-5 text-red-600 flex-shrink-0' />;
    reasonMessage = `This SKU is flagged as **OVERSTOCKED** because current stock is **${reasonDelta} units** over the 90-day forecast threshold. Immediate action is required.`;
  } else if (alertType === 'Understocked' && reasonDelta) {
    reasonIcon = <ChartBarIcon className='h-5 w-5 text-yellow-600 flex-shrink-0' />;
    reasonMessage = `This SKU is flagged as **UNDERSTOCKED** because you are running **${reasonDelta} units** below minimal safety stock. Prioritize re-order.`;
  }

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
  
  const inventoryWithVelocity = salesVelocityByStore.map(vel => {
    const inv = inventory.find(i => i.store_id === vel.storeId);
    return {
      storeId: vel.storeId,
      storeName: vel.storeName,
      velocity: vel.velocity,
      quantity_on_hand: inv?.quantity_on_hand || 0,
      days_in_stock: inv?.days_in_stock || 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900">{sku.product_name}</h2>
        <p className="text-lg text-gray-500">{sku.sku_id} | {sku.category}</p>
        <p className="text-md text-gray-600">Supplied by: <span className="font-semibold">{supplier?.supplier_name || 'N/A'}</span></p>
        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
          <div><p className="text-sm font-medium text-gray-500">Cost Price</p><p className="text-xl font-semibold text-gray-900">{formatCurrency(sku.cost_price)}</p></div>
          <div><p className="text-sm font-medium text-gray-500">Selling Price</p><p className="text-xl font-semibold text-gray-900">{formatCurrency(sku.selling_price)}</p></div>
          <div><p className="text-sm font-medium text-gray-500">Profit Margin</p><p className="text-xl font-semibold text-green-600">{(sku.margin * 100).toFixed(1)}%</p></div>
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
      
      {/* --- Purchase Plan & Open POs --- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PurchasePlanCard plan={purchasePlan} />
        <OpenOrdersTable orders={openPurchaseOrders} />
      </div>

      {/* --- Graph Grid --- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 30-Day Historical Sales Trend */}
        <div className="rounded-lg bg-white p-6 shadow-md" style={{ height: '300px' }}>
          <h3 className="text-xl font-semibold text-gray-900">Last 30-Day Sales Trend (Units)</h3>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={salesTrend} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} /><YAxis /><Tooltip formatter={(value) => `${value} units`} /><Bar dataKey="quantity" name="Units Sold" fill="#8884d8" /></BarChart></ResponsiveContainer>
        </div>
        {/* Forecast (Line Chart) */}
        <div className="rounded-lg bg-white p-6 shadow-md" style={{ height: '300px' }}>
          <h3 className="text-xl font-semibold text-gray-900">Demand Forecast (Units)</h3>
          <ResponsiveContainer width="100%" height="100%"><LineChart data={forecastData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => `${value} units`} /><Legend /><Line type="monotone" dataKey="Flagship" name="STR-001 (Flagship)" stroke="#8884d8" /><Line type="monotone" dataKey="Neighborhood" name="STR-002 (Neighborhood)" stroke="#82ca9d" /><Line type="monotone" dataKey="Mall" name="STR-003 (Mall)" stroke="#ffc658" /></LineChart></ResponsiveContainer>
        </div>
      </div>
      
      {/* --- Inventory & Velocity Table --- */}
      <div className="rounded-lg bg-white shadow-md">
        <h3 className="border-b p-6 text-xl font-semibold text-gray-900">Stock & Sales Velocity by Store</h3>
        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Store</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Current Stock</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Days in Stock</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">90-Day Velocity (Sales)</th></tr></thead><tbody className="divide-y divide-gray-200 bg-white">{inventoryWithVelocity.map(item => (<tr key={item.storeId}><td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{item.storeName}</div><div className="text-sm text-gray-500">{item.storeId}</div></td><td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${item.quantity_on_hand < 10 ? 'text-red-600' : 'text-gray-900'}`}>{item.quantity_on_hand} units</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.days_in_stock} days</td><td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{item.velocity} units sold</td></tr>))}</tbody></table></div>
      </div>
      
      {/* --- Recent Transactions Table --- */}
      <div className="rounded-lg bg-white shadow-md">
        <h3 className="border-b p-6 text-xl font-semibold text-gray-900">Recent Transactions (Last 10)</h3>
        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Store</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Quantity Sold</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total Amount</th></tr></thead><tbody className="divide-y divide-gray-200 bg-white">{recentTransactions.map(sale => (<tr key={sale.transaction_id}><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(sale.transaction_date)}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.store_id}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.quantity_sold}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(sale.total_amount)}</td></tr>))}</tbody></table></div>
      </div>
    </div>
  );
}

// --- NEW: Purchase Plan Card ---
function PurchasePlanCard({ plan }: { plan: PurchasePlan }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-x-2">
        <ShoppingCartIcon className="h-6 w-6 text-indigo-500" />
        Purchase & Safety Stock Plan
      </h3>
      <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Safety Stock</p>
          <p className="text-2xl font-bold text-gray-900">{plan.safetyStock} <span className="text-sm font-normal">units</span></p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Reorder Point</p>
          <p className="text-2xl font-bold text-gray-900">{plan.reorderPoint} <span className="text-sm font-normal">units</span></p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Order Quantity</p>
          <p className="text-2xl font-bold text-gray-900">{plan.orderQuantity} <span className="text-sm font-normal">units</span></p>
        </div>
      </div>
    </div>
  );
}

// --- NEW: Open Purchase Orders Table ---
function OpenOrdersTable({ orders }: { orders: PurchaseOrder[] }) {
  return (
    <div className="rounded-lg bg-white shadow-md">
      <h3 className="flex items-center gap-x-2 border-b p-6 text-xl font-semibold text-gray-900">
        <TruckIcon className="h-6 w-6 text-indigo-500" />
        Open Purchase Orders ({orders.length})
      </h3>
      {orders.length === 0 ? (
        <p className="p-6 text-sm text-gray-500">No open purchase orders found for this SKU.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">PO ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Est. Delivery</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {orders.map(po => (
                <tr key={po.po_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{po.po_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(po.order_date)}</td> {/* Assuming order_date is est. delivery for demo */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{po.quantity_ordered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// --- Sub-Component for Supplier Report ---
function SupplierDetailsReport({ result }: { result: SupplierDetails }) {
    const { supplier, skus, poCount, totalPoValue, avgDeliveryTime } = result;
    return (
        <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="text-2xl font-bold text-gray-900">{supplier.supplier_name}</h2>
                <p className="text-lg text-gray-500">{supplier.supplier_id}</p>
                <div className="mt-4 grid grid-cols-3 gap-6 border-t pt-4">
                        <div><p className="text-sm font-medium text-gray-500">On-Time %</p><p className="text-xl font-semibold text-green-600">{(supplier.on_time_delivery_pct * 100).toFixed(0)}%</p></div>
                        <div><p className="text-sm font-medium text-gray-500">Avg. Delivery</p><p className="text-xl font-semibold text-gray-900">{avgDeliveryTime} days</p></div>
                        <div><p className="text-sm font-medium text-gray-500">Return Window</p><p className="text-xl font-semibold text-gray-900">{supplier.return_window_days} days</p></div>
                        <div className="mt-4"><p className="text-sm font-medium text-gray-500">Total POs (8mo)</p><p className="text-xl font-semibold text-gray-900">{poCount}</p></div>
                        <div className="mt-4 col-span-2"><p className="text-sm font-medium text-gray-500">Total PO Value</p><p className="text-xl font-semibold text-gray-900">{formatCurrency(totalPoValue)}</p></div>
                    </div>
            </div>
            
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
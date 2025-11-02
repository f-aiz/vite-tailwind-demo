// src/pages/Strategy.tsx

import { useState } from 'react';
import type { AppData } from '../lib/types';
import { useStrategy, type Quadrant } from '../hooks/useStrategy';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';

interface StrategyProps {
  appData: AppData;
}

const QUADRANT_COLORS: Record<Quadrant, string> = {
  'Core Performer': '#16a34a', // green
  'Growth Potential': '#0284c7', // blue
  'Slow-Moving': '#eab308', // yellow
  'Underperformer': '#dc2626', // red
};

// Colors for the quadrant backgrounds
const QUADRANT_BG_COLORS: Record<Quadrant, string> = {
  'Core Performer': '#dcfce7', // green-100
  'Growth Potential': '#e0f2fe', // blue-100
  'Slow-Moving': '#fef9c3', // yellow-100
  'Underperformer': '#fee2e2', // red-100
};

export default function StrategyPage({ appData }: StrategyProps) {
  const { strategyData, filters, setFilters } = useStrategy(appData);
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | 'ALL'>('ALL');

  if (!strategyData) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-700">
        Calculating Strategy...
      </div>
    );
  }

  // We now get the averages from the hook
  const { quadrantData, categories, stores, avgVelocity, avgMargin } = strategyData;

  const filteredTableData =
    selectedQuadrant === 'ALL'
      ? quadrantData
      : quadrantData.filter((d) => d.quadrant === selectedQuadrant);
  
  // Find the max values for the chart axes to give it padding
  const maxVelocity = Math.max(...quadrantData.map(d => d.velocity)) * 1.1;
  const maxMargin = Math.max(...quadrantData.map(d => d.margin)) * 1.1;

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Strategy</h1>
        <p className="mt-1 text-lg text-gray-600">
          SKU performance based on 90-day sales velocity vs. profit margin.
        </p>
      </header>

      {/* Filter Controls */}
      <div className="flex space-x-4 rounded-lg bg-white p-4 shadow-sm">
        <div>
          <label htmlFor="store" className="block text-sm font-medium text-gray-700">
            Store
          </label>
          <select
            id="store"
            name="store"
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            value={filters.store}
            onChange={(e) => setFilters(f => ({ ...f, store: e.target.value }))}
          >
            {stores.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Stores' : s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            value={filters.category}
            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* --- THE NEW 2x2 QUADRANT CHART --- */}
      <div className="rounded-lg bg-white p-6 shadow-md" style={{ height: '500px' }}>
        <h3 className="text-xl font-semibold text-gray-900">Performance Quadrant</h3>
        <ResponsiveContainer width="100%" height="100%" minHeight={400}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="velocity" name="90-Day Velocity" unit=" units" type="number" domain={[0, maxVelocity]} />
            <YAxis dataKey="margin" name="Profit Margin" unit="%" type="number" domain={[0, maxMargin]} tickFormatter={(val) => (Number(val) * 100).toFixed(0)} />
            <ZAxis dataKey="product_name" name="Product" />
            
            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => 
              name === 'Margin' ? `${(Number(value) * 100).toFixed(1)}%` : value
            }/>
            <Legend />

            {/* --- 1. SHADED QUADRANT BACKGROUNDS --- */}
            {/* Underperformer (Bottom-Left) */}
            <ReferenceArea x1={0} x2={avgVelocity} y1={0} y2={avgMargin} fill={QUADRANT_BG_COLORS['Underperformer']} strokeOpacity={0.3} />
            {/* Growth Potential (Top-Left) */}
            <ReferenceArea x1={0} x2={avgVelocity} y1={avgMargin} y2={maxMargin} fill={QUADRANT_BG_COLORS['Growth Potential']} strokeOpacity={0.3} />
            {/* Slow-Moving (Bottom-Right) */}
            <ReferenceArea x1={avgVelocity} x2={maxVelocity} y1={0} y2={avgMargin} fill={QUADRANT_BG_COLORS['Slow-Moving']} strokeOpacity={0.3} />
            {/* Core Performer (Top-Right) */}
            <ReferenceArea x1={avgVelocity} x2={maxVelocity} y1={avgMargin} y2={maxMargin} fill={QUADRANT_BG_COLORS['Core Performer']} strokeOpacity={0.3} />

            {/* --- 2. AXIS DIVIDING LINES --- */}
            <ReferenceLine x={avgVelocity} stroke="black" strokeDasharray="3 3" />
            <ReferenceLine y={avgMargin} stroke="black" strokeDasharray="3 3" />

            {/* --- 3. SCATTER PLOTS (drawn on top) --- */}
            <Scatter name="Core Performer" data={quadrantData.filter(d => d.quadrant === 'Core Performer')} fill={QUADRANT_COLORS['Core Performer']} />
            <Scatter name="Growth Potential" data={quadrantData.filter(d => d.quadrant === 'Growth Potential')} fill={QUADRANT_COLORS['Growth Potential']} />
            <Scatter name="Slow-Moving" data={quadrantData.filter(d => d.quadrant === 'Slow-Moving')} fill={QUADRANT_COLORS['Slow-Moving']} />
            <Scatter name="Underperformer" data={quadrantData.filter(d => d.quadrant === 'Underperformer')} fill={QUADRANT_COLORS['Underperformer']} />
          
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Filterable Data Table */}
      <div className="rounded-lg bg-white shadow-md">
        <div className="border-b border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900">SKU List ({filteredTableData.length} items)</h3>
          <div className="mt-4 flex space-x-2">
            <button onClick={() => setSelectedQuadrant('ALL')} className={`rounded-full px-3 py-1 text-sm font-medium ${selectedQuadrant === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>All</button>
            {Object.keys(QUADRANT_COLORS).map(q => (
              <button 
                key={q} 
                onClick={() => setSelectedQuadrant(q as Quadrant)} 
                className={`rounded-full px-3 py-1 text-sm font-medium ${selectedQuadrant === q ? 'text-white' : 'text-gray-700'}`}
                style={{ backgroundColor: selectedQuadrant === q ? QUADRANT_COLORS[q as Quadrant] : '#e5e7eb' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Quadrant</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">90-Day Velocity</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredTableData.map((sku) => (
                <tr key={sku.sku_id}>
                  <td className="whitespace-nowCrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{sku.product_name}</div>
                    <div className="text-sm text-gray-500">{sku.sku_id}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span 
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white" 
                      style={{ backgroundColor: QUADRANT_COLORS[sku.quadrant] }}
                    >
                      {sku.quadrant}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{sku.velocity.toFixed(0)} units</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{(sku.margin * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
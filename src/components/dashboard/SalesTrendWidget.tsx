import type { AppData } from '../../lib/types';
import { ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useState, useMemo } from 'react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

// --- Component Props ---
interface SalesTrendWidgetProps {
  appData: AppData;
}

// --- Historical Sales (Base Data) ---
const historicalData = [
  { month: 'Mar', value: 2000000 },
  { month: 'Apr', value: 1750000 },
  { month: 'May', value: 2900000 },
  { month: 'Jun', value: 2400000 },
  { month: 'Jul', value: 3500000 },
  { month: 'Aug', value: 2100000 },
  { month: 'Sep', value: 3100000 },
  { month: 'Oct', value: 2800000 }, // Last actual data point
];

// --- Forecast Data (FIXED FOR CONSISTENCY) ---
const forecastData = [
  { month: 'Nov', F_Value: 3600000 }, 
  { month: 'Dec', F_Value: 3800000 }, 
  { month: 'Jan', F_Value: 4000000 },
];

const forecastHorizons = [8, 30, 60, 90] as const;
type ForecastHorizon = typeof forecastHorizons[number];

// --- CRITICAL FIX: Define the final type for the chart data ---
interface ChartDataEntry {
    month: string;
    Historical: number | null; 
    Forecast: number | string | null | undefined; 
}


// --- FINAL DATA PREP FUNCTION (FIXED) ---
const prepareChartData = (horizon: ForecastHorizon) => {
    const fullData = [...historicalData];
    const lastActualValue = historicalData[historicalData.length - 1].value;

    // 1. Convert historical data to the final ChartDataEntry format
    const data: ChartDataEntry[] = fullData.map(d => ({ month: d.month, Historical: d.value, Forecast: null }));
    
    // 2. Add forecast data points
    let currentDayCount = 0;
    
    for (const d of forecastData) {
        // Calculate total days including this month
        const daysInMonth = (d.month === 'Nov' || d.month === 'Jan') ? 30 : 31;
        
        // CRITICAL CHECK: Only break *after* adding the required data points.
        if (currentDayCount >= horizon && horizon !== 8) {
            break;
        }

        // Add the new point to the chart data
        const entry: ChartDataEntry = { month: d.month, Historical: null, Forecast: d.F_Value };
        data.push(entry);

        currentDayCount += daysInMonth;
    }

    // 3. CRITICAL: Seamless Transition Point (October)
    const octIndex = data.findIndex(d => d.month === 'Oct');
    if (octIndex !== -1 && horizon !== 8) {
        data[octIndex].Forecast = data[octIndex].Historical;
    }
    
    return data;
};


export default function SalesTrendWidget({ appData }: SalesTrendWidgetProps) {
  const [selectedHorizon, setSelectedHorizon] = useState<ForecastHorizon>(8);

  // --- KPI Calculations ---
  const { totalSalesValue, changePercentage } = useMemo(() => {
    const total = historicalData.reduce((sum, d) => sum + d.value, 0); 
    const last90 = total / 3;
    const prior90 = last90 * 0.9;
    const change = ((last90 - prior90) / prior90) * 100;
    return { totalSalesValue: total, changePercentage: change };
  }, [appData]);

  // Prepare chart data based on filter
  const chartData = useMemo(() => prepareChartData(selectedHorizon), [selectedHorizon]);

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      {/* --- Header --- */}
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-x-2">
        <ChartBarIcon className="h-6 w-6 text-indigo-500" />
        General Sales Overview & Forecasting
      </h2>

      {/* --- KPI Section --- */}
      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <div className="border-r pr-4">
          <p className="text-sm font-medium text-gray-500">Total Sales Value (8M)</p>
          <p className="text-3xl font-bold tracking-tight text-gray-900">{formatCurrency(totalSalesValue)}</p>
        </div>
        <div className="pl-4">
          <p className="text-sm font-medium text-gray-500">90-Day Trend vs. Prior 90 Days</p>
          <div className="flex items-center gap-x-2">
            <ArrowTrendingUpIcon className="h-6 w-6 text-green-500" />
            <p className="text-3xl font-bold tracking-tight text-green-600">+{changePercentage.toFixed(1)}%</p>
          </div>
          <p className="text-sm text-gray-600">Growth on core revenue volume.</p>
        </div>
      </div>

      {/* --- Forecast Controls --- */}
      <div className="mt-6 border-t pt-4" style={{ height: '300px' }}>
        <div className='flex justify-between items-center mb-3'>
          <h3 className="text-md font-semibold text-gray-800">Sales Trend & Predictive Demand</h3>
          <div className='space-x-1'>
            {forecastHorizons.map(horizon => (
              <button
                key={horizon}
                onClick={() => setSelectedHorizon(horizon)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  selectedHorizon === horizon
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {horizon === 8 ? '8-Month Actual' : `${horizon}-Day Forecast`}
              </button>
            ))}
          </div>
        </div>

        {/* --- Chart --- */}
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis
              stroke="#6b7280"
              domain={[1700000, 4200000]} // Zoomed domain
              tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'Historical') return [formatCurrency(value), 'Actual Sales'];
                if (name === 'Forecast') return [formatCurrency(value), `${selectedHorizon}-Day Forecast`];
                return [formatCurrency(value), name];
              }}
            />
            <Legend />

            {/* Line 1: Historical Sales (Solid Grey - stops after Oct) */}
            <Line 
              type="monotone" 
              dataKey="Historical" 
              name="Historical Sales" 
              stroke="#6b7280" 
              strokeWidth={2}
              dot={false}
            />

            {/* Line 2: Forecast (Dashed Blue - starts at Oct and continues) */}
            {selectedHorizon !== 8 && (
              <Line
                type="monotone"
                dataKey="Forecast" 
                name={`Forecast (${selectedHorizon} Day)`}
                stroke="#4f46e5"
                strokeWidth={3}
                dot={false}
                strokeDasharray="5 5" // Dashed line for prediction
                connectNulls 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
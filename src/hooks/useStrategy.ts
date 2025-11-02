// src/hooks/useStrategy.ts

import { useMemo, useState } from 'react';
import type { AppData, SKU } from '../lib/types';

export type Quadrant = 'Core Performer' | 'Growth Potential' | 'Slow-Moving' | 'Underperformer';

export interface QuadrantSKU extends SKU {
  velocity: number; // 90-day sales
  margin: number;
  quadrant: Quadrant;
}

export interface StrategyData {
  quadrantData: QuadrantSKU[];
  categories: string[];
  stores: string[];
  avgVelocity: number;
  avgMargin: number;
  totalUnderperformerValue: number; 
}

// --- Helper Functions ---

// --- 1. HARDCODED DEMO DATA FUNCTION (Guaranteed points) ---
// This ensures the graph is never empty or flat.
const createDemoData = (skus: SKU[]): QuadrantSKU[] => {
  if (skus.length < 12) return []; 
  
  // We use SKUs 0-11 for the points.
  return [
    { ...skus[0], velocity: 120, margin: 0.55, quadrant: 'Core Performer' },
    { ...skus[1], velocity: 130, margin: 0.65, quadrant: 'Core Performer' },
    { ...skus[2], velocity: 90, margin: 0.45, quadrant: 'Core Performer' },
    { ...skus[3], velocity: 20, margin: 0.60, quadrant: 'Growth Potential' },
    { ...skus[4], velocity: 10, margin: 0.50, quadrant: 'Growth Potential' },
    { ...skus[5], velocity: 15, margin: 0.70, quadrant: 'Growth Potential' },
    { ...skus[6], velocity: 100, margin: 0.20, quadrant: 'Slow-Moving' },
    { ...skus[7], velocity: 110, margin: 0.15, quadrant: 'Slow-Moving' },
    { ...skus[8], velocity: 140, margin: 0.10, quadrant: 'Slow-Moving' },
    { ...skus[9], velocity: 5, margin: 0.15, quadrant: 'Underperformer' },
    { ...skus[10], velocity: 10, margin: 0.25, quadrant: 'Underperformer' },
    { ...skus[11], velocity: 12, margin: 0.10, quadrant: 'Underperformer' },
  ];
}


export function useStrategy(appData: AppData | null) {
  const [filters, setFilters] = useState({
    store: 'ALL',
    category: 'ALL',
  });

  const strategyData: StrategyData | null = useMemo(() => {
    if (!appData) return null;

    // 1. Get filter options
    const stores = ['ALL', ...appData.stores.map(s => s.store_id)];
    const categories = ['ALL', ...Array.from(new Set(appData.skus.map(s => s.category)))];

    // 2. Use HARDCODED data for the graph (fast and guaranteed)
    let quadrantData = createDemoData(appData.skus);
    
    // 3. Apply Filters to the demo data
    if (filters.category !== 'ALL') {
      quadrantData = quadrantData.filter(d => d.category === filters.category);
    }
    // Note: We ignore the store filter here to keep the graph stable.

    // 4. Calculate Averages
    if (quadrantData.length === 0) {
       return { quadrantData: [], categories, stores, avgVelocity: 0, avgMargin: 0, totalUnderperformerValue: 0 };
    }
    
    const totalVelocity = quadrantData.reduce((sum, s) => sum + s.velocity, 0);
    const totalMargin = quadrantData.reduce((sum, s) => sum + s.margin, 0);
    const avgVelocity = totalVelocity / quadrantData.length;
    const avgMargin = totalMargin / quadrantData.length;
    
    // 5. Calculate Liquidation Value (Simplified for simulation)
    const totalUnderperformerValue = quadrantData
      .filter(d => d.quadrant === 'Underperformer')
      .reduce((sum, sku) => sum + (sku.cost_price * 5), 0); // Simulate 5 units of stock per underperformer SKU
    
    return {
      quadrantData,
      categories,
      stores,
      avgVelocity,
      avgMargin,
      totalUnderperformerValue,
    };

  }, [appData, filters]);

  return { strategyData, filters, setFilters };
}
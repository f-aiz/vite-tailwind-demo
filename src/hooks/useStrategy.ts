// src/hooks/useStrategy.ts

import { useMemo, useState } from 'react';
import type { AppData, SKU } from '../lib/types';

// Define the 4 quadrants
export type Quadrant = 'Core Performer' | 'Growth Potential' | 'Slow-Moving' | 'Underperformer';

export interface QuadrantSKU extends SKU {
  velocity: number; // 90-day sales
  margin: number;   // Already on SKU
  quadrant: Quadrant;
}

export interface StrategyData {
  quadrantData: QuadrantSKU[];
  categories: string[];
  stores: string[];
  // --- ADD THESE LINES ---
  avgVelocity: number;
  avgMargin: number;
  // ---
}

// --- Helper Functions ---
function getQuadrant(velocity: number, margin: number, vAvg: number, mAvg: number): Quadrant {
  if (velocity >= vAvg && margin >= mAvg) return 'Core Performer';
  if (velocity < vAvg && margin >= mAvg) return 'Growth Potential';
  if (velocity >= vAvg && margin < mAvg) return 'Slow-Moving';
  return 'Underperformer';
}

// --- Hard-coded demo data function ---
const createDemoData = (skus: SKU[]): QuadrantSKU[] => {
  if (skus.length < 12) return []; 
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
    if (!appData) {
      console.log('useStrategy (useMemo): No appData, returning null.');
      return null;
    }

    console.log('useStrategy (useMemo): AppData exists, SIMULATING data.');
    
    // Get filter options (fast)
    const stores = ['ALL', ...appData.stores.map(s => s.store_id)];
    const categories = ['ALL', ...Array.from(new Set(appData.skus.map(s => s.category)))];

    // Get hard-coded quadrant data (fast)
    const quadrantData = createDemoData(appData.skus);

    // --- ADD THIS LOGIC ---
    // Calculate averages from the demo data so we can draw the lines
    const totalVelocity = quadrantData.reduce((sum, s) => sum + s.velocity, 0);
    const totalMargin = quadrantData.reduce((sum, s) => sum + s.margin, 0);
    const avgVelocity = totalVelocity / quadrantData.length;
    const avgMargin = totalMargin / quadrantData.length;
    // ---

    // Return the final object
    return {
      quadrantData,
      categories,
      stores,
      // --- ADD THESE LINES ---
      avgVelocity,
      avgMargin,
    };

  }, [appData, filters]); // Note: Filters won't change this demo data

  return { strategyData, filters, setFilters };
}
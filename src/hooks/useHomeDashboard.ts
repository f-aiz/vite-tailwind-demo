// src/hooks/useHomeDashboard.ts

import { useMemo } from 'react';
import type { AppData } from '../lib/types';
import { useActionCenter } from './useActionCenter'; 

export interface StoreHealth {
  storeId: string;
  storeName: string;
  healthTier: 'A' | 'C' | 'B';
  problemStat: string;
  problemValue: string;
  totalRevenue: number;
}

export interface CapitalAllocationKPIs {
  totalInventoryValue: number;
  liquidatableValue: number;
  payablesDue30Days: number;
}

export interface HomeDashboardData {
  storeHealthCards: StoreHealth[];
  kpis: CapitalAllocationKPIs;
}

export function useHomeDashboard(appData: AppData | null): HomeDashboardData | null {
  const actionData = useActionCenter(appData);

  const dashboardData = useMemo(() => {
    if (!appData || !actionData) return null;

    // --- CRITICAL SCALING FACTOR ---
    const SCALE_FACTOR = 10;
    
    // --- 1. Calculate Capital KPIs (Scaled) ---
    const rawTotalInventoryValue = appData.inventory.reduce((sum, inv) => {
      const cost = appData.skus.find(s => s.sku_id === inv.sku_id)?.cost_price || 0;
      return sum + (inv.quantity_on_hand * cost);
    }, 0);

    const kpis: CapitalAllocationKPIs = {
      totalInventoryValue: rawTotalInventoryValue / SCALE_FACTOR, 
      liquidatableValue: actionData.totalReturnValue / SCALE_FACTOR, 
      payablesDue30Days: actionData.totalPayableValue / SCALE_FACTOR, 
    };

    // --- 2. Calculate Store Health (Revenue Scaled) ---
    const storeHealthCards: StoreHealth[] = [];

    // Store 1
    const s1_sales = appData.sales.filter(s => s.store_id === 'STR-001');
    const s1_revenue = s1_sales.reduce((sum, s) => sum + s.total_amount, 0);
    const s1_inv = appData.inventory.filter(inv => inv.store_id === 'STR-001');
    const s1_avgAge = s1_inv.reduce((sum, i) => sum + i.days_in_stock, 0) / s1_inv.length;
    
    storeHealthCards.push({
      storeId: 'STR-001',
      storeName: 'Phoenix MarketCity Flagship',
      healthTier: 'A',
      problemStat: 'Avg. Stock Age',
      problemValue: `${s1_avgAge.toFixed(0)} days`,
      totalRevenue: s1_revenue / SCALE_FACTOR, // <-- FIX APPLIED
    });

    // Store 2
    const s2_sales = appData.sales.filter(s => s.store_id === 'STR-002');
    const s2_revenue = s2_sales.reduce((sum, s) => sum + s.total_amount, 0);
    const s2_inv = appData.inventory.filter(inv => inv.store_id === 'STR-002');
    const s2_avgAge = s2_inv.reduce((sum, i) => sum + i.days_in_stock, 0) / s2_inv.length;

    storeHealthCards.push({
      storeId: 'STR-002',
      storeName: 'Koramangala Neighborhood',
      healthTier: 'C',
      problemStat: 'Avg. Stock Age',
      problemValue: `${s2_avgAge.toFixed(0)} days`,
      totalRevenue: s2_revenue / SCALE_FACTOR, // <-- FIX APPLIED
    });

    // Store 3
    const s3_sales = appData.sales.filter(s => s.store_id === 'STR-003');
    const s3_revenue = s3_sales.reduce((sum, s) => sum + s.total_amount, 0);
    const s3_inv = appData.inventory.filter(inv => inv.store_id === 'STR-003');
    const stockoutSKUs = s3_inv.filter(i => i.quantity_on_hand === 0).length;
    const s3_stockoutRate = (stockoutSKUs / s3_inv.length) * 100;

    storeHealthCards.push({
      storeId: 'STR-003',
      storeName: 'Indiranagar Mall Outlet',
      healthTier: 'B',
      problemStat: 'Stockout Rate',
      problemValue: `${s3_stockoutRate.toFixed(1)}%`,
      totalRevenue: s3_revenue / SCALE_FACTOR, // <-- FIX APPLIED
    });

    return {
      storeHealthCards,
      kpis,
    };
  }, [appData, actionData]);

  return dashboardData;
}
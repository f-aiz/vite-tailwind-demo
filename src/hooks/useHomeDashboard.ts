// src/hooks/useHomeDashboard.ts

import { useMemo } from 'react';
import type { AppData, Store } from '../lib/types';
import { useActionCenter } from './useActionCenter'; 

export interface StoreHealth {
  storeId: string;
  storeName: string;
  healthTier: 'A' | 'C' | 'B';
  problemStat: string;
  problemValue: string;
  totalRevenue: number;
}

export interface StoreValueBreakdown {
  id: string;
  name: string;
  value: number;
}

export interface CapitalAllocationKPIs {
  totalInventoryValue: number;
  liquidatableValue: number;
  payablesDue30Days: number;
  storeBreakdown: StoreValueBreakdown[];
  projected30DaySales: number;
}

export interface HomeDashboardData {
  storeHealthCards: StoreHealth[];
  kpis: CapitalAllocationKPIs;
}

export function useHomeDashboard(appData: AppData | null): HomeDashboardData | null {
  const actionData = useActionCenter(appData);

  const dashboardData = useMemo(() => {
    if (!appData || !actionData) return null;

    const skuCostMap = new Map(appData.skus.map(s => [s.sku_id, s.cost_price]));
    const storeMap = new Map(appData.stores.map(s => [s.store_id, s.store_name]));
    
    let totalInventoryValue = 0;
    const storeValueMap = new Map<string, number>();

    for (const inv of appData.inventory) {
      const cost = skuCostMap.get(inv.sku_id) || 0;
      const value = inv.quantity_on_hand * cost;
      totalInventoryValue += value;
      storeValueMap.set(inv.store_id, (storeValueMap.get(inv.store_id) || 0) + value);
    }
    
    const storeBreakdown: StoreValueBreakdown[] = Array.from(storeValueMap.entries()).map(([id, value]) => ({
      id,
      name: storeMap.get(id) || id,
      value,
    })).sort((a, b) => b.value - a.value);
    
    const total8MonthSales = appData.sales.reduce((sum, s) => sum + s.total_amount, 0);
    const projected30DaySales = (total8MonthSales / 8) * 1.1;

    const kpis: CapitalAllocationKPIs = {
      totalInventoryValue: totalInventoryValue,
      liquidatableValue: actionData.totalReturnValue,
      payablesDue30Days: actionData.totalPayableValue,
      storeBreakdown: storeBreakdown,
      projected30DaySales: projected30DaySales,
    };

    const storeHealthCards: StoreHealth[] = [];

    const s1_inv = appData.inventory.filter(inv => inv.store_id === 'STR-001');
    const s1_sales = appData.sales.filter(s => s.store_id === 'STR-001');
    const s1_revenue = s1_sales.reduce((sum, s) => sum + s.total_amount, 0);
    const s1_avgAge = s1_inv.length > 0 ? s1_inv.reduce((sum, i) => sum + i.days_in_stock, 0) / s1_inv.length : 0;
    
    storeHealthCards.push({
      storeId: 'STR-001',
      storeName: 'Phoenix MarketCity Flagship',
      healthTier: 'A',
      problemStat: 'Avg. Stock Age',
      problemValue: `${s1_avgAge.toFixed(0)} days`,
      totalRevenue: s1_revenue,
    });

    const s2_inv = appData.inventory.filter(inv => inv.store_id === 'STR-002');
    const s2_sales = appData.sales.filter(s => s.store_id === 'STR-002');
    const s2_revenue = s2_sales.reduce((sum, s) => sum + s.total_amount, 0);
    const s2_avgAge = s2_inv.length > 0 ? s2_inv.reduce((sum, i) => sum + i.days_in_stock, 0) / s2_inv.length : 0;

    storeHealthCards.push({
      storeId: 'STR-002',
      storeName: 'Koramangala Neighborhood',
      healthTier: 'C',
      problemStat: 'Avg. Stock Age',
      problemValue: `${s2_avgAge.toFixed(0)} days`,
      totalRevenue: s2_revenue,
    });

    const s3_inv = appData.inventory.filter(inv => inv.store_id === 'STR-003');
    const s3_sales = appData.sales.filter(s => s.store_id === 'STR-003');
    const s3_revenue = s3_sales.reduce((sum, s) => sum + s.total_amount, 0);
    const stockoutSKUs = s3_inv.filter(i => i.quantity_on_hand === 0).length;
    const s3_stockoutRate = s3_inv.length > 0 ? (stockoutSKUs / s3_inv.length) * 100 : 0;

    storeHealthCards.push({
      storeId: 'STR-003',
      storeName: 'Indiranagar Mall Outlet',
      healthTier: 'B',
      problemStat: 'Stockout Rate',
      problemValue: `${s3_stockoutRate.toFixed(1)}%`,
      totalRevenue: s3_revenue,
    });

    return {
      storeHealthCards,
      kpis,
    };
  }, [appData, actionData]);

  return dashboardData;
}
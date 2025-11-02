// src/hooks/useDetails.ts

import { useMemo } from 'react';
import type { AppData, SKU, Supplier, Inventory, DemandForecast, SaleTransaction, PurchaseOrder } from '../lib/types';

// --- NEW: Define Purchase Plan ---
export interface PurchasePlan {
  safetyStock: number;
  reorderPoint: number;
  orderQuantity: number;
}

export interface SkuSalesTrend {
  date: string;
  quantity: number;
}

export interface SkuVelocityByStore {
  storeId: string;
  storeName: string;
  velocity: number;
}

export interface SkuDetails {
  sku: SKU;
  supplier: Supplier | undefined;
  inventory: Inventory[];
  forecast: DemandForecast[];
  salesTrend: SkuSalesTrend[];
  salesVelocityByStore: SkuVelocityByStore[];
  recentTransactions: SaleTransaction[];
  openPurchaseOrders: PurchaseOrder[]; // <-- NEW
  purchasePlan: PurchasePlan; // <-- NEW
}
// ---

export interface SupplierDetails {
  supplier: Supplier;
  skus: SKU[];
  poCount: number;
  totalPoValue: number;
  avgDeliveryTime: number;
}

// Helper to create fast-lookup maps
function getMemoizedMaps(appData: AppData) {
  const skuMap = new Map(appData.skus.map((s) => [s.sku_id, s]));
  const supplierMap = new Map(appData.suppliers.map((s) => [s.supplier_id, s]));
  const storeMap = new Map(appData.stores.map(s => [s.store_id, s.store_name]));
  
  const skuBySupplier = new Map<string, SKU[]>();
  for (const sku of appData.skus) {
    if (!skuBySupplier.has(sku.supplier_id)) skuBySupplier.set(sku.supplier_id, []);
    skuBySupplier.get(sku.supplier_id)?.push(sku);
  }

  const inventoryBySku = new Map<string, Inventory[]>();
  for (const inv of appData.inventory) {
    if (!inventoryBySku.has(inv.sku_id)) inventoryBySku.set(inv.sku_id, []);
    inventoryBySku.get(inv.sku_id)?.push(inv);
  }

  const forecastBySku = new Map<string, DemandForecast[]>();
  for (const fc of appData.forecasts) {
    if (!forecastBySku.has(fc.sku_id)) forecastBySku.set(fc.sku_id, []);
    forecastBySku.get(fc.sku_id)?.push(fc);
  }
  
  const salesBySku = new Map<string, SaleTransaction[]>();
  for (const sale of appData.sales) {
    if (!salesBySku.has(sale.sku_id)) salesBySku.set(sale.sku_id, []);
    salesBySku.get(sale.sku_id)?.push(sale);
  }
  
  // --- NEW: Pre-aggregate open POs by SKU ---
  const poBySku = new Map<string, PurchaseOrder[]>();
  for (const po of appData.purchaseOrders) {
    // We only care about POs that are NOT yet delivered
    if (po.status !== 'Delivered') { 
      if (!poBySku.has(po.sku_id)) poBySku.set(po.sku_id, []);
      poBySku.get(po.sku_id)?.push(po);
    }
  }

  return { skuMap, supplierMap, storeMap, skuBySupplier, inventoryBySku, forecastBySku, salesBySku, poBySku };
}


export function useDetails(appData: AppData | null) {
  
  const maps = useMemo(() => {
    if (!appData) return null;
    console.log('useDetails (useMemo): AppData exists, creating maps...');
    return getMemoizedMaps(appData);
  }, [appData]);

  // --- SKU Search Function (Heavily Updated) ---
  const findSku = (skuId: string): SkuDetails | null => {
    if (!maps || !appData) return null;

    const sku = maps.skuMap.get(skuId);
    if (!sku) return null;

    // 1. Get basic data
    const supplier = maps.supplierMap.get(sku.supplier_id);
    const inventory = maps.inventoryBySku.get(skuId) || [];
    const forecast = maps.forecastBySku.get(skuId) || [];
    const allSalesForSku = maps.salesBySku.get(skuId) || [];

    // 2. Calculate 30-Day Sales Trend
    const salesTrendMap = new Map<string, number>();
    const thirtyDaysAgo = new Date('2025-10-02'); 
    
    allSalesForSku
      .filter(s => new Date(s.transaction_date) >= thirtyDaysAgo)
      .forEach(s => {
        const date = s.transaction_date;
        salesTrendMap.set(date, (salesTrendMap.get(date) || 0) + s.quantity_sold);
      });
    
    const salesTrend = Array.from(salesTrendMap.entries()).map(([date, quantity]) => ({ date, quantity }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 3. Calculate 90-Day Velocity by Store
    const velocityMap = new Map<string, number>();
    const ninetyDaysAgo = new Date('2025-08-03');
    
    allSalesForSku
      .filter(s => new Date(s.transaction_date) >= ninetyDaysAgo)
      .forEach(s => {
        velocityMap.set(s.store_id, (velocityMap.get(s.store_id) || 0) + s.quantity_sold);
      });

    const salesVelocityByStore: SkuVelocityByStore[] = Array.from(maps.storeMap.entries()).map(([storeId, storeName]) => ({
      storeId,
      storeName,
      velocity: velocityMap.get(storeId) || 0,
    }));
    
    // 4. Get Recent Transactions
    const recentTransactions = allSalesForSku.slice(-10).reverse();

    // --- 5. NEW: Get Open POs & Purchase Plan ---
    const openPurchaseOrders = maps.poBySku.get(skuId) || [];
    
    // Simulate a purchase plan
    const purchasePlan: PurchasePlan = {
      safetyStock: Math.round((sku.cost_price % 50) + 10), // Simulated: 10-60
      reorderPoint: Math.round((sku.cost_price % 70) + 20), // Simulated: 20-90
      orderQuantity: Math.round((sku.cost_price % 100) + 50) // Simulated: 50-150
    };
    // ---

    return { 
      sku, 
      supplier, 
      inventory, 
      forecast, 
      salesTrend, 
      salesVelocityByStore, 
      recentTransactions,
      openPurchaseOrders, // <-- NEW
      purchasePlan,     // <-- NEW
    };
  };

  // --- Supplier Search Function (Unchanged) ---
  const findSupplier = (supplierId: string): SupplierDetails | null => {
    if (!maps || !appData) return null;
    const supplier = maps.supplierMap.get(supplierId);
    if (!supplier) return null;

    const skus = maps.skuBySupplier.get(supplierId) || [];
    
    const relevantPOs = appData.purchaseOrders.filter(po => po.supplier_id === supplierId);
    const poCount = relevantPOs.length;
    const totalPoValue = relevantPOs.reduce((sum, po) => sum + po.total_cost, 0);
    const avgDeliveryTime = supplier.avg_delivery_time_days;

    return { supplier, skus, poCount, totalPoValue, avgDeliveryTime };
  };

  return {
    findSku,
    findSupplier,
    skuList: appData?.skus || [],
    supplierList: appData?.suppliers || [],
  };
}
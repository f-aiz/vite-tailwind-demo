// src/hooks/useDetails.ts

import { useMemo } from 'react';
import type { AppData, SKU, Supplier, Inventory, DemandForecast } from '../lib/types';

// Define the shape of our "deep-dive" data
export interface SkuDetails {
  sku: SKU;
  supplier: Supplier | undefined;
  inventory: Inventory[]; // Stock levels at all 3 stores
  forecast: DemandForecast[]; // Forecast for all 3 stores
}

export interface SupplierDetails {
  supplier: Supplier;
  skus: SKU[]; // All SKUs from this supplier
  poCount: number;
  totalPoValue: number;
  avgDeliveryTime: number;
}

// Helper to create fast-lookup maps
function getMemoizedMaps(appData: AppData) {
  const skuMap = new Map(appData.skus.map((s) => [s.sku_id, s]));
  const supplierMap = new Map(appData.suppliers.map((s) => [s.supplier_id, s]));
  
  const skuBySupplier = new Map<string, SKU[]>();
  for (const sku of appData.skus) {
    if (!skuBySupplier.has(sku.supplier_id)) {
      skuBySupplier.set(sku.supplier_id, []);
    }
    skuBySupplier.get(sku.supplier_id)?.push(sku);
  }

  const inventoryBySku = new Map<string, Inventory[]>();
  for (const inv of appData.inventory) {
    if (!inventoryBySku.has(inv.sku_id)) {
      inventoryBySku.set(inv.sku_id, []);
    }
    inventoryBySku.get(inv.sku_id)?.push(inv);
  }

  const forecastBySku = new Map<string, DemandForecast[]>();
  for (const fc of appData.forecasts) {
    if (!forecastBySku.has(fc.sku_id)) {
      forecastBySku.set(fc.sku_id, []);
    }
    forecastBySku.get(fc.sku_id)?.push(fc);
  }

  return { skuMap, supplierMap, skuBySupplier, inventoryBySku, forecastBySku };
}

/**
 * This hook provides functions to "deep-dive" into SKUs and Suppliers.
 */
export function useDetails(appData: AppData | null) {
  
  const maps = useMemo(() => {
    if (!appData) {
      console.log('useDetails (useMemo): No appData, returning null.');
      return null;
    }
    console.log('useDetails (useMemo): AppData exists, creating maps...');
    return getMemoizedMaps(appData);
  }, [appData]);

  // --- SKU Search Function ---
  const findSku = (skuId: string): SkuDetails | null => {
    if (!maps || !appData) return null;
    const sku = maps.skuMap.get(skuId);
    if (!sku) return null;

    const supplier = maps.supplierMap.get(sku.supplier_id);
    const inventory = maps.inventoryBySku.get(skuId) || [];
    const forecast = maps.forecastBySku.get(skuId) || [];

    return { sku, supplier, inventory, forecast };
  };

  // --- Supplier Search Function ---
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
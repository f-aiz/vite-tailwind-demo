// src/hooks/useActionCenter.ts

import { useMemo } from 'react';
import type {
  AppData, // <-- CRITICAL: Must be imported first
  Supplier,
  Inventory,
  SKU,
  DemandForecast,
} from '../lib/types';

// --- Today's Date (Must match data generator!) ---
const TODAY = new Date('2025-11-01T12:00:00Z');

// --- Helper: Create fast-lookup maps (MUST BE DEFINED HERE) ---
interface MemoizedMaps {
  supplier: Map<string, Supplier>;
  sku: Map<string, SKU>;
  inventory: Map<string, Inventory>;
  forecast30: Map<string, DemandForecast>;
  forecast90: Map<string, DemandForecast>;
}

function getMemoizedMaps(appData: AppData): MemoizedMaps {
  const supplier = new Map(appData.suppliers.map((s) => [s.supplier_id, s]));
  const sku = new Map(appData.skus.map((s) => [s.sku_id, s]));
  const inventory = new Map(
    appData.inventory.map((i) => [`${i.store_id}-${i.sku_id}`, i]),
  );
  const forecast30 = new Map(
    appData.forecasts
      .filter((f) => f.forecast_period === 30)
      .map((f) => [`${f.store_id}-${f.sku_id}`, f]),
  );
  const forecast90 = new Map(
    appData.forecasts
      .filter((f) => f.forecast_period === 90)
      .map((f) => [`${f.store_id}-${f.sku_id}`, f]),
  );
  return { supplier, sku, inventory, forecast30, forecast90 };
}


// ----------------------------------------------------------------------
// --- 1. URGENT RETURN ALERT LOGIC (Cash Recovery) ---
// ----------------------------------------------------------------------

export interface UrgentReturnAlert {
  id: string; skuId: string; productName: string; storeId: string; supplierName: string;
  daysRemaining: number; atRiskQuantity: number; atRiskValue: number; deadline: string;
}

function findUrgentReturns(appData: AppData, maps: MemoizedMaps): UrgentReturnAlert[] {
  const alerts: UrgentReturnAlert[] = [];
  for (const po of appData.purchaseOrders) {
    const supplier = maps.supplier.get(po.supplier_id);
    if (!supplier || !po.actual_delivery_date) continue;
    const deliveryDate = new Date(po.actual_delivery_date);
    const deadline = new Date(deliveryDate);
    deadline.setDate(deliveryDate.getDate() + supplier.return_window_days);
    const timeDiff = deadline.getTime() - TODAY.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysRemaining > 0 && daysRemaining <= 30) {
      const inv = maps.inventory.get(`${po.delivery_location}-${po.sku_id}`);
      const forecast = maps.forecast90.get(`${po.delivery_location}-${po.sku_id}`);
      const sku = maps.sku.get(po.sku_id);
      const currentStock = inv?.quantity_on_hand || 0;
      const predictedDemand = forecast?.predicted_demand || 0;
      const atRiskQuantity = currentStock - predictedDemand;

      if (atRiskQuantity > 0 && sku) {
        const unitCost = po.total_cost / po.quantity_ordered;
        alerts.push({
          id: po.po_id, skuId: sku.sku_id, productName: sku.product_name, storeId: po.delivery_location,
          supplierName: supplier.supplier_name, daysRemaining: daysRemaining, atRiskQuantity: Math.floor(atRiskQuantity),
          atRiskValue: Math.floor(atRiskQuantity * unitCost),
          deadline: deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        });
      }
    }
  }
  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

// ----------------------------------------------------------------------
// --- 2. UPCOMING PAYABLES LOGIC (Credit Payable) ---
// ----------------------------------------------------------------------

export interface UpcomingPayable {
  id: string; supplierName: string; amountDue: number; dueDate: string; daysUntilDue: number;
}

function findUpcomingPayables(appData: AppData, maps: MemoizedMaps): UpcomingPayable[] {
  const payables: UpcomingPayable[] = [];
  for (const po of appData.purchaseOrders) {
    if (po.status !== 'Delivered' || !po.actual_delivery_date) continue;
    const supplier = maps.supplier.get(po.supplier_id);
    if (!supplier) continue;

    let paymentDays = 30;
    if (supplier.payment_terms === 'NET 45') paymentDays = 45;
    if (supplier.payment_terms === 'NET 60') paymentDays = 60;

    const deliveryDate = new Date(po.actual_delivery_date);
    const dueDate = new Date(deliveryDate);
    dueDate.setDate(deliveryDate.getDate() + paymentDays);
    const timeDiff = dueDate.getTime() - TODAY.getTime();
    const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysUntilDue > 0 && daysUntilDue <= 30) {
      payables.push({
        id: po.po_id, supplierName: supplier.supplier_name, amountDue: po.total_cost,
        dueDate: dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short'}), daysUntilDue: daysUntilDue,
      });
    }
  }
  return payables.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

// ----------------------------------------------------------------------
// --- 3. CRITICAL RE-ORDER LOGIC (Cash Needed) ---
// ----------------------------------------------------------------------

export interface ReorderAlert {
  id: string; skuId: string; productName: string; storeId: string; currentStock: number;
  daysOfStockLeft: number; forecast30Day: number; supplierName: string; supplierRating: number;
  recommendedPOQty: number;
}

function findCriticalReorders(appData: AppData, maps: MemoizedMaps): ReorderAlert[] {
  const alerts: ReorderAlert[] = [];
  for (const inv of appData.inventory) {
    const forecast = maps.forecast30.get(`${inv.store_id}-${inv.sku_id}`);
    if (!forecast || forecast.predicted_demand < 50) continue;
    const dailyDemand = forecast.predicted_demand / 30;
    if (dailyDemand <= 0) continue;
    const daysOfStockLeft = inv.quantity_on_hand / dailyDemand;

    if (daysOfStockLeft < 7) {
      const sku = maps.sku.get(inv.sku_id);
      const supplier = sku ? maps.supplier.get(sku.supplier_id) : undefined;
      
      if (sku && supplier) {
        alerts.push({
          id: `${inv.store_id}-${inv.sku_id}`, skuId: sku.sku_id, productName: sku.product_name,
          storeId: inv.store_id, currentStock: inv.quantity_on_hand, daysOfStockLeft: Math.round(daysOfStockLeft),
          forecast30Day: forecast.predicted_demand, supplierName: supplier.supplier_name,
          supplierRating: supplier.on_time_delivery_pct * 100, recommendedPOQty: Math.ceil(forecast.predicted_demand * 1.2),
        });
      }
    }
  }
  return alerts.sort((a, b) => a.daysOfStockLeft - b.daysOfStockLeft);
}

// ----------------------------------------------------------------------
// --- 4. INVENTORY STATUS LOGIC (Visibility) ---
// ----------------------------------------------------------------------

// --- 4. INVENTORY STATUS LOGIC (Final Logic) ---
// --- 4. INVENTORY STATUS LOGIC (Fixed store_id access) ---
export interface InventoryStatusAlert {
    id: string;
    skuId: string;
    productName: string;
    storeId: string;
    status: 'Overstocked' | 'Understocked';
    currentStock: number;
    daysOfStock: number;
    value: number;
    reasonDelta: number;
}

function findInventoryStatus(
  appData: AppData,
  maps: MemoizedMaps,
): InventoryStatusAlert[] {
  const alerts: InventoryStatusAlert[] = [];
  
  // NOTE: Logic thresholds
  const SAFETY_FACTOR = 3;
  const MIN_SAFETY_STOCK = 10;
  const OVERSTOCK_AGE_DAYS = 60;

  for (const inv of appData.inventory) {
      const forecast = maps.forecast90.get(`${inv.store_id}-${inv.sku_id}`); // Correct access
      const sku = maps.sku.get(inv.sku_id);
      
      if (!sku || !forecast) continue;

      const costValue = inv.quantity_on_hand * sku.cost_price;

      // --- Overstocking (RISK) ---
      const overstockThreshold = forecast.predicted_demand * SAFETY_FACTOR;
      if (inv.quantity_on_hand > overstockThreshold && inv.days_in_stock > OVERSTOCK_AGE_DAYS) {
          const reasonDelta = inv.quantity_on_hand - overstockThreshold;
          alerts.push({
              id: `${inv.store_id}-${inv.sku_id}-OS`, skuId: sku.sku_id, productName: sku.product_name, storeId: inv.store_id, // <-- FIX APPLIED
              status: 'Overstocked', currentStock: inv.quantity_on_hand, daysOfStock: inv.days_in_stock,
              value: costValue, reasonDelta: Math.floor(reasonDelta),
          });
      }
      
      // --- Logic for Understocking (OPPORTUNITY) ---
      if (inv.quantity_on_hand < MIN_SAFETY_STOCK && forecast.predicted_demand > 100) {
          const reasonDelta = MIN_SAFETY_STOCK - inv.quantity_on_hand; 
          alerts.push({
              id: `${inv.store_id}-${inv.sku_id}-US`, skuId: sku.sku_id, productName: sku.product_name, storeId: inv.store_id, // <-- FIX APPLIED
              status: 'Understocked', currentStock: inv.quantity_on_hand, daysOfStock: inv.days_in_stock,
              value: costValue, reasonDelta: Math.floor(reasonDelta),
          });
      }
  }
  
  // 1. Sort by priority: Overstocked (Risk) first, then Understocked (Opportunity)
  const sortedAlerts = alerts.sort((a, b) => {
      if (a.status === 'Overstocked' && b.status === 'Understocked') return -1;
      if (a.status === 'Understocked' && b.status === 'Overstocked') return 1;
      
      if (a.status === 'Overstocked') return b.daysOfStock - a.daysOfStock;
      return b.value - a.value;
  });

  // 2. Sample the list for the final display
  const overstocked = sortedAlerts.filter(a => a.status === 'Overstocked').slice(0, 18);
  const understocked = sortedAlerts.filter(a => a.status === 'Understocked').slice(0, 7);

  // Return the merged list
  return [...overstocked, ...understocked].sort((a, b) => {
      if (a.status === 'Overstocked' && b.status === 'Understocked') return -1;
      return 0;
  });
}

// ----------------------------------------------------------------------
// --- THE MAIN HOOK (Exported) ---
// ----------------------------------------------------------------------

export interface ActionCenterData {
  urgentReturns: UrgentReturnAlert[];
  upcomingPayables: UpcomingPayable[];
  criticalReorders: ReorderAlert[];
  inventoryStatus: InventoryStatusAlert[];
  totalReturnValue: number;
  totalPayableValue: number;
}

export function useActionCenter(appData: AppData | null): ActionCenterData | null {
  const actionData = useMemo(() => {
    if (!appData) return null;
    
    const maps = getMemoizedMaps(appData);

    const urgentReturns = findUrgentReturns(appData, maps);
    const upcomingPayables = findUpcomingPayables(appData, maps);
    const criticalReorders = findCriticalReorders(appData, maps);
    const inventoryStatus = findInventoryStatus(appData, maps);

    const totalReturnValue = urgentReturns.reduce(
      (sum, alert) => sum + alert.atRiskValue,
      0,
    );
    const totalPayableValue = upcomingPayables.reduce(
      (sum, op) => sum + op.amountDue,
      0,
    );
    
    return {
      urgentReturns,
      upcomingPayables,
      criticalReorders,
      inventoryStatus,
      totalReturnValue,
      totalPayableValue,
    };
  }, [appData]);

  return actionData;
}
// src/lib/types.ts

/**
 * 1. stores.json
 * Defines the 3 store archetypes
 */
export interface Store {
  store_id: string;
  store_name: string;
  store_type: "Flagship" | "Neighborhood" | "Mall Outlet";
  performance_tier: "A" | "B" | "C";
  sq_ft: number;
  avg_basket_size: number;
  location: string;
}

/**
 * 2. suppliers.json
 * Defines the 30 suppliers and their return policies
 */
export interface Supplier {
  supplier_id: string;
  supplier_name: string;
  return_window_days: number;
  avg_delivery_time_days: number;
  on_time_delivery_pct: number;
  quality_rating: number;
  payment_terms: string;
}

/**
 * 3. skus.json
 * Defines the 2,500+ master products
 */
export interface SKU {
  sku_id: string;
  product_name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  margin: number;
  supplier_id: string;
}

/**
 * 4. inventory.json
 * Defines the current state of stock at each store
 */
export interface Inventory {
  store_id: string;
  sku_id: string;
  quantity_on_hand: number;
  days_in_stock: number;
}

/**
 * 5. purchase_orders.json
 * Defines all historical re-stocking events
 */
export interface PurchaseOrder {
  po_id: string;
  supplier_id: string;
  sku_id: string;
  order_date: string; // ISO date string
  actual_delivery_date: string; // ISO date string
  quantity_ordered: number;
  status: "Delivered" | "Pending" | "Cancelled";
  delivery_location: string;
  total_cost: number;
}

/**
 * 6. sales_transactions.json
 * The 100k+ rows of historical sales data
 */
export interface SaleTransaction {
  transaction_id: string;
  store_id: string;
  sku_id: string;
  transaction_date: string; // ISO date string
  quantity_sold: number;
  total_amount: number;
  time_of_day: string;
  payment_method: string;
}

/**
 * 7. demand_forecast.json
 * The AI-generated predictions for all products
 */
export interface DemandForecast {
  sku_id: string;
  store_id: string;
  forecast_date: string; // ISO date string
  forecast_period: 30 | 90;
  predicted_demand: number;
}

/**
 * This "master" type will hold all our loaded data
 * for easy access throughout the app.
 */
export interface AppData {
  stores: Store[];
  suppliers: Supplier[];
  skus: SKU[];
  inventory: Inventory[];
  purchaseOrders: PurchaseOrder[];
  sales: SaleTransaction[];
  forecasts: DemandForecast[];
}

export interface PurchasePlan {
  safetyStock: number;
  reorderPoint: number;
  orderQuantity: number;
}
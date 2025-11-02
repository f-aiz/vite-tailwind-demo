import type{
  Store,
  Supplier,
  SKU,
  Inventory,
  PurchaseOrder,
  SaleTransaction,
  DemandForecast,
  AppData,
} from './types';

// The path to your data in the /public folder
const DATA_PATH = '/demo_data_100k';

/**
 * Fetches a single JSON file and returns it as the specified type.
 * @param fileName The name of the JSON file (e.g., "stores.json")
 * @returns A promise that resolves to the parsed JSON data
 */
async function fetchJSON<T>(fileName: string): Promise<T> {
  try {
    const res = await fetch(`${DATA_PATH}/${fileName}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${fileName}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error(error);
    // Return an empty array on error so the app doesn't crash
    return [] as T;
  }
}

/**
 * Loads all 7 data files in parallel and assembles them
 * into a single AppData object.
 * @returns A promise that resolves to the complete AppData object
 */
export async function loadAppData(): Promise<AppData> {
  console.log('Loading all app data...');
  
  try {
    // Use Promise.all to fetch all files concurrently for speed
    const [
      stores,
      suppliers,
      skus,
      inventory,
      purchaseOrders,
      sales,
      forecasts,
    ] = await Promise.all([
      fetchJSON<Store[]>('stores.json'),
      fetchJSON<Supplier[]>('suppliers.json'),
      fetchJSON<SKU[]>('skus.json'),
      fetchJSON<Inventory[]>('inventory.json'),
      fetchJSON<PurchaseOrder[]>('purchase_orders.json'),
      fetchJSON<SaleTransaction[]>('sales_transactions.json'),
      fetchJSON<DemandForecast[]>('demand_forecast.json'),
    ]);

    console.log('App data loaded successfully!');

    // Return the single, organized object
    return {
      stores,
      suppliers,
      skus,
      inventory,
      purchaseOrders,
      sales,
      forecasts,
    };
  } catch (error) {
    console.error('Fatal error loading app data:', error);
    // Return an empty structure if the whole process fails
    return {
      stores: [],
      suppliers: [],
      skus: [],
      inventory: [],
      purchaseOrders: [],
      sales: [],
      forecasts: [],
    };
  }
}
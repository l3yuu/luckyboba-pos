import api from '../services/api';
import { setCache } from './cache';

export const prefetchAll = async () => {
  await Promise.allSettled([
    api.get('/dashboard/stats').then(r => setCache('dashboard-stats', r.data, 2 * 60 * 1000)),
    api.get('/inventory').then(r => setCache('inventory', r.data)),
    api.get('/categories').then(r => setCache('categories', r.data)),
    // ✅ Map to POItem shape before caching
    api.get('/purchase-orders').then(r => {
      const mappedOrders = r.data.orders.map((po: {
        id: number; po_number: string; supplier: string;
        total_amount: string | number; status: 'Pending' | 'Received' | 'Cancelled'; date_ordered: string;
      }) => ({
        id: po.id,
        poNumber: po.po_number,
        supplier: po.supplier,
        totalAmount: typeof po.total_amount === 'string' ? parseFloat(po.total_amount) : po.total_amount,
        status: po.status,
        dateOrdered: po.date_ordered
      }));
      setCache('purchase-orders', { orders: mappedOrders, stats: r.data.stats });
    }),
    // ✅ Store sub-categories in the correct bundled shape
    Promise.all([api.get('/sub-categories'), api.get('/categories')]).then(([subRes, catRes]) => {
      setCache('sub-categories', { subCategories: subRes.data, mainCategories: catRes.data });
    }),
    api.get('/item-serials').then(r => {
      const mapped = r.data.map((s: {
        id: number; item_name: string; serial_number: string;
        status: 'In Stock' | 'Sold' | 'Defective'; date_added: string;
      }) => ({
        id: s.id, itemName: s.item_name, serialNumber: s.serial_number,
        status: s.status, dateAdded: s.date_added
      }));
      setCache('item-serials|All Status|', mapped);
    }),
    api.get('/reports/inventory').then(r => setCache('reports-inventory', {
      metrics: r.data.metrics,
      criticalItems: r.data.criticalItems
    })),
    api.get('/inventory/top-products').then(r => {
      const top5 = r.data.products.slice(0, 5);
      setCache('inventory-top-products', { ...r.data, products: top5 });
    }),
  ]);
};
import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OnlineOrder {
  id: number;
  si_number: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  status: "pending" | "fulfilled" | "cancelled";
  created_at: string;
  items: OrderItem[];
}

// ── Print helper ──────────────────────────────────────────────────────────────
function printReceipt(order: OnlineOrder) {
  const win = window.open("", "_blank", "width=320,height=600");
  if (!win) return;
  const rows = order.items
    .map(
      (i) =>
        `<tr>
          <td>${i.quantity}x ${i.name}</td>
          <td style="text-align:right">₱${(i.price * i.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  win.document.write(`
    <html><head><title>Receipt</title>
    <style>
      body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 8px; }
      h2 { text-align:center; margin:0; font-size:14px; }
      p  { text-align:center; margin:4px 0; font-size:11px; }
      table { width:100%; border-collapse:collapse; margin-top:8px; }
      td { padding: 2px 0; }
      .total { border-top: 1px dashed #000; font-weight:bold; padding-top:4px; }
      .footer { text-align:center; margin-top:8px; font-size:10px; }
    </style></head><body>
    <h2>Lucky Boba Milk Tea</h2>
    <p>SI#: ${order.si_number}</p>
    <p>${order.created_at}</p>
    <p>Customer: ${order.customer_name}</p>
    <p>Payment: ${order.payment_method.toUpperCase()}</p>
    <hr/>
    <table>${rows}
      <tr class="total">
        <td>TOTAL</td>
        <td style="text-align:right">₱${Number(order.total_amount).toFixed(2)}</td>
      </tr>
    </table>
    <p class="footer">Thank you for your order!</p>
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}

// ── Main Component ────────────────────────────────────────────────────────────
const OnlineOrdersTab: React.FC = () => {
  const [orders, setOrders]           = useState<OnlineOrder[]>([]);
  const [loading, setLoading]         = useState(false);
  const [selectedOrder, setSelected]  = useState<OnlineOrder | null>(null);
  const [fulfilling, setFulfilling]   = useState<number | null>(null);
  const [voiding, setVoiding]         = useState<number | null>(null);
  const [voidReason, setVoidReason]   = useState("");
  const [showVoidModal, setShowVoid]  = useState<OnlineOrder | null>(null);
  const [filter, setFilter]           = useState<"all" | "pending" | "fulfilled">("pending");
  const prevPendingCount              = useRef(0);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/sales/online-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: OnlineOrder[] = res.data;

      // Play sound if new pending orders arrived
      const newPending = data.filter((o) => o.status === "pending").length;
      if (newPending > prevPendingCount.current) {
        try { new Audio("/notification.mp3").play(); } catch (_) {}
      }
      prevPendingCount.current = newPending;
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch online orders", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ── Fulfill ────────────────────────────────────────────────────────────────
  const handleFulfill = async (order: OnlineOrder) => {
    setFulfilling(order.id);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`/api/sales/${order.id}/fulfill`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prev) =>
        prev.map((o) => o.id === order.id ? { ...o, status: "fulfilled" } : o)
      );
      if (selectedOrder?.id === order.id)
        setSelected({ ...order, status: "fulfilled" });
    } catch {
      alert("Failed to fulfill order. Please try again.");
    } finally {
      setFulfilling(null);
    }
  };

  // ── Void ───────────────────────────────────────────────────────────────────
  const handleVoid = async () => {
    if (!showVoidModal || !voidReason.trim()) return;
    setVoiding(showVoidModal.id);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/sales/${showVoidModal.id}/cancel`,
        { reason: voidReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.id === showVoidModal.id ? { ...o, status: "cancelled" } : o
        )
      );
      if (selectedOrder?.id === showVoidModal.id)
        setSelected(null);
      setShowVoid(null);
      setVoidReason("");
    } catch {
      alert("Failed to void order. Please try again.");
    } finally {
      setVoiding(null);
    }
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const displayed = orders.filter((o) => {
    if (filter === "pending")   return o.status === "pending";
    if (filter === "fulfilled") return o.status === "fulfilled";
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  // ── Status chip ────────────────────────────────────────────────────────────
  const statusChip = (status: string) => {
    const map: Record<string, string> = {
      pending:   "bg-orange-100 text-orange-700 border border-orange-300",
      fulfilled: "bg-green-100  text-green-700  border border-green-300",
      cancelled: "bg-red-100    text-red-600    border border-red-300",
    };
    return (
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${map[status] ?? ""}`}>
        {status}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden">

      {/* ── LEFT: order list ─────────────────────────────────────────────── */}
      <div className="w-96 flex flex-col border-r border-gray-200 bg-gray-50">

        {/* Toolbar */}
        <div className="p-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800">Online Orders</span>
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                  {pendingCount}
                </span>
              )}
            </div>
            <button
              onClick={() => fetchOrders()}
              disabled={loading}
              className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-40"
            >
              {loading ? "Loading…" : "↻ Refresh"}
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {(["pending", "fulfilled", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 text-xs py-1 rounded-md font-medium capitalize transition ${
                  filter === f
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {displayed.length === 0 && (
            <div className="text-center text-gray-400 pt-16 text-sm">
              No {filter} orders.
            </div>
          )}
          {displayed.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelected(order)}
              className={`w-full text-left rounded-xl p-3 border transition shadow-sm ${
                selectedOrder?.id === order.id
                  ? "border-purple-500 bg-purple-50"
                  : order.status === "pending"
                  ? "border-orange-200 bg-orange-50 hover:border-orange-400"
                  : "border-gray-200 bg-white hover:border-gray-300 opacity-70"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                {statusChip(order.status)}
                <span className="font-bold text-sm text-gray-800">
                  ₱{Number(order.total_amount).toFixed(2)}
                </span>
              </div>
              <p className="font-mono text-xs font-semibold text-gray-600 truncate">
                {order.si_number}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {order.customer_name} · {order.created_at}
              </p>
              <p className="text-[11px] text-gray-400">
                {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                {order.payment_method.toUpperCase()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT: order detail ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white">
        {!selectedOrder ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <span className="text-6xl mb-3">📋</span>
            <p className="text-sm">Select an order to view details</p>
          </div>
        ) : (
          <>
            {/* Detail header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-gray-800">Order Details</h2>
                {statusChip(selectedOrder.status)}
              </div>
              <p className="font-mono text-sm text-purple-600 font-bold">
                {selectedOrder.si_number}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {selectedOrder.customer_name} · {selectedOrder.created_at}
              </p>
              <p className="text-xs text-gray-400">
                Payment: {selectedOrder.payment_method.toUpperCase()}
              </p>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Order Items
              </p>
              <div className="space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2 border-b border-gray-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.quantity} × ₱{Number(item.price).toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold text-gray-700 text-sm">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
                <span className="font-bold text-gray-800">Total</span>
                <span className="text-xl font-black text-purple-600">
                  ₱{Number(selectedOrder.total_amount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-5 border-t border-gray-100 space-y-2">
              {/* Print - always available */}
              <button
                onClick={() => printReceipt(selectedOrder)}
                className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                🖨️ Print Receipt
              </button>

              {selectedOrder.status === "pending" && (
                <>
                  {/* Fulfill */}
                  <button
                    onClick={() => handleFulfill(selectedOrder)}
                    disabled={fulfilling === selectedOrder.id}
                    className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {fulfilling === selectedOrder.id ? (
                      "Processing…"
                    ) : (
                      <>✓ Mark as Fulfilled</>
                    )}
                  </button>

                  {/* Void */}
                  <button
                    onClick={() => setShowVoid(selectedOrder)}
                    className="w-full py-2.5 rounded-xl border border-red-300 text-red-500 font-semibold text-sm hover:bg-red-50 transition flex items-center justify-center gap-2"
                  >
                    ✕ Void Order
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Void confirmation modal ───────────────────────────────────────── */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-96">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Void Order</h3>
            <p className="text-sm text-gray-500 mb-4">
              You are about to void{" "}
              <span className="font-mono font-semibold text-red-500">
                {showVoidModal.si_number}
              </span>
              . Please provide a reason.
            </p>
            <textarea
              className="w-full border border-gray-300 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              rows={3}
              placeholder="Reason for voiding..."
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowVoid(null); setVoidReason(""); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVoid}
                disabled={!voidReason.trim() || voiding === showVoidModal.id}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm disabled:opacity-50 transition"
              >
                {voiding === showVoidModal.id ? "Voiding…" : "Confirm Void"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineOrdersTab;
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

type Order = {
  id:            number;
  title:         string;
  author:        string;
  price:         number;
  provider:      string;
  status:        string;
  created_at:    string;
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  confirmed: { bg: "#dcfce7", color: "#16a34a", label: "✅ Confirmed" },
  pending:   { bg: "#fef9c3", color: "#ca8a04", label: "⏳ Pending"   },
  cancelled: { bg: "#fee2e2", color: "#dc2626", label: "❌ Cancelled"  },
};

export default function Orders() {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  async function load() {
    try {
      const res  = await fetch(`${API_BASE}/api/orders`, { credentials: "include" });
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function cancel(id: number) {
    await fetch(`${API_BASE}/api/orders/${id}`, {
      method: "DELETE", credentials: "include",
    });
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "cancelled" } : o));
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <h2>🛒 My Orders</h2>
      <Link to="/">← Home</Link>

      {loading && <p style={{ opacity: 0.6 }}>Loading…</p>}
      {error   && <p style={{ color: "crimson" }}>{error}</p>}

      {!loading && orders.length === 0 && (
        <p style={{ opacity: 0.6, marginTop: 16 }}>
          No orders yet. <Link to="/scan">Scan a shelf</Link> and order a book!
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        {orders.map((order) => {
          const s = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;
          return (
            <div key={order.id} style={{
              padding: 16, marginBottom: 12,
              border: "1px solid #e5e7eb", borderRadius: 10,
              background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{order.title}</div>
                  {order.author && (
                    <div style={{ opacity: 0.6, fontSize: 13, marginTop: 2 }}>by {order.author}</div>
                  )}
                  <div style={{ marginTop: 6, fontSize: 13, display: "flex", gap: 12 }}>
                    <span>💰 <strong>${order.price}</strong></span>
                    <span>📦 {order.provider}</span>
                    <span style={{ opacity: 0.5 }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <span style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 12,
                    background: s.bg, color: s.color, fontWeight: 600,
                  }}>
                    {s.label}
                  </span>
                  {order.status === "confirmed" && (
                    <button onClick={() => cancel(order.id)} style={{
                      padding: "4px 10px", fontSize: 12, borderRadius: 6,
                      background: "#fee2e2", color: "#dc2626",
                      border: "1px solid #fca5a5", cursor: "pointer",
                    }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

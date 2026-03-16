import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

type Book = { title: string; author?: string; confidence?: number };
type Recommendation = { title: string; author?: string; reason?: string; score?: number };
type LocationState = { scan_id: number; books_found: Book[]; recommendations: Recommendation[]; cached?: boolean };

type AvailabilityInfo = { price: number; available: boolean; provider: string; delivery_days: number };
type OrderState = "idle" | "checking" | "available" | "unavailable" | "ordering" | "ordered";

type BookOrderState = {
  state:    OrderState;
  info?:    AvailabilityInfo;
  order_id?: number;
  message?: string;
};

export default function Results() {
  const location                = useLocation();
  const state                   = location.state as LocationState | null;
  const [showRecs, setShowRecs] = useState(false);
  const [saved,    setSaved]    = useState<Record<string, boolean>>({});
  const [toast,    setToast]    = useState("");
  const [orderMap, setOrderMap] = useState<Record<string, BookOrderState>>({});

  if (!state) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
        <h2>Results</h2>
        <p>No results found.</p>
        <Link to="/scan">← Scan Again</Link>
      </div>
    );
  }

  const { scan_id, books_found = [], recommendations = [], cached } = state;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function setOrder(title: string, update: Partial<BookOrderState>) {
    setOrderMap((prev) => ({ ...prev, [title]: { state: "idle", ...prev[title], ...update } }));
  }

  async function saveBook(book: Book | Recommendation, status: string) {
    try {
      const res     = await fetch(`${API_BASE}/api/reading-history`, { credentials: "include" });
      const history: any[] = await res.json();
      if (!history.find((b) => b.title === book.title)) {
        history.push({ title: book.title, author: book.author ?? "", status, added_at: new Date().toISOString() });
        await fetch(`${API_BASE}/api/reading-history`, {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(history),
        });
      }
      setSaved((prev) => ({ ...prev, [book.title]: true }));
      showToast(`"${book.title}" saved to reading list ✅`);
    } catch (e: any) { showToast(`Error: ${e.message}`); }
  }

  async function checkAvailability(book: Recommendation) {
    setOrder(book.title, { state: "checking" });
    try {
      const res  = await fetch(
        `${API_BASE}/api/orders/check?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author ?? "")}`,
        { credentials: "include" }
      );
      const data: AvailabilityInfo = await res.json();
      setOrder(book.title, { state: data.available ? "available" : "unavailable", info: data });
    } catch (e: any) {
      setOrder(book.title, { state: "idle" });
      showToast(`Error: ${e.message}`);
    }
  }

  async function placeOrder(book: Recommendation) {
    setOrder(book.title, { state: "ordering" });
    try {
      const res  = await fetch(`${API_BASE}/api/orders`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: book.title, author: book.author, scan_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrder(book.title, { state: "ordered", order_id: data.order_id, message: data.message });
      showToast(`🎉 Order placed for "${book.title}"!`);
    } catch (e: any) {
      setOrder(book.title, { state: "available" });
      showToast(`Error: ${e.message}`);
    }
  }

  function OrderButton({ book }: { book: Recommendation }) {
    const o = orderMap[book.title] ?? { state: "idle" };

    if (o.state === "idle") return (
      <button onClick={() => checkAvailability(book)} style={{
        padding: "6px 14px", fontSize: 13, borderRadius: 6, cursor: "pointer",
        background: "#2563eb", color: "white", border: "none", whiteSpace: "nowrap",
      }}>
        🛒 Order
      </button>
    );

    if (o.state === "checking") return (
      <span style={{ fontSize: 13, opacity: 0.6 }}>Checking…</span>
    );

    if (o.state === "unavailable") return (
      <span style={{ fontSize: 13, color: "#dc2626" }}>❌ Unavailable</span>
    );

    if (o.state === "available" && o.info) return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
          ${o.info.price} · {o.info.provider}
        </div>
        <div style={{ fontSize: 11, opacity: 0.6 }}>Arrives in {o.info.delivery_days} days</div>
        <button onClick={() => placeOrder(book)} style={{
          marginTop: 6, padding: "6px 14px", fontSize: 13, borderRadius: 6, cursor: "pointer",
          background: "#16a34a", color: "white", border: "none",
        }}>
          Confirm Order
        </button>
      </div>
    );

    if (o.state === "ordering") return (
      <span style={{ fontSize: 13, opacity: 0.6 }}>Placing order…</span>
    );

    if (o.state === "ordered") return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✅ Ordered!</div>
        <div style={{ fontSize: 11, opacity: 0.6 }}>Order #{o.order_id}</div>
      </div>
    );

    return null;
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <Link to="/">← Home</Link>

      {toast && (
        <div style={{
          position: "fixed", top: 16, right: 16, background: "#1e3a5f",
          color: "white", padding: "10px 18px", borderRadius: 8,
          fontSize: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.2)", zIndex: 999,
        }}>{toast}</div>
      )}

      {/* Books found */}
      <h2 style={{ marginTop: 16 }}>📖 Books Found on Shelf</h2>
      <p style={{ opacity: 0.6, fontSize: 13 }}>Scan #{scan_id}{cached ? " · cached" : ""}</p>

      {books_found.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No books detected.</p>
      ) : books_found.map((book, i) => (
        <div key={i} style={{
          padding: 14, marginBottom: 10, border: "1px solid #e5e7eb",
          borderRadius: 8, background: "#fafafa",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontWeight: 700 }}>{book.title}</div>
            {book.author && <div style={{ opacity: 0.6, fontSize: 13 }}>by {book.author}</div>}
            {book.confidence != null && (
              <div style={{ fontSize: 11, opacity: 0.5 }}>
                Confidence: {Math.round(book.confidence * 100)}%
              </div>
            )}
          </div>
          <button onClick={() => saveBook(book, "read")} disabled={saved[book.title]} style={{
            padding: "6px 14px", fontSize: 13, borderRadius: 6, marginLeft: 12,
            background: saved[book.title] ? "#86efac" : "#16a34a",
            color: "white", border: "none",
            cursor: saved[book.title] ? "default" : "pointer",
          }}>
            {saved[book.title] ? "Saved ✅" : "Save"}
          </button>
        </div>
      ))}

      {/* Recommend button */}
      {!showRecs && (
        <button onClick={() => setShowRecs(true)} style={{
          marginTop: 20, padding: "12px 28px", fontSize: 16,
          background: "#2563eb", color: "white", border: "none",
          borderRadius: 8, cursor: "pointer",
        }}>
          ✨ Recommend Books for Me
        </button>
      )}

      {/* Recommendations with Order buttons */}
      {showRecs && (
        <div style={{ marginTop: 24 }}>
          <h2>✨ Recommended for You</h2>
          <p style={{ opacity: 0.6, fontSize: 13 }}>
            Click <strong>🛒 Order</strong> to check price and availability
          </p>

          {recommendations.length === 0 ? (
            <p style={{ opacity: 0.6 }}>No recommendations available.</p>
          ) : recommendations.map((book, i) => (
            <div key={i} style={{
              padding: 16, marginBottom: 12,
              border: "1px solid #2563eb", borderRadius: 8, background: "#eff6ff",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{i + 1}. {book.title}</div>
                {book.author && <div style={{ opacity: 0.6, fontSize: 13, marginTop: 2 }}>by {book.author}</div>}
                {book.reason && (
                  <div style={{
                    marginTop: 8, fontSize: 13, opacity: 0.8,
                    borderLeft: "3px solid #2563eb", paddingLeft: 10,
                  }}>{book.reason}</div>
                )}
                <button onClick={() => saveBook(book, "want_to_read")} disabled={saved[book.title]}
                  style={{
                    marginTop: 10, padding: "4px 12px", fontSize: 12, borderRadius: 6,
                    background: saved[book.title] ? "#93c5fd" : "white",
                    color: saved[book.title] ? "white" : "#2563eb",
                    border: "1px solid #2563eb", cursor: saved[book.title] ? "default" : "pointer",
                  }}>
                  {saved[book.title] ? "Saved ✅" : "🔖 Want to Read"}
                </button>
              </div>
              <div style={{ flexShrink: 0 }}>
                <OrderButton book={book} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/scan"><button style={{ padding: "10px 20px" }}>📷 Scan Another</button></Link>
        <Link to="/orders"><button style={{ padding: "10px 20px" }}>🛒 My Orders</button></Link>
        <Link to="/reading-history"><button style={{ padding: "10px 20px" }}>📖 Reading List</button></Link>
      </div>
    </div>
  );
}

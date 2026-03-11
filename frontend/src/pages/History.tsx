import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

type BookEntry = {
  title:    string;
  author?:  string;
  status:   string;
  added_at?: string;
};

const STATUS_LABELS: Record<string, string> = {
  read:         "✅ Read",
  want_to_read: "🔖 Want to Read",
  reading:      "📖 Reading",
};

const STATUS_COLORS: Record<string, string> = {
  read:         "#dcfce7",
  want_to_read: "#eff6ff",
  reading:      "#fef9c3",
};

export default function ReadingHistory() {
  const [books,   setBooks]   = useState<BookEntry[]>([]);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/api/reading-history`, { credentials: "include" });
      const data = await res.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeBook(title: string) {
    const updated = books.filter((b) => b.title !== title);
    await fetch(`${API_BASE}/api/reading-history`, {
      method:      "POST",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify(updated),
    });
    setBooks(updated);
  }

  async function updateStatus(title: string, newStatus: string) {
    const updated = books.map((b) =>
      b.title === title ? { ...b, status: newStatus } : b
    );
    await fetch(`${API_BASE}/api/reading-history`, {
      method:      "POST",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify(updated),
    });
    setBooks(updated);
  }

  useEffect(() => { load(); }, []);

  const grouped = {
    reading:      books.filter((b) => b.status === "reading"),
    want_to_read: books.filter((b) => b.status === "want_to_read"),
    read:         books.filter((b) => b.status === "read"),
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h2>📖 Reading History</h2>
      <Link to="/">← Home</Link>

      {loading && <p style={{ opacity: 0.6 }}>Loading…</p>}
      {error   && <p style={{ color: "crimson" }}>{error}</p>}

      {!loading && books.length === 0 && (
        <p style={{ opacity: 0.6, marginTop: 16 }}>
          No books yet. <Link to="/scan">Scan a shelf</Link> and save books!
        </p>
      )}

      {(["reading", "want_to_read", "read"] as const).map((status) =>
        grouped[status].length === 0 ? null : (
          <div key={status} style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 10 }}>{STATUS_LABELS[status]}</h3>
            {grouped[status].map((book, i) => (
              <div key={i} style={{
                padding: 14, marginBottom: 10,
                border: "1px solid #ddd", borderRadius: 8,
                background: STATUS_COLORS[status],
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: 16 }}>{book.title}</div>
                  {book.author && (
                    <div style={{ marginTop: 4, opacity: 0.7, fontSize: 14 }}>
                      by {book.author}
                    </div>
                  )}
                  {book.added_at && (
                    <div style={{ marginTop: 4, fontSize: 11, opacity: 0.5 }}>
                      Added {new Date(book.added_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, marginLeft: 12, flexShrink: 0 }}>
                  <select
                    value={book.status}
                    onChange={(e) => updateStatus(book.title, e.target.value)}
                    style={{ fontSize: 12, padding: "4px 6px", borderRadius: 4 }}
                  >
                    <option value="want_to_read">Want to Read</option>
                    <option value="reading">Reading</option>
                    <option value="read">Read</option>
                  </select>
                  <button
                    onClick={() => removeBook(book.title)}
                    style={{
                      padding: "4px 10px", fontSize: 12,
                      background: "#fee2e2", color: "#dc2626",
                      border: "1px solid #fca5a5", borderRadius: 4, cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <div style={{ marginTop: 24 }}>
        <Link to="/scan">
          <button style={{ padding: "10px 20px" }}>📷 Scan a Shelf</button>
        </Link>
      </div>
    </div>
  );
}

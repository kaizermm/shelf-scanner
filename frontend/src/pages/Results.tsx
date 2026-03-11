import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

type Book = {
  title:       string;
  author?:     string;
  confidence?: number;
};

type Recommendation = {
  title:   string;
  author?: string;
  reason?: string;
  score?:  number;
};

type LocationState = {
  scan_id:         number;
  books_found:     Book[];
  recommendations: Recommendation[];
  cached?:         boolean;
};

export default function Results() {
  const location                = useLocation();
  const state                   = location.state as LocationState | null;
  const [showRecs, setShowRecs] = useState(false);
  const [saved,    setSaved]    = useState<Record<string, boolean>>({});
  const [status,   setStatus]   = useState("");

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

  async function saveBook(book: Book | Recommendation, status: string) {
    const key = book.title;
    try {
      // Load existing history
      const histRes = await fetch(`${API_BASE}/api/reading-history`, { credentials: "include" });
      const history: any[] = await histRes.json();

      // Check if already exists
      const exists = history.find((b: any) => b.title === book.title);
      if (!exists) {
        history.push({
          title:     book.title,
          author:    book.author ?? "",
          status,
          added_at:  new Date().toISOString(),
        });
        await fetch(`${API_BASE}/api/reading-history`, {
          method:      "POST",
          credentials: "include",
          headers:     { "Content-Type": "application/json" },
          body:        JSON.stringify(history),
        });
      }

      setSaved((prev) => ({ ...prev, [key]: true }));
      setStatus(`"${book.title}" saved to reading history ✅`);
      setTimeout(() => setStatus(""), 3000);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  }

  async function saveAllFound() {
    for (const book of books_found) {
      await saveBook(book, "read");
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <Link to="/">← Home</Link>

      {status && (
        <div style={{
          position: "fixed", top: 16, right: 16,
          background: "#22c55e", color: "white",
          padding: "10px 18px", borderRadius: 8, fontSize: 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}>
          {status}
        </div>
      )}

      {/* Books found on shelf */}
      <h2 style={{ marginTop: 16 }}>📖 Books Found on Shelf</h2>
      <p style={{ opacity: 0.6, fontSize: 13 }}>
        Scan #{scan_id}{cached ? " · cached" : ""}
      </p>

      {books_found.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No books detected.</p>
      ) : (
        <>
          <button
            onClick={saveAllFound}
            style={{
              marginBottom: 12, padding: "8px 16px",
              background: "#16a34a", color: "white",
              border: "none", borderRadius: 6, cursor: "pointer",
            }}
          >
            💾 Save All to Reading History
          </button>

          {books_found.map((book, i) => (
            <div key={i} style={{
              padding: 14, marginBottom: 10,
              border: "1px solid #ddd", borderRadius: 8,
              background: "#fafafa",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontWeight: "bold", fontSize: 16 }}>{book.title}</div>
                {book.author && (
                  <div style={{ marginTop: 4, opacity: 0.7 }}>by {book.author}</div>
                )}
                {book.confidence != null && (
                  <div style={{ marginTop: 4, fontSize: 12, opacity: 0.5 }}>
                    Confidence: {Math.round(book.confidence * 100)}%
                  </div>
                )}
              </div>
              <button
                onClick={() => saveBook(book, "read")}
                disabled={saved[book.title]}
                style={{
                  padding: "6px 14px", fontSize: 13,
                  background: saved[book.title] ? "#86efac" : "#16a34a",
                  color: "white", border: "none", borderRadius: 6,
                  cursor: saved[book.title] ? "default" : "pointer",
                  whiteSpace: "nowrap", marginLeft: 12,
                }}
              >
                {saved[book.title] ? "Saved ✅" : "Save"}
              </button>
            </div>
          ))}
        </>
      )}

      {/* Recommend button */}
      {!showRecs && (
        <button
          onClick={() => setShowRecs(true)}
          style={{
            marginTop: 20, padding: "12px 28px", fontSize: 16,
            background: "#2563eb", color: "white",
            border: "none", borderRadius: 8, cursor: "pointer",
          }}
        >
          ✨ Recommend Books for Me
        </button>
      )}

      {/* Recommendations */}
      {showRecs && (
        <div style={{ marginTop: 24 }}>
          <h2>✨ Recommended for You</h2>
          <p style={{ opacity: 0.6, fontSize: 13 }}>
            Based on your shelf and reading history
          </p>
          {recommendations.length === 0 ? (
            <p style={{ opacity: 0.6 }}>No recommendations available.</p>
          ) : (
            recommendations.map((book, i) => (
              <div key={i} style={{
                padding: 16, marginBottom: 12,
                border: "1px solid #2563eb", borderRadius: 8,
                background: "#eff6ff",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: 16 }}>
                    {i + 1}. {book.title}
                  </div>
                  {book.author && (
                    <div style={{ marginTop: 4, opacity: 0.7 }}>by {book.author}</div>
                  )}
                  {book.reason && (
                    <div style={{
                      marginTop: 8, fontSize: 14, opacity: 0.85,
                      borderLeft: "3px solid #2563eb", paddingLeft: 10,
                    }}>
                      {book.reason}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => saveBook(book, "want_to_read")}
                  disabled={saved[book.title]}
                  style={{
                    padding: "6px 14px", fontSize: 13,
                    background: saved[book.title] ? "#93c5fd" : "#2563eb",
                    color: "white", border: "none", borderRadius: 6,
                    cursor: saved[book.title] ? "default" : "pointer",
                    whiteSpace: "nowrap", marginLeft: 12, marginTop: 4,
                  }}
                >
                  {saved[book.title] ? "Saved ✅" : "Want to Read"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <Link to="/scan">
          <button style={{ padding: "10px 20px" }}>📷 Scan Another Shelf</button>
        </Link>
        <Link to="/reading-history">
          <button style={{ padding: "10px 20px" }}>📖 View Reading History</button>
        </Link>
      </div>
    </div>
  );
}

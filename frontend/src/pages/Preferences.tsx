import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const GENRE_OPTIONS = [
  "Fantasy", "Science Fiction", "Mystery", "Thriller", "Romance",
  "Historical Fiction", "Literary Fiction", "Horror", "Biography",
  "Self-Help", "Philosophy", "Science", "History", "Poetry"
];

const PACE_OPTIONS = ["Fast-paced", "Moderate", "Slow-burn"];
const LENGTH_OPTIONS = ["Short (< 300 pages)", "Medium (300-500 pages)", "Long (500+ pages)"];

export default function Preferences() {
  const [genres,    setGenres]    = useState<string[]>([]);
  const [avoid,     setAvoid]     = useState<string[]>([]);
  const [pace,      setPace]      = useState("");
  const [length,    setLength]    = useState("");
  const [notes,     setNotes]     = useState("");
  const [status,    setStatus]    = useState("");
  const [error,     setError]     = useState("");

  async function load() {
    try {
      const res  = await fetch(`${API_BASE}/api/preferences`, { credentials: "include" });
      const data = await res.json();
      setGenres(data.genres  ?? []);
      setAvoid(data.avoid    ?? []);
      setPace(data.pace      ?? "");
      setLength(data.length  ?? "");
      setNotes(data.notes    ?? "");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function save() {
    setError(""); setStatus("Saving…");
    try {
      await fetch(`${API_BASE}/api/preferences`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ genres, avoid, pace, length, notes }),
      });
      setStatus("Saved ✅");
      setTimeout(() => setStatus(""), 3000);
    } catch (e: any) {
      setError(e.message); setStatus("");
    }
  }

  function toggleGenre(g: string, list: string[], setter: (v: string[]) => void) {
    setter(list.includes(g) ? list.filter((x) => x !== g) : [...list, g]);
  }

  useEffect(() => { load(); }, []);

  const chip = (label: string, active: boolean, onClick: () => void, color = "#2563eb") => (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: "6px 14px", margin: "4px", fontSize: 13,
        borderRadius: 20, cursor: "pointer",
        background: active ? color : "#f3f4f6",
        color:      active ? "white" : "#374151",
        border:     active ? `1px solid ${color}` : "1px solid #d1d5db",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h2>⚙️ Preferences</h2>
      <Link to="/">← Home</Link>
      <p style={{ opacity: 0.6, fontSize: 13, marginTop: 4 }}>
        These preferences are sent to the AI to personalize your recommendations.
      </p>

      {/* Favourite genres */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 8 }}>📚 Favourite Genres</h3>
        <div>
          {GENRE_OPTIONS.map((g) =>
            chip(g, genres.includes(g), () => toggleGenre(g, genres, setGenres), "#2563eb")
          )}
        </div>
      </div>

      {/* Genres to avoid */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 8 }}>🚫 Genres to Avoid</h3>
        <div>
          {GENRE_OPTIONS.map((g) =>
            chip(g, avoid.includes(g), () => toggleGenre(g, avoid, setAvoid), "#dc2626")
          )}
        </div>
      </div>

      {/* Reading pace */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 8 }}>⚡ Preferred Pace</h3>
        <div>
          {PACE_OPTIONS.map((p) =>
            chip(p, pace === p, () => setPace(pace === p ? "" : p), "#7c3aed")
          )}
        </div>
      </div>

      {/* Book length */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 8 }}>📏 Preferred Length</h3>
        <div>
          {LENGTH_OPTIONS.map((l) =>
            chip(l, length === l, () => setLength(length === l ? "" : l), "#0891b2")
          )}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 8 }}>📝 Additional Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. I love books with strong female leads, no sad endings..."
          rows={4}
          style={{
            width: "100%", padding: 10, fontSize: 14,
            borderRadius: 8, border: "1px solid #d1d5db",
            fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Save button */}
      <button
        onClick={save}
        style={{
          marginTop: 20, padding: "12px 32px", fontSize: 16,
          background: "#2563eb", color: "white",
          border: "none", borderRadius: 8, cursor: "pointer",
        }}
      >
        Save Preferences
      </button>

      {status && <span style={{ marginLeft: 16, color: "#16a34a" }}>{status}</span>}
      {error  && <div style={{ marginTop: 10, color: "crimson" }}>{error}</div>}
    </div>
  );
}

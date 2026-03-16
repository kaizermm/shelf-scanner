import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setReady(d.ok))
      .catch(() => setReady(false));
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 64 }}>📚</div>
        <h1 style={{ color: "white", fontSize: 40, margin: "12px 0 8px", fontWeight: 800 }}>
          Shelf Scanner
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, margin: 0 }}>
          Point your camera at a bookshelf — get personalised recommendations instantly
        </p>
        <div style={{
          marginTop: 12, display: "inline-block",
          padding: "4px 12px", borderRadius: 20,
          background: ready ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
          color: ready ? "#86efac" : "#fca5a5", fontSize: 12,
        }}>
          {ready ? "● API connected" : "● API offline"}
        </div>
      </div>

      <Link to="/scan" style={{ textDecoration: "none", marginBottom: 32 }}>
        <div style={{
          background: "white", borderRadius: 20,
          padding: "28px 48px", textAlign: "center",
          cursor: "pointer", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <div style={{ fontSize: 48 }}>📷</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1e3a5f", marginTop: 8 }}>
            Scan a Shelf
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            Upload a photo to get AI recommendations
          </div>
        </div>
      </Link>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { to: "/orders",          icon: "🛒", label: "My Orders"      },
          { to: "/history",         icon: "🕓", label: "Scan History"   },
          { to: "/reading-history", icon: "📖", label: "Reading List"   },
          { to: "/preferences",     icon: "⚙️", label: "Preferences"    },
        ].map(({ to, icon, label }) => (
          <Link key={to} to={to} style={{ textDecoration: "none" }}>
            <div style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 14, padding: "16px 24px",
              textAlign: "center", cursor: "pointer", minWidth: 110,
              color: "white",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            >
              <div style={{ fontSize: 28 }}>{icon}</div>
              <div style={{ fontSize: 13, marginTop: 6, fontWeight: 500 }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

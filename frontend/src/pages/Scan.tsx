import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function Scan() {
  const navigate = useNavigate();
  const [file,    setFile]    = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : "");
    setError("");
  }

  async function upload() {
    if (!file) { setError("Pick an image first."); return; }
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch(`${API_BASE}/api/scans`, {
        method:      "POST",
        credentials: "include",
        body:        form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      console.log("Scan result:", data);
      navigate("/results", { state: data });
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h2>📷 Scan a Shelf</h2>
      <Link to="/">← Home</Link>
      <div style={{ marginTop: 16 }}>
        <input type="file" accept="image/*" capture="environment" onChange={onFileChange} />
      </div>
      {preview && (
        <img src={preview} alt="Preview"
          style={{ marginTop: 12, maxWidth: "100%", maxHeight: 300, borderRadius: 8 }} />
      )}
      <button onClick={upload} disabled={loading || !file}
        style={{ marginTop: 16, padding: "10px 24px", fontSize: 16 }}>
        {loading ? "Scanning… this may take 10–20 seconds" : "Scan Shelf"}
      </button>
      {error && <div style={{ marginTop: 12, color: "crimson" }}>{error}</div>}
    </div>
  );
}

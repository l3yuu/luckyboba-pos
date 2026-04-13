import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Edit3, Eye, EyeOff, GripVertical, Upload, X, Image as ImageIcon, Sparkles,
} from "lucide-react";

/* ── Helpers ────────────────────────────────────────────────────── */
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";

const api = async (path: string, opts: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  // Don't set Content-Type for FormData
  if (!(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`/api${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

/* ── Types ──────────────────────────────────────────────────────── */
interface FeaturedDrink {
  id: number;
  title: string;
  subtitle: string | null;
  image: string | null;
  image_url: string | null;
  cta_text: string;
  is_active: boolean;
  sort_order: number;
}

/* ── Component ──────────────────────────────────────────────────── */
const FeaturedDrinksTab = () => {
  const [items, setItems]         = useState<FeaturedDrink[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<FeaturedDrink | null>(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<number | null>(null);

  // Form state
  const [title, setTitle]         = useState("");
  const [subtitle, setSubtitle]   = useState("");
  const [ctaText, setCtaText]     = useState("ORDER NOW");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const data = await api("/featured-drinks");
      setItems(data);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setTitle(""); setSubtitle(""); setCtaText("ORDER NOW");
    setImageFile(null); setPreview(null); setEditing(null); setShowForm(false);
  };

  const openEdit = (item: FeaturedDrink) => {
    setEditing(item);
    setTitle(item.title);
    setSubtitle(item.subtitle || "");
    setCtaText(item.cta_text);
    setPreview(item.image_url);
    setImageFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("subtitle", subtitle);
      fd.append("cta_text", ctaText);
      if (imageFile) fd.append("image", imageFile);
      fd.append("is_active", "1");
      fd.append("sort_order", String(items.length));

      if (editing) {
        await api(`/featured-drinks/${editing.id}`, { method: "POST", body: fd });
      } else {
        await api("/featured-drinks", { method: "POST", body: fd });
      }
      resetForm();
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this featured drink?")) return;
    setDeleting(id);
    try {
      await api(`/featured-drinks/${id}`, { method: "DELETE" });
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await api(`/featured-drinks/${id}/toggle`, { method: "PATCH" });
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div style={{ padding: "28px 32px", fontFamily: "'DM Sans', sans-serif", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1a0f2e", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={20} color="#7c3aed" />
            Featured Drinks
          </h2>
          <p style={{ fontSize: "0.82rem", color: "#71717a", margin: "4px 0 0", fontWeight: 500 }}>
            Manage hero banners shown on the mobile app homepage
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 22px", fontSize: "0.78rem", fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#fff", background: "linear-gradient(135deg, #7c3aed, #3b2063)",
            border: "none", borderRadius: "0.7rem", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
            transition: "transform 0.12s, box-shadow 0.12s",
          }}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Plus size={15} /> Add Featured
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
        }}>
          <form onSubmit={handleSubmit} style={{
            background: "#fff", width: "100%", maxWidth: 480,
            borderRadius: "1.25rem", padding: 32,
            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1a0f2e", margin: 0 }}>
                {editing ? "Edit Featured Drink" : "New Featured Drink"}
              </h3>
              <button type="button" onClick={resetForm} style={{
                width: 32, height: 32, borderRadius: "50%", border: "none",
                background: "#f4f4f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <X size={14} color="#71717a" />
              </button>
            </div>

            {/* Image upload */}
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              width: "100%", height: 160, borderRadius: "0.85rem",
              border: "2px dashed #d4d4d8", cursor: "pointer", marginBottom: 20,
              background: preview ? `url(${preview}) center/cover no-repeat` : "#fafafa",
              position: "relative", overflow: "hidden",
              transition: "border-color 0.15s",
            }}>
              {!preview && (
                <>
                  <Upload size={28} color="#a1a1aa" />
                  <span style={{ fontSize: "0.78rem", color: "#a1a1aa", marginTop: 8, fontWeight: 600 }}>
                    Click to upload banner image
                  </span>
                </>
              )}
              {preview && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center", opacity: 0,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                >
                  <ImageIcon size={22} color="#fff" />
                  <span style={{ color: "#fff", fontSize: "0.75rem", fontWeight: 700, marginLeft: 8 }}>Change Image</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
            </label>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#71717a", display: "block", marginBottom: 6 }}>
                Title *
              </label>
              <input
                required value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Cheese Series"
                style={{
                  width: "100%", padding: "10px 14px", fontSize: "0.88rem", fontWeight: 500,
                  border: "1.5px solid #e4e4e7", borderRadius: "0.6rem", outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => (e.target.style.borderColor = "#7c3aed")}
                onBlur={e => (e.target.style.borderColor = "#e4e4e7")}
              />
            </div>

            {/* Subtitle */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#71717a", display: "block", marginBottom: 6 }}>
                Subtitle
              </label>
              <input
                value={subtitle} onChange={e => setSubtitle(e.target.value)}
                placeholder="e.g. Premium Collection"
                style={{
                  width: "100%", padding: "10px 14px", fontSize: "0.88rem", fontWeight: 500,
                  border: "1.5px solid #e4e4e7", borderRadius: "0.6rem", outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => (e.target.style.borderColor = "#7c3aed")}
                onBlur={e => (e.target.style.borderColor = "#e4e4e7")}
              />
            </div>

            {/* CTA Text */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#71717a", display: "block", marginBottom: 6 }}>
                Button Text
              </label>
              <input
                value={ctaText} onChange={e => setCtaText(e.target.value)}
                placeholder="ORDER NOW"
                style={{
                  width: "100%", padding: "10px 14px", fontSize: "0.88rem", fontWeight: 500,
                  border: "1.5px solid #e4e4e7", borderRadius: "0.6rem", outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => (e.target.style.borderColor = "#7c3aed")}
                onBlur={e => (e.target.style.borderColor = "#e4e4e7")}
              />
            </div>

            {/* Submit */}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={resetForm} style={{
                flex: 1, padding: "12px", fontSize: "0.72rem", fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase",
                color: "#71717a", background: "#fff", border: "1.5px solid #e4e4e7",
                borderRadius: "0.6rem", cursor: "pointer",
              }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={{
                flex: 1, padding: "12px", fontSize: "0.72rem", fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase",
                color: "#fff", background: saving ? "#a78bfa" : "linear-gradient(135deg, #7c3aed, #3b2063)",
                border: "none", borderRadius: "0.6rem", cursor: saving ? "not-allowed" : "pointer",
              }}>
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: 100, borderRadius: "1rem", background: "#f4f4f5",
              animation: "sa-pulse 2s ease-in-out infinite",
            }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "#fafafa", borderRadius: "1rem", border: "1.5px dashed #e4e4e7",
        }}>
          <Sparkles size={36} color="#d4d4d8" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#71717a", margin: "0 0 6px" }}>
            No featured drinks yet
          </p>
          <p style={{ fontSize: "0.78rem", color: "#a1a1aa", margin: 0 }}>
            Add your first promo banner to display on the mobile app
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: 14, borderRadius: "1rem",
              background: "#fff", border: "1.5px solid #f0f0f2",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              transition: "box-shadow 0.15s, border-color 0.15s",
              opacity: item.is_active ? 1 : 0.55,
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.1)"; e.currentTarget.style.borderColor = "#ede8ff"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#f0f0f2"; }}
            >
              {/* Grip */}
              <GripVertical size={16} color="#d4d4d8" style={{ flexShrink: 0 }} />

              {/* Image thumbnail */}
              <div style={{
                width: 100, height: 64, borderRadius: "0.65rem", flexShrink: 0,
                background: item.image_url ? `url(${item.image_url}) center/cover` : "linear-gradient(135deg, #ede8ff, #ddd5ff)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {!item.image_url && <ImageIcon size={20} color="#a78bfa" />}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1a0f2e", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.title}
                </p>
                <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "#a1a1aa", margin: 0 }}>
                  {item.subtitle || "No subtitle"} · <span style={{ color: "#7c3aed", fontWeight: 600 }}>{item.cta_text}</span>
                </p>
              </div>

              {/* Status badge */}
              <span style={{
                padding: "4px 12px", borderRadius: "0.5rem",
                fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                background: item.is_active ? "#d1fae5" : "#f3f4f6",
                color: item.is_active ? "#065f46" : "#6b7280",
              }}>
                {item.is_active ? "Live" : "Hidden"}
              </span>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => handleToggle(item.id)} title={item.is_active ? "Hide" : "Show"} style={{
                  width: 34, height: 34, borderRadius: "0.5rem", border: "1.5px solid #e4e4e7",
                  background: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f4f2ff")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  {item.is_active ? <EyeOff size={14} color="#71717a" /> : <Eye size={14} color="#71717a" />}
                </button>
                <button onClick={() => openEdit(item)} title="Edit" style={{
                  width: 34, height: 34, borderRadius: "0.5rem", border: "1.5px solid #e4e4e7",
                  background: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f4f2ff")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  <Edit3 size={14} color="#7c3aed" />
                </button>
                <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id} title="Delete" style={{
                  width: 34, height: 34, borderRadius: "0.5rem", border: "1.5px solid #fee2e2",
                  background: "#fff", cursor: deleting === item.id ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#fff0f0")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  <Trash2 size={14} color="#be2525" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      <div style={{
        marginTop: 28, padding: "14px 18px", borderRadius: "0.75rem",
        background: "#f5f3ff", border: "1.5px solid #ede8ff",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <Sparkles size={16} color="#7c3aed" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: "0.78rem", color: "#3b2063", margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
          <strong>Tip:</strong> Featured drinks appear as hero banners on the mobile app homepage.
          Upload eye-catching images (recommended: 800×400px) and keep titles short for the best look.
          Toggle visibility to show/hide without deleting.
        </p>
      </div>
    </div>
  );
};

export default FeaturedDrinksTab;

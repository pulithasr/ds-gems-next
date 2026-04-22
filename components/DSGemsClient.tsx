"use client";  // ← ADD THIS as the very first line

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";  // ← CHANGE import path
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";

// ── CLOUDINARY CONFIG ── (keep as-is)
const CLOUD_NAME = "dixrukvmw";
const UPLOAD_PRESET = "ds_gems_unsigned";

// ... paste ALL your existing code (INITIAL_GEMS, CATEGORIES, 
//     GEM_COLORS, BADGE_STYLES, all components) exactly as-is ...

// ── ONLY CHANGE the bottom export: ──

async function uploadToCloudinary(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const isVideo = file.type.startsWith("video/");
  const resourceType = isVideo ? "video" : "image";
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || "Upload failed");
  return { url: data.secure_url, type: resourceType };
}

// ─── SAMPLE DATA ──────────────────────────────────────────────────────────────
const INITIAL_GEMS = [
  { id: 1, name: "Ceylon Blue Sapphire", origin: "Sri Lanka", weight: "4.82 ct", clarity: "Eye Clean", treatment: "Heat Only", price: "USD 3,200", category: "Sapphire", featured: true, description: "Vivid cornflower blue with excellent saturation. GIA certified. Ideal cut with outstanding brilliance.", badge: "New Arrival", images: [], video: "" },
  { id: 2, name: "Burmese Ruby", origin: "Myanmar", weight: "2.15 ct", clarity: "Slightly Included", treatment: "No Heat", price: "USD 8,500", category: "Ruby", featured: true, description: "Pigeon blood red with strong fluorescence. AGL certified. Unheated and untreated – museum quality.", badge: "Rare", images: [], video: "" },
  { id: 3, name: "Colombian Emerald", origin: "Colombia", weight: "3.60 ct", clarity: "Eye Clean", treatment: "Minor Oil", price: "USD 5,100", category: "Emerald", featured: false, description: "Intense vivid green with characteristic jardin. Certified by Gübelin. Exceptional transparency.", badge: "", images: [], video: "" },
  { id: 4, name: "Padparadscha Sapphire", origin: "Sri Lanka", weight: "1.98 ct", clarity: "Eye Clean", treatment: "No Heat", price: "USD 7,200", category: "Sapphire", featured: true, description: "Rare lotus pink-orange hue. GRS certified padparadscha. Unheated, extremely collectible.", badge: "Sold", images: [], video: "" },
  { id: 5, name: "Alexandrite", origin: "Brazil", weight: "1.42 ct", clarity: "Eye Clean", treatment: "No Treatment", price: "USD 4,900", category: "Alexandrite", featured: false, description: "Strong color change from teal green to purplish red. GIA certified. Exceptional shift under incandescent light.", badge: "New Arrival", images: [], video: "" },
  { id: 6, name: "Tanzanite", origin: "Tanzania", weight: "6.74 ct", clarity: "Eye Clean", treatment: "Heat Only", price: "USD 2,400", category: "Tanzanite", featured: false, description: "Deep velvety violet-blue with strong trichroism. AAA grade with excellent cut and polish.", badge: "", images: [], video: "" },
];

const CATEGORIES = ["All", "Sapphire", "Ruby", "Emerald", "Alexandrite", "Tanzanite"];

const GEM_COLORS = {
  Sapphire:    { bg: "#1a3a6b", light: "#d4e3f7", dot: "#4a90d9" },
  Ruby:        { bg: "#6b1a1a", light: "#f7d4d4", dot: "#d94a4a" },
  Emerald:     { bg: "#06402b", light: "#d4f0e3", dot: "#2e9e6b" },
  Alexandrite: { bg: "#3a1a6b", light: "#e8d4f7", dot: "#8a4ad9" },
  Tanzanite:   { bg: "#2a1a6b", light: "#ddd4f7", dot: "#6a4ad9" },
};

const BADGE_STYLES = {
  "New Arrival": { bg: "#06402b", color: "#a8f0c8" },
  Rare:          { bg: "#6b1a1a", color: "#f7c4c4" },
  Sold:          { bg: "#444",    color: "#ccc" },
};

function DiamondIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <polygon points="14,2 26,10 14,26 2,10" fill="#a8f0c8" fillOpacity="0.9" />
      <polygon points="14,2 26,10 14,14" fill="white" fillOpacity="0.3" />
      <polygon points="14,2 2,10 14,14" fill="white" fillOpacity="0.15" />
    </svg>
  );
}

function GemPlaceholder({ category, size = 72 }) {
  const c = GEM_COLORS[category] || GEM_COLORS.Emerald;
  return (
    <svg viewBox="0 0 72 72" width={size} height={size}>
      <polygon points="36,6 66,26 36,66 6,26" fill={c.light} fillOpacity="0.85" />
      <polygon points="36,6 66,26 36,36" fill="white" fillOpacity="0.35" />
      <polygon points="36,6 6,26 36,36" fill="white" fillOpacity="0.18" />
      <polygon points="36,36 66,26 36,66" fill={c.dot} fillOpacity="0.25" />
    </svg>
  );
}

// ─── GEM CARD ─────────────────────────────────────────────────────────────────
function GemCard({ gem, onClick }) {
  const colors = GEM_COLORS[gem.category] || GEM_COLORS.Emerald;
  const hasImage = gem.images && gem.images.length > 0;
  return (
    <div onClick={() => onClick(gem)} style={{ background: "#fff", border: "1px solid #d8e8df", borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s", position: "relative", fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(6,64,43,0.15)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ height: 200, background: colors.bg, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {hasImage
          ? <img src={gem.images[0]} alt={gem.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <GemPlaceholder category={gem.category} size={88} />
        }
        {gem.video && (
          <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.55)", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="white"><polygon points="3,1 11,6 3,11" /></svg>
            <span style={{ color: "#fff", fontSize: 11, fontFamily: "sans-serif" }}>Video</span>
          </div>
        )}
        {gem.images.length > 1 && (
          <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.5)", borderRadius: 20, padding: "3px 10px", color: "#fff", fontSize: 11, fontFamily: "sans-serif" }}>{gem.images.length} photos</div>
        )}
        {gem.badge
          ? <span style={{ position: "absolute", top: 12, right: 12, background: BADGE_STYLES[gem.badge]?.bg || "#06402b", color: BADGE_STYLES[gem.badge]?.color || "#a8f0c8", fontSize: 11, fontFamily: "sans-serif", fontWeight: 600, padding: "3px 10px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>{gem.badge}</span>
          : gem.featured && <span style={{ position: "absolute", top: 12, right: 12, background: "rgba(168,240,200,0.15)", color: "#a8f0c8", fontSize: 11, fontFamily: "sans-serif", padding: "3px 10px", borderRadius: 20, letterSpacing: 1, border: "1px solid rgba(168,240,200,0.3)" }}>Featured</span>
        }
      </div>
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ fontSize: 11, color: "#888", fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{gem.origin} · {gem.category}</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#06402b", marginBottom: 6, lineHeight: 1.2 }}>{gem.name}</div>
        <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: "#555", fontFamily: "sans-serif" }}>{gem.weight}</span>
          <span style={{ fontSize: 13, color: "#555", fontFamily: "sans-serif" }}>{gem.treatment}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eef4f1", paddingTop: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#06402b" }}>{gem.price}</span>
          <span style={{ fontSize: 12, color: "#06402b", fontFamily: "sans-serif", border: "1px solid #06402b", borderRadius: 20, padding: "4px 14px" }}>View Details</span>
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function Modal({ gem, onClose }) {
  const [activeImg, setActiveImg] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  if (!gem) return null;
  const imgs = gem.images || [];
  const hasVideo = !!gem.video;
  const colors = GEM_COLORS[gem.category] || GEM_COLORS.Emerald;
  const isYoutube = gem.video && (gem.video.includes("youtube.com") || gem.video.includes("youtu.be"));
  const youtubeId = isYoutube ? gem.video.replace("https://youtu.be/", "").replace(/.*v=/, "").split("&")[0] : null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, maxWidth: 680, width: "100%", overflow: "hidden", fontFamily: "'Cormorant Garamond', Georgia, serif", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
        {/* Media */}
        <div style={{ background: colors.bg, position: "relative" }}>
          {showVideo && hasVideo ? (
            <div style={{ width: "100%", aspectRatio: "16/9" }}>
              {isYoutube
                ? <iframe src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen" title="Gem video" />
                : <video src={gem.video} controls autoPlay style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", background: "#000" }} />
              }
            </div>
          ) : imgs.length > 0 ? (
            <div style={{ position: "relative" }}>
              <img src={imgs[activeImg]} alt={gem.name} style={{ width: "100%", maxHeight: 380, objectFit: "cover", display: "block" }} />
              {imgs.length > 1 && (
                <>
                  <button onClick={() => setActiveImg(i => (i - 1 + imgs.length) % imgs.length)} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", borderRadius: "50%", width: 36, height: 36, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                  <button onClick={() => setActiveImg(i => (i + 1) % imgs.length)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", borderRadius: "50%", width: 36, height: 36, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                </>
              )}
            </div>
          ) : (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GemPlaceholder category={gem.category} size={100} />
            </div>
          )}

          {/* Thumbnail strip */}
          {(imgs.length > 1 || hasVideo) && (
            <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "rgba(0,0,0,0.35)", overflowX: "auto" }}>
              {imgs.map((img, i) => (
                <img key={i} src={img} alt="" onClick={() => { setActiveImg(i); setShowVideo(false); }}
                  style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: activeImg === i && !showVideo ? "2px solid #a8f0c8" : "2px solid transparent", flexShrink: 0 }} />
              ))}
              {hasVideo && (
                <div onClick={() => setShowVideo(true)} style={{ width: 54, height: 54, background: showVideo ? "rgba(168,240,200,0.25)" : "rgba(0,0,0,0.4)", borderRadius: 8, cursor: "pointer", border: showVideo ? "2px solid #a8f0c8" : "2px solid rgba(255,255,255,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><polygon points="4,2 14,8 4,14" /></svg>
                  <span style={{ color: "#fff", fontSize: 9, fontFamily: "sans-serif" }}>VIDEO</span>
                </div>
              )}
            </div>
          )}
          
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>×</button>
        </div>

        {/* Info */}
        <div style={{ padding: "24px 28px 28px" }}>
          <div style={{ fontSize: 11, color: "#888", fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{gem.origin} · {gem.category}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#06402b", marginBottom: 8 }}>{gem.name}</div>
          <p style={{ fontSize: 15, color: "#555", lineHeight: 1.65, marginBottom: 18, fontFamily: "sans-serif" }}>{gem.description}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[["Weight", gem.weight], ["Clarity", gem.clarity], ["Treatment", gem.treatment], ["Origin", gem.origin]].map(([k, v]) => (
              <div key={k} style={{ background: "#f3f9f6", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: "#888", fontFamily: "sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>{k}</div>
                <div style={{ fontSize: 15, color: "#1a3a2a", fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#06402b" }}>{gem.price}</span>
            <button style={{ background: "#06402b", border: "none", borderRadius: 20, padding: "10px 26px", cursor: "pointer", fontSize: 15, color: "#a8f0c8", fontFamily: "sans-serif" }}>Enquire Now</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ gems, onAdd, onUpdate, onRemove, onClose }) {
  const emptyForm = { name: "", origin: "", weight: "", clarity: "", treatment: "", price: "", category: "Sapphire", description: "", badge: "", featured: false, images: [], video: "" };
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [tab, setTab] = useState("add");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageUpload = async (files) => {
    if (!files.length) return;
    setUploading(true); setMsg("Uploading images to Cloudinary…");
    try {
      const urls = [];
      for (const file of Array.from(files)) { const { url } = await uploadToCloudinary(file); urls.push(url); }
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
      setMsg(`${urls.length} image(s) uploaded ✓`);
    } catch (e) { setMsg("Upload failed: " + e.message); }
    setUploading(false);
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;
    setUploading(true); setMsg("Uploading video to Cloudinary…");
    try { const { url } = await uploadToCloudinary(file); set("video", url); setMsg("Video uploaded ✓"); }
    catch (e) { setMsg("Video upload failed: " + e.message); }
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!form.name || !form.price) { setMsg("Name and Price are required."); return; }
    if (editingId) { onUpdate({ ...form, firestoreId: editingId }); setEditingId(null); setMsg("Listing updated ✓"); }
    else { onAdd({ ...form, id: Date.now() }); setMsg("Gem added ✓"); }
    setForm(emptyForm); setTab("manage");
  };

  const startEdit = (g) => { setForm({ ...g }); setEditingId(g.firestoreId); setTab("add"); setMsg(""); };    
  
  const inp = { fontFamily: "sans-serif", fontSize: 14, border: "1px solid #cce0d4", borderRadius: 8, padding: "8px 12px", width: "100%", color: "#1a3a2a", outline: "none", boxSizing: "border-box", background: "#f8fdfb" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 20, maxWidth: 720, width: "100%", maxHeight: "92vh", overflow: "auto", fontFamily: "sans-serif" }}>
        <div style={{ background: "#06402b", padding: "18px 28px", borderRadius: "20px 20px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#a8f0c8", fontSize: 18, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>Admin — Manage Listings</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={async () => { await signOut(auth); onClose(); }}
              style={{ background: "none", border: "1px solid rgba(168,240,200,0.4)", borderRadius: 20, padding: "5px 14px", color: "#a8f0c8", fontFamily: "sans-serif", fontSize: 12, cursor: "pointer" }}>
              Sign out
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#a8f0c8", fontSize: 24, cursor: "pointer" }}>×</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e0ede7" }}>
          {["add", "manage"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: 13, background: tab === t ? "#f0f9f4" : "transparent", border: "none", borderBottom: tab === t ? "2px solid #06402b" : "none", color: tab === t ? "#06402b" : "#888", fontWeight: tab === t ? 600 : 400, cursor: "pointer", fontSize: 14 }}>
              {t === "add" ? (editingId ? "Edit Gem" : "Add New Gem") : `Manage (${gems.length})`}
            </button>
          ))}
        </div>

        <div style={{ padding: "22px 28px 28px" }}>
          {tab === "add" && (
            <>
              <div style={{ background: "#fffbe6", border: "1px solid #f0d060", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#806000" }}>
                ⚙ Before uploading, set <strong>CLOUD_NAME</strong> and <strong>UPLOAD_PRESET</strong> at the top of DSGems.jsx with your Cloudinary credentials.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                {[["name","Gem Name *"],["origin","Origin"],["weight","Weight (e.g. 2.5 ct)"],["clarity","Clarity"],["treatment","Treatment"],["price","Price * (e.g. USD 3,200)"]].map(([k,lbl]) => (
                  <div key={k}><div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{lbl}</div><input style={inp} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={lbl} /></div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div><div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Category</div>
                  <select style={inp} value={form.category} onChange={e => set("category", e.target.value)}>
                    {["Sapphire","Ruby","Emerald","Alexandrite","Tanzanite"].map(c => <option key={c}>{c}</option>)}
                  </select></div>
                <div><div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Badge</div>
                  <select style={inp} value={form.badge} onChange={e => set("badge", e.target.value)}>
                    <option value="">None</option><option value="New Arrival">New Arrival</option><option value="Rare">Rare</option><option value="Sold">Sold</option>
                  </select></div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Description</div>
                <textarea style={{ ...inp, height: 70, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the gem…" />
              </div>

              {/* Images */}
              <div style={{ background: "#f8fdfb", border: "1px solid #cce0d4", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#06402b", marginBottom: 10 }}>Photos (up to 5)</div>
                <div style={{ display: "flex", gap: 8, marginBottom: form.images.length ? 10 : 0 }}>
                  <label style={{ background: form.images.length >= 5 ? "#aaa" : "#06402b", color: "#a8f0c8", borderRadius: 20, padding: "7px 16px", fontSize: 13, cursor: form.images.length >= 5 ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                    Upload Photos
                    <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleImageUpload(e.target.files)} disabled={uploading || form.images.length >= 5} />
                  </label>
                  <input style={{ ...inp, flex: 1 }} placeholder="Or paste Cloudinary URL + press Enter"
                    onKeyDown={e => { if (e.key === "Enter" && e.target.value.trim() && form.images.length < 5) { set("images", [...form.images, e.target.value.trim()]); e.target.value = ""; } }} />
                </div>
                {form.images.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {form.images.map((url, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #cce0d4" }} />
                        <button onClick={() => set("images", form.images.filter((_,j)=>j!==i))} style={{ position: "absolute", top: -6, right: -6, background: "#e04040", border: "none", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>×</button>
                        {i === 0 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(6,64,43,0.75)", color: "#a8f0c8", fontSize: 9, textAlign: "center", borderRadius: "0 0 8px 8px" }}>COVER</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video */}
              <div style={{ background: "#f8fdfb", border: "1px solid #cce0d4", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#06402b", marginBottom: 10 }}>Video</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ background: "#06402b", color: "#a8f0c8", borderRadius: 20, padding: "7px 16px", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                    {form.video ? "Replace" : "Upload Video"}
                    <input type="file" accept="video/*" style={{ display: "none" }} onChange={e => handleVideoUpload(e.target.files[0])} disabled={uploading} />
                  </label>
                  <input style={{ ...inp, flex: 1 }} placeholder="Or paste YouTube or Cloudinary video URL" value={form.video} onChange={e => set("video", e.target.value)} />
                  {form.video && <button onClick={() => set("video", "")} style={{ background: "none", border: "1px solid #e04040", borderRadius: 20, padding: "6px 12px", color: "#e04040", fontSize: 12, cursor: "pointer" }}>Remove</button>}
                </div>
                {form.video && <div style={{ fontSize: 12, color: "#06402b", marginTop: 6 }}>✓ Video ready</div>}
              </div>

              {uploading && <div style={{ fontSize: 13, color: "#06402b", marginBottom: 8 }}>Uploading…</div>}
              {msg && <div style={{ fontSize: 13, color: msg.includes("failed")||msg.includes("required") ? "#e04040" : "#06402b", marginBottom: 10 }}>{msg}</div>}

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <input type="checkbox" id="feat" checked={!!form.featured} onChange={e => set("featured", e.target.checked)} />
                <label htmlFor="feat" style={{ fontSize: 13, color: "#444" }}>Mark as featured gem</label>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleSubmit} disabled={uploading} style={{ background: "#06402b", color: "#a8f0c8", border: "none", borderRadius: 20, padding: "10px 28px", fontSize: 14, cursor: "pointer" }}>
                  {editingId ? "Save Changes" : "Add Gem Listing"}
                </button>
                {editingId && <button onClick={() => { setEditingId(null); setForm(emptyForm); setMsg(""); }} style={{ background: "none", border: "1px solid #ccc", borderRadius: 20, padding: "10px 20px", fontSize: 14, cursor: "pointer", color: "#666" }}>Cancel</button>}
              </div>
            </>
          )}

          {tab === "manage" && (
            <div>
              {gems.length === 0 && <div style={{ color: "#888", textAlign: "center", padding: 40 }}>No listings yet.</div>}
              {gems.map(g => (
                <div key={g.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f7f3" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", background: (GEM_COLORS[g.category]||GEM_COLORS.Emerald).bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {g.images?.length > 0 ? <img src={g.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <GemPlaceholder category={g.category} size={36} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a3a2a" }}>{g.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{g.category} · {g.price} · {g.images?.length||0} photo(s){g.video ? " · video ✓" : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => startEdit(g)} style={{ background: "none", border: "1px solid #06402b", borderRadius: 20, padding: "5px 14px", color: "#06402b", fontSize: 12, cursor: "pointer" }}>Edit</button>
                    <button onClick={() => onRemove(g.firestoreId)} style={{ background: "none", border: "1px solid #e0a0a0", borderRadius: 20, padding: "5px 14px", color: "#c04040", fontSize: 12, cursor: "pointer" }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function DSGemsClient({ initialGems = [], initialPage = "home" }: { initialGems: any[], initialPage: string }) {
  const [gems, setGems] = useState(initialGems);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "gems"), async (snap) => {
      if (snap.empty) {
        const seeded = [];
        for (const g of INITIAL_GEMS) {
          const docRef = await addDoc(collection(db, "gems"), { ...g, firestoreId: "" });
          await updateDoc(docRef, { firestoreId: docRef.id });
          seeded.push({ ...g, firestoreId: docRef.id });
        }
        setGems(seeded);
      } else {
        setGems(snap.docs.map(d => ({ ...d.data(), firestoreId: d.id })));
      }
    });
    return () => unsub();
  }, []);

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedGem, setSelectedGem] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminPrompt, setAdminPrompt] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [keyError, setKeyError] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [menuOpen, setMenuOpen] = useState(false);


  const filtered = gems.filter(g =>
    (category === "All" || g.category === category) &&
    (g.name.toLowerCase().includes(search.toLowerCase()) || g.origin.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdminAccess = async () => {
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminKey);
      setShowAdmin(true);
      setAdminPrompt(false);
      setAdminEmail("");
      setAdminKey("");
      setKeyError(false);
    } catch (e) {
      setKeyError(true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5faf7", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />
     
      <style>{`
        @media (max-width: 480px) {
          .nav-links button { font-size: 13px !important; }
          .nav-links { gap: 12px !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: "#06402b", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 20px rgba(6,64,43,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <DiamondIcon />
          <span style={{ color: "#a8f0c8", fontSize: 18, fontWeight: 700, letterSpacing: 2, whiteSpace: "nowrap" }}>DS GEMS</span>
        </div>

        {/* Desktop nav - hidden on mobile */}
        <div style={{ display: "flex", gap: 20, alignItems: "center", "@media(maxWidth:600px)": { display: "none" } }}>
          <style>{`@media(max-width:640px){.ds-desktop-nav{display:none!important}}`}</style>
          <div className="ds-desktop-nav" style={{ display: "flex", gap: 20, alignItems: "center" }}>
            {["home","about","contact"].map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ background: "none", border: "none", color: page===p ? "#a8f0c8" : "rgba(168,240,200,0.55)", fontSize: 15, cursor: "pointer", textTransform: "capitalize", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, letterSpacing: 1, borderBottom: page===p ? "1.5px solid #a8f0c8" : "none", paddingBottom: 2 }}>{p}</button>
            ))}
            <button onClick={() => setAdminPrompt(true)} style={{ background: "rgba(168,240,200,0.12)", border: "1px solid rgba(168,240,200,0.3)", borderRadius: 20, padding: "6px 16px", color: "#a8f0c8", fontFamily: "sans-serif", fontSize: 12, cursor: "pointer", letterSpacing: 1 }}>Admin</button>
          </div>
        </div>

        {/* Hamburger button - mobile only */}
        <style>{`@media(min-width:641px){.ds-hamburger{display:none!important}}.ds-mobile-menu{display:none}.ds-mobile-menu.open{display:flex!important}`}</style>
        <button className="ds-hamburger" onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 5, padding: 8 }}>
          <span style={{ display: "block", width: 24, height: 2, background: "#a8f0c8", borderRadius: 2, transition: "0.2s", transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }}></span>
          <span style={{ display: "block", width: 24, height: 2, background: "#a8f0c8", borderRadius: 2, transition: "0.2s", opacity: menuOpen ? 0 : 1 }}></span>
          <span style={{ display: "block", width: 24, height: 2, background: "#a8f0c8", borderRadius: 2, transition: "0.2s", transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }}></span>
        </button>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div style={{ position: "absolute", top: 64, left: 0, right: 0, background: "#06402b", display: "flex", flexDirection: "column", padding: "12px 20px 20px", gap: 4, boxShadow: "0 8px 20px rgba(0,0,0,0.3)", zIndex: 99 }}>
            {["home","about","contact"].map(p => (
              <button key={p} onClick={() => { setPage(p); setMenuOpen(false); }} style={{ background: "none", border: "none", color: page===p ? "#a8f0c8" : "rgba(168,240,200,0.7)", fontSize: 18, cursor: "pointer", textTransform: "capitalize", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, letterSpacing: 1, padding: "10px 0", textAlign: "left", borderBottom: "1px solid rgba(168,240,200,0.1)" }}>{p}</button>
            ))}
            <button onClick={() => { setAdminPrompt(true); setMenuOpen(false); }} style={{ background: "rgba(168,240,200,0.12)", border: "1px solid rgba(168,240,200,0.3)", borderRadius: 20, padding: "10px 16px", color: "#a8f0c8", fontFamily: "sans-serif", fontSize: 14, cursor: "pointer", letterSpacing: 1, marginTop: 8 }}>Admin</button>
          </div>
        )}
      </nav>

      {page === "home" && (
        <>
          <div style={{ background: "linear-gradient(135deg, #06402b 60%, #0a5c3e)", padding: "60px 32px 52px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#a8f0c8", letterSpacing: 4, textTransform: "uppercase", marginBottom: 16, fontFamily: "sans-serif" }}>Sri Lanka · Worldwide Gemstone Trading</div>
            <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", color: "#fff", fontWeight: 700, margin: "0 0 14px", lineHeight: 1.1 }}>Sri Lanka's Finest Gem Artistry<br />Crafted by Nature, Perfected by Us</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 17, maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.7, fontFamily: "sans-serif" }}>Curated natural gemstones, certified and sourced ethically for discerning collectors and dealers worldwide.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              {["Worldwide Shipping","Secure Transactions"].map(t => (
                <span key={t} style={{ background: "rgba(168,240,200,0.12)", border: "1px solid rgba(168,240,200,0.25)", color: "#a8f0c8", borderRadius: 30, padding: "6px 18px", fontSize: 13, fontFamily: "sans-serif" }}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", borderBottom: "1px solid #d8eee3", padding: "18px 32px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{ background: category===c ? "#06402b" : "transparent", color: category===c ? "#a8f0c8" : "#06402b", border: "1px solid #06402b", borderRadius: 20, padding: "6px 18px", fontSize: 13, fontFamily: "sans-serif", cursor: "pointer" }}>{c}</button>
              ))}
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or origin…" style={{ border: "1px solid #cce0d4", borderRadius: 20, padding: "8px 18px", fontFamily: "sans-serif", fontSize: 14, color: "#1a3a2a", outline: "none", minWidth: 220, background: "#f8fdfb" }} />
          </div>

          <div style={{ padding: "36px 32px", maxWidth: 1200, margin: "0 auto" }}>
            {filtered.length === 0
              ? <div style={{ textAlign: "center", color: "#888", padding: 60, fontFamily: "sans-serif" }}>No gems found.</div>
              : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                  {filtered.map(g => <GemCard key={g.id} gem={g} onClick={setSelectedGem} />)}
                </div>
            }
          </div>

          <div style={{ background: "#06402b", padding: "32px", display: "flex", justifyContent: "center", gap: 60, flexWrap: "wrap" }}>
            {[["1000+","Gems Traded"],["4+","Countries Served"],["15+","Years Experience"],["100%","Authentic"]].map(([n,l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#a8f0c8" }}>{n}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "sans-serif", letterSpacing: 1, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {page === "about" && (
        <div style={{ maxWidth: 780, margin: "60px auto", padding: "0 32px" }}>
          <div style={{ fontSize: 12, color: "#888", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: 12 }}>About Us</div>
          <h2 style={{ fontSize: 40, color: "#06402b", fontWeight: 700, marginBottom: 20 }}>DS Gems - Trusted by Dealers Worldwide</h2>
          <p style={{ fontSize: 17, color: "#444", lineHeight: 1.8, fontFamily: "sans-serif", marginBottom: 18 }}>DS Gems is a trusted natural gemstone dealer operating across Sri Lanka and Thailand, connecting buyers worldwide with the finest certified gemstones at every stage, from rough to cut and polished.</p>
          <p style={{ fontSize: 17, color: "#444", lineHeight: 1.8, fontFamily: "sans-serif", marginBottom: 18 }}>We specialise in all varieties of gemstones, with a strong focus on Blue Sapphires sourced directly from the gem-rich mines of Sri Lanka, one of the world's most renowned sapphire origins.</p>
          <p style={{ fontSize: 17, color: "#444", lineHeight: 1.8, fontFamily: "sans-serif", marginBottom: 40 }}>Whether you are looking for rough stones, calibrated cuts, or fully polished gems, we offer transparent and reliable trading backed by years of hands-on expertise in the industry.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            {[["Ethical Sourcing","Direct relationships with miners and reputable gem dealers"],["Certified Quality","Every gem independently verified by top gemological labs"],["Secure Trading","Safe, insured worldwide shipping with full documentation"],["Expert Guidance","Personal service from experienced gemologists"]].map(([t,d]) => (
              <div key={t} style={{ background: "#f0f9f4", borderRadius: 14, padding: "18px 20px", border: "1px solid #d0eadd" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#06402b", marginBottom: 6 }}>{t}</div>
                <div style={{ fontSize: 13, color: "#555", fontFamily: "sans-serif", lineHeight: 1.6 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {page === "contact" && (
        <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 32px" }}>
          <div style={{ fontSize: 12, color: "#888", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: 12 }}>Get in Touch</div>
          <h2 style={{ fontSize: 40, color: "#06402b", fontWeight: 700, marginBottom: 20 }}>Contact DS Gems</h2>
          <p style={{ fontSize: 16, color: "#555", fontFamily: "sans-serif", lineHeight: 1.7, marginBottom: 32 }}>For enquiries, pricing, certificates, or to arrange a viewing our team is ready to assist international buyers and dealers.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
            {[["Email","dsgemslk@gmail.com"],["WhatsApp","+94 71 555 7038"],["Instagram","@dsgems.lk"],["Location","Colombo, Sri Lanka"],["Business Hours","Mon – Sat, 9am – 6pm"]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", gap: 18, alignItems: "flex-start", background: "#f0f9f4", borderRadius: 12, padding: "14px 18px", border: "1px solid #d0eadd" }}>
                <div style={{ fontSize: 13, color: "#888", fontFamily: "sans-serif", minWidth: 110 }}>{k}</div>
                <div style={{ fontSize: 16, color: "#06402b", fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#06402b", borderRadius: 16, padding: "24px 28px", textAlign: "center" }}>
            <div style={{ color: "#a8f0c8", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Ready to Trade?</div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontFamily: "sans-serif", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>Reach out via email or WhatsApp. We respond within 24 hours on business days.</p>
            <span style={{ background: "rgba(168,240,200,0.15)", border: "1px solid rgba(168,240,200,0.35)", color: "#a8f0c8", borderRadius: 20, padding: "8px 24px", fontFamily: "sans-serif", fontSize: 13 }}>dsgemslk@gmail.com</span>
          </div>
        </div>
      )}

      <footer style={{ background: "#032b1c", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><DiamondIcon /><span style={{ color: "rgba(168,240,200,0.8)", fontSize: 16, fontWeight: 600, letterSpacing: 2 }}>DS GEMS</span></div>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "sans-serif" }}>© 2025 DS Gems, Sri Lanka. All rights reserved.</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "rgba(168,240,200,0.5)", fontSize: 12, fontFamily: "sans-serif" }}>Worldwide Natural Gemstone Dealer</span>
          <a href="https://www.instagram.com/dsgems.lk/" target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", background: "linear-gradient(135deg, rgba(131,58,180,0.25), rgba(253,29,29,0.25), rgba(252,176,69,0.25))", border: "1px solid rgba(168,240,200,0.15)", borderRadius: 24, padding: "6px 14px", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, rgba(131,58,180,0.45), rgba(253,29,29,0.45), rgba(252,176,69,0.45))"}
            onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, rgba(131,58,180,0.25), rgba(253,29,29,0.25), rgba(252,176,69,0.25))"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#igGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f9ce34"/>
                  <stop offset="50%" stopColor="#ee2a7b"/>
                  <stop offset="100%" stopColor="#6228d7"/>
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <circle cx="12" cy="12" r="5"/>
              <circle cx="17.5" cy="6.5" r="1.5" fill="#ee2a7b" stroke="none"/>
            </svg>
            <span style={{ fontSize: 12, fontFamily: "sans-serif", letterSpacing: 1, background: "linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>@dsgems.lk</span>
          </a>
        </div>
      </footer>

      {selectedGem && <Modal gem={selectedGem} onClose={() => setSelectedGem(null)} />}

      {adminPrompt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: "32px 36px", minWidth: 320, textAlign: "center", fontFamily: "sans-serif" }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#06402b", fontFamily: "'Cormorant Garamond', Georgia, serif", marginBottom: 10 }}>Admin Access</div>
            <p style={{ fontSize: 14, color: "#777", marginBottom: 18 }}>Enter your admin password to manage listings.</p>
            <input
              type="email"
              value={adminEmail}
              onChange={e => { setAdminEmail(e.target.value); setKeyError(false); }}
              placeholder="Email"
              style={{ border: `1px solid ${keyError ? "#e04040" : "#cce0d4"}`, borderRadius: 10, padding: "9px 14px", width: "100%", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 10 }}
            />
            <input
              type="password"
              value={adminKey}
              onChange={e => { setAdminKey(e.target.value); setKeyError(false); }}
              placeholder="Password"
              style={{ border: `1px solid ${keyError ? "#e04040" : "#cce0d4"}`, borderRadius: 10, padding: "9px 14px", width: "100%", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 6 }}
              onKeyDown={e => e.key === "Enter" && handleAdminAccess()}
            />
            {keyError && <div style={{ color: "#e04040", fontSize: 13, marginBottom: 10 }}>Incorrect email or password</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={() => { setAdminPrompt(false); setAdminEmail(""); setAdminKey(""); setKeyError(false); }} style={{ flex: 1, background: "none", border: "1px solid #ccc", borderRadius: 20, padding: 9, cursor: "pointer", fontSize: 14, color: "#555" }}>Cancel</button>
              <button onClick={handleAdminAccess} style={{ flex: 1, background: "#06402b", border: "none", borderRadius: 20, padding: 9, cursor: "pointer", fontSize: 14, color: "#a8f0c8" }}>Enter</button>
            </div>
            
          </div>
        </div>
      )}

      {showAdmin && (
        <AdminPanel gems={gems}
          onAdd={async g => {
            const docRef = await addDoc(collection(db, "gems"), { ...g, firestoreId: "" });
            await updateDoc(docRef, { firestoreId: docRef.id });
          }}
          onUpdate={async g => {
            await updateDoc(doc(db, "gems", g.firestoreId), g);
          }}
          onRemove={async firestoreId => {
            await deleteDoc(doc(db, "gems", firestoreId));
          }}
          onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}




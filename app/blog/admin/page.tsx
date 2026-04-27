"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp,
} from "firebase/firestore";

// ── CLOUDINARY CONFIG ──
const CLOUD_NAME = "dixrukvmw";
const UPLOAD_PRESET = "ds_gems_unsigned";

async function uploadToCloudinary(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || "Upload failed");
  return data.secure_url as string;
}

const CATEGORIES = ["Education", "Buying Guide", "Gem Spotlight", "News", "Care & Maintenance"];

function DiamondIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
      <polygon points="14,2 26,10 14,26 2,10" fill="#a8f0c8" fillOpacity="0.9" />
      <polygon points="14,2 26,10 14,14" fill="white" fillOpacity="0.3" />
    </svg>
  );
}

const emptyForm = {
  title: "", slug: "", excerpt: "", content: "", category: "Education",
  tags: "", authorName: "DS Gems", readTime: "5 min read",
  coverImage: "", featured: false, published: false,
};

export default function BlogAdminPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [posts, setPosts] = useState<any[]>([]);
  const [tab, setTab] = useState<"list" | "editor">("list");
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  // Posts listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "blog_posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => setPosts(snap.docs.map(d => ({ ...d.data(), firestoreId: d.id }))));
    return () => unsub();
  }, [user]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    set("title", val);
    if (!editingId) {
      const slug = val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);
      set("slug", slug);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploading(true); setMsg("Uploading cover image…");
    try { const url = await uploadToCloudinary(file); set("coverImage", url); setMsg("Cover image uploaded ✓"); }
    catch (e: any) { setMsg("Upload failed: " + e.message); }
    setUploading(false);
  };

  const handleSave = async (publish = false) => {
    if (!form.title.trim() || !form.slug.trim()) { setMsg("Title and slug are required."); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        published: publish ? true : form.published,
        updatedAt: serverTimestamp(),
      };
      if (editingId) {
        await updateDoc(doc(db, "blog_posts", editingId), data);
        setMsg(publish ? "Post published ✓" : "Post saved ✓");
      } else {
        await addDoc(collection(db, "blog_posts"), { ...data, createdAt: serverTimestamp() });
        setMsg(publish ? "Post published ✓" : "Draft saved ✓");
      }
      setForm({ ...emptyForm });
      setEditingId(null);
      setTab("list");
    } catch (e: any) { setMsg("Error: " + e.message); }
    setSaving(false);
  };

  const startEdit = (post: any) => {
    setForm({ ...emptyForm, ...post, tags: Array.isArray(post.tags) ? post.tags.join(", ") : (post.tags || "") });
    setEditingId(post.firestoreId);
    setTab("editor");
    setMsg("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    await deleteDoc(doc(db, "blog_posts", id));
  };

  const inp: React.CSSProperties = { fontFamily: "sans-serif", fontSize: 14, border: "1px solid #cce0d4", borderRadius: 8, padding: "9px 13px", width: "100%", color: "#1a3a2a", outline: "none", boxSizing: "border-box", background: "#f8fdfb" };

  // ── Loading ──
  if (authLoading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5faf7", fontFamily: "sans-serif", color: "#888" }}>Loading…</div>;

  // ── Login ──
  if (!user) return (
    <div style={{ minHeight: "100vh", background: "#f5faf7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 44px", minWidth: 340, boxShadow: "0 8px 40px rgba(6,64,43,0.12)", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
          <DiamondIcon />
          <span style={{ fontSize: 18, fontWeight: 700, color: "#06402b", letterSpacing: 2, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>DS GEMS · Blog Admin</span>
        </div>
        <input type="email" value={email} onChange={e => { setEmail(e.target.value); setAuthError(""); }} placeholder="Admin email" style={{ ...inp, marginBottom: 10 }} />
        <input type="password" value={password} onChange={e => { setPassword(e.target.value); setAuthError(""); }} placeholder="Password" style={{ ...inp, marginBottom: 6 }}
          onKeyDown={e => e.key === "Enter" && signInWithEmailAndPassword(auth, email, password).catch(() => setAuthError("Invalid credentials"))} />
        {authError && <div style={{ color: "#e04040", fontSize: 13, marginBottom: 10 }}>{authError}</div>}
        <button onClick={() => signInWithEmailAndPassword(auth, email, password).catch(() => setAuthError("Invalid credentials"))}
          style={{ background: "#06402b", color: "#a8f0c8", border: "none", borderRadius: 20, padding: "11px 0", width: "100%", fontSize: 15, cursor: "pointer", marginTop: 10 }}>Sign In</button>
      </div>
    </div>
  );

  // ── Admin UI ──
  return (
    <div style={{ minHeight: "100vh", background: "#f5faf7", fontFamily: "sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "#06402b", padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 20px rgba(6,64,43,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <DiamondIcon />
          <span style={{ color: "#a8f0c8", fontSize: 16, fontWeight: 600, fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: 1 }}>DS Gems · Blog Admin</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/blog" target="_blank" style={{ color: "rgba(168,240,200,0.6)", fontSize: 13, textDecoration: "none" }}>View Blog →</a>
          <button onClick={() => signOut(auth)} style={{ background: "none", border: "1px solid rgba(168,240,200,0.4)", borderRadius: 20, padding: "5px 14px", color: "#a8f0c8", fontSize: 12, cursor: "pointer" }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, alignItems: "center" }}>
          <button onClick={() => { setTab("list"); setMsg(""); }} style={{ background: tab === "list" ? "#06402b" : "#fff", color: tab === "list" ? "#a8f0c8" : "#06402b", border: "1px solid #06402b", borderRadius: 20, padding: "8px 22px", fontSize: 14, cursor: "pointer" }}>All Posts ({posts.length})</button>
          <button onClick={() => { setTab("editor"); setEditingId(null); setForm({ ...emptyForm }); setMsg(""); }} style={{ background: tab === "editor" ? "#06402b" : "#fff", color: tab === "editor" ? "#a8f0c8" : "#06402b", border: "1px solid #06402b", borderRadius: 20, padding: "8px 22px", fontSize: 14, cursor: "pointer" }}>
            {editingId ? "Editing Post" : "+ New Post"}
          </button>
        </div>

        {/* ── POST LIST ── */}
        {tab === "list" && (
          <div>
            {posts.length === 0 && <div style={{ textAlign: "center", padding: 60, color: "#888" }}>No blog posts yet. Create your first one!</div>}
            {posts.map(post => (
              <div key={post.firestoreId} style={{ background: "#fff", borderRadius: 14, padding: "18px 22px", marginBottom: 12, border: "1px solid #d8e8df", display: "flex", gap: 16, alignItems: "center" }}>
                {post.coverImage && <img src={post.coverImage} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />}
                {!post.coverImage && (
                  <div style={{ width: 64, height: 64, background: "#06402b", borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <DiamondIcon />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#1a3a2a", marginBottom: 4, fontFamily: "'Cormorant Garamond', Georgia, serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.title}</div>
                  <div style={{ fontSize: 12, color: "#888", display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span>{post.category}</span>
                    <span>/{post.slug}</span>
                    <span style={{ color: post.published ? "#06402b" : "#c08000", fontWeight: 600 }}>{post.published ? "● Published" : "○ Draft"}</span>
                    {post.featured && <span style={{ color: "#06402b" }}>★ Featured</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <a href={`/blog/${post.slug}`} target="_blank" style={{ border: "1px solid #cce0d4", borderRadius: 20, padding: "5px 12px", color: "#888", fontSize: 12, textDecoration: "none" }}>View</a>
                  <button onClick={() => startEdit(post)} style={{ border: "1px solid #06402b", borderRadius: 20, padding: "5px 14px", color: "#06402b", fontSize: 12, background: "none", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => handleDelete(post.firestoreId)} style={{ border: "1px solid #e0a0a0", borderRadius: 20, padding: "5px 12px", color: "#c04040", fontSize: 12, background: "none", cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── EDITOR ── */}
        {tab === "editor" && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px 36px", border: "1px solid #d8e8df" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#06402b", fontFamily: "'Cormorant Garamond', Georgia, serif", marginBottom: 24 }}>{editingId ? "Edit Post" : "New Blog Post"}</h2>

            {/* Title & Slug */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 5 }}>Title *</label>
                <input style={inp} value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Post title" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 5 }}>URL Slug *</label>
                <input style={inp} value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="url-friendly-slug" />
              </div>
            </div>

            {/* Category, Author, Read time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 5 }}>Category</label>
                <select style={inp} value={form.category} onChange={e => set("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 5 }}>Author Name</label>
                <input style={inp} value={form.authorName} onChange={e => set("authorName", e.target.value)} placeholder="DS Gems" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 5 }}>Read Time</label>
                <input style={inp} value={form.readTime} onChange={e => set("readTime", e.target.value)} placeholder="5 min read" />
              </div>
            </div>

            {/* Excerpt */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 5 }}>Excerpt (shown in listings)</label>
              <textarea style={{ ...inp, height: 72, resize: "vertical" }} value={form.excerpt} onChange={e => set("excerpt", e.target.value)} placeholder="A short summary of the post…" />
            </div>

            {/* Cover image */}
            <div style={{ background: "#f8fdfb", border: "1px solid #cce0d4", borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#06402b", display: "block", marginBottom: 10 }}>Cover Image</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <label style={{ background: "#06402b", color: "#a8f0c8", borderRadius: 20, padding: "7px 18px", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Upload Image
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} disabled={uploading} />
                </label>
                <input style={{ ...inp, flex: 1 }} placeholder="Or paste image URL" value={form.coverImage} onChange={e => set("coverImage", e.target.value)} />
                {form.coverImage && <button onClick={() => set("coverImage", "")} style={{ background: "none", border: "1px solid #e04040", borderRadius: 20, padding: "6px 12px", color: "#e04040", fontSize: 12, cursor: "pointer" }}>Remove</button>}
              </div>
              {form.coverImage && <img src={form.coverImage} alt="" style={{ marginTop: 10, height: 100, borderRadius: 8, objectFit: "cover", maxWidth: "100%" }} />}
            </div>

            {/* Content */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 5 }}>Content</label>
              <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>Use blank lines to separate paragraphs. Start a line with <code style={{ background: "#f0f9f4", padding: "1px 5px", borderRadius: 4 }}># </code> or <code style={{ background: "#f0f9f4", padding: "1px 5px", borderRadius: 4 }}>## </code> for headings. Start with <code style={{ background: "#f0f9f4", padding: "1px 5px", borderRadius: 4 }}>- </code> for bullet lists.</div>
              <textarea style={{ ...inp, height: 380, resize: "vertical", lineHeight: 1.65 }} value={form.content} onChange={e => set("content", e.target.value)} placeholder={"## Introduction\n\nWrite your post content here…\n\n## Section Heading\n\nMore content…\n\n- Bullet point one\n- Bullet point two"} />
            </div>

            {/* Tags */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 5 }}>Tags (comma separated)</label>
              <input style={inp} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="sapphire, ceylon, buying guide" />
            </div>

            {/* Options */}
            <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#444", cursor: "pointer" }}>
                <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} />
                Featured post (shown prominently)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#444", cursor: "pointer" }}>
                <input type="checkbox" checked={form.published} onChange={e => set("published", e.target.checked)} />
                Published (visible on blog)
              </label>
            </div>

            {msg && <div style={{ fontSize: 13, color: msg.includes("Error") || msg.includes("required") ? "#e04040" : "#06402b", marginBottom: 14 }}>{msg}</div>}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => handleSave(false)} disabled={saving || uploading} style={{ background: "#fff", border: "1px solid #06402b", borderRadius: 20, padding: "10px 26px", fontSize: 14, color: "#06402b", cursor: "pointer" }}>
                {saving ? "Saving…" : "Save Draft"}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving || uploading} style={{ background: "#06402b", border: "none", borderRadius: 20, padding: "10px 28px", fontSize: 14, color: "#a8f0c8", cursor: "pointer" }}>
                {saving ? "Publishing…" : "Publish Post"}
              </button>
              {editingId && (
                <button onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setTab("list"); setMsg(""); }}
                  style={{ background: "none", border: "1px solid #ccc", borderRadius: 20, padding: "10px 20px", fontSize: 14, color: "#888", cursor: "pointer" }}>Cancel</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

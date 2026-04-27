"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import Link from "next/link";

function DiamondIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <polygon points="14,2 26,10 14,26 2,10" fill="#a8f0c8" fillOpacity="0.9" />
      <polygon points="14,2 26,10 14,14" fill="white" fillOpacity="0.3" />
      <polygon points="14,2 2,10 14,14" fill="white" fillOpacity="0.15" />
    </svg>
  );
}

const CATEGORIES = ["All", "Education", "Buying Guide", "Gem Spotlight", "News", "Care & Maintenance"];

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "blog_posts"),
      where("published", "==", true),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ ...d.data(), firestoreId: d.id })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = category === "All" ? posts : posts.filter(p => p.category === category);
  const featured = filtered.find(p => p.featured);
  const rest = filtered.filter(p => !p.featured || filtered.indexOf(p) > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f5faf7", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />

      <style>{`
        @media(max-width:640px){.ds-desktop-nav{display:none!important}}
        @media(min-width:641px){.ds-hamburger{display:none!important}}
        .post-card:hover { box-shadow: 0 8px 32px rgba(6,64,43,0.15) !important; transform: translateY(-3px) !important; }
        .post-card { transition: box-shadow 0.2s, transform 0.2s; }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: "#06402b", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 20px rgba(6,64,43,0.3)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <DiamondIcon />
          <span style={{ color: "#a8f0c8", fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>DS GEMS</span>
        </Link>
        <div className="ds-desktop-nav" style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {[["home", "/"], ["about", "/about"], ["blog", "/blog"], ["contact", "/contact"]].map(([label, href]) => (
            <Link key={label} href={href} style={{ color: label === "blog" ? "#a8f0c8" : "rgba(168,240,200,0.55)", fontSize: 15, textDecoration: "none", textTransform: "capitalize", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, letterSpacing: 1, borderBottom: label === "blog" ? "1.5px solid #a8f0c8" : "none", paddingBottom: 2 }}>{label}</Link>
          ))}
        </div>
        <button className="ds-hamburger" onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 5, padding: 8 }}>
          <span style={{ display: "block", width: 24, height: 2, background: "#a8f0c8", borderRadius: 2, transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }}></span>
          <span style={{ display: "block", width: 24, height: 2, background: "#a8f0c8", borderRadius: 2, opacity: menuOpen ? 0 : 1 }}></span>
          <span style={{ display: "block", width: 24, height: 2, background: "#a8f0c8", borderRadius: 2, transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }}></span>
        </button>
        {menuOpen && (
          <div style={{ position: "absolute", top: 64, left: 0, right: 0, background: "#06402b", display: "flex", flexDirection: "column", padding: "12px 20px 20px", gap: 4, boxShadow: "0 8px 20px rgba(0,0,0,0.3)", zIndex: 99 }}>
            {[["Home", "/"], ["About", "/about"], ["Blog", "/blog"], ["Contact", "/contact"]].map(([label, href]) => (
              <Link key={label} href={href} onClick={() => setMenuOpen(false)} style={{ color: label === "Blog" ? "#a8f0c8" : "rgba(168,240,200,0.7)", fontSize: 18, textDecoration: "none", textTransform: "capitalize", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, letterSpacing: 1, padding: "10px 0", borderBottom: "1px solid rgba(168,240,200,0.1)" }}>{label}</Link>
            ))}
          </div>
        )}
      </nav>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #06402b 60%, #0a5c3e)", padding: "56px 32px 48px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#a8f0c8", letterSpacing: 4, textTransform: "uppercase", marginBottom: 14, fontFamily: "sans-serif" }}>DS Gems · Insights & Education</div>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", color: "#fff", fontWeight: 700, margin: "0 0 14px", lineHeight: 1.1 }}>The Gem Journal</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 17, maxWidth: 480, margin: "0 auto", lineHeight: 1.7, fontFamily: "sans-serif" }}>Expert guides, gem spotlights, and insider knowledge from the heart of Sri Lanka's gem trade.</p>
      </div>

      {/* Category filter */}
      <div style={{ background: "#fff", borderBottom: "1px solid #d8eee3", padding: "16px 32px", display: "flex", gap: 8, flexWrap: "wrap", overflowX: "auto" }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{ background: category === c ? "#06402b" : "transparent", color: category === c ? "#a8f0c8" : "#06402b", border: "1px solid #06402b", borderRadius: 20, padding: "6px 18px", fontSize: 13, fontFamily: "sans-serif", cursor: "pointer", whiteSpace: "nowrap" }}>{c}</button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "#888", fontFamily: "sans-serif" }}>Loading posts…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "#888", fontFamily: "sans-serif" }}>No posts yet. Check back soon.</div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <Link href={`/blog/${featured.slug}`} style={{ textDecoration: "none" }}>
                <div className="post-card" style={{ background: "#fff", borderRadius: 20, overflow: "hidden", border: "1px solid #d8e8df", marginBottom: 40, display: "grid", gridTemplateColumns: "1fr 1fr", cursor: "pointer" }}>
                  <div style={{ background: "#06402b", minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                    {featured.coverImage ? (
                      <img src={featured.coverImage} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                    ) : (
                      <svg viewBox="0 0 200 200" width="120" height="120" opacity="0.3">
                        <polygon points="100,10 190,70 100,190 10,70" fill="#a8f0c8" />
                        <polygon points="100,10 190,70 100,100" fill="white" fillOpacity="0.4" />
                      </svg>
                    )}
                    <span style={{ position: "absolute", top: 16, left: 16, background: "#a8f0c8", color: "#06402b", fontSize: 11, fontFamily: "sans-serif", fontWeight: 700, padding: "4px 12px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>Featured</span>
                  </div>
                  <div style={{ padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 11, color: "#888", fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>{featured.category} · {featured.readTime || "5 min read"}</div>
                    <h2 style={{ fontSize: 28, fontWeight: 700, color: "#06402b", lineHeight: 1.25, marginBottom: 14 }}>{featured.title}</h2>
                    <p style={{ fontSize: 15, color: "#555", lineHeight: 1.7, fontFamily: "sans-serif", marginBottom: 20 }}>{featured.excerpt}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#888", fontFamily: "sans-serif" }}>{featured.authorName || "DS Gems"} · {formatDate(featured.createdAt)}</span>
                      <span style={{ fontSize: 13, color: "#06402b", border: "1px solid #06402b", borderRadius: 20, padding: "5px 16px", fontFamily: "sans-serif" }}>Read →</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Post grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
              {(featured ? rest : filtered).map(post => (
                <Link key={post.firestoreId} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                  <div className="post-card" style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #d8e8df", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ height: 190, background: "#06402b", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {post.coverImage ? (
                        <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <svg viewBox="0 0 200 200" width="72" height="72" opacity="0.25">
                          <polygon points="100,10 190,70 100,190 10,70" fill="#a8f0c8" />
                        </svg>
                      )}
                      <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(6,64,43,0.8)", color: "#a8f0c8", fontSize: 10, fontFamily: "sans-serif", fontWeight: 600, padding: "3px 10px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>{post.category}</span>
                    </div>
                    <div style={{ padding: "20px 22px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
                      <div style={{ fontSize: 11, color: "#888", fontFamily: "sans-serif", letterSpacing: 1, marginBottom: 8 }}>{post.readTime || "5 min read"} · {formatDate(post.createdAt)}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, color: "#06402b", lineHeight: 1.3, marginBottom: 10, flex: 1 }}>{post.title}</h3>
                      <p style={{ fontSize: 14, color: "#666", lineHeight: 1.65, fontFamily: "sans-serif", marginBottom: 16, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.excerpt}</p>
                      <div style={{ fontSize: 12, color: "#06402b", fontFamily: "sans-serif", fontWeight: 600 }}>{post.authorName || "DS Gems"} →</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: "#032b1c", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><DiamondIcon /><span style={{ color: "rgba(168,240,200,0.8)", fontSize: 16, fontWeight: 600, letterSpacing: 2 }}>DS GEMS</span></div>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "sans-serif" }}>© 2025 DS Gems, Sri Lanka. All rights reserved.</span>
        <a href="https://www.instagram.com/dsgems.lk/" target="_blank" rel="noreferrer" style={{ color: "rgba(168,240,200,0.5)", fontSize: 12, fontFamily: "sans-serif", textDecoration: "none" }}>@dsgems.lk</a>
      </footer>
    </div>
  );
}

function formatDate(ts: any) {
  if (!ts) return "";
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch { return ""; }
}

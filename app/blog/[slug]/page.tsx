"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";

function DiamondIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <polygon points="14,2 26,10 14,26 2,10" fill="#a8f0c8" fillOpacity="0.9" />
      <polygon points="14,2 26,10 14,14" fill="white" fillOpacity="0.3" />
      <polygon points="14,2 2,10 14,14" fill="white" fillOpacity="0.15" />
    </svg>
  );
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const q = query(collection(db, "blog_posts"), where("slug", "==", slug), where("published", "==", true));
      const snap = await getDocs(q);
      if (snap.empty) { setNotFound(true); setLoading(false); return; }
      setPost({ ...snap.docs[0].data(), firestoreId: snap.docs[0].id });
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f5faf7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#888" }}>Loading…</div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", background: "#f5faf7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ fontSize: 22, fontFamily: "'Cormorant Garamond', Georgia, serif", color: "#06402b" }}>Post not found.</div>
      <Link href="/blog" style={{ color: "#06402b", fontFamily: "sans-serif", fontSize: 14 }}>← Back to Blog</Link>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5faf7", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Navbar */}
      <nav style={{ background: "#06402b", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 20px rgba(6,64,43,0.3)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <DiamondIcon />
          <span style={{ color: "#a8f0c8", fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>DS GEMS</span>
        </Link>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {[["home", "/"], ["about", "/about"], ["blog", "/blog"], ["contact", "/contact"]].map(([label, href]) => (
            <Link key={label} href={href} style={{ color: label === "blog" ? "#a8f0c8" : "rgba(168,240,200,0.55)", fontSize: 15, textDecoration: "none", textTransform: "capitalize", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, letterSpacing: 1 }}>{label}</Link>
          ))}
        </div>
      </nav>

      {/* Cover image */}
      {post.coverImage && (
        <div style={{ height: 420, overflow: "hidden", position: "relative" }}>
          <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(6,64,43,0.6))" }} />
        </div>
      )}

      {!post.coverImage && (
        <div style={{ height: 200, background: "linear-gradient(135deg, #06402b 60%, #0a5c3e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 200 200" width="80" height="80" opacity="0.25">
            <polygon points="100,10 190,70 100,190 10,70" fill="#a8f0c8" />
          </svg>
        </div>
      )}

      {/* Article */}
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "48px 32px 80px" }}>
        <Link href="/blog" style={{ fontSize: 13, color: "#06402b", fontFamily: "sans-serif", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 28 }}>← Back to Blog</Link>

        <div style={{ fontSize: 11, color: "#888", fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
          {post.category} · {post.readTime || "5 min read"} · {formatDate(post.createdAt)}
        </div>

        <h1 style={{ fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 700, color: "#06402b", lineHeight: 1.15, marginBottom: 20 }}>{post.title}</h1>

        <div style={{ fontSize: 13, color: "#888", fontFamily: "sans-serif", marginBottom: 36, paddingBottom: 24, borderBottom: "1px solid #d8eee3" }}>
          By {post.authorName || "DS Gems"}
        </div>

        {/* Rendered content */}
        <div style={{ fontSize: 17, color: "#333", lineHeight: 1.85, fontFamily: "sans-serif" }}
          dangerouslySetInnerHTML={{ __html: renderContent(post.content) }} />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #d8eee3", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {post.tags.map((tag: string) => (
              <span key={tag} style={{ background: "#f0f9f4", border: "1px solid #cce0d4", borderRadius: 20, padding: "4px 14px", fontSize: 13, color: "#06402b", fontFamily: "sans-serif" }}>{tag}</span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 48, background: "#06402b", borderRadius: 20, padding: "32px 36px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#a8f0c8", marginBottom: 10 }}>Interested in a Gem?</div>
          <p style={{ color: "rgba(255,255,255,0.65)", fontFamily: "sans-serif", fontSize: 14, lineHeight: 1.65, marginBottom: 20 }}>Browse our current collection of certified natural gemstones sourced from Sri Lanka.</p>
          <Link href="/" style={{ background: "rgba(168,240,200,0.15)", border: "1px solid rgba(168,240,200,0.35)", color: "#a8f0c8", borderRadius: 20, padding: "10px 28px", fontFamily: "sans-serif", fontSize: 14, textDecoration: "none", display: "inline-block" }}>View Collection →</Link>
        </div>
      </div>

      <footer style={{ background: "#032b1c", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><DiamondIcon /><span style={{ color: "rgba(168,240,200,0.8)", fontSize: 16, fontWeight: 600, letterSpacing: 2 }}>DS GEMS</span></div>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "sans-serif" }}>© 2025 DS Gems, Sri Lanka. All rights reserved.</span>
      </footer>
    </div>
  );
}

// Convert plain line-break text to basic HTML paragraphs
function renderContent(content: string): string {
  if (!content) return "";
  return content
    .split("\n\n")
    .map(para => {
      const trimmed = para.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("## ")) return `<h2 style="font-size:26px;font-weight:700;color:#06402b;margin:36px 0 14px;font-family:'Cormorant Garamond',Georgia,serif">${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("# ")) return `<h2 style="font-size:30px;font-weight:700;color:#06402b;margin:36px 0 14px;font-family:'Cormorant Garamond',Georgia,serif">${trimmed.slice(2)}</h2>`;
      if (trimmed.startsWith("- ")) {
        const items = trimmed.split("\n").map(l => `<li style="margin-bottom:8px">${l.slice(2)}</li>`).join("");
        return `<ul style="margin:0 0 20px 20px;padding:0">${items}</ul>`;
      }
      return `<p style="margin:0 0 22px">${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");
}

function formatDate(ts: any) {
  if (!ts) return "";
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch { return ""; }
}

"use client";

import { useState, useRef, useEffect } from "react";

// ── CLOUDINARY CONFIG (same as your existing setup) ──
const CLOUD_NAME = "dixrukvmw";

// ── KNOWLEDGE BASE ──
const KNOWLEDGE_BASE = `
You are the DS Gems virtual assistant. You help customers learn about gemstones, pricing, and the DS Gems collection.

DS GEMS COMPANY INFO:
- Based in Sri Lanka and Thailand
- Specializes in natural certified gemstones
- Direct sourcing from Sri Lanka mines
- Worldwide shipping available
- Email: dsgemslk@gmail.com
- WhatsApp: +94 71 555 7038
- Instagram: @dsgems.lk
- Business Hours: Mon–Sat, 9am–6pm

GEM CATEGORIES & PRICE RANGES:
1. Ceylon Blue Sapphire
   - Origin: Sri Lanka (Ceylon)
   - Price range: USD 500–50,000+ depending on carat, clarity, and treatment
   - Unheated: 3x–5x premium over heated stones
   - Typical: 1ct eye-clean heated ~USD 800–2,500 | 1ct unheated ~USD 2,500–8,000
   - Padparadscha (pink-orange): USD 3,000–15,000 per carat

2. Ruby
   - Origin: Myanmar (Burmese), Mozambique, Sri Lanka
   - Burmese pigeon blood unheated: USD 5,000–30,000+ per carat
   - Mozambique heated: USD 500–3,000 per carat
   - No-heat premium: 2x–4x

3. Emerald
   - Origin: Colombia, Zambia, Brazil
   - Colombian: USD 1,000–10,000 per carat
   - Minor oil treatment accepted in trade
   - Eye-clean Colombian: USD 3,000–8,000 per carat

4. Alexandrite
   - Origin: Brazil, India, Russia
   - Strong color change: USD 3,000–15,000 per carat
   - Brazilian: USD 2,000–8,000 per carat

5. Tanzanite
   - Origin: Tanzania (single source worldwide)
   - AAA grade: USD 300–1,200 per carat
   - Heat treated (standard in trade)

6. Other gems we carry:
   - Spinel, Tourmaline, Aquamarine, Garnet, Moonstone
   - Prices vary widely by type and quality

CERTIFICATIONS WE ACCEPT/PROVIDE:
- GIA (Gemological Institute of America)
- GRS (Gem Research Swisslab)
- AGL (American Gemological Laboratories)
- Gübelin (Switzerland)

TREATMENT TYPES:
- No Heat / Unheated: Most valuable, natural color
- Heat Only: Industry standard, accepted
- Minor Oil (emeralds): Accepted
- Fracture Filled: Disclosed, lower value
- Beryllium treated: Lower value

HOW TO BUY:
- Browse collection on website
- Contact via WhatsApp or email for pricing
- Secure worldwide shipping with insurance
- Payment via bank transfer or secure methods

QUALITY FACTORS (4 Cs):
- Color: Most important for colored stones
- Clarity: Eye-clean preferred
- Cut: Affects brilliance and weight retention
- Carat: Larger = exponentially more valuable

Always be helpful, honest, and professional. If asked about specific stones not in the current collection, suggest contacting DS Gems directly via WhatsApp (+94 71 555 7038) or email (dsgemslk@gmail.com). Keep answers concise but informative.
`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function GemChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm the DS Gems assistant. Ask me about gemstone prices, types, certifications, or anything about our collection. I can also read PDF documents you upload! 💎" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfText, setPdfText] = useState<string>("");
  const [pdfName, setPdfName] = useState<string>("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Extract text from PDF using pdf.js CDN
  const handlePdfUpload = async (file: File) => {
    if (!file || file.type !== "application/pdf") return;
    setPdfLoading(true);
    setPdfName(file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Load pdf.js dynamically
      const pdfjsLib = await loadPdfJs();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        fullText += `\n[Page ${i}]: ${pageText}`;
      }
      setPdfText(fullText.slice(0, 8000)); // limit to 8000 chars
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `📄 I've read "${file.name}" (${pdf.numPages} pages). You can now ask me questions about its contents!`
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't read that PDF. Please try again." }]);
    }
    setPdfLoading(false);
  };

  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve((window as any).pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const systemPrompt = KNOWLEDGE_BASE + (pdfText ? `\n\nUPLOADED PDF CONTENT (${pdfName}):\n${pdfText}` : "");

      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [...history, { role: "user", content: userMsg }],
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text ?? "Sorry, I couldn't get a response. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please check your internet and try again." }]);
    }
    setLoading(false);
  };

  const quickQuestions = [
    "What are your sapphire prices?",
    "Unheated vs heated gems?",
    "How do I buy from DS Gems?",
    "What certifications do you offer?",
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          width: 60, height: 60, borderRadius: "50%",
          background: "linear-gradient(135deg, #06402b, #0a6644)",
          border: "2px solid rgba(168,240,200,0.4)",
          boxShadow: "0 4px 24px rgba(6,64,43,0.4)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 6px 32px rgba(6,64,43,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(6,64,43,0.4)"; }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <line x1="4" y1="4" x2="18" y2="18" stroke="#a8f0c8" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="18" y1="4" x2="4" y2="18" stroke="#a8f0c8" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 26,10 14,26 2,10" fill="#a8f0c8" fillOpacity="0.95" />
            <polygon points="14,2 26,10 14,14" fill="white" fillOpacity="0.35" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 100, right: 28, zIndex: 9998,
          width: 360, maxWidth: "calc(100vw - 40px)",
          background: "#fff", borderRadius: 20,
          boxShadow: "0 12px 48px rgba(6,64,43,0.2)",
          border: "1px solid #d0eadd",
          display: "flex", flexDirection: "column",
          maxHeight: "70vh", fontFamily: "sans-serif",
          animation: "slideUp 0.2s ease",
        }}>
          <style>{`
            @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
            .chat-msg-user { background:#06402b; color:#fff; border-radius:18px 18px 4px 18px; align-self:flex-end; }
            .chat-msg-bot { background:#f0f9f4; color:#1a3a2a; border-radius:18px 18px 18px 4px; align-self:flex-start; border:1px solid #d0eadd; }
            .chat-input:focus { outline:none; border-color:#06402b !important; }
            .quick-btn:hover { background:#06402b !important; color:#a8f0c8 !important; }
          `}</style>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #06402b, #0a5c3e)", borderRadius: "20px 20px 0 0", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(168,240,200,0.15)", border: "1px solid rgba(168,240,200,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                <polygon points="14,2 26,10 14,26 2,10" fill="#a8f0c8" fillOpacity="0.95" />
                <polygon points="14,2 26,10 14,14" fill="white" fillOpacity="0.35" />
              </svg>
            </div>
            <div>
              <div style={{ color: "#a8f0c8", fontWeight: 700, fontSize: 14, fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: 1 }}>DS Gems Assistant</div>
              <div style={{ color: "rgba(168,240,200,0.6)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }}></span>
                Online · Ask me anything
              </div>
            </div>
            {pdfName && (
              <div style={{ marginLeft: "auto", background: "rgba(168,240,200,0.15)", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: "#a8f0c8", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                📄 {pdfName}
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "chat-msg-user" : "chat-msg-bot"}
                style={{ padding: "10px 14px", fontSize: 13, lineHeight: 1.6, maxWidth: "85%", whiteSpace: "pre-wrap" }}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="chat-msg-bot" style={{ padding: "10px 14px", fontSize: 13 }}>
                <span style={{ display: "inline-flex", gap: 4 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#06402b", opacity: 0.4, animation: `bounce 1s ${i * 0.2}s infinite` }}></span>
                  ))}
                </span>
                <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px);opacity:1}}`}</style>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions (only show if no conversation yet) */}
          {messages.length <= 1 && (
            <div style={{ padding: "0 14px 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {quickQuestions.map(q => (
                <button key={q} className="quick-btn" onClick={() => { setInput(q); setTimeout(() => sendMessage(), 10); }}
                  style={{ background: "#f0f9f4", border: "1px solid #cce0d4", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: "#06402b", cursor: "pointer", transition: "0.15s" }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* PDF upload + input */}
          <div style={{ padding: "10px 14px 14px", borderTop: "1px solid #e8f4ee" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* PDF upload button */}
              <label title="Upload a PDF" style={{ flexShrink: 0, width: 36, height: 36, background: pdfName ? "#06402b" : "#f0f9f4", border: "1px solid #cce0d4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                {pdfLoading ? (
                  <span style={{ width: 14, height: 14, border: "2px solid #06402b", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }}></span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pdfName ? "#a8f0c8" : "#06402b"} strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                )}
                <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handlePdfUpload(e.target.files[0])} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </label>

              <input
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask about gems, prices…"
                style={{ flex: 1, border: "1px solid #d0eadd", borderRadius: 20, padding: "9px 14px", fontSize: 13, color: "#1a3a2a", background: "#f8fdfb", transition: "border-color 0.15s" }}
              />

              <button onClick={sendMessage} disabled={loading || !input.trim()}
                style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", background: input.trim() ? "#06402b" : "#d0eadd", border: "none", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? "#a8f0c8" : "#aaa"} strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <div style={{ fontSize: 10, color: "#aaa", textAlign: "center", marginTop: 6 }}>
              📎 Upload a PDF · Powered by DS Gems AI
            </div>
          </div>
        </div>
      )}
    </>
  );
}

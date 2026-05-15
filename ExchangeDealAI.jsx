import { useState, useEffect, useRef } from "react";

const PHONE_DATA = {
  Apple: { models: ["iPhone 13", "iPhone 14", "iPhone 14 Pro", "iPhone 15", "iPhone 15 Pro", "iPhone 12", "iPhone SE 3"], storage: ["64GB","128GB","256GB","512GB","1TB"], ram: ["4GB","6GB","8GB"] },
  Samsung: { models: ["Galaxy S23", "Galaxy S23 Ultra", "Galaxy A54", "Galaxy A34", "Galaxy S24", "Galaxy S24 Ultra", "Galaxy M34"], storage: ["128GB","256GB","512GB"], ram: ["6GB","8GB","12GB"] },
  OnePlus: { models: ["OnePlus 11", "OnePlus 12", "OnePlus Nord 3", "OnePlus Nord CE 3", "OnePlus 11R"], storage: ["128GB","256GB","512GB"], ram: ["8GB","12GB","16GB"] },
  Google: { models: ["Pixel 7", "Pixel 7 Pro", "Pixel 8", "Pixel 8 Pro", "Pixel 7a"], storage: ["128GB","256GB"], ram: ["8GB","12GB"] },
  Xiaomi: { models: ["Redmi Note 13 Pro", "Xiaomi 13 Pro", "POCO X5 Pro", "Redmi 13C", "Xiaomi 14"], storage: ["128GB","256GB","512GB"], ram: ["6GB","8GB","12GB"] },
};

const MOCK_RESULTS = [
  { id:1, name:"Samsung Galaxy S24", brand:"Samsung", storage:"256GB", ram:"8GB", image:"📱", category:"flagship", trending:true,
    amazon: { price:74999, exchange:32000, bank:5000, coupon:2000, final:35999, rating:4.5, reviews:2341, delivery:"Tomorrow" },
    flipkart: { price:72999, exchange:34000, bank:3000, coupon:1500, final:34499, rating:4.4, reviews:3102, delivery:"2 days" }
  },
  { id:2, name:"iPhone 15", brand:"Apple", storage:"128GB", ram:"6GB", image:"📱", category:"flagship", trending:true,
    amazon: { price:79900, exchange:35000, bank:6000, coupon:0, final:38900, rating:4.7, reviews:5621, delivery:"Tomorrow" },
    flipkart: { price:78900, exchange:36000, bank:4000, coupon:2000, final:36900, rating:4.6, reviews:4821, delivery:"Tomorrow" }
  },
  { id:3, name:"OnePlus 12", brand:"OnePlus", storage:"256GB", ram:"12GB", image:"📱", category:"flagship", trending:false,
    amazon: { price:64999, exchange:31000, bank:4000, coupon:1500, final:28499, rating:4.5, reviews:1892, delivery:"2 days" },
    flipkart: { price:62999, exchange:33000, bank:5000, coupon:2500, final:22499, rating:4.5, reviews:2341, delivery:"Tomorrow" }
  },
  { id:4, name:"Google Pixel 8", brand:"Google", storage:"128GB", ram:"8GB", image:"📱", category:"flagship", trending:false,
    amazon: { price:69999, exchange:30000, bank:7000, coupon:0, final:32999, rating:4.6, reviews:981, delivery:"2 days" },
    flipkart: { price:67999, exchange:29000, bank:5000, coupon:3000, final:30999, rating:4.5, reviews:724, delivery:"3 days" }
  },
  { id:5, name:"Xiaomi 14", brand:"Xiaomi", storage:"256GB", ram:"12GB", image:"📱", category:"flagship", trending:true,
    amazon: { price:59999, exchange:29000, bank:3000, coupon:2000, final:25999, rating:4.4, reviews:1203, delivery:"Tomorrow" },
    flipkart: { price:57999, exchange:31000, bank:4000, coupon:1000, final:21999, rating:4.3, reviews:1541, delivery:"Tomorrow" }
  },
  { id:6, name:"Samsung Galaxy A54", brand:"Samsung", storage:"128GB", ram:"8GB", image:"📱", category:"midrange", trending:false,
    amazon: { price:34999, exchange:25000, bank:2000, coupon:1000, final:6999, rating:4.2, reviews:4231, delivery:"Tomorrow" },
    flipkart: { price:33999, exchange:26000, bank:2500, coupon:500, final:4999, rating:4.3, reviews:5102, delivery:"2 days" }
  },
];

const fmt = n => `₹${n.toLocaleString('en-IN')}`;

function StarRating({ rating }) {
  return (
    <span style={{ color: "#f59e0b", fontSize: 12 }}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
      <span style={{ color: "#6b7280", marginLeft: 4 }}>{rating}</span>
    </span>
  );
}

function PlatformBadge({ platform, isBest }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: platform === "amazon" ? "#ff9900" : "#2874f0",
      color: "white",
    }}>
      {platform === "amazon" ? "Amazon" : "Flipkart"}
      {isBest && <span style={{ fontSize: 10 }}>🏆</span>}
    </span>
  );
}

function PhoneCard({ result, userPhone }) {
  const [expanded, setExpanded] = useState(false);
  const bestPlatform = result.flipkart.final <= result.amazon.final ? "flipkart" : "amazon";
  const savings = Math.abs(result.amazon.final - result.flipkart.final);

  return (
    <div style={{
      background: "linear-gradient(145deg, #1a1a2e, #16213e)",
      border: "1px solid #2a2a4a",
      borderRadius: 16, overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(99,102,241,0.2)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Best deal banner */}
      {result.id === 3 && (
        <div style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)", padding: "6px 16px", fontSize: 11, fontWeight: 700, color: "white", textAlign: "center", letterSpacing: 1 }}>
          🏆 BEST VALUE DEAL FOR YOUR {userPhone?.model?.toUpperCase() || "PHONE"}
        </div>
      )}
      {result.trending && (
        <div style={{ background: "rgba(245,158,11,0.15)", borderBottom: "1px solid rgba(245,158,11,0.3)", padding: "4px 16px", fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 6 }}>
          🔥 Trending Deal
        </div>
      )}

      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, #2a2a4a, #3a3a6a)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
              {result.image}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#e2e8f0" }}>{result.name}</div>
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{result.storage} · {result.ram} RAM</div>
              <StarRating rating={Math.max(result.amazon.rating, result.flipkart.rating)} />
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>Best Final Price</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#6366f1" }}>
              {fmt(Math.min(result.amazon.final, result.flipkart.final))}
            </div>
            <PlatformBadge platform={bestPlatform} isBest={true} />
          </div>
        </div>

        {/* Platform comparison */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {["amazon", "flipkart"].map(pl => {
            const d = result[pl];
            const isBest = bestPlatform === pl;
            return (
              <div key={pl} style={{
                background: isBest ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)",
                border: isBest ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10, padding: "12px 14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <PlatformBadge platform={pl} isBest={isBest} />
                  {isBest && <span style={{ fontSize: 10, color: "#6366f1", fontWeight: 600 }}>BEST</span>}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Product Price</div>
                <div style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{fmt(d.price)}</div>
                <div style={{ fontSize: 12, color: "#10b981" }}>↓ Exchange: {fmt(d.exchange)}</div>
                {d.bank > 0 && <div style={{ fontSize: 12, color: "#6366f1" }}>↓ Bank: {fmt(d.bank)}</div>}
                {d.coupon > 0 && <div style={{ fontSize: 12, color: "#8b5cf6" }}>↓ Coupon: {fmt(d.coupon)}</div>}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 8, paddingTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>You Pay</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isBest ? "#6366f1" : "#94a3b8" }}>{fmt(d.final)}</div>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>🚚 {d.delivery}</div>
              </div>
            );
          })}
        </div>

        {/* Savings callout */}
        <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#10b981" }}>💰 Save {fmt(savings)} by choosing <strong>{bestPlatform === "amazon" ? "Amazon" : "Flipkart"}</strong></span>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <a href="#" style={{ flex: 1, textAlign: "center", padding: "9px 0", background: "#ff9900", color: "white", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Buy on Amazon
          </a>
          <a href="#" style={{ flex: 1, textAlign: "center", padding: "9px 0", background: "#2874f0", color: "white", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Buy on Flipkart
          </a>
        </div>
      </div>
    </div>
  );
}

function AIRecommendationBox({ userPhone, results }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const best = results.reduce((a, b) =>
    Math.min(a.amazon.final, a.flipkart.final) < Math.min(b.amazon.final, b.flipkart.final) ? a : b
  );
  const bestFinal = Math.min(best.amazon.final, best.flipkart.final);
  const bestPlatform = best.flipkart.final < best.amazon.final ? "Flipkart" : "Amazon";
  const bestExchange = Math.max(best.amazon.exchange, best.flipkart.exchange);

  useEffect(() => {
    if (!userPhone || done) return;
    setLoading(true);
    const fullText = `Based on your ${userPhone.brand} ${userPhone.model} (${userPhone.storage}, ${userPhone.condition} condition), here's my analysis:

🏆 Best Upgrade Recommendation: ${best.name} (${best.storage})

Your phone fetches the highest exchange value on ${bestPlatform} — ₹${bestExchange.toLocaleString('en-IN')}. After applying all offers, the final payable amount is just ${fmt(bestFinal)}.

📊 Value Analysis:
• You save up to ₹${(best.amazon.exchange + best.amazon.bank + best.amazon.coupon).toLocaleString('en-IN')} in total discounts
• ${bestPlatform} beats the other platform by ₹${Math.abs(best.amazon.final - best.flipkart.final).toLocaleString('en-IN')}
• EMI available from ₹${Math.round(bestFinal / 12).toLocaleString('en-IN')}/month (12 months, HDFC)

💡 Pro Tip: The ${best.name} launched this year with significant camera and performance upgrades over your current device. Exchange value for the ${userPhone.model} typically drops ~15% every 3 months, so acting now maximises your savings.

⏰ Deal expires: Limited time offer — exchange values are updated every 3 hours.`;

    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      setText(fullText.slice(0, i));
      if (i >= fullText.length) { clearInterval(interval); setLoading(false); setDone(true); }
    }, 15);
    return () => clearInterval(interval);
  }, [userPhone]);

  return (
    <div style={{ background: "linear-gradient(135deg, #1e1b4b, #1a1a2e)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 16, padding: 24, marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 15 }}>AI Deal Analyst</div>
          <div style={{ fontSize: 11, color: "#6366f1" }}>Powered by ExchangeDeal Intelligence</div>
        </div>
        {loading && <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", animation: `pulse 1s ${i*0.3}s infinite` }} />)}
        </div>}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: "#94a3b8", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
        {text}
        {loading && <span style={{ borderRight: "2px solid #6366f1", animation: "blink 1s infinite" }}>&nbsp;</span>}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}

function PriceChart({ phoneName }) {
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  const amazonPrices = [82999, 79999, 78900, 77999, 79900, 78000, 79900];
  const flipkartPrices = [81999, 78999, 77900, 76500, 78900, 76999, 78900];
  const exchanges = [28000, 29000, 30000, 31000, 33000, 34000, 36000];

  const maxP = Math.max(...amazonPrices, ...flipkartPrices);
  const minP = Math.min(...exchanges);
  const range = maxP - minP;

  const toY = (val, h = 120) => h - ((val - minP) / range) * h;

  const pts = (arr, h = 120) => arr.map((v, i) => `${i * 100 / 6},${toY(v, h)}`).join(" ");

  return (
    <div style={{ background: "linear-gradient(145deg, #1a1a2e, #16213e)", border: "1px solid #2a2a4a", borderRadius: 16, padding: 24, marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 15 }}>📈 Price History</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{phoneName} — Last 7 months</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
          <span style={{ color: "#ff9900" }}>● Amazon</span>
          <span style={{ color: "#2874f0" }}>● Flipkart</span>
          <span style={{ color: "#10b981" }}>● Exchange</span>
        </div>
      </div>
      <svg viewBox="0 0 600 140" style={{ width: "100%", height: 140 }}>
        {/* Grid lines */}
        {[0,30,60,90,120].map(y => (
          <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        {/* Lines */}
        <polyline points={pts(amazonPrices).split(" ").map((p, i) => `${i * 100},${p.split(",")[1]}`).join(" ")} fill="none" stroke="#ff9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={pts(flipkartPrices).split(" ").map((p, i) => `${i * 100},${p.split(",")[1]}`).join(" ")} fill="none" stroke="#2874f0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={pts(exchanges).split(" ").map((p, i) => `${i * 100},${p.split(",")[1]}`).join(" ")} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="5,3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Month labels */}
        {months.map((m, i) => (
          <text key={m} x={i * 100} y={138} textAnchor="middle" fill="#4b5563" fontSize="11">{m}</text>
        ))}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }}>
        {[
          { label: "Current Amazon", val: fmt(79900), sub: "No change this week", color: "#ff9900" },
          { label: "Current Flipkart", val: fmt(78900), sub: "↓ ₹1,901 last week", color: "#2874f0" },
          { label: "Exchange Value", val: fmt(36000), sub: "↑ ₹2,000 this month", color: "#10b981" },
        ].map(item => (
          <div key={item.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", borderLeft: `3px solid ${item.color}` }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>{item.label}</div>
            <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 16 }}>{item.val}</div>
            <div style={{ fontSize: 11, color: item.color }}>{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExchangeDealAI() {
  const [step, setStep] = useState("home"); // home | loading | results
  const [form, setForm] = useState({ brand: "", model: "", storage: "", ram: "", condition: "Good", pincode: "" });
  const [sortBy, setSortBy] = useState("final");
  const [filterBrand, setFilterBrand] = useState("All");
  const [activeTab, setActiveTab] = useState("compare");

  const brands = Object.keys(PHONE_DATA);
  const models = form.brand ? PHONE_DATA[form.brand]?.models || [] : [];
  const storages = form.brand ? PHONE_DATA[form.brand]?.storage || [] : [];
  const rams = form.brand ? PHONE_DATA[form.brand]?.ram || [] : [];

  const handleCompare = () => {
    if (!form.brand || !form.model || !form.storage) return;
    setStep("loading");
    setTimeout(() => setStep("results"), 3200);
  };

  const sorted = [...MOCK_RESULTS]
    .filter(r => filterBrand === "All" || r.brand === filterBrand)
    .sort((a, b) => {
      if (sortBy === "final") return Math.min(a.amazon.final, a.flipkart.final) - Math.min(b.amazon.final, b.flipkart.final);
      if (sortBy === "exchange") return Math.max(b.amazon.exchange, b.flipkart.exchange) - Math.max(a.amazon.exchange, a.flipkart.exchange);
      if (sortBy === "value") return (Math.max(a.amazon.exchange, a.flipkart.exchange) / Math.min(a.amazon.final, a.flipkart.final)) > (Math.max(b.amazon.exchange, b.flipkart.exchange) / Math.min(b.amazon.final, b.flipkart.final)) ? -1 : 1;
      return 0;
    });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Inter', system-ui, sans-serif", color: "#e2e8f0" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #e2e8f0 !important; border-radius: 8px !important; padding: 10px 14px !important; font-size: 14px !important; width: 100%; outline: none !important; }
        input:focus, select:focus { border-color: rgba(99,102,241,0.6) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; }
        select option { background: #1a1a2e; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .card-in { animation: fadeIn 0.4s ease forwards; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "rgba(10,10,15,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px", position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white" }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: 16, background: "linear-gradient(135deg, #818cf8, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ExchangeDeal AI</span>
          <span style={{ fontSize: 10, color: "#6366f1", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>INDIA</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["compare", "trending", "history"].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); if (tab !== "compare") setStep("home"); }}
              style={{ padding: "5px 14px", borderRadius: 6, fontSize: 13, border: "none", cursor: "pointer", fontWeight: 500, background: activeTab === tab ? "rgba(99,102,241,0.2)" : "transparent", color: activeTab === tab ? "#818cf8" : "#64748b" }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <button style={{ padding: "5px 14px", borderRadius: 6, fontSize: 13, border: "1px solid rgba(99,102,241,0.3)", cursor: "pointer", fontWeight: 600, background: "transparent", color: "#818cf8" }}>Login</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

        {/* HERO */}
        {step === "home" && (
          <div style={{ textAlign: "center", padding: "32px 0 28px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 20, padding: "4px 16px", fontSize: 12, color: "#818cf8", marginBottom: 20, fontWeight: 600 }}>
              🇮🇳 Made for India · Amazon & Flipkart
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, marginBottom: 14 }}>
              <span style={{ background: "linear-gradient(135deg, #e2e8f0, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Get the Best</span><br />
              <span style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Exchange Deal</span>
              <span style={{ background: "linear-gradient(135deg, #e2e8f0, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}> in India</span>
            </h1>
            <p style={{ color: "#64748b", fontSize: 16, maxWidth: 480, margin: "0 auto 32px" }}>
              Compare Amazon & Flipkart exchange offers instantly. AI-powered analysis finds you the maximum savings on your next upgrade.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 8, flexWrap: "wrap" }}>
              {[["⚡","Real-time scraping"],["🤖","AI recommendations"],["🔔","Price drop alerts"],["📊","Price history"]].map(([icon, label]) => (
                <div key={label} style={{ fontSize: 13, color: "#64748b" }}>{icon} {label}</div>
              ))}
            </div>
          </div>
        )}

        {/* INPUT FORM */}
        {(step === "home" || step === "results") && (
          <div style={{ background: "linear-gradient(145deg, #1a1a2e, #16213e)", border: "1px solid #2a2a4a", borderRadius: 16, padding: 24, marginBottom: 28 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#e2e8f0", marginBottom: 6 }}>📱 Your Current Phone</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Enter details to get personalised exchange offers</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Brand</div>
                <select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value, model: "", storage: "", ram: "" })}>
                  <option value="">Select brand</option>
                  {brands.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Model</div>
                <select value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}>
                  <option value="">Select model</option>
                  {models.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Storage</div>
                <select value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })}>
                  <option value="">Select storage</option>
                  {storages.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Condition</div>
                <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                  {["Excellent","Good","Fair","Poor"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Pincode</div>
                <input type="text" placeholder="e.g. 400001" maxLength={6} value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} />
              </div>
            </div>
            <button onClick={handleCompare} disabled={!form.brand || !form.model || !form.storage}
              style={{ width: "100%", padding: "13px", background: (!form.brand || !form.model || !form.storage) ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: 15, cursor: (!form.brand || !form.model || !form.storage) ? "not-allowed" : "pointer", transition: "opacity 0.2s" }}>
              🔍 Compare Exchange Deals
            </button>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 60, height: 60, border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", margin: "0 auto 24px", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontWeight: 700, fontSize: 18, color: "#e2e8f0", marginBottom: 10 }}>Fetching Live Exchange Offers</div>
            {[
              ["🔍", "Searching Amazon India..."],
              ["🔎", "Searching Flipkart..."],
              ["🤖", "Running AI analysis..."],
              ["✅", "Calculating best deals..."],
            ].map(([icon, msg], i) => (
              <div key={msg} style={{ fontSize: 13, color: "#64748b", margin: "6px 0", opacity: 0.7 }}>{icon} {msg}</div>
            ))}
          </div>
        )}

        {/* RESULTS */}
        {step === "results" && (
          <div className="card-in">
            <AIRecommendationBox userPhone={form} results={MOCK_RESULTS} />

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Sort by:</div>
              {[["final","Lowest Final Price"],["exchange","Highest Exchange"],["value","Best Value"]].map(([val, label]) => (
                <button key={val} onClick={() => setSortBy(val)}
                  style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, border: "none", cursor: "pointer", fontWeight: 600, background: sortBy === val ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)", color: sortBy === val ? "#818cf8" : "#64748b", transition: "all 0.2s" }}>
                  {label}
                </button>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {["All","Apple","Samsung","OnePlus","Google","Xiaomi"].map(b => (
                  <button key={b} onClick={() => setFilterBrand(b)}
                    style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, border: "none", cursor: "pointer", background: filterBrand === b ? "#6366f1" : "rgba(255,255,255,0.05)", color: filterBrand === b ? "white" : "#64748b", fontWeight: filterBrand === b ? 700 : 400 }}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 10, color: "#64748b", fontSize: 13 }}>
              Showing {sorted.length} phones with exchange offers for your <strong style={{ color: "#818cf8" }}>{form.brand} {form.model}</strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16, marginBottom: 28 }}>
              {sorted.map(r => <PhoneCard key={r.id} result={r} userPhone={form} />)}
            </div>

            <PriceChart phoneName="iPhone 15" />

            {/* Alert setup */}
            <div style={{ background: "linear-gradient(145deg, #1a1a2e, #16213e)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 16, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🔔</div>
              <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>Set a Price Alert</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Get notified when prices drop or exchange values increase</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button style={{ padding: "8px 20px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, color: "#818cf8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📧 Email Alert</button>
                <button style={{ padding: "8px 20px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 8, color: "#4ade80", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>💬 Telegram Alert</button>
              </div>
            </div>
          </div>
        )}

        {/* Trending deals teaser always visible */}
        {step === "home" && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#e2e8f0", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              🔥 Today's Top Exchange Deals
              <span style={{ fontSize: 11, background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>LIVE</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {MOCK_RESULTS.filter(r => r.trending).map(r => (
                <div key={r.id} style={{ background: "linear-gradient(145deg, #1a1a2e, #16213e)", border: "1px solid #2a2a4a", borderRadius: 12, padding: 16 }}
                  onClick={() => { setForm({ ...form }); }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{r.name}</span>
                    <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>🔥 HOT</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Exchange up to</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#10b981" }}>{fmt(Math.max(r.amazon.exchange, r.flipkart.exchange))}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Final from {fmt(Math.min(r.amazon.final, r.flipkart.final))}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1a1a2e", padding: "20px 24px", textAlign: "center", color: "#374151", fontSize: 12, marginTop: 40 }}>
        ExchangeDeal AI · India's #1 Phone Exchange Comparison Platform · Prices updated every 3 hours · Not affiliated with Amazon or Flipkart
      </div>
    </div>
  );
}

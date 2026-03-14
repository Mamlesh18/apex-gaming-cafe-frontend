import { useState, useEffect, useRef } from "react";
import Login from "./Login";

const BRAND = "FragLog";
const BRAND_SUB = "by gamers, for gaming rooms";

/* ─── Particle canvas ─── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const COUNT = 100;
    const particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < COUNT; i++) {
      particles.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.5, isRed: Math.random() > 0.68, o: Math.random() * 0.45 + 0.15 });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) { ctx.beginPath(); ctx.strokeStyle = `rgba(0,255,60,${0.1*(1-d/120)})`; ctx.lineWidth = 0.5; ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); }
        }
      }
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.isRed ? "#ff2828" : "#00ff3c"; ctx.globalAlpha = p.o; ctx.fill(); ctx.globalAlpha = 1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:1 }} />;
}

/* ─── Animated counter ─── */
function Counter({ target, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = Math.ceil(target / 60);
        const timer = setInterval(() => { start += step; if (start >= target) { setVal(target); clearInterval(timer); } else setVal(start); }, 25);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Products ─── */
const PRODUCTS = [
  { icon: "🕹️", title: "Gaming Session Management", desc: "Track every session in real-time. Log rooms, durations, group types, games played, and pricing — all with one tap.", tags: ["Sessions", "Rooms", "Groups", "Pricing"], color: "#ff2828" },
  { icon: "☕", title: "Cafe Management Tool",       desc: "Full food & beverage tracking. Manage your menu, log orders per session, calculate daily profit, and see where every rupee goes.", tags: ["Menu", "Orders", "Profit", "Daily Logs"], color: "#00ff3c" },
  { icon: "📊", title: "Dashboard & Analytics",     desc: "Beautiful charts that tell the story. Visualise revenue, compare gaming vs cafe profit, spot peak hours, and make smarter decisions.", tags: ["Revenue", "Charts", "Trends", "Insights"], color: "#ff2828" },
  { icon: "📋", title: "Log Management",            desc: "Know who's running the show at all times. Track operator shifts, visit history, and maintain accountability across your entire team.", tags: ["Shifts", "Operators", "History", "Access"], color: "#00ff3c" },
];

/* ─── Main ─── */
export default function LandingPage({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [heroText, setHeroText] = useState("");
  const [navScrolled, setNavScrolled] = useState(false);
  const HERO_FULL = "Built for Gaming Rooms by Gamers.";

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { if (i <= HERO_FULL.length) { setHeroText(HERO_FULL.slice(0, i)); i++; } else clearInterval(t); }, 55);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { const h = (e) => setMousePos({ x: e.clientX, y: e.clientY }); window.addEventListener("mousemove", h); return () => window.removeEventListener("mousemove", h); }, []);
  useEffect(() => { const h = () => setNavScrolled(window.scrollY > 40); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  useEffect(() => { document.body.style.overflow = showLogin ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [showLogin]);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="lp-root">
      <div className="landing-grid" style={{ pointerEvents: "none" }} />
      <div className="landing-scanlines" style={{ pointerEvents: "none" }} />
      <div className="landing-vignette" />
      <ParticleCanvas />
      <div className="cursor-glow" style={{ left: mousePos.x, top: mousePos.y }} />

      {/* ── NAV ── */}
      <nav className={`lp-nav${navScrolled ? " lp-nav--scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <span className="lp-logo-icon">⚡</span>
            <span className="lp-logo-text">{BRAND}<span className="lp-logo-sub"> CRM</span></span>
          </div>
          <div className="lp-nav-links">
            <button className="lp-nav-link" onClick={() => scrollTo("products")}>Products</button>
            <button className="lp-nav-link" onClick={() => scrollTo("pricing")}>Pricing</button>
            <button className="lp-nav-link" onClick={() => scrollTo("about")}>About</button>
          </div>
          <button className="lp-login-btn" onClick={() => setShowLogin(true)}>
            Login <span className="lp-login-arrow">→</span>
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero" id="hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            BUILT FOR INDIA'S GAMING ROOMS
          </div>
          <h1 className="lp-hero-title">{heroText}<span className="hero-cursor">|</span></h1>
          <p className="lp-hero-sub">
            We run gaming rooms. We felt every pain point. We built the solution —
            a complete CRM crafted for Indian gaming cafes, by people who live the grind.
          </p>
          <div className="lp-hero-cta">
            <button className="lp-cta-primary" onClick={() => setShowLogin(true)}>
              Get Access <span>→</span>
            </button>
            <button className="lp-cta-ghost" onClick={() => scrollTo("products")}>
              See What's Inside
            </button>
          </div>
          <div className="lp-stats">
            <div className="lp-stat">
              <span className="lp-stat-val"><Counter target={4} /></span>
              <span className="lp-stat-label">Core Tools</span>
            </div>
            <div className="lp-stat-divider" />
            <div className="lp-stat">
              <span className="lp-stat-val">100<span style={{ fontSize: "1.2rem" }}>%</span></span>
              <span className="lp-stat-label">Made in India</span>
            </div>
            <div className="lp-stat-divider" />
            <div className="lp-stat">
              <span className="lp-stat-val">∞</span>
              <span className="lp-stat-label">Sessions Tracked</span>
            </div>
          </div>
        </div>
        <div className="lp-scroll-hint" onClick={() => scrollTo("about")}>
          <span className="lp-scroll-icon">↓</span>
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="lp-about" id="about">
        <div className="lp-section-inner">
          <div className="lp-section-tag">OUR STORY</div>
          <h2 className="lp-section-title">We Know the Struggle</h2>
          <div className="lp-about-grid">
            <div className="lp-about-card lp-about-card--red">
              <div className="lp-about-icon">😤</div>
              <h3>The Problem</h3>
              <p>
                Running a gaming room in India means juggling session timers on paper,
                guessing food profits, losing track of who owes what, and having zero
                visibility into whether your room is actually growing.
              </p>
            </div>
            <div className="lp-about-card lp-about-card--green">
              <div className="lp-about-icon">💡</div>
              <h3>The Solution</h3>
              <p>
                We built {BRAND} — a full CRM designed specifically for gaming rooms.
                Session tracking, cafe orders, profit analytics, operator logs —
                everything in one clean, dark, beautiful dashboard.
              </p>
            </div>
            <div className="lp-about-card lp-about-card--glow">
              <div className="lp-about-icon">🔥</div>
              <h3>Why We Built This</h3>
              <p>
                Pure passion for the Indian gaming scene. Every feature is built with
                real room owners in mind — people who wake up at noon and stay till 3am
                because gaming is not just business, it's a way of life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section className="lp-products" id="products">
        <div className="lp-section-inner">
          <div className="lp-section-tag">WHAT YOU GET</div>
          <h2 className="lp-section-title">Everything Your Room Needs</h2>
          <p className="lp-section-sub">
            Four powerful tools. Designed for Indian gaming rooms, by people who've been there.
          </p>
          <div className="lp-products-grid">
            {PRODUCTS.map((p, i) => (
              <div key={p.title} className="lp-product-card" style={{ animationDelay: `${i * 0.12}s`, "--accent": p.color }}>
                <div className="lp-product-icon" style={{ color: p.color }}>{p.icon}</div>
                <h3 className="lp-product-title">{p.title}</h3>
                <p className="lp-product-desc">{p.desc}</p>
                <div className="lp-product-tags">
                  {p.tags.map((t) => (
                    <span key={t} className="lp-tag" style={{ borderColor: `${p.color}33`, color: p.color }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-pricing" id="pricing">
        <div className="lp-section-inner">
          <div className="lp-section-tag">PRICING</div>
          <h2 className="lp-section-title">You Decide What It's Worth</h2>
          <p className="lp-section-sub">
            No subscription. No tier. No trial. Pay whatever you genuinely feel this is worth to your business — after you've used it.
          </p>

          <div className="lp-pricing-card">
            <span className="corner tl" /><span className="corner tr" />
            <span className="corner bl" /><span className="corner br" />
            <div className="lp-pricing-badge"><span className="status-dot" /> LIVE NOW</div>
            <div className="lp-pricing-main">
              <div className="lp-price-display">
                <span className="lp-price-symbol">₹</span>
                <span className="lp-price-val">?</span>
              </div>
              <p className="lp-price-tagline">Your call. What is it worth to you?</p>
            </div>
            <div className="lp-pricing-features">
              {[
                "Full Gaming Session Management",
                "Cafe & Food Order Tracking",
                "Profit & Analytics Dashboard",
                "Operator Log Management",
                "Unlimited Sessions & Data",
                "Mobile + Desktop Responsive",
                "Multi-user with Roles",
                "No hidden charges. Ever.",
              ].map((f) => (
                <div key={f} className="lp-pricing-feature">
                  <span className="lp-check">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <button className="lp-cta-primary lp-pricing-cta" onClick={() => setShowLogin(true)}>
              Get Access <span>→</span>
            </button>
            <p className="lp-pricing-note">
              Use it. If {BRAND} genuinely helps your room grow, pay what you think it deserves.<br />
              No pressure. No invoice. Just honest value exchange.
            </p>
          </div>

          <div className="lp-passion-strip">
            <span className="lp-passion-icon">🎮</span>
            <p>
              We're building this because we're <strong>absolutely passionate</strong> about
              the Indian gaming scene. Every feature is built with real room owners in mind.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-logo-icon">⚡</span>
            <span className="lp-logo-text">{BRAND}<span className="lp-logo-sub"> CRM</span></span>
          </div>
          <p className="lp-footer-tagline">The CRM for India's Gaming Rooms — {BRAND_SUB}.</p>
          <div className="lp-footer-links">
            <button className="lp-footer-link" onClick={() => scrollTo("products")}>Products</button>
            <span className="lp-footer-sep">·</span>
            <button className="lp-footer-link" onClick={() => scrollTo("pricing")}>Pricing</button>
            <span className="lp-footer-sep">·</span>
            <button className="lp-footer-link" onClick={() => setShowLogin(true)}>Login</button>
          </div>
          <p className="lp-footer-copy">© 2025 {BRAND}. Built with ❤️ for the gaming community of India.</p>
        </div>
      </footer>

      {/* ── LOGIN MODAL ── */}
      {showLogin && (
        <div className="lp-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLogin(false); }}>
          <div className="lp-modal-close" onClick={() => setShowLogin(false)}>✕</div>
          <Login onLogin={onLogin} asModal={true} />
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import api from "../api";

function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const particles = [];
    const COUNT = 90;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.6,
        isRed: Math.random() > 0.65,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 255, 60, ${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.isRed ? "#ff2828" : "#00ff3c";
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
        grd.addColorStop(0, p.isRed ? "rgba(255,40,40,0.15)" : "rgba(0,255,60,0.15)");
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.globalAlpha = p.opacity * 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

export default function Login({ onLogin, asModal = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const cardRef = useRef(null);
  const FULL_TEXT = "APEX GAMING CAFE";

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    const forward = setInterval(() => {
      if (i <= FULL_TEXT.length) {
        setDisplayText(FULL_TEXT.slice(0, i));
        i++;
      } else {
        clearInterval(forward);
      }
    }, 110);
    return () => clearInterval(forward);
  }, []);

  // Blinking cursor
  useEffect(() => {
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  // Cursor glow follows mouse
  useEffect(() => {
    const onMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // 3D tilt on card hover
  const handleCardMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -10, y: dx * 10 });
  };

  const handleCardMouseLeave = () => setTilt({ x: 0, y: 0 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/login", { email: email.trim().toLowerCase(), password });
      onLogin(data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === "Account is deactivated") {
        setError("ACCESS DENIED — Account deactivated");
      } else {
        setError("ACCESS DENIED — Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={asModal ? "login-modal-inner" : "landing-root"}>
      {/* Backgrounds — only when standalone (not inside landing modal) */}
      {!asModal && <div className="landing-grid" />}
      {!asModal && <div className="landing-scanlines" />}
      {!asModal && <div className="landing-vignette" />}
      {!asModal && <ParticleCanvas />}

      {/* Cursor glow */}
      {!asModal && (
        <div
          className="cursor-glow"
          style={{ left: mousePos.x, top: mousePos.y }}
        />
      )}

      {/* Main content */}
      <div className={asModal ? "login-modal-content" : "landing-content"}>
        {/* Hero */}
        <div className="hero-section">
          <div className="hero-logo">⚡</div>
          <h1 className="hero-title">
            {displayText}
            <span className="hero-cursor" style={{ opacity: showCursor ? 1 : 0 }}>|</span>
          </h1>
          <p className="hero-subtitle">GAMING ROOM MANAGEMENT SYSTEM</p>
          <div className="hero-divider">
            <span className="divider-line" />
            <span className="divider-gem">◆</span>
            <span className="divider-line" />
          </div>
        </div>

        {/* Login card */}
        <div
          ref={cardRef}
          className="login-card-3d"
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition:
              tilt.x === 0 && tilt.y === 0
                ? "transform 0.6s ease"
                : "transform 0.08s linear",
          }}
        >
          {/* Corner brackets */}
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />

          <div className="card-header">
            <div className="card-status">
              <span className="status-dot" />
              SYSTEM ONLINE
            </div>
            <h2 className="card-title">AUTHORIZED ACCESS</h2>
            <p className="card-desc">Enter credentials to access the command center</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-field">
              <label className="field-label">OPERATOR EMAIL</label>
              <div className="input-wrap">
                <span className="input-prefix">📧</span>
                <input
                  type="email"
                  placeholder="Enter your email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="field-label">ACCESS CODE</label>
              <div className="input-wrap">
                <span className="input-prefix">🔐</span>
                <input
                  type="password"
                  placeholder="Enter access code..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                  AUTHENTICATING
                </span>
              ) : (
                <span className="btn-text">
                  ENTER SYSTEM <span className="btn-arrow">→</span>
                </span>
              )}
            </button>
          </form>

          <div className="card-footer-bar">
            <span>APEX GAMING CAFE © 2024</span>
            <span className="footer-version">v2.0</span>
          </div>
        </div>

        {/* Feature badges */}
        <div className="feature-badges">
          {[
            { icon: "🕹️", label: "Gaming Sessions" },
            { icon: "🍕", label: "Cafe & Food" },
            { icon: "📊", label: "Analytics" },
            { icon: "📅", label: "Visit Tracker" },
          ].map(({ icon, label }) => (
            <div className="feat-badge" key={label}>
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

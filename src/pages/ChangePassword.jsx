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

export default function ChangePassword({ onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(true);
  const [displayText, setDisplayText] = useState("");
  const cardRef = useRef(null);
  const FULL_TEXT = "SET YOUR PASSWORD";

  // Typewriter
  useEffect(() => {
    let i = 0;
    const forward = setInterval(() => {
      if (i <= FULL_TEXT.length) {
        setDisplayText(FULL_TEXT.slice(0, i));
        i++;
      } else {
        clearInterval(forward);
      }
    }, 100);
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

  // 3D tilt
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

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must differ from current password");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(true);
      // Brief animation then hand back
      setTimeout(() => {
        onPasswordChanged(data.token);
      }, 1800);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === "Current password is incorrect") {
        setError("Current password is incorrect");
      } else {
        setError("Failed to update password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-root">
      {/* Backgrounds */}
      <div className="landing-grid" />
      <div className="landing-scanlines" />
      <div className="landing-vignette" />
      <ParticleCanvas />
      <div className="cursor-glow" style={{ left: mousePos.x, top: mousePos.y }} />

      <div className="landing-content">
        {/* Hero */}
        <div className="hero-section">
          <div className="hero-logo" style={{ color: "#00ff3c" }}>🔑</div>
          <h1 className="hero-title">
            {displayText}
            <span className="hero-cursor" style={{ opacity: showCursor ? 1 : 0 }}>|</span>
          </h1>
          <p className="hero-subtitle">FIRST TIME LOGIN — CHOOSE YOUR PERMANENT ACCESS CODE</p>
          <div className="hero-divider">
            <span className="divider-line" />
            <span className="divider-gem" style={{ color: "#00ff3c" }}>◆</span>
            <span className="divider-line" />
          </div>
        </div>

        {/* Card */}
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
            borderColor: success ? "rgba(0,255,60,0.6)" : undefined,
          }}
        >
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />

          <div className="card-header">
            <div className="card-status" style={{ color: "#00ff3c" }}>
              <span className="status-dot" style={{ background: "#00ff3c" }} />
              FIRST LOGIN DETECTED
            </div>
            <h2 className="card-title">SECURE YOUR ACCOUNT</h2>
            <p className="card-desc">
              You must set a new password before accessing the system
            </p>
          </div>

          {success ? (
            <div className="cp-success-anim">
              <div className="cp-success-icon">✓</div>
              <div className="cp-success-text">PASSWORD UPDATED</div>
              <div className="cp-success-sub">Initializing your session...</div>
              <div className="cp-success-bar">
                <div className="cp-success-bar-fill" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-field">
                <label className="field-label">CURRENT PASSWORD</label>
                <div className="input-wrap">
                  <span className="input-prefix">🔐</span>
                  <input
                    type="password"
                    placeholder="Enter current password..."
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="field-label">NEW PASSWORD</label>
                <div className="input-wrap">
                  <span className="input-prefix">🛡️</span>
                  <input
                    type="password"
                    placeholder="Min. 8 characters..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                {newPassword.length > 0 && (
                  <div className="cp-strength-bar">
                    <div
                      className="cp-strength-fill"
                      style={{
                        width: `${Math.min(100, (newPassword.length / 12) * 100)}%`,
                        background:
                          newPassword.length < 8
                            ? "#ff2828"
                            : newPassword.length < 10
                            ? "#ffaa00"
                            : "#00ff3c",
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="form-field">
                <label className="field-label">CONFIRM NEW PASSWORD</label>
                <div className="input-wrap">
                  <span className="input-prefix">✅</span>
                  <input
                    type="password"
                    placeholder="Repeat new password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                {confirmPassword.length > 0 && newPassword.length > 0 && (
                  <div
                    className="cp-match-indicator"
                    style={{
                      color: confirmPassword === newPassword ? "#00ff3c" : "#ff2828",
                    }}
                  >
                    {confirmPassword === newPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </div>
                )}
              </div>

              {error && <div className="login-error">{error}</div>}

              <button
                type="submit"
                className="login-btn"
                disabled={loading}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,255,60,0.15) 0%, rgba(0,200,50,0.08) 100%)",
                  borderColor: "rgba(0,255,60,0.5)",
                }}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="loading-dot" />
                    <span className="loading-dot" />
                    <span className="loading-dot" />
                    SECURING...
                  </span>
                ) : (
                  <span className="btn-text">
                    SET PASSWORD <span className="btn-arrow">→</span>
                  </span>
                )}
              </button>
            </form>
          )}

          <div className="card-footer-bar">
            <span>APEX GAMING CAFE © 2024</span>
            <span className="footer-version">v2.0</span>
          </div>
        </div>

        {/* Info badges */}
        <div className="feature-badges">
          {[
            { icon: "🔒", label: "Encrypted" },
            { icon: "🛡️", label: "Secure" },
            { icon: "⚡", label: "Instant" },
            { icon: "✅", label: "One-Time" },
          ].map(({ icon, label }) => (
            <div className="feat-badge" key={label}>
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .cp-success-anim {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px 24px;
        }
        .cp-success-icon {
          font-size: 56px;
          color: #00ff3c;
          text-shadow: 0 0 30px rgba(0,255,60,0.8);
          animation: successPop 0.4s ease;
        }
        .cp-success-text {
          font-family: 'Orbitron', monospace;
          font-size: 20px;
          font-weight: 700;
          color: #00ff3c;
          letter-spacing: 3px;
          text-shadow: 0 0 20px rgba(0,255,60,0.6);
        }
        .cp-success-sub {
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          letter-spacing: 1px;
        }
        .cp-success-bar {
          width: 220px;
          height: 3px;
          background: rgba(0,255,60,0.15);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 8px;
        }
        .cp-success-bar-fill {
          height: 100%;
          background: #00ff3c;
          animation: fillBar 1.6s ease forwards;
          box-shadow: 0 0 10px rgba(0,255,60,0.8);
        }
        @keyframes successPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fillBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        .cp-strength-bar {
          height: 3px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 6px;
        }
        .cp-strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease, background 0.3s ease;
        }
        .cp-match-indicator {
          font-size: 11px;
          font-family: 'Share Tech Mono', monospace;
          margin-top: 4px;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}

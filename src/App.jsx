import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ChangePassword from "./pages/ChangePassword";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import Dashboard from "./pages/Dashboard";
import GamingSession from "./pages/GamingSession";
import FoodCafe from "./pages/FoodCafe";
import VisitTracker from "./pages/VisitTracker";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import "./App.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readUserFromStorage() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return {
    token,
    email: localStorage.getItem("email") || "",
    name: localStorage.getItem("name") || "",
    role: localStorage.getItem("role") || "",
    game_id: localStorage.getItem("game_id") || "",
    mustChangePassword: localStorage.getItem("must_change_password") === "true",
  };
}

function clearStorage() {
  ["token", "email", "name", "role", "game_id", "must_change_password"].forEach((k) =>
    localStorage.removeItem(k)
  );
}

// ─── Sidebar components ───────────────────────────────────────────────────────

function MobileHeader({ user, onLogout }) {
  return (
    <div className="mobile-header">
      <h2>⚡ APEX CRM</h2>
      <div className="mobile-header-right">
        <span className="user-badge">{user.name || user.email}</span>
        <span
          className="role-badge-sm"
          style={{ color: user.role === "admin" ? "#ff2828" : "#00ff3c" }}
        >
          {user.role?.toUpperCase()}
        </span>
        <button className="logout-btn-sm" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

function BottomNav({ isAdmin, isManager }) {
  return (
    <nav className="bottom-nav">
      {isAdmin && (
        <NavLink to="/" end>
          <span className="nav-icon">📊</span>
          <span className="nav-label">Dashboard</span>
        </NavLink>
      )}
      <NavLink to="/gaming">
        <span className="nav-icon">🕹️</span>
        <span className="nav-label">Gaming</span>
      </NavLink>
      <NavLink to="/food">
        <span className="nav-icon">🍕</span>
        <span className="nav-label">Food</span>
      </NavLink>
      <NavLink to="/visits">
        <span className="nav-icon">📅</span>
        <span className="nav-label">Visits</span>
      </NavLink>
      {isAdmin && (
        <NavLink to="/users">
          <span className="nav-icon">👥</span>
          <span className="nav-label">Users</span>
        </NavLink>
      )}
      {isAdmin && (
        <NavLink to="/settings">
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </NavLink>
      )}
    </nav>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function App() {
  const [user, setUser] = useState(() => readUserFromStorage());

  // Called from LandingPage → Login → onLogin(data)
  const handleLogin = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("email", data.email);
    localStorage.setItem("name", data.name);
    localStorage.setItem("role", data.role);
    localStorage.setItem("game_id", data.game_id || "");
    localStorage.setItem("must_change_password", String(data.must_change_password));
    setUser({
      token: data.token,
      email: data.email,
      name: data.name,
      role: data.role,
      game_id: data.game_id || "",
      mustChangePassword: data.must_change_password,
    });
  };

  // Called from ChangePassword after successful password update
  const handlePasswordChanged = (newToken) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("must_change_password", "false");
    setUser((prev) => ({
      ...prev,
      token: newToken,
      mustChangePassword: false,
    }));
  };

  const handleLogout = () => {
    clearStorage();
    setUser(null);
  };

  // ── State 1: Not logged in ──
  if (!user || !user.token) {
    return <LandingPage onLogin={handleLogin} />;
  }

  // ── State 2: Must change password ──
  if (user.mustChangePassword) {
    return <ChangePassword onPasswordChanged={handlePasswordChanged} />;
  }

  // ── State 3: Super Admin ──
  if (user.role === "super_admin") {
    return (
      <SuperAdminDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // ── State 4: Admin or Manager (main app) ──
  const isAdmin = user.role === "admin";
  const isManager = user.role === "manager";
  const defaultRoute = isAdmin ? "/" : "/gaming";

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Desktop sidebar */}
        <nav className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">⚡</div>
            <div>
              <h2>APEX CRM</h2>
              <div className="sidebar-game-id">{user.game_id}</div>
            </div>
          </div>

          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {(user.name || user.email || "?").charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name || user.email}</span>
              <span
                className="sidebar-user-role"
                style={{ color: isAdmin ? "#ff2828" : "#00ff3c" }}
              >
                {user.role?.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="nav-links">
            {isAdmin && (
              <NavLink to="/" end>
                📊 Dashboard
              </NavLink>
            )}
            <NavLink to="/gaming">🕹️ Gaming Sessions</NavLink>
            <NavLink to="/food">🍕 Cafe / Food</NavLink>
            <NavLink to="/visits">📅 Visit Tracker</NavLink>
            {isAdmin && (
              <NavLink to="/users">👥 Users</NavLink>
            )}
            {isAdmin && (
              <NavLink to="/settings">⚙️ Settings</NavLink>
            )}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </nav>

        {/* Mobile header */}
        <MobileHeader user={user} onLogout={handleLogout} />

        <main className="main-content">
          <Routes>
            {isAdmin && <Route path="/" element={<Dashboard />} />}
            <Route path="/gaming" element={<GamingSession />} />
            <Route path="/food" element={<FoodCafe />} />
            <Route path="/visits" element={<VisitTracker />} />
            {isAdmin && <Route path="/users" element={<UserManagement />} />}
            {isAdmin && <Route path="/settings" element={<Settings />} />}
            <Route path="*" element={<Navigate to={defaultRoute} replace />} />
          </Routes>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav isAdmin={isAdmin} isManager={isManager} />
      </div>

      <style>{`
        .sidebar-logo {
          font-size: 28px;
          filter: drop-shadow(0 0 10px rgba(255,40,40,0.7));
        }
        .sidebar-game-id {
          font-size: 10px;
          color: rgba(255,40,40,0.6);
          letter-spacing: 1px;
          font-family: 'Orbitron', monospace;
        }
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          margin: 8px 0;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
        }
        .sidebar-user-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255,40,40,0.3), rgba(255,40,40,0.1));
          border: 1px solid rgba(255,40,40,0.3);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Orbitron', monospace;
          font-size: 15px; font-weight: 700; color: #ff2828;
          flex-shrink: 0;
        }
        .sidebar-user-info { display: flex; flex-direction: column; min-width: 0; }
        .sidebar-user-name {
          font-size: 13px; font-weight: 600; color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sidebar-user-role {
          font-family: 'Orbitron', monospace;
          font-size: 9px; font-weight: 700; letter-spacing: 1px;
        }
        .role-badge-sm {
          font-family: 'Orbitron', monospace;
          font-size: 9px; font-weight: 700; letter-spacing: 1px;
        }
      `}</style>
    </BrowserRouter>
  );
}

export default App;

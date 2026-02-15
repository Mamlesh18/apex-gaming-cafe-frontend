import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import GamingSession from "./pages/GamingSession";
import FoodCafe from "./pages/FoodCafe";
import VisitTracker from "./pages/VisitTracker";
import Settings from "./pages/Settings";
import "./App.css";

function MobileHeader({ user, onLogout }) {
  return (
    <div className="mobile-header">
      <h2>🎮 Gaming Room</h2>
      <div className="mobile-header-right">
        <span className="user-badge">{user}</span>
        <button className="logout-btn-sm" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

function BottomNav({ isAdmin }) {
  return (
    <nav className="bottom-nav">
      {isAdmin && <NavLink to="/" end><span className="nav-icon">📊</span><span className="nav-label">Dashboard</span></NavLink>}
      <NavLink to="/gaming"><span className="nav-icon">🕹️</span><span className="nav-label">Gaming</span></NavLink>
      <NavLink to="/food"><span className="nav-icon">🍕</span><span className="nav-label">Food</span></NavLink>
      <NavLink to="/visits"><span className="nav-icon">📅</span><span className="nav-label">Visits</span></NavLink>
      {isAdmin && <NavLink to="/settings"><span className="nav-icon">⚙️</span><span className="nav-label">Settings</span></NavLink>}
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(localStorage.getItem("username") || "");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    setUser("");
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const role = localStorage.getItem("role") || "friend";
  const isAdmin = role === "admin";
  const defaultRoute = isAdmin ? "/" : "/gaming";

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Desktop sidebar */}
        <nav className="sidebar">
          <div className="sidebar-header">
            <h2>🎮 Gaming Room</h2>
            <span className="user-badge">{user}</span>
          </div>
          <div className="nav-links">
            {isAdmin && <NavLink to="/" end>📊 Dashboard</NavLink>}
            <NavLink to="/gaming">🕹️ Gaming Sessions</NavLink>
            <NavLink to="/food">🍕 Cafe / Food</NavLink>
            <NavLink to="/visits">📅 Visit Tracker</NavLink>
            {isAdmin && <NavLink to="/settings">⚙️ Settings</NavLink>}
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </nav>

        {/* Mobile header */}
        <MobileHeader user={user} onLogout={handleLogout} />

        <main className="main-content">
          <Routes>
            {isAdmin && <Route path="/" element={<Dashboard />} />}
            <Route path="/gaming" element={<GamingSession />} />
            <Route path="/food" element={<FoodCafe />} />
            <Route path="/visits" element={<VisitTracker />} />
            {isAdmin && <Route path="/settings" element={<Settings />} />}
            <Route path="*" element={<Navigate to={defaultRoute} />} />
          </Routes>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav isAdmin={isAdmin} />
      </div>
    </BrowserRouter>
  );
}

export default App;

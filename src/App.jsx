import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import GamingSession from "./pages/GamingSession";
import FoodCafe from "./pages/FoodCafe";
import VisitTracker from "./pages/VisitTracker";
import Settings from "./pages/Settings";
import "./App.css";

function App() {
  const [user, setUser] = useState(localStorage.getItem("username") || "");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser("");
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <nav className="sidebar">
          <div className="sidebar-header">
            <h2>🎮 Gaming Room</h2>
            <span className="user-badge">{user}</span>
          </div>
          <div className="nav-links">
            <NavLink to="/" end>📊 Dashboard</NavLink>
            <NavLink to="/gaming">🕹️ Gaming Sessions</NavLink>
            <NavLink to="/food">🍕 Cafe / Food</NavLink>
            <NavLink to="/visits">📅 Visit Tracker</NavLink>
            <NavLink to="/settings">⚙️ Settings</NavLink>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/gaming" element={<GamingSession />} />
            <Route path="/food" element={<FoodCafe />} />
            <Route path="/visits" element={<VisitTracker />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

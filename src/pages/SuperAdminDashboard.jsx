import { useState, useEffect } from "react";
import api from "../api";

export default function SuperAdminDashboard({ user, onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedStats, setExpandedStats] = useState({});
  const [loadingStats, setLoadingStats] = useState({});
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    cafe_name: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
  });
  const [onboardError, setOnboardError] = useState("");
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState(null);
  const [migratingId, setMigratingId] = useState(null);
  const [migrateResult, setMigrateResult] = useState({});

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const { data } = await api.get("/super/customers");
      setCustomers(data);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchStats = async (game_id) => {
    if (expandedStats[game_id]) return;
    setLoadingStats((prev) => ({ ...prev, [game_id]: true }));
    try {
      const { data } = await api.get(`/super/customers/${game_id}/stats`);
      setExpandedStats((prev) => ({ ...prev, [game_id]: data }));
    } catch (err) {
      console.error("Failed to fetch stats for", game_id, err);
    } finally {
      setLoadingStats((prev) => ({ ...prev, [game_id]: false }));
    }
  };

  const handleRowClick = (game_id) => {
    if (expandedId === game_id) {
      setExpandedId(null);
    } else {
      setExpandedId(game_id);
      fetchStats(game_id);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setOnboardError("");
    setOnboardLoading(true);
    try {
      const { data } = await api.post("/super/onboard-customer", {
        cafe_name: onboardForm.cafe_name,
        admin_name: onboardForm.admin_name,
        admin_email: onboardForm.admin_email.toLowerCase(),
        admin_password: onboardForm.admin_password,
      });
      setOnboardSuccess(data);
      setOnboardForm({ cafe_name: "", admin_name: "", admin_email: "", admin_password: "" });
      fetchCustomers();
    } catch (err) {
      setOnboardError(err.response?.data?.detail || "Failed to onboard customer");
    } finally {
      setOnboardLoading(false);
    }
  };

  const handleMigrate = async (game_id) => {
    if (!window.confirm(`Migrate ALL legacy data from 'gaming_room_crm' database into ${game_id}?\n\nThis is safe to run multiple times — already-migrated records are skipped.`)) return;
    setMigratingId(game_id);
    try {
      const { data } = await api.post("/super/migrate-legacy", { game_id });
      setMigrateResult((prev) => ({ ...prev, [game_id]: { success: true, data } }));
      // Refresh stats since data changed
      setExpandedStats((prev) => { const n = { ...prev }; delete n[game_id]; return n; });
      fetchStats(game_id);
    } catch (err) {
      setMigrateResult((prev) => ({
        ...prev,
        [game_id]: { success: false, error: err.response?.data?.detail || "Migration failed" },
      }));
    } finally {
      setMigratingId(null);
    }
  };

  const closeModal = () => {
    setShowOnboard(false);
    setOnboardError("");
    setOnboardSuccess(null);
    setOnboardForm({ cafe_name: "", admin_name: "", admin_email: "", admin_password: "" });
  };

  // Aggregate stats
  const totalCustomers = customers.length;
  const totalUsers = customers.reduce((sum, c) => sum + (c.user_count || 0), 0);
  const activeCustomers = customers.filter((c) => c.is_active).length;

  return (
    <div className="sad-root">
      {/* Background */}
      <div className="landing-grid" style={{ opacity: 0.3, pointerEvents: "none" }} />
      <div className="landing-scanlines" style={{ opacity: 0.03, pointerEvents: "none" }} />

      {/* Header */}
      <header className="sad-header">
        <div className="sad-header-left">
          <div className="sad-logo">⚡</div>
          <div>
            <h1 className="sad-title">APEX COMMAND CENTER</h1>
            <p className="sad-subtitle">Super Admin Dashboard</p>
          </div>
        </div>
        <div className="sad-header-right">
          <div className="sad-user-badge">
            <span className="sad-role-dot" />
            <div className="sad-user-info">
              <span className="sad-user-name">{user.name || "Super Admin"}</span>
              <span className="sad-user-email">{user.email}</span>
            </div>
            <span className="sad-role-tag">SUPER ADMIN</span>
          </div>
          <button className="sad-logout-btn" onClick={onLogout}>
            LOGOUT →
          </button>
        </div>
      </header>

      <div className="sad-body">
        {/* Stats row */}
        <div className="sad-stats-row">
          <div className="sad-stat-card">
            <span className="sad-stat-icon">🏪</span>
            <div>
              <div className="sad-stat-val">{totalCustomers}</div>
              <div className="sad-stat-label">Total Cafes</div>
            </div>
          </div>
          <div className="sad-stat-card">
            <span className="sad-stat-icon">✅</span>
            <div>
              <div className="sad-stat-val" style={{ color: "#00ff3c" }}>{activeCustomers}</div>
              <div className="sad-stat-label">Active Cafes</div>
            </div>
          </div>
          <div className="sad-stat-card">
            <span className="sad-stat-icon">👥</span>
            <div>
              <div className="sad-stat-val">{totalUsers}</div>
              <div className="sad-stat-label">Total Users</div>
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="sad-section-header">
          <div>
            <h2 className="sad-section-title">REGISTERED CAFES</h2>
            <p className="sad-section-sub">Click a row to expand stats · {customers.length} cafes registered</p>
          </div>
          <button className="sad-onboard-btn" onClick={() => setShowOnboard(true)}>
            + ONBOARD NEW CUSTOMER
          </button>
        </div>

        {/* Customers table */}
        {loadingCustomers ? (
          <div className="sad-loading">
            <div className="sad-spinner" />
            <span>Loading customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="sad-empty">
            <span>🏪</span>
            <p>No customers onboarded yet.</p>
            <button className="sad-onboard-btn" onClick={() => setShowOnboard(true)}>
              Onboard First Customer
            </button>
          </div>
        ) : (
          <div className="sad-table-wrap">
            <table className="sad-table">
              <thead>
                <tr>
                  <th>GAME ID</th>
                  <th>CAFE NAME</th>
                  <th>ADMIN EMAIL</th>
                  <th>USERS</th>
                  <th>STATUS</th>
                  <th>CREATED</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <>
                    <tr
                      key={c.game_id}
                      className={`sad-row${expandedId === c.game_id ? " sad-row--expanded" : ""}`}
                      onClick={() => handleRowClick(c.game_id)}
                    >
                      <td>
                        <span className="sad-game-id">{c.game_id}</span>
                      </td>
                      <td className="sad-cafe-name">{c.cafe_name}</td>
                      <td className="sad-email">{c.admin_email}</td>
                      <td>
                        <span className="sad-user-count">{c.user_count || 0}</span>
                      </td>
                      <td>
                        <span className={`sad-status-badge ${c.is_active ? "sad-status--active" : "sad-status--inactive"}`}>
                          {c.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="sad-date">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="sad-chevron">{expandedId === c.game_id ? "▲" : "▼"}</td>
                    </tr>
                    {expandedId === c.game_id && (
                      <tr key={`${c.game_id}-stats`} className="sad-expand-row">
                        <td colSpan={7}>
                          {loadingStats[c.game_id] ? (
                            <div className="sad-expand-loading">
                              <div className="sad-spinner" />
                              Loading stats...
                            </div>
                          ) : expandedStats[c.game_id] ? (
                            <div className="sad-expand-content">
                              <div className="sad-expand-stats">
                                <div className="sad-expand-stat">
                                  <div className="sad-expand-val" style={{ color: "#ff2828" }}>
                                    ₹{expandedStats[c.game_id].stats.total_gaming_revenue.toFixed(2)}
                                  </div>
                                  <div className="sad-expand-label">Gaming Revenue</div>
                                </div>
                                <div className="sad-expand-stat">
                                  <div className="sad-expand-val" style={{ color: "#00ff3c" }}>
                                    ₹{expandedStats[c.game_id].stats.total_food_profit.toFixed(2)}
                                  </div>
                                  <div className="sad-expand-label">Food Profit</div>
                                </div>
                                <div className="sad-expand-stat">
                                  <div className="sad-expand-val">{expandedStats[c.game_id].stats.session_count}</div>
                                  <div className="sad-expand-label">Sessions</div>
                                </div>
                                <div className="sad-expand-stat">
                                  <div className="sad-expand-val">{expandedStats[c.game_id].stats.food_count}</div>
                                  <div className="sad-expand-label">Food Entries</div>
                                </div>
                                <div className="sad-expand-stat">
                                  <div className="sad-expand-val">{expandedStats[c.game_id].stats.user_count}</div>
                                  <div className="sad-expand-label">Users</div>
                                </div>
                              </div>
                              {expandedStats[c.game_id].settings && (
                                <div className="sad-expand-settings">
                                  <span className="sad-expand-settings-label">Settings:</span>
                                  <span>
                                    Private ₹{expandedStats[c.game_id].settings.private_price}/hr
                                  </span>
                                  <span>
                                    Normal ₹{expandedStats[c.game_id].settings.normal_price}/hr
                                  </span>
                                </div>
                              )}
                              {/* Legacy migration */}
                              <div className="sad-migrate-row">
                                <div>
                                  <div className="sad-migrate-title">⚠ LEGACY DATA MIGRATION</div>
                                  <div className="sad-migrate-sub">
                                    Import all existing sessions, food entries &amp; visits from the old single-tenant database into this cafe's account.
                                  </div>
                                </div>
                                <button
                                  className="sad-migrate-btn"
                                  onClick={(e) => { e.stopPropagation(); handleMigrate(c.game_id); }}
                                  disabled={migratingId === c.game_id}
                                >
                                  {migratingId === c.game_id ? "MIGRATING..." : "↑ MIGRATE LEGACY DATA"}
                                </button>
                              </div>
                              {migrateResult[c.game_id] && (
                                <div className={`sad-migrate-result ${migrateResult[c.game_id].success ? "sad-migrate-result--ok" : "sad-migrate-result--err"}`}>
                                  {migrateResult[c.game_id].success ? (
                                    <>
                                      ✓ {migrateResult[c.game_id].data.message}<br />
                                      <span style={{ opacity: 0.6, fontSize: 11 }}>
                                        Sessions: {migrateResult[c.game_id].data.migrated.gaming_sessions} ·
                                        Food: {migrateResult[c.game_id].data.migrated.food_entries} ·
                                        Visits: {migrateResult[c.game_id].data.migrated.visits} ·
                                        Skipped: {migrateResult[c.game_id].data.migrated.skipped}
                                      </span>
                                    </>
                                  ) : (
                                    `✗ ${migrateResult[c.game_id].error}`
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="sad-expand-loading">Failed to load stats</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard Modal */}
      {showOnboard && (
        <div className="sad-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="sad-modal">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />

            <div className="sad-modal-header">
              <h3 className="sad-modal-title">ONBOARD NEW CUSTOMER</h3>
              <button className="sad-modal-close" onClick={closeModal}>✕</button>
            </div>

            {onboardSuccess ? (
              <div className="sad-onboard-success">
                <div className="sad-os-icon">✓</div>
                <h4>CUSTOMER ONBOARDED!</h4>
                <div className="sad-os-details">
                  <div><span>Cafe:</span> {onboardSuccess.cafe_name}</div>
                  <div><span>Game ID:</span> <strong style={{ color: "#ff2828" }}>{onboardSuccess.game_id}</strong></div>
                  <div><span>Admin Email:</span> {onboardSuccess.admin_email}</div>
                </div>
                <p className="sad-os-note">
                  Share the Game ID and admin credentials with the cafe owner.
                  They must change their password on first login.
                </p>
                <button className="sad-onboard-btn" onClick={closeModal}>DONE</button>
              </div>
            ) : (
              <form className="sad-onboard-form" onSubmit={handleOnboardSubmit}>
                <div className="sad-form-field">
                  <label>CAFE NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. Nexus Gaming Cafe"
                    value={onboardForm.cafe_name}
                    onChange={(e) => setOnboardForm((f) => ({ ...f, cafe_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="sad-form-field">
                  <label>ADMIN NAME</label>
                  <input
                    type="text"
                    placeholder="Cafe owner's name"
                    value={onboardForm.admin_name}
                    onChange={(e) => setOnboardForm((f) => ({ ...f, admin_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="sad-form-field">
                  <label>ADMIN EMAIL</label>
                  <input
                    type="email"
                    placeholder="admin@cafename.com"
                    value={onboardForm.admin_email}
                    onChange={(e) => setOnboardForm((f) => ({ ...f, admin_email: e.target.value }))}
                    required
                  />
                </div>
                <div className="sad-form-field">
                  <label>TEMPORARY PASSWORD</label>
                  <input
                    type="password"
                    placeholder="Temporary login password"
                    value={onboardForm.admin_password}
                    onChange={(e) => setOnboardForm((f) => ({ ...f, admin_password: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>
                {onboardError && <div className="sad-form-error">{onboardError}</div>}
                <button type="submit" className="sad-onboard-btn sad-onboard-btn--full" disabled={onboardLoading}>
                  {onboardLoading ? "CREATING..." : "CREATE CUSTOMER →"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        .sad-root {
          min-height: 100vh;
          background: #000;
          position: relative;
          overflow-x: hidden;
          font-family: 'Share Tech Mono', monospace;
          color: #fff;
        }
        .sad-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          border-bottom: 1px solid rgba(255,40,40,0.2);
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .sad-body { padding: 32px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 10; }
        .sad-header-left { display: flex; align-items: center; gap: 16px; }
        .sad-logo { font-size: 32px; filter: drop-shadow(0 0 12px rgba(255,40,40,0.8)); }
        .sad-title {
          font-family: 'Orbitron', monospace;
          font-size: 20px;
          font-weight: 900;
          color: #fff;
          letter-spacing: 3px;
          margin: 0;
        }
        .sad-subtitle { font-size: 11px; color: rgba(255,40,40,0.7); letter-spacing: 2px; margin: 2px 0 0; }
        .sad-header-right { display: flex; align-items: center; gap: 16px; }
        .sad-user-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          border: 1px solid rgba(255,40,40,0.3);
          border-radius: 6px;
          background: rgba(255,40,40,0.05);
        }
        .sad-role-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #ff2828;
          box-shadow: 0 0 8px rgba(255,40,40,0.8);
          animation: dotPulse 2s infinite;
        }
        .sad-user-info { display: flex; flex-direction: column; }
        .sad-user-name { font-size: 13px; font-weight: 700; color: #fff; }
        .sad-user-email { font-size: 10px; color: rgba(255,255,255,0.4); }
        .sad-role-tag {
          font-family: 'Orbitron', monospace;
          font-size: 9px;
          font-weight: 700;
          color: #ff2828;
          letter-spacing: 1px;
          border: 1px solid rgba(255,40,40,0.4);
          padding: 2px 6px;
          border-radius: 3px;
        }
        .sad-logout-btn {
          background: none;
          border: 1px solid rgba(255,40,40,0.4);
          color: #ff2828;
          font-family: 'Orbitron', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sad-logout-btn:hover {
          background: rgba(255,40,40,0.1);
          border-color: rgba(255,40,40,0.8);
          box-shadow: 0 0 12px rgba(255,40,40,0.3);
        }
        .sad-stats-row { display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; }
        .sad-stat-card {
          flex: 1; min-width: 160px;
          display: flex; align-items: center; gap: 14px;
          padding: 20px 24px;
          border: 1px solid rgba(255,40,40,0.2);
          border-radius: 8px;
          background: rgba(255,40,40,0.04);
          backdrop-filter: blur(8px);
        }
        .sad-stat-icon { font-size: 28px; }
        .sad-stat-val { font-family: 'Orbitron', monospace; font-size: 28px; font-weight: 900; color: #fff; line-height: 1; }
        .sad-stat-label { font-size: 11px; color: rgba(255,255,255,0.4); letter-spacing: 1px; margin-top: 4px; }
        .sad-section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
        }
        .sad-section-title { font-family: 'Orbitron', monospace; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #fff; margin: 0; }
        .sad-section-sub { font-size: 11px; color: rgba(255,255,255,0.35); margin: 4px 0 0; }
        .sad-onboard-btn {
          background: linear-gradient(135deg, rgba(255,40,40,0.15), rgba(255,40,40,0.05));
          border: 1px solid rgba(255,40,40,0.5);
          color: #ff2828;
          font-family: 'Orbitron', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sad-onboard-btn:hover {
          background: linear-gradient(135deg, rgba(255,40,40,0.25), rgba(255,40,40,0.1));
          box-shadow: 0 0 16px rgba(255,40,40,0.3);
        }
        .sad-onboard-btn--full { width: 100%; margin-top: 8px; padding: 14px; font-size: 13px; }
        .sad-loading, .sad-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 16px; padding: 60px; color: rgba(255,255,255,0.4);
          font-size: 14px; letter-spacing: 1px;
        }
        .sad-empty span { font-size: 48px; }
        .sad-spinner {
          width: 32px; height: 32px;
          border: 2px solid rgba(255,40,40,0.2);
          border-top-color: #ff2828;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .sad-table-wrap { overflow-x: auto; border-radius: 8px; border: 1px solid rgba(255,40,40,0.15); }
        .sad-table { width: 100%; border-collapse: collapse; }
        .sad-table thead tr {
          background: rgba(255,40,40,0.06);
          border-bottom: 1px solid rgba(255,40,40,0.2);
        }
        .sad-table th {
          padding: 12px 16px;
          text-align: left;
          font-family: 'Orbitron', monospace;
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,40,40,0.7);
          letter-spacing: 1.5px;
        }
        .sad-table td { padding: 14px 16px; font-size: 13px; color: rgba(255,255,255,0.8); }
        .sad-row {
          border-bottom: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
          transition: background 0.15s;
        }
        .sad-row:hover { background: rgba(255,40,40,0.05); }
        .sad-row--expanded { background: rgba(255,40,40,0.06); border-bottom: none; }
        .sad-game-id {
          font-family: 'Orbitron', monospace;
          font-size: 11px;
          color: #ff2828;
          letter-spacing: 1px;
        }
        .sad-cafe-name { font-weight: 600; color: #fff; }
        .sad-email { color: rgba(255,255,255,0.55); font-size: 12px; }
        .sad-user-count { font-family: 'Orbitron', monospace; font-size: 14px; color: #fff; }
        .sad-status-badge {
          font-family: 'Orbitron', monospace;
          font-size: 9px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 3px;
          letter-spacing: 1px;
        }
        .sad-status--active { background: rgba(0,255,60,0.1); color: #00ff3c; border: 1px solid rgba(0,255,60,0.3); }
        .sad-status--inactive { background: rgba(255,40,40,0.1); color: #ff2828; border: 1px solid rgba(255,40,40,0.3); }
        .sad-date { font-size: 12px; color: rgba(255,255,255,0.4); }
        .sad-chevron { color: rgba(255,40,40,0.6); font-size: 11px; text-align: center; }
        .sad-expand-row { background: rgba(0,0,0,0.4); }
        .sad-expand-loading {
          display: flex; align-items: center; gap: 12px;
          padding: 20px 24px; color: rgba(255,255,255,0.4); font-size: 13px;
        }
        .sad-expand-content { padding: 20px 24px; }
        .sad-expand-stats { display: flex; gap: 32px; flex-wrap: wrap; margin-bottom: 16px; }
        .sad-expand-stat { display: flex; flex-direction: column; gap: 4px; }
        .sad-expand-val { font-family: 'Orbitron', monospace; font-size: 20px; font-weight: 700; color: #fff; }
        .sad-expand-label { font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 1px; }
        .sad-expand-settings {
          display: flex; gap: 20px; align-items: center;
          font-size: 12px; color: rgba(255,255,255,0.5);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 12px;
        }
        .sad-expand-settings-label { color: rgba(255,40,40,0.6); font-size: 10px; letter-spacing: 1px; }

        /* Modal */
        .sad-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(6px);
          z-index: 999;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .sad-modal {
          position: relative;
          background: #0a0a0a;
          border: 1px solid rgba(255,40,40,0.3);
          border-radius: 12px;
          padding: 32px;
          width: 100%; max-width: 480px;
          box-shadow: 0 0 60px rgba(255,40,40,0.15);
        }
        .sad-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px;
        }
        .sad-modal-title {
          font-family: 'Orbitron', monospace;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 2px;
          margin: 0;
        }
        .sad-modal-close {
          background: none; border: none;
          color: rgba(255,255,255,0.4);
          font-size: 18px; cursor: pointer;
          padding: 4px 8px;
          transition: color 0.2s;
        }
        .sad-modal-close:hover { color: #ff2828; }
        .sad-onboard-form { display: flex; flex-direction: column; gap: 16px; }
        .sad-form-field { display: flex; flex-direction: column; gap: 6px; }
        .sad-form-field label {
          font-family: 'Orbitron', monospace;
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,40,40,0.7);
          letter-spacing: 1.5px;
        }
        .sad-form-field input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          color: #fff;
          font-family: 'Share Tech Mono', monospace;
          font-size: 14px;
          padding: 10px 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .sad-form-field input:focus {
          border-color: rgba(255,40,40,0.5);
          box-shadow: 0 0 12px rgba(255,40,40,0.1);
        }
        .sad-form-error {
          color: #ff2828;
          font-size: 12px;
          background: rgba(255,40,40,0.08);
          border: 1px solid rgba(255,40,40,0.2);
          border-radius: 4px;
          padding: 8px 12px;
        }
        .sad-onboard-success {
          display: flex; flex-direction: column; align-items: center;
          gap: 16px; text-align: center;
        }
        .sad-os-icon { font-size: 52px; color: #00ff3c; text-shadow: 0 0 24px rgba(0,255,60,0.8); }
        .sad-onboard-success h4 {
          font-family: 'Orbitron', monospace;
          font-size: 16px; font-weight: 700;
          color: #00ff3c; letter-spacing: 2px; margin: 0;
        }
        .sad-os-details {
          width: 100%;
          background: rgba(0,255,60,0.04);
          border: 1px solid rgba(0,255,60,0.15);
          border-radius: 6px;
          padding: 16px;
          text-align: left;
          display: flex; flex-direction: column; gap: 8px;
          font-size: 13px; color: rgba(255,255,255,0.7);
        }
        .sad-os-details span { color: rgba(255,255,255,0.4); font-size: 11px; display: block; margin-bottom: 2px; }
        .sad-os-note {
          font-size: 12px; color: rgba(255,255,255,0.4);
          background: rgba(255,170,0,0.06);
          border: 1px solid rgba(255,170,0,0.15);
          border-radius: 4px;
          padding: 10px 12px;
          line-height: 1.5;
        }

        /* Migration row */
        .sad-migrate-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
          margin-top: 16px;
          padding: 14px 16px;
          background: rgba(255, 165, 0, 0.04);
          border: 1px solid rgba(255, 165, 0, 0.15);
          border-radius: 6px;
        }
        .sad-migrate-title {
          font-family: 'Orbitron', monospace;
          font-size: 10px; font-weight: 700;
          color: rgba(255,165,0,0.8); letter-spacing: 1px; margin-bottom: 4px;
        }
        .sad-migrate-sub { font-size: 11px; color: rgba(255,255,255,0.35); line-height: 1.5; max-width: 500px; }
        .sad-migrate-btn {
          flex-shrink: 0;
          background: rgba(255,165,0,0.08);
          border: 1px solid rgba(255,165,0,0.4);
          color: rgba(255,165,0,0.9);
          font-family: 'Orbitron', monospace;
          font-size: 10px; font-weight: 700; letter-spacing: 1px;
          padding: 9px 16px; border-radius: 4px;
          cursor: pointer; transition: all 0.2s;
          white-space: nowrap;
        }
        .sad-migrate-btn:hover:not(:disabled) {
          background: rgba(255,165,0,0.15);
          box-shadow: 0 0 12px rgba(255,165,0,0.25);
        }
        .sad-migrate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sad-migrate-result {
          margin-top: 8px; padding: 10px 14px;
          border-radius: 4px; font-size: 12px; line-height: 1.6;
        }
        .sad-migrate-result--ok {
          background: rgba(0,255,60,0.06); border: 1px solid rgba(0,255,60,0.2); color: #00ff3c;
        }
        .sad-migrate-result--err {
          background: rgba(255,40,40,0.06); border: 1px solid rgba(255,40,40,0.2); color: #ff4444;
        }

        @media (max-width: 768px) {
          .sad-header { padding: 12px 16px; flex-wrap: wrap; gap: 12px; }
          .sad-title { font-size: 14px; }
          .sad-body { padding: 16px; }
          .sad-stats-row { gap: 10px; }
          .sad-section-header { flex-direction: column; align-items: flex-start; }
          .sad-table th, .sad-table td { padding: 10px 10px; font-size: 11px; }
          .sad-user-badge { display: none; }
        }
      `}</style>
    </div>
  );
}

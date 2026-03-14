import { useState, useEffect } from "react";
import api from "../api";

const ROLE_COLORS = {
  admin: { bg: "rgba(255,40,40,0.12)", border: "rgba(255,40,40,0.4)", text: "#ff2828" },
  manager: { bg: "rgba(0,255,60,0.08)", border: "rgba(0,255,60,0.3)", text: "#00ff3c" },
};

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.manager;
  return (
    <span
      style={{
        fontFamily: "'Orbitron', monospace",
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "1px",
        padding: "3px 8px",
        borderRadius: "3px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
      }}
    >
      {role.toUpperCase()}
    </span>
  );
}

export default function UserManagement() {
  const myEmail = localStorage.getItem("email") || "";
  const gameId = localStorage.getItem("game_id") || "";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add user modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", role: "manager" });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toggle active loading
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/manage/users");
      setUsers(data);
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      await api.post("/manage/users", {
        name: addForm.name,
        email: addForm.email.trim().toLowerCase(),
        password: addForm.password,
        role: addForm.role,
      });
      setAddForm({ name: "", email: "", password: "", role: "manager" });
      setShowAdd(false);
      fetchUsers();
    } catch (err) {
      setAddError(err.response?.data?.detail || "Failed to create user");
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleActive = async (u) => {
    if (u.email === myEmail) return;
    setTogglingId(u.id);
    try {
      await api.put(`/manage/users/${u.id}`, { is_active: !u.is_active });
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, is_active: !x.is_active } : x))
      );
    } catch (err) {
      console.error("Toggle failed", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/manage/users/${deleteTarget.id}`);
      setUsers((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="um-root">
      {/* Header */}
      <div className="um-header">
        <div className="um-header-left">
          <h2 className="um-title">USER MANAGEMENT</h2>
          <div className="um-game-badge">
            <span className="um-game-dot" />
            {gameId}
          </div>
        </div>
        <button className="um-add-btn" onClick={() => setShowAdd(true)}>
          + ADD USER
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="um-loading">
          <div className="um-spinner" />
          <span>Loading users...</span>
        </div>
      ) : error ? (
        <div className="um-error">{error}</div>
      ) : users.length === 0 ? (
        <div className="um-empty">
          <span>👥</span>
          <p>No users yet. Add the first user.</p>
          <button className="um-add-btn" onClick={() => setShowAdd(true)}>ADD USER</button>
        </div>
      ) : (
        <div className="um-grid">
          {users.map((u) => (
            <div key={u.id} className={`um-card${!u.is_active ? " um-card--inactive" : ""}`}>
              {/* Top row */}
              <div className="um-card-top">
                <div className="um-avatar">
                  {(u.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="um-card-info">
                  <div className="um-card-name">{u.name}</div>
                  <div className="um-card-email">{u.email}</div>
                </div>
                <RoleBadge role={u.role} />
              </div>

              {/* Meta row */}
              <div className="um-card-meta">
                <div className="um-meta-item">
                  <span className="um-meta-label">STATUS</span>
                  <span
                    className="um-meta-val"
                    style={{ color: u.is_active ? "#00ff3c" : "#ff2828" }}
                  >
                    {u.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                {u.must_change_password && (
                  <div className="um-meta-item">
                    <span className="um-meta-label">PASS</span>
                    <span className="um-meta-val" style={{ color: "#ffaa00" }}>MUST CHANGE</span>
                  </div>
                )}
                <div className="um-meta-item">
                  <span className="um-meta-label">CREATED</span>
                  <span className="um-meta-val">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN") : "—"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {u.email !== myEmail && (
                <div className="um-card-actions">
                  <button
                    className={`um-toggle-btn${u.is_active ? " um-toggle-btn--deactivate" : " um-toggle-btn--activate"}`}
                    onClick={() => handleToggleActive(u)}
                    disabled={togglingId === u.id}
                  >
                    {togglingId === u.id
                      ? "..."
                      : u.is_active
                      ? "DEACTIVATE"
                      : "ACTIVATE"}
                  </button>
                  <button
                    className="um-delete-btn"
                    onClick={() => setDeleteTarget(u)}
                  >
                    DELETE
                  </button>
                </div>
              )}
              {u.email === myEmail && (
                <div className="um-self-badge">YOU</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      {showAdd && (
        <div className="um-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="um-modal">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
            <div className="um-modal-header">
              <h3 className="um-modal-title">ADD NEW USER</h3>
              <button className="um-modal-close" onClick={() => { setShowAdd(false); setAddError(""); }}>✕</button>
            </div>
            <form className="um-form" onSubmit={handleAddSubmit}>
              <div className="um-field">
                <label>FULL NAME</label>
                <input
                  type="text"
                  placeholder="User's full name"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="um-field">
                <label>EMAIL</label>
                <input
                  type="email"
                  placeholder="user@cafe.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="um-field">
                <label>TEMPORARY PASSWORD</label>
                <input
                  type="password"
                  placeholder="Temporary password (they'll change it)"
                  value={addForm.password}
                  onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="um-field">
                <label>ROLE</label>
                <div className="um-role-selector">
                  {["admin", "manager"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`um-role-opt${addForm.role === r ? " um-role-opt--active" : ""}`}
                      style={
                        addForm.role === r
                          ? {
                              background: ROLE_COLORS[r].bg,
                              borderColor: ROLE_COLORS[r].border,
                              color: ROLE_COLORS[r].text,
                            }
                          : {}
                      }
                      onClick={() => setAddForm((f) => ({ ...f, role: r }))}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="um-role-desc">
                  {addForm.role === "admin"
                    ? "Full access: sessions, food, visits, users, settings"
                    : "Limited access: sessions, food, visits only"}
                </div>
              </div>
              {addError && <div className="um-form-error">{addError}</div>}
              <button type="submit" className="um-submit-btn" disabled={addLoading}>
                {addLoading ? "CREATING..." : "CREATE USER →"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="um-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="um-modal um-modal--sm">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
            <div className="um-delete-icon">⚠️</div>
            <h3 className="um-delete-title">CONFIRM DELETE</h3>
            <p className="um-delete-msg">
              Are you sure you want to delete{" "}
              <strong style={{ color: "#ff2828" }}>{deleteTarget.name}</strong>?
              <br />
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                {deleteTarget.email}
              </span>
              <br /><br />
              This action cannot be undone.
            </p>
            <div className="um-delete-actions">
              <button className="um-cancel-btn" onClick={() => setDeleteTarget(null)}>
                CANCEL
              </button>
              <button className="um-confirm-delete-btn" onClick={handleDeleteConfirm} disabled={deleteLoading}>
                {deleteLoading ? "DELETING..." : "DELETE USER"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .um-root {
          padding: 28px 32px;
          min-height: 100%;
          font-family: 'Share Tech Mono', monospace;
          color: #fff;
        }
        .um-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
        }
        .um-header-left { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .um-title {
          font-family: 'Orbitron', monospace;
          font-size: 20px; font-weight: 700;
          letter-spacing: 3px; color: #fff; margin: 0;
        }
        .um-game-badge {
          display: flex; align-items: center; gap: 6px;
          font-family: 'Orbitron', monospace;
          font-size: 11px; color: #ff2828; letter-spacing: 1px;
          border: 1px solid rgba(255,40,40,0.3);
          padding: 4px 10px; border-radius: 4px;
          background: rgba(255,40,40,0.05);
        }
        .um-game-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #ff2828;
          box-shadow: 0 0 6px rgba(255,40,40,0.8);
          animation: dotPulse 2s infinite;
        }
        .um-add-btn {
          background: linear-gradient(135deg, rgba(0,255,60,0.12), rgba(0,200,50,0.05));
          border: 1px solid rgba(0,255,60,0.4);
          color: #00ff3c;
          font-family: 'Orbitron', monospace;
          font-size: 11px; font-weight: 700;
          letter-spacing: 1px;
          padding: 10px 20px; border-radius: 4px;
          cursor: pointer; transition: all 0.2s;
        }
        .um-add-btn:hover {
          background: linear-gradient(135deg, rgba(0,255,60,0.2), rgba(0,200,50,0.1));
          box-shadow: 0 0 16px rgba(0,255,60,0.25);
        }
        .um-loading, .um-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 16px; padding: 60px; color: rgba(255,255,255,0.4);
          font-size: 14px; letter-spacing: 1px; text-align: center;
        }
        .um-empty span { font-size: 48px; }
        .um-error {
          padding: 16px; color: #ff2828;
          background: rgba(255,40,40,0.08);
          border: 1px solid rgba(255,40,40,0.2);
          border-radius: 6px; font-size: 13px;
        }
        .um-spinner {
          width: 32px; height: 32px;
          border: 2px solid rgba(0,255,60,0.15);
          border-top-color: #00ff3c;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .um-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .um-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 20px;
          transition: border-color 0.2s, box-shadow 0.2s;
          display: flex; flex-direction: column; gap: 14px;
        }
        .um-card:hover { border-color: rgba(255,255,255,0.15); }
        .um-card--inactive { opacity: 0.55; }
        .um-card-top { display: flex; align-items: center; gap: 12px; }
        .um-avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255,40,40,0.3), rgba(255,40,40,0.1));
          border: 1px solid rgba(255,40,40,0.3);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Orbitron', monospace;
          font-size: 18px; font-weight: 700; color: #ff2828;
          flex-shrink: 0;
        }
        .um-card-info { flex: 1; min-width: 0; }
        .um-card-name { font-size: 15px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .um-card-email { font-size: 11px; color: rgba(255,255,255,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .um-card-meta {
          display: flex; gap: 16px; flex-wrap: wrap;
          padding: 10px 0;
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .um-meta-item { display: flex; flex-direction: column; gap: 2px; }
        .um-meta-label { font-size: 9px; color: rgba(255,255,255,0.3); letter-spacing: 1px; }
        .um-meta-val { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.7); }
        .um-card-actions { display: flex; gap: 8px; }
        .um-toggle-btn {
          flex: 1;
          padding: 7px;
          border-radius: 4px;
          font-family: 'Orbitron', monospace;
          font-size: 10px; font-weight: 700;
          letter-spacing: 1px; cursor: pointer;
          transition: all 0.2s; border: 1px solid;
        }
        .um-toggle-btn--deactivate {
          background: rgba(255,40,40,0.08);
          border-color: rgba(255,40,40,0.3);
          color: #ff2828;
        }
        .um-toggle-btn--deactivate:hover { background: rgba(255,40,40,0.15); }
        .um-toggle-btn--activate {
          background: rgba(0,255,60,0.08);
          border-color: rgba(0,255,60,0.3);
          color: #00ff3c;
        }
        .um-toggle-btn--activate:hover { background: rgba(0,255,60,0.15); }
        .um-delete-btn {
          padding: 7px 12px;
          border-radius: 4px;
          background: rgba(255,40,40,0.06);
          border: 1px solid rgba(255,40,40,0.25);
          color: rgba(255,40,40,0.6);
          font-family: 'Orbitron', monospace;
          font-size: 10px; font-weight: 700;
          letter-spacing: 1px; cursor: pointer;
          transition: all 0.2s;
        }
        .um-delete-btn:hover { background: rgba(255,40,40,0.15); color: #ff2828; border-color: rgba(255,40,40,0.5); }
        .um-self-badge {
          font-family: 'Orbitron', monospace;
          font-size: 9px; color: rgba(255,255,255,0.3);
          text-align: center; letter-spacing: 2px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 3px; padding: 4px;
        }

        /* Overlay */
        .um-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(6px);
          z-index: 999;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .um-modal {
          position: relative;
          background: #0a0a0a;
          border: 1px solid rgba(255,40,40,0.3);
          border-radius: 12px;
          padding: 28px;
          width: 100%; max-width: 460px;
          box-shadow: 0 0 60px rgba(255,40,40,0.12);
        }
        .um-modal--sm { max-width: 380px; text-align: center; }
        .um-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 22px;
        }
        .um-modal-title {
          font-family: 'Orbitron', monospace;
          font-size: 14px; font-weight: 700;
          color: #fff; letter-spacing: 2px; margin: 0;
        }
        .um-modal-close {
          background: none; border: none;
          color: rgba(255,255,255,0.4); font-size: 18px;
          cursor: pointer; padding: 4px 8px; transition: color 0.2s;
        }
        .um-modal-close:hover { color: #ff2828; }
        .um-form { display: flex; flex-direction: column; gap: 14px; }
        .um-field { display: flex; flex-direction: column; gap: 6px; }
        .um-field label {
          font-family: 'Orbitron', monospace;
          font-size: 10px; font-weight: 700;
          color: rgba(255,40,40,0.7); letter-spacing: 1.5px;
        }
        .um-field input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          color: #fff;
          font-family: 'Share Tech Mono', monospace;
          font-size: 14px;
          padding: 10px 14px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .um-field input:focus {
          border-color: rgba(255,40,40,0.5);
          box-shadow: 0 0 10px rgba(255,40,40,0.1);
        }
        .um-role-selector { display: flex; gap: 8px; }
        .um-role-opt {
          flex: 1; padding: 9px;
          border-radius: 4px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
          font-family: 'Orbitron', monospace;
          font-size: 11px; font-weight: 700;
          letter-spacing: 1px; cursor: pointer;
          transition: all 0.2s;
        }
        .um-role-desc {
          font-size: 11px; color: rgba(255,255,255,0.35);
          margin-top: 2px; letter-spacing: 0.3px;
        }
        .um-form-error {
          color: #ff2828; font-size: 12px;
          background: rgba(255,40,40,0.08);
          border: 1px solid rgba(255,40,40,0.2);
          border-radius: 4px; padding: 8px 12px;
        }
        .um-submit-btn {
          background: linear-gradient(135deg, rgba(0,255,60,0.12), rgba(0,200,50,0.05));
          border: 1px solid rgba(0,255,60,0.4);
          color: #00ff3c;
          font-family: 'Orbitron', monospace;
          font-size: 12px; font-weight: 700;
          letter-spacing: 1px;
          padding: 13px; border-radius: 6px;
          cursor: pointer; transition: all 0.2s;
          margin-top: 4px;
        }
        .um-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(0,255,60,0.2), rgba(0,200,50,0.1));
          box-shadow: 0 0 16px rgba(0,255,60,0.25);
        }
        .um-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Delete modal */
        .um-delete-icon { font-size: 48px; margin-bottom: 8px; }
        .um-delete-title {
          font-family: 'Orbitron', monospace;
          font-size: 15px; font-weight: 700;
          color: #ff2828; letter-spacing: 2px; margin: 0 0 12px;
        }
        .um-delete-msg {
          font-size: 13px; color: rgba(255,255,255,0.6);
          line-height: 1.6; margin: 0 0 20px;
        }
        .um-delete-actions { display: flex; gap: 10px; }
        .um-cancel-btn {
          flex: 1; padding: 11px;
          border-radius: 4px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
          font-family: 'Orbitron', monospace;
          font-size: 11px; font-weight: 700;
          letter-spacing: 1px; cursor: pointer;
          transition: all 0.2s;
        }
        .um-cancel-btn:hover { border-color: rgba(255,255,255,0.25); color: #fff; }
        .um-confirm-delete-btn {
          flex: 1; padding: 11px;
          border-radius: 4px;
          background: rgba(255,40,40,0.15);
          border: 1px solid rgba(255,40,40,0.5);
          color: #ff2828;
          font-family: 'Orbitron', monospace;
          font-size: 11px; font-weight: 700;
          letter-spacing: 1px; cursor: pointer;
          transition: all 0.2s;
        }
        .um-confirm-delete-btn:hover:not(:disabled) {
          background: rgba(255,40,40,0.25);
          box-shadow: 0 0 12px rgba(255,40,40,0.3);
        }
        .um-confirm-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 600px) {
          .um-root { padding: 16px; }
          .um-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

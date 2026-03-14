import { useState, useEffect } from "react";
import { format } from "date-fns";
import api from "../api";

const POPULAR_GAMES = [
  "Valorant", "CS2", "BGMI", "Free Fire", "GTA V",
  "FIFA 24", "Minecraft", "Fortnite", "Apex Legends", "COD",
  "Mortal Kombat", "WWE 2K", "RDR2", "Cyberpunk", "God of War",
];

const GROUP_TYPES = [
  { value: "solo",        label: "Solo",        icon: "🧍", desc: "1 person" },
  { value: "couple",      label: "Couple",       icon: "👫", desc: "2 people" },
  { value: "friends",     label: "Friends",      icon: "👥", desc: "3–4 people" },
  { value: "large_group", label: "Large Group",  icon: "🎉", desc: "5+ people" },
];

const OCCASIONS = [
  { value: "regular",     label: "Regular",     icon: "🎮" },
  { value: "birthday",    label: "Birthday",    icon: "🎂" },
  { value: "tournament",  label: "Tournament",  icon: "🏆" },
  { value: "college",     label: "College Trip", icon: "🎓" },
  { value: "corporate",   label: "Corporate",   icon: "💼" },
];

export default function GamingSession() {
  const [settings, setSettings]           = useState(null);
  const [sessions, setSessions]           = useState([]);
  const [date, setDate]                   = useState(format(new Date(), "yyyy-MM-dd"));
  const [roomType, setRoomType]           = useState("private");
  const [duration, setDuration]           = useState(1);
  const [numPeople, setNumPeople]         = useState(1);
  const [customPrice, setCustomPrice]     = useState("");
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [notes, setNotes]                 = useState("");
  const [submitting, setSubmitting]       = useState(false);

  // Advanced options
  const [showAdvanced, setShowAdvanced]   = useState(false);
  const [groupType, setGroupType]         = useState("");
  const [gamesPlayed, setGamesPlayed]     = useState([]);
  const [gameInput, setGameInput]         = useState("");
  const [occasion, setOccasion]           = useState("");
  const [memberNames, setMemberNames]     = useState("");

  // Session detail expand
  const [expandedId, setExpandedId]       = useState(null);

  useEffect(() => { loadSettings(); }, []);
  useEffect(() => { loadSessions(); }, [date]);

  const loadSettings = async () => {
    try { const { data } = await api.get("/settings"); setSettings(data); } catch {}
  };
  const loadSessions = async () => {
    try { const { data } = await api.get(`/gaming-sessions?date=${date}`); setSessions(data); } catch {}
  };

  const getBasePrice = () => !settings ? 0 : roomType === "private" ? settings.private_price : settings.normal_price;
  const getEffectivePrice = () => useCustomPrice && customPrice !== "" ? Number(customPrice) : getBasePrice();
  const totalCost = duration * getEffectivePrice() * numPeople;

  // Game tag helpers
  const addGame = (game) => {
    const g = game.trim();
    if (g && !gamesPlayed.includes(g)) setGamesPlayed((prev) => [...prev, g]);
    setGameInput("");
  };
  const removeGame = (g) => setGamesPlayed((prev) => prev.filter((x) => x !== g));
  const handleGameKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addGame(gameInput); }
    if (e.key === "Backspace" && !gameInput && gamesPlayed.length) setGamesPlayed((p) => p.slice(0, -1));
  };

  const resetAdvanced = () => { setGroupType(""); setGamesPlayed([]); setGameInput(""); setOccasion(""); setMemberNames(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/gaming-sessions", {
        date, room_type: roomType, duration_hours: duration,
        num_people: numPeople, price_per_hour: getEffectivePrice(), notes,
        group_type: groupType, games_played: gamesPlayed,
        occasion, member_names: memberNames,
      });
      setNotes(""); setNumPeople(1); setCustomPrice(""); setUseCustomPrice(false);
      resetAdvanced();
      loadSessions();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this session?")) return;
    await api.delete(`/gaming-sessions/${id}`);
    loadSessions();
  };

  const dayTotal = sessions.reduce((sum, s) => sum + (s.total || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Gaming Sessions</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="two-col">
        {/* ── ADD SESSION FORM ── */}
        <div className="card">
          <h3>Add Session</h3>
          <form onSubmit={handleSubmit}>

            {/* Room type */}
            <label>Room Type</label>
            <div className="room-selector">
              {["private", "normal"].map((rt) => (
                <button key={rt} type="button"
                  className={roomType === rt ? "selected" : ""}
                  onClick={() => setRoomType(rt)}>
                  {rt === "private" ? "🔒" : "🌐"} {rt.charAt(0).toUpperCase() + rt.slice(1)} (₹{rt === "private" ? settings?.private_price || 100 : settings?.normal_price || 75}/hr)
                </button>
              ))}
            </div>

            {/* Duration */}
            <label>Duration</label>
            <div className="duration-selector">
              {(settings?.durations || [1, 1.5, 2, 3, 4]).map((d) => (
                <button key={d} type="button" className={duration === d ? "selected" : ""} onClick={() => setDuration(d)}>
                  {d}hr
                </button>
              ))}
            </div>

            {/* People */}
            <label>Number of People</label>
            <div className="duration-selector">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} type="button" className={numPeople === n ? "selected" : ""} onClick={() => setNumPeople(n)}>{n}</button>
              ))}
              <input type="number" min="1" placeholder="More" style={{ width: 72 }}
                value={numPeople > 6 ? numPeople : ""}
                onChange={(e) => setNumPeople(Number(e.target.value) || 1)} />
            </div>

            {/* Custom price */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, cursor: "pointer" }}>
              <input type="checkbox" checked={useCustomPrice} onChange={(e) => setUseCustomPrice(e.target.checked)} style={{ width: "auto" }} />
              Custom price per hour
            </label>
            {useCustomPrice && (
              <input type="number" placeholder={`Default: ₹${getBasePrice()}`}
                value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} />
            )}

            {/* Price display */}
            <div className="price-display">
              <div style={{ fontSize: "0.85rem" }}>₹{getEffectivePrice()}/hr × {duration}hr × {numPeople} {numPeople === 1 ? "person" : "people"}</div>
              <div style={{ fontSize: "1.5rem", marginTop: 4 }}>Total: <strong>₹{totalCost}</strong></div>
            </div>

            <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ marginTop: 12 }} />

            {/* ── ADVANCED OPTIONS TOGGLE ── */}
            <button type="button" className="gs-advanced-toggle" onClick={() => setShowAdvanced((v) => !v)}>
              <span>{showAdvanced ? "▼" : "▶"}</span>
              Advanced Options
              {(groupType || gamesPlayed.length > 0 || occasion || memberNames) && (
                <span className="gs-adv-active-dot" title="Advanced options filled" />
              )}
            </button>

            {showAdvanced && (
              <div className="gs-advanced-panel">

                {/* Group type */}
                <div className="gs-adv-section">
                  <div className="gs-adv-label">GROUP TYPE</div>
                  <div className="gs-adv-chips">
                    {GROUP_TYPES.map((g) => (
                      <button key={g.value} type="button"
                        className={`gs-chip${groupType === g.value ? " gs-chip--active" : ""}`}
                        onClick={() => setGroupType(groupType === g.value ? "" : g.value)}>
                        <span>{g.icon}</span>
                        <span>{g.label}</span>
                        <span className="gs-chip-desc">{g.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Games played */}
                <div className="gs-adv-section">
                  <div className="gs-adv-label">GAMES PLAYED</div>
                  <div className="gs-games-wrap">
                    {gamesPlayed.map((g) => (
                      <span key={g} className="gs-game-tag">
                        {g}
                        <button type="button" onClick={() => removeGame(g)} className="gs-game-remove">×</button>
                      </span>
                    ))}
                    <input
                      className="gs-game-input"
                      placeholder="Type game + Enter"
                      value={gameInput}
                      onChange={(e) => setGameInput(e.target.value)}
                      onKeyDown={handleGameKeyDown}
                    />
                  </div>
                  {/* Quick-add presets */}
                  <div className="gs-preset-games">
                    {POPULAR_GAMES.filter((g) => !gamesPlayed.includes(g)).slice(0, 8).map((g) => (
                      <button key={g} type="button" className="gs-preset-btn" onClick={() => addGame(g)}>+ {g}</button>
                    ))}
                  </div>
                </div>

                {/* Occasion */}
                <div className="gs-adv-section">
                  <div className="gs-adv-label">OCCASION</div>
                  <div className="gs-adv-chips">
                    {OCCASIONS.map((o) => (
                      <button key={o.value} type="button"
                        className={`gs-chip${occasion === o.value ? " gs-chip--active" : ""}`}
                        onClick={() => setOccasion(occasion === o.value ? "" : o.value)}>
                        <span>{o.icon}</span>
                        <span>{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Member names */}
                <div className="gs-adv-section">
                  <div className="gs-adv-label">MEMBER NAMES <span style={{ opacity: 0.4, fontWeight: 400 }}>(optional)</span></div>
                  <input
                    placeholder="e.g. Rahul, Priya, Dev, Arjun"
                    value={memberNames}
                    onChange={(e) => setMemberNames(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: 16 }}>
              {submitting ? "Saving..." : "Add Session"}
            </button>
          </form>
        </div>

        {/* ── SESSION LIST ── */}
        <div className="card">
          <h3>Sessions — {format(new Date(date + "T12:00:00"), "dd MMM yyyy")}</h3>
          <div className="day-total">Day Total: <strong>₹{dayTotal}</strong> · {sessions.length} session{sessions.length !== 1 ? "s" : ""}</div>

          {sessions.length === 0 ? (
            <p className="no-data">No sessions recorded for this date</p>
          ) : (
            <div className="gs-session-list">
              {sessions.map((s) => (
                <div key={s.id || s._id} className={`gs-session-card${expandedId === (s.id || s._id) ? " gs-session-card--open" : ""}`}>
                  {/* Summary row */}
                  <div className="gs-session-summary" onClick={() => setExpandedId(expandedId === (s.id || s._id) ? null : (s.id || s._id))}>
                    <div className="gs-session-left">
                      <span className={`badge ${s.room_type}`}>{s.room_type}</span>
                      <span className="gs-session-stat">{s.num_people || 1}👤</span>
                      <span className="gs-session-stat">{s.duration_hours}hr</span>
                      {s.group_type && <span className="gs-session-badge-sm">{GROUP_TYPES.find((g) => g.value === s.group_type)?.icon} {GROUP_TYPES.find((g) => g.value === s.group_type)?.label}</span>}
                      {s.occasion && s.occasion !== "regular" && <span className="gs-session-badge-sm">{OCCASIONS.find((o) => o.value === s.occasion)?.icon} {OCCASIONS.find((o) => o.value === s.occasion)?.label}</span>}
                    </div>
                    <div className="gs-session-right">
                      <strong className="gs-session-total">₹{s.total}</strong>
                      <span className="gs-chevron">{expandedId === (s.id || s._id) ? "▲" : "▼"}</span>
                      <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(s.id || s._id); }}>🗑️</button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedId === (s.id || s._id) && (
                    <div className="gs-session-detail">
                      <div className="gs-detail-grid">
                        <div className="gs-detail-item"><span>Rate</span><strong>₹{s.price_per_hour}/hr</strong></div>
                        <div className="gs-detail-item"><span>Duration</span><strong>{s.duration_hours}hr</strong></div>
                        <div className="gs-detail-item"><span>People</span><strong>{s.num_people || 1}</strong></div>
                        <div className="gs-detail-item"><span>Room</span><strong>{s.room_type}</strong></div>
                        {s.group_type && <div className="gs-detail-item"><span>Group</span><strong>{GROUP_TYPES.find((g) => g.value === s.group_type)?.label || s.group_type}</strong></div>}
                        {s.occasion && <div className="gs-detail-item"><span>Occasion</span><strong>{OCCASIONS.find((o) => o.value === s.occasion)?.label || s.occasion}</strong></div>}
                        {s.created_by_name && <div className="gs-detail-item"><span>Logged by</span><strong>{s.created_by_name}</strong></div>}
                      </div>
                      {s.games_played?.length > 0 && (
                        <div className="gs-detail-games">
                          <span className="gs-detail-label">Games:</span>
                          {s.games_played.map((g) => <span key={g} className="gs-game-tag gs-game-tag--sm">{g}</span>)}
                        </div>
                      )}
                      {s.member_names && (
                        <div className="gs-detail-members"><span className="gs-detail-label">Members:</span> {s.member_names}</div>
                      )}
                      {s.notes && (
                        <div className="gs-detail-notes">📝 {s.notes}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* ── Advanced toggle ── */
        .gs-advanced-toggle {
          display: flex; align-items: center; gap: 8px;
          background: transparent;
          border: 1px dashed rgba(0,255,60,0.2);
          color: rgba(0,255,60,0.6);
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.75rem; letter-spacing: 0.12em;
          padding: 9px 14px; border-radius: 8px;
          cursor: pointer; margin-top: 14px; width: 100%;
          transition: all 0.25s;
        }
        .gs-advanced-toggle:hover {
          border-color: rgba(0,255,60,0.45);
          color: #00ff3c;
          background: rgba(0,255,60,0.04);
        }
        .gs-adv-active-dot {
          width: 7px; height: 7px;
          background: #ff2828; border-radius: 50%;
          box-shadow: 0 0 6px rgba(255,40,40,0.8);
          margin-left: auto;
        }

        /* ── Advanced panel ── */
        .gs-advanced-panel {
          border: 1px solid rgba(0,255,60,0.12);
          border-radius: 10px;
          padding: 1.1rem;
          background: rgba(0,0,0,0.25);
          margin-top: 10px;
          display: flex; flex-direction: column; gap: 1.1rem;
          animation: fadeInUp 0.25s ease-out;
        }
        .gs-adv-section { display: flex; flex-direction: column; gap: 8px; }
        .gs-adv-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.6rem; letter-spacing: 0.22em;
          color: #ff2828;
        }
        .gs-adv-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .gs-chip {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: #8b9a8b; border-radius: 8px;
          font-size: 0.8rem; cursor: pointer;
          transition: all 0.2s;
        }
        .gs-chip:hover { border-color: rgba(0,255,60,0.3); color: #e1e4e8; }
        .gs-chip--active {
          background: rgba(0,255,60,0.1);
          border-color: rgba(0,255,60,0.5);
          color: #00ff3c;
          box-shadow: 0 0 10px rgba(0,255,60,0.1);
        }
        .gs-chip-desc { font-size: 0.68rem; opacity: 0.5; }

        /* ── Games tag input ── */
        .gs-games-wrap {
          display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
          padding: 8px 10px;
          background: #141a14;
          border: 1px solid rgba(0,255,60,0.15);
          border-radius: 8px;
          min-height: 42px;
          cursor: text;
        }
        .gs-game-tag {
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(255,40,40,0.12);
          border: 1px solid rgba(255,40,40,0.25);
          color: #ff8888; border-radius: 5px;
          padding: 2px 8px; font-size: 0.75rem;
        }
        .gs-game-tag--sm { font-size: 0.7rem; }
        .gs-game-remove {
          background: none; border: none; color: #ff4444;
          cursor: pointer; font-size: 0.9rem; padding: 0;
          line-height: 1; transition: color 0.2s;
        }
        .gs-game-remove:hover { color: #ff2828; }
        .gs-game-input {
          border: none !important; background: transparent !important;
          color: #e1e4e8; font-size: 0.82rem; outline: none;
          width: 140px; padding: 2px 0 !important;
          box-shadow: none !important; min-width: 80px;
        }
        .gs-preset-games { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
        .gs-preset-btn {
          font-size: 0.68rem; padding: 3px 9px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.07);
          color: #5a6a5a; border-radius: 4px;
          cursor: pointer; transition: all 0.2s;
        }
        .gs-preset-btn:hover { border-color: rgba(0,255,60,0.3); color: #00ff3c; }

        /* ── Session cards (list) ── */
        .gs-session-list { display: flex; flex-direction: column; gap: 8px; }
        .gs-session-card {
          border: 1px solid rgba(0,255,60,0.08);
          border-radius: 10px;
          background: #111a11;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .gs-session-card--open { border-color: rgba(0,255,60,0.25); }
        .gs-session-card:hover { border-color: rgba(0,255,60,0.2); }
        .gs-session-summary {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; cursor: pointer; gap: 8px;
        }
        .gs-session-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .gs-session-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .gs-session-stat { font-size: 0.8rem; color: #8b9a8b; }
        .gs-session-badge-sm {
          font-size: 0.7rem; padding: 2px 7px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px; color: #8b9a8b;
        }
        .gs-session-total { color: #00ff3c; font-size: 1rem; text-shadow: 0 0 8px rgba(0,255,60,0.3); }
        .gs-chevron { font-size: 0.7rem; color: rgba(0,255,60,0.4); }

        /* ── Session expanded detail ── */
        .gs-session-detail {
          padding: 10px 14px 14px;
          border-top: 1px solid rgba(0,255,60,0.07);
          display: flex; flex-direction: column; gap: 10px;
          animation: fadeIn 0.2s ease-out;
        }
        .gs-detail-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
        }
        .gs-detail-item {
          display: flex; flex-direction: column; gap: 2px;
        }
        .gs-detail-item span { font-size: 0.62rem; color: #5a6a5a; letter-spacing: 0.1em; font-family: 'Share Tech Mono', monospace; }
        .gs-detail-item strong { font-size: 0.85rem; color: #e1e4e8; }
        .gs-detail-games { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
        .gs-detail-label { font-size: 0.65rem; color: #5a6a5a; font-family: 'Share Tech Mono', monospace; letter-spacing: 0.1em; flex-shrink: 0; }
        .gs-detail-members { font-size: 0.82rem; color: #8b9a8b; }
        .gs-detail-notes { font-size: 0.82rem; color: #6a7a6a; font-style: italic; }

        @media (max-width: 480px) {
          .gs-chip-desc { display: none; }
          .gs-session-badge-sm { display: none; }
        }
      `}</style>
    </div>
  );
}

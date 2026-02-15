import { useState, useEffect } from "react";
import { format } from "date-fns";
import api from "../api";

export default function GamingSession() {
  const [settings, setSettings] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [roomType, setRoomType] = useState("private");
  const [duration, setDuration] = useState(1);
  const [numPeople, setNumPeople] = useState(1);
  const [customPrice, setCustomPrice] = useState("");
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadSettings();
    loadSessions();
  }, [date]);

  const loadSettings = async () => {
    const { data } = await api.get("/settings");
    setSettings(data);
  };

  const loadSessions = async () => {
    const { data } = await api.get(`/gaming-sessions?date=${date}`);
    setSessions(data);
  };

  const getBasePrice = () => {
    if (!settings) return 0;
    return roomType === "private" ? settings.private_price : settings.normal_price;
  };

  const getEffectivePrice = () => {
    if (useCustomPrice && customPrice !== "") return Number(customPrice);
    return getBasePrice();
  };

  const totalCost = duration * getEffectivePrice() * numPeople;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/gaming-sessions", {
      date,
      room_type: roomType,
      duration_hours: duration,
      num_people: numPeople,
      price_per_hour: getEffectivePrice(),
      notes,
    });
    setNotes("");
    setNumPeople(1);
    setCustomPrice("");
    setUseCustomPrice(false);
    loadSessions();
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
        <div className="card">
          <h3>Add Session</h3>
          <form onSubmit={handleSubmit}>
            <label>Room Type</label>
            <div className="room-selector">
              <button type="button" className={roomType === "private" ? "selected" : ""} onClick={() => setRoomType("private")}>
                Private (₹{settings?.private_price || 100}/hr)
              </button>
              <button type="button" className={roomType === "normal" ? "selected" : ""} onClick={() => setRoomType("normal")}>
                Normal (₹{settings?.normal_price || 75}/hr)
              </button>
            </div>

            <label>Duration</label>
            <div className="duration-selector">
              {(settings?.durations || [1, 1.5, 2, 3, 4]).map((d) => (
                <button key={d} type="button" className={duration === d ? "selected" : ""} onClick={() => setDuration(d)}>
                  {d} hr{d !== 1 ? "s" : ""}
                </button>
              ))}
            </div>

            <label>Number of People</label>
            <div className="duration-selector">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} type="button" className={numPeople === n ? "selected" : ""} onClick={() => setNumPeople(n)}>
                  {n}
                </button>
              ))}
              <input
                type="number"
                min="1"
                placeholder="Custom"
                style={{ width: 80 }}
                value={numPeople > 6 ? numPeople : ""}
                onChange={(e) => setNumPeople(Number(e.target.value) || 1)}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
              <input
                type="checkbox"
                checked={useCustomPrice}
                onChange={(e) => setUseCustomPrice(e.target.checked)}
                style={{ width: "auto" }}
              />
              Use custom price per hour
            </label>
            {useCustomPrice && (
              <input
                type="number"
                placeholder={`Default: ₹${getBasePrice()}`}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
              />
            )}

            <div className="price-display">
              <div>₹{getEffectivePrice()}/hr × {duration} hr{duration !== 1 ? "s" : ""} × {numPeople} {numPeople === 1 ? "person" : "people"}</div>
              <div style={{ fontSize: "1.4rem", marginTop: 4 }}>Total: <strong>₹{totalCost}</strong></div>
            </div>

            <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button type="submit" className="btn-primary">Add Session</button>
          </form>
        </div>

        <div className="card">
          <h3>Today's Sessions</h3>
          <div className="day-total">Day Total: <strong>₹{dayTotal}</strong></div>
          {sessions.length === 0 ? (
            <p className="no-data">No sessions yet</p>
          ) : (
            <table>
              <thead>
                <tr><th>Room</th><th>People</th><th>Duration</th><th>Rate</th><th>Total</th><th>By</th><th></th></tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s._id}>
                    <td><span className={`badge ${s.room_type}`}>{s.room_type}</span></td>
                    <td>{s.num_people || 1}</td>
                    <td>{s.duration_hours} hr{s.duration_hours !== 1 ? "s" : ""}</td>
                    <td>₹{s.price_per_hour}/hr</td>
                    <td><strong>₹{s.total}</strong></td>
                    <td>{s.created_by}</td>
                    <td><button className="btn-delete" onClick={() => handleDelete(s._id)}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

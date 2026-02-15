import { useState, useEffect } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import api from "../api";

const HOURS = [];
for (let h = 8; h <= 23; h++) {
  HOURS.push(`${h.toString().padStart(2, "0")}:00`);
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function VisitTracker() {
  const [visits, setVisits] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [user, setUser] = useState("Mamlesh");
  const [friendName, setFriendName] = useState("");
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("17:00");
  const [dayOfWeek, setDayOfWeek] = useState(format(new Date(), "EEEE"));
  const [weekStart, setWeekStart] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));

  useEffect(() => {
    loadVisits();
  }, [weekStart]);

  const loadVisits = async () => {
    const start = new Date(weekStart);
    const allVisits = [];
    for (let i = 0; i < 7; i++) {
      const d = format(addDays(start, i), "yyyy-MM-dd");
      try {
        const { data } = await api.get(`/visits?date=${d}`);
        allVisits.push(...data);
      } catch (e) {
        console.error(e);
      }
    }
    setVisits(allVisits);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/visits", {
      date: selectedDate,
      user,
      friend_name: user === "Friends" ? friendName : "",
      start_time: startTime,
      end_time: endTime,
      day_of_week: dayOfWeek,
    });
    setFriendName("");
    loadVisits();
  };

  const getVisitsForDay = (day) => visits.filter((v) => v.day_of_week === day);

  const timeToRow = (time) => {
    const [h] = time.split(":").map(Number);
    return h - 8;
  };

  const handleDateChange = (e) => {
    const d = new Date(e.target.value);
    setSelectedDate(e.target.value);
    setDayOfWeek(format(d, "EEEE"));
    setWeekStart(format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd"));
  };

  const userColors = {
    Mamlesh: "#6366f1",
    Varun: "#22c55e",
    Venu: "#f59e0b",
    Friends: "#ef4444",
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Visit Tracker</h2>
        <input type="date" value={selectedDate} onChange={handleDateChange} />
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Log Visit</h3>
          <form onSubmit={handleSubmit}>
            <label>User</label>
            <select value={user} onChange={(e) => setUser(e.target.value)}>
              <option value="Mamlesh">Mamlesh</option>
              <option value="Varun">Varun</option>
              <option value="Venu">Venu</option>
              <option value="Friends">Friends</option>
            </select>

            {user === "Friends" && (
              <>
                <label>Friend's Name</label>
                <input placeholder="Enter friend's name" value={friendName} onChange={(e) => setFriendName(e.target.value)} required />
              </>
            )}

            <label>Day</label>
            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <label>Start Time</label>
            <select value={startTime} onChange={(e) => setStartTime(e.target.value)}>
              {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>

            <label>End Time</label>
            <select value={endTime} onChange={(e) => setEndTime(e.target.value)}>
              {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>

            <button type="submit" className="btn-primary">Log Visit</button>
          </form>
        </div>

        <div className="card schedule-card">
          <h3>Weekly Schedule</h3>
          <div className="schedule-grid">
            <div className="schedule-header">
              <div className="time-col"></div>
              {DAYS.map((d) => <div key={d} className="day-col">{d.slice(0, 3)}</div>)}
            </div>
            <div className="schedule-body">
              {HOURS.map((hour) => (
                <div key={hour} className="schedule-row">
                  <div className="time-col">{hour}</div>
                  {DAYS.map((day) => {
                    const dayVisits = getVisitsForDay(day);
                    const activeVisit = dayVisits.find((v) => {
                      const startH = parseInt(v.start_time);
                      const endH = parseInt(v.end_time);
                      const currentH = parseInt(hour);
                      return currentH >= startH && currentH < endH;
                    });
                    return (
                      <div
                        key={day}
                        className="day-col cell"
                        style={activeVisit ? { backgroundColor: userColors[activeVisit.user] + "40", borderLeft: `3px solid ${userColors[activeVisit.user]}` } : {}}
                        title={activeVisit ? `${activeVisit.user}${activeVisit.friend_name ? ` (${activeVisit.friend_name})` : ""} ${activeVisit.start_time}-${activeVisit.end_time}` : ""}
                      >
                        {activeVisit && <small style={{ color: userColors[activeVisit.user], fontWeight: 600, fontSize: "0.65rem" }}>{activeVisit.user === "Friends" ? activeVisit.friend_name || "Friend" : activeVisit.user.slice(0, 3)}</small>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="legend">
            {Object.entries(userColors).map(([name, color]) => (
              <span key={name} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: color }}></span>
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

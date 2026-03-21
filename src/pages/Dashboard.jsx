import { useState, useEffect, useCallback } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";
import api from "../api";

const GREEN  = "#00ff3c";
const RED    = "#ff2828";
const PURPLE = "#a855f7";
const AMBER  = "#f59e0b";
const BLUE   = "#38bdf8";

const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/* ─── Summary card strip ─── */
function SummaryCards({ s }) {
  if (!s) return null;
  const totalProfit = (s.total_gaming_revenue || 0) + (s.total_food_profit || 0);
  const cards = [
    { label: "Gaming Revenue", value: s.total_gaming_revenue,  icon: "🕹️", color: BLUE   },
    { label: "Food Revenue",   value: s.total_food_revenue,    icon: "🍕", color: GREEN  },
    { label: "Vendor Cost",    value: s.total_vendor_cost,     icon: "📦", color: RED    },
    { label: "Food Profit",    value: s.total_food_profit,     icon: "☕", color: AMBER  },
    { label: "Total Profit",   value: totalProfit,             icon: "💰", color: PURPLE },
  ];
  return (
    <div className="summary-cards">
      {cards.map((c) => (
        <div key={c.label} className="summary-card" style={{ borderLeft: `3px solid ${c.color}` }}>
          <span className="card-label">{c.icon} {c.label}</span>
          <span className="card-value" style={{ color: c.color }}>{fmt(c.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Custom tooltip ─── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0a0f0a", border: "1px solid rgba(0,255,60,0.2)",
      borderRadius: 8, padding: "10px 14px", fontSize: 12,
    }}>
      <p style={{ color: "#8b9a8b", marginBottom: 6, fontFamily: "Share Tech Mono" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ─── Date range presets ─── */
const TABS = ["Daily", "Weekly", "Monthly", "Custom"];

export default function Dashboard() {
  const today = format(new Date(), "yyyy-MM-dd");

  const [tab, setTab]               = useState("Daily");
  const [selectedDate, setSelectedDate] = useState(today);
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [customTo, setCustomTo]     = useState(today);

  const [daily,   setDaily]   = useState(null);
  const [range,   setRange]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  /* compute start/end for current tab */
  const getRange = useCallback(() => {
    const d = new Date(selectedDate);
    if (tab === "Weekly")  return { start: format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd"), end: format(endOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd") };
    if (tab === "Monthly") return { start: format(startOfMonth(d), "yyyy-MM-dd"), end: format(endOfMonth(d), "yyyy-MM-dd") };
    if (tab === "Custom")  return { start: customFrom, end: customTo };
    return null;
  }, [tab, selectedDate, customFrom, customTo]);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      if (tab === "Daily") {
        const { data } = await api.get(`/analytics/daily?date=${selectedDate}`);
        setDaily(data);
        setRange(null);
      } else {
        const r = getRange();
        if (!r) return;
        const { data } = await api.get(`/analytics/range?start_date=${r.start}&end_date=${r.end}`);
        setRange(data);
        setDaily(null);
      }
    } catch (e) {
      setError("Failed to load analytics. Make sure you are connected.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tab, selectedDate, getRange]);

  useEffect(() => {
    if (tab !== "Custom") load();
  }, [tab, selectedDate]);

  /* for Custom tab, only load when button clicked */
  const handleCustomLoad = () => load();

  const handleDownloadPDF = async () => {
    let start, end;
    if (tab === "Daily") {
      start = selectedDate;
      end = selectedDate;
    } else {
      const r = getRange();
      if (!r) return;
      start = r.start;
      end = r.end;
    }

    setDownloadingPdf(true);
    try {
      const response = await api.get(`/analytics/report/pdf?start_date=${start}&end_date=${end}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `business_report_${start}_${end}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      setError("Failed to download PDF report. Make sure you are connected.");
      console.error(e);
    } finally {
      setDownloadingPdf(false);
    }
  };

  /* ─── Daily pie ─── */
  const renderDailyPie = () => {
    const s = daily?.summary;
    if (!s) return <p className="no-data">No data for this date</p>;
    const pieData = [
      { name: "Gaming",      value: s.total_gaming_revenue || 0 },
      { name: "Food Profit", value: Math.max(0, s.total_food_profit || 0) },
    ].filter((d) => d.value > 0);
    if (!pieData.length) return <p className="no-data">No revenue recorded for this date</p>;
    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95}
            label={({ name, value }) => `${name}: ${fmt(value)}`} labelLine={false}>
            <Cell fill={BLUE} />
            <Cell fill={GREEN} />
          </Pie>
          <Tooltip formatter={(v) => fmt(v)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  /* ─── Range charts ─── */
  const renderRangeCharts = () => {
    if (!range) return null;
    const breakdown = range.daily_breakdown || [];
    const s = range.summary || {};
    const totalProfit = (s.total_gaming_revenue || 0) + (s.total_food_profit || 0);

    /* enrich breakdown with total_profit */
    const chartData = breakdown.map((d) => ({
      ...d,
      total_profit: (d.gaming_revenue || 0) + (d.food_profit || 0),
      label: d.date?.slice(5), /* MM-DD */
    }));

    const hasDays = chartData.some((d) => d.gaming_revenue > 0 || d.food_revenue > 0);

    return (
      <div>
        {/* extra total profit card */}
        <div className="summary-cards" style={{ marginBottom: "0.5rem" }}>
          <div className="summary-card" style={{ borderLeft: `3px solid ${PURPLE}`, gridColumn: "1/-1" }}>
            <span className="card-label">💰 Total Profit for Period</span>
            <span className="card-value" style={{ color: PURPLE, fontSize: "1.8rem" }}>{fmt(totalProfit)}</span>
          </div>
        </div>

        <SummaryCards s={s} />

        {!hasDays ? (
          <p className="no-data" style={{ marginTop: "2rem" }}>No revenue recorded in this period</p>
        ) : (
          <div className="chart-row" style={{ marginTop: "1.5rem" }}>
            <div className="chart-box">
              <h4>Revenue Breakdown by Day</h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="gaming_revenue" name="Gaming"      fill={BLUE}  radius={[3,3,0,0]} />
                  <Bar dataKey="food_revenue"   name="Food Rev"    fill={GREEN} radius={[3,3,0,0]} />
                  <Bar dataKey="food_profit"    name="Food Profit" fill={AMBER} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-box">
              <h4>Total Profit Trend</h4>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={PURPLE} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={PURPLE} stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="gamingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={BLUE}  stopOpacity={0.25} />
                      <stop offset="95%" stopColor={BLUE}  stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="total_profit"    name="Total Profit"   stroke={PURPLE} fill="url(#profitGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="gaming_revenue"  name="Gaming Revenue" stroke={BLUE}   fill="url(#gamingGrad)" strokeWidth={2} />
                  <Line type="monotone" dataKey="food_profit"     name="Food Profit"    stroke={AMBER}  strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* session count mini chart */}
        {chartData.some((d) => d.session_count > 0) && (
          <div className="chart-box" style={{ marginTop: "1.5rem" }}>
            <h4>Sessions per Day</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="session_count" name="Sessions" fill={RED} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  /* ─── Date picker row ─── */
  const renderDateControls = () => {
    if (tab === "Custom") {
      return (
        <div className="db-custom-range">
          <div className="db-date-field">
            <label>FROM</label>
            <input type="date" value={customFrom} max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)} />
          </div>
          <div className="db-date-arrow">→</div>
          <div className="db-date-field">
            <label>TO</label>
            <input type="date" value={customTo} min={customFrom} max={today}
              onChange={(e) => setCustomTo(e.target.value)} />
          </div>
          <button className="db-load-btn" onClick={handleCustomLoad} disabled={loading}>
            {loading ? "LOADING..." : "LOAD →"}
          </button>
        </div>
      );
    }
    return (
      <div className="db-date-row">
        <div className="db-date-field">
          <label>{tab === "Daily" ? "DATE" : "WEEK / MONTH OF"}</label>
          <input type="date" value={selectedDate} max={today}
            onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        {tab !== "Daily" && (
          <div className="db-range-badge">
            {(() => {
              const r = getRange();
              return r ? `${r.start}  →  ${r.end}` : "";
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Dashboard</h2>
        <button 
          className="db-pdf-btn" 
          onClick={handleDownloadPDF} 
          disabled={downloadingPdf || loading}
        >
          {downloadingPdf ? "GENERATING..." : "📄 DOWNLOAD PDF"}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: "1.2rem" }}>
        {TABS.map((t) => (
          <button key={t} className={tab === t ? "tab active" : "tab"}
            onClick={() => { setTab(t); setError(""); }}>
            {t === "Custom" ? "📅 Custom" : t}
          </button>
        ))}
      </div>

      {/* Date controls */}
      {renderDateControls()}

      {/* Error */}
      {error && <p className="error" style={{ marginTop: "1rem" }}>{error}</p>}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#8b9a8b", fontFamily: "Share Tech Mono" }}>
          <div style={{ fontSize: "0.8rem", letterSpacing: "0.2em", animation: "textGlow 1.5s ease-in-out infinite" }}>
            LOADING ANALYTICS...
          </div>
        </div>
      )}

      {/* Daily view */}
      {!loading && tab === "Daily" && daily && (
        <div>
          <SummaryCards s={daily.summary} />
          <div className="chart-row" style={{ marginTop: "1.5rem" }}>
            <div className="chart-box">
              <h4>Revenue Split</h4>
              {renderDailyPie()}
            </div>
            <div className="chart-box">
              <h4>Details</h4>
              <div className="details-list">
                <p><strong>Sessions:</strong> {daily.summary?.session_count ?? 0}</p>
                <p><strong>Food Entries:</strong> {daily.summary?.food_entry_count ?? 0}</p>
                <p><strong>Visits:</strong> {daily.summary?.visit_count ?? 0}</p>
                <p><strong>Gaming Revenue:</strong> {fmt(daily.summary?.total_gaming_revenue)}</p>
                <p><strong>Food Revenue:</strong> {fmt(daily.summary?.total_food_revenue)}</p>
                <p><strong>Vendor Cost:</strong> {fmt(daily.summary?.total_vendor_cost)}</p>
                <p><strong>Food Profit:</strong> {fmt(daily.summary?.total_food_profit)}</p>
                <p className="highlight">
                  <strong>Total Profit:</strong>{" "}
                  {fmt((daily.summary?.total_gaming_revenue || 0) + (daily.summary?.total_food_profit || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily — no data yet */}
      {!loading && tab === "Daily" && daily && !daily.summary?.session_count && !daily.summary?.food_entry_count && (
        <p className="no-data" style={{ marginTop: "1rem" }}>No sessions or food entries recorded for this date.</p>
      )}

      {/* Range views */}
      {!loading && tab !== "Daily" && renderRangeCharts()}

      {/* Custom tab — waiting for load */}
      {!loading && tab === "Custom" && !range && (
        <p className="no-data" style={{ marginTop: "2rem" }}>Select a date range and click LOAD.</p>
      )}

      <style>{`
        .db-date-row {
          display: flex;
          align-items: flex-end;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .db-custom-range {
          display: flex;
          align-items: flex-end;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          padding: 1.2rem 1.5rem;
          background: linear-gradient(145deg, #111a11, #1a1210);
          border: 1px solid rgba(0,255,60,0.15);
          border-radius: 12px;
        }
        .db-date-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .db-date-field label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.62rem;
          color: #ff2828;
          letter-spacing: 0.2em;
          margin: 0;
        }
        .db-date-field input[type="date"] {
          width: auto;
          min-width: 150px;
        }
        .db-date-arrow {
          color: rgba(0,255,60,0.5);
          font-size: 1.2rem;
          padding-bottom: 8px;
        }
        .db-range-badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.7rem;
          color: rgba(0,255,60,0.5);
          letter-spacing: 0.08em;
          padding: 8px 12px;
          border: 1px solid rgba(0,255,60,0.1);
          border-radius: 6px;
          background: rgba(0,255,60,0.03);
          white-space: nowrap;
          align-self: flex-end;
        }
        .db-load-btn {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          background: linear-gradient(135deg, #b30000, #ff2828);
          color: #fff;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          align-self: flex-end;
          animation: red-glow-pulse 3s ease-in-out infinite;
        }
        .db-load-btn:hover:not(:disabled) {
          box-shadow: 0 0 24px rgba(255,40,40,0.45);
          transform: translateY(-2px);
        }
        .db-load-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          animation: none;
        }
        .db-pdf-btn {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          background: linear-gradient(135deg, #a855f7, #6b21a8);
          color: #fff;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.3);
        }
        .db-pdf-btn:hover:not(:disabled) {
          box-shadow: 0 0 24px rgba(168, 85, 247, 0.6);
          transform: translateY(-2px);
        }
        .db-pdf-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (max-width: 600px) {
          .db-custom-range { flex-direction: column; align-items: stretch; }
          .db-date-arrow { display: none; }
          .db-load-btn { width: 100%; text-align: center; }
          .db-range-badge { display: none; }
        }
      `}</style>
    </div>
  );
}

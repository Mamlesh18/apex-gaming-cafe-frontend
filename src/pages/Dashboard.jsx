import { useState, useEffect } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import api from "../api";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Dashboard() {
  const [daily, setDaily] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [tab, setTab] = useState("daily");

  useEffect(() => {
    loadDaily();
    loadWeekly();
    loadMonthly();
  }, [selectedDate]);

  const loadDaily = async () => {
    try {
      const { data } = await api.get(`/analytics/daily?date=${selectedDate}`);
      setDaily(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadWeekly = async () => {
    const d = new Date(selectedDate);
    const start = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const end = format(endOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
    try {
      const { data } = await api.get(`/analytics/range?start=${start}&end=${end}`);
      setWeeklyData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMonthly = async () => {
    const d = new Date(selectedDate);
    const start = format(startOfMonth(d), "yyyy-MM-dd");
    const end = format(endOfMonth(d), "yyyy-MM-dd");
    try {
      const { data } = await api.get(`/analytics/range?start=${start}&end=${end}`);
      setMonthlyData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const renderSummaryCards = (summary) => {
    if (!summary) return null;
    const cards = [
      { label: "Gaming Revenue", value: summary.gaming_revenue ?? summary.total_gaming_revenue, color: "#6366f1" },
      { label: "Food Revenue", value: summary.food_revenue ?? summary.total_food_revenue, color: "#22c55e" },
      { label: "Food Cost", value: summary.food_cost ?? summary.total_food_cost, color: "#ef4444" },
      { label: "Food Profit", value: summary.food_profit ?? summary.total_food_profit, color: "#f59e0b" },
      { label: "Total Profit", value: summary.total_profit, color: "#8b5cf6" },
    ];
    return (
      <div className="summary-cards">
        {cards.map((c) => (
          <div key={c.label} className="summary-card" style={{ borderLeft: `4px solid ${c.color}` }}>
            <span className="card-label">{c.label}</span>
            <span className="card-value">₹{(c.value || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderDailyPie = () => {
    if (!daily) return null;
    const pieData = [
      { name: "Gaming", value: daily.gaming_revenue },
      { name: "Food Profit", value: Math.max(0, daily.food_profit) },
    ].filter((d) => d.value > 0);
    if (pieData.length === 0) return <p className="no-data">No data for this date</p>;
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ₹${value}`}>
            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Pie>
          <Tooltip formatter={(v) => `₹${v}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderRangeChart = (rangeData) => {
    if (!rangeData?.daily_data) return null;
    return (
      <div>
        {renderSummaryCards(rangeData.summary)}
        <div className="chart-row">
          <div className="chart-box">
            <h4>Revenue Breakdown</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rangeData.daily_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                <YAxis />
                <Tooltip formatter={(v) => `₹${v}`} />
                <Legend />
                <Bar dataKey="gaming_revenue" name="Gaming" fill="#6366f1" />
                <Bar dataKey="food_revenue" name="Food Revenue" fill="#22c55e" />
                <Bar dataKey="food_cost" name="Food Cost" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-box">
            <h4>Profit Trend</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rangeData.daily_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                <YAxis />
                <Tooltip formatter={(v) => `₹${v}`} />
                <Legend />
                <Line type="monotone" dataKey="total_profit" name="Total Profit" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="food_profit" name="Food Profit" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      </div>

      <div className="tabs">
        {["daily", "weekly", "monthly"].map((t) => (
          <button key={t} className={tab === t ? "tab active" : "tab"} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "daily" && (
        <div>
          {renderSummaryCards(daily)}
          <div className="chart-row">
            <div className="chart-box">
              <h4>Revenue Split</h4>
              {renderDailyPie()}
            </div>
            <div className="chart-box">
              <h4>Details</h4>
              {daily && (
                <div className="details-list">
                  <p><strong>Gaming Sessions:</strong> {daily.gaming_sessions_count}</p>
                  <p><strong>Gaming Revenue:</strong> ₹{daily.gaming_revenue}</p>
                  <p><strong>Food Revenue:</strong> ₹{daily.food_revenue}</p>
                  <p><strong>Vendor Cost:</strong> ₹{daily.food_cost}</p>
                  <p><strong>Food Profit:</strong> ₹{daily.food_profit}</p>
                  <p className="highlight"><strong>Total Profit:</strong> ₹{daily.total_profit}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "weekly" && renderRangeChart(weeklyData)}
      {tab === "monthly" && renderRangeChart(monthlyData)}
    </div>
  );
}

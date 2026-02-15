import { useState, useEffect } from "react";
import api from "../api";

export default function Settings() {
  const [privatePrice, setPrivatePrice] = useState(100);
  const [normalPrice, setNormalPrice] = useState(75);
  const [durations, setDurations] = useState("1, 1.5, 2, 3, 4");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await api.get("/settings");
    if (data) {
      setPrivatePrice(data.private_price);
      setNormalPrice(data.normal_price);
      setDurations(data.durations.join(", "));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const durationList = durations.split(",").map((d) => parseFloat(d.trim())).filter((d) => !isNaN(d));
    await api.put("/settings", {
      private_price: privatePrice,
      normal_price: normalPrice,
      durations: durationList,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page">
      <h2>Settings</h2>
      <div className="card" style={{ maxWidth: 500 }}>
        <h3>Pricing Configuration</h3>
        <form onSubmit={handleSave}>
          <label>Private Room Price (per hour)</label>
          <input type="number" value={privatePrice} onChange={(e) => setPrivatePrice(Number(e.target.value))} />

          <label>Normal Room Price (per hour)</label>
          <input type="number" value={normalPrice} onChange={(e) => setNormalPrice(Number(e.target.value))} />

          <label>Available Durations (comma separated, in hours)</label>
          <input value={durations} onChange={(e) => setDurations(e.target.value)} placeholder="1, 1.5, 2, 3, 4" />

          <button type="submit" className="btn-primary">Save Settings</button>
          {saved && <p className="success">Settings saved!</p>}
        </form>
      </div>
    </div>
  );
}

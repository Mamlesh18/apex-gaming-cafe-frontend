import { useState, useEffect } from "react";
import { format } from "date-fns";
import api from "../api";

export default function FoodCafe() {
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [vendorCost, setVendorCost] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadEntries();
  }, [date]);

  const loadEntries = async () => {
    const { data } = await api.get(`/food-entries?date=${date}`);
    setEntries(data);
  };

  const addItem = () => {
    if (!itemName || !itemPrice) return;
    setItems([...items, { name: itemName, price: Number(itemPrice) }]);
    setItemName("");
    setItemPrice("");
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalRevenue = items.reduce((sum, d) => sum + d.price, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    await api.post("/food-entries", {
      date,
      items,
      vendor_cost: Number(vendorCost) || 0,
      notes,
    });
    setItems([]);
    setVendorCost("");
    setNotes("");
    loadEntries();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this food entry?")) return;
    await api.delete(`/food-entries/${id}`);
    loadEntries();
  };

  const dayTotal = entries.reduce((sum, e) => sum + (e.total_revenue || 0), 0);
  const dayCost = entries.reduce((sum, e) => sum + (e.vendor_cost || 0), 0);
  const dayProfit = dayTotal - dayCost;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Cafe / Food</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="food-summary">
        <div className="summary-card" style={{ borderLeft: "4px solid #22c55e" }}>
          <span className="card-label">Day Revenue</span>
          <span className="card-value">₹{dayTotal}</span>
        </div>
        <div className="summary-card" style={{ borderLeft: "4px solid #ef4444" }}>
          <span className="card-label">Vendor Cost</span>
          <span className="card-value">₹{dayCost}</span>
        </div>
        <div className="summary-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <span className="card-label">Day Profit</span>
          <span className="card-value">₹{dayProfit}</span>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Add Food Entry</h3>

          <div className="inline-form" style={{ marginBottom: 12 }}>
            <input placeholder="Item name (e.g. Maggi)" value={itemName} onChange={(e) => setItemName(e.target.value)} />
            <input type="number" placeholder="Selling price" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} style={{ width: 120 }} />
            <button type="button" className="btn-secondary" onClick={addItem}>Add</button>
          </div>

          {items.length > 0 && (
            <div className="order-list">
              <h4>Items</h4>
              {items.map((d, i) => (
                <div key={i} className="order-item">
                  <span>{d.name} - ₹{d.price}</span>
                  <button className="btn-remove" onClick={() => removeItem(i)}>×</button>
                </div>
              ))}
              <div className="order-total">Total Revenue: ₹{totalRevenue}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label>Vendor Cost (what you paid for the food)</label>
            <input type="number" placeholder="e.g. 430" value={vendorCost} onChange={(e) => setVendorCost(e.target.value)} />

            <div className="price-display">
              Revenue: ₹{totalRevenue} | Cost: ₹{Number(vendorCost) || 0} | Profit: <strong>₹{totalRevenue - (Number(vendorCost) || 0)}</strong>
            </div>

            <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ marginTop: 12 }} />
            <button type="submit" className="btn-primary" disabled={items.length === 0}>Add Entry</button>
          </form>
        </div>

        <div className="card">
          <h3>Today's Entries</h3>
          {entries.length === 0 ? (
            <p className="no-data">No food entries yet</p>
          ) : (
            entries.map((e) => (
              <div key={e._id} className="food-entry-card">
                <div className="food-dishes">
                  {(e.items || e.dishes || []).map((d, i) => (
                    <span key={i} className="dish-badge">{d.name} ₹{d.price}</span>
                  ))}
                </div>
                <div className="food-entry-details">
                  <span>Revenue: ₹{e.total_revenue}</span>
                  <span>Cost: ₹{e.vendor_cost}</span>
                  <span className="profit">Profit: ₹{e.profit}</span>
                </div>
                <div className="entry-footer">
                  <small>by {e.created_by}</small>
                  <button className="btn-delete" onClick={() => handleDelete(e._id)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

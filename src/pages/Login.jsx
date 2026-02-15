import { useState } from "react";
import api from "../api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/login", { username, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      onLogin(data.username);
    } catch {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🎮 Gaming Room CRM</h1>
        <p className="subtitle">Track your profits & sessions</p>
        <form onSubmit={handleSubmit}>
          <select value={username} onChange={(e) => setUsername(e.target.value)} required>
            <option value="">Select User</option>
            <option value="Mamlesh">Mamlesh</option>
            <option value="Varun">Varun</option>
            <option value="Venu">Venu</option>
            <option value="Friends">Friends</option>
          </select>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

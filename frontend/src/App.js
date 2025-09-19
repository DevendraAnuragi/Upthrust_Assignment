import React, { useState, useEffect } from 'react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [action, setAction] = useState('weather');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // Backend ka base URL
  const API_BASE = "http://localhost:4000";

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.log("Failed to fetch history:", err.message);
      setHistory([]);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setResult({ loading: true });
    try {
      const res = await fetch(`${API_BASE}/run-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, action })
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      setResult(data);

      // Refresh history
      fetchHistory();
    } catch (err) {
      console.log("Failed to reach backend:", err.message);
      setResult({ error: "Failed to reach backend or server error" });
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', fontFamily: 'Arial' }}>
      <h1>Mini Workflow Automation</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <input
            style={{ width: '100%', padding: '8px' }}
            placeholder="Enter prompt (e.g. Write a tweet about today's weather in Delhi)"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 8 }}>
          <select value={action} onChange={e => setAction(e.target.value)}>
            <option value="weather">Weather</option>
            <option value="github">GitHub (top repos)</option>
            <option value="news">News (headlines)</option>
          </select>
          <button style={{ marginLeft: 8 }} type="submit">Run</button>
        </div>
      </form>

      <div style={{ marginTop: 20 }}>
        <h3>Result</h3>
        {result?.loading && <p>Running...</p>}
        {result && !result.loading && !result.error && (
          <div>
            <p><strong>AI:</strong> {result.ai_response || "N/A"}</p>
            <p><strong>API:</strong> {result.api_response || "N/A"}</p>
            <p><strong>Final:</strong> {result.final_result || "N/A"}</p>
          </div>
        )}
        {result?.error && <p style={{ color: "red" }}>{result.error}</p>}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>History (last 10)</h3>
        {history.length === 0 && <p>No history yet.</p>}
        <ul>
          {history.map(h => (
            <li key={h.id || h.created_at}>
              <small>{h.created_at}</small> — {h.final_result || JSON.stringify(h)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;

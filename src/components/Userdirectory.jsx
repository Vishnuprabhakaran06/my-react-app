import React, { useEffect, useState, useMemo, useRef } from "react";
import "./Userdirectory.css";

export default function UsersDirectory() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState({ key: "id", dir: "asc" });

  const searchTimeout = useRef(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("https://jsonplaceholder.typicode.com/users");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        if (!cancelled) setError("Could not fetch user data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchUsers();
    return () => { cancelled = true; };
  }, []);

  const companyOptions = useMemo(() => {
    const s = new Set();
    users.forEach((u) => s.add(u.company?.name || ""));
    return [...s].filter(Boolean).sort();
  }, [users]);

  const cityOptions = useMemo(() => {
    const s = new Set();
    users.forEach((u) => s.add(u.address?.city || ""));
    return [...s].filter(Boolean).sort();
  }, [users]);

  function matches(user, q) {
    if (!q) return true;
    const lower = q.toLowerCase();
    return (
      String(user.name).toLowerCase().includes(lower) ||
      String(user.username).toLowerCase().includes(lower) ||
      String(user.email).toLowerCase().includes(lower) ||
      String(user.phone).toLowerCase().includes(lower) ||
      String(user.website).toLowerCase().includes(lower) ||
      String(user.company?.name || "").toLowerCase().includes(lower) ||
      String(user.address?.city || "").toLowerCase().includes(lower)
    );
  }

  const filtered = useMemo(() => {
    let list = users.filter((u) => matches(u, debouncedQuery));
    if (companyFilter) list = list.filter((u) => u.company?.name === companyFilter);
    if (cityFilter) list = list.filter((u) => u.address?.city === cityFilter);

    return [...list].sort((a, b) => {
      const aVal = String(a[sortBy.key] ?? (a.company?.name ?? "")).toLowerCase();
      const bVal = String(b[sortBy.key] ?? (b.company?.name ?? "")).toLowerCase();
      if (aVal < bVal) return sortBy.dir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortBy.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, debouncedQuery, companyFilter, cityFilter, sortBy]);

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function exportCSV(useSelected = false) {
    const rows = useSelected ? filtered.filter(u => selectedIds.has(u.id)) : filtered;
    if (rows.length === 0) {
      alert("No rows to export.");
      return;
    }

    const headers = ["id","name","username","email","city","company","website","phone"];
    const escapeCell = (v) => `"${String(v ?? "").replace(/"/g,'""')}"`;
    const csv = [headers.join(",")];

    rows.forEach(r => {
      csv.push([
        escapeCell(r.id),
        escapeCell(r.name),
        escapeCell(r.username),
        escapeCell(r.email),
        escapeCell(r.address?.city),
        escapeCell(r.company?.name),
        escapeCell(r.website),
        escapeCell(r.phone)
      ].join(","));
    });

    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleSort(key) {
    setSortBy(s => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  }

  const tableRef = useRef(null);
  useEffect(() => {
    function onKey(e) {
      if (viewMode !== "table" || !tableRef.current) return;
      const focusable = tableRef.current.querySelectorAll("[data-row] button, [data-row] a, [data-row] input");
      if (!focusable.length) return;
      const idx = Array.prototype.indexOf.call(focusable, document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusable[Math.min(focusable.length - 1, idx + 1)]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focusable[Math.max(0, idx - 1)]?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewMode, filtered]);

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1 className="title">Users Directory</h1>
          <p className="subtitle">Responsive, accessible, and exportable user directory.</p>
        </div>

        <div className="actions">
          <button onClick={() => setViewMode(v => v === "grid" ? "table" : "grid")} className="btn-secondary">
            {viewMode === "grid" ? "Table View" : "Grid View"}
          </button>
          <button onClick={() => exportCSV(false)} className="btn-primary">Export CSV</button>
          <button onClick={() => exportCSV(true)} className="btn-dark">Export Selected</button>
        </div>
      </header>

      <section className="filters">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, username, email, city, company..."
          className="search-box"
        />

        <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="select-box">
          <option value="">All Companies</option>
          {companyOptions.map(c => <option key={c}>{c}</option>)}
        </select>

        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="select-box">
          <option value="">All Cities</option>
          {cityOptions.map(c => <option key={c}>{c}</option>)}
        </select>
      </section>

      {loading ? <p className="loading">Loading users...</p> : (
        <>
          {error && <p className="error">{error}</p>}

          <div className="table-controls">
            <span>{filtered.length} result(s)</span>
            <div>
              <button onClick={clearSelection} className="btn-secondary small">Clear Selection</button>
              <button onClick={() => handleSort("name")} className="btn-link small">
                Name {sortBy.key === "name" ? (sortBy.dir === "asc" ? "▲" : "▼") : ""}
              </button>
              <button onClick={() => handleSort("username")} className="btn-link small">
                Username {sortBy.key === "username" ? (sortBy.dir === "asc" ? "▲" : "▼") : ""}
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid">
              {filtered.map(u => (
                <div key={u.id} className="card">
                  <div className="card-header">
                    <h2>{u.name}</h2>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      aria-label={`Select ${u.name}`}
                    />
                  </div>
                  <p className="muted">@{u.username} • {u.company?.name}</p>
                  <p>{u.email}</p>
                  <p>{u.phone}</p>
                  <p>{u.address?.city}, {u.address?.zipcode}</p>
                  <div className="card-actions">
                    <a href={`http://${sanitizeUrl(u.website)}`} target="_blank" rel="noopener noreferrer">Visit</a>
                    <button onClick={() => alert(JSON.stringify(publicProfile(u), null, 2))}>Quick View</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div ref={tableRef} className="table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Select</th><th>ID</th><th>Name</th><th>Username</th>
                    <th>Email</th><th>City</th><th>Company</th><th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} data-row={`row-${u.id}`}>
                      <td><input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} /></td>
                      <td>{u.id}</td>
                      <td>{u.name}</td>
                      <td>{u.username}</td>
                      <td><a href={`mailto:${sanitizeMail(u.email)}`}>{u.email}</a></td>
                      <td>{u.address?.city}</td>
                      <td>{u.company?.name}</td>
                      <td>{u.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function sanitizeMail(email) {
  return String(email || "").replace(/\r|\n|\"/g, "");
}
function sanitizeUrl(url) {
  const s = String(url || "").replace(/\r|\n|\"/g, "").trim();
  if (!/^https?:\/\//i.test(s)) return s;
  return s;
}
function publicProfile(u) {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    phone: u.phone,
    website: u.website,
    company: u.company?.name,
    city: u.address?.city
  };
}

import React, { useEffect, useState, useMemo, useRef } from "react";
import "./Userdirectory.css"; // Keep or remove if not using

export default function UsersDirectory() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [viewMode, setViewMode] = useState(localStorage.getItem("viewMode") || "grid");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState(JSON.parse(localStorage.getItem("sortBy")) || { key: "id", dir: "asc" });

  const searchTimeout = useRef(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [query]);

  // Fetch users
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

  // Options for filters
  const companyOptions = useMemo(() => {
    const s = new Set(users.map(u => u.company?.name).filter(Boolean));
    return [...s].sort();
  }, [users]);

  const cityOptions = useMemo(() => {
    const s = new Set(users.map(u => u.address?.city).filter(Boolean));
    return [...s].sort();
  }, [users]);

  // Search match
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

  // Filtered & sorted users
  const filtered = useMemo(() => {
    let list = users.filter(u => matches(u, debouncedQuery));
    if (companyFilter) list = list.filter(u => u.company?.name === companyFilter);
    if (cityFilter) list = list.filter(u => u.address?.city === cityFilter);

    return [...list].sort((a, b) => {
      const aVal = getSortableValue(a, sortBy.key);
      const bVal = getSortableValue(b, sortBy.key);
      if (aVal < bVal) return sortBy.dir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortBy.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, debouncedQuery, companyFilter, cityFilter, sortBy]);

  function getSortableValue(obj, key) {
    switch (key) {
      case "company":
        return String(obj.company?.name || "").toLowerCase();
      case "city":
        return String(obj.address?.city || "").toLowerCase();
      default:
        return String(obj[key] ?? "").toLowerCase();
    }
  }

  // Select / deselect
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
  function selectAllVisible() {
    setSelectedIds(new Set(filtered.map(u => u.id)));
  }
  function deselectAll() {
    setSelectedIds(new Set());
  }

  // CSV export
  async function exportCSV(useSelected = false) {
    const rows = useSelected ? filtered.filter(u => selectedIds.has(u.id)) : filtered;
    if (!rows.length) return showToast("No rows to export.");

    if (!window.confirm(`Export ${rows.length} row(s) to CSV?`)) return;

    showToast("Generating CSV...");
    await new Promise(resolve => setTimeout(resolve, 200));

    const headers = ["id", "name", "username", "email", "city", "company", "website", "phone"];
    const escapeCell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
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
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("CSV export complete.");
  }

  // Sorting
  function handleSort(key) {
    setSortBy(s => {
      const next = { key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" };
      localStorage.setItem("sortBy", JSON.stringify(next));
      return next;
    });
  }

  const tableRef = useRef(null);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    function onKey(e) {
      // Table navigation
      if (viewMode === "table" && tableRef.current) {
        const focusable = tableRef.current.querySelectorAll("[data-row] button, [data-row] a, [data-row] input");
        if (focusable.length) {
          const idx = Array.prototype.indexOf.call(focusable, document.activeElement);
          if (e.key === "ArrowDown") {
            e.preventDefault();
            focusable[Math.min(focusable.length - 1, idx + 1)]?.focus();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            focusable[Math.max(0, idx - 1)]?.focus();
          }
        }
      }

      // Keyboard shortcuts
      if (e.ctrlKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        selectAllVisible();
      } else if (e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        deselectAll();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewMode, filtered]);

  // Persist view mode
  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

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
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, username, email, city, company..."
          className="search-box"
        />
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="select-box">
          <option value="">All Companies</option>
          {companyOptions.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="select-box">
          <option value="">All Cities</option>
          {cityOptions.map(c => <option key={c}>{c}</option>)}
        </select>
      </section>

      {loading ? <p className="loading">Loading users...</p> : (
        <>
          {error && <p className="error">{error}</p>}

          <div className="table-controls">
            <span>{filtered.length} result(s)</span>
            <div className="button-group">
              <button onClick={clearSelection} className="btn-secondary">Clear Selection</button>
              <button onClick={() => handleSort("name")} className="btn-link">
                Name {sortBy.key === "name" ? (sortBy.dir === "asc" ? "▲" : "▼") : ""}
              </button>
              <button onClick={() => handleSort("username")} className="btn-link">
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
                    <a href={sanitizeUrl(u.website)} target="_blank" rel="noopener noreferrer">Visit</a>
                    <button onClick={() => showToast(JSON.stringify(publicProfile(u), null, 2))}>Quick View</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div ref={tableRef} className="table-container">
              <table className="user-table" aria-label="Users table">
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

// Utilities
function sanitizeMail(email) {
  return String(email || "").replace(/\r|\n|\"/g, "");
}
function sanitizeUrl(url) {
  const s = String(url || "").replace(/\r|\n|\"/g, "").trim();
  return s.startsWith("http://") || s.startsWith("https://") ? s : `http://${s}`;
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

// Toast notification
function showToast(message) {
  const el = document.createElement("div");
  el.textContent = message;
  el.style.position = "fixed";
  el.style.bottom = "1rem";
  el.style.right = "1rem";
  el.style.background = "#333";
  el.style.color = "#fff";
  el.style.padding = "0.5rem 1rem";
  el.style.borderRadius = "0.5rem";
  el.style.zIndex = 9999;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

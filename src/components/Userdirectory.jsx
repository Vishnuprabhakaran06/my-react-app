import React, { useEffect, useMemo, useState } from 'react';
import './Userdirectory.css';

const FALLBACK_USERS = [
    { "id": 1, "name": "Leanne Graham", "username": "Bret", "email": "Sincere@april.biz", "address": { "street": "Kulas Light", "suite": "Apt. 556", "city": "Gwenborough", "zipcode": "92998-3874", "geo": { "lat": "-37.3159", "lng": "81.1496" } }, "phone": "1-770-736-8031 x56442", "website": "hildegard.org", "company": { "name": "Romaguera-Crona", "catchPhrase": "Multi-layered client-server neural-net", "bs": "harness real-time e-markets" } },
    { "id": 2, "name": "Ervin Howell", "username": "Antonette", "email": "Shanna@melissa.tv", "address": { "street": "Victor Plains", "suite": "Suite 879", "city": "Wisokyburgh", "zipcode": "90566-7771", "geo": { "lat": "-43.9509", "lng": "-34.4618" } }, "phone": "010-692-6593 x09125", "website": "anastasia.net", "company": { "name": "Deckow-Crist", "catchPhrase": "Proactive didactic contingency", "bs": "synergize scalable supply-chains" } },
    { "id": 3, "name": "Clementine Bauch", "username": "Samantha", "email": "Nathan@yesenia.net", "address": { "street": "Douglas Extension", "suite": "Suite 847", "city": "McKenziehaven", "zipcode": "59590-4157", "geo": { "lat": "-68.6102", "lng": "-47.0653" } }, "phone": "1-463-123-4447", "website": "ramiro.info", "company": { "name": "Romaguera-Jacobson", "catchPhrase": "Face to face bifurcated interface", "bs": "e-enable strategic applications" } },
    { "id": 4, "name": "Patricia Lebsack", "username": "Karianne", "email": "Julianne.OConner@kory.org", "address": { "street": "Hoeger Mall", "suite": "Apt. 692", "city": "South Elvis", "zipcode": "53919-4257", "geo": { "lat": "29.4572", "lng": "-164.2990" } }, "phone": "493-170-9623 x156", "website": "kale.biz", "company": { "name": "Robel-Corkery", "catchPhrase": "Multi-tiered zero tolerance productivity", "bs": "transition cutting-edge web services" } },
    { "id": 5, "name": "Chelsey Dietrich", "username": "Kamren", "email": "Lucio_Hettinger@annie.ca", "address": { "street": "Skiles Walks", "suite": "Suite 351", "city": "Roscoeview", "zipcode": "33263", "geo": { "lat": "-31.8129", "lng": "62.5342" } }, "phone": "(254)954-1289", "website": "demarco.info", "company": { "name": "Keebler LLC", "catchPhrase": "User-centric fault-tolerant solution", "bs": "revolutionize end-to-end systems" } },
    { "id": 6, "name": "Mrs. Dennis Schulist", "username": "Leopoldo_Corkery", "email": "Karley_Dach@jasper.info", "address": { "street": "Norberto Crossing", "suite": "Apt. 950", "city": "South Christy", "zipcode": "23505-1337", "geo": { "lat": "-71.4197", "lng": "71.7478" } }, "phone": "1-477-935-8478 x6430", "website": "ola.org", "company": { "name": "Considine-Lockman", "catchPhrase": "Synchronised bottom-line interface", "bs": "e-enable innovative applications" } },
    { "id": 7, "name": "Kurtis Weissnat", "username": "Elwyn.Skiles", "email": "Telly.Hoeger@billy.biz", "address": { "street": "Rex Trail", "suite": "Suite 280", "city": "Howemouth", "zipcode": "58804-1099", "geo": { "lat": "24.8918", "lng": "21.8984" } }, "phone": "210.067.6132", "website": "elvis.io", "company": { "name": "Johns Group", "catchPhrase": "Configurable multimedia task-force", "bs": "generate enterprise e-tailers" } },
    { "id": 8, "name": "Nicholas Runolfsdottir V", "username": "Maxime_Nienow", "email": "Sherwood@rosamond.me", "address": { "street": "Ellsworth Summit", "suite": "Suite 729", "city": "Aliyaview", "zipcode": "45169", "geo": { "lat": "-14.3990", "lng": "-120.7677" } }, "phone": "586.493.6943 x140", "website": "jacynthe.com", "company": { "name": "Abernathy Group", "catchPhrase": "Implemented secondary concept", "bs": "e-enable extensible e-tailers" } },
    { "id": 9, "name": "Glenna Reichert", "username": "Delphine", "email": "Chaim_McDermott@dana.io", "address": { "street": "Dayna Park", "suite": "Suite 449", "city": "Bartholomebury", "zipcode": "76495-3109", "geo": { "lat": "24.6463", "lng": "-168.8889" } }, "phone": "(775)976-6794 x41206", "website": "conrad.com", "company": { "name": "Yost and Sons", "catchPhrase": "Switchable contextually-based project", "bs": "aggregate real-time technologies" } },
    { "id": 10, "name": "Clementina DuBuque", "username": "Moriah.Stanton", "email": "Rey.Padberg@karina.biz", "address": { "street": "Kattie Turnpike", "suite": "Suite 198", "city": "Lebsackbury", "zipcode": "31428-2261", "geo": { "lat": "-38.2386", "lng": "57.2232" } }, "phone": "024-648-3804", "website": "ambrose.net", "company": { "name": "Hoeger LLC", "catchPhrase": "Centralized empowering task-force", "bs": "target end-to-end models" } }
];

export default function UsersDirectory({ apiEndpoint = '/api/users' }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI state
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState({ key: 'name', dir: 'asc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(apiEndpoint);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (!cancelled) setUsers(Array.isArray(data) ? data : []);
            } catch (err) {
                console.warn('Fetch failed, using fallback dataset:', err);
                if (!cancelled) setUsers(FALLBACK_USERS);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchData();
        return () => { cancelled = true; };
    }, [apiEndpoint]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = users.slice();
        if (q) {
            list = list.filter(u => (
                (u.name || '').toLowerCase().includes(q) ||
                (u.username || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.company?.name || '').toLowerCase().includes(q) ||
                (u.address?.city || '').toLowerCase().includes(q)
            ));
        }
        list.sort((a, b) => {
            const aVal = ((sortBy.key === 'company') ? a.company?.name : (sortBy.key === 'city' ? a.address?.city : a[sortBy.key])) || '';
            const bVal = ((sortBy.key === 'company') ? b.company?.name : (sortBy.key === 'city' ? b.address?.city : b[sortBy.key])) || '';
            if (aVal < bVal) return sortBy.dir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortBy.dir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [users, query, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

    const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

    function toggleSort(key) {
        setSortBy(prev => ({
            key,
            dir: prev.key === key ? (prev.dir === 'asc' ? 'desc' : 'asc') : 'asc'
        }));
    }

    function copyToClipboard(text) {
        navigator.clipboard?.writeText(text).catch(() => { });
    }

    function exportCSV(rows) {
        const header = ['id', 'name', 'username', 'email', 'phone', 'website', 'company', 'city', 'zipcode'];
        const csv = [header.join(',')].concat(
            rows.map(r => [
                r.id, r.name, r.username, r.email, r.phone, r.website,
                JSON.stringify(r.company?.name || ''),
                r.address?.city, r.address?.zipcode
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users_export.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="users-directory">
            <header>
                <h1>Users Directory</h1>
                <div className="search-export">
                    <input
                        value={query}
                        onChange={e => { setQuery(e.target.value); setPage(1); }}
                        placeholder="Search name, username, email, company, city..."
                    />
                    <button onClick={() => exportCSV(filtered)}>Export CSV</button>
                </div>
            </header>

            <section className="controls">
                <div className="sort-buttons">
                    <span>Sort:</span>
                    <button
                        className={sortBy.key === 'name' ? 'active' : ''}
                        onClick={() => toggleSort('name')}
                    >
                        Name {sortBy.key === 'name' ? (sortBy.dir === 'asc' ? '▲' : '▼') : ''}
                    </button>
                    <button
                        className={sortBy.key === 'company' ? 'active' : ''}
                        onClick={() => toggleSort('company')}
                    >
                        Company {sortBy.key === 'company' ? (sortBy.dir === 'asc' ? '▲' : '▼') : ''}
                    </button>
                    <button
                        className={sortBy.key === 'city' ? 'active' : ''}
                        onClick={() => toggleSort('city')}
                    >
                        City {sortBy.key === 'city' ? (sortBy.dir === 'asc' ? '▲' : '▼') : ''}
                    </button>
                </div>

                <div>
                    <label>View: </label>
                    <select
                        value={pageSize}
                        onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    >
                        <option value={5}>5 / page</option>
                        <option value={10}>10 / page</option>
                        <option value={20}>20 / page</option>
                    </select>
                </div>
            </section>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <>
                    {filtered.length === 0 ? (
                        <div className="no-results">No users found.</div>
                    ) : (
                        <div className="users-grid">
                            {pageItems.map(u => (
                                <article key={u.id} className="user-card">
                                    <div>
                                        <h2>{u.name} <span>@{u.username}</span></h2>
                                        <p>{u.company?.name} • {u.address?.city}</p>
                                        <p>{u.email}</p>
                                        <p>{u.phone}</p>
                                    </div>

                                    {/* Footer for buttons */}
                                    <div className="card-footer">
                                        <button onClick={() => setSelectedUser(u)}>Details</button>
                                        <button onClick={() => copyToClipboard(u.email)}>Copy Email</button>
                                    </div>
                                </article>

                            ))}
                        </div>
                    )}

                    <div className="pagination">
                        <span>Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
                        <div>
                            <button onClick={() => setPage(1)} disabled={page === 1}>First</button>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                            <span>{page} / {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
                            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</button>
                        </div>
                    </div>
                </>
            )}

            {selectedUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{selectedUser.name}</h3>
                            <button onClick={() => setSelectedUser(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div>
                                <p><strong>Username:</strong> {selectedUser.username}</p>
                                <p><strong>Email:</strong> {selectedUser.email} <button className="copy-btn" onClick={() => copyToClipboard(selectedUser.email)}>Copy</button></p>
                                <p><strong>Phone:</strong> {selectedUser.phone} <button className="copy-btn" onClick={() => copyToClipboard(selectedUser.phone)}>Copy</button></p>
                                <p><strong>Website:</strong> <a href={`https://${selectedUser.website}`} target="_blank" rel="noreferrer">{selectedUser.website}</a></p>
                            </div>
                            <div>
                                <p><strong>Company:</strong> {selectedUser.company?.name}</p>
                                <p><strong>Catchphrase:</strong> {selectedUser.company?.catchPhrase}</p>
                                <p><strong>Address:</strong> {selectedUser.address?.street}, {selectedUser.address?.suite}, {selectedUser.address?.city}, {selectedUser.address?.zipcode}</p>
                                {selectedUser.address?.geo && (
                                    <p><a href={`https://www.google.com/maps/search/?api=1&query=${selectedUser.address.geo.lat},${selectedUser.address.geo.lng}`} target="_blank" rel="noreferrer">Open in Google Maps</a></p>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => exportCSV([selectedUser])}>Export this user</button>
                            <button className="primary" onClick={() => setSelectedUser(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

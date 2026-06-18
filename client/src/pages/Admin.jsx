import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { Navigate } from 'react-router-dom';
import {
    fetchAdminStats,
    fetchAdminUsers,
    updateAdminUser,
    deleteAdminUser,
    fetchAdminSessions
} from '../api/admin';
import { listGames } from '../api/games';
import {
    Shield, Users, ScrollText, BarChart3, Search,
    Ban, Check, Trash2, Crown, Coins
} from 'lucide-react';

const Admin = () => {
    const { user } = useGame();
    const [tab, setTab] = useState('stats');  // 'stats' | 'users' | 'sessions'
    const bgCanvasRef = useRef(null);

    // Background animation
    useEffect(() => {
        const canvas = bgCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        const dots = Array.from({ length: 45 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
            color: Math.random() > 0.6 ? '#22c55e' : '#8e44ad',
        }));
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            dots.forEach(d => {
                d.x += d.vx; d.y += d.vy;
                if (d.x < 0 || d.x > W) d.vx *= -1;
                if (d.y < 0 || d.y > H) d.vy *= -1;
                ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fillStyle = d.color + '55'; ctx.fill();
            });
            dots.forEach((a, i) => dots.slice(i + 1).forEach(b => {
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (dist < 120) {
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(142,68,173,${0.10 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.6; ctx.stroke();
                }
            }));
            animId = requestAnimationFrame(draw);
        };
        draw();
        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
    }, []);

    // Only admins allowed
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/arcade" replace />;

    return (
        <Layout>
            <div className="ad-root">
                <canvas ref={bgCanvasRef} className="ad-bg-canvas" />
                <div className="ad-blob ad-blob-1" />
                <div className="ad-blob ad-blob-2" />

                <div className="ad-inner">
                    <div className="ad-page-header">
                        <h1 className="ad-title">
                            <Shield size={28} style={{ verticalAlign: '-4px', marginRight: '0.5rem' }} />
                            <span className="ad-title-dark">Admin</span>
                            <span className="ad-title-purple"> Panel.</span>
                        </h1>
                        <p className="ad-subtitle">Welcome, {user.username}. You have full platform access.</p>
                    </div>

                    {/* Tab toggle */}
                    <div className="ad-tabs">
                        <button
                            className={`ad-tab-btn ${tab === 'stats' ? 'ad-tab-btn--active' : ''}`}
                            onClick={() => setTab('stats')}
                        >
                            <BarChart3 size={16} /> Stats
                        </button>
                        <button
                            className={`ad-tab-btn ${tab === 'users' ? 'ad-tab-btn--active' : ''}`}
                            onClick={() => setTab('users')}
                        >
                            <Users size={16} /> Users
                        </button>
                        <button
                            className={`ad-tab-btn ${tab === 'sessions' ? 'ad-tab-btn--active' : ''}`}
                            onClick={() => setTab('sessions')}
                        >
                            <ScrollText size={16} /> Sessions
                        </button>
                    </div>

                    {tab === 'stats' && <StatsTab />}
                    {tab === 'users' && <UsersTab currentUserId={user._id || user.id} />}
                    {tab === 'sessions' && <SessionsTab />}
                </div>

                <style>{styles}</style>
            </div>
        </Layout>
    );
};

// ============================================================
// STATS TAB
// ============================================================
const StatsTab = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
    const load = () => {
        fetchAdminStats()
            .then(data => setStats(data))
            .catch(err => setError(err.response?.data?.error || 'Could not load stats'))
            .finally(() => setLoading(false));
    };
    load();
    // Auto-refresh every 10 seconds
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
}, []);

    if (loading) return <div className="ad-state"><div className="ad-spinner" />Loading stats...</div>;
    if (error) return <div className="ad-state ad-state-error">{error}</div>;
    if (!stats) return null;

    return (
        <div>
            {/* Top metric cards */}
            <div className="ad-metric-grid">
                <MetricCard label="Total Users" value={stats.users.total} accent="#8e44ad" />
                <MetricCard label="Active" value={stats.users.active} accent="#22c55e" />
                <MetricCard label="Banned" value={stats.users.banned} accent="#ef4444" />
                <MetricCard label="Total Sessions" value={stats.sessions.total} accent="#3b82f6" />
                <MetricCard label="Completed" value={stats.sessions.completed} accent="#22c55e" />
                <MetricCard label="Z Coins in Circulation" value={stats.economy.totalCoinsInCirculation} accent="#FFB400" prefix="" />
            </div>

            <div className="ad-card-grid">
                {/* Top Games */}
                <div className="ad-mini-card">
                    <h3 className="ad-mini-title">Top 5 Most-Played Games</h3>
                    <table className="ad-mini-table">
                        <thead>
                            <tr><th>Game</th><th style={{ textAlign: 'right' }}>Plays</th></tr>
                        </thead>
                        <tbody>
                            {stats.topGames.map(g => (
                                <tr key={g.gameId}>
                                    <td>{g.name || g.gameId}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 800 }}>{g.plays}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Top Users */}
                <div className="ad-mini-card">
                    <h3 className="ad-mini-title">Top 5 Wealthiest Players</h3>
                    <table className="ad-mini-table">
                        <thead>
                            <tr><th>Player</th><th style={{ textAlign: 'right' }}>Z Coins</th></tr>
                        </thead>
                        <tbody>
                            {stats.topUsers.map(u => (
                                <tr key={u._id}>
                                    <td>{u.username}</td>
                                    <td style={{ textAlign: 'right', color: '#FFB400', fontWeight: 800 }}>{u.coins}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Results breakdown */}
                <div className="ad-mini-card">
                    <h3 className="ad-mini-title">Game Outcomes</h3>
                    <table className="ad-mini-table">
                        <thead>
                            <tr><th>Result</th><th style={{ textAlign: 'right' }}>Count</th></tr>
                        </thead>
                        <tbody>
                            {stats.resultsBreakdown.map(r => (
                                <tr key={r._id}>
                                    <td style={{ textTransform: 'capitalize', fontWeight: 700 }}>{r._id}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 800 }}>{r.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, accent, prefix = '' }) => (
    <div className="ad-metric-card" style={{ borderLeft: `4px solid ${accent}` }}>
        <div className="ad-metric-label">{label}</div>
        <div className="ad-metric-value" style={{ color: accent }}>{prefix}{value?.toLocaleString?.() ?? value}</div>
    </div>
);

// ============================================================
// USERS TAB
// ============================================================
const UsersTab = ({ currentUserId }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1 });

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchAdminUsers({ search, page, limit: 20 });
            setUsers(data.users);
            setPagination(data.pagination);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [page]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        load();
    };

    const handleToggleBan = async (u) => {
        const newStatus = u.status === 'banned' ? 'active' : 'banned';
        if (!window.confirm(`${newStatus === 'banned' ? 'Ban' : 'Unban'} ${u.username}?`)) return;
        try {
            await updateAdminUser(u._id, { status: newStatus });
            load();
        } catch (err) {
            alert(err.response?.data?.error || 'Could not update user');
        }
    };

    const handleAdjustCoins = async (u) => {
        const input = window.prompt(`Adjust ${u.username}'s coins (use negative to deduct):`, '0');
        const delta = parseInt(input);
        if (isNaN(delta) || delta === 0) return;
        try {
            await updateAdminUser(u._id, { coinsDelta: delta });
            load();
        } catch (err) {
            alert(err.response?.data?.error || 'Could not adjust coins');
        }
    };

    const handleDelete = async (u) => {
        if (!window.confirm(`Soft-delete ${u.username}? Their data stays for audit but account becomes inactive.`)) return;
        try {
            await deleteAdminUser(u._id);
            load();
        } catch (err) {
            alert(err.response?.data?.error || 'Could not delete user');
        }
    };

    return (
        <div>
            <form className="ad-search-row" onSubmit={handleSearchSubmit}>
                <Search size={16} style={{ color: 'var(--text-secondary)' }} />
                <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="ad-search-input"
                />
                <button type="submit" className="ad-search-btn">Search</button>
            </form>

            {loading && <div className="ad-state"><div className="ad-spinner" />Loading users...</div>}
            {error && <div className="ad-state ad-state-error">{error}</div>}

            {!loading && !error && users.length === 0 && (
                <div className="ad-state">No users found</div>
            )}

            {!loading && !error && users.length > 0 && (
                <>
                    <div className="ad-table-wrap">
                        <table className="ad-data-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Coins</th>
                                    <th>Joined</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const isMe = u._id === currentUserId;
                                    return (
                                        <tr key={u._id} className={isMe ? 'ad-row-me' : ''}>
                                            <td>
                                                <span style={{ fontWeight: 800 }}>{u.username}</span>
                                                {isMe && <span className="ad-me-tag">YOU</span>}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                                            <td>
                                                <span className={`ad-pill ${u.role === 'admin' ? 'ad-pill-admin' : 'ad-pill-user'}`}>
                                                    {u.role === 'admin' && <Crown size={11} />}
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`ad-pill ${
                                                    u.status === 'banned' ? 'ad-pill-banned' :
                                                    u.status === 'deleted' ? 'ad-pill-deleted' : 'ad-pill-active'
                                                }`}>
                                                    {u.status || 'active'}
                                                </span>
                                            </td>
                                            <td><span className="ad-coin-cell">{u.coins}</span></td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="ad-action-btns">
                                                    <button
                                                        title="Adjust coins"
                                                        onClick={() => handleAdjustCoins(u)}
                                                        disabled={isMe}
                                                        className="ad-icon-btn ad-icon-coins"
                                                    >
                                                        <Coins size={14} />
                                                    </button>
                                                    <button
                                                        title={u.status === 'banned' ? 'Unban' : 'Ban'}
                                                        onClick={() => handleToggleBan(u)}
                                                        disabled={isMe}
                                                        className={`ad-icon-btn ${u.status === 'banned' ? 'ad-icon-unban' : 'ad-icon-ban'}`}
                                                    >
                                                        {u.status === 'banned' ? <Check size={14} /> : <Ban size={14} />}
                                                    </button>
                                                    <button
                                                        title="Soft delete"
                                                        onClick={() => handleDelete(u)}
                                                        disabled={isMe}
                                                        className="ad-icon-btn ad-icon-delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="ad-pagination">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="ad-page-btn"
                            >
                                Previous
                            </button>
                            <span className="ad-page-label">
                                Page {page} of {pagination.totalPages}
                            </span>
                            <button
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="ad-page-btn"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ============================================================
// SESSIONS TAB
// ============================================================
const SessionsTab = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [games, setGames] = useState([]);
    const [filterGame, setFilterGame] = useState('');
    const [filterResult, setFilterResult] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1 });

    useEffect(() => {
        listGames().then(({ games }) => setGames(games)).catch(() => {});
    }, []);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchAdminSessions({
                page,
                limit: 30,
                gameId: filterGame || undefined,
                result: filterResult || undefined
            });
            setSessions(data.sessions);
            setPagination(data.pagination);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not load sessions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [page, filterGame, filterResult]);

    return (
        <div>
            <div className="ad-filter-row">
                <div className="ad-filter-group">
                    <label className="ad-filter-label">Game</label>
                    <select
                        value={filterGame}
                        onChange={(e) => { setFilterGame(e.target.value); setPage(1); }}
                        className="ad-select"
                    >
                        <option value="">All games</option>
                        {games.map(g => <option key={g.gameId} value={g.gameId}>{g.name}</option>)}
                    </select>
                </div>
                <div className="ad-filter-group">
                    <label className="ad-filter-label">Result</label>
                    <select
                        value={filterResult}
                        onChange={(e) => { setFilterResult(e.target.value); setPage(1); }}
                        className="ad-select"
                    >
                        <option value="">All results</option>
                        <option value="win">Win</option>
                        <option value="loss">Loss</option>
                        <option value="draw">Draw</option>
                        <option value="abandoned">Abandoned</option>
                    </select>
                </div>
            </div>

            {loading && <div className="ad-state"><div className="ad-spinner" />Loading sessions...</div>}
            {error && <div className="ad-state ad-state-error">{error}</div>}

            {!loading && !error && sessions.length === 0 && (
                <div className="ad-state">No sessions match these filters</div>
            )}

            {!loading && !error && sessions.length > 0 && (
                <>
                    <div className="ad-table-wrap">
                        <table className="ad-data-table">
                            <thead>
                                <tr>
                                    <th>Player</th>
                                    <th>Game</th>
                                    <th>Result</th>
                                    <th>Score</th>
                                    <th>Duration</th>
                                    <th>Started</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map(s => (
                                    <tr key={s._id}>
                                        <td style={{ fontWeight: 800 }}>{s.username || '—'}</td>
                                        <td>{s.gameId}</td>
                                        <td>
                                            <span className={`ad-pill ad-pill-${s.result || 'abandoned'}`}>
                                                {s.result || 'open'}
                                            </span>
                                        </td>
                                        <td>{s.score ?? '-'}</td>
                                        <td>{s.durationSeconds ? `${s.durationSeconds}s` : '-'}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                                            {s.startedAt ? new Date(s.startedAt).toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="ad-pagination">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="ad-page-btn"
                            >
                                Previous
                            </button>
                            <span className="ad-page-label">
                                Page {page} of {pagination.totalPages}
                            </span>
                            <button
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="ad-page-btn"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const styles = `
    .ad-root {
        position: relative; min-height: 100vh; overflow: hidden;
        background: linear-gradient(145deg, #faf8ff 0%, #f0f9f0 50%, #fdf6ff 100%);
    }
    .ad-bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
    .ad-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
    .ad-blob-1 { width: 500px; height: 500px; background: rgba(142,68,173,0.07); top: -100px; right: -100px; }
    .ad-blob-2 { width: 400px; height: 400px; background: rgba(34,197,94,0.06); bottom: 80px; left: -80px; }

    .ad-inner { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 3rem 2rem 5rem; }
    .ad-page-header { margin-bottom: 2rem; text-align: center; }
    .ad-title {
        display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem;
        font-family: var(--font-ui);
        font-size: clamp(1.8rem, 3.5vw, 2.6rem);
        font-weight: 900; line-height: 1.15; letter-spacing: -0.5px;
        margin: 0 0 0.6rem; color: var(--text-primary);
    }
    .ad-title-dark { color: var(--text-primary); }
    .ad-title-purple {
        background: linear-gradient(135deg, #8e44ad, #732d91);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .ad-subtitle { color: var(--text-secondary); font-size: 1rem; margin: 0; }

    .ad-tabs {
        display: flex; gap: 0.5rem; justify-content: center;
        margin-bottom: 1.5rem;
        background: rgba(255,255,255,0.85);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 999px;
        padding: 0.3rem; width: fit-content;
        margin-left: auto; margin-right: auto;
        backdrop-filter: blur(8px);
        flex-wrap: wrap;
    }
    .ad-tab-btn {
        display: inline-flex; align-items: center; gap: 0.4rem;
        padding: 0.55rem 1.25rem;
        border-radius: 999px;
        border: none; background: transparent;
        color: var(--text-secondary);
        font-weight: 700; font-family: var(--font-ui);
        font-size: 0.9rem; cursor: pointer;
        transition: all 0.2s;
    }
    .ad-tab-btn:hover { color: var(--text-primary); }
    .ad-tab-btn--active {
        background: linear-gradient(135deg, #8e44ad, #732d91);
        color: white;
        box-shadow: 0 4px 14px rgba(142,68,173,0.28);
    }

    .ad-state {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 3rem; gap: 0.75rem;
        color: var(--text-secondary);
        font-family: var(--font-ui);
        background: rgba(255,255,255,0.9);
        border-radius: 20px;
        border: 1px solid rgba(142,68,173,0.14);
    }
    .ad-state-error { color: #ef4444; }
    .ad-spinner {
        width: 40px; height: 40px;
        border: 3px solid rgba(142,68,173,0.15);
        border-top-color: #8e44ad;
        border-radius: 50%;
        animation: adSpin 1s linear infinite;
    }
    @keyframes adSpin { to { transform: rotate(360deg); } }

    /* Stats grid */
    .ad-metric-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    .ad-metric-card {
        background: rgba(255,255,255,0.92);
        padding: 1rem 1.2rem;
        border-radius: 14px;
        box-shadow: 0 6px 18px rgba(142,68,173,0.06);
        backdrop-filter: blur(8px);
    }
    .ad-metric-label {
        font-size: 0.7rem; font-weight: 700;
        color: var(--text-secondary);
        text-transform: uppercase; letter-spacing: 0.08em;
        margin-bottom: 0.35rem;
        font-family: var(--font-ui);
    }
    .ad-metric-value {
        font-size: 1.8rem; font-weight: 900;
        font-family: var(--font-ui);
        line-height: 1;
    }

    .ad-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.2rem;
    }
    .ad-mini-card {
        background: rgba(255,255,255,0.92);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 16px;
        padding: 1.2rem;
        box-shadow: 0 6px 18px rgba(142,68,173,0.06);
        backdrop-filter: blur(8px);
    }
    .ad-mini-title {
        font-family: var(--font-ui);
        font-size: 1rem; font-weight: 800;
        color: var(--text-primary);
        margin: 0 0 0.85rem;
    }
    .ad-mini-table {
        width: 100%;
        border-collapse: collapse;
        font-family: var(--font-ui);
    }
    .ad-mini-table th, .ad-mini-table td {
        padding: 0.5rem 0.4rem;
        font-size: 0.85rem;
        border-bottom: 1px solid rgba(0,0,0,0.04);
    }
    .ad-mini-table th {
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--text-secondary);
        text-align: left;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }
    .ad-mini-table tr:last-child td { border-bottom: none; }

    /* Search bar */
    .ad-search-row {
        display: flex; gap: 0.5rem; align-items: center;
        background: rgba(255,255,255,0.92);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 14px;
        padding: 0.6rem 1rem;
        margin-bottom: 1rem;
        backdrop-filter: blur(8px);
    }
    .ad-search-input {
        flex: 1;
        border: none; outline: none;
        background: transparent;
        font-family: inherit;
        font-size: 0.95rem;
        color: var(--text-primary);
    }
    .ad-search-btn {
        background: linear-gradient(135deg, #8e44ad, #732d91);
        color: white; border: none;
        padding: 0.5rem 1.2rem;
        border-radius: 999px;
        font-weight: 700; font-family: var(--font-ui);
        font-size: 0.85rem; cursor: pointer;
        transition: all 0.2s;
    }
    .ad-search-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(142,68,173,0.28); }

    /* Filters */
    .ad-filter-row {
        display: flex; gap: 1rem; flex-wrap: wrap;
        margin-bottom: 1rem;
    }
    .ad-filter-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .ad-filter-label {
        font-size: 0.7rem; font-weight: 700;
        color: var(--text-secondary);
        text-transform: uppercase; letter-spacing: 0.06em;
        font-family: var(--font-ui);
    }
    .ad-select {
        padding: 0.55rem 0.95rem;
        border: 1.5px solid rgba(142,68,173,0.18);
        border-radius: 10px;
        background: white;
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer; outline: none;
        min-width: 160px;
        transition: all 0.2s;
    }
    .ad-select:focus { border-color: #8e44ad; box-shadow: 0 0 0 3px rgba(142,68,173,0.1); }

    /* Data table */
    .ad-table-wrap {
        background: rgba(255,255,255,0.92);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 16px;
        padding: 0.5rem;
        backdrop-filter: blur(8px);
        box-shadow: 0 6px 18px rgba(142,68,173,0.06);
        overflow-x: auto;
    }
    .ad-data-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-family: var(--font-ui);
    }
    .ad-data-table thead th {
        padding: 0.85rem 0.75rem;
        text-align: left;
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-secondary);
        border-bottom: 2px solid rgba(142,68,173,0.1);
        background: rgba(142,68,173,0.03);
    }
    .ad-data-table tbody td {
        padding: 0.75rem;
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--text-primary);
        border-bottom: 1px solid rgba(0,0,0,0.04);
    }
    .ad-data-table tbody tr:hover { background: rgba(142,68,173,0.03); }

    .ad-row-me { background: linear-gradient(90deg, rgba(142,68,173,0.06), rgba(34,197,94,0.06)); }
    .ad-me-tag {
        display: inline-block;
        margin-left: 0.4rem;
        padding: 0.15rem 0.4rem;
        background: linear-gradient(135deg, #8e44ad, #22c55e);
        color: white;
        border-radius: 999px;
        font-size: 0.6rem;
        font-weight: 900;
        letter-spacing: 0.1em;
    }

    .ad-pill {
        display: inline-flex; align-items: center; gap: 0.25rem;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .ad-pill-admin { background: rgba(142,68,173,0.15); color: #8e44ad; }
    .ad-pill-user { background: rgba(0,0,0,0.05); color: var(--text-secondary); }
    .ad-pill-active { background: rgba(34,197,94,0.15); color: #16a34a; }
    .ad-pill-banned { background: rgba(239,68,68,0.15); color: #dc2626; }
    .ad-pill-deleted { background: rgba(100,100,100,0.15); color: #555; }
    .ad-pill-win { background: rgba(34,197,94,0.15); color: #16a34a; }
    .ad-pill-loss { background: rgba(239,68,68,0.15); color: #dc2626; }
    .ad-pill-draw { background: rgba(234,179,8,0.15); color: #a16207; }
    .ad-pill-abandoned { background: rgba(100,100,100,0.15); color: #555; }

    .ad-coin-cell { color: #FFB400; font-weight: 800; }

    .ad-action-btns { display: inline-flex; gap: 0.3rem; }
    .ad-icon-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 28px; height: 28px;
        border: none; border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .ad-icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .ad-icon-coins { background: rgba(255,180,0,0.15); color: #FFB400; }
    .ad-icon-coins:hover:not(:disabled) { background: rgba(255,180,0,0.3); }
    .ad-icon-ban { background: rgba(239,68,68,0.12); color: #ef4444; }
    .ad-icon-ban:hover:not(:disabled) { background: rgba(239,68,68,0.25); }
    .ad-icon-unban { background: rgba(34,197,94,0.12); color: #22c55e; }
    .ad-icon-unban:hover:not(:disabled) { background: rgba(34,197,94,0.25); }
    .ad-icon-delete { background: rgba(100,100,100,0.1); color: #555; }
    .ad-icon-delete:hover:not(:disabled) { background: rgba(100,100,100,0.2); }

    .ad-pagination {
        display: flex; justify-content: center; align-items: center;
        gap: 1rem; margin-top: 1.2rem;
    }
    .ad-page-btn {
        background: rgba(142,68,173,0.06);
        border: 1px solid rgba(142,68,173,0.18);
        color: var(--accent-primary);
        padding: 0.55rem 1.2rem;
        border-radius: 999px;
        font-weight: 700; font-family: var(--font-ui);
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    .ad-page-btn:hover:not(:disabled) { background: rgba(142,68,173,0.12); transform: translateY(-1px); }
    .ad-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .ad-page-label {
        font-family: var(--font-ui);
        font-weight: 700;
        color: var(--text-secondary);
        font-size: 0.85rem;
    }

    @media (max-width: 640px) {
        .ad-inner { padding: 2rem 1rem 3rem; }
        .ad-data-table thead th, .ad-data-table tbody td {
            padding: 0.5rem 0.4rem;
            font-size: 0.78rem;
        }
    }
`;

export default Admin;
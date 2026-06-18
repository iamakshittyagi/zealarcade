import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { listGames, fetchLeaderboard } from '../api/games';
import { Trophy, Globe2, Gamepad2, Medal, Crown } from 'lucide-react';

const SORT_OPTIONS = [
    { value: 'wins', label: 'Wins' },
    { value: 'totalScore', label: 'Total Score' },
    { value: 'highScore', label: 'High Score' },
    { value: 'totalGames', label: 'Games Played' },
];

const Leaderboard = () => {
    const { user } = useGame();
    const [view, setView] = useState('global');  // 'global' | 'per-game'
    const [selectedGame, setSelectedGame] = useState('');
    const [sortBy, setSortBy] = useState('wins');
    const [games, setGames] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            color: Math.random() > 0.6 ? '#22c55e' : '#8e44ad',
        }));

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            dots.forEach(d => {
                d.x += d.vx; d.y += d.vy;
                if (d.x < 0 || d.x > W) d.vx *= -1;
                if (d.y < 0 || d.y > H) d.vy *= -1;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fillStyle = d.color + '55';
                ctx.fill();
            });
            dots.forEach((a, i) => {
                dots.slice(i + 1).forEach(b => {
                    const dist = Math.hypot(a.x - b.x, a.y - b.y);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(142,68,173,${0.10 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                });
            });
            animId = requestAnimationFrame(draw);
        };
        draw();

        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
    }, []);

    // Load games once
    useEffect(() => {
        listGames()
            .then(({ games }) => {
                setGames(games);
                if (games.length > 0) setSelectedGame(games[0].gameId);
            })
            .catch(err => console.error('Could not load games:', err));
    }, []);

    // Load leaderboard whenever view, game, or sortBy changes
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                if (view === 'global') {
                    const res = await fetchLeaderboard();
                    setLeaderboard(res.leaderboard || []);
                } else if (view === 'per-game' && selectedGame) {
                    const res = await fetchLeaderboard(selectedGame, 20, sortBy);
                    setLeaderboard(res.leaderboard || []);
                }
            } catch (err) {
                console.error('Could not load leaderboard:', err);
                setError('Could not load leaderboard. Please try again.');
                setLeaderboard([]);
            } finally {
                setLoading(false);
            }
        };
        if (view === 'global' || (view === 'per-game' && selectedGame)) {
            load();
        }
    }, [view, selectedGame, sortBy]);

    const getRankBadge = (rank) => {
        if (rank === 1) return { icon: <Crown size={16} />, color: '#FFD700', bg: 'linear-gradient(135deg, #FFD700, #FFA500)' };
        if (rank === 2) return { icon: <Medal size={16} />, color: '#C0C0C0', bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' };
        if (rank === 3) return { icon: <Medal size={16} />, color: '#CD7F32', bg: 'linear-gradient(135deg, #CD7F32, #8B4513)' };
        return null;
    };

    const isCurrentUser = (row) => user && row.username === user.username;

    return (
        <Layout>
            <div className="lb-root">
                <canvas ref={bgCanvasRef} className="lb-bg-canvas" />
                <div className="lb-blob lb-blob-1" />
                <div className="lb-blob lb-blob-2" />

                <div className="lb-inner">
                    <div className="lb-page-header">
                        <h1 className="lb-title">
                            <span className="lb-title-dark">Zeal</span>
                            <span className="lb-title-purple"> Leaderboard.</span>
                        </h1>
                        <p className="lb-subtitle">See where you stand among the champions.</p>
                    </div>

                    {/* View toggle */}
                    <div className="lb-view-toggle">
                        <button
                            className={`lb-toggle-btn ${view === 'global' ? 'lb-toggle-btn--active' : ''}`}
                            onClick={() => setView('global')}
                        >
                            <Globe2 size={16} /> Global
                        </button>
                        <button
                            className={`lb-toggle-btn ${view === 'per-game' ? 'lb-toggle-btn--active' : ''}`}
                            onClick={() => setView('per-game')}
                        >
                            <Gamepad2 size={16} /> Per Game
                        </button>
                    </div>

                    {/* Per-game filters */}
                    {view === 'per-game' && (
                        <div className="lb-filters">
                            <div className="lb-filter">
                                <label className="lb-filter-label">Game</label>
                                <select
                                    value={selectedGame}
                                    onChange={(e) => setSelectedGame(e.target.value)}
                                    className="lb-select"
                                >
                                    {games.map(g => (
                                        <option key={g.gameId} value={g.gameId}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="lb-filter">
                                <label className="lb-filter-label">Sort by</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="lb-select"
                                >
                                    {SORT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Leaderboard table */}
                    <div className="lb-table-wrap">
                        {loading && (
                            <div className="lb-state">
                                <div className="lb-spinner" />
                                <p>Loading rankings...</p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="lb-state lb-state-error">{error}</div>
                        )}

                        {!loading && !error && leaderboard.length === 0 && (
                            <div className="lb-state">
                                <Trophy size={48} style={{ opacity: 0.3 }} />
                                <p>No data yet. Be the first to play!</p>
                            </div>
                        )}

                        {!loading && !error && leaderboard.length > 0 && (
                            <table className="lb-table">
                                <thead>
                                    <tr>
                                        <th className="lb-th-rank">Rank</th>
                                        <th className="lb-th-name">Player</th>
                                        {view === 'global' ? (
                                            <>
                                                <th>Coins</th>
                                                <th>Wins</th>
                                                <th>Games</th>
                                                <th>Win Rate</th>
                                            </>
                                        ) : (
                                            <>
                                                <th>Wins</th>
                                                <th>Losses</th>
                                                <th>Games</th>
                                                <th>High Score</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((row, idx) => {
                                        const rank = idx + 1;
                                        const badge = getRankBadge(rank);
                                        const isMe = isCurrentUser(row);
                                        return (
                                            <tr key={row._id || row.user || idx} className={isMe ? 'lb-row-me' : ''}>
                                                <td className="lb-td-rank">
                                                    {badge ? (
                                                        <span className="lb-rank-badge" style={{ background: badge.bg, color: '#1a1a2e' }}>
                                                            {badge.icon} {rank}
                                                        </span>
                                                    ) : (
                                                        <span className="lb-rank-num">{rank}</span>
                                                    )}
                                                </td>
                                                <td className="lb-td-name">
                                                    {row.username || 'Unknown'}
                                                    {isMe && <span className="lb-me-tag">YOU</span>}
                                                </td>
                                                {view === 'global' ? (
                                                    <>
                                                        <td><span className="lb-coin-val">{row.coins ?? 0}</span></td>
                                                        <td>{row.totalWins ?? 0}</td>
                                                        <td>{row.totalGamesPlayed ?? 0}</td>
                                                        <td>{row.winRate ? row.winRate.toFixed(1) : '0.0'}%</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="lb-stat-win">{row.wins ?? 0}</td>
                                                        <td className="lb-stat-loss">{row.losses ?? 0}</td>
                                                        <td>{row.totalGames ?? 0}</td>
                                                        <td>{row.highScore ?? 0}</td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <style>{styles}</style>
            </div>
        </Layout>
    );
};

const styles = `
    .lb-root {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        background: linear-gradient(145deg, #faf8ff 0%, #f0f9f0 50%, #fdf6ff 100%);
    }
    .lb-bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
    .lb-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
    .lb-blob-1 { width: 500px; height: 500px; background: rgba(142,68,173,0.07); top: -100px; right: -100px; }
    .lb-blob-2 { width: 400px; height: 400px; background: rgba(34,197,94,0.06); bottom: 80px; left: -80px; }

    .lb-inner {
        position: relative; z-index: 1;
        max-width: 1000px; margin: 0 auto;
        padding: 3rem 2rem 5rem;
    }
    .lb-page-header { margin-bottom: 2rem; text-align: center; }
    .lb-title {
        display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem;
        font-family: var(--font-ui);
        font-size: clamp(1.8rem, 3.5vw, 2.6rem);
        font-weight: 900; line-height: 1.15; letter-spacing: -0.5px;
        margin: 0 0 0.6rem;
    }
    .lb-title-dark { color: var(--text-primary); }
    .lb-title-purple {
        background: linear-gradient(135deg, #8e44ad, #732d91);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .lb-subtitle {
        color: var(--text-secondary);
        font-size: 1rem; line-height: 1.6;
        max-width: 480px; margin: 0 auto;
    }

    .lb-view-toggle {
        display: flex; gap: 0.5rem; justify-content: center;
        margin-bottom: 1.5rem;
        background: rgba(255,255,255,0.85);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 999px;
        padding: 0.3rem;
        width: fit-content;
        margin-left: auto; margin-right: auto;
        backdrop-filter: blur(8px);
    }
    .lb-toggle-btn {
        display: inline-flex; align-items: center; gap: 0.4rem;
        padding: 0.55rem 1.25rem;
        border-radius: 999px;
        border: none; background: transparent;
        color: var(--text-secondary);
        font-weight: 700; font-family: var(--font-ui);
        font-size: 0.9rem; cursor: pointer;
        transition: all 0.2s;
    }
    .lb-toggle-btn:hover { color: var(--text-primary); }
    .lb-toggle-btn--active {
        background: linear-gradient(135deg, #8e44ad, #732d91);
        color: white;
        box-shadow: 0 4px 14px rgba(142,68,173,0.28);
    }

    .lb-filters {
        display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;
        margin-bottom: 1.5rem;
    }
    .lb-filter { display: flex; flex-direction: column; gap: 0.25rem; }
    .lb-filter-label {
        font-size: 0.7rem; font-weight: 700;
        color: var(--text-secondary);
        text-transform: uppercase; letter-spacing: 0.06em;
        font-family: var(--font-ui);
    }
    .lb-select {
        padding: 0.6rem 1rem;
        border: 1.5px solid rgba(142,68,173,0.18);
        border-radius: 12px;
        background: white;
        color: var(--text-primary);
        font-family: inherit; font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer; outline: none;
        min-width: 180px;
        transition: all 0.2s;
    }
    .lb-select:focus {
        border-color: #8e44ad;
        box-shadow: 0 0 0 3px rgba(142,68,173,0.1);
    }

    .lb-table-wrap {
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(142,68,173,0.14);
        border-radius: 20px;
        padding: 1rem;
        box-shadow: 0 20px 60px rgba(142,68,173,0.12), 0 4px 16px rgba(0,0,0,0.06);
        backdrop-filter: blur(12px);
        overflow-x: auto;
    }

    .lb-state {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 3rem 1rem;
        color: var(--text-secondary);
        gap: 0.75rem;
        font-family: var(--font-ui);
    }
    .lb-state-error { color: #ef4444; }

    .lb-spinner {
        width: 40px; height: 40px;
        border: 3px solid rgba(142,68,173,0.15);
        border-top-color: #8e44ad;
        border-radius: 50%;
        animation: lbSpin 1s linear infinite;
    }
    @keyframes lbSpin { to { transform: rotate(360deg); } }

    .lb-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-family: var(--font-ui);
    }
    .lb-table thead th {
        padding: 0.85rem 0.75rem;
        text-align: left;
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-secondary);
        border-bottom: 2px solid rgba(142,68,173,0.12);
        background: rgba(142,68,173,0.03);
    }
    .lb-table tbody td {
        padding: 0.9rem 0.75rem;
        font-size: 0.92rem;
        font-weight: 600;
        color: var(--text-primary);
        border-bottom: 1px solid rgba(0,0,0,0.04);
    }
    .lb-table tbody tr:last-child td { border-bottom: none; }
    .lb-table tbody tr:hover { background: rgba(142,68,173,0.03); }

    .lb-row-me {
        background: linear-gradient(90deg, rgba(142,68,173,0.08), rgba(34,197,94,0.08));
    }
    .lb-row-me:hover { background: linear-gradient(90deg, rgba(142,68,173,0.14), rgba(34,197,94,0.14)) !important; }

    .lb-th-rank { width: 90px; }
    .lb-td-rank { width: 90px; }
    .lb-rank-num {
        display: inline-flex; align-items: center; justify-content: center;
        width: 30px; height: 30px;
        background: rgba(142,68,173,0.08);
        border-radius: 50%;
        color: #8e44ad;
        font-weight: 800; font-size: 0.85rem;
    }
    .lb-rank-badge {
        display: inline-flex; align-items: center; gap: 0.3rem;
        padding: 0.3rem 0.7rem;
        border-radius: 999px;
        font-weight: 900; font-size: 0.85rem;
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }

    .lb-th-name { min-width: 150px; }
    .lb-td-name {
        font-weight: 800;
        color: var(--text-primary);
    }
    .lb-me-tag {
        display: inline-block;
        margin-left: 0.5rem;
        padding: 0.15rem 0.5rem;
        background: linear-gradient(135deg, #8e44ad, #22c55e);
        color: white;
        border-radius: 999px;
        font-size: 0.65rem;
        font-weight: 900;
        letter-spacing: 0.1em;
    }

    .lb-coin-val { color: #FFB400; font-weight: 800; }
    .lb-stat-win { color: #22c55e; font-weight: 800; }
    .lb-stat-loss { color: #ef4444; font-weight: 800; }

    @media (max-width: 640px) {
        .lb-inner { padding: 2rem 1rem 3rem; }
        .lb-table thead th, .lb-table tbody td {
            padding: 0.6rem 0.4rem;
            font-size: 0.78rem;
        }
        .lb-rank-num, .lb-rank-badge { font-size: 0.75rem; }
    }
`;

export default Leaderboard;
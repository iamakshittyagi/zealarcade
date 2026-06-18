import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Play, User, Users } from 'lucide-react';

const games = [
    { id: 'snake', title: 'Snake', icon: '🐍', desc: 'Eat apples, grow longer, avoid yourself.', path: '/games/snake', type: 'single', color: '#22c55e' },
    { id: 'flappy-bird', title: 'Flappy Bird', icon: '🐦', desc: 'Navigate through pipes without crashing.', path: '/games/flappy-bird', type: 'single', color: '#22c55e' },
    { id: 'sudoku', title: 'Sudoku', icon: '🔢', desc: 'Challenge your mind with the number grid puzzle.', path: '/games/sudoku', type: 'single', color: '#22c55e' },
    { id: 'arrows', title: 'Arrows', icon: '↗️', desc: 'Follow the arrows to find your path to the finish.', path: '/games/arrows', type: 'single', color: '#22c55e' },
    { id: 'pacman', title: 'Pac-Man', icon: '🟡', desc: 'Eat pellets and dodge the ghosts in the maze.', path: '/games/pacman', type: 'single', color: '#22c55e' },
    { id: 'tic-tac-toe', title: 'Tic-Tac-Toe', icon: '❌', desc: 'Outsmart your opponent in the classic Xs and Os.', path: '/games/tic-tac-toe', type: 'multi', color: '#8e44ad' },
    { id: 'connect-four', title: 'Connect Four', icon: '🔴', desc: 'Drop discs and connect four in a row to win.', path: '/games/connect-four', type: 'multi', color: '#8e44ad' },
    { id: 'snake-ladder', title: 'Snake & Ladder', icon: '🪜', desc: 'Climb ladders and dodge snakes to reach 100.', path: '/games/snake-ladder', type: 'multi', color: '#8e44ad' },
    { id: 'ludo', title: 'Ludo', icon: '🎲', desc: 'Race your tokens to the center in this board classic.', path: '/games/ludo', type: 'multi', color: '#8e44ad' },
    { id: 'sea-battle', title: 'Sea Battle', icon: '🚢', desc: "Command your fleet and sink your opponent's ships.", path: '/games/sea-battle', type: 'multi', color: '#8e44ad' },
    { id: 'ping-pong', title: 'Ping Pong', icon: '🏓', desc: "Fast-paced table tennis. Don't miss the ball!", path: '/games/ping-pong', type: 'multi', color: '#8e44ad' },
    { id: 'hand-slap', title: 'Hand Slap', icon: '✋', desc: 'Test your reflexes in this high-speed slapping game.', path: '/games/hand-slap', type: 'multi', color: '#8e44ad' },
    { id: 'rps', title: 'RPS', icon: '✊', desc: 'Rock, Paper, Scissors — choose wisely to win.', path: '/games/rps', type: 'multi', color: '#8e44ad' },
    { id: 'air-hockey', title: 'Air Hockey', icon: '🏒', desc: 'Glide and score goals to take the win.', path: '/games/air-hockey', type: 'multi', color: '#8e44ad' },
    { id: 'chess', title: 'Chess', icon: '♟️', desc: 'The ultimate game of strategy. Checkmate your opponent.', path: '/games/chess', type: 'multi', color: '#8e44ad' },
];

const Arcade = () => {
    const [activeTab, setActiveTab] = useState('single');
    const [hoveredCard, setHoveredCard] = useState(null);
    const canvasRef = useRef(null);
    const filteredGames = games.filter(g => g.type === activeTab);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;

        const dots = Array.from({ length: 50 }, () => ({
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
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
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

    return (
        <Layout>
            <div className="arc-root">
                <canvas ref={canvasRef} className="arc-canvas" />
                <div className="arc-blob arc-blob-1" />
                <div className="arc-blob arc-blob-2" />

                <div className="arc-inner">
                    {/* Header */}
                    <div className="arc-header">
                        <div className="arc-header-text">
                            <h1 className="arc-title">
                                <span className="arc-title-dark">Choose Your</span>
                                <span className="arc-title-gradient"> Adventure</span>
                            </h1>
                            <p className="arc-subtitle">
                                {activeTab === 'single'
                                    ? `${games.filter(g => g.type === 'single').length} solo experiences waiting for you`
: `${games.filter(g => g.type === 'multi').length} brain-teasing duels vs the computer`}
                            </p>
                        </div>

                        {/* Tab switcher */}
                        <div className="arc-tabs">
                            <button
                                className={`arc-tab ${activeTab === 'single' ? 'arc-tab--active' : ''}`}
                                onClick={() => setActiveTab('single')}
                            >
                                <User size={16} />
                                <span>Single Player</span>
                                <span className="arc-tab-count">{games.filter(g => g.type === 'single').length}</span>
                            </button>
                            <button
                                className={`arc-tab ${activeTab === 'multi' ? 'arc-tab--active arc-tab--multi' : ''}`}
                                onClick={() => setActiveTab('multi')}
                            >
                                <Users size={16} />
                                <span>vs Computer</span>
                                <span className="arc-tab-count">{games.filter(g => g.type === 'multi').length}</span>
                            </button>
                        </div>
                    </div>

                    {/* Game grid */}
                    <div className="arc-grid">
                        {filteredGames.map((game, index) => (
                            <Link
                                key={`${activeTab}-${game.id}`}
                                to={game.path}
                                className="arc-card"
                                style={{ animationDelay: `${index * 0.06}s` }}
                                onMouseEnter={() => setHoveredCard(game.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                <div className={`arc-card-inner ${hoveredCard === game.id ? 'arc-card-inner--hovered' : ''}`}>
                                    {/* Top row */}
                                    <div className="arc-card-top">
                                        <div
                                            className="arc-icon-box"
                                            style={{
                                                background: game.type === 'single'
                                                    ? 'rgba(34,197,94,0.1)'
                                                    : 'rgba(142,68,173,0.1)',
                                                borderColor: game.type === 'single'
                                                    ? 'rgba(34,197,94,0.25)'
                                                    : 'rgba(142,68,173,0.25)',
                                            }}
                                        >
                                            <span className="arc-icon">{game.icon}</span>
                                        </div>
                                        <span
                                            className="arc-type-badge"
                                            style={{
                                                color: game.type === 'single' ? '#16a34a' : '#732d91',
                                                background: game.type === 'single' ? 'rgba(34,197,94,0.08)' : 'rgba(142,68,173,0.08)',
                                                borderColor: game.type === 'single' ? 'rgba(34,197,94,0.25)' : 'rgba(142,68,173,0.2)',
                                            }}
                                        >
                                            {game.type === 'single' ? '1P' : '2P'}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <h3 className="arc-card-title">{game.title}</h3>
                                    <p className="arc-card-desc">{game.desc}</p>

                                    {/* Play row */}
                                    <div
                                        className="arc-play-row"
                                        style={{ color: game.type === 'single' ? '#22c55e' : '#8e44ad' }}
                                    >
                                        <span>Play Now</span>
                                        <div className="arc-play-btn">
                                            <Play size={13} fill="currentColor" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .arc-root {
                    position: relative;
                    min-height: 100vh;
                    overflow: hidden;
                    background: linear-gradient(145deg, #faf8ff 0%, #f0f9f0 50%, #fdf6ff 100%);
                }
                .arc-canvas {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                }
                .arc-blob {
                    position: fixed;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                    z-index: 0;
                }
                .arc-blob-1 {
                    width: 500px; height: 500px;
                    background: rgba(142,68,173,0.06);
                    top: -100px; right: -100px;
                }
                .arc-blob-2 {
                    width: 400px; height: 400px;
                    background: rgba(34,197,94,0.06);
                    bottom: 100px; left: -80px;
                }

                .arc-inner {
                    position: relative;
                    z-index: 1;
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 3rem 2.5rem 4rem;
                }

                /* Header */
                .arc-header {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 2rem;
                    margin-bottom: 3rem;
                    flex-wrap: wrap;
                }
                .arc-header-text { display: flex; flex-direction: column; gap: 0.5rem; }

                .arc-live-badge {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    background: rgba(34,197,94,0.08);
                    border: 1px solid rgba(34,197,94,0.25);
                    border-radius: 999px; padding: 0.3rem 0.9rem;
                    font-size: 0.73rem; font-weight: 700; color: #16a34a;
                    font-family: var(--font-ui); letter-spacing: 0.07em;
                    text-transform: uppercase; width: fit-content;
                    margin-bottom: 0.25rem;
                }
                .arc-badge-dot {
                    width: 7px; height: 7px; border-radius: 50%;
                    background: #22c55e;
                    animation: arcPulse 1.8s ease-in-out infinite;
                }
                @keyframes arcPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.8); }
                }

                .arc-title {
                    font-family: var(--font-ui);
                    font-size: clamp(1.8rem, 3vw, 2.6rem);
                    font-weight: 900; line-height: 1.1;
                    letter-spacing: -0.5px; margin: 0;
                    display: flex; flex-direction: column; gap: 0.05rem;
                }
                .arc-title-dark { color: var(--text-primary); }
                .arc-title-gradient {
                    background: linear-gradient(135deg, #8e44ad, #22c55e);
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .arc-subtitle {
                    font-size: 0.9rem; color: var(--text-secondary);
                    font-weight: 400; margin: 0.3rem 0 0;
                }

                /* Tabs */
                .arc-tabs {
                    display: flex;
                    background: rgba(255,255,255,0.85);
                    border: 1px solid rgba(142,68,173,0.14);
                    border-radius: 16px;
                    padding: 5px;
                    gap: 6px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 16px rgba(142,68,173,0.08);
                }
                .arc-tab {
                    display: flex; align-items: center; gap: 7px;
                    padding: 0.65rem 1.3rem;
                    border: none; background: transparent;
                    color: var(--text-secondary);
                    font-weight: 600; font-size: 0.88rem;
                    font-family: var(--font-ui);
                    cursor: pointer; border-radius: 12px;
                    transition: all 0.25s ease;
                }
                .arc-tab-count {
                    display: inline-flex; align-items: center; justify-content: center;
                    width: 22px; height: 22px;
                    background: rgba(142,68,173,0.1);
                    color: var(--text-secondary);
                    border-radius: 6px;
                    font-size: 0.72rem; font-weight: 800;
                    transition: all 0.25s;
                }
                .arc-tab--active {
                    background: white;
                    color: #8e44ad;
                    box-shadow: 0 4px 14px rgba(142,68,173,0.14);
                }
                .arc-tab--active .arc-tab-count {
                    background: rgba(142,68,173,0.1);
                    color: #8e44ad;
                }
                .arc-tab--multi.arc-tab--active {
                    color: #8e44ad;
                }

                /* Grid */
                .arc-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
                    gap: 1.4rem;
                }

                /* Card */
                .arc-card {
                    text-decoration: none; color: inherit;
                    opacity: 0;
                    animation: arcCardIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes arcCardIn {
                    from { opacity: 0; transform: translateY(18px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .arc-card-inner {
                    background: rgba(255,255,255,0.88);
                    border: 1px solid rgba(142,68,173,0.13);
                    border-radius: 20px;
                    padding: 1.5rem;
                    height: 100%;
                    display: flex; flex-direction: column; gap: 0.75rem;
                    backdrop-filter: blur(12px);
                    box-shadow: 0 4px 20px rgba(142,68,173,0.06);
                    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1),
                                box-shadow 0.3s ease,
                                border-color 0.3s ease,
                                background 0.3s ease;
                    cursor: pointer;
                }
                .arc-card-inner--hovered {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 40px rgba(142,68,173,0.14);
                    border-color: rgba(142,68,173,0.35);
                    background: rgba(255,255,255,0.95);
                }

                .arc-card-top {
                    display: flex; align-items: flex-start;
                    justify-content: space-between;
                    margin-bottom: 0.25rem;
                }
                .arc-icon-box {
                    width: 52px; height: 52px;
                    border-radius: 14px;
                    border: 1px solid;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .arc-icon { font-size: 1.6rem; line-height: 1; }
                .arc-type-badge {
                    font-size: 0.68rem; font-weight: 800;
                    font-family: var(--font-ui);
                    border: 1px solid;
                    border-radius: 7px;
                    padding: 0.2rem 0.5rem;
                    letter-spacing: 0.04em;
                }

                .arc-card-title {
                    font-family: var(--font-ui);
                    font-size: 1.05rem; font-weight: 800;
                    color: var(--text-primary); margin: 0;
                    letter-spacing: -0.2px;
                }
                .arc-card-desc {
                    font-size: 0.83rem; color: var(--text-secondary);
                    line-height: 1.55; margin: 0; flex-grow: 1;
                    font-weight: 400;
                }
                .arc-play-row {
                    display: flex; align-items: center;
                    justify-content: space-between;
                    margin-top: 0.5rem;
                    font-size: 0.82rem; font-weight: 700;
                    font-family: var(--font-ui);
                    letter-spacing: 0.02em;
                }
                .arc-play-btn {
                    width: 30px; height: 30px;
                    border-radius: 50%;
                    background: currentColor;
                    display: flex; align-items: center; justify-content: center;
                    color: white;
                    transition: transform 0.2s;
                }
                .arc-card-inner--hovered .arc-play-btn {
                    transform: scale(1.12);
                }

                @media (max-width: 768px) {
                    .arc-inner { padding: 2rem 1.25rem 3rem; }
                    .arc-header { flex-direction: column; align-items: flex-start; }
                    .arc-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
                }
            `}</style>
        </Layout>
    );
};

export default Arcade;
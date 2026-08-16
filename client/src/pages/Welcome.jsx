import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Layout from '../components/Layout';

const Welcome = () => {
    const { user } = useGame();
    const canvasRef = useRef(null);

    // Animated particle grid
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;

        const dots = Array.from({ length: 60 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
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
                ctx.fillStyle = d.color + '66';
                ctx.fill();
            });
            // Draw connecting lines
            dots.forEach((a, i) => {
                dots.slice(i + 1).forEach(b => {
                    const dist = Math.hypot(a.x - b.x, a.y - b.y);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(142,68,173,${0.12 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                });
            });
            animId = requestAnimationFrame(draw);
        };
        draw();

        const onResize = () => {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
    }, []);

    const games = ['Chess', 'Ludo', 'Snake & Ladder', 'Tic-Tac-Toe', 'Sudoku', 'Connect Four', 'Pac-Man', 'Ping Pong', 'Air Hockey', 'Flappy Bird', 'Snake', 'Sea Battle'];

    return (
        <Layout showHeader={false} showFooter={false}>
            <div className="wl-root">
                {/* Particle canvas */}
                <canvas ref={canvasRef} className="wl-canvas" />

                {/* Background shapes */}
                <div className="wl-shape wl-shape-1" />
                <div className="wl-shape wl-shape-2" />
                <div className="wl-shape wl-shape-3" />
                <div className="wl-shape wl-shape-4" />

                {/* Top nav */}
                <nav className="wl-nav">
                    <div className="wl-nav-brand">
                        <img src="/assets/logo_whitebg.png" alt="Zeal Arcade" />
                        <span>Zeal<span className="wl-nav-arcade">Arcade</span></span>
                    </div>
                    <div className="wl-nav-actions">
                        {user ? (
                            <Link to="/arcade" className="wl-btn-green">Enter Arcade</Link>
                        ) : (
                            <>
                                <Link to="/login" className="wl-nav-login">Log In</Link>
                                <Link to="/signup" className="wl-btn-green">Play Now</Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Hero section */}
                <section className="wl-hero">
                    <div className="wl-hero-left">


                        {/* Main headline */}
                        <h1 className="wl-headline">
                            <span className="wl-hl-white">Classic Games.</span>
                            <span className="wl-hl-purple">Modern Feel.</span>
                            <span className="wl-hl-green">Infinite Fun.</span>
                        </h1>

                        <p className="wl-desc">
                            All your favorite classic games, now reimagained in a mini arcade!!
                            Earn coins, climb leaderboards and have fun.
                        </p>

                        {/* CTA buttons */}
                        <div className="wl-cta-row">
                            {user ? (
                                <Link to="/arcade" className="wl-btn-primary">
                                    <span>Go to Arcade</span>
                                    <span className="wl-btn-arrow">→</span>
                                </Link>
                            ) : (
                                <>
                                    <Link to="/signup" className="wl-btn-primary">
                                        <span>Start Playing Free</span>
                                        <span className="wl-btn-arrow">→</span>
                                    </Link>
                                    <Link to="/login" className="wl-btn-outline">Log In</Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right — game showcase */}
                    <div className="wl-hero-right">
                        <div className="wl-showcase">
                            <div className="wl-showcase-header">
                                <span className="wl-showcase-dot red" />
                                <span className="wl-showcase-dot yellow" />
                                <span className="wl-showcase-dot green" />
                                <span className="wl-showcase-title">Game Library</span>
                            </div>
                            <div className="wl-game-grid">
                                {games.map((g, i) => (
                                    <div key={g} className="wl-game-card" style={{ animationDelay: `${i * 0.07}s` }}>
                                        <span className="wl-game-icon">{gameEmoji(g)}</span>
                                        <span className="wl-game-name">{g}</span>
                                        <span className="wl-game-tag">Play</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Floating coin card */}
                        <div className="wl-coin-card">
                            <span className="wl-coin-icon">🪙</span>
                            <div>
                                <div className="wl-coin-val">+100</div>
                                <div className="wl-coin-label">Free coins on signup</div>
                            </div>
                        </div>

                        {/* Floating streak card */}
                        <div className="wl-streak-card">
                            <span>🎮</span>
                            <div>
                                <div className="wl-streak-val">Play & Earn</div>
                                <div className="wl-streak-label">Win games to earn more</div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.88); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes livePulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
                    50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
                }
                @keyframes floatCard {
                    0%, 100% { transform: translateY(0px); }
                    50%      { transform: translateY(-8px); }
                }
                @keyframes floatCard2 {
                    0%, 100% { transform: translateY(0px); }
                    50%      { transform: translateY(8px); }
                }
                @keyframes blobDrift {
                    0%   { transform: translate(0,0) scale(1); }
                    100% { transform: translate(50px, 30px) scale(1.15); }
                }

                .wl-root {
                    min-height: 100vh;
                    background: #ffffff;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                /* Canvas */
                .wl-canvas {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                }

                /* Background shapes */
                .wl-shape {
                    position: fixed;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                    z-index: 0;
                    animation: blobDrift 14s ease-in-out infinite alternate;
                }
                .wl-shape-1 {
                    width: 480px; height: 480px;
                    background: radial-gradient(circle, rgba(142,68,173,0.13), transparent 70%);
                    top: -180px; left: -120px;
                }
                .wl-shape-2 {
                    width: 360px; height: 360px;
                    background: radial-gradient(circle, rgba(34,197,94,0.10), transparent 70%);
                    top: 10%; right: -80px;
                    animation-delay: -4s;
                }
                .wl-shape-3 {
                    width: 300px; height: 300px;
                    background: radial-gradient(circle, rgba(142,68,173,0.10), transparent 70%);
                    bottom: -80px; left: 20%;
                    animation-delay: -8s;
                }
                .wl-shape-4 {
                    width: 200px; height: 200px;
                    background: radial-gradient(circle, rgba(34,197,94,0.12), transparent 70%);
                    bottom: 20%; right: 10%;
                    animation-delay: -2s;
                }

                /* Nav */
                .wl-nav {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.2rem 3rem;
                    border-bottom: none;
                    background: transparent;
                    backdrop-filter: none;
                    animation: fadeUp 0.5s ease both;
                }
                .wl-nav-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    font-family: var(--font-ui);
                    font-size: 1.2rem;
                    font-weight: 800;
                    color: var(--text-primary);
                }
                .wl-nav-brand img { height: 34px; width: auto; }
                .wl-nav-arcade {
                    color: var(--accent-primary);
                    margin-left: 3px;
                }
                .wl-nav-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .wl-nav-login {
                    color: var(--text-secondary);
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.95rem;
                    transition: color 0.2s;
                }
                .wl-nav-login:hover { color: var(--accent-primary); }
                .wl-btn-green {
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    color: white;
                    text-decoration: none;
                    padding: 0.6rem 1.4rem;
                    border-radius: 999px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    font-family: var(--font-ui);
                    letter-spacing: 0.02em;
                    transition: all 0.3s;
                    box-shadow: 0 4px 14px rgba(34,197,94,0.3);
                }
                .wl-btn-green:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(34,197,94,0.4);
                }

                /* Hero */
                .wl-hero {
                    position: relative;
                    z-index: 1;
                    flex: 1;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4rem;
                    align-items: center;
                    padding: 4rem 3rem 3rem;
                    max-width: 1280px;
                    margin: 0 auto;
                    width: 100%;
                }

                /* Left */
                .wl-hero-left {
                    display: flex;
                    flex-direction: column;
                    gap: 1.8rem;
                    animation: fadeUp 0.6s ease 0.1s both;
                }

                .wl-live-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(34,197,94,0.08);
                    border: 1px solid rgba(34,197,94,0.25);
                    border-radius: 999px;
                    padding: 0.35rem 1rem;
                    font-size: 0.78rem;
                    font-weight: 700;
                    color: #16a34a;
                    font-family: var(--font-ui);
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    width: fit-content;
                }
                .wl-live-dot {
                    width: 8px; height: 8px;
                    border-radius: 50%;
                    background: #22c55e;
                    animation: livePulse 1.8s infinite;
                }

                .wl-headline {
                    display: flex;
                    flex-direction: column;
                    gap: 0.1rem;
                    font-family: var(--font-ui);
                    font-size: clamp(2.4rem, 4.5vw, 4rem);
                    font-weight: 900;
                    line-height: 1.1;
                    letter-spacing: -1px;
                }
                .wl-hl-white { color: var(--text-primary); }
                .wl-hl-purple {
                    background: linear-gradient(135deg, #8e44ad, #732d91);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .wl-hl-green {
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .wl-desc {
                    font-size: 1.1rem;
                    color: var(--text-secondary);
                    line-height: 1.7;
                    max-width: 460px;
                    font-weight: 300;
                }

                .wl-cta-row {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                .wl-btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: linear-gradient(135deg, #8e44ad, #732d91);
                    color: white;
                    text-decoration: none;
                    padding: 0.9rem 2rem;
                    border-radius: 999px;
                    font-weight: 700;
                    font-family: var(--font-ui);
                    font-size: 0.95rem;
                    letter-spacing: 0.02em;
                    transition: all 0.3s;
                    box-shadow: 0 6px 20px rgba(142,68,173,0.3);
                }
                .wl-btn-primary:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 28px rgba(142,68,173,0.4);
                }
                .wl-btn-arrow {
                    transition: transform 0.3s;
                }
                .wl-btn-primary:hover .wl-btn-arrow { transform: translateX(4px); }

                .wl-btn-outline {
                    display: inline-flex;
                    align-items: center;
                    text-decoration: none;
                    padding: 0.9rem 2rem;
                    border-radius: 999px;
                    border: 1.5px solid rgba(142,68,173,0.3);
                    color: var(--accent-primary);
                    font-weight: 700;
                    font-family: var(--font-ui);
                    font-size: 0.95rem;
                    background: rgba(142,68,173,0.04);
                    transition: all 0.3s;
                }
                .wl-btn-outline:hover {
                    background: rgba(142,68,173,0.10);
                    border-color: var(--accent-primary);
                    transform: translateY(-2px);
                }

                /* Right */
                .wl-hero-right {
                    position: relative;
                    animation: fadeUp 0.6s ease 0.25s both;
                }

                .wl-showcase {
                    background: rgba(255,255,255,0.9);
                    border: 1px solid rgba(142,68,173,0.18);
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(142,68,173,0.12), 0 4px 16px rgba(0,0,0,0.06);
                    backdrop-filter: blur(12px);
                }
                .wl-showcase-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.9rem 1.2rem;
                    background: rgba(142,68,173,0.05);
                    border-bottom: 1px solid rgba(142,68,173,0.12);
                }
                .wl-showcase-dot {
                    width: 11px; height: 11px;
                    border-radius: 50%;
                }
                .wl-showcase-dot.red    { background: #ff5f57; }
                .wl-showcase-dot.yellow { background: #febc2e; }
                .wl-showcase-dot.green  { background: #28c840; }
                .wl-showcase-title {
                    margin-left: 0.4rem;
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    font-family: var(--font-ui);
                    letter-spacing: 0.04em;
                }
                .wl-game-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0;
                }
                .wl-game-card {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    padding: 0.75rem 1.1rem;
                    border-bottom: 1px solid rgba(142,68,173,0.08);
                    border-right: 1px solid rgba(142,68,173,0.08);
                    transition: background 0.2s;
                    animation: popIn 0.4s ease both;
                    cursor: default;
                }
                .wl-game-card:hover {
                    background: rgba(142,68,173,0.05);
                }
                .wl-game-icon { font-size: 1.1rem; }
                .wl-game-name {
                    flex: 1;
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .wl-game-tag {
                    font-size: 0.68rem;
                    font-weight: 700;
                    color: #22c55e;
                    background: rgba(34,197,94,0.1);
                    border: 1px solid rgba(34,197,94,0.25);
                    border-radius: 999px;
                    padding: 0.1rem 0.5rem;
                    font-family: var(--font-ui);
                }

                /* Floating cards */
                .wl-coin-card {
                    position: absolute;
                    bottom: -20px;
                    left: -40px;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: white;
                    border: 1px solid rgba(34,197,94,0.3);
                    border-radius: 14px;
                    padding: 0.8rem 1.2rem;
                    box-shadow: 0 8px 24px rgba(34,197,94,0.15);
                    animation: floatCard 4s ease-in-out infinite;
                }
                .wl-coin-icon { font-size: 1.6rem; }
                .wl-coin-val {
                    font-family: var(--font-ui);
                    font-size: 1.1rem;
                    font-weight: 900;
                    color: #22c55e;
                }
                .wl-coin-label {
                    font-size: 0.72rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                }
                .wl-streak-card {
                    position: absolute;
                    top: -20px;
                    right: -30px;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: white;
                    border: 1px solid rgba(142,68,173,0.25);
                    border-radius: 14px;
                    padding: 0.8rem 1.2rem;
                    box-shadow: 0 8px 24px rgba(142,68,173,0.12);
                    font-size: 1.4rem;
                    animation: floatCard2 5s ease-in-out infinite;
                }
                .wl-streak-val {
                    font-family: var(--font-ui);
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: var(--accent-primary);
                }
                .wl-streak-label {
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                }

                /* Responsive */
                @media (max-width: 1024px) {
                    .wl-hero {
                        grid-template-columns: 1fr;
                        padding: 3rem 2rem;
                        gap: 3rem;
                    }
                    .wl-coin-card { left: 0; }
                    .wl-streak-card { right: 0; }
                }
                @media (max-width: 640px) {
                    .wl-nav { padding: 1rem 1.25rem; }
                    .wl-headline { font-size: clamp(2rem, 8vw, 2.8rem); }
                    .wl-cta-row { flex-direction: column; }
                    .wl-btn-primary, .wl-btn-outline { justify-content: center; }
                    .wl-hero { padding: 2rem 1.25rem; }
                }
            `}</style>
        </Layout>
    );
};

const gameEmoji = (name) => {
    const map = {
        'Chess': '♟️', 'Ludo': '🎲', 'Snake & Ladder': '🐍', 'Tic-Tac-Toe': '❌',
        'Sudoku': '🔢', 'Connect Four': '🔴', 'Pac-Man': '👾', 'Ping Pong': '🏓',
        'Air Hockey': '🥅', 'Flappy Bird': '🐦', 'Snake': '🐍', 'Sea Battle': '⚓',
    };
    return map[name] || '🎮';
};

export default Welcome;
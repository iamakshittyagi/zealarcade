import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Layout from '../components/Layout';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [focusedField, setFocusedField] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useGame();
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login({ username, password });
            if (user?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/arcade');
            }
        } catch (err) {
            const msg = err.response?.data?.error || 'Login failed. Please try again.';
            setError(msg);
            setLoading(false);
        }
    };

    const fields = [
        { id: 'username', label: 'Username', type: 'text', value: username, setter: setUsername, placeholder: 'Enter your username', icon: '👤' },
        { id: 'password', label: 'Password', type: 'password', value: password, setter: setPassword, placeholder: 'Enter your password', icon: '🔒' },
    ];

    return (
        <Layout showHeader={false} showFooter={false}>
            <div className="li-root">
                <canvas ref={canvasRef} className="li-canvas" />

                <div className="li-blob li-blob-1" />
                <div className="li-blob li-blob-2" />
                <div className="li-blob li-blob-3" />

                {/* Nav */}
                <nav className="li-nav">
                    <Link to="/" className="li-nav-brand">
                        <img src="/assets/logo_whitebg.png" alt="Zeal Arcade" />
                        <span>Zeal<span className="li-nav-arcade">Arcade</span></span>
                    </Link>
                    <Link to="/signup" className="li-nav-signup">
                        New here? <span className="li-nav-signup-cta">Create Account →</span>
                    </Link>
                </nav>

                {/* Main */}
                <main className="li-main">

                    {/* Left — form */}
                    <div className="li-left">
                        <div className="li-card">
                            <div className="li-card-top">
                                <img src="/assets/logo_whitebg.png" alt="Logo" className="li-logo" />
                                <h2 className="li-card-title">Welcome Back</h2>
                                <p className="li-card-sub">Log in to continue your adventure</p>
                            </div>

                            <form onSubmit={handleSubmit} className="li-form">
                                {fields.map((f, i) => (
                                    <div
                                        key={f.id}
                                        className={`li-field ${focusedField === f.id ? 'li-field--focused' : ''}`}
                                        style={{ animationDelay: `${0.15 + i * 0.09}s` }}
                                    >
                                        <label className="li-label">
                                            <span className="li-label-icon">{f.icon}</span>
                                            {f.label}
                                        </label>
                                        <input
                                            type={f.type}
                                            value={f.value}
                                            onChange={e => { f.setter(e.target.value); setError(''); }}
                                            placeholder={f.placeholder}
                                            className="li-input"
                                            onFocus={() => setFocusedField(f.id)}
                                            onBlur={() => setFocusedField(null)}
                                            required
                                        />
                                    </div>
                                ))}

                                {error && (
                                    <div className="li-error">
                                        <span>⚠️</span> {error}
                                    </div>
                                )}

                                {/* Hint box */}
                                <div className="li-hint">
                                    <span className="li-hint-icon">💡</span>
                                    <span>Demo: <strong>testuser</strong> / <strong>test123</strong></span>
                                </div>

                                <button
                                    type="submit"
                                    className={`li-submit ${loading ? 'li-submit--loading' : ''}`}
                                    disabled={loading}
                                >
                                    {loading ? <span className="li-spinner" /> : (
                                        <><span>Log In</span><span className="li-submit-arrow">→</span></>
                                    )}
                                </button>
                            </form>

                            <p className="li-footer-text">
                                Don't have an account?{' '}
                                <Link to="/signup" className="li-link">Sign Up</Link>
                            </p>

                            {/* Admin Login — subtle, sits inside the card at the bottom */}
                            <div className="li-admin-row">
                                <Link to="/admin-login" className="li-admin-link">
                                    🔒 Admin Login →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right — showcase */}
                    <div className="li-right">
                        <div className="li-right-inner">
                            <h1 className="li-headline">
                                <span className="li-hl-dark">Pick up where</span>
                                <span className="li-hl-purple">you left</span>
                                <span className="li-hl-green">off.</span>
                            </h1>

                            <p className="li-subtext">
                                Your coins, scores, and progress are waiting.
                                Log in and jump back into the action.
                            </p>

                            {/* Mini stat cards */}
                            <div className="li-stats-grid">
                                {[
                                    { icon: '🏆', val: 'Leaderboards', sub: 'See where you rank' },
                                    { icon: '🪙', val: 'Your Coins', sub: 'Earn more by winning' },
                                    { icon: '🎮', val: '10+ Games', sub: 'Always ready to play' },
                                    { icon: '⚡', val: 'Instant Access', sub: 'No waiting, just play' },
                                ].map((s, i) => (
                                    <div key={s.val} className="li-stat-card" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
                                        <span className="li-stat-icon">{s.icon}</span>
                                        <div>
                                            <div className="li-stat-val">{s.val}</div>
                                            <div className="li-stat-sub">{s.sub}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(22px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fieldIn {
                    from { opacity: 0; transform: translateX(-12px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes blobDrift {
                    0%   { transform: translate(0,0) scale(1); }
                    100% { transform: translate(40px,25px) scale(1.12); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.45); }
                    50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
                }
                @keyframes cardIn {
                    from { opacity: 0; transform: scale(0.94) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }

                .li-root {
                    min-height: 100vh;
                    background: #ffffff;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .li-canvas {
                    position: fixed; inset: 0;
                    pointer-events: none; z-index: 0;
                }

                .li-blob {
                    position: fixed; border-radius: 50%;
                    filter: blur(80px); pointer-events: none; z-index: 0;
                    animation: blobDrift 14s ease-in-out infinite alternate;
                }
                .li-blob-1 {
                    width: 400px; height: 400px;
                    background: radial-gradient(circle, rgba(142,68,173,0.12), transparent 70%);
                    top: -140px; left: -80px;
                }
                .li-blob-2 {
                    width: 300px; height: 300px;
                    background: radial-gradient(circle, rgba(34,197,94,0.09), transparent 70%);
                    bottom: -60px; right: -60px;
                    animation-delay: -5s;
                }
                .li-blob-3 {
                    width: 200px; height: 200px;
                    background: radial-gradient(circle, rgba(142,68,173,0.08), transparent 70%);
                    top: 50%; right: 30%;
                    animation-delay: -9s;
                }

                /* Nav */
                .li-nav {
                    position: relative; z-index: 10;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 1.2rem 3rem;
                    animation: fadeUp 0.4s ease both;
                }
                .li-nav-brand {
                    display: flex; align-items: center; gap: 0.6rem;
                    font-family: var(--font-ui); font-size: 1.2rem; font-weight: 800;
                    color: var(--text-primary); text-decoration: none;
                }
                .li-nav-brand img { height: 32px; width: auto; }
                .li-nav-arcade { color: var(--accent-primary); margin-left: 3px; }
                .li-nav-signup {
                    font-size: 0.88rem; color: var(--text-secondary);
                    text-decoration: none; font-weight: 500; transition: color 0.2s;
                }
                .li-nav-signup:hover { color: var(--text-primary); }
                .li-nav-signup-cta { color: var(--accent-primary); font-weight: 700; margin-left: 0.25rem; }

                /* Main */
                .li-main {
                    position: relative; z-index: 1; flex: 1;
                    display: grid; grid-template-columns: 1fr 1fr;
                    gap: 3rem; align-items: center;
                    padding: 2rem 3rem 3rem;
                    max-width: 1200px; margin: 0 auto; width: 100%;
                }

                /* Left — card */
                .li-left { animation: fadeUp 0.5s ease 0.1s both; }
                .li-card {
                    background: rgba(255,255,255,0.92);
                    border: 1px solid rgba(142,68,173,0.18);
                    border-radius: 24px;
                    padding: 2.5rem 2.2rem;
                    box-shadow: 0 20px 60px rgba(142,68,173,0.10), 0 4px 16px rgba(0,0,0,0.05);
                    backdrop-filter: blur(14px);
                    animation: cardIn 0.5s ease 0.1s both;
                }
                .li-card-top { text-align: center; margin-bottom: 2rem; }
                .li-logo { width: 56px; border-radius: 14px; margin-bottom: 1rem; }
                .li-card-title {
                    font-family: var(--font-ui); font-size: 1.6rem; font-weight: 900;
                    color: var(--text-primary); margin: 0 0 0.3rem; letter-spacing: -0.3px;
                }
                .li-card-sub { font-size: 0.88rem; color: var(--text-secondary); margin: 0; }

                /* Form */
                .li-form { display: flex; flex-direction: column; gap: 1.4rem; }
                .li-field {
                    position: relative;
                    animation: fieldIn 0.4s ease both;
                }
                .li-label {
                    display: flex; align-items: center; gap: 0.4rem;
                    font-size: 0.8rem; font-weight: 700;
                    color: var(--text-secondary);
                    text-transform: uppercase; letter-spacing: 0.06em;
                    margin-bottom: 0.5rem; font-family: var(--font-ui);
                    transition: color 0.2s;
                }
                .li-label-icon { font-size: 0.85rem; }
                .li-field--focused .li-label { color: #8e44ad; }
                .li-input {
                    width: 100%; padding: 0.85rem 1rem;
                    border-radius: 12px;
                    border: 1.5px solid rgba(142,68,173,0.18);
                    background: rgba(142,68,173,0.03);
                    color: var(--text-primary); font-family: inherit; font-size: 0.95rem;
                    outline: none; transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
                    box-sizing: border-box;
                }
                .li-input::placeholder { color: rgba(0,0,0,0.28); }
                .li-input:focus {
                    border-color: #8e44ad;
                    background: rgba(142,68,173,0.05);
                    box-shadow: 0 0 0 3px rgba(142,68,173,0.10);
                }

                .li-error {
                    display: flex; align-items: center; gap: 0.5rem;
                    background: rgba(239,68,68,0.07);
                    border: 1px solid rgba(239,68,68,0.22);
                    border-radius: 10px; padding: 0.7rem 1rem;
                    font-size: 0.85rem; color: #dc2626; font-weight: 500;
                }
                .li-hint {
                    display: flex; align-items: center; gap: 0.5rem;
                    background: rgba(142,68,173,0.05);
                    border: 1px solid rgba(142,68,173,0.15);
                    border-radius: 10px; padding: 0.65rem 1rem;
                    font-size: 0.82rem; color: var(--text-secondary);
                }
                .li-hint-icon { font-size: 0.9rem; }
                .li-hint strong { color: var(--text-primary); font-weight: 700; }

                .li-submit {
                    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                    background: linear-gradient(135deg, #8e44ad, #732d91);
                    color: white; border: none; padding: 1rem 2rem;
                    border-radius: 999px; font-weight: 700;
                    font-family: var(--font-ui); font-size: 0.95rem; letter-spacing: 0.02em;
                    cursor: pointer; margin-top: 0.4rem; width: 100%;
                    transition: all 0.3s;
                    box-shadow: 0 6px 20px rgba(142,68,173,0.28);
                }
                .li-submit:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 28px rgba(142,68,173,0.38);
                }
                .li-submit--loading { opacity: 0.85; cursor: not-allowed; }
                .li-submit-arrow { transition: transform 0.3s; }
                .li-submit:hover:not(:disabled) .li-submit-arrow { transform: translateX(4px); }
                .li-spinner {
                    width: 20px; height: 20px;
                    border: 2.5px solid rgba(255,255,255,0.35);
                    border-top-color: white; border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }

                .li-footer-text {
                    text-align: center; margin-top: 1.5rem;
                    font-size: 0.87rem; color: var(--text-secondary);
                }
                .li-link {
                    color: var(--accent-primary); font-weight: 700;
                    text-decoration: none; transition: opacity 0.2s;
                }
                .li-link:hover { opacity: 0.75; }

                /* Admin row at bottom of card */
                .li-admin-row {
                    margin-top: 1.25rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(0,0,0,0.06);
                    text-align: center;
                }
                .li-admin-link {
                    font-size: 0.78rem;
                    color: var(--text-secondary);
                    font-weight: 600;
                    text-decoration: none;
                    opacity: 0.6;
                    transition: opacity 0.2s, color 0.2s;
                }
                .li-admin-link:hover {
                    opacity: 1;
                    color: var(--accent-primary);
                }

                /* Right */
                .li-right { animation: fadeUp 0.5s ease 0.22s both; }
                .li-right-inner { display: flex; flex-direction: column; gap: 1.8rem; }

                .li-headline {
                    display: flex; flex-direction: column; gap: 0.05rem;
                    font-family: var(--font-ui);
                    font-size: clamp(2rem, 3.5vw, 3.2rem);
                    font-weight: 900; line-height: 1.1; letter-spacing: -0.5px;
                }
                .li-hl-dark  { color: var(--text-primary); }
                .li-hl-purple {
                    background: linear-gradient(135deg, #8e44ad, #732d91);
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .li-hl-green {
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .li-subtext {
                    font-size: 1rem; color: var(--text-secondary);
                    line-height: 1.7; max-width: 380px; font-weight: 300;
                }

                .li-stats-grid {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;
                }
                .li-stat-card {
                    display: flex; align-items: center; gap: 0.75rem;
                    background: rgba(255,255,255,0.85);
                    border: 1px solid rgba(142,68,173,0.14);
                    border-radius: 14px; padding: 0.9rem 1rem;
                    box-shadow: 0 4px 14px rgba(142,68,173,0.07);
                    backdrop-filter: blur(8px);
                    animation: cardIn 0.45s ease both;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .li-stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 22px rgba(142,68,173,0.13);
                }
                .li-stat-icon {
                    font-size: 1.4rem;
                    width: 38px; height: 38px;
                    background: rgba(142,68,173,0.07);
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .li-stat-val {
                    font-family: var(--font-ui); font-size: 0.85rem;
                    font-weight: 800; color: var(--text-primary);
                }
                .li-stat-sub {
                    font-size: 0.72rem; color: var(--text-secondary); font-weight: 400; margin-top: 0.1rem;
                }

                /* Responsive */
                @media (max-width: 900px) {
                    .li-main { grid-template-columns: 1fr; padding: 2rem 2rem 3rem; gap: 2.5rem; }
                    .li-right { display: none; }
                }
                @media (max-width: 640px) {
                    .li-nav { padding: 1rem 1.25rem; }
                    .li-main { padding: 1.5rem 1.25rem 2.5rem; }
                    .li-card { padding: 2rem 1.5rem; }
                }
            `}</style>
        </Layout>
    );
};

export default Login;